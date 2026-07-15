import {
  P2B_DOMAIN_DERIVATION_ARTIFACTS,
  P2B_DOMAIN_DERIVATION_FINAL_INDEX_KEYS,
  P2B_DOMAIN_DERIVATION_ALLOWED_ROUTE_CLASSES,
  P2B_DOMAIN_DERIVATION_ALLOWED_SIGNAL_FAMILIES,
  P2B_DOMAIN_DERIVATION_FORBIDDEN_OUTPUTS,
  P2B_DOMAIN_DERIVATION_FORBIDDEN_CONCLUSIONS,
  P2B_DOMAIN_DERIVATION_RETIRED_ROOTS_FORBIDDEN
} from "../domain-derivation-source-index.contract.js";

const FINAL_ARTIFACT = P2B_DOMAIN_DERIVATION_ARTIFACTS.finalIndex;
const LOCATOR_MAP_KEYS = Object.freeze([
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
const COPIED_TEXT_KEYS = Object.freeze(["summary", "excerpt", "snippet", "quote", "lossless_text", "clean_text", "raw_text", "body", "content", "notes", "reasoning"]);
const DERIVED_VALUE_KEYS = Object.freeze(["primary_domain", "domain_package", "ai_overlay", "regulatory_overlay", "fusion_status", "derived_value", "value", "conclusion"]);

export function validateDomainDerivationSourceIndex({ sourceIndex } = {}) {
  const errors = [];
  validateForbiddenArtifactRoots(sourceIndex, errors);
  const index = unwrapFinal(sourceIndex);
  if (!index || typeof index !== "object" || Array.isArray(index)) errors.push("domain_derivation_source_index must be an object");
  if (!index) return { ok: false, errors, artifact_name: FINAL_ARTIFACT };

  const keys = Object.keys(index);
  if (JSON.stringify(keys) !== JSON.stringify(P2B_DOMAIN_DERIVATION_FINAL_INDEX_KEYS)) errors.push("domain_derivation_source_index must contain exact final keys in contract order");

  for (const key of LOCATOR_MAP_KEYS) {
    if (!Array.isArray(index[key])) errors.push(`${key} must be an array`);
    for (const [rowIndex, row] of ensureArray(index[key]).entries()) validateLocatorRow({ key, rowIndex, row, errors });
  }

  if (!Array.isArray(index.semantic_navigation_index)) errors.push("semantic_navigation_index must be an array");
  for (const [rowIndex, row] of ensureArray(index.semantic_navigation_index).entries()) validateSemanticRow({ rowIndex, row, errors });
  validateFusionRows(index.fusion_candidate_locator_map, errors);
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
  for (const artifactName of P2B_DOMAIN_DERIVATION_FORBIDDEN_OUTPUTS) {
    if (Object.prototype.hasOwnProperty.call(value, artifactName)) errors.push(`2B must not emit forbidden artifact root ${artifactName}`);
    if (value.payload && typeof value.payload === "object" && Object.prototype.hasOwnProperty.call(value.payload, artifactName)) errors.push(`2B must not emit forbidden payload root ${artifactName}`);
  }
}

function validateLocatorRow({ key, rowIndex, row, errors }) {
  if (!row || typeof row !== "object" || Array.isArray(row)) {
    errors.push(`${key}[${rowIndex}] must be an object`);
    return;
  }
  for (const required of ["locator_id", "unit_id", "source_artifact", "source_id", "common_root", "route_class", "phase_2b_action", "downstream_owner", "navigation_pointer"]) {
    if (!(required in row)) errors.push(`${key}[${rowIndex}] missing ${required}`);
  }
  if (!P2B_DOMAIN_DERIVATION_ALLOWED_ROUTE_CLASSES.includes(row.route_class)) errors.push(`${key}[${rowIndex}] has forbidden route_class ${row.route_class}`);
  if (row.phase_2b_action !== "LOCATE_ONLY") errors.push(`${key}[${rowIndex}] must be LOCATE_ONLY`);
  if (row.downstream_owner !== "P3_DOMAIN_DERIVATION_LAYER") errors.push(`${key}[${rowIndex}] downstream owner must be 3B`);
  for (const family of ensureArray(row.route_signal_families)) if (!P2B_DOMAIN_DERIVATION_ALLOWED_SIGNAL_FAMILIES.includes(family)) errors.push(`${key}[${rowIndex}] has forbidden signal family ${family}`);
  for (const copied of COPIED_TEXT_KEYS) if (copied in row) errors.push(`${key}[${rowIndex}] includes copied-text key ${copied}`);
  for (const derived of DERIVED_VALUE_KEYS) if (derived in row && row[derived] !== null) errors.push(`${key}[${rowIndex}] includes derived-value key ${derived}`);
}

function validateSemanticRow({ rowIndex, row, errors }) {
  if (!row || typeof row !== "object" || Array.isArray(row)) {
    errors.push(`semantic_navigation_index[${rowIndex}] must be an object`);
    return;
  }
  for (const copied of COPIED_TEXT_KEYS) if (copied in row) errors.push(`semantic_navigation_index[${rowIndex}] includes copied-text key ${copied}`);
  for (const derived of DERIVED_VALUE_KEYS) if (derived in row) errors.push(`semantic_navigation_index[${rowIndex}] includes derived-value key ${derived}`);
}

function validateFusionRows(rows = [], errors) {
  for (const [index, row] of ensureArray(rows).entries()) {
    if (row.route_class !== "FUSION_CANDIDATE_ROUTE") errors.push(`fusion_candidate_locator_map[${index}] must be FUSION_CANDIDATE_ROUTE`);
    if (row.phase_2b_action !== "LOCATE_ONLY") errors.push(`fusion_candidate_locator_map[${index}] must be LOCATE_ONLY`);
    if (!row.fusion_basis?.ai_signal_visible) errors.push(`fusion_candidate_locator_map[${index}] must include AI signal basis`);
    if (Number(row.fusion_basis?.composite_signal_count || 0) < 2) errors.push(`fusion_candidate_locator_map[${index}] must have composite_signal_count >= 2`);
  }
}

function validateDownstreamRules(rules = {}, errors) {
  if (rules.domain_derivation_source_index_owned_by_2b !== true) errors.push("downstream_rules must lock domain_derivation_source_index ownership to 2B");
  if (rules.activity_profile_source_index_reserved_for_2c_phase5 !== true) errors.push("downstream_rules must reserve activity_profile_source_index for 2C/Phase 5");
  if (rules.domain_derivation_layer_derives_values_later !== true) errors.push("downstream_rules must state 3B derives values later");
  if (rules.full_text_copied !== false || rules.summaries_allowed !== false || rules.excerpts_allowed !== false) errors.push("downstream_rules must forbid copied text, summaries, and excerpts");
}

function validateNoForbiddenMarkers(value, errors) {
  for (const marker of [...P2B_DOMAIN_DERIVATION_FORBIDDEN_CONCLUSIONS, ...P2B_DOMAIN_DERIVATION_RETIRED_ROOTS_FORBIDDEN]) {
    if (containsExactMarker(value, marker)) errors.push(`final index includes forbidden marker ${marker}`);
  }
}

function containsExactMarker(value, marker) {
  if (typeof value === "string") return value === marker;
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some((item) => containsExactMarker(item, marker));
  return Object.entries(value).some(([key, item]) => key === marker || containsExactMarker(item, marker));
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}
