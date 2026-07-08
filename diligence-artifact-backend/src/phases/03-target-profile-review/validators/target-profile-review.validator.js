import { TARGET_PROFILE_REVIEW_CONTRACT } from "../index.js";

const TARGET_PROFILE = "target_profile";
const TARGET_PROFILE_FORENSICS = "target_profile_forensics";
const TARGET_LIMITATIONS = "target_profile_limitations";
const REVIEW_PHASES = new Set(["TARGET_PROFILE_REVIEW", "M7_TARGET_PROFILE"]);
const FORENSIC_PHASES = new Set(["TARGET_PROFILE_FORENSICS", "M7_TARGET_PROFILE_FORENSICS"]);
const CONTROLLED_VALUES = new Set(TARGET_PROFILE_REVIEW_CONTRACT.output_contract.controlled_field_values || []);
const ARRAY_FIELDS = new Set(TARGET_PROFILE_REVIEW_CONTRACT.output_contract.array_fields || []);
const PROFILE_BRANCHES = Object.freeze(TARGET_PROFILE_REVIEW_CONTRACT.output_contract.branch_fields || {});
const MATERIAL_BRANCHES = Object.freeze(TARGET_PROFILE_REVIEW_CONTRACT.output_contract.required_top_level_branches || Object.keys(PROFILE_BRANCHES));
const OBJECT_BRANCHES = Object.freeze(Object.entries(PROFILE_BRANCHES).filter(([branch]) => branch !== TARGET_LIMITATIONS));
const DIRECT_SIGNAL_ALLOWED_FIELDS = new Set((TARGET_PROFILE_REVIEW_CONTRACT.direct_legal_signal_intake?.allowed_field_rows || []).map((row) => row.field_id));
const DIRECT_SIGNAL_FORBIDDEN_FAMILIES = new Set(TARGET_PROFILE_REVIEW_CONTRACT.direct_legal_signal_intake?.forbidden_field_families || []);
const FORBIDDEN_PROFILE_KEYS = Object.freeze(["target_profile_forensics", "legal_cartography_index", "legal_signal_derivation_profile", "m7_deterministic_legal_signal_overlay", "feature_candidate_inventory", "target_feature_profile", "target_feature_profile_forensics", "data_provenance_profile", "data_provenance_profile_forensics", "extended_dap_india_readiness_profile", "integrated_dap_report", "dap_forensics_profile", "exposure_registry_profile", "challenge_gate", "final_output_handoff", "renderer_payload", "qualified_review_handoff", "qualified_review_renderer_payload", "legal_advice", "compliance_conclusion", "enforceability_assessment", "risk_conclusion"]);
const FORENSIC_BRANCHES = Object.freeze(["source_ledger_used_for_m7", "target_source_extraction_capsule_summary", "target_source_route_coverage_ledger", "field_derivation_ledger", "targeted_re_extraction_ledger", "limitation_ledger", "cross_route_use_ledger", "validation_quality_control_result", "runtime_trace_m7_only", "forensic_boundary"]);
const FORENSIC_ARRAY_BRANCHES = FORENSIC_BRANCHES.filter((branch) => !["validation_quality_control_result", "runtime_trace_m7_only", "forensic_boundary"].includes(branch));

export function validateM7TargetProfileOutput(output, { phase = "TARGET_PROFILE_REVIEW" } = {}) {
  const failures = [];
  if (REVIEW_PHASES.has(phase)) validateMaterialOutput(output, failures, phase);
  else if (FORENSIC_PHASES.has(phase)) validateForensicOutput(output, failures, phase);
  else failures.push(`TARGET_PROFILE_REVIEW_UNKNOWN_PHASE:${phase}`);
  if (failures.length) throw new Error(`TARGET_PROFILE_REVIEW_VALIDATION_FAILED:${JSON.stringify({ phase, failures })}`);
}

export function validateTargetProfileReviewOutput(output, options = {}) {
  return validateM7TargetProfileOutput(output, { ...options, phase: options.phase || "TARGET_PROFILE_REVIEW" });
}

