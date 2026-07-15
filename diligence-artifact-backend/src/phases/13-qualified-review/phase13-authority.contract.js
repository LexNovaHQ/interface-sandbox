export const PHASE13_AUTHORITY_CONTRACT_VERSION = "phase13_authority_and_validation.v1";

export const PHASE13_RUNTIME_SEQUENCE = Object.freeze([
  "NORMALIZED_REPORT_RENDERER",
  "QUALIFIED_REVIEW",
  "AWAITING_QUALIFIED_REVIEW",
  "QUALIFIED_REVIEW_SUBMISSION",
  "DILIGENCE_QA_COMPLETE",
  "ASSEMBLY_ENGINE",
  "COMPLETE"
]);

export const PHASE13_ALLOWED_DILIGENCE_INPUTS = Object.freeze([
  "report_manifest",
  "report_handoff",
  "phase12_compiler_validation",
  "domain_derivation_profile",
  "active_run_package_manifest",
  "REPORT_FACING_ARTIFACT_NAMES",
  "run_metadata"
]);

export const PHASE13_FORBIDDEN_INPUT_CLASSES = Object.freeze([
  "RAW_EVIDENCE",
  "LOSSLESS_EVIDENCE",
  "CARTOGRAPHY_INDEXES",
  "PHASE2_ROUTING_BUCKETS",
  "RAW_PHASE3_TO_PHASE11_PROFILES",
  "THREAT_ROWS",
  "FORENSIC_ARTIFACTS",
  "NORMALIZED_SECTION_ARTIFACTS"
]);

export const PHASE13_REVIEW_CONTRACT = Object.freeze({
  confirmation_unit: "SECTION",
  per_question_confirmation_forbidden: true,
  editable_field_states: Object.freeze([
    "UNCHANGED",
    "EDITED",
    "NOT_APPLICABLE",
    "LIMITATION_ADDED"
  ]),
  edit_after_attestation_resets_section: true,
  submission_requires_all_active_sections_attested: true,
  submission_requires_activation_probes_resolved: true,
  submission_requires_no_unresolved_critical_fields: true
});

export const PHASE13_VALUE_PRECEDENCE = Object.freeze([
  "REVIEWER",
  "PHASE_12",
  "MARKET_BASED",
  "UNRESOLVED"
]);

export const PHASE13_AUTHORITY_STATUS = Object.freeze({
  phase13_is_deterministic: true,
  semantic_derivation_forbidden: true,
  raw_evidence_reads_forbidden: true,
  phase12_is_sole_diligence_prefill_authority: true,
  operator_domain_selection_forbidden: true,
  operator_lane_selection_forbidden: true,
  final_value_authority_after_submission: "qr_final_value_ledger",
  assembly_re_reads_phase12_forbidden: true,
  legacy_79_row_matrix_authority_forbidden: true,
  normalized_section_selector_authority_forbidden: true,
  lex_nova_role: "LEGAL_ARCHITECT_NOT_LAW_FIRM",
  review_ready_draft_only: true,
  local_counsel_review_required: true
});
