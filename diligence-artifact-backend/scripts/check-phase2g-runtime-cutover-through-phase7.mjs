import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { PIPELINE_CONTRACTS } from "../src/runtime/contracts/pipeline.contract.js";
import {
  TARGET_PROFILE_SOURCE_ARTIFACT_NAMES,
  DOMAIN_DERIVATION_SOURCE_ROOT_ARTIFACT_NAMES,
  ACTIVITY_PROFILE_SOURCE_ARTIFACT_NAMES,
  DATA_PROVENANCE_SOURCE_ARTIFACT_NAMES
} from "../src/runtime/contracts/artifact-permissions.contract.js";
import { P2G_ROUTE_BUCKETS } from "../src/phases/02-cartography-index/phase-routing.contract.js";
import { buildPhaseRoutingManifest } from "../src/phases/02-cartography-index/services/phase-routing-manifest.builder.js";
import { P2G_RUNTIME_ROUTE_BY_JOB, P2G_PHASE_ROUTE_RUNTIME_READER_STATUS, buildPhaseRouteRuntimeReadPlan } from "../src/phases/02-cartography-index/services/phase-route-runtime.reader.js";
import { TARGET_PROFILE_REVIEW_CONTRACT } from "../src/phases/03-target-profile-review/target-profile-review.contract.js";
import { TARGET_PROFILE_REVIEW_RUNNER_STATUS } from "../src/phases/03-target-profile-review/target-profile-review.runner.js";
import { DOMAIN_DERIVATION_CONTRACT } from "../src/phases/03-domain-derivation/domain-derivation.contract.js";
import { DOMAIN_DERIVATION_RUNNER_STATUS } from "../src/phases/03-domain-derivation/domain-derivation.runner.js";
import { ACTIVITY_CANDIDATE_INVENTORY_CONTRACT } from "../src/phases/05-activity-profile-review/activity-candidate-inventory.contract.js";
import { ACTIVITY_CANDIDATE_INVENTORY_RUNNER_STATUS } from "../src/phases/05-activity-profile-review/activity-candidate-inventory.runner.js";
import { ACTIVITY_PROFILE_REVIEW_CONTRACT } from "../src/phases/05-activity-profile-review/activity-profile-review.contract.js";
import { ACTIVITY_PROFILE_REVIEW_RUNNER_STATUS } from "../src/phases/05-activity-profile-review/activity-profile-review.runner.js";
import { PHASE7_DATA_PRIVACY_ARCHITECTURE_CONTRACT, PHASE7_DATA_PRIVACY_LOSSLESS_READS } from "../src/phases/07-data-provenance-profile/data-provenance-profile.contract.js";

const CUTOVER_JOBS = Object.freeze([
  "M7_TARGET_PROFILE",
  "P3_DOMAIN_DERIVATION_LAYER",
  "M8_FEATURE_CANDIDATE_INVENTORY",
  "M8_TARGET_FEATURE_PROFILE",
  "DATA_PROVENANCE_PROFILE_LAYER4"
]);
const ROUTE_NEUTRAL_JOBS = Object.freeze(["DATA_PROVENANCE_PROFILE_LAYER5"]);
const DEFERRED_JOBS = Object.freeze([
  "DATA_PROVENANCE_PROFILE_FORENSICS",
  "M11",
  "M12",
  "NORMALIZED_COMPILER"
]);

assert.deepEqual(Object.keys(P2G_RUNTIME_ROUTE_BY_JOB), CUTOVER_JOBS);
assert.deepEqual(P2G_PHASE_ROUTE_RUNTIME_READER_STATUS.cutover_jobs, CUTOVER_JOBS);
assert.equal(P2G_PHASE_ROUTE_RUNTIME_READER_STATUS.route_scoped_runtime_reader_active, true);
assert.equal(P2G_PHASE_ROUTE_RUNTIME_READER_STATUS.lossless_evidence_is_primary, true);
assert.equal(P2G_PHASE_ROUTE_RUNTIME_READER_STATUS.index_navigation_mandatory, true);
assert.equal(P2G_PHASE_ROUTE_RUNTIME_READER_STATUS.profile_forensics_inputs_forbidden, true);
for (const job of [...ROUTE_NEUTRAL_JOBS, ...DEFERRED_JOBS]) assert.equal(Object.prototype.hasOwnProperty.call(P2G_RUNTIME_ROUTE_BY_JOB, job), false, `${job} must not use the source-bucket reader in this cutover`);
assert.deepEqual(PIPELINE_CONTRACTS.DATA_PROVENANCE_PROFILE_LAYER5.reads, ["dap_semantic_batch_route_manifest", ...PIPELINE_CONTRACTS.DATA_PROVENANCE_PROFILE_LAYER5.reads.slice(1)]);
assert.equal(PIPELINE_CONTRACTS.DATA_PROVENANCE_PROFILE_LAYER5.reads.includes("phase_routing_manifest"), false, "Phase 7 Layer 5 is route-neutral and must read only Layer 4 outputs");

