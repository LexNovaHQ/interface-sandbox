export const DATA_PROVENANCE_PROFILE_PHASE = Object.freeze({
  order: 7,
  phase_id: "DATA_PROVENANCE_PROFILE",
  public_label: "Data Provenance Profile",
  package_label: "Integrated Data and Privacy Architecture Profile",
  implementation_status: "PACKAGE_CONTRACT_LAYER_1_LOCKED_RUNTIME_CUTOVER_PENDING",
  responsibility: "Own the integrated 150-field DAP material base and compatibility outputs for Phase 7.",
  layer_1_artifact: "dap_registry_manifest",
  material_source_of_truth: "data_privacy_architecture_profile",
  compatibility_outputs: ["data_provenance_profile", "extended_dap_india_readiness_profile", "integrated_dap_report"],
  trace_outputs: ["data_provenance_profile_forensics"],
  runtime_boundary: "Package contract and Layer 1 compiler are locked. Runtime entrypoint remains pending until later layers are added."
});
