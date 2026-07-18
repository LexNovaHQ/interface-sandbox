import assert from "node:assert/strict";
import { resolveEntityBoundary, assertEntityBoundary } from "../src/phases/01-source-discovery/services/entity-boundary.service.js";
import { buildInternalEvidenceModel, assertInternalEvidenceModel } from "../src/phases/01-source-discovery/services/internal-evidence-model.service.js";
import { buildCanonicalUrlInventory, reconcileFingerprintCanonicalHints, assertCanonicalUrlInventory } from "../src/phases/01-source-discovery/services/canonical-url.service.js";
import { buildSourceFingerprintPass, assertSourceFingerprintInventory } from "../src/phases/01-source-discovery/services/source-fingerprint.service.js";
import { buildLegalInstrumentClassification, assertLegalInstrumentClassification } from "../src/phases/01-source-discovery/services/legal-instrument-classifier.service.js";
import { buildRootFeatureLaneClustering, assertRootFeatureLaneClustering } from "../src/phases/01-source-discovery/services/root-feature-lane-clustering.service.js";
import { legalDocTypeFromUrlOrRoute } from "../src/phases/01-source-discovery/services/source-discovery-taxonomy.service.js";

const targetUrl = "https://example.com/";
const rawCandidates = [
  raw("http://www.example.com/product/?utm_source=test#hero", ["product_service"], ["ROOT_BODY"]),
  raw("https://example.com/product", ["product_service"], ["SITEMAP"]),
  raw("https://example.com/apis/translation/tamil-to-marathi", ["technical_docs_api"], ["SITEMAP"]),
  raw("https://example.com/apis/translation/hindi-to-marathi", ["technical_docs_api"], ["SITEMAP"]),
  raw("https://example.com/electricity-bill-payment", ["product_service"], ["HEADER"]),
  raw("https://example.com/electricity-bill-payment/bihar", ["product_service"], ["SITEMAP"]),
  raw("https://example.com/electricity-bill-payment/bihar/provider-one", ["product_service"], ["SITEMAP"]),
  raw("https://example.com/airouter", ["product_service", "ai_safety_transparency"], ["HEADER"]),
  raw("https://example.com/sla", ["privacy_data_processing"], ["FOOTER"]),
  raw("https://example.com/privacy-policy", ["privacy_data_processing"], ["FOOTER"]),
  raw("https://example.com/safety", ["ai_safety_transparency"], ["FOOTER"]),
  raw("https://separate.example.net/privacy-policy", ["privacy_data_processing"], ["FOOTER"])
];

const rawDiscoveryInventory = {
  schema_version: "PHASE1_BROAD_DISCOVERY_INVENTORY_v1",
  root_refresh: { status: "PROVIDED" },
  candidate_urls: rawCandidates
};

const entityBoundary = resolveEntityBoundary({
  targetUrl,
  discoveredLinks: rawCandidates,
  explicitEntitySurfaces: [{
    host: "separate.example.net",
    status: "SEPARATE_ENTITY_INCLUDED",
    entity_id: "entity_separate",
    entity_name: "Separate Payments Limited",
    evidence: ["OFFICIAL_LEGAL_ENTITY_DISCLOSURE"]
  }]
});
assertEntityBoundary(entityBoundary);

const manifest = { manifest_sources: buildManifestRows(rawCandidates) };
const internalModel = buildInternalEvidenceModel({ run: { run_id: "RB05-RB08" }, manifest, entityBoundary, rawDiscoveryInventory });
assertInternalEvidenceModel(internalModel);

const initialCanonical = buildCanonicalUrlInventory({ rawDiscoveryInventory, entityBoundary });
assertCanonicalUrlInventory(initialCanonical);
assert.equal(initialCanonical.canonical_candidates.filter((item) => item.canonical_url === "https://example.com/product").length, 1, "HTTP/HTTPS, www, tracking and fragment variants did not collapse");
const product = initialCanonical.canonical_candidates.find((item) => item.canonical_url === "https://example.com/product");
assert.ok(product.aliases.some((item) => item.includes("utm_source")), "canonical alias evidence was lost");
const primaryPrivacy = initialCanonical.canonical_candidates.find((item) => item.canonical_url === "https://example.com/privacy-policy");
const separatePrivacy = initialCanonical.canonical_candidates.find((item) => item.canonical_url === "https://separate.example.net/privacy-policy");
assert.notEqual(primaryPrivacy.entity_id, separatePrivacy.entity_id, "different legal entities were merged before content comparison");

