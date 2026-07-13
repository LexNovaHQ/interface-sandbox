export const QUALIFIED_REVIEW_RENDERER_VERSION = "qualified_review_renderer_matrix_artifacts_v2.separate_workspace";

export function buildQualifiedReviewRendererPayload({ run = {}, qualified_review_handoff = {} } = {}) {
  const questionHandoff = qualified_review_handoff.question_handoff || {};
  const sectionPages = Array.isArray(questionHandoff.section_pages) ? questionHandoff.section_pages : [];
  const questions = Array.isArray(questionHandoff.questions) ? questionHandoff.questions : [];
  const bridge = qualified_review_handoff.canonical_matrix_bridge || {};
  return {
    renderer_type: "qualified_review_renderer_payload",
    renderer_version: QUALIFIED_REVIEW_RENDERER_VERSION,
    run_id: run.run_id || qualified_review_handoff.run_id || "UNKNOWN_RUN",
    target: run.target || qualified_review_handoff.target || "Target not specified",
    target_url: run.root_url || run.target_url || qualified_review_handoff.target_url || "Target URL not specified",
    public_label: "Qualified Review",
    ui_route: "qualified-review.html?run_id={run_id}",
    source_handoff_ref: "qualified_review_handoff",
    handoff_version: qualified_review_handoff.handoff_version || "",
    matrix_version: qualified_review_handoff.matrix_version || bridge.map_version || "",
    qualified_review_is_separate_system: true,
    shares_pipeline_run_id: true,
    no_document_assembly: true,
    question_count: questions.length,
    section_count: sectionPages.length,
    bridge_contract: bridge,
    qr_artifacts: qualified_review_handoff.qr_artifacts || {},
    matrix_manifest: qualified_review_handoff.qualified_review_matrix_manifest || {},
    render_contract: {
      read_artifact: "qualified_review_renderer_payload",
      handoff_artifact: "qualified_review_handoff",
      matrix_source: "qualified-review-matrix.yml",
      section_wizard: true,
      editable_answers: true,
      limitation_notes: true,
      save_response_state: true,
      submission_receipt: true,
      final_review_gate: true,
      evidence_badges: true,
      demo_disclaimers: true,
      document_impact_chips: true,
      answer_type_controls: true,
      allowed_server_answer_states: ["confirmed", "edited", "not_applicable"],
      reviewer_decisions: ["confirm", "correct", "limitation", "not_applicable"],
      forbidden_public_actions: ["Download JSON", "Assemble Document", "Proceed to Drafting"],
      no_legal_advice: true,
      qualified_review_is_separate_system: true,
      shares_pipeline_run_id: true,
      no_document_assembly: true
    },
    summary_counts: buildSummaryCounts({ questions, bridge }),
    progress_rail: questionHandoff.progress_rail || [],
    section_pages: sectionPages,
    question_sections: buildQuestionSections({ sectionPages, questions }),
    questions,
    final_review_gate: qualified_review_handoff.final_review_gate || {},
    confirmation_policy: qualified_review_handoff.confirmation_policy || {},
    ui_copy: {
      boundary_notice: qualified_review_handoff.intake_boundary || "All answers require reviewer confirmation before Qualified Review submission.",
      backend_badge: "Diligence prefill — confirm",
      demo_badge: "Demo prefill — confirm",
      confirm_hint: "Confirm, correct or qualify before Qualified Review submission.",
      receipt_notice: "Submission records the Qualified Review state for the shared run ID. It does not assemble a document."
    }
  };
}

function buildSummaryCounts({ questions, bridge }) {
  const prefill = bridge.prefill_contract || {};
  return {
    total_questions: questions.length,
    diligence_normalized_section_rows: prefill.diligence_normalized_section_rows ?? questions.filter((question) => question.prefill_source === "diligence_normalized_section").length,
    backend_artifact_rows: prefill.diligence_normalized_section_rows ?? questions.filter((question) => question.prefill_source === "diligence_normalized_section").length,
    market_norm_demo_rows: prefill.market_norm_demo_rows ?? questions.filter((question) => question.prefill_source === "market_norm_demo").length,
    private_demo_assumption_rows: prefill.private_demo_assumption_rows ?? questions.filter((question) => question.prefill_source === "private_demo_assumption").length,
    all_questions_prefilled: prefill.all_questions_prefilled ?? questions.every((question) => Boolean(question.suggested_answer)),
    vault_payload_rows: bridge.vault_payload_contract?.row_count ?? questions.filter((question) => question.writes_to_vault_payload === true).length,
    india_privacy_cyber_rows: bridge.india_contract?.row_count ?? questions.filter((question) => question.writes_to_india_privacy_cyber === true).length
  };
}

function buildQuestionSections({ sectionPages, questions }) {
  return sectionPages.map((page) => {
    const ids = Array.isArray(page.question_ids) ? new Set(page.question_ids) : null;
    const rows = ids ? questions.filter((question) => ids.has(question.question_id)) : questions.filter((question) => question.section_id === page.section_id);
    return {
      section_id: page.section_id,
      section_title: page.section_title || page.title || page.section_id,
      question_count: rows.length,
      diligence_normalized_section_rows: rows.filter((question) => question.prefill_source === "diligence_normalized_section").length,
      backend_artifact_rows: rows.filter((question) => question.prefill_source === "diligence_normalized_section").length,
      market_norm_demo_rows: rows.filter((question) => question.prefill_source === "market_norm_demo").length,
      private_demo_assumption_rows: rows.filter((question) => question.prefill_source === "private_demo_assumption").length,
      questions: rows
    };
  });
}
