const ACTIVITY_PROFILE_LOSSLESS_READS = Object.freeze([
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

const ACTIVITY_PROFILE_REVIEW_READS = Object.freeze([
  "phase_routing_manifest",
  "phase_route_runtime_packet",
  "activity_profile_source_index",
  "target_profile",
  "feature_candidate_inventory",
  "domain_derivation_profile",
  "active_run_package_manifest",
  "domain_selection_profile",
  ...ACTIVITY_PROFILE_LOSSLESS_READS
]);

const ACTIVITY_PROFILE_REVIEW_WRITES = Object.freeze(["target_feature_profile"]);

const ACTIVITY_PROFILE_REVIEW_PROMPT_FILES = Object.freeze([
  "agent-packages/00_SYSTEM_BLOCKING_DOCTRINE.md",
  "agent-packages/agent_3_target_feature/00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED.md",
  "agent-packages/agent_3_target_feature/AGENT3_RUNTIME_BINDING_PACKET.yaml",
  "agent-packages/agent_3_target_feature/03_M8_FEATURE_PROFILE_BACKEND_CURRENT.md",
  "agent-packages/agent_3_target_feature/03A_M8_FEATURE_CANDIDATE_INVENTORY_DETERMINISTIC.md",
  "agent-packages/agent_3_target_feature/03B_M8_ACTIVITY_PROFILE_PACKAGE_AWARE_SYNC.md",
  "agent-packages/agent_3_target_feature/00_VALIDATOR_RULES_INTEGRATED.md",
  "agent-packages/agent_3_target_feature/00_VALIDATOR_RULES_M8_FEATURE_INVENTORY_INDEX_ADDENDUM.md",
  "agent-packages/agent_3_target_feature/AGENT3_BACKEND_OUTPUT_CONTRACT.md",
  "agent-packages/agent_3_target_feature/AGENT3_FEATURE_CANDIDATE_INVENTORY_OUTPUT_CONTRACT.md",
  "agent-packages/agent_3_target_feature/00_TERMINAL_RECEIPT_RULES_INTEGRATED.md"
]);

const ACTIVITY_PROFILE_REVIEW_REFERENCES = Object.freeze([
  "references/domain-packages/DOMAIN_PACKAGE_KEY_v0.md",
  "references/domain-packages/package-catalog.v0.json",
  "references/registry/Diligence_Field_Derivation_Registry.yml",
  "references/registry/AI_Registry_Key.yml",
  "references/registry/FinTech_Registry_Key.yml",
  "FORENSIC_ANNEXURE_REGISTRY_v1_LOCKED.yaml"
]);

const ACTIVITY_ROW_FIELDS = Object.freeze([
  "activity_reference",
  "product_service_wrapper",
  "activity_feature_name",
  "activity_candidate_summary",
  "mechanics_proof",
  "autonomy_human_control_signal",
  "data_content_object_touched",
  "external_internal_action_signal",
  "archetype_codes",
  "archetype_derivation_basis",
  "surface_context_tokens",
  "surface_derivation_basis"
]);

const DERIVATION_BASIS_FIELDS = Object.freeze([
  "code_or_token",
  "normalized_name",
  "conditions_satisfied",
  "trigger_if_applied",
  "exclude_if_checked",
  "material_basis",
  "limitation"
]);

const COMMERCIAL_AVAILABILITY_FIELDS = Object.freeze([
  "posture",
  "free_trial_freemium_signal",
  "beta_pilot_early_access_signal",
  "paid_production_enterprise_plan_signal",
  "evidence_basis",
  "limitation"
]);

export const ACTIVITY_PROFILE_REVIEW_CONTRACT = Object.freeze({
  contract_name: "ACTIVITY_PROFILE_REVIEW_CONTRACT_v6_PHASE2G_ROUTED",
  central_phase_id: "ACTIVITY_PROFILE_REVIEW",
  central_phase_label: "Activity Profile Review",
  phase_job_id: "ACTIVITY_PROFILE_REVIEW_MATERIAL",
  public_label: "Activity Profile Review",
  compatibility_internal_job_id: "M8_TARGET_FEATURE_PROFILE",
  implementation_status: "PHASE5_MATERIAL_PROFILE_PHASE2G_ROUTE_SCOPED_RUNTIME_CUTOVER_COMPLETE",
  production_entrypoint_switched: true,
  global_production_deployment_switched: false,
  model_usage: "MODEL_JSON_ONLY",
  route_contract: Object.freeze({
    routing_authority: "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY",
    route_id: "ROUTE.PHASE5.ACTIVITY_PROFILE",
    bucket_id: "2C_BUCKET_ACTIVITY_PROFILE",
    runtime_reader: "phase-route-runtime.reader",
    job_scoped_derived_profile: "feature_candidate_inventory",
    direct_contract_read_loading_forbidden: true,
    profile_forensics_inputs_forbidden: true
  }),
  material_job: Object.freeze({
    reads: ACTIVITY_PROFILE_REVIEW_READS,
    writes: ACTIVITY_PROFILE_REVIEW_WRITES,
    prompt_files: ACTIVITY_PROFILE_REVIEW_PROMPT_FILES,
    references: ACTIVITY_PROFILE_REVIEW_REFERENCES,
    validator: "validateM8TargetFeatureOutput",
    validator_module: "src/m8-validator.js",
    validator_phase: "M8_TARGET_FEATURE_PROFILE"
  }),
  scoped_lossless_evidence_reads: ACTIVITY_PROFILE_LOSSLESS_READS,
  source_authority: Object.freeze({
    routing_authority: "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY",
    source_index_artifact: "activity_profile_source_index",
    candidate_universe_artifact: "feature_candidate_inventory",
    candidate_universe_path: "feature_candidate_inventory.candidates[]",
    candidate_inventory_is_navigation_only: true,
    active_run_package_manifest_required: true,
    active_package_manifest_is_taxonomy_selector: true,
    domain_package_key_reference: "references/domain-packages/DOMAIN_PACKAGE_KEY_v0.md",
    package_catalog_reference: "references/domain-packages/package-catalog.v0.json",
    hardcoded_ai_registry_key_for_activity_taxonomy_forbidden: true,
    fixed_archetype_enum_forbidden: true,
    fixed_surface_token_enum_forbidden: true,
    p2c_activity_profile_source_index_is_navigation_only: true,
    p1_lossless_family_reads_forbidden: true,
    external_browsing_allowed: false,
    general_market_knowledge_allowed: false
  }),
  output_contract: Object.freeze({
    required_top_level_artifact: "target_feature_profile",
    required_profile_keys: Object.freeze(["activities", "commercial_availability_posture", "profile_level_limitations"]),
    activity_row_fields: ACTIVITY_ROW_FIELDS,
    derivation_basis_fields: DERIVATION_BASIS_FIELDS,
    old_activity_proof_fields_forbidden: Object.freeze(["archetype_proof", "surface_proof_and_routing_limits"]),
    commercial_availability_fields: COMMERCIAL_AVAILABILITY_FIELDS,
    archetype_codes_source: "mounted_domain_package_or_active_run_package_manifest",
    surface_context_tokens_source: "mounted_domain_package_or_active_run_package_manifest",
    fixed_archetype_codes_forbidden: true,
    fixed_surface_context_tokens_forbidden: true,
    package_specific_labels_allowed_only_when_supported_by_active_manifest: true,
    activities_must_be_array: true,
    profile_level_limitations_must_be_array: true,
    commercial_availability_posture_must_be_object: true,
    commercial_availability_evidence_basis_must_be_business_readable_array: true,
    archetype_codes_required_non_empty: true,
    multiple_archetypes_per_activity_allowed: true,
    archetype_derivation_basis_must_be_array: true,
    archetype_derivation_basis_must_match_selected_codes_one_to_one: true,
    no_unselected_archetype_basis_entries: true,
    surface_context_tokens_required_array_may_be_empty: true,
    surface_derivation_basis_must_be_array: true,
    surface_derivation_basis_must_match_selected_tokens_one_to_one: true,
    no_unselected_surface_basis_entries: true,
    activity_reference_sequence: "ACT.001_PLUS_SEQUENTIAL",
    material_output_only: true,
    forensic_output_forbidden: true
  }),
  candidate_treatment_rules: Object.freeze({
    every_inventory_candidate_must_be_considered: true,
    candidate_requiring_treatment_must_be_visible_activity_or_profile_limitation: true,
    candidate_taxonomy_label_must_come_from_active_package_context: true,
    standalone_api_model_integration_candidates_must_not_be_silently_absorbed: true,
    pricing_confirmed_candidate_must_not_create_mechanics_by_itself: true,
    unindexed_candidate_must_not_be_added_as_normal_activity: true,
    coverage_ledger_belongs_to_activity_profile_forensics_not_material_profile: true
  }),
  forbidden_runtime_reads: Object.freeze([
    "cartography_index",
    "target_profile_forensics",
    "target_feature_profile_forensics",
    "legal_cartography_index",
    "legal_signal_derivation_profile",
    "data_privacy_navigation_index",
    "data_provenance_profile",
    "exposure_registry_profile",
    "challenge_gate",
    "final_output_handoff",
    "renderer_payload"
  ]),
  forbidden_material_keys: Object.freeze([
    "feature_candidate_inventory",
    "target_feature_profile_forensics",
    "target_profile",
    "target_profile_forensics",
    "activity_profile_source_index",
    "legal_cartography_index",
    "legal_signal_derivation_profile",
    "data_provenance_profile",
    "exposure_registry_profile",
    "challenge_gate",
    "final_output_handoff",
    "renderer_payload",
    "candidate_id",
    "source_candidate_ids",
    "source_pointers",
    "source_refs",
    "source_urls",
    "source_ids",
    "evidence_excerpts",
    "confidence",
    "validation_status",
    "lock_status",
    "profile_meta",
    "runtime_trace",
    "derivation_ledger",
    "validation_ledger",
    "forensic_contract",
    "forensic_boundary",
    "archetype_proof",
    "surface_proof_and_routing_limits"
  ]),
  boundary_rules: Object.freeze({
    phase2g_route_scoped_runtime_reader_required: true,
    direct_contract_read_loading_forbidden: true,
    profile_forensics_inputs_forbidden: true,
    must_not_discover_or_fetch_sources: true,
    must_not_create_candidate_universe: true,
    must_not_mutate_feature_candidate_inventory: true,
    must_not_emit_feature_candidate_inventory: true,
    must_not_emit_target_feature_profile_forensics: true,
    must_not_perform_legal_data_exposure_operator_compiler_or_qr_work: true,
    must_not_copy_lossless_text_or_excerpts: true,
    must_not_include_urls_ids_pointers_or_confidence: true,
    must_use_activity_profile_source_index_for_navigation: true,
    must_use_active_run_package_manifest_for_package_context: true,
    fixed_ai_archetype_and_surface_taxonomies_forbidden: true,
    next_phase: "ACTIVITY_PROFILE_FORENSICS"
  })
});

export function activityProfileReviewReadArtifacts() { return [...ACTIVITY_PROFILE_REVIEW_CONTRACT.material_job.reads]; }
export function activityProfileReviewWriteArtifacts() { return [...ACTIVITY_PROFILE_REVIEW_CONTRACT.material_job.writes]; }
export function activityProfileReviewPromptFiles() { return [...ACTIVITY_PROFILE_REVIEW_CONTRACT.material_job.prompt_files]; }
export function activityProfileReviewReferenceFiles() { return [...ACTIVITY_PROFILE_REVIEW_CONTRACT.material_job.references]; }
export function activityProfileReviewActivityRowFields() { return [...ACTIVITY_PROFILE_REVIEW_CONTRACT.output_contract.activity_row_fields]; }
export function activityProfileReviewCommercialAvailabilityFields() { return [...ACTIVITY_PROFILE_REVIEW_CONTRACT.output_contract.commercial_availability_fields]; }
