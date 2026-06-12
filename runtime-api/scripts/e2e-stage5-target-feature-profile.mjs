#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { buildEvidenceRefinerInput } from "../src/diligence/adapters/sourceBundleAdapter.js";
import { buildEvidenceJunction } from "../src/diligence/evidenceJunction.js";
import { buildTargetFeatureProfileInput } from "../src/diligence/adapters/targetFeatureProfileInputAdapter.js";

const DEFAULT_RUNTIME_URL = "https://lexnova-runtime-api-24qnalslaa-uc.a.run.app";
const runtimeUrl = process.env.RUNTIME_URL || process.env.LEXNOVA_RUNTIME_URL || DEFAULT_RUNTIME_URL;
const token = process.env.RUNTIME_ACCESS_TOKEN;
const primaryUrl = process.env.TEST_PRIMARY_URL || "https://sarvam.ai";
const companyName = process.env.TEST_COMPANY_NAME || "Sarvam AI";
const stage5CachePath = process.env.STAGE5_E2E_CACHE_PATH || path.join(process.cwd(), ".runtime-e2e-cache", "stage5-target-feature-profile.json");
const failurePath = process.env.STAGE5_E2E_FAILURE_CACHE_PATH || path.join(process.cwd(), ".runtime-e2e-cache", "stage5-target-feature-profile.failure.json");
const BUCKETS = ["company_profile_sources", "product_profile_sources", "legal_profile_sources", "governance_profile_sources"];

