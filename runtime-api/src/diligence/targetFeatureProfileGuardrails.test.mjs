import assert from "node:assert/strict";
import { validateTargetFeatureProfileGuardrails } from "./targetFeatureProfileGuardrails.js";

const evidenceBuffer = [
  {
    evidence_source_id: "SRC_001",
    source_family: "product_profile",
    source_url: "https://example.ai/products/speech",
    final_url: "https://example.ai/products/speech",
    clean_text_lossless: "Example Speech API provides a Speech-to-text API converts uploaded audio into text. Developers can use the transcript in their applications."
  }
];

const valid = {
  target_profile: {
    company_name: "Example AI",
    website: "https://example.ai",
    legal_entity: "not visible in admitted evidence",
    hq_jurisdiction: "not visible in admitted evidence",
    actual_processing_location: "not visible in admitted evidence",
    data_sovereignty_signature: "No processing-location statement visible in admitted evidence",
    primary_claim: "Speech AI for applications"
  },
  primary_product: {
    product_name: "Example Speech API",
    user: "developers",
    function: "converts audio into text",
    mechanism: "API receives audio and returns transcript text",
    agent_actor: "processes audio and generates transcript text",
    agent_brand_name: "not visible in admitted evidence"
  },
  product_feature_map: [
    {
      feature_id: "F001",
      feature_name: "Speech-to-text transcription",
      feature_role: "CORE",
      feature_description: "Developers send audio to an API; the system processes the audio and returns transcript text.",
      archetype_codes: ["TRN", "CRT"],
      archetype_labels: ["The Translator", "The Creator"],
      surface_tokens: ["Content&IP"],
      evidence_quote: "Speech-to-text API converts uploaded audio into text.",
      feature_source_url: "https://example.ai/products/speech",
      linked_threat_ids: []
    }
  ],
  raw_feature_candidates: [],
  feature_map_scratchpad: [],
  limitations: []
};

const validResult = validateTargetFeatureProfileGuardrails(valid, { evidenceBuffer });
assert.equal(validResult.ok, true);

const missingQuote = structuredClone(valid);
missingQuote.product_feature_map[0].evidence_quote = "This fabricated quote is not in the admitted source.";
const missingQuoteResult = validateTargetFeatureProfileGuardrails(missingQuote, { evidenceBuffer });
assert.equal(missingQuoteResult.ok, false);
assert.ok(missingQuoteResult.errors.some((error) => String(error.message).includes("evidence_quote must appear")));

const missingSource = structuredClone(valid);
missingSource.product_feature_map[0].feature_source_url = "https://example.ai/products/unknown";
const missingSourceResult = validateTargetFeatureProfileGuardrails(missingSource, { evidenceBuffer });
assert.equal(missingSourceResult.ok, false);
assert.ok(missingSourceResult.errors.some((error) => String(error.message).includes("feature_source_url must match")));

const invalid = structuredClone(valid);
invalid.product_feature_map[0].archetype_codes = ["TRAINER"];
invalid.product_feature_map[0].archetype_labels = ["Trainer"];
invalid.product_feature_map[0].surface_tokens = ["Compliance"];
invalid.product_feature_map[0].evidence_quote = "";
invalid.product_feature_map[0].linked_threat_ids = ["AI-001"];
invalid.legal_stack_review = {};

const invalidResult = validateTargetFeatureProfileGuardrails(invalid, { evidenceBuffer });
assert.equal(invalidResult.ok, false);
assert.ok(invalidResult.errors.some((error) => String(error.message).includes("invalid archetype code")));
assert.ok(invalidResult.errors.some((error) => String(error.message).includes("invalid surface token")));
assert.ok(invalidResult.errors.some((error) => String(error.message).includes("evidence_quote")));
assert.ok(invalidResult.errors.some((error) => String(error.message).includes("linked_threat_ids")));
assert.ok(invalidResult.errors.some((error) => String(error.message).includes("forbidden key")));

console.log(JSON.stringify({
  ok: true,
  test: "targetFeatureProfileGuardrails",
  valid_ok: validResult.ok,
  missing_quote_error_count: missingQuoteResult.errors.length,
  missing_source_error_count: missingSourceResult.errors.length,
  invalid_error_count: invalidResult.errors.length
}, null, 2));
