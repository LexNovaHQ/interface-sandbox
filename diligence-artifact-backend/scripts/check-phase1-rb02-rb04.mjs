import assert from "node:assert/strict";
import { augmentSourceUrlManifestOutput } from "../src/phases/01-source-discovery/services/universal-url-manifest.service.js";
import { assertInternalEvidenceModel } from "../src/phases/01-source-discovery/services/internal-evidence-model.service.js";
import { assertEntityBoundary } from "../src/phases/01-source-discovery/services/entity-boundary.service.js";
import { assertBroadDiscoveryInventory } from "../src/phases/01-source-discovery/services/broad-discovery.service.js";

const ROOTS = ["homepage_landing", "company_identity", "contact_notice", "product_service", "platform_feature_solution", "technical_docs_api", "docs_api_data_flow", "integrations_ecosystem", "pricing_commercial_availability", "use_case_customer_industry", "privacy_data_processing", "security_trust_compliance", "data_governance_controls", "ai_safety_transparency", "support_help_resources", "regulatory_licensing_status", "grievance_complaints"];
const sharedUrl = "https://business.paytm.com/airouter";
const rows = [
  row("product_service.URL.001", "product_service", sharedUrl, "ai_router", ["PRODUCT_ACTIVITY_SIGNAL", "AI_MECHANISM_SIGNAL"]),
  row("ai_safety_transparency.URL.001", "ai_safety_transparency", sharedUrl, "ai_router_overlay", ["AI_MECHANISM_SIGNAL", "AI_SAFETY_TRANSPARENCY_SIGNAL"]),
  row("homepage_landing.URL.001", "homepage_landing", "https://paytm.com/", "primary_homepage", ["TARGET_IDENTITY_SIGNAL"])
];
const legacyOutput = {
  deduped_url_manifest: { run_id: "RB02-RB04", target_url: "https://paytm.com/", target_boundary: {}, manifest_sources: rows, rejected_candidates: [], discovery_log: [], scout_failures: [] },
  source_discovery_matrix_manifest: { common_core_roots: ROOTS.map((id) => ({ id, traversal_policy: id === "homepage_landing" ? "PRIMARY_SINGLE_EXTRACT" : "PRIMARY_FULL_EXTRACT" })), forbidden_actions_confirmed: noNarrowing() },
  adapter_expansion_log: { union_probe_mode: "ALL_DOMAIN_HINT_PACKS_PLUS_PREFLIGHT_HINTS", dynamic_routing_used: false, domain_lock_used: false },
  neutral_evidence_bucket_manifest: { buckets: {}, forbidden_actions_confirmed: noNarrowing() }
};
const originalRows = JSON.stringify(rows);
const rootHtml = `<!doctype html><html><head><link rel="canonical" href="https://paytm.com/"></head><body><header><a href="/products">Products</a></header><main><a href="https://external.example/docs">Partner</a></main><footer><a href="https://business.paytm.com/payment-gateway">Business</a><a href="https://paytmpayments.com/policies">Payments entity</a></footer></body></html>`;
const fetchImpl = async (value) => {
  const url = new URL(value);
  const html = `<!doctype html><html><head><title>${url.hostname}</title></head><body><main><h1>${url.pathname}</h1><p>Deterministic material evidence for the Phase 1 offline validation fixture.</p></main></body></html>`;
  return new Response(html, { status: 200, headers: { "content-type": "text/html" } });
};

const output = await augmentSourceUrlManifestOutput({
  run: { run_id: "RB02-RB04", target: "https://paytm.com/", root_url: "https://paytm.com/", phase1_entity_surfaces: [{ host: "paytmpayments.com", status: "SEPARATE_ENTITY_INCLUDED", entity_id: "ppsl", entity_name: "Payments Entity", evidence: ["OFFICIAL_ENTITY_DISCLOSURE"] }] },
  legacyOutput,
  rootHtml,
  fetchImpl
});

