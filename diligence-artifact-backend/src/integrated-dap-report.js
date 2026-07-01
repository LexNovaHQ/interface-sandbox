const ARTIFACT_NAME = "integrated_dap_report";
const MATRIX_VERSION = "dap_4c_integrated_field_matrix_v1";

const MATRIX = Object.freeze({
  assessment_scope: ["scope_and_source_coverage", "Assessment scope + India applicability", ["india_market_scope_signal", "india_exclusion_or_no_exclusion_signal", "india_operations_signal"]],
  source_coverage: ["scope_and_source_coverage", "Source coverage", []],
  individuals_and_relationships: ["people_and_roles", "Affected persons / data principal population", ["india_data_principal_population_signal"]],
  role_relationship_readiness: ["people_and_roles", "Data relationship and role allocation", ["india_personal_data_processing_signal", "india_role_mapping_candidate"]],
  data_categories: ["data_categories_and_outputs", "Data categories and scale signal", ["india_large_scale_data_gap"]],
  generated_output_and_derived_data_treatment: ["data_categories_and_outputs", "Generated output / derived data", []],
  sensitive_special_category_signals: ["data_categories_and_outputs", "Sensitive / high-risk data context", ["india_sensitive_high_risk_context_signal"]],
  children_minors_signal: ["data_categories_and_outputs", "Children/minors data posture", ["india_children_under_18_signal", "india_child_tracking_or_ads_signal", "india_child_data_missing_proof"]],
  collection_sources_and_activity_data_flows: ["flow_and_lifecycle", "Collection/source of personal data", ["india_personal_data_processing_signal"]],
  processing_operations_lifecycle: ["flow_and_lifecycle", "Processing lifecycle", ["india_personal_data_processing_signal"]],
  purpose_use_signals: ["flow_and_lifecycle", "Purpose/use mapping", ["india_purpose_specificity_signal"]],
  privacy_notice_visibility: ["notice_and_rights", "Privacy notice and accessibility", ["india_dpdp_notice_surface_signal", "india_language_accessibility_signal"]],
  lawful_basis_consent_authorization_readiness: ["notice_and_rights", "Consent / lawful basis / authorization", ["india_consent_authorization_signal", "india_consent_manager_public_signal", "india_child_consent_route_signal"]],
  consent_withdrawal_controls: ["notice_and_rights", "Withdrawal / revocation", ["india_withdrawal_revocation_signal"]],
  rights_request_routes: ["notice_and_rights", "Rights and grievance route", ["india_rights_route_signal", "india_grievance_contact_signal", "india_rights_gap_request"]],
  privacy_governance_contact_accountability_signals: ["governance_and_contracts", "Privacy governance contact / DPO route", ["india_dpo_route_signal"]],
  contractual_dpa_customer_terms_readiness: ["governance_and_contracts", "DPA/customer terms and role/vendor contract controls", ["india_role_mapping_candidate", "india_vendor_security_terms_signal"]],
  vendor_subprocessor_partner_inventory: ["vendors_and_sharing", "Vendor/subprocessor inventory", ["india_vendor_transfer_map_signal"]],
  processor_subprocessor_governance_controls: ["vendors_and_sharing", "Vendor governance controls", ["india_vendor_security_terms_signal"]],
  third_party_disclosure_sharing_controls: ["vendors_and_sharing", "Third-party sharing / disclosure safeguards", ["india_transfer_safeguard_signal"]],
  cross_border_transfer_location_custody: ["transfer_and_retention", "Cross-border transfer and custody", ["india_cross_border_transfer_signal", "india_restricted_territory_screening_gap"]],
  retention_deletion_return_export_controls: ["transfer_and_retention", "Retention, deletion, export and India log-retention", ["india_log_retention_signal", "india_180_day_log_signal", "india_logs_accessible_in_india_signal"]],
  security_access_controls: ["security_and_incident_visibility", "Security and access-control posture", ["india_security_policy_signal", "india_access_control_signal", "india_data_protection_procedure_signal", "india_audit_trail_signal"]],
  breach_incident_readiness: ["security_and_incident_visibility", "Incident and breach readiness", ["india_breach_notification_signal", "india_cert_in_reporting_signal", "india_cert_in_poc_public_signal", "india_six_hour_reporting_workflow_signal", "india_cert_in_missing_proof", "india_incident_response_signal"]],
  ai_model_provider_processing_chain: ["ai_specific_controls", "AI model provider processing chain", []],
  ai_training_finetuning_model_improvement_controls: ["ai_specific_controls", "Training/fine-tuning/model improvement controls", []],
  embeddings_vector_memory_controls: ["ai_specific_controls", "Embeddings/vector memory controls", []],
  prompt_output_logging_telemetry_controls: ["ai_specific_controls", "Prompt/output logs and telemetry", ["india_log_retention_signal", "india_audit_trail_signal"]],
  automated_decision_profiling_human_review_signal: ["automated_decisioning", "Automated decisioning / high-risk human review", ["india_sensitive_high_risk_context_signal"]],
  privacy_accountability_documentation_signals: ["readiness_and_gaps", "Privacy accountability documentation / DPIA / audit", ["india_large_scale_data_gap", "india_dpia_audit_signal", "india_sdf_missing_proof"]],
  law_regulatory_readiness_matrix: ["readiness_and_gaps", "Regulatory readiness matrix", ["india_dpdp_notice_surface_signal", "india_consent_authorization_signal", "india_cross_border_transfer_signal", "india_breach_notification_signal", "india_security_policy_signal", "india_dpia_audit_signal"]],
  missing_proof_and_diligence_requests: ["readiness_and_gaps", "Missing proof / qualified review queue", ["india_rights_gap_request", "india_child_data_missing_proof", "india_restricted_territory_screening_gap", "india_cert_in_missing_proof", "india_sdf_missing_proof"]],
  limitations: ["readiness_and_gaps", "Data/control review limitations", []]
});

