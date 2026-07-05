const TARGET_PROFILE_FORENSICS_READS = Object.freeze([
  "source_discovery_handoff",
  "legal_signal_derivation_profile",
  "target_profile",
  "lossless_family__T0_ROOT",
  "lossless_family__T1_IDENTITY",
  "lossless_family__T2_LEGAL_IDENTITY",
  "lossless_family__T3_OPERATOR_ENTITY",
  "lossless_family__T4_SUPPORTING_IDENTITY"
]);

const TARGET_PROFILE_FORENSICS_WRITES = Object.freeze(["target_profile_forensics"]);

export const TARGET_PROFILE_FORENSICS_CONTRACT = Object.freeze({
  contract_name: "TARGET_PROFILE_FORENSICS_CONTRACT_v1_DETERMINISTIC_MIGRATION",
  central_phase_id: "TARGET_PROFILE_FORENSICS",
  public_label: "Target Profile Forensics",
  compatibility_internal_job_id: "M7_TARGET_PROFILE_FORENSICS",
  implementation_status: "CONTRACT_LOCKED_DETERMINISTIC_HELPER_MIGRATION",
  production_entrypoint_switched: false,
  model_usage: "NONE_DETERMINISTIC",
  deterministic_job: Object.freeze({
    reads: TARGET_PROFILE_FORENSICS_READS,
    writes: TARGET_PROFILE_FORENSICS_WRITES,
    source_helper: "buildM7DeterministicTargetForensics",
    source_helper_module: "src/deterministic-profile-forensics.js",
    validator: "validateM7TargetProfileOutput",
    validator_phase: "M7_TARGET_PROFILE_FORENSICS"
  }),
  output_contract: Object.freeze({
    required_top_level_artifact: "target_profile_forensics",
    required_branches: Object.freeze([
      "forensic_contract",
      "material_profile_trace_index",
      "field_trace_index",
      "source_custody_trace_index",
      "limitation_trace_index",
      "profile_reconciliation_ledger",
      "forensic_lock_gate_result",
      "source_ledger_used_for_m7",
      "target_source_extraction_capsule_summary",
      "target_source_route_coverage_ledger",
      "field_derivation_ledger",
      "targeted_re_extraction_ledger",
      "limitation_ledger",
      "cross_route_use_ledger",
      "validation_quality_control_result",
      "runtime_trace_m7_only",
      "forensic_boundary"
    ]),
    array_branches: Object.freeze([
      "material_profile_trace_index",
      "field_trace_index",
      "source_custody_trace_index",
      "limitation_trace_index",
      "profile_reconciliation_ledger",
      "source_ledger_used_for_m7",
      "target_source_extraction_capsule_summary",
      "target_source_route_coverage_ledger",
      "field_derivation_ledger",
      "targeted_re_extraction_ledger",
      "limitation_ledger",
      "cross_route_use_ledger"
    ]),
    deterministic_forensic_profile_required: true,
    model_generated_forensics_allowed: false,
    material_profile_re_emission_allowed: false
  }),
  forbidden_runtime_reads: Object.freeze([
    "legal_cartography_index",
    "m7_deterministic_legal_signal_overlay",
    "lossless_family__L1_CORE_TERMS_PRIVACY",
    "lossless_family__L2_B2B_CONTRACTING",
    "lossless_family__L3_AI_USAGE_GOVERNANCE",
    "lossless_family__L4_PRIVACY_ADJACENT_NOTICES",
    "lossless_family__L5_LEGAL_HUB_HOSTED",
    "lossless_family__L6_ENTITY_NOTICE",
    "lossless_family__P1_PRODUCT",
    "lossless_family__P2_PLATFORM_FEATURE_SOLUTION",
    "lossless_family__P3_AI_CAPABILITY_TECHNICAL",
    "lossless_family__P4_USE_CASE_INDUSTRY",
    "lossless_family__P5_ENTERPRISE_PRICING",
    "lossless_family__D1_SECURITY_TRUST",
    "lossless_family__D2_SUBPROCESSOR_PRIVACY_CENTER",
    "lossless_family__D3_DATA_GOVERNANCE_CONTROLS",
    "lossless_family__D4_DOCS_API_DATA_FLOW",
    "lossless_family__D5_AI_SAFETY_TRANSPARENCY",
    "feature_candidate_inventory",
    "target_feature_profile",
    "data_provenance_profile",
    "exposure_registry_profile",
    "challenge_gate",
    "final_output_handoff",
    "renderer_payload",
    "qualified_review_handoff"
  ]),
  boundary_rules: Object.freeze({
    deterministic_only: true,
    must_not_call_provider: true,
    must_not_reemit_target_profile: true,
    must_not_read_raw_legal_cartography_index: true,
    must_not_read_activity_or_data_families: true,
    must_emit_forensic_trace_only: true,
    next_phase: "ACTIVITY_PROFILE_REVIEW"
  })
});

export function targetProfileForensicsReadArtifacts() {
  return [...TARGET_PROFILE_FORENSICS_CONTRACT.deterministic_job.reads];
}

export function targetProfileForensicsWriteArtifacts() {
  return [...TARGET_PROFILE_FORENSICS_CONTRACT.deterministic_job.writes];
}
