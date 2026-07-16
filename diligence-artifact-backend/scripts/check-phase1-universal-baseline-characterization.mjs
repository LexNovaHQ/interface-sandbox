import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSourceExtractionArtifactSet } from "../src/phases/01-source-discovery/services/source-extraction.service.js";
import { legalDocTypeFromUrlOrRoute } from "../src/phases/01-source-discovery/services/source-discovery-taxonomy.service.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const FIXTURE_ROOT = path.join(ROOT, "test/fixtures/phase1-universal-baselines");
const EXPECT_RED = process.argv.includes("--expect-red");
const failures = [];

await main().catch((error) => {
  console.error(JSON.stringify({ check: "phase1 universal baseline harness", status: "HARNESS_ERROR", error: error?.stack || String(error) }, null, 2));
  process.exitCode = 1;
});

async function main() {
  const sarvam = readFixture("sarvam-ai.fixture.json");
  const paytm = readFixture("paytm-fintech-ai-overlay.fixture.json");
  const pageMap = new Map([...sarvam.pages, ...paytm.pages].map((page) => [page.path, page]));
  const server = http.createServer((request, response) => serveFixture(request, response, pageMap));
  try {
    const port = await listen(server);
    const origin = `http://127.0.0.1:${port}`;
    const sarvamArtifacts = await executeFixture(sarvam, origin, "RB01-SARVAM");
    const paytmArtifacts = await executeFixture(paytm, origin, "RB01-PAYTM");

    runAssertions(sarvamArtifacts, paytmArtifacts);
    report([sarvam.fixture_id, paytm.fixture_id]);
  } finally {
    await close(server);
  }
}

async function executeFixture(fixture, origin, runId) {
  return buildSourceExtractionArtifactSet({
    run: { run_id: runId, target: `${origin}/`, root_url: `${origin}/` },
    deduped_url_manifest: {
      run_id: runId,
      target_url: `${origin}/`,
      manifest_sources: fixture.pages.map((page, index) => manifestRow(page, index, origin))
    }
  });
}

function manifestRow(page, index, origin) {
  const variant = page.variant_family?.includes("language_pair") || page.variant_family?.includes("state_provider");
  return {
    manifest_id: `${page.common_root}.URL.${String(index + 1).padStart(3, "0")}`,
    entity_id: page.entity_id,
    common_root: page.common_root,
    root_traversal_policy: page.common_root === "homepage_landing" ? "PRIMARY_SINGLE_EXTRACT" : "PRIMARY_FULL_EXTRACT",
    canonical_url: `${origin}${page.path}`,
    canonical_url_key: `${origin}${page.path}`,
    fetch_url: `${origin}${page.path}`,
    route_type: page.evidence_lane === "legal_instrument" ? "legal_document_surface" : page.feature_cluster,
    route_type_aliases: [],
    materiality: page.evidence_lane === "legal_instrument" ? "legal_document" : "product_activity",
    source_signal_roles: page.evidence_lane === "legal_instrument" ? ["LEGAL_DOCUMENT_SIGNAL"] : ["PRODUCT_ACTIVITY_SIGNAL"],
    technical_route_shape: page.evidence_lane === "technical_operation" ? { shape: "technical_overview" } : null,
    api_data_flow_signal: { present: page.evidence_lane === "technical_operation", basis: page.evidence_lane === "technical_operation" ? ["fixture"] : [] },
    neutral_buckets: page.evidence_lane === "legal_instrument" ? ["legal_terms_sources"] : ["product_activity_sources"],
    discovered_by: ["RB01_FIXTURE"],
    priority_route_found_by: "RB01_FIXTURE",
    priority_result: "PRIMARY_FOUND",
    admission_tier: "PRIMARY",
    variant_class: page.variant_family ? "FIXTURE_VARIANT_FAMILY" : "NONE",
    feature_cluster: page.feature_cluster,
    evidence_lane: page.evidence_lane,
    variant_family: page.variant_family,
    structured_coverage: page.coverage || null,
    unique_material: page.unique_material || [],
    secondary_root_references: page.secondary_roots || [],
    ai_overlay: page.ai_overlay || null,
    extraction_scope: variant ? "STRUCTURED_COVERAGE_ONLY" : page.unique_material?.length ? "SELECTED_UNIQUE_SECTIONS" : "FULL_MAIN_CONTENT",
    extraction_decision: "EXTRACT",
    downstream_default: true,
    tier_reason: "RB01 baseline fixture",
    legal_doc_candidate: Boolean(page.legal_doc_candidate),
    legal_doc_type: page.legal_doc_type || "other",
    legal_doc_artifact_hint: page.legal_doc_type ? `legal_doc_${page.legal_doc_type}` : "legal_doc_other",
    phase_1_classification_effect: "SOURCE_ROUTING_ONLY_NOT_JOB_ROUTING"
  };
}

