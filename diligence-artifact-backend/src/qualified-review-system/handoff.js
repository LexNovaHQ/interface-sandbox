import { asArray, safeObject, safeText } from "../report-safe-language.js";
import { buildQualifiedReviewMatrixArtifacts } from "./matrix-artifact-compiler.js";
import { validateQualifiedReviewQuestionHandoff } from "./qr-validator.js";

export const QUALIFIED_REVIEW_HANDOFF_VERSION = "qualified_review_handoff_matrix_artifacts_v1";

export function buildQualifiedReviewHandoff({ run = {}, normalized_report_manifest = {}, sections = {}, artifacts = {} } = {}) {
  const sectionOrder = asArray(normalized_report_manifest.section_order);
  const compiled = buildQualifiedReviewMatrixArtifacts({ run, normalized_report_manifest, sections, artifacts });
  const questions = asArray(compiled.questions);
  const questionHandoff = buildQuestionHandoff({ run, compiled });
  const validation = validateQualifiedReviewQuestionHandoff(questionHandoff);
  const status = validation.status === "FAIL" ? "LOCKED_WITH_LIMITATIONS" : safeText(normalized_report_manifest.validation_status, "LOCKED_WITH_LIMITATIONS");
  return {
    handoff_type: "qualified_review_handoff",
    handoff_version: QUALIFIED_REVIEW_HANDOFF_VERSION,
    matrix_version: compiled.qualified_review_matrix_manifest.matrix_version,
    run_id: safeText(run.run_id || normalized_report_manifest.run_id, "UNKNOWN_RUN"),
    target: safeText(run.target || normalized_report_manifest.target, "Target not specified"),
    target_url: safeText(run.root_url || run.target_url || normalized_report_manifest.target_url, "Target URL not specified"),
    validation_status: status,
    question_handoff_contract_status: validation.status,
    public_label: "Qualified Review",
    primary_action_label: "Proceed to Qualified Review",
    secondary_action_label: "Download PDF",
    forbidden_public_actions: ["Download JSON"],
    ui_mode: "SECTION_BY_SECTION_WIZARD",
    intake_boundary: "Review-Ready support material. All answers require reviewer confirmation before draft preparation.",
    source_branch: "NORMALIZED_SECTIONS_TO_QR_MATRIX_ARTIFACTS",
    qualified_review_matrix_manifest: compiled.qualified_review_matrix_manifest,
    qr_artifacts: compiled.qr_artifacts,
    canonical_matrix_bridge: buildCanonicalMatrixBridge({ questions, validation, compiled }),
    section_order: sectionOrder,
    section_intake: sectionOrder.map((sectionId) => sectionIntakeRow({ sectionId, section: sections[sectionId] })),
    normalized_section_signal_queue: buildQualifiedReviewQueue({ sectionOrder, sections }),
    qualified_review_queue: buildMatrixQueue(questions),
    question_handoff: questionHandoff,
    question_handoff_validation: validation,
    question_count: questionHandoff.question_count,
    progress_rail: questionHandoff.progress_rail,
    section_pages: questionHandoff.section_pages,
    final_review_gate: { requires_confirmation_before_assembly: true, blocks_draft_preparation_until_confirmed: true, required_question_count: questions.length },
    confirmation_policy: {
      require_confirmation_before_assembly: true,
      preserve_source_artifacts: true,
      preserve_evidence_refs: true,
      all_prefilled_answers_editable: true,
      confirmed_answers_override_prefill: true,
      demo_prefill_is_not_evidence: true
    }
  };
}

function buildQuestionHandoff({ run, compiled }) {
  const questions = asArray(compiled.questions);
  const sectionPages = asArray(compiled.section_pages);
  return {
    handoff_type: "qualified_review_question_handoff",
    handoff_version: compiled.qualified_review_matrix_manifest.matrix_version,
    run_id: safeText(run.run_id, "UNKNOWN_RUN"),
    ui_mode: "SECTION_BY_SECTION_WIZARD",
    question_count: questions.length,
    sections: sectionPages.map((page) => ({ section_id: page.section_id, title: page.section_title })),
    progress_rail: sectionPages.map((page, index) => ({ step: index + 1, section_id: page.section_id, label: page.section_title, question_count: page.question_count, status: "NEEDS_CONFIRMATION" })),
    section_pages: sectionPages,
    questions,
    warnings: questions.flatMap((question) => asArray(question.warnings))
  };
}

