import { QUALIFIED_REVIEW_LOCKED_COUNTS } from "./qualified-review-map.js";

const REQUIRED_QUESTION_FIELDS = Object.freeze([
  "question_id",
  "question_number",
  "section_id",
  "section_title",
  "field_key",
  "public_question_label",
  "answer_type",
  "prefill_strength",
  "answer_prefill_mapping",
  "evidence_source_mapping",
  "evidence_mode",
  "field_type",
  "source_artifacts",
  "source_field_hints",
  "document_impact"
]);

export function validateQualifiedReviewQuestionHandoff(handoff = {}) {
  const questions = Array.isArray(handoff.questions) ? handoff.questions : [];
  const errors = [];
  const warnings = [];
  const seen = new Set();

  if (handoff.handoff_type !== "qualified_review_question_handoff") errors.push("bad handoff_type");
  if (questions.length !== QUALIFIED_REVIEW_LOCKED_COUNTS.question_count) errors.push(`expected ${QUALIFIED_REVIEW_LOCKED_COUNTS.question_count} questions, found ${questions.length}`);
  if (handoff.question_count !== undefined && handoff.question_count !== questions.length) errors.push(`question_count mismatch:${handoff.question_count}:${questions.length}`);

  assertCounts(errors, questions, "section_id", QUALIFIED_REVIEW_LOCKED_COUNTS.section_counts, "section_count_mismatch");
  assertCounts(errors, questions, "answer_type", QUALIFIED_REVIEW_LOCKED_COUNTS.answer_type_counts, "answer_type_count_mismatch");
  assertCounts(errors, questions, "source_table_default_status", QUALIFIED_REVIEW_LOCKED_COUNTS.source_table_status_counts, "status_count_mismatch");
  assertCounts(errors, questions, "prefill_strength", QUALIFIED_REVIEW_LOCKED_COUNTS.prefill_strength_counts, "prefill_strength_mismatch");
  assertCounts(errors, questions, "prefill_source", QUALIFIED_REVIEW_LOCKED_COUNTS.prefill_source_counts, "prefill_source_mismatch");
  assertCounts(errors, questions, "evidence_status", QUALIFIED_REVIEW_LOCKED_COUNTS.evidence_status_counts, "evidence_status_mismatch");

  questions.forEach((question, index) => {
    const expectedId = `QR-${String(index + 1).padStart(3, "0")}`;
    if (question.question_id !== expectedId) errors.push(`question_sequence_mismatch:${question.question_id || "missing"}:expected_${expectedId}`);
    if (seen.has(question.question_id)) errors.push(`duplicate_question_id:${question.question_id}`);
    seen.add(question.question_id);

    for (const field of REQUIRED_QUESTION_FIELDS) {
      if (question[field] === undefined || question[field] === null || question[field] === "") errors.push(`${expectedId}:missing_${field}`);
    }

    if (question.editable !== true) errors.push(`${expectedId}:editable_must_be_true`);
    if (question.required_for_assembly !== true) errors.push(`${expectedId}:required_for_assembly_must_be_true`);
    if (question.assembly_blocker !== true) errors.push(`${expectedId}:assembly_blocker_must_be_true`);
    if (!Array.isArray(question.document_impact) || !question.document_impact.length) errors.push(`${expectedId}:document_impact_missing`);
    if (!question.qualified_review_push_policy?.push_to_qualified_review_on_click) errors.push(`${expectedId}:push_policy_missing`);
    if (/^Confirm .+ item \d+\.$/i.test(String(question.public_question_label || ""))) errors.push(`${expectedId}:placeholder_public_question_label`);

    if (!["FULL", "PARTIAL", "NONE"].includes(question.prefill_strength)) errors.push(`${expectedId}:bad_prefill_strength`);
    if (question.prefill_strength === "NONE") {
      if (question.answer_prefill_mapping.length !== 0) errors.push(`${expectedId}:none_row_must_not_have_answer_prefill_mapping`);
      if (question.prefill_source !== "reviewer_input") errors.push(`${expectedId}:none_row_must_be_reviewer_input`);
      if (question.evidence_status !== "NO_DIRECT_DILIGENCE_FIELD") errors.push(`${expectedId}:bad_none_evidence_status`);
    } else {
      if (!question.answer_prefill_mapping.length) errors.push(`${expectedId}:field_mapped_row_missing_answer_prefill_mapping`);
      if (question.prefill_source !== "backend_artifact") errors.push(`${expectedId}:field_mapped_row_must_be_backend_artifact`);
    }

    if (question.prefill_strength === "FULL" && question.evidence_status !== "DILIGENCE_FIELD_MAPPED_FULL") errors.push(`${expectedId}:bad_full_evidence_status`);
    if (question.prefill_strength === "PARTIAL" && question.evidence_status !== "DILIGENCE_FIELD_MAPPED_PARTIAL") errors.push(`${expectedId}:bad_partial_evidence_status`);
    if (question.section_id === "india_privacy_cyber" && question.writes_to_vault_payload !== false) errors.push(`${expectedId}:india_row_must_not_write_to_vault_payload`);
    if (String(question.suggested_answer || "").startsWith("Review source artifacts:")) errors.push(`${expectedId}:source_placeholder_suggested_answer`);
  });

  return {
    validator_name: "QUALIFIED_REVIEW_VALIDATOR_FIELD_MAPPED_V2",
    status: errors.length ? "FAIL" : "PASS",
    actual_question_count: questions.length,
    expected_section_counts: QUALIFIED_REVIEW_LOCKED_COUNTS.section_counts,
    errors,
    warnings
  };
}

function assertCounts(errors, questions, field, expectedCounts, label) {
  const actualCounts = questions.reduce((acc, question) => {
    const key = question[field];
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  for (const [key, expected] of Object.entries(expectedCounts)) {
    const actual = actualCounts[key] || 0;
    if (actual !== expected) errors.push(`${label}:${key}:expected_${expected}:found_${actual}`);
  }
}
