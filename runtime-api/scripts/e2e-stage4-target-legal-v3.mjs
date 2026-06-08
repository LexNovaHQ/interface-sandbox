#!/usr/bin/env node

import { buildEvidenceRefinerInput } from "../src/diligence/adapters/sourceBundleAdapter.js";

const runtimeUrl = process.env.RUNTIME_URL || process.env.LEXNOVA_RUNTIME_URL;
const token = process.env.RUNTIME_ACCESS_TOKEN;
const primaryUrl = process.env.TEST_PRIMARY_URL || "https://sarvam.ai";
const companyName = process.env.TEST_COMPANY_NAME || "Sarvam AI";
const BUCKETS = ["company_profile_sources", "product_profile_sources", "legal_profile_sources", "governance_profile_sources"];

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
    fail("RUNTIME_URL must be a valid http(s) URL or hostname", { received: raw, error: error?.message || String(error) });
  }
}

async function readJson(response) {
  const text = await response.text();
  try { return JSON.parse(text); } catch { return { non_json_body: text.slice(0, 3000) }; }
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
  } catch { return null; }
}

function collectBucket(discovery = {}, bucket) {
  const seen = new Set();
  const out = [];
  for (const record of Array.isArray(discovery[bucket]) ? discovery[bucket] : []) {
    const url = normalizeUrl(record?.url || record?.final_url);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push({ ...record, url, source_bucket: bucket });
  }
  return out;
}

function collectSources(discovery = {}) {
  const limit = Number(process.env.STAGE4_CAPTURE_LIMIT || 10);
  const priority = [
    ["legal_profile_sources", Number(process.env.STAGE4_LEGAL_CAPTURE_LIMIT || 3)],
    ["governance_profile_sources", Number(process.env.STAGE4_GOVERNANCE_CAPTURE_LIMIT || 2)],
    ["product_profile_sources", Number(process.env.STAGE4_PRODUCT_CAPTURE_LIMIT || 4)],
    ["company_profile_sources", Number(process.env.STAGE4_COMPANY_CAPTURE_LIMIT || 1)]
  ];
  const pools = Object.fromEntries(BUCKETS.map((bucket) => [bucket, collectBucket(discovery, bucket)]));
  const selected = [];
  const seen = new Set();
  const add = (record) => {
    if (!record?.url || seen.has(record.url) || selected.length >= limit) return;
    seen.add(record.url);
    selected.push(record);
  };
  for (const [bucket, quota] of priority) for (const record of (pools[bucket] || []).slice(0, quota)) add(record);
  for (const bucket of BUCKETS) for (const record of pools[bucket] || []) add(record);
  return selected;
}

function familyFootprint(evidenceInput, families) {
  const allowed = new Set(families);
  const raw = evidenceInput.raw_footprint || {};
  const source_records = (raw.source_records || []).filter((record) => allowed.has(record.source_family));
  return {
    ...raw,
    source_records,
    source_counts: {
      admitted: source_records.length,
      filtered: 0,
      duplicates_removed: 0,
      fetch_ok: source_records.filter((record) => record.fetch?.ok !== false).length,
      total_words: source_records.reduce((sum, record) => sum + Number(record.text?.word_count || 0), 0)
    }
  };
}

function compactEvidence(evidenceInput) {
  const records = evidenceInput.raw_footprint?.source_records || [];
  return {
    run_id: evidenceInput.run_id,
    source_bundle_version: evidenceInput.source_bundle_version,
    source_review: {
      summary: `Stage 4 E2E captured ${records.length} admitted first-party sources. Evidence refiner is bypassed in this harness to avoid full-bundle echo before target/legal review.`,
      pages_attempted: records.length,
      pages_admitted: records.length,
      limitations: ["Evidence refiner full-bundle echo bypassed only for Stage 4 E2E token control."]
    },
    artifact_inventory: records.map((record) => ({
      artifact_id: record.evidence_source_id,
      source_url: record.final_url || record.url,
      source_family: record.source_family,
      source_hash: record.text?.clean_text_sha256 || null,
      word_count: record.text?.word_count || 0,
      status: "INGESTED"
    }))
  };
}

function payload(response = {}) {
  return response.output || response.parsed_json || response.result?.json || response.result || response;
}

function stable(value) { return JSON.stringify(value || {}); }

function auditSources(evidenceInput) {
  const records = evidenceInput.raw_footprint?.source_records || [];
  const items = records.map((record) => ({ id: record.evidence_source_id, url: record.final_url || record.url, family: record.source_family, hash: record.text?.clean_text_sha256 || null }));
  return {
    all: items,
    product: items.filter((item) => item.family === "product_profile"),
    legal: items.filter((item) => item.family === "legal_profile"),
    governance: items.filter((item) => item.family === "governance_profile")
  };
}

function requireTrace(stageName, output, candidates) {
  const json = stable(output);
  const hit = candidates.some((candidate) => [candidate.id, candidate.url, candidate.hash].filter(Boolean).some((token) => json.includes(token)));
  if (!hit) fail(`${stageName} output has no admitted-source trace`, { candidates: candidates.slice(0, 10), output_keys: Object.keys(output || {}), preview: json.slice(0, 2000) });
}

