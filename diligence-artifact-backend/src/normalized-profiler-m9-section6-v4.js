import { buildNormalizedProfilerOutput as buildBaseOutput, NORMALIZED_SECTION_ARTIFACT_NAMES, NORMALIZED_SECTION_KEYS } from "./normalized-profiler-section10-v3.js";
import { buildLegalDocumentGovernanceMapSection } from "./legal-section-normalizer.js";
import { buildM10ContactConsentSubsection } from "./m10-contact-consent-section-normalizer.js";
import { buildPhase7DapReportProjection } from "./phase7-dap-report-projection.js";
import { safeObject } from "./report-safe-language.js";

export { NORMALIZED_SECTION_ARTIFACT_NAMES, NORMALIZED_SECTION_KEYS };

const DAP_PUBLIC_REPORT_NOTICE = "Section 5 presents the Phase 7 DAP batch projection derived from the locked 150-field semantic batch set. The Technical Annexure and Qualified Review materials retain the underlying batch rows, route manifest, validation manifest, limitations, and repair queue.";
const COMMERCIAL_AVAILABILITY_QR_NOTE = "Commercial availability posture is a public-footprint signal for QR-014. Confirm beta, pilot, free trial, freemium, paid-production, and private order-form posture during qualified review before document reliance.";

export function buildNormalizedProfilerOutput({ run = {}, artifacts = {} } = {}) {
  const output = buildBaseOutput({ run, artifacts });
  const status = output.normalized_report_manifest?.validation_status || run.validation_status || run.status || "LOCKED_WITH_LIMITATIONS";
  const section4 = buildProductCommercialAvailabilitySection(output.normalized_section__product_activity_ip_profile, artifacts);
  const section6 = buildLegalDocumentGovernanceMapSection({ legalCartographyIndex: artifacts.legal_cartography_index, legalSignalDerivationProfile: artifacts.legal_signal_derivation_profile, sectionStatus: status });
  const section5 = buildPhase7DapSection(output.normalized_section__data_provenance_controls, artifacts, run);
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
      section_5_phase7_dap_batch_projection_present: true,
      section_5_dap_annexure_disclaimer_present: true,
      section_6_legal_cartography_summary_not_raw_index: true,
      section_6_legal_signal_derivation_profile_summary_present: true
    },
    section_artifacts: (output.normalized_report_manifest?.section_artifacts || []).map((row) => {
      if (row.section_id === "product_activity_ip_profile") return { ...row, title: section4.section_title, status: section4.section_status, commercial_availability_posture_subsection_present: true };
      if (row.section_id === "data_provenance_controls") return { ...row, title: section5.section_title, status: section5.section_status, phase7_dap_batch_projection_present: true, annexure_disclaimer_present: true, contact_consent_readiness_subsection_present: true };
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
        section_5_phase7_dap_batch_projection_present: true,
        section_5_dap_annexure_disclaimer_present: true,
        section_6_legal_cartography_summary_not_raw_index: true,
        section_6_legal_signal_derivation_profile_summary_present: true
      },
      compiler_trace: {
        ...(final.compiler_trace || {}),
        compiler_version: "normalized_profiler_compiler_replacement_v13_phase7_dap_batch_projection",
        section_4_commercial_availability_posture_subsection_present: true,
        section_5_contact_consent_readiness_subsection_present: true,
        section_5_phase7_dap_batch_projection_present: true,
        section_5_dap_annexure_disclaimer_present: true,
        section_6_legal_cartography_summary_not_raw_index: true,
        section_6_legal_signal_derivation_profile_summary_present: true,
        four_b_four_c_runtime_retired: true
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
    fields: [{ field_id: "commercial_availability_posture", label: "Commercial availability posture", value: posture, source_artifact: "target_feature_profile", source_path: "commercial_availability_posture", limitation: text(posture.limitation, "Commercial availability posture requires qualified review confirmation."), qualified_review_note: COMMERCIAL_AVAILABILITY_QR_NOTE, technical_refs: { qr_row: "QR-014", registry_fields: ["PA.COM.001", "PA.COM.002", "PA.COM.003", "PA.COM.004", "PA.COM.005", "PA.COM.006"] } }]
  };
  const subsections = baseSubsections.length ? [baseSubsections[0], commercialSubsection, ...baseSubsections.slice(1)] : [commercialSubsection];
  const sourceArtifacts = Array.isArray(base.source_artifacts_used) ? base.source_artifacts_used : [];
  return { ...base, section_title: base.section_title || "Product, Activity & IP Profile", reviewer_summary: appendSentence(base.reviewer_summary, "Commercial availability posture is projected as a dedicated subsection for qualified review."), subsections, source_artifacts_used: uniqueStrings([...sourceArtifacts, "target_feature_profile"]), normalization: { ...(base.normalization || {}), section_4_commercial_availability_posture_subsection_present: true, commercial_availability_posture_source: "target_feature_profile.commercial_availability_posture", commercial_availability_registry_family: "PA.COM.*", qr_row_supported: "QR-014" } };
}

