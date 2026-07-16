import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const OUTPUT_DIR = path.join(ROOT, "phase1-shadow-output");
const MAX_NETWORK_REQUESTS = positiveInt(process.env.LN_PHASE1_SHADOW_MAX_NETWORK_REQUESTS, 260);
const NETWORK_TIMEOUT_MS = positiveInt(process.env.LN_PHASE1_SHADOW_NETWORK_TIMEOUT_MS, 10000);
const originalFetch = globalThis.fetch?.bind(globalThis);

if (typeof originalFetch !== "function") throw new Error("PHASE1_RB18_SHADOW_FETCH_UNAVAILABLE");

const [
  { buildUniversalSourceUrlManifestArtifact },
  { buildPhase1Rb15ExtractionArtifactSet },
  { buildSourceFamilyHandoffArtifact },
  { semanticJsonArtifactHash }
] = await Promise.all([
  import("../src/phases/01-source-discovery/services/universal-url-manifest.service.js"),
  import("../src/phases/01-source-discovery/services/phase1-rb15-extraction-orchestrator.service.js"),
  import("../src/phases/01-source-discovery/services/source-family-handoff.service.js"),
  import("../src/runtime/services/storage/drive.service.js")
]);

const targets = [
  {
    id: "sarvam_ai",
    run_id: "LN-RB18-SHADOW-SARVAM-AI",
    target: "https://www.sarvam.ai/",
    allowed_hosts: ["sarvam.ai"],
    preflight_context: {
      domain_selection_profile: {
        provisional_primary_domain_candidates: [{ package_id: "ai-native" }],
        provisional_capability_overlay_candidates: [{ package_id: "ai-native" }],
        provisional_regulatory_overlay_candidates: [{ package_id: "privacy" }]
      }
    },
    phase1_entity_surfaces: []
  },
  {
    id: "paytm_fintech_ai",
    run_id: "LN-RB18-SHADOW-PAYTM-FINTECH-AI",
    target: "https://paytm.com/",
    allowed_hosts: ["paytm.com", "paytmpayments.com"],
    preflight_context: {
      domain_selection_profile: {
        provisional_primary_domain_candidates: [{ package_id: "fintech" }],
        provisional_capability_overlay_candidates: [{ package_id: "ai-native" }],
        provisional_regulatory_overlay_candidates: [{ package_id: "privacy" }]
      }
    },
    phase1_entity_surfaces: [
      {
        host: "paytmpayments.com",
        url: "https://www.paytmpayments.com/",
        status: "SEPARATE_ENTITY_INCLUDED",
        entity_id: "ppsl",
        entity_name: "Paytm Payments Services Limited",
        evidence: ["RB18_OPERATOR_VERIFIED_ENTITY_BOUNDARY_INPUT"],
        confidence: "HIGH"
      }
    ]
  }
];

await fs.rm(OUTPUT_DIR, { recursive: true, force: true });
await fs.mkdir(OUTPUT_DIR, { recursive: true });

const aggregate = {
  schema_version: "PHASE1_RB18_SHADOW_RUNS_v1",
  execution_mode: "SHADOW_READ_ONLY",
  production_matter_created: false,
  production_matter_advanced: false,
  persistence_invoked: false,
  targets: [],
  started_at: new Date().toISOString()
};

