import assert from "node:assert/strict";
import { buildNormalizedProfilerOutput, NORMALIZED_SECTION_ARTIFACT_NAMES, NORMALIZED_SECTION_KEYS } from "../src/phases/11-normalized-compiler/normalized-profiler-m9-section6-v4.js";

const run = { run_id: "TEST-NORMALIZED", target: "Example", root_url: "https://example.com", status: "LOCKED_WITH_LIMITATIONS" };
const artifacts = {
  target_profile: { target_identity: { brand_name: "Example", legal_entity_name: "Example Inc.", entity_type: "Company", reviewed_website: "https://example.com", primary_domain: "example.com" }, jurisdiction_notice: {}, business_context: {}, product_service_wrapper: {}, target_profile_limitations: [] },
  target_feature_profile: { commercial_availability_posture: { posture: "Public demo / review required" }, activities: [{ activity_reference: "A1", activity_feature_name: "Draft assistant", archetype_codes: ["CRT"], surface_context_tokens: ["Content&IP"] }], profile_level_limitations: [] },
  legal_cartography_index: { document_coverage_index: [{ document_or_artifact: "Terms of Service", artifact_class: "TERMS_OF_SERVICE", source_type: "URL", source: "https://example.com/terms-of-service", status: "FOUND_INDEXED" }], document_structure_index: [], incorporated_linked_document_map: [], control_language_locator: [{ control_language_family: "DATA_PRIVACY", display_in_main_report: false, technical_annexure_only: true }], semantic_navigation_index: [], priority_semantic_locator: [], qualified_review_locator: [], missing_limited_legal_governance_items: [], lock_status: "LOCKED" },
  legal_signal_derivation_profile: { artifact_name: "legal_signal_derivation_profile", model_generated: false, field_derivations: [], coverage_summary: { emitted_field_count: 0 } },
  data_provenance_profile: { missing_proof_and_diligence_requests: [], limitations: [] },
  dap_semantic_batch_route_manifest: { batch_route_packets: [] },
  dap_semantic_batch_validation_manifest: { observed_batch_count: 0, observed_field_count: 0, expected_field_count: 150, validation_quality_control_result: { status: "LOCKED_WITH_LIMITATIONS", non_blocking_repair_required: true } },
  data_provenance_profile_semantic_batch_gate: { status: "LOCKED_WITH_LIMITATIONS", batch_count: 0, field_count: 0, all_fields_covered_once: false, non_blocking_repair_required: true },
  exposure_registry_triggered_profile: { triggered_rows: [{ Threat_ID: "CRT_INF_001", Threat_Name: "Training Data IP Gap", Subcategory: "INF", evaluation_status: "TRIGGERED", Pain_Tier: "T2" }] },
  exposure_registry_controlled_profile: { controlled_rows: [] },
  exposure_registry_workpad_98: { registry_rows: [{ Threat_ID: "CRT_INF_001", final_material_status: "TRIGGERED" }] },
  exposure_registry_profile_forensics: {},
  challenge_gate: { status: "LOCKED_WITH_LIMITATIONS" }
};

const output = buildNormalizedProfilerOutput({ run, artifacts });
const retiredSectionHandoffKey = "va" + "ult_section_handoff";

assert.equal(output.normalized_report_manifest.section_order.length, NORMALIZED_SECTION_KEYS.length);
assert.equal(output.review_ready_section_handoff.sections.length, NORMALIZED_SECTION_KEYS.length);
assert.equal(Object.prototype.hasOwnProperty.call(output, retiredSectionHandoffKey), false);

for (const artifactName of NORMALIZED_SECTION_ARTIFACT_NAMES) {
  assert.ok(output[artifactName], `${artifactName} missing`);
  assert.equal(output[artifactName].artifact_name, artifactName);
}

assertSectionHasSubsection(output.normalized_section__product_activity_ip_profile, "commercial_availability_posture");
assertSectionHasSubsection(output.normalized_section__data_provenance_controls, "phase7_dap_batch_projection_notice");
const section5 = JSON.stringify(output.normalized_section__data_provenance_controls);
assert.equal(section5.includes("extended_dap_india_readiness_profile"), false);
assert.equal(section5.includes("integrated_dap_report"), false);
assert.ok(output.normalized_section__legal_document_control_review);
assert.ok(output.normalized_section__exposure_diagnosis_table);
assert.ok(output.normalized_section__methodology_limitations_forensic_annexure);

const section6 = JSON.stringify(output.normalized_section__legal_document_control_review);
assert.ok(section6.includes("Legal Coverage Summary"));
assert.ok(section6.includes("Core Legal Document Inventory"));
assert.ok(section6.includes("Legal Signal Derivation Summary"));
assert.ok(section6.includes("legal_signal_derivation_profile"));
assert.equal(section6.includes("qualified_review_legal_signals"), false);
assert.equal(section6.includes("document_structure_index"), false);
assert.equal(section6.includes("control_language_locator"), false);
assert.equal(output.normalized_report_manifest.renderer_contract.section_6_legal_signal_derivation_profile_summary_present, true);

assert.ok(JSON.stringify(output.normalized_section__methodology_limitations_forensic_annexure).includes("Manifest only"));
assert.equal(Object.prototype.hasOwnProperty.call(output, "normalized_section__forensic_ledger_appendix"), false);
assert.equal(Object.prototype.hasOwnProperty.call(output, "normalized_section__methodology_limitations_review_notes"), false);

assert.equal(output.final_output_handoff.final_output_handoff.terminal_checks.normalized_sections_emitted, NORMALIZED_SECTION_KEYS.length);
assert.equal(output.final_output_handoff.final_output_handoff.terminal_checks.no_separate_section_11, true);

console.log("normalized profiler shape: PASS");

function assertSectionHasSubsection(section, subsectionId) {
  assert.ok(Array.isArray(section?.subsections), `${section?.artifact_name || "section"} subsections missing`);
  assert.ok(section.subsections.some((subsection) => subsection?.subsection_id === subsectionId), `${subsectionId} subsection missing`);
}