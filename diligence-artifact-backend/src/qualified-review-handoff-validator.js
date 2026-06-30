import { asArray, safeObject } from "./report-safe-language.js";
import { QUALIFIED_REVIEW_SECTIONS } from "./qualified-review-question-map.js";

const EXPECTED_QUESTION_COUNT = 79;
const EXPECTED_SECTION_IDS = QUALIFIED_REVIEW_SECTIONS.map((section) => section.section_id);

export function validateQualifiedReviewQuestionHandoff(handoff = {}) {
  const root = safeObject(handoff);
  const questions = asArray(root.questions);
  const sectionPages = asArray(root.section_pages);
  const progressRail = asArray(root.progress_rail);
  const errors = [];
  const warnings = [...asArray(root.warnings)];

  if (root.question_count !== EXPECTED_QUESTION_COUNT) errors.push(`QUESTION_COUNT_INVALID:${root.question_count || 0}`);
  if (questions.length !== EXPECTED_QUESTION_COUNT) errors.push(`QUESTION_ARRAY_LENGTH_INVALID:${questions.length}`);
  if (sectionPages.length !== EXPECTED_SECTION_IDS.length) errors.push(`SECTION_PAGES_INVALID:${sectionPages.length}`);
  if (progressRail.length !== EXPECTED_SECTION_IDS.length) errors.push(`PROGRESS_RAIL_INVALID:${progressRail.length}`);

  const ids = new Set();
  questions.forEach((question, index) => {
    const expectedId = `QR-${String(index + 1).padStart(3, "0")}`;
    if (question.question_id !== expectedId) errors.push(`QUESTION_ID_SEQUENCE_INVALID:${question.question_id || "missing"}:${expectedId}`);
    if (ids.has(question.question_id)) errors.push(`QUESTION_ID_DUPLICATE:${question.question_id}`);
    ids.add(question.question_id);
    if (!EXPECTED_SECTION_IDS.includes(question.section_id)) errors.push(`QUESTION_SECTION_INVALID:${question.question_id || expectedId}`);
    if (!question.prompt) errors.push(`QUESTION_PROMPT_MISSING:${question.question_id || expectedId}`);
    if (question.editable !== true) errors.push(`QUESTION_NOT_EDITABLE:${question.question_id || expectedId}`);
    if (!question.document_impact) errors.push(`QUESTION_DOCUMENT_IMPACT_MISSING:${question.question_id || expectedId}`);
    if (!Array.isArray(question.source_artifacts)) errors.push(`QUESTION_SOURCE_ARTIFACTS_MISSING:${question.question_id || expectedId}`);
    if (!Array.isArray(question.source_field_hints)) errors.push(`QUESTION_SOURCE_FIELD_HINTS_MISSING:${question.question_id || expectedId}`);
    if (question.evidence_mode === "manual_private" && !question.market_norm_helper) errors.push(`QUESTION_MARKET_NORM_HELPER_MISSING:${question.question_id || expectedId}`);
    if (!asArray(question.source_artifacts_present).length) warnings.push(`${question.question_id || expectedId}: Manual answer required or needs confirmation`);
  });

  for (const sectionId of EXPECTED_SECTION_IDS) {
    const expected = QUALIFIED_REVIEW_SECTIONS.find((section) => section.section_id === sectionId);
    const actualCount = questions.filter((question) => question.section_id === sectionId).length;
    if (actualCount !== expected.count) errors.push(`SECTION_QUESTION_COUNT_INVALID:${sectionId}:${actualCount}`);
  }

  return {
    status: errors.length ? "FAIL" : warnings.length ? "PASS_WITH_WARNINGS" : "PASS",
    errors,
    warnings: [...new Set(warnings)]
  };
}
