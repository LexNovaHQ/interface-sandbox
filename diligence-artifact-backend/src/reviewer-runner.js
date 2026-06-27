import { getRunRecord, updateRunRecord, logEvent } from "./firestore.js";
import { updateRunDashboardRow } from "./sheets.js";
import { getPhaseContract } from "./phase-contracts.js";
import { buildPhasePrompt } from "./prompt-loader.js";
import { callGeminiJson } from "./gemini-client.js";
import { buildAgent1aDedupedUrlManifest, buildAgent1bExtractArtifacts } from "./agent-1-scout-extractor.js";
import { buildM6SourceDiscoveryHandoff } from "./m6-bucket-router.js";
import { validateM9LegalCartographyIndex } from "./m9-validator.js";
import { validateM7TargetProfileOutput } from "./m7-validator.js";
import { validateM8TargetFeatureOutput } from "./m8-validator.js";
import { compileFinalOutputHandoff } from "./compiler.js";
import { buildRendererPayload } from "./report-renderer.js";
import {
  artifactSaveBody,
  buildReportUrl,
  lockPhase,
  readArtifactPayload,
  saveArtifact
} from "./artifact-service.js";

const MODEL_LOCK_STATUSES = new Set(["LOCKED", "LOCKED_WITH_LIMITATIONS", "REPAIR_REQUIRED", "CONTROLLED_FAILURE"]);
const TARGET_FEATURE_PHASES = new Set(["M7_TARGET_PROFILE", "M7_TARGET_PROFILE_FORENSICS", "M8_TARGET_FEATURE_PROFILE", "M8_TARGET_FEATURE_PROFILE_FORENSICS"]);
const ART = Object.freeze({
  legalIndex: "legal_cartography_index",
  targetMain: "target_" + "profile",
  targetForensics: "target_" + "profile_forensics",
  featureMain: "target_" + "feature_profile",
  featureForensics: "target_" + "feature_profile_forensics",
  final: "final_" + "output_handoff",
  renderer: "renderer_payload"
});
const CONTROLLED_MARKERS = Object.freeze(["FIELD_LIMITED", "FIELD_NOT_PUBLIC", "FIELD_CONFLICTED", "FIELD_NOT_FOUND", "LIMITATION", "LIMITED", "WARNING", "NOT_PUBLIC", "NOT_FOUND", "CONFLICT"]);

export async function advanceReviewerRun({ run_id }) {
  const run = await getRunRecord(run_id);

  if (run.current_phase === "COMPLETE" || run.status === "COMPLETE") {
    return { ok: true, run_id, status: "COMPLETE", current_phase: "COMPLETE", advanced: false };
  }

  const phase = normalizePhase(run.current_phase);
  const contract = getPhaseContract(phase);

  await markRunning(run_id, phase, contract.agent_id || contract.actor_id);

  try {
    if (contract.type === "model") {
      await runModelPhase({ run, phase, contract });
    } else if (phase === "AGENT_1A_URL_MANIFEST") {
      await runAgent1aUrlManifestPhase({ run, phase, contract });
    } else if (phase === "AGENT_1B_EXTRACT") {
      await runAgent1bExtractPhase({ run, phase, contract });
    } else if (phase === "M6_BUCKET_INDEX") {
      await runM6BucketIndexPhase({ run, phase, contract });
    } else if (phase === "COMPILER") {
      await runCompilerPhase({ run, phase, contract });
    } else if (phase === "RENDERER") {
      await runRendererPhase({ run, phase, contract });
    } else {
      throw new Error(`UNKNOWN_PHASE_TYPE:${phase}:${contract.type}`);
    }
  } catch (error) {
    await markPhaseFailure({ run_id, phase, actor: contract.agent_id || contract.actor_id, error });
    throw error;
  }

  const updated = await getRunRecord(run_id);
  return {
    ok: true,
    run_id,
    advanced: true,
    completed_phase: phase,
    status: updated.status,
    current_phase: updated.current_phase,
    final_report_url: updated.final_report_url || ""
  };
}

function normalizePhase(value) {
  if (!value || value === "URL_MANIFEST" || value === "M6" || value === "AGENT_1_SCOUT_EXTRACT") return "AGENT_1A_URL_MANIFEST";
  return value;
}

async function runAgent1aUrlManifestPhase({ run, phase, contract }) {
  const output = await buildAgent1aDedupedUrlManifest({ run });
  await saveDeterministicArtifacts({ run, phase, actor: contract.actor_id, writes: contract.writes, output });
  await lockPhase({ run_id: run.run_id, phase, agent_id: contract.actor_id, status: "LOCKED", next_phase: contract.next });
}

