export const QUALIFIED_REVIEW_RENDERER_VERSION = "qualified_review_renderer_locked_matrix_v2";

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
    question_count: questions.length,
    section_count: sectionPages.length,
    bridge_contract: bridge,
    render_contract: {
      read_artifact: "qualified_review_renderer_payload",
      handoff_artifact: "qualified_review_handoff",
      matrix_source: "qualified-review-map.js",
      section_wizard: true,
      editable_answers: true,
      final_review_gate: true,
      evidence_badges: true,
      demo_disclaimers: true,
      document_impact_chips: true,
      answer_type_controls: true,
      forbidden_public_actions: ["Download JSON"],
      no_legal_advice: true,
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
      boundary_notice: qualified_review_handoff.intake_boundary || "All answers require reviewer confirmation before draft preparation.",
      backend_badge: "Diligence prefill — confirm",
      demo_badge: "Demo prefill — confirm",
      confirm_hint: "Confirm or edit before draft preparation."
    }
  };
}

function buildSummaryCounts({ questions, bridge }) {
  return {
    total_questions: questions.length,
    backend_artifact_rows: questions.filter((question) => question.prefill_source === "backend_artifact").length,
    market_norm_demo_rows: questions.filter((question) => question.prefill_source === "market_norm_demo").length,
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
      backend_artifact_rows: rows.filter((question) => question.prefill_source === "backend_artifact").length,
      market_norm_demo_rows: rows.filter((question) => question.prefill_source === "market_norm_demo").length,
      questions: rows
    };
  });
}
