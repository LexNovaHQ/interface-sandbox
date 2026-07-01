import { buildIntegratedDapProjection } from "./integrated-dap-report.js";
import { buildNormalizedProfilerOutput, NORMALIZED_SECTION_KEYS } from "./normalized-profiler.js";
import { toMachineStatus } from "./normalized-status.js";
import { validateNormalizedProfilerOutput } from "./normalizer-validator.js";

export function compileFinalOutputHandoff({ run, artifacts }) {
  const compilerArtifacts = withIntegratedDapProjection({ run, artifacts });
  const output = buildNormalizedProfilerOutput({ run, artifacts: compilerArtifacts });
  const final = output.final_output_handoff?.final_output_handoff || {};
  const status = toMachineStatus(final.validation_status || output.normalized_report_manifest?.validation_status || run?.status);

  for (const sectionId of NORMALIZED_SECTION_KEYS) {
    const artifactName = `normalized_section__${sectionId}`;
    const section = output[artifactName] || {};
    output[artifactName] = {
      ...section,
      section_status: status,
      display_section_status: section.display_section_status || section.section_status || status
    };
  }

  const normalized_sections = Object.fromEntries(NORMALIZED_SECTION_KEYS.map((sectionId) => [sectionId, output[`normalized_section__${sectionId}`]]));

  output.normalized_report_manifest = {
    ...(output.normalized_report_manifest || {}),
    validation_status: status,
    section_artifacts: (output.normalized_report_manifest?.section_artifacts || []).map((row) => ({ ...row, status }))
  };

  const legacy_archive = {
    profiles_combined: "ARCHIVED_LEGACY",
    forensics_combined: "ARCHIVED_LEGACY",
    old_compiler_blob: "REPLACED_BY_NORMALIZED_SECTION_ARTIFACTS",
    active_replacement: "normalized_report_manifest + normalized_section__*"
  };

  output.final_output_handoff = {
    validation_status: status,
    normalized_report_manifest_ref: "normalized_report_manifest",
    section_artifacts: output.normalized_report_manifest?.section_artifacts || [],
    final_output_handoff: {
      ...final,
      validation_status: status,
      normalized_report_manifest: output.normalized_report_manifest,
      normalized_sections,
      legacy_archive,
      compiler_trace: {
        compiler_version: "normalized_profiler_compiler_replacement_v4_integrated_dap_projection",
        deterministic_only: true,
        no_new_findings_created: true,
        no_row_re_evaluation: true,
        normalized_section_count: NORMALIZED_SECTION_KEYS.length,
        legacy_artifacts_archived: true,
        qualified_review_branch_separate: true,
        data_provenance_controls_source: "integrated_dap_report.normalized_profile_overlay"
      }
    }
  };

  output.normalizer_validation = validateNormalizedProfilerOutput(output);
  output.final_output_handoff.final_output_handoff.normalizer_validation = output.normalizer_validation;

  return output;
}

function withIntegratedDapProjection({ run, artifacts = {} }) {
  const integrated = unwrapIntegratedDap(artifacts.integrated_dap_report);
  const projection = integrated?.normalized_profile_overlay
    ? integrated
    : buildIntegratedDapProjection({ run, artifacts })?.integrated_dap_report;
  if (!projection?.normalized_profile_overlay) return artifacts;
  return {
    ...artifacts,
    integrated_dap_report: projection,
    data_provenance_profile: {
      data_provenance_profile: projection.normalized_profile_overlay
    }
  };
}

function unwrapIntegratedDap(value) {
  return value?.integrated_dap_report && typeof value.integrated_dap_report === "object"
    ? value.integrated_dap_report
    : value?.artifact?.integrated_dap_report || value;
}
