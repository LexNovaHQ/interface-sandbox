import { artifactSaveBody, lockPhase, readArtifactPayload, saveArtifact } from "./artifact-service.js";
import { buildPhase7SemanticBatchQualityGate, validatePhase7SemanticBatchQualityGate } from "./phases/07-data-provenance-profile/layer5-semantic-batch-quality-gate-builder.js";

const AGENT_4 = "agent_4_data_privacy";
const ROUTE_MANIFEST = "dap_semantic_batch_route_manifest";
const VALIDATION_PREFIX = "dap_semantic_batch_validation__";
const MANIFEST_ARTIFACT = "dap_semantic_batch_validation_manifest";
const GATE_ARTIFACT = "data_provenance_profile_semantic_batch_gate";

export async function runPhase7Layer5SemanticBatchQualityGatePhase({ run, phase, contract }) {
  const routeManifest = await readArtifactPayload({ run_id: run.run_id, artifact_name: ROUTE_MANIFEST, agent_id: contract.agent_id || AGENT_4 });
  const routePackets = routeManifest?.batch_route_packets || [];
  const batchArtifacts = {};
  const batchValidations = {};
  for (const packet of routePackets) {
    batchArtifacts[packet.expected_artifact_name] = await readOptionalArtifactPayload({ run_id: run.run_id, artifact_name: packet.expected_artifact_name, agent_id: contract.agent_id || AGENT_4 });
    const validationName = `${VALIDATION_PREFIX}${packet.batch_id}`;
    batchValidations[validationName] = await readOptionalArtifactPayload({ run_id: run.run_id, artifact_name: validationName, agent_id: contract.agent_id || AGENT_4 });
  }

  const output = buildPhase7SemanticBatchQualityGate({ routeManifest, batchArtifacts, batchValidations });
  const validation = validatePhase7SemanticBatchQualityGate(output);
  const baseManifest = output[MANIFEST_ARTIFACT];
  const baseGate = output[GATE_ARTIFACT];
  const validationLimited = validation.status !== "PASS";
  const manifest = validationLimited ? {
    ...baseManifest,
    validation_quality_control_result: {
      ...baseManifest.validation_quality_control_result,
      validator_errors: validation.errors || [],
      non_blocking_repair_required: true,
      blocking_failure: false,
      status: "LOCKED_WITH_LIMITATIONS"
    }
  } : baseManifest;
  const gate = validationLimited ? {
    ...baseGate,
    status: "LOCKED_WITH_LIMITATIONS",
    non_blocking_repair_required: true,
    blocking_failure: false,
    validator_errors: validation.errors || []
  } : baseGate;
  const phaseLockStatus = gate?.status === "PASS" ? "LOCKED" : "LOCKED_WITH_LIMITATIONS";

  await saveArtifact(artifactSaveBody({ run_id: run.run_id, phase, agent_id: contract.agent_id || AGENT_4, artifact_name: MANIFEST_ARTIFACT, artifact: manifest, lock_status: phaseLockStatus }));
  await saveArtifact(artifactSaveBody({ run_id: run.run_id, phase, agent_id: contract.agent_id || AGENT_4, artifact_name: GATE_ARTIFACT, artifact: gate, lock_status: phaseLockStatus }));
  return lockPhase({ run_id: run.run_id, phase, agent_id: contract.agent_id || AGENT_4, status: phaseLockStatus, next_phase: contract.next });
}

async function readOptionalArtifactPayload({ run_id, artifact_name, agent_id }) {
  try { return await readArtifactPayload({ run_id, artifact_name, agent_id }); } catch (_error) { return null; }
}
