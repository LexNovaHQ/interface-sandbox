import assert from "node:assert/strict";
import { QUALIFIED_REVIEW_QUESTIONS, QUALIFIED_REVIEW_SECTIONS, VAULT_PAYLOAD_GROUPS, buildQualifiedReviewQuestionHandoff } from "../src/qualified-review-question-map.js";
import { validateQualifiedReviewQuestionHandoff } from "../src/qualified-review-handoff-validator.js";

assert.equal(QUALIFIED_REVIEW_QUESTIONS.length, 79);
assert.deepEqual(QUALIFIED_REVIEW_SECTIONS.map((section) => [section.section_id, section.count]), [
  ["entity_commercial", 17],
  ["technology_infrastructure", 6],
  ["ai_capability", 15],
  ["privacy_sensitive_use", 9],
  ["india_privacy_cyber", 32]
]);
assert.deepEqual(VAULT_PAYLOAD_GROUPS, ["baseline", "architecture", "archetypes", "compliance", "india_privacy_cyber"]);

const answerTypeCounts = QUALIFIED_REVIEW_QUESTIONS.reduce((acc, question) => {
  acc[question.answer_type] = (acc[question.answer_type] || 0) + 1;
  return acc;
}, {});
assert.deepEqual(answerTypeCounts, { short_answer: 20, long_answer: 15, select: 5, dropdown: 39 });

for (let i = 0; i < QUALIFIED_REVIEW_QUESTIONS.length; i += 1) {
  const question = QUALIFIED_REVIEW_QUESTIONS[i];
  assert.equal(question.question_number, i + 1);
  assert.equal(question.question_id, `QR-${String(i + 1).padStart(3, "0")}`);
  assert.ok(VAULT_PAYLOAD_GROUPS.includes(question.vault_path.split(".")[0]));
  assert.equal(question.editable, true);
  assert.equal(question.assembly_blocker, true);
}

const handoff = buildQualifiedReviewQuestionHandoff({ run: { run_id: "TEST-QR" }, artifacts: {} });
const validation = validateQualifiedReviewQuestionHandoff(handoff);
assert.equal(validation.status, "PASS");
console.log("qualified review contract: PASS");
