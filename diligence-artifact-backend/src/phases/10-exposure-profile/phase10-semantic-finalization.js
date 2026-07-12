import { buildCompactM11BatchPacket } from "./m11-batch-evidence-resolver.js";
import { buildM11DomainControlObligationHandoff } from "./domain-control-obligation-profile.handoff.js";
import { DETERMINISTIC_REGISTRY_SPINE_FIELDS, EXECUTION_CUSTODY_FIELDS } from "./m11-deterministic-system-m11v2.js";

export const SEMANTIC_PACKET_VERSION = "M11_PACKAGE_SCOPED_SEMANTIC_PACKET_v2_COMPLETE_REGISTRY_SPINE";
export const SEMANTIC_LEDGER_VERSION = "M11_PACKAGE_SCOPED_SEMANTIC_LEDGER_v1";
export const LAYER3_VERSION = "M11_DYNAMIC_LAYER3_v2_COMPLETE_REPORT_ROW";
export const FORENSICS_VERSION = "M11_DOMAIN_AGNOSTIC_FORENSICS_v2_COMPLETE_REPORT_ROW";
export const REPORT_ROW_SCHEMA_VERSION = "phase10_report_row.v1.complete_registry_spine";

const STATUS_VALUES = new Set(["yes", "no", "partial"]);
const FINAL_STATUSES = Object.freeze({ triggered: "TRIGGERED", visible: "CONTROLLED_BY_VISIBLE_CONTROL", exclusion: "CONTROLLED_BY_EXCLUSION", limitation: "CONTROLLED_BY_PUBLIC_EVIDENCE_LIMITATION" });
const SEMANTIC_ROW_FIELDS = new Set(["Threat_ID", "trigger_status", "target_match", "basis_proof", "control_exclusion_evaluation", "evidence_source_basis", "applied_fp_mechanism", "row_limitations", "status_inputs"]);
const STATUS_INPUT_FIELDS = Object.freeze(["target_match_present", "hunter_conditions_met", "trigger_if_met", "exclude_if_met", "visible_control_present", "visible_control_defeats_or_reduces_exposure", "evidence_sufficient", "public_evidence_limitation", "false_positive_concern"]);
const FINAL_SEMANTIC_FIELDS = Object.freeze(["target_match", "evaluation_status", "basis_proof", "control_exclusion_evaluation", "evidence_source_basis", "applied_fp_mechanism", "row_limitations", "review_route"]);
const MANDATORY_SPINE_FIELDS = Object.freeze(DETERMINISTIC_REGISTRY_SPINE_FIELDS.filter((field) => field !== "Compliance_Framework"));

