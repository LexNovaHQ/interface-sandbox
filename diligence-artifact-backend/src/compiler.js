import { buildNormalizedProfilerOutput, NORMALIZED_SECTION_KEYS } from "./normalized-profiler.js";
import { toMachineStatus } from "./normalized-status.js";

export function compileFinalOutputHandoff({ run, artifacts }) {
  const output = buildNormalizedProfilerOutput({ run, artifacts });
  const final = output.final_output_handoff?.final_output_handoff || {};
  const status = toMachineStatus(final.validation_status || output.normalized_report_manifest?.validation_status || run?.status);
  const normalized_sections = Object.fromEntries(
    NORMALIZED_SECTION_KEYS.map((sectionId) => [sectionId, output[`normalized_section__${sectionId}`]])
  );

  output.normalized_report_manifest = { ...(output.normalized_report_manifest || {}), validation_status: status };
  output.vault_section_handoff = { ...(output.vault_section_handoff || {}), validation_status: status };

  output.final_output_handoff = {
    validation_status: status,
    normalized_report_manifest_ref: "normalized_report_manifest",
    vault_section_handoff_ref: "vault_section_handoff",
    section_artifacts: output.normalized_report_manifest?.section_artifacts || [],
    final_output_handoff: {
      ...final,
      validation_status: status,
      normalized_report_manifest: output.normalized_report_manifest,
      vault_section_handoff: output.vault_section_handoff,
      normalized_sections,
      compiler_trace: {
        compiler_version: "normalized_profiler_compiler_replacement_v1",
        deterministic_only: true,
        normalized_section_count: NORMALIZED_SECTION_KEYS.length
      }
    }
  };

  return output;
}
