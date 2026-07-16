import assert from "node:assert/strict";
import http from "node:http";
import { buildSourceExtractionArtifacts } from "../src/phases/01-source-discovery/jobs/source-extraction.job.js";
import { buildSourceFamilyHandoffArtifact } from "../src/phases/01-source-discovery/services/source-family-handoff.service.js";
import { assembleLogicalRootArtifacts, assertLogicalRootAssembly } from "../src/phases/01-source-discovery/services/logical-root-assembly.service.js";
import { assertIndependentLegalArtifacts } from "../src/phases/01-source-discovery/services/independent-legal-artifact-assembly.service.js";
import { assertPhase1CompatibilityProjection } from "../src/phases/01-source-discovery/services/phase1-compatibility-projector.service.js";

const pages = new Map();
for (let index = 1; index <= 6; index += 1) pages.set(`/product-${index}`, {
  title: `Product ${index}`,
  body: `Unique product evidence ${index}. ${`This source contains distinct commercial facts, feature behavior, operating context, and customer-facing evidence number ${index}. `.repeat(4)}`
});
const one97Privacy = "Privacy Policy. Effective Date. One97 explains personal data collection, processing purposes, disclosures, retention, security, user choices, grievance contacts, and legal rights. This complete legal instrument must remain independent and preserve entity provenance.";
pages.set("/one97/privacy-policy", { title: "One97 Privacy Policy", body: one97Privacy });
pages.set("/one97/privacy-policy-copy", { title: "One97 Privacy Policy", body: one97Privacy });
pages.set("/ppsl/privacy-policy", { title: "PPSL Privacy Policy", body: "Paytm Payments Services Limited Privacy Policy. Effective Date. PPSL explains payment-service data collection, processing purposes, disclosures, retention, security, merchant choices, service contacts, and legal rights. This is a different entity-scoped instrument." });

const server = http.createServer((request, response) => {
  const path = new URL(request.url, "http://fixture.local").pathname;
  if (path.endsWith(".md")) return respond(response, 404, "text/plain", "not found");
  const page = pages.get(path);
  if (!page) return respond(response, 404, "text/plain", "not found");
  respond(response, 200, "text/html; charset=utf-8", `<!doctype html><html><head><title>${page.title}</title><meta name="description" content="${page.title}"></head><body><main><h1>${page.title}</h1><p>${page.body}</p></main></body></html>`);
});

