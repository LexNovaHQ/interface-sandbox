import * as base from "./m11-deterministic-system.js";

const S_TRIGGERED = "TR" + "IGGERED";
const S_VISIBLE = "CONTROLLED_BY_VISIBLE_CONTROL";
const S_EXCLUSION = "CONTROLLED_BY_EXCLUSION";
const S_PUBLIC_LIMIT = "CONTROLLED_BY_PUBLIC_EVIDENCE_LIMITATION";
const CONTROLLED_FINAL_STATUSES = new Set([S_VISIBLE, S_EXCLUSION, S_PUBLIC_LIMIT]);
const FINAL_MATERIAL_STATUSES = new Set([S_TRIGGERED, S_VISIBLE, S_EXCLUSION, S_PUBLIC_LIMIT]);
const VALID_SUBCATS = new Set(["CNS", "LIA", "HAL", "INF", "PRV", "BIO", "DEC", "HRM", "FRD", "TRD"]);
const LEGACY_SUBCAT_NORMALIZATION = Object.freeze({ FIN: "LIA" });

export const CRITICAL_REGISTRY_FIELDS = base.CRITICAL_REGISTRY_FIELDS;
export const EXPECTED_ACTIVE_REGISTRY_ROWS = base.EXPECTED_ACTIVE_REGISTRY_ROWS;
export const EXPECTED_LEP_ROWS = base.EXPECTED_LEP_ROWS;
export const MAX_M11_BATCH_ROWS = base.MAX_M11_BATCH_ROWS;
export const METADATA_REGISTRY_FIELDS = base.METADATA_REGISTRY_FIELDS;
export const REQUIRED_REGISTRY_FIELDS = base.REQUIRED_REGISTRY_FIELDS;
export const SEMANTIC_FIELDS = base.SEMANTIC_FIELDS;
export const STATUS_INPUT_FIELDS = base.STATUS_INPUT_FIELDS;
export { FINAL_MATERIAL_STATUSES };
export const MATERIAL_FIELDS = Object.freeze(["Threat_ID", "Threat_Name", "target_match", "evaluation_status", "basis_proof", "control_exclusion_evaluation", "evidence_source_basis", "fp_mechanism", "Archetype", "Subcategory", "Surface", "authority_anchors", "Pain_Tier", "Pain_Depth", "Pain_Category", "Legal_Pain", "remediation", "review_route", "row_limitations"]);

export const parseAiThreatRegistryYaml = base.parseAiThreatRegistryYaml;
export const parseReferencePacket = base.parseReferencePacket;
export const validateRegistryRows = base.validateRegistryRows;
export const validateThreatIdDecomposition = base.validateThreatIdDecomposition;
export const normalizeField23 = base.normalizeField23;
export const parseHunterTrigger = base.parseHunterTrigger;
export const extractM11RoutingSubstrate = base.extractM11RoutingSubstrate;
export const buildBatchPlan = base.buildBatchPlan;
export const validateBatchPlan = base.validateBatchPlan;
export const validateM11BatchLedger = base.validateM11BatchLedger;
export const deriveM11FinalEvaluationStatus = base.deriveM11FinalEvaluationStatus;
export const buildExposureRegistryForensics = base.buildExposureRegistryForensics;

export function buildExposureRegistryRoutePlan(args) {
  const output = base.buildExposureRegistryRoutePlan(args);
  const plan = output.exposure_registry_route_plan;
  const warnings = [];
  plan.route_rows = asArray(plan.route_rows).map((row) => normalizeRouteRow(row, warnings));
  plan.deterministic_not_applicable_rows = plan.route_rows.filter((row) => row.route === "NOT_TRIGGERED_NOT_APPLICABLE");
  plan.registry_inventory = {
    ...plan.registry_inventory,
    m11_schema_upgrade: "THREAT_NAME_AND_SUBCATEGORY_NORMALIZATION_V1",
    material_row_field_count: 19,
    split_profile_roots_clean: true,
    subcategory_code_only: true,
    allowed_subcategories: [...VALID_SUBCATS],
    subcategory_normalization_warnings: warnings
  };
  plan.phase_a_validation = normalizeValidationWithWarnings(plan.phase_a_validation, warnings);
  return output;
}