const manifest = buildPhaseRoutingManifest({ runId: "CHECK-P2G-CUTOVER-THROUGH-P7", artifacts: presentPhase2Artifacts() }).phase_routing_manifest;
const plans = Object.fromEntries(CUTOVER_JOBS.map((job) => [job, buildPhaseRouteRuntimeReadPlan({ internalJobId: job, phaseRoutingManifest: manifest })]));

assertPlan(plans.M7_TARGET_PROFILE, {
  routeId: "ROUTE.PHASE3A.TARGET_PROFILE",
  bucketId: "2A_BUCKET_TARGET_PROFILE",
  index: "target_profile_source_index",
  roots: TARGET_PROFILE_SOURCE_ARTIFACT_NAMES,
  profiles: [],
  legal: ["legal_signal_derivation_profile"]
});
assertPlan(plans.P3_DOMAIN_DERIVATION_LAYER, {
  routeId: "ROUTE.PHASE3B.DOMAIN_DERIVATION",
  bucketId: "2B_BUCKET_DOMAIN_DERIVATION",
  index: "domain_derivation_source_index",
  roots: DOMAIN_DERIVATION_SOURCE_ROOT_ARTIFACT_NAMES,
  profiles: ["target_profile"],
  context: ["domain_selection_profile", "active_run_package_manifest"]
});
assertPlan(plans.M8_FEATURE_CANDIDATE_INVENTORY, {
  routeId: "ROUTE.PHASE5.ACTIVITY_PROFILE",
  bucketId: "2C_BUCKET_ACTIVITY_PROFILE",
  index: "activity_profile_source_index",
  roots: ACTIVITY_PROFILE_SOURCE_ARTIFACT_NAMES,
  profiles: ["target_profile", "domain_derivation_profile"],
  context: ["domain_selection_profile", "active_run_package_manifest"]
});
assertPlan(plans.M8_TARGET_FEATURE_PROFILE, {
  routeId: "ROUTE.PHASE5.ACTIVITY_PROFILE",
  bucketId: "2C_BUCKET_ACTIVITY_PROFILE",
  index: "activity_profile_source_index",
  roots: ACTIVITY_PROFILE_SOURCE_ARTIFACT_NAMES,
  profiles: ["target_profile", "domain_derivation_profile", "feature_candidate_inventory"],
  context: ["domain_selection_profile", "active_run_package_manifest"]
});
assertPlan(plans.DATA_PROVENANCE_PROFILE_LAYER4, {
  routeId: "ROUTE.PHASE7.DATA_PROVENANCE_PROFILE",
  bucketId: "2D_BUCKET_DATA_PRIVACY",
  index: "data_privacy_navigation_index",
  roots: DATA_PROVENANCE_SOURCE_ARTIFACT_NAMES,
  profiles: ["target_profile", "domain_derivation_profile", "feature_candidate_inventory", "target_feature_profile"],
  context: ["domain_selection_profile", "active_run_package_manifest"],
  legal: ["legal_cartography_index", "legal_signal_derivation_profile"]
});

assertContractMatchesPlan(TARGET_PROFILE_REVIEW_CONTRACT.material_job.reads, plans.M7_TARGET_PROFILE, "3A");
assertContractMatchesPlan(DOMAIN_DERIVATION_CONTRACT.reads, plans.P3_DOMAIN_DERIVATION_LAYER, "3B");
assertContractMatchesPlan(ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.deterministic_job.reads, plans.M8_FEATURE_CANDIDATE_INVENTORY, "Phase5 inventory");
assertContractMatchesPlan(ACTIVITY_PROFILE_REVIEW_CONTRACT.material_job.reads, plans.M8_TARGET_FEATURE_PROFILE, "Phase5 material");
assert.deepEqual(new Set(PHASE7_DATA_PRIVACY_ARCHITECTURE_CONTRACT.approved_input_universe), new Set(["phase_routing_manifest", "phase_route_runtime_packet", ...plans.DATA_PROVENANCE_PROFILE_LAYER4.artifact_reads]));
assert.deepEqual(PHASE7_DATA_PRIVACY_LOSSLESS_READS, DATA_PROVENANCE_SOURCE_ARTIFACT_NAMES);