export function buildPackageScopedSemanticPacket({ batch, routePlan, upstreamArtifacts = {}, manifest } = {}) {
  const route = unwrap(routePlan, "exposure_registry_route_plan");
  const routeByKey = new Map(asArray(route.route_rows).map((row) => [row.registry_row_key, row]));
  const rows = asArray(batch?.expected_registry_row_keys).map((key) => routeByKey.get(key));
  if (rows.some((row) => !row)) throw new Error(`M11_BATCH_ROUTE_ROW_MISSING:${batch?.batch_id || "missing"}`);
  assertBatchIsolation(batch, rows);
  const spines = rows.map((row) => buildDeterministicSpine(row, batch));
  spines.forEach((spine) => assertCompleteDeterministicSpine(spine));

  const base = {
    semantic_packet_version: SEMANTIC_PACKET_VERSION,
    report_row_schema_version: REPORT_ROW_SCHEMA_VERSION,
    deterministic_registry_spine_read_only: true,
    model_must_not_emit_registry_spine_fields: true,
    model_allowed_fields: [...SEMANTIC_ROW_FIELDS],
    batch_id: batch.batch_id,
    batch_group: batch.batch_group,
    stream_id: batch.stream_id,
    stream_type: batch.stream_type,
    package_id: batch.package_id,
    source_domain: batch.source_domain,
    expected_registry_row_keys: [...batch.expected_registry_row_keys],
    expected_threat_ids: [...batch.expected_threat_ids],
    row_count: batch.row_count,
    classification_inventory_digest: batch.classification_inventory_digest,
    activity_references: [...asArray(batch.activity_references)],
    registry_rows: rows.map((row, index) => ({
      registry_row_key: row.registry_row_key,
      Threat_ID: row.Threat_ID,
      package_id: row.package_id,
      stream_id: row.stream_id,
      stream_type: row.stream_type,
      route_reason: row.route_reason,
      matched_activity_references: [...asArray(row.matched_activity_references)],
      deterministic_registry_spine: spines[index]
    })),
    phase10_execution_context: {
      execution_identity_version: manifest.execution_identity_contract?.version,
      registry_set_fingerprint: manifest.registry_set_fingerprint,
      phase5_classification_fingerprint: manifest.phase5_classification_fingerprint,
      phase10_execution_fingerprint: manifest.phase10_execution_fingerprint,
      primary_package: manifest.primary_package,
      ai_mount: manifest.ai_mount,
      mounted_packages: [...asArray(manifest.mounted_packages)]
    }
  };

  const compact = buildCompactM11BatchPacket({ batchPacket: { m11_batch_packet: base }, upstreamArtifacts });
  const dco = upstreamArtifacts.domain_control_obligation_profile ? buildM11DomainControlObligationHandoff({ domainControlObligationProfile: upstreamArtifacts.domain_control_obligation_profile, activeThreatRows: rows.map((row) => row.registry_row) }) : null;
  const packet = {
    ...compact,
    deterministic_registry_spine_read_only: true,
    model_must_not_emit_registry_spine_fields: true,
    m11_domain_control_obligation_context: dco,
    semantic_packet_validation: { status: "PASS", complete_registry_spine: true, one_package: true, one_stream: true, one_behavior_class_group: true, exact_registry_row_key_count: rows.length, exact_threat_id_count: rows.length }
  };
  if (JSON.stringify(packet).length > Number(batch.max_packet_chars || 180000)) throw new Error(`M11_SEMANTIC_PACKET_CEILING_EXCEEDED:${batch.batch_id}`);
  return { m11_batch_packet: packet };
}

export function validateSemanticLedger({ semanticOutput, batch, routePlan } = {}) {
  const failures = [];
  const rootKeys = semanticOutput && typeof semanticOutput === "object" ? Object.keys(semanticOutput) : [];
  if (rootKeys.length !== 1 || rootKeys[0] !== "m11_batch_registry_ledger") failures.push("MODEL_ROOT_INVALID");
  const ledger = semanticOutput?.m11_batch_registry_ledger || {};
  for (const [field, expected] of Object.entries({ semantic_contract_version: SEMANTIC_LEDGER_VERSION, batch_id: batch.batch_id, batch_group: batch.batch_group, stream_id: batch.stream_id, stream_type: batch.stream_type, package_id: batch.package_id, source_domain: batch.source_domain })) if (String(ledger[field] ?? "") !== String(expected ?? "")) failures.push(`BATCH_IDENTITY_MISMATCH:${field}`);
  const expectedIds = asArray(batch.expected_threat_ids);
  const returnedIds = asArray(ledger.returned_threat_ids);
  if (!sameArray(expectedIds, returnedIds)) failures.push("RETURNED_THREAT_IDS_MISMATCH");
  if (!sameArray(expectedIds, asArray(ledger.expected_threat_ids))) failures.push("ECHOED_EXPECTED_THREAT_IDS_MISMATCH");
  const rows = asArray(ledger.batch_registry_ledger);
  if (rows.length !== expectedIds.length) failures.push("SEMANTIC_ROW_COUNT_MISMATCH");
  const seen = new Set();
  for (const [index, row] of rows.entries()) {
    const threatId = String(row?.Threat_ID || "");
    if (threatId !== String(expectedIds[index] || "")) failures.push(`SEMANTIC_ROW_ORDER_MISMATCH:${index}`);
    if (seen.has(threatId)) failures.push(`DUPLICATE_SEMANTIC_THREAT_ID:${threatId}`);
    seen.add(threatId);
    for (const key of Object.keys(row || {})) if (!SEMANTIC_ROW_FIELDS.has(key)) failures.push(`MODEL_FIELD_FORBIDDEN:${threatId}:${key}`);
    for (const field of ["target_match", "basis_proof", "control_exclusion_evaluation", "evidence_source_basis", "applied_fp_mechanism", "row_limitations"]) if (typeof row?.[field] !== "string") failures.push(`SEMANTIC_TEXT_FIELD_INVALID:${threatId}:${field}`);
    const inputs = row?.status_inputs;
    if (!inputs || typeof inputs !== "object" || Array.isArray(inputs)) failures.push(`STATUS_INPUTS_INVALID:${threatId}`);
    else {
      if (!sameSet(Object.keys(inputs), STATUS_INPUT_FIELDS)) failures.push(`STATUS_INPUT_KEYS_INVALID:${threatId}`);
      for (const field of STATUS_INPUT_FIELDS) if (!STATUS_VALUES.has(String(inputs[field] || "").toLowerCase())) failures.push(`STATUS_INPUT_VALUE_INVALID:${threatId}:${field}`);
    }
  }
  const route = unwrap(routePlan, "exposure_registry_route_plan");
  const batchRows = asArray(route.route_rows).filter((row) => asArray(batch.expected_registry_row_keys).includes(row.registry_row_key));
  if (batchRows.length !== expectedIds.length) failures.push("ROUTE_TO_BATCH_RECONCILIATION_FAILED");
  return { exposure_registry_batch_validation: { schema_version: "exposure_registry_batch_validation.v4.complete_registry_spine", batch_id: batch.batch_id, stream_id: batch.stream_id, stream_type: batch.stream_type, package_id: batch.package_id, expected_registry_row_keys: [...batch.expected_registry_row_keys], expected_threat_ids: [...expectedIds], returned_threat_ids: [...returnedIds], status: failures.length ? "REPAIR_REQUIRED" : "PASS", failures, limitations: [], exact_coverage: failures.length === 0, package_and_stream_isolation: true, model_registry_field_emission_forbidden: true } };
}

