#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const DEFAULT_RUNTIME_URL = "https://lexnova-runtime-api-24qnalslaa-uc.a.run.app";
const runtimeUrl = process.env.RUNTIME_URL || process.env.LEXNOVA_RUNTIME_URL || DEFAULT_RUNTIME_URL;
const token = process.env.RUNTIME_ACCESS_TOKEN;
const stage6CachePath = process.env.STAGE6_E2E_CACHE_PATH || path.join(process.cwd(), ".runtime-e2e-cache", "stage6-legal-stack-review.json");
const stage7ArtifactPath = process.env.STAGE7_AUDIT_EXPORT_PATH || path.join(process.cwd(), ".runtime-e2e-cache", "stage7-priority-ledger.json");
const registryPath = process.env.REGISTRY_RUNTIME_PATH || path.join(process.cwd(), "..", "data", "runtime", "registry.runtime.json");
const stage8ExportPath = process.env.STAGE8_AUDIT_EXPORT_PATH || path.join(process.cwd(), ".runtime-e2e-cache", "stage8-operator-challenge.json");
const postChallengeLedgerPath = process.env.STAGE8_CORRECTED_LEDGER_PATH || path.join(process.cwd(), ".runtime-e2e-cache", "stage8-corrected-ledger.json");
const stage8InputPath = process.env.STAGE8_INPUT_EXPORT_PATH || path.join(process.cwd(), ".runtime-e2e-cache", "stage8-operator-challenge-input.json");

const VALID_STATUSES = new Set(["TRIGGERED", "CONTROLLED", "NOT_TRIGGERED", "NOT_APPLICABLE", "INSUFFICIENT_EVIDENCE"]);

function fail(message, detail) {
  console.error(JSON.stringify({ ok: false, error: message, detail: detail || null }, null, 2));
  process.exit(1);
}

function readJson(filePath, label) {
  if (!fs.existsSync(filePath)) fail(`${label} file missing`, { filePath });
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

function baseUrl(value) {
  const raw = String(value || "").trim();
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    return new URL(withScheme).toString().replace(/\/+$/, "");
  } catch (error) {
    fail("RUNTIME_URL must be valid", { received: raw, error: error.message });
  }
}

async function parseResponse(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { non_json_body: text.slice(0, 3000) };
  }
}

