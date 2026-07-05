import { TARGET_PROFILE_REVIEW_CONTRACT } from "./phases/03-target-profile-review/index.js";

const TP = "target_" + "profile";
const TPF = TP + "_forensics";
const TPL = TP + "_limitations";
const SR = "source_" + "ref";
const SU = "source_" + "url";

const TARGET_PROFILE_REVIEW_PHASE_ALIASES = new Set(["TARGET_PROFILE_REVIEW", "M7_TARGET_PROFILE"]);
const TARGET_PROFILE_FORENSICS_PHASE_ALIASES = new Set(["TARGET_PROFILE_FORENSICS", "M7_TARGET_PROFILE_FORENSICS"]);
const MATERIAL_TOP_KEYS = Object.freeze([TP]);
const FORENSIC_TOP_KEYS = Object.freeze([TPF]);
const PROFILE_BRANCHES = Object.freeze(TARGET_PROFILE_REVIEW_CONTRACT.output_contract.branch_fields);
const MATERIAL_BRANCHES = Object.freeze(TARGET_PROFILE_REVIEW_CONTRACT.output_contract.required_top_level_branches);
const SELECTED_FIELDS = Object.freeze([...Object.entries(PROFILE_BRANCHES).flatMap(([parent, fields]) => fields.map((field) => `${parent}.${field}`)), TPL]);
const ARRAY_FIELDS = new Set(TARGET_PROFILE_REVIEW_CONTRACT.output_contract.array_fields);
const CONTROLLED_VALUES = new Set(TARGET_PROFILE_REVIEW_CONTRACT.output_contract.controlled_field_values);
const DIRECT_SIGNAL_ALLOWED_FIELDS = new Set(TARGET_PROFILE_REVIEW_CONTRACT.direct_legal_signal_intake.allowed_field_rows.map((row) => row.field_id));
const DIRECT_SIGNAL_FORBIDDEN_FAMILIES = new Set(TARGET_PROFILE_REVIEW_CONTRACT.direct_legal_signal_intake.forbidden_field_families);
const FORBIDDEN_PROFILE_KEYS = Object.freeze([
  TPF,
  "legal_cartography_index",
  "legal_signal_derivation_profile",
  "m7_deterministic_legal_signal_overlay",
  "source_ledger",
  "source_ledgers",
  "source_ledger_used_for_m7",
  "field_derivation_ledger",
  "target_source_extraction_capsule_summary",
  "target_source_route_coverage_ledger",
  "targeted_re_extraction_ledger",
  "cross_route_use_ledger",
  "runtime_trace_m7_only",
  "forensic_boundary",
  "feature_candidate_inventory",
  "target_feature_profile",
  "target_feature_profile_forensics",
  "data_provenance_profile",
  "data_provenance_profile_forensics",
  "exposure_registry_profile",
  "challenge_gate",
  "final_output_handoff",
  "renderer_payload",
  "qualified_review_handoff",
  "qualified_review_renderer_payload",
  "question_id",
  "reviewer_question",
  "question_rows",
  "legal_advice",
  "compliance_conclusion",
  "enforceability_assessment",
  "risk_conclusion"
]);
const FORBIDDEN_PROFILE_STRING_FRAGMENTS = Object.freeze([
  "legal_cartography_index",
  "m7_deterministic_legal_signal_overlay",
  "lossless_family__L1_CORE_TERMS_PRIVACY",
  "lossless_family__L2_B2B_CONTRACTING",
  "lossless_family__L3_AI_USAGE_GOVERNANCE",
  "lossless_family__L4_PRIVACY_ADJACENT_NOTICES",
  "lossless_family__L5_LEGAL_HUB_HOSTED",
  "lossless_family__L6_ENTITY_NOTICE",
  "privacy_grievance_contact_signal_map",
  "consent_manager_signal_map",
  "legal advice",
  "compliance conclusion",
  "enforceability conclusion"
]);
const FORENSIC_BRANCHES = Object.freeze(["source_ledger_used_for_m7", "target_source_extraction_capsule_summary", "target_source_route_coverage_ledger", "field_derivation_ledger", "targeted_re_extraction_ledger", "limitation_ledger", "cross_route_use_ledger", "validation_quality_control_result", "runtime_trace_m7_only", "forensic_boundary"]);
const ARRAY_FORENSIC_BRANCHES = Object.freeze(["source_ledger_used_for_m7", "target_source_extraction_capsule_summary", "target_source_route_coverage_ledger", "field_derivation_ledger", "targeted_re_extraction_ledger", "limitation_ledger", "cross_route_use_ledger"]);
const REQUIRED_NON_EMPTY = Object.freeze(["source_ledger_used_for_m7", "target_source_extraction_capsule_summary", "target_source_route_coverage_ledger"]);

