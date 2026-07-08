const ACTIVITY_PROFILE_REVIEW_READS = Object.freeze([
  "source_discovery_handoff",
  "target_profile",
  "target_profile_forensics",
  "feature_candidate_inventory",
  "lossless_family__P1_PRODUCT",
  "lossless_family__P2_PLATFORM_FEATURE_SOLUTION",
  "lossless_family__P3_AI_CAPABILITY_TECHNICAL",
  "lossless_family__P4_USE_CASE_INDUSTRY",
  "lossless_family__P5_ENTERPRISE_PRICING"
]);

const ACTIVITY_PROFILE_REVIEW_WRITES = Object.freeze(["target_feature_profile"]);

const ACTIVITY_PROFILE_REVIEW_PROMPT_FILES = Object.freeze([
  "agent-packages/00_SYSTEM_BLOCKING_DOCTRINE.md",
  "agent-packages/agent_3_target_feature/00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED.md",
  "agent-packages/agent_3_target_feature/AGENT3_RUNTIME_BINDING_PACKET.yaml",
  "agent-packages/agent_3_target_feature/03_M8_FEATURE_PROFILE_BACKEND_CURRENT.md",
  "agent-packages/agent_3_target_feature/03A_M8_FEATURE_CANDIDATE_INVENTORY_DETERMINISTIC.md",
  "agent-packages/agent_3_target_feature/00_VALIDATOR_RULES_INTEGRATED.md",
  "agent-packages/agent_3_target_feature/00_VALIDATOR_RULES_M8_FEATURE_INVENTORY_INDEX_ADDENDUM.md",
  "agent-packages/agent_3_target_feature/AGENT3_BACKEND_OUTPUT_CONTRACT.md",
  "agent-packages/agent_3_target_feature/AGENT3_FEATURE_CANDIDATE_INVENTORY_OUTPUT_CONTRACT.md",
  "agent-packages/agent_3_target_feature/00_TERMINAL_RECEIPT_RULES_INTEGRATED.md"
]);

const ACTIVITY_PROFILE_REVIEW_REFERENCES = Object.freeze([
  "AI_REGISTRY_KEY.md",
  "FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml",
  "FORENSIC_ANNEXURE_REGISTRY_v1_LOCKED.yaml"
]);

const ACTIVITY_ROW_FIELDS = Object.freeze([
  "activity_reference",
  "product_service_wrapper",
  "activity_feature_name",
  "activity_candidate_summary",
  "mechanics_proof",
  "autonomy_human_control_signal",
  "data_content_object_touched",
  "external_internal_action_signal",
  "archetype_codes",
  "archetype_derivation_basis",
  "surface_context_tokens",
  "surface_derivation_basis"
]);

const DERIVATION_BASIS_FIELDS = Object.freeze([
  "code_or_token",
  "normalized_name",
  "conditions_satisfied",
  "trigger_if_applied",
  "exclude_if_checked",
  "material_basis",
  "limitation"
]);

const COMMERCIAL_AVAILABILITY_FIELDS = Object.freeze([
  "posture",
  "free_trial_freemium_signal",
  "beta_pilot_early_access_signal",
  "paid_production_enterprise_plan_signal",
  "evidence_basis",
  "limitation"
]);

const ARCHETYPE_CODES = Object.freeze(["UNI", "DOE", "JDG", "CMP", "CRT", "RDR", "ORC", "TRN", "SHD", "OPT", "MOV"]);
const SURFACE_CONTEXT_TOKENS = Object.freeze(["Consumer-Public", "Enterprise-Private", "PII", "Employment", "Sensitive/Biometric", "Financial", "Content&IP", "Safety&Physical", "Infrastructure", "Minors"]);