const fetchCounts = new Map();
const fingerprintPass = await buildSourceFingerprintPass({
  canonicalInventory: initialCanonical,
  fetchImpl: async (url) => {
    const key = new URL(url).toString();
    fetchCounts.set(key, (fetchCounts.get(key) || 0) + 1);
    const html = documentFor(url);
    return new Response(html, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } });
  },
  concurrency: 3
});
assertSourceFingerprintInventory(fingerprintPass.inventory);
for (const [url, count] of fetchCounts) assert.equal(count, 1, `fingerprint pass fetched ${url} ${count} times`);

const translationFingerprints = fingerprintPass.inventory.fingerprints.filter((item) => item.canonical_url.includes("/apis/translation/"));
assert.equal(translationFingerprints.length, 2, "translation fingerprint fixtures missing");
assert.equal(new Set(translationFingerprints.map((item) => item.exact_content_hash)).size, 1, "exact duplicate translation content did not produce the same hash");
assert.ok(translationFingerprints.every((item) => item.template_signature.includes("{language-pair}")), "translation template signature was not detected");

const canonical = reconcileFingerprintCanonicalHints({ canonicalInventory: initialCanonical, fingerprintInventory: fingerprintPass.inventory, entityBoundary });
assertCanonicalUrlInventory(canonical);
assert.ok(canonical.canonical_candidates.some((item) => item.canonical_url === "https://example.com/service-level-agreement"), "rel=canonical hint was not reconciled");
assert.equal(canonical.blocked_canonical_hints.length, 0, "same-entity canonical hints were incorrectly blocked");

const legal = buildLegalInstrumentClassification({ canonicalInventory: canonical, fingerprintInventory: fingerprintPass.inventory, analysisCache: fingerprintPass.analysis_cache, internalEvidenceModel: internalModel });
assertLegalInstrumentClassification(legal);
assert.equal(legalDocTypeFromUrlOrRoute("technical_child_page https://example.com/apis/translation/tamil-to-marathi").docType, "other", "translation still false-matches SLA");
assert.equal(legalDocTypeFromUrlOrRoute("https://example.com/service-level-agreement").docType, "service_level_agreement", "bounded SLA route was not recognised");
assert.equal(classification("https://example.com/service-level-agreement").classification_status, "CONFIRMED_LEGAL_INSTRUMENT");
assert.equal(classification("https://example.com/privacy-policy").doc_type, "privacy_policy");
assert.equal(classification("https://example.com/safety").classification_status, "NOT_LEGAL_INSTRUMENT", "generic safety page was promoted to a legal policy");
assert.equal(classification("https://separate.example.net/privacy-policy").entity_id, "entity_separate", "legal classification lost separate-entity provenance");

const clustering = buildRootFeatureLaneClustering({ canonicalInventory: canonical, fingerprintInventory: fingerprintPass.inventory, analysisCache: fingerprintPass.analysis_cache, internalEvidenceModel: internalModel, legalClassification: legal });
assertRootFeatureLaneClustering(clustering);
const translations = clustering.source_classifications.filter((item) => item.feature_cluster === "translation");
assert.equal(translations.length, 2, "translation pages did not share one feature cluster");
assert.ok(translations.every((item) => item.variant_family === "translation_language_pair"), "translation pair variants were not identified");
const electricity = clustering.source_classifications.filter((item) => item.feature_cluster === "electricity_bill_payment");
assert.equal(electricity.length, 3, "electricity bill-payment pages did not share one feature cluster");
assert.equal(electricity.filter((item) => item.variant_family === "electricity_bill_payment_state_provider").length, 2, "state/provider variants were not identified");
const aiRouter = clustering.source_classifications.find((item) => item.feature_cluster === "payment_routing");
assert.ok(aiRouter, "AI Router was not classified as payment routing");
assert.equal(aiRouter.primary_root, "product_service");
assert.ok(aiRouter.secondary_root_references.includes("ai_safety_transparency"));
assert.equal(aiRouter.ai_overlay?.underlying_feature, "payment_routing");
assert.equal(new Set(clustering.source_classifications.map((item) => item.canonical_identity)).size, clustering.source_classifications.length, "one source was physically classified more than once");

for (const inventory of [initialCanonical, canonical, fingerprintPass.inventory, legal, clustering]) assert.equal(inventory.public_manifest_selection_changed ?? inventory.final_extraction_authority, false, "RB05-RB08 changed final extraction selection before RB09");

