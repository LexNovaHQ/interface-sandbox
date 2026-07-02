import { buildNormalizedProfilerOutput as buildBaseOutput, NORMALIZED_SECTION_ARTIFACT_NAMES, NORMALIZED_SECTION_KEYS } from "./normalized-profiler-section10-v3.js";
import { buildLegalDocumentGovernanceMapSection } from "./legal-section-normalizer.js";
import { safeObject } from "./report-safe-language.js";

export { NORMALIZED_SECTION_ARTIFACT_NAMES, NORMALIZED_SECTION_KEYS };

export function buildNormalizedProfilerOutput({ run = {}, artifacts = {} } = {}) {
  const output = buildBaseOutput({ run, artifacts });
  const status = output.normalized_report_manifest?.validation_status || run.validation_status || run.status || "LOCKED_WITH_LIMITATIONS";
  const section6 = buildLegalDocumentGovernanceMapSection({ legalCartographyIndex: artifacts.legal_cartography_index, sectionStatus: status });
  output.normalized_section__legal_document_control_review = section6;

  const final = output.final_output_handoff?.final_output_handoff || {};
  const normalizedSections = safeObject(final.normalized_sections);
  normalizedSections.legal_document_control_review = section6;

  output.normalized_report_manifest = {
    ...(output.normalized_report_manifest || {}),
    renderer_contract: { ...(output.normalized_report_manifest?.renderer_contract || {}), section_6_m9_summary_not_raw_index: true },
    section_artifacts: (output.normalized_report_manifest?.section_artifacts || []).map((row) => row.section_id === "legal_document_control_review" ? { ...row, title: section6.section_title, status: section6.section_status } : row)
  };

  output.final_output_handoff = {
    ...output.final_output_handoff,
    final_output_handoff: {
      ...final,
      normalized_sections: normalizedSections,
      normalized_report_manifest: output.normalized_report_manifest,
      terminal_checks: { ...(final.terminal_checks || {}), section_6_m9_summary_not_raw_index: true },
      compiler_trace: { ...(final.compiler_trace || {}), compiler_version: "normalized_profiler_compiler_replacement_v7_m9_summary_section6", section_6_m9_summary_not_raw_index: true }
    }
  };

  return output;
}
