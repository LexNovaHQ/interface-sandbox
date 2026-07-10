import {
  P2B_DOMAIN_ACTIVITY_ARTIFACTS,
  P2B_DOMAIN_ACTIVITY_FINAL_INDEX_KEYS,
  P2B_DOMAIN_ACTIVITY_ALLOWED_ROUTE_CLASSES,
  P2B_DOMAIN_ACTIVITY_ALLOWED_SIGNAL_FAMILIES,
  P2B_DOMAIN_ACTIVITY_FORBIDDEN_OUTPUTS,
  P2B_DOMAIN_ACTIVITY_FORBIDDEN_CONCLUSIONS,
  P2B_DOMAIN_ACTIVITY_RETIRED_ROOTS_FORBIDDEN
} from "../domain-activity-source-index.contract.js";

const FINAL_ROOT = P2B_DOMAIN_ACTIVITY_ARTIFACTS.finalIndex;
const REQUIRED_ARRAY_KEYS = new Set(P2B_DOMAIN_ACTIVITY_FINAL_INDEX_KEYS.filter((key) => !["downstream_rules", "lock_status"].includes(key)));
const ALLOWED_LOCK_STATUS = new Set(["LOCKED", "LOCKED_WITH_LIMITATIONS", "REPAIR_REQUIRED", "CONTROLLED_FAILURE"]);
const FORBIDDEN_COPY_KEYS = Object.freeze(["summary", "excerpt", "snippet", "lossless_text", "clean_text", "raw_text", "body", "content", "value", "derived_value"]);
const FORBIDDEN_DERIVED_KEYS = Object.freeze(["primary_domain", "primary_domain_value", "domain_package", "domain_package_selected", "ai_overlay", "ai_overlay_value", "regulatory_overlay", "regulatory_overlay_value", "fusion_status", "active_run_package_manifest"]);

export function validateDomainActivitySourceIndex(rawOutput) {
  const errors = [];
  const warnings = [];
  const output = unwrap(rawOutput);
  const index = output?.[FINAL_ROOT];
  if (!index || typeof index !== "object" || Array.isArray(index)) return result([`Missing required root ${FINAL_ROOT}.`], warnings);

  for (const key of Object.keys(output)) if (key !== FINAL_ROOT) errors.push(`Unexpected top-level key: ${key}.`);
  const keys = Object.keys(index);
  const missing = P2B_DOMAIN_ACTIVITY_FINAL_INDEX_KEYS.filter((key) => !(key in index));
  const extra = keys.filter((key) => !P2B_DOMAIN_ACTIVITY_FINAL_INDEX_KEYS.includes(key));
  if (missing.length) errors.push(`Missing final index keys: ${missing.join(",")}.`);
  if (extra.length) errors.push(`Unexpected final index keys: ${extra.join(",")}.`);
  for (const key of REQUIRED_ARRAY_KEYS) if (!Array.isArray(index[key])) errors.push(`${key} must be an array.`);
  if (!index.downstream_rules || typeof index.downstream_rules !== "object" || Array.isArray(index.downstream_rules)) errors.push("downstream_rules must be an object.");
  if (!ALLOWED_LOCK_STATUS.has(index.lock_status)) errors.push("Invalid or missing lock_status.");

  const rules = index.downstream_rules || {};
  for (const [key, expected] of Object.entries({
    phase_2b_is_index_only: true,
    activity_profile_source_index_owned_by_2b: true,
    domain_derivation_layer_derives_values_later: true,
    primary_domain_derivation_forbidden_in_2b: true,
    ai_overlay_derivation_forbidden_in_2b: true,
    regulatory_overlay_derivation_forbidden_in_2b: true,
    fusion_candidate_requires_composite_signal: true,
    fusion_lock_forbidden_in_2b: true,
    domain_package_selection_forbidden_in_2b: true,
    active_run_package_manifest_update_forbidden_in_2b: true,
    source_artifacts_remain_source_of_truth: true,
    full_text_copied: false,
    summaries_allowed: false,
    excerpts_allowed: false,
    legal_or_compliance_conclusions_allowed: false,
    phase1_v5_12_root_source_contract_required: true,
    old_family_input_contract_forbidden: true
  })) if (rules[key] !== expected) errors.push(`downstream_rules.${key} must be ${expected}.`);

  for (const forbidden of P2B_DOMAIN_ACTIVITY_FORBIDDEN_OUTPUTS) if (containsKey(index, forbidden)) errors.push(`Forbidden downstream output key present: ${forbidden}.`);
  for (const forbidden of P2B_DOMAIN_ACTIVITY_FORBIDDEN_CONCLUSIONS) if (containsKey(index, forbidden) || containsStringValue(index, forbidden)) errors.push(`Forbidden conclusion marker present: ${forbidden}.`);
  for (const forbidden of P2B_DOMAIN_ACTIVITY_RETIRED_ROOTS_FORBIDDEN) if (containsStringValue(index, forbidden)) errors.push(`Retired root marker present: ${forbidden}.`);
  for (const forbidden of [...FORBIDDEN_COPY_KEYS, ...FORBIDDEN_DERIVED_KEYS]) if (containsKey(index, forbidden)) errors.push(`Forbidden copied/derived key present: ${forbidden}.`);

  validateSemanticRows(index.semantic_navigation_index, errors);
  validateLocatorRows(index, errors);
  validateFusionRows(index.fusion_candidate_locator_map, errors);

  if (!asArray(index.primary_domain_locator_map).length) warnings.push("No primary_domain_locator_map rows found in final index.");
  if (!asArray(index.ai_overlay_locator_map).length) warnings.push("No ai_overlay_locator_map rows found in final index.");
  if (!asArray(index.regulatory_overlay_locator_map).length) warnings.push("No regulatory_overlay_locator_map rows found in final index.");
  return result(errors, warnings);
}

