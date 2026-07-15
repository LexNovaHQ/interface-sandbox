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

assert.equal(TARGET_PROFILE_FORENSICS_CONTRACT.implementation_status, "PHASE2G_DERIVED_ONLY_RUNTIME_CUTOVER");
assert.equal(TARGET_PROFILE_FORENSICS_CONTRACT.production_entrypoint_switched, true);
assert.equal(TARGET_PROFILE_FORENSICS_RUNNER_STATUS.phase_owned_runner, true);
assert.equal(TARGET_PROFILE_FORENSICS_RUNNER_STATUS.production_entrypoint_switched, true);
assert.equal(TARGET_PROFILE_FORENSICS_RUNNER_STATUS.phase2g_route_scoped_runtime_reader_active, true);
assert.equal(TARGET_PROFILE_FORENSICS_RUNNER_STATUS.delivery_mode, "DERIVED_ONLY");
assert.equal(TARGET_PROFILE_FORENSICS_RUNNER_STATUS.source_bucket_delivered, false);
assert.equal(TARGET_PROFILE_FORENSICS_RUNNER_STATUS.profile_forensics_inputs_forbidden, true);
assert.equal(contract.central_phase_id, "TARGET_PROFILE_FORENSICS");
assert.deepEqual(contract.reads, ["phase_routing_manifest"]);
assert.deepEqual(contract.writes, ["target_profile_forensics"]);
assert.equal(contract.route_delivery_mode, "DERIVED_ONLY");

assert.ok(pipelineSource.includes('import { runTargetProfileForensicsPhase } from "../../phases/04-target-profile-forensics/target-profile-forensics.runner.js";'), "pipeline.service.js must import the phase-owned Target Profile Forensics runner");
assert.ok(pipelineSource.includes("internalJobId === JOB.targetProfileForensics) await runTargetProfileForensicsRuntimeJob"), "pipeline.service.js dispatch must route Target Profile Forensics to its phase wrapper");
assert.ok(pipelineSource.includes("async function runTargetProfileForensicsRuntimeJob"), "pipeline.service.js must contain the Target Profile Forensics runtime wrapper");
assert.ok(pipelineSource.includes("await runTargetProfileForensicsPhase({ run, internalJobId, contract"), "Target Profile Forensics wrapper must invoke the phase-owned runner with the live contract");
assert.equal(pipelineSource.includes("DETERMINISTIC_PROFILE_FORENSIC_JOBS"), false, "retired generic deterministic forensics dispatch must not return");

console.log(JSON.stringify({ check: "Target Profile Forensics runner cutover", status: "PASS", enforced_gates: ["PHASE_OWNED_RUNNER", "PHASE2G_DERIVED_ONLY_RUNTIME", "DIRECT_CENTRAL_DISPATCH", "NO_GENERIC_FORENSICS_FALLBACK", "NO_SOURCE_BUCKET_DELIVERY", "FORENSIC_INPUTS_FORBIDDEN"] }, null, 2));

function read(relativePath) {
  return fs.readFileSync(path.join(backendRoot, relativePath), "utf8");
}
