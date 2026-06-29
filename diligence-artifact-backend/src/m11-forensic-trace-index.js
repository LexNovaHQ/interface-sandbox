const EXPECTED_ACTIVE_REGISTRY_ROWS = 98;
const MATERIAL_FIELDS = Object.freeze(["Threat_ID", "target_match", "evaluation_status", "basis_proof", "control_exclusion_evaluation", "evidence_source_basis", "fp_mechanism", "Archetype", "Subcategory", "Surface", "authority_anchors", "Pain_Tier", "Pain_Depth", "Pain_Category", "Legal_Pain", "remediation", "review_route", "row_limitations"]);
const CONTROLLED_STATUSES = new Set(["CONTROLLED_BY_VISIBLE_CONTROL", "CONTROLLED_BY_EXCLUSION", "CONTROLLED_BY_PUBLIC_EVIDENCE_LIMITATION"]);
const MATERIAL_STATUSES = new Set(["TRIGGERED", "CONTROLLED_BY_VISIBLE_CONTROL", "CONTROLLED_BY_EXCLUSION", "CONTROLLED_BY_PUBLIC_EVIDENCE_LIMITATION"]);
const THIN_VALUES = new Set(["", "yes", "no", "partial", "true", "false", "unknown", "n/a", "na", "not applicable"]);

export function buildM11ForensicTraceIndex({ routePlan, acceptedBatches = [], batchValidations = [], workpad, controlledProfile, triggeredProfile, artifactMetadata = {} }) {
  const plan = unwrap(routePlan, "exposure_registry_route_plan");
  const pad = unwrap(workpad, "exposure_registry_workpad_98");
  const controlled = unwrap(controlledProfile, "exposure_registry_controlled_profile");
  const triggered = unwrap(triggeredProfile, "exposure_registry_triggered_profile");
  const routeRows = asArray(plan.route_rows);
  const workpadRows = asArray(pad.registry_rows);
  const controlledRows = asArray(controlled.controlled_rows);
  const triggeredRows = asArray(triggered.triggered_rows);
  const routeById = mapByThreatId(routeRows);
  const workpadById = mapByThreatId(workpadRows);
  const semanticById = collectSemanticRows(acceptedBatches);
  const materialById = collectMaterialRows(acceptedBatches);
  const batchRootById = collectBatchRootsByThreatId(acceptedBatches);
  const validationByBatch = collectValidationByBatch(batchValidations);
  const controlledById = mapByThreatId(controlledRows);
  const triggeredById = mapByThreatId(triggeredRows);
  const ids = unique([...routeRows.map((row) => row.Threat_ID), ...workpadRows.map((row) => row.Threat_ID)]).filter(Boolean);
  const forensic_trace_index = ids.map((Threat_ID) => buildTraceRow({ Threat_ID, routeById, workpadById, semanticById, materialById, batchRootById, validationByBatch, controlledById, triggeredById }));
  const material_profile_trace_index = [...controlledRows.map((row) => buildProfileTraceRow({ profile: "exposure_registry_controlled_profile", row, workpadById, traceIndex: forensic_trace_index })), ...triggeredRows.map((row) => buildProfileTraceRow({ profile: "exposure_registry_triggered_profile", row, workpadById, traceIndex: forensic_trace_index }))];
  const workpad_trace_index = workpadRows.map((row) => buildWorkpadTraceRow({ row, controlledById, triggeredById }));
  const semantic_trace_index = forensic_trace_index.filter((row) => row.route_trace.route === "EVALUATION_ROUTED").map((row) => row.semantic_trace);
  const materialization_trace_index = forensic_trace_index.filter((row) => row.route_trace.route === "EVALUATION_ROUTED").map((row) => row.materialization_trace);
  const evidence_trace_index = forensic_trace_index.filter((row) => row.route_trace.route === "EVALUATION_ROUTED").map((row) => row.evidence_trace);
  const profile_reconciliation_ledger = buildProfileReconciliationLedger({ workpadRows, controlledRows, triggeredRows, material_profile_trace_index });
  const artifact_custody_ledger = buildArtifactCustodyLedger({ plan, acceptedBatches, batchValidations, pad, controlled, triggered, artifactMetadata });
  const forensic_lock_gate_result = buildForensicLockGate({ forensic_trace_index, material_profile_trace_index, workpad_trace_index, semantic_trace_index, materialization_trace_index, evidence_trace_index, profile_reconciliation_ledger });
  return { forensic_contract: { contract_name: "M11_ROW_LEVEL_TRACE_CONTRACT_V1", trace_scope: "98-row registry plus controlled/triggered material emissions", source_of_truth: "saved_artifacts", model_generated_forensics_allowed: false, runtime_metadata_source: artifactMetadata && Object.keys(artifactMetadata).length ? "artifact_metadata_supplied" : "artifact_metadata_unavailable" }, artifact_custody_ledger, forensic_trace_index, material_profile_trace_index, workpad_trace_index, semantic_trace_index, materialization_trace_index, evidence_trace_index, profile_reconciliation_ledger, forensic_lock_gate_result };
}