export function assembleAcceptedBatch({ semanticOutput, batch, routePlan } = {}) {
  const validation = validateSemanticLedger({ semanticOutput, batch, routePlan });
  if (validation.exposure_registry_batch_validation.status !== "PASS") throw new Error(`M11_SEMANTIC_LEDGER_INVALID:${validation.exposure_registry_batch_validation.failures.join("|")}`);
  const route = unwrap(routePlan, "exposure_registry_route_plan");
  const routeByKey = new Map(asArray(route.route_rows).map((row) => [row.registry_row_key, row]));
  const semanticById = new Map(asArray(semanticOutput.m11_batch_registry_ledger.batch_registry_ledger).map((row) => [row.Threat_ID, row]));
  const rows = asArray(batch.expected_registry_row_keys).map((key) => {
    const routeRow = routeByKey.get(key);
    const semanticRow = semanticById.get(routeRow.Threat_ID);
    const spine = buildDeterministicSpine(routeRow, batch);
    assertCompleteDeterministicSpine(spine);
    return {
      ...pickCustody(spine),
      Threat_ID: routeRow.Threat_ID,
      deterministic_registry_spine: spine,
      semantic_evidence_application: semanticRow,
      final_material_status: deriveFinalMaterialStatus(semanticRow.status_inputs),
      material_projection: buildMaterialProjection(spine, semanticRow)
    };
  });
  return { m11_batch_registry_ledger: { schema_version: "m11_batch_registry_ledger.v4.complete_registry_spine.accepted", report_row_schema_version: REPORT_ROW_SCHEMA_VERSION, batch_id: batch.batch_id, stream_id: batch.stream_id, stream_type: batch.stream_type, package_id: batch.package_id, expected_registry_row_keys: [...batch.expected_registry_row_keys], accepted_registry_row_keys: rows.map((row) => row.registry_row_key), accepted_threat_ids: rows.map((row) => row.Threat_ID), batch_registry_ledger: rows, validation_status: "PASS" } };
}