async function postJson(base, routePath, body) {
  const response = await fetch(`${base}${routePath}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-runtime-access-token": token
    },
    body: JSON.stringify(body)
  });
  const json = await parseResponse(response);
  if (!response.ok || json?.ok === false) fail(`Request failed: ${routePath}`, { status: response.status, body: json });
  return json;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asText(value) {
  return String(value || "").trim();
}

function threatId(entry) {
  return asText(entry?.threat_id || entry?.Threat_ID);
}

function threatName(row) {
  return asText(row?.threat_name || row?.Threat_Name || "Unnamed row");
}

function registryThreatId(row, index) {
  return asText(row?.Threat_ID || row?.threat_id || `ROW_${index + 1}`);
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

function countsByStatus(rows = []) {
  return rows.reduce((acc, entry) => {
    const key = entry?.final_status || "UNKNOWN";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
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

function validateChallengeOutput(output, expectedTotal) {
  const errors = [];
  const keys = Object.keys(output || {}).sort();
  const expectedKeys = ["corrected_ledger_entries", "operator_challenge_gate"].sort();
  if (JSON.stringify(keys) !== JSON.stringify(expectedKeys)) {
    errors.push(`operator_challenge output must contain exactly ${expectedKeys.join(", ")}; received ${keys.join(", ")}`);
  }

  const gate = output?.operator_challenge_gate;
  if (!gate || typeof gate !== "object") errors.push("operator_challenge_gate missing or invalid");
  else {
    if (typeof gate.completed !== "boolean") errors.push("operator_challenge_gate.completed must be boolean");
    if (!["PASS", "PASS_WITH_WARNINGS", "REOPENED", "FAIL_RETRY_REQUIRED"].includes(gate.result)) errors.push(`invalid operator challenge result: ${gate.result}`);
    if (!Number.isInteger(gate.registry_count_loaded)) errors.push("operator_challenge_gate.registry_count_loaded must be integer");
    if (!Number.isInteger(gate.registry_count_evaluated)) errors.push("operator_challenge_gate.registry_count_evaluated must be integer");
    if (!Array.isArray(gate.reopened_rows)) errors.push("operator_challenge_gate.reopened_rows must be array");
    if (!gate.high_risk_checks || typeof gate.high_risk_checks !== "object" || Array.isArray(gate.high_risk_checks)) errors.push("operator_challenge_gate.high_risk_checks must be object");
    if (!Array.isArray(gate.notes)) errors.push("operator_challenge_gate.notes must be array");
    if (gate.result !== "FAIL_RETRY_REQUIRED" && expectedTotal && gate.registry_count_evaluated !== expectedTotal) {
      errors.push(`operator_challenge_gate.registry_count_evaluated expected ${expectedTotal}, received ${gate.registry_count_evaluated}`);
    }
  }

  if (!Array.isArray(output?.corrected_ledger_entries)) errors.push("corrected_ledger_entries must be array");
  return errors;
}

function applyCorrections({ mergedLedger, challengeOutput, expectedIds }) {
  const errors = [];
  const originalIds = mergedLedger.map(threatId).filter(Boolean);
  const preCompare = compareIds(expectedIds, originalIds);
  if (preCompare.missing.length) errors.push(`pre-correction ledger missing threat_id(s): ${preCompare.missing.join(", ")}`);
  if (preCompare.unexpected.length) errors.push(`pre-correction ledger has unexpected threat_id(s): ${preCompare.unexpected.join(", ")}`);
  if (preCompare.duplicate.length) errors.push(`pre-correction ledger has duplicate threat_id(s): ${preCompare.duplicate.join(", ")}`);

  const correctedEntries = asArray(challengeOutput?.corrected_ledger_entries);
  const correctedIds = correctedEntries.map(threatId).filter(Boolean);
  const duplicateCorrected = duplicateValues(correctedIds);
  const originalIdSet = new Set(originalIds);
  const unknownCorrected = correctedIds.filter((id) => !originalIdSet.has(id));
  const correctedEntryErrors = correctedEntries.flatMap(validateLedgerEntry);

  if (duplicateCorrected.length) errors.push(`duplicate corrected threat_id(s): ${duplicateCorrected.join(", ")}`);
  if (unknownCorrected.length) errors.push(`unknown corrected threat_id(s): ${unknownCorrected.join(", ")}`);
  if (correctedEntryErrors.length) errors.push(...correctedEntryErrors);

  if (errors.length) {
    return { ok: false, correction_errors: errors, corrected_count: correctedEntries.length, post_challenge_ledger: mergedLedger };
  }

  const correctionMap = new Map(correctedEntries.map((entry) => [threatId(entry), entry]));
  const postChallengeLedger = mergedLedger.map((entry) => correctionMap.get(threatId(entry)) || entry);
  const postIds = postChallengeLedger.map(threatId).filter(Boolean);
  const postCompare = compareIds(expectedIds, postIds);
  const postErrors = [];
  if (postCompare.missing.length) postErrors.push(`post-correction ledger missing threat_id(s): ${postCompare.missing.join(", ")}`);
  if (postCompare.unexpected.length) postErrors.push(`post-correction ledger has unexpected threat_id(s): ${postCompare.unexpected.join(", ")}`);
  if (postCompare.duplicate.length) postErrors.push(`post-correction ledger has duplicate threat_id(s): ${postCompare.duplicate.join(", ")}`);

  return {
    ok: postErrors.length === 0,
    correction_errors: postErrors,
    corrected_count: correctedEntries.length,
    post_challenge_ledger: postChallengeLedger,
    correction_meta: {
      corrected_threat_ids: correctedIds,
      duplicate_corrected_threat_ids: duplicateCorrected,
      unknown_corrected_threat_ids: unknownCorrected,
      post_correction_missing_threat_ids: postCompare.missing,
      post_correction_unexpected_threat_ids: postCompare.unexpected,
      post_correction_duplicate_threat_ids: postCompare.duplicate
    }
  };
}

function compactRegistryLogicReference(registryRows) {
  return registryRows.map((row, index) => ({
    entry_number: index + 1,
    threat_id: registryThreatId(row, index),
    threat_name: threatName(row),
    hunter_trigger: row?.hunter_trigger || null,
    archetype: row?.archetype || row?.Archetype || null,
    surface: row?.surface || row?.Surface || row?.surfaces || row?.Surfaces || null
  }));
}

if (!token) fail("RUNTIME_ACCESS_TOKEN is required");
const base = baseUrl(runtimeUrl);
const stage6Cache = readJson(stage6CachePath, "Stage 6 cache");
const stage7Artifact = readJson(stage7ArtifactPath, "Stage 7 audit export");
const registryRuntime = readJson(registryPath, "Runtime registry");

const mergedLedger = asArray(stage7Artifact.merged_ledger);
if (!mergedLedger.length) fail("Stage 7 artifact contains no merged_ledger", { stage7ArtifactPath });

const registryRows = asArray(registryRuntime?.threats);
const expectedIds = registryRows.length ? registryRows.map(registryThreatId) : mergedLedger.map(threatId);
const registryTotal = expectedIds.length || Number(stage7Artifact.source_row_count || mergedLedger.length);
if (mergedLedger.length !== registryTotal) {
  fail("Stage 8 requires the full merged Stage 7 ledger", { merged_rows: mergedLedger.length, registry_total: registryTotal });
}

const runId = `stage8_operator_challenge_${Date.now()}`;
const stage8Input = {
  run_id: runId,
  registry_count_loaded: registryTotal,
  registry_total_count: registryTotal,
  registry_count_evaluated: mergedLedger.length,
  registry_evaluation_ledger: mergedLedger,
  registry_batch_meta: {
    run_id: stage7Artifact.run_id || runId,
    batch_id: "MERGED",
    is_merged_ledger: true,
    test_run: process.env.STAGE8_TEST_RUN === "true",
    registry_count_loaded: registryTotal,
    registry_total_count: registryTotal,
    registry_count_evaluated: mergedLedger.length,
    stage7_artifact_type: stage7Artifact.artifact_type || null,
    stage7_runtime_url: stage7Artifact.runtime_url || null
  },
  source_bundle: stage6Cache.source_bundle,
  target_feature_profile: stage6Cache.target_feature_profile,
  legal_stack_review: stage6Cache.legal_stack_review,
  registry_logic_reference: compactRegistryLogicReference(registryRows),
  prior_stage_summaries: {
    stage7_summary: stage7Artifact.summary || null,
    active_archetypes: stage7Artifact.active_archetypes || [],
    active_surfaces: stage7Artifact.active_surfaces || []
  },
  test_run: process.env.STAGE8_TEST_RUN === "true"
};

writeJson(stage8InputPath, stage8Input);
console.log(JSON.stringify({ ok: true, phase: "stage_8_operator_challenge_start", runtime_url: base, stage6_cache_path: stage6CachePath, stage7_artifact_path: stage7ArtifactPath, registry_total: registryTotal, merged_rows: mergedLedger.length, input_export_path: stage8InputPath, stage7_final_status_counts: countsByStatus(mergedLedger) }, null, 2));

const result = await postJson(base, "/v1/diligence/stage", {
  stage: "operator_challenge",
  input: stage8Input,
  options: {
    pool: process.env.STAGE8_POOL || "reasoning",
    maxOutputTokens: Number(process.env.STAGE8_MAX_OUTPUT_TOKENS || 8192),
    timeoutMs: Number(process.env.STAGE8_TIMEOUT_MS || 120000)
  }
});

const challengeOutput = result.operator_challenge;
if (!challengeOutput) fail("Stage 8 returned no operator_challenge output", result);

const outputErrors = validateChallengeOutput(challengeOutput, registryTotal);
if (outputErrors.length) fail("Stage 8 output contract validation failed", { output_errors: outputErrors, operator_challenge: challengeOutput });

const correctionResult = applyCorrections({ mergedLedger, challengeOutput, expectedIds });
if (!correctionResult.ok) fail("Stage 8 correction merge validation failed", correctionResult);

const exportPayload = {
  artifact_type: "stage8_operator_challenge_audit_export",
  generated_at: new Date().toISOString(),
  runtime_url: base,
  run_id: runId,
  stage6_cache_path: stage6CachePath,
  stage7_artifact_path: stage7ArtifactPath,
  registry_path: registryPath,
  input_export_path: stage8InputPath,
  operator_challenge: challengeOutput,
  correction_result: {
    ok: correctionResult.ok,
    corrected_count: correctionResult.corrected_count,
    correction_errors: correctionResult.correction_errors,
    correction_meta: correctionResult.correction_meta || null
  },
  model_metadata: result.model_metadata || null,
  prompt_metadata: result.prompt_metadata || null,
  validation_mode: result.validation_mode || null,
  guardrail_validation_mode: result.guardrail_validation_mode || null,
  summary: {
    registry_total: registryTotal,
    pre_challenge_status_counts: countsByStatus(mergedLedger),
    post_challenge_status_counts: countsByStatus(correctionResult.post_challenge_ledger),
    corrected_count: correctionResult.corrected_count,
    operator_result: challengeOutput.operator_challenge_gate?.result || null,
    reopened_rows: challengeOutput.operator_challenge_gate?.reopened_rows || []
  }
};

const postLedgerPayload = {
  artifact_type: "stage8_post_challenge_ledger",
  generated_at: new Date().toISOString(),
  runtime_url: base,
  run_id: runId,
  source_stage7_artifact_path: stage7ArtifactPath,
  corrected_count: correctionResult.corrected_count,
  correction_meta: correctionResult.correction_meta || null,
  operator_challenge_gate: challengeOutput.operator_challenge_gate,
  post_challenge_ledger: correctionResult.post_challenge_ledger,
  final_status_counts: countsByStatus(correctionResult.post_challenge_ledger)
};

writeJson(stage8ExportPath, exportPayload);
writeJson(postChallengeLedgerPath, postLedgerPayload);

console.log(JSON.stringify({ ok: true, step: "stage8_audit_export_written", stage8_export_path: stage8ExportPath, corrected_ledger_path: postChallengeLedgerPath, corrected_count: correctionResult.corrected_count, operator_result: challengeOutput.operator_challenge_gate?.result || null }, null, 2));
console.log(JSON.stringify({ ok: true, phase: "stage_8_operator_challenge_complete", registry_total: registryTotal, corrected_count: correctionResult.corrected_count, pre_challenge_status_counts: countsByStatus(mergedLedger), post_challenge_status_counts: countsByStatus(correctionResult.post_challenge_ledger), operator_challenge_gate: challengeOutput.operator_challenge_gate, model_metadata: result.model_metadata || null }, null, 2));
