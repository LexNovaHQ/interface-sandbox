#!/usr/bin/env node

import { buildEvidenceRefinerInput } from "../src/diligence/adapters/sourceBundleAdapter.js";

const runtimeUrl = process.env.RUNTIME_URL || process.env.LEXNOVA_RUNTIME_URL;
const token = process.env.RUNTIME_ACCESS_TOKEN;
const primaryUrl = process.env.TEST_PRIMARY_URL || "https://sarvam.ai";
const companyName = process.env.TEST_COMPANY_NAME || "Sarvam AI";

const MAGNA_CARTA_BUCKETS = [
  "company_profile_sources",
  "product_profile_sources",
  "legal_profile_sources",
  "governance_profile_sources"
];

const MAGNA_CARTA_FAMILIES = [
  "company_profile",
  "product_profile",
  "legal_profile",
  "governance_profile"
];

function fail(message, detail) {
  console.error(JSON.stringify({ ok: false, error: message, detail: detail || null }, null, 2));
  process.exit(1);
}

function normalizeRuntimeUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const parsed = new URL(withScheme);
    if (!["http:", "https:"].includes(parsed.protocol)) throw new Error(`Unsupported protocol: ${parsed.protocol}`);
    return parsed.toString().replace(/\/+$/, "");
  } catch (error) {
    fail("RUNTIME_URL must be a valid http(s) URL or hostname", {
      received: raw,
      normalized_attempt: withScheme,
      error: error?.message || String(error)
    });
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

async function postJson(base, path, body) {
  const response = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-runtime-access-token": token },
    body: JSON.stringify(body)
  });
  const json = await readJson(response);
  if (!response.ok || json?.ok === false) fail(`Request failed: ${path}`, { status: response.status, body: json });
  return json;
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

function collectBucket(discovery = {}, bucket) {
  const out = [];
  const seen = new Set();
  for (const record of Array.isArray(discovery[bucket]) ? discovery[bucket] : []) {
    const url = normalizeUrl(record?.url || record?.final_url);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push({ ...record, url, source_bucket: bucket });
  }
  return out;
}

function collectSources(discovery = {}) {
  const limit = Number(process.env.STAGE2_CAPTURE_LIMIT || 16);
  const priorityBuckets = [
    ["legal_profile_sources", Number(process.env.STAGE2_LEGAL_CAPTURE_LIMIT || 3)],
    ["governance_profile_sources", Number(process.env.STAGE2_GOVERNANCE_CAPTURE_LIMIT || 3)],
    ["product_profile_sources", Number(process.env.STAGE2_PRODUCT_CAPTURE_LIMIT || 8)],
    ["company_profile_sources", Number(process.env.STAGE2_COMPANY_CAPTURE_LIMIT || 2)]
  ];

  const pools = Object.fromEntries(MAGNA_CARTA_BUCKETS.map((bucket) => [bucket, collectBucket(discovery, bucket)]));
  const selected = [];
  const seen = new Set();

  function add(record) {
    if (!record?.url || seen.has(record.url) || selected.length >= limit) return;
    seen.add(record.url);
    selected.push(record);
  }

  for (const [bucket, quota] of priorityBuckets) {
    for (const record of (pools[bucket] || []).slice(0, quota)) add(record);
  }

  for (const bucket of MAGNA_CARTA_BUCKETS) {
    for (const record of pools[bucket] || []) add(record);
  }

  if (selected.length === 0 && Array.isArray(discovery.candidate_sources)) {
    for (const record of discovery.candidate_sources) {
      const url = normalizeUrl(record?.url || record?.final_url);
      add({ ...record, url, source_bucket: "candidate_sources" });
    }
  }

  return selected;
}

if (!runtimeUrl) fail("RUNTIME_URL or LEXNOVA_RUNTIME_URL is required");
if (!token) fail("RUNTIME_ACCESS_TOKEN is required");

const base = normalizeRuntimeUrl(runtimeUrl);
const targetInput = { primary_url: primaryUrl, company_name: companyName, submitted_at: new Date().toISOString() };

console.log(JSON.stringify({
  ok: true,
  step: "start",
  phase: "stage_2_source_bundle_packager_e2e_magna_carta",
  target: targetInput,
  runtime_url: base,
  capture_limit: Number(process.env.STAGE2_CAPTURE_LIMIT || 16)
}, null, 2));

