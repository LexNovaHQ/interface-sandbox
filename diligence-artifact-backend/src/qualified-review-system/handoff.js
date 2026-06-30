import { asArray, safeObject, safeText } from "../report-safe-language.js";
import { buildQualifiedReviewQuestionHandoff } from "./question-map.js";
import { validateQualifiedReviewQuestionHandoff } from "./qr-validator.js";

export const QUALIFIED_REVIEW_HANDOFF_VERSION = "qualified_review_handoff_parallel_v1";

export function buildQualifiedReviewHandoff({ run = {}, normalized_report_manifest = {}, sections = {}, artifacts = {} } = {}) {
  const sectionOrder = asArray(normalized_report_manifest.section_order);
  const questionHandoff = buildQualifiedReviewQuestionHandoff({ run, artifacts });
  const validation = validateQualifiedReviewQuestionHandoff(questionHandoff);
  const status = validation.status === "FAIL" ? "LOCKED_WITH_LIMITATIONS" : safeText(normalized_report_manifest.validation_status, "LOCKED_WITH_LIMITATIONS");
  return {
    handoff_type: "qualified_review_handoff",
    handoff_version: QUALIFIED_REVIEW_HANDOFF_VERSION,
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
    intake_boundary: "Review-Ready support material. Public-source facts require reviewer confirmation before drafting.",
    source_branch: "NORMALIZED_COMPILER_TO_QUALIFIED_REVIEW",
    section_order: sectionOrder,
    section_intake: sectionOrder.map((sectionId) => sectionIntakeRow({ sectionId, section: sections[sectionId] })),
    qualified_review_queue: buildQualifiedReviewQueue({ sectionOrder, sections }),
    question_handoff: questionHandoff,
    question_handoff_validation: validation,
    question_count: questionHandoff.question_count,
    progress_rail: questionHandoff.progress_rail,
    section_pages: questionHandoff.section_pages,
    final_review_gate: { requires_confirmation_before_assembly: true, blocks_draft_preparation_until_confirmed: true },
    confirmation_policy: {
      require_confirmation_before_assembly: true,
      preserve_source_artifacts: true,
      preserve_evidence_refs: true,
      no_public_signal_as_private_fact: true,
      all_prefilled_answers_editable: true,
      confirmed_answers_override_prefill: true
    }
  };
}

function sectionIntakeRow({ sectionId, section }) {
  const s = safeObject(section);
  return {
    section_id: sectionId,
    artifact_name: s.artifact_name || `normalized_section__${sectionId}`,
    section_title: safeText(s.section_title, sectionId),
    eligible_for_qualified_review: s.qualified_review_mapping?.eligible !== false,
    qualified_review_category: s.qualified_review_mapping?.category || sectionId,
    requires_confirmation_before_assembly: true,
    source_artifacts_used: asArray(s.source_artifacts_used),
    section_limitations: asArray(s.section_limitations),
    subsection_count: asArray(s.subsections).length,
    field_count: asArray(s.subsections).reduce((sum, sub) => sum + asArray(sub.fields).length, 0)
  };
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
