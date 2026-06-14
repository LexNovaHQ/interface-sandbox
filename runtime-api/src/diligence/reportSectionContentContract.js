export const STAGE9_DD_SECTION_CONTENT_CONTRACT = Object.freeze({
  matter_overview: {
    heading: "Matter Overview",
    required_blocks: [
      "matter_identity",
      "review_scope",
      "evidence_cutoff",
      "reliance_disclaimer",
      "local_counsel_review_required",
      "public_footprint_limitation"
    ]
  },
  executive_summary: {
    heading: "Executive Summary",
    required_blocks: [
      "executive_posture",
      "target_snapshot",
      "product_activity_snapshot",
      "data_posture",
      "legal_document_posture",
      "exposure_posture",
      "evidence_posture",
      "counsel_review_priorities"
    ]
  },
  target_profile: {
    heading: "Target Profile",
    required_blocks: [
      "identity",
      "jurisdiction",
      "business_model",
      "market_context",
      "product_baseline",
      "data_touchpoint_summary",
      "evidence_basis",
      "limitations"
    ]
  },
  product_activity_ip_profile: {
    heading: "Product, Activity & IP Profile",
    required_blocks: [
      "product_activity_thesis",
      "feature_inventory_summary",
      "feature_table",
      "functional_profile",
      "risk_surface_profile",
      "ip_content_profile",
      "architecture_profile",
      "commercial_scan",
      "evidence_basis",
      "limitations"
    ]
  },
  data_risk_provenance_controls: {
    heading: "Data Risk, Provenance & Controls",
    required_blocks: [
      "data_risk_thesis",
      "data_flow_summary",
      "data_flow_table",
      "control_review",
      "data_gaps",
      "evidence_basis",
      "limitations"
    ]
  },
  legal_document_control_review: {
    heading: "Legal Document & Control Review",
    required_blocks: [
      "legal_document_review_thesis",
      "document_inventory_summary",
      "document_inventory",
      "legal_unit_index",
      "document_relationships",
      "control_signal_matrix",
      "document_mismatch_signals",
      "counsel_review_points",
      "evidence_basis",
      "limitations"
    ]
  },
  exposure_findings: {
    heading: "Exposure Findings",
    required_blocks: [
      "exposure_category_groups",
      "finding_rows",
      "severity_summary",
      "control_position_summary",
      "evidence_basis_summary",
      "appendix_crosswalk"
    ]
  },
  implications_remediation_path: {
    heading: "Implications & Remediation Path",
    required_blocks: [
      "remediation_thesis",
      "priority_actions",
      "document_route",
      "data_control_route",
      "operational_control_route",
      "local_counsel_review_queue",
      "quick_wins",
      "blocked_until_clarified",
      "review_ready_handoff_bridge"
    ]
  },
  evidence_gaps_clarification_points: {
    heading: "Evidence Gaps & Clarification Points",
    required_blocks: [
      "open_information_requests",
      "missing_documents",
      "missing_factual_confirmations",
      "unclear_data_flows",
      "unclear_provider_dependencies",
      "evidence_limitations",
      "consequence_if_unresolved",
      "client_confirmation_questions"
    ]
  },
  methodology_limitations_review_notes: {
    heading: "Methodology, Limitations & Review Notes",
    required_blocks: [
      "methodology",
      "stage_roles",
      "status_definitions",
      "legal_limitations",
      "evidence_limitations",
      "registry_use_note",
      "reviewer_notes"
    ]
  },
  forensic_ledger_appendix: {
    heading: "Forensic Ledger Appendix",
    required_blocks: [
      "appendix_notice",
      "full_ledger_summary",
      "full_registry_ledger",
      "row_level_proof",
      "condition_trigger_basis",
      "evidence_references",
      "operator_challenge_trace",
      "batch_warnings",
      "appendix_limitations"
    ]
  }
});

export const PLATFORM_LEGAL_DILIGENCE_ELEMENTS = Object.freeze([
  {
    key: "platform_product_architecture",
    label: "Platform & Product Architecture",
    surface_terms: ["Agentic", "Autonomous", "Workflow", "Product", "Enterprise", "API"],
    document_routes: ["Terms of Service", "AI / Agent Governance Terms", "Human Review / Handover Protocol"]
  },
  {
    key: "data_processing_user_information_flows",
    label: "Data Processing & User Information Flows",
    surface_terms: ["Privacy", "Processor", "Subprocessor", "Personal", "Biometric", "Voice", "Data"],
    document_routes: ["Privacy Policy", "Data Processing Addendum", "Data Protection Impact Assessment"]
  },
  {
    key: "automated_systems_output_reliance",
    label: "Automated Systems & Output Reliance",
    surface_terms: ["Hallucination", "Decision", "Automated", "Reliance", "Output", "Agent"],
    document_routes: ["AI / Agent Governance Terms", "Acceptable Use Policy", "Human Review / Handover Protocol"]
  },
  {
    key: "content_output_ip_position",
    label: "Content, Output & IP Position",
    surface_terms: ["IP", "Content", "Training", "Output", "Copyright", "Ownership"],
    document_routes: ["IP / Output Ownership Terms", "Terms of Service", "AI / Agent Governance Terms"]
  },
  {
    key: "security_operational_controls",
    label: "Security & Operational Controls",
    surface_terms: ["Security", "Breach", "Availability", "Operational", "False Negative"],
    document_routes: ["Service Level Agreement", "Data Processing Addendum", "Internal Governance SOP"]
  },
  {
    key: "third_party_provider_infrastructure_dependencies",
    label: "Third-Party Provider & Infrastructure Dependencies",
    surface_terms: ["Subprocessor", "Provider", "Cloud", "Infrastructure", "Vendor", "Model Provider"],
    document_routes: ["Data Processing Addendum", "Privacy Policy", "Service Level Agreement"]
  },
  {
    key: "user_facing_claims_product_reliance",
    label: "User-Facing Claims & Product Reliance",
    surface_terms: ["Claims", "Reliance", "Misrepresentation", "Consumer", "Accuracy", "Enterprise"],
    document_routes: ["Terms of Service", "Acceptable Use Policy", "AI / Agent Governance Terms"]
  },
  {
    key: "communications_user_interaction_flows",
    label: "Communications & User Interaction Flows",
    surface_terms: ["Chat", "Voice", "Notification", "Support", "Bot", "User Interaction"],
    document_routes: ["Terms of Service", "Acceptable Use Policy", "AI / Agent Governance Terms"]
  },
  {
    key: "customer_contracting_reliance_position",
    label: "Customer Contracting & Reliance Position",
    surface_terms: ["Liability", "Warranty", "Customer", "Contract", "Reliance", "Damages"],
    document_routes: ["Terms of Service", "Service Level Agreement", "AI / Agent Governance Terms"]
  }
]);

export function requiredBlocksForSection(sectionKey) {
  return STAGE9_DD_SECTION_CONTENT_CONTRACT[sectionKey]?.required_blocks || [];
}
