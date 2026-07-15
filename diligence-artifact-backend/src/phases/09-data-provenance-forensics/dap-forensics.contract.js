const PHASE8_DERIVED_INPUTS = Object.freeze([
  "data_privacy_navigation_index",
  "dap_registry_manifest",
  "dap_strategic_derivation_matrix",
  "dap_semantic_batch_route_manifest",
  "dap_semantic_batch_exec_artifact",
  "dap_semantic_batch_lim_artifact",
  "dap_semantic_batch_party_artifact",
  "dap_semantic_batch_role_artifact",
  "dap_semantic_batch_flow_artifact",
  "dap_semantic_batch_obj_artifact",
  "dap_semantic_batch_auth_artifact",
  "dap_semantic_batch_ctrl_artifact",
  "dap_semantic_batch_contact_cm_artifact",
  "dap_semantic_batch_vend_artifact",
  "dap_semantic_batch_loc_artifact",
  "dap_semantic_batch_ret_artifact",
  "dap_semantic_batch_sec_artifact",
  "dap_semantic_batch_sens_artifact",
  "dap_semantic_batch_dom_artifact",
  "dap_semantic_batch_ready_artifact",
  "dap_semantic_batch_req_artifact",
  "dap_semantic_batch_validation_manifest",
  "data_provenance_profile_semantic_batch_gate"
]);

export const DAP_FORENSICS_CONTRACT = Object.freeze({
  contract_name: "DAP_FORENSICS_CONTRACT_v2_PHASE2G_DERIVED_ONLY",
  central_phase_id: "DATA_PROVENANCE_FORENSICS",
  public_label: "DAP Forensics",
  compatibility_internal_job_id: "DATA_PROVENANCE_PROFILE_FORENSICS",
  implementation_status: "PHASE2G_DERIVED_ONLY_RUNTIME_CUTOVER",
  production_entrypoint_switched: true,
  global_production_deployment_switched: false,
  model_usage: "NONE_DETERMINISTIC",
  route_contract: Object.freeze({
    routing_authority: "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY",
    route_id: "ROUTE.PHASE7.DATA_PROVENANCE_PROFILE",
    bucket_id: "2D_BUCKET_DATA_PRIVACY",
    delivery_mode: "DERIVED_ONLY",
    source_bucket_delivered: false,
    profile_forensics_inputs_forbidden: true
  }),
  deterministic_job: Object.freeze({
    reads: Object.freeze(["phase_routing_manifest", "phase_route_runtime_packet", ...PHASE8_DERIVED_INPUTS]),
    writes: Object.freeze(["dap_forensics_profile"]),
    source_helper: "buildDapForensicsProfile",
    validator: "dap_forensics_boundary_validator"
  }),
  output_contract: Object.freeze({
    required_top_level_artifact: "dap_forensics_profile",
    required_branches: Object.freeze(["forensic_contract", "forensic_boundary", "phase7_source_artifacts", "navigation_index_trace", "semantic_route_manifest_trace", "batch_trace_index", "material_profile_trace_index", "field_trace_index", "route_coverage_trace_index", "limitation_trace_index", "validation_manifest_trace", "semantic_batch_gate_trace", "forensic_lock_gate_result", "validation_quality_control_result"]),
    deterministic_forensic_profile_required: true,
    model_generated_forensics_allowed: false,
    material_profile_re_emission_allowed: false
  }),
  boundary_rules: Object.freeze({
    deterministic_only: true,
    must_not_call_provider: true,
    phase2g_route_scoped_runtime_reader_required: true,
    direct_contract_read_loading_forbidden: true,
    derived_only_packet_required: true,
    source_bucket_delivery_forbidden: true,
    profile_forensics_inputs_forbidden: true,
    must_not_reemit_dap_batches_as_profile: true,
    must_not_read_old_m10_or_4b_4c_artifacts: true,
    next_phase: "EXPOSURE_PROFILE"
  })
});

export function dapForensicsReadArtifacts() { return [...DAP_FORENSICS_CONTRACT.deterministic_job.reads]; }
export function dapForensicsWriteArtifacts() { return [...DAP_FORENSICS_CONTRACT.deterministic_job.writes]; }
