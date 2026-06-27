const TFP = "target_" + "feature_profile";
const TFPF = TFP + "_forensics";
const MATERIAL_TOP_LEVEL_KEYS = Object.freeze([TFP]);
const FORENSIC_TOP_LEVEL_KEYS = Object.freeze([TFPF]);
const ACTIVITY_FIELDS = Object.freeze(["activity_reference", "product_service_wrapper", "activity_feature_name", "activity_candidate_summary", "mechanics_proof", "autonomy_human_control_signal", "data_content_object_touched", "external_internal_action_signal", "archetype_codes", "archetype_proof", "surface_context_tokens", "surface_proof_and_routing_limits"]);
const ARCHETYPE_CODES = Object.freeze(["UNI", "DOE", "JDG", "CMP", "CRT", "RDR", "ORC", "TRN", "SHD", "OPT", "MOV"]);
const SURFACE_TOKENS = Object.freeze(["Consumer-Public", "Enterprise-Private", "PII", "Employment", "Sensitive/Biometric", "Financial", "Content&IP", "Safety&Physical", "Infrastructure", "Minors"]);
const FORENSIC_BRANCHES = Object.freeze(["product_activity_source_route_coverage_ledger", "product_activity_extraction_capsule_summary", "candidate_admission_and_omission_ledger", "selected_pa_field_derivation_ledger", "activity_mechanics_derivation_ledger", "archetype_derivation_ledger", "surface_token_derivation_ledger", "targeted_re_extraction_ledger", "activity_limitations_ledger", "cross_route_use_ledger", "validation_quality_control_result", "runtime_trace_m8_only", "forensic_boundary"]);
const REQUIRED_NON_EMPTY_FORENSIC_ARRAYS = Object.freeze(["product_activity_source_route_coverage_ledger", "product_activity_extraction_capsule_summary", "candidate_admission_and_omission_ledger"]);
const MATERIAL_FORBIDDEN_KEYS = Object.freeze(["validation_status", "lock_status", "status", "primary_source_refs", "primary_source_urls", "source_ref", "source_refs", "source_url", "source_urls", "evidence_refs", "evidence_basis", "confidence", "activity_evidence", "matched_evidence", "surface_evidence", "profile_meta", "activity_inventory", "activity_mechanics", "vertical_behavior_classification", "surface_context_classification", "registry_routing_substrate", "activity_limitations", "public_evidence_basis", "mechanics_evidence_basis", "route_coverage_rows", "extraction_fragments", "validation_logs", "compatibility_wrappers", TFPF, "archetype_derivation_ledger", "surface_token_derivation_ledger", "runtime_trace", "source_ledger", "scratchpad", "debug"]);
const FORENSIC_FORBIDDEN_KEYS = Object.freeze([TFP]);
const STALE_STRINGS = Object.freeze(["<phase_output", "</phase_output>", "agent_2_target_feature", "AGENT2_RUNTIME_BINDING_PACKET", "bucket_handoff", "discovered_route_inventory", "route_execution_ledger", "source_coverage_gates", "missing_limited_primary_sources"]);
const TRIGGERED_RESULTS = new Set(["TRIGGERED", "TRIGGERED_WITH_LIMITATION"]);
const CONDITION_RESULTS = new Set(["TRUE", "FALSE", "NOT_EVIDENCED"]);
const LIMITATION_PATTERN = /LIMIT|WEAK|MISSING|THIN|CONFLICT|NOT_FOUND|NOT_PUBLIC|OMISSION/i;

