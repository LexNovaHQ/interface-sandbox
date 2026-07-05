export const ACTIVITY_PROFILE_REVIEW_PHASE = Object.freeze({
  order: 5,
  phase_id: "ACTIVITY_PROFILE_REVIEW",
  public_label: "Activity Profile Review",
  implementation_status: "ACTIVITY_CANDIDATE_INVENTORY_RUNNER_CUTOVER_STAGED",
  responsibility: "Build the deterministic Activity Candidate Inventory index, then derive the Activity Profile Review material profile from admitted product/activity source material.",
  material_outputs: ["feature_candidate_inventory", "target_feature_profile"],
  active_contract_locked: "ACTIVITY_CANDIDATE_INVENTORY_CONTRACT_v1_INDEX_ONLY",
  deterministic_outputs: ["feature_candidate_inventory"],
  model_outputs: ["target_feature_profile"],
  runner_status: "ACTIVITY_CANDIDATE_INVENTORY_PHASE_RUNNER_CUTOVER_STAGED",
  runtime_boundary: "Runtime orchestrates persistence and locking. Activity Candidate Inventory is staged for phase-owned runner cutover; Activity Profile Review material migration remains pending.",
  production_entrypoint_switched: true,
  global_production_deployment_switched: false
});
