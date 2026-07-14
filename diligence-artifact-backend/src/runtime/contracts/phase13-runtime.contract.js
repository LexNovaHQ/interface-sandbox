import { PHASE12_RENDERER_READ_ARTIFACT_NAMES } from "./artifact-permissions.contract.js";

export const QUALIFIED_REVIEW_RUNTIME_READS = Object.freeze([
  "domain_derivation_profile",
  "active_run_package_manifest",
  ...PHASE12_RENDERER_READ_ARTIFACT_NAMES
]);

export const QUALIFIED_REVIEW_RUNTIME_WRITES = Object.freeze([
  "qr_registry_load_manifest",
  "qr_registry_structural_validation",
  "qr_registry_resolution_manifest",
  "qr_phase12_value_resolution",
  "qr_active_field_ledger",
  "phase13_domain_field_resolution_summary",
  "qualified_review_handoff",
  "qualified_review_renderer_payload",
  "qualified_review_validation_manifest"
]);

export const PHASE13_QUALIFIED_REVIEW_RUNTIME_CONTRACT = Object.freeze({
  type: "deterministic",
  actor_id: "qualified_review_system",
  reads: QUALIFIED_REVIEW_RUNTIME_READS,
  writes: QUALIFIED_REVIEW_RUNTIME_WRITES,
  next: "AWAITING_QUALIFIED_REVIEW",
  central_phase_id: "QUALIFIED_REVIEW",
  public_label: "Qualified Review",
  runtime_contract_version: "phase13_qualified_review_runtime_contract.v1",
  registry_driven: true,
  phase12_material_values_only: true,
  raw_evidence_reads_forbidden: true,
  upstream_profile_reads_forbidden: true,
  confirmation_unit: "SECTION",
  per_question_confirmation_forbidden: true,
  operator_domain_selection_forbidden: true,
  operator_lane_selection_forbidden: true,
  pauses_for_human_review: true
});
