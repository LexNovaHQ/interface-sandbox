export function buildPhase7ModelWorkPacketManifest({ dapFieldPrefillMatrix } = {}) {
  if (!dapFieldPrefillMatrix || dapFieldPrefillMatrix.artifact_type !== "dap_field_prefill_matrix") throw new Error("PHASE7_LAYER6_REQUIRES_PREFILL_MATRIX");
  const rows = dapFieldPrefillMatrix.prefill_rows || [];
  const required = rows.filter((row) => row.model_packet_required === true);
  const packets = groupBy(required, (row) => row.model_packet_family).map(([packetFamily, packetRows], index) => buildPacket({ packetFamily, packetRows, index }));
  return Object.freeze({
    artifact_type: "dap_model_work_packet_manifest",
    manifest_version: "phase7_layer6_model_work_packet_manifest_v1",
    phase_id: "DATA_PROVENANCE_PROFILE",
    layer_id: "LAYER_6_MODEL_WORK_PACKET_ROUTER",
    router_policy: Object.freeze({ deterministic_only: true, no_model_call: true, bounded_packets_only: true, no_corpus_access: true, no_excerpts: true, no_full_document_payloads: true, no_final_dap_profile_values: true }),
    source_prefill_matrix_version: dapFieldPrefillMatrix.manifest_version,
    total_prefill_rows: rows.length,
    model_required_field_count: required.length,
    packet_count: packets.length,
    packets: Object.freeze(packets),
    routed_field_ids: Object.freeze(required.map((row) => row.field_id)),
    unrouted_model_required_field_ids: Object.freeze(required.filter((row) => !row.model_packet_family).map((row) => row.field_id))
  });
}

function buildPacket({ packetFamily, packetRows, index }) {
  return Object.freeze({
    packet_id: `DAP-MODEL-PACKET-${String(index + 1).padStart(3, "0")}`,
    model_packet_family: packetFamily,
    field_count: packetRows.length,
    field_ids: Object.freeze(packetRows.map((row) => row.field_id)),
    registry_families: Object.freeze(unique(packetRows.map((row) => row.registry_family))),
    material_section_ids: Object.freeze(unique(packetRows.map((row) => row.material_section_id))),
    supporting_route_ids: Object.freeze(unique(packetRows.flatMap((row) => row.supporting_route_ids || []))),
    supporting_atom_ids: Object.freeze(unique(packetRows.flatMap((row) => row.supporting_atom_ids || []))),
    supporting_activity_join_ids: Object.freeze(unique(packetRows.flatMap((row) => row.supporting_activity_join_ids || []))),
    packet_input_boundary: Object.freeze({ field_rules_only: true, ids_only_for_supporting_material: true, no_source_text: true, no_final_values: true }),
    field_refs: Object.freeze(packetRows.map((row) => Object.freeze({
      field_id: row.field_id,
      output_field: row.output_field,
      registry_family: row.registry_family,
      material_section_id: row.material_section_id,
      mode: row.mode,
      source_basis: row.source_basis,
      conditions: row.conditions,
      trigger_outcome: row.trigger_outcome,
      exclude_fallback: row.exclude_fallback,
      forbidden_inference: row.forbidden_inference,
      prefill_candidate_status: row.prefill_candidate_status,
      supporting_route_ids: Object.freeze(row.supporting_route_ids || []),
      supporting_atom_ids: Object.freeze(row.supporting_atom_ids || []),
      supporting_activity_join_ids: Object.freeze(row.supporting_activity_join_ids || []),
      limitation_trigger: row.limitation_trigger,
      missing_proof_trigger: row.missing_proof_trigger
    })))
  });
}

function groupBy(rows, fn) {
  const map = new Map();
  for (const row of rows) {
    const key = fn(row) || "UNROUTED_MODEL_PACKET";
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
  }
  return Array.from(map.entries());
}

function unique(values) { return Array.from(new Set(values.filter(Boolean))); }
