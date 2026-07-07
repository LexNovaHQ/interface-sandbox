export function buildPhase7SemanticBatchRouteManifest({ dapRegistryManifest, strategicDerivationMatrix, dataPrivacyNavigationIndex } = {}) {
  if (!dapRegistryManifest || dapRegistryManifest.artifact_type !== "dap_registry_manifest") throw new Error("PHASE7_LAYER3_REQUIRES_DAP_REGISTRY_MANIFEST");
  if (!strategicDerivationMatrix || strategicDerivationMatrix.artifact_type !== "dap_strategic_derivation_matrix") throw new Error("PHASE7_LAYER3_REQUIRES_STRATEGIC_DERIVATION_MATRIX");
  if (!dataPrivacyNavigationIndex || dataPrivacyNavigationIndex.artifact_type !== "data_privacy_navigation_index") throw new Error("PHASE7_LAYER3_REQUIRES_DATA_PRIVACY_NAVIGATION_INDEX");
  const batchPlan = strategicDerivationMatrix.semantic_batch_plan || [];
  const routePointers = dataPrivacyNavigationIndex.semantic_navigation_overlay?.batch_navigation_pointers || [];
  const routePackets = batchPlan.map((batch) => buildBatchRoutePacket({ batch, routePointers, materialRules: dapRegistryManifest.material_rules || [], strategicRows: strategicDerivationMatrix.rows || [] }));
  return Object.freeze({
    artifact_type: "dap_semantic_batch_route_manifest",
    manifest_version: "phase7_layer3_semantic_batch_route_manifest_v1",
    phase_id: "DATA_PROVENANCE_PROFILE",
    layer_id: "LAYER_3_DETERMINISTIC_SEMANTIC_BATCH_ROUTER",
    execution_mode: "DETERMINISTIC_ROUTER_ONLY",
    routing_policy: Object.freeze({
      deterministic_only: true,
      no_semantic_reasoning: true,
      no_dossier_emission: true,
      no_source_text: true,
      no_excerpts: true,
      no_field_derivation: true,
      no_compiler_output: true,
      no_forensics_output: true,
      route_model_to_batch_only: true,
      model_reads_via_data_privacy_navigation_index: true,
      model_reads_l_family_only_via_legal_cartography: true
    }),
    source_artifacts: Object.freeze({
      registry_manifest_version: dapRegistryManifest.manifest_version,
      strategic_derivation_matrix_version: strategicDerivationMatrix.manifest_version,
      data_privacy_navigation_index_version: dataPrivacyNavigationIndex.manifest_version
    }),
    batch_route_packets: Object.freeze(routePackets),
    expected_batch_artifacts: Object.freeze(routePackets.map((packet) => packet.expected_artifact_name)),
    returned_field_ids: Object.freeze(routePackets.flatMap((packet) => packet.expected_field_ids)),
    validation_quality_control_result: validateRouteManifestShape(routePackets)
  });
}

function buildBatchRoutePacket({ batch, routePointers, materialRules, strategicRows }) {
  const pointer = routePointers.find((row) => row.batch_id === batch.batch_id);
  const families = Object.freeze([...(batch.families || [])]);
  const expectedRows = materialRules.filter((row) => families.includes(familyFromField(row.field_id)));
  const expectedFieldIds = Object.freeze(expectedRows.map((row) => row.field_id));
  const strategicByField = new Map(strategicRows.map((row) => [row.field_id, row.strategic_derivation]));
  return Object.freeze({
    batch_id: batch.batch_id,
    families,
    expected_field_count: expectedFieldIds.length,
    expected_field_ids: expectedFieldIds,
    expected_artifact_name: batch.artifact_name,
    route_source: "data_privacy_navigation_index.semantic_navigation_overlay.batch_navigation_pointers",
    data_privacy_navigation_pointer_present: Boolean(pointer),
    required_d_family_route_ids: Object.freeze(pointer?.required_d_family_route_ids || []),
    selective_l_family_route_ids: Object.freeze(pointer?.selective_l_family_route_ids || []),
    reading_priority: Object.freeze(pointer?.reading_priority || []),
    field_route_rows: Object.freeze(expectedRows.map((row) => buildFieldRouteRow({ row, strategic: strategicByField.get(row.field_id) }))),
    schema_requirements: Object.freeze({
      required_root: batch.artifact_name,
      required_batch_id: batch.batch_id,
      required_families: families,
      returned_field_ids_must_equal_expected_field_ids: true,
      one_row_per_field_id: true,
      semantic_reasoning_required_where_matrix_requires: true,
      deterministic_final_rows_must_remain_source_fact_only: true,
      no_compiler_or_forensics_roots: true
    }),
    validation_requirements: Object.freeze({
      validate_shape_before_acceptance: true,
      validate_expected_field_ids_exactly: true,
      validate_navigation_index_usage: true,
      validate_legal_cartography_usage_for_l_family: true,
      validate_forbidden_inference: true,
      validate_no_legal_or_compliance_conclusion: true,
      validate_field_specific_limitations: true
    }),
    forbidden_outputs: Object.freeze(["compiler", "forensics", "report_projection", "final_profile", "data_provenance_profile", "integrated_dap_report", "data_provenance_profile_forensics"]),
    model_instruction: "Run only this semantic batch. Use data_privacy_navigation_index for D-family routes and Legal Cartography for L-family routes. Return only the expected batch artifact. Do not emit compiler, forensics, report, or final profile."
  });
}

function buildFieldRouteRow({ row, strategic }) {
  return Object.freeze({
    field_id: row.field_id,
    output_field: row.output_field,
    registry_family: row.registry_family,
    material_section_id: row.material_section_id,
    material_subsection_id: row.material_subsection_id,
    mode: row.mode,
    source_basis: row.source_basis,
    conditions: row.conditions,
    trigger_outcome: row.trigger_outcome,
    exclude_fallback: row.exclude_fallback,
    forbidden_inference: row.forbidden_inference,
    strategic_derivation: strategic || null,
    limitation_trigger: row.limitation_trigger,
    missing_proof_trigger: row.missing_proof_trigger,
    legal_firewall: row.legal_firewall
  });
}

function validateRouteManifestShape(routePackets) {
  const errors = [];
  if (!Array.isArray(routePackets) || routePackets.length !== 17) errors.push(`batch_route_packet_count_not_17:${routePackets?.length || 0}`);
  const fieldIds = routePackets.flatMap((packet) => packet.expected_field_ids || []);
  if (fieldIds.length !== 150) errors.push(`routed_field_count_not_150:${fieldIds.length}`);
  if (new Set(fieldIds).size !== fieldIds.length) errors.push("duplicate_routed_field_ids");
  for (const packet of routePackets || []) {
    if (!packet.batch_id) errors.push("route_packet_missing_batch_id");
    if (!packet.expected_artifact_name) errors.push(`route_packet_missing_artifact:${packet.batch_id}`);
    if (!packet.data_privacy_navigation_pointer_present) errors.push(`route_packet_missing_navigation_pointer:${packet.batch_id}`);
    if (!packet.required_d_family_route_ids?.length) errors.push(`route_packet_missing_d_routes:${packet.batch_id}`);
    if (!packet.selective_l_family_route_ids?.length) errors.push(`route_packet_missing_l_routes:${packet.batch_id}`);
    if (!packet.field_route_rows?.length) errors.push(`route_packet_missing_field_rows:${packet.batch_id}`);
  }
  return Object.freeze({ status: errors.length ? "REPAIR_REQUIRED" : "PASS", errors: Object.freeze(errors) });
}

function familyFromField(fieldId = "") {
  return String(fieldId).split(".")[1] || "UNROUTED";
}