const discoveryResponse = await postJson(base, "/v1/source-discovery", {
  input: targetInput,
  options: {
    sourceDiscoveryMode: process.env.STAGE2_SOURCE_DISCOVERY_MODE || "sync_anchor_only",
    runFreeFirstPartySearch: process.env.STAGE2_RUN_FREE_SEARCH === "true",
    anchorFetchMaxAnchors: Number(process.env.STAGE2_ANCHOR_FETCH_MAX || 32),
    anchorLinkLimit: Number(process.env.STAGE2_ANCHOR_LINK_LIMIT || 120),
    anchorClassifyMaxOutputTokens: Number(process.env.STAGE2_ANCHOR_CLASSIFY_TOKENS || 8192),
    probe_timeout_ms: Number(process.env.STAGE2_PROBE_TIMEOUT_MS || 8000)
  }
});

const sources = collectSources(discoveryResponse.discovery);
if (sources.length === 0) {
  fail("Source discovery returned no capturable Magna Carta sources", {
    discovery_counts: discoveryResponse.discovery?.counts || null,
    coverage_gaps: discoveryResponse.discovery?.coverage_gaps || []
  });
}

console.log(JSON.stringify({
  ok: true,
  step: "source_discovery_complete",
  source_count: sources.length,
  discovery_counts: discoveryResponse.discovery?.counts || null,
  coverage_gaps: discoveryResponse.discovery?.coverage_gaps || []
}, null, 2));

const captureResponse = await postJson(base, "/v1/source-capture", {
  input: { sources },
  options: { timeout_ms: Number(process.env.STAGE2_CAPTURE_TIMEOUT_MS || 12000), max_sources: sources.length }
});

const bundleInput = buildEvidenceRefinerInput({
  targetInput,
  discoveryResponse,
  captureResponse,
  runId: `stage2_${Date.now()}`
});

const counts = bundleInput.scrape_meta?.coverage_summary?.source_counts || {};
const byFamily = bundleInput.scrape_meta?.coverage_summary?.by_family || {};
const duplicateCount = counts.duplicates_removed || 0;
const filteredCount = counts.filtered || 0;
const admittedCount = counts.admitted || 0;
const fetchOk = counts.fetch_ok || 0;
const totalWords = counts.total_words || 0;

if (bundleInput.source_bundle_version !== "source_bundle_v2_magna_carta") {
  fail("Stage 2 did not produce source_bundle_v2_magna_carta", { source_bundle_version: bundleInput.source_bundle_version });
}

if (admittedCount === 0 || fetchOk === 0 || totalWords === 0) {
  fail("Stage 2 source bundle packager produced no usable captured text", { source_counts: counts, by_family: byFamily });
}

const populatedFamilies = MAGNA_CARTA_FAMILIES.filter((family) => Array.isArray(byFamily[family]) && byFamily[family].length > 0);
if (populatedFamilies.length === 0) {
  fail("Stage 2 did not preserve any Magna Carta family evidence", { by_family: byFamily });
}

const records = bundleInput.raw_footprint?.source_records || [];
const missingLossless = records.filter((record) => !record?.text?.clean_text_lossless);
if (missingLossless.length > 0) {
  fail("Stage 2 admitted records missing clean_text_lossless", {
    missing: missingLossless.map((record) => ({ id: record.evidence_source_id, url: record.url, family: record.source_family }))
  });
}

console.log(JSON.stringify({
  ok: true,
  service: "lexnova-runtime-api",
  phase: "stage_2_source_bundle_packager_e2e_magna_carta",
  target: targetInput,
  run_id: bundleInput.run_id,
  source_bundle_version: bundleInput.source_bundle_version,
  source_counts: counts,
  populated_families: populatedFamilies,
  by_family: byFamily,
  duplicate_sources_removed: duplicateCount,
  filtered_sources: filteredCount,
  coverage_gaps: bundleInput.scrape_meta.coverage_summary.coverage_gaps,
  raw_footprint_sha256: bundleInput.scrape_meta.hashes.raw_footprint_sha256,
  deterministic_only: true,
  gemini_called: false
}, null, 2));
