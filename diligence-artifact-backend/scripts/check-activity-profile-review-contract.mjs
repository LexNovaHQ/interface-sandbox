import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getPipelineContract } from "../src/runtime/contracts/pipeline.contract.js";
import {
  ACTIVITY_PROFILE_REVIEW_CONTRACT,
  activityProfileReviewActivityRowFields,
  activityProfileReviewCommercialAvailabilityFields,
  activityProfileReviewMountedTaxonomyRefFields,
  activityProfileReviewOverlayClassificationFields,
  activityProfileReviewPrimaryClassificationFields,
  activityProfileReviewReadArtifacts,
  activityProfileReviewReferenceFiles,
  activityProfileReviewWriteArtifacts
} from "../src/phases/05-activity-profile-review/index.js";
import {
  CLASSIFICATION_BLOCK_FIELDS,
  OVERLAY_CLASSIFICATION_BLOCK_FIELDS,
  PROFILE_TOP_LEVEL_KEYS,
  SHARED_ACTIVITY_FIELDS
} from "../src/phases/05-activity-profile-review/activity-profile.constants.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");

const runtimeContract = getPipelineContract("M8_TARGET_FEATURE_PROFILE");

assert.equal(ACTIVITY_PROFILE_REVIEW_CONTRACT.contract_name, "ACTIVITY_PROFILE_REVIEW_CONTRACT_v8_AGNOSTIC_TAXONOMY");
assert.equal(ACTIVITY_PROFILE_REVIEW_CONTRACT.model_usage, "MODEL_JSON_ONLY_PACKAGE_TAXONOMY_INJECTED");
assert.equal(ACTIVITY_PROFILE_REVIEW_CONTRACT.mounted_taxonomy_ref_stamped_by_backend, true);
assert.equal(ACTIVITY_PROFILE_REVIEW_CONTRACT.primary_overlay_schema_active, true);

assert.deepEqual(activityProfileReviewReadArtifacts(), ["phase_routing_manifest"]);
assert.deepEqual(activityProfileReviewWriteArtifacts(), ["target_feature_profile"]);
assert.deepEqual(activityProfileReviewReferenceFiles(), [
  "references/registry/Diligence_Field_Derivation_Registry.yml",
  "FORENSIC_ANNEXURE_REGISTRY_v1_LOCKED.yaml"
]);

assert.deepEqual(ACTIVITY_PROFILE_REVIEW_CONTRACT.output_contract.required_profile_keys, PROFILE_TOP_LEVEL_KEYS);
assert.deepEqual(activityProfileReviewActivityRowFields(), [...SHARED_ACTIVITY_FIELDS, "primary_classification", "overlay_classifications"]);
assert.deepEqual(activityProfileReviewPrimaryClassificationFields(), CLASSIFICATION_BLOCK_FIELDS);
assert.deepEqual(activityProfileReviewOverlayClassificationFields(), OVERLAY_CLASSIFICATION_BLOCK_FIELDS);
assert.deepEqual(activityProfileReviewMountedTaxonomyRefFields(), ["primary_package_id", "primary_key_version", "overlays"]);
assert.deepEqual(activityProfileReviewCommercialAvailabilityFields(), [
  "posture",
  "free_trial_freemium_signal",
  "beta_pilot_early_access_signal",
  "paid_production_enterprise_plan_signal",
  "evidence_basis",
  "limitation"
]);

assert.equal(runtimeContract.central_phase_id, "ACTIVITY_PROFILE_REVIEW");
assert.equal(runtimeContract.public_label, "Activity Profile Review");
assert.equal(runtimeContract.type, "model");
assert.deepEqual(runtimeContract.reads, ["phase_routing_manifest"]);
assert.deepEqual(runtimeContract.writes, ["target_feature_profile"]);
assert.equal(runtimeContract.model_usage, "MODEL_JSON_ONLY_PACKAGE_TAXONOMY_INJECTED");
assert.equal(runtimeContract.mounted_taxonomy_ref_stamped_by_backend, true);
assert.equal(runtimeContract.primary_overlay_schema_active, true);
assert.equal(runtimeContract.provider_injected_by_central_runtime, true);

for (const forbidden of [
  "references/registry/AI_Registry_Key.yml",
  "references/registry/FinTech_Registry_Key.yml",
  "lossless_root__ai_safety_transparency",
  "validator_module",
  "src/m8-validator.js",
  "AI_ONLY_LOCKED_ENUM",
  "AI_ONLY_SURFACE_ENUM"
]) {
  assert.equal(read("src/phases/05-activity-profile-review/activity-profile-review.contract.js").includes(forbidden), false, `contract contains forbidden marker ${forbidden}`);
}

console.log("Activity Profile Review Layer 2 contract: PASS");

function read(relativePath) {
  return fs.readFileSync(path.join(backendRoot, relativePath), "utf8");
}
