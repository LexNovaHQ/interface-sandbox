import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  CLASSIFICATION_BLOCK_FIELDS,
  OVERLAY_CLASSIFICATION_BLOCK_FIELDS,
  DERIVATION_BASIS_FIELDS,
  COMMERCIAL_AVAILABILITY_FIELDS,
  PROFILE_TOP_LEVEL_KEYS,
  SHARED_ACTIVITY_FIELDS
} from "../src/phases/05-activity-profile-review/activity-profile.constants.js";
import { ACTIVITY_PROFILE_REVIEW_CONTRACT } from "../src/phases/05-activity-profile-review/activity-profile-review.contract.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");

const codeFiles = [
  "src/phases/05-activity-profile-review/activity-profile-review.contract.js",
  "src/phases/05-activity-profile-review/activity-profile-review.runner.js",
  "src/phases/05-activity-profile-review/validators/activity-profile-review.validator.js",
  "src/phases/05-activity-profile-review/activity-profile-review.phase.js",
  "src/phases/05-activity-profile-review/index.js",
  "src/phases/05-activity-profile-review/activity-profile.constants.js"
];

const text = codeFiles.map((file) => read(file)).join("\n");

for (const field of [
  ...PROFILE_TOP_LEVEL_KEYS,
  ...SHARED_ACTIVITY_FIELDS,
  "primary_classification",
  "overlay_classifications",
  ...CLASSIFICATION_BLOCK_FIELDS,
  ...OVERLAY_CLASSIFICATION_BLOCK_FIELDS,
  ...DERIVATION_BASIS_FIELDS,
  ...COMMERCIAL_AVAILABILITY_FIELDS,
  "mounted_taxonomy_ref",
  "primary_package_id",
  "primary_key_version",
  "overlays",
  "key_version"
]) {
  assert.ok(text.includes(field), `Layer 2 code missing schema field: ${field}`);
}

assert.deepEqual(ACTIVITY_PROFILE_REVIEW_CONTRACT.output_contract.required_profile_keys, PROFILE_TOP_LEVEL_KEYS);
assert.deepEqual(ACTIVITY_PROFILE_REVIEW_CONTRACT.output_contract.activity_row_fields, [...SHARED_ACTIVITY_FIELDS, "primary_classification", "overlay_classifications"]);
assert.deepEqual(ACTIVITY_PROFILE_REVIEW_CONTRACT.output_contract.primary_classification_fields, CLASSIFICATION_BLOCK_FIELDS);
assert.deepEqual(ACTIVITY_PROFILE_REVIEW_CONTRACT.output_contract.overlay_classification_fields, OVERLAY_CLASSIFICATION_BLOCK_FIELDS);

for (const forbidden of [
  "AI_ONLY_LOCKED_ENUM",
  "AI_ONLY_SURFACE_ENUM",
  "validateNoAiOnlyEnumLock",
  "lossless_root__ai_safety_transparency",
  "references/registry/AI_Registry_Key.yml",
  "references/registry/FinTech_Registry_Key.yml",
  "src/m8-validator.js",
  "validator_module"
]) {
  assert.equal(text.includes(forbidden), false, `Layer 2 code contains forbidden marker: ${forbidden}`);
}

console.log("Phase 5 Layer 2 code schema sync: PASS");

function read(relativePath) {
  return fs.readFileSync(path.join(backendRoot, relativePath), "utf8");
}
