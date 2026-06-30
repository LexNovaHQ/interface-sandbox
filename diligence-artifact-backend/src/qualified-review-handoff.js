import { asArray, safeObject, safeText } from "./report-safe-language.js";
import { buildQualifiedReviewQuestionHandoff, VAULT_PAYLOAD_GROUPS } from "./qualified-review-question-map.js";
import { validateQualifiedReviewQuestionHandoff } from "./qualified-review-handoff-validator.js";

export const QUALIFIED_REVIEW_HANDOFF_VERSION = "qualified_review_handoff_v2_question_level";
export const VAULT_PAYLOAD_HANDOFF_VERSION = "vault_payload_handoff_v2_locked_vault_plus_india";

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

export function buildVaultPayloadHandoff({ run = {}, normalized_report_manifest = {}, qualified_review_handoff = {} } = {}) {
  const questionHandoff = safeObject(qualified_review_handoff.question_handoff);
  const groups = asArray(questionHandoff.vault_payload_groups).length ? asArray(questionHandoff.vault_payload_groups) : [...VAULT_PAYLOAD_GROUPS];
  const payload = Object.fromEntries(groups.map((group) => [group, {}]));
  const vault_prefill_suggestions = Object.fromEntries(groups.map((group) => [group, {}]));
  const vault_confirmation_questions = [];
  for (const question of asArray(questionHandoff.questions)) {
    if (!question?.vault_path) continue;
    const path = String(question.vault_path).split(".").filter(Boolean);
    if (!groups.includes(path[0])) continue;
    setNested(payload, path, null);
    if (question.suggestion_source === "backend_artifact" && safeText(question.suggested_answer, "")) {
      setNested(vault_prefill_suggestions, path, {
        value: question.suggested_answer,
        basis: "Diligence artifact prefill; reviewer confirmation required before assembly.",
        confidence: "review_required",
        source_field_hints: asArray(question.source_field_hints),
        evidence_sources: asArray(question.evidence_sources)
      });
    }
    if (question.prefill_status === "Need to fill" || question.suggestion_source === "market_norm_demo") {
      vault_confirmation_questions.push({
        question_id: question.question_id,
        field_path: question.vault_path,
        field_key: question.field_key,
        answer_type: question.answer_type,
        allowed_options: asArray(question.allowed_options),
        question: question.public_question_label,
        why_it_matters: question.helper_text,
        demo_market_suggestion: question.demo_market_suggestion || question.market_norm_helper || "",
        demo_disclaimer: question.demo_disclaimer === true,
        demo_disclaimer_text: question.demo_disclaimer_text || "Demo market suggestion — not found in public-source diligence. Confirm or replace before draft preparation.",
        required_for_assembly: true,
        assembly_blocker: true
      });
    }
  }
  return {
    handoff_type: "vault_payload_handoff",
    handoff_version: VAULT_PAYLOAD_HANDOFF_VERSION,
    run_id: safeText(run.run_id || normalized_report_manifest.run_id, "UNKNOWN_RUN"),
    target: safeText(run.target || normalized_report_manifest.target, "Target not specified"),
    validation_status: qualified_review_handoff.validation_status || normalized_report_manifest.validation_status || "LOCKED_WITH_LIMITATIONS",
    vault_payload_groups: groups,
    vault_payload: payload,
    vault_prefill_suggestions,
    vault_confirmation_questions,
    qualified_review_handoff_ref: "qualified_review_handoff",
    question_count: questionHandoff.question_count || asArray(questionHandoff.questions).length,
    confirmation_policy: {
      public_prefill_is_not_final: true,
      demo_market_suggestions_are_not_confirmed_facts: true,
      reviewer_confirmation_required_before_document_assembly: true,
      confirmed_answer_overrides_prefill_for_draft_preparation: true
    },
    assembly_boundary: "Vault payload is a Review-Ready intake object. Public-source and demo-market values cannot be used for draft preparation until reviewer confirmation."
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
        queue.push({ section_id: sectionId, section_title: safeText(section.section_title, sectionId), subsection_id: subsection.subsection_id || "", subsection_title: safeText(subsection.subsection_title, "Subsection"), field_id: field.field_id || "", label: safeText(field.label, "Field"), qualified_review_note: note, limitation, source_artifact: field.source_artifact || "", source_path: field.source_path || "", evidence_refs: asArray(field.evidence_refs) });
      }
    }
  }
  return queue.slice(0, 250);
}

function setNested(target, path, value) {
  let cursor = target;
  for (let i = 0; i < path.length; i += 1) {
    const key = path[i];
    if (i === path.length - 1) cursor[key] = value;
    else {
      if (!cursor[key] || typeof cursor[key] !== "object" || Array.isArray(cursor[key])) cursor[key] = {};
      cursor = cursor[key];
    }
  }
}
