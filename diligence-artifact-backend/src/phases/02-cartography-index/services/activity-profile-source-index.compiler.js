import {
  P2C_ACTIVITY_PROFILE_ARTIFACTS,
  P2C_ACTIVITY_PROFILE_FINAL_INDEX_KEYS,
  P2C_ACTIVITY_PROFILE_FORBIDDEN_CLASSIFICATION_KEYS,
  P2C_ACTIVITY_PROFILE_FORBIDDEN_CONCLUSIONS
} from "../activity-profile-source-index.contract.js";

const FINAL_ARTIFACT = P2C_ACTIVITY_PROFILE_ARTIFACTS.finalIndex;
const DETERMINISTIC_ARTIFACT = P2C_ACTIVITY_PROFILE_ARTIFACTS.deterministicMap;
const SEMANTIC_ARTIFACT = P2C_ACTIVITY_PROFILE_ARTIFACTS.semanticProfile;

const LOCATOR_KEYS = Object.freeze([
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

const COPY_KEYS_FORBIDDEN = new Set([
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
const VALUE_KEYS_FORBIDDEN = new Set([
  "derived_value",
  "value",
  "conclusion",
  "activity_profile_answer",
  "profile_activity_final",
  ...P2C_ACTIVITY_PROFILE_FORBIDDEN_CLASSIFICATION_KEYS,
  ...P2C_ACTIVITY_PROFILE_FORBIDDEN_CONCLUSIONS
]);

export function compileActivityProfileSourceIndex({ deterministicMap, semanticProfile } = {}) {
  const deterministic = unwrap(deterministicMap, DETERMINISTIC_ARTIFACT);
  const semantic = unwrap(semanticProfile, SEMANTIC_ARTIFACT);

  const compiled = {
    source_coverage_index: cloneRows(deterministic?.activity_profile_source_coverage_index),
    activity_profile_document_structure_index: cloneRows(deterministic?.activity_profile_document_structure_index),
    activity_candidate_source_locator_map: cleanRows(deterministic?.activity_candidate_source_locator_map),
    product_capability_locator_map: cleanRows(deterministic?.product_capability_locator_map),
    feature_mechanics_locator_map: cleanRows(deterministic?.feature_mechanics_locator_map),
    technical_mechanics_locator_map: cleanRows(deterministic?.technical_mechanics_locator_map),
    api_interaction_locator_map: cleanRows(deterministic?.api_interaction_locator_map),
    data_object_interaction_locator_map: cleanRows(deterministic?.data_object_interaction_locator_map),
    integration_action_locator_map: cleanRows(deterministic?.integration_action_locator_map),
    commercial_availability_locator_map: cleanRows(deterministic?.commercial_availability_locator_map),
    customer_use_context_locator_map: cleanRows(deterministic?.customer_use_context_locator_map),
    support_operational_context_locator_map: cleanRows(deterministic?.support_operational_context_locator_map),
    automation_transparency_context_locator_map: cleanRows(deterministic?.automation_transparency_context_locator_map),
    human_control_context_locator_map: cleanRows(deterministic?.human_control_context_locator_map),
    external_action_context_locator_map: cleanRows(deterministic?.external_action_context_locator_map),
    input_output_object_context_locator_map: cleanRows(deterministic?.input_output_object_context_locator_map),
    priority_activity_profile_locator: buildPriorityLocator(deterministic),
    semantic_navigation_index: cleanRows(semantic?.semantic_navigation_index),
    missing_limited_activity_profile_items: cloneRows(deterministic?.missing_limited_activity_profile_source_map),
    downstream_rules: {
      ...(deterministic?.downstream_rules || {}),
      phase_2c_is_index_only: true,
      activity_profile_source_index_owned_by_2c: true,
      phase_5_activity_profile_review_derives_values_later: true,
      domain_package_specific_activity_taxonomy_deferred_to_phase5: true,
      mounted_domain_package_controls_archetypes_surfaces_and_activity_fields: true,
      package_specific_classification_allowed: false,
      archetype_derivation_allowed: false,
      surface_derivation_allowed: false,
      feature_candidate_inventory_emission_allowed: false,
      target_feature_profile_emission_allowed: false,
      mechanics_proof_allowed: false,
      source_text_copy_allowed: false,
      source_artifacts_remain_source_of_truth: true,
      full_text_copied: false,
      summaries_allowed: false,
      excerpts_allowed: false,
      legal_or_compliance_conclusions_allowed: false
    },
    lock_status: semantic?.lock_status === "REPAIR_REQUIRED" ? "REPAIR_REQUIRED" : deterministic?.lock_status || "LOCKED_WITH_LIMITATIONS"
  };

  return { [FINAL_ARTIFACT]: enforceExactKeyOrder(compiled) };
}

function buildPriorityLocator(deterministic = {}) {
  return {
    candidate_source_priority_units: topUnits(deterministic.activity_candidate_source_locator_map),
    product_capability_priority_units: topUnits(deterministic.product_capability_locator_map),
    mechanics_priority_units: topUnits([...(deterministic.feature_mechanics_locator_map || []), ...(deterministic.technical_mechanics_locator_map || [])]),
    interaction_priority_units: topUnits([...(deterministic.api_interaction_locator_map || []), ...(deterministic.data_object_interaction_locator_map || []), ...(deterministic.integration_action_locator_map || [])]),
    context_priority_units: topUnits([...(deterministic.customer_use_context_locator_map || []), ...(deterministic.support_operational_context_locator_map || []), ...(deterministic.automation_transparency_context_locator_map || []), ...(deterministic.human_control_context_locator_map || [])]),
    instruction: "Phase 5 must use these locators to read Phase 1 source artifacts and then apply the mounted domain package. 2C emits no feature inventory, activity profile, package classification, archetype, surface, mechanics proof, or profile value."
  };
}

function topUnits(rows = []) {
  return cleanRows(rows).slice(0, 20).map((row) => ({
    locator_id: row.locator_id,
    unit_id: row.unit_id,
    source_artifact: row.source_artifact,
    source_id: row.source_id,
    common_root: row.common_root,
    route_class: row.route_class,
    route_code: row.route_code,
    candidate_creation_allowed: row.candidate_creation_allowed,
    context_only: row.context_only,
    source_pointer: row.source_pointer,
    unit_pointer: row.unit_pointer
  }));
}

function cleanRows(rows = []) {
  return cloneRows(rows).map(stripForbiddenKeys);
}

function cloneRows(rows = []) {
  return Array.isArray(rows) ? rows.map((row) => (row && typeof row === "object" ? JSON.parse(JSON.stringify(row)) : row)) : [];
}

function stripForbiddenKeys(row) {
  if (!row || typeof row !== "object" || Array.isArray(row)) return row;
  const out = {};
  for (const [key, value] of Object.entries(row)) {
    if (COPY_KEYS_FORBIDDEN.has(key) || VALUE_KEYS_FORBIDDEN.has(key)) continue;
    out[key] = value && typeof value === "object" && !Array.isArray(value) ? stripForbiddenKeys(value) : Array.isArray(value) ? value.map(stripForbiddenKeys) : value;
  }
  return out;
}

function enforceExactKeyOrder(compiled) {
  const out = {};
  for (const key of P2C_ACTIVITY_PROFILE_FINAL_INDEX_KEYS) out[key] = compiled[key];
  return out;
}

function unwrap(value, artifactName) {
  if (value && typeof value === "object" && artifactName in value) return value[artifactName];
  if (value && typeof value === "object" && value.payload && artifactName in value.payload) return value.payload[artifactName];
  return value;
}

export const ACTIVITY_PROFILE_SOURCE_INDEX_LOCATOR_KEYS = LOCATOR_KEYS;
