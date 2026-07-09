import { buildPhase7DapReportProjection } from "./phase7-dap-report-projection.js";
import { normalizeExposureTierSections } from "./exposure-tier-normalizer.js";
import { buildNormalizedProfilerOutput, NORMALIZED_SECTION_KEYS } from "./normalized-profiler-m9-section6-v4.js";
import { toMachineStatus } from "./normalized-status.js";
import { validateNormalizedProfilerOutput } from "./normalizer-validator.js";

export function compileFinalOutputHandoff({ run, artifacts }) {
  const compilerArtifacts = withPhase7DapProjection({ run, artifacts });
  const output = normalizeExposureTierSections(buildNormalizedProfilerOutput({ run, artifacts: compilerArtifacts }), compilerArtifacts);
  const final = output.final_output_handoff?.final_output_handoff || {};
  const status = toMachineStatus(final.validation_status || output.normalized_report_manifest?.validation_status || run?.status);

  for (const sectionId of NORMALIZED_SECTION_KEYS) {
    const artifactName = `normalized_section__${sectionId}`;
    const section = output[artifactName] || {};
    output[artifactName] = { ...section, section_status: status, display_section_status: section.display_section_status || section.section_status || status };
  }

  const normalized_sections = Object.fromEntries(NORMALIZED_SECTION_KEYS.map((sectionId) => [sectionId, output[`normalized_section__${sectionId}`]]));
  output.normalized_report_manifest = { ...(output.normalized_report_manifest || {}), validation_status: status, section_artifacts: (output.normalized_report_manifest?.section_artifacts || []).map((row) => ({ ...row, status })) };

  output.final_output_handoff = {
    validation_status: status,
    normalized_report_manifest_ref: "normalized_report_manifest",
    section_artifacts: output.normalized_report_manifest?.section_artifacts || [],
    final_output_handoff: {
      ...final,
      validation_status: status,
      normalized_report_manifest: output.normalized_report_manifest,
      normalized_sections,
      compiler_trace: { ...(final.compiler_trace || {}), compiler_version: "normalized_profiler_compiler_replacement_v10_phase7_dap_batch_projection", deterministic_only: true, no_new_findings_created: true, no_row_re_evaluation: true, normalized_section_count: NORMALIZED_SECTION_KEYS.length, section_6_m9_summary_not_raw_index: true, section_6_legal_cartography_summary_not_raw_index: true, section_6_legal_signal_derivation_profile_summary_present: true, section_789_artifact_split: true, section_10_merged_forensic_annexure: true, no_separate_section_11: true, full_forensic_payload_rendered_inline: false, exposure_tier_carry_forward: true, exposure_tier_sort_locked: true, archived_legacy_outputs_not_emitted: true, phase7_dap_batch_projection_used: true, four_b_four_c_retired_from_runtime: true }
    }
  };
  output.normalizer_validation = validateNormalizedProfilerOutput(output);
  output.final_output_handoff.final_output_handoff.normalizer_validation = output.normalizer_validation;
  return output;
}

function withPhase7DapProjection({ run, artifacts = {} }) {
  const projection = unwrapPhase7Projection(artifacts.phase7_dap_report_projection) || buildPhase7DapReportProjection({ run, artifacts })?.phase7_dap_report_projection;
  if (!projection || projection.artifact_type !== "phase7_dap_report_projection") return artifacts;
  return { ...artifacts, phase7_dap_report_projection: projection };
}

function unwrapPhase7Projection(value) {
  return value?.phase7_dap_report_projection && typeof value.phase7_dap_report_projection === "object" ? value.phase7_dap_report_projection : value?.artifact?.phase7_dap_report_projection || value;
}
