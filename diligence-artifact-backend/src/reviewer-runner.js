import { getRunRecord, updateRunRecord, logEvent } from "./firestore.js";
import { updateRunDashboardRow } from "./sheets.js";
import { getPhaseContract } from "./phase-contracts.js";
import { buildPhasePrompt } from "./prompt-loader.js";
import { callGeminiJson } from "./gemini-client.js";
import { buildAgent1aDedupedUrlManifest, buildAgent1bExtractArtifacts } from "./agent-1-scout-extractor.js";
import { buildM6SourceDiscoveryHandoff } from "./m6-bucket-router.js";
import { validateM9LegalCartographyIndex } from "./m9-validator.js";
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

export async function advanceReviewerRun({ run_id }) {
  const run = await getRunRecord(run_id);

  if (run.current_phase === "COMPLETE" || run.status === "COMPLETE") {
    return { ok: true, run_id, status: "COMPLETE", current_phase: "COMPLETE", advanced: false };
  }

  const phase = normalizePhase(run.current_phase);
  const contract = getPhaseContract(phase);

  await markRunning(run_id, phase, contract.agent_id || contract.actor_id);

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
    throw new Error(`UNKNOWN_DETERMINISTIC_PHASE:${phase}`);
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
    phase,
    run,
    artifacts,
    writes: contract.writes
  });

  const result = await callGeminiJson({ prompt, phase });
  const output = result.json;

  validateModelOutput({ phase, output });
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
    event_type: "MODEL_PHASE_COMPLETED",
    actor: contract.agent_id,
    payload: {
      phase,
      writes: contract.writes,
      lock_status: phaseLockStatus,
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

function validateModelOutput({ phase, output }) {
  if (phase !== "M9") return;
  const validation = validateM9LegalCartographyIndex(output);
  if (validation.status !== "PASS") {
    throw new Error(`M9_VALIDATION_FAILED:${JSON.stringify(validation)}`);
  }
}

function resolveModelLockStatus({ phase, output, writes }) {
  if (phase === "M9") {
    const status = output?.legal_cartography_index?.lock_status;
    return MODEL_LOCK_STATUSES.has(status) ? status : "REPAIR_REQUIRED";
  }
  const firstArtifact = output?.[writes?.[0]];
  const status = firstArtifact?.lock_status || firstArtifact?.validation_status;
  return MODEL_LOCK_STATUSES.has(status) ? status : "LOCKED";
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
