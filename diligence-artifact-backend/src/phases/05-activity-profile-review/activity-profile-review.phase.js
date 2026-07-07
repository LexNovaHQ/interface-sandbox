export const ACTIVITY_PROFILE_REVIEW_PHASE = Object.freeze({
  order: 5,
  phase_id: "ACTIVITY_PROFILE_REVIEW",
  public_label: "Activity Profile Review",
  implementation_status: "PHASE_RUNNER_CUTOVER_ACTIVE_ACTIVITY_FORENSICS_PENDING",
  responsibility: "Build the deterministic Activity Candidate Inventory index, then derive the Activity Profile Review material profile from admitted product/activity source material.",
  material_outputs: ["feature_candidate_inventory", "target_feature_profile"],
  active_contract_locked: "ACTIVITY_PROFILE_REVIEW_CONTRACT_v1_MATERIAL_LOCKED",
  deterministic_outputs: ["feature_candidate_inventory"],
  model_outputs: ["target_feature_profile"],
  runner_status: "ACTIVITY_CANDIDATE_INVENTORY_PHASE_RUNNER_ACTIVE_ACTIVITY_PROFILE_REVIEW_MATERIAL_RUNNER_ACTIVE",
  runtime_boundary: "Runtime orchestrates persistence and locking. Activity Candidate Inventory and Activity Profile Review material are active phase-owned runtime runners. Activity Profile Forensics remains pending for Phase 6.",
  production_entrypoint_switched: true,
  activity_profile_review_material_entrypoint_switched: true,
  global_production_deployment_switched: false
});
