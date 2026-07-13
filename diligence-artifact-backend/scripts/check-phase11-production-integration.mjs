import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getInternalJobContract, listInternalJobContracts } from "../src/runtime/contracts/internal-job.contract.js";
import { PIPELINE_CONTRACTS, PIPELINE_CONTRACT_STATUS } from "../src/runtime/contracts/pipeline.contract.js";
import { assertCanWriteArtifact, assertCanReadArtifact, assertInternalJobCanWriteArtifact, PHASE11_ARTIFACT_NAMES } from "../src/runtime/contracts/artifact-permissions.contract.js";
import { validatePhase11TargetedMutation } from "../src/phases/11-operator-challenge/operator-challenge-mutation-guard.js";
import { buildPhase11DispatchCheckpoint, checkpointMayResume, PHASE11_DISPATCH_CHECKPOINT_VERSION, PHASE11_DISPATCH_LEASE_VERSION } from "../src/phases/11-operator-challenge/operator-challenge-dispatch-checkpoint.js";
import { callPhase11WithTechnicalRetry } from "../src/phases/11-operator-challenge/operator-challenge-technical-retry.js";
import { buildPhase10CompilerCompatibility } from "../src/phases/12-normalized-compiler/phase10-downstream-compatibility.js";

const expectedArtifacts = ["operator_challenge_inventory", "operator_challenge_semantic_ledger", "operator_challenge_reinvestigation_ledger", "operator_challenge_dispatch_checkpoint", "challenge_gate"];
assert.deepEqual(PHASE11_ARTIFACT_NAMES, expectedArtifacts);
const canonicalContract = PIPELINE_CONTRACTS.M12;
const runtimeContract = getInternalJobContract("M12");
const listedContract = listInternalJobContracts().find((entry) => entry.internal_job_id === "M12")?.contract;
assert.equal(canonicalContract.runtime_contract_version, "PHASE11_PRODUCTION_RUNTIME_CONTRACT_v1");
assert.deepEqual(canonicalContract.writes, expectedArtifacts);
assert.strictEqual(runtimeContract, canonicalContract);
assert.strictEqual(listedContract, canonicalContract);
assert.equal(canonicalContract.only_critical_failure_blocks, true);
assert.equal(canonicalContract.unresolved_after_two_attempts, "PASS_WITH_LIMITATION");
assert.equal(PIPELINE_CONTRACT_STATUS.phase11_canonical_pipeline_contract_synced, true);
assert.equal(PIPELINE_CONTRACT_STATUS.phase11_production_contract_override_active, false);
assert.equal(PHASE11_DISPATCH_CHECKPOINT_VERSION, "phase11_dispatch_checkpoint.v2");
assert.equal(PHASE11_DISPATCH_LEASE_VERSION, "phase11_dispatch_lease.v2");
for (const name of expectedArtifacts) {
  assert.doesNotThrow(() => assertCanWriteArtifact("agent_7_m12", name));
  assert.doesNotThrow(() => assertCanReadArtifact("agent_7_m12", name));
  assert.doesNotThrow(() => assertInternalJobCanWriteArtifact("M12", name));
}
assert.doesNotThrow(() => assertCanReadArtifact("compiler", "challenge_gate"));
assert.throws(() => assertCanReadArtifact("compiler", "operator_challenge_semantic_ledger"), /READ_FORBIDDEN/);
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
  field_paths: ["target_feature_profile.activities.0.primary_classification"],
  baseline_artifact_versions: {}
};
const before = { target_feature_profile: { status: "LOCKED", activities: [{ primary_classification: { package_id: "fintech" }, activity_name: "Payments" }] } };
const allowedAfter = { target_feature_profile: { status: "LOCKED", activities: [{ primary_classification: { package_id: "ai-governance" }, activity_name: "Payments" }] } };
assert.equal(validatePhase11TargetedMutation({ dispatch, beforeArtifacts: before, afterArtifacts: allowedAfter }).status, "PASS");
const rejected = validatePhase11TargetedMutation({ dispatch, beforeArtifacts: before, afterArtifacts: { target_feature_profile: { status: "LOCKED", activities: [{ primary_classification: { package_id: "ai-governance" }, activity_name: "Changed unrelated name" }] } } });
assert.equal(rejected.status, "REJECTED_UNAUTHORIZED_MUTATION");
assert.equal(rejected.rollback_required, true);
assert.ok(rejected.unauthorized_changes.some((row) => row.path.endsWith("activity_name")));

