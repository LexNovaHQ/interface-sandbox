import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { validateM8TargetFeatureOutput } from "../src/phases/05-activity-profile-review/validators/activity-profile-review.validator.js";
import { ACTIVITY_PROFILE_REVIEW_RUNNER_STATUS } from "../src/phases/05-activity-profile-review/activity-profile-review.runner.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");

const resolvedTaxonomy = {
  mounted_primary_package_id: "fintech",
  primary: {
    package_id: "fintech",
    key_version: "v1",
    archetype_vocabulary: [{ code: "PAY", normalized_name: "Payments", trigger_if: "payment activity visible", exclude_if: [] }],
    surface_axes: [{ axis_id: "surface", tokens: [{ token: "consumer-payment", normalized_name: "Consumer payment", trigger_if: "consumer payment surface visible" }] }],
    evidence_roots: [],
    grammar: {}
  },
  overlays: [{
    overlay_id: "ai-native",
    package_id: "ai-governance",
    key_version: "v1",
    archetype_vocabulary: [{ code: "UNI", normalized_name: "AI Universal Interaction", trigger_if: "AI interaction visible", exclude_if: [] }],
    surface_axes: [{ axis_id: "surface", tokens: [{ token: "ai-interface", normalized_name: "AI interface", trigger_if: "AI interface visible" }] }],
    evidence_roots: [],
    grammar: {}
  }],
  excluded_regulatory_overlay_ids: ["rbi"],
  limitations: [],
  routing_limitations: []
};

validateM8TargetFeatureOutput(validOutput(), { phase: "M8_TARGET_FEATURE_PROFILE", resolvedTaxonomy });

expectFailure(mutated((output) => {
  delete output.target_feature_profile.mounted_taxonomy_ref;
}), "missing keys: mounted_taxonomy_ref");

expectFailure(mutated((output) => {
  output.target_feature_profile.activities[0].archetype_codes = ["OLD_FLAT"];
}), "extra keys: archetype_codes");

expectFailure(mutated((output) => {
  output.target_feature_profile.activities[0].primary_classification.archetype_codes = ["BAD"];
  output.target_feature_profile.activities[0].primary_classification.archetype_derivation_basis[0].code_or_token = "BAD";
}), "outside package vocabulary:BAD");

expectFailure(mutated((output) => {
  output.target_feature_profile.activities[0].overlay_classifications[0].overlay_id = "missing-overlay";
}), "unresolved overlay block forbidden");

expectFailure(mutated((output) => {
  output.target_feature_profile.activities[0].runtime_trace = [];
}), "blocked material key");

const unkeyedTaxonomy = {
  mounted_primary_package_id: "saas",
  primary: null,
  overlays: [],
  excluded_regulatory_overlay_ids: [],
  limitations: ["PRIMARY_PACKAGE_HAS_NO_TAXONOMY_KEY:saas"],
  routing_limitations: []
};
validateM8TargetFeatureOutput(unkeyedOutput(), { phase: "M8_TARGET_FEATURE_PROFILE", resolvedTaxonomy: unkeyedTaxonomy });

assert.equal(ACTIVITY_PROFILE_REVIEW_RUNNER_STATUS.mounted_taxonomy_resolver_required, true);
assert.equal(ACTIVITY_PROFILE_REVIEW_RUNNER_STATUS.mounted_taxonomy_ref_stamped_by_backend, true);
assert.equal(ACTIVITY_PROFILE_REVIEW_RUNNER_STATUS.primary_overlay_schema_active, true);
assert.equal(ACTIVITY_PROFILE_REVIEW_RUNNER_STATUS.regulatory_overlays_excluded_from_classification, true);

const runnerText = read("src/phases/05-activity-profile-review/activity-profile-review.runner.js");
assert.ok(runnerText.includes("resolveActivityTaxonomy"), "runner must call taxonomy resolver");
assert.ok(runnerText.includes("DECLARED_ACTIVITY_EVIDENCE_ROOT_NOT_ROUTED"), "runner must record declared-but-unrouted roots");
assert.ok(runnerText.includes("mounted_taxonomy_ref"), "runner must stamp mounted taxonomy ref");
assert.ok(runnerText.includes("resolvedTaxonomy"), "runner must pass resolved taxonomy to validator");

