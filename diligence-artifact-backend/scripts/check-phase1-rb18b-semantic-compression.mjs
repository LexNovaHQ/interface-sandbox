import { buildSemanticFeatureAdjudication, assertSemanticFeatureAdjudication } from "../src/phases/01-source-discovery/services/semantic-feature-adjudication.service.js";
import { buildRb18bCanonicalSelection, assertRb18bCanonicalSelection } from "../src/phases/01-source-discovery/services/rb18b-canonical-selection.service.js";

const candidates = [
  candidate("C1", "https://example.test/apis/translation"),
  candidate("C2", "https://example.test/apis/translation/tamil-to-marathi"),
  candidate("C3", "https://example.test/terms"),
  candidate("C4", "https://example.test/apis/translation/english-to-hindi")
];
const canonicalInventory = { canonical_candidates: candidates };
const fingerprintInventory = {
  fingerprints: [
    fingerprint("C1", "translation overview", "H1", ["a", "b", "c", "d"], "/apis/translation/{language-pair}"),
    fingerprint("C2", "Tamil to Marathi translation", "H2", ["a", "b", "c", "d"], "/apis/translation/{language-pair}"),
    fingerprint("C3", "Terms of Service", "H3", ["legal", "terms"], "/terms"),
    fingerprint("C4", "English to Hindi translation", "H4", ["unique", "code", "mixed"], "/apis/translation/{language-pair}")
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

const fakeProvider = async () => ({
  json: {
    decisions: [
      proposal("C1", "translation", "SAME_FEATURE_CANONICAL_CANDIDATE", ["C2", "C4"]),
      proposal("C2", "translation", "SAME_FEATURE_TEMPLATE_VARIANT", ["C1"]),
      proposal("C4", "translation", "SAME_FEATURE_UNIQUE_DELTA", ["C1"])
    ]
  },
  metadata: { model: "fixture-semantic-adjudicator" }
});

const semantic = await buildSemanticFeatureAdjudication({ canonicalInventory, fingerprintInventory, rootFeatureLaneClustering, legalClassification, analysisCache, callProvider: fakeProvider });
assertSemanticFeatureAdjudication(semantic);
assert(semantic.counts.legal_candidates_excluded === 1, "legal instrument entered semantic pool");
assert(semantic.counts.final_feature_clusters === 1, `expected one non-legal semantic feature cluster, received ${semantic.counts.final_feature_clusters}`);
assert(semantic.decisions.find((row) => row.candidate_id === "C2")?.semantic_grouping_enforced === true, "template variant was not semantically grouped");
assert((semantic.decisions.find((row) => row.candidate_id === "C2")?.deterministic_corroborators || []).includes("SHARED_TEMPLATE_SIGNATURE"), "semantic grouping lacked deterministic corroboration");

const selection = buildRb18bCanonicalSelection({ canonicalInventory, fingerprintInventory, rootFeatureLaneClustering: semantic.adjudicated_root_feature_lane_clustering, legalClassification, semanticFeatureAdjudication: semantic, analysisCache });
assertRb18bCanonicalSelection(selection);
const byId = new Map(selection.decisions.map((row) => [row.candidate_id, row]));
assert(byId.get("C1")?.source_disposition === "SELECTED_CANONICAL", "canonical translation source not selected");
assert(byId.get("C2")?.source_disposition === "SUPPRESSED_TEMPLATE_VARIANT", "template variant remained body-extractable");
assert(byId.get("C2")?.extraction_authorized === false && byId.get("C2")?.extraction_scope === "STRUCTURED_COVERAGE_ONLY", "coverage-only variant retained extraction authority");
assert(byId.get("C4")?.source_disposition === "SELECTED_PARTIAL_CONTRIBUTOR" && byId.get("C4")?.unique_evidence_gate?.status === "QUALIFIED_UNIQUE_EVIDENCE", "semantic unique delta was not retained through the deterministic evidence gate");
assert(byId.get("C3")?.source_disposition === "LEGAL_INSTRUMENT" && byId.get("C3")?.extraction_scope === "FULL_DOCUMENT", "legal instrument integrity was weakened");
assert(selection.counts.extraction_authorized === 3, `expected canonical + unique delta + legal extraction, received ${selection.counts.extraction_authorized}`);

console.log(JSON.stringify({ check: "phase1 RB-18B semantic compression", status: "PASS", semantic_clusters: semantic.counts.final_feature_clusters, extraction_authorized: selection.counts.extraction_authorized, coverage_only_manifest_rows: selection.counts.coverage_only_manifest_rows }, null, 2));

function candidate(id, url) { return { candidate_id: id, canonical_identity: `entity|${url}`, entity_id: "entity", entity_status: "PRIMARY_TARGET", canonical_url: url, fetch_url: url, aliases: [], legacy_manifest_ids: [], member_candidate_ids: [], extraction_authorized_by_legacy_manifest: true }; }
function classification(id, feature, variant, lane, root = "product_service") { const url = candidates.find((row) => row.candidate_id === id).canonical_url; return { classification_id: `RFL.${id}`, candidate_id: id, canonical_identity: `entity|${url}`, entity_id: "entity", entity_status: "PRIMARY_TARGET", canonical_url: url, primary_root: root, secondary_root_references: [], feature_cluster: feature, evidence_lane: lane, variant_family: variant, ai_overlay: null }; }
function fingerprint(id, title, hash, shingles, templateSignature) { const url = candidates.find((row) => row.candidate_id === id).canonical_url; return { candidate_id: id, canonical_identity: `entity|${url}`, fetch_status: "FETCHED", extraction_eligible: true, content_materiality: { status: "MATERIAL_CONTENT" }, exact_content_hash: `EXACT_${id}`, block_hashes: [{ block_index: 1, sha256: hash, character_count: 240 }], near_duplicate_signature: { sampled_hashes: shingles }, template_signature: templateSignature, title, headings: [title], fingerprint_bytes_used: 10000, warnings: [] }; }
function proposal(candidateId, key, relationship, related) { return { candidate_id: candidateId, normalized_feature_key: key, relationship, related_candidate_ids: related, confidence: 0.98, rationale: "Fixture relationship" }; }
function longText(seed) { return `${seed} ${seed} ${seed}`; }
function assert(value, message) { if (!value) throw new Error(message); }
