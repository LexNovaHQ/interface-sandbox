const REQUIRED_TOP_LEVEL_KEYS = Object.freeze(["target_feature_profile", "target_feature_profile_forensics"]);
const ACTIVITY_FIELDS = Object.freeze(["activity_reference", "product_service_wrapper", "activity_feature_name", "activity_candidate_summary", "mechanics_proof", "autonomy_human_control_signal", "data_content_object_touched", "external_internal_action_signal", "archetype_codes", "archetype_proof", "surface_context_tokens", "surface_proof_and_routing_limits"]);
const ARCHETYPE_CODES = Object.freeze(["UNI", "DOE", "JDG", "CMP", "CRT", "RDR", "ORC", "TRN", "SHD", "OPT", "MOV"]);
const SURFACE_TOKENS = Object.freeze(["Consumer-Public", "Enterprise-Private", "PII", "Employment", "Sensitive/Biometric", "Financial", "Content&IP", "Safety&Physical", "Infrastructure", "Minors"]);
const FORENSIC_BRANCHES = Object.freeze(["product_activity_source_route_coverage_ledger", "product_activity_extraction_capsule_summary", "candidate_admission_and_omission_ledger", "selected_pa_field_derivation_ledger", "activity_mechanics_derivation_ledger", "archetype_derivation_ledger", "surface_token_derivation_ledger", "targeted_re_extraction_ledger", "activity_limitations_ledger", "cross_route_use_ledger", "validation_quality_control_result", "runtime_trace_m8_only", "forensic_boundary"]);
const MATERIAL_FORBIDDEN_KEYS = Object.freeze(["validation_status", "lock_status", "status", "primary_source_refs", "primary_source_urls", "source_ref", "source_refs", "source_url", "source_urls", "evidence_refs", "evidence_basis", "confidence", "activity_evidence", "matched_evidence", "surface_evidence", "profile_meta", "activity_inventory", "activity_mechanics", "vertical_behavior_classification", "surface_context_classification", "registry_routing_substrate", "activity_limitations", "public_evidence_basis", "mechanics_evidence_basis", "route_coverage_rows", "extraction_fragments", "validation_logs", "compatibility_wrappers", "target_feature_profile_forensics", "archetype_derivation_ledger", "surface_token_derivation_ledger", "runtime_trace", "source_ledger", "scratchpad", "debug", "chain_of_thought"]);
const STALE_STRINGS = Object.freeze(["<phase_output", "</phase_output>", "agent_2_target_feature", "AGENT2_RUNTIME_BINDING_PACKET", "bucket_handoff", "discovered_route_inventory", "route_execution_ledger", "source_coverage_gates", "missing_limited_primary_sources"]);
const TRIGGERED_RESULTS = new Set(["TRIGGERED", "TRIGGERED_WITH_LIMITATION"]);

export function validateM8TargetFeatureOutput(output) {
  const failures = [];
  validateExactTopLevelKeys(output, REQUIRED_TOP_LEVEL_KEYS, failures, "M8_TARGET_FEATURE_PROFILE");
  if (!failures.length) {
    validateProfile(output.target_feature_profile, failures);
    validateForensics(output.target_feature_profile, output.target_feature_profile_forensics, failures);
    for (const stale of STALE_STRINGS) if (deepContains(output, stale)) failures.push(`stale or forbidden string present: ${stale}`);
  }
  if (failures.length) throw new Error(`M8_TARGET_FEATURE_PROFILE_VALIDATION_FAILED:${JSON.stringify({ failures })}`);
}

function validateProfile(profile, failures) {
  if (!isPlainObject(profile)) return failures.push("target_feature_profile must be object");
  const keys = Object.keys(profile).sort();
  const expected = ["activities", "profile_level_limitations"].sort();
  rejectKeyDiff(keys, expected, "target_feature_profile", failures);
  if (!Array.isArray(profile.activities)) failures.push("target_feature_profile.activities must be array");
  if (!Array.isArray(profile.profile_level_limitations)) failures.push("target_feature_profile.profile_level_limitations must be array");
  if (containsAnyKey(profile, MATERIAL_FORBIDDEN_KEYS)) failures.push("target_feature_profile contains forbidden material/provenance/status key");
  const activities = Array.isArray(profile.activities) ? profile.activities : [];
  if (!activities.length && Array.isArray(profile.profile_level_limitations) && !profile.profile_level_limitations.length) failures.push("empty activities[] requires profile_level_limitations[]");
  activities.forEach((activity, index) => validateActivity(activity, index, failures));
}

