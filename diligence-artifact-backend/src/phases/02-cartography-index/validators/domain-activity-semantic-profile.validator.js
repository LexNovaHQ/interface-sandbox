import {
  P2B_DOMAIN_ACTIVITY_ARTIFACTS,
  P2B_DOMAIN_ACTIVITY_ALLOWED_ROUTE_CLASSES,
  P2B_DOMAIN_ACTIVITY_ALLOWED_SIGNAL_FAMILIES,
  P2B_DOMAIN_ACTIVITY_ALLOWED_CONFIDENCE,
  P2B_DOMAIN_ACTIVITY_FORBIDDEN_OUTPUTS,
  P2B_DOMAIN_ACTIVITY_FORBIDDEN_CONCLUSIONS,
  P2B_DOMAIN_ACTIVITY_RETIRED_ROOTS_FORBIDDEN
} from "../domain-activity-source-index.contract.js";

const REQUIRED_ROOT = P2B_DOMAIN_ACTIVITY_ARTIFACTS.semanticProfile;
const DETERMINISTIC_ROOT = P2B_DOMAIN_ACTIVITY_ARTIFACTS.deterministicMap;
const MIN_QUEUE_COVERAGE = 0.8;
const ALLOWED_PROFILE_KEYS = new Set(["run_id", "schema_version", "semantic_navigation_index", "semantic_integrity", "lock_status"]);
const ALLOWED_NAV_ROW_KEYS = new Set(["queue_id", "unit_id", "route_classes", "route_signal_families", "confidence"]);
const ALLOWED_INTEGRITY_KEYS = new Set(["required_queue_count", "labeled_queue_count", "coverage_ratio", "ready_for_compiler"]);
const ALLOWED_LOCK_STATUS = new Set(["LOCKED", "LOCKED_WITH_LIMITATIONS", "REPAIR_REQUIRED", "CONTROLLED_FAILURE"]);
const FORBIDDEN_KEYS_ANYWHERE = Object.freeze([
  "summary",
  "excerpt",
  "snippet",
  "lossless_text",
  "clean_text",
  "raw_text",
  "body",
  "content",
  "value",
  "derived_value",
  "primary_domain",
  "primary_domain_value",
  "domain_package",
  "domain_package_selected",
  "ai_overlay",
  "ai_overlay_value",
  "regulatory_overlay",
  "regulatory_overlay_value",
  "fusion_status",
  "active_run_package_manifest",
  "legal_advice",
  "compliance_conclusion",
  "risk_conclusion",
  ...P2B_DOMAIN_ACTIVITY_FORBIDDEN_CONCLUSIONS
]);

const FORBIDDEN_VALUE_PATTERNS = Object.freeze([
  /\bprimary\s+domain\s+(is|=|locked|final)\b/i,
  /\bdomain\s+package\s+(selected|locked|mounted)\b/i,
  /\bai\s+overlay\s+(is|=|mounted|locked|final)\b/i,
  /\bregulatory\s+overlay\s+(is|=|mounted|locked|final)\b/i,
  /\bfusion\s+candidate\s+(is|=|locked|final)\b/i,
  /\blicen[cs]e\s+(is\s+)?(valid|required|approved|compliant)\b/i,
  /\b(applicable|applies)\s+(regulator|regulation|rbi|sebi|fca)\b/i,
  /\b(regulatory|legal)\s+compliance\s+(status|confirmed|valid|passed)\b/i,
  /\bgrievance\s+(mechanism|process)\s+(is\s+)?(sufficient|compliant|required)\b/i,
  /\bombudsman\s+(is\s+)?required\b/i
]);