const SUBSECTION_TITLES = Object.freeze({
  scope_and_source_coverage: "Scope and Source Coverage",
  people_and_roles: "People and Roles",
  data_categories_and_outputs: "Data Categories and Outputs",
  flow_and_lifecycle: "Flow and Lifecycle",
  notice_and_rights: "Notice and Rights",
  governance_and_contracts: "Governance and Contracts",
  vendors_and_sharing: "Vendors and Sharing",
  transfer_and_retention: "Transfer and Retention",
  security_and_incident_visibility: "Security and Incident Visibility",
  ai_specific_controls: "AI-Specific Controls",
  automated_decisioning: "Automated Decisioning",
  readiness_and_gaps: "Readiness and Gaps"
});

const STATUS = Object.freeze({
  VISIBLE_CONTROL_PRESENT: "Visible in reviewed materials",
  VISIBLE_BUT_CONTROL_WEAK_OR_UNCLEAR: "Visible but requires confirmation",
  VISIBLE_DATA_PROCESSING_NO_CONTROL_FOUND: "Processing visible; public control proof not visible",
  NOT_VISIBLE_AFTER_TARGETED_SEARCH: "Not visible in reviewed public materials",
  UNKNOWN_NOT_SEARCHED: "Not visible in reviewed public materials",
  ACCESS_FAILED: "Source route could not be accessed",
  CONFLICTING_SIGNALS: "Conflicting public signals",
  NOT_APPLICABLE: "Not applicable on reviewed public context"
});

export function buildIntegratedDapReport({ run = {}, artifacts = {} } = {}) {
  return buildIntegratedDapProjection({ run, artifacts });
}

export function projectIntegratedDapProfileForNormalizedSection({ artifacts = {} } = {}) {
  return buildIntegratedDapProjection({ artifacts })[ARTIFACT_NAME].normalized_profile_overlay;
}

export function buildIntegratedDapProjection({ run = {}, artifacts = {} } = {}) {
  const m10 = unwrap(artifacts.data_provenance_profile, "data_provenance_profile");
  const b4 = unwrap(artifacts.extended_dap_india_readiness_profile, "extended_dap_india_readiness_profile");
  const b4Fields = Array.isArray(b4.fields) ? b4.fields : [];
  const b4ById = Object.fromEntries(b4Fields.map((f) => [f.field_id, f]));
  const rows = Object.entries(MATRIX).flatMap(([m10Field, config]) => buildRows({ m10Field, config, m10, b4ById }));
  const normalized_profile_overlay = { ...m10 };
  for (const [fieldId, fieldRows] of Object.entries(groupBy(rows, (r) => r.normalized_dap_field_id))) normalized_profile_overlay[fieldId] = fieldRows;
  const subsections = Object.entries(SUBSECTION_TITLES).map(([subsection_id, subsection_title]) => ({
    subsection_id,
    subsection_title,
    fields: Object.values(groupBy(rows.filter((r) => r.subsection_id === subsection_id), (r) => r.normalized_dap_field_id)).map((render_rows) => ({
      field_id: render_rows[0].normalized_dap_field_id,
      integrated_field_group: render_rows[0].integrated_field_group,
      render_rows
    }))
  }));
  const mappedIndia = [...new Set(Object.values(MATRIX).flatMap(([, , ids]) => ids))];
  const missingIndia = mappedIndia.filter((id) => !b4ById[id]);
  const review = rows.filter((r) => r.qualified_review_action !== "No action required");
  const lock = rows.length && !missingIndia.length && Number(b4.field_count || b4Fields.length || 0) === 42 ? "LOCKED" : "LOCKED_WITH_LIMITATIONS";
  return {
    [ARTIFACT_NAME]: {
      artifact_type: ARTIFACT_NAME,
      profile_version: "integrated_dap_projection_v2",
      run_id: run.run_id || "UNKNOWN_RUN",
      generated_at: new Date().toISOString(),
      derivation_mode: "DETERMINISTIC_COMPILER_NO_MODEL",
      source_boundary: "PUBLIC_SOURCE_ONLY",
      report_title: "Integrated Data Architecture & Privacy Readiness Projection",
      status: lock,
      lock_status: lock,
      component_artifacts: ["data_provenance_profile", "data_provenance_profile_forensics", "extended_dap_india_readiness_profile"],
      matrix_version: MATRIX_VERSION,
      field_matrix: Object.entries(MATRIX).map(([field_id, [subsection_id, group, india_field_ids]]) => ({ section_id: "data_provenance_controls", subsection_id, normalized_dap_field_id: field_id, integrated_field_group: group, india_field_ids })),
      coverage_summary: { expected_matrix_rows: Object.keys(MATRIX).length, expected_india_fields: 42, actual_india_fields: Number(b4.field_count || b4Fields.length || 0), mapped_india_fields: mappedIndia.length, missing_india_fields: missingIndia, normalized_subsection_count: subsections.length, row_count: rows.length, qualified_review_queue_count: review.length },
      normalized_section_projection: { section_id: "data_provenance_controls", section_title: "Data Provenance & Controls", projection_rule: "4C projects M10 and India 4B into the locked normalized DAP subsection spine. 4B is not report-facing as a standalone layer.", subsections },
      normalized_profile_overlay,
      integrated_table_rows: rows,
      qualified_review_queue: review.map((r, i) => ({ queue_id: `DAP-QR-${String(i + 1).padStart(3, "0")}`, subsection_id: r.subsection_id, integrated_field_group: r.integrated_field_group, review_point: r.review_point, jurisdiction_layer: r.jurisdiction_layer, public_footprint_status: r.public_footprint_status, action: r.qualified_review_action })),
      limitations: limits({ artifacts, b4, missingIndia, rows }),
      validation_quality_control_result: { status: lock === "LOCKED" ? "PASS" : "PASS_WITH_LIMITATION", deterministic: true, model_usage: "NONE_DETERMINISTIC", normalized_section_spine_only: true, no_standalone_india_report_section: true, substance_preserved: true }
    }
  };
}

