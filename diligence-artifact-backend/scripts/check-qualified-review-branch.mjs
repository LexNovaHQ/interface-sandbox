import assert from "node:assert/strict";
import { NORMALIZED_SECTION_KEYS } from "../src/normalized-profiler.js";
import { assertCanReadArtifact, assertCanWriteArtifact } from "../src/permissions.js";
import { buildQualifiedReviewSystemArtifacts } from "../src/qualified-review-system/branch.js";
import { QUALIFIED_REVIEW_LOCKED_COUNTS, QUALIFIED_REVIEW_MAP_VERSION, QUALIFIED_REVIEW_SECTION_MAP } from "../src/qualified-review-system/qualified-review-map.js";
import { buildQualifiedReviewSubmission } from "../src/qualified-review-system/submission.js";

const run = { run_id: "TEST-QR-BRANCH", target: "Example", root_url: "https://example.com", status: "COMPLETE" };
const normalized_report_manifest = {
  manifest_type: "normalized_report_manifest",
  run_id: run.run_id,
  target: run.target,
  target_url: run.root_url,
  validation_status: "LOCKED",
  section_order: NORMALIZED_SECTION_KEYS
};
const normalized_compiler_output = { normalized_report_manifest };

for (const sectionId of NORMALIZED_SECTION_KEYS) {
  normalized_compiler_output[`normalized_section__${sectionId}`] = {
    artifact_name: `normalized_section__${sectionId}`,
    section_id: sectionId,
    section_title: sectionId,
    source_artifacts_used: ["target_profile"],
    section_limitations: [],
    subsections: [
      {
        subsection_id: "sample",
        subsection_title: "Sample",
        fields: [
          {
            field_id: "sample_field",
            label: "Sample field",
            value: "Sample",
            source_artifact: "target_profile",
            source_path: "target_profile.sample_field",
            qualified_review_note: "Reviewer confirmation required before downstream use.",
            evidence_refs: []
          }
        ]
      }
    ]
  };
}

const source_artifacts = {
  source_family_index: { ok: true },
  source_discovery_handoff: { ok: true },
  legal_cartography_index: { legal_notice: { entity_name: "Example Inc." }, document_coverage_index: [] },
  target_profile: {
    target_identity: { brand_name: "Example", legal_entity_name: "Example Inc.", entity_type: "Corporation" },
    business_context: { pricing_model: "subscription", market_type_candidate: "B2B" },
    product_service_wrapper: { product_service_wrapper_names: ["Example AI"], delivery_model_signals: "public web app and API" }
  },
  target_profile_forensics: { forensic_trace_index: [{ field: "target_identity.legal_entity_name" }] },
  target_feature_profile: { activities: [{ activity_feature_name: "AI assistant", product_service_wrapper: "Example AI", archetype_codes: ["DOE", "ORC", "RDR"] }] },
  target_feature_profile_forensics: { forensic_trace_index: [{ field: "activities" }] },
  data_provenance_profile: {
    limitations: [],
    data_categories: ["account data"],
    sensitive_special_category_signals: ["biometric"],
    children_minors_signal: "No",
    security_access_controls: "access controls described",
    privacy_governance_contact_accountability_signals: ["privacy@example.com"]
  },
  data_provenance_profile_forensics: { forensic_trace_index: [{ field: "data_categories" }] },
  extended_dap_india_readiness_profile: {
    fields: [
      { field_id: "india_market_scope_signal", value_summary: "Indian users likely" },
      { field_id: "india_operations_signal", value_summary: "India operations likely" }
    ]
  },
  integrated_dap_report: { india_privacy_cyber: { status: "review_required" } },
  exposure_registry_route_plan: { batch_plan: [] },
  exposure_registry_workpad_98: { rows: [] },
  exposure_registry_controlled_profile: { controlled_rows: [{ Archetype: "CRT", Threat_ID: "CRT_TEST" }] },
  exposure_registry_triggered_profile: { triggered_rows: [{ Archetype: "DOE", Threat_ID: "DOE_TEST" }, { Archetype: "ORC", Threat_ID: "ORC_TEST" }] },
  exposure_registry_profile_forensics: { forensic_trace_index: [] },
  challenge_gate: { status: "LOCKED" },
  final_output_handoff: { validation_status: "LOCKED" }
};

const output = buildQualifiedReviewSystemArtifacts({ run, normalized_compiler_output, source_artifacts });
const handoff = output.qualified_review_handoff;
const renderer = output.qualified_review_renderer_payload;
const questionHandoff = handoff.question_handoff || {};
const questions = questionHandoff.questions || [];
const bridge = handoff.canonical_matrix_bridge || {};

