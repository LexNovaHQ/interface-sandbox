const FORBIDDEN_KEYS = Object.freeze([
  "source_text",
  "raw_text",
  "clean_text",
  "excerpt",
  "excerpts",
  "dossier",
  "semantic_answer",
  "final_value",
  "profile_value",
  "compiler",
  "forensics",
  "report_projection",
  "data_provenance_profile",
  "integrated_dap_report",
  "data_provenance_profile_forensics"
]);

export function validatePhase7SemanticBatchRouteManifest(routeManifest, { dapRegistryManifest, strategicDerivationMatrix, dataPrivacyNavigationIndex } = {}) {
  const errors = [];
  if (!routeManifest || routeManifest.artifact_type !== "dap_semantic_batch_route_manifest") errors.push("wrong_artifact_type");
  const policy = routeManifest?.routing_policy || {};
  if (policy.deterministic_only !== true) errors.push("deterministic_only_not_locked");
  if (policy.no_semantic_reasoning !== true) errors.push("semantic_reasoning_not_forbidden_in_router");
  if (policy.no_dossier_emission !== true) errors.push("dossier_not_forbidden");
  if (policy.no_source_text !== true) errors.push("source_text_not_forbidden");
  if (policy.no_excerpts !== true) errors.push("excerpts_not_forbidden");
  if (policy.no_field_derivation !== true) errors.push("field_derivation_not_forbidden");
  if (policy.no_compiler_output !== true) errors.push("compiler_not_forbidden");
  if (policy.no_forensics_output !== true) errors.push("forensics_not_forbidden");
  if (policy.route_model_to_batch_only !== true) errors.push("route_model_to_batch_only_not_locked");
  assertNoForbiddenKeys(routeManifest, "dap_semantic_batch_route_manifest", errors);

  const packets = routeManifest?.batch_route_packets || [];
  if (!Array.isArray(packets) || packets.length !== 17) errors.push(`batch_route_packet_count_not_17:${packets.length || 0}`);
  const expectedFieldIds = new Set((dapRegistryManifest?.material_rules || []).map((row) => row.field_id));
  const returnedFieldIds = [];
  const expectedBatchArtifacts = new Set((strategicDerivationMatrix?.semantic_batch_plan || []).map((batch) => batch.artifact_name));
  const navigationPointerIds = new Set((dataPrivacyNavigationIndex?.semantic_navigation_overlay?.batch_navigation_pointers || []).map((pointer) => pointer.batch_id));

  for (const packet of packets) validateBatchPacket({ packet, expectedFieldIds, returnedFieldIds, expectedBatchArtifacts, navigationPointerIds, errors });
  if (returnedFieldIds.length !== expectedFieldIds.size) errors.push(`returned_field_count_mismatch:${returnedFieldIds.length}:${expectedFieldIds.size}`);
  if (new Set(returnedFieldIds).size !== returnedFieldIds.length) errors.push("duplicate_returned_field_ids");
  for (const fieldId of expectedFieldIds) if (!returnedFieldIds.includes(fieldId)) errors.push(`missing_routed_field_id:${fieldId}`);

  return Object.freeze({
    status: errors.length ? "REPAIR_REQUIRED" : "PASS",
    checked_batches: packets.length || 0,
    checked_fields: returnedFieldIds.length,
    no_dossier_or_source_text: !errors.some((error) => error.includes("dossier") || error.includes("source_text") || error.includes("excerpt") || error.includes("raw_text")),
    compiler_and_forensics_excluded: !errors.some((error) => error.includes("compiler") || error.includes("forensics") || error.includes("report_projection")),
    errors: Object.freeze(errors)
  });
}

function validateBatchPacket({ packet, expectedFieldIds, returnedFieldIds, expectedBatchArtifacts, navigationPointerIds, errors }) {
  if (!packet.batch_id) errors.push("packet_missing_batch_id");
  if (!navigationPointerIds.has(packet.batch_id)) errors.push(`packet_not_backed_by_navigation_pointer:${packet.batch_id}`);
  if (!expectedBatchArtifacts.has(packet.expected_artifact_name)) errors.push(`unexpected_batch_artifact:${packet.batch_id}:${packet.expected_artifact_name}`);
  if (!Array.isArray(packet.families) || !packet.families.length) errors.push(`packet_missing_families:${packet.batch_id}`);
  if (!Array.isArray(packet.expected_field_ids) || packet.expected_field_ids.length !== packet.expected_field_count) errors.push(`packet_field_count_mismatch:${packet.batch_id}`);
  if (!Array.isArray(packet.required_d_family_route_ids) || packet.required_d_family_route_ids.length !== 5) errors.push(`packet_d_routes_not_5:${packet.batch_id}`);
  if (!Array.isArray(packet.selective_l_family_route_ids) || packet.selective_l_family_route_ids.length < 1) errors.push(`packet_missing_l_routes:${packet.batch_id}`);
  if (!Array.isArray(packet.reading_priority) || !packet.reading_priority.length) errors.push(`packet_missing_reading_priority:${packet.batch_id}`);
  if (packet.schema_requirements?.required_root !== packet.expected_artifact_name) errors.push(`packet_schema_root_mismatch:${packet.batch_id}`);
  if (packet.schema_requirements?.returned_field_ids_must_equal_expected_field_ids !== true) errors.push(`packet_missing_field_id_exactness_rule:${packet.batch_id}`);
  if (packet.validation_requirements?.validate_navigation_index_usage !== true) errors.push(`packet_missing_navigation_validation:${packet.batch_id}`);
  if (packet.validation_requirements?.validate_no_legal_or_compliance_conclusion !== true) errors.push(`packet_missing_legal_firewall_validation:${packet.batch_id}`);
  if (!String(packet.model_instruction || "").includes("Do not emit compiler")) errors.push(`packet_missing_no_compiler_instruction:${packet.batch_id}`);
  for (const fieldId of packet.expected_field_ids || []) {
    returnedFieldIds.push(fieldId);
    if (!expectedFieldIds.has(fieldId)) errors.push(`unexpected_routed_field_id:${packet.batch_id}:${fieldId}`);
  }
  for (const row of packet.field_route_rows || []) {
    if (!row.field_id) errors.push(`field_route_row_missing_field_id:${packet.batch_id}`);
    if (!row.strategic_derivation?.primary_derivation) errors.push(`field_route_row_missing_strategic_derivation:${packet.batch_id}:${row.field_id}`);
    if (!row.forbidden_inference) errors.push(`field_route_row_missing_forbidden_inference:${packet.batch_id}:${row.field_id}`);
    if (!row.legal_firewall?.no_compliance_conclusion) errors.push(`field_route_row_missing_legal_firewall:${packet.batch_id}:${row.field_id}`);
  }
}

function assertNoForbiddenKeys(value, path, errors) {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) return value.forEach((item, index) => assertNoForbiddenKeys(item, `${path}[${index}]`, errors));
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.includes(key)) errors.push(`forbidden_key:${path}.${key}`);
    if (child && typeof child === "object") assertNoForbiddenKeys(child, `${path}.${key}`, errors);
  }
}
