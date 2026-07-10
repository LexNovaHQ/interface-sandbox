const TARGET_PROFILE_LOSSLESS_READS = Object.freeze([
  "lossless_root__homepage_landing",
  "lossless_root__company_identity",
  "lossless_root__contact_notice",
  "lossless_root__pricing_commercial_availability",
  "lossless_root__regulatory_licensing_status",
  "lossless_root__grievance_complaints"
]);

export const TARGET_PROFILE_REVIEW_CONTRACT = Object.freeze({
  central_phase_id: "TARGET_PROFILE_REVIEW",
  public_label: "Target Profile Review",
  implementation_status: "PHASE2A_TARGET_SOURCE_INDEX_SYNCED_PHASE1_V5",
  production_entrypoint_switched: true,
  global_production_deployment_switched: false,
  migration_boundary: Object.freeze({
    phase_layer: "src/phases/03-target-profile-review",
    runtime_owner: "src/runtime/services/pipeline.service.js",
    migration_mode: "phase_owned_runner_active",
    compatibility_internal_job_ids_retained_until_explicit_rename: Object.freeze(["M7_TARGET_PROFILE"]),
    compatibility_agent_id_retained_until_explicit_rename: "agent_3_target_feature"
  }),
  material_job: Object.freeze({
    job_id: "M7_TARGET_PROFILE",
    public_label: "Target Profile Review",
    execution_mode: "bounded_model_profile_review",
    deterministic_prefilter_required: true,
    model_allowed: true,
    purpose: "Derive the public target identity, jurisdiction notice, business context, and product/service wrapper profile from scoped target-profile lossless evidence reached through Phase 2A Target Profile Source Index, with bounded direct legal signal support only through legal_signal_derivation_profile compatibility rows.",
    reads: Object.freeze([
      "source_discovery_handoff",
      "cartography_index",
      "target_profile_source_index",
      "legal_signal_derivation_profile",
      ...TARGET_PROFILE_LOSSLESS_READS,
      "domain_selection_profile",
      "active_run_package_manifest"
    ]),
    writes: Object.freeze(["target_profile"]),
    forbidden_reads: Object.freeze([
      "legal_cartography_index",
      "legal_doc_inventory",
      "legal_doc_extraction_index",
      "legal_doc_{DOC_TYPE}",
      "lossless_root__about_company",
      "lossless_root__legal_identity_notice",
      "lossless_root__operator_entity_signals",
      "lossless_root__supporting_company_signals",
      "retired_target_family_artifacts",
      "retired_legal_family_artifacts",
      "retired_product_family_artifacts",
      "retired_data_family_artifacts",
      "m7_deterministic_legal_signal_overlay"
    ]),
    scoped_lossless_evidence_reads: TARGET_PROFILE_LOSSLESS_READS,
    target_profile_source_index_policy: Object.freeze({
      active_locator_authority: "target_profile_source_index",
      deterministic_support_artifacts_not_model_reads: Object.freeze(["target_profile_deterministic_map", "target_profile_semantic_profile"]),
      phase_2a_locators_are_navigation_only: true,
      target_profile_review_must_read_scoped_source_artifacts_for_values: true,
      regulatory_grievance_fields_are_factual_public_operating_context_only: true,
      license_validity_requirement_applicability_forbidden: true,
      grievance_sufficiency_ombudsman_requirement_forbidden: true
    }),
    legal_signal_boundary: Object.freeze({
      only_legal_input_allowed: "legal_signal_derivation_profile",
      legal_signal_derivation_profile_status: "COMPATIBILITY_ONLY_UNTIL_FULL_3A_CUTOVER",
      legal_cartography_index_forbidden: true,
      legal_doc_lossless_evidence_forbidden: true,
      tos_derived_signals_must_arrive_through_legal_signal_derivation_profile: true
    }),
    forbidden_outputs: Object.freeze([
      "domain_derivation_profile",
      "active_run_package_manifest",
      "target_profile_forensics",
      "feature_candidate_inventory",
      "target_feature_profile",
      "target_feature_profile_forensics",
      "data_provenance_profile",
      "data_provenance_profile_forensics",
      "exposure_registry_profile",
      "challenge_gate",
      "final_output_handoff",
      "renderer_payload",
      "qualified_review_handoff",
      "qualified_review_renderer_payload",
      "legal_cartography_index",
      "legal_signal_derivation_profile",
      "legal_advice",
      "compliance_conclusion",
      "enforceability_assessment",
      "risk_conclusion"
    ])
  }),
  output_contract: Object.freeze({
    artifact_name: "target_profile",
    required_top_level_branches: Object.freeze([
      "target_identity",
      "jurisdiction_notice",
      "business_context",
      "product_service_wrapper",
      "target_profile_limitations"
    ]),
    branch_fields: Object.freeze({
      target_identity: Object.freeze(["brand_name", "legal_entity_name", "entity_type", "reviewed_website", "primary_domain"]),
      jurisdiction_notice: Object.freeze(["registered_notice_location", "governing_law", "courts_venue"]),
      business_context: Object.freeze(["business_category", "primary_customer_type", "market_type_candidate", "industry_sector", "regulated_sector_hints", "public_regulatory_licensing_signal", "public_grievance_complaints_signal"]),
      product_service_wrapper: Object.freeze(["high_level_offering", "primary_public_claim", "product_service_wrapper_names", "delivery_model_signals"]),
      target_profile_limitations: Object.freeze([])
    }),
    array_fields: Object.freeze([
      "business_context.regulated_sector_hints",
      "product_service_wrapper.product_service_wrapper_names",
      "product_service_wrapper.delivery_model_signals",
      "target_profile_limitations"
    ]),
    controlled_field_values: Object.freeze([
      "FIELD_LIMITED",
      "FIELD_NOT_PUBLIC",
      "FIELD_CONFLICTED",
      "FIELD_NOT_FOUND",
      "NO_PUBLIC_SIGNAL_FOUND"
    ])
  }),
  direct_legal_signal_intake: Object.freeze({
    artifact_name: "legal_signal_derivation_profile",
    legal_signal_profile_is_secondary_bounded_input: true,
    phase_2_legal_cartography_is_navigation_only: true,
    raw_legal_cartography_index_forbidden_as_model_evidence: true,
    raw_legal_governance_family_artifacts_forbidden_as_model_evidence: true,
    direct_signal_is_not_legal_advice: true,
    direct_signal_is_not_legal_sufficiency: true,
    allowed_field_rows: Object.freeze([
      { field_id: "LGC.NOT.010", field_key: "legal_notice_email", allowed_target_branches: Object.freeze(["jurisdiction_notice", "target_profile_limitations"]) },
      { field_id: "LGC.NOT.011", field_key: "legal_notice_contact_route", allowed_target_branches: Object.freeze(["jurisdiction_notice", "target_profile_limitations"]) },
      { field_id: "LGC.NOT.012", field_key: "legal_notice_contact_evidence_basis", allowed_target_branches: Object.freeze(["target_profile_limitations"]) },
      { field_id: "LGC.NOT.013", field_key: "legal_notice_contact_limitation", allowed_target_branches: Object.freeze(["target_profile_limitations"]) },
      { field_id: "TP.JUR.003", field_key: "governing_law_country", allowed_target_branches: Object.freeze(["jurisdiction_notice", "target_profile_limitations"]) },
      { field_id: "TP.JUR.004", field_key: "governing_law_state", allowed_target_branches: Object.freeze(["jurisdiction_notice", "target_profile_limitations"]) },
      { field_id: "TP.JUR.005", field_key: "courts_venue", allowed_target_branches: Object.freeze(["jurisdiction_notice", "target_profile_limitations"]) },
      { field_id: "TP.JUR.007", field_key: "jurisdiction_evidence_basis", allowed_target_branches: Object.freeze(["target_profile_limitations"]) },
      { field_id: "TP.JUR.008", field_key: "jurisdiction_uncertainty", allowed_target_branches: Object.freeze(["target_profile_limitations"]) }
    ]),
    forbidden_field_families: Object.freeze([
      "privacy_grievance_contact_signal_map",
      "consent_manager_signal_map"
    ]),
    status_translation: Object.freeze({
      DERIVED: "use_value_if_target_profile_schema_permits",
      DERIVED_WITH_LIMITATION: "use_value_only_with_target_profile_limitation",
      LOCATOR_FOUND_VALUE_NOT_VISIBLE: "do_not_invent_value_record_controlled_limitation",
      SOURCE_NOT_PUBLIC: "do_not_invent_value_record_controlled_limitation",
      SOURCE_CONFLICT: "do_not_choose_winner_record_conflict_limitation",
      NOT_APPLICABLE_CONTEXTUAL: "controlled_not_applicable_where_schema_permits",
      NOT_DERIVED_AFTER_EXHAUSTIVE_SCAN: "do_not_invent_value_record_controlled_limitation"
    })
  })
});