assert.equal(handoff.handoff_type, "qualified_review_handoff");
assert.equal(handoff.public_label, "Qualified Review");
assert.equal(handoff.source_branch, "NORMALIZED_COMPILER_TO_QUALIFIED_REVIEW");
assert.equal(handoff.handoff_version, "qualified_review_handoff_locked_matrix_v2");
assert.equal(handoff.matrix_version, QUALIFIED_REVIEW_MAP_VERSION);
assert.equal(handoff.question_count, QUALIFIED_REVIEW_LOCKED_COUNTS.question_count);
assert.equal(questionHandoff.question_count, QUALIFIED_REVIEW_LOCKED_COUNTS.question_count);
assert.equal(handoff.question_handoff_validation.status, "PASS");
assert.equal(questions.length, QUALIFIED_REVIEW_LOCKED_COUNTS.question_count);

assertBridgeContract(bridge, questions);
assertQuestionMatrix(questions);
assertRendererContract(renderer, bridge, questions);
assertSubmissionContract({ run, handoff, renderer, questions });
assertPermissions();

console.log("qualified review branch contract: PASS");

function assertBridgeContract(bridge, questions) {
  assert.equal(bridge.bridge_type, "qualified_review_canonical_matrix_bridge");
  assert.equal(bridge.source_phase, "NORMALIZED_COMPILER");
  assert.equal(bridge.map_version, QUALIFIED_REVIEW_MAP_VERSION);
  assert.deepEqual(bridge.locked_counts, QUALIFIED_REVIEW_LOCKED_COUNTS);
  assert.equal(bridge.sections.length, QUALIFIED_REVIEW_SECTION_MAP.length);
  assert.deepEqual(bridge.sections.map((row) => row.section_id), QUALIFIED_REVIEW_SECTION_MAP.map((row) => row.section_id));
  assert.equal(bridge.validation.status, "PASS");

  assert.equal(bridge.vault_payload_contract.row_count, QUALIFIED_REVIEW_LOCKED_COUNTS.vault_payload_row_count);
  assert.equal(bridge.india_contract.row_count, QUALIFIED_REVIEW_LOCKED_COUNTS.india_privacy_cyber_row_count);
  assert.equal(bridge.india_contract.destination_root, "qualified_review.india_privacy_cyber");
  assert.equal(bridge.india_contract.must_not_write_to_vault_payload, true);

  assert.equal(bridge.prefill_contract.backend_artifact_rows, QUALIFIED_REVIEW_LOCKED_COUNTS.backend_prefill_row_count);
  assert.equal(bridge.prefill_contract.market_norm_demo_rows, QUALIFIED_REVIEW_LOCKED_COUNTS.demo_prefill_row_count);
  assert.equal(bridge.prefill_contract.missing_backend_evidence_is_nonblocking, true);

  assert.equal(bridge.draft_prep_contract.blocked_until_confirmation, true);
  assert.equal(bridge.draft_prep_contract.route_count, questions.length);
  assert.equal(bridge.draft_prep_contract.routes_are_in_question_handoff, true);
  assert.equal(bridge.ui_contract.answer_type_controls, true);
}

