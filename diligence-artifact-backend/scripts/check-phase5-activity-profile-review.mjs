import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getPipelineContract } from "../src/runtime/contracts/pipeline.contract.js";
import { ACTIVITY_CANDIDATE_INVENTORY_RUNNER_STATUS } from "../src/phases/05-activity-profile-review/activity-candidate-inventory.runner.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");
const oldPromptName = ["03A_M8_FEATURE_CANDIDATE_INVENTORY", "DETERMINISTIC.md"].join("_");
const newPromptName = "03A_M8_FEATURE_CANDIDATE_INVENTORY_DETERMINISTIC_LED_SEMANTIC_SUPPORTED.md";

const candidateContract = getPipelineContract("M8_FEATURE_CANDIDATE_INVENTORY");

assert.equal(candidateContract.provider_injected_by_central_runtime, true);
assert.equal(candidateContract.model_usage, "DETERMINISTIC_LED_SEMANTIC_SUPPORTED");
assert.ok(candidateContract.prompt_files.some((file) => file.endsWith(newPromptName)));
assert.equal(candidateContract.prompt_files.some((file) => file.endsWith(oldPromptName)), false);
assert.deepEqual(candidateContract.references, []);

assert.equal(ACTIVITY_CANDIDATE_INVENTORY_RUNNER_STATUS.deterministic_baseline_required, true);
assert.equal(ACTIVITY_CANDIDATE_INVENTORY_RUNNER_STATUS.semantic_support_attempt_required, true);
assert.equal(ACTIVITY_CANDIDATE_INVENTORY_RUNNER_STATUS.semantic_support_non_blocking, true);
assert.equal(ACTIVITY_CANDIDATE_INVENTORY_RUNNER_STATUS.semantic_output_non_authoritative, true);
assert.equal(ACTIVITY_CANDIDATE_INVENTORY_RUNNER_STATUS.deterministic_reconciliation_required, true);
assert.equal(ACTIVITY_CANDIDATE_INVENTORY_RUNNER_STATUS.lossless_primary_evidence_navigated_via_index, true);

const packageJson = JSON.parse(read("package.json"));
assert.ok(packageJson.scripts["check:phase5-layer1"], "check:phase5-layer1 missing");
assert.equal(packageJson.scripts["check:phase5-activity-profile"], "npm run check:phase5-layer1");
assert.equal(packageJson.scripts["check:m8-feature-candidates"], "node scripts/check-m8-feature-candidate-inventory.mjs");

assert.equal(fs.existsSync(path.join(backendRoot, "agent-packages/agent_3_target_feature", oldPromptName)), false);

console.log("Phase 5 Layer 1 active cutover aggregate: PASS");

function read(relativePath) {
  return fs.readFileSync(path.join(backendRoot, relativePath), "utf8");
}