const run = { run_id: "RUN-P11-PROD" };
const cp1 = buildPhase11DispatchCheckpoint({ run, dispatch, stage: "DISPATCH_CREATED", payload: {} });
const cp2 = buildPhase11DispatchCheckpoint({ run, dispatch, stage: "OWNER_PROPOSAL_RUNNING", previous: cp1, payload: {} });
const cp3 = buildPhase11DispatchCheckpoint({ run, dispatch, stage: "OWNER_PROPOSAL_CREATED", previous: cp2, payload: {} });
const cp4 = buildPhase11DispatchCheckpoint({ run, dispatch, stage: "PROPOSAL_COMMITTED", previous: cp3, payload: {} });
const cp5 = buildPhase11DispatchCheckpoint({ run, dispatch, stage: "ATTEMPT_RECORDED", previous: cp4, payload: {} });
const cp6 = buildPhase11DispatchCheckpoint({ run, dispatch, stage: "COMPLETE", previous: cp5, payload: {} });
assert.equal(cp6.status, "COMPLETE");
assert.equal(checkpointMayResume(cp4, dispatch), true);
assert.throws(() => buildPhase11DispatchCheckpoint({ run, dispatch, stage: "OWNER_PROPOSAL_RUNNING", previous: cp5 }), /CHECKPOINT_REGRESSION/);
const nonSubstantive = buildPhase11DispatchCheckpoint({ run, dispatch, stage: "NON_SUBSTANTIVE_RETRY_REQUIRED", previous: cp4, payload: {} });
assert.equal(nonSubstantive.status, "IN_PROGRESS");

let transientCalls = 0;
const retried = await callPhase11WithTechnicalRetry({ call: async () => {
  transientCalls += 1;
  if (transientCalls < 3) throw new Error("503 temporarily unavailable");
  return "ok";
} });
assert.equal(retried.result, "ok");
assert.equal(retried.technical_retry_count, 2);

const compatibility = buildPhase10CompilerCompatibility({ artifacts: {
  exposure_registry_controlled_profile: {
    report_row_schema_version: "phase10_report_row.v1.complete_registry_spine",
    controlled_rows: []
  },
  exposure_registry_triggered_profile: {
    report_row_schema_version: "phase10_report_row.v1.complete_registry_spine",
    triggered_rows: [validMaterialRow()]
  },
  challenge_gate: {
    status: "PASS_WITH_LIMITATION",
    compiler_handoff_allowed: true,
    schema_version: "challenge_gate.v4.operator_challenge",
    final_gate_fingerprint: "phase11-final-gate-fixture",
    layer_status: { layer_3: "COMPLETE" },
    reinvestigation_dispatch_required: false,
    advisory_warnings: [{
      challenge_candidate_id: "OCI-W",
      disposition: "ADVISORY_WARNING",
      affected_artifacts: ["target_profile"],
      affected_field_paths: ["field.path"],
      affected_registry_row_keys: [],
      limitation_if_unresolved: "Public evidence remains limited.",
      materiality_analysis: "Report conclusion must be qualified."
    }]
  }
} }).phase10_downstream_compatibility;
assert.equal(compatibility.validation.status, "PASS_WITH_LIMITATION");
assert.equal(compatibility.phase11_warning_projection.warning_count, 1);
assert.equal(compatibility.phase11_warning_projection.warnings[0].local_counsel_review_route, "LOCAL_COUNSEL_REVIEW_REQUIRED");