export function buildM11BatchPacket(args) {
  const output = base.buildM11BatchPacket(args);
  const packet = output.m11_batch_packet;
  const warnings = [];
  packet.registry_rows = asArray(packet.registry_rows).map((row) => normalizeBatchRegistryRow(row, warnings));
  packet.material_row_contract = "M11_THREE_LAYER_FULL_ROW_V1";
  packet.material_row_field_count = 19;
  packet.m11_schema_upgrade = "THREAT_NAME_AND_SUBCATEGORY_NORMALIZATION_V1";
  packet.subcategory_normalization_warnings = warnings;
  return output;
}

export function assembleM11AcceptedBatchLedger({ semanticBatch, batchPacket }) {
  const output = base.assembleM11AcceptedBatchLedger({ semanticBatch, batchPacket });
  const root = output.m11_batch_registry_ledger;
  const packet = batchPacket?.m11_batch_packet || batchPacket || {};
  const registryById = mapRegistryRows(packet.registry_rows);
  const warnings = [];
  root.batch_registry_ledger = asArray(root.batch_registry_ledger).map((row) => normalizeMaterialRow(row, registryById.get(row.Threat_ID), warnings));
  root.material_row_contract = "M11_THREE_LAYER_FULL_ROW_V1";
  root.material_row_field_count = 19;
  root.m11_schema_upgrade = "THREAT_NAME_AND_SUBCATEGORY_NORMALIZATION_V1";
  root.threat_name_required = true;
  root.subcategory_code_only = true;
  root.subcategory_normalization_warnings = warnings;
  return output;
}

export function mergeExposureRegistryWorkpad98(args) {
  const output = base.mergeExposureRegistryWorkpad98(args);
  const workpad = output.exposure_registry_workpad_98;
  const plan = args?.routePlan?.exposure_registry_route_plan || args?.routePlan || {};
  const routeById = mapRegistryRows(plan.route_rows);
  const warnings = [];
  workpad.registry_rows = asArray(workpad.registry_rows).map((row) => normalizeWorkpadRow(row, routeById.get(row.Threat_ID), warnings));
  workpad.workpad_metadata = {
    ...workpad.workpad_metadata,
    material_row_field_count: 19,
    m11_schema_upgrade: "THREAT_NAME_AND_SUBCATEGORY_NORMALIZATION_V1",
    threat_name_required: true,
    subcategory_code_only: true,
    subcategory_normalization_warnings: warnings
  };
  workpad.merge_validation = normalizeValidationWithWarnings(workpad.merge_validation, warnings);
  return output;
}

export function projectControlledProfile(workpadRoot) {
  const workpad = workpadRoot?.exposure_registry_workpad_98 || workpadRoot;
  const rows = asArray(workpad?.registry_rows)
    .filter((row) => CONTROLLED_FINAL_STATUSES.has(row.final_material_status))
    .sort((a, b) => (a.registry_order ?? 9999) - (b.registry_order ?? 9999))
    .map((row) => pickMaterialFields(row.material_projection || row));
  return { exposure_registry_controlled_profile: { controlled_rows: rows } };
}

export function projectTriggeredProfile(workpadRoot) {
  const workpad = workpadRoot?.exposure_registry_workpad_98 || workpadRoot;
  const rows = asArray(workpad?.registry_rows)
    .filter((row) => row.final_material_status === S_TRIGGERED)
    .sort((a, b) => (a.registry_order ?? 9999) - (b.registry_order ?? 9999))
    .map((row) => pickMaterialFields(row.material_projection || row));
  return { exposure_registry_triggered_profile: { triggered_rows: rows } };
}

function normalizeRouteRow(row = {}, warnings = []) {
  const normalized = normalizeSubcategory(row.FIELD22 || row.registry_row?.FIELD22 || deriveThreatIdPart(row.Threat_ID, 1));
  pushWarning(warnings, normalized, row.Threat_ID);
  const registryRow = normalizeRegistryRow(row.registry_row || row, warnings, row.Threat_ID);
  return {
    ...row,
    Threat_Name: row.Threat_Name || registryRow.Threat_Name || "",
    FIELD22: normalized.code,
    Subcategory: normalized.code,
    subcategory_normalization: normalized.record,
    registry_row: registryRow
  };
}

