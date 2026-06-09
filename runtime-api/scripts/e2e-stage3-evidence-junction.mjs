#!/usr/bin/env node

import { buildEvidenceRefinerInput } from "../src/diligence/adapters/sourceBundleAdapter.js";
import { buildEvidenceJunction } from "../src/diligence/evidenceJunction.js";

const runtimeUrl = process.env.RUNTIME_URL || process.env.LEXNOVA_RUNTIME_URL;
const token = process.env.RUNTIME_ACCESS_TOKEN;
const primaryUrl = process.env.TEST_PRIMARY_URL || "https://sarvam.ai";
const companyName = process.env.TEST_COMPANY_NAME || "Sarvam AI";

const BUCKETS = ["company_profile_sources", "product_profile_sources", "legal_profile_sources", "governance_profile_sources"];
const FAMILIES = ["company_profile", "product_profile", "legal_profile", "governance_profile"];
const STAGE_KEYS = ["target_feature_profile", "legal_stack_review", "governance_review", "registry_matching", "final_report_compiler"];

function fail(message, detail) {
  console.error(JSON.stringify({ ok: false, error: message, detail: detail || null }, null, 2));
  process.exit(1);
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

async function readJson(response) {
  const text = await response.text();
  try { return JSON.parse(text); }
  catch { return { non_json_body: text.slice(0, 3000) }; }
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
  const limit = Number(process.env.STAGE3_CAPTURE_LIMIT || process.env.STAGE2_CAPTURE_LIMIT || 16);
  const quotas = [
    ["legal_profile_sources", Number(process.env.STAGE3_LEGAL_CAPTURE_LIMIT || 3)],
    ["governance_profile_sources", Number(process.env.STAGE3_GOVERNANCE_CAPTURE_LIMIT || 3)],
    ["product_profile_sources", Number(process.env.STAGE3_PRODUCT_CAPTURE_LIMIT || 8)],
    ["company_profile_sources", Number(process.env.STAGE3_COMPANY_CAPTURE_LIMIT || 2)]
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

if (!runtimeUrl) fail("RUNTIME_URL or LEXNOVA_RUNTIME_URL is required");
if (!token) fail("RUNTIME_ACCESS_TOKEN is required");

const base = normalizeBase(runtimeUrl);
const targetInput = { primary_url: primaryUrl, company_name: companyName, submitted_at: new Date().toISOString() };

console.log(JSON.stringify({ ok: true, step: "start", phase: "stage_3_evidence_junction_e2e", target: targetInput, runtime_url: base, gemini_enabled: false, gemini_status: "parked" }, null, 2));

const discoveryResponse = await postJson(base, "/v1/source-discovery", {
  input: targetInput,
  options: {
    sourceDiscoveryMode: process.env.STAGE3_SOURCE_DISCOVERY_MODE || "sync_anchor_only",
    runFreeFirstPartySearch: process.env.STAGE3_RUN_FREE_SEARCH === "true",
    anchorFetchMaxAnchors: Number(process.env.STAGE3_ANCHOR_FETCH_MAX || 32),
    anchorLinkLimit: Number(process.env.STAGE3_ANCHOR_LINK_LIMIT || 120),
    anchorClassifyMaxOutputTokens: Number(process.env.STAGE3_ANCHOR_CLASSIFY_TOKENS || 8192),
    probe_timeout_ms: Number(process.env.STAGE3_PROBE_TIMEOUT_MS || 8000)
  }
});

const sources = collectSources(discoveryResponse.discovery);
if (!sources.length) fail("Source discovery returned no capturable sources", { counts: discoveryResponse.discovery?.counts || null });
console.log(JSON.stringify({ ok: true, step: "source_discovery_complete", source_count: sources.length, counts: discoveryResponse.discovery?.counts || null }, null, 2));

const captureResponse = await postJson(base, "/v1/source-capture", {
  input: { sources },
  options: { timeout_ms: Number(process.env.STAGE3_CAPTURE_TIMEOUT_MS || 12000), max_sources: sources.length }
});

const sourceBundle = buildEvidenceRefinerInput({
  targetInput,
  discoveryResponse,
  captureResponse,
  runId: `stage3_source_bundle_${Date.now()}`
});

const junction = buildEvidenceJunction({
  sourceBundle,
  runId: `stage3_junction_${Date.now()}`
});

const packets = Object.fromEntries(STAGE_KEYS.map((key) => [key, junction.downstream_packets?.[key]?.source_count || 0]));
const missingPackets = STAGE_KEYS.filter((key) => !junction.downstream_packets?.[key]);
const flags = junction.processing_manifest || {};

if (sourceBundle.source_bundle_version !== "source_bundle_v2_magna_carta") fail("Bad source bundle version", { version: sourceBundle.source_bundle_version });
if (junction.evidence_junction_version !== "evidence_junction_v1") fail("Bad evidence junction version", { version: junction.evidence_junction_version });
if (missingPackets.length) fail("Missing downstream packets", { missingPackets });
if (flags.source_text_summarized !== false || flags.source_text_compressed !== false || flags.source_text_truncated !== false) fail("Stage 3 violated no-loss policy", { processing_manifest: flags });
if (flags.gemini_called !== false) fail("Stage 3 must not call Gemini", { processing_manifest: flags });

console.log(JSON.stringify({
  ok: true,
  phase: "stage_3_evidence_junction_e2e",
  target: targetInput,
  source_bundle_version: sourceBundle.source_bundle_version,
  evidence_junction_version: junction.evidence_junction_version,
  source_counts: sourceBundle.scrape_meta?.coverage_summary?.source_counts || {},
  populated_families: FAMILIES.filter((family) => Array.isArray(sourceBundle.scrape_meta?.coverage_summary?.by_family?.[family]) && sourceBundle.scrape_meta.coverage_summary.by_family[family].length > 0),
  downstream_packets: packets,
  dedupe_groups: junction.dedupe_groups?.length || 0,
  gemini_enabled: false,
  gemini_status: "parked_for_stage_4_boundary_decision",
  gemini_called: flags.gemini_called === true,
  source_archive_preserved: flags.source_archive_preserved === true,
  source_text_mutated: flags.source_text_mutated === true,
  source_text_summarized: flags.source_text_summarized === true,
  source_text_compressed: flags.source_text_compressed === true,
  source_text_truncated: flags.source_text_truncated === true,
  source_bundle_sha256: junction.source_bundle_sha256 || null
}, null, 2));
