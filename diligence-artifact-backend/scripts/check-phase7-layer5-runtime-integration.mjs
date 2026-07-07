import assert from "node:assert/strict";
import { PHASES, PHASE7_DAP_LAYER5_ARTIFACT_NAMES, WRITE_PERMISSIONS, PHASE_WRITE_PERMISSIONS, artifactMatchesPermission, isKnownArtifactName } from "../src/constants.js";
import { getPhaseContract } from "../src/phase-contracts.js";
import { runPhase7Layer5SemanticBatchQualityGatePhase } from "../src/phase7-layer5-semantic-batch-quality-gate-runner.js";
import { advanceReviewerRun } from "../src/reviewer-runner-normalized.js";

const phase = "DATA_PROVENANCE_PROFILE_LAYER5";
const layer4 = getPhaseContract("DATA_PROVENANCE_PROFILE_LAYER4");
const layer5 = getPhaseContract(phase);

assert.ok(PHASES.includes(phase));
assert.equal(layer4.next, phase);
assert.equal(layer5.type, "phase7_layer5_deterministic_gate");
assert.equal(layer5.agent_id, "agent_4_data_privacy");
assert.equal(layer5.next, "AGENT_4B_EXTENDED_DAP_INDIA_READINESS");
assert.equal(typeof runPhase7Layer5SemanticBatchQualityGatePhase, "function");
assert.equal(typeof advanceReviewerRun, "function");

for (const artifactName of PHASE7_DAP_LAYER5_ARTIFACT_NAMES) assert.equal(isKnownArtifactName(artifactName), true);
assert.ok(layer5.writes.includes("dap_semantic_batch_validation_manifest"));
assert.ok(layer5.writes.includes("data_provenance_profile_semantic_batch_gate"));
assert.ok(layer5.reads.includes("dap_semantic_batch_route_manifest"));
assert.ok(layer5.dynamic_reads.includes("dap_semantic_batch_validation__{BATCH_ID}"));

const agent4Writes = WRITE_PERMISSIONS.agent_4_data_privacy || [];
const phaseWrites = PHASE_WRITE_PERMISSIONS[phase] || [];
for (const artifactName of PHASE7_DAP_LAYER5_ARTIFACT_NAMES) {
  assert.ok(agent4Writes.some((permission) => artifactMatchesPermission(artifactName, permission)), `agent4 cannot write ${artifactName}`);
  assert.ok(phaseWrites.some((permission) => artifactMatchesPermission(artifactName, permission)), `layer5 phase cannot write ${artifactName}`);
}

console.log("Phase 7 Layer 5 runtime integration: PASS");
