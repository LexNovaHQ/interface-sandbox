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

export const STAGE5D_DICTIONARY = Object.freeze({
  substage: "5D",
  purpose: "Final target_feature_profile Integrator",
  output_version: STAGE5D_OUTPUT_VERSION,
  schema_key: "targetFeatureProfile",
  downstream_contract: "target_feature_profile",
  required_top_level_keys: TARGET_FEATURE_PROFILE_HANDOFF_KEYS,
  forbidden_internal_fields: STAGE5D_INTERNAL_ONLY_FIELDS,
  contract_rule: "5C merged feature-record output is internal only. Downstream receives only feature_profile_v2 target_feature_profile."
});
