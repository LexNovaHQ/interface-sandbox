import assert from "node:assert/strict";
import { resolveActiveThreatRegistryContext } from "../src/phases/10-exposure-profile/active-threat-registry-manifest.js";
import { assertRequiredPhase5ClassificationStreams } from "../src/phases/10-exposure-profile/phase10-classification-inventory.validator.js";
import {
  buildPackageScopedExposureRegistryRoutePlan,
  finalizePhase10RoutingContext
} from "../src/phases/10-exposure-profile/phase10-classification-routing.js";

function artifacts({ primaryPackage, aiMount, primaryCodes, overlayDeclarations = [], overlayClassifications = [] }) {
  return {
    domain_derivation_profile: {
      primary_domain_derivation: { selected_package: primaryPackage, status: "LOCKED" },
      ai_mount_derivation: { ai_package_mount: aiMount }
    },
    active_run_package_manifest: {
      primary_domain_package: primaryPackage,
      primary_domain_status: "LOCKED",
      ai_package_mount: aiMount
    },
    target_feature_profile: {
      mounted_taxonomy_ref: {
        primary_package_id: primaryPackage,
        primary_key_version: primaryPackage === "ai-governance" ? "v4.0" : "v1.0",
        overlays: overlayDeclarations
      },
      activities: [{
        activity_reference: "ACT-SCENARIO",
        primary_classification: {
          package_id: primaryPackage,
          archetype_codes: primaryCodes,
          surface_context_tokens: [],
          archetype_derivation_basis: [],
          surface_derivation_basis: []
        },
        overlay_classifications: overlayClassifications
      }]
    }
  };
}

function legal() {
  return {
    legal_cartography_index: {
      document_coverage_index: [],
      document_structure_index: [],
      incorporated_linked_document_map: [],
      control_language_locator: [],
      missing_limited_legal_governance_items: [],
      downstream_rules: {},
      lock_status: "LOCKED"
    }
  };
}

async function buildScenario(runId, upstream) {
  const selected = await resolveActiveThreatRegistryContext({ runId, artifacts: upstream });
  const context = finalizePhase10RoutingContext({
    registryContext: selected,
    targetFeatureProfile: upstream.target_feature_profile
  });
  assert.doesNotThrow(() => assertRequiredPhase5ClassificationStreams({
    inventory: context.classification_inventory,
    manifest: context.artifact
  }));
  const output = buildPackageScopedExposureRegistryRoutePlan({
    registryContext: context,
    targetFeatureProfile: upstream.target_feature_profile,
    legalCartographyIndex: legal(),
    upstreamArtifacts: { ...upstream, ...legal() },
    runId,
    manifest: context.artifact
  });
  assert.equal(output.exposure_registry_route_plan.phase_a_validation.status, "PASS");
  return { context, route: output.exposure_registry_route_plan };
}

const aiPrimary = await buildScenario("AI-PRIMARY-ROUTE", artifacts({
  primaryPackage: "ai-governance",
  aiMount: "AI_PRIMARY",
  primaryCodes: ["DOE"]
}));
assert.deepEqual(aiPrimary.context.artifact.mounted_packages, ["ai-governance"]);
assert.equal(aiPrimary.route.stream_plans.length, 1);
assert.equal(aiPrimary.route.stream_plans[0].stream_id, "PRIMARY::ai-governance");
assert.equal(aiPrimary.route.stream_plans[0].stream_type, "PRIMARY");
assert.ok(aiPrimary.route.route_rows.every((row) => row.stream_type === "PRIMARY" && row.package_id === "ai-governance"));
assert.equal(aiPrimary.route.route_rows.length, 98);

const candidateOnly = await buildScenario("FIN-CANDIDATE-ROUTE", artifacts({
  primaryPackage: "fintech",
  aiMount: "AI_CANDIDATE_ONLY",
  primaryCodes: ["PAY"]
}));
assert.deepEqual(candidateOnly.context.artifact.mounted_packages, ["fintech"]);
assert.equal(candidateOnly.route.stream_plans.length, 1);
assert.equal(candidateOnly.route.stream_plans[0].stream_id, "PRIMARY::fintech");
assert.ok(candidateOnly.route.route_rows.every((row) => row.package_id === "fintech"));
assert.equal(candidateOnly.route.route_rows.length, 46);
assert.equal(candidateOnly.route.route_rows.some((row) => row.package_id === "ai-governance"), false);

const missingOverlayArtifacts = artifacts({
  primaryPackage: "fintech",
  aiMount: "AI_OVERLAY_MOUNTED",
  primaryCodes: ["PAY"],
  overlayDeclarations: [{ overlay_id: "ai-native", package_id: "ai-governance", key_version: "v4.0" }],
  overlayClassifications: []
});
const selectedMissing = await resolveActiveThreatRegistryContext({ runId: "MISSING-OVERLAY", artifacts: missingOverlayArtifacts });
const missingContext = finalizePhase10RoutingContext({
  registryContext: selectedMissing,
  targetFeatureProfile: missingOverlayArtifacts.target_feature_profile
});
assert.throws(
  () => assertRequiredPhase5ClassificationStreams({
    inventory: missingContext.classification_inventory,
    manifest: missingContext.artifact
  }),
  /PHASE5_REQUIRED_STREAM_CLASSIFICATION_MISSING:OVERLAY::ai-governance/
);

console.log(JSON.stringify({
  check: "phase10 route scenario and mounted classification stream gates",
  status: "PASS",
  ai_primary_rows: aiPrimary.route.route_rows.length,
  candidate_only_fintech_rows: candidateOnly.route.route_rows.length,
  candidate_only_ai_registry_mounted: false,
  missing_required_overlay_classification_hard_stops: true
}, null, 2));
