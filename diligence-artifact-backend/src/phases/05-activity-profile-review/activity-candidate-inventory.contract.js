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

const ACTIVITY_CANDIDATE_INVENTORY_READS = Object.freeze([
  "phase_routing_manifest",
  "phase_route_runtime_packet",
  "activity_profile_source_index",
  "target_profile",
  "domain_derivation_profile",
  "active_run_package_manifest",
  "domain_selection_profile",
  ...ACTIVITY_PROFILE_LOSSLESS_READS
]);

const ACTIVITY_CANDIDATE_INVENTORY_WRITES = Object.freeze(["feature_candidate_inventory"]);

const ACTIVITY_CANDIDATE_CREATION_LOCATOR_MAPS = Object.freeze([
  "activity_candidate_source_locator_map",
  "product_capability_locator_map",
  "feature_mechanics_locator_map",
  "technical_mechanics_locator_map",
  "api_interaction_locator_map",
  "data_object_interaction_locator_map",
  "integration_action_locator_map",
  "commercial_availability_locator_map",
  "external_action_context_locator_map",
  "input_output_object_context_locator_map"
]);

const ACTIVITY_CONTEXT_ONLY_LOCATOR_MAPS = Object.freeze([
  "customer_use_context_locator_map",
  "support_operational_context_locator_map",
  "automation_transparency_context_locator_map",
  "human_control_context_locator_map"
]);

