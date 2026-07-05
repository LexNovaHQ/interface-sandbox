import { buildNormalizedProfilerOutput as buildBaseOutput, NORMALIZED_SECTION_ARTIFACT_NAMES, NORMALIZED_SECTION_KEYS } from "./normalized-profiler-section10-v3.js";
import { buildLegalDocumentGovernanceMapSection } from "./legal-section-normalizer.js";
import { buildM10ContactConsentSubsection } from "./m10-contact-consent-section-normalizer.js";
import { safeObject } from "./report-safe-language.js";

export { NORMALIZED_SECTION_ARTIFACT_NAMES, NORMALIZED_SECTION_KEYS };

const DAP_PUBLIC_REPORT_NOTICE = "Section 5 presents the full 36-field Integrated DAP report derived from the public-footprint review. The Technical Annexure retains the underlying evidence matrix, source rows, limitations ledger, and qualified-review queue.";
const COMMERCIAL_AVAILABILITY_QR_NOTE = "Commercial availability posture is a public-footprint signal for QR-014. Confirm beta, pilot, free trial, freemium, paid-production, and private order-form posture during qualified review before document reliance.";

export function buildNormalizedProfilerOutput({ run = {}, artifacts = {} } = {}) {
  const output = buildBaseOutput({ run, artifacts });
  const status = output.normalized_report_manifest?.validation_status || run.validation_status || run.status || "LOCKED_WITH_LIMITATIONS";
  const section4 = buildProductCommercialAvailabilitySection(output.normalized_section__product_activity_ip_profile, artifacts);
  const section6 = buildLegalDocumentGovernanceMapSection({ legalCartographyIndex: artifacts.legal_cartography_index, legalSignalDerivationProfile: artifacts.legal_signal_derivation_profile, sectionStatus: status });
  const section5 = buildFullIntegratedDapSection(output.normalized_section__data_provenance_controls, artifacts);
  output.normalized_section__product_activity_ip_profile = section4;
  output.normalized_section__data_provenance_controls = section5;
  output.normalized_section__legal_document_control_review = section6;

  const final = output.final_output_handoff?.final_output_handoff || {};
  const normalizedSections = safeObject(final.normalized_sections);
  normalizedSections.product_activity_ip_profile = section4;
  normalizedSections.data_provenance_controls = section5;
  normalizedSections.legal_document_control_review = section6;

  output.normalized_report_manifest = {
    ...(output.normalized_report_manifest || {}),
    renderer_contract: {
      ...(output.normalized_report_manifest?.renderer_contract || {}),
      section_4_commercial_availability_posture_subsection_present: true,
      section_5_contact_consent_readiness_subsection_present: true,
      section_5_full_36_field_dap_report_present: true,
      section_5_dap_annexure_disclaimer_present: true,
      section_6_legal_cartography_summary_not_raw_index: true,
      section_6_legal_signal_derivation_profile_summary_present: true
    },
    section_artifacts: (output.normalized_report_manifest?.section_artifacts || []).map((row) => {
      if (row.section_id === "product_activity_ip_profile") return { ...row, title: section4.section_title, status: section4.section_status, commercial_availability_posture_subsection_present: true };
      if (row.section_id === "data_provenance_controls") return { ...row, title: section5.section_title, status: section5.section_status, full_36_field_dap_report_present: true, annexure_disclaimer_present: true, contact_consent_readiness_subsection_present: true };
      if (row.section_id === "legal_document_control_review") return { ...row, title: section6.section_title, status: section6.section_status, legal_signal_derivation_profile_summary_present: true };
      return row;
    })
  };

  output.final_output_handoff = {
    ...output.final_output_handoff,
    final_output_handoff: {
      ...final,
      normalized_sections: normalizedSections,
      normalized_report_manifest: output.normalized_report_manifest,
      terminal_checks: {
        ...(final.terminal_checks || {}),
        section_4_commercial_availability_posture_subsection_present: true,
        section_5_contact_consent_readiness_subsection_present: true,
        section_5_full_36_field_dap_report_present: true,
        section_5_dap_annexure_disclaimer_present: true,
        section_6_legal_cartography_summary_not_raw_index: true,
        section_6_legal_signal_derivation_profile_summary_present: true
      },
      compiler_trace: {
        ...(final.compiler_trace || {}),
        compiler_version: "normalized_profiler_compiler_replacement_v12_section4_commercial_section5_contact_consent_full_dap_section6_legal_signal_profile",
        section_4_commercial_availability_posture_subsection_present: true,
        section_5_contact_consent_readiness_subsection_present: true,
        section_5_full_36_field_dap_report_present: true,
        section_5_dap_annexure_disclaimer_present: true,
        section_6_legal_cartography_summary_not_raw_index: true,
        section_6_legal_signal_derivation_profile_summary_present: true
      }
    }
  };

  return output;
}

