export const RUNTIME_ROUTE_MOUNTS = Object.freeze({
  health: "/health",
  public: "/public",
  operator: "/v1"
});

export const RUNTIME_PUBLIC_ROUTES = Object.freeze({
  centralPhases: "/runtime/central-phases",
  qualifiedReview: "/diligence-system/jobs/:run_id/qualified-review",
  qualifiedReviewSubmission: "/diligence-system/jobs/:run_id/qualified-review/responses"
});

export const RUNTIME_OPERATOR_ROUTES = Object.freeze({
  createReviewerJob: "/reviewer/jobs",
  getReviewerJob: "/reviewer/jobs/:run_id",
  advanceReviewerJob: "/reviewer/jobs/:run_id/advance",
  worker: "/reviewer/jobs/:run_id/worker",
  centralPhases: "/runtime/central-phases",
  internalJobs: "/runtime/internal-jobs"
});

export const PUBLIC_ROUTE_BOUNDARIES = Object.freeze({
  reportReads: ["renderer_payload"],
  qualifiedReviewReads: ["qualified_review_renderer_payload", "qualified_review_validation_manifest"],
  qualifiedReviewSubmissionWrites: ["qualified_review_submission"],
  forbiddenPublicArtifacts: ["raw_provider_telemetry", "private_runtime_config"]
});
