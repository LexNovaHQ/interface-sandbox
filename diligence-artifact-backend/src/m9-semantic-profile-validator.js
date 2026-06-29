const REQUIRED_ROOT = "legal_cartography_semantic_profile";
const MIN_QUEUE_COVERAGE = 0.8;

const REQUIRED_ARRAYS = Object.freeze([
  "document_labels",
  "unit_subcat_labels",
  "control_family_labels",
  "indemnity_labels",
  "cross_reference_labels",
  "missing_source_labels",
  "semantic_repair_queue"
]);

const REQUIRED_RULES = Object.freeze([
  "m9_semantic_layer_only",
  "legal_stack_labels_only",
  "registry_aware_not_registry_evaluative",
  "post_m9_action_routes_forbidden",
  "new_source_fetch_forbidden",
  "full_legal_text_copy_forbidden",
  "use_only_loaded_legal_corpus",
  "deterministic_map_is_source_of_pointers",
  "semantic_rows_must_attach_to_deterministic_ids",
  "coverage_gate_required"
]);

const ALLOWED_SUBCATS = new Set(["CNS", "LIA", "HAL", "INF", "PRV", "BIO", "DEC", "HRM", "FRD", "TRD"]);
const ALLOWED_CONTROL_FAMILIES = new Set(["FORMATION_CONTRACT", "ACTIVITY_SPECIFIC_DISCLOSURE", "DATA_PRIVACY", "VENDORS_TRANSFER", "SECURITY", "USE_SAFETY", "AGENT_AUTHORITY", "IP_CONTENT", "COMMERCIAL_LEGAL_ALLOCATION", "CONTACT_ROUTES", "INDEMNITY", "UNKNOWN_CONTROL_LANGUAGE"]);
const ALLOWED_CONFIDENCE = new Set(["CLEAR", "PARTIAL", "UNCLEAR", "THIN", "REINVESTIGATE"]);
const ALLOWED_UNIT_STATUS = new Set(["LOCKED", "LOCKED_WITH_LIMITATIONS", "REPAIR_REQUIRED"]);
const ALLOWED_TREATMENT = new Set(["USE_AS_NAVIGATION", "REVIEW_WITH_LIMITATION", "DO_NOT_USE_WITHOUT_REPAIR"]);
const ALLOWED_LOCK_STATUS = new Set(["LOCKED", "LOCKED_WITH_LIMITATIONS", "REPAIR_REQUIRED", "CONTROLLED_FAILURE"]);

const FORBIDDEN_KEYS = Object.freeze([
  "legal_cartography_index",
  "target_profile",
  "target_feature_profile",
  "data_provenance_profile",
  "exposure_registry_profile",
  "challenge_gate",
  "final_output_handoff",
  "renderer_payload",
  "document_route_relevance",
  "document_route_relevance_map",
  "substitute_control_map",
  "expected_document_route",
  "expected_core_document_slot",
  "fix_route",
  "fix_document"
]);

export function validateM9SemanticProfile(rawOutput, deterministicMapWrapper = {}) {
  const errors = [];
  const warnings = [];
  const output = unwrap(rawOutput);
  const profile = output?.[REQUIRED_ROOT];
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) return result([`Missing required root ${REQUIRED_ROOT}.`], warnings);

  for (const key of Object.keys(output)) if (key !== REQUIRED_ROOT) errors.push(`Unexpected top-level key: ${key}.`);
  for (const key of REQUIRED_ARRAYS) if (!Array.isArray(profile[key])) errors.push(`${REQUIRED_ROOT}.${key} must be an array.`);
  if (!profile.semantic_integrity_summary || typeof profile.semantic_integrity_summary !== "object" || Array.isArray(profile.semantic_integrity_summary)) errors.push("semantic_integrity_summary must be an object.");
  if (!ALLOWED_LOCK_STATUS.has(profile.lock_status)) errors.push("Invalid or missing semantic lock_status.");
  if (!ALLOWED_LOCK_STATUS.has(profile.status)) warnings.push("Invalid or missing semantic status; compiler may carry limitation.");

  const rules = profile.downstream_rules || {};
  for (const key of REQUIRED_RULES) if (rules[key] !== true) errors.push(`Missing downstream rule: ${key}=true.`);

  const deterministic = collectDeterministicIds(deterministicMapWrapper);
  validatePointerAttachment(profile, deterministic, errors, warnings);
  validateCoverage(profile, deterministic, errors, warnings);
  validateVocabulary(profile, errors);
  validateForbiddenKeys(profile, errors);

  return result(errors, warnings);
}

