import assert from "node:assert/strict";
import { validateTargetFeatureProfileGuardrails } from "./targetFeatureProfileGuardrails.js";

const sourceUrl = "https://example.ai/products/speech";
const crossPackageUrl = "https://example.ai/privacy-policy";
const featureRef = "SRC_001#C001";
const privacyRef = "SRC_009#C001";

const evidenceBuffer = [{
  evidence_source_id: "SRC_001",
  source_family: "product_profile",
  source_url: sourceUrl,
  final_url: sourceUrl,
  clean_text_lossless: "Speech-to-text API converts uploaded audio into text. Developers can use the transcript in their applications.",
  source_citation_manifest: [{ evidence_ref_id: featureRef, evidence_source_id: "SRC_001", chunk_id: "C001", source_url: sourceUrl, start_char: 0, end_char: 88, text_sha256: "fixture" }]
}];

const packageInput = {
  target_feature_candidate_index: {
    index_version: "stage5_feature_candidate_index_v1",
    indexing_policy: "deterministic_high_recall_not_final_judgment",
    candidate_count: 1,
    candidates: [{
      candidate_id: "CAND_001",
      normalized_label: "speech transcription",
      raw_label: "Speech transcription",
      source_id: "SRC_001",
      source_url: sourceUrl,
      candidate_type: "commercial_function",
      evidence_locator: featureRef,
      duplicate_cluster_id: null,
      duplicate_of: null,
      index_reason: "fixture candidate"
    }]
  },
  product_family_primary_sources: [{ source_id: "SRC_001", source_url: sourceUrl, source_family: "product_profile" }],
  source_bundle: {
    target_input: { primary_url: "https://example.ai" },
    evidence_buffer: evidenceBuffer,
    source_citation_manifest: [{ evidence_ref_id: featureRef, evidence_source_id: "SRC_001", chunk_id: "C001", source_url: sourceUrl, start_char: 0, end_char: 88, text_sha256: "fixture" }],
    evidence_ref_manifest: [{ evidence_ref_id: featureRef, evidence_source_id: "SRC_001", chunk_id: "C001", source_url: sourceUrl, start_char: 0, end_char: 88, text_sha256: "fixture" }]
  },
  target_profile_v2: {
    identity: { domain: "example.ai", website: "https://example.ai" },
    data_touchpoint_map: [{ source_url: crossPackageUrl, evidence_refs: [privacyRef] }]
  }
};

