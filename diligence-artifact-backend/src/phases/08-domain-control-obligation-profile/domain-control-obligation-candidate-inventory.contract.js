import {
  DOMAIN_CONTROL_OBLIGATION_PHASE1_ROOTS,
  P2E_DOMAIN_CONTROL_OBLIGATION_ARTIFACTS
} from "../02-cartography-index/domain-control-obligation-navigation-index.contract.js";
import {
  DOMAIN_CONTROL_OBLIGATION_CANDIDATE_ARTIFACT,
  DOMAIN_CONTROL_OBLIGATION_CANDIDATE_DERIVATION_MODE,
  DOMAIN_CONTROL_OBLIGATION_CANDIDATE_FIELDS,
  DOMAIN_CONTROL_OBLIGATION_CANDIDATE_JOB_ID,
  DOMAIN_CONTROL_OBLIGATION_CANDIDATE_SCHEMA_VERSION,
  DOMAIN_CONTROL_OBLIGATION_CANDIDATE_STATUSES,
  DOMAIN_CONTROL_OBLIGATION_CANDIDATE_TOP_LEVEL_FIELDS,
  DOMAIN_CONTROL_OBLIGATION_FORBIDDEN_SOURCE_LAYERS,
  DOMAIN_CONTROL_OBLIGATION_PROFILE_JOB_ID,
  DOMAIN_CONTROL_OBLIGATION_SOURCE_LAYERS,
  PHASE8_DOMAIN_CONTROL_OBLIGATION_AGENT_ID,
  PHASE8_DOMAIN_CONTROL_OBLIGATION_BUCKET_ID,
  PHASE8_DOMAIN_CONTROL_OBLIGATION_PHASE_ID,
  PHASE8_DOMAIN_CONTROL_OBLIGATION_PHASE_ORDER,
  PHASE8_DOMAIN_CONTROL_OBLIGATION_PUBLIC_LABEL,
  PHASE8_DOMAIN_CONTROL_OBLIGATION_ROUTE_ID
} from "./domain-control-obligation.constants.js";

const PHASE8_LAYER1_READS = Object.freeze([
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
  ...DOMAIN_CONTROL_OBLIGATION_PHASE1_ROOTS
]);

const PHASE8_LAYER1_WRITES = Object.freeze([
  DOMAIN_CONTROL_OBLIGATION_CANDIDATE_ARTIFACT
]);

