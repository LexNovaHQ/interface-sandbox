import assert from "node:assert/strict";
import { buildTargetFeatureProfileInput } from "./targetFeatureProfileInputAdapter.js";

function record(id, family, url, text) {
  return {
    evidence_source_id: id,
    url,
    final_url: url,
    source_family: family,
    text: {
      clean_text_lossless: text,
      clean_text_sha256: `${id}_hash`,
      word_count: text.split(/\s+/).filter(Boolean).length,
      truncated_in_storage: false,
      truncated_in_response: false
    },
    structure: { title: `${family} ${id}`, headings: [], links: [] },
    quality: { coverage_status: "full_visible_text_captured" }
  };
}

const productText = "Speech-to-text API converts uploaded audio into text. This exact product evidence must be preserved.";
const companyText = "Company about page says the company builds AI for Indian language applications.";
const legalText = "Privacy policy describes transfer language and processing-location ambiguity.";

const evidenceJunction = {
  evidence_junction_version: "evidence_junction_v1",
  source_bundle_sha256: "fixture_source_bundle_hash",
  target_input: { primary_url: "https://example.ai" },
  downstream_packets: {
    target_feature_profile: {
      packet_id: "PKT_TARGET_FEATURE_PROFILE",
      packet_policy: {
        full_text_lossless_preserved: true,
        source_records_not_summarized: true,
        source_records_not_compressed: true,
        source_records_not_truncated_by_stage_3: true
      },
      routed_evidence: [],
      dedupe_groups: [],
      source_records: [
        record("SRC_001", "legal_profile", "https://example.ai/privacy", legalText),
        record("SRC_002", "product_profile", "https://example.ai/products/speech", productText),
        record("SRC_003", "company_profile", "https://example.ai/about", companyText)
      ]
    }
  }
};

const ok = buildTargetFeatureProfileInput({
  sourceBundle: { run_id: "bundle", source_bundle_version: "source_bundle_v2_magna_carta", target_input: { primary_url: "https://example.ai" } },
  evidenceJunction,
  companyProfile: { company_profile_version: "company_profile_v1" },
  budget: { max_input_chars: 10000, max_estimated_tokens: 32000, max_single_source_chars: 5000, prompt_overhead_tokens: 30000 }
});

assert.equal(ok.ok, true);
assert.equal(ok.target_feature_profile_input.source_bundle.evidence_buffer.length, 3);
assert.equal(ok.target_feature_profile_input.source_bundle.evidence_buffer[0].source_family, "product_profile");
assert.equal(ok.target_feature_profile_input.source_bundle.evidence_buffer[0].clean_text_lossless, productText);
assert.equal(ok.target_feature_profile_input.input_budget.budget_status, "FULL_PACKET_INCLUDED");
assert.equal(ok.target_feature_profile_input.input_budget.estimated_prompt_overhead_tokens, 30000);
assert.ok(ok.target_feature_profile_input.input_budget.estimated_total_prompt_tokens >= 30000);
assert.equal(ok.target_feature_profile_input.input_budget.text_truncated, false);
assert.equal(ok.target_feature_profile_input.input_budget.source_dropping_for_budget_forbidden, true);
assert.equal(ok.target_feature_profile_input.input_budget.max_single_source_chars, null);
assert.equal(ok.target_feature_profile_input.adapter_policy.no_text_summary, true);
assert.equal(ok.target_feature_profile_input.adapter_policy.no_text_compression, true);
assert.equal(ok.target_feature_profile_input.adapter_policy.budget_guidance_not_source_selection, true);
assert.equal(ok.target_feature_profile_input.adapter_policy.hard_budget_source_dropping_disabled, true);

const guidance = buildTargetFeatureProfileInput({
  evidenceJunction,
  budget: { max_input_chars: productText.length + 5, max_estimated_tokens: 32000, max_single_source_chars: 5000, prompt_overhead_tokens: 30000 }
});

assert.equal(guidance.ok, true);
assert.equal(guidance.target_feature_profile_input.input_budget.budget_status, "GUIDANCE_EXCEEDED_FULL_PACKET_INCLUDED");
assert.equal(guidance.target_feature_profile_input.source_bundle.evidence_buffer.length, 3);
assert.equal(guidance.target_feature_profile_input.source_bundle.evidence_buffer[0].clean_text_lossless, productText);
assert.equal(guidance.target_feature_profile_input.input_budget.excluded_sources.length, 0);
assert.ok(guidance.target_feature_profile_input.input_budget.budget_warnings.length >= 1);
assert.equal(guidance.target_feature_profile_input.adapter_policy.budget_guidance_not_source_selection, true);

const hard = buildTargetFeatureProfileInput({
  evidenceJunction,
  budget: { max_input_chars: 10000, max_estimated_tokens: 32000, max_single_source_chars: 10, prompt_overhead_tokens: 30000, enforcement_mode: "hard" }
});

assert.equal(hard.ok, true);
assert.equal(hard.status, 200);
assert.equal(hard.target_feature_profile_input.input_budget.enforcement_mode, "non_dropping");
assert.equal(hard.target_feature_profile_input.input_budget.excluded_sources.length, 0);
assert.equal(hard.target_feature_profile_input.source_bundle.evidence_buffer.length, 3);
assert.equal(hard.target_feature_profile_input.adapter_policy.hard_budget_source_dropping_disabled, true);

console.log(JSON.stringify({
  ok: true,
  test: "targetFeatureProfileInputAdapter",
  full_packet: ok.target_feature_profile_input.input_budget.budget_status,
  guidance_packet: guidance.target_feature_profile_input.input_budget.budget_status,
  hard_packet: hard.target_feature_profile_input.input_budget.budget_status,
  estimated_total_prompt_tokens: ok.target_feature_profile_input.input_budget.estimated_total_prompt_tokens,
  source_dropping_forbidden: hard.target_feature_profile_input.input_budget.source_dropping_for_budget_forbidden
}, null, 2));
