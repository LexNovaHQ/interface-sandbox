import { createHash } from "node:crypto";

export const OPERATOR_CHALLENGE_SEMANTIC_PACKET_VERSION = "PHASE11_LAYER2_SEMANTIC_PACKET_v1";
export const OPERATOR_CHALLENGE_SEMANTIC_LEDGER_VERSION = "operator_challenge_semantic_ledger.v1";

const RECOMMENDATIONS = new Set(["REJECT", "ADVISORY", "MATERIAL_REINVESTIGATION", "CRITICAL_REVIEW_CANDIDATE"]);
const CONFIDENCE = new Set(["HIGH", "MEDIUM", "LOW"]);
const ROW_FIELDS = new Set([
  "challenge_candidate_id", "recommended_disposition", "confidence",
  "adversarial_analysis", "materiality_analysis", "contradiction_test",
  "supporting_inventory_paths", "proposed_owner", "proposed_reinvestigation_scope",
  "limitation_if_unresolved"
]);

export function buildOperatorChallengeSemanticPacket({ inventory, run = {} } = {}) {
  assertInventory(inventory);
  const candidates = array(inventory.challenge_candidates).map((row) => ({
    challenge_candidate_id: row.challenge_candidate_id,
    candidate_class: row.candidate_class,
    challenge_type: row.challenge_type,
    affected_artifacts: array(row.affected_artifacts),
    affected_field_paths: array(row.affected_field_paths),
    affected_registry_row_keys: array(row.affected_registry_row_keys),
    affected_activity_ids: array(row.affected_activity_ids),
    affected_data_field_ids: array(row.affected_data_field_ids),
    affected_obligation_ids: array(row.affected_obligation_ids),
    contradiction_statement: string(row.contradiction_statement),
    deterministic_basis: array(row.deterministic_basis),
    proposed_owner: string(row.proposed_owner),
    proposed_reinvestigation_scope: string(row.proposed_reinvestigation_scope),
    criticality_reason: row.criticality_reason || null
  }));
  return {
    operator_challenge_semantic_packet: {
      semantic_packet_version: OPERATOR_CHALLENGE_SEMANTIC_PACKET_VERSION,
      run_id: string(run.run_id || inventory.run_id),
      inventory_fingerprint: inventory.inventory_fingerprint,
      candidate_count: candidates.length,
      expected_challenge_candidate_ids: candidates.map((row) => row.challenge_candidate_id),
      blocking_doctrine: {
        blocking_is_exception: true,
        model_may_block_run: false,
        material_defects_route_to_reinvestigation: true,
        maximum_reinvestigation_attempts: 2,
        unresolved_after_two_attempts: "PASS_WITH_LIMITATION_UNLESS_LAYER3_CONFIRMS_CRITICAL_SYSTEMIC_FAILURE"
      },
      candidates,
      semantic_scope: {
        derived_only: true,
        source_search_forbidden: true,
        forensic_inputs_forbidden: true,
        upstream_rewrite_forbidden: true,
        final_adjudication_forbidden: true,
        reinvestigation_execution_forbidden: true
      }
    }
  };
}

export function validateOperatorChallengeSemanticLedger({ semanticOutput, inventory } = {}) {
  assertInventory(inventory);
  const failures = [];
  const rootKeys = semanticOutput && typeof semanticOutput === "object" && !Array.isArray(semanticOutput) ? Object.keys(semanticOutput) : [];
  if (rootKeys.length !== 1 || rootKeys[0] !== "operator_challenge_semantic_ledger") failures.push("MODEL_ROOT_INVALID");
  const ledger = semanticOutput?.operator_challenge_semantic_ledger || {};
  if (ledger.semantic_contract_version !== OPERATOR_CHALLENGE_SEMANTIC_LEDGER_VERSION) failures.push("SEMANTIC_CONTRACT_VERSION_MISMATCH");
  if (ledger.inventory_fingerprint !== inventory.inventory_fingerprint) failures.push("INVENTORY_FINGERPRINT_MISMATCH");
  const expected = array(inventory.challenge_candidates).map((row) => row.challenge_candidate_id);
  if (!sameArray(array(ledger.expected_challenge_candidate_ids), expected)) failures.push("EXPECTED_CANDIDATE_IDS_MISMATCH");
  if (!sameArray(array(ledger.returned_challenge_candidate_ids), expected)) failures.push("RETURNED_CANDIDATE_IDS_MISMATCH");
  const rows = array(ledger.challenge_reviews);
  if (rows.length !== expected.length) failures.push("CHALLENGE_REVIEW_COUNT_MISMATCH");
  const seen = new Set();
  rows.forEach((row, index) => {
    const id = string(row?.challenge_candidate_id);
    if (id !== expected[index]) failures.push(`CHALLENGE_REVIEW_ORDER_MISMATCH:${index}`);
    if (seen.has(id)) failures.push(`DUPLICATE_CHALLENGE_REVIEW:${id}`);
    seen.add(id);
    for (const key of Object.keys(row || {})) if (!ROW_FIELDS.has(key)) failures.push(`MODEL_FIELD_FORBIDDEN:${id}:${key}`);
    if (!RECOMMENDATIONS.has(string(row?.recommended_disposition))) failures.push(`DISPOSITION_INVALID:${id}`);
    if (!CONFIDENCE.has(string(row?.confidence))) failures.push(`CONFIDENCE_INVALID:${id}`);
    for (const field of ["adversarial_analysis", "materiality_analysis", "contradiction_test", "proposed_owner", "proposed_reinvestigation_scope", "limitation_if_unresolved"]) {
      if (typeof row?.[field] !== "string") failures.push(`TEXT_FIELD_INVALID:${id}:${field}`);
    }
    if (!Array.isArray(row?.supporting_inventory_paths)) failures.push(`SUPPORTING_PATHS_INVALID:${id}`);
  });
  for (const forbidden of ["lock_status", "gate", "blocking_decision", "reinvestigation_attempt", "challenge_gate", "upstream_patch"]) {
    if (Object.prototype.hasOwnProperty.call(ledger, forbidden)) failures.push(`MODEL_ROOT_FIELD_FORBIDDEN:${forbidden}`);
  }
  return {
    status: failures.length ? "REPAIR_REQUIRED" : "PASS",
    failures,
    exact_candidate_coverage: failures.length === 0,
    semantic_ledger: failures.length ? null : {
      ...ledger,
      schema_version: OPERATOR_CHALLENGE_SEMANTIC_LEDGER_VERSION,
      semantic_output_fingerprint: sha(ledger),
      authoritative: false,
      final_adjudication_performed: false,
      blocking_decision_made: false,
      reinvestigation_attempted: false
    }
  };
}

function assertInventory(inventory) {
  if (!inventory || inventory.schema_version !== "operator_challenge_inventory.v1") throw new Error("PHASE11_LAYER2_INVENTORY_INVALID");
  if (!inventory.inventory_fingerprint) throw new Error("PHASE11_LAYER2_INVENTORY_FINGERPRINT_MISSING");
  if (!Array.isArray(inventory.challenge_candidates)) throw new Error("PHASE11_LAYER2_CANDIDATES_MISSING");
}
function array(value) { return Array.isArray(value) ? value : []; }
function string(value) { return String(value || "").trim(); }
function sameArray(a, b) { return a.length === b.length && a.every((value, index) => value === b[index]); }
function sha(value) { return createHash("sha256").update(JSON.stringify(value)).digest("hex"); }
