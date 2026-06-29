const REQUIRED_ROOT = "legal_cartography_semantic_profile";

const REQUIRED_ARRAYS = Object.freeze([
  "artifact_inventory_labels",
  "macro_unit_semantic_labels",
  "notice_semantic_labels",
  "control_language_location_labels",
  "indemnity_location_labels",
  "cross_reference_semantic_labels",
  "absence_access_semantic_interpretation",
  "document_route_relevance_map",
  "substitute_control_map",
  "semantic_repair_queue"
]);

const REQUIRED_RULES = Object.freeze([
  "m9_semantic_layer_only",
  "registry_aware_not_registry_evaluative",
  "legal_advice_forbidden",
  "new_url_discovery_forbidden",
  "full_legal_text_copy_forbidden",
  "use_only_loaded_legal_corpus",
  "deterministic_map_is_source_of_pointers",
  "semantic_rows_must_attach_to_deterministic_ids",
  "reinvestigation_before_blocking"
]);

const ALLOWED_SUBCATS = new Set(["CNS", "LIA", "HAL", "INF", "PRV", "BIO", "DEC", "HRM", "FRD", "TRD"]);
const ALLOWED_CONTROL_FAMILIES = new Set([
  "FORMATION_CONTRACT",
  "ACTIVITY_SPECIFIC_DISCLOSURE",
  "DATA_PRIVACY",
  "VENDORS_TRANSFER",
  "SECURITY",
  "USE_SAFETY",
  "AGENT_AUTHORITY",
  "IP_CONTENT",
  "COMMERCIAL_LEGAL_ALLOCATION",
  "CONTACT_ROUTES",
  "INDEMNITY",
  "UNKNOWN_CONTROL_LANGUAGE"
]);
const ALLOWED_DOC_ROUTES = new Set([
  "DOC_TOS",
  "DOC_AUP",
  "DOC_DPA",
  "DOC_AGT",
  "DOC_DPIA",
  "DOC_SOP",
  "DOC_HND",
  "DOC_IP",
  "DOC_SLA",
  "DOC_PP",
  "DOC_SECURITY",
  "DOC_SUBPROCESSOR",
  "DOC_COOKIE",
  "DOC_NOTICE",
  "DOC_UNKNOWN"
]);
const ALLOWED_CONFIDENCE = new Set(["CLEAR", "PARTIAL", "UNCLEAR", "THIN", "REINVESTIGATE"]);
const ALLOWED_POSTURE = new Set(["VISIBLE_CONTROL", "PARTIAL_CONTROL", "SUBSTITUTE_CONTROL", "REFERENCE_ONLY", "ABSENCE_SIGNAL", "UNCLEAR_CONTROL", "NO_CONTROL_LABEL"]);
const ALLOWED_TREATMENT = new Set(["USE_AS_NAVIGATION", "REVIEW_WITH_LIMITATION", "CHECK_SUBSTITUTE_LOCATIONS", "CARRY_PUBLIC_FOOTPRINT_LIMITATION", "DO_NOT_USE_WITHOUT_REPAIR"]);
const ALLOWED_LOCK_STATUS = new Set(["LOCKED", "LOCKED_WITH_LIMITATIONS", "REPAIR_REQUIRED", "CONTROLLED_FAILURE"]);

const FORBIDDEN_KEYS = Object.freeze([
  "legal_cartography_index",
  "target_profile",
  "target_feature_profile",
  "data_provenance_profile",
  "exposure_registry_profile",
  "challenge_gate",
  "final_output_handoff",
  "renderer_payload"
]);

const FORBIDDEN_STRINGS = Object.freeze([
  "is compliant",
  "is non-compliant",
  "legally sufficient",
  "legally adequate",
  "enforceable",
  "unenforceable",
  "liability finding",
  "final legal opinion",
  "redline instruction"
]);