export function assertDomainActivitySourceIndex(rawOutput) {
  const validation = validateDomainActivitySourceIndex(rawOutput);
  if (!validation.ok) {
    const error = new Error(`DOMAIN_ACTIVITY_SOURCE_INDEX_VALIDATION_FAILED:${validation.errors.join("|")}`);
    error.validation = validation;
    throw error;
  }
  return validation;
}

function validateSemanticRows(rows, errors) {
  for (const [index, row] of asArray(rows).entries()) {
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      errors.push(`semantic_navigation_index[${index}] must be an object.`);
      continue;
    }
    for (const routeClass of asArray(row.route_classes)) if (!P2B_DOMAIN_ACTIVITY_ALLOWED_ROUTE_CLASSES.includes(routeClass)) errors.push(`semantic_navigation_index[${index}] invalid route_class: ${routeClass}.`);
    for (const family of asArray(row.route_signal_families)) if (!P2B_DOMAIN_ACTIVITY_ALLOWED_SIGNAL_FAMILIES.includes(family)) errors.push(`semantic_navigation_index[${index}] invalid route_signal_family: ${family}.`);
    if (containsKey(row, "lossless_text") || containsKey(row, "excerpt") || containsKey(row, "value") || containsKey(row, "derived_value")) errors.push(`semantic_navigation_index[${index}] contains copied/derived material.`);
  }
}

function validateLocatorRows(index, errors) {
  for (const row of collectLocatorRows(index)) {
    if (!row || typeof row !== "object" || Array.isArray(row)) continue;
    if (typeof row.value === "string" && row.value.trim()) errors.push("Locator row must not contain a non-empty value.");
    if (row.derived_value_emitted === true) errors.push("Locator row emitted a derived value.");
    if (row.source_text_copied === true) errors.push("Locator row copied source text.");
    if (row.phase_2b_action && row.phase_2b_action !== "LOCATE_ONLY") errors.push("Locator row phase_2b_action must be LOCATE_ONLY.");
    if (row.route_class && !P2B_DOMAIN_ACTIVITY_ALLOWED_ROUTE_CLASSES.includes(row.route_class)) errors.push(`Invalid locator route_class: ${row.route_class}.`);
  }
}

function validateFusionRows(rows, errors) {
  for (const [index, row] of asArray(rows).entries()) {
    if (row.route_class !== "FUSION_CANDIDATE_ROUTE") errors.push(`fusion_candidate_locator_map[${index}] must use FUSION_CANDIDATE_ROUTE.`);
    if (row.phase_2b_action !== "LOCATE_ONLY") errors.push(`fusion_candidate_locator_map[${index}] must remain LOCATE_ONLY.`);
    if (row.derived_value_emitted === true) errors.push(`fusion_candidate_locator_map[${index}] emitted derived value.`);
    if (row.source_text_copied === true) errors.push(`fusion_candidate_locator_map[${index}] copied source text.`);
    if (!row.fusion_basis || typeof row.fusion_basis !== "object" || Array.isArray(row.fusion_basis)) errors.push(`fusion_candidate_locator_map[${index}] missing fusion_basis.`);
    if (row.fusion_basis && !row.fusion_basis.ai_signal_visible) errors.push(`fusion_candidate_locator_map[${index}] missing AI signal basis.`);
    if (row.fusion_basis && Number(row.fusion_basis.composite_signal_count || 0) < 2) errors.push(`fusion_candidate_locator_map[${index}] composite signal count below 2.`);
  }
}

function collectLocatorRows(index) {
  const keys = P2B_DOMAIN_ACTIVITY_FINAL_INDEX_KEYS.filter((key) => key.endsWith("_locator_map") || key === "priority_domain_activity_locator");
  return keys.flatMap((key) => asArray(index[key]));
}

function containsKey(value, key) {
  if (!value || typeof value !== "object") return false;
  if (Object.prototype.hasOwnProperty.call(value, key)) return true;
  if (Array.isArray(value)) return value.some((item) => containsKey(item, key));
  return Object.values(value).some((item) => containsKey(item, key));
}

function containsStringValue(value, marker) {
  if (typeof value === "string") return value.includes(marker);
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some((item) => containsStringValue(item, marker));
  return Object.values(value).some((item) => containsStringValue(item, marker));
}

function unwrap(value) { if (!value || typeof value !== "object") return value; if (value.artifact && typeof value.artifact === "object") return value.artifact; if (value.data && typeof value.data === "object") return value.data; if (value.payload && typeof value.payload === "object") return value.payload; return value; }
function asArray(value) { return Array.isArray(value) ? value : []; }
function result(errors, warnings) { return { ok: errors.length === 0, errors, warnings, status: errors.length ? "REPAIR_REQUIRED" : warnings.length ? "LOCKED_WITH_LIMITATIONS" : "LOCKED" }; }