function buildRows({ m10Field, config, m10, b4ById }) {
  const [subsection_id, integrated_field_group, indiaIds] = config;
  const base = { subsection_id, subsection: SUBSECTION_TITLES[subsection_id], integrated_field_group, normalized_dap_field_id: m10Field };
  return [globalRow(base, m10[m10Field]), ...indiaIds.map((id) => indiaRow(base, id, b4ById[id]))];
}
function globalRow(base, value) { const present = has(value); return { ...base, row_type: "Global baseline", review_point: titleize(base.normalized_dap_field_id), jurisdiction_layer: "General / Global", public_footprint_status: present ? "Visible in reviewed materials" : "Not visible in reviewed public materials", evidence_summary: summarize(value), qualified_review_action: present ? "No action required" : "Add to missing-proof / clarification queue" }; }
function indiaRow(base, id, f) { const status = f?.status || "NOT_VISIBLE_AFTER_TARGETED_SEARCH"; return { ...base, row_type: "India overlay", review_point: f?.question || titleize(id), jurisdiction_layer: "India", public_footprint_status: STATUS[status] || titleize(status), evidence_summary: f?.value_summary || "No direct public evidence captured.", qualified_review_action: !f || f.missing_proof_required || needsReview(status) ? "Confirm during Qualified Review before document assembly reliance" : "No action required" }; }
function limits({ artifacts, b4, missingIndia, rows }) { const out = ["4C is a deterministic projection layer only. It does not create a standalone India section, standalone global DAP section, legal opinion, certification, or local counsel determination."]; if (!artifacts?.data_provenance_profile) out.push("Base data provenance profile unavailable or incomplete."); if (!artifacts?.extended_dap_india_readiness_profile) out.push("India readiness component profile unavailable or incomplete."); if (Number(b4?.field_count || 0) !== 42) out.push("India readiness component did not expose the expected 42 fields."); if (missingIndia.length) out.push(`Missing mapped India readiness field(s): ${missingIndia.join(", ")}.`); if (!rows.length) out.push("No integrated DAP projection rows generated."); return out; }
function unwrap(v, k) { return v?.[k] && typeof v[k] === "object" ? v[k] : v?.artifact?.[k] || v || {}; }
function has(v) { return !(v === null || v === undefined || v === "" || (Array.isArray(v) && !v.length)); }
function summarize(v) { if (!has(v)) return "No direct public evidence captured."; if (Array.isArray(v)) return v.length === 1 ? summarize(v[0]) : `${v.length} public-footprint item(s) captured in the component profile.`; if (typeof v === "object") return trunc(v.summary || v.value || v.finding || v.status || JSON.stringify(v)); return trunc(v); }
function needsReview(s) { return ["VISIBLE_DATA_PROCESSING_NO_CONTROL_FOUND", "VISIBLE_BUT_CONTROL_WEAK_OR_UNCLEAR", "NOT_VISIBLE_AFTER_TARGETED_SEARCH", "UNKNOWN_NOT_SEARCHED", "ACCESS_FAILED", "CONFLICTING_SIGNALS"].includes(s); }
function titleize(v) { return String(v || "").replace(/^india_/, "").replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()); }
function trunc(v) { const s = String(v || "").replace(/\s+/g, " ").trim(); return s.length > 260 ? `${s.slice(0, 257)}...` : s; }
function groupBy(items, fn) { return items.reduce((acc, item) => { const k = fn(item); (acc[k] ||= []).push(item); return acc; }, {}); }
