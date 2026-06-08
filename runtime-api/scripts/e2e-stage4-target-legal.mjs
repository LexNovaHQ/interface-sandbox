#!/usr/bin/env node

import { buildEvidenceRefinerInput } from "../src/diligence/adapters/sourceBundleAdapter.js";

const runtimeUrl = process.env.RUNTIME_URL || process.env.LEXNOVA_RUNTIME_URL;
const token = process.env.RUNTIME_ACCESS_TOKEN;
const primaryUrl = process.env.TEST_PRIMARY_URL || "https://sarvam.ai";
const companyName = process.env.TEST_COMPANY_NAME || "Sarvam AI";

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
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error(`Unsupported protocol: ${parsed.protocol}`);
    }
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
    headers: {
      "content-type": "application/json",
      "x-runtime-access-token": token
    },
    body: JSON.stringify(body)
  });

  const json = await readJson(response);
  if (!response.ok || json?.ok === false) {
    fail(`Request failed: ${path}`, { status: response.status, body: json });
  }

  return json;
}

function collectSources(discovery = {}) {
  const buckets = [
    "product_profile_sources",
    "legal_governance_sources",
    "docs_developer_sources",
    "commercial_sources",
    "update_sources"
  ];

  const byUrl = new Map();

  for (const bucket of buckets) {
    const records = Array.isArray(discovery[bucket]) ? discovery[bucket] : [];
    for (const record of records) {
      if (!record?.url || byUrl.has(record.url)) continue;
      byUrl.set(record.url, { ...record, source_bucket: bucket });
    }
  }

  if (byUrl.size === 0 && Array.isArray(discovery.candidate_sources)) {
    for (const record of discovery.candidate_sources) {
      if (!record?.url || byUrl.has(record.url)) continue;
      byUrl.set(record.url, { ...record, source_bucket: "candidate_sources" });
    }
  }

  return [...byUrl.values()].slice(0, Number(process.env.STAGE4_CAPTURE_LIMIT || 8));
}

function preview(value, maxChars = Number(process.env.STAGE4_OUTPUT_PREVIEW_CHARS || 3500)) {
  return JSON.stringify(value || {}).slice(0, maxChars);
}

function countPossibleFeatures(targetFeatureProfile = {}) {
  const json = JSON.stringify(targetFeatureProfile || {});
  const structuralCount = [
    targetFeatureProfile.features,
    targetFeatureProfile.product_features,
    targetFeatureProfile.atomic_features,
    targetFeatureProfile.feature_inventory,
    targetFeatureProfile.target_features
  ].reduce((sum, value) => sum + (Array.isArray(value) ? value.length : 0), 0);

  const keywordHits = (json.match(/feature|model|api|developer|platform|product|classification|INT|EXT|UNI/gi) || []).length;
  return { structural_count: structuralCount, keyword_hits: keywordHits };
}

function countPossibleLegalFindings(legalStackReview = {}) {
  const json = JSON.stringify(legalStackReview || {});
  const structuralCount = [
    legalStackReview.legal_documents,
    legalStackReview.document_inventory,
    legalStackReview.governance_documents,
    legalStackReview.stack_findings,
    legalStackReview.legal_stack_findings,
    legalStackReview.gaps,
    legalStackReview.risks
  ].reduce((sum, value) => sum + (Array.isArray(value) ? value.length : 0), 0);

  const keywordHits = (json.match(/terms|privacy|dpa|processor|governance|legal|risk|gap|policy|sla|data/gi) || []).length;
  return { structural_count: structuralCount, keyword_hits: keywordHits };
}

if (!runtimeUrl) {
  fail("RUNTIME_URL or LEXNOVA_RUNTIME_URL is required");
}

if (!token) {
  fail("RUNTIME_ACCESS_TOKEN is required");
}

const base = normalizeRuntimeUrl(runtimeUrl);
const targetInput = {
  primary_url: primaryUrl,
  company_name: companyName,
  submitted_at: new Date().toISOString()
};

console.log(JSON.stringify({
  ok: true,
  step: "start",
  phase: "stage_4_target_feature_and_legal_stack_e2e",
  target: targetInput,
  runtime_url: base,
  capture_limit: Number(process.env.STAGE4_CAPTURE_LIMIT || 8)
}, null, 2));

const discoveryResponse = await postJson(base, "/v1/source-discovery", {
  input: targetInput,
  options: {
    max_search_results_per_family: Number(process.env.STAGE4_MAX_SEARCH_RESULTS_PER_FAMILY || 4),
    probe_timeout_ms: Number(process.env.STAGE4_PROBE_TIMEOUT_MS || 8000)
  }
});