export function validateDomainActivitySemanticProfile(rawOutput, deterministicMapWrapper = {}) {
  const errors = [];
  const warnings = [];
  const output = unwrap(rawOutput);
  const profile = output?.[REQUIRED_ROOT];
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) return result([`Missing required root ${REQUIRED_ROOT}.`], warnings);

  for (const key of Object.keys(output)) if (key !== REQUIRED_ROOT) errors.push(`Unexpected top-level key: ${key}.`);
  for (const key of Object.keys(profile)) if (!ALLOWED_PROFILE_KEYS.has(key)) errors.push(`Unexpected semantic profile key: ${key}.`);
  for (const key of P2B_DOMAIN_ACTIVITY_FORBIDDEN_OUTPUTS) if (containsKey(profile, key)) errors.push(`Forbidden downstream/root key inside domain-activity semantic profile: ${key}.`);
  for (const key of P2B_DOMAIN_ACTIVITY_RETIRED_ROOTS_FORBIDDEN) if (containsStringValue(profile, key)) errors.push(`Retired Phase 1 root marker inside domain-activity semantic profile: ${key}.`);
  for (const key of FORBIDDEN_KEYS_ANYWHERE) if (containsKey(profile, key)) errors.push(`Forbidden derived/copy/conclusion key inside domain-activity semantic profile: ${key}.`);
  assertNoForbiddenConclusionText(profile, errors);

  if (!Array.isArray(profile.semantic_navigation_index)) errors.push("semantic_navigation_index must be an array.");
  if (!profile.semantic_integrity || typeof profile.semantic_integrity !== "object" || Array.isArray(profile.semantic_integrity)) errors.push("semantic_integrity must be an object.");
  if (!ALLOWED_LOCK_STATUS.has(profile.lock_status)) errors.push("Invalid or missing semantic lock_status.");

  validateRows(profile, errors);
  validateIntegrity(profile, collectDeterministicQueue(deterministicMapWrapper), errors, warnings);
  return result(errors, warnings);
}

export function assertDomainActivitySemanticProfile(rawOutput, deterministicMapWrapper = {}) {
  const validation = validateDomainActivitySemanticProfile(rawOutput, deterministicMapWrapper);
  if (!validation.ok) {
    const error = new Error(`DOMAIN_ACTIVITY_SEMANTIC_PROFILE_VALIDATION_FAILED:${validation.errors.join("|")}`);
    error.validation = validation;
    throw error;
  }
  return validation;
}

function validateRows(profile, errors) {
  const seen = new Set();
  for (const [index, row] of asArray(profile.semantic_navigation_index).entries()) {
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      errors.push(`semantic_navigation_index[${index}] must be an object.`);
      continue;
    }
    for (const key of Object.keys(row)) if (!ALLOWED_NAV_ROW_KEYS.has(key)) errors.push(`semantic_navigation_index[${index}] unexpected key: ${key}.`);
    if (!row.queue_id || typeof row.queue_id !== "string") errors.push(`semantic_navigation_index[${index}] missing queue_id.`);
    if (!row.unit_id || typeof row.unit_id !== "string") errors.push(`semantic_navigation_index[${index}] missing unit_id.`);
    if (!Array.isArray(row.route_classes)) errors.push(`semantic_navigation_index[${index}].route_classes must be an array.`);
    if (!Array.isArray(row.route_signal_families)) errors.push(`semantic_navigation_index[${index}].route_signal_families must be an array.`);
    if (!P2B_DOMAIN_ACTIVITY_ALLOWED_CONFIDENCE.includes(row.confidence)) errors.push(`semantic_navigation_index[${index}] invalid confidence.`);
    for (const value of asArray(row.route_classes)) if (!P2B_DOMAIN_ACTIVITY_ALLOWED_ROUTE_CLASSES.includes(value)) errors.push(`semantic_navigation_index[${index}] invalid route_class: ${value}.`);
    for (const value of asArray(row.route_signal_families)) if (!P2B_DOMAIN_ACTIVITY_ALLOWED_SIGNAL_FAMILIES.includes(value)) errors.push(`semantic_navigation_index[${index}] invalid route_signal_family: ${value}.`);
    const queueId = String(row.queue_id || "");
    if (seen.has(queueId)) errors.push(`Duplicate semantic queue_id: ${queueId}.`);
    if (queueId) seen.add(queueId);
  }
}

