export const ACTIVITY_PROFILE_FORENSICS_PHASE = Object.freeze({
  order: 6,
  phase_id: "ACTIVITY_PROFILE_FORENSICS",
  public_label: "Activity Profile Forensics",
  implementation_status: "PHASE_RUNNER_CUTOVER_ACTIVE",
  responsibility: "Build the deterministic forensic trace for the saved Activity Profile Review material profile without changing the activity profile substance.",
  material_outputs: ["target_feature_profile_forensics"],
  active_contract_locked: "ACTIVITY_PROFILE_FORENSICS_CONTRACT_v1_DETERMINISTIC_MIGRATION",
  deterministic_outputs: ["target_feature_profile_forensics"],
  model_outputs: [],
  runner_status: "ACTIVITY_PROFILE_FORENSICS_PHASE_RUNNER_ACTIVE",
  runtime_boundary: "Runtime orchestrates persistence and locking. Activity Profile Forensics is deterministic, reads the saved activity profile and product/activity source families, and writes target_feature_profile_forensics only.",
  production_entrypoint_switched: true,
  global_production_deployment_switched: false
});