function normalizeBatchRegistryRow(row = {}, warnings = []) {
  const registryRow = normalizeRegistryRow(row, warnings, row.Threat_ID);
  return {
    ...registryRow,
    deterministic_registry_spine: normalizeMaterialRow(row.deterministic_registry_spine || {}, registryRow, warnings)
  };
}

function normalizeRegistryRow(row = {}, warnings = [], threatId = row.Threat_ID) {
  const normalized = normalizeSubcategory(row.FIELD22 || row.Subcategory || deriveThreatIdPart(threatId, 1));
  pushWarning(warnings, normalized, threatId);
  return {
    ...row,
    Threat_Name: row.Threat_Name || "",
    FIELD22: normalized.code,
    Subcategory: normalized.code,
    original_FIELD22: normalized.changed ? normalized.raw : row.original_FIELD22,
    subcategory_normalization: normalized.record
  };
}

function normalizeMaterialRow(row = {}, registryRow = {}, warnings = []) {
  const threatId = row.Threat_ID || registryRow.Threat_ID || "";
  const normalized = normalizeSubcategory(row.Subcategory || registryRow.Subcategory || registryRow.FIELD22 || deriveThreatIdPart(threatId, 1));
  pushWarning(warnings, normalized, threatId);
  return pickMaterialFields({
    ...row,
    Threat_ID: threatId,
    Threat_Name: row.Threat_Name || registryRow.Threat_Name || "",
    Subcategory: normalized.code
  });
}

function normalizeWorkpadRow(row = {}, routeRow = {}, warnings = []) {
  const materialProjection = row.material_projection ? normalizeMaterialRow(row.material_projection, routeRow.registry_row || routeRow, warnings) : row.material_projection;
  const normalized = normalizeSubcategory(row.subcategory || row.Subcategory || materialProjection?.Subcategory || routeRow.FIELD22 || deriveThreatIdPart(row.Threat_ID, 1));
  pushWarning(warnings, normalized, row.Threat_ID);
  return {
    ...row,
    Threat_Name: row.Threat_Name || materialProjection?.Threat_Name || routeRow.Threat_Name || "",
    Subcategory: normalized.code,
    subcategory: normalized.code,
    material_projection: materialProjection
  };
}

function normalizeSubcategory(value) {
  const raw = String(value || "").trim().toUpperCase();
  const code = LEGACY_SUBCAT_NORMALIZATION[raw] || raw;
  const changed = Boolean(raw && raw !== code);
  const valid = VALID_SUBCATS.has(code);
  return {
    raw,
    code: valid ? code : raw,
    changed,
    valid,
    record: changed ? { original_subcategory: raw, normalized_subcategory: code, policy: "KNOWN_LEGACY_SUBCAT_NORMALIZATION_NON_BLOCKING" } : null
  };
}

function pushWarning(warnings, normalized, Threat_ID) {
  if (!normalized?.changed) return;
  warnings.push({ Threat_ID: Threat_ID || "", code: "LEGACY_SUBCATEGORY_NORMALIZED", original_subcategory: normalized.raw, normalized_subcategory: normalized.code, severity: "WARNING_NON_BLOCKING" });
}

function normalizeValidationWithWarnings(validation = {}, warnings = []) {
  const failures = asArray(validation.failures);
  const existingWarnings = asArray(validation.warnings);
  const nextWarnings = [...existingWarnings, ...warnings];
  return {
    ...validation,
    warnings: nextWarnings,
    non_blocking_warning_count: nextWarnings.length,
    status: failures.length ? validation.status || "REPAIR_REQUIRED" : nextWarnings.length ? "PASS_WITH_LIMITATION" : validation.status || "PASS"
  };
}

function pickMaterialFields(row = {}) {
  return Object.fromEntries(MATERIAL_FIELDS.map((field) => [field, field === "evaluation_status" ? String(row[field] || "").trim().toUpperCase() : row[field] ?? ""]));
}

function mapRegistryRows(rows) {
  const map = new Map();
  for (const row of asArray(rows)) if (row?.Threat_ID) map.set(row.Threat_ID, row);
  return map;
}

function deriveThreatIdPart(threatId, index) {
  return String(threatId || "").split("_")[index] || "";
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}
