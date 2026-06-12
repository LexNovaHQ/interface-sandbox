import assert from "node:assert/strict";
import { validateTargetFeatureProfileGuardrails } from "./targetFeatureProfileGuardrails.js";

const sourceUrl = "https://example.ai/products/speech";
const crossPackageUrl = "https://example.ai/privacy-policy";
const evidenceBuffer = [{
  evidence_source_id: "SRC_001",
  source_family: "product_profile",
  source_url: sourceUrl,
  final_url: sourceUrl,
  clean_text_lossless: "Speech-to-text API converts uploaded audio into text. Developers can use the transcript in their applications. Check balances. Update records. Schedule appointments. Process payments. Samvaad connects to your systems and gets the work done."
}];

const packageInput = {
  source_bundle: {
    target_input: { primary_url: "https://example.ai" },
    evidence_buffer: evidenceBuffer
  },
  target_profile_v2: {
    identity: { domain: "example.ai", website: "https://example.ai" },
    data_touchpoint_map: [{
      source_url: crossPackageUrl,
      evidence_quote: "We collect the information provided by you including inputs, file uploads, and outputs."
    }]
  }
};

function baseProfile() {
  const data = {
    data_origin: "customer_provided",
    data_subject: "user",
    data_category: "audio",
    processing_context: "Uploaded audio is processed into transcript text.",
    storage_or_retention_signal: "not visible in admitted evidence",
    training_or_finetuning_signal: "not visible in admitted evidence",
    evidence_quote: "Speech-to-text API converts uploaded audio into text.",
    source_url: sourceUrl,
    confidence: "high"
  };
  return {
    feature_profile_version: "feature_profile_v2",
    target_profile_ref: { target_profile_version: "target_profile_v2", brand_name: "Example AI", legal_name: "Example AI Inc.", domain: "example.ai" },
    feature_inventory: [{
      feature_id: "F001",
      feature_name: "Speech transcription",
      feature_role: "CORE",
      commercial_function: "Convert uploaded audio into transcript text.",
      feature_description: "Developers send audio and receive transcript text.",
      system_action: "processes uploaded audio into text",
      output_or_result: "transcript text",
      autonomy_level: "none",
      human_review_signal: "not_visible",
      external_action_signal: "false",
      delivery_channels: { app: "false", api: "true", web: "unknown" },
      data_provenance: [{ ...data }],
      archetype_codes: ["TRN"],
      archetype_labels: ["The Translator"],
      archetype_provenance: [{ archetype_code: "TRN", evidence_quote: "Speech-to-text API converts uploaded audio into text.", source_url: sourceUrl, confidence: "high" }],
      surface_tokens: ["Content&IP"],
      surface_provenance: [{ surface_token: "Content&IP", evidence_quote: "Developers can use the transcript in their applications.", source_url: sourceUrl, confidence: "medium" }],
      confidence: "high",
      evidence_quote: "Speech-to-text API converts uploaded audio into text.",
      feature_source_url: sourceUrl,
      linked_threat_ids: []
    }],
    product_feature_map: [],
    data_provenance_map: [{ provenance_id: "DP001", feature_id: "F001", ...data }],
    regulated_surface_map: [{ surface_id: "RS001", feature_id: "F001", surface_token: "Content&IP", int_ext_classification: "external", confidence: "medium" }],
    architecture_hints: [{
      feature_id: "F001",
      hint_type: "integration",
      disposition: "prefill_candidate",
      evidence_quote: "Developers can use the transcript in their applications.",
      source_url: sourceUrl,
      confidence: "medium"
    }],
    commercial_scan: { distinct_commercial_outcomes_seen: [], mapped_core_feature_ids: ["F001"], unmapped_outcomes_due_to_insufficient_detail: [] },
    vault_feature_candidates: { baseline: {}, archetypes: {}, compliance: {} },
    evidence: { field_evidence_refs: [], unresolved_questions: [] },
    limitations: []
  };
}

const valid = baseProfile();
const validResult = validateTargetFeatureProfileGuardrails(valid, { evidenceBuffer, packageInput });
assert.equal(validResult.ok, true, JSON.stringify(validResult.errors, null, 2));