export function validateM8TargetFeatureOutput(output, { phase = "M8_TARGET_FEATURE_PROFILE" } = {}) {
  const failures = [];
  if (phase === "M8_TARGET_FEATURE_PROFILE") {
    validateExactTopLevelKeys(output, MATERIAL_TOP_LEVEL_KEYS, failures, phase);
    if (!failures.length) {
      validateProfile(output[TFP], failures);
      for (const stale of STALE_STRINGS) if (deepContains(output, stale)) failures.push(`stale or forbidden string present: ${stale}`);
    }
  } else if (phase === "M8_TARGET_FEATURE_PROFILE_FORENSICS") {
    validateExactTopLevelKeys(output, FORENSIC_TOP_LEVEL_KEYS, failures, phase);
    if (!failures.length) {
      validateForensics(output[TFPF], failures);
      for (const stale of STALE_STRINGS) if (deepContains(output, stale)) failures.push(`stale or forbidden string present: ${stale}`);
    }
  } else {
    failures.push(`M8_UNKNOWN_PHASE:${phase}`);
  }
  if (failures.length) throw new Error(`M8_TARGET_FEATURE_PROFILE_VALIDATION_FAILED:${JSON.stringify({ phase, failures })}`);
}

function validateProfile(profile, failures) {
  if (!isPlainObject(profile)) return failures.push(`${TFP} must be object`);
  rejectKeyDiff(Object.keys(profile).sort(), ["activities", "profile_level_limitations"].sort(), TFP, failures);
  if (!Array.isArray(profile.activities)) failures.push(`${TFP}.activities must be array`);
  if (!Array.isArray(profile.profile_level_limitations)) failures.push(`${TFP}.profile_level_limitations must be array`);
  if (containsAnyKey(profile, MATERIAL_FORBIDDEN_KEYS)) failures.push(`${TFP} contains forbidden material/provenance/status key`);
  const activities = Array.isArray(profile.activities) ? profile.activities : [];
  if (!activities.length && Array.isArray(profile.profile_level_limitations) && !profile.profile_level_limitations.length) failures.push("empty activities[] requires profile_level_limitations[]");
  activities.forEach((activity, index) => validateActivity(activity, index, failures));
}

function validateActivity(activity, index, failures) {
  const path = `${TFP}.activities[${index}]`;
  if (!isPlainObject(activity)) return failures.push(`${path} must be object`);
  rejectKeyDiff(Object.keys(activity).sort(), [...ACTIVITY_FIELDS].sort(), path, failures);
  for (const field of ACTIVITY_FIELDS) {
    if (field === "archetype_codes" || field === "surface_context_tokens") continue;
    if (!(typeof activity[field] === "string" && activity[field].trim())) failures.push(`${path}.${field} must be non-empty string`);
  }
  if (!Array.isArray(activity.archetype_codes) || !activity.archetype_codes.length) failures.push(`${path}.archetype_codes must be non-empty array`);
  if (!Array.isArray(activity.surface_context_tokens)) failures.push(`${path}.surface_context_tokens must be array`);
  for (const code of activity.archetype_codes || []) if (!ARCHETYPE_CODES.includes(code)) failures.push(`${path}.archetype_codes invalid code: ${code}`);
  for (const token of activity.surface_context_tokens || []) if (!SURFACE_TOKENS.includes(token)) failures.push(`${path}.surface_context_tokens invalid token: ${token}`);
  if (containsAnyKey(activity, MATERIAL_FORBIDDEN_KEYS)) failures.push(`${path} contains forbidden material alias/provenance key`);
}

function validateForensics(forensics, failures) {
  if (!isPlainObject(forensics)) return failures.push(`${TFPF} must be object`);
  rejectKeyDiff(Object.keys(forensics).sort(), [...FORENSIC_BRANCHES].sort(), TFPF, failures);
  if (containsAnyKey(forensics, FORENSIC_FORBIDDEN_KEYS)) failures.push(`${TFPF} contains forbidden material artifact`);
  for (const branch of FORENSIC_BRANCHES.filter((branch) => !["validation_quality_control_result", "runtime_trace_m8_only", "forensic_boundary"].includes(branch))) {
    if (!Array.isArray(forensics[branch])) failures.push(`${TFPF}.${branch} must be array`);
  }
  for (const branch of REQUIRED_NON_EMPTY_FORENSIC_ARRAYS) {
    if (Array.isArray(forensics[branch]) && !forensics[branch].length) failures.push(`${TFPF}.${branch} must not be empty`);
  }
  validateSelectedPaRows(forensics, failures);
  validateMechanicsRows(forensics, failures);
  validateClassificationRows(forensics, failures);
  validateLimitationAndOmissionRows(forensics, failures);
}