async function runAgent1bExtractPhase({ run, phase, contract }) {
  const dedupedManifest = await readArtifactPayload({ run_id: run.run_id, artifact_name: "deduped_url_manifest", agent_id: contract.actor_id });
  const output = await buildAgent1bExtractArtifacts({ run, deduped_url_manifest: dedupedManifest });
  await saveDeterministicArtifacts({ run, phase, actor: contract.actor_id, writes: contract.writes, output });
  await lockPhase({ run_id: run.run_id, phase, agent_id: contract.actor_id, status: "LOCKED", next_phase: contract.next });
}

async function runM6BucketIndexPhase({ run, phase, contract }) {
  const artifacts = await readArtifactsForPhase({ run_id: run.run_id, reads: contract.reads, agent_id: contract.actor_id });
  const output = buildM6SourceDiscoveryHandoff({ run, artifacts });
  await saveDeterministicArtifacts({ run, phase, actor: contract.actor_id, writes: contract.writes, output });
  await lockPhase({ run_id: run.run_id, phase, agent_id: contract.actor_id, status: output.source_discovery_handoff.status || "LOCKED", next_phase: contract.next });
}

async function saveDeterministicArtifacts({ run, phase, actor, writes, output }) {
  for (const artifactName of writes) {
    const artifact = output?.[artifactName];
    if (!artifact || typeof artifact !== "object") throw new Error(`DETERMINISTIC_OUTPUT_MISSING_ARTIFACT:${phase}:${artifactName}`);
    await saveArtifact(artifactSaveBody({ run_id: run.run_id, phase, agent_id: actor, artifact_name: artifactName, artifact, lock_status: "LOCKED" }));
  }

  await logEvent({ run_id: run.run_id, event_type: "DETERMINISTIC_PHASE_COMPLETED", actor, payload: { phase, writes } });
}

async function runModelPhase({ run, phase, contract }) {
  const artifacts = await readArtifactsForPhase({ run_id: run.run_id, reads: contract.reads, agent_id: contract.agent_id });
  const prompt = await buildPhasePrompt({ prompt_file: contract.prompt_file, prompt_files: contract.prompt_files, phase, run, artifacts, writes: contract.writes, references: contract.references || [] });
  const result = await callGeminiJson({ prompt, phase });
  const output = result.json;

  validateModelOutput({ phase, output });
  const phaseLockStatus = resolveModelLockStatus({ phase, output, writes: contract.writes });

  for (const artifactName of contract.writes) {
    const artifact = output?.[artifactName];
    if (!artifact || typeof artifact !== "object") throw new Error(`MODEL_OUTPUT_MISSING_ARTIFACT:${phase}:${artifactName}`);
    await saveArtifact(artifactSaveBody({ run_id: run.run_id, phase, agent_id: contract.agent_id, artifact_name: artifactName, artifact, lock_status: phaseLockStatus }));
  }

  await logEvent({
    run_id: run.run_id,
    event_type: TARGET_FEATURE_PHASES.has(phase) ? "AGENT3_MODULE_COMPLETED" : "MODEL_PHASE_COMPLETED",
    actor: contract.agent_id,
    payload: { phase, writes: contract.writes, lock_status: phaseLockStatus, reference_files: contract.references || [], prompt_files: contract.prompt_files || [contract.prompt_file], model_metadata: result.metadata }
  });

  await lockPhase({ run_id: run.run_id, phase, agent_id: contract.agent_id, status: phaseLockStatus, next_phase: ["LOCKED", "LOCKED_WITH_LIMITATIONS"].includes(phaseLockStatus) ? contract.next : phase });
}

function validateModelOutput({ phase, output }) {
  if (phase === "M9") {
    const validation = validateM9LegalCartographyIndex(output);
    if (validation.status !== "PASS") throw new Error(`M9_VALIDATION_FAILED:${JSON.stringify(validation)}`);
    return;
  }
  if (phase === "M7_TARGET_PROFILE" || phase === "M7_TARGET_PROFILE_FORENSICS") {
    validateM7TargetProfileOutput(output, { phase });
    return;
  }
  if (phase === "M8_TARGET_FEATURE_PROFILE" || phase === "M8_TARGET_FEATURE_PROFILE_FORENSICS") {
    validateM8TargetFeatureOutput(output, { phase });
  }
}

