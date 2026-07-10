export const P2C_ACTIVITY_PROFILE_SOURCE_INDEX_PHASE_ID = "P2C_ACTIVITY_PROFILE_SOURCE_INDEX";
export const P2C_ACTIVITY_PROFILE_SOURCE_INDEX_PUBLIC_LABEL = "Activity Profile Source Index";

export const P2C_ACTIVITY_PROFILE_ARTIFACTS = Object.freeze({
  deterministicMap: "activity_profile_deterministic_map",
  semanticProfile: "activity_profile_semantic_profile",
  finalIndex: "activity_profile_source_index"
});

export const P2C_ACTIVITY_PROFILE_CONTROL_INPUTS = Object.freeze([
  "source_discovery_handoff",
  "post_phase_1_domain_gate_handoff",
  "source_discovery_matrix_manifest",
  "neutral_evidence_bucket_manifest",
  "adapter_expansion_log",
  "source_family_index"
]);

export const P2C_ACTIVITY_PROFILE_ROOT_INPUTS = Object.freeze([
  "lossless_root__product_service",
  "lossless_root__platform_feature_solution",
  "lossless_root__technical_docs_api",
  "lossless_root__docs_api_data_flow",
  "lossless_root__integrations_ecosystem",
  "lossless_root__pricing_commercial_availability",
  "lossless_root__use_case_customer_industry",
  "lossless_root__support_help_resources",
  "lossless_root__ai_safety_transparency"
]);

export const P2C_ACTIVITY_PROFILE_CANDIDATE_CREATION_ROOTS = Object.freeze([
  "lossless_root__product_service",
  "lossless_root__platform_feature_solution",
  "lossless_root__technical_docs_api",
  "lossless_root__docs_api_data_flow",
  "lossless_root__integrations_ecosystem",
  "lossless_root__pricing_commercial_availability"
]);

export const P2C_ACTIVITY_PROFILE_CONTEXT_ONLY_ROOTS = Object.freeze([
  "lossless_root__use_case_customer_industry",
  "lossless_root__support_help_resources",
  "lossless_root__ai_safety_transparency"
]);

export const P2C_ACTIVITY_PROFILE_READS = Object.freeze([
  ...P2C_ACTIVITY_PROFILE_CONTROL_INPUTS,
  ...P2C_ACTIVITY_PROFILE_ROOT_INPUTS
]);

export const P2C_ACTIVITY_PROFILE_WRITES = Object.freeze([
  P2C_ACTIVITY_PROFILE_ARTIFACTS.deterministicMap,
  P2C_ACTIVITY_PROFILE_ARTIFACTS.semanticProfile,
  P2C_ACTIVITY_PROFILE_ARTIFACTS.finalIndex
]);

export const P2C_ACTIVITY_PROFILE_SAVE_ORDER = Object.freeze([
  P2C_ACTIVITY_PROFILE_ARTIFACTS.deterministicMap,
  P2C_ACTIVITY_PROFILE_ARTIFACTS.semanticProfile,
  P2C_ACTIVITY_PROFILE_ARTIFACTS.finalIndex
]);

