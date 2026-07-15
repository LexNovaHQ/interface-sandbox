import { normalizePhase7SemanticStatus } from "./layer7-semantic-resolution-status-policy.js";

export function buildPhase7ModelResolutionPackets({ modelWorkPacketManifest, semanticResponses = [] } = {}) {
  if (!modelWorkPacketManifest || modelWorkPacketManifest.artifact_type !== "dap_model_work_packet_manifest") throw new Error("PHASE7_LAYER7_REQUIRES_MODEL_WORK_PACKET_MANIFEST");
  const responseMap = new Map(semanticResponses.map((row) => [row.field_id, row]));
  const resolutionPackets = (modelWorkPacketManifest.packets || []).map((packet) => buildResolutionPacket({ packet, responseMap }));
  return Object.freeze({
    artifact_type: "dap_model_resolution_packets",
    manifest_version: "phase7_layer7_bounded_semantic_resolution_packets_v1",
    phase_id: "DATA_PROVENANCE_PROFILE",
    layer_id: "LAYER_7_SEMANTIC_RESOLVER",
    resolver_policy: Object.freeze({
      bounded_packet_inputs_only: true,
      model_may_resolve_only_layer6_routed_fields: true,
      no_corpus_access: true,
      no_source_text: true,
      no_excerpts: true,
      no_legal_conclusions: true,
      no_deterministic_override: true,
      structured_resolutions_only: true,
      no_final_dap_profile_values: true
    }),
    source_model_packet_manifest_version: modelWorkPacketManifest.manifest_version,
    packet_count: resolutionPackets.length,
    resolution_packets: Object.freeze(resolutionPackets),
    resolved_field_ids: Object.freeze(resolutionPackets.flatMap((packet) => packet.resolutions.map((row) => row.field_id)))
  });
}

function buildResolutionPacket({ packet, responseMap }) {
  const resolutions = (packet.field_refs || []).map((fieldRef) => buildResolution({ packet, fieldRef, response: responseMap.get(fieldRef.field_id) }));
  return Object.freeze({
    resolution_packet_id: `${packet.packet_id}-RESOLUTION`,
    source_packet_id: packet.packet_id,
    model_packet_family: packet.model_packet_family,
    packet_resolution_boundary: Object.freeze({ structured_only: true, no_source_text: true, no_legal_conclusions: true, no_final_values: true }),
    field_count: resolutions.length,
    resolutions: Object.freeze(resolutions)
  });
}

function buildResolution({ packet, fieldRef, response }) {
  const status = normalizePhase7SemanticStatus(response?.semantic_resolution_status || response?.resolution_status || "SEMANTIC_PACKET_READY");
  return Object.freeze({
    field_id: fieldRef.field_id,
    source_packet_id: packet.packet_id,
    model_packet_family: packet.model_packet_family,
    semantic_resolution_status: status,
    structured_resolution_candidate: response?.structured_resolution_candidate || null,
    confidence_band: response?.confidence_band || "NOT_EVALUATED_LAYER7_STAGED",
    reason_code: response?.reason_code || "SEMANTIC_PACKET_READY_FOR_RESOLUTION",
    limitation_carried_forward: Boolean(response?.limitation_carried_forward || fieldRef.limitation_trigger),
    missing_proof_carried_forward: Boolean(response?.missing_proof_carried_forward || fieldRef.missing_proof_trigger),
    private_confirmation_required: Boolean(response?.private_confirmation_required),
    forbidden_inference_check_passed: response?.forbidden_inference_check_passed !== false,
    supporting_route_ids: Object.freeze(fieldRef.supporting_route_ids || []),
    supporting_atom_ids: Object.freeze(fieldRef.supporting_atom_ids || []),
    supporting_activity_join_ids: Object.freeze(fieldRef.supporting_activity_join_ids || []),
    forbidden_inference: fieldRef.forbidden_inference,
    output_boundary: "STRUCTURED_CANDIDATE_ONLY_NOT_FINAL_DAP_VALUE"
  });
}
