import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildOperatorChallengeLayer3 } from "../src/phases/11-operator-challenge/operator-challenge-adjudication.js";
import { recordOperatorChallengeReinvestigationAttempt } from "../src/phases/11-operator-challenge/operator-challenge-reinvestigation.js";

const materialInventory = inventory(candidate("OCI-0001", "MATERIAL_FIELD_CANDIDATE", "TRIGGERED_EXPOSURE_WITHOUT_REVIEW_ROUTE"));
const materialLedger = semanticLedger(materialInventory, "MATERIAL_REINVESTIGATION");
const initial = buildOperatorChallengeLayer3({ inventory: materialInventory, semanticLedger: materialLedger, run: { run_id: "LN-L3" } });
assert.equal(initial.challenge_gate.status, "REINVESTIGATION_REQUIRED");
assert.equal(initial.runtime_lock_status, "CREATED");
assert.equal(initial.challenge_gate.compiler_handoff_allowed, false);
assert.equal(initial.challenge_gate.reinvestigation_directives.length, 1);
assert.equal(initial.challenge_gate.reinvestigation_directives[0].attempt_number, 1);
assert.equal(initial.challenge_gate.reinvestigation_directives[0].smallest_affected_unit_only, true);
assert.equal(initial.challenge_gate.reinvestigation_directives[0].full_phase_rerun_required, false);

const afterAttempt1 = recordOperatorChallengeReinvestigationAttempt({
  challengeGate: initial.challenge_gate,
  result: {
    challenge_candidate_id: "OCI-0001",
    attempt_number: 1,
    owning_phase: "PHASE_10_EXPOSURE_PROFILE",
    artifact_names: ["exposure_registry_workpad_98"],
    field_paths: ["exposure_registry_workpad_98.registry_rows[fintech::FIN_PAY_001].review_route"],
    affected_row_identity: ["fintech::FIN_PAY_001"],
    result: "UNRESOLVED",
    validated: true,
    validation_basis: "Field remains unsupported after targeted Phase 10 reinvestigation.",
    remaining_uncertainty: "Review route not publicly determinable.",
    returned_artifact_versions: [{ artifact_name: "exposure_registry_workpad_98", version: 2 }]
  }
});
const attempt2Gate = buildOperatorChallengeLayer3({ inventory: materialInventory, semanticLedger: materialLedger, priorChallengeGate: afterAttempt1, run: { run_id: "LN-L3" } });
assert.equal(attempt2Gate.challenge_gate.status, "REINVESTIGATION_REQUIRED");
assert.equal(attempt2Gate.challenge_gate.reinvestigation_directives[0].attempt_number, 2);

const afterAttempt2 = recordOperatorChallengeReinvestigationAttempt({
  challengeGate: attempt2Gate.challenge_gate,
  result: {
    challenge_candidate_id: "OCI-0001",
    attempt_number: 2,
    owning_phase: "PHASE_10_EXPOSURE_PROFILE",
    artifact_names: ["exposure_registry_workpad_98"],
    field_paths: ["exposure_registry_workpad_98.registry_rows[fintech::FIN_PAY_001].review_route"],
    affected_row_identity: ["fintech::FIN_PAY_001"],
    result: "UNRESOLVED",
    validated: true,
    validation_basis: "Second targeted reinvestigation remains inconclusive.",
    remaining_uncertainty: "Local counsel must confirm review route.",
    returned_artifact_versions: [{ artifact_name: "exposure_registry_workpad_98", version: 3 }]
  }
});
const exhausted = buildOperatorChallengeLayer3({ inventory: materialInventory, semanticLedger: materialLedger, priorChallengeGate: afterAttempt2, run: { run_id: "LN-L3" } });
assert.equal(exhausted.challenge_gate.status, "PASS_WITH_LIMITATION");
assert.equal(exhausted.runtime_lock_status, "LOCKED_WITH_LIMITATIONS");
assert.equal(exhausted.challenge_gate.compiler_handoff_allowed, true);
assert.equal(exhausted.challenge_gate.operator_challenge_reinvestigation_ledger.exhausted_with_warning_count, 1);
assert.equal(exhausted.challenge_gate.reinvestigation_directives.length, 0);
assert.throws(() => recordOperatorChallengeReinvestigationAttempt({ challengeGate: exhausted.challenge_gate, result: { challenge_candidate_id: "OCI-0001", attempt_number: 3 } }), /ATTEMPT_LIMIT_EXCEEDED/);