function buildTraceRow({ Threat_ID, routeById, workpadById, semanticById, materialById, batchRootById, validationByBatch, controlledById, triggeredById }) {
  const route = routeById.get(Threat_ID) || {};
  const workpad = workpadById.get(Threat_ID) || {};
  const semantic = semanticById.get(Threat_ID) || {};
  const material = materialById.get(Threat_ID) || workpad.material_projection || {};
  const batchRoot = batchRootById.get(Threat_ID) || {};
  const batchId = material.batch_id || workpad.source_batch_id || batchRoot.batch_id || "";
  const validation = validationByBatch.get(batchId) || {};
  const controlled = controlledById.get(Threat_ID) || null;
  const triggered = triggeredById.get(Threat_ID) || null;
  const failures = [];
  const warnings = [];
  if (!route.Threat_ID) failures.push("ROUTE_ROW_MISSING");
  if (!workpad.Threat_ID) failures.push("WORKPAD_ROW_MISSING");
  if (workpad.route === "EVALUATION_ROUTED" && !semantic.Threat_ID) failures.push("SEMANTIC_ROW_MISSING");
  if (workpad.route === "EVALUATION_ROUTED" && !hasFullMaterialRow(material)) failures.push("MATERIAL_ROW_INCOMPLETE");
  if (workpad.route === "EVALUATION_ROUTED" && !validation.status) failures.push("BATCH_VALIDATION_MISSING");
  if (isEmitted(workpad) && !controlled && !triggered) failures.push("PROFILE_EMISSION_MISSING");
  if (controlled && !CONTROLLED_STATUSES.has(controlled.evaluation_status)) failures.push("CONTROLLED_PROFILE_STATUS_INVALID");
  if (triggered && triggered.evaluation_status !== "TRIGGERED") failures.push("TRIGGERED_PROFILE_STATUS_INVALID");
  if (isEmitted(workpad) && !reportFieldsReadable(material)) failures.push("REPORT_FIELD_NOT_HUMAN_READABLE");
  if (workpad.route !== "EVALUATION_ROUTED" && isEmitted(workpad)) failures.push("NON_ROUTED_ROW_EMITTED_TO_PROFILE");
  if (workpad.final_material_status === "WORKPAD_ONLY" && !String(workpad.limitations || "").trim()) warnings.push("WORKPAD_ONLY_REASON_THIN");
  return { Threat_ID, registry_order: workpad.registry_order ?? route.registry_order ?? null, registry_spine_trace: { Threat_ID: route.Threat_ID || Threat_ID, Threat_Name: route.Threat_Name || "", Archetype: route.Archetype || workpad.archetype || "", Surface: route.Surface || workpad.surface || "", FIELD21: route.FIELD21 || "", FIELD22: route.FIELD22 || "", FIELD23: route.FIELD23 || "" }, route_trace: { route: workpad.route || route.route || "", route_reason: workpad.route_reason || route.route_reason || "", route_row_present: Boolean(route.Threat_ID), workpad_row_present: Boolean(workpad.Threat_ID) }, batch_trace: { batch_id: batchId, accepted_batch_present: Boolean(batchRoot.batch_id), batch_validation_present: Boolean(validation.status), batch_validation_status: validation.status || "", final_status_owner: batchRoot.final_status_owner || "" }, semantic_trace: { Threat_ID, batch_id: batchId, semantic_row_present: Boolean(semantic.Threat_ID), trigger_status: semantic.trigger_status || "", target_match_raw: semantic.target_match || "", basis_proof_raw: semantic.basis_proof || "", control_exclusion_evaluation_raw: semantic.control_exclusion_evaluation || "", evidence_source_basis_raw: semantic.evidence_source_basis || "", row_limitations_raw: semantic.row_limitations || "", status_inputs: semantic.status_inputs || {} }, status_input_trace: { Threat_ID, batch_id: batchId, status_inputs_present: Boolean(semantic.status_inputs), status_inputs: semantic.status_inputs || {} }, materialization_trace: { Threat_ID, batch_id: batchId, material_row_present: Boolean(material.Threat_ID), final_status_owner: batchRoot.final_status_owner || "backend_deterministic_finalizer", backend_final_status: workpad.final_material_status || material.evaluation_status || "", material_evaluation_status: material.evaluation_status || "", full_18_field_contract_present: hasFullMaterialRow(material), narrative_cleanup_or_limitation_applied: hasCleanupOrLimitation(material), cleaned_target_match: material.target_match || "", cleaned_basis_proof: material.basis_proof || "", cleaned_control_exclusion_evaluation: material.control_exclusion_evaluation || "", cleaned_evidence_source_basis: material.evidence_source_basis || "", row_limitations: material.row_limitations || workpad.limitations || "" }, profile_emission_trace: { emitted_to_controlled_profile: Boolean(controlled), emitted_to_triggered_profile: Boolean(triggered), emitted_profile: controlled ? "exposure_registry_controlled_profile" : triggered ? "exposure_registry_triggered_profile" : workpad.final_material_status === "WORKPAD_ONLY" ? "workpad_only" : "not_emitted", profile_status: controlled?.evaluation_status || triggered?.evaluation_status || "", workpad_status: workpad.final_material_status || "", status_match: !controlled && !triggered ? workpad.final_material_status === "WORKPAD_ONLY" : (controlled?.evaluation_status || triggered?.evaluation_status) === workpad.final_material_status }, evidence_trace: { Threat_ID, batch_id: batchId, m9_legal_cartography_consumed: Boolean(batchRoot.m9_legal_cartography_consumed), evidence_source_basis: material.evidence_source_basis || "", basis_proof: material.basis_proof || "", source_limitations: material.row_limitations || workpad.limitations || "" }, runtime_custody_trace: { source_batch_id: batchId, workpad_status: workpad.final_material_status || "", m12_batch_validation_status: workpad.m12_batch_validation_status || "", accepted_batch_materialized: Boolean(batchRoot.accepted_batch_materialized), material_row_contract: batchRoot.material_row_contract || "" }, reconciliation: { status: failures.length ? "FAIL" : warnings.length ? "PASS_WITH_LIMITATION" : "PASS", warnings, failures } };
}

