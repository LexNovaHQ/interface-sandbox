import assert from "node:assert/strict";
import { buildEvidenceJunction } from "./evidenceJunction.js";

const fullTexts = {
  company: "Company profile full text. Founder market context. Origin signal. This exact sentence must survive Stage 3.",
  product: "Product profile full text. Speech to text. Translation. API platform. This exact sentence must survive Stage 3.",
  legal: "Legal profile full text. Terms of service. Privacy policy. This exact sentence must survive Stage 3.",
  governance: "Governance profile full text. Trust center. Security posture. This exact sentence must survive Stage 3."
};

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
    structure: { title: `${family} title`, headings: [], links: [] },
    quality: { coverage_status: "full_visible_text_captured" }
  };
}

const sourceBundle = {
  source_bundle_version: "source_bundle_v2_magna_carta",
  scrape_meta: { hashes: { raw_footprint_sha256: "fixture_hash" } },
  target_input: { primary_url: "https://example.ai" },
  raw_footprint: {
    downstream_policy: {
      full_admitted_documents_sent_once: true,
      full_text_lossless_required: true,
      summaries_used_as_evidence: false,
      no_summary_no_compression_no_truncation: true
    },
    source_records: [
      record("SRC_001", "company_profile", "https://example.ai/about", fullTexts.company),
      record("SRC_002", "product_profile", "https://example.ai/products", fullTexts.product),
      record("SRC_003", "legal_profile", "https://example.ai/legal", fullTexts.legal),
      record("SRC_004", "governance_profile", "https://example.ai/trust", fullTexts.governance)
    ]
  }
};

const out = buildEvidenceJunction({ sourceBundle, runId: "test" });

assert.equal(out.evidence_junction_version, "evidence_junction_v1");
assert.equal(out.processing_manifest.gemini_called, false);
assert.equal(out.processing_manifest.source_archive_preserved, true);
assert.equal(out.processing_manifest.source_text_mutated, false);
assert.equal(out.processing_manifest.source_text_summarized, false);
assert.equal(out.processing_manifest.source_text_compressed, false);
assert.equal(out.processing_manifest.source_text_truncated, false);

const allPacketRecords = Object.values(out.downstream_packets).flatMap((packet) => packet.source_records || []);
for (const source of sourceBundle.raw_footprint.source_records) {
  const matches = allPacketRecords.filter((record) => record.evidence_source_id === source.evidence_source_id);
  assert.ok(matches.length > 0, `source ${source.evidence_source_id} was not routed to any downstream packet`);
  for (const match of matches) {
    assert.equal(match.text.clean_text_lossless, source.text.clean_text_lossless, `source ${source.evidence_source_id} text changed in downstream packet`);
    assert.equal(match.text.truncated_in_storage, false, `source ${source.evidence_source_id} marked truncated in storage`);
    assert.equal(match.text.truncated_in_response, false, `source ${source.evidence_source_id} marked truncated in response`);
  }
}

assert.equal(out.downstream_packets.target_feature_profile.packet_policy.full_text_lossless_preserved, true);
assert.equal(out.downstream_packets.target_feature_profile.packet_policy.source_records_not_summarized, true);
assert.equal(out.downstream_packets.target_feature_profile.packet_policy.source_records_not_compressed, true);
assert.equal(out.downstream_packets.target_feature_profile.packet_policy.source_records_not_truncated_by_stage_3, true);
assert.equal(out.downstream_packets.legal_stack_review.packet_policy.full_text_lossless_preserved, true);
assert.equal(out.downstream_packets.registry_matching.packet_policy.full_text_lossless_preserved, true);
assert.equal(out.downstream_packets.final_report_compiler.packet_policy.full_text_lossless_preserved, true);

console.log(JSON.stringify({
  ok: true,
  test: "evidenceJunction.contentPreservation",
  source_count: sourceBundle.raw_footprint.source_records.length,
  packet_record_count: allPacketRecords.length,
  full_text_lossless_preserved: true,
  gemini_called: false
}, null, 2));
