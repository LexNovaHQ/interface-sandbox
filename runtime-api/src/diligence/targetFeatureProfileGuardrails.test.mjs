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

const feature = {
  feature_id: "F001",
  feature_name: "Speech-to-text transcription",
  feature_role: "CORE",
  commercial_function: "Convert uploaded audio into transcript text for developers.",
  business_label_or_product_area: "Example Speech API",
  feature_description: "Developers send audio to an API; the system processes the audio and returns transcript text.",
  actor_or_user: "developers",
  input_data: ["uploaded audio"],
  system_action: "processes uploaded audio into text",
  output_or_result: "transcript text",
  autonomy_level: "none",
  human_review_signal: "not_visible",
  external_action_signal: "false",
  delivery_channels: {
    app: "false",
    api: "true",
    web: "unknown"
  },
  data_provenance: [
    {
      data_origin: "customer_provided",
      data_subject: "user",
      data_category: "audio",
      processing_context: "Developers submit uploaded audio for transcription.",
      storage_or_retention_signal: "not visible in admitted evidence",
      training_or_finetuning_signal: "not visible in admitted evidence",
      source_url: "https://example.ai/products/speech",
      evidence_quote: "Speech-to-text API converts uploaded audio into text.",
      confidence: "high"
    }
  ],
  archetype_codes: ["TRN", "CRT"],
  archetype_labels: ["The Translator", "The Creator"],
  archetype_provenance: [
    {
      archetype_code: "TRN",
      registry_key_detection_logic: "TRN applies to audio/voice signal processing where supported by first-party evidence.",
      matched_feature_behavior: "Feature processes uploaded audio into transcript text.",
      evidence_quote: "Speech-to-text API converts uploaded audio into text.",
      source_url: "https://example.ai/products/speech",
      confidence: "high"
    },
    {
      archetype_code: "CRT",
      registry_key_detection_logic: "CRT applies where the system generates new text, code, media, or synthetic output.",
      matched_feature_behavior: "Feature creates transcript text output from the audio input.",
      evidence_quote: "Developers can use the transcript in their applications.",
      source_url: "https://example.ai/products/speech",
      confidence: "medium"
    }
  ],
  surface_tokens: ["Content&IP"],
  surface_provenance: [
    {
      surface_token: "Content&IP",
      registry_key_surface_meaning: "Content&IP applies where the feature creates, ingests, stores, or transforms copyrightable content.",
      matched_data_or_context: "The feature outputs transcript text for developers to use.",
      evidence_quote: "Developers can use the transcript in their applications.",
      source_url: "https://example.ai/products/speech",
      confidence: "medium"
    }
  ],
  confidence: "high",
  evidence_quote: "Speech-to-text API converts uploaded audio into text.",
  feature_source_url: "https://example.ai/products/speech",
  evidence_refs: ["SRC_001"],
  linked_threat_ids: []
};

const valid = {
  feature_profile_version: "feature_profile_v2",
  target_profile_ref: {
    target_profile_version: "target_profile_v2",
    brand_name: "Example AI",
    legal_name: "Example AI Inc.",
    domain: "example.ai"
  },
  feature_inventory: [feature],
  product_feature_map: [structuredClone(feature)],
  data_provenance_map: [
    {
      provenance_id: "DP001",
      feature_id: "F001",
      data_origin: "customer_provided",
      data_subject: "user",
      data_category: "audio",
      processing_context: "Developers submit uploaded audio for transcription.",
      storage_or_retention_signal: "not visible in admitted evidence",
      training_or_finetuning_signal: "not visible in admitted evidence",
      source_url: "https://example.ai/products/speech",
      evidence_quote: "Speech-to-text API converts uploaded audio into text.",
      confidence: "high"
    }
  ],
  regulated_surface_map: [
    {
      surface_id: "RS001",
      feature_id: "F001",
      surface_token: "Content&IP",
      int_ext_classification: "external",
      basis: "Feature creates transcript text output from customer-provided audio.",
      confidence: "medium",
      evidence_refs: ["SRC_001"]
    }
  ],
  architecture_hints: [],
  commercial_scan: {
    distinct_commercial_outcomes_seen: ["Speech-to-text API converts uploaded audio into text."],
    mapped_core_feature_ids: ["F001"],
    unmapped_outcomes_due_to_insufficient_detail: []
  },
  vault_feature_candidates: {
    baseline: {},
    archetypes: {},
    compliance: {}
  },
  evidence: {
    field_evidence_refs: [
      {
        field_path: "feature_inventory[0].feature_description",
        evidence_refs: ["SRC_001"],
        basis: "Feature source states that the Speech-to-text API converts uploaded audio into text.",
        confidence: "high"
      }
    ],
    unresolved_questions: []
  },
  limitations: []
};

