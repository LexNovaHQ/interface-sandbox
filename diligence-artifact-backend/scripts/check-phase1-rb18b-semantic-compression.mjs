import { buildSemanticFeatureAdjudication, assertSemanticFeatureAdjudication } from "../src/phases/01-source-discovery/services/semantic-feature-adjudication.service.js";
import { buildRb18bCanonicalSelection, assertRb18bCanonicalSelection } from "../src/phases/01-source-discovery/services/rb18b-canonical-selection.service.js";
import { buildFinalDedupedManifest, assertFinalDedupedManifest, CLEAN_EXTRACTION_DISPOSITIONS } from "../src/phases/01-source-discovery/services/final-deduped-manifest.service.js";

const candidates = [
  candidate("C1", "https://example.test/apis/translation"),
  candidate("C2", "https://example.test/apis/translation/tamil-to-marathi"),
  candidate("C3", "https://example.test/terms"),
  candidate("C4", "https://example.test/apis/translation/english-to-hindi")
];
const canonicalInventory = { canonical_candidates: candidates };
const fingerprintInventory = {
  fingerprints: [
    fingerprint("C1", "translation overview", "H1", ["a", "b", "c", "d"], "translation-template"),
    fingerprint("C2", "Tamil to Marathi translation", "H2", ["a", "b", "c", "d"], "translation-template"),
    fingerprint("C3", "Terms of Service", "H3", ["legal", "terms"], "legal-template"),
    fingerprint("C4", "English to Hindi translation", "H4", ["unique", "code", "mixed"], "translation-template")
  ]
};
const rootFeatureLaneClustering = {
  schema_version: "PHASE1_ROOT_FEATURE_LANE_CLUSTERING_v1",
  source_classifications: [
    classification("C1", "translation", "none", "commercial_product"),
    classification("C2", "tamil_to_marathi", "translation_language_pair", "commercial_product"),
    classification("C3", "legal_governance", "none", "legal_instrument", "privacy_data_processing"),
    classification("C4", "english_to_hindi", "translation_language_pair", "commercial_product")
  ],
  feature_clusters: [],
  root_clusters: {}
};
const legalClassification = {
  classifications: [{ canonical_identity: "entity|https://example.test/terms", confirmed_legal_instrument: true, doc_type: "terms_of_service", artifact_name_hint: "legal_doc_terms_of_service" }]
};
const analysisCache = new Map([
  ["C1", { blocks: [longText("Canonical translation product overview covering supported languages enterprise integration pricing controls and core API capabilities.")] }],
  ["C2", { blocks: [longText("Tamil to Marathi route repeats the canonical translation workflow and records only the selected language pair as structured coverage.")] }],
  ["C3", { blocks: [longText("Terms of Service governing access restrictions warranties liability termination and governing provisions for the service.")] }],
  ["C4", { blocks: [longText("This route uniquely supports code mixed English and Hindi input without pre normalisation and preserves mixed script intent during translation.")] }]
]);

let providerCalls = 0;
const fakeProvider = async () => {
  providerCalls += 1;
  return {
    json: {
      cluster: {
        cluster_id: "translation-ambiguity",
        normalized_feature_key: "translation",
        canonical_candidate_id: "C1",
        coverage_variant_ids: [],
        unique_delta_candidate_ids: ["C4"],
        distinct_candidate_ids: [],
        uncertain_candidate_ids: [],
        confidence: 0.98,
        reason_code: "SAME_FEATURE_WITH_UNIQUE_DELTAS"
      }
    },
    metadata: { model: "fixture-semantic-adjudicator", key_alias: "fixture-key" }
  };
};

const semantic = await buildSemanticFeatureAdjudication({ canonicalInventory, fingerprintInventory, rootFeatureLaneClustering, legalClassification, analysisCache, callProvider: fakeProvider });
assertSemanticFeatureAdjudication(semantic);
assert(semantic.architecture === "ONE_JOB_TWO_LAYER_URL_MANIFEST_FILTER", "two-layer manifest architecture not active");
assert(semantic.counts.legal_candidates_excluded === 1, "legal instrument entered semantic pool");
assert(semantic.counts.final_material_feature_clusters === 1, `expected one non-legal feature cluster, received ${semantic.counts.final_material_feature_clusters}`);
assert(semantic.counts.semantic_required_candidates === 1, `only the genuinely ambiguous candidate should require semantic support, received ${semantic.counts.semantic_required_candidates}`);
assert(semantic.counts.semantic_required_coverage === 1, `semantic-required coverage must be complete, received ${semantic.counts.semantic_required_coverage}`);
assert(providerCalls === 1 && semantic.counts.model_calls === 1, `expected exactly one compact cluster call, received ${providerCalls}/${semantic.counts.model_calls}`);
const semanticById = new Map(semantic.decisions.map((row) => [row.candidate_id, row]));
assert(semanticById.get("C2")?.decision_source === "DETERMINISTIC_OBVIOUS_PARAMETER_VARIANT", "obvious template variant was not resolved deterministically");
assert(semanticById.get("C2")?.relationship === "SAME_FEATURE_TEMPLATE_VARIANT", "deterministic template relationship missing");
assert((semanticById.get("C2")?.deterministic_corroborators || []).includes("HIGH_CONTENT_OVERLAP"), "deterministic variant lacked content-overlap corroboration");
assert(semanticById.get("C4")?.decision_source === "BOUNDED_MODEL_PLUS_DETERMINISTIC_ENFORCEMENT", "unique outlier did not receive semantic support");
assert(semanticById.get("C4")?.relationship === "SAME_FEATURE_UNIQUE_DELTA", "semantic unique delta missing");

