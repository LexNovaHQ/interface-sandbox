export const QUALIFIED_REVIEW_PHASE = Object.freeze({
  order: 12,
  phase_id: "QUALIFIED_REVIEW",
  public_label: "Qualified Review",
  implementation_status: "MIGRATION_TARGET",
  responsibility: "Build Qualified Review section artifacts, renderer payload, and validation manifest from normalized compiler artifacts.",
  material_outputs: ["qr_artifact__entity_commercial", "qr_artifact__technology_infrastructure", "qr_artifact__ai_capability_product_behavior", "qr_artifact__dap_privacy_india_cyber", "qualified_review_renderer_payload", "qualified_review_validation_manifest"],
  runtime_boundary: "Runtime orchestrates. This phase owns Qualified Review matrix, artifact, validation, and renderer logic after helper migration."
});
