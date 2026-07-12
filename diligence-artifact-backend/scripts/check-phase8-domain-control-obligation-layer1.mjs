import assert from "node:assert/strict";

import {
  DOMAIN_CONTROL_OBLIGATION_CANDIDATE_ARTIFACT,
  DOMAIN_CONTROL_OBLIGATION_CANDIDATE_DERIVATION_MODE,
  DOMAIN_CONTROL_OBLIGATION_MODEL_MATERIAL_FIELDS,
  buildDomainControlObligationCandidateInventory,
  validateDomainControlObligationCandidateInventory
} from "../src/phases/08-domain-control-obligation-profile/index.js";

const resolvedTaxonomy = {
  resolver_status: "RESOLVED",
  limitations: [],
  mounted_taxonomy_ref: {
    primary_package_id: "fintech",
    primary_key_version: "test-fintech-v1",
    capability_overlays: [{ overlay_id: "ai-native", package_id: "ai-governance", key_version: "test-ai-v1" }],
    regulatory_overlays: []
  },
  obligations: [
    obligation({
      obligationId: "FIN-OBL-TEST-01",
      family: "payment_control",
      sourceLayer: "PRIMARY",
      sourcePackageId: "fintech",
      catalogPackageId: "fintech",
      behavior: ["PAY"],
      surface: ["Transaction-Data"]
    }),
    obligation({
      obligationId: "AI-OBL-TEST-01",
      family: "human_oversight",
      sourceLayer: "CAPABILITY_OVERLAY",
      sourcePackageId: "ai-governance",
      catalogPackageId: "ai-native",
      capabilityOverlayId: "ai-native",
      behavior: ["JDG"],
      surface: ["Consumer-Public"]
    }),
    obligation({
      obligationId: "REG-OBL-FORBIDDEN",
      family: "regulatory_overlay_only",
      sourceLayer: "REGULATORY_OVERLAY",
      sourcePackageId: "privacy",
      catalogPackageId: "privacy",
      behavior: ["PAY"],
      surface: ["Transaction-Data"]
    })
  ]
};

const navigationIndex = {
  artifact_type: "domain_control_obligation_navigation_index",
  obligation_family_routing: [
    route("fintech", "payment_control", "DCO.CONTROL.PAYMENT"),
    route("ai-native", "human_oversight", "DCO.CONTROL.HUMAN_OVERSIGHT")
  ]
};

const targetFeatureProfile = {
  artifact_type: "target_feature_profile",
  activities: [
    {
      activity_reference: "ACT-001",
      primary_classification: {
        package_id: "fintech",
        archetype_codes: ["PAY"],
        surface_context_tokens: ["Transaction-Data"]
      },
      overlay_classifications: []
    },
    {
      activity_reference: "ACT-002",
      primary_classification: {
        package_id: "fintech",
        archetype_codes: ["PAY"],
        surface_context_tokens: ["Merchant-SME"]
      },
      overlay_classifications: [{
        overlay_id: "ai-native",
        package_id: "ai-governance",
        archetype_codes: ["JDG"],
        surface_context_tokens: ["Consumer-Public"]
      }]
    },
    {
      activity_reference: "ACT-003",
      primary_classification: {
        package_id: "another-package",
        archetype_codes: ["PAY"],
        surface_context_tokens: ["Transaction-Data"]
      },
      overlay_classifications: [{
        overlay_id: "another-overlay",
        package_id: "ai-governance",
        archetype_codes: ["JDG"],
        surface_context_tokens: ["Consumer-Public"]
      }]
    }
  ]
};

const inventory = await buildDomainControlObligationCandidateInventory({
  runId: "PHASE8-LAYER1-CHECK",
  targetFeatureProfile,
  navigationIndex,
  resolvedTaxonomy
});

assert.equal(inventory.artifact_type, DOMAIN_CONTROL_OBLIGATION_CANDIDATE_ARTIFACT);
assert.equal(inventory.derivation_mode, DOMAIN_CONTROL_OBLIGATION_CANDIDATE_DERIVATION_MODE);
assert.equal(inventory.run_id, "PHASE8-LAYER1-CHECK");
assert.equal(inventory.candidate_count, 2);
assert.deepEqual(inventory.candidates.map((row) => row.candidate_id), ["DCO-CAND-001", "DCO-CAND-002"]);
assert.deepEqual(inventory.candidates.map((row) => row.source_layer), ["CAPABILITY_OVERLAY", "PRIMARY"]);

