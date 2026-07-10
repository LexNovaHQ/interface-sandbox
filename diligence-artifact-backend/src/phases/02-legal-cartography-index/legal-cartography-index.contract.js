const M9_PHASE1_V4_READS = Object.freeze([
  "source_discovery_handoff",
  "post_phase_1_domain_gate_handoff",
  "source_discovery_matrix_manifest",
  "neutral_evidence_bucket_manifest",
  "adapter_expansion_log",
  "source_family_index",
  "legal_doc_inventory",
  "legal_doc_extraction_index",
  "legal_doc_lossless_validation_manifest",
  "legal_doc_{DOC_TYPE}",
  "lossless_root__company_identity",
  "lossless_root__contact_notice",
  "lossless_root__privacy_data_processing",
  "lossless_root__security_trust_compliance",
  "lossless_root__data_governance_controls",
  "lossless_root__ai_safety_transparency",
  "lossless_root__technical_docs_api",
  "lossless_root__docs_api_data_flow"
]);

export const LEGAL_CARTOGRAPHY_INDEX_CONTRACT = Object.freeze({
  central_phase_id: "LEGAL_CARTOGRAPHY_INDEX",
  public_label: "Legal Cartography and Index",
  implementation_status: "M9_MAIN_RESTORED_PHASE1_V4_INPUT_CONTRACT",
  production_entrypoint_switched: false,
  migration_boundary: {
    phase_layer: "src/phases/02-legal-cartography-index",
    runtime_owner: "src/runtime/services/pipeline.service.js",
    migration_mode: "main_m9_substance_restored_phase1_v4_input_cutover",
    m9_artifact_contract_preserved: true
  },
  jobs: Object.freeze({
    LEGAL_CARTOGRAPHY_INDEX: Object.freeze({
      job_id: "LEGAL_CARTOGRAPHY_INDEX",
      public_label: "Legal Cartography Index",
      execution_mode: "m9_hybrid_main_restored",
      model_assisted_semantic_navigation_allowed: true,
      deterministic_compiler_required: true,
      purpose: "Build main-M9 legal/governance document inventory, structure, embedded-unit map, semantic navigation, control locators, QR legal signal map, and missing/limited source rows from Phase 1 v4 common-root and legal_doc source artifacts.",
      reads: M9_PHASE1_V4_READS,
      writes: Object.freeze(["legal_cartography_deterministic_map", "legal_cartography_semantic_profile", "legal_cartography_index"]),
      forbidden_outputs: Object.freeze(["source_discovery_handoff", "m7_deterministic_legal_signal_overlay", "m10_selected_legal_support_packet", "target_profile", "data_provenance_profile", "qualified_review_handoff", "qualified_review_renderer_payload", "renderer_payload", "legal_advice", "compliance_conclusion", "enforceability_assessment", "risk_conclusion"]),
      boundary_rules: Object.freeze({ index_only: true, input_contract: "phase1_v4_common_roots_plus_individual_legal_doc_artifacts", old_family_inputs_forbidden: true, full_legal_text_copied: false, legal_advice_generated: false, compliance_conclusion_generated: false, enforceability_conclusion_generated: false, risk_conclusion_generated: false, qualified_review_legal_signals_are_locator_signals_only: true })
    })
  }),
  required_save_order: Object.freeze(["legal_cartography_deterministic_map", "legal_cartography_semantic_profile", "legal_cartography_index"]),
  final_downstream_artifacts: Object.freeze(["legal_cartography_index"]),
  restored_main_m9_input_contract: M9_PHASE1_V4_READS
});

