import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getPipelineContract } from "../src/runtime/contracts/pipeline.contract.js";
import {
  ACTIVITY_CANDIDATE_INVENTORY_CONTRACT,
  activityCandidateInventoryReadArtifacts,
  activityCandidateInventoryWriteArtifacts
} from "../src/phases/05-activity-profile-review/index.js";
import { ACTIVITY_CANDIDATE_INVENTORY_RUNNER_STATUS } from "../src/phases/05-activity-profile-review/activity-candidate-inventory.runner.js";
import {
  buildFeatureCandidateInventoryBaseline,
  validateFeatureCandidateInventoryIndex
} from "../src/phases/05-activity-profile-review/services/activity-candidate-inventory-index.builder.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");
const oldPromptName = ["03A_M8_FEATURE_CANDIDATE_INVENTORY", "DETERMINISTIC.md"].join("_");
const newPromptName = "03A_M8_FEATURE_CANDIDATE_INVENTORY_DETERMINISTIC_LED_SEMANTIC_SUPPORTED.md";

const runtimeContract = getPipelineContract("M8_FEATURE_CANDIDATE_INVENTORY");
const expectedWrites = activityCandidateInventoryWriteArtifacts();

assert.equal(ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.central_phase_id, "ACTIVITY_PROFILE_REVIEW");
assert.equal(ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.phase_job_id, "ACTIVITY_CANDIDATE_INVENTORY");
assert.equal(ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.compatibility_internal_job_id, "M8_FEATURE_CANDIDATE_INVENTORY");
assert.equal(ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.model_usage, "DETERMINISTIC_LED_SEMANTIC_SUPPORTED");
assert.equal(ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.semantic_support.semantic_support_attempt_required, true);
assert.equal(ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.semantic_support.semantic_support_non_blocking, true);
assert.equal(ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.semantic_support.semantic_output_non_authoritative, true);
assert.equal(ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.semantic_support.deterministic_reconciliation_required, true);
assert.equal(ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.package_boundary.no_package_taxonomy_in_layer1, true);
assert.equal(ACTIVITY_CANDIDATE_INVENTORY_RUNNER_STATUS.semantic_support_attempt_required, true);
assert.equal(ACTIVITY_CANDIDATE_INVENTORY_RUNNER_STATUS.semantic_output_non_authoritative, true);
assert.equal(ACTIVITY_CANDIDATE_INVENTORY_RUNNER_STATUS.deterministic_reconciliation_required, true);

assert.deepEqual(expectedWrites, ["feature_candidate_inventory"]);
assert.deepEqual(runtimeContract.reads, ["phase_routing_manifest"]);
assert.deepEqual(runtimeContract.writes, expectedWrites);
assert.equal(runtimeContract.next, "M8_TARGET_FEATURE_PROFILE");
assert.equal(runtimeContract.central_phase_id, "ACTIVITY_PROFILE_REVIEW");
assert.equal(runtimeContract.provider_injected_by_central_runtime, true);
assert.equal(runtimeContract.model_usage, "DETERMINISTIC_LED_SEMANTIC_SUPPORTED");
assert.ok(Array.isArray(runtimeContract.prompt_files), "runtime contract must expose Layer 1 semantic prompt files");
assert.ok(runtimeContract.prompt_files.some((file) => file.endsWith(newPromptName)), "new Layer 1 prompt must be active");
assert.equal(runtimeContract.prompt_files.some((file) => file.endsWith(oldPromptName)), false, "old deterministic-only prompt must not be active");
assert.deepEqual(runtimeContract.references, []);

const pipelineContractText = read("src/runtime/contracts/pipeline.contract.js");
assert.ok(pipelineContractText.includes("ACTIVITY_CANDIDATE_SEMANTIC_PROMPT_FILES"));
assert.ok(pipelineContractText.includes(newPromptName));
assert.equal(pipelineContractText.includes(oldPromptName), false, "pipeline contract contains retired prompt filename");

const pipelineServiceText = read("src/runtime/services/pipeline.service.js");
const candidateFunction = functionBody(pipelineServiceText, "runActivityCandidateInventoryRuntimeJob", "runActivityProfileReviewRuntimeJob");
assert.ok(candidateFunction.includes("buildPrompt: (p) => buildPhasePrompt(p)"), "candidate runtime must inject buildPrompt");
assert.ok(candidateFunction.includes("callProvider: ({ prompt, phase }) => callProviderJson({ prompt, phase })"), "candidate runtime must inject callProviderJson");
assert.equal(candidateFunction.includes("provider.service"), false, "Phase 5 runner must not import provider service directly");

assert.equal(fs.existsSync(path.join(backendRoot, "agent-packages/agent_3_target_feature", oldPromptName)), false, "old deterministic-only prompt file must be deleted");

const sourceRoot = "lossless_root__product_service";
const unitId = "unit-product-1";
const activityProfileSourceIndex = {
  run_id: "PHASE5-LAYER1-CONTRACT-CHECK",
  activity_candidate_source_locator_map: [{
    locator_id: "LOC.001",
    unit_id: unitId,
    source_id: "SRC.001",
    source_artifact: sourceRoot,
    common_root: sourceRoot,
    route_class: "PRODUCT_CAPABILITY_ROUTE",
    route_code: "P2C-ACT-CAND",
    route_action: "LOCATE_ONLY",
    candidate_creation_allowed: true,
    context_only: false,
    matched_signal_labels: ["example activity"],
    source_pointer: { artifact_name: sourceRoot, source_id: "SRC.001" },
    unit_pointer: { unit_id: unitId }
  }]
};
const losslessUnitsByRoot = {
  [sourceRoot]: { units: [{ unit_id: unitId, source_id: "SRC.001", title: "Example Activity" }] }
};
const inventory = buildFeatureCandidateInventoryBaseline(
  { activity_profile_source_index: activityProfileSourceIndex },
  losslessUnitsByRoot,
  { runId: "PHASE5-LAYER1-CONTRACT-CHECK" }
);
assert.equal(inventory.canonical_candidate_count, 1);
assert.equal(inventory.candidates[0].evidence_grounded, true);
assert.equal(validateFeatureCandidateInventoryIndex(inventory).status, "PASS");

console.log("Activity Candidate Inventory Layer 1 contract/runtime cutover: PASS");

function read(relativePath) {
  return fs.readFileSync(path.join(backendRoot, relativePath), "utf8");
}

function functionBody(text, functionName, nextFunctionName) {
  const start = text.indexOf(`async function ${functionName}`);
  const end = text.indexOf(`async function ${nextFunctionName}`, start);
  assert.notEqual(start, -1, `${functionName} missing`);
  assert.notEqual(end, -1, `${nextFunctionName} missing after ${functionName}`);
  return text.slice(start, end);
}