const overlayCandidate = inventory.candidates.find((row) => row.source_layer === "CAPABILITY_OVERLAY");
const primaryCandidate = inventory.candidates.find((row) => row.source_layer === "PRIMARY");
assert.ok(overlayCandidate);
assert.ok(primaryCandidate);
assert.equal(overlayCandidate.capability_overlay_id, "ai-native");
assert.deepEqual(overlayCandidate.linked_activity_references, ["ACT-002"]);
assert.deepEqual(overlayCandidate.matched_behavior_codes, ["JDG"]);
assert.deepEqual(overlayCandidate.matched_surface_tokens, ["Consumer-Public"]);
assert.deepEqual(primaryCandidate.linked_activity_references, ["ACT-001"]);
assert.deepEqual(primaryCandidate.matched_behavior_codes, ["PAY"]);
assert.deepEqual(primaryCandidate.matched_surface_tokens, ["Transaction-Data"]);
assert.ok(inventory.inventory_limitations.some((value) => value.includes("FORBIDDEN_OBLIGATION_SOURCE_LAYER_EXCLUDED")));
assert.equal(inventory.candidates.some((row) => row.source_layer === "REGULATORY_OVERLAY"), false);

for (const candidate of inventory.candidates) {
  assert.equal(candidate.p2e_navigation_route_refs.length, 1);
  assert.equal(candidate.candidate_status, "MATCHED");
  for (const field of [...DOMAIN_CONTROL_OBLIGATION_MODEL_MATERIAL_FIELDS, "regulatory_overlay_refs"]) {
    assert.equal(Object.prototype.hasOwnProperty.call(candidate, field), false, `${candidate.candidate_id} leaked Layer 2 field ${field}`);
  }
}

const validation = validateDomainControlObligationCandidateInventory(inventory, {
  resolvedTaxonomy,
  navigationIndex,
  targetFeatureProfile
});
assert.equal(validation.status, "PASS", validation.failures.join("\n"));

const repeat = await buildDomainControlObligationCandidateInventory({
  runId: "PHASE8-LAYER1-CHECK",
  targetFeatureProfile,
  navigationIndex,
  resolvedTaxonomy
});
assert.deepEqual(repeat, inventory, "Layer 1 output must be deterministic for identical inputs");

console.log("Phase 8 Domain Control Obligation Layer 1 candidate inventory: PASS");

function obligation({
  obligationId,
  family,
  sourceLayer,
  sourcePackageId,
  catalogPackageId,
  capabilityOverlayId = "",
  behavior,
  surface
}) {
  return {
    obligation_id: obligationId,
    obligation_family: family,
    source_layer: sourceLayer,
    source_package_id: sourcePackageId,
    catalog_package_id: catalogPackageId,
    capability_overlay_id: capabilityOverlayId,
    applies_when: { behavior_class: behavior, surface },
    registry_key_ref: {
      key_file: `${sourcePackageId}_Registry_Key.yml`,
      package_id: sourcePackageId,
      key_version: "test-v1",
      obligation_path: `domain_control_obligation.obligations.${obligationId}`
    },
    obligation_catalog_ref: {
      catalog_file: `${catalogPackageId}.obligation-catalog.json`,
      domain_id: catalogPackageId,
      obligation_family: family
    },
    registry_obligation: { authority_dependency: ["TEST_AUTHORITY"] },
    resolution_status: "RESOLVED",
    limitations: []
  };
}

function route(domainId, family, controlRouteId) {
  return {
    domain_id: domainId,
    obligation_family: family,
    required_control_source_route_ids: [controlRouteId],
    selective_legal_route_ids: [],
    locator_families: ["TEST_LOCATOR"],
    legal_doc_types: [],
    shell_field_targets: ["control_mechanism_present"],
    reading_priority: ["test evidence"]
  };
}
