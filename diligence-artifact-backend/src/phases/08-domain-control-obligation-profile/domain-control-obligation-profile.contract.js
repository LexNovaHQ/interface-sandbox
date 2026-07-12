import {
  DOMAIN_CONTROL_OBLIGATION_PHASE1_ROOTS,
  P2E_DOMAIN_CONTROL_OBLIGATION_ARTIFACTS
} from "../02-cartography-index/domain-control-obligation-navigation-index.contract.js";
import {
  DOMAIN_CONTROL_OBLIGATION_CANDIDATE_ARTIFACT,
  DOMAIN_CONTROL_OBLIGATION_CANDIDATE_JOB_ID,
  DOMAIN_CONTROL_OBLIGATION_CONTROL_MECHANISM_STATUSES,
  DOMAIN_CONTROL_OBLIGATION_CONTROL_POSTURE_STATUSES,
  DOMAIN_CONTROL_OBLIGATION_DERIVATION_BASIS_FIELDS,
  DOMAIN_CONTROL_OBLIGATION_FINAL_ROW_FIELDS,
  DOMAIN_CONTROL_OBLIGATION_FORBIDDEN_LEGAL_CONCLUSIONS,
  DOMAIN_CONTROL_OBLIGATION_FORBIDDEN_SOURCE_LAYERS,
  DOMAIN_CONTROL_OBLIGATION_MATERIAL_FIELD_OWNER,
  DOMAIN_CONTROL_OBLIGATION_MECHANICAL_FIELD_OWNER,
  DOMAIN_CONTROL_OBLIGATION_MECHANICAL_PROFILE_ROW_FIELDS,
  DOMAIN_CONTROL_OBLIGATION_MODEL_MATERIAL_FIELDS,
  DOMAIN_CONTROL_OBLIGATION_MODEL_OUTPUT_ROW_FIELDS,
  DOMAIN_CONTROL_OBLIGATION_MOUNTED_CAPABILITY_REF_FIELDS,
  DOMAIN_CONTROL_OBLIGATION_MOUNTED_PACKAGE_REF_FIELDS,
  DOMAIN_CONTROL_OBLIGATION_MOUNTED_REGULATORY_REF_FIELDS,
  DOMAIN_CONTROL_OBLIGATION_PROFILE_ARTIFACT,
  DOMAIN_CONTROL_OBLIGATION_PROFILE_DERIVATION_MODE,
  DOMAIN_CONTROL_OBLIGATION_PROFILE_JOB_ID,
  DOMAIN_CONTROL_OBLIGATION_PROFILE_SCHEMA_VERSION,
  DOMAIN_CONTROL_OBLIGATION_PROFILE_TOP_LEVEL_FIELDS,
  DOMAIN_CONTROL_OBLIGATION_REGULATORY_OVERLAY_MODE,
  DOMAIN_CONTROL_OBLIGATION_REGULATORY_OVERLAY_REF_FIELDS,
  DOMAIN_CONTROL_OBLIGATION_REGULATORY_OVERLAY_STATUSES,
  DOMAIN_CONTROL_OBLIGATION_SOURCE_LAYERS,
  PHASE8_DOMAIN_CONTROL_OBLIGATION_AGENT_ID,
  PHASE8_DOMAIN_CONTROL_OBLIGATION_BUCKET_ID,
  PHASE8_DOMAIN_CONTROL_OBLIGATION_PHASE_ID,
  PHASE8_DOMAIN_CONTROL_OBLIGATION_PHASE_ORDER,
  PHASE8_DOMAIN_CONTROL_OBLIGATION_PUBLIC_LABEL,
  PHASE8_DOMAIN_CONTROL_OBLIGATION_ROUTE_ID
} from "./domain-control-obligation.constants.js";

const DCO_AGENT_ROOT = "agent-packages/agent_8_domain_control_obligation";

