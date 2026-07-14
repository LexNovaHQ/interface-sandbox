export const QUALIFIED_REVIEW_SUBMISSION_RUNTIME_READS = Object.freeze([
  "qualified_review_submission_request",
  "qualified_review_handoff",
  "qr_active_field_ledger",
  "qr_registry_resolution_manifest"
]);

export const QUALIFIED_REVIEW_SUBMISSION_RUNTIME_WRITES = Object.freeze([
  "qualified_review_submission",
  "qr_final_value_ledger",
  "document_activation_manifest"
]);

export const PHASE14_QUALIFIED_REVIEW_SUBMISSION_RUNTIME_CONTRACT = Object.freeze({
  type: "deterministic",
  actor_id: "qualified_review_system",
  reads: QUALIFIED_REVIEW_SUBMISSION_RUNTIME_READS,
  writes: QUALIFIED_REVIEW_SUBMISSION_RUNTIME_WRITES,
  next: "DILIGENCE_QA_COMPLETE",
  central_phase_id: "QUALIFIED_REVIEW_SUBMISSION",
  public_label: "Qualified Review Submission",
  runtime_contract_version: "phase14_qualified_review_submission_runtime_contract.v1",
  immutable_submission_required: true,
  final_value_ledger_required: true,
  document_activation_manifest_required: true,
  operator_domain_selection_forbidden: true,
  operator_lane_selection_forbidden: true,
  document_assembly_forbidden: true
});
