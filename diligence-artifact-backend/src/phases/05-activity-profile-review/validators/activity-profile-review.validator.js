import { validateFeatureCandidateInventoryIndex } from "../services/activity-candidate-inventory-index.builder.js";

const FCI = "feature_candidate_inventory";
const TFP = "target_feature_profile";
const TFPF = "target_feature_profile_forensics";
const COMMERCIAL = "commercial_availability_posture";
const MATERIAL_TOP_LEVEL_KEYS = Object.freeze([TFP]);
const INVENTORY_TOP_LEVEL_KEYS = Object.freeze([FCI]);
const FORENSIC_TOP_LEVEL_KEYS = Object.freeze([TFPF]);
const PROFILE_FIELDS = Object.freeze(["activities", COMMERCIAL, "profile_level_limitations"]);
const ACTIVITY_FIELDS = Object.freeze(["activity_reference", "product_service_wrapper", "activity_feature_name", "activity_candidate_summary", "mechanics_proof", "autonomy_human_control_signal", "data_content_object_touched", "external_internal_action_signal", "archetype_codes", "archetype_derivation_basis", "surface_context_tokens", "surface_derivation_basis"]);
const DERIVATION_BASIS_FIELDS = Object.freeze(["code_or_token", "normalized_name", "conditions_satisfied", "trigger_if_applied", "exclude_if_checked", "material_basis", "limitation"]);
const COMMERCIAL_FIELDS = Object.freeze(["posture", "free_trial_freemium_signal", "beta_pilot_early_access_signal", "paid_production_enterprise_plan_signal", "evidence_basis", "limitation"]);
const ARCHETYPE_CODES = Object.freeze(["UNI", "DOE", "JDG", "CMP", "CRT", "RDR", "ORC", "TRN", "SHD", "OPT", "MOV", "CUR", "MOD", "ORA"]);
const SURFACE_TOKENS = Object.freeze(["Consumer-Public", "Enterprise-Private", "PII", "Employment", "Sensitive/Biometric", "Financial", "Content&IP", "Safety&Physical", "Infrastructure", "Minors"]);
const FORENSIC_BRANCHES = Object.freeze(["forensic_contract", "feature_candidate_inventory_ref", "raw_feature_hit_derivation_ledger", "canonicalization_derivation_ledger", "dedup_decision_ledger", "parent_child_overlap_ledger", "candidate_to_activity_coverage_ledger", "candidate_exclusion_ledger", "semantic_classification_ledger", "material_profile_trace_index", "activity_trace_index", "field_trace_index", "source_custody_trace_index", "limitation_trace_index", "profile_reconciliation_ledger", "forensic_lock_gate_result", "product_activity_source_route_coverage_ledger", "product_activity_extraction_capsule_summary", "candidate_admission_and_omission_ledger", "selected_pa_field_derivation_ledger", "activity_mechanics_derivation_ledger", "archetype_derivation_ledger", "surface_token_derivation_ledger", "targeted_re_extraction_ledger", "activity_limitations_ledger", "cross_route_use_ledger", "validation_quality_control_result", "runtime_trace_m8_only", "forensic_boundary"]);
const ARRAY_FORENSIC_BRANCHES = FORENSIC_BRANCHES.filter((branch) => !["forensic_contract", "feature_candidate_inventory_ref", "forensic_lock_gate_result", "validation_quality_control_result", "runtime_trace_m8_only", "forensic_boundary"].includes(branch));
const MATERIAL_BLOCKED_KEYS = Object.freeze(["validation_status", "lock_status", "status", TFPF, FCI, "runtime_trace", "source_ledger", "scratchpad", "debug", "archetype_proof", "surface_proof_and_routing_limits"]);
const MATERIAL_BLOCKED_FRAGMENTS = Object.freeze(["http://", "https://", "source_id", "source_url", "source_pointer", "source_ref", "candidate_id", "confidence", "forensic", "ledger", "runtime_trace"]);

