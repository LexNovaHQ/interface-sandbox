import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DATA_PROVENANCE_FAMILY_ARTIFACT_NAMES, PHASE_WRITE_PERMISSIONS, READ_PERMISSIONS, WRITE_PERMISSIONS } from "../src/constants.js";
import { PHASE_CONTRACTS } from "../src/phase-contracts.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const directSignal = "legal_signal_derivation_profile";
const oldPacket = "m10_selected_legal_support_packet";
const requiredM10Reads = ["source_discovery_handoff", "legal_cartography_index", directSignal, "target_feature_profile", ...DATA_PROVENANCE_FAMILY_ARTIFACT_NAMES];
const removedReads = ["target_profile", "target_profile_forensics", "feature_candidate_inventory", "target_feature_profile_forensics", oldPacket];
const forbiddenFullLegalReads = ["lossless_family__L1_CORE_TERMS_PRIVACY", "lossless_family__L2_B2B_CONTRACTING", "lossless_family__L4_PRIVACY_ADJACENT_NOTICES"];

assert.deepEqual(PHASE_CONTRACTS.M10.reads, requiredM10Reads);
assert.deepEqual(PHASE_CONTRACTS.M10_FORENSICS.reads, [...requiredM10Reads, "data_provenance_profile"]);
for (const name of removedReads) {
  assert.equal(PHASE_CONTRACTS.M10.reads.includes(name), false, `M10_UNNEEDED_PROFILE_READ:${name}`);
  assert.equal(PHASE_CONTRACTS.M10_FORENSICS.reads.includes(name), false, `M10_FORENSICS_UNNEEDED_PROFILE_READ:${name}`);
}
for (const name of forbiddenFullLegalReads) {
  assert.equal(PHASE_CONTRACTS.M10.reads.includes(name), false, `M10_FULL_L_FAMILY_FORBIDDEN:${name}`);
  assert.equal(PHASE_CONTRACTS.M10_FORENSICS.reads.includes(name), false, `M10_FORENSICS_FULL_L_FAMILY_FORBIDDEN:${name}`);
}
assert.ok(PHASE_CONTRACTS.M9.writes.includes(directSignal));
assert.ok(PHASE_WRITE_PERMISSIONS.M9.includes(directSignal));
assert.ok(WRITE_PERMISSIONS.agent_2b_m9.includes(directSignal));
assert.ok(READ_PERMISSIONS.agent_4_data_privacy.includes(directSignal));
assert.equal(READ_PERMISSIONS.agent_4_data_privacy.includes(oldPacket), false);
for (const name of DATA_PROVENANCE_FAMILY_ARTIFACT_NAMES) assert.ok(READ_PERMISSIONS.agent_4_data_privacy.includes(name));

const phaseContracts = fs.readFileSync(path.join(repoRoot, "src/phase-contracts.js"), "utf8");
assert.equal(phaseContracts.includes("M10_LEAN_INPUT_CONTRACT"), false);
assert.ok(phaseContracts.includes("M10_PRIMARY_READS"));
assert.ok(phaseContracts.includes(directSignal));

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