const reordered = baseProfile();
reordered.feature_inventory[0].archetype_provenance[0].evidence_quote = "Samvaad connects to your systems and gets the work done. Check balances. Update records. Schedule appointments. Process payments.";
const reorderedResult = validateTargetFeatureProfileGuardrails(reordered, { evidenceBuffer, packageInput });
assert.equal(reorderedResult.ok, true, JSON.stringify(reorderedResult.errors, null, 2));
assert.ok(reorderedResult.repairs.length >= 1);
assert.ok(reorderedResult.repairs.every((repair) => repair.severity === "REPAIRABLE"));

const crossPackage = baseProfile();
crossPackage.feature_inventory[0].surface_provenance[0].source_url = crossPackageUrl;
crossPackage.feature_inventory[0].surface_provenance[0].evidence_quote = "When you use our Product, we collect the information provided by you.";
const crossPackageResult = validateTargetFeatureProfileGuardrails(crossPackage, { evidenceBuffer, packageInput });
assert.equal(crossPackageResult.ok, true, JSON.stringify(crossPackageResult.errors, null, 2));
assert.ok(crossPackageResult.warnings.some((warning) => String(warning.message).includes("outside the current stage evidence_buffer")));

const legacy = baseProfile();
legacy.product_feature_map = [{ feature_id: "legacy_1" }];
const legacyResult = validateTargetFeatureProfileGuardrails(legacy, { evidenceBuffer, packageInput });
assert.equal(legacyResult.ok, true, JSON.stringify(legacyResult.errors, null, 2));
assert.equal(legacy.product_feature_map.length, 0);
assert.ok(legacyResult.repairs.some((repair) => repair.action === "cleared_legacy_product_feature_map"));

const weakQuote = baseProfile();
weakQuote.feature_inventory[0].evidence_quote = "Loose quote that does not exactly appear in the admitted source.";
const weakQuoteResult = validateTargetFeatureProfileGuardrails(weakQuote, { evidenceBuffer, packageInput });
assert.equal(weakQuoteResult.ok, true, JSON.stringify(weakQuoteResult.errors, null, 2));
assert.ok(weakQuoteResult.warnings.some((warning) => String(warning.message).includes("passed with warning")));
assert.ok(weakQuote.limitations.some((limitation) => String(limitation).includes("GUARDRAIL_WARNING")));

const wrongSource = baseProfile();
wrongSource.feature_inventory[0].feature_source_url = "https://attacker.example/products/unknown";
const wrongSourceResult = validateTargetFeatureProfileGuardrails(wrongSource, { evidenceBuffer, packageInput });
assert.equal(wrongSourceResult.ok, false);
assert.ok(wrongSourceResult.errors.some((error) => String(error.message).includes("first-party source")));

const linkedThreat = baseProfile();
linkedThreat.feature_inventory[0].linked_threat_ids = ["T-001"];
const linkedThreatResult = validateTargetFeatureProfileGuardrails(linkedThreat, { evidenceBuffer, packageInput });
assert.equal(linkedThreatResult.ok, true, JSON.stringify(linkedThreatResult.errors, null, 2));
assert.deepEqual(linkedThreat.feature_inventory[0].linked_threat_ids, []);
assert.ok(linkedThreatResult.repairs.some((repair) => repair.action === "cleared_premature_linked_threat_ids"));

const missingData = baseProfile();
missingData.feature_inventory[0].data_provenance = [];
const missingDataResult = validateTargetFeatureProfileGuardrails(missingData, { evidenceBuffer, packageInput });
assert.equal(missingDataResult.ok, true, JSON.stringify(missingDataResult.errors, null, 2));
assert.ok(missingDataResult.repairs.some((repair) => repair.action === "runtime_filled_missing_data_provenance"));

console.log(JSON.stringify({
  ok: true,
  test: "targetFeatureProfileGuardrails",
  valid_ok: validResult.ok,
  reordered_quote_ok: reorderedResult.ok,
  cross_package_source_warning_count: crossPackageResult.warnings.length,
  legacy_alias_ok: legacyResult.ok,
  weak_quote_warning_count: weakQuoteResult.warnings.length,
  wrong_source_error_count: wrongSourceResult.errors.length,
  linked_threat_repair_count: linkedThreatResult.repairs.length,
  missing_data_repair_count: missingDataResult.repairs.length
}, null, 2));
