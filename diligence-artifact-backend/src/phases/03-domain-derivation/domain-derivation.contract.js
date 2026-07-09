const DOMAIN_DERIVATION_LOSSLESS_READS = Object.freeze([
  "lossless_root__homepage_landing",
  "lossless_root__about_company",
  "lossless_root__product_service",
  "lossless_root__platform_feature_solution",
  "lossless_root__technical_docs_api_developer",
  "lossless_root__docs_api_data_flow",
  "lossless_root__pricing_commercial_availability",
  "lossless_root__use_case_customer_industry",
  "lossless_root__integrations_ecosystem"
]);

export const DOMAIN_DERIVATION_CONTRACT = Object.freeze({
  central_phase_id: "TARGET_PROFILE_REVIEW",
  internal_job_id: "P3_DOMAIN_DERIVATION_LAYER",
  public_label: "Domain Derivation Layer",
  implementation_status: "CONTRACT_LOCKED_RUNNER_ADDED_PROMPT_PACKAGE_PENDING",
  execution_mode: "semantic_registry_derivation_with_deterministic_gate",
  agent_id: "agent_3_target_feature",
  actor_id: "agent_3_target_feature",
  agent_package_binding: Object.freeze({
    agent_package_root: "agent-packages/agent_3_target_feature",
    prompt_package_status: "PENDING_FINAL_PROMPT_AUTHORING",
    expected_prompt_files: Object.freeze([
      "agent-packages/agent_3_target_feature/04_P3_DOMAIN_DERIVATION_LAYER.md",
      "agent-packages/agent_3_target_feature/04A_P3_DOMAIN_DERIVATION_OUTPUT_CONTRACT.md",
      "agent-packages/agent_3_target_feature/04B_P3_DOMAIN_DERIVATION_VALIDATOR_RULES.md"
    ])
  }),
  reads: Object.freeze([
    "source_discovery_handoff",
    "cartography_index",
    "target_profile_source_index",
    "activity_profile_source_index",
    "target_profile",
    ...DOMAIN_DERIVATION_LOSSLESS_READS,
    "domain_selection_profile",
    "active_run_package_manifest"
  ]),
  scoped_lossless_evidence_reads: DOMAIN_DERIVATION_LOSSLESS_READS,
  writes: Object.freeze([
    "domain_derivation_profile",
    "active_run_package_manifest"
  ]),
  references: Object.freeze([
    "references/domain-packages/DOMAIN_PACKAGE_KEY_v0.md",
    "references/domain-packages/package-catalog.v0.json",
    "references/domain-packages/DOMAIN_DERIVATION_REGISTRY_v0.yaml"
  ]),
  forbidden_reads: Object.freeze([
    "legal_cartography_index",
    "legal_signal_derivation_profile",
    "legal_doc_inventory",
    "legal_doc_extraction_index",
    "legal_doc_{DOC_TYPE}",
    "data_privacy_navigation_index",
    "privacy_data_processing",
    "security_trust",
    "trust_compliance",
    "lossless_root__privacy_data_processing",
    "lossless_root__security_trust",
    "lossless_root__trust_compliance"
  ]),
  forbidden_outputs: Object.freeze([
    "target_profile",
    "target_profile_forensics",
    "feature_candidate_inventory",
    "target_feature_profile",
    "target_feature_profile_forensics",
    "data_provenance_profile",
    "data_provenance_profile_forensics",
    "exposure_registry_profile",
    "exposure_registry_triggered_profile",
    "challenge_gate",
    "final_output_handoff",
    "renderer_payload",
    "qualified_review_handoff",
    "qualified_review_renderer_payload",
    "legal_advice",
    "compliance_conclusion",
    "enforceability_assessment",
    "risk_conclusion",
    "lane",
    "business_context.lane"
  ]),
  output_contract: Object.freeze({
    artifact_name: "domain_derivation_profile",
    required_top_level_branches: Object.freeze([
      "domain_derivation_metadata",
      "input_scope",
      "source_evidence_ledger",
      "primary_domain_derivation",
      "ai_mount_derivation",
      "fusion_candidate_derivation",
      "manifest_update",
      "limitation_ledger",
      "contradiction_ledger",
      "validation_summary"
    ]),
    controlled_status_values: Object.freeze([
      "LOCKED",
      "LOCKED_WITH_LIMITATIONS",
      "REVIEW_REQUIRED",
      "NOT_VISIBLE",
      "CANDIDATE_ONLY"
    ])
  }),
  manifest_update_contract: Object.freeze({
    artifact_name: "active_run_package_manifest",
    selection_stage_after_3b: "PHASE_3B_DOMAIN_DERIVATION",
    runtime_flags_must_remain_false: true,
    dynamic_routing_enabled: false,
    field_registry_compile_enabled: false,
    qr_matrix_routing_enabled: false,
    report_template_routing_enabled: false,
    assembly_routing_enabled: false
  }),
  boundary_rules: Object.freeze({
    semantic_first_deterministic_gated: true,
    model_derives_condition_level_semantics: true,
    deterministic_validator_is_gate_not_brain: true,
    registry_driven_derivation: true,
    hardcoded_domain_logic_forbidden: true,
    phase_2_indexes_are_navigation_only: true,
    scoped_lossless_target_activity_evidence_required: true,
    target_profile_is_context_not_proof: true,
    legal_cartography_index_forbidden: true,
    legal_signal_derivation_profile_forbidden: true,
    legal_lossless_evidence_forbidden: true,
    data_privacy_navigation_index_forbidden: true,
    company_level_lane_forbidden: true,
    ai_archetype_lock_forbidden: true,
    ai_surface_lock_forbidden: true,
    exposure_row_matching_forbidden: true,
    no_activity_profile_derivation: true,
    no_data_profile_derivation: true,
    no_exposure_profile_derivation: true,
    no_legal_advice: true,
    no_compliance_conclusion: true,
    no_enforceability_conclusion: true,
    no_risk_conclusion: true
  })
});

export function domainDerivationReadArtifacts() {
  return [...DOMAIN_DERIVATION_CONTRACT.reads];
}

export function domainDerivationLosslessReadArtifacts() {
  return [...DOMAIN_DERIVATION_CONTRACT.scoped_lossless_evidence_reads];
}
