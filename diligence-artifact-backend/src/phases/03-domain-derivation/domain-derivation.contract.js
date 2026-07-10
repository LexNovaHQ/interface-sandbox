const DOMAIN_DERIVATION_LOSSLESS_READS = Object.freeze([
  "lossless_root__homepage_landing",
  "lossless_root__company_identity",
  "lossless_root__product_service",
  "lossless_root__platform_feature_solution",
  "lossless_root__technical_docs_api",
  "lossless_root__docs_api_data_flow",
  "lossless_root__pricing_commercial_availability",
  "lossless_root__use_case_customer_industry",
  "lossless_root__integrations_ecosystem",
  "lossless_root__ai_safety_transparency",
  "lossless_root__regulatory_licensing_status",
  "lossless_root__grievance_complaints"
]);

const DOMAIN_DERIVATION_PROMPT_FILES = Object.freeze([
  "agent-packages/00_SYSTEM_BLOCKING_DOCTRINE.md",
  "agent-packages/agent_3_target_feature/00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED.md",
  "agent-packages/agent_3_target_feature/AGENT3_RUNTIME_BINDING_PACKET.yaml",
  "agent-packages/agent_3_target_feature/02B_P3_DOMAIN_DERIVATION_LAYER_BACKEND.md",
  "agent-packages/agent_3_target_feature/00_VALIDATOR_RULES_INTEGRATED.md",
  "agent-packages/agent_3_target_feature/00_TERMINAL_RECEIPT_RULES_INTEGRATED.md"
]);

export const DOMAIN_DERIVATION_CONTRACT = Object.freeze({
  central_phase_id: "TARGET_PROFILE_REVIEW",
  internal_job_id: "P3_DOMAIN_DERIVATION_LAYER",
  public_label: "Domain Derivation Layer",
  implementation_status: "CONTRACT_RUNNER_AND_REGISTRY_LADDER_PROMPT_ACTIVE_PHASE1_V5_P2B_DOMAIN_SOURCE_INDEX_SYNCED",
  execution_mode: "semantic_registry_ladder_derivation_with_deterministic_gate",
  agent_id: "agent_3_target_feature",
  actor_id: "agent_3_target_feature",
  agent_package_binding: Object.freeze({
    agent_package_root: "agent-packages/agent_3_target_feature",
    prompt_package_status: "ACTIVE_REGISTRY_LADDER_PROMPT",
    prompt_files: DOMAIN_DERIVATION_PROMPT_FILES,
    expected_prompt_files: Object.freeze([
      "agent-packages/agent_3_target_feature/02B_P3_DOMAIN_DERIVATION_LAYER_BACKEND.md"
    ]),
    prompt_non_updatability_rule: "New domains, overlays, fusion candidates, and regulatory overlays must be added through DOMAIN_DERIVATION_REGISTRY_v0.yaml and package-catalog.v0.json, not by editing the prompt."
  }),
  reads: Object.freeze([
    "source_discovery_handoff",
    "cartography_index",
    "target_profile_source_index",
    "domain_derivation_source_index",
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
    "activity_profile_source_index",
    "legal_cartography_index",
    "legal_signal_derivation_profile",
    "legal_doc_inventory",
    "legal_doc_extraction_index",
    "legal_doc_{DOC_TYPE}",
    "data_privacy_navigation_index",
    "privacy_data_processing",
    "security_trust",
    "trust_compliance",
    "lossless_root__about_company",
    "lossless_root__technical_docs_api_developer",
    "lossless_root__privacy_data_processing",
    "lossless_root__security_trust",
    "lossless_root__trust_compliance",
    "lossless_root__security_trust_compliance",
    "lossless_root__data_governance_controls"
  ]),
  boundary_rules: Object.freeze({
    semantic_first_deterministic_gated: true,
    registry_driven_derivation: true,
    registry_ladder_prompt_active: true,
    hardcoded_domain_logic_forbidden: true,
    new_domains_added_by_registry_not_prompt: true,
    domain_derivation_source_index_required: true,
    activity_profile_source_index_forbidden_until_2c_phase5: true,
    legal_cartography_index_forbidden: true,
    legal_signal_derivation_profile_forbidden: true,
    legal_lossless_evidence_forbidden: true,
    target_profile_is_context_not_proof: true,
    phase2_indexes_navigation_only: true,
    company_level_lane_forbidden: true
  }),
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
    model_response_top_level_key: "domain_derivation_profile",
    compiler_emits_active_run_package_manifest: true,
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
      "LOCKED_FOR_PACKAGE_MOUNT_ONLY",
      "REVIEW_REQUIRED",
      "NOT_VISIBLE",
      "CANDIDATE_ONLY"
    ])
  }),
  registry_ladder_contract: Object.freeze({
    registry_driven: true,
    prompt_hardcoded_domain_logic_forbidden: true,
    package_catalog_is_mount_source: true,
    domain_derivation_registry_is_rule_ladder: true,
    prompt_must_not_be_updated_for_new_domain_additions: true
  })
});
