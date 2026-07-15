export const P2D_DATA_PRIVACY_NAVIGATION_INDEX_PHASE_ID = "P2D_DATA_PRIVACY_NAVIGATION_INDEX";
export const P2D_DATA_PRIVACY_NAVIGATION_INDEX_PUBLIC_LABEL = "Data Privacy Navigation Index";

export const P2D_DATA_PRIVACY_ARTIFACTS = Object.freeze({
  deterministicMap: "data_privacy_deterministic_map",
  semanticProfile: "data_privacy_semantic_profile",
  finalIndex: "data_privacy_navigation_index"
});

export const P2D_DATA_PRIVACY_CONTROL_INPUTS = Object.freeze([
  "source_discovery_handoff",
  "post_phase_1_domain_gate_handoff",
  "source_discovery_matrix_manifest",
  "neutral_evidence_bucket_manifest",
  "adapter_expansion_log",
  "source_family_index"
]);

export const P2D_DATA_PRIVACY_ROOT_INPUTS = Object.freeze([
  "lossless_root__privacy_data_processing",
  "lossless_root__security_trust_compliance",
  "lossless_root__data_governance_controls",
  "lossless_root__technical_docs_api",
  "lossless_root__docs_api_data_flow",
  "lossless_root__integrations_ecosystem",
  "lossless_root__ai_safety_transparency",
  "lossless_root__regulatory_licensing_status",
  "lossless_root__grievance_complaints"
]);

export const P2D_DATA_PRIVACY_LEGAL_INDEX_INPUTS = Object.freeze([
  "legal_cartography_index",
  "legal_signal_derivation_profile"
]);

export const P2D_DATA_PRIVACY_READS = Object.freeze([
  ...P2D_DATA_PRIVACY_CONTROL_INPUTS,
  ...P2D_DATA_PRIVACY_ROOT_INPUTS,
  ...P2D_DATA_PRIVACY_LEGAL_INDEX_INPUTS
]);

export const P2D_DATA_PRIVACY_WRITES = Object.freeze([
  P2D_DATA_PRIVACY_ARTIFACTS.deterministicMap,
  P2D_DATA_PRIVACY_ARTIFACTS.semanticProfile,
  P2D_DATA_PRIVACY_ARTIFACTS.finalIndex
]);

export const P2D_DATA_PRIVACY_SAVE_ORDER = Object.freeze([
  P2D_DATA_PRIVACY_ARTIFACTS.deterministicMap,
  P2D_DATA_PRIVACY_ARTIFACTS.semanticProfile,
  P2D_DATA_PRIVACY_ARTIFACTS.finalIndex
]);

export const P2D_DATA_PRIVACY_ROUTE_SOURCES = Object.freeze([
  route("SECURITY_TRUST", [
    "lossless_root__security_trust_compliance",
    "lossless_root__data_governance_controls"
  ], ["SEC", "READY"]),
  route("PRIVACY_VENDOR_TRANSFER", [
    "lossless_root__privacy_data_processing",
    "lossless_root__security_trust_compliance",
    "lossless_root__integrations_ecosystem",
    "lossless_root__regulatory_licensing_status"
  ], ["VEND", "LOC", "ROLE", "PARTY"]),
  route("DATA_GOVERNANCE_CONTROLS", [
    "lossless_root__data_governance_controls",
    "lossless_root__privacy_data_processing",
    "lossless_root__grievance_complaints",
    "lossless_root__regulatory_licensing_status"
  ], ["AUTH", "CTRL", "CONTACT", "CM", "RET", "REQ", "LIM"]),
  route("DOCS_API_DATA_FLOW", [
    "lossless_root__technical_docs_api",
    "lossless_root__docs_api_data_flow",
    "lossless_root__integrations_ecosystem"
  ], ["FLOW", "OBJ", "DOM", "SENS"]),
  route("AI_SAFETY_TRANSPARENCY", [
    "lossless_root__ai_safety_transparency",
    "lossless_root__docs_api_data_flow",
    "lossless_root__technical_docs_api"
  ], ["DOM", "SENS"])
]);

export const P2D_DATA_PRIVACY_FINAL_INDEX_KEYS = Object.freeze([
  "artifact_type",
  "manifest_version",
  "phase_id",
  "downstream_phase_id",
  "layer_id",
  "execution_mode",
  "navigation_policy",
  "deterministic_navigation_spine",
  "semantic_navigation_overlay",
  "validation_quality_control_result",
  "lock_status"
]);

export const P2D_DATA_PRIVACY_FORBIDDEN_INPUTS = Object.freeze([
  "lossless_family__D1_SECURITY_TRUST",
  "lossless_family__D2_SUBPROCESSOR_PRIVACY_CENTER",
  "lossless_family__D3_DATA_GOVERNANCE_CONTROLS",
  "lossless_family__D4_DOCS_API_DATA_FLOW",
  "lossless_family__D5_AI_SAFETY_TRANSPARENCY",
  "lossless_root__security_trust",
  "lossless_root__trust_compliance",
  "lossless_root__technical_docs_api_developer",
  "lossless_root__support_help",
  "data_provenance_source_index"
]);

export const P2D_DATA_PRIVACY_FORBIDDEN_OUTPUTS = Object.freeze([
  "data_provenance_profile",
  "data_provenance_profile_forensics",
  "integrated_dap_report",
  "extended_dap_india_readiness_profile",
  "compiler",
  "forensics",
  "report_projection",
  "final_profile",
  "legal_conclusion",
  "compliance_conclusion",
  "risk_conclusion"
]);

export const P2D_DATA_PRIVACY_DOWNSTREAM_RULES = Object.freeze({
  phase_2d_is_navigation_only: true,
  data_privacy_navigation_index_owned_by_2d: true,
  final_artifact_name_preserved: "data_privacy_navigation_index",
  phase_7_derives_data_profile_later: true,
  data_provenance_source_index_forbidden: true,
  phase1_v5_data_privacy_roots_required: true,
  old_d_family_inputs_forbidden: true,
  no_free_corpus_read: true,
  selective_legal_access_only_through_legal_cartography: true,
  legal_signal_support_only_through_legal_signal_derivation_profile: true,
  no_source_text_copy: true,
  no_summaries: true,
  no_excerpts: true,
  no_profile_values: true,
  no_legal_or_compliance_conclusions: true
});

export const P2D_DATA_PRIVACY_CONTRACT = Object.freeze({
  phase_id: P2D_DATA_PRIVACY_NAVIGATION_INDEX_PHASE_ID,
  public_label: P2D_DATA_PRIVACY_NAVIGATION_INDEX_PUBLIC_LABEL,
  artifacts: P2D_DATA_PRIVACY_ARTIFACTS,
  reads: P2D_DATA_PRIVACY_READS,
  writes: P2D_DATA_PRIVACY_WRITES,
  save_order: P2D_DATA_PRIVACY_SAVE_ORDER,
  route_sources: P2D_DATA_PRIVACY_ROUTE_SOURCES,
  final_index_keys: P2D_DATA_PRIVACY_FINAL_INDEX_KEYS,
  forbidden_inputs: P2D_DATA_PRIVACY_FORBIDDEN_INPUTS,
  forbidden_outputs: P2D_DATA_PRIVACY_FORBIDDEN_OUTPUTS,
  downstream_rules: P2D_DATA_PRIVACY_DOWNSTREAM_RULES
});

function route(route_code, source_artifacts, dap_families) {
  return Object.freeze({ route_code, source_artifacts: Object.freeze(source_artifacts), dap_families: Object.freeze(dap_families) });
}
