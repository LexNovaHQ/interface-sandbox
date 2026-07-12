import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getInternalJobContract } from "../src/runtime/contracts/internal-job.contract.js";
import { assertCanWriteArtifact, assertCanReadArtifact, assertInternalJobCanWriteArtifact, PHASE11_ARTIFACT_NAMES } from "../src/runtime/contracts/artifact-permissions.contract.js";
import { validatePhase11TargetedMutation } from "../src/phases/11-operator-challenge/operator-challenge-mutation-guard.js";
import { buildPhase11DispatchCheckpoint, checkpointMayResume } from "../src/phases/11-operator-challenge/operator-challenge-dispatch-checkpoint.js";
import { applyPhase11ProductionContract } from "../src/phases/11-operator-challenge/operator-challenge-production.contract.js";
import { callPhase11WithTechnicalRetry } from "../src/phases/11-operator-challenge/operator-challenge-technical-retry.js";
import { buildPhase10CompilerCompatibility } from "../src/phases/12-normalized-compiler/phase10-downstream-compatibility.js";

const expectedArtifacts = ["operator_challenge_inventory", "operator_challenge_semantic_ledger", "operator_challenge_reinvestigation_ledger", "operator_challenge_dispatch_checkpoint", "challenge_gate"];
assert.deepEqual(PHASE11_ARTIFACT_NAMES, expectedArtifacts);
const contract = getInternalJobContract("M12");
assert.equal(contract.runtime_contract_version, "PHASE11_PRODUCTION_RUNTIME_CONTRACT_v1");
assert.deepEqual(contract.writes, expectedArtifacts);
assert.equal(contract.only_critical_failure_blocks, true);
assert.equal(contract.unresolved_after_two_attempts, "PASS_WITH_LIMITATION");
assert.deepEqual(applyPhase11ProductionContract({ writes: [] }).writes, expectedArtifacts);
for (const name of expectedArtifacts) { assert.doesNotThrow(() => assertCanWriteArtifact("agent_7_m12", name)); assert.doesNotThrow(() => assertCanReadArtifact("agent_7_m12", name)); assert.doesNotThrow(() => assertInternalJobCanWriteArtifact("M12", name)); }
assert.doesNotThrow(() => assertCanReadArtifact("compiler", "challenge_gate"));
assert.throws(() => assertCanReadArtifact("compiler", "operator_challenge_semantic_ledger"), /READ_FORBIDDEN/);
assert.throws(() => assertCanWriteArtifact("compiler", "operator_challenge_semantic_ledger"), /WRITE_FORBIDDEN/);

const dispatch = { schema_version: "phase11_reinvestigation_dispatch.v1", dispatch_id: "dispatch-1", challenge_candidate_id: "OCI-1", attempt_number: 1, owner_internal_job: "M8_TARGET_FEATURE_PROFILE", targeted_reinvestigation_only: true, full_phase_rerun_forbidden: true, artifact_names: ["target_feature_profile"], field_paths: ["target_feature_profile.activities.0.primary_classification"] };
const before = { target_feature_profile: { status: "LOCKED", activities: [{ primary_classification: { package_id: "fintech" }, activity_name: "Payments" }] } };
const allowedAfter = { target_feature_profile: { status: "LOCKED", activities: [{ primary_classification: { package_id: "ai-governance" }, activity_name: "Payments" }] } };
assert.equal(validatePhase11TargetedMutation({ dispatch, beforeArtifacts: before, afterArtifacts: allowedAfter }).status, "PASS");
const rejected = validatePhase11TargetedMutation({ dispatch, beforeArtifacts: before, afterArtifacts: { target_feature_profile: { status: "LOCKED", activities: [{ primary_classification: { package_id: "ai-governance" }, activity_name: "Changed unrelated name" }] } } });
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

let transientCalls = 0;
const retried = await callPhase11WithTechnicalRetry({ call: async () => { transientCalls += 1; if (transientCalls < 3) throw new Error("503 temporarily unavailable"); return "ok"; } });
assert.equal(retried.result, "ok");
assert.equal(retried.technical_retry_count, 2);

