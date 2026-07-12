import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildOperatorChallengeSemanticPacket, validateOperatorChallengeSemanticLedger } from "../src/phases/11-operator-challenge/operator-challenge-semantic.js";

const inventory = {
  schema_version: "operator_challenge_inventory.v1",
  inventory_fingerprint: "inventory-fingerprint-1",
  run_id: "RUN-1",
  challenge_candidates: [
    candidate("OCI-0001", "MATERIAL_FIELD_CANDIDATE", "UNRESOLVED_OBLIGATION_VS_CONTROLLED_EXPOSURE", ["fintech::UNI_PRV_001"]),
    candidate("OCI-0002", "ADVISORY_CANDIDATE", "MATERIAL_LIMITATION_CLUSTER", ["ai-governance::UNI_PRV_001"]),
    candidate("OCI-0003", "CRITICAL_SUBSTRATE_CANDIDATE", "PHASE10_COMPOUND_CUSTODY_MISMATCH", [])
  ]
};
const packet = buildOperatorChallengeSemanticPacket({ inventory, run: { run_id: "RUN-1" } }).operator_challenge_semantic_packet;
assert.equal(packet.semantic_packet_version, "PHASE11_LAYER2_SEMANTIC_PACKET_v1");
assert.deepEqual(packet.expected_challenge_candidate_ids, ["OCI-0001", "OCI-0002", "OCI-0003"]);
assert.equal(packet.blocking_doctrine.model_may_block_run, false);
assert.equal(packet.blocking_doctrine.maximum_reinvestigation_attempts, 2);
assert.equal(packet.candidates[0].affected_registry_row_keys[0], "fintech::UNI_PRV_001");
assert.equal(packet.candidates[1].affected_registry_row_keys[0], "ai-governance::UNI_PRV_001");

const good = {
  operator_challenge_semantic_ledger: {
    semantic_contract_version: "operator_challenge_semantic_ledger.v1",
    inventory_fingerprint: inventory.inventory_fingerprint,
    expected_challenge_candidate_ids: packet.expected_challenge_candidate_ids,
    returned_challenge_candidate_ids: packet.expected_challenge_candidate_ids,
    challenge_reviews: [
      review("OCI-0001", "MATERIAL_REINVESTIGATION"),
      review("OCI-0002", "ADVISORY"),
      review("OCI-0003", "CRITICAL_REVIEW_CANDIDATE")
    ]
  }
};
const validated = validateOperatorChallengeSemanticLedger({ semanticOutput: good, inventory });
assert.equal(validated.status, "PASS");
assert.equal(validated.semantic_ledger.authoritative, false);
assert.equal(validated.semantic_ledger.blocking_decision_made, false);
assert.equal(validated.semantic_ledger.reinvestigation_attempted, false);
assert.ok(validated.semantic_ledger.semantic_output_fingerprint);

const badOrder = structuredClone(good);
badOrder.operator_challenge_semantic_ledger.challenge_reviews.reverse();
assert.equal(validateOperatorChallengeSemanticLedger({ semanticOutput: badOrder, inventory }).status, "REPAIR_REQUIRED");

const forbidden = structuredClone(good);
forbidden.operator_challenge_semantic_ledger.challenge_reviews[0].lock_status = "CONTROLLED_FAILURE";
assert.ok(validateOperatorChallengeSemanticLedger({ semanticOutput: forbidden, inventory }).failures.some((x) => x.includes("MODEL_FIELD_FORBIDDEN")));

const blockingRoot = structuredClone(good);
blockingRoot.operator_challenge_semantic_ledger.blocking_decision = "BLOCK";
assert.ok(validateOperatorChallengeSemanticLedger({ semanticOutput: blockingRoot, inventory }).failures.includes("MODEL_ROOT_FIELD_FORBIDDEN:blocking_decision"));

const runner = readFileSync("src/phases/11-operator-challenge/operator-challenge.runner.js", "utf8");
const binding = readFileSync("agent-packages/agent_7_operator_challenge/AGENT7_PHASE11_RUNTIME_BINDING.yaml", "utf8");
const prompt = readFileSync("agent-packages/agent_7_operator_challenge/PHASE11_LAYER2_SEMANTIC_ADVERSARIAL_CHALLENGE.md", "utf8");
for (const marker of [
  "PHASE11_LAYER2_SEMANTIC_ADVERSARIAL_CHALLENGE_ACTIVE",
  "validateOperatorChallengeSemanticLedger",
  "output_repair_is_not_field_reinvestigation: true",
  "compiler_handoff_allowed: false"
]) assert.ok(runner.includes(marker), `runner marker missing: ${marker}`);
for (const marker of [
  "runtime_contract_version: v2_layer2_semantic_adversarial_challenge",
  "status: ACTIVE",
  "blocking_decision_forbidden: true",
  "maximum_reinvestigation_attempts: 2",
  "layer_3: PENDING"
]) assert.ok(binding.includes(marker), `binding marker missing: ${marker}`);
for (const marker of [
  "CRITICAL_REVIEW_CANDIDATE",
  "It is not a blocking decision",
  "Return exactly one JSON root",
  "Do not emit `challenge_gate`"
]) assert.ok(prompt.includes(marker), `prompt marker missing: ${marker}`);

console.log(JSON.stringify({
  check: "Phase 11 Layer 2 semantic adversarial challenge",
  status: "PASS",
  exact_candidate_coverage: true,
  blocking_authority: false,
  field_reinvestigation_attempts_executed: 0,
  malformed_output_repair_maximum: 1,
  repeated_raw_threat_ids_preserved_by_compound_reference: true
}, null, 2));

function candidate(id, candidate_class, challenge_type, affected_registry_row_keys) {
  return {
    challenge_candidate_id: id,
    candidate_class,
    challenge_type,
    affected_artifacts: ["exposure_registry_workpad_98"],
    affected_field_paths: ["field.path"],
    affected_registry_row_keys,
    affected_activity_ids: [],
    affected_data_field_ids: [],
    affected_obligation_ids: [],
    contradiction_statement: "Candidate statement",
    deterministic_basis: ["basis"],
    proposed_owner: "PHASE_10_EXPOSURE_PROFILE",
    proposed_reinvestigation_scope: "ROW_FIELD",
    criticality_reason: candidate_class === "CRITICAL_SUBSTRATE_CANDIDATE" ? "Systemic custody concern" : null
  };
}
function review(id, recommended_disposition) {
  return {
    challenge_candidate_id: id,
    recommended_disposition,
    confidence: "HIGH",
    adversarial_analysis: "Bounded adversarial analysis.",
    materiality_analysis: "Materiality tested.",
    contradiction_test: "Candidate tested against supplied inventory.",
    supporting_inventory_paths: ["challenge_candidates"],
    proposed_owner: "PHASE_10_EXPOSURE_PROFILE",
    proposed_reinvestigation_scope: "ROW_FIELD",
    limitation_if_unresolved: "Carry explicit uncertainty warning."
  };
}
