import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSourceExtractionArtifactSet } from "../src/phases/01-source-discovery/services/source-extraction.service.js";
import { legalDocTypeFromUrlOrRoute } from "../src/phases/01-source-discovery/services/source-discovery-taxonomy.service.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const FIXTURE_ROOT = path.join(ROOT, "test/fixtures/phase1-universal-baselines");
const expectRed = process.argv.includes("--expect-red");
const sarvam = readFixture("sarvam-ai.fixture.json");
const paytm = readFixture("paytm-fintech-ai-overlay.fixture.json");
const pages = [...sarvam.pages, ...paytm.pages];
const pageMap = new Map(pages.map((page) => [page.path, page]));
const server = http.createServer((request, response) => serveFixture(request, response, pageMap));
const failures = [];

try {
  const port = await listen(server);
  const origin = `http://127.0.0.1:${port}`;

  const sarvamArtifacts = await buildSourceExtractionArtifactSet({
    run: { run_id: "RB01-SARVAM", target: `${origin}/`, root_url: `${origin}/` },
    deduped_url_manifest: buildManifest(sarvam, origin)
  });
  const paytmArtifacts = await buildSourceExtractionArtifactSet({
    run: { run_id: "RB01-PAYTM", target: `${origin}/`, root_url: `${origin}/` },
    deduped_url_manifest: buildManifest(paytm, origin)
  });

  check("LEGAL_TOKEN_BOUNDARY_TRANSLATION_NOT_SLA", () => {
    const result = legalDocTypeFromUrlOrRoute("technical_child_page https://sarvam.ai/apis/translation/tamil-to-marathi");
    equal(result.docType, "other", `translation was classified as ${result.docType}`);
  });

  check("SARVAM_EXACT_CONTENT_DEDUPE", () => {
    const duplicates = duplicateHashesByRoot(sarvamArtifacts.source_family_index.discovered_source_index);
    equal(duplicates.length, 0, `duplicate extracted hashes remain: ${JSON.stringify(duplicates)}`);
  });

  check("SARVAM_FEATURE_METADATA_PROPAGATION", () => {
    const rows = sarvamArtifacts.source_family_index.discovered_source_index.filter((row) => !row.legal_doc_candidate);
    truthy(rows.length > 0, "no Sarvam source rows were extracted");
    for (const row of rows) {
      truthy(row.entity_id, `${row.canonical_url} lost entity_id`);
      truthy(row.feature_cluster, `${row.canonical_url} lost feature_cluster`);
      truthy(row.evidence_lane, `${row.canonical_url} lost evidence_lane`);
      truthy(row.variant_family, `${row.canonical_url} lost variant_family`);
    }
  });

  check("SARVAM_ONE_LOGICAL_PRODUCT_ROOT_BELOW_800_KIB", () => {
    assertOnePhysicalRootBelowThreshold(sarvamArtifacts, "product_service", 819200);
  });

  check("SARVAM_VARIANT_SCOPE_CONTROL", () => {
    const rows = sarvamArtifacts.source_family_index.discovered_source_index.filter((row) => row.canonical_url?.includes("/apis/translation/") || row.canonical_url?.includes("/apis/text-to-speech/hindi"));
    truthy(rows.length >= 3, "Sarvam variant rows missing from fixture execution");
    for (const row of rows) {
      truthy(["SELECTED_UNIQUE_SECTIONS", "STRUCTURED_COVERAGE_ONLY", "METADATA_ONLY"].includes(row.extraction_scope), `${row.canonical_url} was fully extracted without a dedupe scope`);
    }
  });

  check("PAYTM_ONE_LOGICAL_PRODUCT_ROOT_BELOW_800_KIB", () => {
    assertOnePhysicalRootBelowThreshold(paytmArtifacts, "product_service", 819200);
  });

  check("PAYTM_TEMPLATE_VARIANTS_NOT_FULL_EXTRACTED", () => {
    const rows = paytmArtifacts.source_family_index.discovered_source_index.filter((row) => /\/electricity-bill-payment\/.+/.test(new URL(row.canonical_url).pathname));
    equal(rows.length, 6, "Paytm electricity variant fixture did not execute as expected");
    for (const row of rows) {
      truthy(["STRUCTURED_COVERAGE_ONLY", "SELECTED_UNIQUE_SECTIONS", "METADATA_ONLY"].includes(row.extraction_scope), `${row.canonical_url} remained a full extracted source`);
    }
  });

  check("PAYTM_ENTITY_ID_PROPAGATION", () => {
    const rows = paytmArtifacts.source_family_index.discovered_source_index;
    const paymentGateway = rows.find((row) => row.canonical_url?.endsWith("/payment-gateway"));
    truthy(paymentGateway, "payment-gateway source missing");
    equal(paymentGateway.entity_id, "ppsl", "PPSL source lost or changed entity ownership");
  });

  check("PAYTM_LEGAL_ENTITY_SEPARATION", () => {
    const docs = paytmArtifacts.legal_doc_inventory.documents_found;
    const privacyDocs = docs.filter((doc) => doc.doc_type === "privacy_policy");
    equal(privacyDocs.length, 2, `expected two distinct privacy instruments, found ${privacyDocs.length}`);
    const entities = new Set(privacyDocs.map((doc) => doc.entity_id));
    truthy(entities.has("one97") && entities.has("ppsl"), `privacy documents lost entity separation: ${JSON.stringify([...entities])}`);
  });

  check("PAYTM_SECONDARY_ROOT_REFERENCES_NOT_DUPLICATE_TEXT", () => {
    const rows = paytmArtifacts.source_family_index.discovered_source_index;
    const aiRouter = rows.find((row) => row.canonical_url?.endsWith("/airouter"));
    truthy(aiRouter, "AI Router source missing");
    deepEqual(aiRouter.secondary_root_references, ["ai_safety_transparency"], "AI Router secondary-root reference was not preserved");
    equal(countHashAcrossPhysicalRoots(paytmArtifacts, aiRouter.sha256), 1, "AI Router full text was physically duplicated across roots");
  });

  check("PAYTM_AI_OVERLAY_RELATIONSHIP_PROPAGATION", () => {
    const rows = paytmArtifacts.source_family_index.discovered_source_index.filter((row) => row.canonical_url?.endsWith("/airouter") || row.canonical_url?.endsWith("/docs/ai-router-overview") || row.canonical_url?.endsWith("/paytm-pi"));
    equal(rows.length, 3, "AI overlay fixture sources missing");
    for (const row of rows) truthy(row.ai_overlay, `${row.canonical_url} lost AI-overlay relationship`);
  });

  check("LEGAL_ARTIFACT_ENTITY_PROVENANCE", () => {
    const legalArtifacts = Object.entries(paytmArtifacts).filter(([name]) => name.startsWith("legal_doc_") && !["legal_doc_inventory", "legal_doc_extraction_index", "legal_doc_lossless_validation_manifest"].includes(name));
    truthy(legalArtifacts.length >= 4, "expected Paytm legal artifacts were not produced");
    for (const [name, artifact] of legalArtifacts) truthy(artifact.entity_id, `${name} lost entity provenance`);
  });
} finally {
  await close(server);
}

