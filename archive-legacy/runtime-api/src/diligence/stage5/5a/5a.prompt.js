import { STAGE5A_DICTIONARY } from "./5a.dictionary.js";

export const STAGE5A_PROMPT_CONTRACT = Object.freeze({
  substage: "5A",
  role: "Product Function Discovery",
  primary_evidence_rule: "Use only source_reading_windows copied verbatim from product-family clean_text_lossless as evidence.",
  reference_only_rule: "target profile, metadata sidecar, navigation sidecar, and candidate hints are reference only.",
  forbidden_moves: Object.freeze([
    "Do not admit a product function from metadata alone.",
    "Do not admit a product function from URL/title alone.",
    "Do not use index refs as source evidence.",
    "Do not summarize or rewrite source text as evidence.",
    "Do not create a function without source_window_refs."
  ]),
  required_output: Object.freeze({
    admitted_functions: "Array of product/API functions. Every row must cite source_window_refs.",
    rejected_or_uncertain_candidates: "Array of rejected/uncertain candidate hints with reason.",
    feature_evidence_windows: "Runtime-owned verbatim windows; model may reference but must not rewrite them."
  })
});

export function buildStage5APromptInput({ canonicalInput, sourceWindows, candidateHints } = {}) {
  return {
    substage: "5A",
    task: "product_function_discovery",
    prompt_contract: STAGE5A_PROMPT_CONTRACT,
    target_profile_ref: canonicalInput?.target_profile_ref || {},
    upstream_profile_reference: canonicalInput?.upstream_profile || {},
    source_reading_windows: sourceWindows,
    candidate_hints: candidateHints,
    reference_only: {
      metadata_sidecar: canonicalInput?.reference?.metadata_sidecar || [],
      navigation_index_sidecar: canonicalInput?.reference?.navigation_index_sidecar || []
    },
    dictionary: STAGE5A_DICTIONARY,
    required_response_shape: {
      admitted_functions: [
        {
          function_id: "string",
          status: "ADMITTED",
          core_product_id: "string",
          core_product_name: "string",
          function_name: "string",
          function_type: "string",
          actor_or_user: "string",
          input_signal: "string",
          system_action: "string",
          output_or_result: "string",
          why_admitted: "string",
          source_window_refs: ["window_id"]
        }
      ],
      rejected_or_uncertain_candidates: []
    }
  };
}