export const LEGAL_SIGNAL_DERIVATION_PROFILE_CONTRACT = Object.freeze({
  artifact_name: "legal_signal_derivation_profile",
  schema_version: "LEGAL_SIGNAL_DERIVATION_PROFILE_v2_PHASE1_SOURCE_INPUT_CONTRACT_COMPATIBILITY_RETIRED_FROM_MAIN_M9",
  model_generated: false,
  derivation_mode: "compatibility_only_not_part_of_restored_main_m9",
  source_boundary: Object.freeze({ allowed_sources: Object.freeze(M9_PHASE1_V4_READS), old_family_inputs_forbidden: true, qr_pollution_allowed: false, legal_advice_generated: false, compliance_conclusion_generated: false, enforceability_conclusion_generated: false, risk_conclusion_generated: false, full_clause_text_copied: false }),
  required_field_groups: Object.freeze({
    legal_notice_contact_signal_map: Object.freeze([{ field_id: "LGC.NOT.010", field_key: "legal_notice_email" }, { field_id: "LGC.NOT.011", field_key: "legal_notice_contact_route" }, { field_id: "LGC.NOT.012", field_key: "legal_notice_contact_evidence_basis" }, { field_id: "LGC.NOT.013", field_key: "legal_notice_contact_limitation" }]),
    jurisdiction_dispute_signal_map: Object.freeze([{ field_id: "TP.JUR.003", field_key: "governing_law_country" }, { field_id: "TP.JUR.004", field_key: "governing_law_state" }, { field_id: "TP.JUR.005", field_key: "courts_venue" }, { field_id: "TP.JUR.007", field_key: "jurisdiction_evidence_basis" }, { field_id: "TP.JUR.008", field_key: "jurisdiction_uncertainty" }]),
    privacy_grievance_contact_signal_map: Object.freeze([{ field_id: "DAP.CONTACT.001", field_key: "privacy_contact_email" }, { field_id: "DAP.CONTACT.002", field_key: "grievance_contact_email" }, { field_id: "DAP.CONTACT.003", field_key: "officer_contact" }, { field_id: "DAP.CONTACT.004", field_key: "evidence_basis" }, { field_id: "DAP.CONTACT.005", field_key: "limitation" }]),
    consent_manager_signal_map: Object.freeze([{ field_id: "DAP.CM.001", field_key: "applicability_signal" }, { field_id: "DAP.CM.002", field_key: "public_flow_visible" }, { field_id: "DAP.CM.003", field_key: "consent_artifact_route" }, { field_id: "DAP.CM.004", field_key: "withdrawal_revocation_grievance_route" }, { field_id: "DAP.CM.005", field_key: "third_party_route_signal" }, { field_id: "DAP.CM.006", field_key: "evidence_basis" }, { field_id: "DAP.CM.007", field_key: "limitation" }])
  }),
  required_field_count: 21,
  allowed_statuses: Object.freeze(["DERIVED", "DERIVED_WITH_LIMITATION", "LOCATOR_FOUND_VALUE_NOT_VISIBLE", "SOURCE_NOT_PUBLIC", "SOURCE_CONFLICT", "NOT_APPLICABLE_CONTEXTUAL", "NOT_DERIVED_AFTER_EXHAUSTIVE_SCAN"]),
  forbidden_statuses: Object.freeze(["UNKNOWN", "N/A", "UNCLEAR", "NOT_FOUND", "NOT_DERIVED", ""]),
  required_row_fields: Object.freeze(["field_id", "field_key", "field_family", "derivation_status", "value", "evidence_basis", "locator_basis", "scanned_sources", "failure_reason", "limitation", "confidence", "downstream_consumers"]),
  anti_unknown_protocol: Object.freeze({ unknown_status_forbidden: true, absence_must_use_controlled_status: true, locator_found_cannot_be_not_derived_after_exhaustive_scan: true, value_may_be_blank_only_when_status_explains_absence: true, not_derived_after_exhaustive_scan_requires_scanned_sources: true }),
  evidence_gates: Object.freeze({ DERIVED: "evidence_basis_min_1", DERIVED_WITH_LIMITATION: "evidence_basis_min_1_and_limitation_required", LOCATOR_FOUND_VALUE_NOT_VISIBLE: "locator_basis_min_1", SOURCE_CONFLICT: "evidence_basis_min_2", NOT_DERIVED_AFTER_EXHAUSTIVE_SCAN: "scanned_sources_min_1_and_failure_reason_required" }),
  forbidden_keys_anywhere: Object.freeze(["question_id", "reviewer_question", "question_rows", "question_index", "qualified_review_legal_signals", "legal_advice", "compliance_conclusion", "enforceability_assessment", "risk_conclusion", "full_clause_text"])
});

export function requiredLegalSignalFieldRows() { return Object.entries(LEGAL_SIGNAL_DERIVATION_PROFILE_CONTRACT.required_field_groups).flatMap(([field_family, rows]) => rows.map((row) => ({ field_family, ...row }))); }
