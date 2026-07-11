import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  FEATURE_CANDIDATE_INVENTORY_MODE,
  FEATURE_CANDIDATE_INVENTORY_VERSION,
  PROFILE_TOP_LEVEL_KEYS
} from "../src/phases/05-activity-profile-review/activity-profile.constants.js";
import {
  buildFeatureCandidateInventoryBaseline,
  validateFeatureCandidateInventoryIndex
} from "../src/phases/05-activity-profile-review/services/activity-candidate-inventory-index.builder.js";
import {
  validateFeatureCandidateCoverage,
  buildM8FeatureCoverageForensics
} from "../src/phases/_shared/forensics/activity-candidate-coverage.shared.js";
import { FEATURE_CANDIDATE_INDEX_BOUNDARY } from "../src/phases/05-activity-profile-review/services/activity-candidate-inventory.boundary.js";
import { ACTIVITY_CANDIDATE_INVENTORY_CONTRACT } from "../src/phases/05-activity-profile-review/activity-candidate-inventory.contract.js";
import { ACTIVITY_PROFILE_REVIEW_CONTRACT } from "../src/phases/05-activity-profile-review/activity-profile-review.contract.js";
import { ACTIVITY_CANDIDATE_INVENTORY_RUNNER_STATUS } from "../src/phases/05-activity-profile-review/activity-candidate-inventory.runner.js";
import { ACTIVITY_PROFILE_REVIEW_RUNNER_STATUS } from "../src/phases/05-activity-profile-review/activity-profile-review.runner.js";

const root = process.cwd();
const read = (relative) => readFile(path.join(root, relative), "utf8");

const files = Object.freeze({
  binding: "agent-packages/agent_3_target_feature/AGENT3_RUNTIME_BINDING_PACKET.yaml",
  controller: "agent-packages/agent_3_target_feature/00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED.md",
  candidatePrompt: "agent-packages/agent_3_target_feature/03A_M8_FEATURE_CANDIDATE_INVENTORY_DETERMINISTIC_LED_SEMANTIC_SUPPORTED.md",
  profilePrompt: "agent-packages/agent_3_target_feature/03_M8_FEATURE_PROFILE_BACKEND_CURRENT.md",
  profileAddendum: "agent-packages/agent_3_target_feature/03B_M8_ACTIVITY_PROFILE_PACKAGE_AWARE_SYNC.md",
  backendContract: "agent-packages/agent_3_target_feature/AGENT3_BACKEND_OUTPUT_CONTRACT.md",
  pipelineContract: "src/runtime/contracts/pipeline.contract.js",
  pipelineService: "src/runtime/services/pipeline.service.js",
  builder: "src/phases/05-activity-profile-review/services/activity-candidate-inventory-index.builder.js",
  sharedCoverage: "src/phases/_shared/forensics/activity-candidate-coverage.shared.js",
  sharedForensics: "src/phases/_shared/forensics/profile-forensics.shared.js"
});

const text = Object.fromEntries(await Promise.all(
  Object.entries(files).map(async ([key, file]) => [key, await read(file)])
));

for (const marker of [
  "ACTIVITY_CANDIDATE_SEMANTIC_PROMPT_FILES",
  "deterministic_led_semantic_supported",
  "03A_M8_FEATURE_CANDIDATE_INVENTORY_DETERMINISTIC_LED_SEMANTIC_SUPPORTED.md"
]) assert.ok(text.pipelineContract.includes(marker), `pipeline contract missing ${marker}`);

for (const marker of [
  "buildPrompt: (p) => buildPhasePrompt(p)",
  "callProvider: ({ prompt, phase }) => callProviderJson({ prompt, phase })"
]) assert.ok(text.pipelineService.includes(marker), `pipeline service missing ${marker}`);

for (const marker of [
  "primary_classification",
  "overlay_classifications",
  "mounted_taxonomy_ref"
]) {
  for (const key of ["binding", "profilePrompt", "profileAddendum", "backendContract"]) {
    assert.ok(text[key].includes(marker), `${files[key]} missing ${marker}`);
  }
}

