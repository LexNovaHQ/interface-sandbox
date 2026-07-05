import { LEGAL_SIGNAL_DERIVATION_PROFILE_CONTRACT, requiredLegalSignalFieldRows } from "../legal-cartography-index.contract.js";

const REQUIRED_GROUP_KEYS = Object.freeze(Object.keys(LEGAL_SIGNAL_DERIVATION_PROFILE_CONTRACT.required_field_groups));
const REQUIRED_ROOT_KEYS = Object.freeze([
  "artifact_name",
  "schema_version",
  "model_generated",
  "derivation_mode",
  "source_boundary",
  "field_derivations",
  "legal_notice_contact_signal_map",
  "jurisdiction_dispute_signal_map",
  "privacy_grievance_contact_signal_map",
  "consent_manager_signal_map",
  "coverage_summary",
  "validation_manifest"
]);

export function assertLegalSignalDerivationProfile(output) {
  const root = output?.legal_signal_derivation_profile;
  if (!root || typeof root !== "object") throw new Error("LEGAL_SIGNAL_DERIVATION_PROFILE_MISSING_ROOT");

  assertRequiredRootKeys(root);
  assertArtifactIdentity(root);
  assertNoForbiddenKeys(root);
  assertFieldRows(root);
  assertCoverageSummary(root);
  assertValidationManifest(root);
  return true;
}

export function validateLegalSignalDerivationProfile(output) {
  try {
    assertLegalSignalDerivationProfile(output);
    return { ok: true, errors: [] };
  } catch (error) {
    return { ok: false, errors: [String(error?.message || error)] };
  }
}

function assertRequiredRootKeys(root) {
  for (const key of REQUIRED_ROOT_KEYS) {
    if (!(key in root)) throw new Error(`LEGAL_SIGNAL_ROOT_KEY_MISSING:${key}`);
  }
}

function assertArtifactIdentity(root) {
  if (root.artifact_name !== LEGAL_SIGNAL_DERIVATION_PROFILE_CONTRACT.artifact_name) throw new Error("LEGAL_SIGNAL_ARTIFACT_NAME_INVALID");
  if (root.schema_version !== LEGAL_SIGNAL_DERIVATION_PROFILE_CONTRACT.schema_version) throw new Error("LEGAL_SIGNAL_SCHEMA_VERSION_INVALID");
  if (root.model_generated !== false) throw new Error("LEGAL_SIGNAL_MODEL_GENERATED_NOT_FALSE");
  if (root.derivation_mode !== LEGAL_SIGNAL_DERIVATION_PROFILE_CONTRACT.derivation_mode) throw new Error("LEGAL_SIGNAL_DERIVATION_MODE_INVALID");
}

function assertFieldRows(root) {
  if (!Array.isArray(root.field_derivations)) throw new Error("LEGAL_SIGNAL_FIELD_DERIVATIONS_NOT_ARRAY");
  const requiredRows = requiredLegalSignalFieldRows();
  if (root.field_derivations.length !== LEGAL_SIGNAL_DERIVATION_PROFILE_CONTRACT.required_field_count) {
    throw new Error(`LEGAL_SIGNAL_FIELD_COUNT_INVALID:${root.field_derivations.length}`);
  }

  const seen = new Set();
  for (const row of root.field_derivations) {
    assertSingleFieldRow(row);
    const key = `${row.field_family}.${row.field_id}.${row.field_key}`;
    if (seen.has(key)) throw new Error(`LEGAL_SIGNAL_DUPLICATE_FIELD_ROW:${key}`);
    seen.add(key);
    assertRowMirroredInGroup(root, row);
  }

  for (const required of requiredRows) {
    const key = `${required.field_family}.${required.field_id}.${required.field_key}`;
    if (!seen.has(key)) throw new Error(`LEGAL_SIGNAL_REQUIRED_FIELD_MISSING:${key}`);
  }
}