function assertQuestionMatrix(questions) {
  assert.deepEqual(countBy(questions, "section_id"), QUALIFIED_REVIEW_LOCKED_COUNTS.section_counts);
  assert.deepEqual(countBy(questions, "answer_type"), QUALIFIED_REVIEW_LOCKED_COUNTS.answer_type_counts);
  assert.deepEqual(countBy(questions, "source_table_default_status"), QUALIFIED_REVIEW_LOCKED_COUNTS.source_table_status_counts);
  assert.deepEqual(countBy(questions, "prefill_strength"), QUALIFIED_REVIEW_LOCKED_COUNTS.prefill_strength_counts);
  assert.deepEqual(countBy(questions, "prefill_source"), QUALIFIED_REVIEW_LOCKED_COUNTS.prefill_source_counts);
  assert.deepEqual(countBy(questions, "evidence_status"), QUALIFIED_REVIEW_LOCKED_COUNTS.evidence_status_counts);
  assert.equal(questions.filter((row) => row.writes_to_vault_payload === true).length, QUALIFIED_REVIEW_LOCKED_COUNTS.vault_payload_row_count);
  assert.equal(questions.filter((row) => row.writes_to_india_privacy_cyber === true).length, QUALIFIED_REVIEW_LOCKED_COUNTS.india_privacy_cyber_row_count);

  questions.forEach((question, index) => {
    const expectedId = `QR-${String(index + 1).padStart(3, "0")}`;
    assert.equal(question.question_id, expectedId);
    assert.equal(question.question_number, index + 1);
    assert.equal(question.editable, true);
    assert.equal(question.required_for_assembly, true);
    assert.equal(question.required_for_draft_preparation, true);
    assert.equal(question.assembly_blocker, true);
    assert.equal(question.qualified_review_push_policy?.push_to_qualified_review_on_click, true);
    assert.ok(question.document_impact.length > 0, `${question.question_id}:document_impact_missing`);
    assert.ok(question.source_artifacts.length > 0, `${question.question_id}:source_artifacts_missing`);
    assert.ok(Array.isArray(question.answer_prefill_mapping), `${question.question_id}:answer_prefill_mapping_missing`);
    assert.ok(Array.isArray(question.evidence_source_mapping), `${question.question_id}:evidence_source_mapping_missing`);
    assert.ok(question.field_key, `${question.question_id}:field_key_missing`);
    assert.ok(question.lawyer_question || question.public_question_label, `${question.question_id}:question_text_missing`);
    assert.doesNotMatch(String(question.public_question_label || ""), /^Confirm .+ item \d+\.$/i);
    assert.doesNotMatch(String(question.suggested_answer || ""), /^Review source artifacts:/i);

    if (question.section_id === "india_privacy_cyber") {
      assert.equal(question.writes_to_vault_payload, false, `${question.question_id}:india_must_not_write_vault`);
      assert.equal(question.writes_to_india_privacy_cyber, true, `${question.question_id}:india_write_flag_missing`);
      assert.ok(String(question.qualified_review_path || "").startsWith("qualified_review.india_privacy_cyber."), `${question.question_id}:bad_india_path`);
    }

    if (question.prefill_strength === "FULL") {
      assert.equal(question.prefill_source, "backend_artifact");
      assert.equal(question.evidence_status, "DILIGENCE_FIELD_MAPPED_FULL");
      assert.ok(question.answer_prefill_mapping.length > 0, `${question.question_id}:full_row_missing_answer_mapping`);
    }
    if (question.prefill_strength === "PARTIAL") {
      assert.equal(question.prefill_source, "backend_artifact");
      assert.equal(question.evidence_status, "DILIGENCE_FIELD_MAPPED_PARTIAL");
      assert.ok(question.answer_prefill_mapping.length > 0, `${question.question_id}:partial_row_missing_answer_mapping`);
    }
    if (question.prefill_strength === "NONE") {
      assert.equal(question.prefill_source, "reviewer_input");
      assert.equal(question.evidence_status, "NO_DIRECT_DILIGENCE_FIELD");
      assert.equal(question.answer_prefill_mapping.length, 0, `${question.question_id}:none_row_must_not_have_answer_mapping`);
    }

    if (question.answer_type === "dropdown" && question.suggested_answer) {
      assert.ok(question.answer_options.includes(question.suggested_answer), `${question.question_id}:invalid_dropdown_suggested_answer`);
    }
    if (question.answer_type === "select" && question.suggested_answer) {
      const selected = String(question.suggested_answer).split(",").map((value) => value.trim()).filter(Boolean);
      selected.forEach((value) => assert.ok(question.answer_options.includes(value), `${question.question_id}:invalid_select_suggested_answer:${value}`));
    }
  });
}

