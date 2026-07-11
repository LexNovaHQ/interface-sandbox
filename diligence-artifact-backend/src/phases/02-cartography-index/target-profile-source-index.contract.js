export const P2A_TARGET_PROFILE_SOURCE_INDEX_PHASE_ID = "P2A_TARGET_PROFILE_SOURCE_INDEX";
export const P2A_TARGET_PROFILE_SOURCE_INDEX_PUBLIC_LABEL = "Target Profile Source Index";

export const P2A_TARGET_PROFILE_ARTIFACTS = Object.freeze({
  deterministicMap: "target_profile_deterministic_map",
  semanticProfile: "target_profile_semantic_profile",
  reinvestigationWorkpad: "target_profile_reinvestigation_workpad",
  finalIndex: "target_profile_source_index"
});

export const P2A_TARGET_PROFILE_CONTROL_INPUTS = Object.freeze([
  "source_discovery_handoff",
  "post_phase_1_domain_gate_handoff",
  "source_discovery_matrix_manifest",
  "neutral_evidence_bucket_manifest",
  "adapter_expansion_log",
  "source_family_index",
  "legal_doc_inventory",
  "legal_doc_extraction_index",
  "legal_doc_lossless_validation_manifest"
]);

export const P2A_TARGET_PROFILE_TARGET_ROOT_INPUTS = Object.freeze([
  "lossless_root__homepage_landing",
  "lossless_root__company_identity",
  "lossless_root__contact_notice",
  "lossless_root__pricing_commercial_availability",
  "lossless_root__regulatory_licensing_status",
  "lossless_root__grievance_complaints"
]);

export const P2A_TARGET_PROFILE_SECONDARY_CONTEXT_ROOT_INPUTS = Object.freeze([]);

export const P2A_TARGET_PROFILE_DYNAMIC_READS = Object.freeze(["legal_doc_{DOC_TYPE}"]);

export const P2A_TARGET_PROFILE_READS = Object.freeze([
  ...P2A_TARGET_PROFILE_CONTROL_INPUTS,
  ...P2A_TARGET_PROFILE_TARGET_ROOT_INPUTS,
  ...P2A_TARGET_PROFILE_SECONDARY_CONTEXT_ROOT_INPUTS,
  ...P2A_TARGET_PROFILE_DYNAMIC_READS
]);

export const P2A_TARGET_PROFILE_WRITES = Object.freeze([
  P2A_TARGET_PROFILE_ARTIFACTS.deterministicMap,
  P2A_TARGET_PROFILE_ARTIFACTS.semanticProfile,
  P2A_TARGET_PROFILE_ARTIFACTS.finalIndex
]);

export const P2A_TARGET_PROFILE_OPTIONAL_WRITES = Object.freeze([
  P2A_TARGET_PROFILE_ARTIFACTS.reinvestigationWorkpad
]);

export const P2A_TARGET_PROFILE_SAVE_ORDER = Object.freeze([
  P2A_TARGET_PROFILE_ARTIFACTS.deterministicMap,
  P2A_TARGET_PROFILE_ARTIFACTS.semanticProfile,
  P2A_TARGET_PROFILE_ARTIFACTS.finalIndex
]);

