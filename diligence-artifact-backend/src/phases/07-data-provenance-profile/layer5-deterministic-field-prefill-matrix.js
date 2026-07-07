import { phase7ModelRequiredForPrefillStatus, selectPhase7PrefillStatus } from "./layer5-prefill-status-policy.js";

export function buildPhase7DeterministicFieldPrefillMatrix({ dapRegistryManifest, sourceNavigationInventory, evidenceAtomInventory, activityDataFlowCandidateMap } = {}) {
  if (!dapRegistryManifest || dapRegistryManifest.artifact_type !== "dap_registry_manifest") throw new Error("PHASE7_LAYER5_REQUIRES_DAP_REGISTRY_MANIFEST");
  if (!sourceNavigationInventory || sourceNavigationInventory.artifact_type !== "dap_source_navigation_inventory") throw new Error("PHASE7_LAYER5_REQUIRES_SOURCE_NAVIGATION_INVENTORY");
  if (!evidenceAtomInventory || evidenceAtomInventory.artifact_type !== "dap_evidence_atom_inventory") throw new Error("PHASE7_LAYER5_REQUIRES_EVIDENCE_ATOM_INVENTORY");
  if (!activityDataFlowCandidateMap || activityDataFlowCandidateMap.artifact_type !== "activity_data_flow_candidate_map") throw new Error("PHASE7_LAYER5_REQUIRES_ACTIVITY_DATA_FLOW_CANDIDATE_MAP");
  const rows = dapRegistryManifest.material_rules.map((rule) => prefillRow({ rule, sourceNavigationInventory, evidenceAtomInventory, activityDataFlowCandidateMap }));
  return Object.freeze({
    artifact_type: "dap_field_prefill_matrix",
    manifest_version: "phase7_layer5_deterministic_field_prefill_matrix_v1",
    phase_id: "DATA_PROVENANCE_PROFILE",
    layer_id: "LAYER_5_DETERMINISTIC_FIELD_PREFILL_MATRIX",
    prefill_policy: Object.freeze({ deterministic_only: true, no_model_calls: true, no_final_dap_profile_values: true, no_excerpts: true, anti_unknown_required: true }),
    expected_field_count: dapRegistryManifest.expected_dap_field_count,
    actual_field_count: rows.length,
    prefill_rows: Object.freeze(rows),
    status_counts: countBy(rows, (row) => row.prefill_candidate_status),
    model_packet_queue_seed: Object.freeze(rows.filter((row) => row.model_packet_required).map((row) => Object.freeze({ field_id: row.field_id, model_packet_family: row.model_packet_family, reason: row.prefill_candidate_status })))
  });
}

function prefillRow({ rule, sourceNavigationInventory, evidenceAtomInventory, activityDataFlowCandidateMap }) {
  const coverage = sourceNavigationInventory.dap_family_source_coverage_matrix.find((row) => row.registry_family === rule.registry_family);
  const routeIds = unique([...(coverage?.primary_route_ids || []), ...(coverage?.secondary_route_ids || [])]);
  const atomIds = evidenceAtomInventory.evidence_atoms.filter((atom) => routeIds.includes(atom.source_route_id)).map((atom) => atom.atom_id);
  const activityJoinIds = activityDataFlowCandidateMap.dap_family_activity_obligation_index?.[rule.registry_family] || [];
  const status = selectPhase7PrefillStatus({ rule, routeIds, atomIds, activityJoinIds });
  return Object.freeze({
    field_id: rule.field_id,
    output_field: rule.output_field,
    registry_family: rule.registry_family,
    material_section_id: rule.material_section_id,
    material_subsection_id: rule.material_subsection_id,
    mode: rule.mode,
    source_basis: rule.source_basis,
    conditions: rule.conditions,
    trigger_outcome: rule.trigger_outcome,
    exclude_fallback: rule.exclude_fallback,
    forbidden_inference: rule.forbidden_inference,
    deterministic_prefill_eligible: rule.deterministic_prefill_eligible,
    supporting_activity_join_ids: Object.freeze(activityJoinIds),
    supporting_route_ids: Object.freeze(routeIds),
    supporting_atom_ids: Object.freeze(atomIds),
    prefill_candidate_status: status,
    prefill_candidate_kind: "PREFILL_CANDIDATE_ONLY_NOT_FINAL_VALUE",
    model_packet_family: rule.model_packet_family,
    model_packet_required: phase7ModelRequiredForPrefillStatus(status),
    limitation_trigger: rule.limitation_trigger,
    missing_proof_trigger: rule.missing_proof_trigger,
    anti_unknown_status: status,
    downstream_instruction: "Layer 5 may seed later packets and compiler rows only; it must not emit the final DAP profile."
  });
}

function unique(values) { return Array.from(new Set(values.filter(Boolean))); }
function countBy(rows, fn) { return Object.freeze(rows.reduce((acc, row) => { const key = fn(row) || "UNCLASSIFIED"; acc[key] = (acc[key] || 0) + 1; return acc; }, {})); }
