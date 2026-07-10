import {
  P2C_ACTIVITY_PROFILE_ALLOWED_CONFIDENCE,
  P2C_ACTIVITY_PROFILE_ALLOWED_ROUTE_CLASSES,
  P2C_ACTIVITY_PROFILE_ALLOWED_SIGNAL_FAMILIES,
  P2C_ACTIVITY_PROFILE_ARTIFACTS,
  P2C_ACTIVITY_PROFILE_FORBIDDEN_CLASSIFICATION_KEYS,
  P2C_ACTIVITY_PROFILE_FORBIDDEN_CONCLUSIONS,
  P2C_ACTIVITY_PROFILE_FORBIDDEN_OUTPUTS,
  P2C_ACTIVITY_PROFILE_RETIRED_ROOTS_FORBIDDEN
} from "../activity-profile-source-index.contract.js";

export const ACTIVITY_PROFILE_SEMANTIC_ARTIFACT_NAME = P2C_ACTIVITY_PROFILE_ARTIFACTS.semanticProfile;

const REQUIRED_ROOT_KEY = ACTIVITY_PROFILE_SEMANTIC_ARTIFACT_NAME;
const ALLOWED_PROFILE_KEYS = Object.freeze([
  "artifact_type",
  "schema_version",
  "generated_by",
  "source_text_policy",
  "semantic_route_labels",
  "semantic_navigation_index",
  "semantic_integrity",
  "package_boundary",
  "downstream_rules",
  "lock_status"
]);
const REQUIRED_ROW_KEYS = Object.freeze([
  "queue_id",
  "unit_id",
  "route_classes",
  "route_signal_families",
  "confidence",
  "semantic_reason_code",
  "source_text_copied",
  "package_specific_classification_forbidden"
]);
const FORBIDDEN_COPY_KEYS = Object.freeze([
  "lossless_text",
  "clean_text",
  "text",
  "body",
  "content",
  "excerpt",
  "snippet",
  "summary",
  "source_summary",
  "evidence_summary",
  "profile_answer",
  "answer",
  "derived_value",
  "value",
  "mechanics_proof",
  "activity_candidate_summary"
]);
const FORBIDDEN_ROUTE_TEXT_PATTERNS = Object.freeze([
  /\barchetype\b/i,
  /\bsurface\b/i,
  /\bclassification\s+locked\b/i,
  /\bpackage\s+classification\b/i,
  /\bselected\s+package\b/i,
  /\bdomain\s+package\s+selected\b/i,
  /\blegal\s+advice\b/i,
  /\bcompliance\s+conclusion\b/i,
  /\brisk\s+conclusion\b/i,
  /\bexposure\s+match\b/i
]);

export function validateActivityProfileSemanticProfile(wrapper = {}, { deterministicMap = {} } = {}) {
  const failures = [];
  const warnings = [];
  const profile = wrapper?.[REQUIRED_ROOT_KEY] || wrapper;

  if (!isPlainObject(profile)) failures.push("activity_profile_semantic_profile must be an object");
  if (wrapper && Object.prototype.hasOwnProperty.call(wrapper, REQUIRED_ROOT_KEY) && !isPlainObject(wrapper[REQUIRED_ROOT_KEY])) failures.push("activity_profile_semantic_profile wrapper value must be object");
  assertOnlyAllowedKeys(profile, ALLOWED_PROFILE_KEYS, failures, "activity_profile_semantic_profile");
  assertNoForbiddenKeys(profile, failures);
  assertNoForbiddenText(profile, failures);
  assertNoRetiredRoots(profile, failures);

  const rows = Array.isArray(profile.semantic_route_labels) ? profile.semantic_route_labels : [];
  if (!Array.isArray(profile.semantic_route_labels)) failures.push("semantic_route_labels must be array");
  validateRows(rows, failures);
  validateSemanticNavigation(profile.semantic_navigation_index, rows, failures);
  validatePackageBoundary(profile.package_boundary || {}, failures);
  validateIntegrity({ integrity: profile.semantic_integrity || {}, deterministicMap, rows, failures, warnings });
  validateDownstreamRules(profile.downstream_rules || {}, failures);
  if (!profile.lock_status) failures.push("lock_status missing");

  return Object.freeze({
    status: failures.length ? "FAIL" : "PASS",
    validator: "activity-profile-semantic-profile.validator",
    failures: Object.freeze(failures),
    warnings: Object.freeze(warnings)
  });
}

export function assertActivityProfileSemanticProfile(wrapper = {}, context = {}) {
  const validation = validateActivityProfileSemanticProfile(wrapper, context);
  if (validation.status !== "PASS") throw new Error(`P2C_ACTIVITY_PROFILE_SEMANTIC_PROFILE_VALIDATION_FAILED:${JSON.stringify(validation.failures)}`);
  return validation;
}

