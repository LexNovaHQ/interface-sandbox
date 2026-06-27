const TFP = "target_" + "feature_profile";
const TFPF = TFP + "_forensics";

const MATERIAL_TOP_LEVEL_KEYS = Object.freeze([TFP]);
const FORENSIC_TOP_LEVEL_KEYS = Object.freeze([TFPF]);
const ACTIVITY_FIELDS = Object.freeze(["activity_reference", "product_service_wrapper", "activity_feature_name", "activity_candidate_summary", "mechanics_proof", "autonomy_human_control_signal", "data_content_object_touched", "external_internal_action_signal", "archetype_codes", "archetype_proof", "surface_context_tokens", "surface_proof_and_routing_limits"]);
const ARCHETYPE_CODES = Object.freeze(["UNI", "DOE", "JDG", "CMP", "CRT", "RDR", "ORC", "TRN", "SHD", "OPT", "MOV"]);
const SURFACE_TOKENS = Object.freeze(["Consumer-Public", "Enterprise-Private", "PII", "Employment", "Sensitive/Biometric", "Financial", "Content&IP", "Safety&Physical", "Infrastructure", "Minors"]);
const FORENSIC_BRANCHES = Object.freeze(["product_activity_source_route_coverage_ledger", "product_activity_extraction_capsule_summary", "candidate_admission_and_omission_ledger", "selected_pa_field_derivation_ledger", "activity_mechanics_derivation_ledger", "archetype_derivation_ledger", "surface_token_derivation_ledger", "targeted_re_extraction_ledger", "activity_limitations_ledger", "cross_route_use_ledger", "validation_quality_control_result", "runtime_trace_m8_only", "forensic_boundary"]);
const ARRAY_FORENSIC_BRANCHES = FORENSIC_BRANCHES.filter((branch) => !["validation_quality_control_result", "runtime_trace_m8_only", "forensic_boundary"].includes(branch));
const ROUTE_COVERAGE_BRANCHES = Object.freeze(["product_activity_source_route_coverage_ledger", "product_activity_extraction_capsule_summary", "candidate_admission_and_omission_ledger"]);
const MATERIAL_BLOCKED_KEYS = Object.freeze(["validation_status", "lock_status", "status", TFPF, "runtime_trace", "source_ledger", "scratchpad", "debug"]);

export function validateM8TargetFeatureOutput(output, { phase = "M8_TARGET_FEATURE_PROFILE" } = {}) {
  const failures = [];
  if (phase === "M8_TARGET_FEATURE_PROFILE") {
    validateExactTopLevelKeys(output, MATERIAL_TOP_LEVEL_KEYS, failures, phase);
    if (!failures.length) validateProfile(output[TFP], failures);
  } else if (phase === "M8_TARGET_FEATURE_PROFILE_FORENSICS") {
    validateExactTopLevelKeys(output, FORENSIC_TOP_LEVEL_KEYS, failures, phase);
    if (!failures.length) validateForensics(output[TFPF], failures);
  } else failures.push(`M8_UNKNOWN_PHASE:${phase}`);
  if (failures.length) throw new Error(`M8_TARGET_FEATURE_PROFILE_VALIDATION_FAILED:${JSON.stringify({ phase, failures })}`);
}

function validateProfile(profile, failures) {
  if (!isPlainObject(profile)) return failures.push(`${TFP} must be object`);
  rejectKeyDiff(Object.keys(profile).sort(), ["activities", "profile_level_limitations"].sort(), TFP, failures);
  if (!Array.isArray(profile.activities)) failures.push(`${TFP}.activities must be array`);
  if (!Array.isArray(profile.profile_level_limitations)) failures.push(`${TFP}.profile_level_limitations must be array`);
  if (containsAnyKey(profile, MATERIAL_BLOCKED_KEYS)) failures.push(`${TFP} contains blocked material key`);
  const activities = Array.isArray(profile.activities) ? profile.activities : [];
  if (!activities.length && Array.isArray(profile.profile_level_limitations) && !profile.profile_level_limitations.length) failures.push("empty activities[] requires profile_level_limitations[]");
  activities.forEach((activity, index) => validateActivity(activity, index, failures));
}

function validateActivity(activity, index, failures) {
  const path = `${TFP}.activities[${index}]`;
  if (!isPlainObject(activity)) return failures.push(`${path} must be object`);
  rejectKeyDiff(Object.keys(activity).sort(), [...ACTIVITY_FIELDS].sort(), path, failures);
  for (const field of ACTIVITY_FIELDS) if (field !== "archetype_codes" && field !== "surface_context_tokens" && !(typeof activity[field] === "string" && activity[field].trim())) failures.push(`${path}.${field} must be non-empty string`);
  if (!Array.isArray(activity.archetype_codes) || !activity.archetype_codes.length) failures.push(`${path}.archetype_codes must be non-empty array`);
  if (!Array.isArray(activity.surface_context_tokens)) failures.push(`${path}.surface_context_tokens must be array`);
  for (const code of activity.archetype_codes || []) if (!ARCHETYPE_CODES.includes(code)) failures.push(`${path}.archetype_codes invalid code: ${code}`);
  for (const token of activity.surface_context_tokens || []) if (!SURFACE_TOKENS.includes(token)) failures.push(`${path}.surface_context_tokens invalid token: ${token}`);
}

function validateForensics(forensics, failures) {
  if (!isPlainObject(forensics)) return failures.push(`${TFPF} must be object`);
  rejectKeyDiff(Object.keys(forensics).sort(), [...FORENSIC_BRANCHES].sort(), TFPF, failures);
  if (containsAnyKey(forensics, [TFP])) failures.push(`${TFPF} contains material artifact`);
  for (const branch of ARRAY_FORENSIC_BRANCHES) if (!Array.isArray(forensics[branch])) failures.push(`${TFPF}.${branch} must be array`);
  for (const branch of ROUTE_COVERAGE_BRANCHES) if (Array.isArray(forensics[branch]) && !forensics[branch].length) failures.push(`${TFPF}.${branch} must not be empty`);
}

function validateExactTopLevelKeys(output, expected, failures, phase) { if (!isPlainObject(output)) return failures.push(`${phase}_OUTPUT_INVALID:not_object`); rejectKeyDiff(Object.keys(output).sort(), [...expected].sort(), phase, failures); }
function rejectKeyDiff(actual, expected, label, failures) { const missing = expected.filter((key) => !actual.includes(key)); const extra = actual.filter((key) => !expected.includes(key)); if (missing.length) failures.push(`${label} missing keys: ${missing.join(",")}`); if (extra.length) failures.push(`${label} extra keys: ${extra.join(",")}`); }
function isPlainObject(value) { return !!value && typeof value === "object" && !Array.isArray(value); }
function containsAnyKey(value, keys) { if (!value || typeof value !== "object") return false; if (Array.isArray(value)) return value.some((item) => containsAnyKey(item, keys)); return Object.keys(value).some((key) => keys.includes(key)) || Object.values(value).some((item) => containsAnyKey(item, keys)); }
