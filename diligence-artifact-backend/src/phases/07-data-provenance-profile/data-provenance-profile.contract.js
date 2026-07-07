import { PHASE7_DAP_MATERIAL_SECTION_MATRIX, PHASE7_EXPECTED_DAP_FIELD_COUNT, PHASE7_MODEL_PACKET_MATRIX, PHASE7_REGISTRY_SOURCE_PATH } from "./dap-registry-derivation-rule-compiler.js";

export const PHASE7_DATA_PRIVACY_ARCHITECTURE_CONTRACT = Object.freeze({
  contract_name: "PHASE7_DATA_PRIVACY_ARCHITECTURE_PACKAGE_CONTRACT_v1_LAYER1_LOCKED",
  phase_id: "DATA_PROVENANCE_PROFILE",
  phase_order: 7,
  public_label: "Data Provenance Profile",
  package_label: "Integrated Data and Privacy Architecture Profile",
  implementation_status: "PACKAGE_CONTRACT_LAYER_1_LOCKED_RUNTIME_CUTOVER_PENDING",
  runtime_entrypoint_switched: false,
  material_dap_field_base_count: PHASE7_EXPECTED_DAP_FIELD_COUNT,
  material_report_section_count: PHASE7_DAP_MATERIAL_SECTION_MATRIX.length,
  registry_rules_mandatory_in_layer_1: true,
  deterministic_first: true,
  bounded_model_packets_only: true,
  compatibility_roots_preserved: true,
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
  layer_1_contract: Object.freeze({
    layer_id: "LAYER_1_DAP_REGISTRY_DERIVATION_RULE_COMPILER",
    source_registry_path: PHASE7_REGISTRY_SOURCE_PATH,
    expected_registry_total_rows: 427,
    expected_dap_material_rows: PHASE7_EXPECTED_DAP_FIELD_COUNT,
    expected_material_sections: PHASE7_DAP_MATERIAL_SECTION_MATRIX.length,
    required_rule_columns: Object.freeze(["field_id", "profile_section", "field_family", "output_field", "mode", "source_basis", "conditions", "trigger_outcome", "exclude_fallback", "forbidden_inference", "lock_status"]),
    compiled_rule_fields: Object.freeze(["material_section_id", "material_section_title", "material_subsection_id", "registry_family", "deterministic_prefill_eligible", "model_packet_family", "evidence_atom_requirements", "limitation_trigger", "missing_proof_trigger", "legal_firewall"])
  }),
  layer_contracts: Object.freeze([
    layer(1, "DAP Registry and Rule Compiler", "deterministic", ["FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml"], ["dap_registry_manifest"]),
    layer(2, "Source Navigation Inventory", "deterministic", ["approved inputs"], ["dap_source_navigation_inventory"]),
    layer(3, "Evidence Atom Extractor", "deterministic", ["dap_source_navigation_inventory"], ["dap_evidence_atom_inventory"]),
    layer(4, "Activity Data Joiner", "deterministic", ["target_feature_profile", "dap_evidence_atom_inventory"], ["activity_data_flow_candidate_map"]),
    layer(5, "Field Prefill Matrix", "deterministic", ["dap_registry_manifest", "dap_evidence_atom_inventory"], ["dap_field_prefill_matrix"]),
    layer(6, "Model Packet Router", "deterministic", ["dap_field_prefill_matrix"], ["dap_model_work_packet_manifest"]),
    layer(7, "Semantic Resolver", "bounded_model", ["dap_model_work_packet_manifest"], ["dap_model_resolution_packets"]),
    layer(8, "DAP Compiler", "deterministic", ["compiled inputs"], ["data_privacy_architecture_profile", "data_provenance_profile", "extended_dap_india_readiness_profile", "integrated_dap_report"]),
    layer(9, "Forensics and Validator", "deterministic", ["data_privacy_architecture_profile"], ["data_provenance_profile_forensics"]),
    layer(10, "Report Projection", "deterministic", ["data_privacy_architecture_profile"], ["data_privacy_public_report_projection"])
  ]),
  material_section_matrix: PHASE7_DAP_MATERIAL_SECTION_MATRIX,
  model_packet_matrix: PHASE7_MODEL_PACKET_MATRIX,
  compatibility_outputs: Object.freeze(["data_provenance_profile", "data_provenance_profile_forensics", "extended_dap_india_readiness_profile", "integrated_dap_report"])
});

export const PHASE7_LAYER1_ARTIFACTS = Object.freeze(["dap_registry_manifest"]);

function layer(order, name, execution_mode, reads, writes) {
  return Object.freeze({ order, name, execution_mode, reads: Object.freeze(reads), writes: Object.freeze(writes) });
}