function buildProductCommercialAvailabilitySection(section, artifacts) {
  const base = safeObject(section);
  const targetFeatureProfile = unwrapArtifact(artifacts.target_feature_profile, "target_feature_profile");
  const posture = normalizeCommercialAvailabilityPosture(targetFeatureProfile.commercial_availability_posture);
  const baseSubsections = Array.isArray(base.subsections) ? base.subsections.filter((subsection) => subsection?.subsection_id !== "commercial_availability_posture") : [];
  const commercialSubsection = {
    subsection_id: "commercial_availability_posture",
    subsection_title: "Commercial Availability Posture",
    fields: [
      {
        field_id: "commercial_availability_posture",
        label: "Commercial availability posture",
        value: posture,
        source_artifact: "target_feature_profile",
        source_path: "commercial_availability_posture",
        limitation: text(posture.limitation, "Commercial availability posture requires qualified review confirmation."),
        qualified_review_note: COMMERCIAL_AVAILABILITY_QR_NOTE,
        technical_refs: {
          qr_row: "QR-014",
          registry_fields: ["PA.COM.001", "PA.COM.002", "PA.COM.003", "PA.COM.004", "PA.COM.005", "PA.COM.006"]
        }
      }
    ]
  };
  const subsections = baseSubsections.length ? [baseSubsections[0], commercialSubsection, ...baseSubsections.slice(1)] : [commercialSubsection];
  const sourceArtifacts = Array.isArray(base.source_artifacts_used) ? base.source_artifacts_used : [];
  return {
    ...base,
    section_title: base.section_title || "Product, Activity & IP Profile",
    reviewer_summary: appendSentence(base.reviewer_summary, "Commercial availability posture is projected as a dedicated subsection for qualified review."),
    subsections,
    source_artifacts_used: uniqueStrings([...sourceArtifacts, "target_feature_profile"]),
    normalization: {
      ...(base.normalization || {}),
      section_4_commercial_availability_posture_subsection_present: true,
      commercial_availability_posture_source: "target_feature_profile.commercial_availability_posture",
      commercial_availability_registry_family: "PA.COM.*",
      qr_row_supported: "QR-014"
    }
  };
}

function normalizeCommercialAvailabilityPosture(value) {
  const posture = safeObject(value);
  return {
    posture: text(posture.posture, "Not visible in reviewed public materials."),
    free_trial_freemium_signal: text(posture.free_trial_freemium_signal, "No visible free trial, freemium, free-tier, free-credit, or free developer-access signal found in reviewed public materials."),
    beta_pilot_early_access_signal: text(posture.beta_pilot_early_access_signal, "No visible beta, pilot, preview, waitlist, private access, early access, or limited-availability signal found in reviewed public materials."),
    paid_production_enterprise_plan_signal: text(posture.paid_production_enterprise_plan_signal, "No visible paid-production, API pricing, paid-plan, enterprise-plan, request-demo, or sales-assisted commercial signal found in reviewed public materials."),
    evidence_basis: arrayOrDash(posture.evidence_basis),
    limitation: text(posture.limitation, "Commercial availability posture requires qualified review confirmation before draft reliance.")
  };
}