const validatorText = read("src/phases/05-activity-profile-review/validators/activity-profile-review.validator.js");
for (const forbidden of ["AI_ONLY_LOCKED_ENUM", "AI_ONLY_SURFACE_ENUM", "validateNoAiOnlyEnumLock", "Consumer-Public"]) {
  assert.equal(validatorText.includes(forbidden), false, `validator contains forbidden marker ${forbidden}`);
}

console.log("Phase 5 Layer 2 contract/runner/validator: PASS");

function validOutput() {
  return {
    target_feature_profile: {
      activities: [{
        activity_reference: "ACT.001",
        product_service_wrapper: "Payments API",
        activity_feature_name: "Payment initiation",
        activity_candidate_summary: "Payment initiation capability is visible from reviewed product materials.",
        mechanics_proof: "Reviewed activity evidence supports a payment initiation workflow.",
        autonomy_human_control_signal: "Customer-initiated workflow with automated platform processing.",
        data_content_object_touched: "Payment instruction and transaction metadata.",
        external_internal_action_signal: "Externally-facing customer/developer activity.",
        primary_classification: {
          package_id: "fintech",
          archetype_codes: ["PAY"],
          archetype_derivation_basis: [basis("PAY", "Payments")],
          surface_context_tokens: ["consumer-payment"],
          surface_derivation_basis: [basis("consumer-payment", "Consumer payment")]
        },
        overlay_classifications: [{
          package_id: "ai-governance",
          overlay_id: "ai-native",
          archetype_codes: ["UNI"],
          archetype_derivation_basis: [basis("UNI", "AI Universal Interaction")],
          surface_context_tokens: ["ai-interface"],
          surface_derivation_basis: [basis("ai-interface", "AI interface")]
        }]
      }],
      commercial_availability_posture: {
        posture: "Paid production availability visible from reviewed public materials.",
        free_trial_freemium_signal: "No free/freemium signal visible in reviewed material.",
        beta_pilot_early_access_signal: "No beta/pilot signal visible in reviewed material.",
        paid_production_enterprise_plan_signal: "Paid production or enterprise availability visible.",
        evidence_basis: ["Pricing or product material supports paid production availability."],
        limitation: "No additional commercial availability limitation identified."
      },
      profile_level_limitations: [],
      mounted_taxonomy_ref: {
        primary_package_id: "fintech",
        primary_key_version: "v1",
        overlays: [{ overlay_id: "ai-native", package_id: "ai-governance", key_version: "v1" }]
      }
    }
  };
}

function unkeyedOutput() {
  const output = validOutput();
  output.target_feature_profile.profile_level_limitations = ["PRIMARY_PACKAGE_HAS_NO_TAXONOMY_KEY:saas"];
  output.target_feature_profile.mounted_taxonomy_ref = {
    primary_package_id: "saas",
    primary_key_version: "",
    overlays: []
  };
  output.target_feature_profile.activities[0].primary_classification = {
    package_id: "saas",
    archetype_codes: [],
    archetype_derivation_basis: [],
    surface_context_tokens: [],
    surface_derivation_basis: []
  };
  output.target_feature_profile.activities[0].overlay_classifications = [];
  return output;
}

function basis(code_or_token, normalized_name) {
  return {
    code_or_token,
    normalized_name,
    conditions_satisfied: ["condition satisfied from reviewed material"],
    trigger_if_applied: "trigger_if condition applied",
    exclude_if_checked: "exclude_if checked; no exclusion applies",
    material_basis: "Business-readable basis from reviewed public activity evidence.",
    limitation: "No material limitation for this selected value."
  };
}

function mutated(fn) {
  const output = validOutput();
  fn(output);
  return output;
}

function expectFailure(output, fragment) {
  let failed = false;
  try {
    validateM8TargetFeatureOutput(output, { phase: "M8_TARGET_FEATURE_PROFILE", resolvedTaxonomy });
  } catch (error) {
    failed = true;
    assert.ok(String(error.message).includes(fragment), `expected ${fragment}, got ${error.message}`);
  }
  assert.equal(failed, true, `expected failure containing ${fragment}`);
}

function read(relativePath) {
  return fs.readFileSync(path.join(backendRoot, relativePath), "utf8");
}
