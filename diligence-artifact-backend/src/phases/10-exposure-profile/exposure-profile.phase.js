export const EXPOSURE_PROFILE_PHASE = Object.freeze({
  order: 9,
  phase_id: "EXPOSURE_PROFILE",
  public_label: "Exposure Profile",
  implementation_status: "MIGRATION_TARGET",
  responsibility: "Derive exposure route plan, exposure batches, workpad, controlled profile, triggered profile, and trace controls.",
  material_outputs: ["exposure_registry_route_plan", "exposure_registry_workpad_98", "exposure_registry_controlled_profile", "exposure_registry_triggered_profile", "exposure_registry_profile_forensics"],
  runtime_boundary: "Runtime orchestrates. This phase owns exposure profile logic after helper migration."
});