export const P2A_TARGET_PROFILE_MATERIAL_FIELD_INVENTORY = Object.freeze([
  Object.freeze({ field_id: "TP.ID.002", field_key: "target_identity.legal_entity_name", downstream_owner: "TARGET_PROFILE_REVIEW", derivation_authority_refs: Object.freeze(["Diligence_Field_Derivation_Registry.yml"]), locator_families: Object.freeze(["LEGAL_ENTITY_NAME_LOCATOR", "REGISTERED_ENTITY_LOCATOR", "REGULATORY_DISCLOSURE_LOCATOR", "GRIEVANCE_COMPLAINTS_SIGNAL_LOCATOR"]), phase_2a_action: "LOCATE_ONLY", derived_value_forbidden: true }),
  Object.freeze({ field_id: "TP.ID.005", field_key: "target_identity.entity_type", downstream_owner: "TARGET_PROFILE_REVIEW", derivation_authority_refs: Object.freeze(["Diligence_Field_Derivation_Registry.yml"]), locator_families: Object.freeze(["REGISTERED_ENTITY_LOCATOR", "REGULATORY_DISCLOSURE_LOCATOR"]), phase_2a_action: "LOCATE_ONLY", derived_value_forbidden: true }),
  Object.freeze({ field_id: "TP.ID.006", field_key: "target_identity.parent_affiliate_relationship", downstream_owner: "TARGET_PROFILE_REVIEW", derivation_authority_refs: Object.freeze(["Diligence_Field_Derivation_Registry.yml"]), locator_families: Object.freeze(["BANK_PARTNER_SPONSOR_BANK_LOCATOR", "COUNTERPARTY_INSTITUTION_LOCATOR"]), phase_2a_action: "LOCATE_ONLY", derived_value_forbidden: true }),
  Object.freeze({ field_id: "TP.JUR.001", field_key: "jurisdiction_notice.registered_notice_country", downstream_owner: "TARGET_PROFILE_REVIEW", derivation_authority_refs: Object.freeze(["Diligence_Field_Derivation_Registry.yml"]), locator_families: Object.freeze(["REGISTERED_OFFICE_LOCATOR", "REGULATORY_DISCLOSURE_LOCATOR", "GRIEVANCE_COMPLAINTS_SIGNAL_LOCATOR"]), phase_2a_action: "LOCATE_ONLY", derived_value_forbidden: true }),
  Object.freeze({ field_id: "TP.JUR.002", field_key: "jurisdiction_notice.registered_notice_state", downstream_owner: "TARGET_PROFILE_REVIEW", derivation_authority_refs: Object.freeze(["Diligence_Field_Derivation_Registry.yml"]), locator_families: Object.freeze(["REGISTERED_OFFICE_LOCATOR", "REGULATORY_DISCLOSURE_LOCATOR", "GRIEVANCE_COMPLAINTS_SIGNAL_LOCATOR"]), phase_2a_action: "LOCATE_ONLY", derived_value_forbidden: true }),
  Object.freeze({ field_id: "TP.JUR.007", field_key: "target_profile_limitations.jurisdiction_evidence_basis", downstream_owner: "TARGET_PROFILE_REVIEW", derivation_authority_refs: Object.freeze(["Diligence_Field_Derivation_Registry.yml"]), locator_families: Object.freeze(["REGISTERED_OFFICE_LOCATOR", "LEGAL_NOTICE_CONTACT_LOCATOR", "REGULATORY_DISCLOSURE_LOCATOR", "GRIEVANCE_COMPLAINTS_SIGNAL_LOCATOR"]), phase_2a_action: "LOCATE_ONLY", derived_value_forbidden: true }),
  Object.freeze({ field_id: "TP.JUR.008", field_key: "target_profile_limitations.jurisdiction_uncertainty", downstream_owner: "TARGET_PROFILE_REVIEW", derivation_authority_refs: Object.freeze(["Diligence_Field_Derivation_Registry.yml"]), locator_families: Object.freeze(["REGISTERED_OFFICE_LOCATOR", "LEGAL_NOTICE_CONTACT_LOCATOR", "REGULATORY_DISCLOSURE_LOCATOR", "GRIEVANCE_COMPLAINTS_SIGNAL_LOCATOR"]), phase_2a_action: "LOCATE_ONLY", derived_value_forbidden: true }),
  Object.freeze({ field_id: "TP.BIZ.002", field_key: "business_context.primary_customer_type", downstream_owner: "TARGET_PROFILE_REVIEW", derivation_authority_refs: Object.freeze(["Diligence_Field_Derivation_Registry.yml"]), locator_families: Object.freeze(["CUSTOMER_SEGMENT_CONTEXT_LOCATOR", "CONSUMER_DISCLOSURE_LOCATOR", "GRIEVANCE_COMPLAINTS_SIGNAL_LOCATOR"]), phase_2a_action: "LOCATE_ONLY", derived_value_forbidden: true }),
  Object.freeze({ field_id: "TP.BIZ.004", field_key: "business_context.industry_sector", downstream_owner: "TARGET_PROFILE_REVIEW", derivation_authority_refs: Object.freeze(["Diligence_Field_Derivation_Registry.yml"]), locator_families: Object.freeze(["REGULATORY_LICENSING_SIGNAL_LOCATOR", "CONSUMER_DISCLOSURE_LOCATOR", "BANK_PARTNER_SPONSOR_BANK_LOCATOR"]), phase_2a_action: "LOCATE_ONLY", derived_value_forbidden: true }),
  Object.freeze({ field_id: "TP.BIZ.005", field_key: "business_context.regulated_sector_hints", downstream_owner: "TARGET_PROFILE_REVIEW", derivation_authority_refs: Object.freeze(["Diligence_Field_Derivation_Registry.yml"]), locator_families: Object.freeze(["REGULATORY_LICENSING_SIGNAL_LOCATOR", "REGULATORY_DISCLOSURE_LOCATOR", "BANK_PARTNER_SPONSOR_BANK_LOCATOR", "CONSUMER_DISCLOSURE_LOCATOR", "GRIEVANCE_COMPLAINTS_SIGNAL_LOCATOR"]), phase_2a_action: "LOCATE_ONLY", derived_value_forbidden: true }),
  Object.freeze({ field_id: "TP.BIZ.009", field_key: "business_context.public_regulatory_licensing_signal", downstream_owner: "TARGET_PROFILE_REVIEW", derivation_authority_refs: Object.freeze(["Diligence_Field_Derivation_Registry.yml"]), locator_families: Object.freeze(["REGULATORY_LICENSING_SIGNAL_LOCATOR", "REGULATORY_DISCLOSURE_LOCATOR", "BANK_PARTNER_SPONSOR_BANK_LOCATOR", "CONSUMER_DISCLOSURE_LOCATOR"]), phase_2a_action: "LOCATE_ONLY", derived_value_forbidden: true }),
  Object.freeze({ field_id: "TP.BIZ.010", field_key: "business_context.public_grievance_complaints_signal", downstream_owner: "TARGET_PROFILE_REVIEW", derivation_authority_refs: Object.freeze(["Diligence_Field_Derivation_Registry.yml"]), locator_families: Object.freeze(["GRIEVANCE_COMPLAINTS_SIGNAL_LOCATOR", "NODAL_GRIEVANCE_OFFICER_LOCATOR", "OMBUDSMAN_ESCALATION_LOCATOR", "COMPLAINTS_ROUTE_LOCATOR"]), phase_2a_action: "LOCATE_ONLY", derived_value_forbidden: true }),
  Object.freeze({ field_id: "TP.WRAP.008", field_key: "product_service_wrapper.delivery_model_signals.partner_marketplace_intermediary_signal", downstream_owner: "TARGET_PROFILE_REVIEW", derivation_authority_refs: Object.freeze(["Diligence_Field_Derivation_Registry.yml"]), locator_families: Object.freeze(["BANK_PARTNER_SPONSOR_BANK_LOCATOR", "COUNTERPARTY_INSTITUTION_LOCATOR", "REGULATORY_DISCLOSURE_LOCATOR"]), phase_2a_action: "LOCATE_ONLY", derived_value_forbidden: true })
]);

