import { buildNormalizedProfilerOutput, NORMALIZED_SECTION_KEYS } from "./normalized-profiler.js";

export function compileFinalOutputHandoff({ run, artifacts }) {
  const output = buildNormalizedProfilerOutput({ run, artifacts });
  const final = output.final_output_handoff?.final_output_handoff || {};

  output.final_output_handoff = {
    final_output_handoff: {
      ...final,
      normalized_report_manifest: output.normalized_report_manifest,
      vault_section_handoff: output.vault_section_handoff,
      normalized_sections: Object.fromEntries(
        NORMALIZED_SECTION_KEYS.map((sectionId) => [
          sectionId,
          output[`normalized_section__${sectionId}`]
        ])
      ),
      compiler_trace: {
        compiler_version: "normalized_profiler_compiler_replacement_v1",
        deterministic_only: true,
        no_new_findings_created: true,
        no_row_re_evaluation: true,
        legacy_profiles_combined_retired: true,
        legacy_forensics_combined_retired: true,
        normalized_section_count: NORMALIZED_SECTION_KEYS.length
      }
    }
  };

  return output;
}
