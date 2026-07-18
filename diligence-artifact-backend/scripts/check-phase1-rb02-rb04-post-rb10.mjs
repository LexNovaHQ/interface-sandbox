import assert from "node:assert/strict";
import { augmentSourceUrlManifestOutput } from "../src/phases/01-source-discovery/services/universal-url-manifest.service.js";
import { assertInternalEvidenceModel } from "../src/phases/01-source-discovery/services/internal-evidence-model.service.js";
import { assertEntityBoundary } from "../src/phases/01-source-discovery/services/entity-boundary.service.js";
import { assertBroadDiscoveryInventory } from "../src/phases/01-source-discovery/services/broad-discovery.service.js";

const sharedUrl = "https://business.paytm.com/airouter";
const legacyOutput = {
  deduped_url_manifest: {
    run_id: "RB02-RB04",
    target_url: "https://paytm.com/",
    target_boundary: {},
    manifest_sources: [
      row("product_service.URL.001", "product_service", sharedUrl),
      row("ai_safety_transparency.URL.001", "ai_safety_transparency", sharedUrl),
      row("homepage_landing.URL.001", "homepage_landing", "https://paytm.com/")
    ],
    rejected_candidates: [], discovery_log: [], scout_failures: []
  },
  source_discovery_matrix_manifest: { common_core_roots: roots(), forbidden_actions_confirmed: noNarrowing() },
  adapter_expansion_log: { union_probe_mode: "ALL_DOMAIN_HINT_PACKS_PLUS_PREFLIGHT_HINTS", dynamic_routing_used: false, domain_lock_used: false },
  neutral_evidence_bucket_manifest: { buckets: {}, forbidden_actions_confirmed: noNarrowing() }
};
const rootHtml = `<html><head><link rel="canonical" href="https://paytm.com/"></head><body><a href="https://business.paytm.com/payment-gateway">Business</a><a href="https://paytmpayments.com/policies">Payments entity</a><a href="https://external.example/docs">Partner</a></body></html>`;
const fetchImpl = async (value) => new Response(`<html><head><title>Fixture</title></head><body><main><h1>${new URL(value).pathname}</h1><p>Deterministic Phase 1 evidence with enough material text for fingerprinting and classification.</p></main></body></html>`, { status: 200, headers: { "content-type": "text/html" } });
const output = await augmentSourceUrlManifestOutput({
  run: { run_id: "RB02-RB04", target: "https://paytm.com/", root_url: "https://paytm.com/", phase1_entity_surfaces: [{ host: "paytmpayments.com", status: "SEPARATE_ENTITY_INCLUDED", entity_id: "ppsl" }] },
  legacyOutput, rootHtml, fetchImpl
});

assert.deepEqual(Object.keys(output).sort(), Object.keys(legacyOutput).sort());
assert.equal(output.deduped_url_manifest.final_extraction_authority, true);
assert.equal(output.source_discovery_matrix_manifest.manifest_selection_unchanged_until_rb09, false);
for (const flag of ["rb02_internal_evidence_model_active", "rb03_entity_boundary_active", "rb04_broad_discovery_inventory_active", "rb09_canonical_selection_active", "rb10_final_deduped_manifest_active"]) assert.equal(output.source_discovery_matrix_manifest[flag], true, flag);
const model = output.source_discovery_matrix_manifest.internal_evidence_model;
const boundary = { target_boundary_manifest: output.source_discovery_matrix_manifest.target_boundary_manifest, entity_surface_map: output.source_discovery_matrix_manifest.entity_surface_map };
const inventory = output.source_discovery_matrix_manifest.raw_discovery_inventory;
assertInternalEvidenceModel(model); assertEntityBoundary(boundary); assertBroadDiscoveryInventory(inventory);
const ai = model.source_candidates.filter((item) => item.canonical_url === sharedUrl);
assert.equal(ai.length, 1); assert.equal(ai[0].primary_root, "product_service"); assert.deepEqual(ai[0].secondary_root_references, ["ai_safety_transparency"]);
assert.equal(surface(boundary, "paytm.com").status, "PRIMARY_TARGET");
assert.equal(surface(boundary, "business.paytm.com").status, "CONTROLLED_OPERATING_SURFACE");
assert.equal(surface(boundary, "paytmpayments.com").entity_id, "ppsl");
assert.equal(surface(boundary, "external.example").status, "THIRD_PARTY");
console.log(JSON.stringify({ check: "phase1 RB02 RB04 compatibility after RB10", status: "PASS" }, null, 2));

function surface(boundary, host) { const value = boundary.entity_surface_map.surfaces.find((item) => item.host === host); assert.ok(value); return value; }
function row(id, root, url) { return { manifest_id: id, common_root: root, root_traversal_policy: root === "homepage_landing" ? "PRIMARY_SINGLE_EXTRACT" : "PRIMARY_FULL_EXTRACT", canonical_url: url, canonical_url_key: url, fetch_url: url, route_type: root, route_type_aliases: [], materiality: "product_activity", source_signal_roles: ["PRODUCT_ACTIVITY_SIGNAL"], technical_route_shape: null, api_data_flow_signal: { present: false, basis: [] }, neutral_buckets: ["product_activity_sources"], discovered_by: ["FIXTURE"], admission_tier: "PRIMARY", variant_cluster_id: root, extraction_decision: "EXTRACT", legal_doc_candidate: false, legal_doc_type: "other", phase_1_classification_effect: "SOURCE_ROUTING_ONLY_NOT_JOB_ROUTING" }; }
function roots() { const ids = ["homepage_landing","company_identity","contact_notice","product_service","platform_feature_solution","technical_docs_api","docs_api_data_flow","integrations_ecosystem","pricing_commercial_availability","use_case_customer_industry","privacy_data_processing","security_trust_compliance","data_governance_controls","ai_safety_transparency","support_help_resources","regulatory_licensing_status","grievance_complaints"]; return ids.map((id) => ({ id, traversal_policy: id === "homepage_landing" ? "PRIMARY_SINGLE_EXTRACT" : ["integrations_ecosystem","pricing_commercial_availability","use_case_customer_industry","support_help_resources"].includes(id) ? "SECONDARY_CONDITIONAL" : "PRIMARY_FULL_EXTRACT" })); }
function noNarrowing() { return { primary_domain_locked: false, source_discovery_narrowed: false, sources_excluded_by_domain: false, domain_specific_prompt_routing_used: false, dynamic_routing_used: false }; }
