import { PHASE7_DAP_SEMANTIC_BATCH_PLAN } from "./dap-strategic-derivation-matrix.js";

export const DATA_PROVENANCE_PROFILE_PHASE = Object.freeze({
  order: 7,
  phase_id: "DATA_PROVENANCE_PROFILE",
  public_label: "Data Provenance Profile",
  package_label: "Semantic-Led Data and Privacy Architecture Profile",
  implementation_status: "PHASE7_LAYER4_PHASE2G_ROUTE_SCOPED_RUNTIME_CUTOVER_COMPLETE",
  responsibility: "Own the 150-field Data and Privacy Architecture material base through registry compilation, routed semantic batches and deterministic quality gating. Compiler, report projection and forensics remain outside Phase 7.",
  routing_authority: "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY",
  layer_1_artifacts: ["dap_registry_manifest", "dap_strategic_derivation_matrix"],
  layer_3_artifact: "dap_semantic_batch_route_manifest",
  layer_4_artifacts: PHASE7_DAP_SEMANTIC_BATCH_PLAN.map((batch) => batch.artifact_name),
  layer_5_artifacts: ["dap_semantic_batch_validation_manifest", "data_provenance_profile_semantic_batch_gate"],
  material_source_of_truth: "data_provenance_profile_semantic_batch_gate",
  compiler_inside_phase7: false,
  report_projection_inside_phase7: false,
  forensics_inside_phase7: false,
  runtime_boundary: "Phase 7 consumes the Phase 2G data/privacy route, emits 17 material semantic batch profiles plus validation artifacts, and hands the gated material base to downstream phases."
});
