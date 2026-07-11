import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { INTERNAL_JOB_WRITE_PERMISSIONS as PHASE_WRITE_PERMISSIONS, READ_PERMISSIONS, WRITE_PERMISSIONS } from "../src/runtime/contracts/artifact-permissions.contract.js";
import { PIPELINE_CONTRACTS as PHASE_CONTRACTS } from "../src/runtime/contracts/pipeline.contract.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const directSignal = "legal_signal_derivation_profile";
const oldPacket = "m10_selected_legal_support_packet";
const phase7Layer4 = PHASE_CONTRACTS.DATA_PROVENANCE_PROFILE_LAYER4;

assert.ok(phase7Layer4, "DATA_PROVENANCE_PROFILE_LAYER4 contract missing");
assert.ok(phase7Layer4.reads.includes(directSignal), "DAP layer4 must read legal_signal_derivation_profile");
assert.ok(phase7Layer4.reads.includes("legal_cartography_index"), "DAP layer4 must retain legal_cartography_index navigation read");
assert.ok(phase7Layer4.reads.includes("target_feature_profile"), "DAP layer4 must read target_feature_profile activity spine");
assert.equal(phase7Layer4.reads.includes(oldPacket), false, "DAP layer4 must not read retired selected-support packet");
assert.ok(PHASE_CONTRACTS.DATA_PROVENANCE_PROFILE_LAYER5, "DATA_PROVENANCE_PROFILE_LAYER5 contract missing");

assert.ok(PHASE_CONTRACTS.M9.writes.includes(directSignal));
assert.ok(PHASE_WRITE_PERMISSIONS.M9.includes(directSignal));
assert.ok(WRITE_PERMISSIONS.agent_2b_m9.includes(directSignal));
assert.ok(READ_PERMISSIONS.agent_4_data_privacy.includes(directSignal));
assert.equal(READ_PERMISSIONS.agent_4_data_privacy.includes(oldPacket), false);

const phaseContracts = fs.readFileSync(path.join(repoRoot, "src/runtime/contracts/pipeline.contract.js"), "utf8");
assert.equal(phaseContracts.includes("M10_LEAN_INPUT_CONTRACT"), false);
assert.ok(phaseContracts.includes(directSignal));
assert.equal(phaseContracts.includes(oldPacket), false);

const runtimePacket = fs.readFileSync(path.join(repoRoot, "agent-packages/agent_4_data_privacy/AGENT4_RUNTIME_BINDING_PACKET_SYNCED_M10.yaml"), "utf8");
assert.ok(runtimePacket.includes("D1-D5 are the primary field-derivation source for M10."));
assert.ok(runtimePacket.includes("legal_signal_derivation_profile supplies DAP.CONTACT and DAP.CM"));
assert.ok(runtimePacket.includes("M10 must not read m10_selected_legal_support_packet"));
assert.equal(runtimePacket.includes("M10_LEAN_INPUT_CONTRACT"), false);

const sourceContract = fs.readFileSync(path.join(repoRoot, "agent-packages/agent_4_data_privacy/M10_D_PRIMARY_SELECTED_SUPPORT_CONTRACT.md"), "utf8");
assert.ok(sourceContract.includes("legal_signal_derivation_profile"));
assert.ok(sourceContract.includes("m10_selected_legal_support_packet"));
assert.ok(sourceContract.includes("M10 must not use"));

console.log("m10 D-primary direct legal signal: PASS");