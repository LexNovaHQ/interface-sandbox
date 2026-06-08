import assert from "node:assert/strict";
import { buildEvidenceRefinerInput } from "./sourceBundleAdapter.js";

const fixture = buildEvidenceRefinerInput({
  runId: "test_run_001",
  targetInput: {
    primary_url: "https://example.ai",
    company_name: "Example AI",
    normalized_origin: "https://example.ai",
    registrable_domain: "example.ai"
  },
  discoveryResponse: {
    discovery: {
      product_profile_sources: [
        { url: "https://example.ai/", source_family: "product_profile", discovery_method: "deterministic_seed", status: 200 }
      ],
      legal_governance_sources: [
        { url: "https://example.ai/privacy", source_family: "legal_governance", discovery_method: "gemini_search", status: 200 },
        { url: "https://example.ai/privacy#top", source_family: "legal_governance", discovery_method: "gemini_search", status: 200 }
      ],
      commercial_sources: [
        { url: "https://example.ai/contact", source_family: "commercial", discovery_method: "deterministic_seed", status: 200 }
      ],
      candidate_sources: [],
      rejected_sources: [],
      coverage_gaps: [],
      coverage: { product_profile_found: true, legal_governance_found: true },
      counts: { candidate_sources: 4, legal_governance_sources: 2, product_profile_sources: 1, commercial_sources: 1 }
    }
  },
  captureResponse: {
    capture: {
      source_records: [
        {
          url: "https://example.ai/",
          source_family: "product_profile",
          fetch: { ok: true, final_url: "https://example.ai/", http_status: 200, fetched_at: "2026-06-08T00:00:00.000Z" },
          raw: { raw_html_length: 1200, raw_html_sha256: "raw-home" },
          text: {
            extraction_mode: "lossless_visible_text",
            clean_text_length: 42,
            clean_text_sha256: "txt-home",
            word_count: 7,
            clean_text_lossless: "Example AI builds workflow agents for teams.",
            truncated_in_storage: false,
            truncated_in_response: false
          },
          structure: { title: "Example AI", headings: [{ level: 1, text: "Workflow agents" }], links: [] },
          chunks: [{ chunk_id: "chunk_0001", source_url: "https://example.ai/", start_char: 0, end_char: 42, text: "Example AI builds workflow agents for teams.", text_sha256: "chunk-home" }],
          quality: { empty_page: false, likely_js_rendered: false, word_count: 7, coverage_status: "full_visible_text_captured" }
        },
        {
          url: "https://example.ai/privacy",
          source_family: "legal_governance",
          fetch: { ok: true, final_url: "https://example.ai/privacy", http_status: 200, fetched_at: "2026-06-08T00:00:01.000Z" },
          raw: { raw_html_length: 2200, raw_html_sha256: "raw-privacy" },
          text: {
            extraction_mode: "lossless_visible_text",
            clean_text_length: 78,
            clean_text_sha256: "txt-privacy",
            word_count: 12,
            clean_text_lossless: "Privacy Policy. We process customer data to provide the service and support deletion requests.",
            truncated_in_storage: false,
            truncated_in_response: false
          },
          structure: { title: "Privacy Policy", headings: [{ level: 1, text: "Privacy Policy" }], links: [] },
          chunks: [{ chunk_id: "chunk_0001", source_url: "https://example.ai/privacy", start_char: 0, end_char: 78, text: "Privacy Policy. We process customer data to provide the service and support deletion requests.", text_sha256: "chunk-privacy" }],
          quality: { empty_page: false, likely_js_rendered: false, word_count: 12, coverage_status: "full_visible_text_captured" }
        },
        {
          url: "https://example.ai/privacy#top",
          source_family: "legal_governance",
          fetch: { ok: true, final_url: "https://example.ai/privacy", http_status: 200, fetched_at: "2026-06-08T00:00:02.000Z" },
          raw: { raw_html_length: 2200, raw_html_sha256: "raw-privacy" },
          text: {
            extraction_mode: "lossless_visible_text",
            clean_text_length: 78,
            clean_text_sha256: "txt-privacy",
            word_count: 12,
            clean_text_lossless: "Privacy Policy. We process customer data to provide the service and support deletion requests.",
            truncated_in_storage: false,
            truncated_in_response: false
          },
          structure: { title: "Privacy Policy", headings: [{ level: 1, text: "Privacy Policy" }], links: [] },
          chunks: [],
          quality: { empty_page: false, likely_js_rendered: false, word_count: 12, coverage_status: "full_visible_text_captured" }
        },
        {
          url: "https://example.ai/contact",
          source_family: "commercial",
          fetch: { ok: true, final_url: "https://example.ai/contact", http_status: 200, fetched_at: "2026-06-08T00:00:03.000Z" },
          raw: { raw_html_length: 900, raw_html_sha256: "raw-contact" },
          text: {
            extraction_mode: "lossless_visible_text",
            clean_text_length: 20,
            clean_text_sha256: "txt-contact",
            word_count: 3,
            clean_text_lossless: "Contact our sales team.",
            truncated_in_storage: false,
            truncated_in_response: false
          },
          structure: { title: "Contact", headings: [], links: [] },
          chunks: [],
          quality: { empty_page: false, likely_js_rendered: false, word_count: 3, coverage_status: "full_visible_text_captured" }
        }
      ],
      counts: { input_sources: 4, processed_sources: 4, fetch_ok: 4, fetch_failed: 0, total_chunks: 2 }
    }
  },
  generatedAt: "2026-06-08T00:00:00.000Z"
});

assert.equal(fixture.run_id, "test_run_001");
assert.equal(fixture.source_mode, "runtime_discovery_capture");
assert.equal(fixture.target_input.primary_url, "https://example.ai");
assert.equal(fixture.source_discovery.flattened_sources.length, 3);
assert.equal(fixture.raw_footprint.source_records.length, 2);
assert.equal(fixture.raw_footprint.duplicate_sources.length, 1);
assert.equal(fixture.raw_footprint.filtered_sources.length, 1);
assert.equal(fixture.raw_footprint.source_records[0].evidence_source_id, "SRC_001");
assert.equal(fixture.raw_footprint.source_records[0].text.clean_text_lossless, "Example AI builds workflow agents for teams.");
assert.equal(fixture.raw_footprint.source_records[1].text.clean_text_lossless.startsWith("Privacy Policy."), true);
assert.equal(fixture.raw_footprint.source_records[1].chunk_index.length, 1);
assert.equal(fixture.raw_footprint.source_records[1].chunk_index[0].text, undefined);
assert.equal(fixture.raw_footprint.clean_text_corpus, undefined);
assert.equal(fixture.raw_footprint.chunks, undefined);
assert.equal(fixture.raw_footprint.downstream_policy.full_admitted_documents_sent_once, true);
assert.equal(fixture.raw_footprint.downstream_policy.summaries_used_as_evidence, false);
assert.equal(fixture.scrape_meta.coverage_summary.source_counts.admitted, 2);
assert.equal(fixture.scrape_meta.coverage_summary.source_counts.duplicates_removed, 1);
assert.equal(fixture.scrape_meta.coverage_summary.source_counts.filtered, 1);
assert.equal(fixture.scrape_meta.coverage_summary.by_family.product_profile.length, 1);
assert.equal(fixture.scrape_meta.coverage_summary.by_family.legal_governance.length, 1);
assert.ok(fixture.scrape_meta.hashes.raw_footprint_sha256);

console.log(JSON.stringify({ ok: true, adapter: "sourceBundleAdapter", run_id: fixture.run_id }, null, 2));