function buildProfileTraceRow({ profile, row, workpadById, traceIndex }) {
  const workpad = workpadById.get(row.Threat_ID) || {};
  const trace = traceIndex.find((item) => item.Threat_ID === row.Threat_ID);
  const failures = [];
  if (!workpad.Threat_ID) failures.push("PROFILE_ROW_WITHOUT_WORKPAD_ROW");
  if (!trace) failures.push("PROFILE_ROW_WITHOUT_FORENSIC_TRACE");
  if (row.evaluation_status !== workpad.final_material_status) failures.push("PROFILE_STATUS_WORKPAD_STATUS_MISMATCH");
  if (!hasFullMaterialRow(row)) failures.push("PROFILE_ROW_MATERIAL_FIELDS_INCOMPLETE");
  if (!reportFieldsReadable(row)) failures.push("PROFILE_ROW_REPORT_FIELDS_NOT_HUMAN_READABLE");
  return { Threat_ID: row.Threat_ID || "", emitted_profile: profile, profile_row_present: true, workpad_row_present: Boolean(workpad.Threat_ID), forensic_trace_row_present: Boolean(trace), profile_status: row.evaluation_status || "", workpad_status: workpad.final_material_status || "", status_match: row.evaluation_status === workpad.final_material_status, material_fields_complete: hasFullMaterialRow(row), report_fields_human_readable: reportFieldsReadable(row), source_batch_id: workpad.source_batch_id || null, reconciliation_status: failures.length ? "FAIL" : "PASS", failures };
}

function buildWorkpadTraceRow({ row, controlledById, triggeredById }) {
  return { Threat_ID: row.Threat_ID || "", registry_order: row.registry_order ?? null, route: row.route || "", route_reason: row.route_reason || "", final_material_status: row.final_material_status || "", source_batch_id: row.source_batch_id || null, m12_batch_validation_status: row.m12_batch_validation_status || "", material_projection_present: Boolean(row.material_projection), emitted_to_controlled_profile: controlledById.has(row.Threat_ID), emitted_to_triggered_profile: triggeredById.has(row.Threat_ID), workpad_only_reason: row.final_material_status === "WORKPAD_ONLY" ? row.limitations || "" : "" };
}

