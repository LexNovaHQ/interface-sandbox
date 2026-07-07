const CONTROLLED_STATUSES = Object.freeze([
  "SEMANTIC_RESOLVED_WITH_BOUNDED_SUPPORT",
  "SEMANTIC_RESOLVED_WITH_LIMITATION",
  "SEMANTIC_MISSING_PROOF_REQUIRED",
  "SEMANTIC_PRIVATE_CONFIRMATION_REQUIRED",
  "SEMANTIC_CONFLICT_REQUIRES_REVIEW",
  "DETERMINISTIC_SOURCE_FACT_CARRIED"
]);

export function buildPhase7SemanticBatchQualityGate({ routeManifest, batchArtifacts = {}, batchValidations = {} } = {}) {
  const packets = routeManifest?.batch_route_packets || [];
  const batchResults = packets.map((packet) => inspectBatch({ packet, artifactRoot: batchArtifacts[packet.expected_artifact_name], validationRoot: batchValidations[`dap_semantic_batch_validation__${packet.batch_id}`] }));
  const expectedFieldIds = packets.flatMap((packet) => packet.expected_field_ids || []);
  const returnedFieldIds = batchResults.flatMap((row) => row.returned_field_ids || []);
  const missingFieldIds = expectedFieldIds.filter((fieldId) => !returnedFieldIds.includes(fieldId));
  const duplicateFieldIds = returnedFieldIds.filter((fieldId, index) => returnedFieldIds.indexOf(fieldId) !== index);
  const unexpectedFieldIds = returnedFieldIds.filter((fieldId) => !expectedFieldIds.includes(fieldId));
  const errors = [];
  if (packets.length !== 17) errors.push(`expected_17_route_packets_found_${packets.length}`);
  if (expectedFieldIds.length !== 150) errors.push(`expected_150_route_fields_found_${expectedFieldIds.length}`);
  if (returnedFieldIds.length !== 150) errors.push(`returned_150_fields_required_found_${returnedFieldIds.length}`);
  if (missingFieldIds.length) errors.push(`missing_field_ids:${missingFieldIds.join(",")}`);
  if (duplicateFieldIds.length) errors.push(`duplicate_field_ids:${[...new Set(duplicateFieldIds)].join(",")}`);
  if (unexpectedFieldIds.length) errors.push(`unexpected_field_ids:${[...new Set(unexpectedFieldIds)].join(",")}`);
  for (const row of batchResults) errors.push(...row.errors);
  const hasLimitations = errors.length > 0 || batchResults.some((row) => row.has_controlled_limitations);
  const status = hasLimitations ? "LOCKED_WITH_LIMITATIONS" : "PASS";
  const manifest = Object.freeze({
    artifact_type: "dap_semantic_batch_validation_manifest",
    manifest_version: "phase7_layer5_semantic_batch_quality_gate_v1",
    phase_id: "DATA_PROVENANCE_PROFILE",
    layer_id: "LAYER_5_BATCH_QUALITY_SCHEMA_VALIDATOR",
    execution_mode: "DETERMINISTIC_AGGREGATE_VALIDATOR",
    blocking_policy: "NON_BLOCKING_REPAIR_SIGNAL_BLOCKING_IS_EXCEPTION",
    expected_batch_count: 17,
    observed_batch_count: batchResults.filter((row) => row.batch_artifact_present).length,
    expected_field_count: 150,
    observed_field_count: returnedFieldIds.length,
    field_coverage: Object.freeze({
      expected_field_count: expectedFieldIds.length,
      returned_field_count: returnedFieldIds.length,
      unique_returned_field_count: new Set(returnedFieldIds).size,
      missing_field_ids: Object.freeze(missingFieldIds),
      duplicate_field_ids: Object.freeze([...new Set(duplicateFieldIds)]),
      unexpected_field_ids: Object.freeze([...new Set(unexpectedFieldIds)])
    }),
    batch_results: Object.freeze(batchResults),
    validation_quality_control_result: Object.freeze({
      status,
      non_blocking_repair_required: errors.length > 0,
      blocking_failure: false,
      errors: Object.freeze(errors)
    })
  });
  return Object.freeze({
    dap_semantic_batch_validation_manifest: manifest,
    data_provenance_profile_semantic_batch_gate: Object.freeze({
      artifact_type: "data_provenance_profile_semantic_batch_gate",
      manifest_version: "phase7_layer5_semantic_batch_gate_v1",
      phase_id: "DATA_PROVENANCE_PROFILE",
      layer_id: "LAYER_5_BATCH_QUALITY_SCHEMA_VALIDATOR",
      status,
      non_blocking_repair_required: errors.length > 0,
      blocking_failure: false,
      all_batches_present: manifest.observed_batch_count === 17,
      all_fields_covered_once: manifest.field_coverage.returned_field_count === 150 && manifest.field_coverage.unique_returned_field_count === 150 && !missingFieldIds.length && !unexpectedFieldIds.length,
      batch_count: manifest.observed_batch_count,
      field_count: manifest.observed_field_count,
      errors: Object.freeze(errors),
      next_step: status === "PASS" ? "READY_FOR_DOWNSTREAM_MIGRATION_DECISION" : "ADVANCE_WITH_LIMITATIONS_AND_REPAIR_QUEUE"
    })
  });
}

