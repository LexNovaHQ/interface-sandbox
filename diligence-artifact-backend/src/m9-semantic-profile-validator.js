const REQUIRED_ROOT = "legal_cartography_semantic_profile";
const MIN_QUEUE_COVERAGE = 0.8;

const ALLOWED_SUBCATS = new Set(["CNS", "LIA", "HAL", "INF", "PRV", "BIO", "DEC", "HRM", "FRD", "TRD"]);
const ALLOWED_CONTROL_FAMILIES = new Set(["FORMATION_CONTRACT", "ACTIVITY_SPECIFIC_DISCLOSURE", "DATA_PRIVACY", "VENDORS_TRANSFER", "SECURITY", "USE_SAFETY", "AGENT_AUTHORITY", "IP_CONTENT", "COMMERCIAL_LEGAL_ALLOCATION", "CONTACT_ROUTES", "INDEMNITY", "UNKNOWN_CONTROL_LANGUAGE"]);
const ALLOWED_CONFIDENCE = new Set(["CLEAR", "PARTIAL", "UNCLEAR"]);
const ALLOWED_LOCK_STATUS = new Set(["LOCKED", "LOCKED_WITH_LIMITATIONS", "REPAIR_REQUIRED", "CONTROLLED_FAILURE"]);
const ALLOWED_PROFILE_KEYS = new Set(["schema_version", "semantic_navigation_index", "semantic_integrity", "lock_status"]);
const ALLOWED_NAV_ROW_KEYS = new Set(["queue_id", "unit_id", "subcats", "control_families", "confidence"]);
const ALLOWED_INTEGRITY_KEYS = new Set(["required_queue_count", "labeled_queue_count", "coverage_ratio", "ready_for_compiler"]);

const REMOVED_SEMANTIC_KEYS = Object.freeze([
  "document_labels",
  "unit_subcat_labels",
  "control_family_labels",
  "indemnity_labels",
  "cross_reference_labels",
  "missing_source_labels",
  "semantic_repair_queue",
  "semantic_integrity_summary",
  "downstream_rules",
  "status"
]);

const DOWNSTREAM_ROOT_KEYS = Object.freeze([
  "legal_cartography_index",
  "target_profile",
  "target_feature_profile",
  "data_provenance_profile",
  "exposure_registry_profile",
  "challenge_gate",
  "final_output_handoff",
  "renderer_payload"
]);

export function validateM9SemanticProfile(rawOutput, deterministicMapWrapper = {}) {
  const errors = [];
  const warnings = [];
  const output = unwrap(rawOutput);
  const profile = output?.[REQUIRED_ROOT];
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) return result([`Missing required root ${REQUIRED_ROOT}.`], warnings);

  for (const key of Object.keys(output)) if (key !== REQUIRED_ROOT) errors.push(`Unexpected top-level key: ${key}.`);
  for (const key of Object.keys(profile)) if (!ALLOWED_PROFILE_KEYS.has(key)) errors.push(`Unexpected semantic profile key: ${key}.`);
  for (const key of REMOVED_SEMANTIC_KEYS) if (Object.prototype.hasOwnProperty.call(profile, key)) errors.push(`Removed semantic key present: ${key}.`);
  for (const key of DOWNSTREAM_ROOT_KEYS) if (containsKey(profile, key)) errors.push(`Downstream root key inside semantic profile: ${key}.`);

  if (!Array.isArray(profile.semantic_navigation_index)) errors.push("semantic_navigation_index must be an array.");
  if (!profile.semantic_integrity || typeof profile.semantic_integrity !== "object" || Array.isArray(profile.semantic_integrity)) errors.push("semantic_integrity must be an object.");
  if (!ALLOWED_LOCK_STATUS.has(profile.lock_status)) errors.push("Invalid or missing semantic lock_status.");

  validateRows(profile, errors);
  validateIntegrity(profile, collectDeterministicQueue(deterministicMapWrapper), errors, warnings);

  return result(errors, warnings);
}

