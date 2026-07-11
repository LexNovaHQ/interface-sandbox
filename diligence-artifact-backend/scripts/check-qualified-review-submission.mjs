import assert from "node:assert/strict";
import { buildQualifiedReviewSystemArtifacts } from "../src/qualified-review-system/branch.js";
import { buildQualifiedReviewSubmission } from "../src/runtime/services/qualified-review-submission.service.js";
import { NORMALIZED_SECTION_KEYS } from "../src/phases/11-normalized-compiler/normalized-profiler.js";

const run = { run_id: "TEST-QR-SUBMISSION", target: "Example", root_url: "https://example.com", status: "COMPLETE" };
const normalized_report_manifest = { run_id: run.run_id, target: run.target, target_url: run.root_url, validation_status: "LOCKED", section_order: NORMALIZED_SECTION_KEYS };
const normalized_compiler_output = { normalized_report_manifest };
for (const sectionId of NORMALIZED_SECTION_KEYS) normalized_compiler_output[`normalized_section__${sectionId}`] = { section_id: sectionId, artifact_name: `normalized_section__${sectionId}`, section_title: sectionId, subsections: [] };
function sub(id, fields) { return { subsection_id: id, fields: fields.map(([field_id, value]) => ({ field_id, value })) }; }
normalized_compiler_output.normalized_section__target_profile.subsections = [sub("target_identity", [["legal_entity_name", "Example Inc."], ["entity_type", "Corporation"]]), sub("jurisdiction_notice", [["registered_notice_location", "Delaware"], ["governing_law", "Delaware"], ["courts_venue", "Delaware courts"]]), sub("business_context", [["market_type_candidate", "B2B"]]), sub("product_service_wrapper", [["delivery_model_signals", "Web app and API"], ["product_service_wrapper_names", ["Example AI"]]])];
normalized_compiler_output.normalized_section__product_activity_ip_profile.subsections = [sub("commercial_availability_posture", [["commercial_availability_posture", { posture: "Paid production" }]]), sub("activity_inventory", [["activities", [{ activity_display_id: "ACT-001", publicly_described_activity: "AI assistant" }]]]), sub("activity_mechanics", [["mechanics", [{ activity_display_id: "ACT-001", data_content_or_asset_affected: "User prompts" }]]]), sub("activity_pattern", [["activity_patterns", [{ activity_display_id: "ACT-001", activity_patterns: ["RDR", "CRT"] }]]])];
normalized_compiler_output.normalized_section__data_provenance_controls.subsections = [sub("privacy_contact_consent_manager_readiness", [["contact_routes", { privacy_contact_email: "privacy@example.com" }], ["consent_manager_readiness", { applicability_signal: "Unclear" }]]), sub("integrated_dap_01_scope_market_applicability", [["market_scope_and_india_relevance", { finding: "Possible" }], ["jurisdictional_applicability_assumptions", { finding: "Public only" }]]), sub("integrated_dap_02_m8_activity_to_data_flow_integration", [["activity_to_data_flow_map", { finding: "Visible" }], ["personal_data_categories_by_activity", { finding: "Account data" }]]), sub("integrated_dap_06_vendors_sharing_transfers", [["vendor_and_subprocessor_inventory_visibility", { finding: "Partial" }], ["cross_border_transfer_and_custody_posture", { finding: "Unclear" }]]), sub("integrated_dap_08_security_access_incident", [["incident_breach_response_visibility", { finding: "Visible" }], ["security_control_visibility", { finding: "Visible" }]])];
normalized_compiler_output.normalized_section__legal_document_control_review.subsections = [sub("qualified_review_legal_signals", [["qualified_review_legal_signals", { Legal_Notice_Contact: { legal_notice_email: "notice@example.com" }, Liability_Cap_Basis: { cap_formula_reference_basis: "fees paid" }, SLA_Support_Posture: { standard_vs_custom_sla_posture: "No public SLA" } }]])];

const artifacts = buildQualifiedReviewSystemArtifacts({ run, normalized_compiler_output, source_artifacts: {} });
const handoff = artifacts.qualified_review_handoff;
const renderer_payload = artifacts.qualified_review_renderer_payload;
const questions = handoff.question_handoff.questions;
const question_responses = questions.map((q) => ({ question_id: q.question_id, answer_state: "confirmed", answer_value: q.suggested_answer, demo_disclaimer_accepted: q.demo_disclaimer_required === true, submitted_at: "2026-07-04T00:00:00.000Z" }));
const submission = buildQualifiedReviewSubmission({ run, handoff, renderer_payload, request_body: { submitted_by: "test", save_reason: "submit_final_gate", question_responses } });

assert.equal(submission.artifact_version, "qualified_review_submission_matrix_v2");
assert.equal(submission.final_gate.status, "PASS");
assert.equal(submission.final_gate.ready_for_assembly, true);
assert.equal(submission.question_responses.length, 79);
assert.equal(submission.section_counts.entity_commercial, 17);
assert.equal(submission.section_counts.technology_infrastructure, 6);
assert.equal(submission.section_counts.ai_capability_product_behavior, 15);
assert.equal(submission.section_counts.dap_privacy_india_cyber, 41);
assert.equal(submission.prefill_source_counts.private_demo_assumption, 5);
assert.equal(submission.validation.blocking_errors.length, 0);
assert.equal(submission.assembler_input.ready_for_assembly, true);
assert.equal(submission.assembler_input.route_count, 79);
assert.equal(Object.keys(submission.assembler_input.routes_by_destination_path).length, 79);
assert.equal(Object.keys(submission.assembler_input.routes_by_question_id).length, 79);
assert.equal(submission.question_responses.filter((row) => row.section_id === "dap_privacy_india_cyber" && row.writes_to_vault_payload === true).length, 0);
for (const route of Object.values(submission.assembler_input.routes_by_destination_path)) {
  assert.ok(route.section_id);
  assert.ok(route.section_artifact);
  assert.ok(route.field_key);
  assert.ok(route.prefill_source);
  assert.ok(Array.isArray(route.document_impact));
}
console.log("qualified review submission artifact: PASS");