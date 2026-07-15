export const ACTIVITY_PROFILE_REVIEW_PHASE = Object.freeze({
  order: 5,
  phase_id: "ACTIVITY_PROFILE_REVIEW",
  public_label: "Activity Profile Review",
  implementation_status: "PHASE5_LAYER2_CODE_CUTOVER_ACTIVE_CONTRACT_RUNNER_VALIDATOR",
  responsibility: "Build Activity Candidate Inventory and Activity Profile Review material output.",
  material_outputs: ["feature_candidate_inventory", "target_feature_profile"],
  active_contract_locked: "ACTIVITY_PROFILE_REVIEW_CONTRACT_v8_AGNOSTIC_TAXONOMY",
  deterministic_led_outputs: ["feature_candidate_inventory"],
  model_outputs: ["target_feature_profile"],
  runner_status: "ACTIVITY_CANDIDATE_INVENTORY_AND_ACTIVITY_PROFILE_REVIEW_ACTIVE",
  layer2_schema: "PRIMARY_OVERLAY_PACKAGE_SCOPED_SPLIT",
  mounted_taxonomy_ref_required: true,
  runtime_boundary: "Activity Profile Forensics is owned by Phase 6.",
  production_entrypoint_switched: true,
  activity_profile_review_material_entrypoint_switched: true,
  global_production_deployment_switched: false
});
