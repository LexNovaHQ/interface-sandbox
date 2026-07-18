import assert from "node:assert/strict";
import { buildSourceFingerprintPass, assertSourceFingerprintInventory } from "../src/phases/01-source-discovery/services/source-fingerprint.service.js";
import { buildLegalInstrumentClassification, assertLegalInstrumentClassification } from "../src/phases/01-source-discovery/services/legal-instrument-classifier.service.js";
import { buildRootFeatureLaneClustering, assertRootFeatureLaneClustering } from "../src/phases/01-source-discovery/services/root-feature-lane-clustering.service.js";
import { buildCanonicalSelection, assertCanonicalSelection } from "../src/phases/01-source-discovery/services/canonical-selection.service.js";
import { buildFinalDedupedManifest, assertFinalDedupedManifest } from "../src/phases/01-source-discovery/services/final-deduped-manifest.service.js";
import { assertCleanExtractionManifestBoundary } from "../src/phases/01-source-discovery/services/clean-extraction-manifest-boundary.service.js";
import { assertFinalManifestMaterialExtractionBoundary, assertExtractedSourcesContainMaterialText } from "../src/phases/01-source-discovery/services/source-content-materiality.service.js";

const candidates = [
  candidate("CANON.EMPTY_SHELL", "/app"),
  candidate("CANON.PLACEHOLDER", "/loading"),
  candidate("CANON.LEGAL_SHELL", "/privacy-policy"),
  candidate("CANON.MATERIAL", "/product")
];
const canonicalInventory = { canonical_candidates: candidates };
const fetchImpl = async (url) => {
  const pathname = new URL(url).pathname;
  if (pathname === "/app") return html("App", "<script>render()</script><div id='root'></div>");
  if (pathname === "/loading") return html("Loading", "<main><p>Loading. Please wait while this application initializes.</p></main>");
  if (pathname === "/privacy-policy") return html("Privacy Policy", "<script>renderPolicy()</script><div id='policy-root'></div>");
  return html("Product", "<main><h1>Product</h1><p>This material product page explains operational capability, supported workflows, customer use, technical availability, implementation boundaries, service limitations, and the evidence required for a diligence review. The page contains substantive information rather than a navigation shell or placeholder response.</p></main>");
};

const pass = await buildSourceFingerprintPass({ canonicalInventory, fetchImpl, concurrency: 1 });
assertSourceFingerprintInventory(pass.inventory);
const empty = fingerprint(pass, "CANON.EMPTY_SHELL");
const placeholder = fingerprint(pass, "CANON.PLACEHOLDER");
const legalShell = fingerprint(pass, "CANON.LEGAL_SHELL");
const material = fingerprint(pass, "CANON.MATERIAL");
for (const item of [empty, placeholder, legalShell]) {
  assert.equal(item.fetch_status, "FETCHED_NO_MATERIAL_CONTENT");
  assert.equal(item.extraction_eligible, false);
  assert.equal(item.exact_content_hash, null);
  assert.equal(item.content_materiality.status, "NO_MATERIAL_CONTENT");
}
assert.equal(material.fetch_status, "FETCHED");
assert.equal(material.extraction_eligible, true);
assert.ok(material.exact_content_hash);
assert.ok(material.block_hashes.length > 0);
assert.equal(material.content_materiality.status, "MATERIAL_CONTENT");
assert.equal(pass.inventory.counts.fetched_no_material_content, 3);
assert.equal(pass.inventory.counts.extraction_eligible, 1);

const internalEvidenceModel = {
  source_candidates: candidates.map((item) => ({
    canonical_url: item.canonical_url,
    primary_root: item.canonical_url.endsWith("privacy-policy") ? "privacy_data_processing" : "product_service",
    root_candidates: [item.canonical_url.endsWith("privacy-policy") ? "privacy_data_processing" : "product_service"],
    feature_cluster: item.canonical_url.endsWith("product") ? "product" : "application_surface",
    evidence_lane: item.canonical_url.endsWith("privacy-policy") ? "legal_instrument" : "commercial_product",
    legal_instrument_candidate: item.canonical_url.endsWith("privacy-policy")
  }))
};
const legal = buildLegalInstrumentClassification({ canonicalInventory, fingerprintInventory: pass.inventory, analysisCache: pass.analysis_cache, internalEvidenceModel });
assertLegalInstrumentClassification(legal);
const legalShellClassification = legal.classifications.find((item) => item.candidate_id === "CANON.LEGAL_SHELL");
assert.equal(legalShellClassification.confirmed_legal_instrument, false);
assert.equal(legalShellClassification.classification_limitation, "NO_MATERIAL_DOCUMENT_BODY");

