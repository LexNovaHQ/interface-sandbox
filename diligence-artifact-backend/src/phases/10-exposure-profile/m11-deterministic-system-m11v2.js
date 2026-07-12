import * as base from "./m11-deterministic-system.js";
import {
  buildPackageScopedBatchPlan,
  buildPackageScopedExposureRegistryRoutePlan,
  buildPhase5ClassificationInventory,
  finalizePhase10RoutingContext,
  MAX_M11_BATCH_PACKET_CHARS,
  MAX_M11_BATCH_ROWS,
  M11_PACKAGE_ROUTING_RULES_VERSION,
  M11_PACKET_CEILING_VERSION,
  PACKAGE_SCOPED_ROUTE_PLAN_SCHEMA,
  PHASE5_CLASSIFICATION_INVENTORY_SCHEMA,
  validatePackageScopedBatchPlan
} from "./phase10-classification-routing.js";

const S_TRIGGERED = "TRIGGERED";
const S_VISIBLE = "CONTROLLED_BY_VISIBLE_CONTROL";
const S_EXCLUSION = "CONTROLLED_BY_EXCLUSION";
const S_PUBLIC_LIMIT = "CONTROLLED_BY_PUBLIC_EVIDENCE_LIMITATION";
const CONTROLLED_FINAL_STATUSES = new Set([S_VISIBLE, S_EXCLUSION, S_PUBLIC_LIMIT]);
const FINAL_MATERIAL_STATUSES = new Set([S_TRIGGERED, S_VISIBLE, S_EXCLUSION, S_PUBLIC_LIMIT]);
const PAIN_TIER_CATEGORY = Object.freeze({ T1: "Existential", T2: "Uncapped Money", T3: "Deal Death", T4: "Regulatory Heat", T5: "Friction" });
const PAIN_DEPTH_VALUES = new Set(["Corporate", "Personal", "Criminal"]);

export const CRITICAL_REGISTRY_FIELDS = base.CRITICAL_REGISTRY_FIELDS;
export const EXPECTED_ACTIVE_REGISTRY_ROWS = base.EXPECTED_ACTIVE_REGISTRY_ROWS;
export const EXPECTED_LEP_ROWS = base.EXPECTED_LEP_ROWS;
export { MAX_M11_BATCH_PACKET_CHARS, MAX_M11_BATCH_ROWS, M11_PACKAGE_ROUTING_RULES_VERSION, M11_PACKET_CEILING_VERSION, PACKAGE_SCOPED_ROUTE_PLAN_SCHEMA, PHASE5_CLASSIFICATION_INVENTORY_SCHEMA };
export const METADATA_REGISTRY_FIELDS = base.METADATA_REGISTRY_FIELDS;
export const REQUIRED_REGISTRY_FIELDS = base.REQUIRED_REGISTRY_FIELDS;
export const SEMANTIC_FIELDS = base.SEMANTIC_FIELDS;
export const STATUS_INPUT_FIELDS = base.STATUS_INPUT_FIELDS;
export { FINAL_MATERIAL_STATUSES };

export const DETERMINISTIC_REGISTRY_SPINE_FIELDS = Object.freeze([
  "Threat_ID", "Threat_Name", "Lane", "Behavior_Class", "Surface", "Subcategory",
  "Compliance_Framework", "Authority_IN", "Authority_EU", "Authority_US", "Velocity",
  "Pain_Tier", "Pain_Category", "Pain_Depth", "Status", "Effective_Date", "Legal_Pain",
  "FP_Mechanism", "FP_Impact", "Lex_Nova_Fix", "Hunter_Trigger", "Provenance",
  "FIELD21", "FIELD22", "FIELD23"
]);

export const EXECUTION_CUSTODY_FIELDS = Object.freeze([
  "registry_row_key", "package_id", "source_domain", "stream_id", "stream_type", "batch_id",
  "matched_activity_references", "route_reason", "registry_order", "registry_key_version", "threat_registry_version"
]);

export const MATERIAL_FIELDS = Object.freeze([
  ...DETERMINISTIC_REGISTRY_SPINE_FIELDS,
  "target_match", "evaluation_status", "basis_proof", "control_exclusion_evaluation",
  "evidence_source_basis", "applied_fp_mechanism", "row_limitations", "review_route"
]);

export const parseAiThreatRegistryYaml = base.parseAiThreatRegistryYaml;
export const parseReferencePacket = base.parseReferencePacket;
export const validateThreatIdDecomposition = base.validateThreatIdDecomposition;
export const normalizeField23 = base.normalizeField23;
export const parseHunterTrigger = base.parseHunterTrigger;
export const validateM11BatchLedger = base.validateM11BatchLedger;
export const deriveM11FinalEvaluationStatus = base.deriveM11FinalEvaluationStatus;
export const buildExposureRegistryForensics = base.buildExposureRegistryForensics;
export { buildPhase5ClassificationInventory, finalizePhase10RoutingContext };

