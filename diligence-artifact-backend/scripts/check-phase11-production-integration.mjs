import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getInternalJobContract } from "../src/runtime/contracts/internal-job.contract.js";
import { assertCanWriteArtifact, assertCanReadArtifact, assertInternalJobCanWriteArtifact, PHASE11_ARTIFACT_NAMES } from "../src/runtime/contracts/artifact-permissions.contract.js";
import { validatePhase11TargetedMutation } from "../src/phases/11-operator-challenge/operator-challenge-mutation-guard.js";
import { buildPhase11DispatchCheckpoint, checkpointMayResume } from "../src/phases/11-operator-challenge/operator-challenge-dispatch-checkpoint.js";
import { applyPhase11ProductionContract } from "../src/phases/11-operator-challenge/operator-challenge-production.contract.js";

const expectedArtifacts = [
  "operator_challenge_inventory",
  "operator_challenge_semantic_ledger",
  "operator_challenge_reinvestigation_ledger",
  "operator_challenge_dispatch_checkpoint",
  "challenge_gate"
];
assert.deepEqual(PHASE11_ARTIFACT_NAMES, expectedArtifacts);
const contract = getInternalJobContract("M12");
assert.equal(contract.runtime_contract_version, "PHASE11_PRODUCTION_RUNTIME_CONTRACT_v1");
assert.deepEqual(contract.writes, expectedArtifacts);
assert.equal(contract.only_critical_failure_blocks, true);
assert.equal(contract.unresolved_after_two_attempts, "PASS_WITH_LIMITATION");
assert.deepEqual(applyPhase11ProductionContract({ writes: [] }).writes, expectedArtifacts);

for (const name of expectedArtifacts) {
  assert.doesNotThrow(() => assertCanWriteArtifact("agent_7_m12", name));
  assert.doesNotThrow(() => assertCanReadArtifact("agent_7_m12", name));
  assert.doesNotThrow(() => assertInternalJobCanWriteArtifact("M12", name));
}
assert.doesNotThrow(() => assertCanReadArtifact("compiler", "challenge_gate"));
assert.throws(() => assertCanWriteArtifact("compiler", "operator_challenge_semantic_ledger"), /WRITE_FORBIDDEN/);

const dispatch = {
  schema_version: "phase11_reinvestigation_dispatch.v1",
  dispatch_id: "dispatch-1",
  challenge_candidate_id: "OCI-1",
  attempt_number: 1,
  owner_internal_job: "M8_TARGET_FEATURE_PROFILE",
  targeted_reinvestigation_only: true,
  full_phase_rerun_forbidden: true,
  artifact_names: ["target_feature_profile"],
  field_paths: ["target_feature_profile.activities.0.primary_classification"]
};
const before = { target_feature_profile: { status: "LOCKED", activities: [{ primary_classification: { package_id: "fintech" }, activity_name: "Payments" }] } };
const allowedAfter = { target_feature_profile: { status: "LOCKED", activities: [{ primary_classification: { package_id: "ai-governance" }, activity_name: "Payments" }] } };
const allowed = validatePhase11TargetedMutation({ dispatch, beforeArtifacts: before, afterArtifacts: allowedAfter });
assert.equal(allowed.status, "PASS");
assert.equal(allowed.rollback_required, false);
const badAfter = { target_feature_profile: { status: "LOCKED", activities: [{ primary_classification: { package_id: "ai-governance" }, activity_name: "Changed unrelated name" }] } };
const rejected = validatePhase11TargetedMutation({ dispatch, beforeArtifacts: before, afterArtifacts: badAfter });
assert.equal(rejected.status, "REJECTED_UNAUTHORIZED_MUTATION");
assert.equal(rejected.rollback_required, true);
assert.ok(rejected.unauthorized_changes.some((row) => row.path.endsWith("activity_name")));

const run = { run_id: "RUN-P11-PROD" };
const cp1 = buildPhase11DispatchCheckpoint({ run, dispatch, stage: "DISPATCH_CREATED", payload: {} });
const cp2 = buildPhase11DispatchCheckpoint({ run, dispatch, stage: "OWNER_RUNNING", previous: cp1, payload: {} });
const cp3 = buildPhase11DispatchCheckpoint({ run, dispatch, stage: "OWNER_RETURNED", previous: cp2, payload: {} });
const cp4 = buildPhase11DispatchCheckpoint({ run, dispatch, stage: "RETURN_VALIDATED", previous: cp3, payload: {} });
const cp5 = buildPhase11DispatchCheckpoint({ run, dispatch, stage: "ATTEMPT_RECORDED", previous: cp4, payload: {} });
const cp6 = buildPhase11DispatchCheckpoint({ run, dispatch, stage: "COMPLETE", previous: cp5, payload: {} });
assert.equal(cp6.status, "COMPLETE");
assert.equal(checkpointMayResume(cp4, dispatch), true);
assert.throws(() => buildPhase11DispatchCheckpoint({ run, dispatch, stage: "OWNER_RUNNING", previous: cp4 }), /CHECKPOINT_REGRESSION/);

const runner = readFileSync("src/phases/11-operator-challenge/operator-challenge.runner.js", "utf8");
const runtime = readFileSync("src/phases/11-operator-challenge/operator-challenge-dispatch.runtime.js", "utf8");
const binding = readFileSync("agent-packages/agent_7_operator_challenge/AGENT7_PHASE11_RUNTIME_BINDING.yaml", "utf8");
const productionContract = readFileSync("agent-packages/agent_7_operator_challenge/PHASE11_PRODUCTION_INTEGRATION_CONTRACT.md", "utf8");
for (const marker of ["PHASE11_INDEPENDENT_ARTIFACT_CUTOVER_ACTIVE", "operator_challenge_inventory", "operator_challenge_semantic_ledger", "operator_challenge_reinvestigation_ledger"]) assert.ok(runner.includes(marker), `runner missing ${marker}`);
for (const marker of ["acquirePhase11DispatchLease", "validatePhase11TargetedMutation", "rollbackArtifacts", "DISPATCH_CREATED", "ATTEMPT_RECORDED"]) assert.ok(runtime.includes(marker), `runtime missing ${marker}`);
for (const marker of ["runtime_contract_version: v5_production_integration_mutation_checkpoint", "mutation_guard_version: phase11_mutation_guard.v1", "dispatch_checkpoint_version: phase11_dispatch_checkpoint.v1", "run_scoped_lease_active: true"]) assert.ok(binding.includes(marker), `binding missing ${marker}`);
for (const marker of ["Independent artifacts", "Mutation boundary", "Durable checkpoint sequence", "A third substantive attempt is forbidden"]) assert.ok(productionContract.includes(marker), `production contract missing ${marker}`);

console.log(JSON.stringify({
  check: "Phase 11 production integration",
  status: "PASS",
  independent_artifacts: expectedArtifacts,
  effective_contract_override: true,
  mutation_guard: true,
  rollback_required_on_unrelated_mutation: true,
  durable_checkpoint_sequence: true,
  lease_wiring: true,
  compiler_single_authority: "challenge_gate"
}, null, 2));