function validateSelectedPaRows(forensics, failures) {
  const ledger = Array.isArray(forensics.selected_pa_field_derivation_ledger) ? forensics.selected_pa_field_derivation_ledger : [];
  const byActivity = groupByActivity(ledger);
  for (const [activity, rows] of byActivity.entries()) {
    if (rows.length < 12) failures.push(`selected_pa_field_derivation_ledger requires at least 12 rows for ${activity}`);
  }
  for (const row of ledger) {
    if (!isPlainObject(row)) continue;
    const label = `${row.activity_reference || "unknown"}.${normalizeField(row) || "unknown"}`;
    if (!String(row.fd_field_id || "").startsWith("PA.")) failures.push(`selected_pa_field_derivation_ledger invalid fd_field_id for ${label}`);
    if (!hasSourceUrl(row)) failures.push(`selected_pa_field_derivation_ledger missing source_url/source_urls for ${label}`);
    if (hasSourceRef(row) && !hasSourceUrl(row)) failures.push(`selected_pa_field_derivation_ledger source_ref lacks source_url for ${label}`);
  }
}

function validateMechanicsRows(forensics, failures) {
  const selected = groupByActivity(Array.isArray(forensics.selected_pa_field_derivation_ledger) ? forensics.selected_pa_field_derivation_ledger : []);
  const mechanics = groupByActivity(Array.isArray(forensics.activity_mechanics_derivation_ledger) ? forensics.activity_mechanics_derivation_ledger : []);
  for (const activity of selected.keys()) if (!mechanics.has(activity)) failures.push(`activity_mechanics_derivation_ledger missing row for ${activity}`);
}

function validateClassificationRows(forensics, failures) {
  const selected = groupByActivity(Array.isArray(forensics.selected_pa_field_derivation_ledger) ? forensics.selected_pa_field_derivation_ledger : []);
  const archetypeRows = Array.isArray(forensics.archetype_derivation_ledger) ? forensics.archetype_derivation_ledger : [];
  const surfaceRows = Array.isArray(forensics.surface_token_derivation_ledger) ? forensics.surface_token_derivation_ledger : [];
  const archetypesByActivity = groupByActivity(archetypeRows);
  const surfacesByActivity = groupByActivity(surfaceRows);
  for (const activity of selected.keys()) {
    if ((archetypesByActivity.get(activity) || []).length < 11) failures.push(`archetype_derivation_ledger requires at least 11 rows for ${activity}`);
    if ((surfacesByActivity.get(activity) || []).length < 10) failures.push(`surface_token_derivation_ledger requires at least 10 rows for ${activity}`);
  }
  for (const row of archetypeRows) validateClassificationRow(row, "ARCHETYPE", failures);
  for (const row of surfaceRows) validateClassificationRow(row, "SURFACE", failures);
}

function validateClassificationRow(row, type, failures) {
  if (!isPlainObject(row)) return failures.push(`${type} ledger row must be object`);
  const label = `${type} ledger ${row.activity_reference || "unknown"}.${row.code || "unknown"}`;
  const required = ["classification_matrix_source", "matrix_branch", "activity_reference", "classification_type", "code", "conditions", "trigger_if", "trigger_result", "trigger_with_limitation_if", "exclude_if", "exclusion_result", "forbidden_inference_check", "confidence", "limitation_if_any"];
  for (const field of required) if (!(field in row)) failures.push(`${label} missing ${field}`);
  if (row.classification_type !== type) failures.push(`${label} wrong classification_type`);
  if (!Array.isArray(row.conditions)) {
    failures.push(`${label} conditions must be array`);
  } else {
    for (const condition of row.conditions) validateConditionRow(condition, label, failures);
  }
  if (row.forbidden_inference_check === "FAIL" && TRIGGERED_RESULTS.has(row.trigger_result)) failures.push(`${label} cannot be triggered with forbidden_inference_check FAIL`);
}

