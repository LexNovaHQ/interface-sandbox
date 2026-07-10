import {
  P2B_DOMAIN_DERIVATION_ARTIFACTS,
  P2B_DOMAIN_DERIVATION_FINAL_INDEX_KEYS
} from "../domain-derivation-source-index.contract.js";

const FINAL_ARTIFACT = P2B_DOMAIN_DERIVATION_ARTIFACTS.finalIndex;
const DETERMINISTIC_ARTIFACT = P2B_DOMAIN_DERIVATION_ARTIFACTS.deterministicMap;
const SEMANTIC_ARTIFACT = P2B_DOMAIN_DERIVATION_ARTIFACTS.semanticProfile;
const LOCATOR_KEYS = Object.freeze([
  "primary_domain_locator_map",
  "ai_overlay_locator_map",
  "regulatory_overlay_locator_map",
  "fusion_candidate_locator_map",
  "activity_capability_locator_map",
  "commercial_availability_locator_map",
  "technical_capability_locator_map",
  "integration_ecosystem_locator_map",
  "use_case_customer_industry_locator_map"
]);

const COPY_KEYS_FORBIDDEN = new Set(["summary", "excerpt", "snippet", "quote", "lossless_text", "clean_text", "raw_text", "body", "content", "notes", "reasoning"]);
const VALUE_KEYS_FORBIDDEN = new Set(["primary_domain", "domain_package", "ai_overlay", "regulatory_overlay", "fusion_status", "derived_value", "value", "conclusion"]);

export function compileDomainDerivationSourceIndex({ deterministicMap, semanticProfile } = {}) {
  const deterministic = unwrap(deterministicMap, DETERMINISTIC_ARTIFACT);
  const semantic = unwrap(semanticProfile, SEMANTIC_ARTIFACT);
  const compiled = {
    source_coverage_index: cloneRows(deterministic?.domain_derivation_source_coverage_index),
    domain_derivation_document_structure_index: cloneRows(deterministic?.domain_derivation_document_structure_index),
    primary_domain_locator_map: cleanRows(deterministic?.primary_domain_locator_map),
    ai_overlay_locator_map: cleanRows(deterministic?.ai_overlay_locator_map),
    regulatory_overlay_locator_map: cleanRows(deterministic?.regulatory_overlay_locator_map),
    fusion_candidate_locator_map: cleanRows(deterministic?.fusion_candidate_locator_map),
    activity_capability_locator_map: cleanRows(deterministic?.activity_capability_locator_map),
    commercial_availability_locator_map: cleanRows(deterministic?.commercial_availability_locator_map),
    technical_capability_locator_map: cleanRows(deterministic?.technical_capability_locator_map),
    integration_ecosystem_locator_map: cleanRows(deterministic?.integration_ecosystem_locator_map),
    use_case_customer_industry_locator_map: cleanRows(deterministic?.use_case_customer_industry_locator_map),
    priority_domain_derivation_locator: buildPriorityLocator(deterministic),
    semantic_navigation_index: cleanRows(semantic?.semantic_navigation_index),
    missing_limited_domain_derivation_items: cloneRows(deterministic?.missing_limited_domain_derivation_source_map),
    downstream_rules: {
      ...(deterministic?.downstream_rules || {}),
      phase_2b_is_index_only: true,
      domain_derivation_source_index_owned_by_2b: true,
      activity_profile_source_index_reserved_for_2c_phase5: true,
      domain_derivation_layer_derives_values_later: true,
      source_artifacts_remain_source_of_truth: true,
      primary_domain_derivation_forbidden_in_2b: true,
      ai_overlay_derivation_forbidden_in_2b: true,
      regulatory_overlay_derivation_forbidden_in_2b: true,
      domain_package_selection_forbidden_in_2b: true,
      active_manifest_update_forbidden_in_2b: true,
      full_text_copied: false,
      summaries_allowed: false,
      excerpts_allowed: false,
      legal_or_compliance_conclusions_allowed: false
    },
    lock_status: semantic?.lock_status === "REPAIR_REQUIRED" ? "REPAIR_REQUIRED" : deterministic?.lock_status || "LOCKED_WITH_LIMITATIONS"
  };

  const final = enforceExactKeyOrder(compiled);
  return { [FINAL_ARTIFACT]: final };
}

function buildPriorityLocator(deterministic = {}) {
  return {
    primary_domain_priority_units: topUnits(deterministic.primary_domain_locator_map),
    ai_overlay_priority_units: topUnits(deterministic.ai_overlay_locator_map),
    regulatory_overlay_priority_units: topUnits(deterministic.regulatory_overlay_locator_map),
    fusion_candidate_priority_units: topUnits(deterministic.fusion_candidate_locator_map),
    instruction: "3B must use these locators to read Phase 1 source artifacts and derive through the Domain Derivation Registry. 2B emits no domain, AI overlay, regulatory overlay, fusion, package, or manifest value."
  };
}

function topUnits(rows = []) {
  return cleanRows(rows).slice(0, 20).map((row) => ({ locator_id: row.locator_id, unit_id: row.unit_id, source_artifact: row.source_artifact, source_id: row.source_id, common_root: row.common_root, navigation_pointer: row.navigation_pointer, route_class: row.route_class, priority: row.priority }));
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
  for (const key of P2B_DOMAIN_DERIVATION_FINAL_INDEX_KEYS) out[key] = compiled[key];
  return out;
}

function unwrap(value, artifactName) {
  if (value && typeof value === "object" && artifactName in value) return value[artifactName];
  if (value && typeof value === "object" && value.payload && artifactName in value.payload) return value.payload[artifactName];
  return value;
}

export const DOMAIN_DERIVATION_SOURCE_INDEX_LOCATOR_KEYS = LOCATOR_KEYS;
