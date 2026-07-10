import {
  P2C_ACTIVITY_PROFILE_ALLOWED_ROUTE_CLASSES,
  P2C_ACTIVITY_PROFILE_ALLOWED_SIGNAL_FAMILIES,
  P2C_ACTIVITY_PROFILE_ARTIFACTS,
  P2C_ACTIVITY_PROFILE_FINAL_INDEX_KEYS,
  P2C_ACTIVITY_PROFILE_FORBIDDEN_CLASSIFICATION_KEYS,
  P2C_ACTIVITY_PROFILE_FORBIDDEN_CONCLUSIONS,
  P2C_ACTIVITY_PROFILE_FORBIDDEN_OUTPUTS,
  P2C_ACTIVITY_PROFILE_RETIRED_ROOTS_FORBIDDEN
} from "../activity-profile-source-index.contract.js";

const FINAL_ARTIFACT = P2C_ACTIVITY_PROFILE_ARTIFACTS.finalIndex;
const LOCATOR_MAP_KEYS = Object.freeze([
  "activity_candidate_source_locator_map",
  "product_capability_locator_map",
  "feature_mechanics_locator_map",
  "technical_mechanics_locator_map",
  "api_interaction_locator_map",
  "data_object_interaction_locator_map",
  "integration_action_locator_map",
  "commercial_availability_locator_map",
  "customer_use_context_locator_map",
  "support_operational_context_locator_map",
  "automation_transparency_context_locator_map",
  "human_control_context_locator_map",
  "external_action_context_locator_map",
  "input_output_object_context_locator_map"
]);
const COPIED_TEXT_KEYS = Object.freeze([
  "summary",
  "excerpt",
  "snippet",
  "quote",
  "lossless_text",
  "clean_text",
  "raw_text",
  "body",
  "content",
  "notes",
  "reasoning",
  "mechanics_proof",
  "activity_candidate_summary",
  "profile_answer",
  "answer"
]);
const DERIVED_VALUE_KEYS = Object.freeze([
  "derived_value",
  "value",
  "conclusion",
  "activity_profile_answer",
  "profile_activity_final",
  ...P2C_ACTIVITY_PROFILE_FORBIDDEN_CLASSIFICATION_KEYS,
  ...P2C_ACTIVITY_PROFILE_FORBIDDEN_CONCLUSIONS
]);

export function validateActivityProfileSourceIndex({ sourceIndex } = {}) {
  const errors = [];
  validateForbiddenArtifactRoots(sourceIndex, errors);
  const index = unwrapFinal(sourceIndex);
  if (!index || typeof index !== "object" || Array.isArray(index)) errors.push("activity_profile_source_index must be an object");
  if (!index) return { ok: false, errors, artifact_name: FINAL_ARTIFACT };

  const keys = Object.keys(index);
  if (JSON.stringify(keys) !== JSON.stringify(P2C_ACTIVITY_PROFILE_FINAL_INDEX_KEYS)) errors.push("activity_profile_source_index must contain exact final keys in contract order");

  if (!Array.isArray(index.source_coverage_index)) errors.push("source_coverage_index must be an array");
  if (!Array.isArray(index.activity_profile_document_structure_index)) errors.push("activity_profile_document_structure_index must be an array");

  for (const key of LOCATOR_MAP_KEYS) {
    if (!Array.isArray(index[key])) errors.push(`${key} must be an array`);
    for (const [rowIndex, row] of ensureArray(index[key]).entries()) validateLocatorRow({ key, rowIndex, row, errors });
  }

  if (!isPlainObject(index.priority_activity_profile_locator)) errors.push("priority_activity_profile_locator must be an object");
  if (!Array.isArray(index.semantic_navigation_index)) errors.push("semantic_navigation_index must be an array");
  for (const [rowIndex, row] of ensureArray(index.semantic_navigation_index).entries()) validateSemanticNavigationRow({ rowIndex, row, errors });
  if (!Array.isArray(index.missing_limited_activity_profile_items)) errors.push("missing_limited_activity_profile_items must be an array");

  validateDownstreamRules(index.downstream_rules, errors);
  validateNoForbiddenMarkers(index, errors);

  return { ok: errors.length === 0, errors, artifact_name: FINAL_ARTIFACT };
}

function unwrapFinal(value) {
  if (value && typeof value === "object" && FINAL_ARTIFACT in value) return value[FINAL_ARTIFACT];
  if (value && typeof value === "object" && value.payload && FINAL_ARTIFACT in value.payload) return value.payload[FINAL_ARTIFACT];
  return value;
}

function validateForbiddenArtifactRoots(value, errors) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return;
  for (const artifactName of P2C_ACTIVITY_PROFILE_FORBIDDEN_OUTPUTS) {
    if (Object.prototype.hasOwnProperty.call(value, artifactName)) errors.push(`2C must not emit forbidden artifact root ${artifactName}`);
    if (value.payload && typeof value.payload === "object" && Object.prototype.hasOwnProperty.call(value.payload, artifactName)) errors.push(`2C must not emit forbidden payload root ${artifactName}`);
  }
}

