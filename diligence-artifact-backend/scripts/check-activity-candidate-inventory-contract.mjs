import assert from "node:assert/strict";
import { getPipelineContract } from "../src/runtime/contracts/pipeline.contract.js";
import { ACTIVITY_CANDIDATE_INVENTORY_CONTRACT, activityCandidateInventoryReadArtifacts, activityCandidateInventoryWriteArtifacts, activityCandidateInventoryCandidateCreationFamilies } from "../src/phases/05-activity-profile-review/index.js";

const compatibilityContract = getPipelineContract("M8_FEATURE_CANDIDATE_INVENTORY");
const expectedReads = activityCandidateInventoryReadArtifacts();
const expectedWrites = activityCandidateInventoryWriteArtifacts();
const candidateFamilies = activityCandidateInventoryCandidateCreationFamilies();

assert.equal(ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.central_phase_id, "ACTIVITY_PROFILE_REVIEW");
assert.equal(ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.phase_job_id, "ACTIVITY_CANDIDATE_INVENTORY");
assert.equal(ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.public_label, "Activity Candidate Inventory");
assert.equal(ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.compatibility_internal_job_id, "M8_FEATURE_CANDIDATE_INVENTORY");
assert.equal(ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.implementation_status, "CONTRACT_LOCKED_DETERMINISTIC_INDEX_MIGRATION_PENDING");
assert.equal(ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.model_usage, "NONE_DETERMINISTIC");
assert.equal(ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.production_entrypoint_switched, false);
assert.equal(ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.global_production_deployment_switched, false);

assert.deepEqual(expectedWrites, ["feature_candidate_inventory"]);
assert.deepEqual(candidateFamilies, ["P1_PRODUCT", "P2_PLATFORM_FEATURE_SOLUTION", "P3_AI_CAPABILITY_TECHNICAL", "P5_ENTERPRISE_PRICING"]);
assert.equal(ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.source_family_scope.p4_use_case_industry_candidate_creation_allowed, false);
assert.equal(ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.source_family_scope.p4_reserved_for_activity_profile_review_context, true);

for (const read of expectedReads) assert.equal(compatibilityContract.reads.includes(read), true, `legacy runtime contract missing required read: ${read}`);
assert.deepEqual(compatibilityContract.writes, expectedWrites);
assert.equal(compatibilityContract.central_phase_id, "ACTIVITY_PROFILE_REVIEW");
assert.equal(compatibilityContract.public_label, "Activity Profile Review");
assert.equal(compatibilityContract.next, "M8_TARGET_FEATURE_PROFILE");
assert.equal(compatibilityContract.reads.includes("lossless_family__P4_USE_CASE_INDUSTRY"), true, "legacy runtime still reads P4 until cutover; new contract forbids P4 candidate creation");
assert.equal(expectedReads.includes("lossless_family__P4_USE_CASE_INDUSTRY"), false, "phase-owned inventory contract must not use P4 for candidate creation");

assert.equal(ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.output_contract.required_top_level_artifact, "feature_candidate_inventory");
assert.equal(ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.output_contract.inventory_version, "m8_feature_candidate_inventory_index_v1");
assert.equal(ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.output_contract.derivation_mode, "DETERMINISTIC_INDEX_NO_MODEL_NO_EVIDENCE_COMPILATION");
assert.equal(ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.output_contract.index_only, true);
assert.equal(ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.output_contract.no_evidence_text_copy, true);
assert.equal(ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.output_contract.no_archetype_or_surface_derivation, true);

for (const branch of ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.output_contract.required_branches) assert.equal(typeof branch === "string" && branch.length > 0, true);
for (const field of ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.output_contract.candidate_required_fields) assert.equal(typeof field === "string" && field.length > 0, true);
for (const field of ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.output_contract.source_pointer_required_fields) assert.equal(typeof field === "string" && field.length > 0, true);

for (const forbiddenRead of ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.forbidden_runtime_reads) assert.equal(expectedReads.includes(forbiddenRead), false, `forbidden read leaked into contract: ${forbiddenRead}`);

console.log("Activity Candidate Inventory contract: PASS");
