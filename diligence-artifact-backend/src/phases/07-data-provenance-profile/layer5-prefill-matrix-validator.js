import { PHASE7_PREFILL_STATUSES } from "./layer5-prefill-status-policy.js";

const FORBIDDEN_KEYS = Object.freeze(["excerpt", "excerpts", "raw_text", "clean_text", "content", "body", "html", "markdown", "text", "final_value", "final_dap_value", "profile_value"]);
const UNRESOLVED_STATUSES = Object.freeze(["NAVIGATION_DEFECT_REPAIR_REQUIRED", "SOURCE_NOT_ROUTED_BY_M6", "NOT_VISIBLE_AFTER_TARGETED_SCAN", "REQUIRES_PRIVATE_CONFIRMATION"]);

export function validatePhase7DeterministicFieldPrefillMatrix(prefillMatrix) {
  const errors = [];
  if (!prefillMatrix || prefillMatrix.artifact_type !== "dap_field_prefill_matrix") errors.push("wrong_prefill_matrix_type");
  if (prefillMatrix?.prefill_policy?.deterministic_only !== true) errors.push("prefill_not_deterministic_only");
  if (prefillMatrix?.prefill_policy?.no_model_calls !== true) errors.push("model_calls_not_forbidden");
  if (prefillMatrix?.prefill_policy?.no_final_dap_profile_values !== true) errors.push("final_values_not_forbidden");
  if (prefillMatrix?.prefill_policy?.no_excerpts !== true) errors.push("excerpts_not_forbidden");
  if (prefillMatrix?.expected_field_count !== prefillMatrix?.actual_field_count) errors.push("field_count_mismatch");
  const rows = prefillMatrix?.prefill_rows || [];
  if (!Array.isArray(rows)) errors.push("prefill_rows_not_array");
  if (rows.length !== 150) errors.push(`prefill_row_count_not_150:${rows.length}`);
  assertNoForbiddenKeys(prefillMatrix, "dap_field_prefill_matrix", errors);
  const ids = new Set();
  for (const row of rows) validateRow(row, ids, errors);
  return Object.freeze({
    status: errors.length ? "REPAIR_REQUIRED" : "PASS",
    checked_rows: rows.length,
    all_fields_represented: rows.length === 150 && ids.size === 150,
    deterministic_rows_do_not_regress_to_unresolved: !errors.some((error) => error.includes("eligible_row_with_atoms_unresolved")),
    no_final_values: !errors.some((error) => error.includes("final") || error.includes("profile_value")),
    no_excerpts: !errors.some((error) => error.includes("excerpt") || error.includes("raw_text") || error.includes("clean_text") || error.includes("content")),
    errors
  });
}

function validateRow(row, ids, errors) {
  if (!row || typeof row !== "object") { errors.push("row_not_object"); return; }
  if (!row.field_id) errors.push("missing_field_id");
  if (ids.has(row.field_id)) errors.push(`duplicate_field_id:${row.field_id}`);
  ids.add(row.field_id);
  if (!PHASE7_PREFILL_STATUSES.includes(row.prefill_candidate_status)) errors.push(`bad_prefill_status:${row.field_id}:${row.prefill_candidate_status}`);
  if (row.prefill_candidate_kind !== "PREFILL_CANDIDATE_ONLY_NOT_FINAL_VALUE") errors.push(`bad_prefill_kind:${row.field_id}`);
  if (!row.model_packet_family) errors.push(`missing_model_packet_family:${row.field_id}`);
  if (!row.limitation_trigger) errors.push(`missing_limitation_trigger:${row.field_id}`);
  if (!row.missing_proof_trigger) errors.push(`missing_missing_proof_trigger:${row.field_id}`);
  if (row.deterministic_prefill_eligible && row.supporting_atom_ids?.length && UNRESOLVED_STATUSES.includes(row.prefill_candidate_status)) errors.push(`eligible_row_with_atoms_unresolved:${row.field_id}`);
  if (row.model_packet_required !== (row.prefill_candidate_status === "MODEL_PACKET_REQUIRED")) errors.push(`model_packet_flag_mismatch:${row.field_id}`);
}

function assertNoForbiddenKeys(value, path, errors) {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) return value.forEach((item, index) => assertNoForbiddenKeys(item, `${path}[${index}]`, errors));
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.includes(key)) errors.push(`forbidden_key:${path}.${key}`);
    if (child && typeof child === "object") assertNoForbiddenKeys(child, `${path}.${key}`, errors);
  }
}