function writeJson(filePath, value) { fs.mkdirSync(path.dirname(filePath), { recursive: true }); fs.writeFileSync(filePath, JSON.stringify(value, null, 2)); }
function fail(message, detail = null) { const payload = { ok: false, error: message, detail }; try { writeJson(failurePath, { cache_version: "stage5_target_feature_profile_e2e_failure_v1", generated_at: new Date().toISOString(), error: payload }); payload.failure_cache_path = failurePath; } catch {} console.error(JSON.stringify(payload, null, 2)); process.exit(1); }
function normalizeBase(value) { const raw = String(value || "").trim(); const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`; try { return new URL(withScheme).toString().replace(/\/+$/, ""); } catch (error) { fail("RUNTIME_URL must be valid", { received: raw, error: error.message }); } }
function normalizeUrl(value) { try { const url = new URL(value); url.hash = ""; if ((url.pathname || "") !== "/") url.pathname = url.pathname.replace(/\/+$/, "") || "/"; return url.toString(); } catch { return null; } }
function tokenDrift(actual, estimated) { const a = Number(actual || 0); const e = Number(estimated || 0); return a && e ? Number((a / e).toFixed(3)) : null; }
async function readJson(response) { const text = await response.text(); try { return JSON.parse(text); } catch { return { non_json_body: text.slice(0, 3000) }; } }
async function postJson(base, routePath, body) { const response = await fetch(`${base}${routePath}`, { method: "POST", headers: { "content-type": "application/json", "x-runtime-access-token": token }, body: JSON.stringify(body) }); const json = await readJson(response); if (!response.ok || json?.ok === false) fail(`Request failed: ${routePath}`, { status: response.status, body: json, request_body: body }); return json; }

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
  for (const bucket of BUCKETS) {
    for (const record of collectBucket(discovery, bucket)) {
      if (!record?.url || seen.has(record.url)) continue;
      seen.add(record.url);
      selected.push(record);
    }
  }
  return selected;
}

async function buildStandaloneInputs(base, targetInput) {
  const discoveryResponse = await postJson(base, "/v1/source-discovery", {
    input: targetInput,
    options: {
      sourceDiscoveryMode: process.env.STAGE5_SOURCE_DISCOVERY_MODE || "sync_with_free_search",
      runFreeFirstPartySearch: process.env.STAGE5_RUN_FREE_SEARCH === "false" ? false : true,
      anchorFetchMaxAnchors: Number(process.env.STAGE5_ANCHOR_FETCH_MAX || 60),
      anchorClassifyMaxOutputTokens: Number(process.env.STAGE5_ANCHOR_CLASSIFY_TOKENS || 8192),
      probe_timeout_ms: Number(process.env.STAGE5_PROBE_TIMEOUT_MS || 8000)
    }
  });
  const sources = collectSources(discoveryResponse.discovery);
  if (!sources.length) fail("Source discovery returned no capturable sources", { counts: discoveryResponse.discovery?.counts || null, rejected_sources: discoveryResponse.discovery?.rejected_sources || [] });
  console.log(JSON.stringify({ ok: true, step: "source_discovery_complete_full_sweep", source_count: sources.length, counts: discoveryResponse.discovery?.counts || null, rejected_source_count: discoveryResponse.discovery?.rejected_sources?.length || 0 }, null, 2));
  const captureResponse = await postJson(base, "/v1/source-capture", { input: { sources }, options: { timeout_ms: Number(process.env.STAGE5_CAPTURE_TIMEOUT_MS || 24000), max_fetch_bytes: Number(process.env.STAGE5_CAPTURE_MAX_BYTES || 30 * 1024 * 1024) } });
  const sourceBundle = buildEvidenceRefinerInput({ targetInput, discoveryResponse, captureResponse, runId: `stage5_source_bundle_${Date.now()}` });
  const junction = buildEvidenceJunction({ sourceBundle, runId: `stage5_junction_${Date.now()}` });
  const companyProfileStage = await postJson(base, "/v1/diligence/stage", { stage: "company_profile", input: { target_input: targetInput, source_bundle_version: sourceBundle.source_bundle_version, source_bundle_sha256: junction.source_bundle_sha256 || null, evidence_junction_version: junction.evidence_junction_version, target_profile_sources: (sourceBundle.raw_footprint?.source_records || []).map((record) => ({ evidence_source_id: record.evidence_source_id, source_family: record.source_family, url: record.url, final_url: record.final_url, title: record.structure?.title || record.title || "", word_count: record.text?.word_count || 0, clean_text_lossless: record.text?.clean_text_lossless || "" })), input_policy: { company_family_only: false, product_feature_mapping_forbidden: true, legal_review_forbidden: true, outside_browsing_forbidden: true } }, options: { pool: process.env.STAGE5_COMPANY_POOL || process.env.STAGE4_COMPANY_POOL || "reasoning", maxOutputTokens: Number(process.env.STAGE5_COMPANY_MAX_OUTPUT_TOKENS || process.env.STAGE4_COMPANY_MAX_OUTPUT_TOKENS || 24000), timeoutMs: Number(process.env.STAGE5_COMPANY_TIMEOUT_MS || process.env.STAGE4_COMPANY_TIMEOUT_MS || 90000) } });
  return { sourceBundle, junction, companyProfile: companyProfileStage.company_profile, cacheMode: "standalone_full_sweep" };
}

if (!token) fail("RUNTIME_ACCESS_TOKEN is required");
const base = normalizeBase(runtimeUrl);
const targetInput = { primary_url: primaryUrl, company_name: companyName, submitted_at: new Date().toISOString() };
console.log(JSON.stringify({ ok: true, step: "start", phase: "stage_5_target_feature_profile_e2e_full_sweep", target: targetInput, runtime_url: base, stage_source_policy: "stage5_own_routed_packet_no_stage4_source_cache" }, null, 2));

const built = await buildStandaloneInputs(base, targetInput);
const sourceBundle = built.sourceBundle;
const junction = built.junction;
const companyProfile = built.companyProfile;
const cacheMode = built.cacheMode;

const adapterResult = buildTargetFeatureProfileInput({ sourceBundle, evidenceJunction: junction, companyProfile, runId: `stage5_target_feature_profile_input_${Date.now()}`, budget: { max_input_chars: Number(process.env.STAGE5_MAX_INPUT_CHARS || 240000), max_estimated_tokens: Number(process.env.STAGE5_MAX_ESTIMATED_TOKENS || 120000), prompt_overhead_tokens: Number(process.env.STAGE5_PROMPT_OVERHEAD_TOKENS || 30000) } });
if (!adapterResult.ok) fail("Target Feature Profile input adapter failed", adapterResult);
const stage5Input = adapterResult.target_feature_profile_input;
console.log(JSON.stringify({ ok: true, step: "stage5_adapter_complete", cache_mode: cacheMode, budget_status: stage5Input.input_budget.budget_status, included_sources: stage5Input.input_budget.included_sources.length, excluded_sources: stage5Input.input_budget.excluded_sources.length, estimated_total_prompt_tokens: stage5Input.input_budget.estimated_total_prompt_tokens }, null, 2));

const featureStage = await postJson(base, "/v1/diligence/stage", { stage: "target_feature_profile", input: stage5Input, options: { pool: process.env.STAGE5_FEATURE_POOL || process.env.STAGE5_POOL || "reasoning", maxOutputTokens: Number(process.env.STAGE5_FEATURE_MAX_OUTPUT_TOKENS || 28000), timeoutMs: Number(process.env.STAGE5_FEATURE_TIMEOUT_MS || 120000) } });
const profile = featureStage.target_feature_profile;
if (!profile) fail("Target Feature Profile stage returned no profile", featureStage);
if (profile.feature_profile_version !== "feature_profile_v2") fail("Bad feature profile version", { feature_profile_version: profile.feature_profile_version || null, top_level_keys: Object.keys(profile || {}) });
if (!Array.isArray(profile.feature_inventory)) fail("Target Feature Profile feature_inventory missing", { top_level_keys: Object.keys(profile || {}) });
if (!Array.isArray(profile.product_feature_map)) fail("Target Feature Profile compatibility product_feature_map missing", { top_level_keys: Object.keys(profile || {}) });

writeJson(stage5CachePath, { cache_version: "stage5_target_feature_profile_e2e_cache_v1", generated_at: new Date().toISOString(), target_input: targetInput, source_bundle: sourceBundle, evidence_junction: junction, company_profile: companyProfile, target_profile_v2: companyProfile, target_feature_profile_input: stage5Input, target_feature_profile_stage_result: featureStage, target_feature_profile: profile, feature_profile_v2: profile });
const actualPromptTokens = featureStage.model_metadata?.usage_metadata?.promptTokenCount || null;
const estimatedTotalPromptTokens = stage5Input.input_budget.estimated_total_prompt_tokens;
console.log(JSON.stringify({ ok: true, phase: "stage_5_target_feature_profile_e2e", cache_mode: cacheMode, cache_path: stage5CachePath, source_bundle_version: sourceBundle.source_bundle_version, evidence_junction_version: junction.evidence_junction_version, adapter_version: stage5Input.target_feature_profile_input_version, budget_status: stage5Input.input_budget.budget_status, estimated_total_prompt_tokens: estimatedTotalPromptTokens, actual_prompt_tokens: actualPromptTokens, token_estimate_drift_ratio: tokenDrift(actualPromptTokens, estimatedTotalPromptTokens), included_sources: stage5Input.input_budget.included_sources.length, excluded_sources: stage5Input.input_budget.excluded_sources.length, feature_count: profile.feature_inventory.length, completeness_status: profile.commercial_scan?.completeness_status || null, validation_mode: featureStage.validation_mode, guardrail_validation_mode: featureStage.guardrail_validation_mode, model_metadata: featureStage.model_metadata || null }, null, 2));