let failed = false;
for (const target of targets) {
  const controller = createControlledFetch({
    originalFetch,
    allowedHosts: target.allowed_hosts,
    maxRequests: MAX_NETWORK_REQUESTS,
    timeoutMs: NETWORK_TIMEOUT_MS
  });
  globalThis.fetch = controller.fetch;
  const startedAt = Date.now();
  let report;
  try {
    report = await runShadowTarget({ target, controller, semanticJsonArtifactHash, buildUniversalSourceUrlManifestArtifact, buildPhase1Rb15ExtractionArtifactSet, buildSourceFamilyHandoffArtifact });
  } catch (error) {
    failed = true;
    report = {
      schema_version: "PHASE1_RB18_TARGET_SHADOW_REPORT_v1",
      target_id: target.id,
      target_url: target.target,
      status: "FAIL",
      error: error?.stack || error?.message || String(error),
      network: controller.snapshot(),
      elapsed_ms: Date.now() - startedAt,
      production_mutations_attempted: false
    };
  } finally {
    globalThis.fetch = originalFetch;
  }
  aggregate.targets.push({ target_id: target.id, status: report.status, report_file: `${target.id}.shadow.json`, elapsed_ms: report.elapsed_ms, limitations: report.limitations || [] });
  await fs.writeFile(path.join(OUTPUT_DIR, `${target.id}.shadow.json`), `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

aggregate.completed_at = new Date().toISOString();
aggregate.status = failed || aggregate.targets.some((target) => target.status !== "PASS") ? "FAIL" : "PASS";
await fs.writeFile(path.join(OUTPUT_DIR, "rb18-shadow-summary.json"), `${JSON.stringify(aggregate, null, 2)}\n`, "utf8");

console.log(JSON.stringify(aggregate, null, 2));
if (aggregate.status !== "PASS") process.exit(1);

async function runShadowTarget({ target, controller, semanticJsonArtifactHash, buildUniversalSourceUrlManifestArtifact, buildPhase1Rb15ExtractionArtifactSet, buildSourceFamilyHandoffArtifact }) {
  const startedAt = Date.now();
  const run = {
    run_id: target.run_id,
    target: target.target,
    root_url: target.target,
    source_mode: "url",
    phase1_entity_surfaces: target.phase1_entity_surfaces
  };

  const discovery = await buildUniversalSourceUrlManifestArtifact({ run, preflightContext: target.preflight_context });
  const manifest = discovery.deduped_url_manifest;
  const matrix = discovery.source_discovery_matrix_manifest;
  const extraction = await buildPhase1Rb15ExtractionArtifactSet({ run, deduped_url_manifest: manifest });
  const handoff = buildSourceFamilyHandoffArtifact({ run, artifacts: { ...discovery, ...extraction } });
  const report = buildReport({ target, discovery, extraction, handoff, controller, semanticJsonArtifactHash, elapsedMs: Date.now() - startedAt });
  assertShadowReport(report, { target, manifest, matrix, extraction, handoff });
  return { ...report, status: "PASS" };
}

function buildReport({ target, discovery, extraction, handoff, controller, semanticJsonArtifactHash, elapsedMs }) {
  const manifest = discovery.deduped_url_manifest;
  const matrix = discovery.source_discovery_matrix_manifest;
  const selection = matrix.canonical_selection || {};
  const fingerprints = matrix.source_fingerprint_inventory || {};
  const surfaceMap = matrix.entity_surface_map || {};
  const sourceIndex = extraction.source_family_index;
  const rootManifest = sourceIndex.root_artifact_manifest || {};
  const legalValidation = extraction.legal_doc_lossless_validation_manifest || {};
  const legalDocuments = extraction.legal_doc_inventory?.documents_found || [];
  const dynamicRootArtifacts = sourceIndex.saved_root_artifacts || [];
  const dynamicLegalArtifacts = extraction.legal_doc_extraction_index?.dynamic_artifact_names || [];
  const persistenceArtifacts = unique([
    "source_family_index",
    "legal_doc_inventory",
    "legal_doc_extraction_index",
    "legal_doc_lossless_validation_manifest",
    ...dynamicRootArtifacts,
    ...dynamicLegalArtifacts
  ]).filter((name) => extraction[name]);
  const persistencePlan = persistenceArtifacts.map((artifactName) => ({
    artifact_name: artifactName,
    logical_version: 1,
    semantic_hash: semanticJsonArtifactHash({ run_id: target.run_id, artifact_name: artifactName, artifact: extraction[artifactName] }),
    write_action: "NOT_EXECUTED_SHADOW_ONLY"
  }));
  const dispositions = countBy(manifest.manifest_sources || [], (row) => row.source_disposition || "UNASSIGNED");
  const roots = Object.values(rootManifest).map((entry) => ({
    common_root: entry.common_root,
    status: entry.status,
    source_count: entry.source_count || 0,
    physical_artifacts: entry.required_artifacts || [],
    shard_count: entry.shard_count || 0,
    total_text_bytes: entry.total_text_bytes || 0,
    sharding_policy: entry.sharding_policy || null,
    source_count_sharding_forbidden: entry.source_count_sharding_forbidden === true
  }));
  const populatedRoots = roots.filter((root) => root.source_count > 0);
  const limitations = unique([
    ...(manifest.scout_failures || []).length ? [`SCOUT_FAILURES:${manifest.scout_failures.length}`] : [],
    fingerprints.counts?.failed ? [`FINGERPRINT_FETCH_FAILURES:${fingerprints.counts.failed}`] : [],
    controller.snapshot().budget_exhausted ? ["CONTROLLED_NETWORK_BUDGET_EXHAUSTED"] : [],
    matrix.raw_discovery_inventory?.root_refresh?.status === "FAILED" ? ["ROOT_REFRESH_FAILED"] : []
  ]);

  return {
    schema_version: "PHASE1_RB18_TARGET_SHADOW_REPORT_v1",
    target_id: target.id,
    target_url: target.target,
    execution_mode: "SHADOW_READ_ONLY",
    production_mutations_attempted: false,
    persistence_invoked: false,
    elapsed_ms: elapsedMs,
    limitations,
    network: controller.snapshot(),
    before_selection: {
      legacy_manifest_rows: manifest.manifest_forensics?.legacy_rows_read || 0,
      raw_discovery_candidates: matrix.raw_discovery_inventory?.counts?.candidate_urls || 0,
      raw_discovery_events: matrix.raw_discovery_inventory?.counts?.raw_candidate_events || 0,
      external_surface_candidates: matrix.raw_discovery_inventory?.counts?.external_surface_candidates || 0,
      canonical_candidates: matrix.canonical_url_inventory?.canonical_candidates?.length || 0,
      fingerprints: fingerprints.counts || {}
    },
    after_selection: {
      canonical_decisions: manifest.manifest_forensics?.canonical_decisions_read || 0,
      final_manifest_rows: manifest.manifest_forensics?.final_rows || 0,
      extraction_rows: manifest.manifest_forensics?.extract_rows || 0,
      dispositions,
      retained_source_rows: sourceIndex.discovered_source_index?.length || 0,
      suppressed_or_manifest_only_rows: sourceIndex.manifest_only_index?.length || 0,
      duplicate_blocks_removed: sourceIndex.block_dedupe_forensics?.totals?.duplicate_blocks_removed || 0,
      exact_duplicate_sources_suppressed: sourceIndex.block_dedupe_forensics?.totals?.exact_duplicate_sources_suppressed || 0
    },
    entity_boundary: {
      primary_entity_id: matrix.target_boundary_manifest?.primary_entity_id || null,
      status: surfaceMap.status || null,
      counts: surfaceMap.counts || {},
      surfaces: (surfaceMap.surfaces || []).map((surface) => ({ host: surface.host, status: surface.status, entity_id: surface.entity_id, targeted_crawl_allowed: surface.targeted_crawl_allowed, legal_capacity_merge_forbidden: surface.legal_capacity_merge_forbidden }))
    },
    root_assembly: {
      populated_root_count: populatedRoots.length,
      physical_root_artifact_count: dynamicRootArtifacts.length,
      sharded_root_count: populatedRoots.filter((root) => root.status === "SHARDED").length,
      roots
    },
    legal_artifacts: {
      count: legalDocuments.length,
      documents: legalDocuments.map((doc) => ({ artifact_name: doc.artifact_name, doc_type: doc.doc_type, entity_id: doc.entity_id, source_urls: doc.source_urls, extraction_scope: doc.extraction_scope, sha256: doc.sha256 })),
      validation: legalValidation
    },
    relationship_metadata: {
      ai_overlay_rows: (manifest.manifest_sources || []).filter((row) => row.ai_overlay).map((row) => ({ canonical_url: row.canonical_url, feature_cluster: row.feature_cluster, ai_overlay: row.ai_overlay })),
      secondary_root_reference_rows: (manifest.manifest_sources || []).filter((row) => (row.secondary_root_references || []).length).map((row) => ({ canonical_url: row.canonical_url, primary_root: row.common_root, secondary_root_references: row.secondary_root_references }))
    },
    compatibility: {
      source_discovery_handoff_status: handoff.source_discovery_handoff?.status || null,
      post_phase_1_domain_gate_classification_allowed: handoff.post_phase_1_domain_gate_handoff?.classification_allowed === true,
      frozen_contract_id: extraction.source_family_index?.compatibility_projection?.frozen_contract_id || null,
      downstream_consumer_edit_required: extraction.source_family_index?.compatibility_projection?.downstream_consumer_edit_required
    },
    persistence_plan: {
      mode: "DRY_RUN_NO_DRIVE_OR_FIRESTORE_CALLS",
      artifact_count: persistencePlan.length,
      artifacts: persistencePlan
    }
  };
}

function assertShadowReport(report, { target, manifest, matrix, extraction, handoff }) {
  assert.equal(report.production_mutations_attempted, false);
  assert.equal(report.persistence_invoked, false);
  assert.equal(manifest.final_extraction_authority, true, "final manifest is not extraction authority");
  assert.ok(report.before_selection.raw_discovery_candidates > 0, "no real discovery candidates were observed");
  assert.ok(report.before_selection.fingerprints.fetched > 0, "no real candidate fingerprint was fetched");
  assert.ok(report.after_selection.final_manifest_rows > 0, "final manifest is empty");
  assert.ok(report.after_selection.extraction_rows > 0, "final manifest selected no extraction rows");
  assert.ok(report.after_selection.retained_source_rows > 0, "selected extraction retained no source rows");
  assert.ok(report.root_assembly.populated_root_count > 0, "no logical root was populated");
  assert.ok(String(report.compatibility.source_discovery_handoff_status || "").startsWith("LOCKED"), "M6 handoff did not lock");
  assert.equal(report.compatibility.post_phase_1_domain_gate_classification_allowed, true);
  assert.equal(report.compatibility.downstream_consumer_edit_required, false);
  assert.equal(extraction.legal_doc_lossless_validation_manifest?.status, "PASS");
  assert.equal(extraction.legal_doc_lossless_validation_manifest?.cross_entity_merge_detected, false);
  assert.equal(extraction.legal_doc_lossless_validation_manifest?.near_duplicate_merge_detected, false);
  assert.equal(extraction.legal_doc_lossless_validation_manifest?.every_artifact_has_entity_provenance, true);
  assert.equal(extraction.legal_doc_lossless_validation_manifest?.every_artifact_is_full_document, true);

  const identities = (manifest.manifest_sources || []).map((row) => row.canonical_identity);
  assert.equal(identities.length, new Set(identities).size, "duplicate final canonical identity");
  for (const row of manifest.manifest_sources || []) {
    if (/translation/i.test(`${row.canonical_url} ${row.route_type} ${row.feature_cluster}`)) assert.notEqual(row.legal_doc_type, "service_level_agreement", `translation false-positive SLA: ${row.canonical_url}`);
    if (row.legal_doc_candidate) assert.equal(row.extraction_scope, "FULL_DOCUMENT", `legal instrument not full document: ${row.canonical_url}`);
  }
  for (const root of report.root_assembly.roots) {
    if (root.source_count > 0) {
      assert.equal(root.source_count_sharding_forbidden, true, `source-count sharding guard missing: ${root.common_root}`);
      assert.equal(root.sharding_policy, "FINAL_PAYLOAD_BYTES_ONLY_AFTER_DEDUPE", `wrong sharding policy: ${root.common_root}`);
    }
  }
  for (const doc of report.legal_artifacts.documents) {
    assert.ok(doc.entity_id, `legal artifact entity missing: ${doc.artifact_name}`);
    assert.equal(doc.extraction_scope, "FULL_DOCUMENT", `legal artifact scope invalid: ${doc.artifact_name}`);
  }
  assert.ok(report.persistence_plan.artifact_count > 0, "persistence dry-run plan is empty");
  assert.ok(report.persistence_plan.artifacts.every((item) => /^[a-f0-9]{64}$/.test(item.semantic_hash)), "persistence plan hash invalid");
  assert.ok(handoff.source_discovery_handoff?.common_root_index, "handoff root index missing");

  if (target.id === "paytm_fintech_ai") {
    const ppsl = matrix.entity_surface_map?.surfaces?.find((surface) => surface.entity_id === "ppsl");
    assert.ok(ppsl, "PPSL explicit entity surface missing");
    assert.equal(ppsl.status, "SEPARATE_ENTITY_INCLUDED");
    assert.equal(ppsl.legal_capacity_merge_forbidden, true);
  }
}

function createControlledFetch({ originalFetch, allowedHosts, maxRequests, timeoutMs }) {
  const allowed = new Set(allowedHosts.map(normaliseHost));
  const cache = new Map();
  const stats = { network_requests: 0, cache_hits: 0, blocked_hosts: 0, budget_rejections: 0, timeouts: 0, failures: 0, responses_by_status: {} };

  async function controlledFetch(input, init = {}) {
    const url = new URL(typeof input === "string" || input instanceof URL ? String(input) : input.url);
    if (!hostAllowed(url.hostname, allowed)) {
      stats.blocked_hosts += 1;
      return new Response("", { status: 403, statusText: "RB18_SHADOW_HOST_BLOCKED" });
    }
    const key = `${String(init.method || "GET").toUpperCase()} ${url.toString()}`;
    if (cache.has(key)) {
      stats.cache_hits += 1;
      return responseFromSnapshot(cache.get(key));
    }
    if (stats.network_requests >= maxRequests) {
      stats.budget_rejections += 1;
      return new Response("", { status: 429, statusText: "RB18_SHADOW_NETWORK_BUDGET_EXHAUSTED" });
    }

    stats.network_requests += 1;
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), timeoutMs);
    const externalSignal = init.signal;
    const onAbort = () => abort.abort();
    externalSignal?.addEventListener?.("abort", onAbort, { once: true });
    try {
      const response = await originalFetch(url, { ...init, signal: abort.signal, redirect: "follow" });
      const body = Buffer.from(await response.arrayBuffer());
      const snapshot = { status: response.status, statusText: response.statusText, headers: Object.fromEntries(response.headers.entries()), body: body.toString("base64") };
      cache.set(key, snapshot);
      stats.responses_by_status[response.status] = (stats.responses_by_status[response.status] || 0) + 1;
      return responseFromSnapshot(snapshot);
    } catch (error) {
      if (error?.name === "AbortError") stats.timeouts += 1;
      else stats.failures += 1;
      throw error;
    } finally {
      clearTimeout(timer);
      externalSignal?.removeEventListener?.("abort", onAbort);
    }
  }

  return {
    fetch: controlledFetch,
    snapshot: () => ({
      ...stats,
      cache_entries: cache.size,
      max_network_requests: maxRequests,
      timeout_ms: timeoutMs,
      budget_exhausted: stats.budget_rejections > 0,
      allowed_hosts: [...allowed]
    })
  };
}

function responseFromSnapshot(snapshot) {
  return new Response(Buffer.from(snapshot.body, "base64"), { status: snapshot.status, statusText: snapshot.statusText, headers: snapshot.headers });
}

function hostAllowed(hostname, allowed) {
  const host = normaliseHost(hostname);
  return [...allowed].some((base) => host === base || host.endsWith(`.${base}`));
}

function normaliseHost(value) { return String(value || "").replace(/^www\./i, "").toLowerCase(); }
function positiveInt(value, fallback) { const parsed = Number.parseInt(String(value || ""), 10); return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback; }
function unique(values) { return [...new Set((values || []).filter(Boolean))]; }
function countBy(items, keyFn) { const out = {}; for (const item of items || []) { const key = keyFn(item); out[key] = (out[key] || 0) + 1; } return out; }
function stableHash(value) { return crypto.createHash("sha256").update(String(value || "")).digest("hex"); }
