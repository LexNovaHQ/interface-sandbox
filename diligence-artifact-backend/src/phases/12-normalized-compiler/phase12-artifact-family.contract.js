export const PHASE12_ARTIFACT_FAMILY_SCHEMA = "phase12_report_artifact_family.v1.co_p12_04";
export const REPORT_PROFILE_SCHEMA = "phase12_report_profile.v1.clean_material_projection";
export const REPORT_WRAPPER_SCHEMA = "phase12_report_section_wrapper.v1.clean_child_refs";

export const SECTION5_CHILD_PROFILES = Object.freeze([
  child("report_section__05_parties_roles", "parties_roles", "Parties, Roles and Affected Persons", ["PARTY", "ROLE"]),
  child("report_section__05_data_objects_flows", "data_objects_flows", "Data, Content Objects and Flows", ["EXEC", "OBJ", "FLOW"]),
  child("report_section__05_purpose_authorization_user_controls", "purpose_authorization_user_controls", "Purpose, Authorization, Notice and User Controls", ["AUTH", "CTRL"]),
  child("report_section__05_privacy_contacts_consent_manager", "privacy_contacts_consent_manager", "Privacy Contacts and Consent Manager Readiness", ["CONTACT", "CM"]),
  child("report_section__05_vendor_processor_chain", "vendor_processor_chain", "Vendor, Processor and Partner Chain", ["VEND"]),
  child("report_section__05_location_transfer_custody", "location_transfer_custody", "Location, Transfer and Custody", ["LOC"]),
  child("report_section__05_retention_deletion_portability", "retention_deletion_portability", "Retention, Deletion, Return and Portability", ["RET"]),
  child("report_section__05_security_access_incident_governance", "security_access_incident_governance", "Security, Access, Incident and Governance Controls", ["SEC"]),
  child("report_section__05_sensitive_high_risk_contexts", "sensitive_high_risk_contexts", "Sensitive and High-Risk Contexts", ["SENS"]),
  child("report_section__05_regulatory_readiness", "regulatory_readiness", "Regulatory Readiness", ["DOM", "READY"]),
  child("report_section__05_missing_proof_diligence_requests", "missing_proof_diligence_requests", "Missing Proof and Diligence Requests", ["REQ", "LIM"])
]);

export const SECTION8_CHILD_PROFILES = Object.freeze([
  exposureChild("report_section__08_primary_triggered_exposures", "primary_triggered_exposures", "Primary Sector — Triggered Exposures", "PRIMARY", "TRIGGERED", "Triggered"),
  exposureChild("report_section__08_primary_controlled_by_visible_control", "primary_controlled_by_visible_control", "Primary Sector — Controlled by Visible Control", "PRIMARY", "CONTROLLED_BY_VISIBLE_CONTROL", "Controlled by Visible Control"),
  exposureChild("report_section__08_primary_controlled_by_exclusion", "primary_controlled_by_exclusion", "Primary Sector — Controlled by Exclusion", "PRIMARY", "CONTROLLED_BY_EXCLUSION", "Controlled by Exclusion"),
  exposureChild("report_section__08_primary_controlled_by_public_evidence_limitation", "primary_controlled_by_public_evidence_limitation", "Primary Sector — Not Confirmed on Public Footprint", "PRIMARY", "CONTROLLED_BY_PUBLIC_EVIDENCE_LIMITATION", "Controlled by Public-Evidence Limitation"),
  exposureChild("report_section__08_overlay_triggered_exposures", "overlay_triggered_exposures", "Capability Overlay — Triggered Exposures", "OVERLAY", "TRIGGERED", "Triggered"),
  exposureChild("report_section__08_overlay_controlled_by_visible_control", "overlay_controlled_by_visible_control", "Capability Overlay — Controlled by Visible Control", "OVERLAY", "CONTROLLED_BY_VISIBLE_CONTROL", "Controlled by Visible Control"),
  exposureChild("report_section__08_overlay_controlled_by_exclusion", "overlay_controlled_by_exclusion", "Capability Overlay — Controlled by Exclusion", "OVERLAY", "CONTROLLED_BY_EXCLUSION", "Controlled by Exclusion"),
  exposureChild("report_section__08_overlay_controlled_by_public_evidence_limitation", "overlay_controlled_by_public_evidence_limitation", "Capability Overlay — Not Confirmed on Public Footprint", "OVERLAY", "CONTROLLED_BY_PUBLIC_EVIDENCE_LIMITATION", "Controlled by Public-Evidence Limitation")
]);