function validateIntegrity(profile, deterministic, errors, warnings) {
  const rows = asArray(profile.semantic_navigation_index);
  const integrity = profile.semantic_integrity || {};
  for (const key of Object.keys(integrity)) if (!ALLOWED_INTEGRITY_KEYS.has(key)) errors.push(`semantic_integrity unexpected key: ${key}.`);

  let attached = 0;
  for (const [index, row] of rows.entries()) {
    const queueId = String(row?.queue_id || "");
    const unitId = String(row?.unit_id || "");
    if (!queueId) continue;
    const expectedUnitId = deterministic.requiredQueueToUnit.get(queueId) || deterministic.optionalQueueToUnit.get(queueId);
    if (!expectedUnitId) {
      errors.push(`semantic_navigation_index[${index}] queue_id not found in deterministic semantic_label_queue.`);
      continue;
    }
    if (unitId !== expectedUnitId) errors.push(`semantic_navigation_index[${index}] unit_id does not match deterministic queue row.`);
    if (deterministic.requiredQueueToUnit.has(queueId)) attached += 1;
  }

  const requiredCount = deterministic.requiredQueueToUnit.size;
  const coverageRatio = requiredCount ? Number((attached / requiredCount).toFixed(4)) : 1;
  const ready = coverageRatio >= MIN_QUEUE_COVERAGE;

  if (integrity.required_queue_count !== requiredCount) errors.push("semantic_integrity.required_queue_count mismatch.");
  if (integrity.labeled_queue_count !== attached) errors.push("semantic_integrity.labeled_queue_count mismatch.");
  if (Math.abs(Number(integrity.coverage_ratio) - coverageRatio) > 0.01) errors.push("semantic_integrity.coverage_ratio mismatch.");
  if (integrity.ready_for_compiler !== ready) errors.push("semantic_integrity.ready_for_compiler mismatch.");
  if (!ready) errors.push(`semantic navigation coverage below ${MIN_QUEUE_COVERAGE}.`);
  if (requiredCount > 0 && rows.length === 0) errors.push("empty semantic output cannot satisfy required deterministic queue rows.");
  if (requiredCount === 0) warnings.push("Deterministic semantic_label_queue has no required P0/P1 rows.");
}

function collectDeterministicQueue(wrapper) {
  const map = unwrap(wrapper)?.[DETERMINISTIC_ROOT] || unwrap(wrapper) || {};
  const out = { requiredQueueToUnit: new Map(), optionalQueueToUnit: new Map() };
  for (const row of asArray(map.semantic_label_queue)) {
    const queueId = String(row?.queue_id || "");
    const unitId = String(row?.unit_id || "");
    if (!queueId || !unitId) continue;
    if (row?.semantic_label_required === true || ["P0", "P1"].includes(row?.priority)) out.requiredQueueToUnit.set(queueId, unitId);
    else out.optionalQueueToUnit.set(queueId, unitId);
  }
  return out;
}

function assertNoForbiddenConclusionText(value, errors, path = "domain_activity_semantic_profile") {
  if (typeof value === "string") {
    for (const pattern of FORBIDDEN_VALUE_PATTERNS) if (pattern.test(value)) errors.push(`Forbidden domain/AI/regulatory conclusion text at ${path}.`);
    return;
  }
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoForbiddenConclusionText(item, errors, `${path}[${index}]`));
    return;
  }
  for (const [key, item] of Object.entries(value)) assertNoForbiddenConclusionText(item, errors, `${path}.${key}`);
}

function containsKey(value, key) {
  if (!value || typeof value !== "object") return false;
  if (Object.prototype.hasOwnProperty.call(value, key)) return true;
  if (Array.isArray(value)) return value.some((item) => containsKey(item, key));
  return Object.values(value).some((item) => containsKey(item, key));
}

function containsStringValue(value, marker) {
  if (typeof value === "string") return value.includes(marker);
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some((item) => containsStringValue(item, marker));
  return Object.values(value).some((item) => containsStringValue(item, marker));
}

function unwrap(value) {
  if (!value || typeof value !== "object") return value;
  if (value.artifact && typeof value.artifact === "object") return value.artifact;
  if (value.data && typeof value.data === "object") return value.data;
  if (value.payload && typeof value.payload === "object") return value.payload;
  return value;
}

function asArray(value) { return Array.isArray(value) ? value : []; }
function result(errors, warnings) { return { ok: errors.length === 0, errors, warnings, status: errors.length ? "REPAIR_REQUIRED" : warnings.length ? "LOCKED_WITH_LIMITATIONS" : "LOCKED" }; }
