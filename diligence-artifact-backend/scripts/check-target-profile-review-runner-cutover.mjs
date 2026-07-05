import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TARGET_PROFILE_REVIEW_RUNNER_STATUS } from "../src/phases/03-target-profile-review/index.js";
import { getPipelineContract, PIPELINE_CONTRACT_STATUS } from "../src/runtime/contracts/pipeline.contract.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");
const runnerSource = read("src/phases/03-target-profile-review/target-profile-review.runner.js");
const pipelineSource = read("src/runtime/services/pipeline.service.js");
const contract = getPipelineContract("M7_TARGET_PROFILE");

assert.equal(TARGET_PROFILE_REVIEW_RUNNER_STATUS.phase_owned_runner, true);
assert.equal(TARGET_PROFILE_REVIEW_RUNNER_STATUS.production_entrypoint_switched, true);
assert.equal(TARGET_PROFILE_REVIEW_RUNNER_STATUS.global_production_deployment_switched, false);
assert.deepEqual(TARGET_PROFILE_REVIEW_RUNNER_STATUS.writes, ["target_profile"]);

assert.equal(contract.runtime_wiring_status, "PHASE_RUNNER_CUTOVER");
assert.equal(contract.production_entrypoint_switched, true);
assert.equal(contract.global_production_deployment_switched, false);
assert.equal(PIPELINE_CONTRACT_STATUS.target_profile_review_phase_runner_cutover, true);
assert.equal(PIPELINE_CONTRACT_STATUS.target_profile_review_production_entrypoint_switched, true);
assert.equal(PIPELINE_CONTRACT_STATUS.global_production_deployment_switched, false);

assert.ok(runnerSource.includes("export async function runTargetProfileReviewPhase"));
assert.ok(runnerSource.includes("validateTargetProfileReviewOutput(output, { phase: internalJobId })"));
assert.ok(runnerSource.includes("assertAllowedRuntimeArtifacts"));
assert.ok(runnerSource.includes("TARGET_PROFILE_REVIEW_FORBIDDEN_RUNTIME_ARTIFACT"));
assert.ok(runnerSource.includes("TARGET_PROFILE_REVIEW_OUTPUT_MISSING_ARTIFACT"));

assert.ok(pipelineSource.includes("runTargetProfileReviewPhase"), "pipeline.service.js must import/use Target Profile Review phase runner");
assert.ok(pipelineSource.includes("target_profile_review_phase_runner_wired: true"), "pipeline.service.js status must mark phase runner wired");
assert.ok(pipelineSource.includes("internalJobId === JOB.targetProfileReview) await runTargetProfileReviewRuntimeJob"), "pipeline.service.js dispatch must route Target Profile Review to phase runner");
assert.ok(pipelineSource.includes("async function runTargetProfileReviewRuntimeJob"), "pipeline.service.js must contain Target Profile Review runtime wrapper");
assert.ok(pipelineSource.includes("TARGET_PROFILE_REVIEW_PHASE_RUNNER_COMPLETED"), "pipeline.service.js must log phase runner completion event");
assert.ok(pipelineSource.includes("target_profile_review_phase_runner_used: true"), "pipeline.service.js must log runner usage flag");

console.log("Target Profile Review runner cutover: PASS");

function read(relativePath) {
  return fs.readFileSync(path.join(backendRoot, relativePath), "utf8");
}