const sources = collectSources(discoveryResponse.discovery);
if (sources.length === 0) {
  fail("Source discovery returned no capturable sources", {
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
  options: {
    timeout_ms: Number(process.env.STAGE4_CAPTURE_TIMEOUT_MS || 12000),
    max_sources: sources.length
  }
});

const evidenceInput = buildEvidenceRefinerInput({
  targetInput,
  discoveryResponse,
  captureResponse,
  runId: `stage4_${Date.now()}`
});

const sourceCounts = evidenceInput.scrape_meta?.coverage_summary?.source_counts || {};
if ((sourceCounts.fetch_ok || 0) === 0 || (sourceCounts.total_words || 0) === 0) {
  fail("Source capture produced no usable text", { source_counts: sourceCounts });
}

console.log(JSON.stringify({
  ok: true,
  step: "source_capture_and_adapter_complete",
  run_id: evidenceInput.run_id,
  source_counts: sourceCounts,
  raw_footprint_sha256: evidenceInput.scrape_meta.hashes.raw_footprint_sha256
}, null, 2));

const evidenceRefinerResponse = await postJson(base, "/v1/diligence/stage", {
  stage: "evidence_refiner",
  input: evidenceInput,
  options: { poolAlias: "json" }
});

const sourceBundle = evidenceRefinerResponse.source_bundle;
if (!sourceBundle || JSON.stringify(sourceBundle).length < 500) {
  fail("Evidence Refiner returned no usable source_bundle", {
    response_keys: Object.keys(evidenceRefinerResponse || {}),
    preview: preview(evidenceRefinerResponse)
  });
}

console.log(JSON.stringify({
  ok: true,
  step: "evidence_refiner_complete",
  output_schema_key: evidenceRefinerResponse.output_schema_key,
  source_bundle_keys: Object.keys(sourceBundle || {}),
  preview: preview(sourceBundle, Number(process.env.STAGE4_STEP_PREVIEW_CHARS || 1200))
}, null, 2));

const targetFeatureResponse = await postJson(base, "/v1/diligence/stage", {
  stage: "target_feature_profile",
  input: {
    source_bundle: sourceBundle
  },
  options: { poolAlias: "reasoning" }
});

const targetFeatureProfile = targetFeatureResponse.target_feature_profile;
const featureSignals = countPossibleFeatures(targetFeatureProfile);
if (!targetFeatureProfile || JSON.stringify(targetFeatureProfile).length < 500 || (featureSignals.structural_count === 0 && featureSignals.keyword_hits < 5)) {
  fail("Target Feature Profile returned an unexpectedly weak output", {
    response_keys: Object.keys(targetFeatureResponse || {}),
    feature_signals: featureSignals,
    preview: preview(targetFeatureResponse)
  });
}

console.log(JSON.stringify({
  ok: true,
  step: "target_feature_profile_complete",
  output_schema_key: targetFeatureResponse.output_schema_key,
  feature_signals: featureSignals,
  target_feature_profile_keys: Object.keys(targetFeatureProfile || {}),
  preview: preview(targetFeatureProfile, Number(process.env.STAGE4_STEP_PREVIEW_CHARS || 1200))
}, null, 2));

const legalStackResponse = await postJson(base, "/v1/diligence/stage", {
  stage: "legal_stack_review",
  input: {
    source_bundle: sourceBundle,
    target_feature_profile: targetFeatureProfile
  },
  options: { poolAlias: "reasoning" }
});

const legalStackReview = legalStackResponse.legal_stack_review;
const legalSignals = countPossibleLegalFindings(legalStackReview);
if (!legalStackReview || JSON.stringify(legalStackReview).length < 500 || (legalSignals.structural_count === 0 && legalSignals.keyword_hits < 5)) {
  fail("Legal Stack Review returned an unexpectedly weak output", {
    response_keys: Object.keys(legalStackResponse || {}),
    legal_signals: legalSignals,
    preview: preview(legalStackResponse)
  });
}

console.log(JSON.stringify({
  ok: true,
  service: "lexnova-runtime-api",
  phase: "stage_4_target_feature_and_legal_stack_e2e",
  target: targetInput,
  run_id: evidenceInput.run_id,
  source_counts: sourceCounts,
  coverage_gaps: evidenceInput.scrape_meta.coverage_summary.coverage_gaps,
  stages: {
    evidence_refiner: {
      ok: evidenceRefinerResponse.ok,
      output_schema_key: evidenceRefinerResponse.output_schema_key,
      model: evidenceRefinerResponse.model_metadata?.selected_model || null,
      source_bundle_keys: Object.keys(sourceBundle || {})
    },
    target_feature_profile: {
      ok: targetFeatureResponse.ok,
      output_schema_key: targetFeatureResponse.output_schema_key,
      model: targetFeatureResponse.model_metadata?.selected_model || null,
      feature_signals: featureSignals,
      output_keys: Object.keys(targetFeatureProfile || {}),
      preview: preview(targetFeatureProfile)
    },
    legal_stack_review: {
      ok: legalStackResponse.ok,
      output_schema_key: legalStackResponse.output_schema_key,
      model: legalStackResponse.model_metadata?.selected_model || null,
      legal_signals: legalSignals,
      output_keys: Object.keys(legalStackReview || {}),
      preview: preview(legalStackReview)
    }
  }
}, null, 2));
