import fs from "node:fs";
import path from "node:path";

export const SOURCE_BUCKETS = ["company_profile_sources", "product_profile_sources", "legal_profile_sources", "governance_profile_sources"];
export const VALID_STATUSES = new Set(["TRIGGERED", "CONTROLLED", "NOT_TRIGGERED", "NOT_APPLICABLE", "INSUFFICIENT_EVIDENCE"]);

export function nowIso() {
  return new Date().toISOString();
}

export function asArray(value) {
  return Array.isArray(value) ? value : [];
}

export function asText(value) {
  return String(value || "").trim();
}

export function normalizeUrl(value) {
  const raw = asText(value);
  if (!raw) return null;
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withScheme);
    url.hash = "";
    if ((url.pathname || "") !== "/") url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    return url.toString();
  } catch {
    return null;
  }
}

function readJsonFile(candidatePaths, label) {
  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) return JSON.parse(fs.readFileSync(candidate, "utf8"));
  }
  throw new Error(`${label} not found. Checked: ${candidatePaths.join(", ")}`);
}

export function loadRuntimeData() {
  const cwd = process.cwd();
  return {
    registryRuntime: readJsonFile([
      path.join(cwd, "data", "runtime", "registry.runtime.json"),
      path.join(cwd, "..", "data", "runtime", "registry.runtime.json")
    ], "registry.runtime.json"),
    registryKey: readJsonFile([
      path.join(cwd, "data", "runtime", "registry_key.runtime.json"),
      path.join(cwd, "..", "data", "runtime", "registry_key.runtime.json")
    ], "registry_key.runtime.json")
  };
}

export function logStage(logs, stage, status, meta = {}) {
  logs.push({ stage, status, at: nowIso(), ...meta });
}

export function registryThreatId(row, index) {
  return asText(row?.Threat_ID || row?.threat_id || `ROW_${index + 1}`);
}

export function threatName(row) {
  return asText(row?.threat_name || row?.Threat_Name || "Unnamed row");
}

export function threatId(entry) {
  return asText(entry?.threat_id || entry?.Threat_ID);
}

export function itemId(row, index) {
  return asText(row?.Threat_ID || row?.threat_id || `ROW_${index + 1}`);
}

export function itemName(row) {
  return asText(row?.Threat_Name || row?.threat_name || "Unnamed row");
}

export function normalizeRegistryRow(row, index) {
  return { ...row, Threat_ID: itemId(row, index), Threat_Name: itemName(row), _registry_index: index, _registry_position: index + 1 };
}

export function makeBatch({ rows, batchNumber, batchCount, totalRows, runId }) {
  return {
    run_id: runId,
    batch_id: `live_stage7_batch_${batchNumber}_of_${batchCount}_${Date.now()}`,
    batch_number: batchNumber,
    batch_count: batchCount,
    batch_size: rows.length,
    registry_total_count: totalRows,
    registry_count_loaded: totalRows,
    registry_range: { start_position: rows[0]?._registry_position || 1, end_position: rows[rows.length - 1]?._registry_position || rows.length },
    expected_threat_ids: rows.map((row) => row.Threat_ID),
    registry_rows: rows
  };
}

