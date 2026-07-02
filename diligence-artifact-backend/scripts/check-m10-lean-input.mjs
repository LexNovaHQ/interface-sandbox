import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DATA_PROVENANCE_FAMILY_ARTIFACT_NAMES } from "../src/constants.js";
import { PHASE_CONTRACTS } from "../src/phase-contracts.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const leanReads = ["source_discovery_handoff", "legal_cartography_index", "target_profile", "target_profile_forensics", "feature_candidate_inventory", "target_feature_profile", "target_feature_profile_forensics"];
const forbiddenRawReads = [...DATA_PROVENANCE_FAMILY_ARTIFACT_NAMES, "lossless_family__L1_CORE_TERMS_PRIVACY", "lossless_family__L2_B2B_CONTRACTING", "lossless_family__L4_PRIVACY_ADJACENT_NOTICES"];

assert.deepEqual(PHASE_CONTRACTS.M10.reads, leanReads);
assert.deepEqual(PHASE_CONTRACTS.M10_FORENSICS.reads, [...leanReads, "data_provenance_profile"]);
for (const name of forbiddenRawReads) {
  assert.equal(PHASE_CONTRACTS.M10.reads.includes(name), false, `M10_RAW_READ_FORBIDDEN:${name}`);
  assert.equal(PHASE_CONTRACTS.M10_FORENSICS.reads.includes(name), false, `M10_FORENSICS_RAW_READ_FORBIDDEN:${name}`);
}
assert.ok(PHASE_CONTRACTS.M10.prompt_files.includes("agent-packages/agent_4_data_privacy/M10_LEAN_INPUT_CONTRACT.md"));

const packet = fs.readFileSync(path.join(repoRoot, "agent-packages/agent_4_data_privacy/AGENT4_RUNTIME_BINDING_PACKET_SYNCED_M10.yaml"), "utf8");
assert.ok(packet.includes("forbidden_model_inputs:"));
assert.ok(packet.includes("any raw lossless_family__* artifact"));
assert.equal(packet.includes("read_artifacts:\n  - source_discovery_handoff\n  - legal_cartography_index\n  - target_profile\n  - target_profile_forensics\n  - feature_candidate_inventory\n  - target_feature_profile\n  - target_feature_profile_forensics\n  - lossless_family__D1_SECURITY_TRUST"), false);

const leanContract = fs.readFileSync(path.join(repoRoot, "agent-packages/agent_4_data_privacy/M10_LEAN_INPUT_CONTRACT.md"), "utf8");
assert.ok(leanContract.includes("M10 is a model phase and must remain token-bounded"));
assert.ok(leanContract.includes("Raw data, privacy, security, subprocessor, DPA, policy, and legal-family materials are handled by deterministic 4B after M10."));

console.log("m10 lean input contract: PASS");
