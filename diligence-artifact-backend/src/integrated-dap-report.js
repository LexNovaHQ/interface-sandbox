const ARTIFACT_NAME = "integrated_dap_report";
const MATRIX_VERSION = "dap_4c_substantive_integrated_projection_v1";
const ANNEXURE_DISCLAIMER = "This public section is a curated summary of the Integrated DAP review. The full 36-field substantive DAP field base, evidence matrix, limitations, and qualified-review queue are retained in the Technical Annexure / Qualified Review materials.";

const SECTION_TITLES = Object.freeze({
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

const FIELD_MAP = Object.freeze({
  assessment_scope: ["scope_and_source_coverage", "Assessment scope and public-footprint boundary", ["market_scope_and_india_relevance", "public_footprint_review_boundary", "jurisdictional_applicability_assumptions"]],
  source_coverage: ["scope_and_source_coverage", "Source coverage and reliance limits", ["public_footprint_review_boundary"]],
  individuals_and_relationships: ["people_and_roles", "Affected persons / data-principal population", ["affected_person_categories", "customer_user_data_principal_relationship", "enterprise_vs_end_user_population_signal"]],
  role_relationship_readiness: ["people_and_roles", "Role and relationship posture", ["role_allocation_candidate", "controller_processor_fiduciary_ambiguity", "customer_vendor_relationship_signal", "role_confirmation_needed_for_docs"]],
  data_categories: ["data_categories_and_outputs", "Data categories and scale signal", ["personal_data_categories_by_activity", "activity_level_data_protection_risk_notes"]],
  generated_output_and_derived_data_treatment: ["data_categories_and_outputs", "Generated output / derived data", ["input_output_and_derived_data_treatment"]],
  sensitive_special_category_signals: ["data_categories_and_outputs", "Sensitive / high-risk data context", ["children_sensitive_and_high_risk_context"]],
  children_minors_signal: ["data_categories_and_outputs", "Children/minors data posture", ["children_sensitive_and_high_risk_context"]],
  collection_sources_and_activity_data_flows: ["flow_and_lifecycle", "Collection/source of personal data", ["activity_to_data_flow_map", "personal_data_categories_by_activity"]],
  processing_operations_lifecycle: ["flow_and_lifecycle", "Processing lifecycle", ["activity_to_data_flow_map", "ai_model_processing_chain_by_activity", "input_output_and_derived_data_treatment"]],
  purpose_use_signals: ["flow_and_lifecycle", "Purpose/use mapping", ["purpose_and_use_mapping", "ai_training_profiling_and_automated_decisioning_review_note"]],
  privacy_notice_visibility: ["notice_and_rights", "Privacy notice and accessibility", ["privacy_notice_surface", "language_accessibility_and_user_control_notes"]],
  lawful_basis_consent_authorization_readiness: ["notice_and_rights", "Consent / lawful basis / authorization", ["consent_authorization_posture", "purpose_and_use_mapping"]],
  consent_withdrawal_controls: ["notice_and_rights", "Withdrawal / revocation", ["withdrawal_deletion_export_routes"]],
  rights_request_routes: ["notice_and_rights", "Rights and grievance route", ["rights_and_grievance_route", "withdrawal_deletion_export_routes"]],
  privacy_governance_contact_accountability_signals: ["governance_and_contracts", "Privacy governance contact / DPO route", ["rights_and_grievance_route", "role_confirmation_needed_for_docs"]],
  contractual_dpa_customer_terms_readiness: ["governance_and_contracts", "DPA/customer terms and role/vendor contract controls", ["role_allocation_candidate", "controller_processor_fiduciary_ambiguity", "customer_vendor_relationship_signal", "role_confirmation_needed_for_docs"]],
  vendor_subprocessor_partner_inventory: ["vendors_and_sharing", "Vendor/subprocessor inventory", ["vendor_and_subprocessor_inventory_visibility"]],
  processor_subprocessor_governance_controls: ["vendors_and_sharing", "Vendor governance controls", ["vendor_and_subprocessor_inventory_visibility", "customer_vendor_relationship_signal"]],
  third_party_disclosure_sharing_controls: ["vendors_and_sharing", "Third-party sharing / disclosure safeguards", ["third_party_sharing_posture", "transfer_safeguard_and_change_notice_gaps"]],
  cross_border_transfer_location_custody: ["transfer_and_retention", "Cross-border transfer and custody", ["cross_border_transfer_and_custody_posture", "hosting_storage_location_visibility", "transfer_safeguard_and_change_notice_gaps"]],
  retention_deletion_return_export_controls: ["transfer_and_retention", "Retention, deletion, export and India log-retention", ["retention_period_visibility", "deletion_return_export_controls", "india_log_retention_cert_in_review_note"]],
  security_access_controls: ["security_and_incident_visibility", "Security and access-control posture", ["security_control_visibility", "access_control_and_internal_governance_posture", "security_certification_and_policy_reliance_limits"]],
  breach_incident_readiness: ["security_and_incident_visibility", "Incident and breach readiness", ["incident_breach_response_visibility", "india_log_retention_cert_in_review_note"]],
  ai_model_provider_processing_chain: ["ai_specific_controls", "AI model provider processing chain", ["ai_model_processing_chain_by_activity", "activity_to_data_flow_map"]],
  ai_training_finetuning_model_improvement_controls: ["ai_specific_controls", "Training/fine-tuning/model improvement controls", ["ai_training_profiling_and_automated_decisioning_review_note", "purpose_and_use_mapping"]],
  embeddings_vector_memory_controls: ["ai_specific_controls", "Embeddings/vector memory controls", ["input_output_and_derived_data_treatment", "ai_model_processing_chain_by_activity"]],
  prompt_output_logging_telemetry_controls: ["ai_specific_controls", "Prompt/output logs and telemetry", ["logging_telemetry_and_audit_trail_posture", "ai_training_profiling_and_automated_decisioning_review_note"]],
  automated_decision_profiling_human_review_signal: ["automated_decisioning", "Automated decisioning / high-risk human review", ["ai_training_profiling_and_automated_decisioning_review_note", "children_sensitive_and_high_risk_context"]],
  privacy_accountability_documentation_signals: ["readiness_and_gaps", "Privacy accountability documentation / DPIA / audit", ["role_confirmation_needed_for_docs", "security_certification_and_policy_reliance_limits"]],
  law_regulatory_readiness_matrix: ["readiness_and_gaps", "Regulatory readiness matrix", ["jurisdictional_applicability_assumptions", "privacy_notice_surface", "consent_authorization_posture", "cross_border_transfer_and_custody_posture", "incident_breach_response_visibility"]],
  missing_proof_and_diligence_requests: ["readiness_and_gaps", "Missing proof / qualified review queue", ["role_confirmation_needed_for_docs", "transfer_safeguard_and_change_notice_gaps", "india_log_retention_cert_in_review_note", "children_sensitive_and_high_risk_context"]],
  limitations: ["readiness_and_gaps", "Data/control review limitations", ["public_footprint_review_boundary", "role_confirmation_needed_for_docs"]]
});

export function buildIntegratedDapReport({ run = {}, artifacts = {} } = {}) {
  return buildIntegratedDapProjection({ run, artifacts });
}

export function projectIntegratedDapProfileForNormalizedSection({ artifacts = {} } = {}) {
  return buildIntegratedDapProjection({ artifacts })[ARTIFACT_NAME].normalized_profile_overlay;
}

export function buildIntegratedDapProjection({ run = {}, artifacts = {} } = {}) {
  const m10 = unwrap(artifacts.data_provenance_profile, "data_provenance_profile");
  const m8 = unwrap(artifacts.target_feature_profile, "target_feature_profile");
  const b4 = unwrap(artifacts.extended_dap_india_readiness_profile, "extended_dap_india_readiness_profile");
  const b4Fields = Array.isArray(b4.fields) ? b4.fields : [];
  const b4ById = Object.fromEntries(b4Fields.map((field) => [field.field_id, field]));
  const activities = normalizeActivities(m8);
  const dataCategories = collectDataCategories(m10, b4Fields);
  const rows = Object.entries(FIELD_MAP).map(([fieldId, [subsection_id, review_point, b4FieldIds]]) => buildIntegratedRow({ fieldId, subsection_id, review_point, b4FieldIds, b4ById, m10, activities, dataCategories }));
  const subsections = Object.entries(SECTION_TITLES).map(([subsection_id, subsection_title]) => ({
    subsection_id,
    subsection_title,
    fields: rows.filter((row) => row.subsection_id === subsection_id).map((row) => ({
      field_id: row.normalized_dap_field_id,
      integrated_field_group: row.integrated_field_group,
      render_rows: [row]
    }))
  }));
  const review = rows.filter((row) => row.qualified_review_action !== "No action required");
  const lock = b4Fields.length === 36 && rows.length === Object.keys(FIELD_MAP).length ? (review.length ? "LOCKED_WITH_LIMITATIONS" : "LOCKED") : "LOCKED_WITH_LIMITATIONS";
  const normalized_profile_overlay = { ...m10, substantive_4b_field_base: b4Fields, integrated_public_findings: rows, annexure_disclaimer: ANNEXURE_DISCLAIMER };
  return {
    [ARTIFACT_NAME]: {
      artifact_type: ARTIFACT_NAME,
      profile_version: "integrated_dap_projection_v3_substantive_m8_4b",
      run_id: run.run_id || "UNKNOWN_RUN",
      generated_at: new Date().toISOString(),
      derivation_mode: "DETERMINISTIC_COMPILER_NO_MODEL",
      source_boundary: "PUBLIC_SOURCE_ONLY",
      report_title: "Integrated Data Architecture & Privacy Readiness Projection",
      annexure_disclaimer: ANNEXURE_DISCLAIMER,
      status: lock,
      lock_status: lock,
      component_artifacts: ["target_feature_profile", "data_provenance_profile", "data_provenance_profile_forensics", "extended_dap_india_readiness_profile"],
      matrix_version: MATRIX_VERSION,
      integration_policy: {
        m8_role: "activity_and_product_context",
        m10_role: "base_data_provenance_profile",
        four_b_role: "substantive_data_protection_field_base",
        public_report_body_uses_analytical_findings_not_machine_signal_rows: true,
        full_field_base_for_annexure_and_qualified_review: true,
        public_report_disclaimer: ANNEXURE_DISCLAIMER
      },
      field_matrix: Object.entries(FIELD_MAP).map(([field_id, [subsection_id, group, b4_field_ids]]) => ({ section_id: "data_provenance_controls", subsection_id, normalized_dap_field_id: field_id, integrated_field_group: group, b4_field_ids })),
      coverage_summary: {
        expected_4b_fields: 36,
        actual_4b_fields: b4Fields.length,
        m8_activity_count: activities.length,
        data_category_count: dataCategories.length,
        normalized_subsection_count: subsections.length,
        row_count: rows.length,
        qualified_review_queue_count: review.length,
        evidence_strength_counts: countBy(rows, (row) => row.evidence_strength)
      },
      normalized_section_projection: {
        section_id: "data_provenance_controls",
        section_title: "Data Provenance & Controls",
        projection_rule: "4C integrates M8 activity context, M10 data provenance, and 4B substantive DAP field base into analytical public report findings. Raw 4B field base remains annexure/QR material.",
        annexure_disclaimer: ANNEXURE_DISCLAIMER,
        subsections
      },
      normalized_profile_overlay,
      integrated_table_rows: rows,
      qualified_review_queue: review.map((row, i) => ({ queue_id: `DAP-QR-${String(i + 1).padStart(3, "0")}`, subsection_id: row.subsection_id, integrated_field_group: row.integrated_field_group, review_point: row.review_point, jurisdiction_layer: row.jurisdiction_layer, public_footprint_status: row.public_footprint_status, action: row.qualified_review_action })),
      limitations: limits({ artifacts, b4, rows }),
      validation_quality_control_result: { status: lock === "LOCKED" ? "PASS" : "PASS_WITH_LIMITATION", deterministic: true, model_usage: "NONE_DETERMINISTIC", normalized_section_spine_only: true, no_standalone_india_report_section: true, substance_preserved: true, integrated_m8_and_4b: true, annexure_disclaimer_present: true }
    }
  };
}

function buildIntegratedRow({ fieldId, subsection_id, review_point, b4FieldIds, b4ById, m10, activities, dataCategories }) {
  const fields = b4FieldIds.map((id) => b4ById[id]).filter(Boolean);
  const strength = aggregateStrength(fields);
  const finding = fields.length ? fields.map((field) => field.finding).filter(Boolean).join(" ") : fallbackFinding({ fieldId, review_point, m10, dataCategories, activities });
  const basis = fields.length ? fields.map((field) => field.factual_basis).filter(Boolean).join(" ") : fallbackBasis({ m10, dataCategories, activities });
  const limitation = fields.map((field) => field.limitation).filter(Boolean).join(" ") || (strength === "not_visible" ? "Specific public-footprint evidence was not visible for this item." : "Qualified review required before reliance.");
  const action = fields.map((field) => field.qualified_review_action).filter(Boolean).slice(0, 2).join(" ") || "Confirm during Qualified Review before document assembly reliance";
  return {
    subsection_id,
    subsection: SECTION_TITLES[subsection_id],
    integrated_field_group: review_point,
    normalized_dap_field_id: fieldId,
    row_type: "Integrated analytical finding",
    review_point,
    jurisdiction_layer: "Global + India public-footprint readiness",
    public_footprint_status: statusLabel(strength),
    evidence_summary: `${finding} ${ANNEXURE_DISCLAIMER}`,
    factual_basis: basis,
    annexure_note: ANNEXURE_DISCLAIMER,
    linked_m8_activity_ids: unique(fields.flatMap((field) => field.linked_m8_activity_ids || [])),
    linked_data_categories: unique([...dataCategoriesForField(fields), ...directDataCategoryHints(fieldId, dataCategories)]).slice(0, 8),
    registry_basis: unique(fields.flatMap((field) => field.registry_basis || [])),
    evidence_strength: strength,
    limitation,
    qualified_review_action: strength === "strong" ? `No immediate action from public summary; review full Integrated DAP annexure before reliance.` : `${action} Review the full Integrated DAP annexure before reliance.`
  };
}

function fallbackFinding({ review_point, dataCategories, activities }) {
  const activityText = activities.length ? `${activities.length} M8 activity signal(s)` : "no structured M8 activity signal";
  const dataText = dataCategories.length ? `data categories including ${list(dataCategories.slice(0, 5))}` : "no structured data-category list";
  return `${review_point}: derived from ${activityText} and ${dataText}; no dedicated 4B substantive field was mapped.`;
}
function fallbackBasis({ dataCategories, activities }) {
  return `M8 activity count: ${activities.length}. Data categories visible: ${dataCategories.length ? list(dataCategories.slice(0, 8)) : "not structured"}.`;
}

function normalizeActivities(m8) {
  return (Array.isArray(m8.activities) ? m8.activities : []).map((activity, index) => ({
    activity_id: activity.activity_display_id || activity.activity_id || `ACT-${String(index + 1).padStart(3, "0")}`,
    label: clean(activity.activity_feature_name || activity.related_product_service || activity.publicly_described_activity || activity.activity_summary || `Activity ${index + 1}`)
  }));
}
function collectDataCategories(m10, b4Fields) {
  const values = [];
  for (const key of ["data_categories", "personal_data_categories_by_activity", "sensitive_special_category_signals", "generated_output_and_derived_data_treatment", "prompt_output_logging_telemetry_controls"]) collectPlainValues(m10?.[key], values);
  for (const field of b4Fields) for (const item of field.linked_data_categories || []) values.push(item);
  return unique(values.map(clean).filter(Boolean)).slice(0, 30);
}
function dataCategoriesForField(fields) { return unique(fields.flatMap((field) => field.linked_data_categories || [])); }
function directDataCategoryHints(fieldId, dataCategories) { return fieldId.includes("data") || fieldId.includes("ai") || fieldId.includes("logging") ? dataCategories : []; }

function aggregateStrength(fields) {
  if (!fields.length) return "not_visible";
  if (fields.some((field) => field.evidence_strength === "conflicting")) return "conflicting";
  if (fields.some((field) => field.evidence_strength === "strong")) return "strong";
  if (fields.some((field) => field.evidence_strength === "partial")) return "partial";
  if (fields.some((field) => field.evidence_strength === "weak")) return "weak";
  return "not_visible";
}
function statusLabel(strength) {
  return ({ strong: "Substantively visible in reviewed materials", partial: "Partially visible; requires confirmation", weak: "Weak public signal only", not_visible: "Not visible in reviewed public materials", conflicting: "Conflicting public signals" })[strength] || "Not visible in reviewed public materials";
}
function limits({ artifacts, b4, rows }) {
  const out = ["4C is a deterministic projection layer only. It does not create a legal opinion, compliance certification, DPDP applicability determination, or local counsel conclusion.", ANNEXURE_DISCLAIMER];
  if (!artifacts?.data_provenance_profile) out.push("Base data provenance profile unavailable or incomplete.");
  if (!artifacts?.target_feature_profile) out.push("M8 activity profile unavailable or incomplete.");
  if (!artifacts?.extended_dap_india_readiness_profile) out.push("4B substantive DAP field base unavailable or incomplete.");
  if (Number(b4?.field_count || 0) !== 36) out.push("4B substantive field base did not expose the expected 36 fields.");
  if (!rows.length) out.push("No integrated DAP analytical findings generated.");
  return out;
}
function unwrap(v, k) { return v?.[k] && typeof v[k] === "object" ? v[k] : v?.artifact?.[k] || v || {}; }
function collectPlainValues(value, out) { if (value == null) return; if (["string", "number", "boolean"].includes(typeof value)) { const s = clean(value); if (s) out.push(s); return; } if (Array.isArray(value)) return value.slice(0, 200).forEach((item) => collectPlainValues(item, out)); if (typeof value === "object") return Object.values(value).slice(0, 200).forEach((item) => collectPlainValues(item, out)); }
function countBy(items, fn) { return items.reduce((acc, item) => { const k = fn(item); acc[k] = (acc[k] || 0) + 1; return acc; }, {}); }
function unique(values) { return [...new Set(values.filter(Boolean))]; }
function list(values) { return values.filter(Boolean).join(", "); }
function clean(value) { return String(value || "").replace(/\s+/g, " ").trim(); }
