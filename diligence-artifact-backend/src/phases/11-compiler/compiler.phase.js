export const COMPILER_PHASE = Object.freeze({
  order: 11,
  phase_id: "COMPILER",
  public_label: "Compiler",
  implementation_status: "MIGRATION_TARGET",
  responsibility: "Compile normalized report artifacts and report-renderer payload. Qualified Review is separate and must not run inside compiler.",
  material_outputs: ["normalized_report_manifest", "review_ready_section_handoff", "final_output_handoff", "renderer_payload"],
  runtime_boundary: "Runtime orchestrates. This phase owns compiler and report-renderer logic after helper migration."
});
