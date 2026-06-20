export const STAGE5D_OUTPUT_VERSION = "stage5d_target_feature_profile_integrator_v2";

export const TARGET_FEATURE_PROFILE_HANDOFF_KEYS = Object.freeze([
  "feature_profile_version",
  "target_profile_ref",
  "feature_inventory",
  "product_feature_map",
  "data_provenance_map",
  "regulated_surface_map",
  "architecture_hints",
  "classification_quality",
  "unresolved_feature_candidates",
  "commercial_scan",
  "vault_feature_candidates",
  "evidence",
  "limitations"
]);

export const STAGE5D_INTERNAL_ONLY_FIELDS = Object.freeze([
  "complete_feature_records",
  "feature_records",
  "feature_data_touchpoints",
  "data_touchpoints",
  "data_provenance_seeds",
  "regulated_surface_seeds",
  "vault_question_seeds",
  "feature_unknowns",
  "supplemental_evidence_windows",
  "feature_evidence_windows",
  "inherited_feature_evidence_windows",
  "prompt_input",
  "substage_outputs",
  "custody_manifest",
  "forensic_log",
  "validation"
]);

export const STAGE5D_REINVESTIGATION_STATUS = "REINVESTIGATION_REQUIRED";

export const STAGE5D_FIELD_DERIVATION_RULES = Object.freeze({
  feature_inventory: "Derived only from 5C complete_feature_records. Old 5C/5D internals must not leak into this array.",
  product_feature_map: "Preserved as an empty legacy compatibility alias until downstream contract changes are explicitly approved.",
  data_provenance_map: "Flattened from 5C complete_feature_records[].data_provenance with evidence_refs mapped from source_window_refs.",
  regulated_surface_map: "Flattened from 5B surface_tokens carried through 5C complete records; basis must cite evidence-window-backed tagging logic.",
  commercial_scan: "Derived from final feature_inventory and source custody coverage; never from metadata-only source lists.",
  evidence: "field_evidence_refs must cite source windows, not indexes, source URLs, or placeholder refs.",
  classification_quality: "PASS only when all prior substages validate. REINVESTIGATION_REQUIRED when any substage asks for broader source-window review."
});

export const STAGE5D_VALIDATION_RULES = Object.freeze([
  "Validate all source windows against full clean_text_lossless custody before handoff assembly.",
  "Validate exact downstream top-level keys and feature_profile_v2 version.",
  "Validate internal merged-5C fields do not leak into target_feature_profile or feature_inventory rows.",
  "If recoverable validation fails, emit classification_quality.reinvestigation_required=true instead of failing the Stage 5 runtime.",
  "Only missing/invalid primary lossless source custody remains a hard source-custody stop."
]);

export const STAGE5D_REINVESTIGATION_RULES = Object.freeze({
  status: STAGE5D_REINVESTIGATION_STATUS,
  output_contract: "Preserve exact target_feature_profile top-level shape even when reinvestigation is required.",
  permitted_empty_arrays_when_reinvestigating: Object.freeze([
    "feature_inventory",
    "data_provenance_map",
    "regulated_surface_map"
  ]),
  required_fields_when_reinvestigating: Object.freeze([
    "classification_quality.reinvestigation_required",
    "classification_quality.reinvestigation_requests",
    "unresolved_feature_candidates",
    "evidence.unresolved_questions",
    "limitations"
  ])
});

export const STAGE5D_DICTIONARY = Object.freeze({
  substage: "5D",
  purpose: "Final target_feature_profile Integrator",
  output_version: STAGE5D_OUTPUT_VERSION,
  schema_key: "targetFeatureProfile",
  downstream_contract: "target_feature_profile",
  required_top_level_keys: TARGET_FEATURE_PROFILE_HANDOFF_KEYS,
  forbidden_internal_fields: STAGE5D_INTERNAL_ONLY_FIELDS,
  field_derivation_rules: STAGE5D_FIELD_DERIVATION_RULES,
  validation_rules: STAGE5D_VALIDATION_RULES,
  reinvestigation_rules: STAGE5D_REINVESTIGATION_RULES,
  contract_rule: "5C merged feature-record output is internal only. Downstream receives only feature_profile_v2 target_feature_profile."
});
