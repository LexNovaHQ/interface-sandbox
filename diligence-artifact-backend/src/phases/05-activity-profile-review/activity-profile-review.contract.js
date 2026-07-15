import {
  BASE_ACTIVITY_EVIDENCE_ROOTS,
  SHARED_ACTIVITY_FIELDS,
  DERIVATION_BASIS_FIELDS,
  CLASSIFICATION_BLOCK_FIELDS,
  OVERLAY_CLASSIFICATION_BLOCK_FIELDS,
  COMMERCIAL_AVAILABILITY_FIELDS,
  PROFILE_TOP_LEVEL_KEYS
} from "./activity-profile.constants.js";

const ACTIVITY_PROFILE_REVIEW_READS = Object.freeze(["phase_routing_manifest"]);
const ACTIVITY_PROFILE_REVIEW_WRITES = Object.freeze(["target_feature_profile"]);

const ACTIVITY_PROFILE_REVIEW_PROMPT_FILES = Object.freeze([
  "agent-packages/00_SYSTEM_BLOCKING_DOCTRINE.md",
  "agent-packages/agent_3_target_feature/00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED.md",
  "agent-packages/agent_3_target_feature/AGENT3_RUNTIME_BINDING_PACKET.yaml",
  "agent-packages/agent_3_target_feature/03_M8_FEATURE_PROFILE_BACKEND_CURRENT.md",
  "agent-packages/agent_3_target_feature/03B_M8_ACTIVITY_PROFILE_PACKAGE_AWARE_SYNC.md",
  "agent-packages/agent_3_target_feature/00_VALIDATOR_RULES_INTEGRATED.md",
  "agent-packages/agent_3_target_feature/AGENT3_BACKEND_OUTPUT_CONTRACT.md",
  "agent-packages/agent_3_target_feature/00_TERMINAL_RECEIPT_RULES_INTEGRATED.md"
]);

const ACTIVITY_PROFILE_REVIEW_REFERENCES = Object.freeze([
  "references/registry/Diligence_Field_Derivation_Registry.yml",
  "FORENSIC_ANNEXURE_REGISTRY_v1_LOCKED.yaml"
]);

const ACTIVITY_ROW_FIELDS = Object.freeze([
  ...SHARED_ACTIVITY_FIELDS,
  "primary_classification",
  "overlay_classifications"
]);

const MOUNTED_TAXONOMY_REF_FIELDS = Object.freeze([
  "primary_package_id",
  "primary_key_version",
  "overlays"
]);

const MOUNTED_TAXONOMY_OVERLAY_REF_FIELDS = Object.freeze([
  "overlay_id",
  "package_id",
  "key_version"
]);