function resolveModelLockStatus({ phase, output, writes }) {
  if (phase === "M9") {
    const status = output?.legal_cartography_index?.lock_status;
    return MODEL_LOCK_STATUSES.has(status) ? status : "REPAIR_REQUIRED";
  }
  if (phase === "M7_TARGET_PROFILE") return resolveStatusFromArtifacts(output?.[ART.targetMain]);
  if (phase === "M7_TARGET_PROFILE_FORENSICS") return resolveStatusFromArtifacts(output?.[ART.targetForensics]);
  if (phase === "M8_TARGET_FEATURE_PROFILE") return resolveStatusFromArtifacts(output?.[ART.featureMain]);
  if (phase === "M8_TARGET_FEATURE_PROFILE_FORENSICS") return resolveStatusFromArtifacts(output?.[ART.featureForensics]);
  const firstArtifact = output?.[writes?.[0]];
  const status = firstArtifact?.lock_status || firstArtifact?.validation_status;
  return MODEL_LOCK_STATUSES.has(status) ? status : "LOCKED";
}

function resolveStatusFromArtifacts(...artifacts) {
  for (const artifact of artifacts) {
    const status = artifact?.lock_status || artifact?.validation_status || artifact?.status;
    if (MODEL_LOCK_STATUSES.has(status)) return status;
    if (hasControlledLimitationSignal(artifact)) return "LOCKED_WITH_LIMITATIONS";
  }
  return "LOCKED";
}

function hasControlledLimitationSignal(value) {
  if (!value) return false;
  if (Array.isArray(value)) return value.length > 0 && value.some((item) => hasControlledLimitationSignal(item));
  if (typeof value === "string") {
    const upper = value.toUpperCase();
    return CONTROLLED_MARKERS.some((marker) => upper.includes(marker));
  }
  if (typeof value !== "object") return false;
  if (Array.isArray(value.target_profile_limitations) && value.target_profile_limitations.length) return true;
  if (Array.isArray(value.profile_level_limitations) && value.profile_level_limitations.length) return true;
  if (Array.isArray(value.limitation_ledger) && value.limitation_ledger.length) return true;
  if (Array.isArray(value.activity_limitations_ledger) && value.activity_limitations_ledger.length) return true;
  if (Array.isArray(value.targeted_re_extraction_ledger) && value.targeted_re_extraction_ledger.some((row) => hasControlledLimitationSignal(row))) return true;
  if (value.validation_quality_control_result && hasControlledLimitationSignal(value.validation_quality_control_result)) return true;
  return Object.values(value).some((item) => hasControlledLimitationSignal(item));
}

async function runCompilerPhase({ run, phase, contract }) {
  const artifacts = await readArtifactsForPhase({ run_id: run.run_id, reads: contract.reads, agent_id: contract.actor_id });
  const output = compileFinalOutputHandoff({ run, artifacts });
  await saveArtifact(artifactSaveBody({ run_id: run.run_id, phase, agent_id: contract.actor_id, artifact_name: ART.final, artifact: output[ART.final], lock_status: output[ART.final].validation_status === "LOCKED" ? "LOCKED" : "CONTROLLED_FAILURE" }));
  await lockPhase({ run_id: run.run_id, phase, agent_id: contract.actor_id, status: output[ART.final].validation_status === "LOCKED" ? "LOCKED" : "CONTROLLED_FAILURE", next_phase: contract.next });
}

async function runRendererPhase({ run, phase, contract }) {
  const finalOutput = await readArtifactPayload({ run_id: run.run_id, artifact_name: ART.final, agent_id: contract.actor_id });
  const output = buildRendererPayload({ run, [ART.final]: finalOutput });
  await saveArtifact(artifactSaveBody({ run_id: run.run_id, phase, agent_id: contract.actor_id, artifact_name: ART.renderer, artifact: output[ART.renderer], lock_status: "COMPLETE" }));
  const finalReportUrl = buildReportUrl(run.run_id);
  await lockPhase({ run_id: run.run_id, phase, agent_id: contract.actor_id, status: "COMPLETE", next_phase: contract.next, final_report_url: finalReportUrl });
}

async function readArtifactsForPhase({ run_id, reads, agent_id }) {
  const artifacts = {};
  for (const artifactName of reads) artifacts[artifactName] = await readArtifactPayload({ run_id, artifact_name: artifactName, agent_id });
  return artifacts;
}

async function markRunning(runId, phase, actor) {
  const updated = await updateRunRecord(runId, { current_phase: phase, status: "RUNNING" });
  await updateRunDashboardRow(updated);
  await logEvent({ run_id: runId, event_type: "PHASE_RUNNING", actor, payload: { phase } });
}

async function markPhaseFailure({ run_id, phase, actor, error }) {
  const updated = await updateRunRecord(run_id, { current_phase: phase, status: "REPAIR_REQUIRED" });
  await updateRunDashboardRow(updated);
  await logEvent({ run_id, event_type: "PHASE_REPAIR_REQUIRED", actor, payload: { phase, error_message: error?.message || String(error) } });
}