export const P2A_TARGET_PROFILE_ALLOWED_LEGAL_SIGNAL_LOCATOR_FAMILIES = Object.freeze([
  "LEGAL_ENTITY_NAME_LOCATOR",
  "REGISTERED_ENTITY_LOCATOR",
  "CONTRACTING_ENTITY_LOCATOR",
  "LEGAL_NOTICE_CONTACT_LOCATOR",
  "REGISTERED_OFFICE_LOCATOR",
  "GOVERNING_LAW_LOCATOR",
  "COURTS_VENUE_LOCATOR",
  "DISPUTE_RESOLUTION_LOCATOR",
  "NOTICE_DELIVERY_LOCATOR",
  "BILLING_ENTITY_LOCATOR",
  "ENTERPRISE_TERMS_LOCATOR",
  "REGULATORY_LICENSING_SIGNAL_LOCATOR",
  "REGULATORY_DISCLOSURE_LOCATOR",
  "BANK_PARTNER_SPONSOR_BANK_LOCATOR",
  "CONSUMER_DISCLOSURE_LOCATOR",
  "COUNTERPARTY_INSTITUTION_LOCATOR",
  "GRIEVANCE_COMPLAINTS_SIGNAL_LOCATOR",
  "NODAL_GRIEVANCE_OFFICER_LOCATOR",
  "OMBUDSMAN_ESCALATION_LOCATOR",
  "COMPLAINTS_ROUTE_LOCATOR"
]);

export const P2A_TARGET_PROFILE_ALLOWED_TARGET_SUBCATS = Object.freeze([
  "ENTITY_IDENTITY",
  "BRAND_IDENTITY",
  "OPERATOR_IDENTITY",
  "MARKET_POSITIONING",
  "CONTACT_NOTICE",
  "COMMERCIAL_AVAILABILITY",
  "PRICING_SALES",
  "CUSTOMER_SEGMENT",
  "GEOGRAPHY_JURISDICTION",
  "LEGAL_NOTICE_POINTER",
  "LEGAL_TARGET_SIGNAL",
  "REGULATORY_LICENSING_SIGNAL",
  "PUBLIC_REGULATORY_DISCLOSURE",
  "GRIEVANCE_COMPLAINTS_SIGNAL",
  "COMPLAINTS_ESCALATION_ROUTE",
  "COUNTERPARTY_INSTITUTION_SIGNAL",
  "CONSUMER_DISCLOSURE_SIGNAL",
  "LIMITED_PUBLIC_DISCLOSURE"
]);