function validateLocatorRow({ key, rowIndex, row, errors }) {
  if (!row || typeof row !== "object" || Array.isArray(row)) {
    errors.push(`${key}[${rowIndex}] must be an object`);
    return;
  }
  for (const required of ["locator_id", "unit_id", "source_artifact", "source_id", "common_root", "route_class", "route_code", "route_action", "signal_families", "candidate_creation_allowed", "context_only", "source_pointer", "unit_pointer", "derived_value_forbidden", "package_specific_classification_forbidden", "source_text_copied"]) {
    if (!(required in row)) errors.push(`${key}[${rowIndex}] missing ${required}`);
  }
  if (!P2C_ACTIVITY_PROFILE_ALLOWED_ROUTE_CLASSES.includes(row.route_class)) errors.push(`${key}[${rowIndex}] has forbidden route_class ${row.route_class}`);
  if (row.route_action !== "LOCATE_ONLY") errors.push(`${key}[${rowIndex}] must be LOCATE_ONLY`);
  if (row.derived_value_forbidden !== true) errors.push(`${key}[${rowIndex}] must forbid derived values`);
  if (row.package_specific_classification_forbidden !== true) errors.push(`${key}[${rowIndex}] must forbid package-specific classification`);
  if (row.source_text_copied !== false) errors.push(`${key}[${rowIndex}] source_text_copied must be false`);
  for (const family of ensureArray(row.signal_families)) if (!P2C_ACTIVITY_PROFILE_ALLOWED_SIGNAL_FAMILIES.includes(family)) errors.push(`${key}[${rowIndex}] has forbidden signal family ${family}`);
  for (const copied of COPIED_TEXT_KEYS) if (copied in row) errors.push(`${key}[${rowIndex}] includes copied-text/proof key ${copied}`);
  for (const derived of DERIVED_VALUE_KEYS) if (derived in row && row[derived] !== null) errors.push(`${key}[${rowIndex}] includes derived/classification key ${derived}`);
}

function validateSemanticNavigationRow({ rowIndex, row, errors }) {
  if (!row || typeof row !== "object" || Array.isArray(row)) {
    errors.push(`semantic_navigation_index[${rowIndex}] must be an object`);
    return;
  }
  for (const copied of COPIED_TEXT_KEYS) if (copied in row) errors.push(`semantic_navigation_index[${rowIndex}] includes copied-text/proof key ${copied}`);
  for (const derived of DERIVED_VALUE_KEYS) if (derived in row) errors.push(`semantic_navigation_index[${rowIndex}] includes derived/classification key ${derived}`);
  if (row.source_text_copied !== false) errors.push(`semantic_navigation_index[${rowIndex}] source_text_copied must be false`);
  if (row.package_specific_classification_forbidden !== true) errors.push(`semantic_navigation_index[${rowIndex}] package_specific_classification_forbidden must be true`);
}

function validateDownstreamRules(rules = {}, errors) {
  if (!isPlainObject(rules)) return errors.push("downstream_rules must be an object");
  const requiredTrue = Object.freeze([
    "phase_2c_is_index_only",
    "activity_profile_source_index_owned_by_2c",
    "phase_5_activity_profile_review_derives_values_later",
    "domain_package_specific_activity_taxonomy_deferred_to_phase5",
    "mounted_domain_package_controls_archetypes_surfaces_and_activity_fields",
    "source_artifacts_remain_source_of_truth"
  ]);
  const requiredFalse = Object.freeze([
    "package_specific_classification_allowed",
    "archetype_derivation_allowed",
    "surface_derivation_allowed",
    "feature_candidate_inventory_emission_allowed",
    "target_feature_profile_emission_allowed",
    "mechanics_proof_allowed",
    "source_text_copy_allowed",
    "full_text_copied",
    "summaries_allowed",
    "excerpts_allowed",
    "legal_or_compliance_conclusions_allowed"
  ]);
  for (const key of requiredTrue) if (rules[key] !== true) errors.push(`downstream_rules.${key} must be true`);
  for (const key of requiredFalse) if (rules[key] !== false) errors.push(`downstream_rules.${key} must be false`);
}

function validateNoForbiddenMarkers(value, errors) {
  const text = JSON.stringify(value || {});
  for (const marker of [...P2C_ACTIVITY_PROFILE_RETIRED_ROOTS_FORBIDDEN]) if (text.includes(marker)) errors.push(`final index includes forbidden retired marker ${marker}`);
  for (const marker of P2C_ACTIVITY_PROFILE_FORBIDDEN_OUTPUTS) if (text.includes(`"${marker}":`)) errors.push(`final index includes forbidden output marker ${marker}`);
  for (const marker of [...P2C_ACTIVITY_PROFILE_FORBIDDEN_CLASSIFICATION_KEYS, ...P2C_ACTIVITY_PROFILE_FORBIDDEN_CONCLUSIONS]) if (text.includes(`"${marker}":`)) errors.push(`final index includes forbidden classification/conclusion key ${marker}`);
}

function ensureArray(value) { return Array.isArray(value) ? value : []; }
function isPlainObject(value) { return Boolean(value && typeof value === "object" && !Array.isArray(value)); }
