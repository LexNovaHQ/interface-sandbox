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
const cachePath = process.env.STAGE4_E2E_CACHE_PATH || path.join(process.cwd(), ".runtime-e2e-cache", "stage4-company-profile.json");

const BUCKETS = ["company_profile_sources", "product_profile_sources", "legal_profile_sources", "governance_profile_sources"];

function fail(message, detail) {
  console.error(JSON.stringify({ ok: false, error: message, detail: detail || null }, null, 2));
  process.exit(1);
}

function readCache(filePath) {
  if (process.env.STAGE5_IGNORE_STAGE4_CACHE === "true") return null;
  if (!fs.existsSync(filePath)) return null;
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (parsed?.cache_version !== "stage4_company_profile_e2e_cache_v1") return null;
    if (!parsed.source_bundle || !parsed.evidence_junction || !parsed.company_profile) return null;
    return parsed;
  } catch {
    return null;
  }
}

function normalizeBase(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try { return new URL(withScheme).toString().replace(/\/+$/, ""); }
  catch (error) { fail("RUNTIME_URL must be valid", { received: raw, error: error.message }); }
}

function normalizeUrl(value) {
  try {
    const url = new URL(value);
    url.hash = "";
    if ((url.pathname || "") !== "/") url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    return url.toString();
  } catch { return null; }
}

function tokenDrift(actual, estimated) {
  const a = Number(actual || 0);
  const e = Number(estimated || 0);
  if (!a || !e) return null;
  return Number((a / e).toFixed(3));
}

async function readJson(response) {
  const text = await response.text();
  try { return JSON.parse(text); }
  catch { return { non_json_body: text.slice(0, 3000) }; }
}

