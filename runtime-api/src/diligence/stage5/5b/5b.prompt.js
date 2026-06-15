import { STAGE5B_DICTIONARY } from "./5b.dictionary.js";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

export function buildStage5BPromptInput({ canonicalInput, stage5a, inheritedEvidenceWindows = [], supplementalEvidenceWindows = [], featurePackets = [] } = {}) {
  return {
    substage: "5B",
    task: "archetype_surface_tagging",
    governing_rule: "Tag only from 5A admitted functions and verbatim source windows copied from product-family clean_text_lossless. Metadata, navigation indexes, URLs, titles, and upstream profile fields are reference only and never primary evidence.",
    target_profile_ref: canonicalInput?.target_profile_ref || {},
    upstream_context_reference_only: {
      stage5a_output_version: stage5a?.stage5a_output_version || null,
      admitted_function_count: asArray(stage5a?.admitted_functions).length,
      core_product_count: asArray(stage5a?.core_products).length
    },
    feature_packets: asArray(featurePackets),
    source_reading_windows: [
      ...asArray(inheritedEvidenceWindows),
      ...asArray(supplementalEvidenceWindows)
    ],
    output_contract: {
      feature_tags: [
        {
          function_id: "5A function id",
          core_product_id: "5A core product id",
          archetype_codes: "controlled codes only from dictionary.allowed_archetype_codes",
          surface_tokens: "controlled tokens only from dictionary.allowed_surface_tokens",
          inherited_feature_window_refs: "5A verbatim feature evidence windows used",
          supplemental_tag_window_refs: "5B supplemental verbatim tag-context windows used, if any",
          source_window_refs: "all cited windows supporting the tag decision",
          rationale: "commercially readable rationale tied to cited verbatim windows"
        }
      ]
    },
    prohibitions: [
      "Do not tag from metadata alone.",
      "Do not tag from source URL/title alone.",
      "Do not cite navigation index refs as evidence.",
      "Do not invent archetype codes or surface tokens.",
      "Do not use placeholders for evidence refs.",
      "Do not drop 5A functions. If a function cannot be tagged, emit a tagging_failure."
    ],
    reference_only: {
      metadata_sidecar: canonicalInput?.reference?.metadata_sidecar || [],
      navigation_index_sidecar: canonicalInput?.reference?.navigation_index_sidecar || []
    },
    dictionary: STAGE5B_DICTIONARY
  };
}
