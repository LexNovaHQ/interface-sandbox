import { readArtifact, readArtifactPayload, saveArtifact, lockPhase, listArtifacts, assertRequiredArtifactsExist } from "../../artifact-service.js";
import { artifactsForCentralPhase } from "../contracts/artifacts.contract.js";

export async function saveRuntimeArtifact(input) {
  return saveArtifact(input);
}

export async function readRuntimeArtifact(input) {
  return readArtifact(input);
}

export async function readRuntimeArtifactPayload(input) {
  return readArtifactPayload(input);
}

export async function lockRuntimePhase(input) {
  return lockPhase(input);
}

export async function listRuntimeArtifacts(runId) {
  return listArtifacts(runId);
}

export async function assertCentralPhaseArtifactsExist(runId, centralPhaseId) {
  return assertRequiredArtifactsExist(runId, artifactsForCentralPhase(centralPhaseId));
}

export const ARTIFACTS_SERVICE_STATUS = Object.freeze({
  central_runtime_service: "artifacts.service",
  migration_status: "bridge_to_existing_artifact_service",
  old_artifact_service_untouched: true
});