const selection = buildRb18bCanonicalSelection({ canonicalInventory, fingerprintInventory, rootFeatureLaneClustering: semantic.adjudicated_root_feature_lane_clustering, legalClassification, semanticFeatureAdjudication: semantic, analysisCache });
assertRb18bCanonicalSelection(selection);
const byId = new Map(selection.decisions.map((row) => [row.candidate_id, row]));
assert(byId.get("C1")?.source_disposition === "SELECTED_CANONICAL", "canonical translation source not selected");
assert(byId.get("C2")?.source_disposition === "SUPPRESSED_TEMPLATE_VARIANT", "template variant remained body-extractable");
assert(byId.get("C2")?.extraction_authorized === false && byId.get("C2")?.extraction_scope === "STRUCTURED_COVERAGE_ONLY", "coverage-only variant retained extraction authority");
assert(byId.get("C4")?.source_disposition === "SELECTED_PARTIAL_CONTRIBUTOR" && byId.get("C4")?.unique_evidence_gate?.status === "QUALIFIED_UNIQUE_EVIDENCE", "semantic unique delta was not retained through deterministic novelty validation");
assert(byId.get("C3")?.source_disposition === "LEGAL_INSTRUMENT" && byId.get("C3")?.extraction_scope === "FULL_DOCUMENT", "legal instrument integrity was weakened");
assert(selection.counts.extraction_authorized === 3, `expected canonical + unique delta + legal extraction, received ${selection.counts.extraction_authorized}`);

const cleanManifest = buildFinalDedupedManifest({
  legacyManifest: { schema_version: "PHASE1_DEDUPED_URL_MANIFEST_v4", target_url: "https://example.test", manifest_sources: [] },
  canonicalSelection: selection
});
assertFinalDedupedManifest(cleanManifest, selection);
assert(cleanManifest.clean_extraction_manifest === true && cleanManifest.contains_extraction_authority_only === true, "clean extraction manifest flags missing");
assert(cleanManifest.manifest_sources.length === 3, `clean manifest should contain only three authorised URLs, received ${cleanManifest.manifest_sources.length}`);
assert(cleanManifest.manifest_forensics.audited_rows === 4 && cleanManifest.manifest_forensics.audit_only_rows_excluded_from_extraction_manifest === 1, "audit-to-clean accounting is incorrect");
assert(!cleanManifest.manifest_sources.some((row) => row.canonical_candidate_id === "C2"), "coverage-only URL leaked into extraction manifest");
assert(cleanManifest.manifest_sources.every((row) => row.extraction_decision === "EXTRACT" && row.admission_tier === "PRIMARY"), "non-authorised row leaked into clean manifest");
assert(cleanManifest.manifest_sources.every((row) => CLEAN_EXTRACTION_DISPOSITIONS.includes(row.final_url_disposition)), "invalid final URL disposition leaked into clean manifest");
assert(new Set(cleanManifest.manifest_sources.map((row) => row.final_url_disposition)).size === 3, "canonical, unique-block and legal extraction dispositions were not all represented");

console.log(JSON.stringify({
  check: "phase1 RB-18B two-layer manifest filtration",
  status: "PASS",
  audited_urls: selection.decisions.length,
  clean_manifest_urls: cleanManifest.manifest_sources.length,
  semantic_required_candidates: semantic.counts.semantic_required_candidates,
  semantic_calls: semantic.counts.model_calls,
  coverage_only_excluded: selection.counts.coverage_only_manifest_rows
}, null, 2));

function candidate(id, url) { return { candidate_id: id, canonical_identity: `entity|${url}`, entity_id: "entity", entity_status: "PRIMARY_TARGET", canonical_url: url, fetch_url: url, aliases: [], legacy_manifest_ids: [], member_candidate_ids: [], extraction_authorized_by_legacy_manifest: true }; }
function classification(id, feature, variant, lane, root = "product_service") { const url = candidates.find((row) => row.candidate_id === id).canonical_url; return { classification_id: `RFL.${id}`, candidate_id: id, canonical_identity: `entity|${url}`, entity_id: "entity", entity_status: "PRIMARY_TARGET", canonical_url: url, primary_root: root, secondary_root_references: [], feature_cluster: feature, evidence_lane: lane, variant_family: variant, ai_overlay: null }; }
function fingerprint(id, title, hash, shingles, templateSignature) { const url = candidates.find((row) => row.candidate_id === id).canonical_url; return { candidate_id: id, canonical_identity: `entity|${url}`, fetch_status: "FETCHED", extraction_eligible: true, content_materiality: { status: "MATERIAL_CONTENT" }, exact_content_hash: `EXACT_${id}`, block_hashes: [{ block_index: 1, sha256: hash, character_count: 240 }], near_duplicate_signature: { sampled_hashes: shingles }, template_signature: templateSignature, title, headings: [title], fingerprint_bytes_used: 10000, warnings: [] }; }
function longText(seed) { return `${seed} ${seed} ${seed}`; }
function assert(value, message) { if (!value) throw new Error(message); }
