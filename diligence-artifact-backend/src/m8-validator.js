const REQUIRED_TOP_LEVEL_KEYS = Object.freeze(["target_feature_profile", "target_feature_profile_forensics"]);

const ACTIVITY_FIELDS = Object.freeze([
  "activity_reference",
  "product_service_wrapper",
  "activity_feature_name",
  "activity_candidate_summary",
  "mechanics_proof",
  "autonomy_human_control_signal",
  "data_content_object_touched",
  "external_internal_action_signal",
  "archetype_codes",
  "archetype_proof",
  "surface_context_tokens",
  "surface_proof_and_routing_limits"
]);

const STRING_ACTIVITY_FIELDS = Object.freeze(ACTIVITY_FIELDS.filter((field) => !["archetype_codes", "surface_context_tokens"].includes(field)));

const ARCHETYPE_CODES = Object.freeze(["UNI", "DOE", "JDG", "CMP", "CRT", "RDR", "ORC", "TRN", "SHD", "OPT", "MOV"]);

const SURFACE_TOKENS = Object.freeze([
  "Consumer-Public",
  "Enterprise-Private",
  "PII",
  "Employment",
  "Sensitive/Biometric",
  "Financial",
  "Content&IP",
  "Safety&Physical",
  "Infrastructure",
  "Minors"
]);

const REQUIRED_FORENSIC_BRANCHES = Object.freeze([
  "product_activity_source_route_coverage_ledger",
  "product_activity_extraction_capsule_summary",
  "candidate_admission_and_omission_ledger",
  "selected_pa_field_derivation_ledger",
  "activity_mechanics_derivation_ledger",
  "archetype_derivation_ledger",
  "surface_token_derivation_ledger",
  "targeted_re_extraction_ledger",
  "activity_limitations_ledger",
  "cross_route_use_ledger",
  "validation_quality_control_result",
  "runtime_trace_m8_only",
  "forensic_boundary"
]);

const ARRAY_FORENSIC_BRANCHES = Object.freeze(REQUIRED_FORENSIC_BRANCHES.filter((branch) => !["validation_quality_control_result", "runtime_trace_m8_only", "forensic_boundary"].includes(branch)));

const FORBIDDEN_MATERIAL_KEYS = Object.freeze([
  "validation_status",
  "lock_status",
  "status",
  "primary_source_refs",
  "primary_source_urls",
  "source_ref",
  "source_refs",
  "source_url",
  "source_urls",
  "evidence_refs",
  "evidence_basis",
  "confidence",
  "activity_evidence",
  "matched_evidence",
  "surface_evidence",
  "profile_meta",
  "activity_inventory",
  "activity_mechanics",
  "vertical_behavior_classification",
  "surface_context_classification",
  "registry_routing_substrate",
  "activity_limitations",
  "public_evidence_basis",
  "mechanics_evidence_basis",
  "route_coverage_rows",
  "extraction_fragments",
  "validation_logs",
  "compatibility_wrappers",
  "target_feature_profile_forensics",
  "archetype_derivation_ledger",
  "surface_token_derivation_ledger",
  "runtime_trace",
  "source_ledger",
  "scratchpad",
  "debug",
  "chain_of_thought"
]);

const FORBIDDEN_FORENSIC_KEYS = Object.freeze([
  "source_custody",
  "feature_route_family_coverage",
  "field_derivation_decisions",
  "validation_qc_status",
  "runtime_trace_boundaries",
  "extraction_capsule_summary",
  "route_coverage",
  "evidence_summary_only",
  "generic_derivation_summary",
  "activity_evidence",
  "activity_limitations"
]);

const FORBIDDEN_STALE_STRINGS = Object.freeze([
  "<phase_output",
  "</phase_output>",
  "agent_2_target_feature",
  "AGENT2_RUNTIME_BINDING_PACKET",
  "bucket_handoff",
  "discovered_route_inventory",
  "route_execution_ledger",
  "source_coverage_gates",
  "missing_limited_primary_sources",
  "target_profile_forensics",
  "target_profile"
]);

