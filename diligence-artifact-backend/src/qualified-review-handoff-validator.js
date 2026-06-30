import { QUALIFIED_REVIEW_QUESTIONS, QUALIFIED_REVIEW_SECTIONS, VAULT_PAYLOAD_GROUPS } from "./qualified-review-question-map.js";

const POLICY_KEYS = ["push_to_qualified_review_on_click", "public_prefill_is_not_final", "preserve_original_evidence", "confirmed_answer_overrides_prefill_for_draft_preparation"];
const ANSWER_TYPES = ["short_answer", "dropdown", "select", "long_answer"];
const STATUSES = ["Prefill / confirm", "Need to fill"];
const SOURCES = ["backend_artifact", "market_norm_demo"];
const EXPECTED_TYPE_COUNTS = countBy(QUALIFIED_REVIEW_QUESTIONS, "answer_type");
const EXPECTED_SECTION_COUNTS = Object.fromEntries(QUALIFIED_REVIEW_SECTIONS.map((s) => [s.section_id, s.count]));
const REQUIRED_KEYS = ["question_id", "question_number", "section_id", "field_key", "vault_path", "draft_prep_path", "public_question_label", "answer_type", "backend_field_mappings", "prefill_status", "suggestion_source", "suggested_answer", "demo_market_suggestion", "demo_disclaimer", "editable", "required_for_assembly", "assembly_blocker", "document_impact", "helper_text", "market_norm_helper", "review_status", "vault_push_policy", "source_artifacts", "source_field_hints", "evidence_sources"];

export function validateQualifiedReviewQuestionHandoff(handoff = {}) {
  const errors = [];
  const warnings = [];
  const questions = Array.isArray(handoff.questions) ? handoff.questions : [];
  const pages = Array.isArray(handoff.section_pages) ? handoff.section_pages : [];
  const rail = Array.isArray(handoff.progress_rail) ? handoff.progress_rail : [];
  const sectionCounts = zero(EXPECTED_SECTION_COUNTS);
  const typeCounts = zero(EXPECTED_TYPE_COUNTS);
  const statusCounts = { "Prefill / confirm": 0, "Need to fill": 0 };
  const ids = new Set();
  const nums = new Set();

  eq(handoff.handoff_type, "qualified_review_question_handoff", "handoff_type", errors);
  eq(handoff.handoff_version, "qualified_review_question_handoff_v2_locked_vault_plus_india", "handoff_version", errors);
  eq(handoff.ui_mode, "SECTION_BY_SECTION_WIZARD", "ui_mode", errors);
  if (questions.length !== QUALIFIED_REVIEW_QUESTIONS.length) errors.push(`expected ${QUALIFIED_REVIEW_QUESTIONS.length} questions, found ${questions.length}`);
  if (pages.length !== QUALIFIED_REVIEW_SECTIONS.length) errors.push(`expected ${QUALIFIED_REVIEW_SECTIONS.length} section pages, found ${pages.length}`);
  if (rail.length !== QUALIFIED_REVIEW_SECTIONS.length) errors.push(`expected ${QUALIFIED_REVIEW_SECTIONS.length} progress rail items, found ${rail.length}`);
  checkGroups(handoff.vault_payload_groups, errors);

  for (const q of questions) {
    const id = q.question_id || `question_${q.question_number || "unknown"}`;
    for (const key of REQUIRED_KEYS) if (!(key in q)) errors.push(`${id}: missing ${key}`);
    if (ids.has(q.question_id)) errors.push(`${id}: duplicate question_id`);
    ids.add(q.question_id);
    if (nums.has(q.question_number)) errors.push(`${id}: duplicate question_number`);
    nums.add(q.question_number);
    if (!Number.isInteger(q.question_number) || q.question_number < 1 || q.question_number > QUALIFIED_REVIEW_QUESTIONS.length) errors.push(`${id}: invalid question_number`);
    if (q.question_id !== `QR-${String(q.question_number).padStart(3, "0")}`) errors.push(`${id}: question_id/number mismatch`);
    if (!(q.section_id in EXPECTED_SECTION_COUNTS)) errors.push(`${id}: invalid section_id`); else sectionCounts[q.section_id] += 1;
    if (!ANSWER_TYPES.includes(q.answer_type)) errors.push(`${id}: invalid answer_type`); else typeCounts[q.answer_type] += 1;
    if (!STATUSES.includes(q.prefill_status)) errors.push(`${id}: invalid prefill_status`); else statusCounts[q.prefill_status] += 1;
    if (!SOURCES.includes(q.suggestion_source)) errors.push(`${id}: invalid suggestion_source`);
    if (!VAULT_PAYLOAD_GROUPS.includes(String(q.vault_path || "").split(".")[0])) errors.push(`${id}: invalid vault_path group`);
    if (!VAULT_PAYLOAD_GROUPS.includes(String(q.draft_prep_path || "").split(".")[0])) errors.push(`${id}: invalid draft_prep_path group`);
    checkArray(q, id, "backend_field_mappings", errors, true);
    checkArray(q, id, "document_impact", errors, true);
    checkArray(q, id, "source_field_hints", errors, true);
    checkArray(q, id, "source_artifacts", errors, false);
    checkArray(q, id, "evidence_sources", errors, false);
    checkText(q.public_question_label, id, "public_question_label", 4, errors);
    checkText(q.helper_text, id, "helper_text", 20, errors);
    checkText(q.market_norm_helper, id, "market_norm_helper", 20, errors);
    if (q.editable !== true) errors.push(`${id}: editable must be true`);
    if (q.required_for_assembly !== true) errors.push(`${id}: required_for_assembly must be true`);
    if (q.assembly_blocker !== true) errors.push(`${id}: assembly_blocker must be true`);
    if (q.review_status !== "Needs confirmation") errors.push(`${id}: review_status must default to Needs confirmation`);
    for (const key of POLICY_KEYS) if (q.vault_push_policy?.[key] !== true) errors.push(`${id}: vault_push_policy.${key} must be true`);
    if (["dropdown", "select"].includes(q.answer_type) && (!Array.isArray(q.allowed_options) || !q.allowed_options.length)) errors.push(`${id}: ${q.answer_type} requires allowed_options`);
    if (["short_answer", "long_answer"].includes(q.answer_type) && Array.isArray(q.allowed_options) && q.allowed_options.length) warnings.push(`${id}: free-text field has allowed_options`);
    if (q.suggestion_source === "market_norm_demo") {
      if (q.prefill_status !== "Need to fill") errors.push(`${id}: demo suggestion must keep status Need to fill`);
      if (q.demo_disclaimer !== true) errors.push(`${id}: demo suggestion requires disclaimer`);
      checkText(q.demo_market_suggestion, id, "demo_market_suggestion", 20, errors);
    }
  }

  for (let i = 1; i <= QUALIFIED_REVIEW_QUESTIONS.length; i += 1) if (!nums.has(i)) errors.push(`missing question_number ${i}`);
  sameCounts(sectionCounts, EXPECTED_SECTION_COUNTS, "section", errors);
  sameCounts(typeCounts, EXPECTED_TYPE_COUNTS, "answer_type", errors);
  for (const page of pages) checkPage(page, errors);
  checkGate(handoff.final_review_gate, errors);

  return { validator_name: "QUALIFIED_REVIEW_QUESTION_HANDOFF_VALIDATOR_V2_LOCKED_VAULT_PLUS_INDIA", status: errors.length ? "FAIL" : warnings.length ? "PASS_WITH_WARNINGS" : "PASS", expected_question_count: QUALIFIED_REVIEW_QUESTIONS.length, actual_question_count: questions.length, expected_section_counts: EXPECTED_SECTION_COUNTS, section_counts: sectionCounts, expected_answer_type_counts: EXPECTED_TYPE_COUNTS, answer_type_counts: typeCounts, prefill_status_counts: statusCounts, expected_vault_payload_groups: VAULT_PAYLOAD_GROUPS, errors, warnings };
}

