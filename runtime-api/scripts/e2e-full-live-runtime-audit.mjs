#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

import { buildEvidenceRefinerInput } from "../src/diligence/adapters/sourceBundleAdapter.js";
import { buildEvidenceJunction } from "../src/diligence/evidenceJunction.js";
import { buildStage5TargetFeaturePackage } from "../src/diligence/stage5TargetFeaturePackageBuilder.js";
import { buildStage6IntegratedHandoffArtifact } from "../src/diligence/stage6IntegratedHandoffBuilder.js";
import { validateStage6ReviewGuardrail } from "../src/diligence/guardrails/stage6ReviewGuardrail.js";
import { validateDiligenceStageOutput } from "../src/diligence/stageSchemaValidator.js";
import { buildRegistryLedgerInput } from "../src/diligence/adapters/registryLedgerInputAdapterV2.js";
import { buildPriorityRowPlan, mergePriorityRows, validatePriorityMerge } from "../src/diligence/priorityRowPlanner.js";
import { buildStage8CompactFullLedgerChallengeInput } from "../src/live/stage8OperatorChallengeInputCompat.js";
import { buildDeterministicStage8Output, buildStage8DeterministicScan, combineStage8ChallengeOutputs } from "../src/live/stage8OperatorChallengeScanner.js";
import { buildStage9Report } from "../src/diligence/stage9ReportAssembler.js";
import { validateStage9Report } from "../src/diligence/stage9ReportValidator.js";
import { renderLegalExposureReport } from "../src/report-renderer/legalExposureReportRendererV2.js";
import { assembleStage10VaultHandoff } from "../src/handoff/stage9ToVaultHandoffAdapter.js";
import { validateReviewReadyHandoff } from "../src/handoff/reviewReadyHandoffValidator.js";
import { applyCorrections, asArray, countsByStatus, coverage, loadRuntimeData, makeBatch, normalizeRegistryRow, nowIso, registryThreatId, threatId } from "../src/live/liveRunShared.js";

const DEFAULT_RUNTIME_URL = "https://lexnova-runtime-api-24qnalslaa-uc.a.run.app";
const runtimeUrl = (process.env.RUNTIME_URL || process.env.LEXNOVA_RUNTIME_URL || DEFAULT_RUNTIME_URL).replace(/\/+$/, "");
const token = process.env.RUNTIME_ACCESS_TOKEN;
const targetUrl = process.env.AUDIT_TARGET_URL || process.env.TARGET_URL || "https://sarvam.ai";
const companyName = process.env.AUDIT_COMPANY_NAME || process.env.COMPANY_NAME || "Sarvam AI";
const outputRoot = process.env.AUDIT_OUTPUT_DIR || path.join(process.cwd(), ".runtime-e2e-cache", "full-runtime-audit");
const runId = `staged_live_audit_${Date.now()}`;

const STAGE9_RETIRED_MAIN_KEYS = new Set(["executive_exposure_summary", "evidence_reviewed", "legal_risk_surface_map", "legal_stack_control_review", "supporting_registry_rows", "supporting_registry_items", "supporting_registry_references", "registry_reference", "threat_id", "registry_batch_meta"]);
const STAGE10_RETIRED_KEYS = new Set(["legal_stack_review", "legal_stack_control_review", "legal_stack", "document_stack_status", "document_stack_redline", "legal_stack_assessment", "supporting_registry_rows"]);
const SOURCE_BUCKETS = ["company_profile_sources", "product_profile_sources", "legal_profile_sources", "governance_profile_sources"];

