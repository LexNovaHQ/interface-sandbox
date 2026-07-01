import assert from "node:assert/strict";
import {
  buildFeatureCandidateInventory,
  validateFeatureCandidateCoverage,
  buildM8FeatureCoverageForensics,
} from "../src/m8-feature-candidate-inventory.js";

const RUN_ID = "LN-TEST-SARVAM-M8-DETERMINISTIC";

const sourceArtifacts = [
  family("P1_PRODUCT", [
    source("P1_PRODUCT.SRC.002", "https://sarvam.ai/products/akshar", "product_slug"),
    source("P1_PRODUCT.SRC.003", "https://sarvam.ai/products/arya", "product_slug"),
    source("P1_PRODUCT.SRC.004", "https://sarvam.ai/products/conversational-agents", "product_slug"),
    source("P1_PRODUCT.SRC.005", "https://sarvam.ai/products/edge", "product_slug"),
    source("P1_PRODUCT.SRC.007", "https://sarvam.ai/products/studio", "product_slug"),
  ]),
  family("P3_AI_CAPABILITY_TECHNICAL", [
    source("P3_AI_CAPABILITY_TECHNICAL.SRC.002", "https://sarvam.ai/apis/document-digitisation", "api_docs_or_api_family_root"),
    source("P3_AI_CAPABILITY_TECHNICAL.SRC.003", "https://sarvam.ai/apis/dubbing", "api_docs_or_api_family_root"),
    source("P3_AI_CAPABILITY_TECHNICAL.SRC.004", "https://sarvam.ai/apis/speech-to-text", "api_docs_or_api_family_root"),
    source("P3_AI_CAPABILITY_TECHNICAL.SRC.005", "https://sarvam.ai/apis/text-to-speech", "api_docs_or_api_family_root"),
    source("P3_AI_CAPABILITY_TECHNICAL.SRC.006", "https://sarvam.ai/apis/translation", "api_docs_or_api_family_root"),
    source("P3_AI_CAPABILITY_TECHNICAL.SRC.007", "https://sarvam.ai/docs", "api_docs_or_api_family_root"),
    source("P3_AI_CAPABILITY_TECHNICAL.SRC.008", "https://sarvam.ai/integrations", "integrations_root"),
    source("P3_AI_CAPABILITY_TECHNICAL.SRC.009", "https://sarvam.ai/models", "models_overview"),
  ]),
  family("P5_ENTERPRISE_PRICING", [
    {
      ...source("P5_ENTERPRISE_PRICING.SRC.001", "https://sarvam.ai/api-pricing", "pricing_or_plans"),
      lossless_text: `API Pricing (Pay Per Use) Sarvam 105B (Chat LLM): Free per token Sarvam 30B (Chat LLM): Free per token Sarvam Vision: ₹0.50 per page Text to Speech Bulbul v3: ₹30 per 10,000 characters Text to Speech Bulbul v2: ₹15 per 10,000 characters Speech to Text: ₹30 per hour of audio Speech to Text with Diarization: ₹45 per hour of audio Speech to Text and Translate: ₹30 per hour of audio Sarvam Translate V1: ₹20 per 10,000 characters Translate Mayura V1: ₹20 per 10,000 characters Transliterate: ₹20 per 10,000 characters Language Identification: ₹3.50 per 10,000 characters Subscription plans`,
    },
  ]),
];

const inventory = buildFeatureCandidateInventory(sourceArtifacts, { runId: RUN_ID });
assert.equal(inventory.artifact_type, "feature_candidate_inventory");
assert.equal(inventory.derivation_mode, "DETERMINISTIC_NO_MODEL");
assert.ok(inventory.raw_hit_count >= 17, `expected at least 17 raw hits, got ${inventory.raw_hit_count}`);

const keys = new Set(inventory.candidates.map((candidate) => candidate.canonical_feature_key));
for (const expectedKey of [
  "akshar::akshar::product-wrapper",
  "arya::arya::product-wrapper",
  "conversational-agents::conversational-agents::product-wrapper",
  "edge::edge::product-wrapper",
  "studio::studio::product-wrapper",
  "sarvam-api::document-digitisation::standalone-api",
  "sarvam-api::dubbing::standalone-api",
  "sarvam-api::speech-to-text::standalone-api",
  "sarvam-api::text-to-speech::standalone-api",
  "sarvam-api::translation::standalone-api",
  "sarvam-api::transliteration::standalone-api",
  "sarvam-api::language-identification::standalone-api",
  "models::model-catalogue::model-catalogue",
  "models::chat-llm-model-access::model-access",
  "models::vision-model-access::model-access",
  "integrations::integration-surface::integration-surface",
]) {
  assert.ok(keys.has(expectedKey), `missing canonical key ${expectedKey}`);
}