const clustering = buildRootFeatureLaneClustering({ canonicalInventory, fingerprintInventory: pass.inventory, analysisCache: pass.analysis_cache, internalEvidenceModel, legalClassification: legal });
assertRootFeatureLaneClustering(clustering);
const selection = buildCanonicalSelection({ canonicalInventory, fingerprintInventory: pass.inventory, rootFeatureLaneClustering: clustering, legalClassification: legal, analysisCache: pass.analysis_cache });
assertCanonicalSelection(selection);
const selectionById = new Map(selection.decisions.map((row) => [row.candidate_id, row]));
const finalManifest = buildFinalDedupedManifest({ legacyManifest: legacyManifest(candidates), canonicalSelection: selection });
assertFinalDedupedManifest(finalManifest, selection);
assertCleanExtractionManifestBoundary(finalManifest);
assertFinalManifestMaterialExtractionBoundary(finalManifest);

assert.equal(finalManifest.clean_extraction_manifest, true);
assert.equal(finalManifest.contains_extraction_authority_only, true);
assert.equal(finalManifest.manifest_sources.length, 1);
const materialRow = finalManifest.manifest_sources[0];
assert.equal(materialRow.canonical_candidate_id, "CANON.MATERIAL");
assert.equal(materialRow.final_url_disposition, "EXTRACT_CANONICAL_FULL");
assert.equal(materialRow.extraction_decision, "EXTRACT");
assert.equal(materialRow.admission_tier, "PRIMARY");
assert.equal(materialRow.fingerprint_extraction_eligible, true);

for (const id of ["CANON.EMPTY_SHELL", "CANON.PLACEHOLDER", "CANON.LEGAL_SHELL"]) {
  const decision = selectionById.get(id);
  assert.equal(decision.source_disposition, "REJECTED_NOT_EVIDENCE");
  assert.equal(decision.extraction_authorized, false);
  assert.equal(decision.fingerprint_extraction_eligible, false);
  assert.equal(decision.legal_doc_type, "other");
  assert.ok(!finalManifest.manifest_sources.some((row) => row.canonical_candidate_id === id));
}
assert.equal(finalManifest.manifest_forensics.audited_rows, 4);
assert.equal(finalManifest.manifest_forensics.clean_manifest_rows, 1);
assert.equal(finalManifest.manifest_forensics.audit_only_rows_excluded_from_extraction_manifest, 3);
assert.equal(finalManifest.manifest_forensics.audit_disposition_counts.REJECT_NONMATERIAL, 3);

const corrupted = structuredClone(finalManifest);
corrupted.manifest_sources.push({
  ...materialRow,
  manifest_id: "product_service.URL.999",
  canonical_candidate_id: "CANON.CORRUPTED",
  canonical_identity: "entity|https://example.test/corrupted",
  canonical_url: "https://example.test/corrupted",
  fetch_url: "https://example.test/corrupted",
  fingerprint_fetch_status: "FETCHED_NO_MATERIAL_CONTENT",
  fingerprint_extraction_eligible: false,
  content_materiality: { status: "NO_MATERIAL_CONTENT" },
  exact_content_hash: null,
  selected_block_hashes: []
});
assert.throws(() => assertCleanExtractionManifestBoundary(corrupted), /PHASE1_AGENT_1B_BLOCKED_NON_MATERIAL_CLEAN_ROW/);
assert.throws(() => assertFinalManifestMaterialExtractionBoundary(corrupted), /PHASE1_EXTRACTION_BLOCKED_NON_MATERIAL_SOURCE/);

const postDedupeOutput = postDedupePhysicalFixture();
const postDedupeResult = assertExtractedSourcesContainMaterialText(postDedupeOutput);
assert.equal(postDedupeResult.physical_root_sources, 1);
assert.equal(postDedupeResult.suppressed_nonphysical_sources, 2);
const corruptedPhysical = structuredClone(postDedupeOutput);
corruptedPhysical.lossless_root__product_service.sources[0].lossless_text = "Loading. Please wait.";
assert.throws(() => assertExtractedSourcesContainMaterialText(corruptedPhysical), /PHASE1_EXTRACTED_SOURCE_NOT_MATERIAL/);

console.log(JSON.stringify({
  check: "phase1 RB18 material-content extraction gate",
  status: "PASS",
  audited_urls: finalManifest.manifest_forensics.audited_rows,
  material_pages_authorized: finalManifest.manifest_sources.length,
  non_material_pages_rejected_before_clean_manifest: 3,
  empty_legal_route_confirmed: legalShellClassification.confirmed_legal_instrument,
  post_dedupe_physical_source_of_truth_proved: true,
  suppressed_duplicate_reference_allowed_without_physical_text: true,
  clean_manifest_fail_loud_boundary_proved: true
}, null, 2));

