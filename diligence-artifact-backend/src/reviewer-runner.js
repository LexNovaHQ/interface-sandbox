import { getRunRecord, updateRunRecord, logEvent } from "./firestore.js";
import { updateRunDashboardRow } from "./sheets.js";
import { getPhaseContract } from "./phase-contracts.js";
import { buildPhasePrompt } from "./prompt-loader.js";
import { callGeminiJson } from "./gemini-client.js";
import { buildAgent1aDedupedUrlManifest, buildAgent1bExtractArtifacts } from "./agent-1-scout-extractor.js";
import { buildM6SourceDiscoveryHandoff } from "./m6-bucket-router.js";
import { validateM9LegalCartographyIndex } from "./m9-validator.js";
import { validateM7M8TargetFeatureOutput, resolveM7M8LockStatus } from "./m7-m8-validator.js";
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
const TARGET_FEATURE_PHASES = new Set(["M7_TARGET_PROFILE", "M8_TARGET_FEATURE_PROFILE"]);

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
    } else if (contract.type === "sequence_alias") {
      await lockPhase({ run_id, phase, agent_id: contract.agent_id, status: "LOCKED", next_phase: contract.next });
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
  if (value === "M7_M8") return "M7_TARGET_PROFILE";
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
    if (!artifact || typeof artifact !== "object") {
      throw new Error(`DETERMINISTIC_OUTPUT_MISSING_ARTIFACT:${phase}:${artifactName}`);
    }
    await saveArtifact(artifactSaveBody({
      run_id: run.run_id,
      phase,
      agent_id: actor,
      artifact_name: artifactName,
      artifact,
      lock_status: "LOCKED"
    }));
  }

  await logEvent({
    run_id: run.run_id,
    event_type: "DETERMINISTIC_PHASE_COMPLETED",
    actor,
    payload: { phase, writes }
  });
}

async function runModelPhase({ run, phase, contract }) {
  const artifacts = await readArtifactsForPhase({ run_id: run.run_id, reads: contract.reads, agent_id: contract.agent_id });
  const prompt = await buildPhasePrompt({
    prompt_file: contract.prompt_file,
    prompt_files: contract.prompt_files,
    phase,
    run,
    artifacts,
    writes: contract.writes,
    references: contract.references || []
  });

  const result = await callGeminiJson({ prompt, phase });
  const output = result.json;

  validateModelOutput({ phase, output, artifacts });
  const phaseLockStatus = resolveModelLockStatus({ phase, output, writes: contract.writes });

  for (const artifactName of contract.writes) {
    const artifact = output?.[artifactName];
    if (!artifact || typeof artifact !== "object") {
      throw new Error(`MODEL_OUTPUT_MISSING_ARTIFACT:${phase}:${artifactName}`);
    }

    await saveArtifact(artifactSaveBody({
      run_id: run.run_id,
      phase,
      agent_id: contract.agent_id,
      artifact_name: artifactName,
      artifact,
      lock_status: phaseLockStatus
    }));
  }

  await logEvent({
    run_id: run.run_id,
    event_type: TARGET_FEATURE_PHASES.has(phase) ? "AGENT3_MODULE_COMPLETED" : "MODEL_PHASE_COMPLETED",
    actor: contract.agent_id,
    payload: {
      phase,
      writes: contract.writes,
      lock_status: phaseLockStatus,
      reference_files: contract.references || [],
      prompt_files: contract.prompt_files || [contract.prompt_file],
      model_metadata: result.metadata
    }
  });

  await lockPhase({
    run_id: run.run_id,
    phase,
    agent_id: contract.agent_id,
    status: phaseLockStatus,
    next_phase: ["LOCKED", "LOCKED_WITH_LIMITATIONS"].includes(phaseLockStatus) ? contract.next : phase
  });
}

function validateModelOutput({ phase, output, artifacts }) {
  if (phase === "M9") {
    const validation = validateM9LegalCartographyIndex(output);
    if (validation.status !== "PASS") {
      throw new Error(`M9_VALIDATION_FAILED:${JSON.stringify(validation)}`);
    }
    return;
  }

  if (phase === "M7_TARGET_PROFILE") {
    validateM7TargetProfileOutput(output);
    return;
  }

  if (phase === "M8_TARGET_FEATURE_PROFILE") {
    validateM8TargetFeatureOutput(output);
    return;
  }

  if (phase === "M7_M8") {
    const validation = validateM7M8TargetFeatureOutput(output, { artifacts });
    if (validation.status !== "PASS") {
      throw new Error(`M7_M8_VALIDATION_FAILED:${JSON.stringify(validation)}`);
    }
  }
}

function validateM7TargetProfileOutput(output) {
  validateExactTopLevelKeys(output, ["target_profile", "target_profile_forensics"], "M7_TARGET_PROFILE");
  if (!isPlainObject(output.target_profile)) throw new Error("M7_OUTPUT_INVALID:target_profile must be object");
  if (!isPlainObject(output.target_profile_forensics)) throw new Error("M7_OUTPUT_INVALID:target_profile_forensics must be object");
  if (containsAnyKey(output.target_profile, ["target_profile_forensics", "source_ledger", "field_derivation_ledger", "runtime_trace", "validation_status", "lock_status"])) {
    throw new Error("M7_OUTPUT_INVALID:target_profile contains forensic or status branches");
  }
  const required = ["target_identity", "jurisdiction_notice", "business_context", "product_service_wrapper", "target_profile_limitations"];
  for (const key of required) {
    if (!(key in output.target_profile)) throw new Error(`M7_OUTPUT_MISSING_FIELD:${key}`);
  }
}