function countBy(rows, key) { return rows.reduce((acc, row) => ({ ...acc, [row[key]]: (acc[row[key]] || 0) + 1 }), {}); }
function zero(obj) { return Object.fromEntries(Object.keys(obj).map((key) => [key, 0])); }
function eq(actual, expected, label, errors) { if (actual !== expected) errors.push(`${label} must be ${expected}`); }
function checkGroups(groups, errors) { const list = Array.isArray(groups) ? groups : []; for (const group of VAULT_PAYLOAD_GROUPS) if (!list.includes(group)) errors.push(`vault_payload_groups missing ${group}`); for (const group of list) if (!VAULT_PAYLOAD_GROUPS.includes(group)) errors.push(`vault_payload_groups invalid ${group}`); }
function checkArray(q, id, key, errors, nonEmpty) { if (!Array.isArray(q[key]) || (nonEmpty && !q[key].length)) errors.push(`${id}: ${key} must be ${nonEmpty ? "non-empty " : ""}array`); }
function checkText(value, id, key, min, errors) { if (!value || String(value).trim().length < min) errors.push(`${id}: ${key} missing or too short`); }
function sameCounts(actual, expected, label, errors) { for (const [key, count] of Object.entries(expected)) if (actual[key] !== count) errors.push(`${label} ${key} expected ${count}, found ${actual[key]}`); }
function checkPage(page, errors) { const expected = EXPECTED_SECTION_COUNTS[page.section_id]; if (!expected) errors.push(`section_page invalid section_id ${page.section_id || "missing"}`); if (!Array.isArray(page.questions) || page.questions.length !== expected) errors.push(`section_page ${page.section_id || "missing"} question count mismatch`); if (!Array.isArray(page.question_ids) || page.question_ids.length !== expected) errors.push(`section_page ${page.section_id || "missing"} question_ids mismatch`); if (page.editable !== true) errors.push(`section_page ${page.section_id || "missing"} editable must be true`); }
function checkGate(gate = {}, errors) { for (const key of ["requires_zero_assembly_blockers", "requires_confirmation_before_assembly", "demo_market_suggestions_are_not_confirmed_facts", "missing_backend_fields_do_not_block_qualified_review"]) if (gate[key] !== true) errors.push(`final_review_gate.${key} must be true`); }
