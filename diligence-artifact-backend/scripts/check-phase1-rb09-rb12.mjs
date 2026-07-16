import assert from "node:assert/strict";
import { buildCanonicalSelection, assertCanonicalSelection } from "../src/phases/01-source-discovery/services/canonical-selection.service.js";
import { buildFinalDedupedManifest, assertFinalDedupedManifest } from "../src/phases/01-source-discovery/services/final-deduped-manifest.service.js";
import { applySelectedExtractionScope, assertSelectedExtractionResult, hashBlock } from "../src/phases/01-source-discovery/services/selected-extraction.service.js";
import { createBlockDedupeState, dedupeExtractedSource, serialiseBlockDedupeState, assertBlockDedupeState } from "../src/phases/01-source-discovery/services/post-extraction-block-dedupe.service.js";

const blockA = "Canonical translation product evidence describing language coverage, direct translation, pricing, and API availability.";
const blockB = "Canonical commercial evidence describing enterprise use cases and transliteration support for Indian-language translation.";
const blockC = "This English to Hindi variant uniquely supports code-mixed input without pre-normalising the script.";
const legalBlock = "Privacy Policy. Effective Date. We collect personal data, explain processing purposes, retention, security, choices, and contacts.";

const candidates = [
  candidate("CANON.translation", "sarvam", "https://sarvam.ai/apis/translation", [], ["product_service.URL.001"]),
  candidate("CANON.duplicate", "sarvam", "https://sarvam.ai/apis/translation/tamil-to-marathi", [], ["product_service.URL.002"]),
  candidate("CANON.unique", "sarvam", "https://sarvam.ai/apis/translation/english-to-hindi", [], ["product_service.URL.003"]),
  candidate("CANON.privacy", "sarvam", "https://sarvam.ai/privacy-policy", [], ["privacy_data_processing.URL.001"])
];
const fingerprints = [
  fingerprint("CANON.translation", "HASH_TRANSLATION", [blockA, blockB]),
  fingerprint("CANON.duplicate", "HASH_TRANSLATION", [blockA, blockB]),
  fingerprint("CANON.unique", "HASH_UNIQUE", [blockA, blockC]),
  fingerprint("CANON.privacy", "HASH_PRIVACY", [legalBlock])
];
const sourceClassifications = [
  classification("CANON.translation", "product_service", "translation", "commercial_product", "translation_overview"),
  classification("CANON.duplicate", "product_service", "translation", "commercial_product", "translation_language_pair"),
  classification("CANON.unique", "product_service", "translation", "commercial_product", "translation_language_pair"),
  classification("CANON.privacy", "privacy_data_processing", "legal_governance", "legal_instrument", "none")
];
const legalClassifications = candidates.map((item) => item.candidate_id === "CANON.privacy" ? {
  candidate_id: item.candidate_id,
  canonical_identity: item.canonical_identity,
  confirmed_legal_instrument: true,
  classification_status: "CONFIRMED_LEGAL_INSTRUMENT",
  doc_type: "privacy_policy",
  artifact_name_hint: "legal_doc_privacy_policy"
} : {
  candidate_id: item.candidate_id,
  canonical_identity: item.canonical_identity,
  confirmed_legal_instrument: false,
  classification_status: "NOT_LEGAL_INSTRUMENT",
  doc_type: "other",
  artifact_name_hint: "legal_doc_other"
});

const selection = buildCanonicalSelection({
  canonicalInventory: { canonical_candidates: candidates },
  fingerprintInventory: { fingerprints },
  rootFeatureLaneClustering: { source_classifications: sourceClassifications },
  legalClassification: { classifications: legalClassifications },
  analysisCache: new Map()
});
assertCanonicalSelection(selection);

assert.equal(decision("CANON.translation").source_disposition, "SELECTED_CANONICAL");
assert.equal(decision("CANON.duplicate").source_disposition, "ALIAS_EXACT_DUPLICATE");
assert.equal(decision("CANON.duplicate").extraction_authorized, false);
assert.equal(decision("CANON.unique").source_disposition, "SELECTED_PARTIAL_CONTRIBUTOR");
assert.equal(decision("CANON.unique").extraction_scope, "SELECTED_UNIQUE_SECTIONS");
assert.deepEqual(decision("CANON.unique").selected_block_hashes, [hashBlock(blockC)]);
assert.equal(decision("CANON.privacy").source_disposition, "LEGAL_INSTRUMENT");
assert.equal(decision("CANON.privacy").extraction_scope, "FULL_DOCUMENT");

const legacyManifest = {
  run_id: "RB09-RB12-CHECK",
  target_url: "https://sarvam.ai/",
  manifest_sources: [
    manifestRow("product_service.URL.001", "https://sarvam.ai/apis/translation", "product_service"),
    manifestRow("product_service.URL.002", "https://sarvam.ai/apis/translation/tamil-to-marathi", "product_service"),
    manifestRow("product_service.URL.003", "https://sarvam.ai/apis/translation/english-to-hindi", "product_service"),
    manifestRow("privacy_data_processing.URL.001", "https://sarvam.ai/privacy-policy", "privacy_data_processing", true)
  ]
};
const finalManifest = buildFinalDedupedManifest({ legacyManifest, canonicalSelection: selection });
assertFinalDedupedManifest(finalManifest, selection);
assert.equal(finalManifest.manifest_sources.length, 4);
assert.equal(finalManifest.manifest_sources.filter((row) => row.extraction_decision === "EXTRACT").length, 3);
assert.equal(finalManifest.manifest_sources.find((row) => row.canonical_candidate_id === "CANON.duplicate").extraction_decision, "MANIFEST_ONLY");
assert.equal(finalManifest.manifest_sources.find((row) => row.canonical_candidate_id === "CANON.privacy").extraction_scope, "FULL_DOCUMENT");

