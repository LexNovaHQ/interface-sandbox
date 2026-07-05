import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPipelineContract } from "../src/runtime/contracts/pipeline.contract.js";
import { TARGET_PROFILE_FORENSICS_CONTRACT, TARGET_PROFILE_FORENSICS_RUNNER_STATUS } from "../src/phases/04-target-profile-forensics/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");
const pipelineSource = read("src/runtime/services/pipeline.service.js");
const contract = getPipelineContract("M7_TARGET_PROFILE_FORENSICS");

assert.equal(TARGET_PROFILE_FORENSICS_CONTRACT.implementation_status, "PHASE_RUNNER_CUTOVER_STAGED");
assert.equal(TARGET_PROFILE_FORENSICS_CONTRACT.production_entrypoint_switched, true);
assert.equal(TARGET_PROFILE_FORENSICS_CONTRACT.global_production_deployment_switched, false);
assert.equal(TARGET_PROFILE_FORENSICS_RUNNER_STATUS.phase_owned_runner, true);
assert.equal(TARGET_PROFILE_FORENSICS_RUNNER_STATUS.production_entrypoint_switched, true);
assert.equal(TARGET_PROFILE_FORENSICS_RUNNER_STATUS.global_production_deployment_switched, false);
assert.equal(contract.central_phase_id, "TARGET_PROFILE_FORENSICS");
assert.deepEqual(contract.writes, ["target_profile_forensics"]);

assert.ok(pipelineSource.includes("runTargetProfileForensicsPhase"), "pipeline.service.js must import/use Target Profile Forensics phase runner");
assert.ok(pipelineSource.includes("target_profile_forensics_phase_runner_wired: true"), "pipeline.service.js status must mark Target Profile Forensics runner wired");
assert.ok(pipelineSource.includes("internalJobId === JOB.targetProfileForensics) await runTargetProfileForensicsRuntimeJob"), "pipeline.service.js dispatch must route Target Profile Forensics to phase runner");
assert.ok(pipelineSource.includes("async function runTargetProfileForensicsRuntimeJob"), "pipeline.service.js must contain Target Profile Forensics runtime wrapper");
assert.ok(pipelineSource.includes("TARGET_PROFILE_FORENSICS_PHASE_RUNNER_COMPLETED"), "pipeline.service.js must log Target Profile Forensics phase runner completion");
assert.ok(pipelineSource.includes("target_profile_forensics_phase_runner_used: true"), "pipeline.service.js must log Target Profile Forensics runner usage flag");
assert.ok(pipelineSource.indexOf("internalJobId === JOB.targetProfileForensics) await runTargetProfileForensicsRuntimeJob") < pipelineSource.indexOf("DETERMINISTIC_PROFILE_FORENSIC_JOBS.has(internalJobId)"), "Target Profile Forensics dispatch must happen before generic deterministic forensics fallback");

console.log("Target Profile Forensics runner cutover: PASS");

function read(relativePath) {
  return fs.readFileSync(path.join(backendRoot, relativePath), "utf8");
}
