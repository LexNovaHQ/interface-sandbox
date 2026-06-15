import { STAGE5A_DICTIONARY } from "./5a.dictionary.js";

export function buildStage5APromptInput({ canonicalInput, sourceWindows, candidateHints } = {}) {
  return {
    substage: "5A",
    task: "product_function_discovery",
    target_profile_ref: canonicalInput?.target_profile_ref || {},
    upstream_profile_reference: canonicalInput?.upstream_profile || {},
    source_reading_windows: sourceWindows,
    candidate_hints: candidateHints,
    reference_only: {
      metadata_sidecar: canonicalInput?.reference?.metadata_sidecar || [],
      navigation_index_sidecar: canonicalInput?.reference?.navigation_index_sidecar || []
    },
    dictionary: STAGE5A_DICTIONARY
  };
}
