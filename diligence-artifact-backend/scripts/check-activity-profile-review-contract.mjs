import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPipelineContract } from "../src/runtime/contracts/pipeline.contract.js";
import { validateM8TargetFeatureOutput } from "../src/m8-validator.js";
import {
  ACTIVITY_PROFILE_REVIEW_CONTRACT,
  activityProfileReviewActivityRowFields,
  activityProfileReviewCommercialAvailabilityFields,
  activityProfileReviewPromptFiles,
  activityProfileReviewReadArtifacts,
  activityProfileReviewReferenceFiles,
  activityProfileReviewWriteArtifacts
} from "../src/phases/05-activity-profile-review/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");
const runtimeContract = getPipelineContract("M8_TARGET_FEATURE_PROFILE");
const expectedReads = activityProfileReviewReadArtifacts();
const expectedWrites = activityProfileReviewWriteArtifacts();
const expectedPrompts = activityProfileReviewPromptFiles();
const expectedReferences = activityProfileReviewReferenceFiles();
const expectedActivityFields = activityProfileReviewActivityRowFields();
const expectedCommercialFields = activityProfileReviewCommercialAvailabilityFields();

assert.equal(ACTIVITY_PROFILE_REVIEW_CONTRACT.central_phase_id, "ACTIVITY_PROFILE_REVIEW");
assert.equal(ACTIVITY_PROFILE_REVIEW_CONTRACT.phase_job_id, "ACTIVITY_PROFILE_REVIEW_MATERIAL");
assert.equal(ACTIVITY_PROFILE_REVIEW_CONTRACT.public_label, "Activity Profile Review");
assert.equal(ACTIVITY_PROFILE_REVIEW_CONTRACT.compatibility_internal_job_id, "M8_TARGET_FEATURE_PROFILE");
assert.equal(ACTIVITY_PROFILE_REVIEW_CONTRACT.implementation_status, "MATERIAL_CONTRACT_LOCKED_RUNTIME_CUTOVER_PENDING");
assert.equal(ACTIVITY_PROFILE_REVIEW_CONTRACT.model_usage, "MODEL_JSON_ONLY");
assert.equal(ACTIVITY_PROFILE_REVIEW_CONTRACT.production_entrypoint_switched, false);
assert.equal(ACTIVITY_PROFILE_REVIEW_CONTRACT.global_production_deployment_switched, false);

assert.deepEqual(expectedReads, [
  "source_discovery_handoff",
  "target_profile",
  "target_profile_forensics",
  "feature_candidate_inventory",
  "lossless_family__P1_PRODUCT",
  "lossless_family__P2_PLATFORM_FEATURE_SOLUTION",
  "lossless_family__P3_AI_CAPABILITY_TECHNICAL",
  "lossless_family__P4_USE_CASE_INDUSTRY",
  "lossless_family__P5_ENTERPRISE_PRICING"
]);
assert.deepEqual(expectedWrites, ["target_feature_profile"]);
assert.deepEqual(runtimeContract.reads, expectedReads);
assert.deepEqual(runtimeContract.writes, expectedWrites);
assert.equal(runtimeContract.type, "model");
assert.equal(runtimeContract.agent_id, "agent_3_target_feature");
assert.equal(runtimeContract.central_phase_id, "ACTIVITY_PROFILE_REVIEW");
assert.equal(runtimeContract.public_label, "Activity Profile Review");
assert.equal(runtimeContract.next, "M8_TARGET_FEATURE_PROFILE_FORENSICS");
assert.deepEqual(runtimeContract.prompt_files, expectedPrompts);
assert.deepEqual(runtimeContract.references, expectedReferences);

assert.deepEqual(ACTIVITY_PROFILE_REVIEW_CONTRACT.output_contract.required_profile_keys, ["activities", "commercial_availability_posture", "profile_level_limitations"]);
assert.deepEqual(expectedActivityFields, [
  "activity_reference",
  "product_service_wrapper",
  "activity_feature_name",
  "activity_candidate_summary",
  "mechanics_proof",
  "autonomy_human_control_signal",
  "data_content_object_touched",
  "external_internal_action_signal",
  "archetype_codes",
  "archetype_proof",
  "surface_context_tokens",
  "surface_proof_and_routing_limits"
]);
assert.deepEqual(expectedCommercialFields, [
  "posture",
  "free_trial_freemium_signal",
  "beta_pilot_early_access_signal",
  "paid_production_enterprise_plan_signal",
  "evidence_basis",
  "limitation"
]);
assert.equal(ACTIVITY_PROFILE_REVIEW_CONTRACT.output_contract.archetype_codes_required_non_empty, true);
assert.equal(ACTIVITY_PROFILE_REVIEW_CONTRACT.output_contract.surface_context_tokens_required_array_may_be_empty, true);
assert.equal(ACTIVITY_PROFILE_REVIEW_CONTRACT.source_authority.candidate_universe_artifact, "feature_candidate_inventory");
assert.equal(ACTIVITY_PROFILE_REVIEW_CONTRACT.source_authority.p4_use_case_industry_context_allowed, true);
assert.equal(ACTIVITY_PROFILE_REVIEW_CONTRACT.source_authority.p4_candidate_creation_allowed, false);