export const P2C_ACTIVITY_PROFILE_ROUTE_FAMILIES = Object.freeze({
  activityCandidateSource: Object.freeze({
    route_code: "ACTIVITY_CANDIDATE_SOURCE",
    output_key: "activity_candidate_source_locator_map",
    downstream_owner: "ACTIVITY_PROFILE_REVIEW",
    source_roots: P2C_ACTIVITY_PROFILE_CANDIDATE_CREATION_ROOTS,
    phase_2c_action: "LOCATE_ONLY",
    derived_value_forbidden: true,
    package_specific_classification_forbidden: true
  }),
  productCapability: Object.freeze({
    route_code: "PRODUCT_CAPABILITY",
    output_key: "product_capability_locator_map",
    downstream_owner: "ACTIVITY_PROFILE_REVIEW",
    source_roots: Object.freeze(["lossless_root__product_service", "lossless_root__platform_feature_solution", "lossless_root__pricing_commercial_availability"]),
    phase_2c_action: "LOCATE_ONLY",
    derived_value_forbidden: true,
    package_specific_classification_forbidden: true
  }),
  featureMechanics: Object.freeze({
    route_code: "FEATURE_MECHANICS",
    output_key: "feature_mechanics_locator_map",
    downstream_owner: "ACTIVITY_PROFILE_REVIEW",
    source_roots: Object.freeze(["lossless_root__platform_feature_solution", "lossless_root__product_service", "lossless_root__technical_docs_api", "lossless_root__docs_api_data_flow", "lossless_root__support_help_resources"]),
    phase_2c_action: "LOCATE_ONLY",
    derived_value_forbidden: true,
    package_specific_classification_forbidden: true
  }),
  technicalMechanics: Object.freeze({
    route_code: "TECHNICAL_MECHANICS",
    output_key: "technical_mechanics_locator_map",
    downstream_owner: "ACTIVITY_PROFILE_REVIEW",
    source_roots: Object.freeze(["lossless_root__technical_docs_api", "lossless_root__docs_api_data_flow", "lossless_root__platform_feature_solution", "lossless_root__integrations_ecosystem"]),
    phase_2c_action: "LOCATE_ONLY",
    derived_value_forbidden: true,
    package_specific_classification_forbidden: true
  }),
  apiInteraction: Object.freeze({
    route_code: "API_INTERACTION",
    output_key: "api_interaction_locator_map",
    downstream_owner: "ACTIVITY_PROFILE_REVIEW",
    source_roots: Object.freeze(["lossless_root__technical_docs_api", "lossless_root__docs_api_data_flow", "lossless_root__integrations_ecosystem"]),
    phase_2c_action: "LOCATE_ONLY",
    derived_value_forbidden: true,
    package_specific_classification_forbidden: true
  }),
  dataObjectInteraction: Object.freeze({
    route_code: "DATA_OBJECT_INTERACTION",
    output_key: "data_object_interaction_locator_map",
    downstream_owner: "ACTIVITY_PROFILE_REVIEW",
    source_roots: Object.freeze(["lossless_root__docs_api_data_flow", "lossless_root__technical_docs_api", "lossless_root__platform_feature_solution", "lossless_root__product_service"]),
    phase_2c_action: "LOCATE_ONLY",
    derived_value_forbidden: true,
    package_specific_classification_forbidden: true
  }),
  integrationAction: Object.freeze({
    route_code: "INTEGRATION_ACTION",
    output_key: "integration_action_locator_map",
    downstream_owner: "ACTIVITY_PROFILE_REVIEW",
    source_roots: Object.freeze(["lossless_root__integrations_ecosystem", "lossless_root__technical_docs_api", "lossless_root__docs_api_data_flow", "lossless_root__platform_feature_solution"]),
    phase_2c_action: "LOCATE_ONLY",
    derived_value_forbidden: true,
    package_specific_classification_forbidden: true
  }),
  commercialAvailability: Object.freeze({
    route_code: "COMMERCIAL_AVAILABILITY",
    output_key: "commercial_availability_locator_map",
    downstream_owner: "ACTIVITY_PROFILE_REVIEW",
    source_roots: Object.freeze(["lossless_root__pricing_commercial_availability", "lossless_root__product_service", "lossless_root__platform_feature_solution"]),
    phase_2c_action: "LOCATE_ONLY",
    derived_value_forbidden: true,
    package_specific_classification_forbidden: true
  }),
  customerUseContext: Object.freeze({
    route_code: "CUSTOMER_USE_CONTEXT",
    output_key: "customer_use_context_locator_map",
    downstream_owner: "ACTIVITY_PROFILE_REVIEW",
    source_roots: Object.freeze(["lossless_root__use_case_customer_industry", "lossless_root__product_service", "lossless_root__pricing_commercial_availability"]),
    phase_2c_action: "LOCATE_ONLY",
    derived_value_forbidden: true,
    package_specific_classification_forbidden: true,
    candidate_creation_forbidden: true
  }),
  supportOperationalContext: Object.freeze({
    route_code: "SUPPORT_OPERATIONAL_CONTEXT",
    output_key: "support_operational_context_locator_map",
    downstream_owner: "ACTIVITY_PROFILE_REVIEW",
    source_roots: Object.freeze(["lossless_root__support_help_resources", "lossless_root__product_service", "lossless_root__platform_feature_solution"]),
    phase_2c_action: "LOCATE_ONLY",
    derived_value_forbidden: true,
    package_specific_classification_forbidden: true,
    candidate_creation_forbidden: true
  }),
  automationTransparencyContext: Object.freeze({
    route_code: "AUTOMATION_TRANSPARENCY_CONTEXT",
    output_key: "automation_transparency_context_locator_map",
    downstream_owner: "ACTIVITY_PROFILE_REVIEW",
    source_roots: Object.freeze(["lossless_root__ai_safety_transparency", "lossless_root__product_service", "lossless_root__platform_feature_solution", "lossless_root__technical_docs_api", "lossless_root__docs_api_data_flow"]),
    phase_2c_action: "LOCATE_ONLY",
    derived_value_forbidden: true,
    package_specific_classification_forbidden: true,
    candidate_creation_forbidden: true,
    ai_specific_classification_forbidden: true
  }),
  humanControlContext: Object.freeze({
    route_code: "HUMAN_CONTROL_CONTEXT",
    output_key: "human_control_context_locator_map",
    downstream_owner: "ACTIVITY_PROFILE_REVIEW",
    source_roots: Object.freeze(["lossless_root__ai_safety_transparency", "lossless_root__support_help_resources", "lossless_root__technical_docs_api", "lossless_root__platform_feature_solution"]),
    phase_2c_action: "LOCATE_ONLY",
    derived_value_forbidden: true,
    package_specific_classification_forbidden: true,
    candidate_creation_forbidden: true
  }),
  externalActionContext: Object.freeze({
    route_code: "EXTERNAL_ACTION_CONTEXT",
    output_key: "external_action_context_locator_map",
    downstream_owner: "ACTIVITY_PROFILE_REVIEW",
    source_roots: Object.freeze(["lossless_root__integrations_ecosystem", "lossless_root__technical_docs_api", "lossless_root__docs_api_data_flow", "lossless_root__product_service", "lossless_root__support_help_resources"]),
    phase_2c_action: "LOCATE_ONLY",
    derived_value_forbidden: true,
    package_specific_classification_forbidden: true
  }),
  inputOutputObjectContext: Object.freeze({
    route_code: "INPUT_OUTPUT_OBJECT_CONTEXT",
    output_key: "input_output_object_context_locator_map",
    downstream_owner: "ACTIVITY_PROFILE_REVIEW",
    source_roots: Object.freeze(["lossless_root__docs_api_data_flow", "lossless_root__technical_docs_api", "lossless_root__platform_feature_solution", "lossless_root__product_service", "lossless_root__support_help_resources"]),
    phase_2c_action: "LOCATE_ONLY",
    derived_value_forbidden: true,
    package_specific_classification_forbidden: true
  })
});

