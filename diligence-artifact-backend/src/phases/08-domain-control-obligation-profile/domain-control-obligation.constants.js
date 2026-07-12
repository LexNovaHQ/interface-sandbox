export const PHASE8_DOMAIN_CONTROL_OBLIGATION_PHASE_ID = "DOMAIN_CONTROL_OBLIGATION_PROFILE";
export const PHASE8_DOMAIN_CONTROL_OBLIGATION_PHASE_ORDER = 8;
export const PHASE8_DOMAIN_CONTROL_OBLIGATION_PUBLIC_LABEL = "Domain Control Obligation Profile";
export const PHASE8_DOMAIN_CONTROL_OBLIGATION_ROUTE_ID = "ROUTE.PHASE8.DOMAIN_CONTROL_OBLIGATION_PROFILE";
export const PHASE8_DOMAIN_CONTROL_OBLIGATION_BUCKET_ID = "2E_BUCKET_DOMAIN_CONTROL_OBLIGATION";
export const PHASE8_DOMAIN_CONTROL_OBLIGATION_AGENT_ID = "agent_8_domain_control_obligation";

export const DOMAIN_CONTROL_OBLIGATION_CANDIDATE_JOB_ID = "DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY";
export const DOMAIN_CONTROL_OBLIGATION_PROFILE_JOB_ID = "DOMAIN_CONTROL_OBLIGATION_PROFILE";

export const DOMAIN_CONTROL_OBLIGATION_CANDIDATE_ARTIFACT = "domain_control_obligation_candidate_inventory";
export const DOMAIN_CONTROL_OBLIGATION_PROFILE_ARTIFACT = "domain_control_obligation_profile";

export const DOMAIN_CONTROL_OBLIGATION_CANDIDATE_SCHEMA_VERSION = "phase8_dco_candidate_inventory_v1";
export const DOMAIN_CONTROL_OBLIGATION_PROFILE_SCHEMA_VERSION = "phase8_dco_material_profile_v1";

export const DOMAIN_CONTROL_OBLIGATION_CANDIDATE_DERIVATION_MODE =
  "DETERMINISTIC_PACKAGE_SCOPED_OBLIGATION_TRIGGER_MATCHING_P2E_NAVIGATED";
export const DOMAIN_CONTROL_OBLIGATION_PROFILE_DERIVATION_MODE =
  "MODEL_DERIVED_MATERIAL_FIELDS_DETERMINISTIC_MECHANICAL_COMPILATION";

export const DOMAIN_CONTROL_OBLIGATION_SOURCE_LAYERS = Object.freeze([
  "PRIMARY",
  "CAPABILITY_OVERLAY"
]);

export const DOMAIN_CONTROL_OBLIGATION_FORBIDDEN_SOURCE_LAYERS = Object.freeze([
  "REGULATORY_OVERLAY"
]);

export const DOMAIN_CONTROL_OBLIGATION_CANDIDATE_STATUSES = Object.freeze([
  "MATCHED",
  "MATCHED_WITH_MECHANICAL_LIMITATION"
]);

export const DOMAIN_CONTROL_OBLIGATION_CONTROL_MECHANISM_STATUSES = Object.freeze([
  "VISIBLE",
  "NOT_VISIBLE",
  "UNCLEAR"
]);

export const DOMAIN_CONTROL_OBLIGATION_CONTROL_POSTURE_STATUSES = Object.freeze([
  "VISIBLE",
  "PARTIAL",
  "NOT_VISIBLE",
  "UNRESOLVED"
]);

export const DOMAIN_CONTROL_OBLIGATION_REGULATORY_OVERLAY_STATUSES = Object.freeze([
  "CANDIDATE_ONLY"
]);

export const DOMAIN_CONTROL_OBLIGATION_CANDIDATE_FIELDS = Object.freeze([
  "candidate_id",
  "obligation_id",
  "obligation_family",
  "source_layer",
  "source_package_id",
  "catalog_package_id",
  "capability_overlay_id",
  "linked_activity_references",
  "matched_behavior_codes",
  "matched_surface_tokens",
  "registry_key_ref",
  "obligation_catalog_ref",
  "p2e_navigation_route_refs",
  "candidate_status",
  "candidate_limitation"
]);

export const DOMAIN_CONTROL_OBLIGATION_CANDIDATE_TOP_LEVEL_FIELDS = Object.freeze([
  "artifact_type",
  "schema_version",
  "run_id",
  "derivation_mode",
  "source_navigation_index",
  "mounted_package_refs",
  "candidate_count",
  "candidates",
  "inventory_limitations"
]);

