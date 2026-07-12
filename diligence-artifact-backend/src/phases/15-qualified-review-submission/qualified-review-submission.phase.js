export const QUALIFIED_REVIEW_SUBMISSION_PHASE = Object.freeze({
  order: 14,
  phase_id: "QUALIFIED_REVIEW_SUBMISSION",
  public_label: "Qualified Review Submission",
  implementation_status: "MIGRATION_TARGET",
  responsibility: "Persist reviewer/user Qualified Review answers after human review. This is a save action, not an automatic model phase.",
  material_outputs: ["qualified_review_submission"],
  runtime_boundary: "Public/runtime route orchestrates. This phase owns submission validation and save logic after migration."
});