const compatibility = buildPhase10CompilerCompatibility({ artifacts: {
  active_threat_registry_manifest: { expected_registry_row_key_count: 1, mounted_packages: ["fintech"], primary_package: "fintech" },
  exposure_registry_route_plan: { route_rows: [{ registry_row_key: "fintech::FIN_1" }] },
  exposure_registry_workpad_98: { registry_rows: [{ registry_row_key: "fintech::FIN_1", package_id: "fintech", Threat_ID: "FIN_1", final_material_status: "TRIGGERED", material_projection: { Threat_ID: "FIN_1" } }] },
  exposure_registry_controlled_profile: { controlled_rows: [] },
  exposure_registry_triggered_profile: { triggered_rows: [{ registry_row_key: "fintech::FIN_1" }] },
  challenge_gate: { status: "PASS_WITH_LIMITATION", compiler_handoff_allowed: true, schema_version: "challenge_gate.v4.operator_challenge", advisory_warnings: [{ challenge_candidate_id: "OCI-W", disposition: "ADVISORY_WARNING", affected_field_paths: ["field.path"], limitation_if_unresolved: "Public evidence remains limited.", materiality_analysis: "Report conclusion must be qualified." }] }
} }).phase10_downstream_compatibility;
assert.equal(compatibility.validation.status, "PASS_WITH_LIMITATION");
assert.equal(compatibility.phase11_warning_projection.warning_count, 1);
assert.equal(compatibility.phase11_warning_projection.warnings[0].local_counsel_review_route, "LOCAL_COUNSEL_REVIEW_REQUIRED");

const runner = readFileSync("src/phases/11-operator-challenge/operator-challenge.runner.js", "utf8");
const runtime = readFileSync("src/phases/11-operator-challenge/operator-challenge-dispatch.runtime.js", "utf8");
const targeted = readFileSync("src/phases/11-operator-challenge/phase10-targeted-reinvestigation.js", "utf8");
const binding = readFileSync("agent-packages/agent_7_operator_challenge/AGENT7_PHASE11_RUNTIME_BINDING.yaml", "utf8");
const productionContract = readFileSync("agent-packages/agent_7_operator_challenge/PHASE11_PRODUCTION_INTEGRATION_CONTRACT.md", "utf8");
for (const marker of ["PHASE11_INDEPENDENT_ARTIFACT_CUTOVER_ACTIVE", "PHASE11_BOUNDED_TECHNICAL_RETRY_ACTIVE", "operator_challenge_inventory", "operator_challenge_semantic_ledger", "operator_challenge_reinvestigation_ledger"]) assert.ok(runner.includes(marker), `runner missing ${marker}`);
for (const marker of ["acquirePhase11DispatchLease", "validatePhase11TargetedMutation", "rollbackArtifacts", "callPhase11WithTechnicalRetry", "DISPATCH_CREATED", "ATTEMPT_RECORDED"]) assert.ok(runtime.includes(marker), `runtime missing ${marker}`);
for (const marker of ["assertUnaffectedRowsPreserved", "unaffected_rows_preserved: true"]) assert.ok(targeted.includes(marker), `targeted Phase 10 missing ${marker}`);
for (const marker of ["runtime_contract_version: v5_production_integration_mutation_checkpoint", "mutation_guard_version: phase11_mutation_guard.v1", "dispatch_checkpoint_version: phase11_dispatch_checkpoint.v1", "run_scoped_lease_active: true"]) assert.ok(binding.includes(marker), `binding missing ${marker}`);
for (const marker of ["Independent artifacts", "Mutation boundary", "Durable checkpoint sequence", "A third substantive attempt is forbidden"]) assert.ok(productionContract.includes(marker), `production contract missing ${marker}`);

console.log(JSON.stringify({ check: "Phase 11 production integration", status: "PASS", independent_artifacts: expectedArtifacts, effective_contract_override: true, mutation_guard: true, rollback_required_on_unrelated_mutation: true, targeted_phase10_sibling_rows_preserved: true, durable_checkpoint_sequence: true, lease_wiring: true, bounded_technical_retries: true, warning_projection: true, compiler_single_authority: "challenge_gate" }, null, 2));
