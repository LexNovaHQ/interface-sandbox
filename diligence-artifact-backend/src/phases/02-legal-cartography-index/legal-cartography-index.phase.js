export const LEGAL_CARTOGRAPHY_INDEX_PHASE = Object.freeze({
  order: 2,
  phase_id: "LEGAL_CARTOGRAPHY_INDEX",
  public_label: "Legal Cartography and Index",
  implementation_status: "MIGRATION_TARGET",
  responsibility: "Create the legal document map, semantic legal profile, final legal cartography index, and deterministic support overlays for downstream profile work.",
  material_outputs: ["legal_cartography_deterministic_map", "legal_cartography_semantic_profile", "legal_cartography_index", "m7_deterministic_legal_signal_overlay", "m10_selected_legal_support_packet"],
  runtime_boundary: "Runtime orchestrates. This phase owns legal cartography product logic after helper migration."
});
