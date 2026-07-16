import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRb18ControlledFetch } from "./lib/rb18-controlled-fetch.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(HERE, "../phase1-shadow-output");
const BUDGET = positiveInt(process.env.LN_PHASE1_SHADOW_MAX_NETWORK_REQUESTS, 120);
const TIMEOUT_MS = positiveInt(process.env.LN_PHASE1_SHADOW_NETWORK_TIMEOUT_MS, 6000);
const originalFetch = globalThis.fetch?.bind(globalThis);
if (!originalFetch) throw new Error("PHASE1_RB18_SHADOW_FETCH_UNAVAILABLE");

const [{ buildUniversalSourceUrlManifestArtifact }, { buildPhase1Rb15ExtractionArtifactSet }, { buildSourceFamilyHandoffArtifact }, { semanticJsonArtifactHash }] = await Promise.all([
  import("../src/phases/01-source-discovery/services/universal-url-manifest.service.js"),
  import("../src/phases/01-source-discovery/services/phase1-rb15-extraction-orchestrator.service.js"),
  import("../src/phases/01-source-discovery/services/source-family-handoff.service.js"),
  import("../src/runtime/services/storage/drive.service.js")
]);

const targets = [
  target("sarvam_ai", "LN-RB18-SHADOW-SARVAM-AI", "https://www.sarvam.ai/", ["sarvam.ai"], ["ai-native"], []),
  target("paytm_fintech_ai", "LN-RB18-SHADOW-PAYTM-FINTECH-AI", "https://paytm.com/", ["paytm.com", "paytmpayments.com"], ["fintech", "ai-native"], [{
    host: "paytmpayments.com",
    url: "https://www.paytmpayments.com/",
    status: "SEPARATE_ENTITY_INCLUDED",
    entity_id: "ppsl",
    entity_name: "Paytm Payments Services Limited",
    evidence: ["RB18_OPERATOR_VERIFIED_ENTITY_BOUNDARY_INPUT"],
    confidence: "HIGH"
  }])
];

await fs.rm(OUTPUT_DIR, { recursive: true, force: true });
await fs.mkdir(OUTPUT_DIR, { recursive: true });
const summary = {
  schema_version: "PHASE1_RB18_SHADOW_RUNS_v3_MATERIAL_CONTENT_GATE",
  mode: "READ_ONLY_NO_PERSISTENCE",
  material_content_rule: "ONLY_MATERIAL_PAGES_MAY_RECEIVE_EXTRACTION_AUTHORITY",
  production_matter_created: false,
  production_matter_advanced: false,
  persistence_invoked: false,
  started_at: new Date().toISOString(),
  targets: []
};

for (const spec of targets) {
  console.log(`[RB-18] start ${spec.id}`);
  const network = createRb18ControlledFetch({
    originalFetch,
    allowedHosts: spec.allowed_hosts,
    timeoutMs: TIMEOUT_MS,
    budgets: {
      discovery: BUDGET,
      broad_discovery: Math.max(10, Math.floor(BUDGET / 6)),
      fingerprint: BUDGET,
      extraction: BUDGET,
      other: Math.max(10, Math.floor(BUDGET / 6))
    }
  });
  globalThis.fetch = network.fetch;
  let report;
  const started = Date.now();
  try {
    report = await executeTarget(spec, network);
  } catch (error) {
    report = failureReport(spec, network, started, error, "pipeline_error");
  } finally {
    globalThis.fetch = originalFetch;
  }
  await fs.writeFile(path.join(OUTPUT_DIR, `${spec.id}.shadow.json`), `${JSON.stringify(report, null, 2)}\n`);
  summary.targets.push({ target_id: spec.id, status: report.status, elapsed_ms: report.elapsed_ms, report_file: `${spec.id}.shadow.json`, limitations: report.limitations || [], validation_error: report.validation_error || null, pipeline_error: report.pipeline_error || null, material_pages_authorized: report.material_content_authority?.material_pages_authorized || 0, non_material_pages_rejected: report.material_content_authority?.non_material_pages_rejected || 0 });
  console.log(`[RB-18] finish ${spec.id}: ${report.status}`);
}