function buildCanonicalMatrixBridge({ questions, validation, compiled }) {
  const manifest = compiled.qualified_review_matrix_manifest || {};
  return {
    bridge_type: "qualified_review_canonical_matrix_bridge",
    source_phase: "NORMALIZED_COMPILER",
    map_version: manifest.matrix_version,
    locked_counts: { question_count: questions.length, section_counts: countBy(questions, "section_id"), answer_type_counts: countBy(questions, "answer_type") },
    sections: asArray(compiled.section_pages).map((page, index) => ({ section_id: page.section_id, section_number: index + 1, section_title: page.section_title, question_count: page.question_count })),
    qr_artifact_contract: { artifact_count: Object.keys(safeObject(compiled.qr_artifacts)).length, artifacts: manifest.section_artifacts || [], status: "LOCKED" },
    vault_payload_contract: { row_count: questions.filter((question) => question.writes_to_vault_payload === true).length, writes_to_vault_payload: true, status: "LOCKED", allowed_roots: ["baseline", "architecture", "archetypes", "compliance", "operational"], allowed_root_groups: ["baseline", "architecture", "archetypes", "compliance"], status_fields: ["status", "submittedAt"] },
    india_contract: { row_count: questions.filter((question) => question.writes_to_india_privacy_cyber === true).length, destination_root: "qualified_review.india_privacy_cyber", must_not_write_to_vault_payload: true },
    prefill_contract: { diligence_normalized_section_rows: questions.filter((question) => question.prefill_source === "diligence_normalized_section").length, market_norm_demo_rows: questions.filter((question) => question.prefill_source === "market_norm_demo").length, private_demo_assumption_rows: questions.filter((question) => question.prefill_source === "private_demo_assumption").length, all_questions_prefilled: questions.every((question) => Boolean(question.suggested_answer)), missing_backend_evidence_is_nonblocking: true, demo_disclaimer_required: true, demo_prefill_requires_disclaimer: true, demo_prefill_is_not_evidence: true },
    draft_prep_contract: { blocked_until_confirmation: true, route_count: questions.length, routes_are_in_question_handoff: true },
    ui_contract: { answer_type_controls: true, demo_disclaimer_required_for_market_norm_rows: true, no_empty_demo_need_to_fill_fields: true, answer_type_selects_input_control: true, document_impact_shows_document_chips: true, no_empty_demo_fields: true },
    validation
  };
}

function sectionIntakeRow({ sectionId, section }) {
  const s = safeObject(section);
  return { section_id: sectionId, artifact_name: s.artifact_name || `normalized_section__${sectionId}`, section_title: safeText(s.section_title, sectionId), eligible_for_qualified_review: s.qualified_review_mapping?.eligible !== false, qualified_review_category: s.qualified_review_mapping?.category || sectionId, requires_confirmation_before_assembly: true, source_artifacts_used: asArray(s.source_artifacts_used), section_limitations: asArray(s.section_limitations), subsection_count: asArray(s.subsections).length, field_count: asArray(s.subsections).reduce((sum, sub) => sum + asArray(sub.fields).length, 0) };
}

function buildQualifiedReviewQueue({ sectionOrder, sections }) {
  const queue = [];
  for (const sectionId of sectionOrder) {
    const section = safeObject(sections[sectionId]);
    for (const subsection of asArray(section.subsections)) {
      for (const field of asArray(subsection.fields)) {
        const note = safeText(field.qualified_review_note, "");
        const limitation = safeText(field.limitation, "");
        if (!note && !limitation) continue;
        queue.push({ section_id: sectionId, section_title: safeText(section.section_title, sectionId), subsection_id: subsection.subsection_id || "", subsection_title: safeText(subsection.subsection_title, "Subsection"), field_id: field.field_id || "", label: safeText(field.label, "Field"), qualified_review_note: note, limitation, source_artifact: field.source_artifact || "", source_path: field.source_path || "", evidence_refs: asArray(field.evidence_refs) });
      }
    }
  }
  return queue.slice(0, 250);
}

function buildMatrixQueue(questions) { return questions.map((question) => ({ question_id: question.question_id, question_number: question.question_number, section_id: question.section_id, field_key: question.field_key, lawyer_question: question.lawyer_question || question.public_question_label, answer_type: question.answer_type, prefill_source: question.prefill_source, evidence_status: question.evidence_status, destination_path: question.vault_payload_path || question.qualified_review_path || question.canonical_path, document_impact: asArray(question.document_impact), final_gate_required: true })); }
function countBy(rows, key) { return asArray(rows).reduce((acc, row) => { const value = row[key]; acc[value] = (acc[value] || 0) + 1; return acc; }, {}); }
