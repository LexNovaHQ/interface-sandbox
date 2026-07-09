import assert from "node:assert/strict";
import { buildFeatureCandidateInventoryIndex, validateFeatureCandidateInventoryIndex } from "../src/m8-feature-candidate-inventory-index.js";

const RUN_ID = "LN-TEST-SARVAM-M8-DETERMINISTIC";
const sourceArtifacts = [
  root("product_service", [
    source("product_service.SRC.002", "https://sarvam.ai/products/akshar", "product_slug"),
    source("product_service.SRC.003", "https://sarvam.ai/products/arya", "product_slug"),
    source("product_service.SRC.004", "https://sarvam.ai/products/conversational-agents", "product_slug"),
    source("product_service.SRC.005", "https://sarvam.ai/products/edge", "product_slug"),
    source("product_service.SRC.007", "https://sarvam.ai/products/studio", "product_slug")
  ]),
  root("technical_docs_api_developer", [
    source("technical_docs_api_developer.SRC.002", "https://sarvam.ai/apis/document-digitisation", "api_docs_or_api_root"),
    source("technical_docs_api_developer.SRC.003", "https://sarvam.ai/apis/dubbing", "api_docs_or_api_root"),
    source("technical_docs_api_developer.SRC.004", "https://sarvam.ai/apis/speech-to-text", "api_docs_or_api_root"),
    source("technical_docs_api_developer.SRC.005", "https://sarvam.ai/apis/text-to-speech", "api_docs_or_api_root"),
    source("technical_docs_api_developer.SRC.006", "https://sarvam.ai/apis/translation", "api_docs_or_api_root"),
    source("technical_docs_api_developer.SRC.007", "https://sarvam.ai/docs", "docs_root"),
    source("technical_docs_api_developer.SRC.009", "https://sarvam.ai/models", "models_overview")
  ]),
  root("integrations_ecosystem", [source("integrations_ecosystem.SRC.001", "https://sarvam.ai/integrations", "integrations_root")]),
  root("pricing_commercial_availability", [{ ...source("pricing_commercial_availability.SRC.001", "https://sarvam.ai/api-pricing", "pricing_or_plans"), lossless_text: "Sarvam 105B Sarvam 30B Sarvam Vision Text to Speech Bulbul Speech to Text Translation Mayura Transliteration Language Identification" }])
];

const inventory = buildFeatureCandidateInventoryIndex(sourceArtifacts, { runId: RUN_ID });
assert.equal(inventory.artifact_type, "feature_candidate_inventory");
assert.equal(inventory.derivation_mode, "DETERMINISTIC_INDEX_NO_MODEL_NO_EVIDENCE_COMPILATION");
assert.ok(inventory.raw_hit_count >= 17, `expected at least 17 raw hits, got ${inventory.raw_hit_count}`);
assert.equal(validateFeatureCandidateInventoryIndex(inventory).status, "PASS");

const keys = new Set(inventory.candidates.map((candidate) => candidate.canonical_feature_key));
for (const expectedKey of ["akshar::akshar::product-wrapper", "arya::arya::product-wrapper", "conversational-agents::conversational-agents::product-wrapper", "edge::edge::product-wrapper", "studio::studio::product-wrapper", "sarvam-api::speech-to-text::standalone-api", "sarvam-api::text-to-speech::standalone-api", "sarvam-api::translation::standalone-api", "models::model-catalogue::model-catalogue", "integrations::integration-surface::integration-surface"]) assert.ok(keys.has(expectedKey), `missing canonical key ${expectedKey}`);

for (const candidate of inventory.candidates) {
  assert.ok(Array.isArray(candidate.source_pointers) && candidate.source_pointers.length, `${candidate.candidate_id} must have source pointers`);
  assert.equal(candidate.source_refs, undefined, `${candidate.candidate_id} must not carry evidence refs`);
  for (const pointer of candidate.source_pointers) {
    assert.ok(pointer.lossless_artifact_name?.startsWith("lossless_root__"), "source pointer must name common-root artifact");
    assert.equal(pointer.excerpt, undefined, "source pointer must not copy excerpts");
    assert.equal(pointer.lossless_text, undefined, "source pointer must not copy source text");
  }
}

console.log(JSON.stringify({ check: "m8 feature candidate inventory index-only", status: "PASS", raw_hit_count: inventory.raw_hit_count, canonical_candidate_count: inventory.canonical_candidate_count }, null, 2));

function root(commonRoot, sources) { return { run_id: RUN_ID, artifact_name: `lossless_root__${commonRoot}`, artifact: { run_id: RUN_ID, common_root: commonRoot, sources: sources.map((entry) => ({ ...entry, common_root: commonRoot })) } }; }
function source(sourceId, url, routeType) { return { source_id: sourceId, canonical_url: url, url, route_type: routeType, lossless_text: url }; }