export function validateM8TargetFeatureOutput(output, { phase = "M8_TARGET_FEATURE_PROFILE" } = {}) {
  const failures = [];
  if (phase === "M8_FEATURE_CANDIDATE_INVENTORY") {
    validateExactTopLevelKeys(output, INVENTORY_TOP_LEVEL_KEYS, failures, phase);
    if (!failures.length) {
      const result = validateFeatureCandidateInventoryIndex(output[FCI]);
      if (result.status !== "PASS") failures.push(...result.failures);
    }
  } else if (phase === "M8_TARGET_FEATURE_PROFILE") {
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
  rejectKeyDiff(Object.keys(profile).sort(), [...PROFILE_FIELDS].sort(), TFP, failures);
  if (!Array.isArray(profile.activities)) failures.push(`${TFP}.activities must be array`);
  validateCommercialAvailability(profile[COMMERCIAL], failures);
  if (!Array.isArray(profile.profile_level_limitations)) failures.push(`${TFP}.profile_level_limitations must be array`);
  if (containsAnyKey(profile, MATERIAL_BLOCKED_KEYS)) failures.push(`${TFP} contains blocked material key`);
  if (containsBlockedFragment(profile)) failures.push(`${TFP} contains blocked source/forensic fragment`);
  const activities = Array.isArray(profile.activities) ? profile.activities : [];
  if (!activities.length && Array.isArray(profile.profile_level_limitations) && !profile.profile_level_limitations.length) failures.push("empty activities[] requires profile_level_limitations[]");
  activities.forEach((activity, index) => validateActivity(activity, index, failures));
}

function validateCommercialAvailability(value, failures) {
  const path = `${TFP}.${COMMERCIAL}`;
  if (!isPlainObject(value)) return failures.push(`${path} must be object`);
  rejectKeyDiff(Object.keys(value).sort(), [...COMMERCIAL_FIELDS].sort(), path, failures);
  for (const field of ["posture", "free_trial_freemium_signal", "beta_pilot_early_access_signal", "paid_production_enterprise_plan_signal", "limitation"]) if (!(typeof value[field] === "string" && value[field].trim())) failures.push(`${path}.${field} must be non-empty string`);
  if (!Array.isArray(value.evidence_basis)) failures.push(`${path}.evidence_basis must be array`);
  for (const [index, item] of (Array.isArray(value.evidence_basis) ? value.evidence_basis : []).entries()) if (!(typeof item === "string" && item.trim())) failures.push(`${path}.evidence_basis[${index}] must be non-empty string`);
}

function validateActivity(activity, index, failures) {
  const path = `${TFP}.activities[${index}]`;
  if (!isPlainObject(activity)) return failures.push(`${path} must be object`);
  rejectKeyDiff(Object.keys(activity).sort(), [...ACTIVITY_FIELDS].sort(), path, failures);
  for (const field of ACTIVITY_FIELDS) if (!["archetype_codes", "archetype_derivation_basis", "surface_context_tokens", "surface_derivation_basis"].includes(field) && !(typeof activity[field] === "string" && activity[field].trim())) failures.push(`${path}.${field} must be non-empty string`);
  if (!Array.isArray(activity.archetype_codes) || !activity.archetype_codes.length) failures.push(`${path}.archetype_codes must be non-empty array`);
  if (!Array.isArray(activity.archetype_derivation_basis)) failures.push(`${path}.archetype_derivation_basis must be array`);
  if (!Array.isArray(activity.surface_context_tokens)) failures.push(`${path}.surface_context_tokens must be array`);
  if (!Array.isArray(activity.surface_derivation_basis)) failures.push(`${path}.surface_derivation_basis must be array`);

  const archetypeCodes = Array.isArray(activity.archetype_codes) ? activity.archetype_codes : [];
  const surfaceTokens = Array.isArray(activity.surface_context_tokens) ? activity.surface_context_tokens : [];
  for (const code of archetypeCodes) if (!ARCHETYPE_CODES.includes(code)) failures.push(`${path}.archetype_codes invalid code: ${code}`);
  for (const token of surfaceTokens) if (!SURFACE_TOKENS.includes(token)) failures.push(`${path}.surface_context_tokens invalid token: ${token}`);

  validateUniqueSelections(archetypeCodes, `${path}.archetype_codes`, failures);
  validateUniqueSelections(surfaceTokens, `${path}.surface_context_tokens`, failures);
  validateBasisArray(activity.archetype_derivation_basis, `${path}.archetype_derivation_basis`, failures);
  validateBasisArray(activity.surface_derivation_basis, `${path}.surface_derivation_basis`, failures);
  validateBasisCoverage({ selected: archetypeCodes, basis: activity.archetype_derivation_basis, path: `${path}.archetype_derivation_basis`, label: "archetype code", failures });
  validateBasisCoverage({ selected: surfaceTokens, basis: activity.surface_derivation_basis, path: `${path}.surface_derivation_basis`, label: "surface token", failures });
}

function validateBasisArray(value, path, failures) {
  if (!Array.isArray(value)) return;
  for (const [index, item] of value.entries()) {
    const itemPath = `${path}[${index}]`;
    if (!isPlainObject(item)) {
      failures.push(`${itemPath} must be object`);
      continue;
    }
    rejectKeyDiff(Object.keys(item).sort(), [...DERIVATION_BASIS_FIELDS].sort(), itemPath, failures);
    for (const field of DERIVATION_BASIS_FIELDS) {
      const fieldValue = item[field];
      if (field === "conditions_satisfied") {
        if (!Array.isArray(fieldValue) || !fieldValue.length) failures.push(`${itemPath}.conditions_satisfied must be non-empty array`);
        for (const [conditionIndex, condition] of (Array.isArray(fieldValue) ? fieldValue : []).entries()) if (!(typeof condition === "string" && condition.trim())) failures.push(`${itemPath}.conditions_satisfied[${conditionIndex}] must be non-empty string`);
      } else if (!(typeof fieldValue === "string" && fieldValue.trim())) failures.push(`${itemPath}.${field} must be non-empty string`);
    }
  }
}

function validateBasisCoverage({ selected, basis, path, label, failures }) {
  if (!Array.isArray(basis)) return;
  const selectedValues = selected.filter((item) => typeof item === "string" && item.trim());
  const basisValues = basis.map((item) => (isPlainObject(item) ? String(item.code_or_token || "").trim() : "")).filter(Boolean);
  for (const selectedValue of selectedValues) {
    const count = basisValues.filter((basisValue) => basisValue === selectedValue).length;
    if (count !== 1) failures.push(`${path} must contain exactly one basis entry for selected ${label}: ${selectedValue}`);
  }
  for (const basisValue of basisValues) {
    if (!selectedValues.includes(basisValue)) failures.push(`${path} contains basis entry for unselected ${label}: ${basisValue}`);
  }
  validateUniqueSelections(basisValues, `${path}.code_or_token`, failures);
}

function validateUniqueSelections(values, path, failures) {
  const seen = new Set();
  for (const value of values) {
    if (typeof value !== "string" || !value.trim()) continue;
    if (seen.has(value)) failures.push(`${path} contains duplicate value: ${value}`);
    seen.add(value);
  }
}

function validateForensics(forensics, failures) {
  if (!isPlainObject(forensics)) return failures.push(`${TFPF} must be object`);
  rejectKeyDiff(Object.keys(forensics).sort(), [...FORENSIC_BRANCHES].sort(), TFPF, failures);
  if (containsAnyKey(forensics, [TFP, FCI])) failures.push(`${TFPF} contains material artifact or competing inventory`);
  for (const branch of ARRAY_FORENSIC_BRANCHES) if (!Array.isArray(forensics[branch])) failures.push(`${TFPF}.${branch} must be array`);
  if (!isPlainObject(forensics.feature_candidate_inventory_ref) || forensics.feature_candidate_inventory_ref.artifact_name !== FCI) failures.push(`${TFPF}.feature_candidate_inventory_ref must reference ${FCI}`);
  if (forensics.forensic_boundary?.semantic_forensic_profile_retired !== true) failures.push(`${TFPF}.forensic_boundary must retire semantic forensics`);
}

function validateExactTopLevelKeys(output, expected, failures, phase) {
  if (!isPlainObject(output)) return failures.push(`${phase}_OUTPUT_INVALID:not_object`);
  rejectKeyDiff(Object.keys(output).sort(), [...expected].sort(), phase, failures);
}

function rejectKeyDiff(actual, expected, label, failures) {
  const missing = expected.filter((key) => !actual.includes(key));
  const extra = actual.filter((key) => !expected.includes(key));
  if (missing.length) failures.push(`${label} missing keys: ${missing.join(",")}`);
  if (extra.length) failures.push(`${label} extra keys: ${extra.join(",")}`);
}

function isPlainObject(value) { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function containsAnyKey(value, keys) { if (!value || typeof value !== "object") return false; if (Array.isArray(value)) return value.some((item) => containsAnyKey(item, keys)); return Object.keys(value).some((key) => keys.includes(key)) || Object.values(value).some((item) => containsAnyKey(item, keys)); }
function containsBlockedFragment(value) { if (typeof value === "string") { const normalized = value.toLowerCase(); return MATERIAL_BLOCKED_FRAGMENTS.some((fragment) => normalized.includes(fragment.toLowerCase())); } if (!value || typeof value !== "object") return false; return Object.values(value).some((item) => containsBlockedFragment(item)); }