async function postJson(base, routePath, body) {
  const response = await fetch(`${base}${routePath}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-runtime-access-token": token },
    body: JSON.stringify(body)
  });
  const json = await readJson(response);
  if (!response.ok || json?.ok === false) fail(`Request failed: ${routePath}`, { status: response.status, body: json });
  return json;
}

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
  const limit = Number(process.env.STAGE5_CAPTURE_LIMIT || process.env.STAGE4_CAPTURE_LIMIT || 16);
  const quotas = [
    ["product_profile_sources", Number(process.env.STAGE5_PRODUCT_CAPTURE_LIMIT || 10)],
    ["company_profile_sources", Number(process.env.STAGE5_COMPANY_CAPTURE_LIMIT || 3)],
    ["governance_profile_sources", Number(process.env.STAGE5_GOVERNANCE_CAPTURE_LIMIT || 2)],
    ["legal_profile_sources", Number(process.env.STAGE5_LEGAL_CAPTURE_LIMIT || 2)]
  ];
  const pools = Object.fromEntries(BUCKETS.map((bucket) => [bucket, collectBucket(discovery, bucket)]));
  const selected = [];
  const seen = new Set();
  const add = (record) => {
    if (!record?.url || seen.has(record.url) || selected.length >= limit) return;
    seen.add(record.url);
    selected.push(record);
  };
  for (const [bucket, quota] of quotas) for (const record of (pools[bucket] || []).slice(0, quota)) add(record);
  for (const bucket of BUCKETS) for (const record of pools[bucket] || []) add(record);
  return selected;
}

async function buildStandaloneInputs(base, targetInput) {
  const discoveryResponse = await postJson(base, "/v1/source-discovery", {
    input: targetInput,
    options: {
      sourceDiscoveryMode: process.env.STAGE5_SOURCE_DISCOVERY_MODE || "sync_anchor_only",
      runFreeFirstPartySearch: process.env.STAGE5_RUN_FREE_SEARCH === "true",
      anchorFetchMaxAnchors: Number(process.env.STAGE5_ANCHOR_FETCH_MAX || 32),
      anchorLinkLimit: Number(process.env.STAGE5_ANCHOR_LINK_LIMIT || 120),
      anchorClassifyMaxOutputTokens: Number(process.env.STAGE5_ANCHOR_CLASSIFY_TOKENS || 8192),
      probe_timeout_ms: Number(process.env.STAGE5_PROBE_TIMEOUT_MS || 8000)
    }
  });

  const sources = collectSources(discoveryResponse.discovery);
  if (!sources.length) fail("Source discovery returned no capturable sources", { counts: discoveryResponse.discovery?.counts || null });
  console.log(JSON.stringify({ ok: true, step: "source_discovery_complete", source_count: sources.length, counts: discoveryResponse.discovery?.counts || null, cache_mode: "standalone_full_chain" }, null, 2));

  const captureResponse = await postJson(base, "/v1/source-capture", {
    input: { sources },
    options: { timeout_ms: Number(process.env.STAGE5_CAPTURE_TIMEOUT_MS || 12000), max_sources: sources.length }
  });

  const sourceBundle = buildEvidenceRefinerInput({ targetInput, discoveryResponse, captureResponse, runId: `stage5_source_bundle_${Date.now()}` });
  const junction = buildEvidenceJunction({ sourceBundle, runId: `stage5_junction_${Date.now()}` });

  const companyProfileStage = await postJson(base, "/v1/diligence/stage", {
    stage: "company_profile",
    input: {
      target_input: targetInput,
      source_bundle_version: sourceBundle.source_bundle_version,
      source_bundle_sha256: junction.source_bundle_sha256 || null,
      evidence_junction_version: junction.evidence_junction_version,
      company_profile_sources: (sourceBundle.raw_footprint?.source_records || [])
        .filter((record) => record.source_family === "company_profile")
        .map((record) => ({
          evidence_source_id: record.evidence_source_id,
          source_family: record.source_family,
          url: record.url,
          final_url: record.final_url,
          title: record.structure?.title || record.title || "",
          word_count: record.text?.word_count || 0,
          clean_text_lossless: record.text?.clean_text_lossless || ""
        })),
      input_policy: {
        company_family_only: true,
        product_feature_mapping_forbidden: true,
        legal_review_forbidden: true,
        outside_browsing_forbidden: true
      }
    },
    options: {
      pool: process.env.STAGE5_COMPANY_POOL || process.env.STAGE4_COMPANY_POOL || "reasoning",
      maxOutputTokens: Number(process.env.STAGE5_COMPANY_MAX_OUTPUT_TOKENS || 4096),
      timeoutMs: Number(process.env.STAGE5_COMPANY_TIMEOUT_MS || 60000)
    }
  });

  return { sourceBundle, junction, companyProfile: companyProfileStage.company_profile, cacheMode: "standalone_full_chain" };
}

if (!token) fail("RUNTIME_ACCESS_TOKEN is required");

const base = normalizeBase(runtimeUrl);
const targetInput = { primary_url: primaryUrl, company_name: companyName, submitted_at: new Date().toISOString() };

console.log(JSON.stringify({ ok: true, step: "start", phase: "stage_5_target_feature_profile_e2e", target: targetInput, runtime_url: base, gemini_execution: "remote_runtime" }, null, 2));

const cache = readCache(cachePath);
let sourceBundle;
let junction;
let companyProfile;
let cacheMode;

if (cache) {
  sourceBundle = cache.source_bundle;
  junction = cache.evidence_junction;
  companyProfile = cache.company_profile;
  cacheMode = "reused_stage4_cache";
  console.log(JSON.stringify({ ok: true, step: "stage5_reused_stage4_cache", cache_path: cachePath, source_bundle_version: sourceBundle.source_bundle_version, evidence_junction_version: junction.evidence_junction_version, company_profile_version: companyProfile.company_profile_version }, null, 2));
} else {
  const built = await buildStandaloneInputs(base, targetInput);
  sourceBundle = built.sourceBundle;
  junction = built.junction;
  companyProfile = built.companyProfile;
  cacheMode = built.cacheMode;
}

const adapterResult = buildTargetFeatureProfileInput({
  sourceBundle,
  evidenceJunction: junction,
  companyProfile,
  runId: `stage5_target_feature_profile_input_${Date.now()}`,
  budget: {
    max_input_chars: Number(process.env.STAGE5_MAX_INPUT_CHARS || 120000),
    max_estimated_tokens: Number(process.env.STAGE5_MAX_ESTIMATED_TOKENS || 60000),
    max_single_source_chars: Number(process.env.STAGE5_MAX_SINGLE_SOURCE_CHARS || 45000),
    prompt_overhead_tokens: Number(process.env.STAGE5_PROMPT_OVERHEAD_TOKENS || 30000)
  }
});

if (!adapterResult.ok) fail("Target Feature Profile input adapter failed", adapterResult);
const stage5Input = adapterResult.target_feature_profile_input;
console.log(JSON.stringify({
  ok: true,
  step: "stage5_adapter_complete",
  cache_mode: cacheMode,
  budget_status: stage5Input.input_budget.budget_status,
  estimated_source_tokens: stage5Input.input_budget.estimated_source_tokens,
  estimated_prompt_overhead_tokens: stage5Input.input_budget.estimated_prompt_overhead_tokens,
  estimated_total_prompt_tokens: stage5Input.input_budget.estimated_total_prompt_tokens,
  included_sources: stage5Input.input_budget.included_sources.length,
  excluded_sources: stage5Input.input_budget.excluded_sources.length
}, null, 2));

const featureStage = await postJson(base, "/v1/diligence/stage", {
  stage: "target_feature_profile",
  input: stage5Input,
  options: {
    pool: process.env.STAGE5_FEATURE_POOL || process.env.STAGE5_POOL || "reasoning",
    maxOutputTokens: Number(process.env.STAGE5_FEATURE_MAX_OUTPUT_TOKENS || 8192),
    timeoutMs: Number(process.env.STAGE5_FEATURE_TIMEOUT_MS || 90000)
  }
});

const profile = featureStage.target_feature_profile;
if (!profile) fail("Target Feature Profile stage returned no profile", featureStage);
if (!Array.isArray(profile.product_feature_map)) fail("Target Feature Profile product_feature_map missing", profile);

const actualPromptTokens = featureStage.model_metadata?.usage_metadata?.promptTokenCount || null;
const estimatedTotalPromptTokens = stage5Input.input_budget.estimated_total_prompt_tokens;

console.log(JSON.stringify({
  ok: true,
  phase: "stage_5_target_feature_profile_e2e",
  cache_mode: cacheMode,
  source_bundle_version: sourceBundle.source_bundle_version,
  evidence_junction_version: junction.evidence_junction_version,
  adapter_version: stage5Input.target_feature_profile_input_version,
  budget_status: stage5Input.input_budget.budget_status,
  estimated_source_tokens: stage5Input.input_budget.estimated_source_tokens,
  estimated_prompt_overhead_tokens: stage5Input.input_budget.estimated_prompt_overhead_tokens,
  estimated_total_prompt_tokens: estimatedTotalPromptTokens,
  actual_prompt_tokens: actualPromptTokens,
  token_estimate_drift_ratio: tokenDrift(actualPromptTokens, estimatedTotalPromptTokens),
  included_sources: stage5Input.input_budget.included_sources.length,
  excluded_sources: stage5Input.input_budget.excluded_sources.length,
  target_company_name: profile.target_profile?.company_name || null,
  primary_product: profile.primary_product?.product_name || null,
  feature_count: profile.product_feature_map.length,
  raw_candidate_count: profile.raw_feature_candidates?.length || 0,
  scratchpad_count: profile.feature_map_scratchpad?.length || 0,
  limitation_count: profile.limitations?.length || 0,
  validation_mode: featureStage.validation_mode,
  guardrail_validation_mode: featureStage.guardrail_validation_mode,
  model_metadata: featureStage.model_metadata || null
}, null, 2));