function validateM8TargetFeatureOutput(output) {
  validateExactTopLevelKeys(output, ["target_feature_profile", "target_feature_profile_forensics"], "M8_TARGET_FEATURE_PROFILE");
  if (!isPlainObject(output.target_feature_profile)) throw new Error("M8_OUTPUT_INVALID:target_feature_profile must be object");
  if (!isPlainObject(output.target_feature_profile_forensics)) throw new Error("M8_OUTPUT_INVALID:target_feature_profile_forensics must be object");
  if (containsAnyKey(output.target_feature_profile, ["target_feature_profile_forensics", "source_ledger", "archetype_derivation_ledger", "surface_token_derivation_ledger", "runtime_trace", "validation_status", "lock_status"])) {
    throw new Error("M8_OUTPUT_INVALID:target_feature_profile contains forensic or status branches");
  }
  if (!Array.isArray(output.target_feature_profile.activities)) throw new Error("M8_OUTPUT_MISSING_FIELD:activities");
  if (!("profile_level_limitations" in output.target_feature_profile)) throw new Error("M8_OUTPUT_MISSING_FIELD:profile_level_limitations");
}

function validateExactTopLevelKeys(output, expected, phase) {
  if (!isPlainObject(output)) throw new Error(`${phase}_OUTPUT_INVALID:not_object`);
  const keys = Object.keys(output).sort();
  const wanted = [...expected].sort();
  const missing = wanted.filter((key) => !keys.includes(key));
  const extra = keys.filter((key) => !wanted.includes(key));
  if (missing.length || extra.length) {
    throw new Error(`${phase}_OUTPUT_KEYS_INVALID:${JSON.stringify({ missing, extra })}`);
  }
}

function resolveModelLockStatus({ phase, output, writes }) {
  if (phase === "M9") {
    const status = output?.legal_cartography_index?.lock_status;
    return MODEL_LOCK_STATUSES.has(status) ? status : "REPAIR_REQUIRED";
  }
  if (phase === "M7_M8") {
    return resolveM7M8LockStatus(output);
  }
  if (phase === "M7_TARGET_PROFILE") {
    return resolveStatusFromArtifacts(output?.target_profile_forensics, output?.target_profile);
  }
  if (phase === "M8_TARGET_FEATURE_PROFILE") {
    return resolveStatusFromArtifacts(output?.target_feature_profile_forensics, output?.target_feature_profile);
  }
  const firstArtifact = output?.[writes?.[0]];
  const status = firstArtifact?.lock_status || firstArtifact?.validation_status;
  return MODEL_LOCK_STATUSES.has(status) ? status : "LOCKED";
}

function resolveStatusFromArtifacts(...artifacts) {
  for (const artifact of artifacts) {
    const status = artifact?.lock_status || artifact?.validation_status || artifact?.status;
    if (MODEL_LOCK_STATUSES.has(status)) return status;
  }
  return "LOCKED";
}

async function runCompilerPhase({ run, phase, contract }) {
  const artifacts = await readArtifactsForPhase({ run_id: run.run_id, reads: contract.reads, agent_id: contract.actor_id });
  const output = compileFinalOutputHandoff({ run, artifacts });

  await saveArtifact(artifactSaveBody({
    run_id: run.run_id,
    phase,
    agent_id: contract.actor_id,
    artifact_name: "final_output_handoff",
    artifact: output.final_output_handoff,
    lock_status: output.final_output_handoff.validation_status === "LOCKED" ? "LOCKED" : "CONTROLLED_FAILURE"
  }));

  await lockPhase({
    run_id: run.run_id,
    phase,
    agent_id: contract.actor_id,
    status: output.final_output_handoff.validation_status === "LOCKED" ? "LOCKED" : "CONTROLLED_FAILURE",
    next_phase: contract.next
  });
}

async function runRendererPhase({ run, phase, contract }) {
  const finalOutput = await readArtifactPayload({
    run_id: run.run_id,
    artifact_name: "final_output_handoff",
    agent_id: contract.actor_id
  });

  const output = buildRendererPayload({ run, final_output_handoff: finalOutput });
  await saveArtifact(artifactSaveBody({
    run_id: run.run_id,
    phase,
    agent_id: contract.actor_id,
    artifact_name: "renderer_payload",
    artifact: output.renderer_payload,
    lock_status: "COMPLETE"
  }));

  const finalReportUrl = buildReportUrl(run.run_id);
  await lockPhase({
    run_id: run.run_id,
    phase,
    agent_id: contract.actor_id,
    status: "COMPLETE",
    next_phase: contract.next,
    final_report_url: finalReportUrl
  });
}

async function readArtifactsForPhase({ run_id, reads, agent_id }) {
  const artifacts = {};
  for (const artifactName of reads) {
    artifacts[artifactName] = await readArtifactPayload({ run_id, artifact_name: artifactName, agent_id });
  }
  return artifacts;
}

async function markRunning(runId, phase, actor) {
  const updated = await updateRunRecord(runId, { current_phase: phase, status: "RUNNING" });
  await updateRunDashboardRow(updated);
  await logEvent({
    run_id: runId,
    event_type: "PHASE_RUNNING",
    actor,
    payload: { phase }
  });
}

async function markPhaseFailure({ run_id, phase, actor, error }) {
  const updated = await updateRunRecord(run_id, { current_phase: phase, status: "REPAIR_REQUIRED" });
  await updateRunDashboardRow(updated);
  await logEvent({
    run_id,
    event_type: "PHASE_REPAIR_REQUIRED",
    actor,
    payload: {
      phase,
      error_message: error?.message || String(error)
    }
  });
}

function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function containsAnyKey(value, keys) {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some((item) => containsAnyKey(item, keys));
  return Object.keys(value).some((key) => keys.includes(key)) || Object.values(value).some((item) => containsAnyKey(item, keys));
}