function assertRendererContract(renderer, bridge, questions) {
  assert.equal(renderer.renderer_type, "qualified_review_renderer_payload");
  assert.equal(renderer.renderer_version, "qualified_review_renderer_locked_matrix_v2");
  assert.equal(renderer.matrix_version, QUALIFIED_REVIEW_MAP_VERSION);
  assert.equal(renderer.question_count, QUALIFIED_REVIEW_LOCKED_COUNTS.question_count);
  assert.equal(renderer.section_count, QUALIFIED_REVIEW_SECTION_MAP.length);
  assert.equal(renderer.source_handoff_ref, "qualified_review_handoff");
  assert.deepEqual(renderer.bridge_contract.locked_counts, bridge.locked_counts);
  assert.equal(renderer.summary_counts.total_questions, QUALIFIED_REVIEW_LOCKED_COUNTS.question_count);
  assert.equal(renderer.summary_counts.backend_artifact_rows, QUALIFIED_REVIEW_LOCKED_COUNTS.backend_prefill_row_count);
  assert.equal(renderer.summary_counts.market_norm_demo_rows, QUALIFIED_REVIEW_LOCKED_COUNTS.demo_prefill_row_count);
  assert.equal(renderer.summary_counts.vault_payload_rows, QUALIFIED_REVIEW_LOCKED_COUNTS.vault_payload_row_count);
  assert.equal(renderer.summary_counts.india_privacy_cyber_rows, QUALIFIED_REVIEW_LOCKED_COUNTS.india_privacy_cyber_row_count);
  assert.equal(renderer.question_sections.length, QUALIFIED_REVIEW_SECTION_MAP.length);
  renderer.question_sections.forEach((section) => {
    assert.equal(section.question_count, QUALIFIED_REVIEW_LOCKED_COUNTS.section_counts[section.section_id]);
    assert.equal(section.questions.length, section.question_count);
  });
  assert.equal(renderer.render_contract.section_wizard, true);
  assert.equal(renderer.render_contract.editable_answers, true);
  assert.equal(renderer.render_contract.final_review_gate, true);
  assert.equal(renderer.render_contract.answer_type_controls, true);
  assert.equal(renderer.render_contract.no_document_assembly, true);
  assert.equal(renderer.render_contract.no_legal_advice, true);
  assert.equal(renderer.render_contract.forbidden_public_actions.includes("Download JSON"), true);
  assert.equal(renderer.questions.length, questions.length);
}

function assertSubmissionContract({ run, handoff, renderer, questions }) {
  const request_body = {
    submitted_by: "contract_check",
    submitted_by_label: "Contract Check",
    question_responses: questions.map((question) => ({
      question_id: question.question_id,
      answer_state: "confirmed",
      answer_value: `Confirmed answer for ${question.question_id}`,
      demo_disclaimer_accepted: false,
      submitted_at: "2026-07-01T00:00:00.000Z"
    }))
  };
  const submission = buildQualifiedReviewSubmission({ run, handoff, renderer_payload: renderer, request_body });
  assert.equal(submission.artifact_type, "qualified_review_submission");
  assert.equal(submission.final_gate.status, "PASS");
  assert.equal(submission.final_gate.ready_for_assembly, true);
  assert.equal(submission.final_gate.required_question_count, QUALIFIED_REVIEW_LOCKED_COUNTS.question_count);
  assert.equal(submission.final_gate.resolved_question_count, QUALIFIED_REVIEW_LOCKED_COUNTS.question_count);
  assert.equal(submission.validation.blocking_errors.length, 0);
  assert.equal(submission.question_responses.length, QUALIFIED_REVIEW_LOCKED_COUNTS.question_count);
  assert.equal(submission.assembler_input.ready_for_assembly, true);
  assert.equal(submission.assembler_input.final_gate_status, "PASS");
  assert.equal(Object.keys(submission.assembler_input.question_response_index).length, QUALIFIED_REVIEW_LOCKED_COUNTS.question_count);
  assert.equal(Object.keys(submission.assembler_input.routes_by_destination_path).length > 0, true);
}

function assertPermissions() {
  assertCanWriteArtifact("qualified_review_system", "qualified_review_handoff");
  assertCanWriteArtifact("qualified_review_system", "qualified_review_renderer_payload");
  assertCanWriteArtifact("qualified_review_system", "qualified_review_submission");
  assertCanReadArtifact("qualified_review_system", "final_output_handoff");
  assertCanReadArtifact("qualified_review_system", "normalized_report_manifest");
  assertCanReadArtifact("qualified_review_system", "normalized_section__matter_overview");
  assertCanReadArtifact("qualified_review_system", "target_profile");
  assertCanReadArtifact("qualified_review_system", "target_feature_profile");
  assertCanReadArtifact("qualified_review_system", "data_provenance_profile");
  assertCanReadArtifact("qualified_review_system", "exposure_registry_triggered_profile");
  assertCanReadArtifact("qualified_review_system", "challenge_gate");
  assertCanReadArtifact("qualified_review_system", "qualified_review_handoff");
  assertCanReadArtifact("qualified_review_system", "qualified_review_renderer_payload");
  assertCanReadArtifact("qualified_review_system", "qualified_review_submission");
  assertCanReadArtifact("portfolio_renderer", "qualified_review_submission");
}

function countBy(rows, key) {
  return rows.reduce((acc, row) => {
    const value = row[key];
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}
