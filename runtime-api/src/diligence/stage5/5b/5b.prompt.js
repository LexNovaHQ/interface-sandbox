import { STAGE5B_DICTIONARY } from "./5b.dictionary.js";

export function buildStage5BPromptInput({ canonicalInput, stage5a, evidenceWindows } = {}) {
  return {
    substage: "5B",
    task: "archetype_surface_tagging",
    target_profile_ref: canonicalInput?.target_profile_ref || {},
    admitted_functions: stage5a?.admitted_functions || [],
    source_reading_windows: evidenceWindows,
    reference_only: {
      metadata_sidecar: canonicalInput?.reference?.metadata_sidecar || [],
      navigation_index_sidecar: canonicalInput?.reference?.navigation_index_sidecar || []
    },
    dictionary: STAGE5B_DICTIONARY
  };
}
