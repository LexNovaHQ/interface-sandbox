export const TARGET_PROFILE_REVIEW_PHASE = Object.freeze({
  order: 3,
  phase_id: "TARGET_PROFILE_REVIEW",
  public_label: "Target Profile Review",
  implementation_status: "MIGRATION_TARGET",
  responsibility: "Derive the target entity, commercial, operating, and public identity profile from admitted target-family source material and legal signal overlays.",
  material_outputs: ["target_profile"],
  runtime_boundary: "Runtime orchestrates. This phase owns target profile review logic after helper migration."
});
