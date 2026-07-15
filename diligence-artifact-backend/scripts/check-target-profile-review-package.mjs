import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const packet = read("agent-packages/agent_3_target_feature/AGENT3_RUNTIME_BINDING_PACKET.yaml");
const controller = read("agent-packages/agent_3_target_feature/00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED.md");
const prompt = read("agent-packages/agent_3_target_feature/02_M7_TARGET_PROFILE_BACKEND_CURRENT.md");
const validator = read("agent-packages/agent_3_target_feature/00_VALIDATOR_RULES_INTEGRATED.md");
const outputContract = read("agent-packages/agent_3_target_feature/AGENT3_BACKEND_OUTPUT_CONTRACT.md");
const authority = read("references/registry/M7_TARGET_PROFILE_DERIVATION_AUTHORITY.yaml");

for (const file of [packet, controller, prompt, validator, outputContract, authority]) {
  assert.ok(file.includes("Target Profile Review"));
  assert.ok(file.includes("legal_signal_derivation_profile"));
}

assert.ok(packet.includes("TARGET_PROFILE_REVIEW"));
assert.ok(packet.includes("Target Profile Review must not block because raw legal/governance artifacts are absent"));
assert.ok(packet.includes("LEGAL_CARTOGRAPHY_AND_INDEX"));
assert.ok(controller.includes("Target Profile Review may read only"));
assert.ok(controller.includes("SOURCE_CONFLICT -> do not choose a winner"));
assert.ok(prompt.includes("Target Profile Review must not use raw `legal_cartography_index` as model evidence."));
assert.ok(prompt.includes("The direct legal signal profile may affect only these branches"));
assert.ok(prompt.includes("- `jurisdiction_notice`"));
assert.ok(prompt.includes("- `target_profile_limitations`"));
assert.equal(prompt.includes("- `target_identity`\n- `jurisdiction_notice`\n- `target_profile_limitations`"), false);
assert.ok(validator.includes("Target Profile Review direct signal gate"));
assert.ok(validator.includes("privacy_grievance_contact_signal_map"));
assert.ok(validator.includes("consent_manager_signal_map"));
assert.ok(outputContract.includes("Target Profile Review required response shape"));
assert.ok(outputContract.includes("Do not emit `legal_signal_derivation_profile` as an output. It is an input only."));
assert.ok(authority.includes("TARGET_PROFILE_REVIEW_DERIVATION_AUTHORITY_v4_CONTRACT_LOCKED"));
assert.ok(authority.includes("direct_legal_signal_allowed: false"));
assert.ok(authority.includes("Target Profile Review must not use direct legal signal rows for target_identity, business_context, or product_service_wrapper derivation."));

for (const text of [packet, controller, prompt, validator, outputContract, authority]) {
  assert.equal(text.includes("m7_deterministic_legal_signal_overlay is the only"), false);
  assert.equal(text.includes("Missing overlay values"), false);
  assert.equal(text.includes("M7 deterministic overlay rule"), false);
}

console.log("Target Profile Review package cleanup: PASS");

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}
