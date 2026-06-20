import { STAGE5C_DICTIONARY } from "./5c.dictionary.js";

export const STAGE5C_PROMPT_CONTRACT = Object.freeze({
  substage: "5C",
  task: "complete_feature_record_builder",
  primary_evidence_rule: "Use only cited verbatim source windows copied from product-family clean_text_lossless. 5A/5B outputs are context and row ownership, not replacement evidence. Metadata and navigation indexes are reference only.",
  required_behavior: Object.freeze([
    "Build one complete feature record for every 5A admitted function.",
    "Merge old canonical feature inventory and old data-touchpoint extraction into the same feature-wise pass.",
    "Carry 5A inherited feature evidence windows and 5B tag-context windows forward.",
    "Use 5C supplemental DATA_MECHANICS_WINDOW windows for input/output/data-touchpoint fields.",
    "Every material feature/data field must cite source_window_refs.",
    "Use NOT_EVIDENCED when storage, training, sharing, or logging is not expressly evidenced in source windows.",
    "Never cite metadata, URL/title-only records, candidate IDs, or index refs as evidence."
  ]),
  forbidden_behavior: Object.freeze([
    "Do not rediscover products from metadata.",
    "Do not create features not admitted by 5A.",
    "Do not change 5B archetype or surface tags except to carry them into the feature record.",
    "Do not infer storage/training/sharing/logging as true without source-window evidence.",
    "Do not summarize source text as evidence.",
    "Do not use placeholder evidence refs or placeholder URLs."
  ]),
  required_output_shape: Object.freeze({
    complete_feature_records: "array of feature-wise records with mechanics, tags, data_touchpoints, data_provenance, evidence_window_refs, and unknowns",
    feature_unknowns: "array of unresolved feature/data questions",
    data_provenance_seeds: "array derived from complete_feature_records[].data_provenance",
    regulated_surface_seeds: "array derived from 5B surface tags and cited windows",
    vault_question_seeds: "array of follow-up questions for not-evidenced data controls",
    supplemental_evidence_windows: "array of 5C DATA_MECHANICS_WINDOW windows"
  })
});

export function buildStage5CPromptInput({ canonicalInput, stage5a, stage5b, inheritedEvidenceWindows = [], supplementalEvidenceWindows = [], featureInputs = [] } = {}) {
  return {
    substage: "5C",
    task: "complete_feature_record_builder",
    contract: STAGE5C_PROMPT_CONTRACT,
    target_profile_ref: canonicalInput?.target_profile_ref || {},
    upstream_context: {
      admitted_functions: stage5a?.admitted_functions || [],
      feature_tags: stage5b?.feature_tags || [],
      feature_packets_for_5c: stage5b?.feature_packets_for_5c || []
    },
    feature_inputs: featureInputs,
    source_reading_windows: [
      ...inheritedEvidenceWindows,
      ...supplementalEvidenceWindows
    ],
    reference_only: {
      metadata_sidecar: canonicalInput?.reference?.metadata_sidecar || [],
      navigation_index_sidecar: canonicalInput?.reference?.navigation_index_sidecar || []
    },
    dictionary: STAGE5C_DICTIONARY
  };
}