function baseProfile() {
  const data = {
    data_origin: "customer_provided",
    data_subject: "user",
    data_category: "audio",
    processing_context: "Uploaded audio is processed into transcript text.",
    storage_or_retention_signal: "not visible in admitted evidence",
    training_or_finetuning_signal: "not visible in admitted evidence",
    source_url: sourceUrl,
    evidence_refs: [featureRef],
    confidence: "high"
  };
  return {
    feature_profile_version: "feature_profile_v2",
    target_profile_ref: { target_profile_version: "target_profile_v2", brand_name: "Example AI", legal_name: "Example AI Inc.", domain: "example.ai" },
    feature_inventory: [{
      feature_id: "F001",
      feature_name: "Speech transcription",
      feature_role: "CORE",
      commercial_function: "Convert uploaded audio into transcript text.",
      business_label_or_product_area: "Speech API",
      feature_description: "Developers send audio and receive transcript text.",
      actor_or_user: "developer",
      input_data: ["audio"],
      system_action: "processes uploaded audio into text",
      output_or_result: "transcript text",
      autonomy_level: "none",
      human_review_signal: "not_visible",
      external_action_signal: "false",
      delivery_channels: { app: "false", api: "true", web: "unknown" },
      data_provenance: [{ ...data }],
      archetype_codes: ["TRN"],
      archetype_labels: ["The Translator"],
      archetype_provenance: [{ archetype_code: "TRN", registry_key_detection_logic: "Transforms speech to text", matched_feature_behavior: "speech transcription", source_url: sourceUrl, evidence_refs: [featureRef], confidence: "high" }],
      surface_tokens: ["Content&IP"],
      surface_provenance: [{ surface_token: "Content&IP", registry_key_surface_meaning: "content output", matched_data_or_context: "transcript text", source_url: sourceUrl, evidence_refs: [featureRef], confidence: "medium" }],
      confidence: "high",
      feature_source_url: sourceUrl,
      evidence_refs: [featureRef],
      linked_threat_ids: []
    }],
    product_feature_map: [],
    data_provenance_map: [{ provenance_id: "DP001", feature_id: "F001", ...data }],
    regulated_surface_map: [{ surface_id: "RS001", feature_id: "F001", surface_token: "Content&IP", int_ext_classification: "external", basis: "transcript text", confidence: "medium", evidence_refs: [featureRef] }],
    architecture_hints: [{ hint_id: "AH001", feature_id: "F001", hint_type: "integration", hint_value: "API", disposition: "prefill_candidate", source_url: sourceUrl, evidence_refs: [featureRef], confidence: "medium" }],
    commercial_scan: { distinct_commercial_outcomes_seen: ["Speech transcription"], mapped_core_feature_ids: ["F001"], source_coverage: [{ source_id: "SRC_001", source_url: sourceUrl, source_family: "product_profile", coverage_status: "mapped", mapped_feature_ids: ["F001"], unmapped_reason: "", evidence_refs: [featureRef] }], unmapped_outcomes_due_to_insufficient_detail: [], completeness_status: "COMPLETE", completeness_warnings: [] },
    vault_feature_candidates: { baseline: {}, archetypes: {}, compliance: {} },
    evidence: { field_evidence_refs: [{ field_path: "/feature_inventory/0", evidence_refs: [featureRef], basis: "speech API evidence", confidence: "high" }], unresolved_questions: [] },
    limitations: []
  };
}

const valid = baseProfile();
const validResult = validateTargetFeatureProfileGuardrails(valid, { evidenceBuffer, packageInput });
assert.equal(validResult.ok, true, JSON.stringify(validResult.errors, null, 2));

const crossPackage = baseProfile();
crossPackage.feature_inventory[0].surface_provenance[0].source_url = crossPackageUrl;
crossPackage.feature_inventory[0].surface_provenance[0].evidence_refs = [privacyRef];
const crossPackageResult = validateTargetFeatureProfileGuardrails(crossPackage, { evidenceBuffer, packageInput });
assert.equal(crossPackageResult.ok, true, JSON.stringify(crossPackageResult.errors, null, 2));
assert.equal(crossPackageResult.errors.length, 0);

const legacy = baseProfile();
legacy.product_feature_map = [{ feature_id: "legacy_1" }];
const legacyResult = validateTargetFeatureProfileGuardrails(legacy, { evidenceBuffer, packageInput });
assert.equal(legacyResult.ok, true, JSON.stringify(legacyResult.errors, null, 2));
assert.equal(legacy.product_feature_map.length, 0);
assert.ok(legacyResult.repairs.some((repair) => repair.action === "cleared_legacy_product_feature_map"));

const missingRefs = baseProfile();
missingRefs.feature_inventory[0].evidence_refs = [];
const missingRefsResult = validateTargetFeatureProfileGuardrails(missingRefs, { evidenceBuffer, packageInput });
assert.equal(missingRefsResult.ok, true, JSON.stringify(missingRefsResult.errors, null, 2));
assert.ok(missingRefsResult.warnings.some((warning) => String(warning.message).includes("deterministic quote resolution unavailable")));

const wrongSource = baseProfile();
wrongSource.feature_inventory[0].feature_source_url = "https://attacker.example/products/unknown";
const wrongSourceResult = validateTargetFeatureProfileGuardrails(wrongSource, { evidenceBuffer, packageInput });
assert.equal(wrongSourceResult.ok, false);
assert.ok(wrongSourceResult.errors.some((error) => String(error.message).includes("first-party source")));

