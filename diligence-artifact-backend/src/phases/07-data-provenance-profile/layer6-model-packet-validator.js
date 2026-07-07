const FORBIDDEN_KEYS = Object.freeze(["excerpt", "excerpts", "raw_text", "clean_text", "content", "body", "html", "markdown", "text", "final_value", "final_dap_value", "profile_value"]);

export function validatePhase7ModelWorkPacketManifest(manifest, { dapFieldPrefillMatrix } = {}) {
  const errors = [];
  if (!manifest || manifest.artifact_type !== "dap_model_work_packet_manifest") errors.push("wrong_model_packet_manifest_type");
  if (manifest?.router_policy?.deterministic_only !== true) errors.push("router_not_deterministic_only");
  if (manifest?.router_policy?.no_model_call !== true) errors.push("router_made_model_call");
  if (manifest?.router_policy?.bounded_packets_only !== true) errors.push("bounded_packets_not_locked");
  if (manifest?.router_policy?.no_corpus_access !== true) errors.push("corpus_access_not_forbidden");
  if (manifest?.router_policy?.no_excerpts !== true) errors.push("excerpts_not_forbidden");
  if (manifest?.router_policy?.no_full_document_payloads !== true) errors.push("full_document_payloads_not_forbidden");
  if (manifest?.router_policy?.no_final_dap_profile_values !== true) errors.push("final_values_not_forbidden");
  assertNoForbiddenKeys(manifest, "dap_model_work_packet_manifest", errors);
  const requiredRows = (dapFieldPrefillMatrix?.prefill_rows || []).filter((row) => row.model_packet_required === true);
  const routedIds = new Set(manifest?.routed_field_ids || []);
  if (requiredRows.length !== (manifest?.model_required_field_count || 0)) errors.push("model_required_count_mismatch");
  for (const row of requiredRows) if (!routedIds.has(row.field_id)) errors.push(`model_required_field_not_routed:${row.field_id}`);
  for (const packet of manifest?.packets || []) validatePacket(packet, errors);
  return Object.freeze({
    status: errors.length ? "REPAIR_REQUIRED" : "PASS",
    packet_count: manifest?.packet_count || 0,
    model_required_field_count: manifest?.model_required_field_count || 0,
    all_model_required_fields_routed: requiredRows.every((row) => routedIds.has(row.field_id)),
    bounded_packets_only: manifest?.router_policy?.bounded_packets_only === true,
    no_excerpts: !errors.some((error) => error.includes("excerpt") || error.includes("raw_text") || error.includes("clean_text") || error.includes("content")),
    no_final_values: !errors.some((error) => error.includes("final") || error.includes("profile_value")),
    errors
  });
}

function validatePacket(packet, errors) {
  if (!packet.packet_id) errors.push("missing_packet_id");
  if (!packet.model_packet_family) errors.push(`missing_packet_family:${packet.packet_id}`);
  if (!Array.isArray(packet.field_refs) || packet.field_refs.length !== packet.field_count) errors.push(`packet_field_ref_count_mismatch:${packet.packet_id}`);
  if (packet.packet_input_boundary?.field_rules_only !== true) errors.push(`packet_boundary_rules_not_locked:${packet.packet_id}`);
  if (packet.packet_input_boundary?.ids_only_for_supporting_material !== true) errors.push(`packet_boundary_ids_not_locked:${packet.packet_id}`);
  if (packet.packet_input_boundary?.no_source_text !== true) errors.push(`packet_boundary_source_text_allowed:${packet.packet_id}`);
  if (packet.packet_input_boundary?.no_final_values !== true) errors.push(`packet_boundary_final_values_allowed:${packet.packet_id}`);
}

function assertNoForbiddenKeys(value, path, errors) {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) return value.forEach((item, index) => assertNoForbiddenKeys(item, `${path}[${index}]`, errors));
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.includes(key)) errors.push(`forbidden_key:${path}.${key}`);
    if (child && typeof child === "object") assertNoForbiddenKeys(child, `${path}.${key}`, errors);
  }
}
