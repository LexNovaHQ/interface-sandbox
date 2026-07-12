import assert from "node:assert/strict";
import {
  PIPELINE_CONTRACTS,
  PIPELINE_CONTRACT_STATUS
} from "../src/runtime/contracts/pipeline.contract.js";
import {
  TARGET_PROFILE_SOURCE_ARTIFACT_NAMES,
  DOMAIN_DERIVATION_SOURCE_ROOT_ARTIFACT_NAMES,
  ACTIVITY_PROFILE_SOURCE_ARTIFACT_NAMES,
  DATA_PROVENANCE_SOURCE_ARTIFACT_NAMES,
  LEGAL_GOVERNANCE_SOURCE_ARTIFACT_NAMES,
  PHASE7_DAP_LAYER4_ARTIFACT_NAMES,
  PHASE7_DAP_LAYER5_ARTIFACT_NAMES
} from "../src/runtime/contracts/artifact-permissions.contract.js";
import {
  P2G_ROUTE_BUCKETS,
  P2G_SOURCE_BUCKET_DELIVERY_MODE,
  P2G_DERIVED_ONLY_DELIVERY_MODE,
  P2G_DYNAMIC_M11_BATCH_INPUT
} from "../src/phases/02-cartography-index/phase-routing.contract.js";
import { buildPhaseRoutingManifest } from "../src/phases/02-cartography-index/services/phase-routing-manifest.builder.js";
import {
  P2G_RUNTIME_ROUTE_BY_JOB,
  P2G_PHASE_ROUTE_RUNTIME_READER_STATUS,
  buildPhaseRouteRuntimeReadPlan
} from "../src/phases/02-cartography-index/services/phase-route-runtime.reader.js";
import { TARGET_PROFILE_REVIEW_CONTRACT } from "../src/phases/03-target-profile-review/target-profile-review.contract.js";
import { DOMAIN_DERIVATION_CONTRACT } from "../src/phases/03-domain-derivation/domain-derivation.contract.js";
import { TARGET_PROFILE_FORENSICS_CONTRACT } from "../src/phases/04-target-profile-forensics/target-profile-forensics.contract.js";
import { ACTIVITY_CANDIDATE_INVENTORY_CONTRACT } from "../src/phases/05-activity-profile-review/activity-candidate-inventory.contract.js";
import { ACTIVITY_PROFILE_REVIEW_CONTRACT } from "../src/phases/05-activity-profile-review/activity-profile-review.contract.js";
import { ACTIVITY_PROFILE_FORENSICS_CONTRACT } from "../src/phases/06-activity-profile-forensics/activity-profile-forensics.contract.js";
import { PHASE7_DATA_PRIVACY_ARCHITECTURE_CONTRACT } from "../src/phases/07-data-provenance-profile/data-provenance-profile.contract.js";
import { DAP_FORENSICS_CONTRACT } from "../src/phases/09-data-provenance-forensics/dap-forensics.contract.js";
import { M11_PHASE2G_RUNTIME_STATUS } from "../src/m11-orchestrator-m11v2.js";
import { M12_PHASE2G_RUNNER_STATUS } from "../src/m12-phase2g.runner.js";
import { COMPILER_PHASE2G_RUNNER_STATUS } from "../src/compiler-phase2g.runner.js";

const SOURCE_JOBS = Object.freeze([
  "M7_TARGET_PROFILE",
  "P3_DOMAIN_DERIVATION_LAYER",
  "M8_FEATURE_CANDIDATE_INVENTORY",
  "M8_TARGET_FEATURE_PROFILE",
  "DATA_PROVENANCE_PROFILE_LAYER4",
  "M11"
]);
const DERIVED_ONLY_JOBS = Object.freeze([
  "M7_TARGET_PROFILE_FORENSICS",
  "M8_TARGET_FEATURE_PROFILE_FORENSICS",
  "DATA_PROVENANCE_PROFILE_FORENSICS",
  "M12",
  "NORMALIZED_COMPILER"
]);
const CUTOVER_JOBS = Object.freeze([
  "M7_TARGET_PROFILE",
  "P3_DOMAIN_DERIVATION_LAYER",
  "M7_TARGET_PROFILE_FORENSICS",
  "M8_FEATURE_CANDIDATE_INVENTORY",
  "M8_TARGET_FEATURE_PROFILE",
  "M8_TARGET_FEATURE_PROFILE_FORENSICS",
  "DATA_PROVENANCE_PROFILE_LAYER4",
  "DATA_PROVENANCE_PROFILE_FORENSICS",
  "M11",
  "M12",
  "NORMALIZED_COMPILER"
]);
const ROUTE_NEUTRAL_JOBS = Object.freeze(["DATA_PROVENANCE_PROFILE_LAYER5"]);
const FORENSIC_INPUTS = Object.freeze(["target_profile_forensics", "target_feature_profile_forensics", "dap_forensics_profile", "exposure_registry_profile_forensics"]);

