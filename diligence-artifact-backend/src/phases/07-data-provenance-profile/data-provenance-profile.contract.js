import { PHASE7_DAP_MATERIAL_SECTION_MATRIX, PHASE7_EXPECTED_DAP_FIELD_COUNT, PHASE7_REGISTRY_SOURCE_PATH } from "./dap-registry-derivation-rule-compiler.js";
import { PHASE7_DAP_SEMANTIC_BATCH_PLAN, PHASE7_DAP_STRATEGIC_DERIVATION_COUNTS } from "./dap-strategic-derivation-matrix.js";

export const PHASE7_DATA_PRIVACY_LOSSLESS_READS = Object.freeze([
  "lossless_root__privacy_data_processing",
  "lossless_root__security_trust_compliance",
  "lossless_root__data_governance_controls",
  "lossless_root__technical_docs_api",
  "lossless_root__docs_api_data_flow",
  "lossless_root__integrations_ecosystem",
  "lossless_root__ai_safety_transparency",
  "lossless_root__regulatory_licensing_status",
  "lossless_root__grievance_complaints"
]);

export const PHASE7_DATA_PRIVACY_ARCHITECTURE_CONTRACT = Object.freeze({
  contract_name: "PHASE7_DATA_PRIVACY_ARCHITECTURE_PACKAGE_CONTRACT_v7_PHASE2G_ROUTED",
  phase_id: "DATA_PROVENANCE_PROFILE",
  phase_order: 7,
  public_label: "Data Provenance Profile",
  package_label: "Semantic-Led Data and Privacy Architecture Profile",
  implementation_status: "PHASE7_LAYER4_PHASE2G_ROUTE_SCOPED_RUNTIME_CUTOVER_COMPLETE",
  runtime_entrypoint_switched: true,
  global_production_deployment_switched: false,
  blocking_is_exception_noncritical_limitations_pass: true,
  material_dap_field_base_count: PHASE7_EXPECTED_DAP_FIELD_COUNT,
  material_family_section_count: 18,
  material_report_section_count: PHASE7_DAP_MATERIAL_SECTION_MATRIX.length,
  semantic_batch_count: PHASE7_DAP_SEMANTIC_BATCH_PLAN.length,
  semantic_led_architecture: true,
  deterministic_first: false,
  deterministic_supports_semantic_reasoning: true,
  compiler_inside_phase7: false,
  forensics_inside_phase7: false,
  report_projection_inside_phase7: false,
  phase8_forensics_is_100_percent_deterministic: true,
  strategic_derivation_counts: PHASE7_DAP_STRATEGIC_DERIVATION_COUNTS,
  route_contract: Object.freeze({
    routing_authority: "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY",
    route_id: "ROUTE.PHASE7.DATA_PROVENANCE_PROFILE",
    bucket_id: "2D_BUCKET_DATA_PRIVACY",
    runtime_reader: "phase-route-runtime.reader",
    direct_contract_read_loading_forbidden: true,
    profile_forensics_inputs_forbidden: true
  }),
  approved_input_universe: Object.freeze([
    "phase_routing_manifest",
    "phase_route_runtime_packet",
    "data_privacy_navigation_index",
    "legal_cartography_index",
    "legal_signal_derivation_profile",
    "domain_selection_profile",
    "active_run_package_manifest",
    "target_profile",
    "domain_derivation_profile",
    "feature_candidate_inventory",
    "target_feature_profile",
    ...PHASE7_DATA_PRIVACY_LOSSLESS_READS
  ]),
  forbidden_profile_inputs: Object.freeze([
    "target_profile_forensics",
    "target_feature_profile_forensics",
    "dap_forensics_profile",
    "exposure_registry_route_plan"
  ]),
  navigation_rules: Object.freeze({
    phase2g_is_only_runtime_routing_authority: true,
    phase2g_route_scoped_runtime_reader_required: true,
    source_navigation_owned_by_phase_2_cartography_index: true,
    data_privacy_navigation_index_artifact_identity_preserved: true,
    data_privacy_navigation_index_runtime_ownership_moved_to_phase2: true,
    phase7_must_not_rebuild_data_privacy_navigation_index: true,
    phase7_reads_data_privacy_navigation_index: true,
    phase7_reads_legal_cartography_index_selectively: true,
    phase7_reads_legal_signal_derivation_profile_selectively: true,
    no_separate_data_provenance_source_index: true,
    no_separate_legal_governance_source_index: true,
    model_reads_via_data_privacy_navigation_index_and_m9_locators_only: true,
    no_free_corpus_read: true,
    no_full_legal_doc_scan_without_locator: true,
    no_dossier_layer: true,
    profile_forensics_inputs_forbidden: true
  }),
  layer_contracts: Object.freeze([
    layer(1, "DAP Registry + Strategic Derivation Matrix", "deterministic_contract", [PHASE7_REGISTRY_SOURCE_PATH], ["dap_registry_manifest", "dap_strategic_derivation_matrix"]),
    layer(2, "Hybrid Data Privacy Navigation Index", "migrated_to_phase2_same_artifact", ["phase_route_runtime_packet", "data_privacy_navigation_index", "legal_cartography_index", "legal_signal_derivation_profile"], ["data_privacy_navigation_index"]),
    layer(3, "Deterministic Semantic Batch Router", "deterministic", ["phase_route_runtime_packet", "data_privacy_navigation_index", "legal_cartography_index", "legal_signal_derivation_profile", "dap_strategic_derivation_matrix"], ["dap_semantic_batch_route_manifest"]),
    layer(4, "Semantic Source Batch Runner", "semantic_batch", ["phase_route_runtime_packet", "dap_semantic_batch_route_manifest", "data_privacy_navigation_index", ...PHASE7_DATA_PRIVACY_LOSSLESS_READS, "target_profile", "domain_derivation_profile", "feature_candidate_inventory", "target_feature_profile"], PHASE7_DAP_SEMANTIC_BATCH_PLAN.map((batchRow) => batchRow.artifact_name)),
    layer(5, "Batch Quality + Schema Validator", "deterministic_validator", ["semantic batch artifacts", "semantic batch validation artifacts", "dap_semantic_batch_route_manifest"], ["dap_semantic_batch_validation_manifest", "data_provenance_profile_semantic_batch_gate"])
  ]),
  material_section_matrix: PHASE7_DAP_MATERIAL_SECTION_MATRIX,
  semantic_batch_plan: PHASE7_DAP_SEMANTIC_BATCH_PLAN,
  excluded_from_phase7: Object.freeze(["compiler", "forensics", "report_projection", "source_navigation_index_rebuild"])
});

export const PHASE7_LAYER1_ARTIFACTS = Object.freeze(["dap_registry_manifest", "dap_strategic_derivation_matrix"]);
export const PHASE7_LAYER2_ARTIFACTS = Object.freeze(["data_privacy_navigation_index"]);
export const PHASE7_LAYER3_ARTIFACTS = Object.freeze(["dap_semantic_batch_route_manifest"]);
export const PHASE7_LAYER5_ARTIFACTS = Object.freeze(["dap_semantic_batch_validation_manifest", "data_provenance_profile_semantic_batch_gate"]);
function layer(order, name, execution_mode, reads, writes) { return Object.freeze({ order, name, execution_mode, reads: Object.freeze(reads), writes: Object.freeze(writes) }); }