const runtimeBinding = read("agent-packages/agent_3_target_feature/AGENT3_RUNTIME_BINDING_PACKET.yaml");
const activePackage = read("agent-packages/agent_3_target_feature/03_M8_FEATURE_PROFILE_BACKEND_CURRENT.md");
const backendOutputContract = read("agent-packages/agent_3_target_feature/AGENT3_BACKEND_OUTPUT_CONTRACT.md");

for (const requiredText of [
  "src/phases/05-activity-profile-review/activity-profile-review.contract.js",
  "Activity Profile Review material output is controlled",
  "feature_candidate_inventory as candidate universe",
  "P1-P5 lossless artifacts as evidence",
  "P4 may support Activity Profile Review context"
]) assert.ok(runtimeBinding.includes(requiredText), `runtime binding missing: ${requiredText}`);

for (const requiredText of [
  "feature_candidate_inventory is the deterministic source of truth",
  "M8 must consume:",
  "lossless_family__P4_USE_CASE_INDUSTRY",
  "Every emitted activity must have at least one evidence-supported archetype code",
  "target_feature_profile.commercial_availability_posture",
  "target_feature_profile has exactly `activities[]`, `commercial_availability_posture`, and `profile_level_limitations[]`"
]) assert.ok(activePackage.includes(requiredText), `active M8 package missing: ${requiredText}`);

for (const requiredText of [
  "Activity Profile Review material response shape",
  "target_feature_profile",
  "commercial_availability_posture",
  "posture",
  "free_trial_freemium_signal",
  "beta_pilot_early_access_signal",
  "paid_production_enterprise_plan_signal",
  "evidence_basis",
  "limitation"
]) assert.ok(backendOutputContract.includes(requiredText), `backend output contract missing: ${requiredText}`);

validateM8TargetFeatureOutput(validMaterialOutput(), { phase: "M8_TARGET_FEATURE_PROFILE" });
await expectValidatorFailure(invalidMaterialOutputWithForensics(), "target_feature_profile contains blocked material key");
await expectValidatorFailure(invalidMaterialOutputMissingCommercial(), "target_feature_profile missing keys: commercial_availability_posture");
await expectValidatorFailure(invalidMaterialOutputMissingArchetype(), "archetype_codes must be non-empty array");

console.log("Activity Profile Review contract: PASS");

function validMaterialOutput() {
  return {
    target_feature_profile: {
      activities: [
        {
          activity_reference: "ACT.001",
          product_service_wrapper: "Example API",
          activity_feature_name: "Speech-to-text API",
          activity_candidate_summary: "Converts spoken audio into text for customer-facing developer use.",
          mechanics_proof: "Reviewed product/API material describes speech recognition capability for submitted audio.",
          autonomy_human_control_signal: "Automated API-mediated processing with customer invocation.",
          data_content_object_touched: "Speech/audio and generated text.",
          external_internal_action_signal: "Developer-facing and customer-facing API activity.",
          archetype_codes: ["TRN"],
          archetype_proof: "The activity transforms audio input into text output.",
          surface_context_tokens: ["Content&IP"],
          surface_proof_and_routing_limits: "Audio and generated transcript content are visible from reviewed product/API material."
        }
      ],
      commercial_availability_posture: {
        posture: "Paid production / enterprise availability visible from reviewed public material.",
        free_trial_freemium_signal: "No visible free/freemium signal in the reviewed material.",
        beta_pilot_early_access_signal: "No visible beta/pilot signal in the reviewed material.",
        paid_production_enterprise_plan_signal: "Public material references paid API or enterprise commercial access.",
        evidence_basis: ["Pricing or product material referenced paid API or enterprise access."],
        limitation: "No material commercial availability limitation identified from reviewed public material."
      },
      profile_level_limitations: []
    }
  };
}

function invalidMaterialOutputWithForensics() {
  const output = validMaterialOutput();
  output.target_feature_profile.runtime_trace = [];
  return output;
}

function invalidMaterialOutputMissingCommercial() {
  const output = validMaterialOutput();
  delete output.target_feature_profile.commercial_availability_posture;
  return output;
}

function invalidMaterialOutputMissingArchetype() {
  const output = validMaterialOutput();
  output.target_feature_profile.activities[0].archetype_codes = [];
  return output;
}

async function expectValidatorFailure(output, fragment) {
  let failed = false;
  try {
    validateM8TargetFeatureOutput(output, { phase: "M8_TARGET_FEATURE_PROFILE" });
  } catch (error) {
    failed = true;
    assert.ok(String(error.message).includes(fragment), `expected ${fragment}, got ${error.message}`);
  }
  assert.equal(failed, true, `expected validator failure containing ${fragment}`);
}

function read(relativePath) {
  return fs.readFileSync(path.join(backendRoot, relativePath), "utf8");
}
