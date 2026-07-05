import assert from "node:assert/strict";
import { getPipelineContract } from "../src/runtime/contracts/pipeline.contract.js";
import { TARGET_PROFILE_FORENSICS_CONTRACT, TARGET_PROFILE_FORENSICS_RUNNER_STATUS, targetProfileForensicsReadArtifacts, targetProfileForensicsWriteArtifacts } from "../src/phases/04-target-profile-forensics/index.js";

const runtimeContract = getPipelineContract("M7_TARGET_PROFILE_FORENSICS");
const expectedReads = targetProfileForensicsReadArtifacts();
const expectedWrites = targetProfileForensicsWriteArtifacts();

assert.equal(TARGET_PROFILE_FORENSICS_CONTRACT.central_phase_id, "TARGET_PROFILE_FORENSICS");
assert.equal(TARGET_PROFILE_FORENSICS_CONTRACT.public_label, "Target Profile Forensics");
assert.equal(TARGET_PROFILE_FORENSICS_CONTRACT.compatibility_internal_job_id, "M7_TARGET_PROFILE_FORENSICS");
assert.equal(TARGET_PROFILE_FORENSICS_CONTRACT.implementation_status, "PHASE_RUNNER_CUTOVER_STAGED");
assert.equal(TARGET_PROFILE_FORENSICS_CONTRACT.production_entrypoint_switched, true);
assert.equal(TARGET_PROFILE_FORENSICS_CONTRACT.global_production_deployment_switched, false);
assert.equal(TARGET_PROFILE_FORENSICS_CONTRACT.model_usage, "NONE_DETERMINISTIC");
assert.equal(TARGET_PROFILE_FORENSICS_CONTRACT.deterministic_job.validator, "target_profile_forensics_boundary_validator");
assert.equal(TARGET_PROFILE_FORENSICS_CONTRACT.deterministic_job.validator_scope, "forensic_trace_output_only");
assert.deepEqual(expectedWrites, ["target_profile_forensics"]);
assert.deepEqual(runtimeContract.reads, expectedReads);
assert.deepEqual(runtimeContract.writes, expectedWrites);
assert.equal(runtimeContract.central_phase_id, TARGET_PROFILE_FORENSICS_CONTRACT.central_phase_id);
assert.equal(runtimeContract.public_label, TARGET_PROFILE_FORENSICS_CONTRACT.public_label);
assert.equal(runtimeContract.next, "M8_FEATURE_CANDIDATE_INVENTORY");

for (const forbidden of TARGET_PROFILE_FORENSICS_CONTRACT.forbidden_runtime_reads) {
  assert.equal(runtimeContract.reads.includes(forbidden), false, `Target Profile Forensics forbidden runtime read: ${forbidden}`);
}

for (const requiredBranch of TARGET_PROFILE_FORENSICS_CONTRACT.output_contract.required_branches) {
  assert.equal(typeof requiredBranch, "string");
  assert.equal(requiredBranch.trim().length > 0, true);
}

assert.equal(TARGET_PROFILE_FORENSICS_RUNNER_STATUS.phase_owned_runner, true);
assert.equal(TARGET_PROFILE_FORENSICS_RUNNER_STATUS.production_entrypoint_switched, true);
assert.equal(TARGET_PROFILE_FORENSICS_RUNNER_STATUS.global_production_deployment_switched, false);
assert.deepEqual(TARGET_PROFILE_FORENSICS_RUNNER_STATUS.reads, expectedReads);
assert.deepEqual(TARGET_PROFILE_FORENSICS_RUNNER_STATUS.writes, expectedWrites);

console.log("Target Profile Forensics contract: PASS");