for (const runnerStatus of [TARGET_PROFILE_REVIEW_RUNNER_STATUS, DOMAIN_DERIVATION_RUNNER_STATUS, ACTIVITY_CANDIDATE_INVENTORY_RUNNER_STATUS, ACTIVITY_PROFILE_REVIEW_RUNNER_STATUS]) {
  assert.equal(runnerStatus.phase2g_route_scoped_runtime_reader_active, true);
  assert.equal(runnerStatus.profile_forensics_inputs_forbidden, true);
}
assert.equal(PHASE7_DATA_PRIVACY_ARCHITECTURE_CONTRACT.navigation_rules.phase2g_is_only_runtime_routing_authority, true);
assert.equal(PHASE7_DATA_PRIVACY_ARCHITECTURE_CONTRACT.navigation_rules.profile_forensics_inputs_forbidden, true);

for (const job of CUTOVER_JOBS) assert.ok(PIPELINE_CONTRACTS[job].reads.includes("phase_routing_manifest"), `${job} central wrapper must expose phase_routing_manifest`);
for (const contractReads of [
  TARGET_PROFILE_REVIEW_CONTRACT.material_job.reads,
  DOMAIN_DERIVATION_CONTRACT.reads,
  ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.deterministic_job.reads,
  ACTIVITY_PROFILE_REVIEW_CONTRACT.material_job.reads,
  PHASE7_DATA_PRIVACY_ARCHITECTURE_CONTRACT.approved_input_universe
]) for (const forbidden of ["target_profile_forensics", "target_feature_profile_forensics", "dap_forensics_profile", "exposure_registry_profile_forensics"]) assert.equal(contractReads.includes(forbidden), false, `cutover contract contains forensic input ${forbidden}`);

const phase7Binding = fs.readFileSync(path.join(process.cwd(), "agent-packages/agent_4_data_privacy/AGENT4_PHASE7_LAYER4_RUNTIME_BINDING_PACKET.yaml"), "utf8");
const phase7Prompt = fs.readFileSync(path.join(process.cwd(), "agent-packages/agent_4_data_privacy/PHASE7_LAYER4_DAP_SEMANTIC_BATCH_RUNNER.md"), "utf8");
for (const marker of ["P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY", "ROUTE.PHASE7.DATA_PROVENANCE_PROFILE", "2D_BUCKET_DATA_PRIVACY", "PRIMARY_EVIDENCE", "MANDATORY_NAVIGATION_MAP_INTO_PRIMARY_EVIDENCE"]) assert.ok(`${phase7Binding}\n${phase7Prompt}`.includes(marker), `Phase 7 package missing ${marker}`);
for (const forbidden of ["target_profile_forensics", "target_feature_profile_forensics", "lossless_family__D1_SECURITY_TRUST", "lossless_family__D2_SUBPROCESSOR_PRIVACY_CENTER"]) {
  const activeReadBlock = phase7Binding.split("read_artifacts:")[1]?.split("forbidden_read_artifacts:")[0] || "";
  assert.equal(activeReadBlock.includes(forbidden), false, `Phase 7 active read block contains ${forbidden}`);
}

assert.equal(P2G_ROUTE_BUCKETS.length, 6);
console.log(JSON.stringify({ check: "Phase 2G runtime cutover through Phase 7", status: "PASS", cutover_jobs: CUTOVER_JOBS, route_neutral_jobs: ROUTE_NEUTRAL_JOBS, deferred_jobs: DEFERRED_JOBS, enforced_gates: ["ROUTE_SCOPED_RUNTIME_READER", "3A_2A_CUTOVER", "3B_2B_CUTOVER", "PHASE5_2C_CUTOVER", "PHASE7_2D_CUTOVER", "PHASE7_LAYER5_ROUTE_NEUTRAL", "PRIMARY_LOSSLESS_EVIDENCE", "MANDATORY_INDEX_NAVIGATION", "NO_PROFILE_FORENSICS_INPUT", "PHASE8_PLUS_DEFERRED"] }, null, 2));

function assertPlan(plan, { routeId, bucketId, index, roots, profiles = [], context = [], legal = [] }) {
  assert.equal(plan.route_id, routeId);
  assert.equal(plan.bucket_id, bucketId);
  assert.deepEqual(plan.required_index_artifacts, [index]);
  assert.deepEqual(plan.primary_lossless_evidence, roots);
  assert.deepEqual(plan.allowed_runtime_context, context);
  assert.deepEqual(plan.allowed_legal_artifacts, legal);
  assert.deepEqual(new Set([...plan.allowed_preceding_derived_profiles, ...plan.job_scoped_derived_profiles]), new Set(profiles));
  assert.equal(plan.artifact_reads.some((name) => String(name).includes("forensics")), false);
}

function assertContractMatchesPlan(reads, plan, label) {
  assert.deepEqual(new Set(reads), new Set(["phase_routing_manifest", "phase_route_runtime_packet", ...plan.artifact_reads]), `${label} routed contract mismatch`);
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
