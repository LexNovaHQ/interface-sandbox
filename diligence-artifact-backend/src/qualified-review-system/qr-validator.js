import { QUALIFIED_REVIEW_LOCKED_COUNTS } from "./qualified-review-map.js";

const REQUIRED_QUESTION_FIELDS = Object.freeze([
  "question_id",
  "question_number",
  "section_id",
  "section_title",
  "field_key",
  "public_question_label",
  "answer_type",
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
  assertCounts(errors, questions, "prefill_source", QUALIFIED_REVIEW_LOCKED_COUNTS.prefill_source_counts, "prefill_source_count_mismatch");

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
    if (!Array.isArray(question.source_artifacts) || !question.source_artifacts.length) errors.push(`${expectedId}:source_artifacts_missing`);
    if (!Array.isArray(question.document_impact) || !question.document_impact.length) errors.push(`${expectedId}:document_impact_missing`);
    if (!question.qualified_review_push_policy?.push_to_qualified_review_on_click) errors.push(`${expectedId}:push_policy_missing`);
    if (/^Confirm .+ item \d+\.$/i.test(String(question.public_question_label || ""))) errors.push(`${expectedId}:placeholder_public_question_label`);

    if (question.section_id === "india_privacy_cyber" && question.writes_to_vault_payload !== false) errors.push(`${expectedId}:india_row_must_not_write_to_vault_payload`);
    if (question.prefill_source === "market_norm_demo" && question.evidence_status !== "NOT_DERIVED_FROM_DILIGENCE") errors.push(`${expectedId}:bad_demo_evidence_status`);
    if (question.prefill_source === "backend_artifact" && question.evidence_status !== "DILIGENCE_DERIVED") errors.push(`${expectedId}:bad_backend_evidence_status`);
  });

  return {
    validator_name: "QUALIFIED_REVIEW_VALIDATOR_LOCKED_MATRIX_V1",
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
