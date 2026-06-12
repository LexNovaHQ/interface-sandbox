#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { buildEvidenceRefinerInput } from "../src/diligence/adapters/sourceBundleAdapter.js";
import { buildEvidenceJunction } from "../src/diligence/evidenceJunction.js";

const DEFAULT_RUNTIME_URL = "https://lexnova-runtime-api-24qnalslaa-uc.a.run.app";
const runtimeUrl = process.env.RUNTIME_URL || process.env.LEXNOVA_RUNTIME_URL || DEFAULT_RUNTIME_URL;
const token = process.env.RUNTIME_ACCESS_TOKEN;
const primaryUrl = process.env.TEST_PRIMARY_URL || "https://sarvam.ai";
const companyName = process.env.TEST_COMPANY_NAME || "Sarvam AI";
const cachePath = process.env.STAGE4_E2E_CACHE_PATH || path.join(process.cwd(), ".runtime-e2e-cache", "stage4-company-profile.json");
const failurePath = path.join(path.dirname(cachePath), "stage4-company-profile.failure.json");

const SOURCE_BUCKETS = [
  "company_profile_sources",
  "product_profile_sources",
  "legal_profile_sources",
  "governance_profile_sources"
];

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

function writeFailureCache(message, detail) {
  try {
    writeJson(failurePath, {
      cache_version: "stage4_company_profile_e2e_failure_v2",
      generated_at: new Date().toISOString(),
      target: { primary_url: primaryUrl, company_name: companyName },
      error: message,
      detail: detail || null
    });
  } catch {
    // Never mask the original failure.
  }
}

function fail(message, detail) {
  writeFailureCache(message, detail);
  console.error(JSON.stringify({ ok: false, error: message, detail: detail || null, failure_cache_path: failurePath }, null, 2));
  process.exit(1);
}

function normalizeBase(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    return new URL(withScheme).toString().replace(/\/+$/, "");
  } catch (error) {
    fail("RUNTIME_URL must be valid", { received: raw, error: error.message });
  }
}

function normalizeUrl(value) {
  try {
    const url = new URL(value);
    url.hash = "";
    if ((url.pathname || "") !== "/") url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    return url.toString();
  } catch {
    return null;
  }
}

async function readJson(response) {
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
    headers: { "content-type": "application/json", "x-runtime-access-token": token },
    body: JSON.stringify(body)
  });
  const json = await readJson(response);
  if (!response.ok || json?.ok === false) {
    fail(`Request failed: ${routePath}`, { status: response.status, body: json, request_body: body });
  }
  return json;
}

function collectSources(discovery) {
  const selected = [];
  const seen = new Set();
  for (const bucket of SOURCE_BUCKETS) {
    for (const record of Array.isArray(discovery?.[bucket]) ? discovery[bucket] : []) {
      const url = normalizeUrl(record?.url || record?.final_url);
      if (!url || seen.has(url)) continue;
      seen.add(url);
      selected.push({ ...record, url, source_bucket: bucket });
    }
  }
  return selected;
}

function stage4SourceRecords(sourceBundle, familyFilter = null) {
  return (sourceBundle.raw_footprint?.source_records || [])
    .filter((record) => !familyFilter || record.source_family === familyFilter)
    .map((record) => ({
      evidence_source_id: record.evidence_source_id,
      source_family: record.source_family,
      url: record.url,
      final_url: record.final_url,
      title: record.structure?.title || record.title || "",
      word_count: record.text?.word_count || 0,
      clean_text_lossless: record.text?.clean_text_lossless || ""
    }));
}

if (!token) fail("RUNTIME_ACCESS_TOKEN is required");

const base = normalizeBase(runtimeUrl);
const targetInput = { primary_url: primaryUrl, company_name: companyName, submitted_at: new Date().toISOString() };

console.log(JSON.stringify({
  ok: true,
  step: "start",
  phase: "stage_4_company_profile_e2e_full_sweep",
  target: targetInput,
  runtime_url: base,
  gemini_execution: "remote_runtime",
  stage_source_policy: "stage4_full_profile_all_routed_families_no_source_caps"
}, null, 2));

const discoveryResponse = await postJson(base, "/v1/source-discovery", {
  input: targetInput,
  options: {
    sourceDiscoveryMode: process.env.STAGE4_SOURCE_DISCOVERY_MODE || "sync_with_free_search",
    runFreeFirstPartySearch: process.env.STAGE4_RUN_FREE_SEARCH === "false" ? false : true,
    anchorFetchMaxAnchors: Number(process.env.STAGE4_ANCHOR_FETCH_MAX || 60),
    anchorLinkLimit: Number(process.env.STAGE4_ANCHOR_LINK_LIMIT || 100000),
    anchorClassifyMaxOutputTokens: Number(process.env.STAGE4_ANCHOR_CLASSIFY_TOKENS || 8192),
    probe_timeout_ms: Number(process.env.STAGE4_PROBE_TIMEOUT_MS || 8000)
  }
});