assert.deepEqual(Object.keys(P2G_RUNTIME_ROUTE_BY_JOB), CUTOVER_JOBS);
assert.deepEqual(P2G_PHASE_ROUTE_RUNTIME_READER_STATUS.cutover_jobs, CUTOVER_JOBS);
assert.equal(P2G_PHASE_ROUTE_RUNTIME_READER_STATUS.route_scoped_runtime_reader_active, true);
assert.equal(P2G_PHASE_ROUTE_RUNTIME_READER_STATUS.sparse_lossless_root_resolution_owned_by_2g, true);
assert.equal(P2G_PHASE_ROUTE_RUNTIME_READER_STATUS.derived_only_jobs_receive_exact_job_scope_only, true);
assert.equal(P2G_PHASE_ROUTE_RUNTIME_READER_STATUS.profile_forensics_inputs_forbidden, true);
assert.equal(PIPELINE_CONTRACT_STATUS.phase2g_runtime_cutover_complete_through_compiler, true);
assert.equal(PIPELINE_CONTRACT_STATUS.phase2g_no_shadow_downstream_read_arrays, true);
for (const job of CUTOVER_JOBS) assert.deepEqual(PIPELINE_CONTRACTS[job].reads, ["phase_routing_manifest"], `${job} central contract retains shadow reads`);
for (const job of ROUTE_NEUTRAL_JOBS) assert.equal(Object.prototype.hasOwnProperty.call(P2G_RUNTIME_ROUTE_BY_JOB, job), false, `${job} must remain route-neutral`);
assert.equal(PIPELINE_CONTRACTS.DATA_PROVENANCE_PROFILE_LAYER5.reads.includes("phase_routing_manifest"), false);

const manifest = buildPhaseRoutingManifest({ runId: "CHECK-P2G-CUTOVER-THROUGH-COMPILER", artifacts: presentPhase2Artifacts() }).phase_routing_manifest;
const plans = Object.fromEntries(CUTOVER_JOBS.map((job) => [job, buildPhaseRouteRuntimeReadPlan({ internalJobId: job, phaseRoutingManifest: manifest })]));

