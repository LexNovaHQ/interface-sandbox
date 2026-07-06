import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPipelineContract, PIPELINE_CONTRACT_STATUS } from "../src/runtime/contracts/pipeline.contract.js";
import {
  ACTIVITY_PROFILE_REVIEW_CONTRACT,
  ACTIVITY_PROFILE_REVIEW_RUNNER_STATUS,
  activityProfileReviewPromptFiles,
  activityProfileReviewReadArtifacts,
  activityProfileReviewReferenceFiles,
  activityProfileReviewWriteArtifacts
} from "../src/phases/05-activity-profile-review/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");
const pipelineSource = read("src/runtime/services/pipeline.service.js");
const contractSource = read("src/runtime/contracts/pipeline.contract.js");
const runtimeContract = getPipelineContract("M8_TARGET_FEATURE_PROFILE");
const expectedReads = activityProfileReviewReadArtifacts();
const expectedWrites = activityProfileReviewWriteArtifacts();
const expectedPrompts = activityProfileReviewPromptFiles();
const expectedReferences = activityProfileReviewReferenceFiles();

assert.equal(ACTIVITY_PROFILE_REVIEW_CONTRACT.implementation_status, "PHASE_RUNNER_CUTOVER_STAGED");
assert.equal(ACTIVITY_PROFILE_REVIEW_CONTRACT.production_entrypoint_switched, true);
assert.equal(ACTIVITY_PROFILE_REVIEW_CONTRACT.global_production_deployment_switched, false);
assert.equal(ACTIVITY_PROFILE_REVIEW_RUNNER_STATUS.phase_owned_runner, true);
assert.equal(ACTIVITY_PROFILE_REVIEW_RUNNER_STATUS.production_entrypoint_switched, true);
assert.equal(ACTIVITY_PROFILE_REVIEW_RUNNER_STATUS.global_production_deployment_switched, false);

assert.equal(runtimeContract.central_phase_id, "ACTIVITY_PROFILE_REVIEW");
assert.equal(runtimeContract.public_label, "Activity Profile Review");
assert.equal(runtimeContract.type, "model");
assert.deepEqual(runtimeContract.reads, expectedReads);
assert.deepEqual(runtimeContract.writes, expectedWrites);
assert.deepEqual(runtimeContract.prompt_files, expectedPrompts);
assert.deepEqual(runtimeContract.references, expectedReferences);
assert.equal(runtimeContract.runtime_wiring_status, "PHASE_RUNNER_CUTOVER");
assert.equal(runtimeContract.production_entrypoint_switched, true);
assert.equal(runtimeContract.global_production_deployment_switched, false);
assert.equal(contractSource.includes("M8_TARGET_FEATURE_PROFILE"), true);
assert.equal(contractSource.includes("runtime_wiring_status: \"PHASE_RUNNER_CUTOVER\""), true);

assert.equal(PIPELINE_CONTRACT_STATUS.activity_profile_review_material_contract_locked, true);
assert.equal(PIPELINE_CONTRACT_STATUS.activity_profile_review_material_phase_runner_cutover, true);
assert.equal(PIPELINE_CONTRACT_STATUS.activity_profile_review_material_production_entrypoint_switched, true);
assert.equal(PIPELINE_CONTRACT_STATUS.global_production_deployment_switched, false);

assert.ok(pipelineSource.includes("runActivityProfileReviewPhase"), "pipeline.service.js must import/use Activity Profile Review material phase runner");
assert.ok(pipelineSource.includes("activity_profile_review_phase_runner_wired: true"), "pipeline.service.js status must mark Activity Profile Review runner wired");
assert.ok(pipelineSource.includes("internalJobId === JOB.activityProfileReview) await runActivityProfileReviewRuntimeJob"), "pipeline.service.js dispatch must route Activity Profile Review to phase runner wrapper");
assert.ok(pipelineSource.includes("async function runActivityProfileReviewRuntimeJob"), "pipeline.service.js must contain Activity Profile Review runtime wrapper");
assert.ok(pipelineSource.includes("ACTIVITY_PROFILE_REVIEW_PHASE_RUNNER_COMPLETED"), "pipeline.service.js must log Activity Profile Review phase runner completion");
assert.ok(pipelineSource.includes("activity_profile_review_phase_runner_used: true"), "pipeline.service.js must log Activity Profile Review runner usage flag");

const explicitDispatchIndex = pipelineSource.indexOf("internalJobId === JOB.activityProfileReview) await runActivityProfileReviewRuntimeJob");
const genericModelDispatchIndex = pipelineSource.indexOf("else if (contract.type === \"model\") await runModelProfileJob");
assert.ok(explicitDispatchIndex > -1, "explicit Activity Profile Review dispatch missing");
assert.ok(genericModelDispatchIndex > -1, "generic model dispatch missing");
assert.ok(explicitDispatchIndex < genericModelDispatchIndex, "Activity Profile Review dispatch must occur before generic model fallback");

console.log("Activity Profile Review runner cutover: PASS");

function read(relativePath) {
  return fs.readFileSync(path.join(backendRoot, relativePath), "utf8");
}
