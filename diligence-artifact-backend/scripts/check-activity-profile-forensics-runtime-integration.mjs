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
const contract = getPipelineContract("M8_TARGET_FEATURE_PROFILE_FORENSICS");
const registry = getCentralPhaseImplementation("ACTIVITY_PROFILE_FORENSICS");

assert.equal(ACTIVITY_PROFILE_FORENSICS_PHASE.implementation_status, "PHASE_RUNNER_CUTOVER_ACTIVE");
assert.equal(registry.implementation_status, "PHASE_RUNNER_CUTOVER_ACTIVE");
assert.equal(registry.folder, "06-activity-profile-forensics");
assert.equal(contract.central_phase_id, ACTIVITY_PROFILE_FORENSICS_CONTRACT.central_phase_id);
assert.equal(contract.public_label, ACTIVITY_PROFILE_FORENSICS_CONTRACT.public_label);
assert.deepEqual(contract.writes, ["target_feature_profile_forensics"]);
assert.equal(contract.next, "DATA_PROVENANCE_PROFILE_LAYER4");

assert.ok(pipelineSource.includes("activityProfileForensics: \"M8_TARGET_FEATURE_PROFILE_FORENSICS\""), "pipeline.service.js must define Activity Profile Forensics job alias");
assert.ok(pipelineSource.includes("DETERMINISTIC_PROFILE_FORENSIC_JOBS"), "pipeline.service.js must keep deterministic profile forensic job set");
assert.ok(pipelineSource.includes("JOB.activityProfileForensics"), "pipeline.service.js must include Activity Profile Forensics in deterministic forensic runtime path");
assert.ok(pipelineSource.includes("buildActivityProfileForensics"), "pipeline.service.js must call the existing M8 deterministic forensic helper");
assert.ok(pipelineSource.includes("PROFILE_FORENSICS_COMPLETED"), "pipeline.service.js must log profile forensics completion");
assert.ok(pipelineSource.includes("target_feature_profile_forensics"), "pipeline.service.js must know the Activity Profile Forensics artifact name");

console.log("Activity Profile Forensics runtime integration: PASS");

function read(relativePath) {
  return fs.readFileSync(path.join(backendRoot, relativePath), "utf8");
}
