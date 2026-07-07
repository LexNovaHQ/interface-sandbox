import { PHASE7_FORBIDDEN_SEMANTIC_CONCLUSION_PATTERNS, PHASE7_SEMANTIC_RESOLUTION_STATUSES } from "./layer7-semantic-resolution-status-policy.js";

const FORBIDDEN_KEYS = Object.freeze(["excerpt", "excerpts", "raw_text", "clean_text", "content", "body", "html", "markdown", "text", "final_value", "final_dap_value", "profile_value", "legal_conclusion", "compliance_status"]);

export function validatePhase7ModelResolutionPackets(resolutionPackets, { modelWorkPacketManifest } = {}) {
  const errors = [];
  if (!resolutionPackets || resolutionPackets.artifact_type !== "dap_model_resolution_packets") errors.push("wrong_resolution_packets_type");
  const policy = resolutionPackets?.resolver_policy || {};
  if (policy.bounded_packet_inputs_only !== true) errors.push("bounded_inputs_not_locked");
  if (policy.model_may_resolve_only_layer6_routed_fields !== true) errors.push("layer6_scope_not_locked");
  if (policy.no_corpus_access !== true) errors.push("corpus_access_not_forbidden");
  if (policy.no_source_text !== true) errors.push("source_text_not_forbidden");
  if (policy.no_excerpts !== true) errors.push("excerpts_not_forbidden");
  if (policy.no_legal_conclusions !== true) errors.push("legal_conclusions_not_forbidden");
  if (policy.no_deterministic_override !== true) errors.push("deterministic_override_not_forbidden");
  if (policy.no_final_dap_profile_values !== true) errors.push("final_values_not_forbidden");
  assertNoForbiddenKeys(resolutionPackets, "dap_model_resolution_packets", errors);
  const allowedFieldIds = new Set(modelWorkPacketManifest?.routed_field_ids || []);
  const seen = new Set();
  for (const packet of resolutionPackets?.resolution_packets || []) validatePacket(packet, allowedFieldIds, seen, errors);
  for (const fieldId of allowedFieldIds) if (!seen.has(fieldId)) errors.push(`routed_field_missing_resolution:${fieldId}`);
  return Object.freeze({
    status: errors.length ? "REPAIR_REQUIRED" : "PASS",
    checked_packets: resolutionPackets?.resolution_packets?.length || 0,
    checked_fields: seen.size,
    only_layer6_fields_resolved: !errors.some((error) => error.includes("field_not_routed_by_layer6")),
    no_legal_conclusions: !errors.some((error) => error.includes("legal") || error.includes("compliance")),
    no_source_text_or_excerpts: !errors.some((error) => error.includes("source_text") || error.includes("excerpt") || error.includes("raw_text") || error.includes("content")),
    no_final_values: !errors.some((error) => error.includes("final") || error.includes("profile_value")),
    errors
  });
}

function validatePacket(packet, allowedFieldIds, seen, errors) {
  if (!packet.resolution_packet_id) errors.push("missing_resolution_packet_id");
  if (packet.packet_resolution_boundary?.structured_only !== true) errors.push(`packet_not_structured_only:${packet.resolution_packet_id}`);
  if (packet.packet_resolution_boundary?.no_source_text !== true) errors.push(`packet_source_text_allowed:${packet.resolution_packet_id}`);
  if (packet.packet_resolution_boundary?.no_legal_conclusions !== true) errors.push(`packet_legal_conclusions_allowed:${packet.resolution_packet_id}`);
  if (packet.packet_resolution_boundary?.no_final_values !== true) errors.push(`packet_final_values_allowed:${packet.resolution_packet_id}`);
  if (!Array.isArray(packet.resolutions) || packet.resolutions.length !== packet.field_count) errors.push(`packet_resolution_count_mismatch:${packet.resolution_packet_id}`);
  for (const row of packet.resolutions || []) validateResolution(row, allowedFieldIds, seen, errors);
}

function validateResolution(row, allowedFieldIds, seen, errors) {
  if (!row.field_id) errors.push("resolution_missing_field_id");
  if (!allowedFieldIds.has(row.field_id)) errors.push(`field_not_routed_by_layer6:${row.field_id}`);
  if (seen.has(row.field_id)) errors.push(`duplicate_resolution_field:${row.field_id}`);
  seen.add(row.field_id);
  if (!PHASE7_SEMANTIC_RESOLUTION_STATUSES.includes(row.semantic_resolution_status)) errors.push(`bad_semantic_status:${row.field_id}:${row.semantic_resolution_status}`);
  if (row.output_boundary !== "STRUCTURED_CANDIDATE_ONLY_NOT_FINAL_DAP_VALUE") errors.push(`bad_output_boundary:${row.field_id}`);
  if (row.forbidden_inference_check_passed !== true) errors.push(`forbidden_inference_not_passed:${row.field_id}`);
  const semanticText = JSON.stringify({ candidate: row.structured_resolution_candidate, reason_code: row.reason_code });
  if (PHASE7_FORBIDDEN_SEMANTIC_CONCLUSION_PATTERNS.some((pattern) => pattern.test(semanticText))) errors.push(`forbidden_semantic_conclusion:${row.field_id}`);
}

function assertNoForbiddenKeys(value, path, errors) {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) return value.forEach((item, index) => assertNoForbiddenKeys(item, `${path}[${index}]`, errors));
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.includes(key)) errors.push(`forbidden_key:${path}.${key}`);
    if (child && typeof child === "object") assertNoForbiddenKeys(child, `${path}.${key}`, errors);
  }
}
