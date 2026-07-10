import {
  P2B_DOMAIN_DERIVATION_ARTIFACTS,
  P2B_DOMAIN_DERIVATION_ALLOWED_ROUTE_CLASSES,
  P2B_DOMAIN_DERIVATION_ALLOWED_SIGNAL_FAMILIES,
  P2B_DOMAIN_DERIVATION_ALLOWED_CONFIDENCE,
  P2B_DOMAIN_DERIVATION_FORBIDDEN_CONCLUSIONS,
  P2B_DOMAIN_DERIVATION_FORBIDDEN_OUTPUTS,
  P2B_DOMAIN_DERIVATION_RETIRED_ROOTS_FORBIDDEN
} from "../domain-derivation-source-index.contract.js";

const SEMANTIC_ARTIFACT = P2B_DOMAIN_DERIVATION_ARTIFACTS.semanticProfile;
const MIN_COVERAGE_RATIO = 0.8;
const COPIED_TEXT_KEYS = Object.freeze(["summary", "excerpt", "snippet", "quote", "lossless_text", "clean_text", "raw_text", "body", "content", "notes", "reasoning"]);
const DERIVED_VALUE_KEYS = Object.freeze(["primary_domain", "primary_domain_final", "domain_package", "ai_overlay", "regulatory_overlay", "fusion_status", "derived_value", "value", "conclusion", "legal_advice", "compliance_conclusion"]);

export function validateDomainDerivationSemanticProfile({ semanticProfile, deterministicMap } = {}) {
  const errors = [];
  const profile = unwrapSemanticProfile(semanticProfile);
  const queue = Array.isArray(deterministicMap?.semantic_label_queue) ? deterministicMap.semantic_label_queue : [];

  if (!profile || typeof profile !== "object") errors.push("domain_derivation_semantic_profile must be an object");
  if (profile && profile.schema_version !== "P2B_DOMAIN_DERIVATION_SEMANTIC_PROFILE_v1_PHASE1_V5_12_ROOT") errors.push("invalid semantic schema_version");
  const rows = Array.isArray(profile?.semantic_navigation_index) ? profile.semantic_navigation_index : [];
  if (!Array.isArray(profile?.semantic_navigation_index)) errors.push("semantic_navigation_index must be an array");

  for (const [index, row] of rows.entries()) validateSemanticRow({ row, index, errors });
  validateNoForbiddenMarkers(profile, errors);
  validateCoverage({ profile, queue, rows, errors });

  return { ok: errors.length === 0, errors, artifact_name: SEMANTIC_ARTIFACT, queue_count: queue.length, semantic_row_count: rows.length };
}

function unwrapSemanticProfile(value) {
  if (value && typeof value === "object" && SEMANTIC_ARTIFACT in value) return value[SEMANTIC_ARTIFACT];
  if (value && typeof value === "object" && value.payload && SEMANTIC_ARTIFACT in value.payload) return value.payload[SEMANTIC_ARTIFACT];
  return value;
}

function validateSemanticRow({ row, index, errors }) {
  if (!row || typeof row !== "object" || Array.isArray(row)) {
    errors.push(`semantic row ${index} must be an object`);
    return;
  }
  if (!row.queue_id) errors.push(`semantic row ${index} missing queue_id`);
  if (!row.unit_id) errors.push(`semantic row ${index} missing unit_id`);
  for (const routeClass of ensureArray(row.route_classes)) if (!P2B_DOMAIN_DERIVATION_ALLOWED_ROUTE_CLASSES.includes(routeClass)) errors.push(`semantic row ${index} has forbidden route_class ${routeClass}`);
  for (const family of ensureArray(row.route_signal_families)) if (!P2B_DOMAIN_DERIVATION_ALLOWED_SIGNAL_FAMILIES.includes(family)) errors.push(`semantic row ${index} has forbidden signal family ${family}`);
  if (!P2B_DOMAIN_DERIVATION_ALLOWED_CONFIDENCE.includes(row.confidence)) errors.push(`semantic row ${index} has invalid confidence ${row.confidence}`);
  for (const key of Object.keys(row)) {
    if (COPIED_TEXT_KEYS.includes(key)) errors.push(`semantic row ${index} includes copied-text key ${key}`);
    if (DERIVED_VALUE_KEYS.includes(key)) errors.push(`semantic row ${index} includes derived-value key ${key}`);
  }
}

function validateCoverage({ profile, queue, rows, errors }) {
  const integrity = profile?.semantic_integrity || {};
  const requiredQueue = queue.filter((row) => row.semantic_label_required || row.priority === "P0" || row.priority === "P1");
  const requiredCount = requiredQueue.length;
  const labeledQueueIds = new Set(rows.map((row) => row.queue_id).filter(Boolean));
  const labeledRequiredCount = requiredQueue.filter((row) => labeledQueueIds.has(row.queue_id)).length;
  const ratio = requiredCount ? labeledRequiredCount / requiredCount : 1;

  if (Number(integrity.required_queue_count) !== requiredCount) errors.push("semantic_integrity.required_queue_count must match deterministic queue");
  if (Number(integrity.labeled_queue_count) !== labeledRequiredCount) errors.push("semantic_integrity.labeled_queue_count must match labeled required queue rows");
  if (Math.abs(Number(integrity.coverage_ratio ?? -1) - ratio) > 0.001) errors.push("semantic_integrity.coverage_ratio must match deterministic queue coverage");
  if (requiredCount && ratio < MIN_COVERAGE_RATIO && integrity.ready_for_compiler !== false) errors.push("ready_for_compiler must be false when semantic coverage is below 0.80");
  if (ratio >= MIN_COVERAGE_RATIO && integrity.ready_for_compiler !== true) errors.push("ready_for_compiler must be true when semantic coverage meets the threshold");
  if (ratio < MIN_COVERAGE_RATIO && profile?.lock_status !== "REPAIR_REQUIRED") errors.push("lock_status must be REPAIR_REQUIRED when coverage is below threshold");
}

function validateNoForbiddenMarkers(value, errors) {
  const text = JSON.stringify(value || {});
  for (const marker of [...P2B_DOMAIN_DERIVATION_FORBIDDEN_CONCLUSIONS, ...P2B_DOMAIN_DERIVATION_FORBIDDEN_OUTPUTS, ...P2B_DOMAIN_DERIVATION_RETIRED_ROOTS_FORBIDDEN]) {
    if (text.includes(marker)) errors.push(`semantic profile includes forbidden marker ${marker}`);
  }
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}
