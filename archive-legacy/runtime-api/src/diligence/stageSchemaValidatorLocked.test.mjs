import assert from "node:assert/strict";
import { validateDiligenceStageOutput } from "./stageSchemaValidator.js";

const stage4 = {
  company_profile_version: "legacy",
  stray_top: true,
  identity: { brand_name: "Demo", legal_name: "Demo Ltd", extra_identity_key: "strip" },
  jurisdiction: { confidence: "very high", extra: "strip" },
  business_model: { company_type: "AI platform", market_type_candidate: "business to business", extra: "strip" },
  market_context: { regulated_sector_exposure: ["finance"], extra: "strip" },
  product_baseline: { delivery_app_candidate: "yes", delivery_api_candidate: "yes", extra: "strip" },
  vault_baseline_candidates: { baseline: { company: { value: "Demo Ltd", status: "ready" }, extra: "strip" }, compliance: { processes_pii: { value: "yes", status: "confirm" } }, extra: "strip" },
  pipeline_assumptions: { for_feature_map: "x", extra: "strip" },
  evidence: { field_evidence_refs: [{ field_path: "unknown_1", evidence_source_id: "evidence_1", extra: "strip" }], extra: "strip" },
  limitations: [{ message: "object limitation" }]
};

const stage4Result = validateDiligenceStageOutput("targetProfileV2", stage4);
assert.equal(stage4Result.ok, true, JSON.stringify(stage4Result.errors, null, 2));
assert.equal(stage4.target_profile_version, "target_profile_v2");
assert.ok(!Object.hasOwn(stage4, "stray_top"));

const stage5 = {
  feature_profile_version: "draft",
  stray_top: true,
  target_profile_ref: { brand_name: "Demo", extra: "strip" },
  product_feature_map: [{ feature_id: "legacy", feature_name: "Legacy feature", feature_role: "primary", evidence_quote: "Quote", feature_source_url: "https://demo.ai/product", surface_tokens: ["financial data"], surface_provenance: [{ surface_token: "payments", source_url: "https://demo.ai/product", evidence_quote: "Quote" }], archetype_codes: ["RDR"], archetype_provenance: [{ archetype_code: "RDR", source_url: "https://demo.ai/product", evidence_quote: "Quote" }], data_provenance: [{ data_subject: "End users", data_category: "voice audio", source_url: "https://demo.ai/product", evidence_quote: "Quote", extra: "strip" }], extra_feature_key: "strip" }],
  commercial_scan: { stray: true },
  vault_feature_candidates: { architecture: { memory: true }, stray: true },
  evidence: { field_evidence_refs: [{ field_path: "unknown_1", evidence_source_id: "evidence_1", source_url: "", extra: "strip" }], extra_evidence_key: true },
  limitations: [{ message: "object limitation" }]
};

const stage5Result = validateDiligenceStageOutput("targetFeatureProfile", stage5);
assert.equal(stage5Result.ok, true, JSON.stringify(stage5Result.errors, null, 2));
assert.equal(stage5.feature_profile_version, "feature_profile_v2");
assert.equal(stage5.product_feature_map.length, 0);
assert.equal(stage5.feature_inventory[0].data_provenance[0].data_subject, "user");
assert.ok(!Object.hasOwn(stage5, "stray_top"));
assert.ok(!Object.hasOwn(stage5.commercial_scan, "stray"));
assert.ok(!Object.hasOwn(stage5.evidence, "extra_evidence_key"));

console.log(JSON.stringify({ ok: true, test: "stageSchemaValidatorLocked", stage4_mode: stage4Result.validation_mode, stage5_mode: stage5Result.validation_mode }, null, 2));
