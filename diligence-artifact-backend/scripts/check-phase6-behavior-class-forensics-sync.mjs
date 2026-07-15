import assert from "node:assert/strict";
import { buildM8DeterministicFeatureForensics } from "../src/phases/_shared/forensics/profile-forensics.shared.js";

const output = buildM8DeterministicFeatureForensics({
  artifacts: {
    feature_candidate_inventory: {
      artifact_type: "feature_candidate_inventory",
      inventory_version: "m8_feature_candidate_inventory_index_v1",
      candidates: [{
        candidate_id: "FC.001",
        canonical_feature_key: "chat_assistant",
        candidate_name: "Chat Assistant",
        capability_key: "chat_assistant",
        wrapper_or_surface: "Example AI",
        source_pointers: []
      }],
      raw_feature_hit_index: [],
      canonicalization_index: [],
      dedup_index: [],
      parent_child_overlap_index: []
    },
    target_feature_profile: {
      activities: [{
        activity_reference: "ACT.001",
        product_service_wrapper: "Example AI",
        activity_feature_name: "Chat Assistant",
        activity_candidate_summary: "Public activity.",
        mechanics_proof: "Public mechanics proof.",
        autonomy_human_control_signal: "Human review.",
        data_content_object_touched: "User content.",
        external_internal_action_signal: "External user-facing action.",
        primary_classification: {
          package_id: "ai-governance",
          behavior_class_codes: ["UNI"],
          behavior_class_derivation_basis: [{ code_or_token: "UNI", material_basis: "Fixture" }],
          surface_context_tokens: ["Consumer-Public"],
          surface_derivation_basis: [{ code_or_token: "Consumer-Public", material_basis: "Fixture" }]
        },
        overlay_classifications: [{
          overlay_id: "fintech-overlay",
          package_id: "fintech",
          behavior_class_codes: ["PAY"],
          behavior_class_derivation_basis: [{ code_or_token: "PAY", material_basis: "Fixture" }],
          surface_context_tokens: ["Transaction-Data"],
          surface_derivation_basis: [{ code_or_token: "Transaction-Data", material_basis: "Fixture" }]
        }]
      }],
      profile_level_limitations: []
    }
  }
}).target_feature_profile_forensics;

assert.equal(output.forensic_contract.contract_name, "M8_DETERMINISTIC_FORENSIC_TRACE_CONTRACT_V3_BEHAVIOR_CLASS");
assert.deepEqual(output.activity_trace_index[0].primary_classification.behavior_class_codes, ["UNI"]);
assert.deepEqual(output.activity_trace_index[0].overlay_classifications[0].behavior_class_codes, ["PAY"]);
assert.deepEqual(output.activity_trace_index[0].package_scoped_behavior_class_codes, ["ai-governance::UNI", "fintech::PAY"]);
assert.equal(Array.isArray(output.behavior_class_derivation_ledger), true);
assert.equal(output.behavior_class_derivation_ledger.length, 1);
assert.equal(JSON.stringify(output).includes("archetype_codes"), false);
assert.equal(JSON.stringify(output).includes("archetype_derivation_ledger"), false);

console.log("Phase 6 deterministic forensic Behavior Class preservation: PASS");
