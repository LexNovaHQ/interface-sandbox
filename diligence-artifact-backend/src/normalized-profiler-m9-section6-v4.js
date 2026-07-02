import { buildNormalizedProfilerOutput as buildBaseOutput, NORMALIZED_SECTION_ARTIFACT_NAMES, NORMALIZED_SECTION_KEYS } from "./normalized-profiler-section10-v3.js";
import { buildLegalDocumentGovernanceMapSection } from "./legal-section-normalizer.js";
import { safeObject } from "./report-safe-language.js";

export { NORMALIZED_SECTION_ARTIFACT_NAMES, NORMALIZED_SECTION_KEYS };

const DEFAULT_DAP_ANNEXURE_DISCLAIMER = "This public Section 5 is a curated summary of the Integrated DAP review. The full 36-field substantive DAP field base, evidence matrix, limitations, and qualified-review queue are retained in the Technical Annexure / Qualified Review materials.";

export function buildNormalizedProfilerOutput({ run = {}, artifacts = {} } = {}) {
  const output = buildBaseOutput({ run, artifacts });
  const status = output.normalized_report_manifest?.validation_status || run.validation_status || run.status || "LOCKED_WITH_LIMITATIONS";
  const section6 = buildLegalDocumentGovernanceMapSection({ legalCartographyIndex: artifacts.legal_cartography_index, sectionStatus: status });
  const section5 = applyDapAnnexureDisclaimer(output.normalized_section__data_provenance_controls, artifacts.integrated_dap_report);
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
      section_5_dap_annexure_disclaimer_present: true,
      section_6_m9_summary_not_raw_index: true
    },
    section_artifacts: (output.normalized_report_manifest?.section_artifacts || []).map((row) => {
      if (row.section_id === "data_provenance_controls") return { ...row, title: section5.section_title, status: section5.section_status, annexure_disclaimer_present: true };
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
        section_5_dap_annexure_disclaimer_present: true,
        section_6_m9_summary_not_raw_index: true
      },
      compiler_trace: {
        ...(final.compiler_trace || {}),
        compiler_version: "normalized_profiler_compiler_replacement_v8_dap_annexure_notice_m9_summary_section6",
        section_5_dap_annexure_disclaimer_present: true,
        section_6_m9_summary_not_raw_index: true
      }
    }
  };

  return output;
}

function applyDapAnnexureDisclaimer(section, integratedDapArtifact) {
  const base = safeObject(section);
  const disclaimer = dapAnnexureDisclaimer(integratedDapArtifact);
  const existingSubsections = Array.isArray(base.subsections) ? base.subsections : [];
  const filteredSubsections = existingSubsections.filter((subsection) => subsection?.subsection_id !== "dap_annexure_notice");
  const sourceArtifacts = Array.isArray(base.source_artifacts_used) ? base.source_artifacts_used : [];
  return {
    ...base,
    reviewer_summary: appendSentence(base.reviewer_summary, disclaimer),
    subsections: [buildDapAnnexureNoticeSubsection(disclaimer), ...filteredSubsections],
    section_limitations: uniqueStrings([...(Array.isArray(base.section_limitations) ? base.section_limitations : []), disclaimer]),
    source_artifacts_used: uniqueStrings([...sourceArtifacts, "integrated_dap_report"]),
    normalization: {
      ...(base.normalization || {}),
      section_5_dap_annexure_disclaimer_present: true,
      public_section_is_curated_summary_only: true,
      full_integrated_dap_retained_in_annexure: true
    }
  };
}

function buildDapAnnexureNoticeSubsection(disclaimer) {
  return {
    subsection_id: "dap_annexure_notice",
    subsection_title: "Integrated DAP Annexure Notice",
    fields: [
      {
        field_id: "integrated_dap_annexure_disclaimer",
        label: "Full Integrated DAP retained in annexure",
        value: disclaimer,
        source_artifact: "integrated_dap_report",
        source_path: "annexure_disclaimer",
        evidence_refs: [],
        limitation: "",
        qualified_review_note: "Use Section 5 as a curated public summary only; review the Technical Annexure / Qualified Review materials before relying on the full Integrated DAP analysis.",
        technical_refs: {
          full_field_base_location: "Technical Annexure / Qualified Review materials",
          expected_full_field_base_count: 36,
          normalized_profiler_notice: true
        }
      }
    ]
  };
}

function dapAnnexureDisclaimer(value) {
  const integrated = unwrapIntegratedDap(value);
  const candidate = integrated?.normalized_section_projection?.annexure_disclaimer || integrated?.annexure_disclaimer || integrated?.integration_policy?.public_report_disclaimer;
  return typeof candidate === "string" && candidate.trim() ? candidate.trim() : DEFAULT_DAP_ANNEXURE_DISCLAIMER;
}

function unwrapIntegratedDap(value) {
  if (value?.integrated_dap_report && typeof value.integrated_dap_report === "object") return value.integrated_dap_report;
  if (value?.artifact?.integrated_dap_report && typeof value.artifact.integrated_dap_report === "object") return value.artifact.integrated_dap_report;
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