function validateActivity(activity, index, failures) {
  const path = `target_feature_profile.activities[${index}]`;
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

function validateForensics(profile, forensics, failures) {
  if (!isPlainObject(forensics)) return failures.push("target_feature_profile_forensics must be object");
  rejectKeyDiff(Object.keys(forensics).sort(), [...FORENSIC_BRANCHES].sort(), "target_feature_profile_forensics", failures);
  for (const branch of FORENSIC_BRANCHES.filter((branch) => !["validation_quality_control_result", "runtime_trace_m8_only", "forensic_boundary"].includes(branch))) {
    if (!Array.isArray(forensics[branch])) failures.push(`target_feature_profile_forensics.${branch} must be array`);
  }
  const activities = Array.isArray(profile?.activities) ? profile.activities : [];
  validateSelectedPaRows(activities, forensics, failures);
  validateClassificationRows(activities, forensics, failures);
}

function validateSelectedPaRows(activities, forensics, failures) {
  const ledger = Array.isArray(forensics.selected_pa_field_derivation_ledger) ? forensics.selected_pa_field_derivation_ledger : [];
  if (ledger.length < activities.length * ACTIVITY_FIELDS.length) failures.push("selected_pa_field_derivation_ledger must contain at least 12 rows per emitted activity");
  for (const activity of activities) {
    for (const field of ACTIVITY_FIELDS) {
      const row = ledger.find((item) => isPlainObject(item) && item.activity_reference === activity.activity_reference && normalizeField(item) === field);
      if (!row) failures.push(`selected_pa_field_derivation_ledger missing row for ${activity.activity_reference}.${field}`);
      else if (!String(row.fd_field_id || "").startsWith("PA.")) failures.push(`selected_pa_field_derivation_ledger invalid fd_field_id for ${activity.activity_reference}.${field}`);
      else if (!hasSourceUrl(row)) failures.push(`selected_pa_field_derivation_ledger missing source_url/source_urls for ${activity.activity_reference}.${field}`);
    }
  }
}

function validateClassificationRows(activities, forensics, failures) {
  const archetypeRows = Array.isArray(forensics.archetype_derivation_ledger) ? forensics.archetype_derivation_ledger : [];
  const surfaceRows = Array.isArray(forensics.surface_token_derivation_ledger) ? forensics.surface_token_derivation_ledger : [];
  if (archetypeRows.length < activities.length * ARCHETYPE_CODES.length) failures.push("archetype_derivation_ledger must contain 11 rows per emitted activity");
  if (surfaceRows.length < activities.length * SURFACE_TOKENS.length) failures.push("surface_token_derivation_ledger must contain 10 rows per emitted activity");
  for (const activity of activities) {
    for (const code of ARCHETYPE_CODES) validateClassificationRow(archetypeRows, activity.activity_reference, code, "ARCHETYPE", failures);
    for (const token of SURFACE_TOKENS) validateClassificationRow(surfaceRows, activity.activity_reference, token, "SURFACE", failures);
    for (const code of activity.archetype_codes || []) if (!archetypeRows.find((row) => row.activity_reference === activity.activity_reference && row.code === code && TRIGGERED_RESULTS.has(row.trigger_result))) failures.push(`emitted archetype missing triggered ledger row: ${activity.activity_reference}.${code}`);
    for (const token of activity.surface_context_tokens || []) if (!surfaceRows.find((row) => row.activity_reference === activity.activity_reference && row.code === token && TRIGGERED_RESULTS.has(row.trigger_result))) failures.push(`emitted surface token missing triggered ledger row: ${activity.activity_reference}.${token}`);
  }
}

function validateClassificationRow(rows, reference, code, type, failures) {
  const row = rows.find((item) => isPlainObject(item) && item.activity_reference === reference && item.code === code);
  if (!row) return failures.push(`${type} ledger missing ${reference}.${code}`);
  const required = ["activity_reference", "classification_type", "code", "conditions", "trigger_if", "trigger_result", "trigger_with_limitation_if", "exclude_if", "exclusion_result", "forbidden_inference_check", "confidence", "limitation_if_any"];
  for (const field of required) if (!(field in row)) failures.push(`${type} ledger ${reference}.${code} missing ${field}`);
  if (row.classification_type !== type) failures.push(`${type} ledger ${reference}.${code} wrong classification_type`);
  if (!Array.isArray(row.conditions)) failures.push(`${type} ledger ${reference}.${code} conditions must be array`);
  if (row.forbidden_inference_check === "FAIL" && TRIGGERED_RESULTS.has(row.trigger_result)) failures.push(`${type} ledger ${reference}.${code} cannot be triggered with forbidden_inference_check FAIL`);
}

function validateExactTopLevelKeys(output, expected, failures, phase) { if (!isPlainObject(output)) return failures.push(`${phase}_OUTPUT_INVALID:not_object`); rejectKeyDiff(Object.keys(output).sort(), [...expected].sort(), phase, failures); }
function rejectKeyDiff(actual, expected, label, failures) { const missing = expected.filter((key) => !actual.includes(key)); const extra = actual.filter((key) => !expected.includes(key)); if (missing.length) failures.push(`${label} missing keys: ${missing.join(",")}`); if (extra.length) failures.push(`${label} extra keys: ${extra.join(",")}`); }
function normalizeField(row) { return String(row.output_field || row.field || row.field_name || "").replace(/^target_feature_profile\.activities\[\]\./, ""); }
function hasSourceUrl(row) { return typeof row?.source_url === "string" && row.source_url.trim() || isPlainObject(row?.source_urls) || Array.isArray(row?.source_urls); }
function isPlainObject(value) { return !!value && typeof value === "object" && !Array.isArray(value); }
function containsAnyKey(value, keys) { if (!value || typeof value !== "object") return false; if (Array.isArray(value)) return value.some((item) => containsAnyKey(item, keys)); return Object.keys(value).some((key) => keys.includes(key)) || Object.values(value).some((item) => containsAnyKey(item, keys)); }
function deepContains(value, needle) { if (typeof value === "string") return value.includes(needle); if (!value || typeof value !== "object") return false; return Object.values(value).some((item) => deepContains(item, needle)); }