export const PHASE8_DOMAIN_CONTROL_OBLIGATION_PROMPT_FILES = Object.freeze([
  "agent-packages/00_SYSTEM_BLOCKING_DOCTRINE.md",
  `${DCO_AGENT_ROOT}/00_RUNTIME_CONTROLLER_PHASE8.md`,
  `${DCO_AGENT_ROOT}/01_DOMAIN_CONTROL_OBLIGATION_PROFILE_BACKEND.md`,
  `${DCO_AGENT_ROOT}/02_PHASE8_VALIDATOR_RULES.md`,
  `${DCO_AGENT_ROOT}/AGENT8_BACKEND_OUTPUT_CONTRACT.md`
]);

export const PHASE8_DOMAIN_CONTROL_OBLIGATION_REFERENCE_FILES = Object.freeze([
  "references/registry/Diligence_Field_Derivation_Registry.yml"
]);

const PHASE8_LAYER2_READS = Object.freeze([
  "phase_routing_manifest",
  "phase_route_runtime_packet",
  P2E_DOMAIN_CONTROL_OBLIGATION_ARTIFACTS.finalIndex,
  "legal_cartography_index",
  "legal_signal_derivation_profile",
  "target_profile",
  "domain_derivation_profile",
  "target_feature_profile",
  "domain_selection_profile",
  "active_run_package_manifest",
  DOMAIN_CONTROL_OBLIGATION_CANDIDATE_ARTIFACT,
  ...DOMAIN_CONTROL_OBLIGATION_PHASE1_ROOTS
]);

const PHASE8_LAYER2_WRITES = Object.freeze([
  DOMAIN_CONTROL_OBLIGATION_PROFILE_ARTIFACT
]);