function validateRows(profile, errors) {
  for (const [index, row] of asArray(profile.semantic_navigation_index).entries()) {
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      errors.push(`semantic_navigation_index[${index}] must be an object.`);
      continue;
    }
    for (const key of Object.keys(row)) if (!ALLOWED_NAV_ROW_KEYS.has(key)) errors.push(`semantic_navigation_index[${index}] unexpected key: ${key}.`);
    if (!row.queue_id || typeof row.queue_id !== "string") errors.push(`semantic_navigation_index[${index}] missing queue_id.`);
    if (!row.unit_id || typeof row.unit_id !== "string") errors.push(`semantic_navigation_index[${index}] missing unit_id.`);
    if (!Array.isArray(row.subcats)) errors.push(`semantic_navigation_index[${index}].subcats must be an array.`);
    if (!Array.isArray(row.control_families)) errors.push(`semantic_navigation_index[${index}].control_families must be an array.`);
    if (!ALLOWED_CONFIDENCE.has(row.confidence)) errors.push(`semantic_navigation_index[${index}] invalid confidence.`);
    for (const value of asArray(row.subcats)) if (!ALLOWED_SUBCATS.has(value)) errors.push(`semantic_navigation_index[${index}] invalid subcat: ${value}.`);
    for (const value of asArray(row.control_families)) if (!ALLOWED_CONTROL_FAMILIES.has(value)) errors.push(`semantic_navigation_index[${index}] invalid control family: ${value}.`);
    if (asArray(row.control_families).length > 3) errors.push(`semantic_navigation_index[${index}] has too many control_families.`);
  }
}

function validateIntegrity(profile, deterministic, errors, warnings) {
  const rows = asArray(profile.semantic_navigation_index);
  const integrity = profile.semantic_integrity || {};
  for (const key of Object.keys(integrity)) if (!ALLOWED_INTEGRITY_KEYS.has(key)) errors.push(`semantic_integrity unexpected key: ${key}.`);

  const rowQueueIds = new Set();
  let attached = 0;
  for (const [index, row] of rows.entries()) {
    const queueId = String(row?.queue_id || "");
    const unitId = String(row?.unit_id || "");
    if (!queueId) continue;
    if (rowQueueIds.has(queueId)) errors.push(`Duplicate semantic queue_id: ${queueId}.`);
    rowQueueIds.add(queueId);
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
  if (requiredCount === 0) warnings.push("Deterministic semantic_label_queue has no required P0/P1 rows.");
}

function collectDeterministicQueue(wrapper) {
  const map = unwrap(wrapper)?.legal_cartography_deterministic_map || unwrap(wrapper) || {};
  const out = { requiredQueueToUnit: new Map(), optionalQueueToUnit: new Map() };
  for (const row of asArray(map.semantic_label_queue)) {
    const queueId = String(row?.queue_id || "");
    const unitId = String(row?.unit_id || row?.section_id || "");
    if (!queueId || !unitId) continue;
    if (isRequiredQueueRow(row)) out.requiredQueueToUnit.set(queueId, unitId);
    else out.optionalQueueToUnit.set(queueId, unitId);
  }
  return out;
}

function isRequiredQueueRow(row) {
  return row?.semantic_label_required === true || ["P0", "P1"].includes(row?.priority);
}

function containsKey(value, key) {
  if (!value || typeof value !== "object") return false;
  if (Object.prototype.hasOwnProperty.call(value, key)) return true;
  if (Array.isArray(value)) return value.some((item) => containsKey(item, key));
  return Object.values(value).some((item) => containsKey(item, key));
}

function unwrap(value) {
  if (!value || typeof value !== "object") return value;
  if (value.artifact && typeof value.artifact === "object") return value.artifact;
  return value;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function result(errors, warnings) {
  return { ok: errors.length === 0, errors, warnings, status: errors.length ? "REPAIR_REQUIRED" : warnings.length ? "LOCKED_WITH_LIMITATIONS" : "LOCKED" };
}
