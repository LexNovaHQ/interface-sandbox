import { PHASE7_DAP_MATERIAL_SECTION_MATRIX, PHASE7_EXPECTED_DAP_FIELD_COUNT, PHASE7_REGISTRY_SOURCE_PATH } from "./dap-registry-derivation-rule-compiler.js";
import { PHASE7_DAP_SEMANTIC_BATCH_PLAN, PHASE7_DAP_STRATEGIC_DERIVATION_COUNTS } from "./dap-strategic-derivation-matrix.js";

export const PHASE7_DATA_PRIVACY_ARCHITECTURE_CONTRACT = Object.freeze({
  contract_name: "PHASE7_DATA_PRIVACY_ARCHITECTURE_PACKAGE_CONTRACT_v5_PHASE2_CARTOGRAPHY_INDEX_INPUTS",
  phase_id: "DATA_PROVENANCE_PROFILE",
  phase_order: 7,
  public_label: "Data Provenance Profile",
  package_label: "Semantic-Led Data and Privacy Architecture Profile",
  implementation_status: "CONTRACT_SYNCED_TO_PHASE2_CARTOGRAPHY_SOURCE_INDEXES",
  runtime_entrypoint_switched: false,
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
  approved_input_universe: Object.freeze(["cartography_index", "data_provenance_source_index", "legal_governance_source_index", "domain_selection_profile", "active_run_package_manifest", "target_profile", "target_profile_forensics", "feature_candidate_inventory", "target_feature_profile", "target_feature_profile_forensics"]),
  navigation_rules: Object.freeze({
    source_navigation_owned_by_phase_2_cartography_index: true,
    phase7_must_not_build_source_navigation_index: true,
    phase7_reads_data_provenance_source_index: true,
    phase7_reads_legal_governance_source_index_selectively: true,
    data_privacy_navigation_index_retired: true,
    legal_cartography_index_retired_as_phase7_input: true,
    legal_signal_derivation_profile_retired_as_phase7_input: true,
    model_reads_via_phase2_locator_routes_only: true,
    no_free_corpus_read: true,
    no_full_legal_doc_scan_without_locator: true,
    no_dossier_layer: true
  }),
  layer_contracts: Object.freeze([
    layer(1, "DAP Registry + Strategic Derivation Matrix", "deterministic_contract", [PHASE7_REGISTRY_SOURCE_PATH], ["dap_registry_manifest", "dap_strategic_derivation_matrix"]),
    layer(2, "Retired Phase 7 Source Navigation", "retired_moved_to_phase2", ["cartography_index", "data_provenance_source_index", "legal_governance_source_index"], []),
    layer(3, "Deterministic Semantic Batch Router", "deterministic", ["cartography_index", "data_provenance_source_index", "legal_governance_source_index", "dap_strategic_derivation_matrix"], ["dap_semantic_batch_route_manifest"]),
    layer(4, "Semantic Source Batch Runner", "semantic_batch", ["dap_semantic_batch_route_manifest"], PHASE7_DAP_SEMANTIC_BATCH_PLAN.map((batchRow) => batchRow.artifact_name)),
    layer(5, "Batch Quality + Schema Validator", "deterministic_validator", ["semantic batch artifacts", "semantic batch validation artifacts", "dap_semantic_batch_route_manifest"], ["dap_semantic_batch_validation_manifest", "data_provenance_profile_semantic_batch_gate"])
  ]),
  material_section_matrix: PHASE7_DAP_MATERIAL_SECTION_MATRIX,
  semantic_batch_plan: PHASE7_DAP_SEMANTIC_BATCH_PLAN,
  excluded_from_phase7: Object.freeze(["compiler", "forensics", "report_projection", "source_navigation_indexing"])
});

export const PHASE7_LAYER1_ARTIFACTS = Object.freeze(["dap_registry_manifest", "dap_strategic_derivation_matrix"]);
export const PHASE7_LAYER2_ARTIFACTS = Object.freeze([]);
export const PHASE7_LAYER3_ARTIFACTS = Object.freeze(["dap_semantic_batch_route_manifest"]);
export const PHASE7_LAYER5_ARTIFACTS = Object.freeze(["dap_semantic_batch_validation_manifest", "data_provenance_profile_semantic_batch_gate"]);
function layer(order, name, execution_mode, reads, writes) { return Object.freeze({ order, name, execution_mode, reads: Object.freeze(reads), writes: Object.freeze(writes) }); }