const CONTROLLED_FIELD_STATUSES = Object.freeze(["FIELD_LIMITED", "FIELD_NOT_PUBLIC", "FIELD_CONFLICTING", "FIELD_CONFLICTED", "FIELD_NOT_FOUND"]);
const TRIGGERED_RESULTS = new Set(["TRIGGERED", "TRIGGERED_WITH_LIMITATION"]);
const SOURCE_ID_PATTERN = /\b(?:T[0-4]|P[1-5]|D[1-5]|L[1-6])_[A-Z0-9_]+\.SRC\.\d{3}\b/g;
const URL_PATTERN = /https?:\/\/[^\s,"'<>\])}]+/g;

export function validateM8TargetFeatureOutput(output) {
  const failures = [];
  validateExactTopLevelKeys(output, REQUIRED_TOP_LEVEL_KEYS, failures, "M8_TARGET_FEATURE_PROFILE");
  if (!failures.length) {
    validateProfile(output.target_feature_profile, failures);
    validateForensics(output.target_feature_profile, output.target_feature_profile_forensics, failures);
    validateNoStaleStrings(output, failures);
    validateSourceRefs(output.target_feature_profile_forensics, failures);
    validateCrossArtifactConsistency(output.target_feature_profile, output.target_feature_profile_forensics, failures);
  }
  if (failures.length) throw new Error(`M8_TARGET_FEATURE_PROFILE_VALIDATION_FAILED:${JSON.stringify({ failures })}`);
}

function validateProfile(profile, failures) {
  if (!isPlainObject(profile)) {
    failures.push("target_feature_profile must be object");
    return;
  }

  const keys = Object.keys(profile).sort();
  const expected = ["activities", "profile_level_limitations"].sort();
  const missing = expected.filter((key) => !keys.includes(key));
  const extra = keys.filter((key) => !expected.includes(key));
  if (missing.length) failures.push(`target_feature_profile missing keys: ${missing.join(",")}`);
  if (extra.length) failures.push(`target_feature_profile extra keys: ${extra.join(",")}`);

  if (!Array.isArray(profile.activities)) failures.push("target_feature_profile.activities must be array");
  if (!Array.isArray(profile.profile_level_limitations)) failures.push("target_feature_profile.profile_level_limitations must be array");

  if (containsAnyKey(profile, FORBIDDEN_MATERIAL_KEYS)) failures.push("target_feature_profile contains forbidden material/provenance/status key");

  const activities = Array.isArray(profile.activities) ? profile.activities : [];
  activities.forEach((activity, index) => validateActivity(activity, index, failures));

  if (!activities.length && Array.isArray(profile.profile_level_limitations) && !profile.profile_level_limitations.length) {
    failures.push("empty activities[] requires profile_level_limitations[] explaining no public product/activity emission");
  }
}

function validateActivity(activity, index, failures) {
  const path = `target_feature_profile.activities[${index}]`;
  if (!isPlainObject(activity)) {
    failures.push(`${path} must be object`);
    return;
  }
  const keys = Object.keys(activity).sort();
  const expected = [...ACTIVITY_FIELDS].sort();
  const missing = expected.filter((key) => !keys.includes(key));
  const extra = keys.filter((key) => !expected.includes(key));
  if (missing.length) failures.push(`${path} missing fields: ${missing.join(",")}`);
  if (extra.length) failures.push(`${path} extra fields: ${extra.join(",")}`);

  for (const field of STRING_ACTIVITY_FIELDS) {
    if (!(typeof activity[field] === "string" && activity[field].trim())) failures.push(`${path}.${field} must be non-empty string`);
  }
  if (!Array.isArray(activity.archetype_codes)) failures.push(`${path}.archetype_codes must be array`);
  if (!Array.isArray(activity.surface_context_tokens)) failures.push(`${path}.surface_context_tokens must be array`);

  if (Array.isArray(activity.archetype_codes)) {
    if (!activity.archetype_codes.length) failures.push(`${path}.archetype_codes must not be empty`);
    for (const code of activity.archetype_codes) {
      if (!ARCHETYPE_CODES.includes(code)) failures.push(`${path}.archetype_codes contains invalid code: ${code}`);
    }
  }
  if (Array.isArray(activity.surface_context_tokens)) {
    for (const token of activity.surface_context_tokens) {
      if (!SURFACE_TOKENS.includes(token)) failures.push(`${path}.surface_context_tokens contains invalid token: ${token}`);
    }
  }

  if (containsAnyKey(activity, FORBIDDEN_MATERIAL_KEYS)) failures.push(`${path} contains forbidden material alias/provenance key`);
}

function validateForensics(profile, forensics, failures) {
  if (!isPlainObject(forensics)) {
    failures.push("target_feature_profile_forensics must be object");
    return;
  }

  const keys = Object.keys(forensics).sort();
  const expected = [...REQUIRED_FORENSIC_BRANCHES].sort();
  const missing = expected.filter((key) => !keys.includes(key));
  const extra = keys.filter((key) => !expected.includes(key));
  if (missing.length) failures.push(`target_feature_profile_forensics missing branches: ${missing.join(",")}`);
  if (extra.length) failures.push(`target_feature_profile_forensics extra branches: ${extra.join(",")}`);

  for (const branch of ARRAY_FORENSIC_BRANCHES) {
    if (!Array.isArray(forensics[branch])) failures.push(`target_feature_profile_forensics.${branch} must be array`);
  }
  if (containsAnyKey(forensics, FORBIDDEN_FORENSIC_KEYS)) failures.push("target_feature_profile_forensics contains forbidden forensic alias branch/key");

  const activities = Array.isArray(profile?.activities) ? profile.activities : [];
  validateSelectedPaRows(activities, forensics, failures);
  validateClassificationRows(activities, forensics, failures);
  validateMechanicsRows(activities, forensics, failures);
}

function validateSelectedPaRows(activities, forensics, failures) {
  const ledger = Array.isArray(forensics.selected_pa_field_derivation_ledger) ? forensics.selected_pa_field_derivation_ledger : [];
  if (ledger.length < activities.length * ACTIVITY_FIELDS.length) {
    failures.push(`selected_pa_field_derivation_ledger must contain at least ${ACTIVITY_FIELDS.length} rows per emitted activity`);
  }

  for (const activity of activities) {
    const reference = activity.activity_reference;
    for (const field of ACTIVITY_FIELDS) {
      const row = ledger.find((item) => isPlainObject(item) && item.activity_reference === reference && normalizeOutputField(item) === field);
      if (!row) {
        failures.push(`selected_pa_field_derivation_ledger missing row for ${reference}.${field}`);
        continue;
      }
      validatePaDerivationRow(row, `selected_pa_field_derivation_ledger:${reference}.${field}`, failures);
    }
  }
}

function validatePaDerivationRow(row, path, failures) {
  const required = ["activity_reference", "output_field", "fd_field_id", "source_ref", "evidence_summary", "targeted_re_extraction_status", "forbidden_inference_check", "limitation_if_any"];
  for (const field of required) {
    if (!(field in row)) failures.push(`${path} missing ${field}`);
  }
  if (!String(row.fd_field_id || "").startsWith("PA.")) failures.push(`${path}.fd_field_id must be PA.*`);
  if (!hasUrlField(row)) failures.push(`${path} missing source_url/source_urls`);
}

function validateClassificationRows(activities, forensics, failures) {
  const archetypeLedger = Array.isArray(forensics.archetype_derivation_ledger) ? forensics.archetype_derivation_ledger : [];
  const surfaceLedger = Array.isArray(forensics.surface_token_derivation_ledger) ? forensics.surface_token_derivation_ledger : [];

  if (archetypeLedger.length < activities.length * ARCHETYPE_CODES.length) failures.push("archetype_derivation_ledger must contain 11 rows per emitted activity");
  if (surfaceLedger.length < activities.length * SURFACE_TOKENS.length) failures.push("surface_token_derivation_ledger must contain 10 rows per emitted activity");

  for (const activity of activities) {
    const reference = activity.activity_reference;
    for (const code of ARCHETYPE_CODES) {
      const row = archetypeLedger.find((item) => isClassificationRowFor(item, reference, code));
      if (!row) failures.push(`archetype_derivation_ledger missing ${reference}.${code}`);
      else validateClassificationRow(row, `archetype_derivation_ledger:${reference}.${code}`, "ARCHETYPE", failures);
    }
    for (const token of SURFACE_TOKENS) {
      const row = surfaceLedger.find((item) => isClassificationRowFor(item, reference, token));
      if (!row) failures.push(`surface_token_derivation_ledger missing ${reference}.${token}`);
      else validateClassificationRow(row, `surface_token_derivation_ledger:${reference}.${token}`, "SURFACE", failures);
    }

    for (const code of activity.archetype_codes || []) {
      const row = archetypeLedger.find((item) => isClassificationRowFor(item, reference, code) && TRIGGERED_RESULTS.has(item.trigger_result));
      if (!row) failures.push(`emitted archetype missing triggered ledger row: ${reference}.${code}`);
    }
    for (const token of activity.surface_context_tokens || []) {
      const row = surfaceLedger.find((item) => isClassificationRowFor(item, reference, token) && TRIGGERED_RESULTS.has(item.trigger_result));
      if (!row) failures.push(`emitted surface token missing triggered ledger row: ${reference}.${token}`);
    }
  }
}

function validateClassificationRow(row, path, type, failures) {
  const required = ["activity_reference", "classification_type", "code", "conditions", "trigger_if", "trigger_result", "trigger_with_limitation_if", "exclude_if", "exclusion_result", "forbidden_inference_check", "confidence", "limitation_if_any"];
  for (const field of required) {
    if (!(field in row)) failures.push(`${path} missing ${field}`);
  }
  if (row.classification_type !== type) failures.push(`${path}.classification_type must be ${type}`);
  if (!Array.isArray(row.conditions)) failures.push(`${path}.conditions must be array`);
  else {
    row.conditions.forEach((condition, index) => validateConditionRow(condition, `${path}.conditions[${index}]`, failures));
  }
  if (row.forbidden_inference_check === "FAIL" && TRIGGERED_RESULTS.has(row.trigger_result)) {
    failures.push(`${path} cannot be triggered when forbidden_inference_check is FAIL`);
  }
}

function validateConditionRow(condition, path, failures) {
  if (!isPlainObject(condition)) {
    failures.push(`${path} must be object`);
    return;
  }
  const required = ["condition_id", "condition_text", "result", "source_ref", "source_url", "evidence_summary"];
  for (const field of required) {
    if (!(field in condition)) failures.push(`${path} missing ${field}`);
  }
}

function validateMechanicsRows(activities, forensics, failures) {
  const mechanicsLedger = Array.isArray(forensics.activity_mechanics_derivation_ledger) ? forensics.activity_mechanics_derivation_ledger : [];
  for (const activity of activities) {
    const row = mechanicsLedger.find((item) => isPlainObject(item) && item.activity_reference === activity.activity_reference);
    if (!row) failures.push(`activity_mechanics_derivation_ledger missing mechanics row for ${activity.activity_reference}`);
  }
}

function validateSourceRefs(value, failures) {
  walk(value, (node, path) => {
    if (!isPlainObject(node)) return;
    const serialized = JSON.stringify(node);
    const ids = serialized.match(SOURCE_ID_PATTERN) || [];
    if (!ids.length) return;
    const urls = serialized.match(URL_PATTERN) || [];
    if (!urls.length && !hasUrlField(node)) failures.push(`source reference without source_url/source_urls at ${path}: ${unique(ids).join(",")}`);
  });
}

function validateCrossArtifactConsistency(profile, forensics, failures) {
  const activities = Array.isArray(profile?.activities) ? profile.activities : [];
  const reExtractionText = JSON.stringify(forensics?.targeted_re_extraction_ledger || []);
  for (const activity of activities) {
    for (const field of ACTIVITY_FIELDS) {
      const value = activity[field];
      if (typeof value === "string" && CONTROLLED_FIELD_STATUSES.includes(value) && !reExtractionText.includes(activity.activity_reference)) {
        failures.push(`controlled-status field missing targeted re-extraction row for activity: ${activity.activity_reference}`);
      }
    }
  }
}

function validateNoStaleStrings(value, failures) {
  for (const stale of FORBIDDEN_STALE_STRINGS) {
    if (containsStringValue(value, stale)) failures.push(`stale or forbidden string present: ${stale}`);
  }
}

function validateExactTopLevelKeys(output, expected, failures, phase) {
  if (!isPlainObject(output)) {
    failures.push(`${phase}_OUTPUT_INVALID:not_object`);
    return;
  }
  const keys = Object.keys(output).sort();
  const wanted = [...expected].sort();
  const missing = wanted.filter((key) => !keys.includes(key));
  const extra = keys.filter((key) => !wanted.includes(key));
  if (missing.length) failures.push(`${phase} missing top-level keys: ${missing.join(",")}`);
  if (extra.length) failures.push(`${phase} extra top-level keys: ${extra.join(",")}`);
}

function normalizeOutputField(row) {
  return String(row.output_field || row.field || row.field_name || "").replace(/^target_feature_profile\.activities\[\]\./, "");
}

function isClassificationRowFor(row, reference, code) {
  return isPlainObject(row) && row.activity_reference === reference && row.code === code;
}

function hasUrlField(row) {
  return nonEmptyString(row?.source_url) || isPlainObject(row?.source_urls) || (Array.isArray(row?.source_urls) && row.source_urls.length > 0);
}

function nonEmptyString(value) { return typeof value === "string" && value.trim().length > 0; }
function isPlainObject(value) { return !!value && typeof value === "object" && !Array.isArray(value); }
function containsAnyKey(value, keys) { if (!value || typeof value !== "object") return false; if (Array.isArray(value)) return value.some((item) => containsAnyKey(item, keys)); return Object.keys(value).some((key) => keys.includes(key)) || Object.values(value).some((item) => containsAnyKey(item, keys)); }
function containsStringValue(value, needle) { if (typeof value === "string") return value.includes(needle); if (!value || typeof value !== "object") return false; return Object.values(value).some((item) => containsStringValue(item, needle)); }
function walk(value, visitor, path = "$" ) { visitor(value, path); if (!value || typeof value !== "object") return; if (Array.isArray(value)) { value.forEach((item, index) => walk(item, visitor, `${path}[${index}]`)); return; } for (const [key, item] of Object.entries(value)) walk(item, visitor, `${path}.${key}`); }
function unique(values) { return [...new Set((values || []).filter(Boolean))]; }