function normalizeCommercialAvailabilityPosture(value) {
  const posture = safeObject(value);
  return { posture: text(posture.posture, "Not visible in reviewed public materials."), free_trial_freemium_signal: text(posture.free_trial_freemium_signal, "No visible free trial, freemium, free-tier, free-credit, or free developer-access signal found in reviewed public materials."), beta_pilot_early_access_signal: text(posture.beta_pilot_early_access_signal, "No visible beta, pilot, preview, waitlist, private access, early access, or limited-availability signal found in reviewed public materials."), paid_production_enterprise_plan_signal: text(posture.paid_production_enterprise_plan_signal, "No visible paid-production, API pricing, paid-plan, enterprise-plan, request-demo, or sales-assisted commercial signal found in reviewed public materials."), evidence_basis: arrayOrDash(posture.evidence_basis), limitation: text(posture.limitation, "Commercial availability posture requires qualified review confirmation before draft reliance.") };
}

function buildPhase7DapSection(section, artifacts, run) {
  const base = safeObject(section);
  const projection = unwrapArtifact(artifacts.phase7_dap_report_projection, "phase7_dap_report_projection") || buildPhase7DapReportProjection({ run, artifacts }).phase7_dap_report_projection;
  const m10 = unwrapArtifact(artifacts.data_provenance_profile, "data_provenance_profile");
  const fields = Array.isArray(projection.rows) ? projection.rows : [];
  const sourceArtifacts = Array.isArray(base.source_artifacts_used) ? base.source_artifacts_used : [];
  const fullSubsections = Array.isArray(projection.subsections) && projection.subsections.length ? projection.subsections : fallbackPhase7Subsections(base);
  return {
    ...base,
    section_title: "Data Provenance & Controls",
    reviewer_summary: appendSentence(buildPhase7DapReviewerSummary({ base, projection }), "Privacy contact routes and consent-manager readiness remain projected as a qualified-review subsection from the M10 profile."),
    subsections: [buildPhase7DapReportNoticeSubsection({ projection }), buildM10ContactConsentSubsection(m10), ...fullSubsections],
    section_limitations: [],
    source_artifacts_used: uniqueStrings([...sourceArtifacts, "data_provenance_profile", "dap_semantic_batch_route_manifest", "dap_semantic_batch_validation_manifest", "data_provenance_profile_semantic_batch_gate", "phase7_dap_report_projection"]),
    normalization: { ...(base.normalization || {}), section_5_contact_consent_readiness_subsection_present: true, contact_routes_source: "data_provenance_profile.privacy_governance_contact_accountability_signals[].contact_routes", consent_manager_readiness_source: "data_provenance_profile.consent_withdrawal_controls[].consent_manager_readiness", section_5_phase7_dap_batch_projection_present: true, section_5_dap_annexure_disclaimer_present: true, public_section_is_curated_summary_only: false, phase7_batch_projection_retained_in_report_body: true, phase7_batch_technical_evidence_retained_in_annexure: true, dap_field_count: fields.length, expected_dap_field_count: projection.expected_field_count || 150, all_fields_covered_once: projection.all_fields_covered_once === true, non_blocking_repair_required: Boolean(projection.non_blocking_repair_required) }
  };
}

function buildPhase7DapReviewerSummary({ base, projection }) {
  const fieldCount = Number(projection.field_count || 0);
  const qrCount = Array.isArray(projection.qualified_review_queue) ? projection.qualified_review_queue.length : 0;
  const summary = `This section presents the Phase 7 DAP batch projection with ${fieldCount || 0} returned field row(s) from the locked 150-field route base. ${DAP_PUBLIC_REPORT_NOTICE}`;
  const queue = qrCount ? ` ${qrCount} item(s) remain routed for qualified review before document reliance.` : "";
  return appendSentence(base.reviewer_summary, `${summary}${queue}`);
}

function buildPhase7DapReportNoticeSubsection({ projection }) {
  return { subsection_id: "phase7_dap_batch_projection_notice", subsection_title: "Phase 7 DAP Batch Projection Scope", fields: [{ field_id: "phase7_dap_batch_projection_notice", label: "Report body / annexure boundary", value: { public_report_body: `Phase 7 DAP batch projection shown below. Returned fields: ${projection.field_count || 0} / ${projection.expected_field_count || 150}.`, technical_annexure: "Underlying semantic batch rows, route manifest, validation manifest, limitations ledger, and qualified-review queue remain in backend artifacts.", derivation_mode: projection.derivation_mode || "DETERMINISTIC_ADAPTER_NO_MODEL", source_boundary: projection.source_boundary || "LOCKED_PHASE7_BATCH_ARTIFACTS", gate_status: projection.gate_status || "LOCKED_WITH_LIMITATIONS", non_blocking_repair_required: Boolean(projection.non_blocking_repair_required) }, limitation: "This section is a public-footprint diligence projection and requires qualified review before reliance.", qualified_review_note: "Review the Phase 7 batch projection and the Technical Annexure before relying on any field for draft preparation." }] };
}

function fallbackPhase7Subsections(base) {
  return Array.isArray(base.subsections) ? base.subsections : [];
}

function unwrapArtifact(value, key) { return value?.[key] && typeof value[key] === "object" ? value[key] : value?.artifact?.[key] || value || {}; }
function safeText(value, fallback) { return typeof value === "string" && value.trim() ? value.trim() : fallback; }
function text(value, fallback) { return safeText(value, fallback); }
function arrayOrDash(value) { return Array.isArray(value) && value.length ? value : ["Not visible in reviewed public materials."]; }
function uniqueStrings(values) { return [...new Set(values.filter((value) => typeof value === "string" && value.trim()))]; }
function appendSentence(base, sentence) { const current = typeof base === "string" && base.trim() ? base.trim() : ""; if (!sentence) return current; return current ? `${current} ${sentence}` : sentence; }
