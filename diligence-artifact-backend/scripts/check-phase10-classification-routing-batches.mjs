import assert from "node:assert/strict";
import { resolveActiveThreatRegistryContext } from "../src/phases/10-exposure-profile/active-threat-registry-manifest.js";
import {
  buildPackageScopedBatchPlan,
  buildPackageScopedExposureRegistryRoutePlan,
  buildPhase5ClassificationInventory,
  finalizePhase10RoutingContext,
  MAX_M11_BATCH_PACKET_CHARS,
  MAX_M11_BATCH_ROWS,
  M11_PACKAGE_ROUTING_RULES_VERSION,
  PACKAGE_SCOPED_ROUTE_PLAN_SCHEMA,
  validatePackageScopedBatchPlan
} from "../src/phases/10-exposure-profile/phase10-classification-routing.js";

function phase5(primaryPackage, primaryCodes, overlayBlocks = []) {
  const overlays = overlayBlocks.map((overlay) => ({
    overlay_id: overlay.overlay_id,
    package_id: overlay.package_id,
    key_version: overlay.key_version || "v4.0"
  }));
  return {
    target_feature_profile: {
      mounted_taxonomy_ref: {
        primary_package_id: primaryPackage,
        primary_key_version: primaryPackage === "ai-governance" ? "v4.0" : "v1.0",
        overlays
      },
      activities: [{
        activity_reference: "ACT-001",
        primary_classification: {
          package_id: primaryPackage,
          archetype_codes: primaryCodes,
          surface_context_tokens: ["Primary-Surface"],
          archetype_derivation_basis: [],
          surface_derivation_basis: []
        },
        overlay_classifications: overlayBlocks.map((overlay) => ({
          overlay_id: overlay.overlay_id,
          package_id: overlay.package_id,
          archetype_codes: overlay.archetype_codes,
          surface_context_tokens: ["Overlay-Surface"],
          archetype_derivation_basis: [],
          surface_derivation_basis: []
        }))
      }]
    }
  };
}

function artifacts(primaryPackage, aiMount, primaryCodes, overlayBlocks = []) {
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
    ...phase5(primaryPackage, primaryCodes, overlayBlocks)
  };
}