function legalContext(evidenceInput) {
  const docs = (evidenceInput.raw_footprint?.source_records || [])
    .filter((record) => ["legal_profile", "governance_profile"].includes(record.source_family))
    .map((record) => ({
      evidence_source_id: record.evidence_source_id,
      url: record.final_url || record.url,
      source_family: record.source_family,
      title: record.structure?.title || "",
      clean_text_sha256: record.text?.clean_text_sha256 || null,
      word_count: record.text?.word_count || 0,
      clean_text_lossless: record.text?.clean_text_lossless || ""
    }))
    .filter((doc) => doc.url && doc.clean_text_lossless);
  if (!docs.length) fail("No legal/governance full text captured", { sources: auditSources(evidenceInput).all });
  return {
    instruction: "Use full admitted legal_profile and governance_profile documents. Check embedded DPA, SLA, AUP, subprocessor, trust, security, support, annexure, addendum, and incorporated-section evidence before marking absent.",
    legal_governance_documents: docs,
    legal_profile_documents: docs.filter((doc) => doc.source_family === "legal_profile"),
    governance_profile_documents: docs.filter((doc) => doc.source_family === "governance_profile")
  };
}

function sarvamGuard(ctx) {
  const isSarvam = /sarvam\.ai/i.test(primaryUrl) || /sarvam/i.test(companyName);
  if (!isSarvam) return { fixture_applied: false };
  const text = ctx.legal_governance_documents.map((doc) => doc.clean_text_lossless).join("\n\n");
  return {
    fixture_applied: true,
    hasDpaEvidence: /data processing addendum|\bDPA\b|annexure\s+c/i.test(text),
    hasSlaEvidence: /service level agreement|\bSLA\b|annexure\s+a/i.test(text)
  };
}

if (!runtimeUrl) fail("RUNTIME_URL or LEXNOVA_RUNTIME_URL is required");
if (!token) fail("RUNTIME_ACCESS_TOKEN is required");

const base = normalizeRuntimeUrl(runtimeUrl);
const targetInput = { primary_url: primaryUrl, company_name: companyName, submitted_at: new Date().toISOString() };
console.log(JSON.stringify({ ok: true, step: "start", phase: "stage_4_target_and_legal_e2e_magna_carta", target: targetInput, runtime_url: base }, null, 2));

const discoveryResponse = await postJson(base, "/v1/source-discovery", {
  input: targetInput,
  options: {
    sourceDiscoveryMode: process.env.STAGE4_SOURCE_DISCOVERY_MODE || "sync_anchor_only",
    runFreeFirstPartySearch: process.env.STAGE4_RUN_FREE_SEARCH === "true",
    anchorFetchMaxAnchors: Number(process.env.STAGE4_ANCHOR_FETCH_MAX || 32),
    anchorLinkLimit: Number(process.env.STAGE4_ANCHOR_LINK_LIMIT || 120),
    anchorClassifyMaxOutputTokens: Number(process.env.STAGE4_ANCHOR_CLASSIFY_TOKENS || 8192),
    probe_timeout_ms: Number(process.env.STAGE4_PROBE_TIMEOUT_MS || 8000)
  }
});

const sources = collectSources(discoveryResponse.discovery);
if (!sources.length) fail("Source discovery returned no capturable Magna Carta sources", { counts: discoveryResponse.discovery?.counts || null });

const captureResponse = await postJson(base, "/v1/source-capture", { input: { sources }, options: { timeout_ms: Number(process.env.STAGE4_CAPTURE_TIMEOUT_MS || 12000), max_sources: sources.length } });
const evidenceInput = buildEvidenceRefinerInput({ targetInput, discoveryResponse, captureResponse, runId: `stage4_${Date.now()}` });
const audit = auditSources(evidenceInput);
if (!audit.product.length) fail("No product_profile sources available", { admitted: audit.all });
if (!audit.legal.length) fail("No legal_profile sources available", { admitted: audit.all });

const evidenceRefiner = compactEvidence(evidenceInput);
const productFootprint = familyFootprint(evidenceInput, ["company_profile", "product_profile"]);
const legalFootprint = familyFootprint(evidenceInput, ["legal_profile", "governance_profile"]);

const targetFeatureResponse = await postJson(base, "/v1/diligence/stage", {
  stage: "target_feature_profile",
  input: { target_input: targetInput, evidence_refiner: evidenceRefiner, source_bundle: productFootprint, source_discovery: evidenceInput.source_discovery },
  options: { poolAlias: "reasoning" }
});
const targetFeatureProfile = payload(targetFeatureResponse);
requireTrace("Target Feature Profile", targetFeatureProfile, audit.product);

const ctx = legalContext(evidenceInput);
const legalStackResponse = await postJson(base, "/v1/diligence/stage", {
  stage: "legal_stack_review",
  input: { target_input: targetInput, evidence_refiner: evidenceRefiner, target_feature_profile: targetFeatureProfile, source_bundle: legalFootprint, legal_evidence_context: ctx },
  options: { poolAlias: "reasoning" }
});
const legalStackReview = payload(legalStackResponse);
requireTrace("Legal Stack Review", legalStackReview, audit.legal);

console.log(JSON.stringify({
  ok: true,
  service: "lexnova-runtime-api",
  phase: "stage_4_target_and_legal_e2e_magna_carta",
  target: targetInput,
  run_id: evidenceInput.run_id,
  source_bundle_version: evidenceInput.source_bundle_version,
  source_counts: evidenceInput.scrape_meta.coverage_summary.source_counts,
  by_family: evidenceInput.scrape_meta.coverage_summary.by_family,
  stage_outputs: {
    evidence_refiner: { ok: true, mode: "bypassed_compact_for_stage4_e2e" },
    target_feature_profile: { ok: targetFeatureResponse.ok, output_keys: Object.keys(targetFeatureProfile || {}) },
    legal_stack_review: { ok: legalStackResponse.ok, output_keys: Object.keys(legalStackReview || {}), embedded_artifact_guard: sarvamGuard(ctx) }
  }
}, null, 2));
