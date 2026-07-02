import assert from "node:assert/strict";
import { buildNormalizedProfilerOutput, NORMALIZED_SECTION_ARTIFACT_NAMES, NORMALIZED_SECTION_KEYS } from "../src/normalized-profiler-section10-v3.js";

const run = { run_id: "TEST-NORMALIZED", target: "Example", root_url: "https://example.com", status: "LOCKED_WITH_LIMITATIONS" };
const artifacts = {
  target_profile: {
    target_identity: { brand_name: "Example", legal_entity_name: "Example Inc.", entity_type: "Company", reviewed_website: "https://example.com", primary_domain: "example.com" },
    jurisdiction_notice: {},
    business_context: {},
    product_service_wrapper: {},
    target_profile_limitations: []
  },
  target_feature_profile: {
    activities: [{ activity_reference: "A1", activity_feature_name: "Draft assistant", archetype_codes: ["CRT"], surface_context_tokens: ["Content&IP"] }],
    profile_level_limitations: []
  },
  legal_cartography_index: { document_coverage_index: [], document_structure_index: [], incorporated_linked_document_map: [], control_language_locator: [], missing_limited_legal_governance_items: [], lock_status: "LOCKED" },
  data_provenance_profile: { missing_proof_and_diligence_requests: [], limitations: [] },
  exposure_registry_triggered_profile: {
    triggered_rows: [{ Threat_ID: "CRT_INF_001", Threat_Name: "Training Data IP Gap", Subcategory: "INF", evaluation_status: "TRIGGERED", target_match: "Draft assistant generates content.", basis_proof: "Public product page describes generation.", control_exclusion_evaluation: "No visible exclusion found.", evidence_source_basis: "Product page", fp_mechanism: "Direct feature match", Archetype: "CRT", Surface: "Content&IP", Pain_Tier: "T2", Pain_Depth: "Corporate", Pain_Category: "Uncapped Money", Legal_Pain: "IP review issue", remediation: "Review IP terms", review_route: "product/legal-governance review", row_limitations: "" }]
  },
  exposure_registry_controlled_profile: { controlled_rows: [] },
  exposure_registry_workpad_98: { registry_rows: [{ Threat_ID: "CRT_INF_001", registry_order: 1, final_material_status: "TRIGGERED", material_projection: { Threat_ID: "CRT_INF_001" } }] },
  exposure_registry_profile_forensics: {},
  challenge_gate: { status: "LOCKED_WITH_LIMITATIONS" }
};

const output = buildNormalizedProfilerOutput({ run, artifacts });
assert.equal(output.normalized_report_manifest.section_order.length, NORMALIZED_SECTION_KEYS.length);
assert.equal(output.vault_section_handoff.sections.length, NORMALIZED_SECTION_KEYS.length);
for (const artifactName of NORMALIZED_SECTION_ARTIFACT_NAMES) {
  assert.ok(output[artifactName], `${artifactName} missing`);
  assert.equal(output[artifactName].artifact_name, artifactName);
}
const productSection = JSON.stringify(output.normalized_section__product_activity_ip_profile);
assert.ok(productSection.includes("Content creation or generation activity"));
assert.ok(!productSection.includes('"CRT"'));
assert.ok(output.normalized_section__exposure_summary_harm_mechanism_workpad_summary);
assert.ok(output.normalized_section__exposure_diagnosis_table);
assert.ok(output.normalized_section__exposure_control_discipline);
assert.ok(output.normalized_section__review_route_action_plan);
assert.ok(output.normalized_section__control_handoff_readiness);
assert.ok(output.normalized_section__exposure_clarification_queue);
assert.ok(output.normalized_section__global_confirmation_queue);
assert.ok(output.normalized_section__methodology_limitations_forensic_annexure);
assert.equal(Object.prototype.hasOwnProperty.call(output, "normalized_section__forensic_ledger_appendix"), false);
assert.equal(Object.prototype.hasOwnProperty.call(output, "normalized_section__methodology_limitations_review_notes"), false);
assert.ok(JSON.stringify(output.normalized_section__exposure_diagnosis_table).includes("Threat_Name"));
assert.ok(JSON.stringify(output.normalized_section__exposure_diagnosis_table).includes("Subcat"));
assert.ok(JSON.stringify(output.normalized_section__methodology_limitations_forensic_annexure).includes("Manifest only"));
assert.equal(JSON.stringify(output.normalized_section__exposure_diagnosis_table).includes("Business Category"), false);
assert.equal(output.final_output_handoff.final_output_handoff.terminal_checks.normalized_sections_emitted, NORMALIZED_SECTION_KEYS.length);
assert.equal(output.final_output_handoff.final_output_handoff.terminal_checks.no_separate_section_11, true);
console.log("normalized profiler shape: PASS");