export function validateM7TargetProfileOutput(output, { phase = "TARGET_PROFILE_REVIEW" } = {}) {
  const failures = [];
  if (TARGET_PROFILE_REVIEW_PHASE_ALIASES.has(phase)) {
    validateExactTopLevelKeys(output, MATERIAL_TOP_KEYS, failures, phase);
    if (!failures.length) validateProfile(output[TP], failures);
  } else if (TARGET_PROFILE_FORENSICS_PHASE_ALIASES.has(phase)) {
    validateExactTopLevelKeys(output, FORENSIC_TOP_KEYS, failures, phase);
    if (!failures.length) validateForensics(output[TPF], failures);
  } else failures.push(`TARGET_PROFILE_REVIEW_UNKNOWN_PHASE:${phase}`);
  if (failures.length) throw new Error(`TARGET_PROFILE_REVIEW_VALIDATION_FAILED:${JSON.stringify({ phase, failures })}`);
}

export function validateTargetProfileReviewOutput(output, options = {}) {
  return validateM7TargetProfileOutput(output, { ...options, phase: options.phase || "TARGET_PROFILE_REVIEW" });
}

function validateProfile(profile, failures) {
  if (!isPlainObject(profile)) return failures.push(`${TP} must be object`);
  rejectKeyDiff(Object.keys(profile).sort(), MATERIAL_BRANCHES.slice().sort(), TP, failures);
  for (const [parent, fields] of Object.entries(PROFILE_BRANCHES)) {
    if (!isPlainObject(profile[parent])) {
      failures.push(`${TP}.${parent} must be object`);
      continue;
    }
    rejectKeyDiff(Object.keys(profile[parent]).sort(), [...fields].sort(), `${TP}.${parent}`, failures);
  }
  if (!Array.isArray(profile[TPL])) failures.push(`${TP}.${TPL} must be array`);
  for (const field of SELECTED_FIELDS) {
    const value = valueAt(profile, field);
    if (ARRAY_FIELDS.has(field)) {
      if (!Array.isArray(value)) failures.push(`${TP}.${field} must be array`);
    } else if (!(typeof value === "string" && value.trim())) failures.push(`${TP}.${field} must be string`);
  }
  const controlled = SELECTED_FIELDS.filter((field) => CONTROLLED_VALUES.has(valueAt(profile, field)));
  if (controlled.length && (!Array.isArray(profile[TPL]) || !profile[TPL].length)) failures.push(`controlled Target Profile Review fields require ${TPL}[]`);
  for (const key of FORBIDDEN_PROFILE_KEYS) if (containsKey(profile, key)) failures.push(`${TP} contains forbidden key: ${key}`);
  for (const fragment of FORBIDDEN_PROFILE_STRING_FRAGMENTS) if (containsString(profile, fragment)) failures.push(`${TP} contains forbidden string fragment: ${fragment}`);
  validateNoDirectSignalFamilyLeakage(profile, failures);
  validateNoUnsupportedSignalFieldIds(profile, failures);
  validateLimitations(profile[TPL], failures);
}

function validateNoDirectSignalFamilyLeakage(profile, failures) {
  for (const family of DIRECT_SIGNAL_FORBIDDEN_FAMILIES) if (containsString(profile, family)) failures.push(`${TP} contains forbidden direct signal family: ${family}`);
}

