import { getNextArtifactVersion, saveArtifactMetadata, logEvent, updateRunRecord } from "./firestore.js";
import { updateRunDashboardRow } from "./sheets.js";
import { saveJsonArtifactToDrive } from "./drive.js";
import { readArtifactPayload } from "./artifact-service.js";
import { readPhaseArtifactWithResolvedLosslessFamilies } from "./lossless-family-resolver.js";
import { buildExtendedDapIndiaReadinessProfile } from "./extended-dap-india-readiness.js";

const ARTIFACT_NAME = "extended_dap_india_readiness_profile";
const ACTOR = "agent_4b_extended_dap";

export async function runAgent4bExtendedDapPhase({ run, phase, contract }) {
  try {
    const artifacts = await readInputs({ run_id: run.run_id, reads: contract.reads || [] });
    const output = buildExtendedDapIndiaReadinessProfile({ run, artifacts });
    const artifact = output?.[ARTIFACT_NAME];
    if (!artifact || typeof artifact !== "object") throw new Error(`AGENT4B_OUTPUT_MISSING:${ARTIFACT_NAME}`);
    const status = artifact.lock_status === "LOCKED" || artifact.status === "LOCKED" ? "LOCKED" : "LOCKED_WITH_LIMITATIONS";
    await saveDirect({ run, phase, artifact, status });
    await logEvent({ run_id: run.run_id, event_type: "AGENT4B_EXTENDED_DAP_COMPLETED", actor: ACTOR, payload: { phase, artifact_name: ARTIFACT_NAME, lock_status: status, field_count: artifact.field_count, model_usage: "NONE_DETERMINISTIC" } });
    return advanceRun({ run, phase, status, next_phase: contract.next, reason: "completed" });
  } catch (error) {
    await logEvent({ run_id: run.run_id, event_type: "AGENT4B_EXTENDED_DAP_NONBLOCKING_FAILURE", actor: ACTOR, payload: { phase, artifact_name: ARTIFACT_NAME, error_message: error?.message || String(error) } });
    return advanceRun({ run, phase, status: "LOCKED_WITH_LIMITATIONS", next_phase: contract.next, reason: "nonblocking_failure" });
  }
}

export async function buildAgent4bSidecarNonblocking({ run, dataForensicsArtifact }) {
  try {
    const artifacts = await readInputs({ run_id: run.run_id, reads: ["source_discovery_handoff", "legal_cartography_index", "target_profile", "target_profile_forensics", "target_feature_profile", "target_feature_profile_forensics", "data_provenance_profile"] });
    artifacts.data_provenance_profile_forensics = dataForensicsArtifact;
    const output = buildExtendedDapIndiaReadinessProfile({ run, artifacts });
    const artifact = output?.[ARTIFACT_NAME];
    if (!artifact || typeof artifact !== "object") throw new Error(`AGENT4B_OUTPUT_MISSING:${ARTIFACT_NAME}`);
    const status = artifact.lock_status === "LOCKED" || artifact.status === "LOCKED" ? "LOCKED" : "LOCKED_WITH_LIMITATIONS";
    await saveDirect({ run, phase: "AGENT_4B_EXTENDED_DAP_INDIA_READINESS", artifact, status });
    await logEvent({ run_id: run.run_id, event_type: "AGENT4B_EXTENDED_DAP_COMPLETED", actor: ACTOR, payload: { artifact_name: ARTIFACT_NAME, lock_status: status, field_count: artifact.field_count, model_usage: "NONE_DETERMINISTIC", mode: "sidecar_nonblocking" } });
  } catch (error) {
    await logEvent({ run_id: run.run_id, event_type: "AGENT4B_EXTENDED_DAP_NONBLOCKING_FAILURE", actor: ACTOR, payload: { artifact_name: ARTIFACT_NAME, error_message: error?.message || String(error) } });
  }
}

async function saveDirect({ run, phase, artifact, status }) {
  const version = await getNextArtifactVersion(run.run_id, ARTIFACT_NAME);
  const driveResult = await saveJsonArtifactToDrive({ run_id: run.run_id, artifact_name: ARTIFACT_NAME, version, drive_folder_id: run.drive_folder_id, artifact });
  await saveArtifactMetadata({ run_id: run.run_id, artifact_name: ARTIFACT_NAME, phase, agent_id: ACTOR, lock_status: status, version, drive_file_id: driveResult.drive_file_id, drive_web_view_link: driveResult.drive_web_view_link, drive_folder_id: run.drive_folder_id, artifact_size_bytes: driveResult.artifact_size_bytes });
}
async function advanceRun({ run, phase, status, next_phase, reason }) {
  const updated = await updateRunRecord(run.run_id, { current_phase: next_phase, status });
  await updateRunDashboardRow(updated);
  await logEvent({ run_id: run.run_id, event_type: "PHASE_LOCKED", actor: ACTOR, payload: { phase, status, next_phase, reason } });
}
async function readInputs({ run_id, reads }) {
  const artifacts = {};
  const cache = {};
  for (const artifactName of reads) {
    try {
      artifacts[artifactName] = artifactName.startsWith("lossless_family__")
        ? await readPhaseArtifactWithResolvedLosslessFamilies({ run_id, artifact_name: artifactName, agent_id: "operator", cache })
        : await readArtifactPayload({ run_id, artifact_name: artifactName, agent_id: "operator" });
      if (artifactName === "source_family_index") cache.source_family_index = artifacts[artifactName];
    } catch (_error) {
      artifacts[artifactName] = null;
    }
  }
  return artifacts;
}
