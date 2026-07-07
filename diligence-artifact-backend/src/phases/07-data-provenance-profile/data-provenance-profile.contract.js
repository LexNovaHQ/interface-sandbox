import { PHASE7_DAP_MATERIAL_SECTION_MATRIX, PHASE7_EXPECTED_DAP_FIELD_COUNT, PHASE7_REGISTRY_SOURCE_PATH } from "./dap-registry-derivation-rule-compiler.js";
import { PHASE7_DAP_SEMANTIC_BATCH_PLAN, PHASE7_DAP_STRATEGIC_DERIVATION_COUNTS } from "./dap-strategic-derivation-matrix.js";

export const PHASE7_DATA_PRIVACY_ARCHITECTURE_CONTRACT = Object.freeze({
  contract_name: "PHASE7_DATA_PRIVACY_ARCHITECTURE_PACKAGE_CONTRACT_v3_SEMANTIC_LED_BATCH_ARCHITECTURE",
  phase_id: "DATA_PROVENANCE_PROFILE",
  phase_order: 7,
  public_label: "Data Provenance Profile",
  package_label: "Semantic-Led Data and Privacy Architecture Profile",
  implementation_status: "LAYER_5_BATCH_QUALITY_SCHEMA_VALIDATOR_BUILT_RUNTIME_CUTOVER_PENDING",
  runtime_entrypoint_switched: false,
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
  approved_input_universe: Object.freeze([
    "source_discovery_handoff",
    "legal_cartography_index",
    "legal_signal_derivation_profile",
    "target_profile",
    "target_profile_forensics",
    "feature_candidate_inventory",
    "target_feature_profile",
    "target_feature_profile_forensics",
    "lossless_family__D1_SECURITY_TRUST",
    "lossless_family__D2_SUBPROCESSOR_PRIVACY_CENTER",
    "lossless_family__D3_DATA_GOVERNANCE_CONTROLS",
    "lossless_family__D4_DOCS_API_DATA_FLOW",
    "lossless_family__D5_AI_SAFETY_TRANSPARENCY"
  ]),
  navigation_rules: Object.freeze({
    data_privacy_navigation_index_is_hybrid: true,
    deterministic_system_builds_index_spine: true,
    semantic_system_adds_family_batch_navigation_pointers: true,
    full_d_family_lossless_evidence_allowed_only_through_data_privacy_navigation_index: true,
    selective_l_family_lossless_evidence_allowed_only_through_legal_cartography_index: true,
    no_free_corpus_read: true,
    no_dossier_layer: true
  }),
  layer_contracts: Object.freeze([
    layer(1, "DAP Registry + Strategic Derivation Matrix", "deterministic_contract", [PHASE7_REGISTRY_SOURCE_PATH], ["dap_registry_manifest", "dap_strategic_derivation_matrix"]),
    layer(2, "Hybrid Data Privacy Navigation Index", "hybrid_deterministic_led", ["approved inputs", "dap_strategic_derivation_matrix"], ["data_privacy_navigation_index"]),
    layer(3, "Deterministic Semantic Batch Router", "deterministic", ["data_privacy_navigation_index", "dap_strategic_derivation_matrix"], ["dap_semantic_batch_route_manifest"]),
    layer(4, "Semantic Family Batch Runner", "semantic_batch", ["dap_semantic_batch_route_manifest", "data_privacy_navigation_index"], PHASE7_DAP_SEMANTIC_BATCH_PLAN.map((batchRow) => batchRow.artifact_name)),
    layer(5, "Batch Quality + Schema Validator", "deterministic_validator", ["semantic batch artifacts", "semantic batch validation artifacts", "dap_semantic_batch_route_manifest"], ["dap_semantic_batch_validation_manifest", "data_provenance_profile_semantic_batch_gate"])
  ]),
  material_section_matrix: PHASE7_DAP_MATERIAL_SECTION_MATRIX,
  semantic_batch_plan: PHASE7_DAP_SEMANTIC_BATCH_PLAN,
  excluded_from_phase7: Object.freeze(["compiler", "forensics", "report_projection"])
});

export const PHASE7_LAYER1_ARTIFACTS = Object.freeze(["dap_registry_manifest", "dap_strategic_derivation_matrix"]);
export const PHASE7_LAYER2_ARTIFACTS = Object.freeze(["data_privacy_navigation_index"]);
export const PHASE7_LAYER3_ARTIFACTS = Object.freeze(["dap_semantic_batch_route_manifest"]);
export const PHASE7_LAYER5_ARTIFACTS = Object.freeze(["dap_semantic_batch_validation_manifest", "data_provenance_profile_semantic_batch_gate"]);

function layer(order, name, execution_mode, reads, writes) {
  return Object.freeze({ order, name, execution_mode, reads: Object.freeze(reads), writes: Object.freeze(writes) });
}