function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }
function safeJson(value) { return JSON.stringify(value ?? null, null, 2); }
function writeText(name, text) { ensureDir(outputRoot); const filePath = path.join(outputRoot, name); fs.writeFileSync(filePath, text, "utf8"); return filePath; }
function writeJson(name, value) { return writeText(name, safeJson(value)); }
function bytes(filePath) { return fs.statSync(filePath).size; }
function sha256(filePath) { return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex"); }
function safeObject(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
function normalizeUrl(value) { const raw = String(value || "").trim(); if (!raw) return null; const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`; try { const url = new URL(withScheme); url.hash = ""; if ((url.pathname || "") !== "/") url.pathname = url.pathname.replace(/\/+$/, "") || "/"; return url.toString(); } catch { return null; } }
function timestampPrefix(index, slug) { return `${String(index).padStart(2, "0")}-${slug}`; }

async function readJsonResponse(response) {
  const text = await response.text();
  try { return JSON.parse(text); } catch { return { non_json_body: text.slice(0, 5000) }; }
}
async function getJson(url, headers = {}) { const response = await fetch(url, { method: "GET", headers }); return { status: response.status, ok: response.ok, body: await readJsonResponse(response) }; }
async function postJson(url, payload, headers = {}) { const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(payload) }); return { status: response.status, ok: response.ok, body: await readJsonResponse(response) }; }
async function postStage(stage, input, options = {}) { return postJson(`${runtimeUrl}/v1/diligence/stage`, { stage, input, options }, authHeaders); }

function usageMetadataList(value) {
  const out = [];
  function walk(node) {
    if (!node || typeof node !== "object") return;
    if (node.usage_metadata && typeof node.usage_metadata === "object") out.push(node.usage_metadata);
    if (Array.isArray(node)) node.forEach(walk);
    else for (const child of Object.values(node)) walk(child);
  }
  walk(value);
  return out;
}
function tokenSummary(value) {
  const usage = usageMetadataList(value);
  const totals = {};
  for (const item of usage) {
    for (const [key, val] of Object.entries(item)) {
      if (typeof val === "number" && Number.isFinite(val)) totals[key] = (totals[key] || 0) + val;
    }
  }
  return { usage_metadata_count: usage.length, totals, usage_metadata: usage.slice(0, 12) };
}
function modelSummary(value) {
  const metas = [];
  function walk(node) {
    if (!node || typeof node !== "object") return;
    if (node.model_metadata && typeof node.model_metadata === "object") metas.push(node.model_metadata);
    if (node.stage5_feature_discovery_metadata && typeof node.stage5_feature_discovery_metadata === "object") metas.push(node.stage5_feature_discovery_metadata);
    if (Array.isArray(node)) node.forEach(walk);
    else for (const child of Object.values(node)) walk(child);
  }
  walk(value);
  return metas.map((meta) => ({ pool: meta.pool || null, model: meta.model || meta.selected_model || null, selected_key_alias: meta.selected_key_alias || null, fallback_used: meta.fallback_used === true, usage_metadata: meta.usage_metadata || null })).slice(0, 12);
}

const stageSummaries = [];
function printStageSummary(summary) { console.log(JSON.stringify({ phase: "staged_live_runtime_audit", ...summary }, null, 2)); }
function recordStage({ index, stage, ok = true, startedAt, endedAt = Date.now(), artifact = null, summary = {}, result = null }) {
  const entry = { index, stage, ok, duration_ms: endedAt - startedAt, token_usage: tokenSummary(result), models: modelSummary(result), artifact, summary };
  stageSummaries.push(entry);
  writeJson(`${timestampPrefix(index, stage)}.summary.json`, entry);
  printStageSummary(entry);
  return entry;
}
function failStage({ index, stage, startedAt, message, detail = null }) {
  const entry = recordStage({ index, stage, ok: false, startedAt, summary: { error: message, detail }, result: detail });
  writeJson("99-failure.json", { ok: false, phase: "staged_live_runtime_audit", failed_stage: stage, error: message, detail, stage_summaries: stageSummaries });
  process.exit(1);
}
async function runHttpStage(index, stage, fn, summarize = (body) => ({})) {
  const startedAt = Date.now();
  const response = await fn();
  writeJson(`${timestampPrefix(index, stage)}.full.json`, response.body);
  if (!response.ok || response.body?.ok === false) failStage({ index, stage, startedAt, message: `${stage} failed`, detail: { status: response.status, body: response.body } });
  recordStage({ index, stage, startedAt, artifact: `${timestampPrefix(index, stage)}.full.json`, result: response.body, summary: summarize(response.body) });
  return response.body;
}
function runDeterministicStage(index, stage, fn, summarize = (value) => ({})) {
  const startedAt = Date.now();
  try {
    const result = fn();
    writeJson(`${timestampPrefix(index, stage)}.full.json`, result);
    recordStage({ index, stage, startedAt, artifact: `${timestampPrefix(index, stage)}.full.json`, result, summary: summarize(result) });
    return result;
  } catch (error) {
    failStage({ index, stage, startedAt, message: error?.message || `${stage} failed`, detail: { stack_preview: String(error?.stack || "").split("\n").slice(0, 8) } });
  }
}
async function runModelStage(index, stage, input, options, summarize = (body) => ({}), requestStage = stage) {
  return runHttpStage(index, stage, () => postStage(requestStage, input, options), (body) => ({ request_stage: requestStage, stage_id: body.stage_id, validation_mode: body.validation_mode, guardrail_validation_mode: body.guardrail_validation_mode, guardrail_warning_count: body.guardrail_warning_count || 0, guardrail_repair_count: body.guardrail_repair_count || 0, ...summarize(body) }));
}

function collectBucket(discovery, bucket) {
  const out = [];
  const seen = new Set();
  for (const record of asArray(discovery?.[bucket])) {
    const url = normalizeUrl(record?.url || record?.final_url);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push({ ...record, url, source_bucket: bucket });
  }
  return out;
}
function collectSources(discovery) {
  const selected = [];
  const seen = new Set();
  const add = (record) => { if (!record?.url || seen.has(record.url)) return; seen.add(record.url); selected.push(record); };
  for (const bucket of SOURCE_BUCKETS) for (const record of collectBucket(discovery, bucket)) add(record);
  return selected;
}
function stage4SourceRecords(sourceBundle, familyFilter = null) {
  return asArray(sourceBundle.raw_footprint?.source_records).filter((record) => !familyFilter || record.source_family === familyFilter).map((record) => ({ evidence_source_id: record.evidence_source_id, source_family: record.source_family, url: record.url, final_url: record.final_url, title: record.structure?.title || record.title || "", word_count: record.text?.word_count || 0, clean_text_lossless: record.text?.clean_text_lossless || "" }));
}
function compactValidationErrors(errors = []) { return asArray(errors).map((error) => `${error?.instancePath || "/"}: ${error?.message || error?.code || error?.keyword || "validation error"}`).join("; "); }
function validateStage6IntegratedArtifact({ stage6IntegratedArtifact, stage6Input, stage6aStageResult, stage6bStageResult }) {
  const stage6Review = stage6IntegratedArtifact?.stage6_review;
  const schemaValidation = validateDiligenceStageOutput("stage6Review", stage6Review);
  if (!schemaValidation.ok) throw new Error(`Stage 6 integrated schema validation failed: ${compactValidationErrors(schemaValidation.errors)}`);
  const guardrail = validateStage6ReviewGuardrail(stage6Review, { input: stage6Input, stageId: "stage6_integrated_handoff", semanticModelAttempted: stage6aStageResult?.semantic_model_attempted === true || stage6bStageResult?.semantic_model_attempted === true });
  if (!guardrail.ok) throw new Error(`Stage 6 integrated guardrail validation failed: ${compactValidationErrors(guardrail.critical || guardrail.errors)}`);
  return { schemaValidation, guardrail };
}
function buildStage6Input({ sourceBundle, evidenceJunction, companyProfile, targetFeatureProfile }) {
  return { stage6_input_version: "stage6_live_input_v1", run_id: `${runId}_stage6_input`, source_bundle: sourceBundle, evidence_junction: evidenceJunction, company_profile: companyProfile, target_profile: companyProfile, target_feature_profile: targetFeatureProfile };
}
function buildStage6Cache({ sourceBundle, evidenceJunction, companyProfile, targetFeatureProfile, stage6aStageResult, stage6bStageResult, stage6IntegratedArtifact, stage6IntegratedValidation }) {
  return { cache_version: "stage6_integrated_handoff_live_cache_v1", generated_at: nowIso(), source_bundle: sourceBundle, evidence_junction: evidenceJunction, company_profile: companyProfile, target_feature_profile: targetFeatureProfile, stage6a_stage_result: stage6aStageResult, stage6b_stage_result: stage6bStageResult, stage6_integrated_artifact: stage6IntegratedArtifact, stage6_integrated_validation: stage6IntegratedValidation, stage6_review: stage6IntegratedArtifact.stage6_review, stage6_to_stage7_adapter: stage6IntegratedArtifact.stage6_to_stage7_adapter };
}

function reinvestigationIds(result = {}) { return [...new Set(asArray(result.guardrail_repairs).filter((item) => item?.action === "row_reinvestigation_required").map((item) => item?.params?.threat_id).filter(Boolean))]; }
function replaceEntry(rows, replacement) { return rows.map((entry) => threatId(entry) === threatId(replacement) ? replacement : entry); }
function fallbackReinvestigationEntry(row, prior, reason) { return { ...(prior || {}), threat_id: row.Threat_ID, threat_name: row.Threat_Name, entry_number: prior?.entry_number || row._registry_position || 1, conditions: asArray(prior?.conditions), trigger_if_result: false, exclude_if_result: false, final_status: "INSUFFICIENT_EVIDENCE", feature_refs: asArray(prior?.feature_refs).length ? prior.feature_refs : ["UNKNOWN"], evidence_ref: "ROW_REINVESTIGATION_UNRESOLVED", reasoning_summary: `STAGE7_ROW_REINVESTIGATION_EXHAUSTED: ${reason || "row still lacked sufficient condition-level provenance after two attempts"}` }; }
async function reinvestigateRows({ result, ledger, rowBatch, batch, rows, stage6Cache, registryKey }) {
  const ids = reinvestigationIds(result);
  if (!ids.length) return { ledger, warnings: [] };
  let current = [...ledger.registry_evaluation_ledger];
  const warnings = [];
  for (const id of ids) {
    const row = rowBatch.find((item) => item.Threat_ID === id);
    if (!row) continue;
    let accepted = null;
    let lastReason = "unresolved";
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      const singleBatch = makeBatch({ rows: [row], batchNumber: batch.batch_number, batchCount: batch.batch_count, totalRows: rows.length, runId });
      singleBatch.reinvestigation_request = { request_type: "stage7_row_reinvestigation", threat_id: id, attempt, max_attempts: 2, required_action: "Reinvestigate this one runtime-applicable row only. Parse Hunter_Trigger condition by condition. Do not use NOT_APPLICABLE. Return one ledger entry with provenance." };
      const adapter = buildRegistryLedgerInput({ sourceBundle: stage6Cache.source_bundle, evidenceJunction: stage6Cache.evidence_junction, targetProfile: stage6Cache.company_profile, targetFeatureProfile: stage6Cache.target_feature_profile, stage6Review: stage6Cache.stage6_review, stage6ToStage7Adapter: stage6Cache.stage6_to_stage7_adapter, registryBatch: singleBatch, registryKey, runId, budget: { enforcement_mode: process.env.STAGE7_BUDGET_ENFORCEMENT_MODE || "guidance" } });
      if (!adapter.ok) { lastReason = adapter.error || adapter.error_type || "adapter_failed"; continue; }
      const rerunResponse = await postStage("registry_ledger_evaluation", adapter.registry_ledger_input, { pool: process.env.LIVE_REGISTRY_POOL || process.env.STAGE7_POOL || "registry", maxOutputTokens: Number(process.env.LIVE_REGISTRY_MAX_OUTPUT_TOKENS || 16384), timeoutMs: Number(process.env.LIVE_REGISTRY_TIMEOUT_MS || 120000) });
      if (!rerunResponse.ok || rerunResponse.body?.ok === false) { lastReason = rerunResponse.body?.error || rerunResponse.body?.error_type || `http_${rerunResponse.status}`; continue; }
      const candidate = rerunResponse.body.registry_ledger?.registry_evaluation_ledger?.[0];
      if (candidate && !reinvestigationIds(rerunResponse.body).includes(id)) { accepted = candidate; break; }
      lastReason = "row remained under-investigated";
    }
    const prior = current.find((entry) => threatId(entry) === id);
    current = replaceEntry(current, accepted || fallbackReinvestigationEntry(row, prior, lastReason));
    if (!accepted) warnings.push({ threat_id: id, warning: "STAGE7_ROW_REINVESTIGATION_EXHAUSTED", reason: lastReason });
  }
  return { ledger: { ...ledger, registry_evaluation_ledger: current, batch_warnings: [...asArray(ledger.batch_warnings), ...warnings.map((item) => `${item.warning}: ${item.threat_id} — ${item.reason}`)] }, warnings };
}

function scanKeys(value, retiredKeys, options = {}) {
  const findings = [];
  const maxFindings = options.maxFindings || 200;
  const skipPath = options.skipPath || (() => false);
  function walk(node, trail = []) {
    if (findings.length >= maxFindings || !node || typeof node !== "object" || skipPath(trail)) return;
    if (Array.isArray(node)) return node.forEach((item, index) => walk(item, trail.concat(String(index))));
    for (const [key, child] of Object.entries(node)) {
      const nextTrail = trail.concat(key);
      if (retiredKeys.has(key)) findings.push({ path: nextTrail.join("."), key });
      walk(child, nextTrail);
    }
  }
  walk(value, []);
  return findings;
}
function stripForensicAppendixFromStage9(stage9ReportData = {}) { const reportData = safeObject(stage9ReportData.report?.report_data); const out = {}; for (const [key, value] of Object.entries(reportData)) if (key !== "forensic_ledger_appendix") out[key] = value; return out; }
function stripAppendixFromStage10(stage10Handoff = {}) { const copy = structuredClone(stage10Handoff || {}); if (copy.stage10_source_packet) delete copy.stage10_source_packet.forensic_ledger_appendix; return copy; }
function manifest() {
  const outputFiles = fs.readdirSync(outputRoot).filter((name) => name !== "98-artifact-manifest.json").sort();
  return { ok: true, generated_at: nowIso(), audit_phase: "staged_live_runtime_audit", runtime_url: runtimeUrl, target_url: targetUrl, company_name: companyName, run_id: runId, files: outputFiles.map((name) => { const filePath = path.join(outputRoot, name); return { name, bytes: bytes(filePath), sha256: sha256(filePath) }; }) };
}

ensureDir(outputRoot);
if (!runtimeUrl) throw new Error("RUNTIME_URL or LEXNOVA_RUNTIME_URL is required.");
if (!token) throw new Error("RUNTIME_ACCESS_TOKEN is required.");
const authHeaders = { "x-runtime-access-token": token };
const targetInput = { primary_url: normalizeUrl(targetUrl), company_name: companyName, submitted_at: nowIso(), live_review_input_mode: "url_only" };
const { registryRuntime, registryKey } = loadRuntimeData();

writeJson("00-audit-request.json", { audit_phase: "staged_live_runtime_audit", run_id: runId, runtime_url: runtimeUrl, target_input: targetInput, cache_policy: "fresh_live_execution_no_cache_reuse", screen_summary_policy: "print_json_after_every_stage" });

const runtimeStatus = await runHttpStage(1, "runtime_status", () => getJson(`${runtimeUrl}/v1/runtime-status`, authHeaders), (body) => ({ runtime_ok: body.ok === true, phase: body.phase, pools: body.pools, artificial_evidence_limits: body.architecture?.artificial_evidence_limits }));
const discoveryBody = await runHttpStage(2, "source_discovery", () => postJson(`${runtimeUrl}/v1/source-discovery`, { input: targetInput, options: { sourceDiscoveryMode: process.env.LIVE_SOURCE_DISCOVERY_MODE || "sync_with_free_search", runFreeFirstPartySearch: process.env.LIVE_RUN_FREE_SEARCH === "false" ? false : true, anchorFetchMaxAnchors: Number(process.env.LIVE_ANCHOR_FETCH_MAX || 60), anchorLinkLimit: Number(process.env.LIVE_ANCHOR_LINK_LIMIT || Number.MAX_SAFE_INTEGER), anchorClassifyMaxOutputTokens: Number(process.env.LIVE_ANCHOR_CLASSIFY_TOKENS || 8192), probe_timeout_ms: Number(process.env.LIVE_PROBE_TIMEOUT_MS || 8000) } }, authHeaders), (body) => ({ counts: body.discovery?.counts || null, candidate_source_count: collectSources(body.discovery).length, diagnostics: body.diagnostics || null }));
const sources = collectSources(discoveryBody.discovery);
if (!sources.length) failStage({ index: 2, stage: "source_discovery", startedAt: Date.now(), message: "Source discovery returned no capturable sources.", detail: discoveryBody.discovery });
const captureBody = await runHttpStage(3, "source_capture", () => postJson(`${runtimeUrl}/v1/source-capture`, { input: { sources }, options: { timeout_ms: Number(process.env.LIVE_CAPTURE_TIMEOUT_MS || 24000), max_fetch_bytes: Number(process.env.LIVE_CAPTURE_MAX_BYTES || process.env.SOURCE_CAPTURE_MAX_BYTES || 30 * 1024 * 1024) } }, authHeaders), (body) => ({ source_records: body.capture?.source_records?.length || 0, counts: body.capture?.counts || null }));
const { sourceBundle, evidenceJunction } = runDeterministicStage(4, "evidence_packaging", () => {
  const sourceBundle = buildEvidenceRefinerInput({ targetInput, discoveryResponse: { discovery: discoveryBody.discovery }, captureResponse: { capture: captureBody.capture }, runId: `${runId}_source_bundle`, sourceMode: "staged_live_audit_url_capture" });
  const evidenceJunction = buildEvidenceJunction({ sourceBundle, runId: `${runId}_evidence_junction` });
  return { sourceBundle, evidenceJunction };
}, (result) => ({ admitted_sources: result.sourceBundle.raw_footprint?.source_records?.length || 0, source_bundle_version: result.sourceBundle.source_bundle_version, evidence_junction_version: result.evidenceJunction.evidence_junction_version, total_words: result.sourceBundle.source_review?.coverage_summary?.source_counts?.total_words || null }));

const targetProfileSources = stage4SourceRecords(sourceBundle);
const companyProfileSources = stage4SourceRecords(sourceBundle, "company_profile");
const companyStage = await runModelStage(5, "company_profile", { target_input: targetInput, source_bundle_version: sourceBundle.source_bundle_version, source_bundle_sha256: evidenceJunction.source_bundle_sha256 || null, evidence_junction_version: evidenceJunction.evidence_junction_version, target_profile_sources: targetProfileSources, company_profile_sources: companyProfileSources, input_policy: { target_profile_source_packet: true, company_family_only: false, product_feature_mapping_forbidden: true, legal_review_forbidden: true, registry_evaluation_forbidden: true, outside_browsing_forbidden: true } }, { pool: process.env.LIVE_COMPANY_POOL || process.env.STAGE4_COMPANY_POOL || "reasoning", maxOutputTokens: Number(process.env.LIVE_COMPANY_MAX_OUTPUT_TOKENS || 4096), timeoutMs: Number(process.env.LIVE_COMPANY_TIMEOUT_MS || 60000) }, (body) => ({ brand_name: body.company_profile?.identity?.brand_name || null, legal_name: body.company_profile?.identity?.legal_name || null, target_profile_sources: targetProfileSources.length, company_sources: companyProfileSources.length }));
const companyProfile = companyStage.company_profile;
const stage5Package = runDeterministicStage(6, "target_feature_input_package", () => {
  const adapterResult = buildStage5TargetFeaturePackage({ sourceBundle, evidenceJunction, companyProfile, runId: `${runId}_stage5_input`, budget: { max_input_chars: Number(process.env.STAGE5_MAX_INPUT_CHARS || 120000), max_estimated_tokens: Number(process.env.STAGE5_MAX_ESTIMATED_TOKENS || 60000), max_single_source_chars: Number(process.env.STAGE5_MAX_SINGLE_SOURCE_CHARS || 45000), prompt_overhead_tokens: Number(process.env.STAGE5_PROMPT_OVERHEAD_TOKENS || 30000) } });
  if (!adapterResult.ok) throw new Error(adapterResult.error || "Target Feature Profile input adapter failed");
  return adapterResult;
}, (result) => ({ deterministic_candidate_count: result.target_feature_candidate_index?.candidate_count || 0, product_family_discovery_source_count: result.product_family_discovery_sources?.length || 0, product_family_primary_source_count: result.product_family_primary_sources?.length || 0 }));
const featureStage = await runModelStage(7, "target_feature_profile", stage5Package.target_feature_profile_input, { pool: process.env.LIVE_FEATURE_POOL || process.env.STAGE5_FEATURE_POOL || "reasoning", maxOutputTokens: Number(process.env.LIVE_FEATURE_MAX_OUTPUT_TOKENS || 8192), timeoutMs: Number(process.env.LIVE_FEATURE_TIMEOUT_MS || 90000) }, (body) => ({ feature_count: body.target_feature_profile?.feature_inventory?.length || 0, stage5_discovered_features: body.stage5_feature_discovery?.discovered_features?.length || 0, audit_ledger_rows: body.stage5_audit_ledger?.audit_ledger?.length || body.target_feature_audit_ledger?.audit_ledger?.length || 0, null_coverage_bug_guard: "mapped_feature_ids_null_crash_not_observed" }));
const targetFeatureProfile = featureStage.target_feature_profile;
const stage6Input = buildStage6Input({ sourceBundle, evidenceJunction, companyProfile, targetFeatureProfile });
const stage6aStageResult = await runModelStage(8, "stage6a_legal_document_cartography", stage6Input, { pool: process.env.LIVE_STAGE6A_POOL || process.env.LIVE_LEGAL_POOL || process.env.STAGE6A_POOL || process.env.STAGE6_POOL || "reasoning", maxOutputTokens: Number(process.env.LIVE_STAGE6A_MAX_OUTPUT_TOKENS || process.env.LIVE_LEGAL_MAX_OUTPUT_TOKENS || process.env.STAGE6A_MAX_OUTPUT_TOKENS || 24000), timeoutMs: Number(process.env.LIVE_STAGE6A_TIMEOUT_MS || process.env.LIVE_LEGAL_TIMEOUT_MS || process.env.STAGE6A_TIMEOUT_MS || 90000) }, (body) => ({ legal_document_inventory_count: body.stage6_review?.legal_document_cartography?.legal_document_inventory?.length || 0, legal_unit_count: body.stage6_review?.legal_document_cartography?.legal_document_index?.length || 0, semantic_model_attempted: body.semantic_model_attempted === true }));
const stage6bStageResult = await runModelStage(9, "stage6b_data_provenance", stage6Input, { pool: process.env.LIVE_STAGE6B_POOL || process.env.STAGE6B_POOL || process.env.STAGE6_POOL || "reasoning", maxOutputTokens: Number(process.env.LIVE_STAGE6B_MAX_OUTPUT_TOKENS || process.env.STAGE6B_MAX_OUTPUT_TOKENS || 24000), timeoutMs: Number(process.env.LIVE_STAGE6B_TIMEOUT_MS || process.env.STAGE6B_TIMEOUT_MS || 90000) }, (body) => ({ data_flow_profile_count: body.stage6_review?.data_provenance_profile?.data_flow_profile?.length || 0, semantic_model_attempted: body.semantic_model_attempted === true }));
const { stage6IntegratedArtifact, stage6IntegratedValidation, stage6Cache } = runDeterministicStage(10, "stage6_integrated_handoff", () => {
  const stage6IntegratedArtifact = buildStage6IntegratedHandoffArtifact({ stage6a_review: stage6aStageResult.stage6_review, stage6b_review: stage6bStageResult.stage6_review }, { run_id: `${runId}_stage6_integrated_handoff`, generated_at: nowIso(), stage6a_stage_id: stage6aStageResult.stage_id || "stage6a_legal_document_cartography", stage6b_stage_id: stage6bStageResult.stage_id || "stage6b_data_provenance" });
  const stage6IntegratedValidation = validateStage6IntegratedArtifact({ stage6IntegratedArtifact, stage6Input, stage6aStageResult, stage6bStageResult });
  const stage6Cache = buildStage6Cache({ sourceBundle, evidenceJunction, companyProfile, targetFeatureProfile, stage6aStageResult, stage6bStageResult, stage6IntegratedArtifact, stage6IntegratedValidation });
  return { stage6IntegratedArtifact, stage6IntegratedValidation, stage6Cache };
}, (result) => ({ feature_to_data_flow_index_count: result.stage6IntegratedArtifact.stage6_review?.stage7_navigation_index?.feature_to_data_flow_index?.length || 0, feature_to_legal_unit_index_count: result.stage6IntegratedArtifact.stage6_review?.stage7_navigation_index?.feature_to_legal_unit_index?.length || 0, guardrail_warning_count: result.stage6IntegratedValidation.guardrail?.warnings?.length || 0 }));

const stage7Plan = runDeterministicStage(11, "stage7_priority_plan", () => {
  const rows = asArray(registryRuntime?.threats).map(normalizeRegistryRow);
  const batchSize = Number(process.env.STAGE7_PRIORITY_BATCH_SIZE || process.env.STAGE7_BATCH_SIZE || 8);
  return { rows, batchSize, plan: buildPriorityRowPlan({ rows, profile: stage6Cache.target_feature_profile, batchSize }) };
}, (result) => ({ registry_rows: result.rows.length, batch_size: result.batchSize, model_batches: result.plan.model_batches.length, deterministic_rows: result.plan.deterministic_rows.length, routing_summary: result.plan.routing_summary, active_archetypes: result.plan.active_archetypes, active_surfaces: result.plan.active_surfaces }));
const modelRows = [];
const batchSummaries = [];
for (let index = 0; index < stage7Plan.plan.model_batches.length; index += 1) {
  const rowBatch = stage7Plan.plan.model_batches[index];
  const batch = makeBatch({ rows: rowBatch, batchNumber: index + 1, batchCount: stage7Plan.plan.model_batches.length, totalRows: stage7Plan.rows.length, runId });
  batch.batch_route_summary = rowBatch._batch_route_summary || null;
  const adapter = buildRegistryLedgerInput({ sourceBundle: stage6Cache.source_bundle, evidenceJunction: stage6Cache.evidence_junction, targetProfile: stage6Cache.company_profile, targetFeatureProfile: stage6Cache.target_feature_profile, stage6Review: stage6Cache.stage6_review, stage6ToStage7Adapter: stage6Cache.stage6_to_stage7_adapter, registryBatch: batch, registryKey, runId, budget: { enforcement_mode: process.env.STAGE7_BUDGET_ENFORCEMENT_MODE || "guidance" } });
  if (!adapter.ok) failStage({ index: 12 + index, stage: `stage7_batch_${index + 1}`, startedAt: Date.now(), message: adapter.error || "Stage 7 input adapter failed", detail: adapter });
  const result = await runModelStage(12 + index, `stage7_batch_${index + 1}`, adapter.registry_ledger_input, { pool: process.env.LIVE_REGISTRY_POOL || process.env.STAGE7_POOL || "registry", maxOutputTokens: Number(process.env.LIVE_REGISTRY_MAX_OUTPUT_TOKENS || 16384), timeoutMs: Number(process.env.LIVE_REGISTRY_TIMEOUT_MS || 120000) }, (body) => ({ batch_number: batch.batch_number, batch_count: batch.batch_count, expected_ids: batch.expected_threat_ids, ledger_count: body.registry_ledger?.registry_evaluation_ledger?.length || 0 }), "registry_ledger_evaluation");
  let ledger = result.registry_ledger;
  if (!ledger || !Array.isArray(ledger.registry_evaluation_ledger)) failStage({ index: 12 + index, stage: `stage7_batch_${index + 1}`, startedAt: Date.now(), message: "Stage 7 returned no usable registry ledger.", detail: result });
  const reinvestigated = await reinvestigateRows({ result, ledger, rowBatch, batch, rows: stage7Plan.rows, stage6Cache, registryKey });
  ledger = reinvestigated.ledger;
  const emittedIds = ledger.registry_evaluation_ledger.map((entry) => entry.threat_id);
  const batchCoverage = coverage(batch.expected_threat_ids, emittedIds);
  if (!batchCoverage.ok) failStage({ index: 12 + index, stage: `stage7_batch_${index + 1}`, startedAt: Date.now(), message: "Stage 7 batch coverage failed before merge.", detail: { batch_number: batch.batch_number, coverage: batchCoverage } });
  modelRows.push(...ledger.registry_evaluation_ledger);
  batchSummaries.push({ batch_number: batch.batch_number, batch_count: batch.batch_count, expected_batch_size: batch.batch_size, ledger_count: ledger.registry_evaluation_ledger.length, expected_ids: batch.expected_threat_ids, emitted_ids: emittedIds, coverage: batchCoverage, final_status_counts: countsByStatus(ledger.registry_evaluation_ledger), reinvestigation_warnings: reinvestigated.warnings, model_metadata: result.model_metadata || null });
}
const stage7Artifact = runDeterministicStage(12 + stage7Plan.plan.model_batches.length, "stage7_merge", () => {
  const modelCoverage = coverage(stage7Plan.plan.model_rows.map((row) => row.Threat_ID), modelRows.map((entry) => entry.threat_id));
  if (!modelCoverage.ok) throw new Error(`Stage 7 model coverage failed: ${JSON.stringify(modelCoverage)}`);
  const merged = mergePriorityRows({ modelRows, deterministicRows: stage7Plan.plan.deterministic_rows, sourceRows: stage7Plan.rows });
  const validation = validatePriorityMerge({ mergedRows: merged, sourceRows: stage7Plan.rows });
  if (!validation.ok) throw new Error(`Merged Stage 7 output failed validation: ${JSON.stringify(validation)}`);
  return { artifact_type: "stage7_priority_ledger_live_export", generated_at: nowIso(), run_id: `${runId}_stage7`, summary: { ok: true, phase: "stage_7_priority_complete", batch_size_config: stage7Plan.batchSize, counts: stage7Plan.plan.counts, routing_summary: stage7Plan.plan.routing_summary, model_rows_returned: modelRows.length, model_coverage: modelCoverage, deterministic_rows: stage7Plan.plan.deterministic_rows.length, merged_rows: merged.length, final_status_counts: countsByStatus(merged), validation, batch_summaries: batchSummaries }, active_archetypes: stage7Plan.plan.active_archetypes, active_surfaces: stage7Plan.plan.active_surfaces, route_records: stage7Plan.plan.route_records, deterministic_rows: stage7Plan.plan.deterministic_rows, model_rows: modelRows, merged_ledger: merged, source_row_count: stage7Plan.rows.length };
}, (result) => ({ merged_rows: result.merged_ledger.length, final_status_counts: countsByStatus(result.merged_ledger), validation_ok: result.summary.validation.ok === true, batch_count: result.summary.batch_summaries.length }));

const stage8 = await (async () => {
  const index = 13 + stage7Plan.plan.model_batches.length;
  const startedAt = Date.now();
  try {
    const mergedLedger = asArray(stage7Artifact.merged_ledger);
    const registryRows = asArray(registryRuntime?.threats);
    const expectedIds = registryRows.length ? registryRows.map(registryThreatId) : mergedLedger.map(threatId);
    const registryTotal = expectedIds.length || Number(stage7Artifact.source_row_count || mergedLedger.length);
    const scanner = buildStage8DeterministicScan({ mergedLedger, stage7Artifact, stage6Cache });
    const shouldRunModelChallenge = scanner.challenge_rows.length > 0 && process.env.DISABLE_STAGE8_MODEL_CHALLENGE !== "1";
    const challengeOutputs = [];
    const modelMetadata = [];
    const promptMetadata = [];
    const modelWarnings = [];
    if (shouldRunModelChallenge) {
      const stage8Input = buildStage8CompactFullLedgerChallengeInput({ runId, registryTotal, mergedLedger, stage7Artifact, registryRows, stage6Cache, scanner });
      const response = await postStage("operator_challenge", stage8Input, { pool: process.env.LIVE_STAGE8_POOL || process.env.STAGE8_POOL || "operator", maxOutputTokens: Number(process.env.LIVE_STAGE8_MAX_OUTPUT_TOKENS || 8192), timeoutMs: Number(process.env.LIVE_STAGE8_TIMEOUT_MS || 120000), maxAttempts: Number(process.env.LIVE_STAGE8_MAX_ATTEMPTS || process.env.STAGE8_MAX_ATTEMPTS || 3) });
      writeJson(`${timestampPrefix(index, "stage8_operator_challenge_model")}.full.json`, response.body);
      if (!response.ok || response.body?.ok === false) modelWarnings.push(`Stage 8 compact model challenge failed: ${response.body?.error || response.body?.error_type || response.status}`);
      else {
        const output = response.body.operator_challenge;
        if (output) challengeOutputs.push(output);
        modelMetadata.push(response.body.model_metadata || null);
        promptMetadata.push(response.body.prompt_metadata || null);
      }
    }
    const challengeOutput = challengeOutputs.length ? combineStage8ChallengeOutputs({ scanner, outputs: challengeOutputs, registryTotal, evaluatedCount: mergedLedger.length, modelWarnings }) : buildDeterministicStage8Output({ scanner, registryTotal, evaluatedCount: mergedLedger.length });
    if (modelWarnings.length && !challengeOutputs.length) challengeOutput.operator_challenge_gate.notes.push(...modelWarnings);
    const correctionResult = applyCorrections({ mergedLedger, challengeOutput, expectedIds });
    if (!correctionResult.ok) throw new Error(`Stage 8 correction merge validation failed: ${correctionResult.correction_errors.join("; ")}`);
    const stage8InputSummary = { input_policy: "deterministic_scan_plus_compact_full_ledger_challenge", deterministic_scan: { scan_version: scanner.scan_version, scanned_row_count: scanner.scanned_row_count, suspicious_row_count: scanner.suspicious_row_count, warnings: scanner.warnings, high_risk_checks: scanner.high_risk_checks }, model_challenge_invoked: shouldRunModelChallenge, model_challenge_row_count: scanner.challenge_rows.length };
    const stage8Export = { artifact_type: "stage8_operator_challenge_live_export", generated_at: nowIso(), run_id: `${runId}_stage8`, operator_challenge: challengeOutput, correction_result: { ok: correctionResult.ok, corrected_count: correctionResult.corrected_count, correction_errors: correctionResult.correction_errors, correction_meta: correctionResult.correction_meta || null }, model_metadata: { compact_challenge: modelMetadata[0] || null, model_warnings: modelWarnings }, prompt_metadata: promptMetadata.find(Boolean) || null, validation_mode: "stage8_compact_operator_challenge", guardrail_validation_mode: "deterministic_scan_plus_schema_merge_validation", summary: { registry_total: registryTotal, pre_challenge_status_counts: countsByStatus(mergedLedger), post_challenge_status_counts: countsByStatus(correctionResult.post_challenge_ledger), corrected_count: correctionResult.corrected_count, operator_result: challengeOutput.operator_challenge_gate?.result || null, reopened_rows: challengeOutput.operator_challenge_gate?.reopened_rows || [], deterministic_scan: stage8InputSummary.deterministic_scan } };
    const stage8Ledger = { artifact_type: "stage8_post_challenge_ledger", generated_at: nowIso(), run_id: `${runId}_stage8`, corrected_count: correctionResult.corrected_count, correction_meta: correctionResult.correction_meta || null, operator_challenge_gate: challengeOutput.operator_challenge_gate, post_challenge_ledger: correctionResult.post_challenge_ledger, final_status_counts: countsByStatus(correctionResult.post_challenge_ledger) };
    writeJson(`${timestampPrefix(index, "stage8_operator_challenge")}.full.json`, { stage8Export, stage8Ledger, stage8Input: stage8InputSummary });
    recordStage({ index, stage: "stage8_operator_challenge", startedAt, artifact: `${timestampPrefix(index, "stage8_operator_challenge")}.full.json`, result: { stage8Export, stage8Ledger }, summary: { corrected_count: correctionResult.corrected_count, final_status_counts: stage8Ledger.final_status_counts, deterministic_suspicious_rows: scanner.suspicious_row_count, model_challenge_invoked: shouldRunModelChallenge, model_warning_count: modelWarnings.length } });
    return { stage8Export, stage8Ledger, stage8Input: stage8InputSummary };
  } catch (error) { failStage({ index, stage: "stage8_operator_challenge", startedAt, message: error?.message || "Stage 8 failed", detail: { stack_preview: String(error?.stack || "").split("\n").slice(0, 8) } }); }
})();
const stage9ReportData = runDeterministicStage(14 + stage7Plan.plan.model_batches.length, "stage9_report", () => {
  const report = buildStage9Report({ stage6Cache, stage7Artifact, stage8Ledger: stage8.stage8Ledger, stage8Export: stage8.stage8Export, registryRuntime });
  const validation = validateStage9Report({ stage9Report: report, postChallengeLedger: asArray(stage8.stage8Ledger.post_challenge_ledger), registryRuntime });
  if (!validation.ok) throw new Error(`Stage 9 report validation failed: ${JSON.stringify(validation)}`);
  return { report, validation };
}, (result) => ({ stage9_report_version: result.report.stage9_report_version, section_keys: Object.keys(result.report.report?.report_data || {}), validation_ok: result.validation.ok === true, exposure_finding_count: result.report.report?.report_data?.exposure_findings?.consolidated_count || 0 })).report;
const htmlReport = runDeterministicStage(15 + stage7Plan.plan.model_batches.length, "html_render", () => ({ html: renderLegalExposureReport(stage9ReportData) }), (result) => ({ html_bytes: Buffer.byteLength(result.html || "", "utf8") })).html;
writeText(`${timestampPrefix(15 + stage7Plan.plan.model_batches.length, "html_render")}.html`, htmlReport || "");
const stage10Handoff = runDeterministicStage(16 + stage7Plan.plan.model_batches.length, "stage10_handoff", () => {
  const handoff = assembleStage10VaultHandoff({ stage9ReportData, stage6Cache, stage7Artifact, stage8Ledger: stage8.stage8Ledger }, { runId });
  const validation = validateReviewReadyHandoff(handoff);
  if (!validation.ok) throw new Error(`Stage 10 handoff validation failed: ${JSON.stringify(validation)}`);
  return { handoff, validation };
}, (result) => ({ validation_ok: result.validation.ok === true, source_packet_version: result.handoff.stage10_source_packet?.stage10_input_version, functional_sections: Object.keys(result.handoff.functional_intake_vault?.functional_sections || {}).length, vault_questions: result.handoff.assembly_handoff?.vault_confirmation_questions?.length || result.handoff.functional_intake_vault?.vault_confirmation_questions?.length || 0 })).handoff;

const leakageAudit = runDeterministicStage(17 + stage7Plan.plan.model_batches.length, "legacy_guardrail_leakage_audit", () => {
  const stage9Leaks = scanKeys(stripForensicAppendixFromStage9(stage9ReportData), STAGE9_RETIRED_MAIN_KEYS);
  const stage10Leaks = scanKeys(stripAppendixFromStage10(stage10Handoff), STAGE10_RETIRED_KEYS);
  const result = { ok: stage9Leaks.length === 0 && stage10Leaks.length === 0, stage9_main_retired_key_leaks: stage9Leaks, stage10_retired_key_leaks: stage10Leaks, old_guardrail_bug_checks: { stage5_mapped_feature_ids_null_crash: "not_observed", stage5_guardrail_warning_count: featureStage.guardrail_warning_count || 0, stage5_guardrail_repair_count: featureStage.guardrail_repair_count || 0 }, retired_key_policy: { stage9_forensic_appendix_exempt: true, stage10_source_packet_forensic_ledger_exempt: true, scanned_stage9_keys: [...STAGE9_RETIRED_MAIN_KEYS], scanned_stage10_keys: [...STAGE10_RETIRED_KEYS] } };
  if (!result.ok) throw new Error(`Legacy leakage detected: ${JSON.stringify(result)}`);
  return result;
}, (result) => ({ stage9_main_retired_key_leaks: result.stage9_main_retired_key_leaks.length, stage10_retired_key_leaks: result.stage10_retired_key_leaks.length, old_guardrail_bug_checks: result.old_guardrail_bug_checks }));

const finalSummary = {
  ok: true,
  phase: "staged_live_runtime_audit",
  runtime_url: runtimeUrl,
  target_url: targetUrl,
  company_name: companyName,
  run_id: runId,
  cache_policy: "fresh_live_execution_no_cache_reuse",
  stage_count: stageSummaries.length,
  stage_summaries: stageSummaries.map((stage) => ({ index: stage.index, stage: stage.stage, ok: stage.ok, duration_ms: stage.duration_ms, token_usage: stage.token_usage, summary: stage.summary })),
  findings: {
    sources_admitted: sourceBundle.raw_footprint?.source_records?.length || 0,
    stage5_features: targetFeatureProfile.feature_inventory?.length || 0,
    stage6a_documents: stage6aStageResult.stage6_review?.legal_document_cartography?.legal_document_inventory?.length || 0,
    stage6b_data_flows: stage6bStageResult.stage6_review?.data_provenance_profile?.data_flow_profile?.length || 0,
    stage7_rows: stage7Artifact.merged_ledger?.length || 0,
    stage8_rows: stage8.stage8Ledger.post_challenge_ledger?.length || 0,
    stage8_corrected_count: stage8.stage8Ledger.corrected_count || 0,
    stage9_sections: Object.keys(stage9ReportData.report?.report_data || {}),
    stage10_functional_sections: Object.keys(stage10Handoff.functional_intake_vault?.functional_sections || {}),
    vault_confirmation_questions: stage10Handoff.assembly_handoff?.vault_confirmation_questions?.length || stage10Handoff.functional_intake_vault?.vault_confirmation_questions?.length || 0,
    legacy_leakage_audit: leakageAudit
  },
  artifacts_dir: outputRoot
};
writeJson("97-final-summary.json", finalSummary);
writeJson("98-artifact-manifest.json", manifest());
console.log(JSON.stringify(finalSummary, null, 2));