assertSourcePlan(plans.M7_TARGET_PROFILE, "ROUTE.PHASE3A.TARGET_PROFILE", "2A_BUCKET_TARGET_PROFILE", ["target_profile_source_index"], TARGET_PROFILE_SOURCE_ARTIFACT_NAMES);
assertSourcePlan(plans.P3_DOMAIN_DERIVATION_LAYER, "ROUTE.PHASE3B.DOMAIN_DERIVATION", "2B_BUCKET_DOMAIN_DERIVATION", ["domain_derivation_source_index"], DOMAIN_DERIVATION_SOURCE_ROOT_ARTIFACT_NAMES);
assertDerivedPlan(plans.M7_TARGET_PROFILE_FORENSICS, "ROUTE.PHASE3A.TARGET_PROFILE", ["target_profile_source_index", "legal_signal_derivation_profile", "target_profile", "domain_derivation_profile"]);
assertSourcePlan(plans.M8_FEATURE_CANDIDATE_INVENTORY, "ROUTE.PHASE5.ACTIVITY_PROFILE", "2C_BUCKET_ACTIVITY_PROFILE", ["activity_profile_source_index"], ACTIVITY_PROFILE_SOURCE_ARTIFACT_NAMES);
assertSourcePlan(plans.M8_TARGET_FEATURE_PROFILE, "ROUTE.PHASE5.ACTIVITY_PROFILE", "2C_BUCKET_ACTIVITY_PROFILE", ["activity_profile_source_index"], ACTIVITY_PROFILE_SOURCE_ARTIFACT_NAMES);
assertDerivedPlan(plans.M8_TARGET_FEATURE_PROFILE_FORENSICS, "ROUTE.PHASE5.ACTIVITY_PROFILE", ["activity_profile_source_index", "target_profile", "domain_derivation_profile", "feature_candidate_inventory", "target_feature_profile"]);
assertSourcePlan(plans.DATA_PROVENANCE_PROFILE_LAYER4, "ROUTE.PHASE7.DATA_PROVENANCE_PROFILE", "2D_BUCKET_DATA_PRIVACY", ["data_privacy_navigation_index"], DATA_PROVENANCE_SOURCE_ARTIFACT_NAMES);
assertDerivedPlan(plans.DATA_PROVENANCE_PROFILE_FORENSICS, "ROUTE.PHASE7.DATA_PROVENANCE_PROFILE", ["data_privacy_navigation_index", ...PHASE7_DAP_LAYER4_ARTIFACT_NAMES, ...PHASE7_DAP_LAYER5_ARTIFACT_NAMES]);
assertSourcePlan(plans.M11, "ROUTE.PHASE10.EXPOSURE_PROFILE", "2F_BUCKET_LEGAL_CARTOGRAPHY_LEGAL_SIGNALS", ["legal_cartography_index", "legal_signal_derivation_profile"], LEGAL_GOVERNANCE_SOURCE_ARTIFACT_NAMES);
assertDerivedPlan(plans.M12, "ROUTE.PHASE10.EXPOSURE_PROFILE", ["legal_cartography_index", "legal_signal_derivation_profile", "target_profile", "domain_derivation_profile", "feature_candidate_inventory", "target_feature_profile", ...PHASE7_DAP_LAYER4_ARTIFACT_NAMES, ...PHASE7_DAP_LAYER5_ARTIFACT_NAMES, "exposure_registry_route_plan", "exposure_registry_workpad_98", "exposure_registry_controlled_profile", "exposure_registry_triggered_profile"], [P2G_DYNAMIC_M11_BATCH_INPUT]);
assertDerivedPlan(plans.NORMALIZED_COMPILER, "ROUTE.PHASE10.EXPOSURE_PROFILE", ["legal_cartography_index", "legal_signal_derivation_profile", "target_profile", "domain_derivation_profile", "feature_candidate_inventory", "target_feature_profile", ...PHASE7_DAP_LAYER4_ARTIFACT_NAMES, ...PHASE7_DAP_LAYER5_ARTIFACT_NAMES, "exposure_registry_route_plan", "exposure_registry_workpad_98", "exposure_registry_controlled_profile", "exposure_registry_triggered_profile", "challenge_gate"], [P2G_DYNAMIC_M11_BATCH_INPUT]);

assertEffectiveContract(TARGET_PROFILE_REVIEW_CONTRACT.material_job.reads, plans.M7_TARGET_PROFILE, "3A");
assertEffectiveContract(DOMAIN_DERIVATION_CONTRACT.reads, plans.P3_DOMAIN_DERIVATION_LAYER, "3B");
assertEffectiveContract(TARGET_PROFILE_FORENSICS_CONTRACT.deterministic_job.reads, plans.M7_TARGET_PROFILE_FORENSICS, "Target forensics");
assertEffectiveContract(ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.deterministic_job.reads, plans.M8_FEATURE_CANDIDATE_INVENTORY, "Phase5 inventory");
assertEffectiveContract(ACTIVITY_PROFILE_REVIEW_CONTRACT.material_job.reads, plans.M8_TARGET_FEATURE_PROFILE, "Phase5 material");
assertEffectiveContract(ACTIVITY_PROFILE_FORENSICS_CONTRACT.deterministic_job.reads, plans.M8_TARGET_FEATURE_PROFILE_FORENSICS, "Activity forensics");
assert.deepEqual(new Set(PHASE7_DATA_PRIVACY_ARCHITECTURE_CONTRACT.approved_input_universe), new Set(["phase_routing_manifest", "phase_route_runtime_packet", ...plans.DATA_PROVENANCE_PROFILE_LAYER4.artifact_reads]));
assertEffectiveContract(DAP_FORENSICS_CONTRACT.deterministic_job.reads, plans.DATA_PROVENANCE_PROFILE_FORENSICS, "DAP forensics");