function buildProfileReconciliationLedger({ workpadRows, controlledRows, triggeredRows, material_profile_trace_index }) {
  const expectedControlled = workpadRows.filter((row) => CONTROLLED_STATUSES.has(row.final_material_status)).map((row) => row.Threat_ID).filter(Boolean);
  const expectedTriggered = workpadRows.filter((row) => row.final_material_status === "TRIGGERED").map((row) => row.Threat_ID).filter(Boolean);
  const controlledIds = controlledRows.map((row) => row.Threat_ID).filter(Boolean);
  const triggeredIds = triggeredRows.map((row) => row.Threat_ID).filter(Boolean);
  return [{ profile: "exposure_registry_controlled_profile", expected_ids: expectedControlled, emitted_ids: controlledIds, missing_ids: expectedControlled.filter((id) => !controlledIds.includes(id)), orphan_ids: controlledIds.filter((id) => !expectedControlled.includes(id)), failed_trace_rows: material_profile_trace_index.filter((row) => row.emitted_profile === "exposure_registry_controlled_profile" && row.reconciliation_status !== "PASS").map((row) => row.Threat_ID), status: arraysEqualAsSets(expectedControlled, controlledIds) ? "PASS" : "FAIL" }, { profile: "exposure_registry_triggered_profile", expected_ids: expectedTriggered, emitted_ids: triggeredIds, missing_ids: expectedTriggered.filter((id) => !triggeredIds.includes(id)), orphan_ids: triggeredIds.filter((id) => !expectedTriggered.includes(id)), failed_trace_rows: material_profile_trace_index.filter((row) => row.emitted_profile === "exposure_registry_triggered_profile" && row.reconciliation_status !== "PASS").map((row) => row.Threat_ID), status: arraysEqualAsSets(expectedTriggered, triggeredIds) ? "PASS" : "FAIL" }];
}

function buildArtifactCustodyLedger({ plan, acceptedBatches, batchValidations, pad, controlled, triggered, artifactMetadata }) {
  const rows = [{ artifact_name: "exposure_registry_route_plan", present: Boolean(plan && Object.keys(plan).length), row_count: asArray(plan.route_rows).length }, { artifact_name: "exposure_registry_workpad_98", present: Boolean(pad && Object.keys(pad).length), row_count: asArray(pad.registry_rows).length }, { artifact_name: "exposure_registry_controlled_profile", present: Boolean(controlled && Object.keys(controlled).length), row_count: asArray(controlled.controlled_rows).length }, { artifact_name: "exposure_registry_triggered_profile", present: Boolean(triggered && Object.keys(triggered).length), row_count: asArray(triggered.triggered_rows).length }];
  for (const artifact of asArray(acceptedBatches)) { const root = unwrap(artifact, "m11_batch_registry_ledger"); rows.push({ artifact_name: `exposure_registry_batch__${root.batch_id || "unknown"}`, present: Boolean(root.batch_id), row_count: asArray(root.batch_registry_ledger).length, lock_status: artifactMetadata?.[`exposure_registry_batch__${root.batch_id}`]?.lock_status || "metadata_unavailable" }); }
  for (const artifact of asArray(batchValidations)) { const root = unwrap(artifact, "exposure_registry_batch_validation"); rows.push({ artifact_name: `exposure_registry_batch_validation__${root.batch_id || "unknown"}`, present: Boolean(root.batch_id), status: root.status || "", lock_status: artifactMetadata?.[`exposure_registry_batch_validation__${root.batch_id}`]?.lock_status || "metadata_unavailable" }); }
  return rows;
}

