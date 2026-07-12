export const DILIGENCE_QA_COMPLETE_PHASE = Object.freeze({
  order: 13,
  phase_id: "DILIGENCE_QA_COMPLETE",
  public_label: "Diligence-QA Complete",
  implementation_status: "MIGRATION_TARGET",
  responsibility: "Confirm report renderer and Qualified Review artifacts are present, then issue terminal diligence QA completion receipt.",
  material_outputs: ["diligence_qa_completion_receipt"],
  runtime_boundary: "Runtime orchestrates. This phase owns terminal diligence QA completion logic after helper migration."
});
