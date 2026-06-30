export function validateQualifiedReviewQuestionHandoff(handoff = {}) {
  const questions = Array.isArray(handoff.questions) ? handoff.questions : [];
  const errors = [];
  if (handoff.handoff_type !== "qualified_review_question_handoff") errors.push("bad handoff_type");
  if (questions.length !== 79) errors.push(`expected 79 questions, found ${questions.length}`);
  return { validator_name: "QUALIFIED_REVIEW_VALIDATOR_PARALLEL_V1", status: errors.length ? "FAIL" : "PASS", actual_question_count: questions.length, errors, warnings: [] };
}
