import assert from "node:assert/strict";
import { getPipelineContract } from "../src/runtime/contracts/pipeline.contract.js";
import { ACTIVITY_PROFILE_FORENSICS_CONTRACT, ACTIVITY_PROFILE_FORENSICS_RUNNER_STATUS, activityProfileForensicsReadArtifacts, activityProfileForensicsWriteArtifacts } from "../src/phases/06-activity-profile-forensics/index.js";

const runtimeContract = getPipelineContract("M8_TARGET_FEATURE_PROFILE_FORENSICS");
const expectedEffectiveReads = activityProfileForensicsReadArtifacts();
const expectedWrites = activityProfileForensicsWriteArtifacts();

assert.equal(ACTIVITY_PROFILE_FORENSICS_CONTRACT.central_phase_id, "ACTIVITY_PROFILE_FORENSICS");
assert.equal(ACTIVITY_PROFILE_FORENSICS_CONTRACT.public_label, "Activity Profile Forensics");
assert.equal(ACTIVITY_PROFILE_FORENSICS_CONTRACT.compatibility_internal_job_id, "M8_TARGET_FEATURE_PROFILE_FORENSICS");
assert.equal(ACTIVITY_PROFILE_FORENSICS_CONTRACT.implementation_status, "PHASE2G_DERIVED_ONLY_RUNTIME_CUTOVER");
assert.equal(ACTIVITY_PROFILE_FORENSICS_CONTRACT.production_entrypoint_switched, true);
assert.equal(ACTIVITY_PROFILE_FORENSICS_CONTRACT.global_production_deployment_switched, false);
assert.equal(ACTIVITY_PROFILE_FORENSICS_CONTRACT.model_usage, "NONE_DETERMINISTIC");
assert.equal(ACTIVITY_PROFILE_FORENSICS_CONTRACT.deterministic_job.validator, "activity_profile_forensics_boundary_validator");
assert.equal(ACTIVITY_PROFILE_FORENSICS_CONTRACT.deterministic_job.validator_scope, "forensic_trace_output_only");
assert.deepEqual(expectedWrites, ["target_feature_profile_forensics"]);
assert.deepEqual(runtimeContract.reads, ["phase_routing_manifest"]);
assert.deepEqual(runtimeContract.writes, expectedWrites);
assert.equal(runtimeContract.central_phase_id, ACTIVITY_PROFILE_FORENSICS_CONTRACT.central_phase_id);
assert.equal(runtimeContract.public_label, ACTIVITY_PROFILE_FORENSICS_CONTRACT.public_label);
assert.equal(runtimeContract.next, "M10");
assert.deepEqual(expectedEffectiveReads, [
  "phase_routing_manifest",
  "phase_route_runtime_packet",
  "activity_profile_source_index",
  "target_profile",
  "domain_derivation_profile",
  "feature_candidate_inventory",
  "target_feature_profile"
]);

for (const forbidden of ACTIVITY_PROFILE_FORENSICS_CONTRACT.forbidden_runtime_reads) {
  assert.equal(expectedEffectiveReads.includes(forbidden), false, `Activity Profile Forensics unexpected effective runtime read: ${forbidden}`);
}

for (const requiredBranch of ACTIVITY_PROFILE_FORENSICS_CONTRACT.output_contract.required_branches) {
  assert.equal(typeof requiredBranch, "string");
  assert.equal(requiredBranch.trim().length > 0, true);
}

assert.equal(ACTIVITY_PROFILE_FORENSICS_RUNNER_STATUS.phase_owned_runner, true);
assert.equal(ACTIVITY_PROFILE_FORENSICS_RUNNER_STATUS.production_entrypoint_switched, true);
assert.equal(ACTIVITY_PROFILE_FORENSICS_RUNNER_STATUS.global_production_deployment_switched, false);
assert.equal(ACTIVITY_PROFILE_FORENSICS_RUNNER_STATUS.phase2g_route_scoped_runtime_reader_active, true);
assert.equal(ACTIVITY_PROFILE_FORENSICS_RUNNER_STATUS.delivery_mode, "DERIVED_ONLY");
assert.equal(ACTIVITY_PROFILE_FORENSICS_RUNNER_STATUS.source_bucket_delivered, false);
assert.equal(ACTIVITY_PROFILE_FORENSICS_RUNNER_STATUS.routing_manifest_read, "phase_routing_manifest");
assert.deepEqual(ACTIVITY_PROFILE_FORENSICS_RUNNER_STATUS.writes, expectedWrites);

console.log("Activity Profile Forensics contract: PASS");