const requiredCurrentFailureIds = [
  "LEGAL_TOKEN_BOUNDARY_TRANSLATION_NOT_SLA",
  "SARVAM_EXACT_CONTENT_DEDUPE",
  "SARVAM_FEATURE_METADATA_PROPAGATION",
  "SARVAM_ONE_LOGICAL_PRODUCT_ROOT_BELOW_800_KIB",
  "PAYTM_ONE_LOGICAL_PRODUCT_ROOT_BELOW_800_KIB",
  "PAYTM_ENTITY_ID_PROPAGATION",
  "PAYTM_LEGAL_ENTITY_SEPARATION"
];

if (expectRed) {
  const failureIds = new Set(failures.map((failure) => failure.id));
  const missingExpectedFailures = requiredCurrentFailureIds.filter((id) => !failureIds.has(id));
  if (missingExpectedFailures.length) {
    console.error(JSON.stringify({
      check: "phase1 universal baseline expected-red characterization",
      status: "INVALID_RED_BASELINE",
      missing_expected_failure_ids: missingExpectedFailures,
      observed_failures: failures
    }, null, 2));
    process.exitCode = 1;
  } else {
    console.log(JSON.stringify({
      check: "phase1 universal baseline expected-red characterization",
      status: "EXPECTED_RED_CONFIRMED",
      fixtures: [sarvam.fixture_id, paytm.fixture_id],
      observed_failure_count: failures.length,
      observed_failures: failures
    }, null, 2));
  }
} else if (failures.length) {
  console.error(JSON.stringify({
    check: "phase1 universal baseline",
    status: "FAIL",
    fixtures: [sarvam.fixture_id, paytm.fixture_id],
    failures
  }, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({
    check: "phase1 universal baseline",
    status: "PASS",
    fixtures: [sarvam.fixture_id, paytm.fixture_id]
  }, null, 2));
}

function readFixture(name) {
  return JSON.parse(fs.readFileSync(path.join(FIXTURE_ROOT, name), "utf8"));
}

function buildManifest(fixture, origin) {
  const manifestSources = fixture.pages.map((page, index) => ({
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
    extraction_scope: page.variant_family?.includes("language_pair") || page.variant_family?.includes("state_provider") ? "STRUCTURED_COVERAGE_ONLY" : page.unique_material?.length ? "SELECTED_UNIQUE_SECTIONS" : "FULL_MAIN_CONTENT",
    extraction_decision: "EXTRACT",
    downstream_default: true,
    tier_reason: "RB01 baseline fixture",
    legal_doc_candidate: Boolean(page.legal_doc_candidate),
    legal_doc_type: page.legal_doc_type || "other",
    legal_doc_artifact_hint: page.legal_doc_type ? `legal_doc_${page.legal_doc_type}` : "legal_doc_other",
    phase_1_classification_effect: "SOURCE_ROUTING_ONLY_NOT_JOB_ROUTING"
  }));
  return {
    run_id: `RB01-${fixture.fixture_id}`,
    target_url: `${origin}/`,
    manifest_sources
  };
}

function serveFixture(request, response, map) {
  const requestUrl = new URL(request.url, "http://fixture.local");
  if (requestUrl.pathname.endsWith(".md")) {
    response.writeHead(404, { "content-type": "text/plain" });
    response.end("not found");
    return;
  }
  const page = map.get(requestUrl.pathname);
  if (!page) {
    response.writeHead(404, { "content-type": "text/plain" });
    response.end("not found");
    return;
  }
  const title = page.feature_cluster || page.id;
  const html = `<!doctype html><html><head><title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(title)} fixture"></head><body><main><h1>${escapeHtml(title)}</h1><p>${escapeHtml(page.body)}</p></main></body></html>`;
  response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  response.end(html);
}

function duplicateHashesByRoot(rows) {
  const groups = new Map();
  for (const row of rows.filter((item) => !item.legal_doc_candidate && item.sha256)) {
    const key = `${row.common_root}|${row.sha256}`;
    const urls = groups.get(key) || [];
    urls.push(row.canonical_url);
    groups.set(key, urls);
  }
  return [...groups.entries()].filter(([, urls]) => urls.length > 1).map(([key, urls]) => ({ key, urls }));
}

function assertOnePhysicalRootBelowThreshold(artifacts, root, threshold) {
  const keys = Object.keys(artifacts).filter((name) => name === `lossless_root__${root}` || name.startsWith(`lossless_root__${root}__part_`));
  const totalBytes = keys.reduce((sum, key) => sum + Buffer.byteLength(JSON.stringify(artifacts[key]), "utf8"), 0);
  truthy(totalBytes < threshold, `${root} fixture unexpectedly exceeds ${threshold} bytes`);
  deepEqual(keys, [`lossless_root__${root}`], `${root} was physically sharded below ${threshold} bytes: ${JSON.stringify(keys)}`);
}

function countHashAcrossPhysicalRoots(artifacts, hash) {
  let count = 0;
  for (const [name, artifact] of Object.entries(artifacts)) {
    if (!name.startsWith("lossless_root__")) continue;
    count += (artifact.sources || []).filter((source) => source.sha256 === hash).length;
  }
  return count;
}

function check(id, assertion) {
  try {
    assertion();
  } catch (error) {
    failures.push({ id, message: error?.message || String(error) });
  }
}

function truthy(value, message) {
  if (!value) throw new Error(message);
}

function equal(actual, expected, message) {
  if (actual !== expected) throw new Error(`${message}; expected=${JSON.stringify(expected)} actual=${JSON.stringify(actual)}`);
}

function deepEqual(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`${message}; expected=${JSON.stringify(expected)} actual=${JSON.stringify(actual)}`);
}

function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function listen(instance) {
  return new Promise((resolve, reject) => {
    instance.once("error", reject);
    instance.listen(0, "127.0.0.1", () => resolve(instance.address().port));
  });
}

function close(instance) {
  return new Promise((resolve) => instance.close(() => resolve()));
}