assert.equal(M11_PHASE2G_RUNTIME_STATUS.route_id, "ROUTE.PHASE10.EXPOSURE_PROFILE");
assert.equal(M11_PHASE2G_RUNTIME_STATUS.delivery_mode, P2G_SOURCE_BUCKET_DELIVERY_MODE);
assert.equal(M12_PHASE2G_RUNNER_STATUS.delivery_mode, P2G_DERIVED_ONLY_DELIVERY_MODE);
assert.equal(COMPILER_PHASE2G_RUNNER_STATUS.delivery_mode, P2G_DERIVED_ONLY_DELIVERY_MODE);
for (const job of SOURCE_JOBS) assert.equal(plans[job].delivery_mode, P2G_SOURCE_BUCKET_DELIVERY_MODE);
for (const job of DERIVED_ONLY_JOBS) assert.equal(plans[job].delivery_mode, P2G_DERIVED_ONLY_DELIVERY_MODE);
for (const plan of Object.values(plans)) for (const forensic of FORENSIC_INPUTS) assert.equal(plan.artifact_reads.includes(forensic), false, `${plan.internal_job_id} includes forensic input ${forensic}`);

assert.equal(P2G_ROUTE_BUCKETS.length, 6);
console.log(JSON.stringify({
  check: "Phase 2G runtime cutover through compiler",
  status: "PASS",
  source_bucket_jobs: SOURCE_JOBS,
  derived_only_jobs: DERIVED_ONLY_JOBS,
  route_neutral_jobs: ROUTE_NEUTRAL_JOBS,
  enforced_gates: [
    "SIX_BUCKETS_ONLY",
    "ROUTE_SCOPED_RUNTIME_READER",
    "SPARSE_LOSSLESS_ROOT_RESOLUTION_OWNED_BY_2G",
    "PROFILE_JOBS_RECEIVE_PRIMARY_BUCKET",
    "FORENSICS_CHALLENGE_COMPILER_DERIVED_ONLY",
    "2F_FORWARD_TO_M11",
    "M12_COMPILER_DYNAMIC_M11_BATCH_ROUTING",
    "NO_SHADOW_CENTRAL_READ_ARRAYS",
    "NO_FORENSIC_INPUT_PROPAGATION"
  ]
}, null, 2));

function assertSourcePlan(plan, routeId, bucketId, indexes, roots) {
  assert.equal(plan.route_id, routeId);
  assert.equal(plan.bucket_id, bucketId);
  assert.equal(plan.delivery_mode, P2G_SOURCE_BUCKET_DELIVERY_MODE);
  assert.deepEqual(plan.required_index_artifacts, indexes);
  assert.deepEqual(plan.primary_lossless_evidence, roots);
  assert.equal(plan.router_artifact_reads.length > 0, true);
}
function assertDerivedPlan(plan, routeId, exactReads, dynamicInputs = []) {
  assert.equal(plan.route_id, routeId);
  assert.equal(plan.delivery_mode, P2G_DERIVED_ONLY_DELIVERY_MODE);
  assert.deepEqual(plan.router_artifact_reads, []);
  assert.deepEqual(new Set(plan.artifact_reads), new Set(exactReads));
  assert.deepEqual(plan.dynamic_inputs, dynamicInputs);
  assert.deepEqual(plan.allowed_runtime_context, []);
}
function assertEffectiveContract(reads, plan, label) {
  assert.deepEqual(new Set(reads), new Set(["phase_routing_manifest", "phase_route_runtime_packet", ...plan.artifact_reads]), `${label} effective routed contract mismatch`);
}
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
