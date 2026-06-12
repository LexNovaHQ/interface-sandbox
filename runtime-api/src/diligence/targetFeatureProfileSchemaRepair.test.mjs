import assert from "node:assert/strict";
import { repairTargetFeatureProfileForSchema } from "./targetFeatureProfileSchemaRepair.js";
import { validateDiligenceStageOutput } from "./stageSchemaValidator.js";

const profile = {
  feature_profile_version: "target_feature_profile_v2",
  extra_root_key: "strip me",
  product_feature_map: [{
    feature_id: "voice_agent",
    feature_name: "Voice Agent",
    feature_role: "primary feature",
    commercial_function: "Customer voice conversations",
    delivery_channels: { api: true, app: "yes", web: "not sure", mobile: true },
    data_provenance: [{
      data_origin: "Enterprise customer",
      data_subject: "End users",
      data_category: "voice audio",
      processing_context: "voice agent conversation",
      storage_or_retention_signal: "not visible",
      training_or_finetuning_signal: "not visible",
      source_url: "https://sarvam.ai/products/conversational-agents",
      evidence_quote: "Deliver natural, real-time voice interactions",
      confidence: "High confidence",
      extra_data_key: "strip me"
    }],
    surface_tokens: ["financial data", "api infrastructure"],
    surface_provenance: [{
      surface_token: "payments",
      source_url: "https://sarvam.ai/products/conversational-agents",
      evidence_quote: "Process payments",
      extra_surface_key: "strip me"
    }],
    architecture_hints: [{ unexpected_nested_key: "ignored" }]
  }],
  data_provenance_map: [{ data_subject: "End users", extra: true }],
  regulated_surface_map: [{ surface_token: "finance", extra: true }],
  commercial_scan: { stray: true },
  vault_feature_candidates: { architecture: { should_not_exist: true }, baseline: {}, stray: true },
  evidence: {
    field_evidence_refs: [{ field_path: "unknown_1", evidence_source_id: "evidence_1", claim_supported: "SRC_003", source_url: "", evidence_quote: "", confidence: "unknown", stray: true }],
    extra_evidence_key: "strip me"
  },
  limitations: [{ message: "object limitation" }]
};

const repair = repairTargetFeatureProfileForSchema(profile);
assert.equal(repair.repaired, true);
assert.equal(profile.feature_profile_version, "feature_profile_v2");
assert.deepEqual(profile.product_feature_map, []);
assert.equal(profile.feature_inventory[0].data_provenance[0].data_subject, "user");
assert.equal(profile.data_provenance_map[0].data_subject, "user");
assert.ok(profile.feature_inventory[0].surface_tokens.includes("Financial"));
assert.ok(!profile.feature_inventory[0].surface_tokens.includes("Infrastructure"));
assert.equal(profile.regulated_surface_map.length, 1);
assert.equal(profile.regulated_surface_map[0].surface_token, "Financial");
assert.ok(!Object.prototype.hasOwnProperty.call(profile, "extra_root_key"));
assert.ok(!Object.prototype.hasOwnProperty.call(profile.feature_inventory[0].data_provenance[0], "extra_data_key"));
assert.ok(!Object.prototype.hasOwnProperty.call(profile.vault_feature_candidates, "architecture"));

const validation = validateDiligenceStageOutput("targetFeatureProfile", profile);
assert.equal(validation.ok, true, JSON.stringify(validation.errors, null, 2));

console.log(JSON.stringify({ ok: true, test: "targetFeatureProfileSchemaRepair", repair_notes: repair.repair_notes.length }, null, 2));