export const P2C_ACTIVITY_PROFILE_ALLOWED_ROUTE_CLASSES = Object.freeze([
  "ACTIVITY_CANDIDATE_SOURCE_ROUTE",
  "PRODUCT_CAPABILITY_ROUTE",
  "FEATURE_MECHANICS_ROUTE",
  "TECHNICAL_MECHANICS_ROUTE",
  "API_INTERACTION_ROUTE",
  "DATA_OBJECT_INTERACTION_ROUTE",
  "INTEGRATION_ACTION_ROUTE",
  "COMMERCIAL_AVAILABILITY_ROUTE",
  "CUSTOMER_USE_CONTEXT_ROUTE",
  "SUPPORT_OPERATIONAL_CONTEXT_ROUTE",
  "AUTOMATION_TRANSPARENCY_CONTEXT_ROUTE",
  "HUMAN_CONTROL_CONTEXT_ROUTE",
  "EXTERNAL_ACTION_CONTEXT_ROUTE",
  "INPUT_OUTPUT_OBJECT_CONTEXT_ROUTE",
  "SOURCE_LIMITATION_ROUTE"
]);

export const P2C_ACTIVITY_PROFILE_ALLOWED_SIGNAL_FAMILIES = Object.freeze([
  "ACTIVITY_CANDIDATE_SOURCE_SIGNAL",
  "PRODUCT_CAPABILITY_SIGNAL",
  "FEATURE_MECHANICS_SIGNAL",
  "TECHNICAL_MECHANICS_SIGNAL",
  "API_INTERACTION_SIGNAL",
  "DATA_OBJECT_INTERACTION_SIGNAL",
  "INTEGRATION_ACTION_SIGNAL",
  "COMMERCIAL_AVAILABILITY_SIGNAL",
  "CUSTOMER_USE_CONTEXT_SIGNAL",
  "SUPPORT_OPERATIONAL_CONTEXT_SIGNAL",
  "AUTOMATION_TRANSPARENCY_CONTEXT_SIGNAL",
  "HUMAN_CONTROL_CONTEXT_SIGNAL",
  "EXTERNAL_ACTION_CONTEXT_SIGNAL",
  "INPUT_OUTPUT_OBJECT_CONTEXT_SIGNAL",
  "SOURCE_LIMITATION"
]);

