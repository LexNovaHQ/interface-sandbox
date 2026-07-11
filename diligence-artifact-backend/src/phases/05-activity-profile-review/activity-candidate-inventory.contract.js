import {
  BASE_ACTIVITY_EVIDENCE_ROOTS,
  CANDIDATE_CREATION_LOCATOR_MAPS,
  CONTEXT_ONLY_LOCATOR_MAPS,
  FEATURE_CANDIDATE_FIELDS,
  FEATURE_CANDIDATE_INVENTORY_ARTIFACT,
  FEATURE_CANDIDATE_INVENTORY_MODE,
  FEATURE_CANDIDATE_INVENTORY_VERSION
} from "./activity-profile.constants.js";

const ACTIVITY_PROFILE_LOSSLESS_READS = BASE_ACTIVITY_EVIDENCE_ROOTS;

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

const ACTIVITY_CANDIDATE_INVENTORY_WRITES = Object.freeze([
  FEATURE_CANDIDATE_INVENTORY_ARTIFACT
]);

const DETERMINISTIC_BASELINE_JOB = Object.freeze({
  reads: ACTIVITY_CANDIDATE_INVENTORY_READS,
  writes: ACTIVITY_CANDIDATE_INVENTORY_WRITES,
  source_helper: "buildFeatureCandidateInventoryBaseline",
  compatibility_source_helper: "buildFeatureCandidateInventoryIndex",
  source_helper_module: "src/phases/05-activity-profile-review/services/activity-candidate-inventory-index.builder.js",
  source_index_artifact: "activity_profile_source_index",
  validator: "validateFeatureCandidateInventoryIndex",
  validator_module: "src/phases/05-activity-profile-review/services/activity-candidate-inventory-index.builder.js",
  provider_call_allowed: false,
  package_taxonomy_allowed: false
});

export const ACTIVITY_CANDIDATE_INVENTORY_CONTRACT = Object.freeze({
  contract_name: "ACTIVITY_CANDIDATE_INVENTORY_CONTRACT_v4_DETERMINISTIC_LED_SEMANTIC_SUPPORTED",
  central_phase_id: "ACTIVITY_PROFILE_REVIEW",
  central_phase_label: "Activity Profile Review",
  phase_job_id: "ACTIVITY_CANDIDATE_INVENTORY",
  public_label: "Activity Candidate Inventory",
  compatibility_internal_job_id: "M8_FEATURE_CANDIDATE_INVENTORY",
  implementation_status: "PHASE5_PASS3_DETERMINISTIC_BASELINE_COMPLETE_SEMANTIC_RUNTIME_PENDING",
  production_entrypoint_switched: true,
  global_production_deployment_switched: false,
  model_usage: "DETERMINISTIC_LED_SEMANTIC_SUPPORTED",
  route_contract: Object.freeze({
    routing_authority: "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY",
    route_id: "ROUTE.PHASE5.ACTIVITY_PROFILE",
    bucket_id: "2C_BUCKET_ACTIVITY_PROFILE",
    runtime_reader: "phase-route-runtime.reader",
    direct_contract_read_loading_forbidden: true,
    profile_forensics_inputs_forbidden: true,
    phase2g_routed_packet_is_read_ceiling: true
  }),
  deterministic_baseline_job: DETERMINISTIC_BASELINE_JOB,
  deterministic_job: DETERMINISTIC_BASELINE_JOB,
  semantic_support: Object.freeze({
    prompt_bundle_id: "ACTIVITY_CANDIDATE_SEMANTIC_PROMPT_FILES",
    prompt_bundle_wiring_status: "PENDING_PASS5",
    semantic_support_attempt_required: true,
    semantic_support_non_blocking: true,
    semantic_output_non_authoritative: true,
    deterministic_reconciliation_required: true
  }),
  scoped_lossless_evidence_reads: ACTIVITY_PROFILE_LOSSLESS_READS,
  source_index_scope: Object.freeze({
    candidate_creation_locator_maps: CANDIDATE_CREATION_LOCATOR_MAPS,
    context_only_locator_maps: CONTEXT_ONLY_LOCATOR_MAPS,
    candidate_creation_from_context_only_maps_allowed: false,
    source_index_is_navigation_only: true,
    lossless_primary_evidence_read: true,
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
    archetype_surface_and_package_specific_labels_forbidden_in_inventory: true,
    no_package_taxonomy_in_layer1: true
  }),
  output_contract: Object.freeze({
    required_top_level_artifact: FEATURE_CANDIDATE_INVENTORY_ARTIFACT,
    artifact_type: FEATURE_CANDIDATE_INVENTORY_ARTIFACT,
    inventory_version: FEATURE_CANDIDATE_INVENTORY_VERSION,
    derivation_mode: FEATURE_CANDIDATE_INVENTORY_MODE,
    required_branches: Object.freeze([
      "artifact_type",
      "inventory_version",
      "run_id",
      "derivation_mode",
      "source_index_artifact",
      "source_locator_maps_indexed",
      "raw_hit_count",
      "canonical_candidate_count",
      "raw_feature_hit_index",
      "candidates",
      "canonicalization_index",
      "dedup_index",
      "parent_child_overlap_index",
      "dedup_summary",
      "context_pointer_index",
      "deterministic_baseline_metadata",
      "index_boundary",
      "index_limitations"
    ]),
    semantic_support_receipt_required_after_reconciliation: true,
    candidate_required_fields: FEATURE_CANDIDATE_FIELDS,
    source_pointer_required_fields: Object.freeze([
      "source_artifact",
      "source_id",
      "source_root",
      "route_class",
      "route_code",
      "locator_id",
      "unit_id",
      "source_pointer",
      "unit_pointer"
    ]),
    evidence_grounded_candidates_required: true,
    lossless_primary_evidence_read: true,
    source_index_is_navigation_only: true,
    no_source_text_copy: true,
    no_evidence_text_copy: true,
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
    deterministic_baseline_required: true,
    semantic_support_attempt_required: true,
    semantic_support_non_blocking: true,
    semantic_output_non_authoritative: true,
    deterministic_reconciliation_required: true,
    lossless_primary_evidence_read: true,
    source_index_is_navigation_only: true,
    phase2g_routed_packet_is_read_ceiling: true,
    no_source_text_copy: true,
    no_evidence_text_copy: true,
    no_package_taxonomy_in_layer1: true,
    must_not_discover_or_fetch_sources: true,
    must_not_read_raw_phase1_roots_outside_phase2g_packet: true,
    must_not_emit_target_feature_profile: true,
    must_not_emit_target_feature_profile_forensics: true,
    must_not_copy_lossless_text_or_excerpts: true,
    must_not_apply_domain_package_taxonomy: true,
    next_job: "ACTIVITY_PROFILE_REVIEW_MATERIAL"
  })
});

export function activityCandidateInventoryReadArtifacts() {
  return [...ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.deterministic_baseline_job.reads];
}

export function activityCandidateInventoryWriteArtifacts() {
  return [...ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.deterministic_baseline_job.writes];
}

export function activityCandidateInventoryCandidateCreationLocatorMaps() {
  return [...ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.source_index_scope.candidate_creation_locator_maps];
}

// Temporary named-export compatibility for the untouched Phase 5 barrel.
// It returns locator-map authorities, never retired Phase 1 family names.
export const activityCandidateInventoryCandidateCreationFamilies = activityCandidateInventoryCandidateCreationLocatorMaps;
