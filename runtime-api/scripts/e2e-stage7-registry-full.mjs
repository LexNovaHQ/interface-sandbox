#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { buildRegistryLedgerInput } from "../src/diligence/adapters/registryLedgerInputAdapter.js";

const DEFAULT_RUNTIME_URL = "https://lexnova-runtime-api-24qnalslaa-uc.a.run.app";
const runtimeUrl = process.env.RUNTIME_URL || process.env.LEXNOVA_RUNTIME_URL || DEFAULT_RUNTIME_URL;
const token = process.env.RUNTIME_ACCESS_TOKEN;
const stage6CachePath = process.env.STAGE6_E2E_CACHE_PATH || path.join(process.cwd(), ".runtime-e2e-cache", "stage6-legal-stack-review.json");
const registryPath = process.env.REGISTRY_RUNTIME_PATH || path.join(process.cwd(), "..", "data", "runtime", "registry.runtime.json");
const registryKeyPath = process.env.REGISTRY_KEY_RUNTIME_PATH || path.join(process.cwd(), "..", "data", "runtime", "registry_key.runtime.json");
const batchSize = Number(process.env.STAGE7_FULL_BATCH_SIZE || process.env.STAGE7_BATCH_SIZE || 8);

function fail(message, detail) { console.error(JSON.stringify({ ok: false, error: message, detail: detail || null }, null, 2)); process.exit(1); }
function readJsonFile(filePath, label) { if (!fs.existsSync(filePath)) fail(`${label} file missing`, { filePath }); return JSON.parse(fs.readFileSync(filePath, "utf8")); }
function normalizeBase(value) { const raw = String(value || "").trim(); if (!raw) return ""; const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`; try { return new URL(withScheme).toString().replace(/\/+$/, ""); } catch (error) { fail("RUNTIME_URL must be valid", { received: raw, error: error.message }); } }
function readStage6Cache(filePath) { const parsed = readJsonFile(filePath, "Stage 6 cache"); if (parsed?.cache_version !== "stage6_legal_stack_review_e2e_cache_v1") fail("Bad Stage 6 cache version", { cache_version: parsed?.cache_version }); if (!parsed.source_bundle || !parsed.evidence_junction || !parsed.target_feature_profile || !parsed.legal_stack_review) fail("Stage 6 cache incomplete", { keys: Object.keys(parsed || {}) }); return parsed; }
async function readJson(response) { const text = await response.text(); try { return JSON.parse(text); } catch { return { non_json_body: text.slice(0, 3000) }; } }
async function postJson(base, routePath, body) { const response = await fetch(`${base}${routePath}`, { method: "POST", headers: { "content-type": "application/json", "x-runtime-access-token": token }, body: JSON.stringify(body) }); const json = await readJson(response); if (!response.ok || json?.ok === false) fail(`Request failed: ${routePath}`, { status: response.status, body: json }); return json; }
function threatId(row, index) { return String(row?.Threat_ID || row?.threat_id || `MISSING_THREAT_ID_ROW_${index + 1}`).trim(); }
function threatName(row) { return String(row?.Threat_Name || row?.threat_name || "Unnamed registry row").trim(); }
function normalizeRow(row, index) { return { ...row, Threat_ID: threatId(row, index), Threat_Name: threatName(row), _registry_index: index, _registry_position: index + 1 }; }
function chunkRows(rows, size) { const out = []; for (let i = 0; i < rows.length; i += size) out.push(rows.slice(i, i + size)); return out; }
function makeBatch(rows, allRows, batchNumber, batchCount, runId) { return { run_id: runId, batch_id: `${runId}:registry:${batchNumber}-of-${batchCount}`, batch_number: batchNumber, batch_count: batchCount, batch_size: rows.length, registry_total_count: allRows.length, registry_count_loaded: allRows.length, registry_range: { start_position: rows[0]?._registry_position || 1, end_position: rows[rows.length - 1]?._registry_position || rows.length }, expected_threat_ids: rows.map((row) => row.Threat_ID), registry_rows: rows }; }
function sumAttemptsTokens(attempts = []) { return attempts.reduce((acc, attempt) => { const usage = attempt.usage_metadata || {}; acc.prompt += Number(usage.promptTokenCount || 0); acc.candidates += Number(usage.candidatesTokenCount || 0); acc.total += Number(usage.totalTokenCount || 0); return acc; }, { prompt: 0, candidates: 0, total: 0 }); }

if (!token) fail("RUNTIME_ACCESS_TOKEN is required");
if (!Number.isInteger(batchSize) || batchSize < 1) fail("STAGE7_FULL_BATCH_SIZE must be a positive integer", { batchSize });

const base = normalizeBase(runtimeUrl);
const cache = readStage6Cache(stage6CachePath);
const registry = readJsonFile(registryPath, "Registry runtime");
const registryKey = readJsonFile(registryKeyPath, "Registry key runtime");
const allRows = Array.isArray(registry?.threats) ? registry.threats.map(normalizeRow) : [];
if (!allRows.length) fail("Registry runtime contains no threats[]", { registryPath });
const batches = chunkRows(allRows, batchSize);
const runId = `stage7_registry_full_${Date.now()}`;

console.log(JSON.stringify({ ok: true, step: "start", phase: "stage_7_registry_full_98_row_e2e", runtime_url: base, cache_path: stage6CachePath, registry_total_count: allRows.length, batch_size: batchSize, batch_count: batches.length }, null, 2));

const mergedLedger = [];
const batchSummaries = [];
let tokenTotals = { prompt: 0, candidates: 0, total: 0 };

for (let i = 0; i < batches.length; i += 1) {
  const batch = makeBatch(batches[i], allRows, i + 1, batches.length, runId);
  const adapterResult = buildRegistryLedgerInput({ sourceBundle: cache.source_bundle, evidenceJunction: cache.evidence_junction, targetFeatureProfile: cache.target_feature_profile, legalStackReview: cache.legal_stack_review, registryBatch: batch, registryKey, runId: batch.run_id, budget: { max_input_chars: Number(process.env.STAGE7_MAX_INPUT_CHARS || 120000), max_estimated_tokens: Number(process.env.STAGE7_MAX_ESTIMATED_TOKENS || 60000), max_single_source_chars: Number(process.env.STAGE7_MAX_SINGLE_SOURCE_CHARS || 60000), prompt_overhead_tokens: Number(process.env.STAGE7_PROMPT_OVERHEAD_TOKENS || 25000) } });
  if (!adapterResult.ok) fail("Registry Ledger input adapter failed", { batch_id: batch.batch_id, adapterResult });
  const stageInput = adapterResult.registry_ledger_input;
  const stageResult = await postJson(base, "/v1/diligence/stage", { stage: "registry_ledger_evaluation", input: stageInput, options: { pool: process.env.STAGE7_POOL || "registry", maxOutputTokens: Number(process.env.STAGE7_MAX_OUTPUT_TOKENS || 16384), timeoutMs: Number(process.env.STAGE7_TIMEOUT_MS || 120000) } });
  const ledger = stageResult.registry_ledger;
  if (!ledger || !Array.isArray(ledger.registry_evaluation_ledger)) fail("Registry Ledger stage returned malformed ledger", { batch_id: batch.batch_id, stageResult });
  if (ledger.registry_evaluation_ledger.length !== batch.registry_rows.length) fail("Batch ledger count mismatch", { batch_id: batch.batch_id, expected: batch.registry_rows.length, actual: ledger.registry_evaluation_ledger.length });
  const emitted = ledger.registry_evaluation_ledger.map((entry) => entry.threat_id);
  const missing = batch.expected_threat_ids.filter((id) => !emitted.includes(id));
  if (missing.length) fail("Batch threat_id preservation failed", { batch_id: batch.batch_id, missing, emitted, expected: batch.expected_threat_ids });
  const attemptTokens = sumAttemptsTokens(stageResult.model_metadata?.attempted_models || []);
  tokenTotals.prompt += attemptTokens.prompt;
  tokenTotals.candidates += attemptTokens.candidates;
  tokenTotals.total += attemptTokens.total;
  mergedLedger.push(...ledger.registry_evaluation_ledger.map((entry, offset) => ({ ...entry, entry_number: mergedLedger.length + offset + 1 })));
  const statusCounts = ledger.registry_evaluation_ledger.reduce((acc, entry) => { acc[entry.final_status] = (acc[entry.final_status] || 0) + 1; return acc; }, {});
  const summary = { batch_id: batch.batch_id, batch_number: batch.batch_number, row_count: batch.registry_rows.length, ledger_count: ledger.registry_evaluation_ledger.length, first_threat_id: emitted[0], last_threat_id: emitted[emitted.length - 1], status_counts: statusCounts, selected_model: stageResult.model_metadata?.selected_model || null, attempt_count: stageResult.model_metadata?.attempted_models?.length || 0, token_total_including_failed_attempts: attemptTokens.total, guardrail_validation_mode: stageResult.guardrail_validation_mode };
  batchSummaries.push(summary);
  console.log(JSON.stringify({ ok: true, step: "batch_complete", ...summary }, null, 2));
}

const expectedIds = allRows.map((row) => row.Threat_ID);
const emittedIds = mergedLedger.map((entry) => entry.threat_id);
const missingFinal = expectedIds.filter((id) => !emittedIds.includes(id));
const duplicateIds = emittedIds.filter((id, index) => emittedIds.indexOf(id) !== index);
if (mergedLedger.length !== allRows.length || missingFinal.length || duplicateIds.length) fail("Merged registry ledger validation failed", { expected_count: allRows.length, actual_count: mergedLedger.length, missingFinal, duplicateIds: [...new Set(duplicateIds)] });

console.log(JSON.stringify({ ok: true, phase: "stage_7_registry_full_98_row_e2e", run_id: runId, registry_total_count: allRows.length, batch_size: batchSize, batch_count: batches.length, merged_ledger_count: mergedLedger.length, final_status_counts: mergedLedger.reduce((acc, entry) => { acc[entry.final_status] = (acc[entry.final_status] || 0) + 1; return acc; }, {}), token_totals_including_failed_attempts: tokenTotals, batch_summaries: batchSummaries }, null, 2));
