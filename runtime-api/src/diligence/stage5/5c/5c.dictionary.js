export const STAGE5C_OUTPUT_VERSION = "stage5c_complete_feature_records_v3";

export const STAGE5C_WINDOW_POLICY = Object.freeze({
  supplemental_window_type: "DATA_MECHANICS_WINDOW",
  default_context_radius_chars: 900,
  min_context_window_chars: 600,
  max_context_window_chars: 2600,
  supplemental_used_for: Object.freeze([
    "complete_feature_record",
    "data_touchpoint_extraction",
    "data_provenance_seed",
    "5d_integrator_handoff"
  ])
});

export const STAGE5C_SIGNAL_VALUES = Object.freeze({
  EVIDENCED: "EVIDENCED",
  NOT_EVIDENCED: "NOT_EVIDENCED",
  UNKNOWN: "UNKNOWN"
});

export const STAGE5C_ALLOWED_DATA_CATEGORIES = Object.freeze([
  "audio",
  "text",
  "document",
  "api_payload",
  "conversation",
  "structured_extraction",
  "generated_content"
]);

export const STAGE5C_TOUCHPOINT_TYPES = Object.freeze([
  "input_collection",
  "input_processing",
  "content_transformation",
  "output_generation",
  "agentic_interaction"
]);

export const STAGE5C_DATA_SUBJECTS = Object.freeze([
  "user",
  "customer_end_user",
  "developer",
  "business_customer",
  "unknown"
]);

export const STAGE5C_DIRECTIONS = Object.freeze([
  "inbound",
  "internal_processing",
  "outbound",
  "bidirectional"
]);

export const STAGE5C_EXPLICITNESS = Object.freeze([
  "evidenced",
  "inferred_from_feature_mechanics",
  "not_evidenced"
]);

export const STAGE5C_FAILURE_REASONS = Object.freeze({
  MISSING_5A_OUTPUT: "MISSING_5A_OUTPUT",
  MISSING_5B_TAG: "MISSING_5B_TAG",
  MISSING_5A_WINDOW: "MISSING_5A_WINDOW",
  MISSING_5B_WINDOW: "MISSING_5B_WINDOW",
  MISSING_5C_SUPPLEMENTAL_WINDOW: "MISSING_5C_SUPPLEMENTAL_WINDOW",
  INVALID_SOURCE_WINDOW_REF: "INVALID_SOURCE_WINDOW_REF",
  METADATA_OR_INDEX_AS_EVIDENCE: "METADATA_OR_INDEX_AS_EVIDENCE",
  EMPTY_FEATURE_RECORD: "EMPTY_FEATURE_RECORD"
});

export const STAGE5C_DATA_SIGNAL_TERMS = Object.freeze({
  storage_or_retention_signal: Object.freeze(["store", "stored", "storage", "retain", "retention", "history", "logs", "database"]),
  training_or_finetuning_signal: Object.freeze(["train", "training", "fine-tune", "finetune", "model improvement", "improve our models"]),
  sharing_signal: Object.freeze(["share", "shared", "third party", "subprocessor", "partner", "vendor", "provider"]),
  logging_or_telemetry_signal: Object.freeze(["log", "logs", "telemetry", "monitor", "analytics", "audit trail"])
});

export const STAGE5C_DICTIONARY = Object.freeze({
  substage: "5C",
  output_version: STAGE5C_OUTPUT_VERSION,
  purpose: "Complete Feature Record Builder: merge old 5C canonical feature inventory and old 5D data touchpoints into one evidence-window-backed feature-wise pass.",
  primary_evidence_rule: "5C consumes 5A admitted functions, 5B tags, 5A/5B verbatim windows, and full product-family clean_text_lossless custody. Metadata and indexes are reference only.",
  window_policy: STAGE5C_WINDOW_POLICY,
  signal_values: STAGE5C_SIGNAL_VALUES,
  allowed_data_categories: STAGE5C_ALLOWED_DATA_CATEGORIES,
  touchpoint_types: STAGE5C_TOUCHPOINT_TYPES,
  data_subjects: STAGE5C_DATA_SUBJECTS,
  directions: STAGE5C_DIRECTIONS,
  explicitness: STAGE5C_EXPLICITNESS,
  failure_reasons: STAGE5C_FAILURE_REASONS
});
