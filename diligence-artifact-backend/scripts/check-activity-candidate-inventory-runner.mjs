import assert from "node:assert/strict";
import { ACTIVITY_CANDIDATE_INVENTORY_CONTRACT, ACTIVITY_CANDIDATE_INVENTORY_RUNNER_STATUS, activityCandidateInventoryReadArtifacts, activityCandidateInventoryWriteArtifacts } from "../src/phases/05-activity-profile-review/index.js";

const expectedReads = activityCandidateInventoryReadArtifacts();
const expectedWrites = activityCandidateInventoryWriteArtifacts();

assert.equal(ACTIVITY_CANDIDATE_INVENTORY_RUNNER_STATUS.phase_runner, "activity-candidate-inventory.runner");
assert.equal(ACTIVITY_CANDIDATE_INVENTORY_RUNNER_STATUS.central_phase_id, "ACTIVITY_PROFILE_REVIEW");
assert.equal(ACTIVITY_CANDIDATE_INVENTORY_RUNNER_STATUS.phase_job_id, "ACTIVITY_CANDIDATE_INVENTORY");
assert.equal(ACTIVITY_CANDIDATE_INVENTORY_RUNNER_STATUS.public_label, "Activity Candidate Inventory");
assert.equal(ACTIVITY_CANDIDATE_INVENTORY_RUNNER_STATUS.compatibility_internal_job_id, "M8_FEATURE_CANDIDATE_INVENTORY");
assert.equal(ACTIVITY_CANDIDATE_INVENTORY_RUNNER_STATUS.phase_owned_runner, true);
assert.equal(ACTIVITY_CANDIDATE_INVENTORY_RUNNER_STATUS.production_entrypoint_switched, true);
assert.equal(ACTIVITY_CANDIDATE_INVENTORY_RUNNER_STATUS.global_production_deployment_switched, false);
assert.equal(ACTIVITY_CANDIDATE_INVENTORY_RUNNER_STATUS.model_usage, "NONE_DETERMINISTIC");
assert.equal(ACTIVITY_CANDIDATE_INVENTORY_RUNNER_STATUS.source_helper, "buildFeatureCandidateInventoryIndex");
assert.equal(ACTIVITY_CANDIDATE_INVENTORY_RUNNER_STATUS.validator, "validateFeatureCandidateInventoryIndex");
assert.deepEqual(ACTIVITY_CANDIDATE_INVENTORY_RUNNER_STATUS.reads, expectedReads);
assert.deepEqual(ACTIVITY_CANDIDATE_INVENTORY_RUNNER_STATUS.writes, expectedWrites);
assert.deepEqual(ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.deterministic_job.reads, expectedReads);
assert.deepEqual(ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.deterministic_job.writes, expectedWrites);
assert.equal(ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.production_entrypoint_switched, true);
assert.equal(ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.global_production_deployment_switched, false);

console.log("Activity Candidate Inventory runner: PASS");
