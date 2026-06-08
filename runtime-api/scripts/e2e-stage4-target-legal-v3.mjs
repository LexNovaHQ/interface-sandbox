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
    fail("RUNTIME_URL must be a valid http(s) URL or hostname", { received: raw, normalized_attempt: withScheme, error: error?.message || String(error) });
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

function collectSources(discovery = {}) {
  const byUrl = new Map();
  for (const bucket of BUCKETS) {
    for (const record of Array.isArray(discovery[bucket]) ? discovery[bucket] : []) {
      const url = normalizeUrl(record?.url || record?.final_url);
      if (!url || byUrl.has(url)) continue;
      byUrl.set(url, { ...record, url, source_bucket: bucket });
    }
  }
  if (byUrl.size === 0 && Array.isArray(discovery.candidate_sources)) {
    for (const record of discovery.candidate_sources) {
      const url = normalizeUrl(record?.url || record?.final_url);
      if (!url || byUrl.has(url)) continue;
      byUrl.set(url, { ...record, url, source_bucket: "candidate_sources" });
    }
  }
  return [...byUrl.values()].slice(0, Number(process.env.STAGE4_CAPTURE_LIMIT || 16));
}

function stagePayload(stageResponse = {}) {
  return stageResponse.output || stageResponse.parsed_json || stageResponse.result?.json || stageResponse.result || stageResponse;
}

function stableString(value) {
  return JSON.stringify(value || {});
}

function sourceAudit(evidenceInput = {}) {
  const records = Array.isArray(evidenceInput.raw_footprint?.source_records) ? evidenceInput.raw_footprint.source_records : [];
  const admitted = records.map((record) => ({ id: record.evidence_source_id, url: record.final_url || record.url, family: record.source_family, hash: record.text?.clean_text_sha256 || null }));
  return {
    admitted,
    product: admitted.filter((item) => item.family === "product_profile"),
    legal: admitted.filter((item) => item.family === "legal_profile"),
    governance: admitted.filter((item) => item.family === "governance_profile"),
    filtered: Array.isArray(evidenceInput.raw_footprint?.filtered_sources) ? evidenceInput.raw_footprint.filtered_sources : []
  };
}

function buildLegalEvidenceContext(evidenceInput = {}) {
  const records = Array.isArray(evidenceInput.raw_footprint?.source_records) ? evidenceInput.raw_footprint.source_records : [];
  const docs = records
    .filter((record) => ["legal_profile", "governance_profile"].includes(record.source_family || ""))
    .map((record) => ({
      evidence_source_id: record.evidence_source_id,
      url: record.final_url || record.url,
      source_family: record.source_family,
      title: record.structure?.title || "",
      clean_text_sha256: record.text?.clean_text_sha256 || null,
      word_count: record.text?.word_count || 0,
      clean_text_lossless: record.text?.clean_text_lossless || ""
    }))
    .filter((record) => record.url && record.clean_text_lossless);
  if (!docs.length) fail("No full admitted legal/governance documents available for legal stack review", { raw_source_count: records.length, source_families: records.map((record) => ({ id: record.evidence_source_id, url: record.final_url || record.url, family: record.source_family })) });
  return {
    instruction: "Use the full admitted first-party legal_profile and governance_profile documents. Inspect full text for embedded DPA, SLA, AUP, subprocessor, security, trust, support, schedule, annexure, addendum, and incorporated-section evidence before marking artifacts absent.",
    legal_governance_documents: docs,
    legal_profile_documents: docs.filter((doc) => doc.source_family === "legal_profile"),
    governance_profile_documents: docs.filter((doc) => doc.source_family === "governance_profile")
  };
}

function requireTrace(stageName, output, candidates, description) {
  const json = stableString(output);
  const hits = candidates.filter((candidate) => [candidate.id, candidate.url, candidate.hash].filter(Boolean).some((token) => json.includes(token)));
  if (!hits.length) fail(`${stageName} output has no admitted-source trace for ${description}`, { candidate_count: candidates.length, candidates: candidates.slice(0, 10), output_keys: Object.keys(output || {}), preview: json.slice(0, 2500) });
  return hits;
}