function runAssertions(sarvamArtifacts, paytmArtifacts) {
  check("LEGAL_TOKEN_BOUNDARY_TRANSLATION_NOT_SLA", () => {
    const result = legalDocTypeFromUrlOrRoute("technical_child_page https://sarvam.ai/apis/translation/tamil-to-marathi");
    equal(result.docType, "other", `translation classified as ${result.docType}`);
  });

  check("SARVAM_EXACT_CONTENT_DEDUPE", () => {
    const duplicates = duplicateHashesByRoot(sarvamArtifacts.source_family_index.discovered_source_index);
    equal(duplicates.length, 0, `duplicate extracted hashes remain: ${JSON.stringify(duplicates)}`);
  });

  check("SARVAM_FEATURE_METADATA_PROPAGATION", () => {
    assertMetadata(sarvamArtifacts.source_family_index.discovered_source_index.filter((row) => !row.legal_doc_candidate));
  });

  check("SARVAM_ONE_LOGICAL_PRODUCT_ROOT_BELOW_800_KIB", () => {
    assertOnePhysicalRootBelowThreshold(sarvamArtifacts, "product_service", 819200);
  });

  check("SARVAM_VARIANT_SCOPE_CONTROL", () => {
    const rows = sarvamArtifacts.source_family_index.discovered_source_index.filter((row) => row.canonical_url?.includes("/apis/translation/") || row.canonical_url?.includes("/apis/text-to-speech/hindi"));
    truthy(rows.length >= 3, "Sarvam variant rows missing");
    for (const row of rows) truthy(["SELECTED_UNIQUE_SECTIONS", "STRUCTURED_COVERAGE_ONLY", "METADATA_ONLY"].includes(row.extraction_scope), `${row.canonical_url} has no dedupe extraction scope`);
  });

  check("PAYTM_ONE_LOGICAL_PRODUCT_ROOT_BELOW_800_KIB", () => {
    assertOnePhysicalRootBelowThreshold(paytmArtifacts, "product_service", 819200);
  });

  check("PAYTM_TEMPLATE_VARIANTS_NOT_FULL_EXTRACTED", () => {
    const rows = paytmArtifacts.source_family_index.discovered_source_index.filter((row) => /\/electricity-bill-payment\/.+/.test(new URL(row.canonical_url).pathname));
    equal(rows.length, 6, "Paytm electricity variants missing");
    for (const row of rows) truthy(["STRUCTURED_COVERAGE_ONLY", "SELECTED_UNIQUE_SECTIONS", "METADATA_ONLY"].includes(row.extraction_scope), `${row.canonical_url} remained a full extracted source`);
  });

  check("PAYTM_ENTITY_ID_PROPAGATION", () => {
    const row = paytmArtifacts.source_family_index.discovered_source_index.find((item) => item.canonical_url?.endsWith("/payment-gateway"));
    truthy(row, "payment-gateway source missing");
    equal(row.entity_id, "ppsl", "PPSL entity ownership lost");
  });

  check("PAYTM_LEGAL_ENTITY_SEPARATION", () => {
    const privacyDocs = paytmArtifacts.legal_doc_inventory.documents_found.filter((doc) => doc.doc_type === "privacy_policy");
    equal(privacyDocs.length, 2, `expected two privacy instruments, found ${privacyDocs.length}`);
    const entities = new Set(privacyDocs.map((doc) => doc.entity_id));
    truthy(entities.has("one97") && entities.has("ppsl"), `privacy entity separation lost: ${JSON.stringify([...entities])}`);
  });

  check("PAYTM_SECONDARY_ROOT_REFERENCES", () => {
    const row = paytmArtifacts.source_family_index.discovered_source_index.find((item) => item.canonical_url?.endsWith("/airouter"));
    truthy(row, "AI Router source missing");
    deepEqual(row.secondary_root_references, ["ai_safety_transparency"], "secondary-root references lost");
  });

  check("PAYTM_AI_OVERLAY_RELATIONSHIP_PROPAGATION", () => {
    const rows = paytmArtifacts.source_family_index.discovered_source_index.filter((row) => row.canonical_url?.endsWith("/airouter") || row.canonical_url?.endsWith("/docs/ai-router-overview") || row.canonical_url?.endsWith("/paytm-pi"));
    equal(rows.length, 3, "AI overlay sources missing");
    for (const row of rows) truthy(row.ai_overlay, `${row.canonical_url} lost AI overlay`);
  });

  check("LEGAL_ARTIFACT_ENTITY_PROVENANCE", () => {
    const legalArtifacts = Object.entries(paytmArtifacts).filter(([name]) => name.startsWith("legal_doc_") && !["legal_doc_inventory", "legal_doc_extraction_index", "legal_doc_lossless_validation_manifest"].includes(name));
    truthy(legalArtifacts.length >= 4, "expected Paytm legal artifacts missing");
    for (const [name, artifact] of legalArtifacts) truthy(artifact.entity_id, `${name} lost entity provenance`);
  });
}