function validateNoUnsupportedSignalFieldIds(profile, failures) {
  for (const row of collectRows(profile)) {
    if (!isPlainObject(row)) continue;
    const fieldId = row.field_id || row.fieldId || row.field;
    if (typeof fieldId === "string" && /^DAP\.|^LGC\.|^TP\./.test(fieldId) && !DIRECT_SIGNAL_ALLOWED_FIELDS.has(fieldId)) failures.push(`${TP} contains unsupported direct signal field_id: ${fieldId}`);
  }
}

function validateLimitations(limitations, failures) {
  if (!Array.isArray(limitations)) return;
  for (const row of limitations) {
    if (typeof row === "string") continue;
    if (!isPlainObject(row)) failures.push(`${TP}.${TPL} row must be string or object`);
    if (isPlainObject(row) && containsKey(row, "source_url")) failures.push(`${TP}.${TPL} must not include source_url`);
    if (isPlainObject(row) && containsKey(row, "source_id")) failures.push(`${TP}.${TPL} must not include source_id`);
  }
}

function validateForensics(forensics, failures) {
  if (!isPlainObject(forensics)) return failures.push(`${TPF} must be object`);
  rejectKeyDiff(Object.keys(forensics).sort(), [...FORENSIC_BRANCHES].sort(), TPF, failures);
  if (containsKey(forensics, TP)) failures.push(`${TPF} contains material artifact`);
  for (const branch of ARRAY_FORENSIC_BRANCHES) if (!Array.isArray(forensics[branch])) failures.push(`${TPF}.${branch} must be array`);
  for (const branch of REQUIRED_NON_EMPTY) if (Array.isArray(forensics[branch]) && !forensics[branch].length) failures.push(`${TPF}.${branch} must not be empty`);
  validateSourceRefUrlPairing(forensics, failures);
}

function validateSourceRefUrlPairing(value, failures) {
  for (const row of collectRows(value)) if (isPlainObject(row) && hasSourceRef(row) && !hasSourceUrl(row)) failures.push("source-ref row missing source-url");
}

function validateExactTopLevelKeys(output, expected, failures, phase) { if (!isPlainObject(output)) return failures.push(`${phase}_OUTPUT_INVALID:not_object`); rejectKeyDiff(Object.keys(output).sort(), [...expected].sort(), phase, failures); }
function rejectKeyDiff(actual, expected, label, failures) { const missing = expected.filter((key) => !actual.includes(key)); const extra = actual.filter((key) => !expected.includes(key)); if (missing.length) failures.push(`${label} missing keys: ${missing.join(",")}`); if (extra.length) failures.push(`${label} extra keys: ${extra.join(",")}`); }
function valueAt(root, path) { return String(path).split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), root); }
function hasSourceRef(row) { return typeof row?.[SR] === "string" && row[SR].trim() || Array.isArray(row?.[`${SR}s`]) && row[`${SR}s`].length || isPlainObject(row?.[`${SR}s`]); }
function hasSourceUrl(row) { return typeof row?.[SU] === "string" && row[SU].trim() || Array.isArray(row?.[`${SU}s`]) && row[`${SU}s`].length || isPlainObject(row?.[`${SU}s`]); }
function collectRows(value) { if (!value || typeof value !== "object") return []; if (Array.isArray(value)) return value.flatMap((item) => collectRows(item)); return [value, ...Object.values(value).flatMap((item) => collectRows(item))]; }
function isPlainObject(value) { return !!value && typeof value === "object" && !Array.isArray(value); }
function containsKey(value, key) { if (!value || typeof value !== "object") return false; if (Object.prototype.hasOwnProperty.call(value, key)) return true; return Object.values(value).some((item) => containsKey(item, key)); }
function containsString(value, fragment) { if (typeof value === "string") return value.includes(fragment); if (!value || typeof value !== "object") return false; return Object.values(value).some((item) => containsString(item, fragment)); }