const runner = readFileSync("src/phases/11-operator-challenge/operator-challenge.runner.js", "utf8");
const runtime = readFileSync("src/phases/11-operator-challenge/operator-challenge-dispatch.runtime.js", "utf8");
const commit = readFileSync("src/phases/11-operator-challenge/operator-challenge-targeted-commit.js", "utf8");
const targeted = readFileSync("src/phases/11-operator-challenge/phase10-targeted-reinvestigation.js", "utf8");
const binding = readFileSync("agent-packages/agent_7_operator_challenge/AGENT7_PHASE11_RUNTIME_BINDING.yaml", "utf8");
const productionContract = readFileSync("agent-packages/agent_7_operator_challenge/PHASE11_PRODUCTION_INTEGRATION_CONTRACT.md", "utf8");
for (const marker of ["PHASE11_INDEPENDENT_ARTIFACT_CUTOVER_ACTIVE", "PHASE11_BOUNDED_TECHNICAL_RETRY_ACTIVE", "operator_challenge_inventory", "operator_challenge_semantic_ledger", "operator_challenge_reinvestigation_ledger"]) assert.ok(runner.includes(marker), `runner missing ${marker}`);
for (const marker of ["acquirePhase11DispatchLease", "renewPhase11DispatchLease", "commitPhase11TargetedMutationProposal", "callPhase11WithTechnicalRetry", "OWNER_PROPOSAL_RUNNING", "OWNER_PROPOSAL_CREATED", "PROPOSAL_COMMITTED", "NON_SUBSTANTIVE_RETRY_REQUIRED", "ATTEMPT_RECORDED"]) assert.ok(runtime.includes(marker), `runtime missing ${marker}`);
for (const marker of ["validatePhase11WriteManifest", "validatePhase11TargetedMutation", "saveRuntimeArtifact", "phase11_commit_rolled_back", "persistence_before_mutation_guard: false"]) assert.ok(commit.includes(marker), `targeted commit missing ${marker}`);
for (const marker of ["assertUnaffectedRowsPreserved", "unaffected_rows_preserved: true"]) assert.ok(targeted.includes(marker), `targeted Phase 10 missing ${marker}`);
for (const marker of ["runtime_contract_version: v6_attempt_safe_staged_mutation", "mutation_guard_version: phase11_mutation_guard.v1", "dispatch_checkpoint_version: phase11_dispatch_checkpoint.v2", "dispatch_lease_version: phase11_dispatch_lease.v2", "staged_mutation_proposals_active: true", "technical_failures_are_not_substantive_attempts: true"]) assert.ok(binding.includes(marker), `binding missing ${marker}`);
for (const marker of ["Independent artifacts", "Mutation boundary", "Durable checkpoint sequence", "OWNER_PROPOSAL_RUNNING", "NON_SUBSTANTIVE_RETRY_REQUIRED", "A third substantive attempt is forbidden"]) assert.ok(productionContract.includes(marker), `production contract missing ${marker}`);

console.log(JSON.stringify({ check: "Phase 11 production integration", status: "PASS", independent_artifacts: expectedArtifacts, canonical_pipeline_contract_synced: true, shadow_contract_override_active: false, mutation_guard: true, staged_mutation_proposals: true, persistence_before_mutation_guard: false, rollback_required_on_unrelated_mutation: true, targeted_phase10_sibling_rows_preserved: true, durable_checkpoint_version: PHASE11_DISPATCH_CHECKPOINT_VERSION, lease_version: PHASE11_DISPATCH_LEASE_VERSION, bounded_technical_retries: true, technical_failures_are_not_substantive_attempts: true, warning_projection: true, compiler_single_authority: "challenge_gate" }, null, 2));

function validMaterialRow() {
  return {
    registry_row_key: "fintech::FIN_1",
    package_id: "fintech",
    source_domain: "fintech",
    stream_id: "fintech",
    stream_type: "PRIMARY",
    Threat_ID: "FIN_1",
    Threat_Name: "Illustrative material threat",
    Lane: "Commercial",
    Behavior_Class: "Transaction Processing",
    Surface: "API",
    Subcategory: "Payments",
    Authority_IN: "Public authority signal",
    Authority_EU: "Public authority signal",
    Authority_US: "Public authority signal",
    Velocity: "Current",
    Pain_Tier: "T3",
    Pain_Category: "Operational",
    Pain_Depth: "Corporate",
    Status: "Effective",
    Effective_Date: "2026-01-01",
    Legal_Pain: "Qualified review required",
    FP_Mechanism: "Public evidence mapping",
    FP_Impact: "Material report impact",
    Lex_Nova_Fix: "Review-ready remediation architecture",
    Hunter_Trigger: "Public product signal",
    Provenance: "Phase 10 controlled fixture",
    FIELD21: "Value 21",
    FIELD22: "Value 22",
    FIELD23: "Value 23",
    target_match: true,
    evaluation_status: "TRIGGERED",
    basis_proof: "Deterministic fixture basis",
    control_exclusion_evaluation: "No exclusion",
    evidence_source_basis: "Public evidence fixture",
    applied_fp_mechanism: "Public evidence mapping",
    row_limitations: "Fixture limitation",
    review_route: "QUALIFIED_REVIEW"
  };
}