export const DOMAIN_CONTROL_OBLIGATION_MODEL_MATERIAL_FIELDS = Object.freeze([
  "normalized_name",
  "what_it_requires",
  "target_specific_obligation_context",
  "authority_dependency",
  "exposure_role_context",
  "obligation_locus",
  "obligation_trigger_timing",
  "expected_control_signal",
  "control_mechanism_present",
  "control_posture_status",
  "evidence_basis",
  "missing_proof",
  "diligence_question",
  "derivation_basis",
  "limitation"
]);

export const DOMAIN_CONTROL_OBLIGATION_MODEL_OUTPUT_ROW_FIELDS = Object.freeze([
  "candidate_id",
  ...DOMAIN_CONTROL_OBLIGATION_MODEL_MATERIAL_FIELDS
]);

export const DOMAIN_CONTROL_OBLIGATION_MECHANICAL_PROFILE_ROW_FIELDS = Object.freeze([
  "candidate_id",
  "obligation_id",
  "obligation_family",
  "source_layer",
  "source_package_id",
  "catalog_package_id",
  "capability_overlay_id",
  "linked_activity_references",
  "matched_behavior_codes",
  "matched_surface_tokens",
  "registry_key_ref",
  "obligation_catalog_ref",
  "p2e_navigation_route_refs",
  "regulatory_overlay_refs"
]);

export const DOMAIN_CONTROL_OBLIGATION_FINAL_ROW_FIELDS = Object.freeze([
  ...DOMAIN_CONTROL_OBLIGATION_MECHANICAL_PROFILE_ROW_FIELDS,
  ...DOMAIN_CONTROL_OBLIGATION_MODEL_MATERIAL_FIELDS
]);

export const DOMAIN_CONTROL_OBLIGATION_DERIVATION_BASIS_FIELDS = Object.freeze([
  "field_id",
  "output_field",
  "conditions_satisfied",
  "trigger_outcome_applied",
  "material_basis",
  "limitation"
]);

export const DOMAIN_CONTROL_OBLIGATION_REGULATORY_OVERLAY_REF_FIELDS = Object.freeze([
  "overlay_id",
  "matched_frameworks",
  "overlay_status"
]);

export const DOMAIN_CONTROL_OBLIGATION_MOUNTED_PACKAGE_REF_FIELDS = Object.freeze([
  "primary_package_id",
  "primary_key_version",
  "capability_overlays",
  "regulatory_overlays"
]);

export const DOMAIN_CONTROL_OBLIGATION_MOUNTED_CAPABILITY_REF_FIELDS = Object.freeze([
  "overlay_id",
  "package_id",
  "key_version"
]);

export const DOMAIN_CONTROL_OBLIGATION_MOUNTED_REGULATORY_REF_FIELDS = Object.freeze([
  "overlay_id",
  "package_id",
  "key_version",
  "framework_links"
]);

export const DOMAIN_CONTROL_OBLIGATION_PROFILE_TOP_LEVEL_FIELDS = Object.freeze([
  "artifact_type",
  "schema_version",
  "run_id",
  "derivation_mode",
  "mounted_taxonomy_ref",
  "obligation_count",
  "obligations",
  "profile_level_limitations"
]);

export const DOMAIN_CONTROL_OBLIGATION_FORBIDDEN_LEGAL_CONCLUSIONS = Object.freeze([
  "LEGAL_APPLICABILITY_CONCLUSION",
  "COMPLIANCE_CONCLUSION",
  "BREACH_CONCLUSION",
  "SATISFACTION_CONCLUSION",
  "REGULATOR_JURISDICTION_CONCLUSION",
  "LICENCE_REQUIREMENT_CONCLUSION",
  "LICENCE_VALIDITY_CONCLUSION",
  "LEGAL_ADEQUACY_CONCLUSION",
  "LIABILITY_CONCLUSION"
]);

export const DOMAIN_CONTROL_OBLIGATION_MATERIAL_FIELD_OWNER = "MODEL";
export const DOMAIN_CONTROL_OBLIGATION_MECHANICAL_FIELD_OWNER = "BACKEND";
export const DOMAIN_CONTROL_OBLIGATION_REGULATORY_OVERLAY_MODE = "ENRICH_EXISTING_ROWS_ONLY";
