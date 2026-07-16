import assert from "node:assert/strict";
import { buildSourceFingerprintPass, assertSourceFingerprintInventory } from "../src/phases/01-source-discovery/services/source-fingerprint.service.js";
import { normaliseSourceFingerprintEvidencePass, assertSourceFingerprintEvidenceNormalisation } from "../src/phases/01-source-discovery/services/source-fingerprint-evidence-normalizer.service.js";

const canonicalInventory = {
  canonical_candidates: [
    {
      candidate_id: "CANON.EMPTY_SHELL",
      canonical_identity: "entity|https://example.test/app",
      entity_id: "entity",
      entity_status: "PRIMARY_TARGET",
      canonical_url: "https://example.test/app",
      fetch_url: "https://example.test/app"
    },
    {
      candidate_id: "CANON.MATERIAL",
      canonical_identity: "entity|https://example.test/product",
      entity_id: "entity",
      entity_status: "PRIMARY_TARGET",
      canonical_url: "https://example.test/product",
      fetch_url: "https://example.test/product"
    }
  ]
};

const fetchImpl = async (url) => {
  if (String(url).endsWith("/app")) return new Response("<!doctype html><html><head><title>App</title></head><body><script>render()</script><div id='root'></div></body></html>", { status: 200, headers: { "content-type": "text/html" } });
  return new Response("<!doctype html><html><head><title>Product</title></head><body><main><h1>Product</h1><p>This material product page explains operational capability, supported workflows, customer use and technical availability in sufficient detail for evidence analysis.</p></main></body></html>", { status: 200, headers: { "content-type": "text/html" } });
};

const pass = normaliseSourceFingerprintEvidencePass(await buildSourceFingerprintPass({ canonicalInventory, fetchImpl, concurrency: 1 }));
assertSourceFingerprintEvidenceNormalisation(pass);
assertSourceFingerprintInventory(pass.inventory);

const empty = pass.inventory.fingerprints.find((item) => item.candidate_id === "CANON.EMPTY_SHELL");
const material = pass.inventory.fingerprints.find((item) => item.candidate_id === "CANON.MATERIAL");
assert.equal(empty.fetch_status, "FETCH_FAILED");
assert.equal(empty.limitation, "NO_MATERIAL_EVIDENCE_AFTER_BOILERPLATE_REMOVAL");
assert.equal(empty.successful_http_response_without_material_evidence, true);
assert.equal(material.fetch_status, "FETCHED");
assert.ok(material.exact_content_hash);
assert.equal(pass.inventory.counts.successful_http_empty_pages_reclassified, 1);
assert.equal(pass.inventory.counts.fetched, 1);
assert.equal(pass.inventory.counts.failed, 1);

console.log(JSON.stringify({
  check: "phase1 RB18 live materialisation classification",
  status: "PASS",
  http_success_empty_page_status: empty.fetch_status,
  material_page_status: material.fetch_status,
  empty_pages_reclassified: pass.inventory.counts.successful_http_empty_pages_reclassified
}, null, 2));