function report(fixtures) {
  const requiredRed = new Set([
    "LEGAL_TOKEN_BOUNDARY_TRANSLATION_NOT_SLA",
    "SARVAM_EXACT_CONTENT_DEDUPE",
    "SARVAM_FEATURE_METADATA_PROPAGATION",
    "SARVAM_ONE_LOGICAL_PRODUCT_ROOT_BELOW_800_KIB",
    "PAYTM_ONE_LOGICAL_PRODUCT_ROOT_BELOW_800_KIB",
    "PAYTM_ENTITY_ID_PROPAGATION",
    "PAYTM_LEGAL_ENTITY_SEPARATION"
  ]);
  if (EXPECT_RED) {
    const observed = new Set(failures.map((failure) => failure.id));
    const missing = [...requiredRed].filter((id) => !observed.has(id));
    if (missing.length) {
      console.error(JSON.stringify({ check: "phase1 universal baseline expected-red characterization", status: "INVALID_RED_BASELINE", missing_expected_failure_ids: missing, observed_failures: failures }, null, 2));
      process.exitCode = 1;
      return;
    }
    console.log(JSON.stringify({ check: "phase1 universal baseline expected-red characterization", status: "EXPECTED_RED_CONFIRMED", fixtures, observed_failure_count: failures.length, observed_failures: failures }, null, 2));
    return;
  }
  if (failures.length) {
    console.error(JSON.stringify({ check: "phase1 universal baseline", status: "FAIL", fixtures, failures }, null, 2));
    process.exitCode = 1;
    return;
  }
  console.log(JSON.stringify({ check: "phase1 universal baseline", status: "PASS", fixtures }, null, 2));
}

function assertMetadata(rows) {
  truthy(rows.length > 0, "no source rows extracted");
  for (const row of rows) {
    truthy(row.entity_id, `${row.canonical_url} lost entity_id`);
    truthy(row.feature_cluster, `${row.canonical_url} lost feature_cluster`);
    truthy(row.evidence_lane, `${row.canonical_url} lost evidence_lane`);
    truthy(row.variant_family, `${row.canonical_url} lost variant_family`);
  }
}

function duplicateHashesByRoot(rows) {
  const groups = new Map();
  for (const row of rows.filter((item) => !item.legal_doc_candidate && item.sha256)) {
    const key = `${row.common_root}|${row.sha256}`;
    groups.set(key, [...(groups.get(key) || []), row.canonical_url]);
  }
  return [...groups.entries()].filter(([, urls]) => urls.length > 1).map(([key, urls]) => ({ key, urls }));
}

function assertOnePhysicalRootBelowThreshold(artifacts, root, threshold) {
  const keys = Object.keys(artifacts).filter((name) => name === `lossless_root__${root}` || name.startsWith(`lossless_root__${root}__part_`));
  const bytes = keys.reduce((sum, key) => sum + Buffer.byteLength(JSON.stringify(artifacts[key]), "utf8"), 0);
  truthy(bytes < threshold, `${root} fixture exceeds ${threshold} bytes`);
  deepEqual(keys, [`lossless_root__${root}`], `${root} sharded below ${threshold} bytes`);
}

function serveFixture(request, response, map) {
  const pathname = new URL(request.url, "http://fixture.local").pathname;
  if (pathname.endsWith(".md")) return respond(response, 404, "text/plain", "not found");
  const page = map.get(pathname);
  if (!page) return respond(response, 404, "text/plain", "not found");
  const title = page.feature_cluster || page.id;
  const html = `<!doctype html><html><head><title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(title)} fixture"></head><body><main><h1>${escapeHtml(title)}</h1><p>${escapeHtml(page.body)}</p></main></body></html>`;
  respond(response, 200, "text/html; charset=utf-8", html);
}

function respond(response, status, contentType, body) {
  response.writeHead(status, { "content-type": contentType });
  response.end(body);
}

function readFixture(name) {
  return JSON.parse(fs.readFileSync(path.join(FIXTURE_ROOT, name), "utf8"));
}

function check(id, assertion) {
  try { assertion(); } catch (error) { failures.push({ id, message: error?.message || String(error) }); }
}
function truthy(value, message) { if (!value) throw new Error(message); }
function equal(actual, expected, message) { if (actual !== expected) throw new Error(`${message}; expected=${JSON.stringify(expected)} actual=${JSON.stringify(actual)}`); }
function deepEqual(actual, expected, message) { if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`${message}; expected=${JSON.stringify(expected)} actual=${JSON.stringify(actual)}`); }
function escapeHtml(value) { return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;"); }
function listen(server) { return new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", () => resolve(server.address().port)); }); }
function close(server) { return new Promise((resolve) => server.close(() => resolve())); }