export const ACTIVITY_PROFILE_REVIEW_CONTRACT = Object.freeze({
  contract_name: "ACTIVITY_PROFILE_REVIEW_CONTRACT_v9_BEHAVIOR_CLASS_CANONICAL",
  schema_version: "activity_profile_material.v9.behavior_class",
  central_phase_id: "ACTIVITY_PROFILE_REVIEW",
  central_phase_label: "Activity Profile Review",
  phase_job_id: "ACTIVITY_PROFILE_REVIEW_MATERIAL",
  public_label: "Activity Profile Review",
  compatibility_internal_job_id: "M8_TARGET_FEATURE_PROFILE",
  implementation_status: "PHASE5_BEHAVIOR_CLASS_CANONICAL_CUTOVER",
  production_entrypoint_switched: true,
  global_production_deployment_switched: true,
  model_usage: "MODEL_JSON_ONLY_PACKAGE_TAXONOMY_INJECTED",
  mounted_taxonomy_ref_stamped_by_backend: true,
  primary_overlay_schema_active: true,
  primary_overlay_behavior_class_and_surface_independent: true,
  route_contract: Object.freeze({
    routing_authority: "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY",
    route_id: "ROUTE.PHASE5.ACTIVITY_PROFILE",
    bucket_id: "2C_BUCKET_ACTIVITY_PROFILE",
    runtime_reader: "phase-route-runtime.reader",
    job_scoped_derived_profile: "feature_candidate_inventory",
    direct_contract_read_loading_forbidden: true,
    profile_forensics_inputs_forbidden: true,
    lossless_evidence_role: "PRIMARY_EVIDENCE",
    index_role: "MANDATORY_NAVIGATION_MAP_INTO_PRIMARY_EVIDENCE"
  }),
  material_job: Object.freeze({
    reads: ACTIVITY_PROFILE_REVIEW_READS,
    writes: ACTIVITY_PROFILE_REVIEW_WRITES,
    prompt_files: ACTIVITY_PROFILE_REVIEW_PROMPT_FILES,
    references: ACTIVITY_PROFILE_REVIEW_REFERENCES,
    validator: "validateM8TargetFeatureOutput",
    validator_phase: "M8_TARGET_FEATURE_PROFILE"
  }),
  source_authority: Object.freeze({
    routing_authority: "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY",
    source_index_artifact: "activity_profile_source_index",
    candidate_universe_artifact: "feature_candidate_inventory",
    active_run_package_manifest_required: true,
    taxonomy_resolver: "resolveActivityTaxonomy",
    mounted_primary_package_field: "active_run_package_manifest.primary_domain_package",
    mounted_capability_overlays_field: "active_run_package_manifest.capability_overlays",
    mounted_regulatory_overlays_field: "active_run_package_manifest.regulatory_overlays",
    regulatory_overlays_excluded_from_activity_classification: true,
    phase2g_routed_packet_is_read_ceiling: true,
    resolver_declared_roots_do_not_expand_reads: true,
    usable_evidence_formula: "index-mapped units ∩ Phase-2G-routed 2C primary evidence ∩ resolver-declared/base activity evidence roots",
    declared_unrouted_root_limitation: "DECLARED_ACTIVITY_EVIDENCE_ROOT_NOT_ROUTED:<root>",
    declared_unindexed_root_limitation: "DECLARED_ACTIVITY_EVIDENCE_ROOT_NOT_INDEXED:<root>",
    hardcoded_registry_key_list_forbidden: true,
    hardcoded_ai_registry_key_for_activity_taxonomy_forbidden: true,
    hardcoded_ai_safety_root_forbidden: true,
    fixed_behavior_class_enum_forbidden: true,
    fixed_surface_token_enum_forbidden: true,
    p2c_activity_profile_source_index_is_navigation_only: true,
    p1_lossless_family_reads_forbidden: true,
    external_browsing_allowed: false,
    general_market_knowledge_allowed: false
  }),
  scoped_base_lossless_evidence_reads: BASE_ACTIVITY_EVIDENCE_ROOTS,
  output_contract: Object.freeze({
    required_top_level_artifact: "target_feature_profile",
    required_profile_keys: PROFILE_TOP_LEVEL_KEYS,
    activity_row_fields: ACTIVITY_ROW_FIELDS,
    shared_activity_fields: SHARED_ACTIVITY_FIELDS,
    primary_classification_fields: CLASSIFICATION_BLOCK_FIELDS,
    overlay_classification_fields: OVERLAY_CLASSIFICATION_BLOCK_FIELDS,
    derivation_basis_fields: DERIVATION_BASIS_FIELDS,
    commercial_availability_fields: COMMERCIAL_AVAILABILITY_FIELDS,
    mounted_taxonomy_ref_fields: MOUNTED_TAXONOMY_REF_FIELDS,
    mounted_taxonomy_overlay_ref_fields: MOUNTED_TAXONOMY_OVERLAY_REF_FIELDS,
    material_output_only: true,
    forensic_output_forbidden: true,
    primary_overlay_split_required: true,
    primary_package_id_must_equal_mounted_primary: true,
    overlay_blocks_package_scoped: true,
    one_overlay_block_per_resolved_capability_overlay: true,
    unresolved_overlay_block_forbidden: true,
    regulatory_overlay_block_forbidden: true,
    mounted_taxonomy_ref_stamped_by_backend: true,
    model_may_not_override_mounted_taxonomy_ref: true,
    package_scoped_membership_checks_required: true,
    per_block_basis_must_match_selected_codes_one_to_one: true,
    no_unselected_basis_entries: true,
    empty_primary_allowed_when_unkeyed_or_no_legitimate_match_only: true,
    false_catch_all_classification_forbidden: true,
    unkeyed_primary_limitation: "PRIMARY_PACKAGE_HAS_NO_TAXONOMY_KEY:<package_id>",
    no_primary_match_limitation: "NO_PRIMARY_BEHAVIOR_CLASS_MATCH:<activity_reference>",
    unresolved_overlay_limitation: "OVERLAY_HAS_NO_TAXONOMY_KEY:<overlay_id>",
    declared_unrouted_root_limitation: "DECLARED_ACTIVITY_EVIDENCE_ROOT_NOT_ROUTED:<root>"
  }),
  forbidden_material_keys: Object.freeze([
    "feature_candidate_inventory", "target_feature_profile_forensics", "target_profile",
    "target_profile_forensics", "activity_profile_source_index", "phase_route_runtime_packet",
    "legal_cartography_index", "legal_signal_derivation_profile", "data_provenance_profile",
    "exposure_registry_profile", "challenge_gate", "final_output_handoff", "renderer_payload",
    "candidate_id", "source_candidate_ids", "source_pointers", "source_pointer", "source_ref",
    "source_refs", "source_url", "source_urls", "source_id", "source_ids", "confidence",
    "validation_status", "lock_status", "profile_meta", "runtime_trace", "derivation_ledger",
    "validation_ledger", "behavior_class_ledger", "surface_token_ledger", "forensic_contract",
    "forensic_boundary", "behavior_class_proof", "surface_proof_and_routing_limits",
    "excerpt", "lossless_text", "clean_text", "text",
    "archetype_codes", "archetype_derivation_basis"
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
    fixed_behavior_class_and_surface_taxonomies_forbidden: true,
    next_phase: "M8_TARGET_FEATURE_PROFILE_FORENSICS"
  })
});

export function activityProfileReviewReadArtifacts() { return [...ACTIVITY_PROFILE_REVIEW_CONTRACT.material_job.reads]; }
export function activityProfileReviewWriteArtifacts() { return [...ACTIVITY_PROFILE_REVIEW_CONTRACT.material_job.writes]; }
export function activityProfileReviewPromptFiles() { return [...ACTIVITY_PROFILE_REVIEW_CONTRACT.material_job.prompt_files]; }
export function activityProfileReviewReferenceFiles() { return [...ACTIVITY_PROFILE_REVIEW_CONTRACT.material_job.references]; }
export function activityProfileReviewActivityRowFields() { return [...ACTIVITY_PROFILE_REVIEW_CONTRACT.output_contract.activity_row_fields]; }
export function activityProfileReviewCommercialAvailabilityFields() { return [...ACTIVITY_PROFILE_REVIEW_CONTRACT.output_contract.commercial_availability_fields]; }
export function activityProfileReviewPrimaryClassificationFields() { return [...ACTIVITY_PROFILE_REVIEW_CONTRACT.output_contract.primary_classification_fields]; }
export function activityProfileReviewOverlayClassificationFields() { return [...ACTIVITY_PROFILE_REVIEW_CONTRACT.output_contract.overlay_classification_fields]; }
export function activityProfileReviewMountedTaxonomyRefFields() { return [...ACTIVITY_PROFILE_REVIEW_CONTRACT.output_contract.mounted_taxonomy_ref_fields]; }