function assertSingleFieldRow(row) {
  if (!row || typeof row !== "object") throw new Error("LEGAL_SIGNAL_FIELD_ROW_NOT_OBJECT");
  for (const key of LEGAL_SIGNAL_DERIVATION_PROFILE_CONTRACT.required_row_fields) {
    if (!(key in row)) throw new Error(`LEGAL_SIGNAL_ROW_KEY_MISSING:${row.field_id || "unknown"}:${key}`);
  }
  if (!REQUIRED_GROUP_KEYS.includes(row.field_family)) throw new Error(`LEGAL_SIGNAL_FIELD_FAMILY_INVALID:${row.field_family}`);
  assertStatus(row);
  assertEvidenceGate(row);
  assertNoForbiddenKeys(row);
}

function assertStatus(row) {
  if (!LEGAL_SIGNAL_DERIVATION_PROFILE_CONTRACT.allowed_statuses.includes(row.derivation_status)) {
    throw new Error(`LEGAL_SIGNAL_STATUS_INVALID:${row.field_id}:${row.derivation_status}`);
  }
  if (LEGAL_SIGNAL_DERIVATION_PROFILE_CONTRACT.forbidden_statuses.includes(row.derivation_status)) {
    throw new Error(`LEGAL_SIGNAL_FORBIDDEN_STATUS:${row.field_id}:${row.derivation_status}`);
  }
  if (typeof row.value !== "string") throw new Error(`LEGAL_SIGNAL_VALUE_NOT_STRING:${row.field_id}`);
}

function assertEvidenceGate(row) {
  const evidence = asArray(row.evidence_basis);
  const locators = asArray(row.locator_basis);
  const scanned = asArray(row.scanned_sources);
  const limitation = String(row.limitation || "").trim();
  const failureReason = String(row.failure_reason || "").trim();

  if (row.derivation_status === "DERIVED" && evidence.length < 1) throw new Error(`LEGAL_SIGNAL_DERIVED_REQUIRES_EVIDENCE:${row.field_id}`);
  if (row.derivation_status === "DERIVED_WITH_LIMITATION") {
    if (evidence.length < 1) throw new Error(`LEGAL_SIGNAL_LIMITED_REQUIRES_EVIDENCE:${row.field_id}`);
    if (!limitation) throw new Error(`LEGAL_SIGNAL_LIMITED_REQUIRES_LIMITATION:${row.field_id}`);
  }
  if (row.derivation_status === "LOCATOR_FOUND_VALUE_NOT_VISIBLE") {
    if (locators.length < 1) throw new Error(`LEGAL_SIGNAL_LOCATOR_STATUS_REQUIRES_LOCATOR:${row.field_id}`);
  }
  if (row.derivation_status === "SOURCE_CONFLICT" && evidence.length < 2) throw new Error(`LEGAL_SIGNAL_CONFLICT_REQUIRES_TWO_EVIDENCE_ROWS:${row.field_id}`);
  if (row.derivation_status === "NOT_DERIVED_AFTER_EXHAUSTIVE_SCAN") {
    if (scanned.length < 1) throw new Error(`LEGAL_SIGNAL_EXHAUSTIVE_SCAN_REQUIRES_SCANNED_SOURCES:${row.field_id}`);
    if (!failureReason) throw new Error(`LEGAL_SIGNAL_EXHAUSTIVE_SCAN_REQUIRES_FAILURE_REASON:${row.field_id}`);
    if (locators.length > 0) throw new Error(`LEGAL_SIGNAL_LOCATOR_FOUND_CANNOT_BE_EXHAUSTIVE_SCAN:${row.field_id}`);
  }
}

