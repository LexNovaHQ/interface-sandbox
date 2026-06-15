#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { buildEvidenceRefinerInput } from "../src/diligence/adapters/sourceBundleAdapter.js";
import { buildEvidenceJunction } from "../src/diligence/evidenceJunction.js";
import { buildStage5TargetFeaturePackage } from "../src/diligence/stage5TargetFeaturePackageBuilder.js";
import { stage5MultiSubstageInternals } from "../src/diligence/stage5MultiSubstageRunner.js";
import { runGeminiPool } from "../src/gemini/geminiPool.js";
import { validateDiligenceStageOutput } from "../src/diligence/stageSchemaValidator.js";
import { validateTargetFeatureProfileGuardrails } from "../src/diligence/targetFeatureProfileGuardrails.js";

const MODE = String(process.env.STAGE5_AUDIT_MODE || process.argv[2] || "").toLowerCase();
const DEFAULT_RUNTIME_URL = "https://lexnova-runtime-api-24qnalslaa-uc.a.run.app";
const runtimeUrl = process.env.RUNTIME_URL || process.env.LEXNOVA_RUNTIME_URL || DEFAULT_RUNTIME_URL;
const token = process.env.RUNTIME_ACCESS_TOKEN;
const primaryUrl = process.env.AUDIT_TARGET_URL || process.env.TEST_PRIMARY_URL || "https://sarvam.ai";
const companyName = process.env.AUDIT_COMPANY_NAME || process.env.TEST_COMPANY_NAME || "Sarvam AI";
const outputRoot = path.resolve(process.env.STAGE5_AUDIT_OUTPUT_DIR || process.env.AUDIT_OUTPUT_DIR || path.join(process.cwd(), ".runtime-e2e-cache", "full-runtime-audit", "stage5-substage-audit"));
const statePath = path.join(outputRoot, "00-stage5-audit-state.json");
const summaryPath = process.env.GITHUB_STEP_SUMMARY || "";

