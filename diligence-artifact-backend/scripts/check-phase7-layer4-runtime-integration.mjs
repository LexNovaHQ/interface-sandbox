import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PHASES, PHASE7_DAP_BATCH_ARTIFACT_NAMES, PHASE7_DAP_LAYER1_ARTIFACT_NAMES, PHASE7_DAP_LAYER2_ARTIFACT_NAMES, PHASE7_DAP_LAYER3_ARTIFACT_NAMES, WRITE_PERMISSIONS, PHASE_WRITE_PERMISSIONS, artifactMatchesPermission, isKnownArtifactName } from "../src/constants.js";
import { getPhaseContract } from "../src/phase-contracts.js";
import { runPhase7Layer4SemanticBatchPhase } from "../src/phase7-layer4-semantic-batch-orchestrator.js";
import { advanceReviewerRun } from "../src/reviewer-runner-normalized.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const phase = "DATA_PROVENANCE_PROFILE_LAYER4";
const validationName = "dap_semantic_batch_validation__DAP-SEM-BATCH-09";

assert.ok(PHASES.includes(phase));
assert.equal(typeof runPhase7Layer4SemanticBatchPhase, "function");
assert.equal(typeof advanceReviewerRun, "function");
for (const name of ["dap_registry_manifest", "dap_strategic_derivation_matrix", "data_privacy_navigation_index", "dap_semantic_batch_route_manifest", "dap_semantic_batch_contact_cm_artifact", validationName]) assert.equal(isKnownArtifactName(name), true);

const agent4Writes = WRITE_PERMISSIONS.agent_4_data_privacy || [];
const phaseWrites = PHASE_WRITE_PERMISSIONS[phase] || [];
for (const artifactName of [...PHASE7_DAP_LAYER1_ARTIFACT_NAMES, ...PHASE7_DAP_LAYER2_ARTIFACT_NAMES, ...PHASE7_DAP_LAYER3_ARTIFACT_NAMES, ...PHASE7_DAP_BATCH_ARTIFACT_NAMES, validationName]) {
  assert.ok(agent4Writes.some((permission) => artifactMatchesPermission(artifactName, permission)));
  assert.ok(phaseWrites.some((permission) => artifactMatchesPermission(artifactName, permission)));
}

const contract = getPhaseContract(phase);
assert.equal(contract.type, "phase7_layer4_orchestrated");
assert.equal(contract.agent_id, "agent_4_data_privacy");
assert.equal(contract.next, "AGENT_4B_EXTENDED_DAP_INDIA_READINESS");
assert.ok(contract.reads.includes("target_feature_profile_forensics"));
assert.ok(contract.writes.includes("dap_semantic_batch_contact_cm_artifact"));

for (const file of ["agent-packages/agent_4_data_privacy/AGENT4_PHASE7_LAYER4_RUNTIME_BINDING_PACKET.yaml", "agent-packages/agent_4_data_privacy/PHASE7_LAYER4_DAP_SEMANTIC_BATCH_RUNNER.md", "agent-packages/agent_4_data_privacy/PHASE7_LAYER4_DAP_SEMANTIC_BATCH_REPAIR.md"]) assert.ok(fs.existsSync(path.join(root, file)));

console.log("Phase 7 Layer 4 runtime integration: PASS");
