import assert from "node:assert/strict";
import { validateM7TargetProfileOutput, validateTargetProfileReviewOutput } from "../src/m7-validator.js";

const valid = {
  target_profile: {
    target_identity: {
      brand_name: "Example AI",
      legal_entity_name: "FIELD_NOT_PUBLIC",
      entity_type: "Company",
      reviewed_website: "https://example.test",
      primary_domain: "example.test"
    },
    jurisdiction_notice: {
      registered_notice_location: "FIELD_LIMITED",
      governing_law: "India",
      courts_venue: "Bengaluru courts"
    },
    business_context: {
      business_category: "AI software product",
      primary_customer_type: "Businesses",
      market_type_candidate: "B2B SaaS",
      industry_sector: "AI software",
      regulated_sector_hints: []
    },
    product_service_wrapper: {
      high_level_offering: "AI assistant platform",
      primary_public_claim: "Helps teams draft and review content",
      product_service_wrapper_names: ["Example AI"],
      delivery_model_signals: ["Web application"]
    },
    target_profile_limitations: [
      "Legal entity and registered notice location require qualified review because public target-family material was limited."
    ]
  }
};

validateTargetProfileReviewOutput(valid);
validateM7TargetProfileOutput(valid, { phase: "M7_TARGET_PROFILE" });

expectFailure({
  ...valid,
  target_profile: {
    ...valid.target_profile,
    legal_signal_derivation_profile: {}
  }
}, "legal_signal_derivation_profile");

expectFailure({
  ...valid,
  target_profile: {
    ...valid.target_profile,
    legal_cartography_index: {}
  }
}, "legal_cartography_index");

expectFailure({
  target_profile: {
    ...valid.target_profile,
    target_profile_limitations: []
  }
}, "controlled Target Profile Review fields require target_profile_limitations[]");

expectFailure({
  target_profile: {
    ...valid.target_profile,
    target_profile_limitations: [{ limitation: "Bad", source_url: "https://example.test/legal" }]
  }
}, "source_url");

expectFailure({
  target_profile: {
    ...valid.target_profile,
    target_profile_limitations: [{ field_id: "DAP.CM.001", limitation: "Wrong family" }]
  }
}, "DAP.CM.001");

expectFailure({
  target_profile: {
    ...valid.target_profile,
    target_profile_limitations: ["consent_manager_signal_map should not drive target profile"]
  }
}, "consent_manager_signal_map");

expectFailure({
  target_profile: {
    ...valid.target_profile,
    target_identity: {
      ...valid.target_profile.target_identity,
      extra_field: "bad"
    }
  }
}, "extra_field");

console.log("Target Profile Review validator: PASS");

function expectFailure(output, fragment) {
  let failed = false;
  try {
    validateTargetProfileReviewOutput(output);
  } catch (error) {
    failed = true;
    assert.ok(String(error.message).includes(fragment), `expected failure containing ${fragment}, got ${error.message}`);
  }
  assert.equal(failed, true, `expected validator failure containing ${fragment}`);
}
