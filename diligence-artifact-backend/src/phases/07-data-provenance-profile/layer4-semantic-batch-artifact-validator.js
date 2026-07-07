const FORBIDDEN_ROOTS = Object.freeze([
  "data_provenance_profile",
  "data_provenance_profile_forensics",
  "integrated_dap_report",
  "data_privacy_public_report_projection",
  "exposure_registry_profile",
  "challenge_gate",
  "final_output_handoff"
]);

const ALLOWED_STATUSES = Object.freeze([
  "SEMANTIC_RESOLVED_WITH_BOUNDED_SUPPORT",
  "SEMANTIC_RESOLVED_WITH_LIMITATION",
  "SEMANTIC_MISSING_PROOF_REQUIRED",
  "SEMANTIC_PRIVATE_CONFIRMATION_REQUIRED",
  "SEMANTIC_CONFLICT_REQUIRES_REVIEW",
  "DETERMINISTIC_SOURCE_FACT_CARRIED"
]);

const FORBIDDEN_TEXT_PATTERNS = Object.freeze([
  /\bcompliant\b/i,
  /\bnon[- ]?compliant\b/i,
  /\bviolat(?:e|es|ed|ion)\b/i,
  /\bunlawful\b/i,
  /\billegal\b/i,
  /\blawful\b/i,
  /\badequate\b/i,
  /\bsufficient\b/i,
  /\bapplies\b/i
]);

export function validatePhase7Layer4SemanticBatchArtifact(batchArtifactRoot, { routePacket } = {}) {
  const errors = [];
  if (!routePacket) errors.push("missing_route_packet");
  const expectedRoot = routePacket?.expected_artifact_name;
  const batchArtifact = expectedRoot ? batchArtifactRoot?.[expectedRoot] : null;
  if (!expectedRoot) errors.push("missing_expected_artifact_name");
  if (!batchArtifact) errors.push(`missing_expected_batch_root:${expectedRoot || "UNKNOWN"}`);
  for (const root of FORBIDDEN_ROOTS) if (root in (batchArtifactRoot || {})) errors.push(`forbidden_root:${root}`);
  if (!batchArtifact) return result(errors, 0);
  if (batchArtifact.batch_id !== routePacket.batch_id) errors.push(`batch_id_mismatch:${batchArtifact.batch_id}:${routePacket.batch_id}`);
  if (!arraysEqualAsSets(batchArtifact.families || [], routePacket.families || [])) errors.push(`families_mismatch:${routePacket.batch_id}`);
  const returned = normalizeIds(batchArtifact.returned_field_ids || []);
  const expected = normalizeIds(routePacket.expected_field_ids || []);
  if (!arraysEqualAsSets(returned, expected)) errors.push(`returned_field_ids_mismatch:${routePacket.batch_id}`);
  const rows = Array.isArray(batchArtifact.field_rows) ? batchArtifact.field_rows : [];
  if (rows.length !== expected.length) errors.push(`field_rows_count_mismatch:${rows.length}:${expected.length}`);
  const routeIds = new Set([...(routePacket.required_d_family_route_ids || []), ...(routePacket.selective_l_family_route_ids || [])]);
  for (const row of rows) validateRow({ row, expected, routeIds, routePacket, errors });
  scanForbiddenText(batchArtifact, "batch_artifact", errors);
  return result(errors, rows.length);
}

function validateRow({ row, expected, routeIds, routePacket, errors }) {
  const fieldId = String(row?.field_id || "");
  if (!fieldId) errors.push(`row_missing_field_id:${routePacket.batch_id}`);
  if (fieldId && !expected.includes(fieldId)) errors.push(`unexpected_field_id:${routePacket.batch_id}:${fieldId}`);
  if (!ALLOWED_STATUSES.includes(row?.semantic_resolution_status)) errors.push(`bad_semantic_status:${fieldId || "UNKNOWN"}:${row?.semantic_resolution_status || "MISSING"}`);
  if (!Array.isArray(row?.basis_route_ids) || !row.basis_route_ids.length) errors.push(`missing_basis_route_ids:${fieldId || "UNKNOWN"}`);
  for (const routeId of row?.basis_route_ids || []) if (!routeIds.has(routeId)) errors.push(`basis_route_not_in_route_packet:${fieldId}:${routeId}`);
  if (typeof row?.structured_candidate === "undefined") errors.push(`missing_structured_candidate:${fieldId || "UNKNOWN"}`);
  if (!String(row?.reasoning_summary || "").trim()) errors.push(`missing_reasoning_summary:${fieldId || "UNKNOWN"}`);
  if (row?.forbidden_inference_check !== "PASS") errors.push(`forbidden_inference_check_not_pass:${fieldId || "UNKNOWN"}`);
}

function scanForbiddenText(value, path, errors) {
  if (typeof value === "string") {
    for (const pattern of FORBIDDEN_TEXT_PATTERNS) if (pattern.test(value)) errors.push(`forbidden_text:${path}`);
    return;
  }
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) return value.forEach((item, index) => scanForbiddenText(item, `${path}[${index}]`, errors));
  for (const [key, child] of Object.entries(value)) scanForbiddenText(child, `${path}.${key}`, errors);
}

function normalizeIds(ids) {
  return ids.map((id) => String(id || "").trim()).filter(Boolean).sort();
}

function arraysEqualAsSets(a, b) {
  const left = normalizeIds(a);
  const right = normalizeIds(b);
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function result(errors, checkedRows) {
  return Object.freeze({ status: errors.length ? "REPAIR_REQUIRED" : "PASS", checked_rows: checkedRows, errors: Object.freeze(errors) });
}
