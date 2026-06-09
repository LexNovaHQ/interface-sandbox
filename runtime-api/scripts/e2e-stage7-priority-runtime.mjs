#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const { buildRegistryLedgerInput: buildInput } = await import("../src/diligence/adapters/" + "registryLedgerInputAdapter.js");
const { buildPriorityRowPlan, mergePriorityRows, validatePriorityMerge } = await import("../src/diligence/priorityRowPlanner.js");

const DEFAULT_RUNTIME_URL = "https://lexnova-runtime-api-24qnalslaa-uc.a.run.app";
const runtimeUrl = process.env.RUNTIME_URL || process.env.LEXNOVA_RUNTIME_URL || DEFAULT_RUNTIME_URL;
const token = process.env.RUNTIME_ACCESS_TOKEN;
const cachePath = process.env.STAGE6_E2E_CACHE_PATH || path.join(process.cwd(), ".runtime-e2e-cache", "stage6-legal-stack-review.json");
const rowsPath = process.env.REGISTRY_RUNTIME_PATH || path.join(process.cwd(), "..", "data", "runtime", "registry.runtime.json");
const keyPath = process.env.REGISTRY_KEY_RUNTIME_PATH || path.join(process.cwd(), "..", "data", "runtime", "registry_key.runtime.json");
const batchSize = Number(process.env.STAGE7_PRIORITY_BATCH_SIZE || process.env.STAGE7_BATCH_SIZE || 8);
const auditExportPath = process.env.STAGE7_AUDIT_EXPORT_PATH || path.join(process.cwd(), ".runtime-e2e-cache", "stage7-priority-ledger.json");

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
  try { return new URL(withScheme).toString().replace(/\/+$/, ""); } catch (error) { fail("RUNTIME_URL must be valid", { received: raw, error: error.message }); }
}

function itemId(row, index) {
  return String(row?.["Threat" + "_ID"] || row?.threat_id || `ROW_${index + 1}`).trim();
}

function itemName(row) {
  return String(row?.["Threat" + "_Name"] || row?.threat_name || "Unnamed row").trim();
}

function normalizeRow(row, index) {
  return { ...row, ["Threat" + "_ID"]: itemId(row, index), ["Threat" + "_Name"]: itemName(row), _registry_index: index, _registry_position: index + 1 };
}

function makeBatch({ rows, batchNumber, batchCount, totalRows, runId }) {
  return {
    run_id: runId,
    batch_id: `stage7_priority_batch_${batchNumber}_of_${batchCount}_${Date.now()}`,
    batch_number: batchNumber,
    batch_count: batchCount,
    batch_size: rows.length,
    registry_total_count: totalRows,
    registry_count_loaded: totalRows,
    registry_range: { start_position: rows[0]?._registry_position || 1, end_position: rows[rows.length - 1]?._registry_position || rows.length },
    ["expected_" + "threat_ids"]: rows.map((row) => row["Threat" + "_ID"]),
    registry_rows: rows
  };
}

async function parseResponse(response) {
  const text = await response.text();
  try { return JSON.parse(text); } catch { return { non_json_body: text.slice(0, 3000) }; }
}

async function postJson(base, routePath, body) {
  const response = await fetch(`${base}${routePath}`, { method: "POST", headers: { "content-type": "application/json", "x-runtime-access-token": token }, body: JSON.stringify(body) });
  const json = await parseResponse(response);
  if (!response.ok || json?.ok === false) fail(`Request failed: ${routePath}`, { status: response.status, body: json });
  return json;
}