function buildFullIntegratedDapSection(section, artifacts) {
  const base = safeObject(section);
  const b4 = unwrapArtifact(artifacts.extended_dap_india_readiness_profile, "extended_dap_india_readiness_profile");
  const integrated = unwrapArtifact(artifacts.integrated_dap_report, "integrated_dap_report");
  const m10 = unwrapArtifact(artifacts.data_provenance_profile, "data_provenance_profile");
  const fields = Array.isArray(b4.fields) ? b4.fields : [];
  const sourceArtifacts = Array.isArray(base.source_artifacts_used) ? base.source_artifacts_used : [];
  const fullSubsections = fields.length ? buildDapSubsections(fields) : fallbackSubsections(base, integrated);
  return {
    ...base,
    section_title: "Data Provenance & Controls",
    reviewer_summary: appendSentence(buildDapReviewerSummary({ base, fields, integrated }), "Privacy contact routes and consent-manager readiness are projected as a dedicated qualified-review subsection."),
    subsections: [buildDapReportNoticeSubsection({ fields, integrated }), buildM10ContactConsentSubsection(m10), ...fullSubsections],
    section_limitations: [],
    source_artifacts_used: uniqueStrings([...sourceArtifacts, "data_provenance_profile", "extended_dap_india_readiness_profile", "integrated_dap_report"]),
    normalization: {
      ...(base.normalization || {}),
      section_5_contact_consent_readiness_subsection_present: true,
      contact_routes_source: "data_provenance_profile.privacy_governance_contact_accountability_signals[].contact_routes",
      consent_manager_readiness_source: "data_provenance_profile.consent_withdrawal_controls[].consent_manager_readiness",
      section_5_full_36_field_dap_report_present: fields.length === 36,
      section_5_dap_annexure_disclaimer_present: true,
      public_section_is_curated_summary_only: false,
      full_integrated_dap_retained_in_report_body: true,
      full_integrated_dap_technical_evidence_retained_in_annexure: true,
      dap_field_count: fields.length
    }
  };
}

function buildDapReviewerSummary({ base, fields, integrated }) {
  const counts = integrated?.coverage_summary || {};
  const fieldCount = fields.length || Number(counts.actual_4b_fields || 0) || 0;
  const qrCount = Number(integrated?.coverage_summary?.qualified_review_queue_count || 0);
  const summary = `This section presents the full ${fieldCount || 36}-field Integrated DAP report, covering processing scope, activity-data mapping, affected persons, role posture, notice and rights, vendors, transfers, retention, security, incident visibility, and AI-specific controls. ${DAP_PUBLIC_REPORT_NOTICE}`;
  const queue = qrCount ? ` ${qrCount} item(s) remain routed for qualified review before document reliance.` : "";
  return appendSentence(base.reviewer_summary, `${summary}${queue}`);
}

function buildDapReportNoticeSubsection({ fields, integrated }) {
  return {
    subsection_id: "integrated_dap_report_notice",
    subsection_title: "Integrated DAP Report Scope",
    fields: [
      {
        field_id: "integrated_dap_public_report_notice",
        label: "Report body / annexure boundary",
        value: {
          public_report_body: `Full 36-field Integrated DAP report shown below. Fields available: ${fields.length || 0}.`,
          technical_annexure: "Underlying evidence rows, source excerpts, limitations ledger, registry basis, and qualified-review queue remain in the Technical Annexure / Qualified Review materials.",
          derivation_mode: integrated?.derivation_mode || "DETERMINISTIC_COMPILER_NO_MODEL",
          source_boundary: integrated?.source_boundary || "PUBLIC_SOURCE_ONLY"
        },
        limitation: "This section is a public-footprint diligence projection, not legal advice, not a compliance certification, and not a final legal opinion.",
        qualified_review_note: "Review the full 36-field DAP report and the Technical Annexure before relying on any field for draft preparation."
      }
    ]
  };
}

