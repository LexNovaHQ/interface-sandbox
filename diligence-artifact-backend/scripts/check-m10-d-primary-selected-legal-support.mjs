import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DATA_PROVENANCE_FAMILY_ARTIFACT_NAMES, M10_SELECTED_LEGAL_SUPPORT_ARTIFACT_NAMES, PHASE_WRITE_PERMISSIONS, READ_PERMISSIONS, WRITE_PERMISSIONS } from "../src/constants.js";
import { PHASE_CONTRACTS } from "../src/phase-contracts.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const packet = M10_SELECTED_LEGAL_SUPPORT_ARTIFACT_NAMES[0];
const requiredM10Reads = ["source_discovery_handoff", "legal_cartography_index", "target_feature_profile", ...DATA_PROVENANCE_FAMILY_ARTIFACT_NAMES, packet];
const removedReads = ["target_profile", "target_profile_forensics", "feature_candidate_inventory", "target_feature_profile_forensics"];
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
assert.ok(PHASE_CONTRACTS.M9.writes.includes(packet));
assert.ok(PHASE_WRITE_PERMISSIONS.M9.includes(packet));
assert.ok(WRITE_PERMISSIONS.agent_2b_m9.includes(packet));
assert.ok(READ_PERMISSIONS.agent_4_data_privacy.includes(packet));
for (const name of DATA_PROVENANCE_FAMILY_ARTIFACT_NAMES) assert.ok(READ_PERMISSIONS.agent_4_data_privacy.includes(name));

const phaseContracts = fs.readFileSync(path.join(repoRoot, "src/phase-contracts.js"), "utf8");
assert.equal(phaseContracts.includes("M10_LEAN_INPUT_CONTRACT"), false);
assert.ok(phaseContracts.includes("M10_PRIMARY_READS"));
assert.ok(phaseContracts.includes("m10_selected_legal_support_packet"));

const runner = fs.readFileSync(path.join(repoRoot, "src/reviewer-runner.js"), "utf8");
assert.ok(runner.includes("buildM10SelectedLegalSupportPacket"));
assert.ok(runner.includes("m10_selected_legal_support_saved"));

const packetSource = fs.readFileSync(path.join(repoRoot, "src/m10-selected-legal-support.js"), "utf8");
assert.ok(packetSource.includes("M10_SELECTED_LEGAL_SUPPORT_PACKET_v1"));
assert.ok(packetSource.includes("legal_cartography_index_pinpoint_selector"));

const runtimePacket = fs.readFileSync(path.join(repoRoot, "agent-packages/agent_4_data_privacy/AGENT4_RUNTIME_BINDING_PACKET_SYNCED_M10.yaml"), "utf8");
assert.ok(runtimePacket.includes("D1-D5 are the primary field-derivation source for M10."));
assert.ok(runtimePacket.includes("m10_selected_legal_support_packet is secondary support only"));
assert.equal(runtimePacket.includes("M10_LEAN_INPUT_CONTRACT"), false);

console.log("m10 D-primary selected legal support: PASS");