export const P2A_TARGET_PROFILE_ALLOWED_SIGNAL_FAMILIES = Object.freeze([
  "IDENTITY",
  "CONTACT",
  "COMMERCIAL",
  "MARKET",
  "JURISDICTION_POINTER",
  "LEGAL_NOTICE_POINTER",
  "LEGAL_TARGET_SIGNAL",
  "REGULATORY_OPERATING_CONTEXT",
  "GRIEVANCE_OPERATING_CONTEXT",
  "COUNTERPARTY_INSTITUTION",
  "CONSUMER_DISCLOSURE",
  "MONEY_MOVEMENT_CONTEXT",
  "SOURCE_LIMITATION",
  "UNKNOWN_TARGET_SIGNAL"
]);

export const P2A_TARGET_PROFILE_ALLOWED_CONFIDENCE = Object.freeze(["CLEAR", "PARTIAL", "UNCLEAR"]);

export const P2A_TARGET_PROFILE_DETERMINISTIC_MAP_KEYS = Object.freeze([
  "source_artifacts_read",
  "target_source_coverage_index",
  "target_document_structure_index",
  "material_target_field_locator_map",
  "entity_identity_locator_map",
  "brand_trade_name_locator_map",
  "homepage_positioning_locator_map",
  "contact_route_locator_map",
  "commercial_availability_locator_map",
  "pricing_sales_route_locator_map",
  "customer_segment_context_locator_map",
  "regulatory_licensing_locator_map",
  "grievance_complaints_locator_map",
  "legal_target_signal_locator_map",
  "missing_limited_target_source_map",
  "semantic_label_queue",
  "quality_repair_queue",
  "downstream_rules",
  "lock_status"
]);

export const P2A_TARGET_PROFILE_FINAL_INDEX_KEYS = Object.freeze([
  "source_coverage_index",
  "target_document_structure_index",
  "material_target_field_locator",
  "entity_identity_locator",
  "brand_trade_name_locator",
  "homepage_positioning_locator",
  "contact_route_locator",
  "commercial_availability_locator",
  "pricing_sales_route_locator",
  "customer_segment_context_locator",
  "regulatory_licensing_locator",
  "grievance_complaints_locator",
  "legal_target_signal_locator",
  "priority_target_locator",
  "semantic_navigation_index",
  "missing_limited_target_profile_items",
  "downstream_rules",
  "lock_status"
]);

export const P2A_TARGET_PROFILE_RETIRED_ROOTS_FORBIDDEN = Object.freeze([
  "lossless_root__about_company",
  "lossless_root__legal_identity_notice",
  "lossless_root__operator_entity_signals",
  "lossless_root__supporting_company_signals",
  "lossless_root__security_trust",
  "lossless_root__trust_compliance",
  "lossless_root__support_help",
  "lossless_root__blog_resources",
  "lossless_root__careers_hiring",
  "lossless_root__public_repository_developer_assets",
  "lossless_root__third_party_profiles",
  "lossless_root__technical_docs_api_developer"
]);

export const P2A_TARGET_PROFILE_FORBIDDEN_OUTPUTS = Object.freeze([
  "target_profile",
  "domain_derivation_profile",
  "active_run_package_manifest",
  "feature_candidate_inventory",
  "target_feature_profile",
  "data_privacy_navigation_index",
  "legal_cartography_index",
  "legal_signal_derivation_profile",
  "exposure_registry_profile",
  "challenge_gate",
  "final_output_handoff",
  "renderer_payload"
]);

export const P2A_TARGET_PROFILE_FORBIDDEN_CONCLUSIONS = Object.freeze([
  "license_status",
  "regulatory_compliance_status",
  "is_regulated",
  "applicable_regulator",
  "required_license",
  "license_validity",
  "grievance_compliance_status",
  "ombudsman_required",
  "RBI_applicability",
  "SEBI_applicability",
  "FCA_authorisation_status",
  "grievance_sufficiency",
  "statutory_complaint_obligation"
]);