function validatePointerAttachment(profile, deterministic, errors, warnings) {
  const checks = [
    ["document_labels", ["document_id", "artifact_id"]],
    ["unit_subcat_labels", ["unit_id", "section_id"]],
    ["control_family_labels", ["control_candidate_id"]],
    ["indemnity_labels", ["indemnity_candidate_id"]],
    ["cross_reference_labels", ["cross_reference_id"]],
    ["missing_source_labels", ["missing_id", "absence_id"]]
  ];
  for (const [arrayName, fields] of checks) {
    for (const [index, row] of asArray(profile[arrayName]).entries()) {
      const candidates = fields.map((field) => row?.[field]).filter(Boolean).map(String);
      if (!candidates.length) {
        errors.push(`${arrayName}[${index}] has no deterministic pointer field.`);
        continue;
      }
      if (!candidates.some((value) => deterministic.all.has(value))) warnings.push(`${arrayName}[${index}] pointer not found in deterministic map.`);
    }
  }
}

function validateCoverage(profile, deterministic, errors, warnings) {
  const summary = profile.semantic_integrity_summary || {};
  const documentIds = new Set(asArray(profile.document_labels).map((row) => String(row.document_id || row.artifact_id || "")).filter(Boolean));
  const unitIds = new Set(asArray(profile.unit_subcat_labels).map((row) => String(row.unit_id || row.section_id || "")).filter(Boolean));
  const controlIds = new Set(asArray(profile.control_family_labels).map((row) => String(row.control_candidate_id || "")).filter(Boolean));

  if (summary.semantic_queue_total !== deterministic.queueIds.size) errors.push("semantic_integrity_summary.semantic_queue_total does not match semantic_label_queue count.");
  if (summary.semantic_queue_required_total !== deterministic.requiredQueueUnitIds.size) errors.push("semantic_integrity_summary.semantic_queue_required_total does not match required semantic queue count.");
  if (summary.semantic_required_units_labeled !== countIntersection(unitIds, deterministic.requiredQueueUnitIds)) errors.push("semantic_integrity_summary.semantic_required_units_labeled does not match required queue labels.");
  if (summary.semantic_required_controls_total !== deterministic.requiredControlIds.size) errors.push("semantic_integrity_summary.semantic_required_controls_total does not match required control count.");
  if (summary.semantic_required_controls_labeled !== countIntersection(controlIds, deterministic.requiredControlIds)) errors.push("semantic_integrity_summary.semantic_required_controls_labeled does not match required control labels.");

  for (const id of deterministic.documentIds) if (!documentIds.has(id)) errors.push(`Missing semantic document label for ${id}.`);

  const requiredTotal = deterministic.requiredQueueUnitIds.size + deterministic.requiredControlIds.size;
  const labeledTotal = countIntersection(unitIds, deterministic.requiredQueueUnitIds) + countIntersection(controlIds, deterministic.requiredControlIds);
  const coverageRatio = requiredTotal ? labeledTotal / requiredTotal : 1;
  const reportedRatio = Number(summary.semantic_required_coverage_ratio);

  if (Math.abs(reportedRatio - coverageRatio) > 0.01) errors.push("semantic_integrity_summary.semantic_required_coverage_ratio does not match computed queue coverage.");
  if (coverageRatio < MIN_QUEUE_COVERAGE) errors.push(`semantic required queue coverage below ${MIN_QUEUE_COVERAGE}.`);
  if (summary.ready_for_compiler !== true && coverageRatio >= MIN_QUEUE_COVERAGE) warnings.push("ready_for_compiler is false despite passing queue coverage threshold.");
  if (summary.ready_for_compiler === true && coverageRatio < MIN_QUEUE_COVERAGE) errors.push("ready_for_compiler cannot be true below queue coverage threshold.");
  if (summary.full_text_copied === true) errors.push("semantic_integrity_summary.full_text_copied must be false.");
  if (summary.new_sources_created === true) errors.push("semantic_integrity_summary.new_sources_created must be false.");
  if (deterministic.requiredQueueUnitIds.size === 0) warnings.push("Deterministic semantic_label_queue has no required P0/P1 units.");
}

