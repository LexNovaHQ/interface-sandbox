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

  return [...byUrl.values()].slice(0, Number(process.env.STAGE2_CAPTURE_LIMIT || 8));
}

function stagePayload(stageResponse = {}) {
  return stageResponse.output || stageResponse.parsed_json || stageResponse.result?.json || stageResponse.result || stageResponse;
}

if (!runtimeUrl) {
  fail("RUNTIME_URL or LEXNOVA_RUNTIME_URL is required");
}

if (!token) {
  fail("RUNTIME_ACCESS_TOKEN is required");
}

const base = runtimeUrl.replace(/\/+$/, "");
const targetInput = {
  primary_url: primaryUrl,
  company_name: companyName,
  submitted_at: new Date().toISOString()
};

console.log(JSON.stringify({
  ok: true,
  step: "start",
  target: targetInput,
  runtime_url: base,
  capture_limit: Number(process.env.STAGE2_CAPTURE_LIMIT || 8)
}, null, 2));

const discoveryResponse = await postJson(base, "/v1/source-discovery", {
  input: targetInput,
  options: {
    max_search_results_per_family: Number(process.env.STAGE2_MAX_SEARCH_RESULTS_PER_FAMILY || 4),
    probe_timeout_ms: Number(process.env.STAGE2_PROBE_TIMEOUT_MS || 8000)
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
    timeout_ms: Number(process.env.STAGE2_CAPTURE_TIMEOUT_MS || 12000),
    max_sources: sources.length
  }
});

const evidenceInput = buildEvidenceRefinerInput({
  targetInput,
  discoveryResponse,
  captureResponse,
  runId: `stage2_${Date.now()}`
});

const capturedOk = evidenceInput.scrape_meta?.coverage_summary?.source_counts?.fetch_ok || 0;
const totalWords = evidenceInput.scrape_meta?.coverage_summary?.source_counts?.total_words || 0;

if (capturedOk === 0 || totalWords === 0) {
  fail("Source capture produced no usable text for Evidence Refiner", {
    source_counts: evidenceInput.scrape_meta?.coverage_summary?.source_counts || null,
    by_family: evidenceInput.scrape_meta?.coverage_summary?.by_family || null
  });
}

console.log(JSON.stringify({
  ok: true,
  step: "source_capture_and_adapter_complete",
  run_id: evidenceInput.run_id,
  source_counts: evidenceInput.scrape_meta.coverage_summary.source_counts,
  raw_footprint_sha256: evidenceInput.scrape_meta.hashes.raw_footprint_sha256
}, null, 2));

const evidenceRefinerResponse = await postJson(base, "/v1/diligence/stage", {
  stage: "evidence_refiner",
  input: evidenceInput,
  options: {
    poolAlias: "json"
  }
});

const output = stagePayload(evidenceRefinerResponse);
const outputJson = JSON.stringify(output || {});

if (!output || outputJson.length < 200) {
  fail("Evidence Refiner returned an unexpectedly small output", {
    response_keys: Object.keys(evidenceRefinerResponse || {}),
    output_preview: outputJson.slice(0, 1000)
  });
}

const summary = {
  ok: true,
  service: "lexnova-runtime-api",
  phase: "stage_2_evidence_refiner_e2e",
  target: targetInput,
  run_id: evidenceInput.run_id,
  source_counts: evidenceInput.scrape_meta.coverage_summary.source_counts,
  coverage_gaps: evidenceInput.scrape_meta.coverage_summary.coverage_gaps,
  stage: {
    ok: evidenceRefinerResponse.ok,
    stage_id: evidenceRefinerResponse.stage_id || evidenceRefinerResponse.stage,
    model_meta: evidenceRefinerResponse.model_meta || evidenceRefinerResponse.meta || null,
    output_keys: Object.keys(output || {}),
    output_preview: outputJson.slice(0, Number(process.env.STAGE2_OUTPUT_PREVIEW_CHARS || 3000))
  }
};

console.log(JSON.stringify(summary, null, 2));