function buildForensicLockGate({ forensic_trace_index, material_profile_trace_index, workpad_trace_index, semantic_trace_index, materialization_trace_index, evidence_trace_index, profile_reconciliation_ledger }) {
  const failures = [];
  const warnings = [];
  if (forensic_trace_index.length !== EXPECTED_ACTIVE_REGISTRY_ROWS) failures.push(`FORENSIC_TRACE_ROW_COUNT_MISMATCH:${forensic_trace_index.length}`);
  if (workpad_trace_index.length !== EXPECTED_ACTIVE_REGISTRY_ROWS) failures.push(`WORKPAD_TRACE_ROW_COUNT_MISMATCH:${workpad_trace_index.length}`);
  for (const row of forensic_trace_index) for (const failure of asArray(row.reconciliation?.failures)) failures.push(`${row.Threat_ID}:${failure}`);
  for (const row of material_profile_trace_index) for (const failure of asArray(row.failures)) failures.push(`${row.Threat_ID}:${failure}`);
  for (const row of profile_reconciliation_ledger) if (row.status !== "PASS") failures.push(`${row.profile}:PROFILE_PROJECTION_MISMATCH`);
  for (const row of semantic_trace_index) if (!row.semantic_row_present) failures.push(`${row.Threat_ID}:MATERIAL_STATUS_WITHOUT_STATUS_INPUT_TRACE`);
  for (const row of materialization_trace_index) if (!row.full_18_field_contract_present) failures.push(`${row.Threat_ID}:MATERIALIZATION_TRACE_INCOMPLETE`);
  for (const row of evidence_trace_index) if (!String(row.evidence_source_basis || "").trim()) failures.push(`${row.Threat_ID}:EVIDENCE_BASIS_WITHOUT_SOURCE_CUSTODY`);
  for (const row of forensic_trace_index) for (const warning of asArray(row.reconciliation?.warnings)) warnings.push(`${row.Threat_ID}:${warning}`);
  return { status: failures.length ? "REPAIR_REQUIRED" : warnings.length ? "PASS_WITH_LIMITATION" : "PASS", failures: unique(failures), warnings: unique(warnings), counts: { forensic_trace_rows: forensic_trace_index.length, material_profile_trace_rows: material_profile_trace_index.length, workpad_trace_rows: workpad_trace_index.length, semantic_trace_rows: semantic_trace_index.length, materialization_trace_rows: materialization_trace_index.length, evidence_trace_rows: evidence_trace_index.length } };
}

function collectSemanticRows(acceptedBatches) { const map = new Map(); for (const artifact of asArray(acceptedBatches)) { const root = unwrap(artifact, "m11_batch_registry_ledger"); for (const row of asArray(root.semantic_evidence_application_ledger)) map.set(row.Threat_ID, { ...row, batch_id: root.batch_id || "" }); } return map; }
function collectMaterialRows(acceptedBatches) { const map = new Map(); for (const artifact of asArray(acceptedBatches)) { const root = unwrap(artifact, "m11_batch_registry_ledger"); for (const row of asArray(root.batch_registry_ledger)) map.set(row.Threat_ID, { ...row, batch_id: root.batch_id || "" }); } return map; }
function collectBatchRootsByThreatId(acceptedBatches) { const map = new Map(); for (const artifact of asArray(acceptedBatches)) { const root = unwrap(artifact, "m11_batch_registry_ledger"); for (const row of asArray(root.batch_registry_ledger)) map.set(row.Threat_ID, root); } return map; }
function collectValidationByBatch(batchValidations) { const map = new Map(); for (const artifact of asArray(batchValidations)) { const root = unwrap(artifact, "exposure_registry_batch_validation"); if (root.batch_id) map.set(root.batch_id, root); } return map; }
function mapByThreatId(rows) { return new Map(asArray(rows).filter((row) => row?.Threat_ID).map((row) => [row.Threat_ID, row])); }
function isEmitted(workpadRow = {}) { return CONTROLLED_STATUSES.has(workpadRow.final_material_status) || workpadRow.final_material_status === "TRIGGERED"; }
function hasFullMaterialRow(row = {}) { return MATERIAL_FIELDS.every((field) => field in row) && MATERIAL_STATUSES.has(String(row.evaluation_status || "").toUpperCase()); }
function reportFieldsReadable(row = {}) { return [row.target_match, row.basis_proof, row.control_exclusion_evaluation, row.evidence_source_basis].every((value) => !THIN_VALUES.has(String(value || "").trim().toLowerCase()) && String(value || "").trim().length >= 20); }
function hasCleanupOrLimitation(row = {}) { const text = [row.target_match, row.basis_proof, row.control_exclusion_evaluation, row.evidence_source_basis, row.row_limitations].join(" ").toLowerCase(); return text.includes("condition inputs") || text.includes("backend strict finalizer") || text.includes("public evidence limitation"); }
function arraysEqualAsSets(a, b) { const aa = new Set(asArray(a)); const bb = new Set(asArray(b)); if (aa.size !== bb.size) return false; for (const item of aa) if (!bb.has(item)) return false; return true; }
function unwrap(value, key) { return value?.[key] || value?.artifact?.[key] || value || {}; }
function asArray(value) { return Array.isArray(value) ? value : []; }
function unique(items) { return [...new Set(asArray(items).filter(Boolean))]; }