function postDedupePhysicalFixture() {
  const materialText = "This physically retained product source contains substantive commercial evidence, operational capability, feature behavior, implementation limits, customer context, and enough distinct content to qualify as material evidence after duplicate removal.";
  return {
    source_family_index: {
      discovered_source_index: [
        { source_id: "product_service.SRC.001", common_root: "product_service" },
        { source_id: "product_service.SRC.002", common_root: "product_service" },
        { source_id: "product_service.SRC.003", common_root: "product_service" }
      ],
      manifest_only_index: [
        { source_id: "product_service.SRC.002", extraction_status: "SUPPRESS_EXACT_DUPLICATE", duplicate_owner_source_id: "product_service.SRC.001" },
        { source_id: "product_service.SRC.003", extraction_status: "SUPPRESS_NO_RETAINED_MATERIAL_AFTER_SCOPE", canonical_owner_candidate_id: "CANON.OWNER", suppression_reason: "DECLARED_EXTRACTION_SCOPE_RETAINED_NO_BODY_OR_UNIQUE_BLOCK" }
      ],
      root_artifact_manifest: { product_service: { common_root: "product_service", required_artifacts: ["lossless_root__product_service"], source_count: 1, source_ids: ["product_service.SRC.001"] } },
      block_dedupe_forensics: { roots: { product_service: { source_forensics: [
        { source_id: "product_service.SRC.001", action: "RETAIN" },
        { source_id: "product_service.SRC.002", action: "SUPPRESS_EXACT_DUPLICATE", duplicate_owner_source_id: "product_service.SRC.001" }
      ] } } }
    },
    lossless_root__product_service: { common_root: "product_service", sources: [{ source_id: "product_service.SRC.001", extraction_scope: "FULL_MAIN_CONTENT", lossless_text: materialText }] },
    legal_doc_inventory: { documents_found: [] }
  };
}

function candidate(id, pathname) {
  const url = `https://example.test${pathname}`;
  return { candidate_id: id, canonical_identity: `entity|${url}`, entity_id: "entity", entity_status: "PRIMARY_TARGET", canonical_url: url, fetch_url: url, aliases: [], member_candidate_ids: [], root_candidates: [pathname === "/privacy-policy" ? "privacy_data_processing" : "product_service"], legacy_manifest_ids: [`LEGACY.${id}`], extraction_authorized_by_legacy_manifest: true };
}
function html(title, body) { return new Response(`<!doctype html><html><head><title>${title}</title></head><body>${body}</body></html>`, { status: 200, headers: { "content-type": "text/html" } }); }
function fingerprint(pass, id) { return pass.inventory.fingerprints.find((item) => item.candidate_id === id); }
function legacyManifest(items) {
  return {
    run_id: "RB18-MATERIAL-GATE",
    target: "example.test",
    target_url: "https://example.test/",
    target_boundary: { primary_entity_id: "entity" },
    manifest_sources: items.map((item, index) => ({
      manifest_id: `LEGACY.${item.candidate_id}`,
      common_root: item.canonical_url.endsWith("privacy-policy") ? "privacy_data_processing" : "product_service",
      root_traversal_policy: "PRIMARY_FULL_EXTRACT",
      canonical_url: item.canonical_url,
      canonical_url_key: item.canonical_url,
      fetch_url: item.fetch_url,
      route_type: item.canonical_url.endsWith("privacy-policy") ? "privacy_policy" : "product_slug",
      route_type_aliases: [],
      materiality: "source_evidence",
      source_signal_roles: [],
      technical_route_shape: null,
      api_data_flow_signal: { present: false, basis: [] },
      neutral_buckets: [],
      discovered_by: ["FIXTURE"],
      priority_route_found_by: "FIXTURE",
      priority_result: "PRIMARY_FOUND",
      admission_tier: "PRIMARY",
      variant_class: "NONE",
      variant_cluster_id: `fixture_${index}`,
      variant_rank: 1,
      extraction_decision: "EXTRACT",
      downstream_default: true,
      tier_reason: "fixture",
      legal_doc_candidate: item.canonical_url.endsWith("privacy-policy"),
      legal_doc_type: item.canonical_url.endsWith("privacy-policy") ? "privacy_policy" : "other",
      legal_doc_artifact_hint: item.canonical_url.endsWith("privacy-policy") ? "legal_doc_privacy_policy" : "legal_doc_other",
      phase_1_classification_effect: "SOURCE_ROUTING_ONLY_NOT_JOB_ROUTING"
    }))
  };
}
