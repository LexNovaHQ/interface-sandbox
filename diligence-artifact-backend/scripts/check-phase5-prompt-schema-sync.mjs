import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  FEATURE_CANDIDATE_FIELDS,
  FEATURE_CANDIDATE_INVENTORY_ARTIFACT,
  FEATURE_CANDIDATE_INVENTORY_VERSION,
  FEATURE_CANDIDATE_INVENTORY_MODE,
  SEMANTIC_SUPPORT_RECEIPT_FIELDS,
  SEMANTIC_PROPOSAL_FIELDS,
  SEMANTIC_PROPOSED_CANDIDATE_FIELDS,
  SEMANTIC_SUPPORT_ACTIONS,
  SEMANTIC_SUPPORT_STATUSES
} from "../src/phases/05-activity-profile-review/activity-profile.constants.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");
const oldPromptName = ["03A_M8_FEATURE_CANDIDATE_INVENTORY", "DETERMINISTIC.md"].join("_");
const newPromptName = "03A_M8_FEATURE_CANDIDATE_INVENTORY_DETERMINISTIC_LED_SEMANTIC_SUPPORTED.md";

const files = {
  pipeline: "src/runtime/contracts/pipeline.contract.js",
  service: "src/runtime/services/pipeline.service.js",
  semanticService: "src/phases/05-activity-profile-review/services/activity-candidate-inventory-semantic-support.js",
  prompt: `agent-packages/agent_3_target_feature/${newPromptName}`,
  outputContract: "agent-packages/agent_3_target_feature/AGENT3_FEATURE_CANDIDATE_INVENTORY_OUTPUT_CONTRACT.md",
  validatorAddendum: "agent-packages/agent_3_target_feature/00_VALIDATOR_RULES_M8_FEATURE_INVENTORY_INDEX_ADDENDUM.md",
  m8Prompt: "agent-packages/agent_3_target_feature/03_M8_FEATURE_PROFILE_BACKEND_CURRENT.md",
  m8Addendum: "agent-packages/agent_3_target_feature/03B_M8_ACTIVITY_PROFILE_PACKAGE_AWARE_SYNC.md"
};
const text = Object.fromEntries(Object.entries(files).map(([key, relative]) => [key, read(relative)]));

assert.equal(FEATURE_CANDIDATE_INVENTORY_ARTIFACT, "feature_candidate_inventory");
assert.equal(FEATURE_CANDIDATE_INVENTORY_VERSION, "m8_feature_candidate_inventory_index_v4_deterministic_led_semantic_supported");
assert.equal(FEATURE_CANDIDATE_INVENTORY_MODE, "DETERMINISTIC_LED_SEMANTIC_SUPPORTED_FROM_INDEX_MAPPED_LOSSLESS_UNITS_NO_TEXT_COPY");

for (const target of ["prompt", "outputContract", "validatorAddendum", "semanticService"]) {
  assert.ok(text[target].includes("semantic_candidate_support_proposal"), `${files[target]} missing singular semantic packet key`);
  assert.ok(text[target].includes("proposal_version"), `${files[target]} missing proposal_version`);
  assert.ok(text[target].includes("proposals"), `${files[target]} missing proposals`);
  assert.ok(text[target].includes("limitations"), `${files[target]} missing limitations`);
}

for (const field of FEATURE_CANDIDATE_FIELDS) {
  assert.ok(text.outputContract.includes(field), `output contract missing candidate field ${field}`);
}
for (const field of SEMANTIC_SUPPORT_RECEIPT_FIELDS) {
  assert.ok(text.outputContract.includes(field), `output contract missing receipt field ${field}`);
  assert.ok(text.validatorAddendum.includes(field), `validator addendum missing receipt field ${field}`);
}
for (const field of SEMANTIC_PROPOSAL_FIELDS) {
  assert.ok(text.prompt.includes(field), `prompt missing semantic proposal field ${field}`);
  assert.ok(text.validatorAddendum.includes(field), `validator addendum missing semantic proposal field ${field}`);
}
for (const field of SEMANTIC_PROPOSED_CANDIDATE_FIELDS) {
  assert.ok(text.prompt.includes(field), `prompt missing proposed candidate field ${field}`);
}
for (const action of SEMANTIC_SUPPORT_ACTIONS) {
  assert.ok(text.prompt.includes(action), `prompt missing semantic action ${action}`);
  assert.ok(text.validatorAddendum.includes(action), `validator addendum missing semantic action ${action}`);
}
for (const status of SEMANTIC_SUPPORT_STATUSES) {
  assert.ok(text.outputContract.includes(status), `output contract missing semantic status ${status}`);
  assert.ok(text.validatorAddendum.includes(status), `validator addendum missing semantic status ${status}`);
}

assert.ok(text.pipeline.includes("ACTIVITY_CANDIDATE_SEMANTIC_PROMPT_FILES"));
assert.ok(text.pipeline.includes(newPromptName));
assert.equal(text.pipeline.includes(oldPromptName), false, "pipeline still references retired prompt filename");
assert.equal(text.m8Prompt.includes(oldPromptName), false, "M8 prompt still references retired prompt filename");
assert.ok(text.m8Prompt.includes(newPromptName), "M8 prompt must reference new Layer 1 prompt");
assert.equal(text.m8Addendum.includes("must not independently scan"), false, "03B still contains retired locator-only/no-evidence-open wording");

const candidateRuntime = functionBody(text.service, "runActivityCandidateInventoryRuntimeJob", "runActivityProfileReviewRuntimeJob");
assert.ok(candidateRuntime.includes("buildPrompt: (p) => buildPhasePrompt(p)"));
assert.ok(candidateRuntime.includes("callProvider: ({ prompt, phase }) => callProviderJson({ prompt, phase })"));

assert.equal(fs.existsSync(path.join(backendRoot, "agent-packages/agent_3_target_feature", oldPromptName)), false, "retired prompt file still exists");

console.log("Phase 5 Layer 1 prompt/schema sync: PASS");

function read(relativePath) {
  return fs.readFileSync(path.join(backendRoot, relativePath), "utf8");
}

function functionBody(source, functionName, nextFunctionName) {
  const start = source.indexOf(`async function ${functionName}`);
  const end = source.indexOf(`async function ${nextFunctionName}`, start);
  assert.notEqual(start, -1, `${functionName} missing`);
  assert.notEqual(end, -1, `${nextFunctionName} missing after ${functionName}`);
  return source.slice(start, end);
}
