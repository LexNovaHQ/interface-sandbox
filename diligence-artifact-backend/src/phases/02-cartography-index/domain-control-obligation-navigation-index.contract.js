export const P2E_DOMAIN_CONTROL_OBLIGATION_NAVIGATION_INDEX_JOB_ID = "P2E_DOMAIN_CONTROL_OBLIGATION_NAVIGATION_INDEX";
export const P2E_DOMAIN_CONTROL_OBLIGATION_PUBLIC_LABEL = "Domain Control Obligation Navigation Index";

export const P2E_DOMAIN_CONTROL_OBLIGATION_ARTIFACTS = Object.freeze({
  deterministicMap: "domain_control_obligation_deterministic_map",
  semanticProfile: "domain_control_obligation_semantic_profile",
  finalIndex: "domain_control_obligation_navigation_index"
});

export const P2E_DOMAIN_CONTROL_OBLIGATION_SAVE_ORDER = Object.freeze([
  P2E_DOMAIN_CONTROL_OBLIGATION_ARTIFACTS.deterministicMap,
  P2E_DOMAIN_CONTROL_OBLIGATION_ARTIFACTS.semanticProfile,
  P2E_DOMAIN_CONTROL_OBLIGATION_ARTIFACTS.finalIndex
]);

export const DOMAIN_CONTROL_OBLIGATION_PHASE1_ROOTS = Object.freeze([
  "lossless_root__regulatory_licensing_status",
  "lossless_root__grievance_complaints",
  "lossless_root__security_trust_compliance",
  "lossless_root__data_governance_controls",
  "lossless_root__product_service",
  "lossless_root__platform_feature_solution",
  "lossless_root__pricing_commercial_availability",
  "lossless_root__company_identity",
  "lossless_root__ai_safety_transparency",
  "lossless_root__homepage_landing"
]);

export const DOMAIN_CONTROL_OBLIGATION_LEGAL_INDEX_INPUTS = Object.freeze([
  "legal_cartography_index",
  "legal_signal_derivation_profile"
]);

export const OBLIGATION_SHELL_FIELDS = Object.freeze([
  "obligation_id",
  "obligation_family",
  "linked_activity",
  "exposure_role_context",
  "authority_dependency",
  "obligation_locus",
  "obligation_trigger_timing",
  "control_mechanism_present",
  "control_posture_status",
  "evidence_basis",
  "missing_proof",
  "limitation"
]);

export const LOCATOR_FAMILY_REGISTRY = Object.freeze([
  "REGULATORY_LICENSING_SIGNAL_LOCATOR",
  "REGULATORY_DISCLOSURE_LOCATOR",
  "BANK_PARTNER_SPONSOR_BANK_LOCATOR",
  "COUNTERPARTY_INSTITUTION_LOCATOR",
  "GRIEVANCE_COMPLAINTS_SIGNAL_LOCATOR",
  "NODAL_GRIEVANCE_OFFICER_LOCATOR",
  "OMBUDSMAN_ESCALATION_LOCATOR",
  "COMPLAINTS_ROUTE_LOCATOR",
  "CONSUMER_DISCLOSURE_LOCATOR",
  "CONTROL_MECHANISM_LOCATOR",
  "SAFEGUARDING_CUSTODY_LOCATOR",
  "FINANCIAL_CRIME_PROGRAM_LOCATOR",
  "KEY_FACT_STATEMENT_LOCATOR",
  "MONEY_MOVEMENT_ACTIVITY_LOCATOR",
  "GOVERNANCE_CONTROL_LOCATOR",
  "MODEL_SUPPLY_LICENSING_LOCATOR",
  "HUMAN_OVERSIGHT_LOCATOR"
]);

export const CONTROL_SOURCE_ROUTE_CATALOG = Object.freeze([
  Object.freeze({ route_code: "LICENSING_REGULATORY", source_artifacts: Object.freeze(["lossless_root__regulatory_licensing_status", "lossless_root__company_identity"]) }),
  Object.freeze({ route_code: "COUNTERPARTY_INSTITUTION", source_artifacts: Object.freeze(["lossless_root__regulatory_licensing_status", "lossless_root__homepage_landing"]) }),
  Object.freeze({ route_code: "GRIEVANCE_MACHINERY", source_artifacts: Object.freeze(["lossless_root__grievance_complaints"]) }),
  Object.freeze({ route_code: "CONSUMER_DISCLOSURE", source_artifacts: Object.freeze(["lossless_root__pricing_commercial_availability"]) }),
  Object.freeze({ route_code: "CONTROL_MECHANISM", source_artifacts: Object.freeze(["lossless_root__security_trust_compliance", "lossless_root__data_governance_controls"]) }),
  Object.freeze({ route_code: "REGULATED_ACTIVITY", source_artifacts: Object.freeze(["lossless_root__product_service", "lossless_root__platform_feature_solution"]) }),
  Object.freeze({ route_code: "DATA_FLOW_MECHANICS", source_artifacts: Object.freeze(["lossless_root__docs_api_data_flow", "lossless_root__technical_docs_api"]) }),
  Object.freeze({ route_code: "GOVERNANCE_TRANSPARENCY", source_artifacts: Object.freeze(["lossless_root__ai_safety_transparency"]) })
]);

export const DOMAIN_CONTROL_OBLIGATION_NAVIGATION_INDEX_CONTRACT = Object.freeze({
  job_id: P2E_DOMAIN_CONTROL_OBLIGATION_NAVIGATION_INDEX_JOB_ID,
  public_label: P2E_DOMAIN_CONTROL_OBLIGATION_PUBLIC_LABEL,
  phase_id: "CARTOGRAPHY_INDEX",
  downstream_owner: "DOMAIN_CONTROL_OBLIGATION_PROFILE",
  phase1_input_roots: DOMAIN_CONTROL_OBLIGATION_PHASE1_ROOTS,
  legal_index_inputs: DOMAIN_CONTROL_OBLIGATION_LEGAL_INDEX_INPUTS,
  writes: P2E_DOMAIN_CONTROL_OBLIGATION_SAVE_ORDER,
  final_artifact: P2E_DOMAIN_CONTROL_OBLIGATION_ARTIFACTS.finalIndex,
  route_catalog: CONTROL_SOURCE_ROUTE_CATALOG,
  locator_family_registry: LOCATOR_FAMILY_REGISTRY,
  obligation_shell_fields: OBLIGATION_SHELL_FIELDS,
  boundary: Object.freeze({
    navigation_only: true,
    source_location_only: true,
    obligation_posture_forbidden: true,
    obligation_value_derivation_forbidden: true,
    domain_lock_allowed: false,
    may_narrow_navigation: false,
    contains_lossless_text: false,
    contains_excerpts: false,
    contains_summaries: false,
    contains_profile_answers: false,
    contains_legal_or_compliance_conclusions: false,
    data_provenance_source_index_forbidden: true
  })
});