export const DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY_CONTRACT = Object.freeze({
  contract_name: "DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY_CONTRACT_v1",
  central_phase_id: PHASE8_DOMAIN_CONTROL_OBLIGATION_PHASE_ID,
  central_phase_order: PHASE8_DOMAIN_CONTROL_OBLIGATION_PHASE_ORDER,
  central_phase_label: PHASE8_DOMAIN_CONTROL_OBLIGATION_PUBLIC_LABEL,
  phase_job_id: DOMAIN_CONTROL_OBLIGATION_CANDIDATE_JOB_ID,
  compatibility_internal_job_id: DOMAIN_CONTROL_OBLIGATION_CANDIDATE_JOB_ID,
  public_label: "Domain Control Obligation Candidate Inventory",
  agent_id: PHASE8_DOMAIN_CONTROL_OBLIGATION_AGENT_ID,
  actor_id: PHASE8_DOMAIN_CONTROL_OBLIGATION_AGENT_ID,
  implementation_status: "PHASE8_LAYER1_RUNTIME_CUTOVER_COMPLETE",
  production_entrypoint_switched: true,
  global_production_deployment_switched: false,
  model_usage: "NONE_DETERMINISTIC",
  provider_call_allowed: false,
  next_job: DOMAIN_CONTROL_OBLIGATION_PROFILE_JOB_ID,
  route_contract: Object.freeze({
    routing_authority: "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY",
    route_id: PHASE8_DOMAIN_CONTROL_OBLIGATION_ROUTE_ID,
    bucket_id: PHASE8_DOMAIN_CONTROL_OBLIGATION_BUCKET_ID,
    runtime_reader: "phase-route-runtime.reader",
    source_navigation_index: P2E_DOMAIN_CONTROL_OBLIGATION_ARTIFACTS.finalIndex,
    lossless_evidence_role: "PRIMARY_EVIDENCE",
    index_role: "MANDATORY_NAVIGATION_MAP_INTO_PRIMARY_EVIDENCE",
    direct_contract_read_loading_forbidden: true,
    direct_lossless_fallback_framing_forbidden: true,
    phase2g_routed_packet_is_read_ceiling: true,
    free_corpus_read_forbidden: true,
    profile_forensics_inputs_forbidden: true,
    dap_inputs_forbidden: true
  }),
  deterministic_job: Object.freeze({
    reads: PHASE8_LAYER1_READS,
    writes: PHASE8_LAYER1_WRITES,
    source_helper: "buildDomainControlObligationCandidateInventory",
    source_helper_module: "src/phases/08-domain-control-obligation-profile/services/domain-control-obligation-candidate-inventory.builder.js",
    resolver: "resolveDomainControlObligationTaxonomy",
    resolver_module: "src/phases/08-domain-control-obligation-profile/services/domain-control-obligation-taxonomy.resolver.js",
    validator: "validateDomainControlObligationCandidateInventory",
    validator_module: "src/phases/08-domain-control-obligation-profile/validators/domain-control-obligation-candidate-inventory.validator.js",
    provider_call_allowed: false
  }),
  approved_input_universe: PHASE8_LAYER1_READS,
  source_authority: Object.freeze({
    individual_obligation_authority: "mounted Registry Key obligation entries resolved from active_run_package_manifest",
    obligation_family_navigation_authority: "installed obligation catalogs",
    evidence_navigation_authority: P2E_DOMAIN_CONTROL_OBLIGATION_ARTIFACTS.finalIndex,
    field_derivation_rule_authority: "references/registry/Diligence_Field_Derivation_Registry.yml",
    package_key_discovery: "references/registry/*_Registry_Key.yml",
    hardcoded_registry_key_list_forbidden: true,
    hardcoded_domain_logic_forbidden: true,
    obligation_catalog_may_not_define_missing_obligation_ids: true,
    obligation_catalog_may_not_define_missing_material_values: true
  }),
  package_scope: Object.freeze({
    mounted_primary_package_required: true,
    mounted_capability_overlays_supported: true,
    mounted_regulatory_overlays_may_create_obligations: false,
    allowed_source_layers: DOMAIN_CONTROL_OBLIGATION_SOURCE_LAYERS,
    forbidden_source_layers: DOMAIN_CONTROL_OBLIGATION_FORBIDDEN_SOURCE_LAYERS,
    primary_obligations_match_primary_classification_only: true,
    capability_overlay_obligations_match_same_overlay_classification_only: true,
    cross_package_classification_leakage_forbidden: true,
    regulatory_overlay_enrichment_deferred_to_layer2_compiler: true
  }),
  trigger_matching: Object.freeze({
    source_fields: Object.freeze([
      "applies_when.behavior_class",
      "applies_when.surface"
    ]),
    phase5_activity_source: "target_feature_profile.activities",
    primary_classification_source: "primary_classification",
    overlay_classification_source: "overlay_classifications",
    package_scoped_matching_required: true,
    linked_activity_reference_required: true,
    forced_catch_all_candidate_forbidden: true,
    legal_applicability_test_forbidden: true,
    compliance_test_forbidden: true
  }),
  output_contract: Object.freeze({
    required_top_level_artifact: DOMAIN_CONTROL_OBLIGATION_CANDIDATE_ARTIFACT,
    artifact_type: DOMAIN_CONTROL_OBLIGATION_CANDIDATE_ARTIFACT,
    schema_version: DOMAIN_CONTROL_OBLIGATION_CANDIDATE_SCHEMA_VERSION,
    derivation_mode: DOMAIN_CONTROL_OBLIGATION_CANDIDATE_DERIVATION_MODE,
    required_top_level_fields: DOMAIN_CONTROL_OBLIGATION_CANDIDATE_TOP_LEVEL_FIELDS,
    candidate_required_fields: DOMAIN_CONTROL_OBLIGATION_CANDIDATE_FIELDS,
    allowed_candidate_statuses: DOMAIN_CONTROL_OBLIGATION_CANDIDATE_STATUSES,
    candidate_ids_backend_owned: true,
    mechanical_shell_only: true,
    source_text_copy_forbidden: true,
    evidence_excerpt_copy_forbidden: true,
    material_field_derivation_forbidden: true,
    control_posture_derivation_forbidden: true,
    legal_applicability_conclusion_forbidden: true,
    compliance_conclusion_forbidden: true,
    regulatory_overlay_obligation_rows_forbidden: true
  }),
  forbidden_material_fields: Object.freeze([
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
    "limitation",
    "regulatory_overlay_refs"
  ]),
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
    profile_forensics_inputs_forbidden: true,
    dap_inputs_forbidden: true,
    deterministic_candidate_inventory_only: true,
    model_call_forbidden: true,
    must_not_derive_material_fields: true,
    must_not_create_regulatory_overlay_obligation_rows: true,
    must_not_determine_legal_applicability: true,
    must_not_determine_compliance: true,
    must_not_copy_lossless_text_or_excerpts: true,
    must_not_emit_domain_control_obligation_profile: true
  })
});

export function domainControlObligationCandidateInventoryReadArtifacts() {
  return [...DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY_CONTRACT.deterministic_job.reads];
}

export function domainControlObligationCandidateInventoryWriteArtifacts() {
  return [...DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY_CONTRACT.deterministic_job.writes];
}

export function domainControlObligationCandidateInventoryFields() {
  return [...DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY_CONTRACT.output_contract.candidate_required_fields];
}
