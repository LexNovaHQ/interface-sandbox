import { normalizePhase7ActivitySources } from "./layer4-activity-source-normalizer.js";

const ACTIVITY_FAMILY_MAP = Object.freeze({
  base: Object.freeze(["DAP.PARTY", "DAP.OBJ", "DAP.FLOW"]),
  with_object: Object.freeze(["DAP.AUTH", "DAP.SENS"]),
  ai: Object.freeze(["DAP.DOM", "DAP.SEC"]),
  vendor: Object.freeze(["DAP.VEND", "DAP.LOC"]),
  retention: Object.freeze(["DAP.RET", "DAP.CTRL"])
});

export function buildPhase7ActivityDataFlowCandidateMap({ dapRegistryManifest, sourceNavigationInventory, evidenceAtomInventory, artifacts = {} } = {}) {
  if (!dapRegistryManifest || dapRegistryManifest.artifact_type !== "dap_registry_manifest") throw new Error("PHASE7_LAYER4_REQUIRES_DAP_REGISTRY_MANIFEST");
  if (!sourceNavigationInventory || sourceNavigationInventory.artifact_type !== "dap_source_navigation_inventory") throw new Error("PHASE7_LAYER4_REQUIRES_SOURCE_NAVIGATION_INVENTORY");
  if (!evidenceAtomInventory || evidenceAtomInventory.artifact_type !== "dap_evidence_atom_inventory") throw new Error("PHASE7_LAYER4_REQUIRES_EVIDENCE_ATOM_INVENTORY");
  const activities = normalizePhase7ActivitySources({ artifacts });
  const joined = activities.map((activity) => joinActivity({ activity, sourceNavigationInventory, evidenceAtomInventory }));
  return Object.freeze({
    artifact_type: "activity_data_flow_candidate_map",
    manifest_version: "phase7_layer4_activity_data_flow_candidate_map_v1",
    phase_id: "DATA_PROVENANCE_PROFILE",
    layer_id: "LAYER_4_ACTIVITY_DATA_JOINER",
    join_policy: Object.freeze({ deterministic_only: true, no_model_calls: true, no_final_dap_values: true, no_excerpts: true }),
    normalized_activities: activities,
    activity_data_flow_candidates: Object.freeze(joined),
    dap_family_activity_obligation_index: buildFamilyIndex(joined),
    activity_join_coverage: Object.freeze({ activity_count: activities.length, joined_activity_count: joined.length, evidence_atom_count: evidenceAtomInventory.evidence_atoms.length })
  });
}

function joinActivity({ activity, sourceNavigationInventory, evidenceAtomInventory }) {
  const families = familiesForActivity(activity);
  const familyRows = sourceNavigationInventory.dap_family_source_coverage_matrix.filter((row) => families.includes(row.registry_family));
  const routeIds = unique(familyRows.flatMap((row) => [...row.primary_route_ids, ...row.secondary_route_ids]));
  const atomIds = evidenceAtomInventory.evidence_atoms.filter((atom) => routeIds.includes(atom.source_route_id)).map((atom) => atom.atom_id);
  return Object.freeze({
    activity_join_id: activity.activity_join_id,
    activity_reference: activity.activity_reference,
    product_service_wrapper: activity.product_service_wrapper,
    activity_feature_name: activity.activity_feature_name,
    input_signal: activity.input_signal,
    output_signal: activity.output_signal,
    data_content_object_touched: activity.data_content_object_touched,
    archetype_codes: activity.archetype_codes,
    candidate_dap_families: Object.freeze(families),
    supporting_route_ids: Object.freeze(routeIds),
    supporting_atom_ids: Object.freeze(atomIds),
    join_status: atomIds.length ? "ACTIVITY_DAP_JOIN_READY" : "ACTIVITY_DAP_JOIN_REQUIRES_NAVIGATION_REPAIR",
    anti_unknown_status: atomIds.length ? "DERIVED_CROSS_ROUTE" : "NAVIGATION_DEFECT_REPAIR_REQUIRED"
  });
}

function familiesForActivity(activity) {
  const families = new Set(ACTIVITY_FAMILY_MAP.base);
  if (activity.data_content_object_touched.length || activity.input_signal !== "not_visible_from_activity_source" || activity.output_signal !== "not_visible_from_activity_source") ACTIVITY_FAMILY_MAP.with_object.forEach((family) => families.add(family));
  const haystack = [activity.activity_feature_name, activity.product_service_wrapper, ...activity.archetype_codes, ...activity.surface_context_tokens].join(" ").toLowerCase();
  if (/ai|model|prompt|embedding|training|llm|inference/.test(haystack)) ACTIVITY_FAMILY_MAP.ai.forEach((family) => families.add(family));
  if (/api|integration|vendor|processor|partner|subprocessor|cloud/.test(haystack)) ACTIVITY_FAMILY_MAP.vendor.forEach((family) => families.add(family));
  if (/delete|export|retain|retention|log|backup/.test(haystack)) ACTIVITY_FAMILY_MAP.retention.forEach((family) => families.add(family));
  return Array.from(families);
}

function buildFamilyIndex(joined) {
  const index = {};
  for (const row of joined) for (const family of row.candidate_dap_families) {
    if (!index[family]) index[family] = [];
    index[family].push(row.activity_join_id);
  }
  return Object.freeze(Object.fromEntries(Object.entries(index).map(([family, ids]) => [family, Object.freeze(ids)])));
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}
