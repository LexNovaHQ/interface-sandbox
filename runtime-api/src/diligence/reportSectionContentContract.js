export const STAGE9_DD_SECTION_CONTENT_CONTRACT = Object.freeze({
  matter_overview: {
    heading: "Matter Overview",
    required_blocks: [
      "report_identity",
      "review_scope",
      "scope_limitations",
      "reliance_disclaimer",
      "evidence_cut_off"
    ]
  },
  executive_exposure_summary: {
    heading: "Executive Exposure Summary",
    required_blocks: [
      "executive_posture",
      "key_numbers",
      "top_exposure_themes",
      "control_position",
      "immediate_review_priorities",
      "executive_conclusion"
    ]
  },
  evidence_reviewed: {
    heading: "Evidence Reviewed",
    required_blocks: [
      "evidence_inventory",
      "evidence_categories",
      "evidence_not_reviewed",
      "evidence_limitations"
    ]
  },
  product_activity_profile: {
    heading: "Product & Activity Profile",
    required_blocks: [
      "product_activity_thesis",
      "platform_product_architecture",
      "data_processing_user_information_flows",
      "automated_systems_output_reliance",
      "content_output_ip_position",
      "third_party_infrastructure_dependencies",
      "user_facing_claims_product_reliance"
    ]
  },
  legal_risk_surface_map: {
    heading: "Legal Risk Surface Map",
    required_blocks: [
      "active_legal_surfaces",
      "surface_activation_basis",
      "legal_consequence_categories",
      "linked_findings",
      "linked_controls"
    ]
  },
  legal_stack_control_review: {
    heading: "Legal Stack & Control Review",
    required_blocks: [
      "document_inventory",
      "document_coverage_matrix",
      "control_evidenced_items",
      "control_gaps",
      "counsel_review_points",
      "legal_stack_synthesis"
    ]
  },
  exposure_findings: {
    heading: "Exposure Findings",
    required_blocks: [
      "consolidated_findings_schedule",
      "finding_statements",
      "evidence_basis",
      "legal_significance",
      "control_position",
      "affected_documents_controls",
      "commercial_deal_impact",
      "recommended_remediation",
      "supporting_registry_items"
    ]
  },
  evidence_gaps_clarification_points: {
    heading: "Evidence Gaps & Clarification Points",
    required_blocks: [
      "open_information_request_list",
      "missing_documents",
      "missing_factual_confirmations",
      "consequence_if_unresolved"
    ]
  },
  implications_remediation_path: {
    heading: "Implications & Remediation Path",
    required_blocks: [
      "remediation_roadmap",
      "document_route",
      "control_route",
      "review_priority",
      "review_ready_handoff_bridge"
    ]
  },
  methodology_limitations_review_notes: {
    heading: "Methodology, Limitations & Review Notes",
    required_blocks: [
      "methodology",
      "stage_roles",
      "status_definitions",
      "legal_limitations",
      "evidence_limitations"
    ]
  },
  forensic_ledger_appendix: {
    heading: "Forensic Ledger Appendix",
    required_blocks: [
      "full_registry_ledger",
      "row_level_proof",
      "condition_trigger_basis",
      "evidence_references",
      "operator_challenge_trace"
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