export const ACTIVITY_CANDIDATE_INVENTORY_CONTRACT = Object.freeze({
  contract_name: "ACTIVITY_CANDIDATE_INVENTORY_CONTRACT_v3_PHASE2G_ROUTED",
  central_phase_id: "ACTIVITY_PROFILE_REVIEW",
  central_phase_label: "Activity Profile Review",
  phase_job_id: "ACTIVITY_CANDIDATE_INVENTORY",
  public_label: "Activity Candidate Inventory",
  compatibility_internal_job_id: "M8_FEATURE_CANDIDATE_INVENTORY",
  implementation_status: "PHASE5_CANDIDATE_INVENTORY_PHASE2G_ROUTE_SCOPED_RUNTIME_CUTOVER_COMPLETE",
  production_entrypoint_switched: true,
  global_production_deployment_switched: false,
  model_usage: "NONE_DETERMINISTIC",
  route_contract: Object.freeze({
    routing_authority: "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY",
    route_id: "ROUTE.PHASE5.ACTIVITY_PROFILE",
    bucket_id: "2C_BUCKET_ACTIVITY_PROFILE",
    runtime_reader: "phase-route-runtime.reader",
    direct_contract_read_loading_forbidden: true,
    profile_forensics_inputs_forbidden: true
  }),
  deterministic_job: Object.freeze({
    reads: ACTIVITY_CANDIDATE_INVENTORY_READS,
    writes: ACTIVITY_CANDIDATE_INVENTORY_WRITES,
    source_helper: "buildFeatureCandidateInventoryIndex",
    source_helper_module: "src/phases/05-activity-profile-review/services/activity-candidate-inventory-index.builder.js",
    source_index_artifact: "activity_profile_source_index",
    legacy_harvester_module: null,
    validator: "validateFeatureCandidateInventoryIndex",
    validator_module: "src/phases/05-activity-profile-review/services/activity-candidate-inventory-index.builder.js"
  }),
  scoped_lossless_evidence_reads: ACTIVITY_PROFILE_LOSSLESS_READS,
  source_index_scope: Object.freeze({
    candidate_creation_locator_maps: ACTIVITY_CANDIDATE_CREATION_LOCATOR_MAPS,
    context_only_locator_maps: ACTIVITY_CONTEXT_ONLY_LOCATOR_MAPS,
    candidate_creation_from_context_only_maps_allowed: false,
    source_index_is_navigation_only: true,
    phase_2c_is_source_of_candidate_navigation: true,
    phase_1_lossless_family_reads_forbidden: true,
    legal_governance_index_candidate_creation_allowed: false,
    data_privacy_navigation_candidate_creation_allowed: false,
    external_browsing_allowed: false
  }),
  package_boundary: Object.freeze({
    active_run_package_manifest_required: true,
    domain_derivation_profile_required: true,
    candidate_inventory_does_not_apply_package_taxonomy: true,
    mounted_domain_package_controls_activity_taxonomy_in_material_profile: true,
    archetype_surface_and_package_specific_labels_forbidden_in_inventory: true
  }),
  output_contract: Object.freeze({
    required_top_level_artifact: "feature_candidate_inventory",
    artifact_type: "feature_candidate_inventory",
    inventory_version: "m8_feature_candidate_inventory_index_v2_phase2c",
    derivation_mode: "DETERMINISTIC_INDEX_FROM_ACTIVITY_PROFILE_SOURCE_INDEX_NO_MODEL_NO_EVIDENCE_COMPILATION",
    required_branches: Object.freeze(["artifact_type", "inventory_version", "run_id", "derivation_mode", "source_index_artifact", "source_locator_maps_indexed", "raw_hit_count", "canonical_candidate_count", "raw_feature_hit_index", "candidates", "canonicalization_index", "dedup_index", "parent_child_overlap_index", "dedup_summary", "index_boundary", "index_limitations"]),
    candidate_required_fields: Object.freeze(["candidate_id", "canonical_feature_key", "candidate_name", "candidate_type", "candidate_status", "activity_route_class", "capability_key", "source_root", "mandatory_profile_treatment", "merged_raw_hit_ids", "source_pointers"]),
    source_pointer_required_fields: Object.freeze(["source_artifact", "source_id", "source_root", "route_class", "route_code", "locator_id", "unit_id", "source_pointer", "unit_pointer"]),
    index_only: true,
    no_evidence_text_copy: true,
    no_mechanics_proof: true,
    no_activity_summary: true,
    no_archetype_or_surface_derivation: true,
    no_package_specific_activity_classification: true,
    no_legal_privacy_or_registry_analysis: true
  }),
  forbidden_runtime_reads: Object.freeze([
    "lossless_family__P1_PRODUCT",
    "lossless_family__P2_PLATFORM_FEATURE_SOLUTION",
    "lossless_family__P3_AI_CAPABILITY_TECHNICAL",
    "lossless_family__P4_USE_CASE_INDUSTRY",
    "lossless_family__P5_ENTERPRISE_PRICING",
    "cartography_index",
    "target_profile_forensics",
    "legal_cartography_index",
    "legal_signal_derivation_profile",
    "data_privacy_navigation_index",
    "target_feature_profile",
    "target_feature_profile_forensics",
    "data_provenance_profile",
    "extended_dap_india_readiness_profile",
    "integrated_dap_report",
    "exposure_registry_profile",
    "challenge_gate",
    "final_output_handoff",
    "renderer_payload",
    "qualified_review_handoff"
  ]),
  boundary_rules: Object.freeze({
    phase2g_route_scoped_runtime_reader_required: true,
    direct_contract_read_loading_forbidden: true,
    profile_forensics_inputs_forbidden: true,
    deterministic_only: true,
    must_not_call_provider: true,
    must_not_discover_or_fetch_sources: true,
    must_not_read_raw_phase1_roots_outside_phase2g_packet: true,
    must_not_emit_target_feature_profile: true,
    must_not_emit_target_feature_profile_forensics: true,
    must_not_copy_lossless_text_or_excerpts: true,
    must_not_apply_domain_package_taxonomy: true,
    candidate_inventory_is_navigation_index_not_evidence: true,
    next_job: "ACTIVITY_PROFILE_REVIEW_MATERIAL"
  })
});

export function activityCandidateInventoryReadArtifacts() { return [...ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.deterministic_job.reads]; }
export function activityCandidateInventoryWriteArtifacts() { return [...ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.deterministic_job.writes]; }
export function activityCandidateInventoryCandidateCreationLocatorMaps() { return [...ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.source_index_scope.candidate_creation_locator_maps]; }
