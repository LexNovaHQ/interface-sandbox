import { buildPhase7PinpointFamilyAccessPlan } from "./layer3-pinpoint-family-access-planner.js";

export function buildPhase7EvidenceAtomInventory({ sourceNavigationInventory } = {}) {
  if (!sourceNavigationInventory || sourceNavigationInventory.artifact_type !== "dap_source_navigation_inventory") throw new Error("PHASE7_LAYER3_REQUIRES_SOURCE_NAVIGATION_INVENTORY");
  const access_plan = buildPhase7PinpointFamilyAccessPlan({ sourceNavigationInventory });
  const evidence_atoms = access_plan.read_tasks.map((task, index) => Object.freeze({
    atom_id: `DAP-ATOM-${String(index + 1).padStart(4, "0")}`,
    atom_type: "ROUTE_LOCATOR_ATOM",
    atom_status: "PINPOINT_ATOM_CREATED",
    source_route_id: task.route_id,
    source_artifact: task.source_artifact,
    source_family: task.source_family,
    document_type: task.document_type,
    source_url_or_route: task.source_url_or_route,
    artifact_path: task.artifact_path,
    pinpoint_locator: task.pinpoint_locator,
    anti_unknown_status: "DERIVED_DIRECT",
    family_access_mode: task.access_mode,
    whole_family_access_was_allowed_for_navigation: task.full_family_access_allowed_for_navigation,
    whole_family_output_allowed: false,
    full_document_output_allowed: false,
    excerpt_output_allowed: false
  }));
  return Object.freeze({
    artifact_type: "dap_evidence_atom_inventory",
    manifest_version: "phase7_layer3_evidence_atom_inventory_v1",
    phase_id: "DATA_PROVENANCE_PROFILE",
    layer_id: "LAYER_3_PINPOINT_EVIDENCE_ATOM_EXTRACTOR",
    extraction_policy: access_plan.access_policy,
    access_plan,
    evidence_atoms: Object.freeze(evidence_atoms),
    route_atom_coverage: Object.freeze(access_plan.read_tasks.map((task) => Object.freeze({ route_id: task.route_id, atom_count: evidence_atoms.filter((atom) => atom.source_route_id === task.route_id).length })))
  });
}
