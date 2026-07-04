const EXPECTED_SECTION_COUNTS = Object.freeze({
  entity_commercial: 17,
  technology_infrastructure: 6,
  ai_capability_product_behavior: 15,
  dap_privacy_india_cyber: 41
});
const EXPECTED_ANSWER_TYPE_COUNTS = Object.freeze({ short_answer: 19, long_answer: 30, dropdown: 26, select: 4 });
const PRIVATE_IDS = new Set(["QR-026", "QR-027", "QR-028", "QR-029", "QR-047"]);

const REQUIRED_QUESTION_FIELDS = Object.freeze([
  "question_id", "question_number", "section_id", "section_title", "field_key", "public_question_label", "answer_type",
  "prefill_source", "prefill_status", "suggested_answer", "initial_answer_value", "normalized_section_selector", "evidence_mode",
  "field_type", "source_artifacts", "source_field_hints", "document_impact"
]);

export function validateQualifiedReviewQuestionHandoff(handoff = {}) {
  const questions = Array.isArray(handoff.questions) ? handoff.questions : [];
  const errors = [];
  const warnings = [];
  const seen = new Set();

  if (handoff.handoff_type !== "qualified_review_question_handoff") errors.push("bad handoff_type");
  if (questions.length !== 79) errors.push(`expected 79 questions, found ${questions.length}`);
  if (handoff.question_count !== undefined && handoff.question_count !== questions.length) errors.push(`question_count mismatch:${handoff.question_count}:${questions.length}`);
  assertCounts(errors, questions, "section_id", EXPECTED_SECTION_COUNTS, "section_count_mismatch");
  assertCounts(errors, questions, "answer_type", EXPECTED_ANSWER_TYPE_COUNTS, "answer_type_count_mismatch");

  questions.forEach((question, index) => {
    const expectedId = `QR-${String(index + 1).padStart(3, "0")}`;
    if (question.question_id !== expectedId) errors.push(`question_sequence_mismatch:${question.question_id || "missing"}:expected_${expectedId}`);
    if (seen.has(question.question_id)) errors.push(`duplicate_question_id:${question.question_id}`);
    seen.add(question.question_id);

    for (const field of REQUIRED_QUESTION_FIELDS) if (question[field] === undefined || question[field] === null || question[field] === "") errors.push(`${expectedId}:missing_${field}`);
    if (question.editable !== true) errors.push(`${expectedId}:editable_must_be_true`);
    if (question.required_for_assembly !== true) errors.push(`${expectedId}:required_for_assembly_must_be_true`);
    if (question.assembly_blocker !== true) errors.push(`${expectedId}:assembly_blocker_must_be_true`);
    if (!Array.isArray(question.document_impact) || !question.document_impact.length) errors.push(`${expectedId}:document_impact_missing`);
    if (!Array.isArray(question.answer_prefill_mapping)) errors.push(`${expectedId}:answer_prefill_mapping_missing`);
    if (!Array.isArray(question.evidence_source_mapping)) errors.push(`${expectedId}:evidence_source_mapping_missing`);
    if (!question.qualified_review_push_policy?.push_to_qualified_review_on_click) errors.push(`${expectedId}:push_policy_missing`);
    if (!question.suggested_answer) errors.push(`${expectedId}:final_prefill_missing`);
    if (!["FULL", "PARTIAL", "DEMO"].includes(question.prefill_strength)) errors.push(`${expectedId}:bad_prefill_strength:${question.prefill_strength}`);

    if (PRIVATE_IDS.has(question.question_id)) {
      if (question.prefill_source !== "private_demo_assumption") errors.push(`${expectedId}:private_row_bad_prefill_source`);
      if (question.normalized_section_value_found !== false) errors.push(`${expectedId}:private_row_must_not_claim_normalized_value`);
      if (question.demo_disclaimer_required !== true) errors.push(`${expectedId}:private_row_demo_disclaimer_required`);
      if (!question.suggested_answer) errors.push(`${expectedId}:private_row_suggested_answer_missing`);
    } else if (question.prefill_source === "diligence_normalized_section") {
      if (question.normalized_section_value_found !== true) errors.push(`${expectedId}:diligence_prefill_without_normalized_value`);
      if (question.evidence_mode !== "normalized_section_field") errors.push(`${expectedId}:diligence_bad_evidence_mode`);
    } else if (question.prefill_source === "market_norm_demo") {
      if (question.demo_disclaimer_required !== true) errors.push(`${expectedId}:demo_disclaimer_required`);
      if (!question.suggested_answer) errors.push(`${expectedId}:demo_suggested_answer_missing`);
      if (question.evidence_mode !== "demo_not_evidence") errors.push(`${expectedId}:demo_bad_evidence_mode`);
      warnings.push(`${expectedId}:demo_fallback_used`);
    } else {
      errors.push(`${expectedId}:bad_prefill_source:${question.prefill_source}`);
    }

    if ((question.answer_type === "dropdown" || question.answer_type === "select") && question.suggested_answer) {
      const selected = question.answer_type === "select" ? String(question.suggested_answer).split(",").map((value) => value.trim()).filter(Boolean) : [question.suggested_answer];
      selected.forEach((value) => {
        if (!question.answer_options.includes(value)) errors.push(`${expectedId}:invalid_option:${value}`);
      });
    }
  });

  return { validator_name: "QUALIFIED_REVIEW_MATRIX_ARTIFACT_VALIDATOR_V1", status: errors.length ? "FAIL" : "PASS", actual_question_count: questions.length, expected_section_counts: EXPECTED_SECTION_COUNTS, errors, warnings };
}

function assertCounts(errors, questions, field, expectedCounts, label) {
  const actualCounts = questions.reduce((acc, question) => { const key = question[field]; acc[key] = (acc[key] || 0) + 1; return acc; }, {});
  for (const [key, expected] of Object.entries(expectedCounts)) if ((actualCounts[key] || 0) !== expected) errors.push(`${label}:${key}:expected_${expected}:found_${actualCounts[key] || 0}`);
}