assert.equal(keys.size, inventory.candidates.length, "canonical_feature_key must be unique per candidate");
assert.ok(inventory.dedup_merge_ledger.length >= 3, "pricing duplicates should merge into API/model candidates where keys overlap");

const partialLegacyProfile = {
  activities: [
    activity("ACT.001", candidateIdFor(inventory, "akshar::akshar::product-wrapper")),
    activity("ACT.002", candidateIdFor(inventory, "arya::arya::product-wrapper")),
    activity("ACT.003", candidateIdFor(inventory, "conversational-agents::conversational-agents::product-wrapper")),
  ],
  profile_level_limitations: [],
};
const partialCoverage = validateFeatureCandidateCoverage(inventory, partialLegacyProfile);
assert.equal(partialCoverage.coverage_result, "FAIL");
assert.ok(partialCoverage.uncovered_candidates.some((candidate) => candidate.canonical_feature_key.includes("studio")), "Studio must be uncovered in 3-row profile");
assert.ok(partialCoverage.uncovered_candidates.some((candidate) => candidate.canonical_feature_key.includes("speech-to-text")), "Speech-to-Text must be uncovered in 3-row profile");

const passingProfile = {
  activities: inventory.candidates.map((candidate, index) => activity(`ACT.${String(index + 1).padStart(3, "0")}`, candidate.candidate_id)),
  profile_level_limitations: [],
};
const passingCoverage = validateFeatureCandidateCoverage(inventory, passingProfile);
assert.equal(passingCoverage.coverage_result, "PASS", JSON.stringify(passingCoverage.failures, null, 2));

const forensics = buildM8FeatureCoverageForensics(inventory, passingProfile, passingCoverage);
assert.equal(forensics.artifact_type, "target_feature_profile_forensics");
assert.equal(forensics.validation_result.coverage_result, "PASS");
assert.equal(forensics.canonical_feature_candidate_ledger.length, inventory.candidates.length);

console.log(JSON.stringify({
  check: "m8 deterministic feature candidate inventory",
  status: "PASS",
  raw_hit_count: inventory.raw_hit_count,
  canonical_candidate_count: inventory.canonical_candidate_count,
  dedup_merge_count: inventory.dedup_merge_ledger.length,
}, null, 2));

function family(rootFamily, sources) {
  return {
    run_id: RUN_ID,
    artifact_name: `lossless_family__${rootFamily}`,
    artifact: {
      run_id: RUN_ID,
      root_family: rootFamily,
      sources: sources.map((entry) => ({ ...entry, root_family: rootFamily })),
    },
  };
}

function source(sourceId, url, routeType) {
  return {
    source_id: sourceId,
    canonical_url: url,
    url,
    route_type: routeType,
    lossless_text: url,
  };
}

function activity(activityReference, candidateId) {
  return {
    activity_reference: activityReference,
    source_candidate_ids: [candidateId],
    coverage_disposition: "DIRECT_ACTIVITY_ROW",
    product_service_wrapper: "fixture",
    activity_feature_name: "fixture",
    activity_candidate_summary: "fixture",
    mechanics_proof: "fixture",
    autonomy_human_control_signal: "fixture",
    data_content_object_touched: "fixture",
    external_internal_action_signal: "fixture",
    archetype_codes: ["CRT"],
    archetype_proof: "fixture",
    surface_context_tokens: ["Content&IP"],
    surface_proof_and_routing_limits: "fixture",
    child_capabilities: [],
  };
}

function candidateIdFor(candidateInventory, canonicalFeatureKey) {
  const candidate = candidateInventory.candidates.find((row) => row.canonical_feature_key === canonicalFeatureKey);
  assert.ok(candidate, `candidate not found for ${canonicalFeatureKey}`);
  return candidate.candidate_id;
}