function nowIso() { return new Date().toISOString(); }
function asArray(value) { return Array.isArray(value) ? value : []; }
function asText(value, fallback = "") { return typeof value === "string" && value.trim() ? value.trim() : fallback; }
function unique(values = []) { return [...new Set(asArray(values).map((value) => String(value || "").trim()).filter(Boolean))]; }
function writeJson(filePath, value) { fs.mkdirSync(path.dirname(filePath), { recursive: true }); fs.writeFileSync(filePath, JSON.stringify(value, null, 2)); }
function readJson(filePath) { return JSON.parse(fs.readFileSync(filePath, "utf8")); }
function appendSummary(markdown) { if (summaryPath) fs.appendFileSync(summaryPath, `${markdown}\n`); }
function log(event, meta = {}) { console.log(JSON.stringify({ ok: true, phase: "stage5_substage_audit", mode: MODE, event, at: nowIso(), ...meta }, null, 2)); }
function fail(message, detail = {}) { const payload = { ok: false, phase: "stage5_substage_audit", mode: MODE, error: message, detail, at: nowIso() }; writeJson(path.join(outputRoot, `99-${MODE || "unknown"}-failure.json`), payload); console.error(JSON.stringify(payload, null, 2)); appendSummary(`## ❌ Stage 5 ${MODE.toUpperCase()} failed\n\n\`${message}\`\n`); process.exit(1); }
function normalizeBase(value) { const raw = String(value || "").trim(); const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`; try { return new URL(withScheme).toString().replace(/\/+$/, ""); } catch (error) { fail("RUNTIME_URL must be valid", { received: raw, error: error.message }); } }
function normalizeUrl(value) { try { const url = new URL(value); url.hash = ""; if ((url.pathname || "") !== "/") url.pathname = url.pathname.replace(/\/+$/, "") || "/"; return url.toString(); } catch { return null; } }
async function readResponseJson(response) { const text = await response.text(); try { return JSON.parse(text); } catch { return { non_json_body: text.slice(0, 3000) }; } }
async function postJson(base, routePath, body) { const response = await fetch(`${base}${routePath}`, { method: "POST", headers: { "content-type": "application/json", "x-runtime-access-token": token }, body: JSON.stringify(body) }); const json = await readResponseJson(response); if (!response.ok || json?.ok === false) fail(`Request failed: ${routePath}`, { status: response.status, body: json, request_body: body }); return json; }
function duration(start) { return Date.now() - start; }
function usage(meta = {}) { const raw = meta?.usage_metadata || {}; return { prompt_tokens: raw.promptTokenCount || raw.prompt_token_count || 0, output_tokens: raw.candidatesTokenCount || raw.output_token_count || 0, total_tokens: raw.totalTokenCount || raw.total_token_count || 0, selected_model: meta?.selected_model || meta?.model || null, selected_key_alias: meta?.selected_key_alias || null, fallback_used: meta?.fallback_used === true }; }
function tokenTable(rows) { return rows.map((row) => `| ${row.label} | ${row.duration_ms ?? 0} | ${row.tokens?.prompt_tokens ?? 0} | ${row.tokens?.output_tokens ?? 0} | ${row.tokens?.total_tokens ?? 0} | ${row.tokens?.selected_model || "n/a"} |`).join("\n"); }
function summaryHeader(title) { appendSummary(`## ${title}\n`); }
function writeNodeSummary({ title, findings = [], forensic = {}, guardrails = [], tokenRows = [] }) {
  const guardrailFailures = guardrails.filter((item) => /^BLOCKING:|^FAIL:/i.test(String(item || ""))).length;
  const guardrailWarnings = guardrails.filter((item) => /^WARNING:|warning/i.test(String(item || ""))).length;
  const warningCount = Number.isFinite(forensic.warning_count) ? forensic.warning_count : guardrailWarnings;
  const failureCount = Number.isFinite(forensic.failure_count) ? forensic.failure_count : guardrailFailures;
  const status = forensic.guardrail_status || (failureCount ? "FAIL" : warningCount ? "WARNING" : "PASS");
  const detailedArtifactPath = forensic.detailed_artifact_path || (forensic.output_file ? path.join(outputRoot, forensic.output_file) : outputRoot);
  const enrichedForensic = {
    duration_ms: forensic.duration_ms ?? 0,
    token_usage: tokenRows.length ? tokenRows.map((row) => `${row.label}: ${row.tokens?.total_tokens ?? 0}`).join(", ") : "0",
    model_usage: tokenRows.length ? tokenRows.map((row) => `${row.label}: ${row.tokens?.selected_model || "n/a"}`).join(", ") : "n/a",
    input_count: forensic.input_count ?? 0,
    output_count: forensic.output_count ?? 0,
    ...forensic,
    detailed_artifact_path: detailedArtifactPath
  };
  summaryHeader(title);
  appendSummary(`### Stage summary findings\n${findings.length ? findings.map((item) => `- ${item}`).join("\n") : "- No findings recorded."}\n`);
  appendSummary(`### Summary forensics\n`);
  appendSummary(`| Metric | Value |\n|---|---|`);
  for (const [key, value] of Object.entries(enrichedForensic)) appendSummary(`| ${key} | ${Array.isArray(value) ? value.join(", ") : String(value)} |`);
  appendSummary(`\n### Token + duration\n| Node | duration_ms | prompt_tokens | output_tokens | total_tokens | model |\n|---|---:|---:|---:|---:|---|\n${tokenRows.length ? tokenTable(tokenRows) : "| deterministic | 0 | 0 | 0 | 0 | n/a |"}\n`);
  appendSummary(`### Summary guardrail findings\n- Status: ${status}\n- Warning count: ${warningCount}\n- Failure count: ${failureCount}\n${guardrails.length ? guardrails.map((item) => `- ${item}`).join("\n") : "- No blocking guardrail findings."}\n`);
  appendSummary(`### Detailed artifact file path\n\`${detailedArtifactPath}\`\n`);
}

const SOURCE_BUCKETS = ["company_profile_sources", "product_profile_sources", "legal_profile_sources", "governance_profile_sources"];
function collectBucket(discovery, bucket) {
  const out = [];
  const seen = new Set();
  for (const record of Array.isArray(discovery?.[bucket]) ? discovery[bucket] : []) {
    const url = normalizeUrl(record?.url || record?.final_url);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push({ ...record, url, source_bucket: bucket });
  }
  return out;
}
function collectSources(discovery) {
  const seen = new Set();
  const selected = [];
  for (const bucket of SOURCE_BUCKETS) for (const record of collectBucket(discovery, bucket)) {
    if (!record?.url || seen.has(record.url)) continue;
    seen.add(record.url);
    selected.push(record);
  }
  return selected;
}

async function prepare() {
  if (!token) fail("RUNTIME_ACCESS_TOKEN is required");
  const started = Date.now();
  const base = normalizeBase(runtimeUrl);
  const targetInput = { primary_url: primaryUrl, company_name: companyName, submitted_at: nowIso() };
  log("prepare_start", { targetInput, runtime_url: base });
  const discoveryResponse = await postJson(base, "/v1/source-discovery", {
    input: targetInput,
    options: {
      sourceDiscoveryMode: process.env.STAGE5_SOURCE_DISCOVERY_MODE || "sync_with_free_search",
      runFreeFirstPartySearch: process.env.STAGE5_RUN_FREE_SEARCH === "false" ? false : true,
      anchorFetchMaxAnchors: Number(process.env.STAGE5_ANCHOR_FETCH_MAX || 60),
      anchorLinkLimit: Number(process.env.STAGE5_ANCHOR_LINK_LIMIT || 100000),
      anchorClassifyMaxOutputTokens: Number(process.env.STAGE5_ANCHOR_CLASSIFY_TOKENS || 8192),
      probe_timeout_ms: Number(process.env.STAGE5_PROBE_TIMEOUT_MS || 8000)
    }
  });
  const sources = collectSources(discoveryResponse.discovery);
  if (!sources.length) fail("Source discovery returned no capturable sources", { counts: discoveryResponse.discovery?.counts || null });
  const captureResponse = await postJson(base, "/v1/source-capture", { input: { sources }, options: { timeout_ms: Number(process.env.STAGE5_CAPTURE_TIMEOUT_MS || 24000), max_fetch_bytes: Number(process.env.STAGE5_CAPTURE_MAX_BYTES || 30 * 1024 * 1024) } });
  const sourceBundle = buildEvidenceRefinerInput({ targetInput, discoveryResponse, captureResponse, runId: `stage5_substage_source_bundle_${Date.now()}` });
  const junction = buildEvidenceJunction({ sourceBundle, runId: `stage5_substage_junction_${Date.now()}` });
  const companyProfileStage = await postJson(base, "/v1/diligence/stage", {
    stage: "company_profile",
    input: {
      target_input: targetInput,
      source_bundle_version: sourceBundle.source_bundle_version,
      source_bundle_sha256: junction.source_bundle_sha256 || null,
      evidence_junction_version: junction.evidence_junction_version,
      target_profile_sources: (sourceBundle.raw_footprint?.source_records || []).map((record) => ({ evidence_source_id: record.evidence_source_id, source_family: record.source_family, url: record.url, final_url: record.final_url, title: record.structure?.title || record.title || "", word_count: record.text?.word_count || 0, clean_text_lossless: record.text?.clean_text_lossless || "" })),
      input_policy: { company_family_only: false, product_feature_mapping_forbidden: true, legal_review_forbidden: true, outside_browsing_forbidden: true }
    },
    options: { pool: process.env.STAGE5_COMPANY_POOL || process.env.STAGE4_COMPANY_POOL || "reasoning", maxOutputTokens: Number(process.env.STAGE5_COMPANY_MAX_OUTPUT_TOKENS || process.env.STAGE4_COMPANY_MAX_OUTPUT_TOKENS || 24000), timeoutMs: Number(process.env.STAGE5_COMPANY_TIMEOUT_MS || process.env.STAGE4_COMPANY_TIMEOUT_MS || 90000) }
  });
  const companyProfile = companyProfileStage.company_profile;
  const adapterResult = buildStage5TargetFeaturePackage({ sourceBundle, evidenceJunction: junction, companyProfile, runId: `stage5_substage_input_${Date.now()}`, budget: { max_input_chars: Number(process.env.STAGE5_MAX_INPUT_CHARS || 240000), max_estimated_tokens: Number(process.env.STAGE5_MAX_ESTIMATED_TOKENS || 120000), prompt_overhead_tokens: Number(process.env.STAGE5_PROMPT_OVERHEAD_TOKENS || 30000) } });
  if (!adapterResult.ok) fail("Target Feature Profile input adapter failed", adapterResult);
  const state = { cache_version: "stage5_substage_audit_state_v1", generated_at: nowIso(), target_input: targetInput, runtime_url: base, source_bundle: sourceBundle, evidence_junction: adapterResult.evidence_junction || junction, company_profile: companyProfile, target_profile_v2: companyProfile, adapter_result: adapterResult, target_feature_profile_input: adapterResult.target_feature_profile_input };
  writeJson(statePath, state);
  writeJson(path.join(outputRoot, "00-stage5-audit-input.json"), state);
  const findings = [`Prepared Stage 5 input from ${sources.length} discovered/captured source URL(s).`, `Adapter included ${adapterResult.target_feature_profile_input?.input_budget?.included_sources?.length || 0} Stage 5 source(s).`, `Deterministic candidate count: ${adapterResult.target_feature_profile_input?.target_feature_candidate_index?.candidate_count || 0}.`];
  writeNodeSummary({ title: "Stage 5 Input Preparation", findings, forensic: { output_file: "00-stage5-audit-input.json", target: `${companyName} / ${primaryUrl}`, source_count: sources.length, included_sources: adapterResult.target_feature_profile_input?.input_budget?.included_sources?.length || 0, deterministic_candidates: adapterResult.target_feature_profile_input?.target_feature_candidate_index?.candidate_count || 0, input_count: sources.length, output_count: adapterResult.target_feature_profile_input?.target_feature_candidate_index?.candidate_count || 0, duration_ms: duration(started) }, guardrails: [], tokenRows: [{ label: "company_profile", duration_ms: 0, tokens: usage(companyProfileStage.model_metadata || {}) }] });
  log("prepare_done", { statePath, duration_ms: duration(started) });
}

async function runModelJson({ label, prompt, poolName, maxOutputTokens, timeoutMs }) {
  const started = Date.now();
  const result = await runGeminiPool({ poolName, prompt, env: process.env, options: { responseMimeType: "application/json", temperature: 0, maxOutputTokens, timeoutMs } });
  const payload = { ok: result.ok === true, json: result.json || null, model_metadata: { pool: result?.model_meta?.pool || null, selected_model: result?.model_meta?.selected_model || null, selected_key_alias: result?.model_meta?.selected_key_alias || null, attempted_models: result?.attempts || [], fallback_used: result?.fallback_used === true, usage_metadata: result?.usage_metadata || null }, error: result.error || null, error_type: result.error_type || null, duration_ms: duration(started) };
  log(`${label}_model_done`, { ok: payload.ok, duration_ms: payload.duration_ms, tokens: usage(payload.model_metadata) });
  return payload;
}

function loadState() { if (!fs.existsSync(statePath)) fail("Stage 5 audit state missing. Run prepare step first.", { statePath }); return readJson(statePath); }
function saveState(state) { writeJson(statePath, state); }
function stage5InputFrom(state) { return state.target_feature_profile_input || state.adapter_result?.target_feature_profile_input; }
function merge5A(base, modelJson) {
  const rows = asArray(modelJson?.stage5a_product_function_extraction?.product_functions || modelJson?.product_functions);
  if (!rows.length) return base;
  const byId = new Map(asArray(base.product_functions).map((row) => [row.function_id, row]));
  for (const row of rows) {
    const target = byId.get(row.function_id);
    if (!target) continue;
    for (const key of ["function_name", "primary_or_secondary", "commercial_function", "business_label_or_product_area", "actor_or_user", "input_signal", "system_action", "output_or_result", "extraction_confidence", "extraction_basis"]) if (asText(row[key])) target[key] = row[key];
    target.evidence_refs = unique([...asArray(target.evidence_refs), ...asArray(row.evidence_refs)]);
  }
  return base;
}
function merge5B(base, modelJson) {
  const rows = asArray(modelJson?.stage5b_archetype_surface_tagging?.feature_tags || modelJson?.feature_tags);
  if (!rows.length) return base;
  const allowedArch = new Set(Object.keys(base.controlled_values?.archetypes || {}));
  const allowedSurf = new Set(Object.keys(base.controlled_values?.surfaces || {}));
  const byId = new Map(asArray(base.feature_tags).map((row) => [row.function_id, row]));
  for (const row of rows) {
    const target = byId.get(row.function_id);
    if (!target) continue;
    const arch = unique(row.archetype_codes).filter((code) => allowedArch.has(code));
    const surf = unique(row.surface_tokens).filter((token) => allowedSurf.has(token));
    if (arch.length) target.archetype_codes = arch;
    if (surf.length) target.surface_tokens = surf;
    for (const key of ["triggering_status", "trigger_reason", "autonomy_level", "human_review_signal", "external_action_signal", "tagging_confidence"]) if (asText(row[key])) target[key] = row[key];
    target.tagging_gaps = asArray(row.tagging_gaps);
  }
  return base;
}
function merge5D(base, modelJson) {
  const rows = asArray(modelJson?.stage5d_feature_data_touchpoints?.feature_data_touchpoints || modelJson?.feature_data_touchpoints);
  if (!rows.length) return base;
  const byId = new Map(asArray(base.feature_data_touchpoints).map((row) => [row.feature_id, row]));
  for (const row of rows) {
    const target = byId.get(row.feature_id);
    if (!target) continue;
    target.input_data = unique([...asArray(target.input_data), ...asArray(row.input_data)]);
    target.output_data = unique([...asArray(target.output_data), ...asArray(row.output_data)]);
    target.processing_action = unique([...asArray(target.processing_action), ...asArray(row.processing_action)]);
    for (const key of ["data_origin", "data_subject", "data_category", "processing_context", "storage_or_retention_signal", "training_or_finetuning_signal", "confidence"]) if (asText(row[key])) target[key] = row[key];
    target.gaps = asArray(row.gaps);
  }
  return base;
}

async function run5A() {
  const state = loadState();
  const started = Date.now();
  const stage5Input = stage5InputFrom(state);
  const instructionPlan = stage5MultiSubstageInternals.buildMasterInstructionPlan(stage5Input);
  const deterministic = stage5MultiSubstageInternals.deterministic5A(stage5Input);
  const prompt = [
    "You are Stage 5A Product Function Extractor for Lex Nova runtime.",
    "Return JSON only with {\"stage5a_product_function_extraction\":{\"product_functions\":[],\"visible_but_unmapped\":[],\"limitations\":[]}}.",
    "Use the deterministic baseline and admitted source refs. Refine product function wording, primary/secondary role, input/action/output, and evidence refs.",
    "Do not classify archetypes, surfaces, registry threats, legal risk, or data provenance. Do not delete baseline functions unless clearly duplicate/non-feature.",
    "Each product function must preserve function_id and function_cluster from the baseline.",
    "---INSTRUCTION_PLAN---", JSON.stringify(instructionPlan, null, 2),
    "---BASELINE_AND_EVIDENCE---", JSON.stringify({ deterministic, evidence_packet: { candidates: stage5Input.target_feature_candidate_index?.candidates || [], source_roles: stage5Input.input_budget?.included_sources || [] } }, null, 2)
  ].join("\n");
  const model = await runModelJson({ label: "5a", prompt, poolName: process.env.STAGE5A_POOL || process.env.STAGE5_FEATURE_POOL || "reasoning", maxOutputTokens: Number(process.env.STAGE5A_MAX_OUTPUT_TOKENS || 8192), timeoutMs: Number(process.env.STAGE5A_TIMEOUT_MS || 90000) });
  const stage5a = merge5A(deterministic, model.ok ? model.json : null);
  stage5a.model_metadata = model.model_metadata;
  stage5a.model_error = model.ok ? null : { error_type: model.error_type, error: model.error };
  state.instruction_plan = instructionPlan;
  state.stage5a = stage5a;
  saveState(state);
  writeJson(path.join(outputRoot, "11-stage5a-product-function-extraction.json"), { stage5a, model, duration_ms: duration(started) });
  const guardrails = [];
  if (!asArray(stage5a.product_functions).length) guardrails.push("BLOCKING: 5A produced zero product functions.");
  writeNodeSummary({ title: "Stage 5A — Product Function Extraction", findings: [`Product functions: ${asArray(stage5a.product_functions).length}.`, `Primary functions: ${asArray(stage5a.product_functions).filter((f) => f.primary_or_secondary === "primary").length}.`, `Secondary functions: ${asArray(stage5a.product_functions).filter((f) => f.primary_or_secondary === "secondary").length}.`], forensic: { output_file: "11-stage5a-product-function-extraction.json", duration_ms: duration(started), input_count: asArray(deterministic.product_functions).length, output_count: asArray(stage5a.product_functions).length, model_error: stage5a.model_error?.error_type || "none" }, guardrails, tokenRows: [{ label: "5A model", duration_ms: model.duration_ms, tokens: usage(model.model_metadata) }] });
  if (guardrails.some((g) => g.startsWith("BLOCKING"))) process.exit(1);
}

async function run5B() {
  const state = loadState();
  const started = Date.now();
  if (!state.stage5a) fail("5A output missing. Run 5A first.");
  const deterministic = stage5MultiSubstageInternals.deterministic5B(state.stage5a);
  const prompt = [
    "You are Stage 5B Archetype + Surface Tagger for Lex Nova runtime.",
    "Return JSON only with {\"stage5b_archetype_surface_tagging\":{\"feature_tags\":[],\"limitations\":[]}}.",
    "Use only supplied controlled archetype/surface values. Every 5A function must receive at least one archetype and one surface. Never delete a 5A function.",
    "If uncertain, keep the deterministic tag and add tagging_gaps; do not output empty archetype_codes or surface_tokens.",
    "---CONTROLLED_VALUES---", JSON.stringify(deterministic.controlled_values, null, 2),
    "---5A_PRODUCT_FUNCTIONS_AND_BASELINE_TAGS---", JSON.stringify({ product_functions: state.stage5a.product_functions, deterministic }, null, 2)
  ].join("\n");
  const model = await runModelJson({ label: "5b", prompt, poolName: process.env.STAGE5B_POOL || process.env.STAGE5_FEATURE_POOL || "reasoning", maxOutputTokens: Number(process.env.STAGE5B_MAX_OUTPUT_TOKENS || 8192), timeoutMs: Number(process.env.STAGE5B_TIMEOUT_MS || 90000) });
  const stage5b = merge5B(deterministic, model.ok ? model.json : null);
  stage5b.model_metadata = model.model_metadata;
  stage5b.model_error = model.ok ? null : { error_type: model.error_type, error: model.error };
  state.stage5b = stage5b;
  saveState(state);
  writeJson(path.join(outputRoot, "12-stage5b-archetype-surface-tagging.json"), { stage5b, model, duration_ms: duration(started) });
  const missing = asArray(stage5b.feature_tags).filter((row) => !asArray(row.archetype_codes).length || !asArray(row.surface_tokens).length);
  const guardrails = missing.length ? [`BLOCKING: ${missing.length} product function(s) missing archetype or surface tags.`] : [];
  writeNodeSummary({ title: "Stage 5B — Archetype + Surface Tagging", findings: [`Tagged functions: ${asArray(stage5b.feature_tags).length}.`, `Functions missing archetype/surface: ${missing.length}.`, `Controlled registry source: ${stage5b.registry_key_source || "runtime registry key"}.`], forensic: { output_file: "12-stage5b-archetype-surface-tagging.json", duration_ms: duration(started), input_count: asArray(state.stage5a.product_functions).length, output_count: asArray(stage5b.feature_tags).length, warning_count: 0, failure_count: missing.length, model_error: stage5b.model_error?.error_type || "none" }, guardrails, tokenRows: [{ label: "5B model", duration_ms: model.duration_ms, tokens: usage(model.model_metadata) }] });
  if (missing.length) process.exit(1);
}

function run5C() {
  const state = loadState();
  const started = Date.now();
  if (!state.stage5a || !state.stage5b) fail("5A/5B outputs missing. Run 5A and 5B first.");
  const stage5c = stage5MultiSubstageInternals.build5C({ stage5a: state.stage5a, stage5b: state.stage5b });
  state.stage5c = stage5c;
  saveState(state);
  writeJson(path.join(outputRoot, "13-stage5c-feature-inventory-canonicalization.json"), { stage5c, duration_ms: duration(started) });
  const guardrails = [];
  if (!asArray(stage5c.feature_inventory_seed).length) guardrails.push("BLOCKING: 5C built zero feature_inventory_seed rows.");
  writeNodeSummary({ title: "Stage 5C — Feature Inventory Canonicalization", findings: [`Feature inventory seed rows: ${asArray(stage5c.feature_inventory_seed).length}.`, `Unresolved candidates: ${asArray(stage5c.unresolved_feature_candidates).length}.`, "5C is deterministic; token usage must remain zero."], forensic: { output_file: "13-stage5c-feature-inventory-canonicalization.json", duration_ms: duration(started), input_count: asArray(state.stage5b.feature_tags).length, output_count: asArray(stage5c.feature_inventory_seed).length, deterministic: true }, guardrails, tokenRows: [{ label: "5C deterministic", duration_ms: duration(started), tokens: { prompt_tokens: 0, output_tokens: 0, total_tokens: 0, selected_model: "n/a" } }] });
  if (guardrails.some((g) => g.startsWith("BLOCKING"))) process.exit(1);
}

async function run5D() {
  const state = loadState();
  const started = Date.now();
  if (!state.stage5a || !state.stage5c) fail("5A/5C outputs missing. Run 5A and 5C first.");
  const deterministic = stage5MultiSubstageInternals.deterministic5D(state.stage5c);
  const prompt = [
    "You are Stage 5D Feature Data Touchpoint Extractor for Lex Nova runtime.",
    "Return JSON only with {\"stage5d_feature_data_touchpoints\":{\"feature_data_touchpoints\":[],\"limitations\":[]}}.",
    "Extract feature-level functional data touchpoints only. Do not perform legal data provenance; Stage 6B owns legal/governance provenance.",
    "For retention, training/fine-tuning, or sharing, use UNKNOWN_NOT_EVIDENCED unless product evidence explicitly says otherwise.",
    "---5C_FEATURES_AND_BASELINE_TOUCHPOINTS---", JSON.stringify({ feature_inventory_seed: state.stage5c.feature_inventory_seed, deterministic, product_functions: state.stage5a.product_functions }, null, 2)
  ].join("\n");
  const model = await runModelJson({ label: "5d", prompt, poolName: process.env.STAGE5D_POOL || process.env.STAGE5_FEATURE_POOL || "reasoning", maxOutputTokens: Number(process.env.STAGE5D_MAX_OUTPUT_TOKENS || 8192), timeoutMs: Number(process.env.STAGE5D_TIMEOUT_MS || 90000) });
  const stage5d = merge5D(deterministic, model.ok ? model.json : null);
  stage5d.model_metadata = model.model_metadata;
  stage5d.model_error = model.ok ? null : { error_type: model.error_type, error: model.error };
  state.stage5d = stage5d;
  saveState(state);
  writeJson(path.join(outputRoot, "14-stage5d-feature-data-touchpoints.json"), { stage5d, model, duration_ms: duration(started) });
  const missing = asArray(state.stage5c.feature_inventory_seed).filter((feature) => !asArray(stage5d.feature_data_touchpoints).some((row) => row.feature_id === feature.feature_id));
  const guardrails = missing.length ? [`BLOCKING: ${missing.length} feature(s) missing data touchpoint row.`] : [];
  writeNodeSummary({ title: "Stage 5D — Feature Data Touchpoints", findings: [`Feature data touchpoint rows: ${asArray(stage5d.feature_data_touchpoints).length}.`, `Features missing touchpoints: ${missing.length}.`, "This is feature-level data mapping only; Stage 6B remains full legal/governance data provenance."], forensic: { output_file: "14-stage5d-feature-data-touchpoints.json", duration_ms: duration(started), input_count: asArray(state.stage5c.feature_inventory_seed).length, output_count: asArray(stage5d.feature_data_touchpoints).length, warning_count: 0, failure_count: missing.length, model_error: stage5d.model_error?.error_type || "none" }, guardrails, tokenRows: [{ label: "5D model", duration_ms: model.duration_ms, tokens: usage(model.model_metadata) }] });
  if (missing.length) process.exit(1);
}

function run5E() {
  const state = loadState();
  const started = Date.now();
  if (!state.stage5a || !state.stage5b || !state.stage5c || !state.stage5d) fail("5A/5B/5C/5D outputs missing. Run all Stage 5 substages first.");
  const stage5Input = stage5InputFrom(state);
  const instructionPlan = state.instruction_plan || stage5MultiSubstageInternals.buildMasterInstructionPlan(stage5Input);
  const assembled = stage5MultiSubstageInternals.build5E({ stage5Input, stage5a: state.stage5a, stage5b: state.stage5b, stage5c: state.stage5c, stage5d: state.stage5d, instructionPlan });
  const schemaProfile = { ...assembled };
  delete schemaProfile.stage5_suboutputs;
  const schemaValidation = validateDiligenceStageOutput("targetFeatureProfile", schemaProfile);
  const guardrail = validateTargetFeatureProfileGuardrails(schemaProfile, { packageInput: stage5Input, evidenceBuffer: asArray(stage5Input?.source_bundle?.evidence_buffer), threatMappingSupplied: stage5Input?.threat_mapping_supplied === true || stage5Input?.source_bundle?.source_review?.threat_mapping_supplied === true });
  state.stage5e = { assembled_profile: assembled, schema_validation: schemaValidation, guardrail };
  saveState(state);
  writeJson(path.join(outputRoot, "15-stage5e-target-feature-profile-assembly.json"), { assembled_profile: assembled, schema_validation: schemaValidation, guardrail, duration_ms: duration(started) });
  writeJson(path.join(outputRoot, "05-target-feature-profile.json"), schemaProfile);
  const guardrails = [];
  if (!schemaValidation.ok) guardrails.push(`BLOCKING: schema errors=${schemaValidation.errors?.length || 0}`);
  if (!guardrail.ok) guardrails.push(`BLOCKING: guardrail errors=${guardrail.errors?.length || 0}; repairs=${guardrail.repairs?.length || 0}; warnings=${guardrail.warnings?.length || 0}`);
  writeNodeSummary({ title: "Stage 5E — Target Feature Profile Assembly", findings: [`Final feature_inventory rows: ${asArray(schemaProfile.feature_inventory).length}.`, `Data provenance map rows: ${asArray(schemaProfile.data_provenance_map).length}.`, `Regulated surface map rows: ${asArray(schemaProfile.regulated_surface_map).length}.`, `Classification quality: ${schemaProfile.classification_quality?.status || "unknown"}.`], forensic: { output_file: "15-stage5e-target-feature-profile-assembly.json", canonical_profile_file: "05-target-feature-profile.json", duration_ms: duration(started), input_count: asArray(state.stage5c.feature_inventory_seed).length, output_count: asArray(schemaProfile.feature_inventory).length, warning_count: guardrail.warnings?.length || 0, failure_count: (schemaValidation.ok ? 0 : schemaValidation.errors?.length || 1) + (guardrail.ok ? 0 : guardrail.errors?.length || 1), schema_ok: schemaValidation.ok, guardrail_ok: guardrail.ok }, guardrails: guardrails.length ? guardrails : [`Guardrail warnings: ${guardrail.warnings?.length || 0}`, `Guardrail repairs: ${guardrail.repairs?.length || 0}`], tokenRows: [{ label: "5E deterministic", duration_ms: duration(started), tokens: { prompt_tokens: 0, output_tokens: 0, total_tokens: 0, selected_model: "n/a" } }] });
  if (!schemaValidation.ok || !guardrail.ok) process.exit(1);
}

fs.mkdirSync(outputRoot, { recursive: true });
if (!MODE) fail("STAGE5_AUDIT_MODE is required", { allowed_modes: ["prepare", "5a", "5b", "5c", "5d", "5e"] });
if (MODE === "prepare") await prepare();
else if (MODE === "5a") await run5A();
else if (MODE === "5b") await run5B();
else if (MODE === "5c") run5C();
else if (MODE === "5d") await run5D();
else if (MODE === "5e") run5E();
else fail("Unknown STAGE5_AUDIT_MODE", { mode: MODE });