assert.deepEqual(Object.keys(output).sort(), Object.keys(legacyOutput).sort());
assert.equal(JSON.stringify(output.deduped_url_manifest.manifest_sources), originalRows);
assert.equal(output.source_discovery_matrix_manifest.rb02_internal_evidence_model_active, true);
assert.equal(output.source_discovery_matrix_manifest.rb03_entity_boundary_active, true);
assert.equal(output.source_discovery_matrix_manifest.rb04_broad_discovery_inventory_active, true);
assert.equal(output.source_discovery_matrix_manifest.manifest_selection_unchanged_until_rb09, true);

const model = output.source_discovery_matrix_manifest.internal_evidence_model;
const boundary = { target_boundary_manifest: output.source_discovery_matrix_manifest.target_boundary_manifest, entity_surface_map: output.source_discovery_matrix_manifest.entity_surface_map };
const inventory = output.source_discovery_matrix_manifest.raw_discovery_inventory;
assertInternalEvidenceModel(model);
assertEntityBoundary(boundary);
assertBroadDiscoveryInventory(inventory);

const aiRouter = model.source_candidates.filter((candidate) => candidate.canonical_url === sharedUrl);
assert.equal(aiRouter.length, 1);
assert.equal(aiRouter[0].primary_root, "product_service");
assert.deepEqual(new Set(aiRouter[0].root_candidates), new Set(["product_service", "ai_safety_transparency"]));
assert.deepEqual(aiRouter[0].secondary_root_references, ["ai_safety_transparency"]);

const surfaces = boundary.entity_surface_map.surfaces;
assert.equal(surface("paytm.com").status, "PRIMARY_TARGET");
assert.equal(surface("business.paytm.com").status, "CONTROLLED_OPERATING_SURFACE");
assert.equal(surface("business.paytm.com").legal_capacity_merge_forbidden, true);
assert.equal(surface("paytmpayments.com").status, "SEPARATE_ENTITY_INCLUDED");
assert.equal(surface("paytmpayments.com").entity_id, "ppsl");
assert.equal(surface("external.example").status, "THIRD_PARTY");
assert.equal(surface("external.example").targeted_crawl_allowed, false);
assert.ok(inventory.candidate_urls.some((candidate) => candidate.canonical_url === "https://paytmpayments.com/policies"));
assert.ok(inventory.candidate_urls.some((candidate) => candidate.canonical_url === "https://external.example/docs"));
assert.ok(inventory.candidate_urls.every((candidate) => candidate.discovery_only_not_final_extraction_authority === true));

console.log(JSON.stringify({ check: "phase1 RB02 internal model RB03 entity boundary RB04 broad discovery", status: "PASS", offline_fixture: true, source_candidates: model.source_candidates.length, entity_surfaces: surfaces.length, discovery_candidates: inventory.candidate_urls.length }, null, 2));

function surface(host) { const found = surfaces.find((item) => item.host === host); assert.ok(found, `surface missing: ${host}`); return found; }
function row(id, root, url, route, roles) { return { manifest_id: id, common_root: root, root_traversal_policy: root === "homepage_landing" ? "PRIMARY_SINGLE_EXTRACT" : "PRIMARY_FULL_EXTRACT", canonical_url: url, canonical_url_key: url, fetch_url: url, route_type: route, route_type_aliases: [], materiality: "product_activity", source_signal_roles: roles, technical_route_shape: null, api_data_flow_signal: { present: false, basis: [] }, neutral_buckets: ["product_activity_sources"], discovered_by: ["FIXTURE"], admission_tier: "PRIMARY", variant_cluster_id: route, extraction_decision: "EXTRACT", legal_doc_candidate: false, legal_doc_type: "other", phase_1_classification_effect: "SOURCE_ROUTING_ONLY_NOT_JOB_ROUTING" }; }
function noNarrowing() { return { primary_domain_locked: false, source_discovery_narrowed: false, sources_excluded_by_domain: false, domain_specific_prompt_routing_used: false, dynamic_routing_used: false }; }
