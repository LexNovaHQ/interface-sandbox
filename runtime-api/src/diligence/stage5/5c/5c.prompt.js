import { STAGE5C_DICTIONARY } from "./5c.dictionary.js";

export function buildStage5CPromptInput({ canonicalInput, stage5a, stage5b, evidenceWindows } = {}) {
  return {
    substage: "5C",
    task: "complete_feature_record_builder",
    target_profile_ref: canonicalInput?.target_profile_ref || {},
    admitted_functions: stage5a?.admitted_functions || [],
    feature_tags: stage5b?.feature_tags || [],
    source_reading_windows: evidenceWindows,
    reference_only: {
      metadata_sidecar: canonicalInput?.reference?.metadata_sidecar || [],
      navigation_index_sidecar: canonicalInput?.reference?.navigation_index_sidecar || []
    },
    dictionary: STAGE5C_DICTIONARY
  };
}
