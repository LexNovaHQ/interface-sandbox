export const COMPILER_PHASE = Object.freeze({
  order: 12,
  phase_id: "COMPILER",
  public_label: "Compiler",
  implementation_status: "PRODUCTION_CUTOVER_COMPLETE",
  responsibility: "Project direct upstream material profiles into clean report artifacts, validate custody and purity, and hand the canonical report manifest to the renderer. Qualified Review remains separate.",
  material_outputs: [
    "report_manifest",
    "report_handoff",
    "final_output_handoff",
    "phase12_compiler_validation",
    "phase12_report_custody_manifest",
    "renderer_payload"
  ],
  runtime_boundary: "Phase 12 reads direct material profile artifacts only. Phase 2G, workpads and forensic artifacts are forbidden."
});
