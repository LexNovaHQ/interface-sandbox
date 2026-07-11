// Compatibility bridge only. Artifact persistence and gates are central runtime services.
export {
  saveRuntimeArtifact as saveArtifact,
  readRuntimeArtifact as readArtifact,
  readRuntimeArtifactPayload as readArtifactPayload,
  lockRuntimePhase as lockPhase,
  listRuntimeArtifacts as listArtifacts,
  assertCentralPhaseArtifactsExist as assertRequiredArtifactsExist,
  ARTIFACTS_SERVICE_STATUS
} from "./runtime/services/artifacts.service.js";

export function artifactSaveBody({ run_id, phase, agent_id, artifact_name, artifact, lock_status = "LOCKED" }) {
  return { run_id, phase, agent_id, artifact_name, artifact, lock_status };
}

export function buildReportUrl(runId) {
  return `/interface-diligence/diligence-system/report.html?run_id=${encodeURIComponent(runId)}`;
}
