import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  FEATURE_CANDIDATE_FIELDS,
  FEATURE_CANDIDATE_INVENTORY_VERSION,
  FEATURE_CANDIDATE_INVENTORY_MODE,
  SEMANTIC_SUPPORT_RECEIPT_FIELDS,
  SEMANTIC_PROPOSAL_FIELDS,
  SEMANTIC_PROPOSED_CANDIDATE_FIELDS,
  SEMANTIC_SUPPORT_ACTIONS,
  SHARED_ACTIVITY_FIELDS,
  CLASSIFICATION_BLOCK_FIELDS,
  OVERLAY_CLASSIFICATION_BLOCK_FIELDS,
  DERIVATION_BASIS_FIELDS,
  COMMERCIAL_AVAILABILITY_FIELDS,
  PROFILE_TOP_LEVEL_KEYS
} from "../src/phases/05-activity-profile-review/activity-profile.constants.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");

const promptFiles = [
  "agent-packages/agent_3_target_feature/03A_M8_FEATURE_CANDIDATE_INVENTORY_DETERMINISTIC_LED_SEMANTIC_SUPPORTED.md",
  "agent-packages/agent_3_target_feature/03B_M8_ACTIVITY_PROFILE_PACKAGE_AWARE_SYNC.md",
  "agent-packages/agent_3_target_feature/03_M8_FEATURE_PROFILE_BACKEND_CURRENT.md",
  "agent-packages/agent_3_target_feature/AGENT3_BACKEND_OUTPUT_CONTRACT.md",
  "agent-packages/agent_3_target_feature/AGENT3_FEATURE_CANDIDATE_INVENTORY_OUTPUT_CONTRACT.md",
  "agent-packages/agent_3_target_feature/00_VALIDATOR_RULES_M8_FEATURE_INVENTORY_INDEX_ADDENDUM.md",
  "agent-packages/agent_3_target_feature/00_VALIDATOR_RULES_INTEGRATED.md",
  "agent-packages/agent_3_target_feature/00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED.md",
  "agent-packages/agent_3_target_feature/AGENT3_RUNTIME_BINDING_PACKET.yaml"
];

const text = promptFiles.map(read).join("\n");

assert.ok(text.includes(FEATURE_CANDIDATE_INVENTORY_VERSION));
assert.ok(text.includes(FEATURE_CANDIDATE_INVENTORY_MODE));

for (const field of [
  ...FEATURE_CANDIDATE_FIELDS,
  ...SEMANTIC_SUPPORT_RECEIPT_FIELDS,
  ...SEMANTIC_PROPOSAL_FIELDS,
  ...SEMANTIC_PROPOSED_CANDIDATE_FIELDS,
  ...SEMANTIC_SUPPORT_ACTIONS,
  ...PROFILE_TOP_LEVEL_KEYS,
  ...SHARED_ACTIVITY_FIELDS,
  "primary_classification",
  "overlay_classifications",
  ...CLASSIFICATION_BLOCK_FIELDS,
  ...OVERLAY_CLASSIFICATION_BLOCK_FIELDS,
  ...DERIVATION_BASIS_FIELDS,
  ...COMMERCIAL_AVAILABILITY_FIELDS,
  "primary_package_id",
  "primary_key_version",
  "key_version"
]) {
  assert.ok(text.includes(field), `prompt schema missing field/action: ${field}`);
}

for (const forbidden of [
  "archetype_derivation_authority: AI_Registry_Key",
  "surface_derivation_authority: AI_Registry_Key",
  "must not independently scan",
  "m8_feature_candidate_inventory_index_v3_evidence_grounded",
  "m8_feature_candidate_inventory_index_v2_phase2c",
  "NONE_DETERMINISTIC",
  "must_not_call_provider",
  "deterministic_only"
]) {
  assert.equal(text.includes(forbidden), false, `prompt schema contains forbidden marker: ${forbidden}`);
}

assert.equal(fs.existsSync(path.join(backendRoot, "agent-packages/agent_3_target_feature/03A_M8_FEATURE_CANDIDATE_INVENTORY_DETERMINISTIC.md")), false);

console.log("Phase 5 final prompt/schema sync: PASS");

function read(relativePath) {
  return fs.readFileSync(path.join(backendRoot, relativePath), "utf8");
}
