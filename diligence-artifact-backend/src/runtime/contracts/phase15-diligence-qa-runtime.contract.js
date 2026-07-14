export const DILIGENCE_QA_COMPLETE_RUNTIME_READS = Object.freeze([
  "qualified_review_submission",
  "qr_final_value_ledger",
  "document_activation_manifest"
]);

export const DILIGENCE_QA_COMPLETE_RUNTIME_WRITES = Object.freeze([
  "diligence_qa_completion_receipt"
]);

export const PHASE15_DILIGENCE_QA_COMPLETE_RUNTIME_CONTRACT = Object.freeze({
  type: "deterministic",
  actor_id: "diligence_qa_gate",
  reads: DILIGENCE_QA_COMPLETE_RUNTIME_READS,
  writes: DILIGENCE_QA_COMPLETE_RUNTIME_WRITES,
  next: "AWAITING_ASSEMBLY",
  central_phase_id: "DILIGENCE_QA_COMPLETE",
  public_label: "Diligence-QA Complete",
  runtime_contract_version: "phase15_diligence_qa_complete_runtime_contract.v1",
  immutable_hash_verification_required: true,
  final_value_completeness_required: true,
  document_activation_validation_required: true,
  review_ready_boundary_required: true,
  local_counsel_boundary_required: true,
  document_assembly_forbidden: true,
  pauses_before_assembly: true
});
