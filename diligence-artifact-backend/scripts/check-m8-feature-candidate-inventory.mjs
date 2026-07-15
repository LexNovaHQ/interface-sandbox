import assert from "node:assert/strict";

import { ACTIVITY_CANDIDATE_INVENTORY_CONTRACT } from "../src/phases/05-activity-profile-review/activity-candidate-inventory.contract.js";
import { runActivityCandidateInventoryPhase } from "../src/phases/05-activity-profile-review/activity-candidate-inventory.runner.js";
import { buildPhaseRoutingManifest } from "../src/phases/02-cartography-index/services/phase-routing-manifest.builder.js";

const sourceRoot = "lossless_root__product_service";
const unitId = "unit-product-1";
const routePacket = {
  routing_authority: "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY",
  internal_job_id: "M8_FEATURE_CANDIDATE_INVENTORY",
  route_id: "ROUTE.PHASE5.ACTIVITY_PROFILE",
  bucket_id: "2C_BUCKET_ACTIVITY_PROFILE",
  lossless_evidence_role: "PRIMARY_EVIDENCE",
  index_role: "MANDATORY_NAVIGATION_MAP_INTO_PRIMARY_EVIDENCE",
  profile_forensics_inputs_allowed: false,
  delivered_artifacts: [
    "phase_route_runtime_packet",
    "activity_profile_source_index",
    "target_profile",
    "domain_derivation_profile",
    "active_run_package_manifest",
    sourceRoot
  ]
};

const activityProfileSourceIndex = {
  activity_candidate_source_locator_map: [{
    locator_id: "LOC.001",
    unit_id: unitId,
    source_id: "SRC.001",
    source_artifact: sourceRoot,
    common_root: sourceRoot,
    route_class: "PRODUCT_CAPABILITY_ROUTE",
    route_code: "P2C-ACT-CAND",
    route_action: "LOCATE_ONLY",
    candidate_creation_allowed: true,
    context_only: false,
    matched_signal_labels: ["example activity"],
    source_pointer: { artifact_name: sourceRoot, source_id: "SRC.001" },
    unit_pointer: { unit_id: unitId }
  }]
};

const phaseRoutingManifest = buildPhaseRoutingManifest({
  runId: "PHASE5-LAYER1-RUNNER-CHECK",
  artifacts: {
    activity_profile_source_index: activityProfileSourceIndex,
    target_profile: {},
    domain_derivation_profile: {},
    active_run_package_manifest: {},
    domain_selection_profile: {},
    [sourceRoot]: { units: [{ unit_id: unitId, source_id: "SRC.001", title: "Example Activity" }] }
  }
}).phase_routing_manifest;

const fixtureArtifacts = {
  phase_routing_manifest: phaseRoutingManifest,
  phase_route_runtime_packet: routePacket,
  activity_profile_source_index: activityProfileSourceIndex,
  target_profile: {},
  domain_derivation_profile: {},
  active_run_package_manifest: {},
  domain_selection_profile: {},
  [sourceRoot]: {
    artifact_name: sourceRoot,
    common_root: sourceRoot,
    units: [{ unit_id: unitId, source_id: "SRC.001", title: "Example Activity" }]
  }
};

let providerCalled = false;
let promptBuilt = false;
let saved = null;
const readRequests = [];

const result = await runActivityCandidateInventoryPhase({
  run: { run_id: "PHASE5-LAYER1-RUNNER-CHECK" },
  internalJobId: "M8_FEATURE_CANDIDATE_INVENTORY",
  contract: {
    ...ACTIVITY_CANDIDATE_INVENTORY_CONTRACT,
    reads: ["phase_routing_manifest"],
    writes: ["feature_candidate_inventory"],
    prompt_files: ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.semantic_support.prompt_files,
    references: [],
    agent_id: "agent_3_target_feature",
    public_label: ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.central_phase_label
  },
  readArtifacts: async ({ reads }) => {
    readRequests.push([...reads]);
    return Object.fromEntries(reads.map((name) => [name, fixtureArtifacts[name]]));
  },
  buildPrompt: async ({ artifacts, prompt_files }) => {
    promptBuilt = true;
    assert.ok(prompt_files.some((file) => file.endsWith("03A_M8_FEATURE_CANDIDATE_INVENTORY_DETERMINISTIC_LED_SEMANTIC_SUPPORTED.md")));
    assert.equal(artifacts.semantic_support_runtime_packet.package_taxonomy_supplied, false);
    assert.ok(artifacts.semantic_support_runtime_packet.deterministic_baseline);
    return "semantic support prompt";
  },
  callProvider: async ({ prompt }) => {
    providerCalled = true;
    assert.equal(prompt, "semantic support prompt");
    return {
      json: {
        semantic_candidate_support_proposal: {
          proposal_version: "v1",
          proposals: [],
          limitations: []
        }
      },
      metadata: { fixture: true }
    };
  },
  saveArtifact: async (payload) => {
    saved = payload;
  }
});

assert.equal(promptBuilt, true);
assert.equal(providerCalled, true);
assert.deepEqual(readRequests[0], ["phase_routing_manifest"]);
assert.equal(result.ok, true);
assert.equal(result.semantic_support_attempted, true);
assert.equal(result.semantic_support_status, "NO_CHANGES");
assert.equal(saved.artifact_name, "feature_candidate_inventory");
assert.equal(saved.artifact.semantic_support_receipt.status, "NO_CHANGES");
assert.equal(saved.artifact.canonical_candidate_count, 1);
assert.equal(saved.lock_status, "LOCKED");

console.log("M8 feature candidate inventory runner: PASS");
