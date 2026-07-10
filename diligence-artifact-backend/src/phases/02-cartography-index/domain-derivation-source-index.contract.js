export const P2B_DOMAIN_DERIVATION_SOURCE_INDEX_PHASE_ID = "P2B_DOMAIN_DERIVATION_SOURCE_INDEX";
export const P2B_DOMAIN_DERIVATION_SOURCE_INDEX_PUBLIC_LABEL = "Domain Derivation Source Index";

export const P2B_DOMAIN_DERIVATION_ARTIFACTS = Object.freeze({
  deterministicMap: "domain_derivation_deterministic_map",
  semanticProfile: "domain_derivation_semantic_profile",
  finalIndex: "domain_derivation_source_index"
});

export const P2B_DOMAIN_DERIVATION_CONTROL_INPUTS = Object.freeze([
  "source_discovery_handoff",
  "post_phase_1_domain_gate_handoff",
  "source_discovery_matrix_manifest",
  "neutral_evidence_bucket_manifest",
  "adapter_expansion_log",
  "source_family_index"
]);

export const P2B_DOMAIN_DERIVATION_ROOT_INPUTS = Object.freeze([
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

export const P2B_DOMAIN_DERIVATION_READS = Object.freeze([
  ...P2B_DOMAIN_DERIVATION_CONTROL_INPUTS,
  ...P2B_DOMAIN_DERIVATION_ROOT_INPUTS
]);

export const P2B_DOMAIN_DERIVATION_WRITES = Object.freeze([
  P2B_DOMAIN_DERIVATION_ARTIFACTS.deterministicMap,
  P2B_DOMAIN_DERIVATION_ARTIFACTS.semanticProfile,
  P2B_DOMAIN_DERIVATION_ARTIFACTS.finalIndex
]);

export const P2B_DOMAIN_DERIVATION_SAVE_ORDER = Object.freeze([
  P2B_DOMAIN_DERIVATION_ARTIFACTS.deterministicMap,
  P2B_DOMAIN_DERIVATION_ARTIFACTS.semanticProfile,
  P2B_DOMAIN_DERIVATION_ARTIFACTS.finalIndex
]);

export const P2B_DOMAIN_DERIVATION_ROUTE_FAMILIES = Object.freeze({
  primaryDomain: Object.freeze({
    route_code: "PRIMARY_DOMAIN",
    output_key: "primary_domain_locator_map",
    downstream_owner: "P3_DOMAIN_DERIVATION_LAYER",
    source_roots: Object.freeze([
      "lossless_root__homepage_landing",
      "lossless_root__company_identity",
      "lossless_root__product_service",
      "lossless_root__platform_feature_solution",
      "lossless_root__pricing_commercial_availability",
      "lossless_root__use_case_customer_industry",
      "lossless_root__integrations_ecosystem",
      "lossless_root__technical_docs_api",
      "lossless_root__docs_api_data_flow"
    ]),
    phase_2b_action: "LOCATE_ONLY",
    derived_value_forbidden: true
  }),
  aiOverlay: Object.freeze({
    route_code: "AI_OVERLAY",
    output_key: "ai_overlay_locator_map",
    downstream_owner: "P3_DOMAIN_DERIVATION_LAYER",
    source_roots: Object.freeze([
      "lossless_root__homepage_landing",
      "lossless_root__product_service",
      "lossless_root__platform_feature_solution",
      "lossless_root__technical_docs_api",
      "lossless_root__docs_api_data_flow",
      "lossless_root__integrations_ecosystem",
      "lossless_root__ai_safety_transparency"
    ]),
    phase_2b_action: "LOCATE_ONLY",
    derived_value_forbidden: true
  }),
  regulatoryOverlay: Object.freeze({
    route_code: "REGULATORY_OVERLAY",
    output_key: "regulatory_overlay_locator_map",
    downstream_owner: "P3_DOMAIN_DERIVATION_LAYER",
    source_roots: Object.freeze([
      "lossless_root__company_identity",
      "lossless_root__product_service",
      "lossless_root__platform_feature_solution",
      "lossless_root__pricing_commercial_availability",
      "lossless_root__use_case_customer_industry",
      "lossless_root__regulatory_licensing_status",
      "lossless_root__grievance_complaints"
    ]),
    phase_2b_action: "LOCATE_ONLY",
    derived_value_forbidden: true
  }),
  fusionCandidate: Object.freeze({
    route_code: "FUSION_CANDIDATE",
    output_key: "fusion_candidate_locator_map",
    downstream_owner: "P3_DOMAIN_DERIVATION_LAYER",
    source_roots: Object.freeze([...P2B_DOMAIN_DERIVATION_ROOT_INPUTS]),
    phase_2b_action: "LOCATE_ONLY",
    derived_value_forbidden: true,
    composite_signal_required: true
  })
});

export const P2B_DOMAIN_DERIVATION_ALLOWED_ROUTE_CLASSES = Object.freeze([
  "PRIMARY_DOMAIN_ROUTE",
  "AI_OVERLAY_ROUTE",
  "REGULATORY_OVERLAY_ROUTE",
  "FUSION_CANDIDATE_ROUTE",
  "ACTIVITY_CAPABILITY_ROUTE",
  "COMMERCIAL_AVAILABILITY_ROUTE",
  "TECHNICAL_CAPABILITY_ROUTE",
  "INTEGRATION_ECOSYSTEM_ROUTE",
  "USE_CASE_CUSTOMER_INDUSTRY_ROUTE",
  "SOURCE_LIMITATION_ROUTE"
]);

export const P2B_DOMAIN_DERIVATION_ALLOWED_SIGNAL_FAMILIES = Object.freeze([
  "PRIMARY_DOMAIN_SIGNAL",
  "AI_OVERLAY_SIGNAL",
  "REGULATORY_OVERLAY_SIGNAL",
  "FUSION_CANDIDATE_SIGNAL",
  "ACTIVITY_CAPABILITY_SIGNAL",
  "COMMERCIAL_AVAILABILITY_SIGNAL",
  "TECHNICAL_CAPABILITY_SIGNAL",
  "INTEGRATION_ECOSYSTEM_SIGNAL",
  "USE_CASE_CUSTOMER_INDUSTRY_SIGNAL",
  "SOURCE_LIMITATION"
]);

export const P2B_DOMAIN_DERIVATION_ALLOWED_CONFIDENCE = Object.freeze(["CLEAR", "PARTIAL", "UNCLEAR"]);

export const P2B_DOMAIN_DERIVATION_DETERMINISTIC_MAP_KEYS = Object.freeze([
  "source_artifacts_read",
  "domain_derivation_source_coverage_index",
  "domain_derivation_document_structure_index",
  "primary_domain_locator_map",
  "ai_overlay_locator_map",
  "regulatory_overlay_locator_map",
  "fusion_candidate_locator_map",
  "activity_capability_locator_map",
  "commercial_availability_locator_map",
  "technical_capability_locator_map",
  "integration_ecosystem_locator_map",
  "use_case_customer_industry_locator_map",
  "missing_limited_domain_derivation_source_map",
  "semantic_label_queue",
  "quality_repair_queue",
  "downstream_rules",
  "lock_status"
]);

export const P2B_DOMAIN_DERIVATION_FINAL_INDEX_KEYS = Object.freeze([
  "source_coverage_index",
  "domain_derivation_document_structure_index",
  "primary_domain_locator_map",
  "ai_overlay_locator_map",
  "regulatory_overlay_locator_map",
  "fusion_candidate_locator_map",
  "activity_capability_locator_map",
  "commercial_availability_locator_map",
  "technical_capability_locator_map",
  "integration_ecosystem_locator_map",
  "use_case_customer_industry_locator_map",
  "priority_domain_derivation_locator",
  "semantic_navigation_index",
  "missing_limited_domain_derivation_items",
  "downstream_rules",
  "lock_status"
]);

export const P2B_DOMAIN_DERIVATION_RETIRED_ROOTS_FORBIDDEN = Object.freeze([
  "lossless_root__about_company",
  "lossless_root__legal_identity_notice",
  "lossless_root__operator_entity_signals",
  "lossless_root__supporting_company_signals",
  "lossless_root__security_trust",
  "lossless_root__trust_compliance",
  "lossless_root__support_help",
  "lossless_root__blog_resources",
  "lossless_root__careers_hiring",
  "lossless_root__public_repository_developer_assets",
  "lossless_root__third_party_profiles",
  "lossless_root__technical_docs_api_developer"
]);

export const P2B_DOMAIN_DERIVATION_FORBIDDEN_OUTPUTS = Object.freeze([
  "activity_profile_source_index",
  "feature_candidate_inventory",
  "target_feature_profile",
  "domain_derivation_profile",
  "active_run_package_manifest",
  "target_profile",
  "target_profile_forensics",
  "data_privacy_navigation_index",
  "legal_cartography_index",
  "legal_signal_derivation_profile",
  "exposure_registry_profile",
  "challenge_gate",
  "final_output_handoff",
  "renderer_payload"
]);

export const P2B_DOMAIN_DERIVATION_FORBIDDEN_CONCLUSIONS = Object.freeze([
  "primary_domain_locked",
  "primary_domain_final",
  "domain_package_selected",
  "ai_overlay_mounted",
  "ai_overlay_final",
  "regulatory_overlay_mounted",
  "regulatory_overlay_final",
  "fusion_candidate_locked",
  "license_validity",
  "license_requirement",
  "applicable_regulator",
  "regulatory_compliance_status",
  "grievance_sufficiency",
  "grievance_compliance_status",
  "ombudsman_requirement",
  "statutory_complaint_obligation",
  "legal_advice",
  "compliance_conclusion",
  "risk_conclusion"
]);

export const P2B_DOMAIN_DERIVATION_CONTRACT = Object.freeze({
  phase_id: P2B_DOMAIN_DERIVATION_SOURCE_INDEX_PHASE_ID,
  public_label: P2B_DOMAIN_DERIVATION_SOURCE_INDEX_PUBLIC_LABEL,
  implementation_status: "CONTRACT_ONLY_PHASE1_V5_12_ROOT_DOMAIN_DERIVATION_INDEX",
  execution_mode: "DETERMINISTIC_LED_SEMANTIC_GUIDED_DOMAIN_DERIVATION_NAVIGATION_INDEX",
  downstream_owner: "P3_DOMAIN_DERIVATION_LAYER",
  final_artifact: P2B_DOMAIN_DERIVATION_ARTIFACTS.finalIndex,
  reads: P2B_DOMAIN_DERIVATION_READS,
  writes: P2B_DOMAIN_DERIVATION_WRITES,
  save_order: P2B_DOMAIN_DERIVATION_SAVE_ORDER,
  route_families: P2B_DOMAIN_DERIVATION_ROUTE_FAMILIES,
  final_index_keys: P2B_DOMAIN_DERIVATION_FINAL_INDEX_KEYS,
  doctrine: Object.freeze({
    phase_2b_is_index_only: true,
    domain_derivation_source_index_owned_by_2b: true,
    activity_profile_source_index_reserved_for_2c_phase5: true,
    domain_derivation_layer_derives_values_later: true,
    primary_domain_derivation_forbidden_in_2b: true,
    ai_overlay_derivation_forbidden_in_2b: true,
    regulatory_overlay_derivation_forbidden_in_2b: true,
    fusion_lock_forbidden_in_2b: true,
    source_artifacts_remain_source_of_truth: true,
    full_text_copied: false,
    summaries_allowed: false,
    excerpts_allowed: false,
    legal_or_compliance_conclusions_allowed: false,
    phase1_v5_12_root_source_contract_required: true,
    old_family_input_contract_forbidden: true
  })
});
