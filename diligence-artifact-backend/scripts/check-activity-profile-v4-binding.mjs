import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ACTIVITY_PROFILE_SOURCE_ARTIFACT_NAMES } from "../src/runtime/contracts/artifact-permissions.contract.js";
import { ACTIVITY_CANDIDATE_INVENTORY_CONTRACT } from "../src/phases/05-activity-profile-review/activity-candidate-inventory.contract.js";
import { ACTIVITY_PROFILE_REVIEW_CONTRACT } from "../src/phases/05-activity-profile-review/activity-profile-review.contract.js";
import { ACTIVITY_CANDIDATE_INVENTORY_RUNNER_STATUS } from "../src/phases/05-activity-profile-review/activity-candidate-inventory.runner.js";
import { ACTIVITY_PROFILE_REVIEW_RUNNER_STATUS } from "../src/phases/05-activity-profile-review/activity-profile-review.runner.js";
import { buildPhaseRoutingManifest } from "../src/phases/02-cartography-index/services/phase-routing-manifest.builder.js";
import { buildPhaseRouteRuntimeReadPlan } from "../src/phases/02-cartography-index/services/phase-route-runtime.reader.js";

const root = process.cwd();
const binding = await readFile(path.join(root, "agent-packages", "agent_3_target_feature", "AGENT3_RUNTIME_BINDING_PACKET.yaml"), "utf8");
const addendum = await readFile(path.join(root, "agent-packages", "agent_3_target_feature", "03B_M8_ACTIVITY_PROFILE_PACKAGE_AWARE_SYNC.md"), "utf8");
const profilePrompt = await readFile(path.join(root, "agent-packages", "agent_3_target_feature", "03_M8_FEATURE_PROFILE_BACKEND_CURRENT.md"), "utf8");
const candidatePrompt = await readFile(path.join(root, "agent-packages", "agent_3_target_feature", "03A_M8_FEATURE_CANDIDATE_INVENTORY_DETERMINISTIC.md"), "utf8");

const requiredMarkers = Object.freeze([
  "runtime_contract_version: v16_phase2g_route_scoped_cutover_through_phase5",
  "sole_material_profile_router: P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY",
  "route_id: ROUTE.PHASE5.ACTIVITY_PROFILE",
  "bucket_id: 2C_BUCKET_ACTIVITY_PROFILE",
  "lossless_evidence_role: PRIMARY_EVIDENCE",
  "index_role: MANDATORY_NAVIGATION_MAP_INTO_PRIMARY_EVIDENCE",
  "profile_forensics_inputs_allowed: false",
  "activity_profile_source_index",
  "feature_candidate_inventory",
  "active_run_package_manifest",
  "package_context_authority: active_run_package_manifest",
  "package_catalog_authority: references/domain-packages/package-catalog.v0.json",
  "fixed_ai_registry_key_universal_authority_forbidden: true",
  "fixed_ai_archetype_enum_forbidden: true",
  "fixed_ai_surface_enum_forbidden: true"
]);
for (const marker of requiredMarkers) assert.ok(binding.includes(marker), `AGENT3_RUNTIME_BINDING_PACKET.yaml missing marker: ${marker}`);
for (const rootName of ACTIVITY_PROFILE_SOURCE_ARTIFACT_NAMES) assert.ok(binding.includes(rootName), `Agent3 binding missing routed activity root ${rootName}`);

for (const forbidden of [
  "archetype_derivation_authority: AI_REGISTRY_KEY.md §4",
  "surface_derivation_authority: AI_REGISTRY_KEY.md §7",
  "allowed_archetype_codes:",
  "allowed_surface_context_tokens:",
  "AGENT3_BINDING_AI_REGISTRY_KEY_DIRECT_AUTHORITY"
]) assert.equal(binding.includes(forbidden), false, `binding still contains fixed AI taxonomy marker: ${forbidden}`);