export const ACTIVITY_PROFILE_REVIEW_CONTRACT = Object.freeze({
  contract_name: "ACTIVITY_PROFILE_REVIEW_CONTRACT_v2_DERIVATION_BASIS_FIELDS",
  central_phase_id: "ACTIVITY_PROFILE_REVIEW",
  central_phase_label: "Activity Profile Review",
  phase_job_id: "ACTIVITY_PROFILE_REVIEW_MATERIAL",
  public_label: "Activity Profile Review",
  compatibility_internal_job_id: "M8_TARGET_FEATURE_PROFILE",
  implementation_status: "PHASE_RUNNER_CUTOVER_STAGED",
  production_entrypoint_switched: true,
  global_production_deployment_switched: false,
  model_usage: "MODEL_JSON_ONLY",
  material_job: Object.freeze({
    reads: ACTIVITY_PROFILE_REVIEW_READS,
    writes: ACTIVITY_PROFILE_REVIEW_WRITES,
    prompt_files: ACTIVITY_PROFILE_REVIEW_PROMPT_FILES,
    references: ACTIVITY_PROFILE_REVIEW_REFERENCES,
    validator: "validateM8TargetFeatureOutput",
    validator_module: "src/m8-validator.js",
    validator_phase: "M8_TARGET_FEATURE_PROFILE"
  }),
  source_authority: Object.freeze({
    base_registry_key_reference: "AI_REGISTRY_KEY.md",
    archetype_derivation_authority: "AI_REGISTRY_KEY.md §4",
    surface_derivation_authority: "AI_REGISTRY_KEY.md §7",
    classification_matrix_active_for_material_derivation: false,
    candidate_universe_artifact: "feature_candidate_inventory",
    candidate_universe_path: "feature_candidate_inventory.candidates[]",
    candidate_inventory_is_navigation_only: true,
    p1_p5_lossless_artifacts_are_mechanics_evidence: true,
    p4_use_case_industry_context_allowed: true,
    p4_candidate_creation_allowed: false,
    external_browsing_allowed: false,
    general_market_knowledge_allowed: false
  }),
  output_contract: Object.freeze({
    required_top_level_artifact: "target_feature_profile",
    required_profile_keys: Object.freeze(["activities", "commercial_availability_posture", "profile_level_limitations"]),
    activity_row_fields: ACTIVITY_ROW_FIELDS,
    derivation_basis_fields: DERIVATION_BASIS_FIELDS,
    old_activity_proof_fields_forbidden: Object.freeze(["archetype_proof", "surface_proof_and_routing_limits"]),
    commercial_availability_fields: COMMERCIAL_AVAILABILITY_FIELDS,
    archetype_codes: ARCHETYPE_CODES,
    surface_context_tokens: SURFACE_CONTEXT_TOKENS,
    activities_must_be_array: true,
    profile_level_limitations_must_be_array: true,
    commercial_availability_posture_must_be_object: true,
    commercial_availability_evidence_basis_must_be_business_readable_array: true,
    archetype_codes_required_non_empty: true,
    archetype_derivation_basis_must_be_array: true,
    surface_context_tokens_required_array_may_be_empty: true,
    surface_derivation_basis_must_be_array: true,
    activity_reference_sequence: "ACT.001_PLUS_SEQUENTIAL",
    material_output_only: true,
    forensic_output_forbidden: true
  }),
  candidate_treatment_rules: Object.freeze({
    every_inventory_candidate_must_be_considered: true,
    candidate_requiring_treatment_must_be_visible_activity_or_profile_limitation: true,
    standalone_api_model_integration_candidates_must_not_be_silently_absorbed: true,
    pricing_confirmed_candidate_must_not_create_mechanics_by_itself: true,
    unindexed_candidate_must_not_be_added_as_normal_activity: true,
    coverage_ledger_belongs_to_activity_profile_forensics_not_material_profile: true
  }),
  forbidden_material_keys: Object.freeze([
    "feature_candidate_inventory",
    "target_feature_profile_forensics",
    "target_profile",
    "target_profile_forensics",
    "legal_cartography_index",
    "legal_signal_derivation_profile",
    "data_provenance_profile",
    "exposure_registry_profile",
    "challenge_gate",
    "final_output_handoff",
    "renderer_payload",
    "candidate_id",
    "source_candidate_ids",
    "source_pointers",
    "source_refs",
    "source_urls",
    "source_ids",
    "evidence_excerpts",
    "confidence",
    "validation_status",
    "lock_status",
    "profile_meta",
    "runtime_trace",
    "derivation_ledger",
    "validation_ledger",
    "forensic_contract",
    "forensic_boundary",
    "archetype_proof",
    "surface_proof_and_routing_limits"
  ]),
  boundary_rules: Object.freeze({
    must_not_discover_or_fetch_sources: true,
    must_not_create_candidate_universe: true,
    must_not_mutate_feature_candidate_inventory: true,
    must_not_emit_feature_candidate_inventory: true,
    must_not_emit_target_feature_profile_forensics: true,
    must_not_perform_legal_data_exposure_operator_compiler_or_qr_work: true,
    must_not_copy_lossless_text_or_excerpts: true,
    must_not_include_urls_ids_pointers_or_confidence: true,
    next_phase: "ACTIVITY_PROFILE_FORENSICS"
  })
});

export function activityProfileReviewReadArtifacts() {
  return [...ACTIVITY_PROFILE_REVIEW_CONTRACT.material_job.reads];
}

export function activityProfileReviewWriteArtifacts() {
  return [...ACTIVITY_PROFILE_REVIEW_CONTRACT.material_job.writes];
}

export function activityProfileReviewPromptFiles() {
  return [...ACTIVITY_PROFILE_REVIEW_CONTRACT.material_job.prompt_files];
}

export function activityProfileReviewReferenceFiles() {
  return [...ACTIVITY_PROFILE_REVIEW_CONTRACT.material_job.references];
}

export function activityProfileReviewActivityRowFields() {
  return [...ACTIVITY_PROFILE_REVIEW_CONTRACT.output_contract.activity_row_fields];
}

export function activityProfileReviewCommercialAvailabilityFields() {
  return [...ACTIVITY_PROFILE_REVIEW_CONTRACT.output_contract.commercial_availability_fields];
}
