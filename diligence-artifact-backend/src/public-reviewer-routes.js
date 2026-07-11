// Compatibility bridge only. The mounted central public router owns all public diligence routes.
// qualified_review_submission is persisted by qualified-review-submission.service.js.
export { publicRouter as publicReviewerRouter } from "./runtime/routes/public.routes.js";
