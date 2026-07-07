const ACTIVITY_PROFILE_FORENSICS_READS = Object.freeze([
  "source_discovery_handoff",
  "target_profile",
  "target_profile_forensics",
  "feature_candidate_inventory",
  "target_feature_profile",
  "lossless_family__P1_PRODUCT",
  "lossless_family__P2_PLATFORM_FEATURE_SOLUTION",
  "lossless_family__P3_AI_CAPABILITY_TECHNICAL",
  "lossless_family__P4_USE_CASE_INDUSTRY",
  "lossless_family__P5_ENTERPRISE_PRICING"
]);

const ACTIVITY_PROFILE_FORENSICS_WRITES = Object.freeze(["target_feature_profile_forensics"]);

export const ACTIVITY_PROFILE_FORENSICS_CONTRACT = Object.freeze({
  contract_name: "ACTIVITY_PROFILE_FORENSICS_CONTRACT_v1_DETERMINISTIC_MIGRATION",
  central_phase_id: "ACTIVITY_PROFILE_FORENSICS",
  public_label: "Activity Profile Forensics",
  compatibility_internal_job_id: "M8_TARGET_FEATURE_PROFILE_FORENSICS",
  implementation_status: "PHASE_RUNNER_CUTOVER_STAGED",
  production_entrypoint_switched: true,
  global_production_deployment_switched: false,
  model_usage: "NONE_DETERMINISTIC",
  deterministic_job: Object.freeze({
    reads: ACTIVITY_PROFILE_FORENSICS_READS,
    writes: ACTIVITY_PROFILE_FORENSICS_WRITES,
    source_helper: "buildM8DeterministicFeatureForensics",
    source_helper_module: "src/deterministic-profile-forensics.js",
    validator: "activity_profile_forensics_boundary_validator",
    validator_scope: "forensic_trace_output_only"
  }),
  output_contract: Object.freeze({
    required_top_level_artifact: "target_feature_profile_forensics",
    required_branches: Object.freeze([
      "forensic_contract",
      "feature_candidate_inventory_ref",
      "raw_feature_hit_derivation_ledger",
      "canonicalization_derivation_ledger",
      "dedup_decision_ledger",
      "parent_child_overlap_ledger",
      "candidate_to_activity_coverage_ledger",
      "semantic_classification_ledger",
      "material_profile_trace_index",
      "activity_trace_index",
      "field_trace_index",
      "source_custody_trace_index",
      "limitation_trace_index",
      "profile_reconciliation_ledger",
      "forensic_lock_gate_result",
      "product_activity_source_route_coverage_ledger",
      "product_activity_extraction_capsule_summary",
      "candidate_admission_and_omission_ledger",
      "selected_pa_field_derivation_ledger",
      "activity_mechanics_derivation_ledger",
      "archetype_derivation_ledger",
      "surface_token_derivation_ledger",
      "targeted_re_extraction_ledger",
      "activity_limitations_ledger",
      "cross_route_use_ledger",
      "validation_quality_control_result",
      "runtime_trace_m8_only",
      "forensic_boundary"
    ]),
    array_branches: Object.freeze([
      "raw_feature_hit_derivation_ledger",
      "canonicalization_derivation_ledger",
      "dedup_decision_ledger",
      "parent_child_overlap_ledger",
      "candidate_to_activity_coverage_ledger",
      "semantic_classification_ledger",
      "material_profile_trace_index",
      "activity_trace_index",
      "field_trace_index",
      "source_custody_trace_index",
      "limitation_trace_index",
      "profile_reconciliation_ledger",
      "product_activity_source_route_coverage_ledger",
      "product_activity_extraction_capsule_summary",
      "candidate_admission_and_omission_ledger",
      "selected_pa_field_derivation_ledger",
      "activity_mechanics_derivation_ledger",
      "archetype_derivation_ledger",
      "surface_token_derivation_ledger",
      "targeted_re_extraction_ledger",
      "activity_limitations_ledger",
      "cross_route_use_ledger"
    ]),
    deterministic_forensic_profile_required: true,
    model_generated_forensics_allowed: false,
    material_profile_re_emission_allowed: false
  }),
  forbidden_runtime_reads: Object.freeze([
    "legal_cartography_index",
    "legal_signal_derivation_profile",
    "m7_deterministic_legal_signal_overlay",
    "m10_selected_legal_support_packet",
    "lossless_family__T0_ROOT",
    "lossless_family__T1_IDENTITY",
    "lossless_family__T2_LEGAL_IDENTITY",
    "lossless_family__T3_OPERATOR_ENTITY",
    "lossless_family__T4_SUPPORTING_IDENTITY",
    "lossless_family__D1_SECURITY_TRUST",
    "lossless_family__D2_SUBPROCESSOR_PRIVACY_CENTER",
    "lossless_family__D3_DATA_GOVERNANCE_CONTROLS",
    "lossless_family__D4_DOCS_API_DATA_FLOW",
    "lossless_family__D5_AI_SAFETY_TRANSPARENCY",
    "lossless_family__L1_CORE_TERMS_PRIVACY",
    "lossless_family__L2_B2B_CONTRACTING",
    "lossless_family__L3_AI_USAGE_GOVERNANCE",
    "lossless_family__L4_PRIVACY_ADJACENT_NOTICES",
    "lossless_family__L5_LEGAL_HUB_HOSTED",
    "lossless_family__L6_ENTITY_NOTICE",
    "data_provenance_profile",
    "data_provenance_profile_forensics",
    "exposure_registry_profile",
    "challenge_gate",
    "final_output_handoff",
    "renderer_payload",
    "qualified_review_handoff"
  ]),
  boundary_rules: Object.freeze({
    deterministic_only: true,
    must_not_call_provider: true,
    must_not_reemit_target_feature_profile: true,
    must_not_recompile_feature_candidate_inventory: true,
    must_not_recompile_lossless_evidence: true,
    must_emit_forensic_trace_only: true,
    next_phase: "DATA_PROVENANCE_PROFILE"
  })
});

export function activityProfileForensicsReadArtifacts() {
  return [...ACTIVITY_PROFILE_FORENSICS_CONTRACT.deterministic_job.reads];
}

export function activityProfileForensicsWriteArtifacts() {
  return [...ACTIVITY_PROFILE_FORENSICS_CONTRACT.deterministic_job.writes];
}
