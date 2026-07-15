import assert from "node:assert/strict";
import {
  ACTIVITY_PROFILE_REVIEW_CONTRACT,
  ACTIVITY_PROFILE_REVIEW_RUNNER_STATUS,
  activityProfileReviewPromptFiles,
  activityProfileReviewReadArtifacts,
  activityProfileReviewReferenceFiles,
  activityProfileReviewWriteArtifacts
} from "../src/phases/05-activity-profile-review/index.js";

const expectedReads = activityProfileReviewReadArtifacts();
const expectedWrites = activityProfileReviewWriteArtifacts();
const expectedPrompts = activityProfileReviewPromptFiles();
const expectedReferences = activityProfileReviewReferenceFiles();

assert.equal(ACTIVITY_PROFILE_REVIEW_RUNNER_STATUS.phase_runner, "activity-profile-review.runner");
assert.equal(ACTIVITY_PROFILE_REVIEW_RUNNER_STATUS.central_phase_id, "ACTIVITY_PROFILE_REVIEW");
assert.equal(ACTIVITY_PROFILE_REVIEW_RUNNER_STATUS.phase_job_id, "ACTIVITY_PROFILE_REVIEW_MATERIAL");
assert.equal(ACTIVITY_PROFILE_REVIEW_RUNNER_STATUS.public_label, "Activity Profile Review");
assert.equal(ACTIVITY_PROFILE_REVIEW_RUNNER_STATUS.compatibility_internal_job_id, "M8_TARGET_FEATURE_PROFILE");
assert.equal(ACTIVITY_PROFILE_REVIEW_RUNNER_STATUS.phase_owned_runner, true);
assert.equal(ACTIVITY_PROFILE_REVIEW_RUNNER_STATUS.production_entrypoint_switched, true);
assert.equal(ACTIVITY_PROFILE_REVIEW_RUNNER_STATUS.global_production_deployment_switched, false);
assert.equal(ACTIVITY_PROFILE_REVIEW_RUNNER_STATUS.model_usage, "MODEL_JSON_ONLY");
assert.equal(ACTIVITY_PROFILE_REVIEW_RUNNER_STATUS.validator, "validateM8TargetFeatureOutput");
assert.equal(ACTIVITY_PROFILE_REVIEW_RUNNER_STATUS.validator_phase, "M8_TARGET_FEATURE_PROFILE");
assert.deepEqual(ACTIVITY_PROFILE_REVIEW_RUNNER_STATUS.reads, expectedReads);
assert.deepEqual(ACTIVITY_PROFILE_REVIEW_RUNNER_STATUS.writes, expectedWrites);
assert.deepEqual(ACTIVITY_PROFILE_REVIEW_CONTRACT.material_job.reads, expectedReads);
assert.deepEqual(ACTIVITY_PROFILE_REVIEW_CONTRACT.material_job.writes, expectedWrites);
assert.deepEqual(ACTIVITY_PROFILE_REVIEW_CONTRACT.material_job.prompt_files, expectedPrompts);
assert.deepEqual(ACTIVITY_PROFILE_REVIEW_CONTRACT.material_job.references, expectedReferences);
assert.equal(ACTIVITY_PROFILE_REVIEW_CONTRACT.production_entrypoint_switched, true);
assert.equal(ACTIVITY_PROFILE_REVIEW_CONTRACT.global_production_deployment_switched, false);

console.log("Activity Profile Review runner: PASS");
