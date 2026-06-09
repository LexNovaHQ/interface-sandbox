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

function fail(message, detail) {
  console.error(JSON.stringify({ ok: false, error: message, detail: detail || null }, null, 2));
  process.exit(1);
}
function readJsonFile(filePath, label) { if (!fs.existsSync(filePath)) fail(`${label} file missing`, { filePath }); return JSON.parse(fs.readFileSync(filePath, "utf8")); }
function normalizeBase(value) { const raw = String(value || "").trim(); if (!raw) return ""; const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`; try { return new URL(withScheme).toString().replace(/\/+$/, ""); } catch (error) { fail("RUNTIME_URL must be valid", { received: raw, error: error.message }); } }
function readStage6Cache(filePath) { const parsed = readJsonFile(filePath, "Stage 6 cache"); if (parsed?.cache_version !== "stage6_legal_stack_review_e2e_cache_v1") fail("Bad Stage 6 cache version", { cache_version: parsed?.cache_version }); if (!parsed.source_bundle || !parsed.evidence_junction || !parsed.target_feature_profile || !parsed.legal_stack_review) fail("Stage 6 cache incomplete", { keys: Object.keys(parsed || {}) }); return parsed; }
async function readJson(response) { const text = await response.text(); try { return JSON.parse(text); } catch { return { non_json_body: text.slice(0, 3000) }; } }
async function postJson(base, routePath, body) { const response = await fetch(`${base}${routePath}`, { method: "POST", headers: { "content-type": "application/json", "x-runtime-access-token": token }, body: JSON.stringify(body) }); const json = await readJson(response); if (!response.ok || json?.ok === false) fail(`Request failed: ${routePath}`, { status: response.status, body: json }); return json; }
function tokenDrift(actual, estimated) { const a = Number(actual || 0); const e = Number(estimated || 0); if (!a || !e) return null; return Number((a / e).toFixed(3)); }
function threatId(row, index) { return String(row?.Threat_ID || row?.threat_id || `MISSING_THREAT_ID_ROW_${index + 1}`).trim(); }
function threatName(row) { return String(row?.Threat_Name || row?.threat_name || "Unnamed registry row").trim(); }
function normalizeRow(row, index) { return { ...row, Threat_ID: threatId(row, index), Threat_Name: threatName(row), _registry_index: index, _registry_position: index + 1 }; }
function selectRows(registry) {
  const allRows = Array.isArray(registry?.threats) ? registry.threats.map(normalizeRow) : [];
  if (!allRows.length) fail("Registry runtime contains no threats[]", { registryPath });
  const batchSize = Number(process.env.STAGE7_BATCH_SIZE || 5);
  const preferredArchetypes = new Set(["UNI", "TRN", "CRT", "RDR", "ORC"]);
  const picked = [];
  const seen = new Set();
  for (const row of allRows) {
    const archetype = String(row.Archetype || row.archetype || "").trim();
    if (preferredArchetypes.has(archetype) && !seen.has(row.Threat_ID)) { picked.push(row); seen.add(row.Threat_ID); }
    if (picked.length >= batchSize) break;
  }
  for (const row of allRows) {
    if (picked.length >= batchSize) break;
    if (!seen.has(row.Threat_ID)) { picked.push(row); seen.add(row.Threat_ID); }
  }
  return { allRows, picked };
}
function makeBatch(rows, totalCount) { return { run_id: `stage7_registry_run_${Date.now()}`, batch_id: `stage7_registry_batch_1_of_1_${Date.now()}`, batch_number: 1, batch_count: 1, batch_size: rows.length, registry_total_count: totalCount, registry_count_loaded: totalCount, registry_range: { start_position: rows[0]?._registry_position || 1, end_position: rows[rows.length - 1]?._registry_position || rows.length }, expected_threat_ids: rows.map((row) => row.Threat_ID), registry_rows: rows }; }

if (!token) fail("RUNTIME_ACCESS_TOKEN is required");
const base = normalizeBase(runtimeUrl);
const cache = readStage6Cache(stage6CachePath);
const registry = readJsonFile(registryPath, "Registry runtime");
const registryKey = readJsonFile(registryKeyPath, "Registry key runtime");
const { allRows, picked } = selectRows(registry);
const batch = makeBatch(picked, Number(registry.registry_count || allRows.length));

console.log(JSON.stringify({ ok: true, step: "start", phase: "stage_7_registry_ledger_e2e", cache_path: stage6CachePath, runtime_url: base, registry_total_count: allRows.length, batch_size: picked.length, expected_threat_ids: batch.expected_threat_ids }, null, 2));

const adapterResult = buildRegistryLedgerInput({
  sourceBundle: cache.source_bundle,
  evidenceJunction: cache.evidence_junction,
  targetFeatureProfile: cache.target_feature_profile,
  legalStackReview: cache.legal_stack_review,
  registryBatch: batch,
  registryKey,
  runId: batch.run_id,
  budget: { max_input_chars: Number(process.env.STAGE7_MAX_INPUT_CHARS || 120000), max_estimated_tokens: Number(process.env.STAGE7_MAX_ESTIMATED_TOKENS || 60000), max_single_source_chars: Number(process.env.STAGE7_MAX_SINGLE_SOURCE_CHARS || 60000), prompt_overhead_tokens: Number(process.env.STAGE7_PROMPT_OVERHEAD_TOKENS || 25000) }
});
if (!adapterResult.ok) fail("Registry Ledger input adapter failed", adapterResult);
const stage7Input = adapterResult.registry_ledger_input;
console.log(JSON.stringify({ ok: true, step: "stage7_adapter_complete", budget_status: stage7Input.input_budget.budget_status, estimated_total_prompt_tokens: stage7Input.input_budget.estimated_total_prompt_tokens, included_sources: stage7Input.input_budget.included_sources.length, excluded_sources: stage7Input.input_budget.excluded_sources.length, source_selection_policy: stage7Input.source_bundle.source_review.source_selection_policy }, null, 2));

const registryStage = await postJson(base, "/v1/diligence/stage", { stage: "registry_ledger_evaluation", input: stage7Input, options: { pool: process.env.STAGE7_POOL || "registry", maxOutputTokens: Number(process.env.STAGE7_MAX_OUTPUT_TOKENS || 8192), timeoutMs: Number(process.env.STAGE7_TIMEOUT_MS || 90000) } });
const ledger = registryStage.registry_ledger;
if (!ledger) fail("Registry Ledger stage returned no ledger", registryStage);
if (!Array.isArray(ledger.registry_evaluation_ledger)) fail("registry_evaluation_ledger missing", ledger);

const actualPromptTokens = registryStage.model_metadata?.usage_metadata?.promptTokenCount || null;
console.log(JSON.stringify({ ok: true, phase: "stage_7_registry_ledger_e2e", adapter_version: stage7Input.registry_ledger_input_version, batch_id: stage7Input.batch_id, registry_count_loaded: ledger.registry_batch_meta?.registry_count_loaded, expected_batch_size: picked.length, ledger_count: ledger.registry_evaluation_ledger.length, expected_threat_ids: batch.expected_threat_ids, emitted_threat_ids: ledger.registry_evaluation_ledger.map((entry) => entry.threat_id), final_status_counts: ledger.registry_evaluation_ledger.reduce((acc, entry) => { acc[entry.final_status] = (acc[entry.final_status] || 0) + 1; return acc; }, {}), budget_status: stage7Input.input_budget.budget_status, estimated_total_prompt_tokens: stage7Input.input_budget.estimated_total_prompt_tokens, actual_prompt_tokens: actualPromptTokens, token_estimate_drift_ratio: tokenDrift(actualPromptTokens, stage7Input.input_budget.estimated_total_prompt_tokens), included_sources: stage7Input.input_budget.included_sources.length, excluded_sources: stage7Input.input_budget.excluded_sources.length, validation_mode: registryStage.validation_mode, guardrail_validation_mode: registryStage.guardrail_validation_mode, model_metadata: registryStage.model_metadata || null }, null, 2));