function validateConditionRow(condition, label, failures) {
  if (!isPlainObject(condition)) return failures.push(`${label} condition row must be object`);
  for (const field of ["condition_id", "condition_text", "result", "source_ref", "source_url", "evidence_summary"]) {
    if (!(field in condition)) failures.push(`${label} condition missing ${field}`);
  }
  if (condition.result && !CONDITION_RESULTS.has(condition.result)) failures.push(`${label} condition invalid result: ${condition.result}`);
  if (hasSourceRef(condition) && !hasSourceUrl(condition)) failures.push(`${label} condition source_ref lacks source_url`);
}

function validateLimitationAndOmissionRows(forensics, failures) {
  const limitationRows = Array.isArray(forensics.activity_limitations_ledger) ? forensics.activity_limitations_ledger : [];
  const omissionRows = Array.isArray(forensics.candidate_admission_and_omission_ledger) ? forensics.candidate_admission_and_omission_ledger : [];
  const reinvestigationRows = Array.isArray(forensics.targeted_re_extraction_ledger) ? forensics.targeted_re_extraction_ledger : [];
  const limitationSignal = collectRows(forensics).some((row) => isPlainObject(row) && LIMITATION_PATTERN.test(JSON.stringify(row)));
  if (limitationSignal && !limitationRows.length && !omissionRows.length) failures.push("limitations/omissions require activity_limitations_ledger[] or candidate_admission_and_omission_ledger[]");
  if (limitationSignal && !reinvestigationRows.length) failures.push("weak/missing/thin/conflicting tests require targeted_re_extraction_ledger[]");
}

function groupByActivity(rows) {
  const map = new Map();
  for (const row of rows || []) {
    if (!isPlainObject(row)) continue;
    const activity = String(row.activity_reference || "").trim();
    if (!activity) continue;
    if (!map.has(activity)) map.set(activity, []);
    map.get(activity).push(row);
  }
  return map;
}

function validateExactTopLevelKeys(output, expected, failures, phase) { if (!isPlainObject(output)) return failures.push(`${phase}_OUTPUT_INVALID:not_object`); rejectKeyDiff(Object.keys(output).sort(), [...expected].sort(), phase, failures); }
function rejectKeyDiff(actual, expected, label, failures) { const missing = expected.filter((key) => !actual.includes(key)); const extra = actual.filter((key) => !expected.includes(key)); if (missing.length) failures.push(`${label} missing keys: ${missing.join(",")}`); if (extra.length) failures.push(`${label} extra keys: ${extra.join(",")}`); }
function normalizeField(row) { return String(row.output_field || row.field || row.field_name || "").replace(/^target_feature_profile\.activities\[\]\./, ""); }
function hasSourceRef(row) { return typeof row?.source_ref === "string" && row.source_ref.trim() || Array.isArray(row?.source_refs) && row.source_refs.length || isPlainObject(row?.source_refs); }
function hasSourceUrl(row) { return typeof row?.source_url === "string" && row.source_url.trim() || isPlainObject(row?.source_urls) || Array.isArray(row?.source_urls); }
function isPlainObject(value) { return !!value && typeof value === "object" && !Array.isArray(value); }
function containsAnyKey(value, keys) { if (!value || typeof value !== "object") return false; if (Array.isArray(value)) return value.some((item) => containsAnyKey(item, keys)); return Object.keys(value).some((key) => keys.includes(key)) || Object.values(value).some((item) => containsAnyKey(item, keys)); }
function deepContains(value, needle) { if (typeof value === "string") return value.includes(needle); if (!value || typeof value !== "object") return false; return Object.values(value).some((item) => deepContains(item, needle)); }
function collectRows(value) { if (!value || typeof value !== "object") return []; if (Array.isArray(value)) return value.flatMap((item) => collectRows(item)); return [value, ...Object.values(value).flatMap((item) => collectRows(item))]; }