export function buildDynamicWorkpad({ manifest, routePlan, acceptedBatches = [], batchValidations = [] } = {}) {
  const route = unwrap(routePlan, "exposure_registry_route_plan");
  const acceptedRows = asArray(acceptedBatches).flatMap((batch) => asArray(unwrap(batch, "m11_batch_registry_ledger").batch_registry_ledger));
  const acceptedByKey = new Map(acceptedRows.map((row) => [row.registry_row_key, row]));
  const rows = asArray(route.route_rows).map((routeRow) => {
    const accepted = acceptedByKey.get(routeRow.registry_row_key);
    if (routeRow.route === "EVALUATION_ROUTED") {
      if (!accepted) throw new Error(`M11_ACCEPTED_ROW_MISSING:${routeRow.registry_row_key}`);
      return accepted;
    }
    const spine = buildDeterministicSpine(routeRow, null);
    assertCompleteDeterministicSpine(spine);
    return { ...pickCustody(spine), Threat_ID: routeRow.Threat_ID, deterministic_registry_spine: spine, semantic_evidence_application: null, final_material_status: "NOT_TRIGGERED_NOT_APPLICABLE", workpad_only: true, material_projection: null };
  });
  const expected = Number(manifest.expected_registry_row_key_count || manifest.expected_row_count || 0);
  if (rows.length !== expected || new Set(rows.map((row) => row.registry_row_key)).size !== expected) throw new Error("M11_DYNAMIC_WORKPAD_RECONCILIATION_FAILED");
  return { exposure_registry_workpad_98: { schema_version: "exposure_registry_workpad.v4.complete_registry_spine", report_row_schema_version: REPORT_ROW_SCHEMA_VERSION, artifact_token_stability_note: "artifact name retained for compatibility; row count is dynamic", expected_registry_row_key_count: expected, actual_registry_row_key_count: rows.length, mounted_packages: [...asArray(manifest.mounted_packages)], registry_rows: rows, batch_validation_count: batchValidations.length, final_status_counts: countBy(rows, (row) => row.final_material_status), merge_validation: { status: "PASS", failures: [], dynamic_count_reconciled: true, complete_registry_spine_preserved: true } } };
}

export function projectDynamicProfiles(workpadRoot) {
  const workpad = unwrap(workpadRoot, "exposure_registry_workpad_98");
  const material = asArray(workpad.registry_rows).filter((row) => row.material_projection);
  const project = (row) => ({ ...pickCustody(row), ...row.material_projection });
  return {
    controlled: { exposure_registry_controlled_profile: { schema_version: "exposure_registry_controlled_profile.v4.complete_report_row", report_row_schema_version: REPORT_ROW_SCHEMA_VERSION, controlled_rows: material.filter((row) => row.final_material_status !== FINAL_STATUSES.triggered).map(project) } },
    triggered: { exposure_registry_triggered_profile: { schema_version: "exposure_registry_triggered_profile.v4.complete_report_row", report_row_schema_version: REPORT_ROW_SCHEMA_VERSION, triggered_rows: material.filter((row) => row.final_material_status === FINAL_STATUSES.triggered).map(project) } }
  };
}