function validateMaterialOutput(output, failures, phase) {
  validateExactTopLevelKeys(output, [TARGET_PROFILE], failures, phase);
  const profile = output?.[TARGET_PROFILE];
  if (!isPlainObject(profile)) return failures.push("target_profile must be object");
  rejectKeyDiff(Object.keys(profile).sort(), [...MATERIAL_BRANCHES].sort(), TARGET_PROFILE, failures);
  for (const [branch, fields] of OBJECT_BRANCHES) {
    if (!isPlainObject(profile[branch])) { failures.push(`target_profile.${branch} must be object`); continue; }
    rejectKeyDiff(Object.keys(profile[branch]).sort(), [...fields].sort(), `target_profile.${branch}`, failures);
    for (const field of fields) assertFieldValue({ profile, fieldPath: `${branch}.${field}`, failures });
  }
  if (!Array.isArray(profile[TARGET_LIMITATIONS])) failures.push("target_profile.target_profile_limitations must be array");
  const controlled = collectFieldPaths(profile).filter((fieldPath) => CONTROLLED_VALUES.has(valueAt(profile, fieldPath)));
  if (controlled.length && !profile[TARGET_LIMITATIONS]?.length) failures.push("controlled Target Profile Review fields require target_profile_limitations[]");
  for (const key of FORBIDDEN_PROFILE_KEYS) if (containsKey(profile, key)) failures.push(`target_profile contains forbidden key: ${key}`);
  for (const family of DIRECT_SIGNAL_FORBIDDEN_FAMILIES) if (containsString(profile, family)) failures.push(`target_profile contains forbidden direct signal family: ${family}`);
  for (const row of collectRows(profile)) {
    const fieldId = row?.field_id || row?.fieldId || row?.field;
    if (typeof fieldId === "string" && /^DAP\.|^LGC\.|^TP\./.test(fieldId) && !DIRECT_SIGNAL_ALLOWED_FIELDS.has(fieldId)) failures.push(`target_profile contains unsupported direct signal field_id: ${fieldId}`);
  }
}

function validateForensicOutput(output, failures, phase) {
  validateExactTopLevelKeys(output, [TARGET_PROFILE_FORENSICS], failures, phase);
  const forensics = output?.[TARGET_PROFILE_FORENSICS];
  if (!isPlainObject(forensics)) return failures.push("target_profile_forensics must be object");
  rejectKeyDiff(Object.keys(forensics).sort(), [...FORENSIC_BRANCHES].sort(), TARGET_PROFILE_FORENSICS, failures);
  if (containsKey(forensics, TARGET_PROFILE)) failures.push("target_profile_forensics contains material artifact");
  for (const branch of FORENSIC_ARRAY_BRANCHES) if (!Array.isArray(forensics[branch])) failures.push(`target_profile_forensics.${branch} must be array`);
  if (forensics.forensic_boundary?.semantic_forensic_profile_retired !== true) failures.push("target_profile_forensics forensic boundary must retire semantic forensics");
  if (forensics.forensic_boundary?.material_profile_re_emitted !== false) failures.push("target_profile_forensics must not re-emit material profile");
}

function assertFieldValue({ profile, fieldPath, failures }) { const value = valueAt(profile, fieldPath); if (ARRAY_FIELDS.has(fieldPath)) { if (!Array.isArray(value)) failures.push(`target_profile.${fieldPath} must be array`); } else if (!(typeof value === "string" && value.trim())) failures.push(`target_profile.${fieldPath} must be string`); }
function validateExactTopLevelKeys(output, expected, failures, phase) { if (!isPlainObject(output)) return failures.push(`${phase}_OUTPUT_INVALID:not_object`); rejectKeyDiff(Object.keys(output).sort(), [...expected].sort(), phase, failures); }
function rejectKeyDiff(actual, expected, label, failures) { const missing = expected.filter((key) => !actual.includes(key)); const extra = actual.filter((key) => !expected.includes(key)); if (missing.length) failures.push(`${label} missing keys: ${missing.join(",")}`); if (extra.length) failures.push(`${label} extra keys: ${extra.join(",")}`); }
function collectFieldPaths(profile) { return OBJECT_BRANCHES.flatMap(([branch, fields]) => fields.map((field) => `${branch}.${field}`)); }
function valueAt(root, path) { return String(path).split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), root); }
function collectRows(value) { if (!value || typeof value !== "object") return []; if (Array.isArray(value)) return value.flatMap((item) => collectRows(item)); return [value, ...Object.values(value).flatMap((item) => collectRows(item))]; }
function isPlainObject(value) { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function containsKey(value, key) { if (!value || typeof value !== "object") return false; if (Object.prototype.hasOwnProperty.call(value, key)) return true; return Object.values(value).some((item) => containsKey(item, key)); }
function containsString(value, fragment) { if (typeof value === "string") return value.includes(fragment); if (!value || typeof value !== "object") return false; return Object.values(value).some((item) => containsString(item, fragment)); }