for (const text of [binding, addendum, profilePrompt, candidatePrompt]) {
  assert.ok(text.includes("ROUTE.PHASE5.ACTIVITY_PROFILE"), "Phase 5 package file missing 2G route ID");
  assert.ok(text.includes("activity_profile_source_index"), "Phase 5 package file missing 2C navigation index");
  assert.ok(text.includes("primary") || text.includes("PRIMARY_EVIDENCE"), "Phase 5 package file missing primary evidence doctrine");
}
for (const marker of ["fixed universal AI archetype enum", "fixed universal AI surface enum"]) assert.ok(addendum.includes(marker), `03B package-aware addendum missing marker: ${marker}`);

const manifest = buildPhaseRoutingManifest({ runId: "CHECK-PHASE5", artifacts: presentPhase2Artifacts() }).phase_routing_manifest;
const inventoryPlan = buildPhaseRouteRuntimeReadPlan({ internalJobId: "M8_FEATURE_CANDIDATE_INVENTORY", phaseRoutingManifest: manifest });
const profilePlan = buildPhaseRouteRuntimeReadPlan({ internalJobId: "M8_TARGET_FEATURE_PROFILE", phaseRoutingManifest: manifest });
assert.equal(inventoryPlan.route_id, "ROUTE.PHASE5.ACTIVITY_PROFILE");
assert.equal(profilePlan.route_id, "ROUTE.PHASE5.ACTIVITY_PROFILE");
assert.deepEqual(inventoryPlan.required_index_artifacts, ["activity_profile_source_index"]);
assert.deepEqual(inventoryPlan.primary_lossless_evidence, ACTIVITY_PROFILE_SOURCE_ARTIFACT_NAMES);
assert.equal(inventoryPlan.artifact_reads.includes("feature_candidate_inventory"), false);
assert.equal(profilePlan.artifact_reads.includes("feature_candidate_inventory"), true);
assert.equal(inventoryPlan.artifact_reads.some((name) => name.includes("forensics")), false);
assert.equal(profilePlan.artifact_reads.some((name) => name.includes("forensics")), false);
assert.deepEqual(new Set(ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.deterministic_job.reads), new Set(["phase_routing_manifest", "phase_route_runtime_packet", ...inventoryPlan.artifact_reads]));
assert.deepEqual(new Set(ACTIVITY_PROFILE_REVIEW_CONTRACT.material_job.reads), new Set(["phase_routing_manifest", "phase_route_runtime_packet", ...profilePlan.artifact_reads]));
assert.equal(ACTIVITY_CANDIDATE_INVENTORY_RUNNER_STATUS.phase2g_route_scoped_runtime_reader_active, true);
assert.equal(ACTIVITY_PROFILE_REVIEW_RUNNER_STATUS.phase2g_route_scoped_runtime_reader_active, true);
assert.equal(ACTIVITY_CANDIDATE_INVENTORY_RUNNER_STATUS.profile_forensics_inputs_forbidden, true);
assert.equal(ACTIVITY_PROFILE_REVIEW_RUNNER_STATUS.profile_forensics_inputs_forbidden, true);

console.log(JSON.stringify({
  check: "activity-profile Phase 2G package binding",
  status: "PASS",
  enforced_gates: [
    "PHASE2G_2C_ROUTE_PLAN",
    "PRIMARY_ACTIVITY_LOSSLESS_EVIDENCE",
    "P2C_INDEX_NAVIGATION_MANDATORY",
    "JOB_SCOPED_CANDIDATE_INVENTORY",
    "NO_FORENSICS_INPUT",
    "ACTIVE_PACKAGE_CONTEXT_REQUIRED",
    "FIXED_AI_ENUMS_NOT_UNIVERSAL"
  ]
}, null, 2));

function presentPhase2Artifacts() {
  return {
    target_profile_source_index: {},
    domain_derivation_source_index: {},
    activity_profile_source_index: {},
    data_privacy_navigation_index: {},
    domain_control_obligation_navigation_index: {},
    legal_cartography_index: {},
    legal_signal_derivation_profile: {}
  };
}