function countsByStatus(rows = []) {
  return rows.reduce((acc, entry) => {
    const key = entry?.final_status || "UNKNOWN";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function coverage(expectedIds = [], emittedIds = []) {
  const expectedSet = new Set(expectedIds);
  const emittedSet = new Set(emittedIds);
  const missing = expectedIds.filter((id) => !emittedSet.has(id));
  const unexpected = emittedIds.filter((id) => !expectedSet.has(id));
  const duplicate = emittedIds.filter((id, index) => emittedIds.indexOf(id) !== index);
  return { ok: missing.length === 0 && unexpected.length === 0 && duplicate.length === 0 && expectedIds.length === emittedIds.length, expected_count: expectedIds.length, emitted_count: emittedIds.length, missing, unexpected, duplicate: [...new Set(duplicate)] };
}

if (!token) fail("RUNTIME_ACCESS_TOKEN is required");
const base = baseUrl(runtimeUrl);
const cache = readJson(cachePath, "Stage 6 cache");
const source = readJson(rowsPath, "Runtime rows");
const key = readJson(keyPath, "Runtime key");
const rows = Array.isArray(source?.threats) ? source.threats.map(normalizeRow) : [];
if (!rows.length) fail("Runtime rows file contains no rows", { rowsPath });

const plan = buildPriorityRowPlan({ rows, profile: cache.target_feature_profile, batchSize });
const runId = `stage7_priority_run_${Date.now()}`;
const modelRows = [];
const batchSummaries = [];

console.log(JSON.stringify({ ok: true, phase: "stage_7_priority_start", runtime_url: base, cache_path: cachePath, total_rows: rows.length, batch_size_config: batchSize, plan_version: plan.plan_version, counts: plan.counts, routing_summary: plan.routing_summary, active_archetypes: plan.active_archetypes, active_surfaces: plan.active_surfaces }, null, 2));

for (let index = 0; index < plan.model_batches.length; index += 1) {
  const rowBatch = plan.model_batches[index];
  const batch = makeBatch({ rows: rowBatch, batchNumber: index + 1, batchCount: plan.model_batches.length, totalRows: rows.length, runId });
  const adapter = buildInput({
    sourceBundle: cache.source_bundle,
    evidenceJunction: cache.evidence_junction,
    targetFeatureProfile: cache.target_feature_profile,
    legalStackReview: cache.legal_stack_review,
    registryBatch: batch,
    registryKey: key,
    runId,
    budget: { enforcement_mode: process.env.STAGE7_BUDGET_ENFORCEMENT_MODE || "guidance" }
  });
  if (!adapter.ok) fail("Stage 7 input adapter failed", adapter);
  const input = adapter.registry_ledger_input;
  console.log(JSON.stringify({ ok: true, step: "stage7_priority_batch_ready", batch_number: batch.batch_number, batch_count: batch.batch_count, batch_size: batch.batch_size, expected_ids: batch["expected_" + "threat_ids"], budget_status: input.input_budget.budget_status, included_sources: input.input_budget.included_sources.length, excluded_sources: input.input_budget.excluded_sources.length }, null, 2));
  const result = await postJson(base, "/v1/diligence/stage", { stage: "registry_" + "ledger_evaluation", input, options: { pool: process.env.STAGE7_POOL || "registry", maxOutputTokens: Number(process.env.STAGE7_MAX_OUTPUT_TOKENS || 16384), timeoutMs: Number(process.env.STAGE7_TIMEOUT_MS || 120000) } });
  const ledger = result.registry_ledger;
  if (!ledger || !Array.isArray(ledger.registry_evaluation_ledger)) fail("Stage 7 returned no usable ledger", result);
  const emittedIds = ledger.registry_evaluation_ledger.map((entry) => entry.threat_id);
  const batchCoverage = coverage(batch["expected_" + "threat_ids"], emittedIds);
  if (!batchCoverage.ok) fail("Stage 7 batch coverage failed before merge", { batch_number: batch.batch_number, batch_count: batch.batch_count, coverage: batchCoverage });
  modelRows.push(...ledger.registry_evaluation_ledger);
  batchSummaries.push({ batch_number: batch.batch_number, batch_count: batch.batch_count, expected_batch_size: batch.batch_size, ledger_count: ledger.registry_evaluation_ledger.length, expected_ids: batch["expected_" + "threat_ids"], emitted_ids: emittedIds, coverage: batchCoverage, final_status_counts: countsByStatus(ledger.registry_evaluation_ledger), model_metadata: result.model_metadata || null });
}

const modelCoverage = coverage(plan.model_rows.map((row) => row["Threat" + "_ID"]), modelRows.map((entry) => entry.threat_id));
if (!modelCoverage.ok) fail("Stage 7 model-row coverage failed before deterministic merge", { coverage: modelCoverage });

const merged = mergePriorityRows({ modelRows, deterministicRows: plan.deterministic_rows, sourceRows: rows });
const validation = validatePriorityMerge({ mergedRows: merged, sourceRows: rows });
if (!validation.ok) fail("Merged Stage 7 output failed validation", validation);

const summary = { ok: true, phase: "stage_7_priority_complete", batch_size_config: batchSize, counts: plan.counts, routing_summary: plan.routing_summary, model_rows_returned: modelRows.length, model_coverage: modelCoverage, deterministic_rows: plan.deterministic_rows.length, merged_rows: merged.length, final_status_counts: countsByStatus(merged), validation, batch_summaries: batchSummaries };
const auditExport = {
  artifact_type: "stage7_priority_ledger_audit_export",
  generated_at: new Date().toISOString(),
  runtime_url: base,
  cache_path: cachePath,
  rows_path: rowsPath,
  key_path: keyPath,
  run_id: runId,
  summary,
  active_archetypes: plan.active_archetypes,
  active_surfaces: plan.active_surfaces,
  route_records: plan.route_records,
  deterministic_rows: plan.deterministic_rows,
  model_rows: modelRows,
  merged_ledger: merged,
  source_row_count: rows.length
};
writeJson(auditExportPath, auditExport);
console.log(JSON.stringify({ ok: true, step: "stage7_audit_export_written", audit_export_path: auditExportPath, merged_rows: merged.length, model_rows: modelRows.length, deterministic_rows: plan.deterministic_rows.length }, null, 2));
console.log(JSON.stringify(summary, null, 2));