const resolvedAttempt = recordOperatorChallengeReinvestigationAttempt({
  challengeGate: initial.challenge_gate,
  result: {
    challenge_candidate_id: "OCI-0001",
    attempt_number: 1,
    owning_phase: "PHASE_10_EXPOSURE_PROFILE",
    artifact_names: ["exposure_registry_workpad_98"],
    field_paths: ["exposure_registry_workpad_98.registry_rows[fintech::FIN_PAY_001].review_route"],
    affected_row_identity: ["fintech::FIN_PAY_001"],
    result: "RESOLVED",
    validated: true,
    validation_basis: "Review route now supported by a locked Phase 10 artifact.",
    remaining_uncertainty: "",
    returned_artifact_versions: [{ artifact_name: "exposure_registry_workpad_98", version: 2 }]
  }
});
const resolved = buildOperatorChallengeLayer3({ inventory: materialInventory, semanticLedger: materialLedger, priorChallengeGate: resolvedAttempt, run: { run_id: "LN-L3" } });
assert.equal(resolved.challenge_gate.status, "PASS");
assert.equal(resolved.runtime_lock_status, "LOCKED");
assert.equal(resolved.challenge_gate.operator_challenge_reinvestigation_ledger.resolved_count, 1);

const criticalInventory = inventory(candidate("OCI-0001", "CRITICAL_SUBSTRATE_CANDIDATE", "PHASE10_COMPOUND_CUSTODY_MISMATCH"));
const critical = buildOperatorChallengeLayer3({ inventory: criticalInventory, semanticLedger: semanticLedger(criticalInventory, "REJECT"), run: { run_id: "LN-L3" } });
assert.equal(critical.challenge_gate.status, "CONTROLLED_FAILURE");
assert.equal(critical.runtime_lock_status, "CONTROLLED_FAILURE");
assert.equal(critical.challenge_gate.confirmed_critical_failures.length, 1);
assert.equal(critical.challenge_gate.compiler_handoff_allowed, false);

const advisoryInventory = inventory(candidate("OCI-0001", "ADVISORY_CANDIDATE", "MATERIAL_LIMITATION_CLUSTER"));
const advisory = buildOperatorChallengeLayer3({ inventory: advisoryInventory, semanticLedger: semanticLedger(advisoryInventory, "ADVISORY"), run: { run_id: "LN-L3" } });
assert.equal(advisory.challenge_gate.status, "PASS_WITH_LIMITATION");
assert.equal(advisory.challenge_gate.compiler_handoff_allowed, true);

const rejectedInventory = inventory(candidate("OCI-0001", "MATERIAL_FIELD_CANDIDATE", "VISIBLE_CONTROL_WITHOUT_COMPLETE_SUPPORT"));
const rejected = buildOperatorChallengeLayer3({ inventory: rejectedInventory, semanticLedger: semanticLedger(rejectedInventory, "REJECT"), run: { run_id: "LN-L3" } });
assert.equal(rejected.challenge_gate.status, "PASS");
assert.equal(rejected.challenge_gate.rejected_challenges.length, 1);

assert.throws(() => recordOperatorChallengeReinvestigationAttempt({
  challengeGate: initial.challenge_gate,
  result: {
    challenge_candidate_id: "OCI-0001",
    attempt_number: 1,
    owning_phase: "PHASE_8_DOMAIN_CONTROL_OBLIGATION",
    field_paths: ["wrong.path"],
    result: "UNRESOLVED",
    validated: true
  }
}), /OWNER_MISMATCH|FIELD_SCOPE_MISMATCH/);