export function validateM9SemanticProfile(rawOutput, deterministicMapWrapper = {}) {
  const errors = [];
  const warnings = [];
  const output = unwrap(rawOutput);
  const profile = output?.[REQUIRED_ROOT];

  if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
    errors.push(`Missing required root ${REQUIRED_ROOT}.`);
    return result(errors, warnings);
  }

  for (const key of Object.keys(output)) {
    if (key !== REQUIRED_ROOT) errors.push(`Unexpected top-level key: ${key}.`);
  }

  for (const key of REQUIRED_ARRAYS) {
    if (!Array.isArray(profile[key])) errors.push(`${REQUIRED_ROOT}.${key} must be an array.`);
  }

  if (!ALLOWED_LOCK_STATUS.has(profile.lock_status)) errors.push("Invalid or missing semantic lock_status.");
  if (!ALLOWED_LOCK_STATUS.has(profile.status)) warnings.push("Invalid or missing semantic status; compiler may carry limitation.");

  const rules = profile.downstream_rules || {};
  for (const key of REQUIRED_RULES) {
    if (rules[key] !== true) errors.push(`Missing downstream rule: ${key}=true.`);
  }

  const deterministicIds = collectDeterministicIds(deterministicMapWrapper);
  validatePointerAttachment(profile, deterministicIds, errors, warnings);
  validateVocabulary(profile, errors, warnings);
  validateForbiddenContent(profile, errors);
  validateIntegritySummary(profile, warnings);

  return result(errors, warnings);
}

function validatePointerAttachment(profile, deterministicIds, errors, warnings) {
  const checks = [
    ["artifact_inventory_labels", ["artifact_id", "document_id"]],
    ["macro_unit_semantic_labels", ["unit_id", "section_id", "document_id"]],
    ["notice_semantic_labels", ["notice_id", "artifact_reference", "unit_reference"]],
    ["control_language_location_labels", ["control_candidate_id", "control_reference_id", "section_id", "unit_id", "document_id"]],
    ["indemnity_location_labels", ["indemnity_candidate_id", "section_id", "document_id"]],
    ["cross_reference_semantic_labels", ["cross_reference_id", "from_document_id", "from_unit_id"]],
    ["absence_access_semantic_interpretation", ["absence_id"]],
    ["document_route_relevance_map", ["slot_id"]],
    ["substitute_control_map", ["missing_or_limited_item_ref", "expected_document_route"]]
  ];

  for (const [arrayName, fields] of checks) {
    for (const [index, row] of asArray(profile[arrayName]).entries()) {
      const candidates = fields.map((field) => row?.[field]).filter(Boolean);
      if (!candidates.length) {
        errors.push(`${arrayName}[${index}] has no deterministic pointer field.`);
        continue;
      }
      if (!candidates.some((value) => deterministicIds.has(String(value)))) {
        warnings.push(`${arrayName}[${index}] pointer not found in deterministic map; compiler should reject or quarantine.`);
      }
    }
  }
}

