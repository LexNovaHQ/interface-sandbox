import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPipelineContract } from "../src/runtime/contracts/pipeline.contract.js";
import { getCentralPhaseImplementation } from "../src/phases/phase-registry.js";
import { ACTIVITY_PROFILE_FORENSICS_PHASE, ACTIVITY_PROFILE_FORENSICS_CONTRACT } from "../src/phases/06-activity-profile-forensics/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");
const pipelineSource = read("src/runtime/services/pipeline.service.js");
const runnerSource = read("src/phases/06-activity-profile-forensics/activity-profile-forensics.runner.js");
const contract = getPipelineContract("M8_TARGET_FEATURE_PROFILE_FORENSICS");
const registry = getCentralPhaseImplementation("ACTIVITY_PROFILE_FORENSICS");

assert.equal(ACTIVITY_PROFILE_FORENSICS_PHASE.implementation_status, "PHASE_RUNNER_CUTOVER_ACTIVE");
assert.equal(registry.implementation_status, "PHASE_RUNNER_CUTOVER_ACTIVE");
assert.equal(registry.folder, "06-activity-profile-forensics");
assert.equal(contract.central_phase_id, ACTIVITY_PROFILE_FORENSICS_CONTRACT.central_phase_id);
assert.equal(contract.public_label, ACTIVITY_PROFILE_FORENSICS_CONTRACT.public_label);
assert.deepEqual(contract.reads, ["phase_routing_manifest"]);
assert.deepEqual(contract.writes, ["target_feature_profile_forensics"]);
assert.equal(contract.next, "DATA_PROVENANCE_PROFILE_LAYER4");

assert.ok(pipelineSource.includes('import { runActivityProfileForensicsPhase } from "../../phases/06-activity-profile-forensics/activity-profile-forensics.runner.js";'), "pipeline.service.js must import the Phase 6 phase-owned runner");
assert.ok(pipelineSource.includes('activityProfileForensics: "M8_TARGET_FEATURE_PROFILE_FORENSICS"'), "pipeline.service.js must define Activity Profile Forensics job alias");
assert.ok(pipelineSource.includes("internalJobId === JOB.activityProfileForensics"), "pipeline.service.js must dispatch the Activity Profile Forensics job");
assert.ok(pipelineSource.includes("runActivityProfileForensicsRuntimeJob"), "pipeline.service.js must use the Phase 6 runtime wrapper");
assert.ok(pipelineSource.includes("runActivityProfileForensicsPhase({"), "Phase 6 runtime wrapper must call the phase-owned runner");
assert.equal(pipelineSource.includes("DETERMINISTIC_PROFILE_FORENSIC_JOBS"), false, "retired central forensic job set must not return");
assert.equal(pipelineSource.includes("buildActivityProfileForensics"), false, "retired central forensic helper must not return");

assert.ok(runnerSource.includes("readPhaseRouteRuntimePacket"));
assert.ok(runnerSource.includes("phase2g_route_scoped_runtime_reader_active: true"));
assert.ok(runnerSource.includes('delivery_mode: "DERIVED_ONLY"'));
assert.ok(runnerSource.includes('target_feature_profile_forensics'));

console.log("Activity Profile Forensics runtime integration: PASS");

function read(relativePath) {
  return fs.readFileSync(path.join(backendRoot, relativePath), "utf8");
}