function legalCartographyIndex() {
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

const overlayArtifacts = artifacts("fintech", "AI_OVERLAY_MOUNTED", ["PAY"], [{
  overlay_id: "ai-native",
  package_id: "ai-governance",
  key_version: "v4.0",
  archetype_codes: ["DOE"]
}]);
const selected = await resolveActiveThreatRegistryContext({ runId: "CO456", artifacts: overlayArtifacts });
const context = finalizePhase10RoutingContext({
  registryContext: selected,
  targetFeatureProfile: overlayArtifacts.target_feature_profile
});

assert.equal(context.route_plan_compatibility.ok, true);
assert.equal(context.semantic_layer_compatibility.ok, false);
assert.equal(context.artifact.execution_fingerprint_inputs.routing_rules_version, M11_PACKAGE_ROUTING_RULES_VERSION);
assert.equal(context.artifact.execution_fingerprint_inputs.max_m11_batch_rows, 15);
assert.equal(context.artifact.execution_fingerprint_inputs.max_m11_batch_packet_chars, MAX_M11_BATCH_PACKET_CHARS);
assert.notEqual(context.phase10_execution_fingerprint, selected.phase10_execution_fingerprint);

const inventory = context.classification_inventory;
assert.equal(inventory.validation.status, "PASS");
assert.deepEqual(inventory.stream_order, ["PRIMARY::fintech", "OVERLAY::ai-governance"]);
const fintechInventory = inventory.streams.find((stream) => stream.stream_id === "PRIMARY::fintech");
const aiOverlayInventory = inventory.streams.find((stream) => stream.stream_id === "OVERLAY::ai-governance");
assert.deepEqual(fintechInventory.archetype_codes, ["PAY"]);
assert.deepEqual(aiOverlayInventory.archetype_codes, ["DOE"]);
assert.deepEqual(fintechInventory.activity_references, ["ACT-001"]);
assert.deepEqual(aiOverlayInventory.activity_references, ["ACT-001"]);

const routeOutput = buildPackageScopedExposureRegistryRoutePlan({
  registryContext: context,
  targetFeatureProfile: overlayArtifacts.target_feature_profile,
  legalCartographyIndex: legalCartographyIndex(),
  upstreamArtifacts: { ...overlayArtifacts, ...legalCartographyIndex() },
  runId: "CO456",
  manifest: context.artifact
});
const route = routeOutput.exposure_registry_route_plan;
assert.equal(route.schema_version, PACKAGE_SCOPED_ROUTE_PLAN_SCHEMA);
assert.equal(route.phase_a_validation.status, "PASS");
assert.equal(route.route_rows.length, 144);
assert.equal(route.stream_plans.length, 2);
assert.equal(route.route_reconciliation.accounted_registry_row_keys, 144);
assert.equal(route.batch_plan_validation.package_and_stream_isolation, true);
assert.equal(route.batch_plan_validation.maximum_rows_per_batch, 15);
assert.ok(route.batch_plan.length > 0);
assert.ok(route.batch_plan.every((batch) => batch.row_count >= 1 && batch.row_count <= 15));
assert.ok(route.batch_plan.every((batch) => batch.estimated_packet_chars <= MAX_M11_BATCH_PACKET_CHARS));
assert.ok(route.batch_plan.every((batch) => batch.expected_registry_row_keys.every((key) => key.startsWith(`${batch.package_id}::`))));
assert.ok(route.batch_plan.every((batch) => batch.stream_id === `${batch.stream_type}::${batch.package_id}`));

const fintechRows = route.route_rows.filter((row) => row.package_id === "fintech");
const aiRows = route.route_rows.filter((row) => row.package_id === "ai-governance");
assert.ok(fintechRows.filter((row) => row.Archetype === "PAY").every((row) => row.route === "EVALUATION_ROUTED"));
assert.ok(fintechRows.filter((row) => !["PAY", "UNI"].includes(row.Archetype)).every((row) => row.route === "NOT_TRIGGERED_NOT_APPLICABLE"));
assert.ok(aiRows.filter((row) => row.Archetype === "DOE").every((row) => row.route === "EVALUATION_ROUTED"));
assert.ok(aiRows.filter((row) => !["DOE", "UNI"].includes(row.Archetype)).every((row) => row.route === "NOT_TRIGGERED_NOT_APPLICABLE"));
assert.ok(route.route_rows.filter((row) => row.Archetype === "UNI").every((row) => row.route_reason === "UNI_ALWAYS_RUN"));
assert.ok(route.route_rows.every((row) => row.surface_routing_allowed === false));

const collisionRows = route.route_rows.filter((row) => row.Threat_ID === "UNI_PRV_001");
assert.equal(collisionRows.length, 2);
assert.deepEqual(collisionRows.map((row) => row.registry_row_key).sort(), [
  "ai-governance::UNI_PRV_001",
  "fintech::UNI_PRV_001"
]);
const batchedCollisionKeys = route.batch_plan.flatMap((batch) => batch.expected_registry_row_keys).filter((key) => key.endsWith("::UNI_PRV_001"));
assert.deepEqual(batchedCollisionKeys.sort(), [
  "ai-governance::UNI_PRV_001",
  "fintech::UNI_PRV_001"
]);

const flatProfile = phase5("fintech", ["PAY"]).target_feature_profile;
flatProfile.activities[0].archetype_codes = ["PAY"];
const flatInventory = buildPhase5ClassificationInventory({
  targetFeatureProfile: { target_feature_profile: flatProfile },
  manifest: { primary_package: "fintech", streams: [{ package_id: "fintech", stream_type: "PRIMARY" }] }
});
assert.equal(flatInventory.validation.status, "CONTROLLED_FAILURE");
assert.ok(flatInventory.validation.failures.some((failure) => failure.includes("flat classification path forbidden")));

const syntheticInventory = {
  stream_order: ["PRIMARY::fintech"],
  streams: [{
    stream_id: "PRIMARY::fintech",
    stream_type: "PRIMARY",
    package_id: "fintech",
    source_domain: "fintech",
    inventory_digest: "synthetic",
    archetype_codes: ["PAY"],
    surface_context_tokens: [],
    activity_references: ["ACT-SYN"]
  }]
};
const syntheticRows = Array.from({ length: 31 }, (_value, index) => ({
  registry_row_key: `fintech::PAY_TEST_${String(index + 1).padStart(3, "0")}`,
  Threat_ID: `PAY_TEST_${String(index + 1).padStart(3, "0")}`,
  package_id: "fintech",
  source_domain: "fintech",
  stream_type: "PRIMARY",
  stream_id: "PRIMARY::fintech",
  Archetype: "PAY",
  registry_order: index + 1,
  stream_registry_order: index + 1,
  route: "EVALUATION_ROUTED",
  route_reason: "PACKAGE_ARCHETYPE_MATCH",
  matched_activity_references: ["ACT-SYN"],
  registry_row: { Threat_ID: `PAY_TEST_${String(index + 1).padStart(3, "0")}`, Archetype: "PAY", Hunter_Trigger: "CONDITION_1: test | TRIGGER_IF: CONDITION_1 = TRUE | EXCLUDE_IF: false" }
}));
const exact15Plan = buildPackageScopedBatchPlan(syntheticRows, {
  inventory: syntheticInventory,
  maxRows: MAX_M11_BATCH_ROWS,
  maxPacketChars: 1000000
});
assert.deepEqual(exact15Plan.map((batch) => batch.row_count), [15, 15, 1]);
assert.equal(validatePackageScopedBatchPlan(exact15Plan, { routedRows: syntheticRows, maxRows: 15, maxPacketChars: 1000000 }).status, "PASS");

const packetSplitPlan = buildPackageScopedBatchPlan(syntheticRows.slice(0, 4), {
  inventory: syntheticInventory,
  maxRows: 15,
  maxPacketChars: 1000
});
assert.ok(packetSplitPlan.length > 1, "packet ceiling must split before row ceiling where required");
assert.ok(packetSplitPlan.every((batch) => batch.row_count <= 15));
assert.ok(packetSplitPlan.every((batch) => batch.package_id === "fintech" && batch.stream_type === "PRIMARY"));

console.log(JSON.stringify({
  check: "phase10 Phase5 classification adapter, package route streams, and max-15 batch planner",
  status: "PASS",
  route_plan_schema: route.schema_version,
  route_rows: route.route_rows.length,
  stream_count: route.stream_plans.length,
  batch_count: route.batch_plan.length,
  maximum_rows_per_batch: MAX_M11_BATCH_ROWS,
  packet_ceiling_chars: MAX_M11_BATCH_PACKET_CHARS,
  exact_row_split_fixture: exact15Plan.map((batch) => batch.row_count),
  canonical_collision_preserved_with_compound_keys: true,
  semantic_stage_blocked_pending_CO7_CO8: true
}, null, 2));