export const P2C_ACTIVITY_PROFILE_ALLOWED_CONFIDENCE = Object.freeze(["CLEAR", "PARTIAL", "UNCLEAR"]);

export const P2C_ACTIVITY_PROFILE_DETERMINISTIC_MAP_KEYS = Object.freeze([
  "source_artifacts_read",
  "activity_profile_source_coverage_index",
  "activity_profile_document_structure_index",
  "activity_candidate_source_locator_map",
  "product_capability_locator_map",
  "feature_mechanics_locator_map",
  "technical_mechanics_locator_map",
  "api_interaction_locator_map",
  "data_object_interaction_locator_map",
  "integration_action_locator_map",
  "commercial_availability_locator_map",
  "customer_use_context_locator_map",
  "support_operational_context_locator_map",
  "automation_transparency_context_locator_map",
  "human_control_context_locator_map",
  "external_action_context_locator_map",
  "input_output_object_context_locator_map",
  "missing_limited_activity_profile_source_map",
  "semantic_label_queue",
  "quality_repair_queue",
  "downstream_rules",
  "lock_status"
]);

export const P2C_ACTIVITY_PROFILE_FINAL_INDEX_KEYS = Object.freeze([
  "source_coverage_index",
  "activity_profile_document_structure_index",
  "activity_candidate_source_locator_map",
  "product_capability_locator_map",
  "feature_mechanics_locator_map",
  "technical_mechanics_locator_map",
  "api_interaction_locator_map",
  "data_object_interaction_locator_map",
  "integration_action_locator_map",
  "commercial_availability_locator_map",
  "customer_use_context_locator_map",
  "support_operational_context_locator_map",
  "automation_transparency_context_locator_map",
  "human_control_context_locator_map",
  "external_action_context_locator_map",
  "input_output_object_context_locator_map",
  "priority_activity_profile_locator",
  "semantic_navigation_index",
  "missing_limited_activity_profile_items",
  "downstream_rules",
  "lock_status"
]);

export const P2C_ACTIVITY_PROFILE_RETIRED_ROOTS_FORBIDDEN = Object.freeze([
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
  "lossless_root__technical_docs_api_developer",
  "lossless_family__P1_PRODUCT",
  "lossless_family__P2_PLATFORM_FEATURE_SOLUTION",
  "lossless_family__P3_AI_CAPABILITY_TECHNICAL",
  "lossless_family__P4_USE_CASE_INDUSTRY",
  "lossless_family__P5_ENTERPRISE_PRICING"
]);

