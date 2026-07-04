export const SOURCE_DISCOVERY_PHASE = Object.freeze({
  order: 1,
  phase_id: "SOURCE_DISCOVERY",
  public_label: "Source Discovery",
  implementation_status: "PHASE_OWNED_IMPLEMENTATION",
  old_helper_dependency_removed: true,
  responsibility: "Discover, extract, classify, and package public source material into the source discovery handoff.",
  material_outputs: ["deduped_url_manifest", "source_family_index", "source_discovery_handoff"],
  owned_services: ["url-manifest.service.js", "source-extraction.service.js", "source-family-handoff.service.js"],
  runtime_boundary: "Runtime orchestrates. This phase owns Source Discovery implementation logic. Old source discovery helpers are cut off from the new runtime."
});
