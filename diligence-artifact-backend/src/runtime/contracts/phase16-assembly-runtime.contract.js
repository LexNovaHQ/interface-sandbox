export const ASSEMBLY_ENGINE_RUNTIME_READS = Object.freeze([
  "diligence_qa_completion_receipt",
  "qualified_review_submission",
  "qr_final_value_ledger",
  "document_activation_manifest"
]);

export const ASSEMBLY_ENGINE_RUNTIME_WRITES = Object.freeze([
  "document_assembly_payload",
  "review_ready_draft_manifest",
  "document_assembly_validation_manifest"
]);

export const PHASE16_ASSEMBLY_ENGINE_RUNTIME_CONTRACT = Object.freeze({
  type: "deterministic",
  actor_id: "assembly_engine",
  reads: ASSEMBLY_ENGINE_RUNTIME_READS,
  writes: ASSEMBLY_ENGINE_RUNTIME_WRITES,
  next: "COMPLETE",
  central_phase_id: "ASSEMBLY_ENGINE",
  public_label: "Assembly Engine",
  runtime_contract_version: "PHASE16_ASSEMBLY_ENGINE_RUNTIME_CONTRACT_v1",
  explicit_assembly_authorization_required: true,
  diligence_qa_completion_receipt_required: true,
  immutable_source_hash_verification_required: true,
  active_documents_only: true,
  suppressed_documents_not_generated: true,
  all_qr_placeholders_must_resolve: true,
  qr_control_schedule_removal_required: true,
  architect_notes_removal_required: true,
  production_notes_removal_required: true,
  counsel_notes_preserved: true,
  heuristic_clause_deletion_forbidden: true,
  prose_only_clause_actions_become_local_counsel_actions: true,
  review_ready_draft_only: true,
  local_counsel_review_required: true,
  generated_documents_git_forbidden: true,
  matter_specific_outputs_stored_in_run_drive_folder: true,
  terminal: true
});
