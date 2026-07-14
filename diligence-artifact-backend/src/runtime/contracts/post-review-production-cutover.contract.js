export const POST_REVIEW_PRODUCTION_CUTOVER_VERSION = "phase13_16_post_review_production_cutover.v1";

export const POST_REVIEW_PRODUCTION_CUTOVER_CONTRACT = Object.freeze({
  cutover_version: POST_REVIEW_PRODUCTION_CUTOVER_VERSION,
  active: true,
  source_certification_required: true,
  source_certification_command: "npm run check:critical",
  live_cloud_execution_is_separate_from_source_certification: true,
  runtime_sequence: Object.freeze([
    "QUALIFIED_REVIEW",
    "AWAITING_QUALIFIED_REVIEW",
    "QUALIFIED_REVIEW_SUBMISSION",
    "DILIGENCE_QA_COMPLETE",
    "AWAITING_ASSEMBLY",
    "ASSEMBLY_ENGINE",
    "COMPLETE"
  ]),
  authorities: Object.freeze({
    qualified_review: "src/phases/13-qualified-review/qualified-review.runner.js",
    immutable_submission: "src/phases/14-qualified-review-submission/qualified-review-submission.compiler.v2.js",
    diligence_qa: "src/phases/15-diligence-qa-complete/diligence-qa-complete.runner.v2.js",
    document_assembly: "src/phases/16-assembly-engine/assembly-engine.runner.js",
    runtime_dispatch: "src/runtime/services/async-phase13.service.js",
    qr_registry_catalog: "references/registry/qr/v2_1/QR_Registry_Catalog_v2.yml",
    document_template_manifest: "references/document-templates/ai/v2_1/TEMPLATE_MANIFEST.yml"
  }),
  safeguards: Object.freeze({
    confirmation_unit: "SECTION",
    per_question_confirmation_forbidden: true,
    operator_domain_selection_forbidden: true,
    operator_lane_selection_forbidden: true,
    immutable_submission_required: true,
    diligence_qa_required_before_assembly: true,
    explicit_assembly_authorization_required: true,
    generated_documents_are_review_ready_drafts: true,
    local_counsel_review_required: true,
    legal_architect_not_law_firm: true,
    matter_specific_documents_must_not_be_committed_to_git: true
  }),
  retired_authorities: Object.freeze({
    normalized_section_qr_matrix: "REMOVED",
    seventy_nine_row_question_map: "REMOVED",
    per_question_confirmation_runtime: "REMOVED",
    legacy_browser_responses_client: "REMOVED",
    responses_endpoint: "HTTP_410_TOMBSTONE_ONLY"
  })
});