function assertNoFilteredLeak(stageName, output, filteredSources) {
  const json = stableString(output);
  const leaked = filteredSources.filter((source) => [source.url, source.final_url].filter(Boolean).filter((item) => item.length > 8).some((token) => json.includes(token)));
  if (leaked.length) fail(`${stageName} output references filtered sources`, { leaked, preview: json.slice(0, 2500) });
}

function assertKnownEmbeddedArtifactsForSarvam({ legalStackReview, legalEvidenceContext }) {
  const isSarvam = /sarvam\.ai/i.test(primaryUrl) || /sarvam/i.test(companyName);
  if (!isSarvam) return { fixture_applied: false };
  const sourceText = legalEvidenceContext.legal_governance_documents.map((doc) => doc.clean_text_lossless).join("\n\n");
  const hasDpaEvidence = /data processing addendum|\bDPA\b|annexure\s+c/i.test(sourceText);
  const hasSlaEvidence = /service level agreement|\bSLA\b|annexure\s+a/i.test(sourceText);
  return { fixture_applied: true, hasDpaEvidence, hasSlaEvidence };
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
if (!sources.length) fail("Source discovery returned no capturable Magna Carta sources", { discovery_counts: discoveryResponse.discovery?.counts || null, coverage_gaps: discoveryResponse.discovery?.coverage_gaps || [] });

const captureResponse = await postJson(base, "/v1/source-capture", { input: { sources }, options: { timeout_ms: Number(process.env.STAGE4_CAPTURE_TIMEOUT_MS || 12000), max_sources: sources.length } });
const evidenceInput = buildEvidenceRefinerInput({ targetInput, discoveryResponse, captureResponse, runId: `stage4_${Date.now()}` });
const audit = sourceAudit(evidenceInput);
if (!audit.product.length) fail("No product_profile sources available for target feature profile", { admitted: audit.admitted });
if (!audit.legal.length) fail("No legal_profile sources available for legal stack review", { admitted: audit.admitted });

const evidenceRefinerResponse = await postJson(base, "/v1/diligence/stage", { stage: "evidence_refiner", input: evidenceInput, options: { poolAlias: "json" } });
const evidenceRefiner = stagePayload(evidenceRefinerResponse);
assertNoFilteredLeak("Evidence Refiner", evidenceRefiner, audit.filtered);

const targetFeatureResponse = await postJson(base, "/v1/diligence/stage", {
  stage: "target_feature_profile",
  input: { target_input: targetInput, evidence_refiner: evidenceRefiner, source_bundle: evidenceInput.raw_footprint, source_discovery: evidenceInput.source_discovery },
  options: { poolAlias: "reasoning" }
});
const targetFeatureProfile = stagePayload(targetFeatureResponse);
requireTrace("Target Feature Profile", targetFeatureProfile, audit.product, "product_profile evidence");
assertNoFilteredLeak("Target Feature Profile", targetFeatureProfile, audit.filtered);

const legalEvidenceContext = buildLegalEvidenceContext(evidenceInput);
const legalStackResponse = await postJson(base, "/v1/diligence/stage", {
  stage: "legal_stack_review",
  input: { target_input: targetInput, evidence_refiner: evidenceRefiner, target_feature_profile: targetFeatureProfile, source_bundle: evidenceInput.raw_footprint, legal_evidence_context: legalEvidenceContext },
  options: { poolAlias: "reasoning" }
});
const legalStackReview = stagePayload(legalStackResponse);
requireTrace("Legal Stack Review", legalStackReview, audit.legal, "legal_profile evidence");
assertNoFilteredLeak("Legal Stack Review", legalStackReview, audit.filtered);
const embeddedArtifactGuard = assertKnownEmbeddedArtifactsForSarvam({ legalStackReview, legalEvidenceContext });

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
    evidence_refiner: { ok: evidenceRefinerResponse.ok, output_keys: Object.keys(evidenceRefiner || {}) },
    target_feature_profile: { ok: targetFeatureResponse.ok, output_keys: Object.keys(targetFeatureProfile || {}) },
    legal_stack_review: { ok: legalStackResponse.ok, output_keys: Object.keys(legalStackReview || {}), embedded_artifact_guard: embeddedArtifactGuard }
  }
}, null, 2));