const uniqueRow = finalManifest.manifest_sources.find((row) => row.canonical_candidate_id === "CANON.unique");
const selected = applySelectedExtractionScope({
  manifestRow: uniqueRow,
  extracted: { ok: true, lossless_text: `${blockA}\n\n${blockC}`, extraction_warnings: [] }
});
assertSelectedExtractionResult(uniqueRow, selected);
assert.equal(selected.lossless_text, blockC);
assert.equal(selected.extraction_scope_forensics.omitted_block_count, 1);

const blockState = createBlockDedupeState();
const first = dedupeExtractedSource({ root: "product_service", source: source("product_service.SRC.001", blockA), state: blockState });
const second = dedupeExtractedSource({ root: "product_service", source: source("product_service.SRC.002", blockA), state: blockState });
assert.equal(first.action, "RETAIN");
assert.equal(second.action, "SUPPRESS_EXACT_DUPLICATE");
assert.equal(second.duplicate_owner_source_id, "product_service.SRC.001");
const serialised = serialiseBlockDedupeState(blockState);
assertBlockDedupeState(serialised);
assert.equal(serialised.totals.exact_duplicate_sources_suppressed, 1);

console.log(JSON.stringify({
  check: "phase1 RB09 canonical selection RB10 final manifest RB11 selected extraction RB12 block dedupe",
  status: "PASS",
  decisions: selection.decisions.length,
  extract_rows: finalManifest.manifest_sources.filter((row) => row.extraction_decision === "EXTRACT").length,
  exact_duplicates_suppressed: serialised.totals.exact_duplicate_sources_suppressed
}, null, 2));

function decision(id) { return selection.decisions.find((item) => item.candidate_id === id); }
function candidate(id, entity, url, aliases, legacyIds) {
  return {
    candidate_id: id,
    canonical_identity: `${entity}|${url}`,
    entity_id: entity,
    entity_status: "PRIMARY_TARGET",
    canonical_url: url,
    fetch_url: url,
    aliases,
    legacy_manifest_ids: legacyIds,
    extraction_authorized_by_legacy_manifest: true
  };
}
function fingerprint(id, exactHash, blocks) {
  return {
    candidate_id: id,
    fingerprint_id: `FP.${id}`,
    fetch_status: "FETCHED",
    exact_content_hash: exactHash,
    block_hashes: blocks.map((block, index) => ({ block_index: index + 1, sha256: hashBlock(block), character_count: block.length })),
    near_duplicate_signature: { sampled_hashes: blocks.map((block) => hashBlock(block).slice(0, 16)) },
    template_signature: id.includes("translation") || id.includes("duplicate") || id.includes("unique") ? "sarvam.ai/apis/translation/{language-pair}" : "sarvam.ai/privacy-policy",
    title: id === "CANON.privacy" ? "Privacy Policy" : "Translation",
    fingerprint_bytes_used: blocks.join(" ").length,
    warnings: []
  };
}
function classification(id, root, feature, lane, variant) {
  const candidateRecord = candidates.find((item) => item.candidate_id === id);
  return {
    candidate_id: id,
    canonical_identity: candidateRecord.canonical_identity,
    entity_id: candidateRecord.entity_id,
    primary_root: root,
    secondary_root_references: [],
    feature_cluster: feature,
    evidence_lane: lane,
    variant_family: variant,
    ai_overlay: null
  };
}
function manifestRow(id, url, root, legal = false) {
  return {
    manifest_id: id,
    common_root: root,
    root_traversal_policy: "PRIMARY_FULL_EXTRACT",
    canonical_url: url,
    canonical_url_key: url,
    fetch_url: url,
    route_type: legal ? "privacy_policy" : "translation",
    route_type_aliases: [],
    materiality: legal ? "legal_document" : "product_activity",
    source_signal_roles: legal ? ["LEGAL_DOCUMENT_SIGNAL"] : ["PRODUCT_ACTIVITY_SIGNAL"],
    technical_route_shape: null,
    api_data_flow_signal: { present: false, basis: [] },
    neutral_buckets: legal ? ["legal_terms_sources"] : ["product_activity_sources"],
    discovered_by: ["RB09_RB12_FIXTURE"],
    admission_tier: "PRIMARY",
    extraction_decision: "EXTRACT",
    legal_doc_candidate: legal,
    legal_doc_type: legal ? "privacy_policy" : "other",
    phase_1_classification_effect: "SOURCE_ROUTING_ONLY_NOT_JOB_ROUTING"
  };
}
function source(id, text) { return { source_id: id, canonical_url: `https://example.test/${id}`, lossless_text: text, sha256: hashBlock(text) }; }