export const DOMAIN_CONTROL_OBLIGATION_PROFILE_CONTRACT = Object.freeze({
  contract_name: "DOMAIN_CONTROL_OBLIGATION_PROFILE_CONTRACT_v1_MODEL_MATERIAL_FIELDS",
  central_phase_id: PHASE8_DOMAIN_CONTROL_OBLIGATION_PHASE_ID,
  central_phase_order: PHASE8_DOMAIN_CONTROL_OBLIGATION_PHASE_ORDER,
  central_phase_label: PHASE8_DOMAIN_CONTROL_OBLIGATION_PUBLIC_LABEL,
  phase_job_id: DOMAIN_CONTROL_OBLIGATION_PROFILE_JOB_ID,
  compatibility_internal_job_id: DOMAIN_CONTROL_OBLIGATION_PROFILE_JOB_ID,
  public_label: PHASE8_DOMAIN_CONTROL_OBLIGATION_PUBLIC_LABEL,
  agent_id: PHASE8_DOMAIN_CONTROL_OBLIGATION_AGENT_ID,
  actor_id: PHASE8_DOMAIN_CONTROL_OBLIGATION_AGENT_ID,
  implementation_status: "PHASE8_LAYER2_CONTRACT_SCHEMA_LOCKED_RUNTIME_PENDING",
  production_entrypoint_switched: false,
  global_production_deployment_switched: false,
  model_usage: "MODEL_JSON_ONLY_MATERIAL_FIELDS",
  provider_injected_by_central_runtime: true,
  prompt_files: PHASE8_DOMAIN_CONTROL_OBLIGATION_PROMPT_FILES,
  references: PHASE8_DOMAIN_CONTROL_OBLIGATION_REFERENCE_FILES,
  next_job: "DATA_PROVENANCE_PROFILE_FORENSICS",
  route_contract: Object.freeze({
    routing_authority: "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY",
    route_id: PHASE8_DOMAIN_CONTROL_OBLIGATION_ROUTE_ID,
    bucket_id: PHASE8_DOMAIN_CONTROL_OBLIGATION_BUCKET_ID,
    runtime_reader: "phase-route-runtime.reader",
    source_navigation_index: P2E_DOMAIN_CONTROL_OBLIGATION_ARTIFACTS.finalIndex,
    job_scoped_derived_profile: DOMAIN_CONTROL_OBLIGATION_CANDIDATE_ARTIFACT,
    lossless_evidence_role: "PRIMARY_EVIDENCE",
    index_role: "MANDATORY_NAVIGATION_MAP_INTO_PRIMARY_EVIDENCE",
    direct_contract_read_loading_forbidden: true,
    direct_lossless_fallback_framing_forbidden: true,
    phase2g_routed_packet_is_read_ceiling: true,
    free_corpus_read_forbidden: true,
    profile_forensics_inputs_forbidden: true,
    dap_inputs_forbidden: true
  }),
  material_job: Object.freeze({
    reads: PHASE8_LAYER2_READS,
    writes: PHASE8_LAYER2_WRITES,
    prompt_files: PHASE8_DOMAIN_CONTROL_OBLIGATION_PROMPT_FILES,
    references: PHASE8_DOMAIN_CONTROL_OBLIGATION_REFERENCE_FILES,
    compiler: "compileDomainControlObligationProfile",
    compiler_module: "src/phases/08-domain-control-obligation-profile/services/domain-control-obligation-profile.compiler.js",
    resolver: "resolveDomainControlObligationTaxonomy",
    resolver_module: "src/phases/08-domain-control-obligation-profile/services/domain-control-obligation-taxonomy.resolver.js",
    validator: "validateDomainControlObligationProfile",
    validator_module: "src/phases/08-domain-control-obligation-profile/validators/domain-control-obligation-profile.validator.js"
  }),
  approved_input_universe: PHASE8_LAYER2_READS,
  source_authority: Object.freeze({
    individual_obligation_authority: "mounted Registry Key obligation entries resolved from active_run_package_manifest",
    obligation_family_navigation_authority: "installed obligation catalogs",
    evidence_navigation_authority: P2E_DOMAIN_CONTROL_OBLIGATION_ARTIFACTS.finalIndex,
    field_derivation_rule_authority: "references/registry/Diligence_Field_Derivation_Registry.yml",
    package_key_discovery: "references/registry/*_Registry_Key.yml",
    hardcoded_registry_key_list_forbidden: true,
    hardcoded_domain_logic_forbidden: true,
    catalog_values_are_navigation_context_not_material_answer_authority: true,
    registry_values_are_model_derivation_inputs_not_backend_copy_fields: true
  }),
  candidate_boundary: Object.freeze({
    candidate_inventory_required: true,
    candidate_inventory_artifact: DOMAIN_CONTROL_OBLIGATION_CANDIDATE_ARTIFACT,
    candidate_inventory_created_by: DOMAIN_CONTROL_OBLIGATION_CANDIDATE_JOB_ID,
    model_may_not_create_new_candidates: true,
    model_may_not_drop_candidates_without_controlled_limitation: true,
    model_candidate_identity_field: "candidate_id",
    compiler_must_reconcile_to_exact_candidate_universe: true,
    candidate_inventory_propagation_past_phase8_forbidden: true
  }),
  package_scope: Object.freeze({
    allowed_obligation_source_layers: DOMAIN_CONTROL_OBLIGATION_SOURCE_LAYERS,
    forbidden_obligation_source_layers: DOMAIN_CONTROL_OBLIGATION_FORBIDDEN_SOURCE_LAYERS,
    primary_and_capability_overlay_rows_remain_package_scoped: true,
    cross_package_classification_leakage_forbidden: true,
    regulatory_overlay_mode: DOMAIN_CONTROL_OBLIGATION_REGULATORY_OVERLAY_MODE,
    regulatory_overlay_may_create_obligation_row: false,
    regulatory_overlay_may_duplicate_obligation_row: false
  }),
  field_ownership: Object.freeze({
    material_field_owner: DOMAIN_CONTROL_OBLIGATION_MATERIAL_FIELD_OWNER,
    mechanical_field_owner: DOMAIN_CONTROL_OBLIGATION_MECHANICAL_FIELD_OWNER,
    model_material_fields: DOMAIN_CONTROL_OBLIGATION_MODEL_MATERIAL_FIELDS,
    backend_mechanical_row_fields: DOMAIN_CONTROL_OBLIGATION_MECHANICAL_PROFILE_ROW_FIELDS,
    model_output_row_fields: DOMAIN_CONTROL_OBLIGATION_MODEL_OUTPUT_ROW_FIELDS,
    backend_may_author_material_fields: false,
    backend_may_fill_missing_material_fields: false,
    backend_may_rewrite_material_fields: false,
    backend_may_normalize_envelope_shape: true,
    backend_may_reconcile_candidate_identity: true,
    backend_may_stamp_mechanical_fields: true,
    backend_may_reject_invalid_model_output: true,
    model_may_override_mechanical_fields: false,
    model_may_emit_regulatory_overlay_refs: false
  }),
  model_output_contract: Object.freeze({
    top_level_key: DOMAIN_CONTROL_OBLIGATION_PROFILE_ARTIFACT,
    candidate_rows_key: "obligations",
    row_fields: DOMAIN_CONTROL_OBLIGATION_MODEL_OUTPUT_ROW_FIELDS,
    candidate_id_is_reconciliation_reference_only: true,
    every_material_field_required: true,
    derivation_basis_required: true,
    derivation_basis_fields: DOMAIN_CONTROL_OBLIGATION_DERIVATION_BASIS_FIELDS,
    allowed_control_mechanism_statuses: DOMAIN_CONTROL_OBLIGATION_CONTROL_MECHANISM_STATUSES,
    allowed_control_posture_statuses: DOMAIN_CONTROL_OBLIGATION_CONTROL_POSTURE_STATUSES,
    evidence_must_be_business_readable_no_source_copy: true,
    missing_value_requires_controlled_limitation: true,
    legal_applicability_conclusion_forbidden: true,
    compliance_conclusion_forbidden: true
  }),
  compiler_contract: Object.freeze({
    required_compiler: "compileDomainControlObligationProfile",
    final_artifact: DOMAIN_CONTROL_OBLIGATION_PROFILE_ARTIFACT,
    schema_version: DOMAIN_CONTROL_OBLIGATION_PROFILE_SCHEMA_VERSION,
    derivation_mode: DOMAIN_CONTROL_OBLIGATION_PROFILE_DERIVATION_MODE,
    final_top_level_fields: DOMAIN_CONTROL_OBLIGATION_PROFILE_TOP_LEVEL_FIELDS,
    final_row_fields: DOMAIN_CONTROL_OBLIGATION_FINAL_ROW_FIELDS,
    mounted_taxonomy_ref_fields: DOMAIN_CONTROL_OBLIGATION_MOUNTED_PACKAGE_REF_FIELDS,
    mounted_capability_ref_fields: DOMAIN_CONTROL_OBLIGATION_MOUNTED_CAPABILITY_REF_FIELDS,
    mounted_regulatory_ref_fields: DOMAIN_CONTROL_OBLIGATION_MOUNTED_REGULATORY_REF_FIELDS,
    regulatory_overlay_ref_fields: DOMAIN_CONTROL_OBLIGATION_REGULATORY_OVERLAY_REF_FIELDS,
    allowed_regulatory_overlay_statuses: DOMAIN_CONTROL_OBLIGATION_REGULATORY_OVERLAY_STATUSES,
    regulatory_overlay_refs_backend_stamped: true,
    regulatory_overlay_refs_require_mounted_overlay: true,
    regulatory_overlay_refs_require_framework_intersection: true,
    regulatory_overlay_refs_are_candidate_only: true,
    profile_level_limitations_are_mechanical_only: true,
    material_limitations_remain_row_level_model_fields: true,
    lock_status_is_runtime_save_metadata_not_model_output: true,
    compiler_may_not_create_or_remove_candidate_rows: true,
    compiler_may_not_repair_material_fields: true,
    compiler_may_not_convert_limitation_into_positive_conclusion: true
  }),
  output_contract: Object.freeze({
    required_top_level_artifact: DOMAIN_CONTROL_OBLIGATION_PROFILE_ARTIFACT,
    artifact_type: DOMAIN_CONTROL_OBLIGATION_PROFILE_ARTIFACT,
    schema_version: DOMAIN_CONTROL_OBLIGATION_PROFILE_SCHEMA_VERSION,
    derivation_mode: DOMAIN_CONTROL_OBLIGATION_PROFILE_DERIVATION_MODE,
    required_top_level_fields: DOMAIN_CONTROL_OBLIGATION_PROFILE_TOP_LEVEL_FIELDS,
    obligation_row_fields: DOMAIN_CONTROL_OBLIGATION_FINAL_ROW_FIELDS,
    model_material_fields: DOMAIN_CONTROL_OBLIGATION_MODEL_MATERIAL_FIELDS,
    mechanical_row_fields: DOMAIN_CONTROL_OBLIGATION_MECHANICAL_PROFILE_ROW_FIELDS,
    exact_candidate_coverage_required: true,
    material_output_only: true,
    forensic_output_forbidden: true,
    source_text_copy_forbidden: true,
    evidence_excerpt_copy_forbidden: true,
    urls_source_ids_and_source_pointers_forbidden_in_material_fields: true,
    regulatory_overlay_obligation_rows_forbidden: true,
    duplicate_obligation_rows_forbidden: true,
    downstream_candidate_inventory_forbidden: true
  }),
  forbidden_legal_conclusions: DOMAIN_CONTROL_OBLIGATION_FORBIDDEN_LEGAL_CONCLUSIONS,
  forbidden_runtime_reads: Object.freeze([
    "target_profile_forensics",
    "target_feature_profile_forensics",
    "dap_forensics_profile",
    "exposure_registry_profile_forensics",
    "dap_registry_manifest",
    "dap_strategic_derivation_matrix",
    "dap_semantic_batch_route_manifest",
    "dap_semantic_batch_validation_manifest",
    "data_provenance_profile_semantic_batch_gate",
    "exposure_registry_route_plan",
    "exposure_registry_workpad_98",
    "exposure_registry_controlled_profile",
    "exposure_registry_triggered_profile",
    "challenge_gate",
    "final_output_handoff",
    "renderer_payload"
  ]),
  boundary_rules: Object.freeze({
    phase2g_route_scoped_runtime_reader_required: true,
    phase2e_navigation_required: true,
    lossless_evidence_is_primary: true,
    index_is_navigation_only: true,
    direct_contract_read_loading_forbidden: true,
    direct_lossless_fallback_framing_forbidden: true,
    free_corpus_read_forbidden: true,
    profile_forensics_inputs_forbidden: true,
    dap_inputs_forbidden: true,
    candidate_inventory_is_only_candidate_universe: true,
    material_fields_are_100_percent_model_derived: true,
    deterministic_compilation_is_mechanical_only: true,
    no_backend_material_defaulting: true,
    no_backend_material_rewrite: true,
    no_regulatory_overlay_obligation_rows: true,
    no_legal_applicability_conclusion: true,
    no_compliance_conclusion: true,
    no_breach_or_satisfaction_conclusion: true,
    no_regulator_jurisdiction_conclusion: true,
    must_not_copy_lossless_text_or_excerpts: true,
    must_not_emit_candidate_inventory: true,
    must_not_emit_forensics: true,
    next_phase_is_dap_forensics_serially_only: true,
    no_substantive_dependency_on_phase7_dap: true
  })
});

export function domainControlObligationProfileReadArtifacts() {
  return [...DOMAIN_CONTROL_OBLIGATION_PROFILE_CONTRACT.material_job.reads];
}

export function domainControlObligationProfileWriteArtifacts() {
  return [...DOMAIN_CONTROL_OBLIGATION_PROFILE_CONTRACT.material_job.writes];
}

export function domainControlObligationProfileModelMaterialFields() {
  return [...DOMAIN_CONTROL_OBLIGATION_PROFILE_CONTRACT.field_ownership.model_material_fields];
}

export function domainControlObligationProfileMechanicalFields() {
  return [...DOMAIN_CONTROL_OBLIGATION_PROFILE_CONTRACT.field_ownership.backend_mechanical_row_fields];
}