function validateVocabulary(profile, errors, warnings) {
  for (const [arrayName, row] of allRows(profile)) {
    for (const value of asArray(row.registry_subcat_relevance)) if (!ALLOWED_SUBCATS.has(value)) errors.push(`${arrayName} has invalid registry_subcat_relevance: ${value}.`);
    for (const value of asArray(row.document_route_relevance)) if (!ALLOWED_DOC_ROUTES.has(value)) errors.push(`${arrayName} has invalid document_route_relevance: ${value}.`);
    if (row.expected_document_route && !ALLOWED_DOC_ROUTES.has(row.expected_document_route)) errors.push(`${arrayName} has invalid expected_document_route: ${row.expected_document_route}.`);
    if (row.expected_core_document_slot && !ALLOWED_DOC_ROUTES.has(row.expected_core_document_slot)) errors.push(`${arrayName} has invalid expected_core_document_slot: ${row.expected_core_document_slot}.`);
    if (row.slot_id && !ALLOWED_DOC_ROUTES.has(row.slot_id)) warnings.push(`${arrayName} has non-route slot_id: ${row.slot_id}.`);
    if (row.control_language_family && !ALLOWED_CONTROL_FAMILIES.has(row.control_language_family)) errors.push(`${arrayName} has invalid control_language_family: ${row.control_language_family}.`);
    for (const value of asArray(row.related_control_language_family)) if (!ALLOWED_CONTROL_FAMILIES.has(value)) errors.push(`${arrayName} has invalid related_control_language_family: ${value}.`);
    if (row.confidence && !ALLOWED_CONFIDENCE.has(row.confidence)) errors.push(`${arrayName} has invalid confidence: ${row.confidence}.`);
    if (row.classification_confidence && !ALLOWED_CONFIDENCE.has(row.classification_confidence)) errors.push(`${arrayName} has invalid classification_confidence: ${row.classification_confidence}.`);
    if (row.visible_control_posture && !ALLOWED_POSTURE.has(row.visible_control_posture)) errors.push(`${arrayName} has invalid visible_control_posture: ${row.visible_control_posture}.`);
    if (row.substitute_control_signal && !ALLOWED_POSTURE.has(row.substitute_control_signal)) errors.push(`${arrayName} has invalid substitute_control_signal: ${row.substitute_control_signal}.`);
    if (row.downstream_treatment && !ALLOWED_TREATMENT.has(row.downstream_treatment)) errors.push(`${arrayName} has invalid downstream_treatment: ${row.downstream_treatment}.`);
  }
}

function validateForbiddenContent(profile, errors) {
  const json = JSON.stringify(profile).toLowerCase();
  for (const key of FORBIDDEN_KEYS) {
    if (Object.prototype.hasOwnProperty.call(profile, key)) errors.push(`Forbidden key inside semantic profile: ${key}.`);
  }
  for (const phrase of FORBIDDEN_STRINGS) {
    if (json.includes(phrase)) errors.push(`Forbidden semantic conclusion phrase: ${phrase}.`);
  }
}

function validateIntegritySummary(profile, warnings) {
  const summary = profile.semantic_integrity_summary || {};
  if (summary.full_text_copied === true) warnings.push("semantic_integrity_summary.full_text_copied is true; compiler must reject or repair.");
  if (summary.new_sources_created === true) warnings.push("semantic_integrity_summary.new_sources_created is true; compiler must reject or repair.");
  if (summary.ready_for_compiler === false) warnings.push("semantic profile is not ready_for_compiler.");
}

function collectDeterministicIds(wrapper) {
  const map = unwrap(wrapper)?.legal_cartography_deterministic_map || unwrap(wrapper) || {};
  const ids = new Set();
  const fields = ["document_id", "artifact_id", "unit_id", "section_id", "embedded_unit_id", "reference_id", "cross_reference_id", "missing_id", "absence_id", "slot_id", "control_candidate_id", "indemnity_candidate_id", "notice_id"];
  const arrays = ["document_map", "artifact_inventory_map", "section_map", "macro_unit_map", "embedded_unit_map", "referenced_document_map", "cross_document_reference_map", "missing_source_map", "artifact_absence_access_map", "core_document_stack_slots", "control_language_candidate_map", "indemnity_candidate_map", "notice_candidate_map"];
  for (const arrayName of arrays) {
    for (const row of asArray(map[arrayName])) {
      for (const field of fields) if (row?.[field]) ids.add(String(row[field]));
    }
  }
  return ids;
}

function* allRows(profile) {
  for (const key of REQUIRED_ARRAYS) for (const row of asArray(profile[key])) yield [key, row || {}];
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
  return {
    ok: errors.length === 0,
    errors,
    warnings,
    status: errors.length ? "REPAIR_REQUIRED" : warnings.length ? "LOCKED_WITH_LIMITATIONS" : "LOCKED"
  };
}
