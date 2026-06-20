import { STAGE5_FEATURE_PATTERNS } from "../stage5.dictionary.js";

export const STAGE5A_OUTPUT_VERSION = "stage5a_product_function_discovery_v3";

export const STAGE5A_WINDOW_POLICY = Object.freeze({
  default_radius_chars: 1400,
  min_window_chars: 280,
  max_window_chars: 3600,
  max_windows_per_source_pattern: 1,
  created_by_substage: "5A",
  allowed_window_use: Object.freeze([
    "product_function_admission",
    "core_product_mapping",
    "feature_mechanics",
    "5b_feature_evidence_handoff"
  ])
});

export const STAGE5A_FUNCTION_STATUSES = Object.freeze({
  ADMITTED: "ADMITTED",
  REJECTED: "REJECTED",
  UNCERTAIN: "UNCERTAIN"
});

export const STAGE5A_EVIDENCE_RULES = Object.freeze([
  "5A receives full product-family clean_text_lossless through runtime custody.",
  "5A runtime creates verbatim feature evidence windows from clean_text_lossless.",
  "Metadata and navigation indexes only locate candidate text; they are never evidence.",
  "Every admitted product function must cite source_window_refs that map to exact verbatim windows.",
  "5A must hand verbatim feature evidence windows to 5B; refs alone are insufficient."
]);

export const STAGE5A_FIELD_DERIVATION_RULES = Object.freeze({
  admitted_functions: "Derived from product/API capability language inside 5A FEATURE_CAPABILITY_WINDOW windows only.",
  core_products: "Grouped from admitted_functions.core_product_id/core_product_name; many functions may share one core product.",
  function_name: "Taken from controlled product/function pattern or model adjudication, but must be supported by cited verbatim windows.",
  actor_or_user: "Derived from product mechanics: developer/customer user for API capability; end user/operator for product interaction.",
  input_signal: "Derived from explicit input terms in pattern/window; if weak, reinvestigate with broader product-function windows.",
  system_action: "Derived from explicit action/capability language inside source window.",
  output_or_result: "Derived from explicit output/result language inside source window.",
  rejected_or_uncertain_candidates: "Used for reinvestigation requests; not downstream evidence."
});

export const STAGE5A_REINVESTIGATION_RULES = Object.freeze({
  no_admitted_functions: "Ask for broader product-family source windows from clean_text_lossless before failing Stage 5.",
  missing_source_window_refs: "Ask 5A to re-run product-function admission with valid FEATURE_CAPABILITY_WINDOW refs.",
  metadata_or_index_detected: "Reject the row and request reinvestigation from full source custody.",
  non_verbatim_window: "Request source-window regeneration from clean_text_lossless with offsets and hash."
});

export const STAGE5A_FUNCTION_SCHEMA = Object.freeze({
  required_fields: Object.freeze([
    "function_id",
    "status",
    "core_product_id",
    "core_product_name",
    "function_name",
    "function_type",
    "actor_or_user",
    "input_signal",
    "system_action",
    "output_or_result",
    "why_admitted",
    "source_window_refs"
  ])
});

export const STAGE5A_DICTIONARY = Object.freeze({
  substage: "5A",
  purpose: "Product Function Discovery + Verbatim Feature Evidence Window Handoff",
  output_version: STAGE5A_OUTPUT_VERSION,
  feature_patterns: STAGE5_FEATURE_PATTERNS,
  function_statuses: STAGE5A_FUNCTION_STATUSES,
  window_policy: STAGE5A_WINDOW_POLICY,
  evidence_rules: STAGE5A_EVIDENCE_RULES,
  field_derivation_rules: STAGE5A_FIELD_DERIVATION_RULES,
  reinvestigation_rules: STAGE5A_REINVESTIGATION_RULES,
  function_schema: STAGE5A_FUNCTION_SCHEMA
});
