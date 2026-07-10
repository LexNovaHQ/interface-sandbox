import assert from "node:assert/strict";
import { buildFeatureCandidateInventoryIndex, validateFeatureCandidateInventoryIndex } from "../src/m8-feature-candidate-inventory-index.js";

const RUN_ID = "LN-TEST-SARVAM-M8-DETERMINISTIC";
const activity_profile_source_index = {
  run_id: RUN_ID,
  activity_candidate_source_locator_map: [locator("LOC.001", "product_service", "PRODUCT_CAPABILITY_ROUTE", "P2C-ACT-CAND", "akshar")],
  product_capability_locator_map: [locator("LOC.002", "platform_feature_solution", "PRODUCT_CAPABILITY_ROUTE", "P2C-PROD-CAP", "arya")],
  feature_mechanics_locator_map: [locator("LOC.003", "platform_feature_solution", "FEATURE_MECHANICS_ROUTE", "P2C-FEAT-MECH", "conversational-agents")],
  technical_mechanics_locator_map: [locator("LOC.004", "technical_docs_api", "TECHNICAL_MECHANICS_ROUTE", "P2C-TECH-MECH", "document-digitisation")],
  api_interaction_locator_map: [locator("LOC.005", "docs_api_data_flow", "API_INTERACTION_ROUTE", "P2C-API", "speech-to-text")],
  data_object_interaction_locator_map: [locator("LOC.006", "docs_api_data_flow", "DATA_OBJECT_INTERACTION_ROUTE", "P2C-DATA", "translation")],
  integration_action_locator_map: [locator("LOC.007", "integrations_ecosystem", "INTEGRATION_ACTION_ROUTE", "P2C-INT", "integrations")],
  commercial_availability_locator_map: [locator("LOC.008", "pricing_commercial_availability", "COMMERCIAL_AVAILABILITY_ROUTE", "P2C-COMM", "text-to-speech")],
  external_action_context_locator_map: [locator("LOC.009", "product_service", "EXTERNAL_ACTION_CONTEXT_ROUTE", "P2C-EXT", "edge")],
  input_output_object_context_locator_map: [locator("LOC.010", "technical_docs_api", "INPUT_OUTPUT_OBJECT_CONTEXT_ROUTE", "P2C-IO", "language-identification")],
  customer_use_context_locator_map: [{ ...locator("LOC.011", "use_case_customer_industry", "CUSTOMER_USE_CONTEXT_ROUTE", "P2C-CTX", "enterprise-use-case"), candidate_creation_allowed: false, context_only: true }]
};

const inventory = buildFeatureCandidateInventoryIndex({ activity_profile_source_index }, { runId: RUN_ID });
assert.equal(inventory.artifact_type, "feature_candidate_inventory");
assert.equal(inventory.derivation_mode, "DETERMINISTIC_INDEX_FROM_ACTIVITY_PROFILE_SOURCE_INDEX_NO_MODEL_NO_EVIDENCE_COMPILATION");
assert.equal(inventory.source_index_artifact, "activity_profile_source_index");
assert.ok(inventory.raw_hit_count >= 10, `expected at least 10 raw hits, got ${inventory.raw_hit_count}`);
assert.equal(validateFeatureCandidateInventoryIndex(inventory).status, "PASS");

const keys = new Set(inventory.candidates.map((candidate) => candidate.canonical_feature_key));
for (const expectedKey of ["PRODUCT_CAPABILITY_ROUTE::P2C-ACT-CAND-akshar", "API_INTERACTION_ROUTE::P2C-API-speech-to-text", "INTEGRATION_ACTION_ROUTE::P2C-INT-integrations"].map((value) => value.toLowerCase())) assert.ok([...keys].some((key) => key.toLowerCase() === expectedKey), `missing canonical key ${expectedKey}`);

for (const candidate of inventory.candidates) {
  assert.ok(Array.isArray(candidate.source_pointers) && candidate.source_pointers.length, `${candidate.candidate_id} must have source pointers`);
  assert.equal(candidate.archetype_codes, undefined, `${candidate.candidate_id} must not carry package labels`);
  assert.equal(candidate.surface_context_tokens, undefined, `${candidate.candidate_id} must not carry package labels`);
  for (const pointer of candidate.source_pointers) {
    assert.ok(pointer.source_artifact?.startsWith("lossless_root__"), "source pointer must name common-root artifact");
    assert.equal(pointer.excerpt, undefined, "source pointer must not copy excerpts");
    assert.equal(pointer.lossless_text, undefined, "source pointer must not copy source text");
  }
}

console.log(JSON.stringify({ check: "m8 feature candidate inventory from phase2c", status: "PASS", raw_hit_count: inventory.raw_hit_count, canonical_candidate_count: inventory.canonical_candidate_count }, null, 2));

function locator(locatorId, root, routeClass, routeCode, unitId) {
  return {
    locator_id: `P2C.${locatorId}`,
    unit_id: `${routeCode}-${unitId}`,
    source_artifact: `lossless_root__${root}`,
    source_id: `${root}.SRC.${locatorId}`,
    common_root: root,
    route_class: routeClass,
    route_code: routeCode,
    route_action: "LOCATE_ONLY",
    signal_families: ["activity_candidate_source"],
    candidate_creation_allowed: true,
    context_only: false,
    matched_signal_labels: [unitId],
    confidence_hint: "HIGH",
    source_pointer: { artifact_name: `lossless_root__${root}`, source_id: `${root}.SRC.${locatorId}` },
    unit_pointer: { unit_id: `${routeCode}-${unitId}` },
    derived_value_forbidden: true,
    package_specific_classification_forbidden: true,
    source_text_copied: false
  };
}