export function buildDomainAgnosticForensics({ manifest, routePlan, workpad, controlledProfile, triggeredProfile, acceptedBatches = [], batchValidations = [] } = {}) {
  const route = unwrap(routePlan, "exposure_registry_route_plan");
  const work = unwrap(workpad, "exposure_registry_workpad_98");
  const controlled = unwrap(controlledProfile, "exposure_registry_controlled_profile");
  const triggered = unwrap(triggeredProfile, "exposure_registry_triggered_profile");
  const expectedKeys = new Set(asArray(route.route_rows).map((row) => row.registry_row_key));
  const workKeys = new Set(asArray(work.registry_rows).map((row) => row.registry_row_key));
  const materialRows = [...asArray(controlled.controlled_rows), ...asArray(triggered.triggered_rows)];
  const materialKeys = new Set(materialRows.map((row) => row.registry_row_key));
  const expectedMaterialKeys = new Set(asArray(work.registry_rows).filter((row) => row.material_projection).map((row) => row.registry_row_key));
  const failures = [];
  if (!sameSet([...expectedKeys], [...workKeys])) failures.push("ROUTE_WORKPAD_KEY_MISMATCH");
  if (!sameSet([...expectedMaterialKeys], [...materialKeys])) failures.push("WORKPAD_PROFILE_KEY_MISMATCH");
  if (acceptedBatches.length !== batchValidations.length) failures.push("BATCH_VALIDATION_CUSTODY_MISMATCH");
  for (const row of materialRows) try { assertCompleteMaterialProfileRow(row); } catch (error) { failures.push(String(error.message || error)); }
  return { exposure_registry_profile_forensics: { schema_version: FORENSICS_VERSION, report_row_schema_version: REPORT_ROW_SCHEMA_VERSION, execution_identity_version: manifest.execution_identity_contract?.version, phase10_execution_fingerprint: manifest.phase10_execution_fingerprint, registry_set_fingerprint: manifest.registry_set_fingerprint, mounted_packages: [...asArray(manifest.mounted_packages)], expected_registry_row_key_count: expectedKeys.size, route_row_count: expectedKeys.size, workpad_row_count: workKeys.size, material_profile_row_count: materialKeys.size, workpad_only_row_count: workKeys.size - materialKeys.size, accepted_batch_count: acceptedBatches.length, batch_validation_count: batchValidations.length, row_trace: asArray(work.registry_rows).map((row) => ({ registry_row_key: row.registry_row_key, Threat_ID: row.Threat_ID, package_id: row.package_id, stream_id: row.stream_id, stream_type: row.stream_type, final_material_status: row.final_material_status, semantic_evaluated: Boolean(row.semantic_evidence_application), workpad_only: Boolean(row.workpad_only) })), forensic_lock_gate_result: { status: failures.length ? "REPAIR_REQUIRED" : "PASS", failures, dynamic_registry_count_verified: !failures.length, compound_identity_reconciled: !failures.length, complete_registry_spine_preserved: !failures.length, primary_overlay_trace_separate: true, fixed_98_row_assumption: false } } };
}

export function deriveFinalMaterialStatus(statusInputs = {}) {
  const value = (key) => String(statusInputs[key] || "").toLowerCase();
  if (value("exclude_if_met") === "yes") return FINAL_STATUSES.exclusion;
  if (value("public_evidence_limitation") !== "no" || value("evidence_sufficient") !== "yes" || value("false_positive_concern") === "yes") return FINAL_STATUSES.limitation;
  if (value("visible_control_present") === "yes" && value("visible_control_defeats_or_reduces_exposure") === "yes") return FINAL_STATUSES.visible;
  if (value("trigger_if_met") === "yes" && value("hunter_conditions_met") === "yes" && value("target_match_present") === "yes") return FINAL_STATUSES.triggered;
  return FINAL_STATUSES.limitation;
}

function buildDeterministicSpine(row = {}, batch = null) {
  const registry = row.registry_row || row;
  const values = {
    Threat_ID: row.Threat_ID || registry.Threat_ID,
    Threat_Name: registry.Threat_Name,
    Lane: registry.Lane,
    Behavior_Class: registry.Behavior_Class || registry.Archetype || registry.FIELD21,
    Surface: registry.Surface,
    Subcategory: registry.Subcategory || registry.FIELD22,
    Compliance_Framework: Object.prototype.hasOwnProperty.call(registry, "Compliance_Framework") ? registry.Compliance_Framework : null,
    Authority_IN: registry.Authority_IN,
    Authority_EU: registry.Authority_EU,
    Authority_US: registry.Authority_US,
    Velocity: registry.Velocity,
    Pain_Tier: registry.Pain_Tier,
    Pain_Category: registry.Pain_Category,
    Pain_Depth: registry.Pain_Depth,
    Status: registry.Status,
    Effective_Date: registry.Effective_Date,
    Legal_Pain: registry.Legal_Pain,
    FP_Mechanism: registry.FP_Mechanism,
    FP_Impact: registry.FP_Impact,
    Lex_Nova_Fix: registry.Lex_Nova_Fix,
    Hunter_Trigger: registry.Hunter_Trigger,
    Provenance: registry.Provenance,
    FIELD21: registry.FIELD21,
    FIELD22: registry.FIELD22,
    FIELD23: registry.FIELD23
  };
  return {
    ...values,
    registry_row_key: row.registry_row_key,
    package_id: row.package_id,
    source_domain: row.source_domain,
    stream_id: row.stream_id,
    stream_type: row.stream_type,
    batch_id: batch?.batch_id || row.batch_id || "",
    matched_activity_references: [...asArray(row.matched_activity_references)],
    route_reason: row.route_reason || "",
    registry_order: row.registry_order ?? null,
    registry_key_version: row.registry_key_version || "",
    threat_registry_version: row.threat_registry_version || ""
  };
}

