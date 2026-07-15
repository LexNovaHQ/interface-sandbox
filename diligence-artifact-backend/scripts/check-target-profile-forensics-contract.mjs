import assert from "node:assert/strict";
import { getPipelineContract } from "../src/runtime/contracts/pipeline.contract.js";
import { TARGET_PROFILE_FORENSICS_CONTRACT, TARGET_PROFILE_FORENSICS_RUNNER_STATUS, targetProfileForensicsReadArtifacts, targetProfileForensicsWriteArtifacts } from "../src/phases/04-target-profile-forensics/index.js";

const runtimeContract = getPipelineContract("M7_TARGET_PROFILE_FORENSICS");
const expectedReads = targetProfileForensicsReadArtifacts();
const expectedWrites = targetProfileForensicsWriteArtifacts();

assert.equal(TARGET_PROFILE_FORENSICS_CONTRACT.central_phase_id, "TARGET_PROFILE_FORENSICS");
assert.equal(TARGET_PROFILE_FORENSICS_CONTRACT.public_label, "Target Profile Forensics");
assert.equal(TARGET_PROFILE_FORENSICS_CONTRACT.compatibility_internal_job_id, "M7_TARGET_PROFILE_FORENSICS");
assert.equal(TARGET_PROFILE_FORENSICS_CONTRACT.implementation_status, "PHASE2G_DERIVED_ONLY_RUNTIME_CUTOVER");
assert.equal(TARGET_PROFILE_FORENSICS_CONTRACT.production_entrypoint_switched, true);
assert.equal(TARGET_PROFILE_FORENSICS_CONTRACT.model_usage, "NONE_DETERMINISTIC");
assert.equal(TARGET_PROFILE_FORENSICS_CONTRACT.route_contract.routing_authority, "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY");
assert.equal(TARGET_PROFILE_FORENSICS_CONTRACT.route_contract.route_id, "ROUTE.PHASE3A.TARGET_PROFILE");
assert.equal(TARGET_PROFILE_FORENSICS_CONTRACT.route_contract.bucket_id, "2A_BUCKET_TARGET_PROFILE");
assert.equal(TARGET_PROFILE_FORENSICS_CONTRACT.route_contract.delivery_mode, "DERIVED_ONLY");
assert.equal(TARGET_PROFILE_FORENSICS_CONTRACT.route_contract.source_bucket_delivered, false);
assert.equal(TARGET_PROFILE_FORENSICS_CONTRACT.route_contract.profile_forensics_inputs_forbidden, true);
assert.equal(TARGET_PROFILE_FORENSICS_CONTRACT.deterministic_job.validator, "target_profile_forensics_boundary_validator");
assert.equal(TARGET_PROFILE_FORENSICS_CONTRACT.deterministic_job.validator_scope, "forensic_trace_output_only");
assert.deepEqual(expectedWrites, ["target_profile_forensics"]);
assert.deepEqual(runtimeContract.reads, ["phase_routing_manifest"]);
assert.deepEqual(runtimeContract.writes, expectedWrites);
assert.equal(runtimeContract.central_phase_id, TARGET_PROFILE_FORENSICS_CONTRACT.central_phase_id);
assert.equal(runtimeContract.public_label, TARGET_PROFILE_FORENSICS_CONTRACT.public_label);
assert.equal(runtimeContract.route_delivery_mode, "DERIVED_ONLY");
assert.equal(runtimeContract.next, "M8_FEATURE_CANDIDATE_INVENTORY");

for (const forbidden of TARGET_PROFILE_FORENSICS_CONTRACT.forbidden_runtime_reads) {
  assert.equal(expectedReads.includes(forbidden), false, `Target Profile Forensics forbidden effective read: ${forbidden}`);
  assert.equal(runtimeContract.reads.includes(forbidden), false, `Target Profile Forensics forbidden central read: ${forbidden}`);
}

for (const requiredBranch of TARGET_PROFILE_FORENSICS_CONTRACT.output_contract.required_branches) {
  assert.equal(typeof requiredBranch, "string");
  assert.equal(requiredBranch.trim().length > 0, true);
}

assert.equal(TARGET_PROFILE_FORENSICS_RUNNER_STATUS.phase_owned_runner, true);
assert.equal(TARGET_PROFILE_FORENSICS_RUNNER_STATUS.production_entrypoint_switched, true);
assert.equal(TARGET_PROFILE_FORENSICS_RUNNER_STATUS.phase2g_route_scoped_runtime_reader_active, true);
assert.equal(TARGET_PROFILE_FORENSICS_RUNNER_STATUS.delivery_mode, "DERIVED_ONLY");
assert.equal(TARGET_PROFILE_FORENSICS_RUNNER_STATUS.source_bucket_delivered, false);
assert.equal(TARGET_PROFILE_FORENSICS_RUNNER_STATUS.profile_forensics_inputs_forbidden, true);
assert.equal(TARGET_PROFILE_FORENSICS_RUNNER_STATUS.routing_manifest_read, "phase_routing_manifest");
assert.deepEqual(TARGET_PROFILE_FORENSICS_RUNNER_STATUS.writes, expectedWrites);

console.log(JSON.stringify({ check: "Target Profile Forensics contract", status: "PASS", enforced_gates: ["PHASE2G_DERIVED_ONLY_RUNTIME_CUTOVER", "CENTRAL_READS_MANIFEST_ONLY", "EFFECTIVE_PACKET_CONTRACT_LOCKED", "FORENSIC_INPUTS_FORBIDDEN", "FORENSIC_TRACE_OUTPUT_ONLY"] }, null, 2));