export const CANONICAL_SECTION_ARTIFACTS = Object.freeze([
  "report_section__01_matter_review_boundary",
  "report_section__02_executive_legal_risk_overview",
  "report_section__03_target_entity_sector_profile",
  "report_section__04_product_activity_architecture",
  "report_section__05_data_provenance_privacy_architecture",
  "report_section__06_sector_control_obligations",
  "report_section__07_legal_governance_architecture",
  "report_section__08_exposure_register",
  "report_section__09_open_review_items_handoff",
  "report_section__10_methodology_limitations_annexure"
]);

export const REPORT_FACING_ARTIFACTS = Object.freeze([
  ...CANONICAL_SECTION_ARTIFACTS,
  ...SECTION5_CHILD_PROFILES.map((row) => row.artifact_name),
  ...SECTION8_CHILD_PROFILES.map((row) => row.artifact_name)
]);

export const CONTROL_ARTIFACTS = Object.freeze([
  "phase12_admission",
  "phase12_route_plan",
  "phase12_report_custody_manifest",
  "phase12_compiler_validation",
  "report_manifest",
  "report_handoff",
  "final_output_handoff",
  "renderer_payload"
]);

export const FORBIDDEN_REPORT_KEYS = Object.freeze(new Set([
  "registry_row_key",
  "package_id",
  "source_domain",
  "stream_id",
  "stream_type",
  "batch_id",
  "registry_order",
  "FIELD21",
  "FIELD22",
  "FIELD23",
  "Hunter_Trigger",
  "route_id",
  "route_rows",
  "source_value_route",
  "selected_source_artifact",
  "owner_phase",
  "owner_artifacts",
  "semantic_ledger",
  "batch_registry_ledger",
  "workpad",
  "workpad_rows",
  "forensics",
  "forensic_rows",
  "prompt_trace",
  "model_trace",
  "checkpoint",
  "validation",
  "failures",
  "warnings"
]));

export function isAllowedReportKeyPath(path, key) {
  if (key !== "package_id") return false;
  return /^report_section__04_product_activity_architecture\.activity_register\.rows\[\d+\]\.(primary_classification|overlay_classifications\[\d+\])$/.test(path);
}

export const EXPOSURE_MATERIAL_FIELDS = Object.freeze([
  "Threat_ID", "Threat_Name", "Lane", "Behavior_Class", "Surface", "Subcategory",
  "Compliance_Framework", "Authority_IN", "Authority_EU", "Authority_US", "Velocity",
  "Pain_Tier", "Pain_Category", "Pain_Depth", "Status", "Effective_Date", "Legal_Pain",
  "FP_Mechanism", "FP_Impact", "Lex_Nova_Fix", "Provenance", "target_match",
  "evaluation_status", "basis_proof", "control_exclusion_evaluation", "evidence_source_basis",
  "applied_fp_mechanism", "row_limitations", "review_route"
]);

export const EXPOSURE_CUSTODY_FIELDS = Object.freeze([
  "registry_row_key", "package_id", "source_domain", "stream_id", "stream_type"
]);

export function section5ChildForFieldId(fieldId) {
  const family = String(fieldId || "").split(".")[1] || "";
  return SECTION5_CHILD_PROFILES.find((row) => row.family_codes.includes(family)) || null;
}

export function section8ChildForRow(row = {}) {
  const stream_scope = String(row.stream_type || "").toUpperCase() === "PRIMARY" ? "PRIMARY" : "OVERLAY";
  const material_status = String(row.evaluation_status || row.final_material_status || "").toUpperCase();
  return SECTION8_CHILD_PROFILES.find((profile) => profile.stream_scope === stream_scope && profile.material_status === material_status) || null;
}

function child(artifact_name, profile_id, public_title, family_codes) {
  return Object.freeze({ artifact_name, profile_id, public_title, section_id: "05", family_codes: Object.freeze(family_codes) });
}

function exposureChild(artifact_name, profile_id, public_title, stream_scope, material_status, public_status_label) {
  return Object.freeze({ artifact_name, profile_id, public_title, section_id: "08", stream_scope, material_status, public_status_label });
}
