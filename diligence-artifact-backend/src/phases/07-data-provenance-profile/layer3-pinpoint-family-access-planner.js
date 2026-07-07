export function buildPhase7PinpointFamilyAccessPlan({ sourceNavigationInventory } = {}) {
  if (!sourceNavigationInventory || sourceNavigationInventory.artifact_type !== "dap_source_navigation_inventory") throw new Error("PHASE7_LAYER3_REQUIRES_SOURCE_NAVIGATION_INVENTORY");
  const routes = sourceNavigationInventory.admitted_source_route_inventory || [];
  return Object.freeze({
    artifact_type: "dap_pinpoint_family_access_plan",
    manifest_version: "phase7_layer3_pinpoint_family_access_plan_v1",
    phase_id: "DATA_PROVENANCE_PROFILE",
    layer_id: "LAYER_3_PINPOINT_EVIDENCE_ATOM_EXTRACTOR",
    access_policy: Object.freeze({
      full_d_family_access_allowed_for_navigation: true,
      full_l_family_access_allowed_for_navigation: true,
      entrypoint_must_be_layer2_locator: true,
      whole_family_output_allowed: false,
      full_document_output_allowed: false,
      excerpts_allowed: false
    }),
    read_tasks: routes.map((route, index) => buildReadTask(route, index))
  });
}

function buildReadTask(route, index) {
  const legalFamily = /^lossless_family__L\d_/i.test(route.source_family || "");
  const dataFamily = /^lossless_family__D\d_/i.test(route.source_family || "");
  return Object.freeze({
    read_task_id: `DAP-ATOM-READ-${String(index + 1).padStart(4, "0")}`,
    route_id: route.route_id,
    source_artifact: route.source_artifact,
    source_family: route.source_family,
    document_type: route.document_type,
    artifact_path: route.artifact_path,
    source_url_or_route: route.source_url_or_route,
    pinpoint_locator: route.pinpoint_locator,
    legal_cartography_locator_required: route.legal_cartography_locator_required,
    legal_cartography_locator_present: route.legal_cartography_locator_present,
    full_family_access_allowed_for_navigation: dataFamily || legalFamily || isUpstreamArtifact(route.source_artifact),
    access_mode: legalFamily ? "FULL_L_FAMILY_ACCESS_WITH_LEGAL_CARTOGRAPHY_PINPOINT_CURSOR" : dataFamily ? "FULL_D_FAMILY_ACCESS_WITH_LAYER2_PINPOINT_CURSOR" : "ARTIFACT_ACCESS_WITH_LAYER2_PINPOINT_CURSOR",
    output_boundary: "ATOMIZED_SIGNALS_ONLY_NO_EXCERPTS_NO_FULL_DOCUMENT",
    whole_family_output_allowed: false,
    full_document_output_allowed: false,
    excerpt_output_allowed: false
  });
}

function isUpstreamArtifact(name = "") {
  return ["legal_cartography_index", "legal_signal_derivation_profile", "target_profile", "target_profile_forensics", "feature_candidate_inventory", "target_feature_profile", "target_feature_profile_forensics", "source_discovery_handoff"].includes(String(name));
}
