import assert from "node:assert/strict";
import {
  CANDIDATE_CREATION_LOCATOR_MAPS,
  CONTEXT_ONLY_LOCATOR_MAPS,
  BASE_ACTIVITY_EVIDENCE_ROOTS,
  SHARED_ACTIVITY_FIELDS,
  DERIVATION_BASIS_FIELDS,
  CLASSIFICATION_BLOCK_FIELDS,
  OVERLAY_CLASSIFICATION_BLOCK_FIELDS,
  COMMERCIAL_AVAILABILITY_FIELDS,
  PROFILE_TOP_LEVEL_KEYS,
  FEATURE_CANDIDATE_FIELDS,
  SEMANTIC_SUPPORT_RECEIPT_FIELDS,
  SEMANTIC_PROPOSAL_FIELDS,
  SEMANTIC_PROPOSED_CANDIDATE_FIELDS,
  SEMANTIC_SUPPORT_ACTIONS,
  SEMANTIC_SUPPORT_STATUSES,
  FEATURE_CANDIDATE_INVENTORY_ARTIFACT,
  FEATURE_CANDIDATE_INVENTORY_VERSION,
  FEATURE_CANDIDATE_INVENTORY_MODE
} from "../src/phases/05-activity-profile-review/activity-profile.constants.js";

// Pass 1 skeleton only. Pass 8 expands this checker to compare the locked
// code constants against every active Phase 5 prompt/schema file.
const requiredArrays = {
  CANDIDATE_CREATION_LOCATOR_MAPS,
  CONTEXT_ONLY_LOCATOR_MAPS,
  BASE_ACTIVITY_EVIDENCE_ROOTS,
  SHARED_ACTIVITY_FIELDS,
  DERIVATION_BASIS_FIELDS,
  CLASSIFICATION_BLOCK_FIELDS,
  OVERLAY_CLASSIFICATION_BLOCK_FIELDS,
  COMMERCIAL_AVAILABILITY_FIELDS,
  PROFILE_TOP_LEVEL_KEYS,
  FEATURE_CANDIDATE_FIELDS,
  SEMANTIC_SUPPORT_RECEIPT_FIELDS,
  SEMANTIC_PROPOSAL_FIELDS,
  SEMANTIC_PROPOSED_CANDIDATE_FIELDS,
  SEMANTIC_SUPPORT_ACTIONS,
  SEMANTIC_SUPPORT_STATUSES
};

for (const [name, value] of Object.entries(requiredArrays)) {
  assert.ok(Array.isArray(value), `${name} must be an array`);
  assert.ok(Object.isFrozen(value), `${name} must be frozen`);
  assert.ok(value.length > 0, `${name} must not be empty`);
}

assert.equal(FEATURE_CANDIDATE_INVENTORY_ARTIFACT, "feature_candidate_inventory");
assert.equal(
  FEATURE_CANDIDATE_INVENTORY_VERSION,
  "m8_feature_candidate_inventory_index_v4_deterministic_led_semantic_supported"
);
assert.equal(
  FEATURE_CANDIDATE_INVENTORY_MODE,
  "DETERMINISTIC_LED_SEMANTIC_SUPPORTED_FROM_INDEX_MAPPED_LOSSLESS_UNITS_NO_TEXT_COPY"
);
assert.equal(BASE_ACTIVITY_EVIDENCE_ROOTS.includes("lossless_root__ai_safety_transparency"), false);

console.log("Phase 5 prompt/schema sync skeleton: PASS");
