export const CANDIDATE_CREATION_LOCATOR_MAPS = Object.freeze([
  "activity_candidate_source_locator_map",
  "product_capability_locator_map",
  "feature_mechanics_locator_map",
  "technical_mechanics_locator_map",
  "api_interaction_locator_map",
  "data_object_interaction_locator_map",
  "integration_action_locator_map",
  "commercial_availability_locator_map",
  "external_action_context_locator_map",
  "input_output_object_context_locator_map"
]);

export const CONTEXT_ONLY_LOCATOR_MAPS = Object.freeze([
  "customer_use_context_locator_map",
  "support_operational_context_locator_map",
  "automation_transparency_context_locator_map",
  "human_control_context_locator_map"
]);

export const BASE_ACTIVITY_EVIDENCE_ROOTS = Object.freeze([
  "lossless_root__product_service",
  "lossless_root__platform_feature_solution",
  "lossless_root__technical_docs_api",
  "lossless_root__docs_api_data_flow",
  "lossless_root__integrations_ecosystem",
  "lossless_root__pricing_commercial_availability",
  "lossless_root__use_case_customer_industry",
  "lossless_root__support_help_resources",
  "lossless_root__ai_safety_transparency"
]);

export const SHARED_ACTIVITY_FIELDS = Object.freeze([
  "activity_reference",
  "product_service_wrapper",
  "activity_feature_name",
  "activity_candidate_summary",
  "mechanics_proof",
  "autonomy_human_control_signal",
  "data_content_object_touched",
  "external_internal_action_signal"
]);

export const DERIVATION_BASIS_FIELDS = Object.freeze([
  "code_or_token",
  "normalized_name",
  "conditions_satisfied",
  "trigger_if_applied",
  "exclude_if_checked",
  "material_basis",
  "limitation"
]);

export const CLASSIFICATION_BLOCK_FIELDS = Object.freeze([
  "package_id",
  "behavior_class_codes",
  "behavior_class_derivation_basis",
  "surface_context_tokens",
  "surface_derivation_basis"
]);

export const OVERLAY_CLASSIFICATION_BLOCK_FIELDS = Object.freeze([
  "package_id",
  "overlay_id",
  "behavior_class_codes",
  "behavior_class_derivation_basis",
  "surface_context_tokens",
  "surface_derivation_basis"
]);

export const COMMERCIAL_AVAILABILITY_FIELDS = Object.freeze([
  "posture",
  "free_trial_freemium_signal",
  "beta_pilot_early_access_signal",
  "paid_production_enterprise_plan_signal",
  "evidence_basis",
  "limitation"
]);

export const PROFILE_TOP_LEVEL_KEYS = Object.freeze([
  "activities",
  "commercial_availability_posture",
  "profile_level_limitations",
  "mounted_taxonomy_ref"
]);

export const FEATURE_CANDIDATE_FIELDS = Object.freeze([
  "candidate_id",
  "canonical_feature_key",
  "candidate_name",
  "candidate_type",
  "candidate_status",
  "activity_route_class",
  "capability_key",
  "source_root",
  "evidence_grounded",
  "mandatory_profile_treatment",
  "merged_raw_hit_ids",
  "source_pointers"
]);

export const SEMANTIC_SUPPORT_RECEIPT_FIELDS = Object.freeze([
  "attempted",
  "status",
  "deterministic_baseline_count",
  "proposal_count",
  "accepted_count",
  "rejected_count",
  "accepted_proposal_ids",
  "rejected_proposals",
  "final_candidate_count",
  "limitations"
]);

export const SEMANTIC_PROPOSAL_FIELDS = Object.freeze([
  "proposal_id",
  "action",
  "target_candidate_ids",
  "proposed_candidates",
  "source_pointers"
]);

export const SEMANTIC_PROPOSED_CANDIDATE_FIELDS = Object.freeze([
  "candidate_name",
  "candidate_type",
  "activity_route_class",
  "capability_key",
  "source_root"
]);

export const SEMANTIC_SUPPORT_ACTIONS = Object.freeze([
  "RECOVER_CANDIDATE",
  "MERGE_CANDIDATES",
  "SPLIT_CANDIDATE",
  "RENAME_CANDIDATE",
  "REJECT_CANDIDATE"
]);

export const SEMANTIC_SUPPORT_STATUSES = Object.freeze([
  "APPLIED",
  "NO_CHANGES",
  "UNAVAILABLE",
  "OUTPUT_REJECTED"
]);

export const FEATURE_CANDIDATE_INVENTORY_ARTIFACT = "feature_candidate_inventory";
export const FEATURE_CANDIDATE_INVENTORY_VERSION = "m8_feature_candidate_inventory_index_v4_deterministic_led_semantic_supported";
export const FEATURE_CANDIDATE_INVENTORY_MODE = "DETERMINISTIC_LED_SEMANTIC_SUPPORTED_FROM_INDEX_MAPPED_LOSSLESS_UNITS_NO_TEXT_COPY";
