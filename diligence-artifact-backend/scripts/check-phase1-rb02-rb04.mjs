import assert from "node:assert/strict";
import { augmentSourceUrlManifestOutput } from "../src/phases/01-source-discovery/services/universal-url-manifest.service.js";
import { assertInternalEvidenceModel } from "../src/phases/01-source-discovery/services/internal-evidence-model.service.js";
import { assertEntityBoundary } from "../src/phases/01-source-discovery/services/entity-boundary.service.js";
import { assertBroadDiscoveryInventory } from "../src/phases/01-source-discovery/services/broad-discovery.service.js";

const ROOTS = ["homepage_landing", "company_identity", "contact_notice", "product_service", "platform_feature_solution", "technical_docs_api", "docs_api_data_flow", "integrations_ecosystem", "pricing_commercial_availability", "use_case_customer_industry", "privacy_data_processing", "security_trust_compliance", "data_governance_controls", "ai_safety_transparency", "support_help_resources", "regulatory_licensing_status", "grievance_complaints"];

const sharedUrl = "https://business.paytm.com/airouter";
const manifestSources = [
  manifestRow({ id: "product_service.URL.001", root: "product_service", url: sharedUrl, route: "ai_router", roles: ["PRODUCT_ACTIVITY_SIGNAL", "AI_MECHANISM_SIGNAL"] }),
  manifestRow({ id: "ai_safety_transparency.URL.001", root: "ai_safety_transparency", url: sharedUrl, route: "ai_router_overlay", roles: ["AI_MECHANISM_SIGNAL", "AI_SAFETY_TRANSPARENCY_SIGNAL"] }),
  manifestRow({ id: "homepage_landing.URL.001", root: "homepage_landing", url: "https://paytm.com/", route: "primary_homepage", roles: ["TARGET_IDENTITY_SIGNAL"] })
];

const legacyOutput = {
  deduped_url_manifest: {
    run_id: "RB02-RB04-CHECK",
    target_url: "https://paytm.com/",
    target_boundary: { submitted_url: "https://paytm.com/", resolved_primary_url: "https://paytm.com/" },
    manifest_sources: manifestSources,
    rejected_candidates: [],
    discovery_log: [{ step: "ROOT_FETCH", status: "PASS", url: "https://paytm.com/" }],
    scout_failures: []
  },
  source_discovery_matrix_manifest: {
    schema_version: "PHASE1_AGNOSTIC_SOURCE_DISCOVERY_MATRIX_v3_MULTI_DOMAIN_UNION_PROBE",
    common_core_roots: ROOTS.map((id) => ({ id, traversal_policy: id === "homepage_landing" ? "PRIMARY_SINGLE_EXTRACT" : "PRIMARY_FULL_EXTRACT" })),
    forbidden_actions_confirmed: noNarrowing()
  },
  adapter_expansion_log: {
    schema_version: "PHASE1_ADAPTER_EXPANSION_LOG_v3_MULTI_DOMAIN_UNION_PROBE",
    union_probe_mode: "ALL_DOMAIN_HINT_PACKS_PLUS_PREFLIGHT_HINTS",
    dynamic_routing_used: false,
    domain_lock_used: false
  },
  neutral_evidence_bucket_manifest: {
    schema_version: "PHASE1_NEUTRAL_EVIDENCE_BUCKET_MANIFEST_v3_MULTI_DOMAIN_UNION_PROBE",
    buckets: {},
    forbidden_actions_confirmed: noNarrowing()
  }
};

const originalManifestSnapshot = JSON.stringify(legacyOutput.deduped_url_manifest.manifest_sources);
const rootHtml = `<!doctype html><html><head><link rel="canonical" href="https://paytm.com/"></head><body>
<header><a href="/products">Products</a></header>
<main><a href="https://stripe.com/docs">Payment partner reference</a></main>
<footer>
<a href="https://business.paytm.com/payment-gateway">Paytm Business</a>
<a href="https://paytmpayments.com/policies">Paytm Payments Services Limited</a>
</footer>
</body></html>`;

const output = await augmentSourceUrlManifestOutput({
  run: {
    run_id: "RB02-RB04-CHECK",
    target: "https://paytm.com/",
    root_url: "https://paytm.com/",
    phase1_entity_surfaces: [{
      host: "paytmpayments.com",
      status: "SEPARATE_ENTITY_INCLUDED",
      entity_id: "ppsl",
      entity_name: "Paytm Payments Services Limited",
      evidence: ["OFFICIAL_FIRST_PARTY_FOOTER_LINK", "LEGAL_ENTITY_NAME"]
    }]
  },
  legacyOutput,
  rootHtml
});