function buildMaterialProjection(spine, semanticRow) {
  const row = { ...Object.fromEntries(DETERMINISTIC_REGISTRY_SPINE_FIELDS.map((field) => [field, spine[field]])), target_match: semanticRow.target_match, evaluation_status: deriveFinalMaterialStatus(semanticRow.status_inputs), basis_proof: semanticRow.basis_proof, control_exclusion_evaluation: semanticRow.control_exclusion_evaluation, evidence_source_basis: semanticRow.evidence_source_basis, applied_fp_mechanism: semanticRow.applied_fp_mechanism || spine.FP_Mechanism, row_limitations: semanticRow.row_limitations, review_route: "QUALIFIED_REVIEW" };
  return Object.fromEntries([...DETERMINISTIC_REGISTRY_SPINE_FIELDS, ...FINAL_SEMANTIC_FIELDS].map((field) => [field, row[field] ?? null]));
}
function assertCompleteDeterministicSpine(spine) { for (const field of MANDATORY_SPINE_FIELDS) if (!String(spine?.[field] ?? "").trim()) throw new Error(`M11_DETERMINISTIC_REGISTRY_SPINE_FIELD_MISSING:${spine?.registry_row_key || spine?.Threat_ID || "unknown"}:${field}`); if (!spine.registry_row_key || !spine.package_id || !spine.stream_id || !spine.stream_type) throw new Error(`M11_DETERMINISTIC_REGISTRY_SPINE_CUSTODY_MISSING:${spine?.Threat_ID || "unknown"}`); }
function assertCompleteMaterialProfileRow(row) { for (const field of MANDATORY_SPINE_FIELDS) if (!String(row?.[field] ?? "").trim()) throw new Error(`M11_MATERIAL_PROFILE_FIELD_MISSING:${row?.registry_row_key || row?.Threat_ID || "unknown"}:${field}`); if (!row.registry_row_key || !row.package_id || !row.stream_id || !row.stream_type) throw new Error(`M11_MATERIAL_PROFILE_CUSTODY_MISSING:${row?.Threat_ID || "unknown"}`); }
function pickCustody(row) { return Object.fromEntries(EXECUTION_CUSTODY_FIELDS.map((field) => [field, row?.[field] ?? (field === "matched_activity_references" ? [] : null)])); }
function assertBatchIsolation(batch, rows) { if (!batch?.batch_id || !batch.package_id || !batch.stream_id || !batch.stream_type) throw new Error("M11_BATCH_IDENTITY_MISSING"); if (rows.length !== Number(batch.row_count)) throw new Error(`M11_BATCH_ROW_COUNT_MISMATCH:${batch.batch_id}`); if (rows.length < 1 || rows.length > 15) throw new Error(`M11_BATCH_ROW_LIMIT_INVALID:${batch.batch_id}:${rows.length}`); for (const row of rows) if (row.package_id !== batch.package_id || row.stream_id !== batch.stream_id || row.stream_type !== batch.stream_type) throw new Error(`M11_BATCH_STREAM_ESCAPE:${batch.batch_id}:${row.registry_row_key}`); if (new Set(rows.map((row) => row.Threat_ID)).size !== rows.length) throw new Error(`M11_BATCH_CANONICAL_ID_COLLISION:${batch.batch_id}`); }
function unwrap(value, key) { return value?.[key] || value?.artifact?.[key] || value || {}; }
function asArray(value) { return Array.isArray(value) ? value : []; }
function sameArray(a, b) { return a.length === b.length && a.every((value, index) => value === b[index]); }
function sameSet(a, b) { const left = new Set(a); const right = new Set(b); return left.size === right.size && [...left].every((value) => right.has(value)); }
function countBy(rows, selector) { const counts = {}; for (const row of rows) { const key = selector(row); counts[key] = (counts[key] || 0) + 1; } return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b))); }
