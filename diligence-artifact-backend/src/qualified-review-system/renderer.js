export const QUALIFIED_REVIEW_RENDERER_VERSION = "qualified_review_renderer_parallel_v1";

export function buildQualifiedReviewRendererPayload({ run = {}, qualified_review_handoff = {} } = {}) {
  const questionHandoff = qualified_review_handoff.question_handoff || {};
  const sectionPages = Array.isArray(questionHandoff.section_pages) ? questionHandoff.section_pages : [];
  const questions = Array.isArray(questionHandoff.questions) ? questionHandoff.questions : [];
  return {
    renderer_type: "qualified_review_renderer_payload",
    renderer_version: QUALIFIED_REVIEW_RENDERER_VERSION,
    run_id: run.run_id || qualified_review_handoff.run_id || "UNKNOWN_RUN",
    target: run.target || qualified_review_handoff.target || "Target not specified",
    target_url: run.root_url || run.target_url || qualified_review_handoff.target_url || "Target URL not specified",
    public_label: "Qualified Review",
    ui_route: "qualified-review.html?run_id={run_id}",
    source_handoff_ref: "qualified_review_handoff",
    question_count: questions.length,
    section_count: sectionPages.length,
    render_contract: {
      read_artifact: "qualified_review_renderer_payload",
      handoff_artifact: "qualified_review_handoff",
      section_wizard: true,
      editable_answers: true,
      final_review_gate: true,
      forbidden_public_actions: ["Download JSON"],
      no_legal_advice: true,
      no_document_assembly: true
    },
    progress_rail: questionHandoff.progress_rail || [],
    section_pages: sectionPages,
    questions,
    final_review_gate: qualified_review_handoff.final_review_gate || {},
    confirmation_policy: qualified_review_handoff.confirmation_policy || {}
  };
}
