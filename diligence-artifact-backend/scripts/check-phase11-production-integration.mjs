import assert from "node:assert/strict";
import { PIPELINE_CONTRACTS, PIPELINE_CONTRACT_STATUS } from "../src/runtime/contracts/pipeline.contract.js";
import { assertCanWriteArtifact, assertCanReadArtifact, assertInternalJobCanWriteArtifact, PHASE11_ARTIFACT_NAMES } from "../src/runtime/contracts/artifact-permissions.contract.js";
import { validatePhase11ProposalWriteAuthority } from "../src/phases/11-operator-challenge/operator-challenge-write-authority.js";
import { validatePhase11TargetedMutation } from "../src/phases/11-operator-challenge/operator-challenge-mutation-guard.js";
import { assertPhase11DispatchCheckpointTransition } from "../src/phases/11-operator-challenge/operator-challenge-dispatch-checkpoint.js";
import { buildPhase10CompilerCompatibility } from "../src/phases/12-normalized-compiler/phase10-downstream-compatibility.js";
import { dispatchFor, proposalFor, packetFor, printReceipt } from "./phase11-executable-test-fixtures.mjs";

const expectedArtifacts = ["operator_challenge_inventory", "operator_challenge_semantic_ledger", "operator_challenge_reinvestigation_ledger", "operator_challenge_dispatch_checkpoint", "challenge_gate"];
assert.deepEqual(PHASE11_ARTIFACT_NAMES, expectedArtifacts);
assert.equal(PIPELINE_CONTRACTS.M12.compiler_reads_final_challenge_gate_only, true);
assert.equal(PIPELINE_CONTRACT_STATUS.phase11_canonical_pipeline_contract_synced, true);
for (const name of expectedArtifacts) {
  assert.doesNotThrow(() => assertCanWriteArtifact("agent_7_m12", name));
  assert.doesNotThrow(() => assertCanReadArtifact("agent_7_m12", name));
  assert.doesNotThrow(() => assertInternalJobCanWriteArtifact("M12", name));
}
assert.doesNotThrow(() => assertCanReadArtifact("compiler", "challenge_gate"));
assert.throws(() => assertCanReadArtifact("compiler", "operator_challenge_semantic_ledger"), /READ_FORBIDDEN/);
const dispatch = dispatchFor();
const proposal = proposalFor({ dispatch });
assert.equal(validatePhase11ProposalWriteAuthority({ dispatch, packet: packetFor(dispatch), proposal, baselineArtifactVersions: { target_feature_profile: 1 } }).status, "PASS");
assert.equal(validatePhase11TargetedMutation({ dispatch, beforeArtifacts: { target_feature_profile: { activities: [{ primary_classification: "fintech" }] } }, afterArtifacts: { target_feature_profile: { activities: [{ primary_classification: "ai-governance" }] } } }).status, "PASS");
assert.equal(assertPhase11DispatchCheckpointTransition({ previous: { stage: "NON_SUBSTANTIVE_RETRY_REQUIRED" }, stage: "OWNER_PROPOSAL_RUNNING" }), true);
const gate = { schema_version: "challenge_gate.v4.operator_challenge", status: "PASS", compiler_handoff_allowed: true, final_gate_fingerprint: "fp", layer_status: { layer_3: "COMPLETE" } };
const compatibility = buildPhase10CompilerCompatibility({ artifacts: { active_threat_registry_manifest: { expected_registry_row_key_count: 0, report_row_contract: { report_row_schema_version: "phase10_report_row.v1.complete_registry_spine", registry_spine_completeness_status: "PASS", severity_validation_status: "PASS" } }, exposure_registry_route_plan: { route_rows: [] }, exposure_registry_workpad_98: { registry_rows: [] }, exposure_registry_controlled_profile: { report_row_schema_version: "phase10_report_row.v1.complete_registry_spine", controlled_rows: [] }, exposure_registry_triggered_profile: { report_row_schema_version: "phase10_report_row.v1.complete_registry_spine", triggered_rows: [] }, challenge_gate: gate } }).phase10_downstream_compatibility;
assert.equal(compatibility.challenge_status, "PASS");

printReceipt("phase11 production integration", ["CO14-12", "CO14-13", "CO14-18"], 18);