const validResult = validateTargetFeatureProfileGuardrails(valid, { evidenceBuffer });
assert.equal(validResult.ok, true, JSON.stringify(validResult.errors, null, 2));

const missingQuote = structuredClone(valid);
missingQuote.feature_inventory[0].evidence_quote = "This fabricated quote is not in the admitted source.";
missingQuote.product_feature_map[0].evidence_quote = "This fabricated quote is not in the admitted source.";
const missingQuoteResult = validateTargetFeatureProfileGuardrails(missingQuote, { evidenceBuffer });
assert.equal(missingQuoteResult.ok, false);
assert.ok(missingQuoteResult.errors.some((error) => String(error.message).includes("evidence_quote must appear")));

const missingSource = structuredClone(valid);
missingSource.feature_inventory[0].feature_source_url = "https://example.ai/products/unknown";
missingSource.product_feature_map[0].feature_source_url = "https://example.ai/products/unknown";
const missingSourceResult = validateTargetFeatureProfileGuardrails(missingSource, { evidenceBuffer });
assert.equal(missingSourceResult.ok, false);
assert.ok(missingSourceResult.errors.some((error) => String(error.message).includes("feature_source_url must match")));

const missingArchetypeProvenance = structuredClone(valid);
missingArchetypeProvenance.feature_inventory[0].archetype_provenance = missingArchetypeProvenance.feature_inventory[0].archetype_provenance.filter((entry) => entry.archetype_code !== "TRN");
missingArchetypeProvenance.product_feature_map[0].archetype_provenance = structuredClone(missingArchetypeProvenance.feature_inventory[0].archetype_provenance);
const missingArchetypeResult = validateTargetFeatureProfileGuardrails(missingArchetypeProvenance, { evidenceBuffer });
assert.equal(missingArchetypeResult.ok, false);
assert.ok(missingArchetypeResult.errors.some((error) => String(error.message).includes("missing archetype provenance")));

const invalid = structuredClone(valid);
invalid.feature_inventory[0].archetype_codes = ["TRAINER"];
invalid.feature_inventory[0].archetype_labels = ["Trainer"];
invalid.feature_inventory[0].surface_tokens = ["Compliance"];
invalid.feature_inventory[0].evidence_quote = "";
invalid.feature_inventory[0].linked_threat_ids = ["AI-001"];
invalid.product_feature_map[0].feature_id = "WRONG";
invalid.legal_stack_review = {};

const invalidResult = validateTargetFeatureProfileGuardrails(invalid, { evidenceBuffer });
assert.equal(invalidResult.ok, false);
assert.ok(invalidResult.errors.some((error) => String(error.message).includes("invalid archetype code")));
assert.ok(invalidResult.errors.some((error) => String(error.message).includes("invalid surface token")));
assert.ok(invalidResult.errors.some((error) => String(error.message).includes("evidence_quote")));
assert.ok(invalidResult.errors.some((error) => String(error.message).includes("linked_threat_ids")));
assert.ok(invalidResult.errors.some((error) => String(error.message).includes("forbidden key")));
assert.ok(invalidResult.errors.some((error) => String(error.message).includes("compatibility alias")));

console.log(JSON.stringify({
  ok: true,
  test: "targetFeatureProfileGuardrails",
  valid_ok: validResult.ok,
  missing_quote_error_count: missingQuoteResult.errors.length,
  missing_source_error_count: missingSourceResult.errors.length,
  missing_archetype_error_count: missingArchetypeResult.errors.length,
  invalid_error_count: invalidResult.errors.length
}, null, 2));
