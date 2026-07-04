export const DATA_PROVENANCE_PROFILE_PHASE = Object.freeze({
  order: 7,
  phase_id: "DATA_PROVENANCE_PROFILE",
  public_label: "Data Provenance Profile",
  implementation_status: "MIGRATION_TARGET",
  responsibility: "Derive the data provenance profile, extended data readiness profile, and integrated data report from admitted data-family sources and selected legal support.",
  material_outputs: ["data_provenance_profile", "extended_dap_india_readiness_profile", "integrated_dap_report"],
  runtime_boundary: "Runtime orchestrates. This phase owns data provenance profile logic after helper migration."
});