export const TARGET_PROFILE_SOURCE_INDEX_CONTRACT = Object.freeze({
  phase_id: P2A_TARGET_PROFILE_SOURCE_INDEX_PHASE_ID,
  public_label: P2A_TARGET_PROFILE_SOURCE_INDEX_PUBLIC_LABEL,
  implementation_status: "STEP_1_5_CONTRACT_AND_PHASE1_V5_17_ROOT_SCOPE_LOCKED",
  execution_model: "M9_MODELED_DETERMINISTIC_LED_SEMANTIC_GUIDED_INDEX_ONLY",
  production_entrypoint_switched: false,
  runtime_wired: false,
  purpose: "Build a navigation-only Target Profile Source Index over Phase 1 v5 target-family roots and limited target-relevant legal/regulatory/grievance signal locators. Target Profile values remain derived by Target Profile Review, not Phase 2A.",
  input_contract: Object.freeze({
    contract_version: "P2A_TARGET_PROFILE_INPUT_CONTRACT_v2_PHASE1_V5_17_ROOT",
    phase1_source_contract_required: "PHASE1_V5_MULTI_DOMAIN_UNION_PROBE_17_ROOT",
    reads: P2A_TARGET_PROFILE_READS,
    dynamic_reads: P2A_TARGET_PROFILE_DYNAMIC_READS,
    control_inputs: P2A_TARGET_PROFILE_CONTROL_INPUTS,
    target_family_roots: P2A_TARGET_PROFILE_TARGET_ROOT_INPUTS,
    secondary_context_roots: P2A_TARGET_PROFILE_SECONDARY_CONTEXT_ROOT_INPUTS,
    legal_doc_scope: "TARGET_RELEVANT_LEGAL_SIGNAL_LOCATORS_ONLY",
    legal_doc_signal_locator_families: P2A_TARGET_PROFILE_ALLOWED_LEGAL_SIGNAL_LOCATOR_FAMILIES,
    retired_roots_forbidden: P2A_TARGET_PROFILE_RETIRED_ROOTS_FORBIDDEN,
    old_family_inputs_forbidden: true,
    source_family_index_root_manifest_required: true,
    individual_legal_doc_artifacts_source_of_truth: true,
    multi_domain_union_probe_policy_required: true,
    phase_2a_may_not_lock_domain: true,
    phase_2a_may_not_derive_profile_facts: true
  }),
  material_field_inventory: P2A_TARGET_PROFILE_MATERIAL_FIELD_INVENTORY,
  writes: P2A_TARGET_PROFILE_WRITES,
  optional_writes: P2A_TARGET_PROFILE_OPTIONAL_WRITES,
  save_order: P2A_TARGET_PROFILE_SAVE_ORDER,
  deterministic_map_contract: Object.freeze({ root: P2A_TARGET_PROFILE_ARTIFACTS.deterministicMap, required_keys: P2A_TARGET_PROFILE_DETERMINISTIC_MAP_KEYS, material_target_field_locator_map_required: true, regulatory_licensing_locator_map_required: true, grievance_complaints_locator_map_required: true, legal_target_signal_locator_map_required: true, derived_values_forbidden: true, semantic_label_queue_is_authoritative_for_semantic_coverage: true }),
  semantic_profile_contract: Object.freeze({ root: P2A_TARGET_PROFILE_ARTIFACTS.semanticProfile, row_shape: Object.freeze(["queue_id", "unit_id", "target_subcats", "target_signal_families", "confidence"]), allowed_target_subcats: P2A_TARGET_PROFILE_ALLOWED_TARGET_SUBCATS, allowed_target_signal_families: P2A_TARGET_PROFILE_ALLOWED_SIGNAL_FAMILIES, allowed_confidence: P2A_TARGET_PROFILE_ALLOWED_CONFIDENCE, minimum_required_queue_coverage_ratio: 0.8, fake_coverage_forbidden: true, empty_semantic_output_with_required_rows_status: "REPAIR_REQUIRED" }),
  final_index_contract: Object.freeze({ root: P2A_TARGET_PROFILE_ARTIFACTS.finalIndex, required_keys: P2A_TARGET_PROFILE_FINAL_INDEX_KEYS }),
  forbidden_outputs: P2A_TARGET_PROFILE_FORBIDDEN_OUTPUTS,
  forbidden_conclusions: P2A_TARGET_PROFILE_FORBIDDEN_CONCLUSIONS,
  downstream_consumers: Object.freeze(["TARGET_PROFILE_REVIEW"]),
  next_locked_build_step: "STEP_6_TARGET_PROFILE_SOURCE_INDEX_AGENT_PACKAGE"
});

export function getTargetProfileSourceIndexContract() {
  return TARGET_PROFILE_SOURCE_INDEX_CONTRACT;
}
