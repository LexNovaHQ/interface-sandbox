import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildQualifiedReviewSystemArtifacts } from "../src/qualified-review-system/branch.js";
import { loadQualifiedReviewMatrix } from "../src/qualified-review-system/qualified-review-matrix-loader.js";
import { NORMALIZED_SECTION_KEYS } from "../src/normalized-profiler.js";
import { NORMALIZED_SECTION_ARTIFACT_NAMES } from "../src/constants.js";

const EXPECTED_QR_ARTIFACT_KEYS = ["qr_artifact__entity_commercial", "qr_artifact__technology_infrastructure", "qr_artifact__ai_capability_product_behavior", "qr_artifact__dap_privacy_india_cyber"];
const LEGACY_MAP_FILE = "qualified-review" + "-map.js";
const ALLOWED_ROOTS = new Set([...NORMALIZED_SECTION_ARTIFACT_NAMES, "PRIVATE_INPUT", "MARKET_NORM"]);

const matrix = loadQualifiedReviewMatrix();
assert.equal(matrix.questions.length, 79);
for (const row of matrix.questions) {
  for (const selector of [row.selector, row.secondary_selector].filter(Boolean)) {
    const root = String(selector).split(".")[0];
    assert.equal(ALLOWED_ROOTS.has(root), true, `${row.question_id}: bad selector root ${root}`);
  }
}

const run = { run_id: "TEST-QR-MATRIX", target: "Example", root_url: "https://example.com", status: "COMPLETE" };
const normalized_report_manifest = { run_id: run.run_id, target: run.target, target_url: run.root_url, validation_status: "LOCKED", section_order: NORMALIZED_SECTION_KEYS };
const normalized_compiler_output = { normalized_report_manifest };
for (const sectionId of NORMALIZED_SECTION_KEYS) normalized_compiler_output[`normalized_section__${sectionId}`] = { section_id: sectionId, artifact_name: `normalized_section__${sectionId}`, section_title: sectionId, subsections: [] };
function sub(id, fields) { return { subsection_id: id, fields: fields.map(([field_id, value]) => ({ field_id, value })) }; }
normalized_compiler_output.normalized_section__target_profile.subsections = [sub("target_identity", [["legal_entity_name", "Example Inc."], ["entity_type", "Corporation"]]), sub("jurisdiction_notice", [["registered_notice_location", "Delaware"], ["governing_law", "Delaware"], ["courts_venue", "Delaware courts"]]), sub("business_context", [["market_type_candidate", "B2B"]]), sub("product_service_wrapper", [["delivery_model_signals", "Web app and API"], ["product_service_wrapper_names", ["Example AI"]]])];
normalized_compiler_output.normalized_section__product_activity_ip_profile.subsections = [sub("commercial_availability_posture", [["commercial_availability_posture", { posture: "Paid production" }]]), sub("activity_inventory", [["activities", [{ activity_display_id: "ACT-001", publicly_described_activity: "AI assistant" }]]]), sub("activity_mechanics", [["mechanics", [{ activity_display_id: "ACT-001", data_content_or_asset_affected: "User prompts" }]]]), sub("activity_pattern", [["activity_patterns", [{ activity_display_id: "ACT-001", activity_patterns: ["RDR", "CRT"] }]]])];
normalized_compiler_output.normalized_section__data_provenance_controls.subsections = [sub("privacy_contact_consent_manager_readiness", [["contact_routes", { privacy_contact_email: "privacy@example.com" }], ["consent_manager_readiness", { applicability_signal: "Unclear" }]]), sub("integrated_dap_01_scope_market_applicability", [["market_scope_and_india_relevance", { finding: "Possible" }], ["jurisdictional_applicability_assumptions", { finding: "Public only" }]]), sub("integrated_dap_02_m8_activity_to_data_flow_integration", [["activity_to_data_flow_map", { finding: "Visible" }], ["personal_data_categories_by_activity", { finding: "Account data" }]]), sub("integrated_dap_06_vendors_sharing_transfers", [["vendor_and_subprocessor_inventory_visibility", { finding: "Partial" }], ["cross_border_transfer_and_custody_posture", { finding: "Unclear" }]]), sub("integrated_dap_08_security_access_incident", [["incident_breach_response_visibility", { finding: "Visible" }], ["security_control_visibility", { finding: "Visible" }]])];
normalized_compiler_output.normalized_section__legal_document_control_review.subsections = [sub("qualified_review_legal_signals", [["qualified_review_legal_signals", { Legal_Notice_Contact: { legal_notice_email: "notice@example.com" }, Liability_Cap_Basis: { cap_formula_reference_basis: "fees paid" }, SLA_Support_Posture: { standard_vs_custom_sla_posture: "No public SLA" } }]])];

const output = buildQualifiedReviewSystemArtifacts({ run, normalized_compiler_output, source_artifacts: {} });
const handoff = output.qualified_review_handoff;
const renderer = output.qualified_review_renderer_payload;
const questions = handoff.question_handoff.questions;
assert.equal(handoff.question_handoff_validation.status, "PASS");
assert.equal(questions.length, 79);
assert.equal(handoff.section_pages.length, 4);
assert.deepEqual(Object.keys(handoff.qr_artifacts).sort(), EXPECTED_QR_ARTIFACT_KEYS.slice().sort());
for (const key of EXPECTED_QR_ARTIFACT_KEYS) assert.ok(output[key], `standalone output missing ${key}`);
assert.equal(questions.every((q) => q.suggested_answer), true);
assert.equal(questions.filter((q) => q.prefill_source === "private_demo_assumption").length, 5);
assert.equal(questions.filter((q) => q.prefill_source === "diligence_normalized_section").length >= 40, true);
assert.equal(questions.some((q) => q.prefill_source === "backend_artifact"), false);
assert.equal(questions.some((q) => q.prefill_source === "reviewer_input"), false);
assert.equal(questions.some((q) => q.source_table_default_status === "Need to fill"), false);
assert.equal(renderer.questions.length, 79);
assert.equal(renderer.question_sections.length, 4);
assert.equal(renderer.render_contract.matrix_source, "qualified-review-matrix.yml");
for (const question of questions) assert.notEqual(question.source_dependency, LEGACY_MAP_FILE);
const compilerSource = readFileSync(new URL("../src/qualified-review-system/matrix-artifact-compiler.js", import.meta.url), "utf8");
assert.equal(compilerSource.includes(LEGACY_MAP_FILE), false);
console.log("qualified review matrix compiler: PASS");
