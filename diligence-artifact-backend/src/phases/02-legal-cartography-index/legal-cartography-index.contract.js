export const LEGAL_CARTOGRAPHY_INDEX_CONTRACT = Object.freeze({
  central_phase_id: "LEGAL_CARTOGRAPHY_INDEX",
  public_label: "Legal Cartography and Index",
  implementation_status: "CONTRACT_LOCKED_IMPLEMENTATION_PENDING",
  production_entrypoint_switched: false,
  migration_boundary: {
    phase_layer: "src/phases/02-legal-cartography-index",
    runtime_owner: "src/runtime/services/pipeline.service.js",
    migration_mode: "contract_first",
    old_m9_runtime_still_active_until_explicit_cutover: true,
    preserved_inside_phase_2_cartography_index: true
  },
  jobs: Object.freeze({
    LEGAL_CARTOGRAPHY_INDEX: Object.freeze({
      job_id: "LEGAL_CARTOGRAPHY_INDEX",
      public_label: "Legal Cartography Index",
      execution_mode: "hybrid_indexing",
      model_assisted_semantic_navigation_allowed: true,
      deterministic_compiler_required: true,
      purpose: "Build legal/governance document inventory, document structure, semantic navigation, locators, missing/limited source rows, and index-only navigation pointers.",
      writes: Object.freeze(["legal_cartography_deterministic_map", "legal_cartography_semantic_profile", "legal_cartography_index"]),
      forbidden_outputs: Object.freeze(["m7_deterministic_legal_signal_overlay", "m10_selected_legal_support_packet", "target_profile", "data_provenance_profile", "qualified_review_handoff", "qualified_review_renderer_payload", "renderer_payload", "legal_advice", "compliance_conclusion", "enforceability_assessment", "risk_conclusion"]),
      boundary_rules: Object.freeze({ index_only: true, full_legal_text_copied: false, legal_advice_generated: false, compliance_conclusion_generated: false, enforceability_conclusion_generated: false, risk_conclusion_generated: false, qr_pollution_allowed: false, must_not_emit_question_id: true, must_not_emit_reviewer_question: true })
    }),
    LEGAL_SIGNAL_DERIVATION: Object.freeze({
      job_id: "LEGAL_SIGNAL_DERIVATION",
      public_label: "Legal Signal Derivation",
      execution_mode: "deterministic_field_derivation",
      model_generated: false,
      model_assisted_derivation_allowed: false,
      purpose: "Derive bounded field-registry keyed legal, jurisdiction, privacy-contact, and consent-manager signals from the legal cartography index and loaded legal corpus.",
      reads: Object.freeze(["legal_cartography_deterministic_map", "legal_cartography_semantic_profile", "legal_cartography_index", "lossless_family__L1_CORE_TERMS_PRIVACY", "lossless_family__L2_B2B_CONTRACTING", "lossless_family__L3_AI_USAGE_GOVERNANCE", "lossless_family__L4_PRIVACY_ADJACENT_NOTICES", "lossless_family__L5_LEGAL_HUB_HOSTED", "lossless_family__L6_ENTITY_NOTICE", "FIELD_DERIVATION_REGISTRY_v2_LOCKED_QR_CONTACT_PATCH_20260704.yml"]),
      writes: Object.freeze(["legal_signal_derivation_profile"]),
      forbidden_outputs: Object.freeze(["qualified_review_legal_signals", "question_rows", "question_index", "m7_deterministic_legal_signal_overlay", "m10_selected_legal_support_packet", "target_profile", "data_provenance_profile", "qualified_review_handoff", "renderer_payload", "legal_advice", "compliance_conclusion", "enforceability_assessment", "risk_conclusion"]),
      boundary_rules: Object.freeze({ deterministic_only: true, field_derivation_registry_is_derivation_authority: true, qr_question_id_is_not_derivation_authority: true, qr_pollution_allowed: false, question_id_forbidden: true, reviewer_question_forbidden: true, qr_prose_forbidden: true, full_clause_text_copied: false, legal_advice_generated: false, compliance_conclusion_generated: false, enforceability_conclusion_generated: false, risk_conclusion_generated: false, unknown_status_forbidden: true })
    })
  }),
  required_save_order: Object.freeze(["legal_cartography_deterministic_map", "legal_cartography_semantic_profile", "legal_cartography_index", "legal_signal_derivation_profile"]),
  final_downstream_artifacts: Object.freeze(["legal_cartography_index", "legal_signal_derivation_profile"]),
  deferred_downstream_integrations: Object.freeze(["M7 consumes LGC.NOT and TP.JUR signals in a later pass.", "M10 consumes DAP.CONTACT and DAP.CM signals in a later pass.", "Qualified Review consumes normalized/compiled field outputs later; it does not drive derivation."])
});

export const LEGAL_SIGNAL_DERIVATION_PROFILE_CONTRACT = Object.freeze({
  artifact_name: "legal_signal_derivation_profile",
  schema_version: "LEGAL_SIGNAL_DERIVATION_PROFILE_v1",
  model_generated: false,
  derivation_mode: "deterministic_from_legal_cartography_index_and_loaded_legal_corpus",
  source_boundary: Object.freeze({ allowed_sources: Object.freeze(["legal_cartography_deterministic_map", "legal_cartography_semantic_profile", "legal_cartography_index", "loaded_legal_governance_families", "field_derivation_registry"]), qr_pollution_allowed: false, legal_advice_generated: false, compliance_conclusion_generated: false, enforceability_conclusion_generated: false, risk_conclusion_generated: false, full_clause_text_copied: false }),
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