console.log(JSON.stringify({
  check: "phase1 RB05 URL canonicalisation RB06 fingerprint RB07 clustering RB08 legal classifier",
  status: "PASS",
  canonical_candidates: canonical.canonical_candidates.length,
  fingerprints: fingerprintPass.inventory.fingerprints.length,
  feature_clusters: clustering.feature_clusters.length,
  confirmed_legal_instruments: legal.counts.confirmed_legal_instruments,
  translation_false_sla_guard: "PASS"
}, null, 2));

function classification(url) {
  const found = legal.classifications.find((item) => item.canonical_url === url);
  assert.ok(found, `legal classification missing: ${url}`);
  return found;
}

function raw(url, rootCandidates, discoveryChannels) {
  return {
    raw_url: url,
    canonical_url: url,
    raw_url_variants: [url],
    discovery_channels: discoveryChannels,
    source_scopes: ["RB05_RB08_FIXTURE"],
    extraction_authorized: true,
    legacy_manifest_ids: [],
    root_candidates: rootCandidates,
    discovery_only_not_final_extraction_authority: true
  };
}

function buildManifestRows(candidates) {
  const rows = [];
  let counter = 0;
  for (const candidate of candidates) {
    for (const root of candidate.root_candidates) {
      counter += 1;
      const url = candidate.canonical_url;
      rows.push({
        manifest_id: `${root}.URL.${String(counter).padStart(3, "0")}`,
        common_root: root,
        canonical_url: url,
        fetch_url: url,
        route_type: routeFor(url),
        admission_tier: "PRIMARY",
        extraction_decision: "EXTRACT",
        legal_doc_candidate: /\/(sla|privacy-policy)$/.test(new URL(url).pathname),
        materiality: /\/(sla|privacy-policy)$/.test(new URL(url).pathname) ? "legal_document" : "product_activity",
        feature_cluster: routeFor(url),
        variant_cluster_id: routeFor(url)
      });
    }
  }
  return rows;
}

function routeFor(url) {
  const path = new URL(url).pathname;
  if (path.includes("translation")) return "translation";
  if (path.includes("electricity-bill-payment")) return "electricity_bill_payment";
  if (path.includes("airouter")) return "ai_router";
  if (path.includes("privacy")) return "privacy_policy";
  if (path.includes("sla")) return "service_level_agreement";
  if (path.includes("safety")) return "safety";
  return "product";
}

function documentFor(value) {
  const url = new URL(value);
  const path = url.pathname;
  if (path === "/product") return html("Product", "Core product capabilities and commercial availability for customers.");
  if (path.includes("/apis/translation/")) return html("Translation language pair", "Translate text between supported Indian languages with the same API workflow and supported language coverage.");
  if (path === "/electricity-bill-payment") return html("Electricity Bill Payment", "Pay electricity bills by selecting the state and electricity board, entering the consumer number and completing payment.");
  if (path === "/electricity-bill-payment/bihar") return html("Electricity Bill Payment Bihar", "Pay electricity bills by selecting the state and electricity board, entering the consumer number and completing payment. Bihar supports NBPDCL and SBPDCL.");
  if (path.includes("provider-one")) return html("Provider One Electricity Payment", "Pay electricity bills by selecting the state and electricity board, entering the consumer number and completing payment. Provider One requires a twelve digit consumer identifier.");
  if (path === "/airouter") return html("AI Router", "AI and machine learning optimise payment routing using gateway performance, approval rates and transaction attributes.");
  if (path === "/sla") return html("Service Level Agreement", "Effective Date 1 July 2026. This Service Level Agreement provides a 99.9 percent uptime availability commitment and service credits.", "/service-level-agreement");
  if (path === "/privacy-policy") return html("Privacy Policy", "Effective Date 1 July 2026. We process personal data as data controller and provide privacy rights to each data subject.");
  if (path === "/safety") return html("Safety Engineering", "Our product safety engineering team evaluates model quality and reliability for customers.");
  if (url.hostname === "separate.example.net") return html("Privacy Policy", "Effective Date 1 July 2026. Separate Payments Limited is the data controller for personal data and privacy rights.");
  return html("Page", "General material evidence for deterministic Phase 1 testing.");
}

function html(title, body, canonicalPath) {
  const canonical = canonicalPath ? `<link rel="canonical" href="${canonicalPath}">` : "";
  return `<!doctype html><html><head><title>${title}</title>${canonical}</head><body><header>Global navigation</header><main><h1>${title}</h1><p>${body}</p></main><footer>Global footer</footer></body></html>`;
}