function validateVocabulary(profile, errors) {
  for (const [arrayName, row] of allRows(profile)) {
    for (const value of asArray(row.registry_subcat_relevance)) if (!ALLOWED_SUBCATS.has(value)) errors.push(`${arrayName} invalid registry_subcat_relevance: ${value}.`);
    for (const value of asArray(row.control_language_family)) if (!ALLOWED_CONTROL_FAMILIES.has(value)) errors.push(`${arrayName} invalid control_language_family: ${value}.`);
    if (row.confidence && !ALLOWED_CONFIDENCE.has(row.confidence)) errors.push(`${arrayName} invalid confidence: ${row.confidence}.`);
    if (row.unit_semantic_status && !ALLOWED_UNIT_STATUS.has(row.unit_semantic_status)) errors.push(`${arrayName} invalid unit_semantic_status: ${row.unit_semantic_status}.`);
    if (row.downstream_treatment && !ALLOWED_TREATMENT.has(row.downstream_treatment)) errors.push(`${arrayName} invalid downstream_treatment: ${row.downstream_treatment}.`);
  }
}

function validateForbiddenKeys(profile, errors) {
  for (const key of FORBIDDEN_KEYS) if (containsKey(profile, key)) errors.push(`Forbidden key inside semantic profile: ${key}.`);
}

function collectDeterministicIds(wrapper) {
  const map = unwrap(wrapper)?.legal_cartography_deterministic_map || unwrap(wrapper) || {};
  const out = { all: new Set(), documentIds: new Set(), queueIds: new Set(), requiredQueueUnitIds: new Set(), requiredControlIds: new Set() };

  for (const row of asArray(map.document_map)) add(out, "documentIds", row.document_id || row.artifact_id);
  for (const row of asArray(map.macro_unit_map)) {
    add(out, "all", row.unit_id || row.section_id);
    if (row.document_id) out.all.add(String(row.document_id));
  }
  for (const row of asArray(map.semantic_label_queue)) {
    const queueId = row.queue_id;
    const unitId = row.unit_id || row.section_id;
    add(out, "queueIds", queueId);
    if (unitId) out.all.add(String(unitId));
    if (isRequiredQueueRow(row) && unitId) out.requiredQueueUnitIds.add(String(unitId));
  }
  for (const row of asArray(map.control_language_candidate_map)) {
    add(out, "all", row.control_candidate_id);
    if (row.unit_id && out.requiredQueueUnitIds.has(String(row.unit_id)) && row.control_candidate_id) out.requiredControlIds.add(String(row.control_candidate_id));
  }
  for (const arrayName of ["artifact_inventory_map", "legal_document_index", "embedded_unit_map", "notice_candidate_map", "indemnity_candidate_map", "cross_document_reference_map", "artifact_absence_access_map", "missing_source_map"]) {
    for (const row of asArray(map[arrayName])) {
      for (const key of ["document_id", "artifact_id", "unit_id", "section_id", "embedded_unit_id", "notice_id", "indemnity_candidate_id", "cross_reference_id", "absence_id", "missing_id"]) if (row?.[key]) out.all.add(String(row[key]));
    }
  }
  return out;
}

function isRequiredQueueRow(row) {
  return row?.semantic_label_required === true || ["P0", "P1"].includes(row?.priority);
}

function countIntersection(actual, expected) {
  let count = 0;
  for (const value of expected) if (actual.has(value)) count += 1;
  return count;
}

function add(out, bucket, value) {
  if (!value) return;
  const id = String(value);
  if (bucket === "all") out.all.add(id);
  else out[bucket].add(id);
  out.all.add(id);
}

function* allRows(profile) {
  for (const key of REQUIRED_ARRAYS) for (const row of asArray(profile[key])) yield [key, row || {}];
}

function containsKey(value, key) {
  if (!value || typeof value !== "object") return false;
  if (Object.prototype.hasOwnProperty.call(value, key)) return true;
  if (Array.isArray(value)) return value.some((item) => containsKey(item, key));
  return Object.values(value).some((item) => containsKey(item, key));
}

function unwrap(value) {
  if (!value || typeof value !== "object") return value;
  if (value.artifact && typeof value.artifact === "object") return value.artifact;
  return value;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function result(errors, warnings) {
  return { ok: errors.length === 0, errors, warnings, status: errors.length ? "REPAIR_REQUIRED" : warnings.length ? "LOCKED_WITH_LIMITATIONS" : "LOCKED" };
}