const port = await listen(server);
const origin = `http://127.0.0.1:${port}`;
try {
  const run = { run_id: "RB13-RB15-CHECK", target: `${origin}/`, root_url: `${origin}/` };
  const manifest = {
    run_id: run.run_id,
    target_url: run.root_url,
    target_boundary: { primary_entity_id: "one97" },
    final_extraction_authority: true,
    material_content_required_for_extraction: true,
    manifest_sources: [
      ...Array.from({ length: 6 }, (_, index) => productRow(index + 1)),
      legalRow("privacy_data_processing.URL.001", "/one97/privacy-policy", "one97"),
      legalRow("privacy_data_processing.URL.002", "/one97/privacy-policy-copy", "one97"),
      legalRow("privacy_data_processing.URL.003", "/ppsl/privacy-policy", "ppsl")
    ]
  };

  const output = await buildSourceExtractionArtifacts({ run, deduped_url_manifest: manifest });
  assertLogicalRootAssembly(output);
  assertIndependentLegalArtifacts(output);
  assertPhase1CompatibilityProjection(output);

  const productEntry = output.source_family_index.root_artifact_manifest.product_service;
  assert.equal(productEntry.status, "SINGLE");
  assert.deepEqual(productEntry.required_artifacts, ["lossless_root__product_service"]);
  assert.equal(productEntry.source_count, 6);
  assert.equal(productEntry.source_count_sharding_forbidden, true);
  assert.equal(productEntry.sharding_policy, "FINAL_PAYLOAD_BYTES_ONLY_AFTER_DEDUPE");
  assert.ok(output.lossless_root__product_service);
  assert.equal(output.lossless_root__product_service.root_shard_integrity.source_count_trigger_used, false);
  assert.ok(Buffer.byteLength(JSON.stringify(output.lossless_root__product_service), "utf8") < 819200);

  const privacyDocs = output.legal_doc_inventory.documents_found.filter((doc) => doc.doc_type === "privacy_policy");
  assert.equal(privacyDocs.length, 2);
  assert.deepEqual(new Set(privacyDocs.map((doc) => doc.entity_id)), new Set(["one97", "ppsl"]));
  assert.ok(output.legal_doc_privacy_policy);
  assert.equal(output.legal_doc_privacy_policy.entity_id, "one97");
  assert.ok(output.legal_doc_privacy_policy__ppsl);
  assert.equal(output.legal_doc_privacy_policy__ppsl.entity_id, "ppsl");
  assert.equal(output.legal_doc_lossless_validation_manifest.exact_duplicate_aliases_collapsed, 1);
  assert.equal(output.legal_doc_lossless_validation_manifest.cross_entity_merge_detected, false);
  assert.equal(output.legal_doc_lossless_validation_manifest.status, "PASS");

  const handoff = buildSourceFamilyHandoffArtifact({
    run,
    artifacts: {
      ...output,
      deduped_url_manifest: manifest,
      neutral_evidence_bucket_manifest: { buckets: {} }
    }
  });
  assert.ok(handoff.source_discovery_handoff);
  assert.equal(handoff.source_discovery_handoff.common_root_index.product_service.storage_status, "SINGLE");
  assert.deepEqual(handoff.source_discovery_handoff.common_root_index.product_service.physical_artifacts, ["lossless_root__product_service"]);
  assert.equal(handoff.source_discovery_handoff.legal_document_index.documents_found.length, 2);
  assert.ok(handoff.post_phase_1_domain_gate_handoff.classification_allowed);

  validateSizeOnlySharding();

  console.log(JSON.stringify({
    check: "phase1 RB13 logical roots RB14 independent legal artifacts RB15 compatibility projector",
    status: "PASS",
    product_sources: productEntry.source_count,
    product_physical_artifacts: productEntry.required_artifacts.length,
    distinct_privacy_instruments: privacyDocs.length,
    exact_legal_aliases_collapsed: output.legal_doc_lossless_validation_manifest.exact_duplicate_aliases_collapsed,
    downstream_handoff_unchanged: true,
    material_content_gate_active: true
  }, null, 2));
} finally {
  await close(server);
}

function validateSizeOnlySharding() {
  const root = "product_service";
  const baseName = `lossless_root__${root}`;
  const synthetic = {
    source_family_index: {
      run_id: "RB13-SIZE",
      target_url: "https://example.test/",
      root_artifact_manifest: {
        [root]: {
          common_root: root,
          status: "SINGLE",
          complete: true,
          required_artifacts: [baseName],
          virtual_artifact_name: baseName,
          source_count: 2,
          source_ids: ["S1", "S2"]
        }
      },
      saved_root_artifacts: [baseName],
      corpus_forensics: {}
    },
    [baseName]: {
      run_id: "RB13-SIZE",
      target_url: "https://example.test/",
      artifact_name: baseName,
      common_root: root,
      sources: [source("S1", "A".repeat(2600)), source("S2", "B".repeat(2600))],
      legal_document_sources: [],
      manifest_only_sources: [],
      metadata_only_sources: [],
      rejected_sources: [],
      missing_limited_primary_sources: [],
      corpus_forensics: {},
      dedupe_forensics: {}
    }
  };
  assembleLogicalRootArtifacts({ output: synthetic, maxBytes: 4600 });
  assertLogicalRootAssembly(synthetic, { maxBytes: 4600 });
  const entry = synthetic.source_family_index.root_artifact_manifest[root];
  assert.equal(entry.status, "SHARDED");
  assert.equal(entry.required_artifacts.length, 2);
  assert.ok(entry.required_artifacts.every((name) => /^lossless_root__product_service__part_\d{3}$/.test(name)));
  assert.equal(entry.source_count, 2);
  assert.equal(entry.source_count_sharding_forbidden, true);
}

