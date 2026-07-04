export const ACTIVITY_PROFILE_REVIEW_PHASE = Object.freeze({
  order: 5,
  phase_id: "ACTIVITY_PROFILE_REVIEW",
  public_label: "Activity Profile Review",
  implementation_status: "MIGRATION_TARGET",
  responsibility: "Build the activity candidate inventory and derive the product/activity/IP behavior profile from admitted product-family source material.",
  material_outputs: ["feature_candidate_inventory", "target_feature_profile"],
  runtime_boundary: "Runtime orchestrates. This phase owns activity profile review logic after helper migration."
});