const linkedThreat = baseProfile();
linkedThreat.feature_inventory[0].linked_threat_ids = ["T-001"];
const linkedThreatResult = validateTargetFeatureProfileGuardrails(linkedThreat, { evidenceBuffer, packageInput });
assert.equal(linkedThreatResult.ok, true, JSON.stringify(linkedThreatResult.errors, null, 2));
assert.deepEqual(linkedThreat.feature_inventory[0].linked_threat_ids, []);
assert.ok(linkedThreatResult.repairs.some((repair) => repair.action === "cleared_premature_linked_threat_ids"));

const missingData = baseProfile();
missingData.feature_inventory[0].data_provenance = [];
const missingDataResult = validateTargetFeatureProfileGuardrails(missingData, { evidenceBuffer, packageInput });
assert.equal(missingDataResult.ok, true, JSON.stringify(missingDataResult.errors, null, 2));
assert.ok(missingDataResult.repairs.some((repair) => repair.action === "runtime_filled_missing_data_provenance"));

const incompatiblePackageInput = {
  ...packageInput,
  target_feature_candidate_index: {
    ...packageInput.target_feature_candidate_index,
    candidates: [{
      ...packageInput.target_feature_candidate_index.candidates[0],
      candidate_id: "CAND_TRANSLATION_001",
      candidate_cluster: "translation",
      normalized_label: "translation",
      raw_label: "Translation",
      candidate_type: "commercial_function",
      index_reason: "fixture incompatible mapping"
    }]
  }
};
const incompatible = baseProfile();
incompatible.commercial_scan.source_coverage[0].mapped_feature_ids = ["F001"];
const incompatibleResult = validateTargetFeatureProfileGuardrails(incompatible, { evidenceBuffer, packageInput: incompatiblePackageInput });
assert.equal(incompatibleResult.ok, true, JSON.stringify(incompatibleResult.errors, null, 2));
assert.ok(incompatibleResult.repairs.some((repair) => repair.action === "rerun_missing_stage5_candidate_or_source_accounting"));
assert.equal(incompatibleResult.target_feature_audit_ledger.candidate_walk_ledger[0].compatibility_status, "incompatible");

const incompatibleAfterRepairResult = validateTargetFeatureProfileGuardrails(incompatible, { evidenceBuffer, packageInput: { ...incompatiblePackageInput, completion_repair_request: { repair_version: "test" } } });
assert.equal(incompatibleAfterRepairResult.ok, false);
assert.ok(incompatibleAfterRepairResult.errors.some((error) => String(error.message).includes("after repair rerun")));

const invalidCoverage = baseProfile();
invalidCoverage.commercial_scan.source_coverage[0].mapped_feature_ids = [];
const invalidCoverageResult = validateTargetFeatureProfileGuardrails(invalidCoverage, { evidenceBuffer, packageInput });
assert.equal(invalidCoverageResult.ok, true, JSON.stringify(invalidCoverageResult.errors, null, 2));
assert.ok(invalidCoverageResult.repairs.some((repair) => repair.action === "rerun_missing_stage5_candidate_or_source_accounting"));

console.log(JSON.stringify({
  ok: true,
  test: "targetFeatureProfileGuardrails",
  valid_ok: validResult.ok,
  cross_package_ok: crossPackageResult.ok,
  legacy_alias_ok: legacyResult.ok,
  missing_refs_warning_count: missingRefsResult.warnings.length,
  wrong_source_error_count: wrongSourceResult.errors.length,
  linked_threat_repair_count: linkedThreatResult.repairs.length,
  missing_data_repair_count: missingDataResult.repairs.length,
  incompatible_candidate_repair_count: incompatibleResult.repairs.length,
  invalid_coverage_repair_count: invalidCoverageResult.repairs.length
}, null, 2));