export function validatePhase7SemanticBatchQualityGate(output = {}) {
  const manifest = output.dap_semantic_batch_validation_manifest;
  const gate = output.data_provenance_profile_semantic_batch_gate;
  const errors = [];
  if (!manifest || manifest.artifact_type !== "dap_semantic_batch_validation_manifest") errors.push("missing_validation_manifest");
  if (!gate || gate.artifact_type !== "data_provenance_profile_semantic_batch_gate") errors.push("missing_semantic_batch_gate");
  if (manifest?.validation_quality_control_result?.status !== gate?.status) errors.push("manifest_gate_status_mismatch");
  if (manifest?.expected_batch_count !== 17) errors.push("expected_batch_count_not_17");
  if (manifest?.expected_field_count !== 150) errors.push("expected_field_count_not_150");
  if (gate?.status === "REPAIR_REQUIRED") errors.push("repair_required_must_not_be_gate_status");
  if (manifest?.validation_quality_control_result?.status === "REPAIR_REQUIRED") errors.push("repair_required_must_not_be_manifest_status");
  if (gate?.all_fields_covered_once !== true && gate?.status === "PASS") errors.push("pass_gate_without_exact_field_coverage");
  return Object.freeze({ status: errors.length ? "REPAIR_REQUIRED" : "PASS", errors: Object.freeze(errors) });
}

function inspectBatch({ packet, artifactRoot, validationRoot }) {
  const errors = [];
  const expectedName = packet.expected_artifact_name;
  const batch = artifactRoot?.[expectedName] || artifactRoot;
  const validation = validationRoot?.dap_semantic_batch_validation || validationRoot;
  if (!batch) errors.push(`missing_batch_artifact:${expectedName}`);
  if (!validation) errors.push(`missing_layer4_validation:${packet.batch_id}`);
  if (validation && !["PASS", "LOCKED_WITH_LIMITATIONS"].includes(validation.status)) errors.push(`layer4_validation_not_accepted:${packet.batch_id}:${validation.status}`);
  const returnedFieldIds = Array.isArray(batch?.returned_field_ids) ? batch.returned_field_ids : [];
  const rows = Array.isArray(batch?.field_rows) ? batch.field_rows : [];
  const expectedIds = packet.expected_field_ids || [];
  if (batch && batch.batch_id !== packet.batch_id) errors.push(`batch_id_mismatch:${packet.batch_id}`);
  if (batch && !sameSet(batch.families || [], packet.families || [])) errors.push(`families_mismatch:${packet.batch_id}`);
  if (batch && !sameSet(returnedFieldIds, expectedIds)) errors.push(`returned_fields_mismatch:${packet.batch_id}`);
  if (batch && rows.length !== expectedIds.length) errors.push(`row_count_mismatch:${packet.batch_id}:${rows.length}:${expectedIds.length}`);
  const routeIds = new Set([...(packet.required_d_family_route_ids || []), ...(packet.selective_l_family_route_ids || [])]);
  for (const row of rows) inspectRow({ row, packet, routeIds, errors });
  return Object.freeze({
    batch_id: packet.batch_id,
    expected_artifact_name: expectedName,
    batch_artifact_present: Boolean(batch),
    layer4_validation_present: Boolean(validation),
    layer4_validation_status: validation?.status || "MISSING",
    expected_field_count: expectedIds.length,
    returned_field_count: returnedFieldIds.length,
    returned_field_ids: Object.freeze(returnedFieldIds),
    has_controlled_limitations: rows.some((row) => ["SEMANTIC_RESOLVED_WITH_LIMITATION", "SEMANTIC_MISSING_PROOF_REQUIRED", "SEMANTIC_PRIVATE_CONFIRMATION_REQUIRED", "SEMANTIC_CONFLICT_REQUIRES_REVIEW"].includes(row.semantic_resolution_status)) || errors.length > 0,
    errors: Object.freeze(errors)
  });
}

function inspectRow({ row, packet, routeIds, errors }) {
  if (!packet.expected_field_ids.includes(row.field_id)) errors.push(`unexpected_row_field:${packet.batch_id}:${row.field_id}`);
  if (!CONTROLLED_STATUSES.includes(row.semantic_resolution_status)) errors.push(`uncontrolled_status:${packet.batch_id}:${row.field_id}:${row.semantic_resolution_status}`);
  if (!Array.isArray(row.basis_route_ids) || !row.basis_route_ids.length) errors.push(`missing_basis_routes:${packet.batch_id}:${row.field_id}`);
  for (const routeId of row.basis_route_ids || []) if (!routeIds.has(routeId)) errors.push(`route_id_not_allowed:${packet.batch_id}:${row.field_id}:${routeId}`);
  if (row.forbidden_inference_check !== "PASS") errors.push(`field_guard_not_pass:${packet.batch_id}:${row.field_id}`);
}

function sameSet(a = [], b = []) {
  const left = [...a].sort();
  const right = [...b].sort();
  return left.length === right.length && left.every((value, index) => value === right[index]);
}