for (const [key, value] of Object.entries(text)) {
  for (const stale of [
    "03A_M8_FEATURE_CANDIDATE_INVENTORY_DETERMINISTIC.md",
    "DETERMINISTIC_INDEX_FROM_ACTIVITY_PROFILE_SOURCE_INDEX_NO_MODEL_NO_EVIDENCE_COMPILATION",
    "m8_feature_candidate_inventory_index_v2_phase2c",
    "AI_ONLY_LOCKED_ENUM",
    "AI_ONLY_SURFACE_ENUM"
  ]) assert.equal(value.includes(stale), false, `${files[key]} contains stale marker ${stale}`);
}

assert.equal(FEATURE_CANDIDATE_INVENTORY_VERSION, "m8_feature_candidate_inventory_index_v4_deterministic_led_semantic_supported");
assert.equal(FEATURE_CANDIDATE_INVENTORY_MODE, "DETERMINISTIC_LED_SEMANTIC_SUPPORTED_FROM_INDEX_MAPPED_LOSSLESS_UNITS_NO_TEXT_COPY");
assert.deepEqual([...PROFILE_TOP_LEVEL_KEYS], [
  "activities",
  "commercial_availability_posture",
  "profile_level_limitations",
  "mounted_taxonomy_ref"
]);

for (const [key, expected] of Object.entries({
  deterministic_baseline_only: true,
  source_index_is_navigation_only: true,
  lossless_primary_evidence_read: true,
  phase2g_routed_packet_is_read_ceiling: true,
  semantic_support_non_authoritative: true,
  deterministic_reconciliation_required: true
})) assert.equal(FEATURE_CANDIDATE_INDEX_BOUNDARY[key], expected, `boundary mismatch ${key}`);

const sourceRoot = "lossless_root__product_service";
const unitId = "unit-product-1";
const activityProfileSourceIndex = {
  run_id: "PHASE5-PASS1-7-CHECK",
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
  { runId: "PHASE5-PASS1-7-CHECK" }
);
assert.equal(inventory.canonical_candidate_count, 1);
assert.equal(inventory.candidates[0].evidence_grounded, true);
assert.equal(validateFeatureCandidateInventoryIndex(inventory).status, "PASS");

const profile = {
  activities: [{
    activity_reference: "ACT.001",
    source_candidate_ids: [inventory.candidates[0].candidate_id]
  }]
};
const coverage = validateFeatureCandidateCoverage(inventory, profile);
assert.equal(coverage.coverage_result, "PASS");
assert.equal(buildM8FeatureCoverageForensics(inventory, profile, { coverageResult: coverage }).validation_result.coverage_result, "PASS");

assert.equal(text.builder.includes("export function validateFeatureCandidateCoverage"), false, "coverage validator still owned by Layer 1 builder");
assert.ok(text.sharedCoverage.includes("export function validateFeatureCandidateCoverage"), "shared coverage validator missing");
assert.ok(text.sharedForensics.includes("primary_classification"), "shared forensics missing split taxonomy");
assert.ok(text.sharedForensics.includes("overlay_classifications"), "shared forensics missing overlay taxonomy");
assert.equal(text.sharedForensics.includes("samvaad"), false, "shared forensics contains target-specific alias");
assert.equal(text.sharedForensics.includes("akshar"), false, "shared forensics contains target-specific alias");

assert.equal(ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.semantic_support.semantic_support_non_blocking, true);
assert.equal(ACTIVITY_PROFILE_REVIEW_CONTRACT.mounted_taxonomy_ref_stamped_by_backend, true);
assert.equal(ACTIVITY_CANDIDATE_INVENTORY_RUNNER_STATUS.production_entrypoint_switched, true);
assert.equal(ACTIVITY_PROFILE_REVIEW_RUNNER_STATUS.primary_overlay_schema_active, true);

console.log(JSON.stringify({
  check: "phase5 pass1-7 cutover",
  status: "PASS",
  inventory_version: FEATURE_CANDIDATE_INVENTORY_VERSION,
  candidate_count: inventory.canonical_candidate_count,
  gates: [
    "PHASE2G_INDEX_NAVIGATION_TO_PRIMARY_EVIDENCE",
    "DETERMINISTIC_LED_SEMANTIC_SUPPORTED_LAYER1",
    "MOUNTED_PRIMARY_OVERLAY_TAXONOMY_LAYER2",
    "SHARED_FORENSICS_COVERAGE_OWNERSHIP",
    "NO_TARGET_SPECIFIC_ALIASES",
    "NO_STALE_V2_BOUNDARY"
  ]
}, null, 2));