const sources = collectSources(discoveryResponse.discovery);
if (!sources.length) fail("Source discovery returned no capturable sources", { counts: discoveryResponse.discovery?.counts || null });
console.log(JSON.stringify({ ok: true, step: "source_discovery_complete_full_sweep", source_count: sources.length, counts: discoveryResponse.discovery?.counts || null }, null, 2));

const captureResponse = await postJson(base, "/v1/source-capture", {
  input: { sources },
  options: {
    timeout_ms: Number(process.env.STAGE4_CAPTURE_TIMEOUT_MS || 24000),
    max_fetch_bytes: Number(process.env.STAGE4_CAPTURE_MAX_BYTES || 30 * 1024 * 1024),
    include_clean_text: true
  }
});

const sourceBundle = buildEvidenceRefinerInput({ targetInput, discoveryResponse, captureResponse, runId: `stage4_source_bundle_${Date.now()}` });
const junction = buildEvidenceJunction({ sourceBundle, runId: `stage4_junction_${Date.now()}` });
const targetProfileSources = stage4SourceRecords(sourceBundle);
const companyProfileSources = stage4SourceRecords(sourceBundle, "company_profile");
if (!targetProfileSources.length) fail("No Stage 4 target profile source records available", { source_counts: sourceBundle.scrape_meta?.coverage_summary?.source_counts || {} });

const stageInput = {
  target_input: targetInput,
  source_bundle_version: sourceBundle.source_bundle_version,
  source_bundle_sha256: junction.source_bundle_sha256 || null,
  evidence_junction_version: junction.evidence_junction_version,
  target_profile_sources: targetProfileSources,
  company_profile_sources: companyProfileSources,
  input_policy: {
    target_profile_source_packet: true,
    company_family_only: false,
    product_feature_mapping_forbidden: true,
    legal_review_forbidden: true,
    registry_evaluation_forbidden: true,
    outside_browsing_forbidden: true
  }
};

const stageResult = await postJson(base, "/v1/diligence/stage", {
  stage: "company_profile",
  input: stageInput,
  options: {
    pool: process.env.STAGE4_COMPANY_POOL || process.env.STAGE4_POOL || "reasoning",
    maxOutputTokens: Number(process.env.STAGE4_COMPANY_MAX_OUTPUT_TOKENS || 24000),
    timeoutMs: Number(process.env.STAGE4_COMPANY_TIMEOUT_MS || 90000)
  }
});

if (!stageResult.ok) fail("Company Profile stage failed", stageResult);
const profile = stageResult.company_profile;
if (!profile || typeof profile !== "object") fail("Company Profile stage returned no profile object", stageResult);
if (profile.target_profile_version !== "target_profile_v2") {
  fail("Bad target profile version", {
    target_profile_version: profile.target_profile_version || null,
    legacy_company_profile_version: profile.company_profile_version || null,
    top_level_keys: Object.keys(profile || {})
  });
}

writeJson(cachePath, {
  cache_version: "stage4_company_profile_e2e_cache_v2_full_sweep",
  generated_at: new Date().toISOString(),
  target_input: targetInput,
  stage_source_policy: "stage4_full_profile_all_routed_families_no_source_caps",
  source_bundle: sourceBundle,
  evidence_junction: junction,
  company_profile_stage_result: stageResult,
  company_profile: profile,
  target_profile_v2: profile
});

console.log(JSON.stringify({
  ok: true,
  phase: "stage_4_company_profile_e2e_full_sweep",
  gemini_execution: "remote_runtime",
  stage_source_policy: "stage4_full_profile_all_routed_families_no_source_caps",
  source_bundle_version: sourceBundle.source_bundle_version,
  evidence_junction_version: junction.evidence_junction_version,
  target_profile_version: profile.target_profile_version,
  target_profile_sources: targetProfileSources.length,
  company_sources: companyProfileSources.length,
  brand_name: profile.identity?.brand_name || null,
  legal_name: profile.identity?.legal_name || null,
  entity_type: profile.identity?.entity_type || null,
  entity_type_family: profile.identity?.entity_type_family || null,
  registered_or_notice_country: profile.jurisdiction?.registered_or_notice_country || null,
  registered_or_notice_state: profile.jurisdiction?.registered_or_notice_state || null,
  market_type_candidate: profile.business_model?.market_type_candidate || null,
  industry: profile.market_context?.industry || null,
  high_level_offering: profile.product_baseline?.high_level_offering || null,
  product_count: Array.isArray(profile.product_baseline?.products) ? profile.product_baseline.products.length : 0,
  data_touchpoint_count: Array.isArray(profile.data_touchpoint_map) ? profile.data_touchpoint_map.length : 0,
  vault_baseline_candidate_keys: Object.keys(profile.vault_baseline_candidates || {}),
  field_evidence_refs: profile.evidence?.field_evidence_refs?.length || 0,
  unresolved_questions: profile.evidence?.unresolved_questions?.length || 0,
  limitations: profile.limitations || [],
  validation_mode: stageResult.validation_mode,
  cache_path: cachePath,
  cache_written: true,
  model_metadata: stageResult.model_metadata || null
}, null, 2));
