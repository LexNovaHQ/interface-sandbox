import assert from "node:assert/strict";
import { buildEvidenceRefinerInput } from "./sourceBundleAdapter.js";

function rec(url, family, text) {
  return {
    url,
    source_family: family,
    fetch: { ok: true, final_url: url, http_status: 200 },
    raw: { raw_html_length: text.length, raw_html_sha256: `raw-${family}` },
    text: {
      extraction_mode: "lossless_visible_text",
      clean_text_length: text.length,
      clean_text_sha256: `txt-${family}-${url}`,
      word_count: text.split(/\s+/).filter(Boolean).length,
      clean_text_lossless: text,
      truncated_in_storage: false,
      truncated_in_response: false
    },
    structure: { title: family, headings: [], links: [] },
    chunks: [],
    quality: { empty_page: false, word_count: text.split(/\s+/).filter(Boolean).length, coverage_status: "full_visible_text_captured" }
  };
}

const fixture = buildEvidenceRefinerInput({
  runId: "test_run_001",
  targetInput: { primary_url: "https://example.ai", normalized_origin: "https://example.ai", registrable_domain: "example.ai" },
  discoveryResponse: { discovery: {
    company_profile_sources: [{ url: "https://example.ai/", source_family: "company_profile" }],
    product_profile_sources: [{ url: "https://example.ai/models", source_family: "product_profile" }],
    legal_profile_sources: [{ url: "https://example.ai/rules", source_family: "legal_profile" }],
    governance_profile_sources: [{ url: "https://example.ai/trust", source_family: "governance_profile" }],
    data_provenance_sources: [{ url: "https://example.ai/privacy-policy", source_family: "data_provenance" }],
    candidate_sources: []
  } },
  captureResponse: { capture: { source_records: [
    rec("https://example.ai/", "company_profile", "Company profile full text."),
    rec("https://example.ai/models", "product_profile", "Product features full text."),
    rec("https://example.ai/rules", "legal_profile", "Rules full text."),
    rec("https://example.ai/rules#top", "legal_profile", "Rules full text."),
    rec("https://example.ai/trust", "governance_profile", "Governance full text."),
    rec("https://example.ai/privacy-policy", "data_provenance", "Privacy policy describes personal data, controller, processor, retention, and subprocessor handling."),
    rec("https://example.ai/contact", "contact", "Contact only.")
  ] } }
});

assert.equal(fixture.source_bundle_version, "source_bundle_v2_magna_carta");
assert.equal(fixture.source_discovery.flattened_sources.length, 5);
assert.equal(fixture.raw_footprint.source_records.length, 5);
assert.equal(fixture.raw_footprint.duplicate_sources.length, 1);
assert.equal(fixture.raw_footprint.filtered_sources.length, 1);
assert.equal(fixture.raw_footprint.source_records[0].text.clean_text_lossless, "Company profile full text.");
assert.equal(fixture.raw_footprint.source_records[1].source_family, "product_profile");
assert.equal(fixture.raw_footprint.source_records[2].source_family, "legal_profile");
assert.equal(fixture.raw_footprint.source_records[3].source_family, "governance_profile");
assert.equal(fixture.raw_footprint.source_records[4].source_family, "governance_profile");
assert.equal(fixture.raw_footprint.source_records[4].source_bucket, "data_provenance_sources");
assert.equal(fixture.raw_footprint.downstream_policy.no_summary_no_compression_no_truncation, true);
assert.equal(fixture.scrape_meta.coverage_summary.by_family.company_profile.length, 1);
assert.equal(fixture.scrape_meta.coverage_summary.by_family.product_profile.length, 1);
assert.equal(fixture.scrape_meta.coverage_summary.by_family.legal_profile.length, 1);
assert.equal(fixture.scrape_meta.coverage_summary.by_family.governance_profile.length, 2);

console.log(JSON.stringify({ ok: true, adapter: "sourceBundleAdapter", version: fixture.source_bundle_version }, null, 2));
