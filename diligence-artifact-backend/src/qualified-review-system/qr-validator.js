const EXPECTED_SECTION_COUNTS = Object.freeze({
  entity_commercial: 16,
  technology_infrastructure: 16,
  ai_capability: 16,
  privacy_sensitive_use: 15,
  india_privacy_cyber: 16
});

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
  if (questions.length !== 79) errors.push(`expected 79 questions, found ${questions.length}`);
  if (handoff.question_count !== undefined && handoff.question_count !== questions.length) errors.push(`question_count mismatch:${handoff.question_count}:${questions.length}`);

  for (const [sectionId, expectedCount] of Object.entries(EXPECTED_SECTION_COUNTS)) {
    const actual = questions.filter((question) => question.section_id === sectionId).length;
    if (actual !== expectedCount) errors.push(`section_count_mismatch:${sectionId}:expected_${expectedCount}:found_${actual}`);
  }

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

    if (/^Confirm .+ item \d+\.$/i.test(String(question.public_question_label || ""))) {
      warnings.push(`${expectedId}:placeholder_public_question_label`);
    }
  });

  return {
    validator_name: "QUALIFIED_REVIEW_VALIDATOR_PARALLEL_V2",
    status: errors.length ? "FAIL" : "PASS",
    actual_question_count: questions.length,
    expected_section_counts: EXPECTED_SECTION_COUNTS,
    errors,
    warnings
  };
}