export const P2C_ACTIVITY_PROFILE_FORBIDDEN_OUTPUTS = Object.freeze([
  "feature_candidate_inventory",
  "target_feature_profile",
  "target_feature_profile_forensics",
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

export const P2C_ACTIVITY_PROFILE_FORBIDDEN_CLASSIFICATION_KEYS = Object.freeze([
  "archetype_codes",
  "surface_context_tokens",
  "archetype_derivation_basis",
  "surface_derivation_basis",
  "activity_archetype",
  "activity_surface",
  "domain_activity_taxonomy",
  "package_activity_classification",
  "package_specific_field_family",
  "selected_package",
  "primary_domain_package",
  "domain_package_selected",
  "AI_REGISTRY_KEY",
  "FIELD_DERIVATION_REGISTRY",
  "CLASSIFICATION_DERIVATION_MATRIX"
]);

export const P2C_ACTIVITY_PROFILE_FORBIDDEN_CONCLUSIONS = Object.freeze([
  "mechanics_proof",
  "activity_candidate_summary",
  "activity_profile_answer",
  "profile_activity_final",
  "archetype_locked",
  "surface_locked",
  "package_classification_locked",
  "legal_advice",
  "compliance_conclusion",
  "risk_conclusion",
  "exposure_match",
  "data_provenance_conclusion"
]);

export const P2C_ACTIVITY_PROFILE_CONTRACT = Object.freeze({
  phase_id: P2C_ACTIVITY_PROFILE_SOURCE_INDEX_PHASE_ID,
  public_label: P2C_ACTIVITY_PROFILE_SOURCE_INDEX_PUBLIC_LABEL,
  implementation_status: "CONTRACT_ONLY_PHASE1_V5_DOMAIN_AGNOSTIC_ACTIVITY_INDEX",
  execution_mode: "DETERMINISTIC_LED_SEMANTIC_GUIDED_DOMAIN_AGNOSTIC_ACTIVITY_NAVIGATION_INDEX",
  downstream_owner: "ACTIVITY_PROFILE_REVIEW",
  final_artifact: P2C_ACTIVITY_PROFILE_ARTIFACTS.finalIndex,
  reads: P2C_ACTIVITY_PROFILE_READS,
  writes: P2C_ACTIVITY_PROFILE_WRITES,
  save_order: P2C_ACTIVITY_PROFILE_SAVE_ORDER,
  route_families: P2C_ACTIVITY_PROFILE_ROUTE_FAMILIES,
  candidate_creation_roots: P2C_ACTIVITY_PROFILE_CANDIDATE_CREATION_ROOTS,
  context_only_roots: P2C_ACTIVITY_PROFILE_CONTEXT_ONLY_ROOTS,
  final_index_keys: P2C_ACTIVITY_PROFILE_FINAL_INDEX_KEYS,
  doctrine: Object.freeze({
    phase_2c_is_index_only: true,
    activity_profile_source_index_owned_by_2c: true,
    phase_5_activity_profile_review_derives_values_later: true,
    domain_package_specific_activity_taxonomy_deferred_to_phase5: true,
    mounted_domain_package_controls_archetypes_surfaces_and_activity_fields: true,
    package_specific_classification_forbidden_in_2c: true,
    archetype_derivation_forbidden_in_2c: true,
    surface_derivation_forbidden_in_2c: true,
    mechanics_proof_forbidden_in_2c: true,
    feature_candidate_inventory_forbidden_in_2c: true,
    candidate_creation_context_roots_may_not_create_standalone_candidates: true,
    source_artifacts_remain_source_of_truth: true,
    full_text_copied: false,
    summaries_allowed: false,
    excerpts_allowed: false,
    legal_or_compliance_conclusions_allowed: false,
    phase1_v5_domain_agnostic_source_contract_required: true,
    old_family_input_contract_forbidden: true
  })
});