function productRow(index) {
  const path = `/product-${index}`;
  return {
    manifest_id: `product_service.URL.${String(index).padStart(3, "0")}`,
    entity_id: "one97",
    entity_status: "PRIMARY_TARGET",
    canonical_candidate_id: `CANON.PRODUCT.${index}`,
    canonical_identity: `one97|${origin}${path}`,
    common_root: "product_service",
    root_traversal_policy: "PRIMARY_FULL_EXTRACT",
    canonical_url: `${origin}${path}`,
    canonical_url_key: `${origin}${path}`,
    fetch_url: `${origin}${path}`,
    route_type: "product_service",
    route_type_aliases: [],
    materiality: "product_activity",
    source_signal_roles: ["PRODUCT_ACTIVITY_SIGNAL"],
    neutral_buckets: ["product_activity_sources"],
    discovered_by: ["RB13_RB15_FIXTURE"],
    admission_tier: "PRIMARY",
    extraction_decision: "EXTRACT",
    extraction_authorized_by_canonical_selection: true,
    extraction_scope: "FULL_MAIN_CONTENT",
    source_disposition: "SELECTED_CANONICAL",
    feature_cluster: `product_${index}`,
    evidence_lane: "commercial_product",
    variant_family: "none",
    secondary_root_references: [],
    legal_doc_candidate: false,
    legal_doc_type: "other",
    legal_doc_artifact_hint: "legal_doc_other",
    phase_1_classification_effect: "SOURCE_ROUTING_ONLY_NOT_JOB_ROUTING",
    ...materialProof(`product-${index}`)
  };
}

function legalRow(id, path, entityId) {
  return {
    manifest_id: id,
    entity_id: entityId,
    entity_status: entityId === "one97" ? "PRIMARY_TARGET" : "SEPARATE_ENTITY_INCLUDED",
    canonical_candidate_id: `CANON.${id}`,
    canonical_identity: `${entityId}|${origin}${path}`,
    common_root: "privacy_data_processing",
    root_traversal_policy: "PRIMARY_FULL_EXTRACT",
    canonical_url: `${origin}${path}`,
    canonical_url_key: `${origin}${path}`,
    fetch_url: `${origin}${path}`,
    route_type: "privacy_policy",
    route_type_aliases: [],
    materiality: "legal_document",
    source_signal_roles: ["LEGAL_DOCUMENT_SIGNAL", "DATA_PROCESSING_SIGNAL"],
    neutral_buckets: ["legal_terms_sources", "privacy_security_sources"],
    discovered_by: ["RB13_RB15_FIXTURE"],
    admission_tier: "PRIMARY",
    extraction_decision: "EXTRACT",
    extraction_authorized_by_canonical_selection: true,
    extraction_scope: "FULL_DOCUMENT",
    source_disposition: "LEGAL_INSTRUMENT",
    feature_cluster: "legal_governance",
    evidence_lane: "legal_instrument",
    variant_family: "none",
    secondary_root_references: [],
    legal_doc_candidate: true,
    legal_doc_type: "privacy_policy",
    legal_doc_artifact_hint: "legal_doc_privacy_policy",
    phase_1_classification_effect: "SOURCE_ROUTING_ONLY_NOT_JOB_ROUTING",
    ...materialProof(`${entityId}-${path}`)
  };
}

function materialProof(key) {
  return {
    fingerprint_fetch_status: "FETCHED",
    fingerprint_extraction_eligible: true,
    content_materiality: { schema_version: "PHASE1_SOURCE_CONTENT_MATERIALITY_RB18_v1", status: "MATERIAL_CONTENT", extraction_eligible: true, character_count: 240, token_count: 35, unique_token_count: 20, meaningful_block_count: 1, thresholds: { minimum_characters: 60, minimum_tokens: 8, minimum_unique_tokens: 5, minimum_blocks: 1 }, placeholder_signals: [], reasons: [] },
    exact_content_hash: `fixture-content-${key}`,
    selected_block_hashes: [`fixture-block-${key}`]
  };
}

function source(id, text) {
  return {
    source_id: id,
    manifest_id: id,
    common_root: "product_service",
    canonical_url: `https://example.test/${id}`,
    route_type: "product_service",
    materiality: "product_activity",
    admission_tier: "PRIMARY",
    extraction_decision: "EXTRACT",
    status: "FETCHED",
    lossless_text: text,
    sha256: id
  };
}
function respond(response, status, type, body) { response.writeHead(status, { "content-type": type }); response.end(body); }
function listen(value) { return new Promise((resolve, reject) => { value.once("error", reject); value.listen(0, "127.0.0.1", () => resolve(value.address().port)); }); }
function close(value) { return new Promise((resolve) => value.close(() => resolve())); }
