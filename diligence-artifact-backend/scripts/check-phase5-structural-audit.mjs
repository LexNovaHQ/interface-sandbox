import assert from "node:assert/strict";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(backendRoot, "..");

const DEFAULT_PHASE5_CUTOVER_BASE_REF = "94592f50388c11d03972d3ee4748fa3e26dc8b89";
const baseRef = String(process.env.PHASE5_CUTOVER_BASE_REF || DEFAULT_PHASE5_CUTOVER_BASE_REF).trim();

const allowed = new Set([
  "diligence-artifact-backend/src/phases/05-activity-profile-review/activity-profile.constants.js",
  "diligence-artifact-backend/src/runtime/domain-gate/activity-taxonomy.resolver.js",
  "diligence-artifact-backend/src/phases/05-activity-profile-review/services/activity-candidate-inventory-semantic-support.js",
  "diligence-artifact-backend/agent-packages/agent_3_target_feature/03A_M8_FEATURE_CANDIDATE_INVENTORY_DETERMINISTIC_LED_SEMANTIC_SUPPORTED.md",
  "diligence-artifact-backend/scripts/check-activity-taxonomy-resolver.mjs",
  "diligence-artifact-backend/scripts/check-activity-candidate-semantic-support.mjs",
  "diligence-artifact-backend/scripts/check-phase5-prompt-schema-sync.mjs",
  "diligence-artifact-backend/src/phases/05-activity-profile-review/activity-candidate-inventory.contract.js",
  "diligence-artifact-backend/src/phases/05-activity-profile-review/services/activity-candidate-inventory-index.builder.js",
  "diligence-artifact-backend/src/phases/05-activity-profile-review/activity-candidate-inventory.runner.js",
  "diligence-artifact-backend/src/phases/05-activity-profile-review/activity-profile-review.contract.js",
  "diligence-artifact-backend/src/phases/05-activity-profile-review/activity-profile-review.runner.js",
  "diligence-artifact-backend/src/phases/05-activity-profile-review/validators/activity-profile-review.validator.js",
  "diligence-artifact-backend/src/phases/05-activity-profile-review/activity-profile-review.phase.js",
  "diligence-artifact-backend/src/phases/05-activity-profile-review/index.js",
  "diligence-artifact-backend/src/phases/_shared/forensics/profile-forensics.shared.js",
  "diligence-artifact-backend/src/runtime/contracts/pipeline.contract.js",
  "diligence-artifact-backend/src/runtime/services/pipeline.service.js",
  "diligence-artifact-backend/references/registry/AI_Registry_Key.yml",
  "diligence-artifact-backend/references/registry/FinTech_Registry_Key.yml",
  "diligence-artifact-backend/agent-packages/agent_3_target_feature/AGENT3_RUNTIME_BINDING_PACKET.yaml",
  "diligence-artifact-backend/agent-packages/agent_3_target_feature/03B_M8_ACTIVITY_PROFILE_PACKAGE_AWARE_SYNC.md",
  "diligence-artifact-backend/agent-packages/agent_3_target_feature/03_M8_FEATURE_PROFILE_BACKEND_CURRENT.md",
  "diligence-artifact-backend/agent-packages/agent_3_target_feature/AGENT3_BACKEND_OUTPUT_CONTRACT.md",
  "diligence-artifact-backend/agent-packages/agent_3_target_feature/AGENT3_FEATURE_CANDIDATE_INVENTORY_OUTPUT_CONTRACT.md",
  "diligence-artifact-backend/agent-packages/agent_3_target_feature/00_VALIDATOR_RULES_M8_FEATURE_INVENTORY_INDEX_ADDENDUM.md",
  "diligence-artifact-backend/agent-packages/agent_3_target_feature/00_VALIDATOR_RULES_INTEGRATED.md",
  "diligence-artifact-backend/agent-packages/agent_3_target_feature/00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED.md",
  "diligence-artifact-backend/scripts/check-activity-candidate-inventory-contract.mjs",
  "diligence-artifact-backend/scripts/check-activity-profile-review-contract.mjs",
  "diligence-artifact-backend/scripts/check-phase5-activity-profile-review.mjs",
  "diligence-artifact-backend/scripts/check-m8-feature-candidate-inventory.mjs",
  "diligence-artifact-backend/package.json"
]);

const retired = new Set([
  "diligence-artifact-backend/src/phases/05-activity-profile-review/services/activity-candidate-inventory.boundary.js",
  "diligence-artifact-backend/agent-packages/agent_3_target_feature/03A_M8_FEATURE_CANDIDATE_INVENTORY_DETERMINISTIC.md"
]);

assert.ok(baseRef, "PHASE5_CUTOVER_BASE_REF must not be empty");

try {
  execFileSync("git", ["rev-parse", "--verify", `${baseRef}^{commit}`], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
} catch (error) {
  const detail = String(error?.stderr || error?.message || "unknown git error").trim();
  assert.fail(`Phase 5 structural audit base ref is unavailable: ${baseRef}. ${detail}`);
}

let changed;
try {
  changed = execFileSync("git", ["diff", "--name-only", `${baseRef}...HEAD`], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  })
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
} catch (error) {
  const detail = String(error?.stderr || error?.message || "unknown git error").trim();
  assert.fail(`Phase 5 structural audit could not inspect ${baseRef}...HEAD. ${detail}`);
}

const reintroducedRetired = changed.filter((file) => retired.has(file));
assert.deepEqual(
  reintroducedRetired,
  [],
  `retired Phase 5 paths were modified or reintroduced: ${reintroducedRetired.join(", ")}`
);

const outside = changed.filter((file) => !allowed.has(file));
assert.deepEqual(outside, [], `diff contains files outside Phase 5 allowed map: ${outside.join(", ")}`);

const bannedRoots = [
  "diligence-artifact-backend/src/phases/02-",
  "diligence-artifact-backend/src/phases/07-",
  "diligence-artifact-backend/src/phases/09-",
  "diligence-artifact-backend/src/compiler",
  "diligence-artifact-backend/src/renderer"
];

for (const file of changed) {
  for (const banned of bannedRoots) {
    assert.equal(file.startsWith(banned), false, `forbidden upstream/downstream diff: ${file}`);
  }
}

console.log(JSON.stringify({
  check: "Phase 5 structural allowed-diff audit",
  status: "PASS",
  base_ref: baseRef,
  head_ref: "HEAD",
  changed_file_count: changed.length,
  retired_paths_enforced: [...retired]
}, null, 2));