export function countsByStatus(rows = []) {
  return rows.reduce((acc, entry) => {
    const key = entry?.final_status || entry?.assessment_status || "UNKNOWN";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

export function coverage(expectedIds = [], emittedIds = []) {
  const expectedSet = new Set(expectedIds);
  const emittedSet = new Set(emittedIds);
  const missing = expectedIds.filter((id) => !emittedSet.has(id));
  const unexpected = emittedIds.filter((id) => !expectedSet.has(id));
  const duplicate = emittedIds.filter((id, index) => emittedIds.indexOf(id) !== index);
  return { ok: missing.length === 0 && unexpected.length === 0 && duplicate.length === 0 && expectedIds.length === emittedIds.length, expected_count: expectedIds.length, emitted_count: emittedIds.length, missing, unexpected, duplicate: [...new Set(duplicate)] };
}


function sourceRecordSummary(record = {}, index = 0) {
  const text = record?.text || {};
  return {
    evidence_source_id: record.evidence_source_id || record.source_record_ref || record.source_id || `SRC_${String(index + 1).padStart(3, "0")}`,
    source_family: record.source_family || record.profile_family || record.family || "unknown",
    url: record.url || record.source_url || null,
    final_url: record.final_url || record.url || record.source_url || null,
    title: record.structure?.title || record.title || record.meta_title || "",
    word_count: text.word_count || record.word_count || 0,
    clean_text_sha256: text.clean_text_sha256 || record.clean_text_sha256 || null,
    coverage_status: record.quality?.coverage_status || record.coverage_status || record.status || "unknown"
  };
}

function compactArtifactInventory(sourceBundle = {}) {
  const explicit = asArray(sourceBundle.artifact_inventory);
  if (explicit.length) return explicit.map(sourceRecordSummary);
  return asArray(sourceBundle.raw_footprint?.source_records).map(sourceRecordSummary);
}

export function compactSourceBundleForOperatorChallenge(sourceBundle = {}) {
  const records = asArray(sourceBundle.raw_footprint?.source_records);
  return {
    run_id: sourceBundle.run_id || null,
    source_mode: sourceBundle.source_mode || sourceBundle.source_review?.source_mode || "runtime_discovery_capture",
    target_input: sourceBundle.target_input || {},
    source_review: sourceBundle.source_review || {
      source_bundle_version: sourceBundle.source_bundle_version || null,
      admitted_source_count: records.length,
      full_text_available_upstream: true,
      operator_challenge_text_policy: "full_text_stripped_stage8_uses_stage7_ledger_and_stage6_canonical_indexes"
    },
    artifact_inventory: compactArtifactInventory(sourceBundle),
    evidence_buffer: records.map(sourceRecordSummary),
    limitations: [
      ...asArray(sourceBundle.limitations),
      "Stage 8 receives source identity metadata only; full admitted text remains upstream in Stage 6 and Stage 7 artifacts to avoid quota exhaustion."
    ]
  };
}
export function compactRegistryLogicReference(registryRows) {
  return registryRows.map((row, index) => ({
    entry_number: index + 1,
    threat_id: registryThreatId(row, index),
    threat_name: threatName(row),
    hunter_trigger: row?.hunter_trigger || null,
    archetype: row?.archetype || row?.Archetype || null,
    surface: row?.surface || row?.Surface || row?.surfaces || row?.Surfaces || null
  }));
}

function duplicateValues(values) {
  const seen = new Set();
  const duplicates = new Set();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates];
}

function compareIds(expectedIds, actualIds) {
  const expected = new Set(expectedIds);
  const actual = new Set(actualIds);
  return {
    missing: expectedIds.filter((id) => !actual.has(id)),
    unexpected: actualIds.filter((id) => !expected.has(id)),
    duplicate: duplicateValues(actualIds)
  };
}

function validateLedgerEntry(entry) {
  const id = threatId(entry);
  const errors = [];
  if (!id) errors.push("corrected entry missing threat_id");
  if (!entry?.threat_name) errors.push(`${id || "unknown"}: missing threat_name`);
  if (!Number.isInteger(entry?.entry_number) || entry.entry_number < 1) errors.push(`${id || "unknown"}: invalid entry_number`);
  if (!Array.isArray(entry?.conditions)) errors.push(`${id || "unknown"}: conditions must be an array`);
  if (typeof entry?.trigger_if_result !== "boolean") errors.push(`${id || "unknown"}: trigger_if_result must be boolean`);
  if (typeof entry?.exclude_if_result !== "boolean") errors.push(`${id || "unknown"}: exclude_if_result must be boolean`);
  if (!VALID_STATUSES.has(entry?.final_status)) errors.push(`${id || "unknown"}: invalid final_status ${entry?.final_status}`);
  if (!Array.isArray(entry?.feature_refs)) errors.push(`${id || "unknown"}: feature_refs must be an array`);
  if (typeof entry?.evidence_ref !== "string") errors.push(`${id || "unknown"}: evidence_ref must be string`);
  if (typeof entry?.reasoning_summary !== "string") errors.push(`${id || "unknown"}: reasoning_summary must be string`);
  return errors;
}

export function validateChallengeOutput(output, expectedTotal) {
  const errors = [];
  const warnings = [];
  const repairs = [];
  const gate = output?.operator_challenge_gate;
  if (!gate || typeof gate !== "object") errors.push("operator_challenge_gate missing or invalid");
  else {
    if (typeof gate.completed !== "boolean") errors.push("operator_challenge_gate.completed must be boolean");
    if (!["PASS", "PASS_WITH_WARNINGS", "REOPENED", "FAIL_RETRY_REQUIRED"].includes(gate.result)) errors.push(`invalid operator challenge result: ${gate.result}`);
    if (gate.result !== "FAIL_RETRY_REQUIRED" && expectedTotal && gate.registry_count_evaluated !== expectedTotal) {
      warnings.push(`operator_challenge_gate.registry_count_evaluated expected ${expectedTotal}, received ${gate.registry_count_evaluated}; final ledger coverage will be authoritative`);
    }
  }
  if (!Array.isArray(output?.corrected_ledger_entries)) {
    output.corrected_ledger_entries = [];
    repairs.push("normalized missing corrected_ledger_entries to []");
  }
  if (warnings.length) output.operator_challenge_warnings = [...asArray(output.operator_challenge_warnings), ...warnings];
  if (repairs.length) output.operator_challenge_repairs = [...asArray(output.operator_challenge_repairs), ...repairs];
  return errors;
}

export function applyCorrections({ mergedLedger, challengeOutput, expectedIds }) {
  const errors = [];
  const warnings = [];
  const repairs = [];
  const originalIds = mergedLedger.map(threatId).filter(Boolean);
  const preCompare = compareIds(expectedIds, originalIds);
  if (preCompare.missing.length) errors.push(`pre-correction ledger missing threat_id(s): ${preCompare.missing.join(", ")}`);
  if (preCompare.unexpected.length) errors.push(`pre-correction ledger has unexpected threat_id(s): ${preCompare.unexpected.join(", ")}`);
  if (preCompare.duplicate.length) errors.push(`pre-correction ledger has duplicate threat_id(s): ${preCompare.duplicate.join(", ")}`);

  if (!Array.isArray(challengeOutput?.corrected_ledger_entries)) {
    challengeOutput.corrected_ledger_entries = [];
    repairs.push("normalized missing corrected_ledger_entries to []");
  }

  const correctedEntries = asArray(challengeOutput?.corrected_ledger_entries).filter((entry) => entry && typeof entry === "object");
  const correctedIds = correctedEntries.map(threatId).filter(Boolean);
  const duplicateCorrected = duplicateValues(correctedIds);
  const originalIdSet = new Set(originalIds);
  const unknownCorrected = correctedIds.filter((id) => !originalIdSet.has(id));
  const missingCorrectedIds = correctedEntries.filter((entry) => !threatId(entry)).length;
  if (missingCorrectedIds) errors.push(`corrected entry missing threat_id count: ${missingCorrectedIds}`);
  if (duplicateCorrected.length) errors.push(`duplicate corrected threat_id(s): ${duplicateCorrected.join(", ")}`);
  if (unknownCorrected.length) errors.push(`unknown corrected threat_id(s): ${unknownCorrected.join(", ")}`);
  if (errors.length) return { ok: false, correction_errors: errors, correction_warnings: warnings, correction_repairs: repairs, corrected_count: correctedEntries.length, post_challenge_ledger: mergedLedger };

  const originalMap = new Map(mergedLedger.map((entry) => [threatId(entry), entry]));
  const correctionMap = new Map();
  for (const patch of correctedEntries) {
    const id = threatId(patch);
    const original = originalMap.get(id);
    const merged = { ...original, ...patch, threat_id: id };
    const validationErrors = validateLedgerEntry(merged);
    if (validationErrors.length) errors.push(...validationErrors.map((message) => `${id}: merged corrected entry invalid after repair: ${message}`));
    else {
      correctionMap.set(id, merged);
      if (Object.keys(patch).length < 9) repairs.push(`merged partial corrected entry for ${id}`);
    }
  }
  if (errors.length) return { ok: false, correction_errors: errors, correction_warnings: warnings, correction_repairs: repairs, corrected_count: correctedEntries.length, post_challenge_ledger: mergedLedger };

  const postChallengeLedger = mergedLedger.map((entry) => correctionMap.get(threatId(entry)) || entry);
  const postIds = postChallengeLedger.map(threatId).filter(Boolean);
  const postCompare = compareIds(expectedIds, postIds);
  const postErrors = [];
  if (postCompare.missing.length) postErrors.push(`post-correction ledger missing threat_id(s): ${postCompare.missing.join(", ")}`);
  if (postCompare.unexpected.length) postErrors.push(`post-correction ledger has unexpected threat_id(s): ${postCompare.unexpected.join(", ")}`);
  if (postCompare.duplicate.length) postErrors.push(`post-correction ledger has duplicate threat_id(s): ${postCompare.duplicate.join(", ")}`);
  return { ok: postErrors.length === 0, correction_errors: postErrors, correction_warnings: warnings, correction_repairs: repairs, corrected_count: correctedEntries.length, post_challenge_ledger: postChallengeLedger, correction_meta: { corrected_threat_ids: correctedIds, duplicate_corrected_threat_ids: duplicateCorrected, unknown_corrected_threat_ids: unknownCorrected, post_correction_missing_threat_ids: postCompare.missing, post_correction_unexpected_threat_ids: postCompare.unexpected, post_correction_duplicate_threat_ids: postCompare.duplicate } };
}