export function validateRegistryRows(rows, options = {}) {
  const baseline = base.validateRegistryRows(rows, options);
  const failures = [...(baseline.failures || [])];
  const mandatory = [
    "Threat_ID", "Threat_Name", "Lane", "Surface", "Velocity", "Pain_Tier", "Pain_Category",
    "Pain_Depth", "Status", "Effective_Date", "Legal_Pain", "FP_Mechanism", "FP_Impact",
    "Lex_Nova_Fix", "Hunter_Trigger", "Provenance", "FIELD21", "FIELD22", "FIELD23"
  ];
  for (const [index, row] of (Array.isArray(rows) ? rows : []).entries()) {
    const id = String(row?.Threat_ID || `ROW_${index + 1}`);
    const behaviorClass = String(row?.Behavior_Class || row?.Archetype || row?.FIELD21 || "").trim();
    if (!behaviorClass) failures.push(`REGISTRY_BEHAVIOR_CLASS_MISSING:${id}`);
    for (const field of mandatory) if (!String(row?.[field] ?? "").trim()) failures.push(`REGISTRY_MANDATORY_FIELD_MISSING:${id}:${field}`);
    if (![row?.Authority_IN, row?.Authority_EU, row?.Authority_US].some((value) => String(value || "").trim() && String(value).trim() !== "—")) failures.push(`REGISTRY_AUTHORITY_ANCHOR_MISSING:${id}`);
    const tier = String(row?.Pain_Tier || "").trim();
    const category = String(row?.Pain_Category || "").trim();
    const depth = String(row?.Pain_Depth || "").trim();
    if (!tier) failures.push(`REGISTRY_PAIN_TIER_MISSING:${id}`);
    else if (!Object.prototype.hasOwnProperty.call(PAIN_TIER_CATEGORY, tier)) failures.push(`REGISTRY_PAIN_TIER_INVALID:${id}:${tier}`);
    if (!category) failures.push(`REGISTRY_PAIN_CATEGORY_MISSING:${id}`);
    else if (PAIN_TIER_CATEGORY[tier] && PAIN_TIER_CATEGORY[tier] !== category) failures.push(`REGISTRY_PAIN_CATEGORY_TIER_MISMATCH:${id}:${tier}:${category}`);
    if (!depth) failures.push(`REGISTRY_PAIN_DEPTH_MISSING:${id}`);
    else if (!PAIN_DEPTH_VALUES.has(depth)) failures.push(`REGISTRY_PAIN_DEPTH_INVALID:${id}:${depth}`);
  }
  const uniqueFailures = [...new Set(failures)];
  return {
    ...baseline,
    ok: uniqueFailures.length === 0,
    status: uniqueFailures.length ? "CONTROLLED_FAILURE" : "PASS",
    failures: uniqueFailures,
    severity_validation_status: uniqueFailures.some((failure) => failure.includes("PAIN_")) ? "CONTROLLED_FAILURE" : "PASS",
    deterministic_report_row_contract: "phase10_report_row.v1.complete_registry_spine"
  };
}

export function extractM11RoutingSubstrate(targetFeatureProfile = {}, manifest = {}) { return buildPhase5ClassificationInventory({ targetFeatureProfile, manifest }); }
export function buildBatchPlan(routeRows, options = {}) { return buildPackageScopedBatchPlan(routeRows, options); }
export function validateBatchPlan(batchPlan, options = {}) { return validatePackageScopedBatchPlan(batchPlan, options); }
export function buildExposureRegistryRoutePlan(args = {}) { if (!args.registryContext) throw new Error("PACKAGE_SCOPED_REGISTRY_CONTEXT_REQUIRED"); return buildPackageScopedExposureRegistryRoutePlan(args); }

export function buildM11BatchPacket(args) {
  if (args?.routePlan?.exposure_registry_route_plan?.schema_version === PACKAGE_SCOPED_ROUTE_PLAN_SCHEMA || args?.routePlan?.schema_version === PACKAGE_SCOPED_ROUTE_PLAN_SCHEMA) throw new Error("USE_PHASE10_SEMANTIC_FINALIZATION_FOR_PACKAGE_SCOPED_BATCH_PACKET");
  return base.buildM11BatchPacket(args);
}
export function assembleM11AcceptedBatchLedger(args) { return base.assembleM11AcceptedBatchLedger(args); }
export function mergeExposureRegistryWorkpad98(args) { return base.mergeExposureRegistryWorkpad98(args); }

export function projectControlledProfile(workpadRoot) {
  const workpad = workpadRoot?.exposure_registry_workpad_98 || workpadRoot;
  const rows = asArray(workpad?.registry_rows).filter((row) => CONTROLLED_FINAL_STATUSES.has(row.final_material_status)).sort(byRegistryOrder).map(projectCompleteRow);
  return { exposure_registry_controlled_profile: { schema_version: "exposure_registry_controlled_profile.v4.complete_report_row", controlled_rows: rows } };
}
export function projectTriggeredProfile(workpadRoot) {
  const workpad = workpadRoot?.exposure_registry_workpad_98 || workpadRoot;
  const rows = asArray(workpad?.registry_rows).filter((row) => row.final_material_status === S_TRIGGERED).sort(byRegistryOrder).map(projectCompleteRow);
  return { exposure_registry_triggered_profile: { schema_version: "exposure_registry_triggered_profile.v4.complete_report_row", triggered_rows: rows } };
}
function projectCompleteRow(row = {}) { return { ...Object.fromEntries(EXECUTION_CUSTODY_FIELDS.map((field) => [field, row[field] ?? ""])), ...(row.material_projection || row) }; }
function byRegistryOrder(a, b) { return (a.registry_order ?? 9999) - (b.registry_order ?? 9999); }
function asArray(value) { return Array.isArray(value) ? value : []; }