function validateRows(rows, failures) {
  const seen = new Set();
  const allowedRoutes = new Set(P2C_ACTIVITY_PROFILE_ALLOWED_ROUTE_CLASSES);
  const allowedSignals = new Set(P2C_ACTIVITY_PROFILE_ALLOWED_SIGNAL_FAMILIES);
  const allowedConfidence = new Set(P2C_ACTIVITY_PROFILE_ALLOWED_CONFIDENCE);

  for (const [index, row] of rows.entries()) {
    if (!isPlainObject(row)) { failures.push(`semantic_route_labels[${index}] must be object`); continue; }
    for (const key of REQUIRED_ROW_KEYS) if (!Object.prototype.hasOwnProperty.call(row, key)) failures.push(`semantic_route_labels[${index}] missing ${key}`);
    assertOnlyAllowedKeys(row, Object.freeze([...REQUIRED_ROW_KEYS, "route_label_status", "limitation"]), failures, `semantic_route_labels[${index}]`);
    if (!row.queue_id) failures.push(`semantic_route_labels[${index}] missing queue_id`);
    if (row.queue_id && seen.has(row.queue_id)) failures.push(`duplicate semantic queue_id:${row.queue_id}`);
    seen.add(row.queue_id);
    if (!row.unit_id) failures.push(`semantic_route_labels[${index}] missing unit_id`);
    if (!Array.isArray(row.route_classes) || !row.route_classes.length) failures.push(`semantic_route_labels[${index}] route_classes must be non-empty array`);
    for (const routeClass of row.route_classes || []) if (!allowedRoutes.has(routeClass)) failures.push(`semantic_route_labels[${index}] route_class not allowed:${routeClass}`);
    if (!Array.isArray(row.route_signal_families) || !row.route_signal_families.length) failures.push(`semantic_route_labels[${index}] route_signal_families must be non-empty array`);
    for (const signal of row.route_signal_families || []) if (!allowedSignals.has(signal)) failures.push(`semantic_route_labels[${index}] route_signal_family not allowed:${signal}`);
    if (!allowedConfidence.has(row.confidence)) failures.push(`semantic_route_labels[${index}] confidence not allowed:${row.confidence}`);
    if (typeof row.semantic_reason_code !== "string" || !row.semantic_reason_code.trim()) failures.push(`semantic_route_labels[${index}] semantic_reason_code must be non-empty string`);
    if (String(row.semantic_reason_code || "").length > 80) failures.push(`semantic_route_labels[${index}] semantic_reason_code must be a compact code, not prose`);
    if (row.source_text_copied !== false) failures.push(`semantic_route_labels[${index}] source_text_copied must be false`);
    if (row.package_specific_classification_forbidden !== true) failures.push(`semantic_route_labels[${index}] package_specific_classification_forbidden must be true`);
  }
}

function validateSemanticNavigation(value, rows, failures) {
  if (!Array.isArray(value)) return failures.push("semantic_navigation_index must be array");
  const queueIds = new Set(rows.map((row) => row.queue_id));
  for (const [index, row] of value.entries()) {
    if (!isPlainObject(row)) { failures.push(`semantic_navigation_index[${index}] must be object`); continue; }
    const allowed = Object.freeze(["queue_id", "unit_id", "route_classes", "route_signal_families", "reading_priority", "navigation_status", "source_text_copied", "package_specific_classification_forbidden"]);
    assertOnlyAllowedKeys(row, allowed, failures, `semantic_navigation_index[${index}]`);
    if (!queueIds.has(row.queue_id)) failures.push(`semantic_navigation_index[${index}] points to unknown queue_id:${row.queue_id || "missing"}`);
    if (!Array.isArray(row.route_classes) || !row.route_classes.length) failures.push(`semantic_navigation_index[${index}] route_classes must be non-empty array`);
    if (!Array.isArray(row.route_signal_families) || !row.route_signal_families.length) failures.push(`semantic_navigation_index[${index}] route_signal_families must be non-empty array`);
    if (!row.reading_priority) failures.push(`semantic_navigation_index[${index}] missing reading_priority`);
    if (row.source_text_copied !== false) failures.push(`semantic_navigation_index[${index}] source_text_copied must be false`);
    if (row.package_specific_classification_forbidden !== true) failures.push(`semantic_navigation_index[${index}] package_specific_classification_forbidden must be true`);
  }
}

function validatePackageBoundary(boundary, failures) {
  if (!isPlainObject(boundary)) return failures.push("package_boundary must be object");
  const requiredTrue = Object.freeze([
    "domain_agnostic_activity_locator_only",
    "mounted_domain_package_controls_activity_taxonomy",
    "archetype_surface_and_package_field_derivation_forbidden",
    "phase_5_derives_profile_values_later"
  ]);
  for (const key of requiredTrue) if (boundary[key] !== true) failures.push(`package_boundary.${key} must be true`);
}

