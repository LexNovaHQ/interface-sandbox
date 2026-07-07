export function buildPhase7EvidenceAtomInventory({ sourceNavigationInventory } = {}) {
  if (!sourceNavigationInventory || sourceNavigationInventory.artifact_type !== "dap_source_navigation_inventory") throw new Error("PHASE7_LAYER3_REQUIRES_SOURCE_NAVIGATION_INVENTORY");
  const routes = sourceNavigationInventory.admitted_source_route_inventory || [];
  const evidence_atoms = routes.map((route, index) => Object.freeze({
    atom_id: `DAP-ATOM-${String(index + 1).padStart(4, "0")}`,
    atom_type: "ROUTE_LOCATOR_ATOM",
    atom_status: "PINPOINT_ATOM_CREATED",
    source_route_id: route.route_id,
    source_artifact: route.source_artifact,
    source_family: route.source_family,
    document_type: route.document_type,
    source_url_or_route: route.source_url_or_route,
    artifact_path: route.artifact_path,
    pinpoint_locator: route.pinpoint_locator,
    anti_unknown_status: "DERIVED_DIRECT",
    whole_family_access_was_allowed_for_navigation: true,
    whole_family_output_allowed: false,
    full_document_output_allowed: false,
    excerpt_output_allowed: false
  }));
  return Object.freeze({
    artifact_type: "dap_evidence_atom_inventory",
    manifest_version: "phase7_layer3_evidence_atom_inventory_v1",
    phase_id: "DATA_PROVENANCE_PROFILE",
    layer_id: "LAYER_3_PINPOINT_EVIDENCE_ATOM_EXTRACTOR",
    evidence_atoms: Object.freeze(evidence_atoms)
  });
}
