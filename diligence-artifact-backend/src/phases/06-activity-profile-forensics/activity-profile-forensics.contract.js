const ACTIVITY_PROFILE_FORENSICS_READS = Object.freeze([
  "phase_routing_manifest",
  "phase_route_runtime_packet",
  "activity_profile_source_index",
  "target_profile",
  "domain_derivation_profile",
  "feature_candidate_inventory",
  "target_feature_profile"
]);
const ACTIVITY_PROFILE_FORENSICS_WRITES = Object.freeze(["target_feature_profile_forensics"]);

export const ACTIVITY_PROFILE_FORENSICS_CONTRACT = Object.freeze({
  contract_name: "ACTIVITY_PROFILE_FORENSICS_CONTRACT_v2_PHASE2G_DERIVED_ONLY",
  central_phase_id: "ACTIVITY_PROFILE_FORENSICS",
  public_label: "Activity Profile Forensics",
  compatibility_internal_job_id: "M8_TARGET_FEATURE_PROFILE_FORENSICS",
  implementation_status: "PHASE2G_DERIVED_ONLY_RUNTIME_CUTOVER",
  production_entrypoint_switched: true,
  global_production_deployment_switched: false,
  model_usage: "NONE_DETERMINISTIC",
  route_contract: Object.freeze({ routing_authority: "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY", route_id: "ROUTE.PHASE5.ACTIVITY_PROFILE", bucket_id: "2C_BUCKET_ACTIVITY_PROFILE", delivery_mode: "DERIVED_ONLY", source_bucket_delivered: false, profile_forensics_inputs_forbidden: true }),
  deterministic_job: Object.freeze({ reads: ACTIVITY_PROFILE_FORENSICS_READS, writes: ACTIVITY_PROFILE_FORENSICS_WRITES, source_helper: "buildM8DeterministicFeatureForensics", source_helper_module: "src/phases/_shared/forensics/profile-forensics.shared.js", validator: "activity_profile_forensics_boundary_validator", validator_scope: "forensic_trace_output_only" }),
  output_contract: Object.freeze({
    required_top_level_artifact: "target_feature_profile_forensics",
    required_branches: Object.freeze(["forensic_contract", "feature_candidate_inventory_ref", "raw_feature_hit_derivation_ledger", "canonicalization_derivation_ledger", "dedup_decision_ledger", "parent_child_overlap_ledger", "candidate_to_activity_coverage_ledger", "semantic_classification_ledger", "material_profile_trace_index", "activity_trace_index", "field_trace_index", "source_custody_trace_index", "limitation_trace_index", "profile_reconciliation_ledger", "forensic_lock_gate_result", "product_activity_source_route_coverage_ledger", "product_activity_extraction_capsule_summary", "candidate_admission_and_omission_ledger", "selected_pa_field_derivation_ledger", "activity_mechanics_derivation_ledger", "archetype_derivation_ledger", "surface_token_derivation_ledger", "targeted_re_extraction_ledger", "activity_limitations_ledger", "cross_route_use_ledger", "validation_quality_control_result", "runtime_trace_m8_only", "forensic_boundary"]),
    array_branches: Object.freeze(["raw_feature_hit_derivation_ledger", "canonicalization_derivation_ledger", "dedup_decision_ledger", "parent_child_overlap_ledger", "candidate_to_activity_coverage_ledger", "semantic_classification_ledger", "material_profile_trace_index", "activity_trace_index", "field_trace_index", "source_custody_trace_index", "limitation_trace_index", "profile_reconciliation_ledger", "product_activity_source_route_coverage_ledger", "product_activity_extraction_capsule_summary", "candidate_admission_and_omission_ledger", "selected_pa_field_derivation_ledger", "activity_mechanics_derivation_ledger", "archetype_derivation_ledger", "surface_token_derivation_ledger", "targeted_re_extraction_ledger", "activity_limitations_ledger", "cross_route_use_ledger"]),
    deterministic_forensic_profile_required: true,
    model_generated_forensics_allowed: false,
    material_profile_re_emission_allowed: false
  }),
  forbidden_runtime_reads: Object.freeze(["source_discovery_handoff", "target_profile_forensics", "target_feature_profile_forensics", "legal_cartography_index", "legal_signal_derivation_profile", "lossless_family__P1_PRODUCT", "lossless_family__P2_PLATFORM_FEATURE_SOLUTION", "lossless_family__P3_AI_CAPABILITY_TECHNICAL", "lossless_family__P4_USE_CASE_INDUSTRY", "lossless_family__P5_ENTERPRISE_PRICING", "data_privacy_navigation_index", "dap_forensics_profile", "exposure_registry_profile_forensics"]),
  boundary_rules: Object.freeze({ deterministic_only: true, must_not_call_provider: true, phase2g_route_scoped_runtime_reader_required: true, derived_only_packet_required: true, source_bucket_delivery_forbidden: true, profile_forensics_inputs_forbidden: true, must_not_reemit_target_feature_profile: true, must_not_recompile_feature_candidate_inventory: true, must_not_recompile_lossless_evidence: true, must_emit_forensic_trace_only: true, next_phase: "DATA_PROVENANCE_PROFILE" })
});

export function activityProfileForensicsReadArtifacts() { return [...ACTIVITY_PROFILE_FORENSICS_CONTRACT.deterministic_job.reads]; }
export function activityProfileForensicsWriteArtifacts() { return [...ACTIVITY_PROFILE_FORENSICS_CONTRACT.deterministic_job.writes]; }
