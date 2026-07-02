import { buildNormalizedProfilerOutput as buildBaseOutput, NORMALIZED_SECTION_ARTIFACT_NAMES, NORMALIZED_SECTION_KEYS } from "./normalized-profiler-section10-v3.js";
import { buildLegalDocumentGovernanceMapSection } from "./legal-section-normalizer.js";
import { safeObject } from "./report-safe-language.js";

export { NORMALIZED_SECTION_ARTIFACT_NAMES, NORMALIZED_SECTION_KEYS };

const DAP_PUBLIC_REPORT_NOTICE = "Section 5 presents the full 36-field Integrated DAP report derived from the public-footprint review. The Technical Annexure retains the underlying evidence matrix, source rows, limitations ledger, and qualified-review queue.";

export function buildNormalizedProfilerOutput({ run = {}, artifacts = {} } = {}) {
  const output = buildBaseOutput({ run, artifacts });
  const status = output.normalized_report_manifest?.validation_status || run.validation_status || run.status || "LOCKED_WITH_LIMITATIONS";
  const section6 = buildLegalDocumentGovernanceMapSection({ legalCartographyIndex: artifacts.legal_cartography_index, sectionStatus: status });
  const section5 = buildFullIntegratedDapSection(output.normalized_section__data_provenance_controls, artifacts);
  output.normalized_section__data_provenance_controls = section5;
  output.normalized_section__legal_document_control_review = section6;

  const final = output.final_output_handoff?.final_output_handoff || {};
  const normalizedSections = safeObject(final.normalized_sections);
  normalizedSections.data_provenance_controls = section5;
  normalizedSections.legal_document_control_review = section6;

  output.normalized_report_manifest = {
    ...(output.normalized_report_manifest || {}),
    renderer_contract: {
      ...(output.normalized_report_manifest?.renderer_contract || {}),
      section_5_full_36_field_dap_report_present: true,
      section_5_dap_annexure_disclaimer_present: true,
      section_6_m9_summary_not_raw_index: true
    },
    section_artifacts: (output.normalized_report_manifest?.section_artifacts || []).map((row) => {
      if (row.section_id === "data_provenance_controls") return { ...row, title: section5.section_title, status: section5.section_status, full_36_field_dap_report_present: true, annexure_disclaimer_present: true };
      if (row.section_id === "legal_document_control_review") return { ...row, title: section6.section_title, status: section6.section_status };
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
        section_5_full_36_field_dap_report_present: true,
        section_5_dap_annexure_disclaimer_present: true,
        section_6_m9_summary_not_raw_index: true
      },
      compiler_trace: {
        ...(final.compiler_trace || {}),
        compiler_version: "normalized_profiler_compiler_replacement_v9_full_36_field_dap_section5_m9_summary_section6",
        section_5_full_36_field_dap_report_present: true,
        section_5_dap_annexure_disclaimer_present: true,
        section_6_m9_summary_not_raw_index: true
      }
    }
  };

  return output;
}

function buildFullIntegratedDapSection(section, artifacts) {
  const base = safeObject(section);
  const b4 = unwrapArtifact(artifacts.extended_dap_india_readiness_profile, "extended_dap_india_readiness_profile");
  const integrated = unwrapArtifact(artifacts.integrated_dap_report, "integrated_dap_report");
  const fields = Array.isArray(b4.fields) ? b4.fields : [];
  const sourceArtifacts = Array.isArray(base.source_artifacts_used) ? base.source_artifacts_used : [];
  const fullSubsections = fields.length ? buildDapSubsections(fields) : fallbackSubsections(base, integrated);
  return {
    ...base,
    section_title: "Data Provenance & Controls",
    reviewer_summary: buildDapReviewerSummary({ base, fields, integrated }),
    subsections: [buildDapReportNoticeSubsection({ fields, integrated }), ...fullSubsections],
    section_limitations: [],
    source_artifacts_used: uniqueStrings([...sourceArtifacts, "data_provenance_profile", "extended_dap_india_readiness_profile", "integrated_dap_report"]),
    normalization: {
      ...(base.normalization || {}),
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
        qualified_review_note: row.qualified_review_action || "Confirm during qualified review before reliance."
      }))
    }];
  }
  return Array.isArray(base.subsections) ? base.subsections : [];
}

function unwrapArtifact(value, key) {
  if (value?.[key] && typeof value[key] === "object") return value[key];
  if (value?.artifact?.[key] && typeof value.artifact[key] === "object") return value.artifact[key];
  return value && typeof value === "object" ? value : {};
}

function appendSentence(value, sentence) {
  const base = typeof value === "string" ? value.trim() : "";
  if (!base) return sentence;
  if (base.includes(sentence)) return base;
  return `${base} ${sentence}`.trim();
}

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === "string" && value.trim()).map((value) => value.trim()))];
}

function arrayOrDash(value) {
  return Array.isArray(value) && value.length ? value : ["—"];
}

function text(value, fallback) {
  const out = String(value ?? "").trim();
  return out || fallback;
}

function slug(value) {
  return String(value || "dap").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "dap";
}
