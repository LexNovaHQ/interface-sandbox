const EXPECTED_QUESTION_COUNT = 79;
const EXPECTED_SECTION_IDS = Object.freeze(["entity_commercial", "technology_infrastructure", "ai_capability", "privacy_sensitive_use", "india_privacy_cyber"]);
const ALLOWED_FIELD_TYPES = new Set(["public_prefilled", "hybrid", "manual_private"]);
const REQUIRED_QUESTION_KEYS = Object.freeze(["question_id", "question_number", "section_id", "field_key", "public_question_label", "field_type", "prefill_status", "editable", "required_for_assembly", "assembly_blocker", "document_impact", "helper_text", "review_status", "vault_push_policy"]);
const REQUIRED_VAULT_POLICY_KEYS = Object.freeze(["push_to_qualified_review_on_click", "public_prefill_is_not_final", "preserve_original_evidence", "confirmed_answer_overrides_prefill_for_draft_preparation"]);
const MANUAL_PREFILL_STATUSES = new Set(["Manual answer required", "Needs confirmation"]);

export function validateQualifiedReviewQuestionHandoff(handoff = {}) {
  const errors = [];
  const warnings = [];
  const questions = Array.isArray(handoff.questions) ? handoff.questions : [];
  const sectionPages = Array.isArray(handoff.section_pages) ? handoff.section_pages : [];
  const progressRail = Array.isArray(handoff.progress_rail) ? handoff.progress_rail : [];

  if (handoff.handoff_type !== "qualified_review_question_handoff") errors.push("handoff_type must be qualified_review_question_handoff");
  if (handoff.ui_mode !== "SECTION_BY_SECTION_WIZARD") errors.push("ui_mode must be SECTION_BY_SECTION_WIZARD");
  if (questions.length !== EXPECTED_QUESTION_COUNT) errors.push(`expected ${EXPECTED_QUESTION_COUNT} questions, found ${questions.length}`);
  if (sectionPages.length !== EXPECTED_SECTION_IDS.length) errors.push(`expected ${EXPECTED_SECTION_IDS.length} section pages, found ${sectionPages.length}`);
  if (progressRail.length !== EXPECTED_SECTION_IDS.length) errors.push(`expected ${EXPECTED_SECTION_IDS.length} progress rail items, found ${progressRail.length}`);

  const ids = new Set();
  const numbers = new Set();
  const sectionCounts = Object.fromEntries(EXPECTED_SECTION_IDS.map((id) => [id, 0]));

  for (const question of questions) {
    const label = question.question_id || `question_number_${question.question_number || "unknown"}`;
    for (const key of REQUIRED_QUESTION_KEYS) if (!(key in question)) errors.push(`${label}: missing ${key}`);
    if (ids.has(question.question_id)) errors.push(`${label}: duplicate question_id`);
    ids.add(question.question_id);
    if (numbers.has(question.question_number)) errors.push(`${label}: duplicate question_number`);
    numbers.add(question.question_number);
    if (!Number.isInteger(question.question_number) || question.question_number < 1 || question.question_number > EXPECTED_QUESTION_COUNT) errors.push(`${label}: invalid question_number`);
    if (!EXPECTED_SECTION_IDS.includes(question.section_id)) errors.push(`${label}: invalid section_id ${question.section_id || "missing"}`);
    else sectionCounts[question.section_id] += 1;
    if (!ALLOWED_FIELD_TYPES.has(question.field_type)) errors.push(`${label}: invalid field_type ${question.field_type || "missing"}`);
    if (question.editable !== true) errors.push(`${label}: editable must be true`);
    if (!Array.isArray(question.document_impact) || question.document_impact.length === 0) errors.push(`${label}: document_impact must be non-empty`);
    if (!question.public_question_label || String(question.public_question_label).trim().length < 10) errors.push(`${label}: public_question_label too short or missing`);
    if (!question.helper_text || String(question.helper_text).trim().length < 20) errors.push(`${label}: helper_text too short or missing`);

    const policy = question.vault_push_policy || {};
    for (const key of REQUIRED_VAULT_POLICY_KEYS) if (policy[key] !== true) errors.push(`${label}: vault_push_policy.${key} must be true`);

    if (question.field_type === "manual_private") {
      if (!MANUAL_PREFILL_STATUSES.has(question.prefill_status)) errors.push(`${label}: manual_private must not be treated as final public prefill`);
      if (!question.market_norm_helper || String(question.market_norm_helper).trim().length < 20) errors.push(`${label}: manual_private requires market_norm_helper`);
    } else {
      if (!Array.isArray(question.evidence_sources)) errors.push(`${label}: evidence_sources must be an array`);
      if (question.prefill_status === "Prefilled from public source" && question.assembly_blocker !== false) warnings.push(`${label}: public prefill remains blocker; acceptable if confirmation required, but check UI copy`);
      if (!Array.isArray(question.evidence_sources) || question.evidence_sources.length === 0) warnings.push(`${label}: public/hybrid question has no runtime evidence hit`);
    }
  }

  for (const expectedNumber of Array.from({ length: EXPECTED_QUESTION_COUNT }, (_, i) => i + 1)) {
    if (!numbers.has(expectedNumber)) errors.push(`missing question_number ${expectedNumber}`);
  }
  for (const sectionId of EXPECTED_SECTION_IDS) {
    if (!sectionCounts[sectionId]) errors.push(`section ${sectionId} has no questions`);
  }
  for (const page of sectionPages) {
    if (!EXPECTED_SECTION_IDS.includes(page.section_id)) errors.push(`section_page invalid section_id ${page.section_id || "missing"}`);
    if (!Array.isArray(page.questions) || page.questions.length === 0) errors.push(`section_page ${page.section_id || "missing"} has no questions`);
  }
  if (!handoff.final_review_gate?.requires_zero_assembly_blockers) errors.push("final_review_gate.requires_zero_assembly_blockers must be true");
  if (!handoff.final_review_gate?.requires_confirmation_before_assembly) errors.push("final_review_gate.requires_confirmation_before_assembly must be true");

  return {
    validator_name: "QUALIFIED_REVIEW_QUESTION_HANDOFF_VALIDATOR_V1",
    status: errors.length ? "FAIL" : warnings.length ? "PASS_WITH_WARNINGS" : "PASS",
    expected_question_count: EXPECTED_QUESTION_COUNT,
    actual_question_count: questions.length,
    expected_section_ids: [...EXPECTED_SECTION_IDS],
    section_counts: sectionCounts,
    errors,
    warnings
  };
}