summary.completed_at = new Date().toISOString();
summary.status = summary.targets.every((item) => item.status === "PASS") ? "PASS" : "FAIL";
await fs.writeFile(path.join(OUTPUT_DIR, "rb18-shadow-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
if (summary.status !== "PASS") process.exit(1);

async function executeTarget(spec, network) {
  const started = Date.now();
  const run = { run_id: spec.run_id, target: spec.url, root_url: spec.url, source_mode: "url", phase1_entity_surfaces: spec.entity_surfaces };
  const discovery = await buildUniversalSourceUrlManifestArtifact({ run, preflightContext: spec.preflight });
  const extraction = await buildPhase1Rb15ExtractionArtifactSet({ run, deduped_url_manifest: discovery.deduped_url_manifest });
  const handoff = buildSourceFamilyHandoffArtifact({ run, artifacts: { ...discovery, ...extraction } });
  const report = buildReport(spec, discovery, extraction, handoff, network, Date.now() - started);
  try {
    validateReport(spec, discovery, extraction, handoff, report);
    return { ...report, status: "PASS" };
  } catch (error) {
    return { ...report, status: "FAIL", validation_error: error?.stack || error?.message || String(error) };
  }
}

function buildReport(spec, discovery, extraction, handoff, network, elapsedMs) {
  const manifest = discovery.deduped_url_manifest;
  const matrix = discovery.source_discovery_matrix_manifest;
  const sourceIndex = extraction.source_family_index;
  const fingerprints = matrix.source_fingerprint_inventory || {};
  const legalDocs = extraction.legal_doc_inventory?.documents_found || [];
  const roots = Object.values(sourceIndex.root_artifact_manifest || {}).map((entry) => ({
    common_root: entry.common_root,
    status: entry.status,
    source_count: entry.source_count || 0,
    physical_artifacts: entry.required_artifacts || [],
    shard_count: entry.shard_count || 0,
    sharding_policy: entry.sharding_policy || null,
    source_count_sharding_forbidden: entry.source_count_sharding_forbidden === true
  }));
  const persistenceNames = unique(["source_family_index", "legal_doc_inventory", "legal_doc_extraction_index", "legal_doc_lossless_validation_manifest", ...(sourceIndex.saved_root_artifacts || []), ...(extraction.legal_doc_extraction_index?.dynamic_artifact_names || [])]).filter((name) => extraction[name]);
  const networkSnapshot = network.snapshot();
  const limitations = unique([
    ...(manifest.scout_failures || []).length ? [`SCOUT_FAILURES:${manifest.scout_failures.length}`] : [],
    fingerprints.counts?.failed ? [`FINGERPRINT_FAILURES:${fingerprints.counts.failed}`] : [],
    fingerprints.counts?.fetched_no_material_content ? [`NO_MATERIAL_CONTENT_PAGES:${fingerprints.counts.fetched_no_material_content}`] : [],
    ...Object.entries(networkSnapshot.lanes).filter(([, lane]) => lane.budget_exhausted).map(([lane]) => `NETWORK_BUDGET_EXHAUSTED:${lane}`)
  ]);
  const extractRows = manifest.manifest_sources.filter((row) => row.extraction_decision === "EXTRACT" && row.admission_tier === "PRIMARY");
  const noMaterialFingerprints = (fingerprints.fingerprints || []).filter((item) => item.fetch_status === "FETCHED_NO_MATERIAL_CONTENT" || item.extraction_eligible === false && item.content_materiality?.status === "NO_MATERIAL_CONTENT");
  const noMaterialCandidateIds = new Set(noMaterialFingerprints.map((item) => item.candidate_id));
  const noMaterialRows = manifest.manifest_sources.filter((row) => noMaterialCandidateIds.has(row.canonical_candidate_id));

  return {
    schema_version: "PHASE1_RB18_TARGET_SHADOW_REPORT_v3_MATERIAL_CONTENT_GATE",
    target_id: spec.id,
    target_url: spec.url,
    mode: "READ_ONLY_NO_PERSISTENCE",
    production_mutations_attempted: false,
    persistence_invoked: false,
    elapsed_ms: elapsedMs,
    limitations,
    network: networkSnapshot,
    before_selection: {
      legacy_manifest_rows: manifest.manifest_forensics?.legacy_rows_read || 0,
      raw_candidates: matrix.raw_discovery_inventory?.counts?.candidate_urls || 0,
      canonical_candidates: matrix.canonical_url_inventory?.canonical_candidates?.length || 0,
      fingerprints: fingerprints.counts || {}
    },
    after_selection: {
      final_manifest_rows: manifest.manifest_forensics?.final_rows || 0,
      extraction_rows: manifest.manifest_forensics?.extract_rows || 0,
      dispositions: countBy(manifest.manifest_sources, (row) => row.source_disposition || "UNASSIGNED"),
      retained_sources: sourceIndex.discovered_source_index?.length || 0,
      manifest_only_sources: sourceIndex.manifest_only_index?.length || 0,
      duplicate_blocks_removed: sourceIndex.block_dedupe_forensics?.totals?.duplicate_blocks_removed || 0,
      exact_duplicate_sources_suppressed: sourceIndex.block_dedupe_forensics?.totals?.exact_duplicate_sources_suppressed || 0
    },
    material_content_authority: {
      rule: "HTTP_SUCCESS_ALONE_NEVER_AUTHORIZES_EXTRACTION",
      material_pages_fingerprinted: fingerprints.counts?.material_content || 0,
      material_pages_authorized: extractRows.length,
      non_material_pages_fingerprinted: noMaterialFingerprints.length,
      non_material_pages_rejected: noMaterialRows.filter((row) => row.extraction_decision !== "EXTRACT").length,
      non_material_extraction_leaks: noMaterialRows.filter((row) => row.extraction_decision === "EXTRACT").map((row) => ({ manifest_id: row.manifest_id, canonical_url: row.canonical_url })),
      authorized_rows: extractRows.map((row) => ({ manifest_id: row.manifest_id, canonical_url: row.canonical_url, extraction_scope: row.extraction_scope, fingerprint_fetch_status: row.fingerprint_fetch_status, fingerprint_extraction_eligible: row.fingerprint_extraction_eligible, content_status: row.content_materiality?.status || null })),
      rejected_rows: noMaterialRows.map((row) => ({ manifest_id: row.manifest_id, canonical_url: row.canonical_url, source_disposition: row.source_disposition, extraction_decision: row.extraction_decision, limitation: row.tier_reason }))
    },
    entity_boundary: {
      primary_entity_id: matrix.target_boundary_manifest?.primary_entity_id || null,
      status: matrix.entity_surface_map?.status || null,
      counts: matrix.entity_surface_map?.counts || {},
      surfaces: (matrix.entity_surface_map?.surfaces || []).map((item) => ({ host: item.host, status: item.status, entity_id: item.entity_id, targeted_crawl_allowed: item.targeted_crawl_allowed, legal_capacity_merge_forbidden: item.legal_capacity_merge_forbidden }))
    },
    root_assembly: {
      populated_roots: roots.filter((root) => root.source_count > 0).length,
      physical_artifacts: sourceIndex.saved_root_artifacts || [],
      sharded_roots: roots.filter((root) => root.status === "SHARDED").length,
      roots
    },
    legal_artifacts: {
      documents: legalDocs.map((doc) => ({ artifact_name: doc.artifact_name, doc_type: doc.doc_type, entity_id: doc.entity_id, source_urls: doc.source_urls, extraction_scope: doc.extraction_scope, sha256: doc.sha256 })),
      validation: extraction.legal_doc_lossless_validation_manifest
    },
    relationship_metadata: {
      ai_overlay_rows: manifest.manifest_sources.filter((row) => row.ai_overlay).map((row) => ({ canonical_url: row.canonical_url, feature_cluster: row.feature_cluster, ai_overlay: row.ai_overlay })),
      secondary_root_rows: manifest.manifest_sources.filter((row) => (row.secondary_root_references || []).length).map((row) => ({ canonical_url: row.canonical_url, primary_root: row.common_root, secondary_root_references: row.secondary_root_references }))
    },
    compatibility: {
      handoff_status: handoff.source_discovery_handoff?.status || null,
      domain_gate_allowed: handoff.post_phase_1_domain_gate_handoff?.classification_allowed === true,
      frozen_contract_id: sourceIndex.compatibility_projection?.frozen_contract_id || null,
      downstream_consumer_edit_required: sourceIndex.compatibility_projection?.downstream_consumer_edit_required
    },
    persistence_plan: {
      mode: "DRY_RUN",
      artifacts: persistenceNames.map((name) => ({ artifact_name: name, logical_version: 1, semantic_hash: semanticJsonArtifactHash({ run_id: spec.run_id, artifact_name: name, artifact: extraction[name] }), write_action: "NOT_EXECUTED" }))
    }
  };
}

function validateReport(spec, discovery, extraction, handoff, report) {
  const manifest = discovery.deduped_url_manifest;
  const matrix = discovery.source_discovery_matrix_manifest;
  const legal = extraction.legal_doc_lossless_validation_manifest;
  const fingerprints = matrix.source_fingerprint_inventory?.fingerprints || [];
  const fingerprintsById = new Map(fingerprints.map((item) => [item.candidate_id, item]));
  assert.equal(report.production_mutations_attempted, false);
  assert.equal(report.persistence_invoked, false);
  assert.equal(manifest.final_extraction_authority, true);
  assert.equal(manifest.material_content_required_for_extraction, true);
  assert.ok(report.before_selection.raw_candidates > 0, "no live discovery candidates");
  assert.ok(report.before_selection.fingerprints.fetched > 0, "no live material fingerprint");
  assert.ok(report.after_selection.final_manifest_rows > 0, "empty final manifest");
  assert.ok(report.after_selection.extraction_rows > 0, "no selected extraction rows");
  assert.ok(report.after_selection.retained_sources > 0, "no retained source rows");
  assert.ok(report.root_assembly.populated_roots > 0, "no populated logical roots");
  assert.equal(report.material_content_authority.non_material_extraction_leaks.length, 0, "non-material page received extraction authority");
  assert.ok(report.material_content_authority.material_pages_authorized > 0, "no material page authorized");
  assert.ok(String(report.compatibility.handoff_status).startsWith("LOCKED"));
  assert.equal(report.compatibility.domain_gate_allowed, true);
  assert.equal(report.compatibility.downstream_consumer_edit_required, false);
  assert.equal(legal?.status, "PASS");
  assert.equal(legal?.cross_entity_merge_detected, false);
  assert.equal(legal?.near_duplicate_merge_detected, false);
  assert.equal(legal?.every_artifact_has_entity_provenance, true);
  assert.equal(legal?.every_artifact_is_full_document, true);
  assert.equal(new Set(manifest.manifest_sources.map((row) => row.canonical_identity)).size, manifest.manifest_sources.length);
  for (const row of manifest.manifest_sources) {
    if (/translation/i.test(`${row.canonical_url} ${row.route_type} ${row.feature_cluster}`)) assert.notEqual(row.legal_doc_type, "service_level_agreement");
    if (row.legal_doc_candidate) assert.equal(row.extraction_scope, "FULL_DOCUMENT");
    if (row.extraction_decision === "EXTRACT") {
      const fingerprint = fingerprintsById.get(row.canonical_candidate_id);
      assert.ok(fingerprint, `extract row missing fingerprint: ${row.manifest_id}`);
      assert.equal(fingerprint.fetch_status, "FETCHED");
      assert.equal(fingerprint.extraction_eligible, true);
      assert.equal(fingerprint.content_materiality?.status, "MATERIAL_CONTENT");
      assert.equal(row.fingerprint_fetch_status, "FETCHED");
      assert.equal(row.fingerprint_extraction_eligible, true);
      assert.equal(row.content_materiality?.status, "MATERIAL_CONTENT");
      assert.ok(row.exact_content_hash);
      if (row.extraction_scope !== "STRUCTURED_COVERAGE_ONLY") assert.ok(row.selected_block_hashes?.length > 0);
    }
    if (row.fingerprint_fetch_status === "FETCHED_NO_MATERIAL_CONTENT" || row.content_materiality?.status === "NO_MATERIAL_CONTENT") {
      assert.notEqual(row.extraction_decision, "EXTRACT");
      assert.equal(row.extraction_authorized_by_canonical_selection, false);
      assert.equal(row.legal_doc_candidate, false);
    }
  }
  for (const root of report.root_assembly.roots.filter((item) => item.source_count > 0)) {
    assert.equal(root.source_count_sharding_forbidden, true);
    assert.equal(root.sharding_policy, "FINAL_PAYLOAD_BYTES_ONLY_AFTER_DEDUPE");
  }
  assert.ok(report.persistence_plan.artifacts.length > 0);
  assert.ok(report.persistence_plan.artifacts.every((item) => /^[a-f0-9]{64}$/.test(item.semantic_hash)));
  assert.ok(handoff.source_discovery_handoff?.common_root_index);
  if (spec.id === "paytm_fintech_ai") {
    const ppsl = matrix.entity_surface_map?.surfaces?.find((item) => item.entity_id === "ppsl");
    assert.ok(ppsl, "PPSL surface missing");
    assert.equal(ppsl.status, "SEPARATE_ENTITY_INCLUDED");
    assert.equal(ppsl.legal_capacity_merge_forbidden, true);
  }
}

function failureReport(spec, network, started, error, key) {
  return { schema_version: "PHASE1_RB18_TARGET_SHADOW_REPORT_v3_MATERIAL_CONTENT_GATE", target_id: spec.id, target_url: spec.url, status: "FAIL", [key]: error?.stack || error?.message || String(error), network: network.snapshot(), elapsed_ms: Date.now() - started, production_mutations_attempted: false, persistence_invoked: false };
}
function target(id, runId, url, allowedHosts, packages, entitySurfaces) {
  return { id, run_id: runId, url, allowed_hosts: allowedHosts, entity_surfaces: entitySurfaces, preflight: { domain_selection_profile: { provisional_primary_domain_candidates: packages.map((package_id) => ({ package_id })), provisional_capability_overlay_candidates: packages.includes("ai-native") ? [{ package_id: "ai-native" }] : [], provisional_regulatory_overlay_candidates: [{ package_id: "privacy" }] } } };
}
function positiveInt(value, fallback) { const parsed = Number.parseInt(String(value || ""), 10); return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback; }
function unique(values) { return [...new Set((values || []).filter(Boolean))]; }
function countBy(items, keyFn) { const out = {}; for (const item of items || []) { const key = keyFn(item); out[key] = (out[key] || 0) + 1; } return out; }
