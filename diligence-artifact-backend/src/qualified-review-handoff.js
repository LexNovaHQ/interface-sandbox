import { asArray, safeObject, safeText } from "./report-safe-language.js";
import { buildQualifiedReviewQuestionHandoff } from "./qualified-review-question-map.js";
import { validateQualifiedReviewQuestionHandoff } from "./qualified-review-handoff-validator.js";

export const QUALIFIED_REVIEW_HANDOFF_VERSION = "qualified_review_handoff_v2_question_level";

export function buildQualifiedReviewHandoff({ run = {}, normalized_report_manifest = {}, sections = {}, vault_section_handoff = null, artifacts = {} } = {}) {
  const sectionOrder = asArray(normalized_report_manifest.section_order);
  const questionHandoff = buildQualifiedReviewQuestionHandoff({ run, artifacts });
  const questionValidation = validateQualifiedReviewQuestionHandoff(questionHandoff);
  const handoffStatus = questionValidation.status === "FAIL" ? "LOCKED_WITH_LIMITATIONS" : safeText(normalized_report_manifest.validation_status, "LOCKED_WITH_LIMITATIONS");
  return {
    handoff_type: "qualified_review_handoff",
    handoff_version: QUALIFIED_REVIEW_HANDOFF_VERSION,
    run_id: safeText(run.run_id || normalized_report_manifest.run_id, "UNKNOWN_RUN"),
    target: safeText(run.target || normalized_report_manifest.target, "Target not specified"),
    target_url: safeText(run.root_url || run.target_url || normalized_report_manifest.target_url, "Target URL not specified"),
    validation_status: handoffStatus,
    question_handoff_contract_status: questionValidation.status,
    display_status: safeText(normalized_report_manifest.display_validation_status || handoffStatus, "Completed with limitations"),
    public_label: "Qualified Review",
    primary_action_label: "Proceed to Qualified Review",
    secondary_action_label: "Download PDF",
    forbidden_public_actions: ["Download JSON"],
    ui_mode: "SECTION_BY_SECTION_WIZARD",
    intake_boundary: "Review-Ready support material. Public-source facts require reviewer confirmation before drafting.",
    section_order: sectionOrder,
    section_intake: sectionOrder.map((sectionId) => sectionIntakeRow({ sectionId, section: sections[sectionId], vault_section_handoff })),
    qualified_review_queue: buildQualifiedReviewQueue({ sectionOrder, sections }),
    question_handoff: questionHandoff,
    question_handoff_validation: questionValidation,
    question_count: questionHandoff.question_count,
    progress_rail: questionHandoff.progress_rail,
    section_pages: questionHandoff.section_pages,
    final_review_gate: questionHandoff.final_review_gate,
    confirmation_policy: {
      require_confirmation_before_assembly: true,
      preserve_source_artifacts: true,
      preserve_evidence_refs: true,
      no_public_signal_as_private_fact: true,
      all_prefilled_answers_editable: true,
      confirmed_answers_override_prefill: true
    },
    legacy_vault_alias: vault_section_handoff || null
  };
}

function sectionIntakeRow({ sectionId, section, vault_section_handoff }) {
  const s = safeObject(section);
  const vaultRow = asArray(safeObject(vault_section_handoff).sections).find((row) => row.section_id === sectionId) || {};
  return {
    section_id: sectionId,
    artifact_name: s.artifact_name || `normalized_section__${sectionId}`,
    section_title: safeText(s.section_title || vaultRow.section_title, sectionId),
    eligible_for_qualified_review: vaultRow.eligible_for_vault !== false && s.vault_mapping?.eligible_for_vault !== false,
    qualified_review_category: s.vault_mapping?.vault_category || vaultRow.vault_category || sectionId,
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
        queue.push({
          section_id: sectionId,
          section_title: safeText(section.section_title, sectionId),
          subsection_id: subsection.subsection_id || "",
          subsection_title: safeText(subsection.subsection_title, "Subsection"),
          field_id: field.field_id || "",
          label: safeText(field.label, "Field"),
          qualified_review_note: note,
          limitation,
          source_artifact: field.source_artifact || "",
          source_path: field.source_path || "",
          evidence_refs: asArray(field.evidence_refs)
        });
      }
    }
  }
  return queue.slice(0, 250);
}
