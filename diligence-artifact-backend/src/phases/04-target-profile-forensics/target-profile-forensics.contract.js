const TARGET_PROFILE_FORENSICS_READS = Object.freeze([
  "phase_routing_manifest",
  "phase_route_runtime_packet",
  "target_profile_source_index",
  "legal_signal_derivation_profile",
  "target_profile",
  "domain_derivation_profile"
]);
const TARGET_PROFILE_FORENSICS_WRITES = Object.freeze(["target_profile_forensics"]);

export const TARGET_PROFILE_FORENSICS_CONTRACT = Object.freeze({
  contract_name: "TARGET_PROFILE_FORENSICS_CONTRACT_v2_PHASE2G_DERIVED_ONLY",
  central_phase_id: "TARGET_PROFILE_FORENSICS",
  public_label: "Target Profile Forensics",
  compatibility_internal_job_id: "M7_TARGET_PROFILE_FORENSICS",
  implementation_status: "PHASE2G_DERIVED_ONLY_RUNTIME_CUTOVER",
  production_entrypoint_switched: true,
  global_production_deployment_switched: false,
  model_usage: "NONE_DETERMINISTIC",
  route_contract: Object.freeze({ routing_authority: "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY", route_id: "ROUTE.PHASE3A.TARGET_PROFILE", bucket_id: "2A_BUCKET_TARGET_PROFILE", delivery_mode: "DERIVED_ONLY", source_bucket_delivered: false, profile_forensics_inputs_forbidden: true }),
  deterministic_job: Object.freeze({ reads: TARGET_PROFILE_FORENSICS_READS, writes: TARGET_PROFILE_FORENSICS_WRITES, source_helper: "buildM7DeterministicTargetForensics", source_helper_module: "src/phases/_shared/forensics/profile-forensics.shared.js", validator: "target_profile_forensics_boundary_validator", validator_scope: "forensic_trace_output_only" }),
  output_contract: Object.freeze({
    required_top_level_artifact: "target_profile_forensics",
    required_branches: Object.freeze(["forensic_contract", "material_profile_trace_index", "field_trace_index", "source_custody_trace_index", "limitation_trace_index", "profile_reconciliation_ledger", "forensic_lock_gate_result", "source_ledger_used_for_m7", "target_source_extraction_capsule_summary", "target_source_route_coverage_ledger", "field_derivation_ledger", "targeted_re_extraction_ledger", "limitation_ledger", "cross_route_use_ledger", "validation_quality_control_result", "runtime_trace_m7_only", "forensic_boundary"]),
    array_branches: Object.freeze(["material_profile_trace_index", "field_trace_index", "source_custody_trace_index", "limitation_trace_index", "profile_reconciliation_ledger", "source_ledger_used_for_m7", "target_source_extraction_capsule_summary", "target_source_route_coverage_ledger", "field_derivation_ledger", "targeted_re_extraction_ledger", "limitation_ledger", "cross_route_use_ledger"]),
    deterministic_forensic_profile_required: true,
    model_generated_forensics_allowed: false,
    material_profile_re_emission_allowed: false
  }),
  forbidden_runtime_reads: Object.freeze(["legal_cartography_index", "source_discovery_handoff", "lossless_family__T0_ROOT", "lossless_family__T1_IDENTITY", "lossless_family__T2_LEGAL_IDENTITY", "lossless_family__T3_OPERATOR_ENTITY", "lossless_family__T4_SUPPORTING_IDENTITY", "target_profile_forensics", "feature_candidate_inventory", "target_feature_profile", "data_privacy_navigation_index", "dap_forensics_profile", "exposure_registry_profile_forensics"]),
  boundary_rules: Object.freeze({ deterministic_only: true, must_not_call_provider: true, phase2g_route_scoped_runtime_reader_required: true, derived_only_packet_required: true, source_bucket_delivery_forbidden: true, profile_forensics_inputs_forbidden: true, must_not_reemit_target_profile: true, must_emit_forensic_trace_only: true, next_phase: "ACTIVITY_PROFILE_REVIEW" })
});

export function targetProfileForensicsReadArtifacts() { return [...TARGET_PROFILE_FORENSICS_CONTRACT.deterministic_job.reads]; }
export function targetProfileForensicsWriteArtifacts() { return [...TARGET_PROFILE_FORENSICS_CONTRACT.deterministic_job.writes]; }