function validateIntegrity({ integrity, deterministicMap, rows, failures, warnings }) {
  if (!isPlainObject(integrity)) return failures.push("semantic_integrity must be object");
  const queue = deterministicQueue(deterministicMap);
  const deterministicByQueue = new Map(queue.map((row) => [row.queue_id, row]));
  for (const row of rows) {
    const deterministicRow = deterministicByQueue.get(row.queue_id);
    if (!deterministicRow) failures.push(`semantic row not present in deterministic queue:${row.queue_id}`);
    if (deterministicRow && deterministicRow.unit_id !== row.unit_id) failures.push(`semantic row unit mismatch:${row.queue_id}`);
  }
  const requiredCount = queue.length;
  const labeledCount = rows.length;
  const expectedRatio = requiredCount ? Number((labeledCount / requiredCount).toFixed(4)) : 1;
  if (Number(integrity.deterministic_queue_count ?? requiredCount) !== requiredCount) failures.push("semantic_integrity.deterministic_queue_count mismatch");
  if (Number(integrity.labeled_queue_count ?? labeledCount) !== labeledCount) failures.push("semantic_integrity.labeled_queue_count mismatch");
  if (typeof integrity.coverage_ratio !== "number") failures.push("semantic_integrity.coverage_ratio must be number");
  if (typeof integrity.coverage_ratio === "number" && Math.abs(integrity.coverage_ratio - expectedRatio) > 0.0001) failures.push("semantic_integrity.coverage_ratio mismatch");
  if (requiredCount && expectedRatio < 0.8) failures.push("semantic coverage below 0.80");
  if (integrity.ready_for_compiler !== (failures.length === 0)) warnings.push("semantic_integrity.ready_for_compiler should reflect validation status");
}

function validateDownstreamRules(rules, failures) {
  if (!isPlainObject(rules)) return failures.push("downstream_rules must be object");
  const requiredFalse = Object.freeze(["archetype_derivation_allowed", "surface_derivation_allowed", "package_specific_classification_allowed", "feature_candidate_inventory_emission_allowed", "mechanics_proof_allowed", "source_text_copy_allowed"]);
  const requiredTrue = Object.freeze(["phase_2c_is_index_only", "activity_profile_source_index_owned_by_2c", "phase_5_activity_profile_review_derives_values_later", "domain_package_specific_activity_taxonomy_deferred_to_phase5"]);
  for (const key of requiredFalse) if (rules[key] !== false) failures.push(`downstream_rules.${key} must be false`);
  for (const key of requiredTrue) if (rules[key] !== true) failures.push(`downstream_rules.${key} must be true`);
}

function deterministicQueue(deterministicMap = {}) {
  const map = deterministicMap?.["activity_profile_deterministic_map"] || deterministicMap;
  return Array.isArray(map?.semantic_label_queue) ? map.semantic_label_queue : [];
}

function assertOnlyAllowedKeys(obj, allowedKeys, failures, label) {
  if (!isPlainObject(obj)) return;
  const allowed = new Set(allowedKeys);
  for (const key of Object.keys(obj)) if (!allowed.has(key)) failures.push(`${label} has forbidden key:${key}`);
}

function assertNoForbiddenKeys(value, failures, path = "root") {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) return value.forEach((item, index) => assertNoForbiddenKeys(item, failures, `${path}[${index}]`));
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_COPY_KEYS.includes(key)) failures.push(`copied/source/proof key forbidden at ${path}.${key}`);
    if (P2C_ACTIVITY_PROFILE_FORBIDDEN_OUTPUTS.includes(key)) failures.push(`forbidden output key at ${path}.${key}`);
    if (P2C_ACTIVITY_PROFILE_FORBIDDEN_CLASSIFICATION_KEYS.includes(key)) failures.push(`package-specific classification key forbidden at ${path}.${key}`);
    if (P2C_ACTIVITY_PROFILE_FORBIDDEN_CONCLUSIONS.includes(key)) failures.push(`profile conclusion key forbidden at ${path}.${key}`);
    assertNoForbiddenKeys(child, failures, `${path}.${key}`);
  }
}

function assertNoForbiddenText(value, failures) {
  const text = JSON.stringify(value || {});
  for (const pattern of FORBIDDEN_ROUTE_TEXT_PATTERNS) if (pattern.test(text)) failures.push(`forbidden package/classification/conclusion text present:${pattern}`);
}

function assertNoRetiredRoots(value, failures) {
  const text = JSON.stringify(value || {});
  for (const retired of P2C_ACTIVITY_PROFILE_RETIRED_ROOTS_FORBIDDEN) if (text.includes(retired)) failures.push(`retired Phase 1/root-family artifact referenced:${retired}`);
}

function isPlainObject(value) { return Boolean(value && typeof value === "object" && !Array.isArray(value)); }
