export const SOURCE_DISCOVERY_PHASE = Object.freeze({
  order: 1,
  phase_id: "SOURCE_DISCOVERY",
  public_label: "Source Discovery",
  implementation_status: "MIGRATION_TARGET",
  responsibility: "Discover, extract, classify, and package public source material into the source discovery handoff.",
  material_outputs: ["deduped_url_manifest", "source_family_index", "source_discovery_handoff"],
  runtime_boundary: "Runtime orchestrates. This phase owns source discovery product logic after extraction migration."
});