assert.deepEqual(Object.keys(output).sort(), Object.keys(legacyOutput).sort(), "RB02-RB04 must not add public artifact names");
assert.equal(JSON.stringify(output.deduped_url_manifest.manifest_sources), originalManifestSnapshot, "public manifest rows changed before RB09 selection cutover");
assert.equal(output.deduped_url_manifest.compatibility_projection_mode, "FROZEN_PUBLIC_CONTRACT_ADDITIVE_ONLY");
assert.equal(output.source_discovery_matrix_manifest.rb02_internal_evidence_model_active, true);
assert.equal(output.source_discovery_matrix_manifest.rb03_entity_boundary_active, true);
assert.equal(output.source_discovery_matrix_manifest.rb04_broad_discovery_inventory_active, true);
assert.equal(output.source_discovery_matrix_manifest.manifest_selection_unchanged_until_rb09, true);

const model = output.source_discovery_matrix_manifest.internal_evidence_model;
const boundary = {
  target_boundary_manifest: output.source_discovery_matrix_manifest.target_boundary_manifest,
  entity_surface_map: output.source_discovery_matrix_manifest.entity_surface_map
};
const inventory = output.source_discovery_matrix_manifest.raw_discovery_inventory;

assertInternalEvidenceModel(model);
assertEntityBoundary(boundary);
assertBroadDiscoveryInventory(inventory);

const aiRouterRecords = model.source_candidates.filter((candidate) => candidate.canonical_url === sharedUrl);
assert.equal(aiRouterRecords.length, 1, "same canonical URL must become one internal source identity");
assert.deepEqual(new Set(aiRouterRecords[0].root_candidates), new Set(["product_service", "ai_safety_transparency"]));
assert.equal(aiRouterRecords[0].primary_root, "product_service");
assert.deepEqual(aiRouterRecords[0].secondary_root_references, ["ai_safety_transparency"]);

const surfaces = boundary.entity_surface_map.surfaces;
assert.equal(surface("paytm.com").status, "PRIMARY_TARGET");
assert.equal(surface("business.paytm.com").status, "CONTROLLED_OPERATING_SURFACE");
assert.equal(surface("business.paytm.com").legal_capacity_merge_forbidden, true);
assert.equal(surface("paytmpayments.com").status, "SEPARATE_ENTITY_INCLUDED");
assert.equal(surface("paytmpayments.com").entity_id, "ppsl");
assert.equal(surface("stripe.com").status, "THIRD_PARTY");
assert.equal(surface("stripe.com").targeted_crawl_allowed, false);

const external = inventory.candidate_urls.filter((candidate) => !candidate.canonical_url.includes("paytm.com"));
assert.ok(external.some((candidate) => candidate.canonical_url === "https://paytmpayments.com/policies"), "separate branded entity surface was not discovered");
assert.ok(external.some((candidate) => candidate.canonical_url === "https://stripe.com/docs"), "third-party reference was not inventoried");
for (const candidate of external) assert.equal(candidate.discovery_only_not_final_extraction_authority, true, `${candidate.canonical_url} gained final extraction authority too early`);
assert.equal(output.adapter_expansion_log.external_surface_candidates_are_discovery_only, true);
assert.equal(output.adapter_expansion_log.downstream_contract_changed, false);
assert.equal(output.neutral_evidence_bucket_manifest.downstream_contract_changed, false);

console.log(JSON.stringify({
  check: "phase1 RB02 internal model RB03 entity boundary RB04 broad discovery",
  status: "PASS",
  public_artifact_names_unchanged: true,
  public_manifest_rows_unchanged: true,
  internal_source_candidates: model.counts.canonical_source_candidates + model.counts.raw_unclassified_candidates,
  entity_surfaces: surfaces.length,
  raw_discovery_candidates: inventory.counts.candidate_urls,
  external_surface_candidates: inventory.counts.external_surface_candidates
}, null, 2));

function surface(host) {
  const found = surfaces.find((item) => item.host === host);
  assert.ok(found, `surface missing: ${host}`);
  return found;
}

function manifestRow({ id, root, url, route, roles }) {
  return {
    manifest_id: id,
    common_root: root,
    root_traversal_policy: root === "homepage_landing" ? "PRIMARY_SINGLE_EXTRACT" : "PRIMARY_FULL_EXTRACT",
    canonical_url: url,
    canonical_url_key: url,
    fetch_url: url,
    route_type: route,
    route_type_aliases: [],
    materiality: "product_activity",
    source_signal_roles: roles,
    technical_route_shape: null,
    api_data_flow_signal: { present: false, basis: [] },
    neutral_buckets: ["product_activity_sources"],
    discovered_by: ["RB02_RB04_FIXTURE"],
    admission_tier: "PRIMARY",
    variant_cluster_id: route,
    extraction_decision: "EXTRACT",
    legal_doc_candidate: false,
    legal_doc_type: "other",
    phase_1_classification_effect: "SOURCE_ROUTING_ONLY_NOT_JOB_ROUTING"
  };
}

function noNarrowing() {
  return {
    primary_domain_locked: false,
    source_discovery_narrowed: false,
    sources_excluded_by_domain: false,
    domain_specific_prompt_routing_used: false,
    dynamic_routing_used: false
  };
}