function assertRowMirroredInGroup(root, row) {
  const group = root[row.field_family];
  if (!group || typeof group !== "object" || Array.isArray(group)) throw new Error(`LEGAL_SIGNAL_GROUP_MISSING:${row.field_family}`);
  const mirrored = group[row.field_key];
  if (!mirrored || typeof mirrored !== "object") throw new Error(`LEGAL_SIGNAL_GROUP_ROW_MISSING:${row.field_family}.${row.field_key}`);
  if (mirrored.field_id !== row.field_id) throw new Error(`LEGAL_SIGNAL_GROUP_ROW_FIELD_ID_MISMATCH:${row.field_family}.${row.field_key}`);
  if (mirrored.derivation_status !== row.derivation_status) throw new Error(`LEGAL_SIGNAL_GROUP_ROW_STATUS_MISMATCH:${row.field_family}.${row.field_key}`);
}

function assertCoverageSummary(root) {
  const summary = root.coverage_summary || {};
  if (summary.required_field_count !== LEGAL_SIGNAL_DERIVATION_PROFILE_CONTRACT.required_field_count) throw new Error("LEGAL_SIGNAL_REQUIRED_FIELD_COUNT_SUMMARY_INVALID");
  if (summary.emitted_field_count !== LEGAL_SIGNAL_DERIVATION_PROFILE_CONTRACT.required_field_count) throw new Error("LEGAL_SIGNAL_EMITTED_FIELD_COUNT_SUMMARY_INVALID");
  const counted = countStatuses(root.field_derivations);
  for (const [key, value] of Object.entries(counted)) {
    if (summary[key] !== value) throw new Error(`LEGAL_SIGNAL_COVERAGE_SUMMARY_MISMATCH:${key}`);
  }
}

function assertValidationManifest(root) {
  const manifest = root.validation_manifest || {};
  if (manifest.unknown_status_present !== false) throw new Error("LEGAL_SIGNAL_MANIFEST_UNKNOWN_STATUS_TRUE");
  if (manifest.qr_pollution_present !== false) throw new Error("LEGAL_SIGNAL_MANIFEST_QR_POLLUTION_TRUE");
  if (manifest.required_field_count !== LEGAL_SIGNAL_DERIVATION_PROFILE_CONTRACT.required_field_count) throw new Error("LEGAL_SIGNAL_MANIFEST_REQUIRED_COUNT_INVALID");
  if (manifest.emitted_field_count !== LEGAL_SIGNAL_DERIVATION_PROFILE_CONTRACT.required_field_count) throw new Error("LEGAL_SIGNAL_MANIFEST_EMITTED_COUNT_INVALID");
}

function assertNoForbiddenKeys(value, path = "root") {
  if (value == null || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoForbiddenKeys(item, `${path}[${index}]`));
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (LEGAL_SIGNAL_DERIVATION_PROFILE_CONTRACT.forbidden_keys_anywhere.includes(key)) {
      throw new Error(`LEGAL_SIGNAL_FORBIDDEN_KEY_PRESENT:${path}.${key}`);
    }
    assertNoForbiddenKeys(child, `${path}.${key}`);
  }
}

function countStatuses(rows = []) {
  const out = {
    derived_count: 0,
    derived_with_limitation_count: 0,
    locator_found_value_not_visible_count: 0,
    source_not_public_count: 0,
    source_conflict_count: 0,
    not_applicable_contextual_count: 0,
    not_derived_after_exhaustive_scan_count: 0
  };
  for (const row of rows) {
    if (row.derivation_status === "DERIVED") out.derived_count += 1;
    if (row.derivation_status === "DERIVED_WITH_LIMITATION") out.derived_with_limitation_count += 1;
    if (row.derivation_status === "LOCATOR_FOUND_VALUE_NOT_VISIBLE") out.locator_found_value_not_visible_count += 1;
    if (row.derivation_status === "SOURCE_NOT_PUBLIC") out.source_not_public_count += 1;
    if (row.derivation_status === "SOURCE_CONFLICT") out.source_conflict_count += 1;
    if (row.derivation_status === "NOT_APPLICABLE_CONTEXTUAL") out.not_applicable_contextual_count += 1;
    if (row.derivation_status === "NOT_DERIVED_AFTER_EXHAUSTIVE_SCAN") out.not_derived_after_exhaustive_scan_count += 1;
  }
  return out;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}