const runner = readFileSync("src/phases/11-operator-challenge/operator-challenge.runner.js", "utf8");
const binding = readFileSync("agent-packages/agent_7_operator_challenge/AGENT7_PHASE11_RUNTIME_BINDING.yaml", "utf8");
const contract = readFileSync("agent-packages/agent_7_operator_challenge/PHASE11_LAYER3_DETERMINISTIC_ADJUDICATION.md", "utf8");
for (const marker of [
  "PHASE11_LAYER3_DETERMINISTIC_ADJUDICATION_REINVESTIGATION_GATE_ACTIVE",
  "buildOperatorChallengeLayer3",
  "reinvestigation_dispatch_required",
  "compiler_handoff_allowed"
]) assert.ok(runner.includes(marker), `runner missing Layer 3 marker: ${marker}`);
for (const marker of [
  "runtime_contract_version: v6_attempt_safe_staged_mutation",
  "status: ACTIVE",
  "only_critical_failure_blocks: true",
  "maximum_reinvestigation_attempts: 2",
  "unresolved_after_two_attempts: PASS_WITH_LIMITATION",
  "technical_failure_consumes_substantive_attempt: false",
  "third_substantive_attempt_forbidden: true"
]) assert.ok(binding.includes(marker), `binding missing Layer 3 marker: ${marker}`);
for (const marker of ["REINVESTIGATION_REQUIRED", "CONTROLLED_FAILURE", "PASS_WITH_LIMITATION", "A third attempt is forbidden"]) assert.ok(contract.includes(marker));
assert.equal(runner.includes("profile_forensics_inputs_allowed !== false"), true);
assert.equal(contract.includes("globally identify Phase 10 rows by raw `Threat_ID`"), true);

console.log(JSON.stringify({
  check: "Phase 11 Layer 3 deterministic adjudication",
  status: "PASS",
  critical_failure_blocks: true,
  material_reinvestigation_runtime_status: "CREATED",
  maximum_substantive_reinvestigation_attempts: 2,
  technical_failures_consume_substantive_attempts: false,
  unresolved_after_two_attempts: "PASS_WITH_LIMITATION",
  compiler_handoff_statuses: ["PASS", "PASS_WITH_LIMITATION"]
}, null, 2));

function inventory(row) {
  return {
    schema_version: "operator_challenge_inventory.v1",
    inventory_fingerprint: "inventory-fingerprint",
    run_id: "LN-L3",
    target: "example.test",
    challenge_candidates: [row]
  };
}
function candidate(id, candidate_class, challenge_type) {
  return {
    challenge_candidate_id: id,
    candidate_class,
    challenge_type,
    affected_artifacts: ["exposure_registry_workpad_98"],
    affected_field_paths: ["exposure_registry_workpad_98.registry_rows[fintech::FIN_PAY_001].review_route"],
    affected_registry_row_keys: ["fintech::FIN_PAY_001"],
    affected_activity_ids: [],
    affected_data_field_ids: [],
    affected_obligation_ids: [],
    contradiction_statement: "A material field requires adversarial review.",
    deterministic_basis: ["fintech::FIN_PAY_001"],
    proposed_owner: "PHASE_10_EXPOSURE_PROFILE",
    proposed_reinvestigation_scope: "REVIEW_ROUTE_FIELD",
    criticality_reason: candidate_class === "CRITICAL_SUBSTRATE_CANDIDATE" ? "Custody cannot be established." : null
  };
}
function semanticLedger(inv, recommendation) {
  return {
    schema_version: "operator_challenge_semantic_ledger.v1",
    inventory_fingerprint: inv.inventory_fingerprint,
    semantic_output_fingerprint: "semantic-fingerprint",
    challenge_reviews: inv.challenge_candidates.map((row) => ({
      challenge_candidate_id: row.challenge_candidate_id,
      recommended_disposition: recommendation,
      confidence: "HIGH",
      adversarial_analysis: "Adversarial analysis complete.",
      materiality_analysis: "The issue may affect a material report field.",
      contradiction_test: "The deterministic candidate was tested against its bounded inventory paths.",
      supporting_inventory_paths: row.affected_field_paths,
      proposed_owner: row.proposed_owner,
      proposed_reinvestigation_scope: row.proposed_reinvestigation_scope,
      limitation_if_unresolved: "Carry a clear warning and local-counsel review route."
    }))
  };
}