function buildDapSubsections(fields) {
  const grouped = new Map();
  for (const field of fields) {
    const category = text(field.category, "Integrated DAP Findings");
    if (!grouped.has(category)) grouped.set(category, []);
    grouped.get(category).push(field);
  }
  return [...grouped.entries()].map(([category, rows], index) => ({
    subsection_id: `integrated_dap_${String(index + 1).padStart(2, "0")}_${slug(category)}`,
    subsection_title: category,
    fields: rows.map(dapFieldToPublicField)
  }));
}

function dapFieldToPublicField(field) {
  return {
    field_id: text(field.field_id, `dap_field_${field.field_index || ""}`),
    label: `${String(field.field_index || "").padStart(2, "0")}. ${text(field.field_title, field.field_id || "DAP Field")}`,
    value: {
      finding: text(field.finding, field.value_summary || "Not visible in reviewed public materials."),
      factual_basis: text(field.factual_basis, "No specific public-footprint basis was captured for this field."),
      linked_activities: arrayOrDash(field.linked_m8_activity_labels || field.linked_m8_activity_ids),
      linked_data_categories: arrayOrDash(field.linked_data_categories),
      registry_basis: arrayOrDash(field.registry_basis),
      evidence_strength: text(field.evidence_strength, "not_visible"),
      qualified_review_action: text(field.qualified_review_action, "Confirm during qualified review before reliance.")
    },
    limitation: text(field.limitation, "Qualified review required before reliance."),
    qualified_review_note: text(field.qualified_review_action, "Confirm during qualified review before reliance."),
    source_artifact: "extended_dap_india_readiness_profile",
    source_path: `fields.${Math.max(Number(field.field_index || 1) - 1, 0)}`,
    technical_refs: {
      field_id: field.field_id,
      field_index: field.field_index,
      category: field.category,
      source_evidence_count: Array.isArray(field.source_evidence) ? field.source_evidence.length : 0,
      missing_proof_required: Boolean(field.missing_proof_required)
    }
  };
}

function fallbackSubsections(base, integrated) {
  const projectedRows = Array.isArray(integrated?.integrated_table_rows) ? integrated.integrated_table_rows : [];
  if (projectedRows.length) {
    return [{
      subsection_id: "integrated_dap_projection_rows",
      subsection_title: "Integrated DAP Analytical Findings",
      fields: projectedRows.map((row, index) => ({
        field_id: row.normalized_dap_field_id || `integrated_dap_projection_${index + 1}`,
        label: row.review_point || row.integrated_field_group || `Integrated DAP Finding ${index + 1}`,
        value: {
          evidence_summary: row.evidence_summary || "Not visible in reviewed public materials.",
          factual_basis: row.factual_basis || "No specific public-footprint basis was captured for this finding.",
          linked_activities: arrayOrDash(row.linked_m8_activity_ids),
          linked_data_categories: arrayOrDash(row.linked_data_categories),
          evidence_strength: row.evidence_strength || "not_visible",
          qualified_review_action: row.qualified_review_action || "Confirm during qualified review before reliance."
        },
        limitation: row.limitation || "Qualified review required before reliance.",
        qualified_review_note: row.qualified_review_action || "Confirm during qualified review before reliance.",
        source_artifact: "integrated_dap_report",
        source_path: `integrated_table_rows.${index}`
      }))
    }];
  }
  return Array.isArray(base.subsections) ? base.subsections : [];
}

function unwrapArtifact(value, key) { return value?.[key] && typeof value[key] === "object" ? value[key] : value?.artifact?.[key] || value || {}; }
function safeText(value, fallback) { return typeof value === "string" && value.trim() ? value.trim() : fallback; }
function text(value, fallback) { return safeText(value, fallback); }
function arrayOrDash(value) { return Array.isArray(value) && value.length ? value : ["Not visible in reviewed public materials."]; }
function uniqueStrings(values) { return [...new Set(values.filter((value) => typeof value === "string" && value.trim()))]; }
function appendSentence(base, sentence) { const current = typeof base === "string" && base.trim() ? base.trim() : ""; if (!sentence) return current; return current ? `${current} ${sentence}` : sentence; }
function slug(value) { return String(value || "section").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 50) || "section"; }
