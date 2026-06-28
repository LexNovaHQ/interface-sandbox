export const REPORT_SECTION_KEYS = Object.freeze([
  "matter_overview",
  "executive_summary",
  "target_profile",
  "product_activity_ip_profile",
  "data_risk_provenance_controls",
  "legal_document_control_review",
  "exposure_findings",
  "implications_review_path",
  "evidence_gaps_clarification_points",
  "methodology_limitations_review_notes",
  "forensic_ledger_appendix"
]);

export const REPORT_SECTION_HEADINGS = Object.freeze({
  matter_overview: "Matter Overview",
  executive_summary: "Executive Summary",
  target_profile: "Target Profile",
  product_activity_ip_profile: "Product, Activity & IP Profile",
  data_risk_provenance_controls: "Data Provenance & Controls",
  legal_document_control_review: "Legal Document & Control Review",
  exposure_findings: "Exposure Findings",
  implications_review_path: "Implications & Review Path",
  evidence_gaps_clarification_points: "Evidence Gaps & Clarification Points",
  methodology_limitations_review_notes: "Methodology, Limitations & Review Notes",
  forensic_ledger_appendix: "Forensic Ledger Appendix"
});

export const MATERIAL_PROFILE_AUTHORITY = Object.freeze({
  target_profile: {
    registry_profile_section: "Target Profile",
    normalized_profile_name: "Target Profile",
    backend_artifact: "target_profile"
  },
  target_feature_profile: {
    registry_profile_section: "Product / Activity Profile",
    normalized_profile_name: "Product, Activity & IP Profile",
    backend_artifact: "target_feature_profile"
  },
  data_provenance_profile: {
    registry_profile_section: "Data / Asset Provenance Profile",
    normalized_profile_name: "Data Provenance & Controls",
    backend_artifact: "data_provenance_profile"
  },
  legal_cartography_index: {
    registry_profile_section: "Legal / Governance Cartography Profile",
    normalized_profile_name: "Legal Document & Control Review",
    backend_artifact: "legal_cartography_index"
  },
  exposure_registry_triggered_profile: {
    registry_profile_section: "Legal Exposure Profile",
    normalized_profile_name: "Exposure Findings — Triggered Signals",
    backend_artifact: "exposure_registry_triggered_profile"
  },
  exposure_registry_controlled_profile: {
    registry_profile_section: "Legal Exposure Profile",
    normalized_profile_name: "Exposure Findings — Visible Controls",
    backend_artifact: "exposure_registry_controlled_profile"
  },
  challenge_gate: {
    registry_profile_section: "Final Assessment",
    normalized_profile_name: "Quality Review / Challenge Gate",
    backend_artifact: "challenge_gate"
  }
});

export const M10_LOCKED_FIELDS = Object.freeze([
  "assessment_scope",
  "source_coverage",
  "individuals_and_relationships",
  "role_relationship_readiness",
  "data_categories",
  "generated_output_and_derived_data_treatment",
  "sensitive_special_category_signals",
  "children_minors_signal",
  "collection_sources_and_activity_data_flows",
  "processing_operations_lifecycle",
  "purpose_use_signals",
  "privacy_notice_visibility",
  "lawful_basis_consent_authorization_readiness",
  "consent_withdrawal_controls",
  "rights_request_routes",
  "privacy_governance_contact_accountability_signals",
  "contractual_dpa_customer_terms_readiness",
  "vendor_subprocessor_partner_inventory",
  "processor_subprocessor_governance_controls",
  "third_party_disclosure_sharing_controls",
  "cross_border_transfer_location_custody",
  "retention_deletion_return_export_controls",
  "security_access_controls",
  "breach_incident_readiness",
  "cookies_tracking_marketing_controls",
  "ai_model_provider_processing_chain",
  "ai_training_finetuning_model_improvement_controls",
  "embeddings_vector_memory_controls",
  "prompt_output_logging_telemetry_controls",
  "automated_decision_profiling_human_review_signal",
  "privacy_accountability_documentation_signals",
  "law_regulatory_readiness_matrix",
  "missing_proof_and_diligence_requests",
  "limitations"
]);

export const FORENSIC_ANNEXURE_FAMILIES = Object.freeze([
  { id: "FOR.SRC.001", key: "source_ledger", label: "Source ledger" },
  { id: "FOR.EV.001", key: "evidence_ledger", label: "Evidence ledger" },
  { id: "FOR.FD.001", key: "field_derivation_ledger", label: "Field derivation ledger" },
  { id: "FOR.REG.001", key: "registry_evaluation_ledger", label: "Registry evaluation ledger" },
  { id: "FOR.XREF.001", key: "cross_profile_linkage_ledger", label: "Cross-profile linkage ledger" },
  { id: "FOR.LIM.001", key: "limitations_missing_proof_ledger", label: "Limitations and missing proof ledger" },
  { id: "FOR.QC.001", key: "validation_quality_control_ledger", label: "Validation and quality-control ledger" },
  { id: "FOR.RUN.001", key: "runtime_trace", label: "Runtime trace" },
  { id: "FOR.REND.001", key: "renderer_export_trace", label: "Renderer and export trace" },
  { id: "FOR.BOUND.001", key: "forensic_boundary", label: "Forensic boundary" }
]);

export function sectionHeading(key) {
  return REPORT_SECTION_HEADINGS[key] || key;
}

export function buildRegistryAuthorityManifest() {
  return {
    material_registry: {
      authority_file: "FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml",
      locked_rows: 390,
      role: "material field ownership, section/profile normalization, fallback language, forbidden inference"
    },
    forensic_registry: {
      authority_file: "FORENSIC_ANNEXURE_REGISTRY_v1_LOCKED.yaml",
      locked_rows: 10,
      role: "appendix/proof/validation boundary only"
    },
    terminology_lock: {
      source: "REGISTRY_BUILD_README_v2.md",
      report_facing_legacy_route_labels_allowed: false,
      preferred_review_route_language: "qualified review"
    },
    normalized_profiles: MATERIAL_PROFILE_AUTHORITY,
    section_order: REPORT_SECTION_KEYS
  };
}
