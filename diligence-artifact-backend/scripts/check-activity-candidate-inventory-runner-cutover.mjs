import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPipelineContract, PIPELINE_CONTRACT_STATUS } from "../src/runtime/contracts/pipeline.contract.js";
import { ACTIVITY_CANDIDATE_INVENTORY_CONTRACT, ACTIVITY_CANDIDATE_INVENTORY_RUNNER_STATUS, activityCandidateInventoryReadArtifacts, activityCandidateInventoryWriteArtifacts } from "../src/phases/05-activity-profile-review/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");
const pipelineSource = read("src/runtime/services/pipeline.service.js");
const contractSource = read("src/runtime/contracts/pipeline.contract.js");
const runtimeContract = getPipelineContract("M8_FEATURE_CANDIDATE_INVENTORY");
const expectedReads = activityCandidateInventoryReadArtifacts();
const expectedWrites = activityCandidateInventoryWriteArtifacts();

assert.equal(ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.implementation_status, "PHASE_RUNNER_CUTOVER_STAGED");
assert.equal(ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.production_entrypoint_switched, true);
assert.equal(ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.global_production_deployment_switched, false);
assert.equal(ACTIVITY_CANDIDATE_INVENTORY_RUNNER_STATUS.phase_owned_runner, true);
assert.equal(ACTIVITY_CANDIDATE_INVENTORY_RUNNER_STATUS.production_entrypoint_switched, true);
assert.equal(ACTIVITY_CANDIDATE_INVENTORY_RUNNER_STATUS.global_production_deployment_switched, false);

assert.equal(runtimeContract.central_phase_id, "ACTIVITY_PROFILE_REVIEW");
assert.equal(runtimeContract.public_label, "Activity Profile Review");
assert.deepEqual(runtimeContract.reads, expectedReads);
assert.deepEqual(runtimeContract.writes, expectedWrites);
assert.equal(runtimeContract.runtime_wiring_status, "PHASE_RUNNER_CUTOVER");
assert.equal(runtimeContract.production_entrypoint_switched, true);
assert.equal(runtimeContract.global_production_deployment_switched, false);
assert.equal(runtimeContract.reads.includes("lossless_family__P4_USE_CASE_INDUSTRY"), false);
assert.equal(contractSource.includes("ACTIVITY_CANDIDATE_INVENTORY_READS"), true);
assert.equal(contractSource.includes("reads: ACTIVITY_CANDIDATE_INVENTORY_READS"), true);

assert.equal(PIPELINE_CONTRACT_STATUS.activity_candidate_inventory_contract_locked, true);
assert.equal(PIPELINE_CONTRACT_STATUS.activity_candidate_inventory_phase_runner_cutover, true);
assert.equal(PIPELINE_CONTRACT_STATUS.activity_candidate_inventory_production_entrypoint_switched, true);
assert.equal(PIPELINE_CONTRACT_STATUS.global_production_deployment_switched, false);

assert.ok(pipelineSource.includes("runActivityCandidateInventoryPhase"), "pipeline.service.js must import/use Activity Candidate Inventory phase runner");
assert.ok(pipelineSource.includes("activity_candidate_inventory_phase_runner_wired: true"), "pipeline.service.js status must mark Activity Candidate Inventory runner wired");
assert.ok(pipelineSource.includes("internalJobId === JOB.activityCandidateInventory) await runActivityCandidateInventoryRuntimeJob"), "pipeline.service.js dispatch must route Activity Candidate Inventory to phase runner wrapper");
assert.ok(pipelineSource.includes("async function runActivityCandidateInventoryRuntimeJob"), "pipeline.service.js must contain Activity Candidate Inventory runtime wrapper");
assert.ok(pipelineSource.includes("ACTIVITY_CANDIDATE_INVENTORY_PHASE_RUNNER_COMPLETED"), "pipeline.service.js must log Activity Candidate Inventory phase runner completion");
assert.ok(pipelineSource.includes("activity_candidate_inventory_phase_runner_used: true"), "pipeline.service.js must log Activity Candidate Inventory runner usage flag");
assert.equal(pipelineSource.includes("internalJobId === JOB.activityCandidateInventory) await runActivityCandidateInventoryJob"), false, "legacy Activity Candidate Inventory dispatch must not remain active");

console.log("Activity Candidate Inventory runner cutover: PASS");

function read(relativePath) {
  return fs.readFileSync(path.join(backendRoot, relativePath), "utf8");
}
