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

function collectSources(discovery = {}) {
  const buckets = ["product_profile_sources", "legal_governance_sources", "docs_developer_sources", "commercial_sources", "update_sources"];
  const byUrl = new Map();
  for (const bucket of buckets) {
    for (const record of Array.isArray(discovery[bucket]) ? discovery[bucket] : []) {
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
  return [...byUrl.values()];
}

function normalizeUrl(value) {
  try {
    const parsed = new URL(String(value || ""));
    parsed.hash = "";
    parsed.search = "";
    return parsed.toString().replace(/\/+$/, "").toLowerCase();
  } catch {
    return String(value || "").replace(/\/+$/, "").toLowerCase();
  }
}

function urlIncludesAny(url, terms) {
  const normalized = normalizeUrl(url);
  return terms.some((term) => normalized.includes(term));
}

function isGeminiDiscovered(record) {
  return String(record.discovery_method || "").split("+").includes("gemini_search");
}

function isSupportDiscovered(record) {
  return String(record.discovery_method || "").split("+").includes("deterministic_support_probe");
}

function requiredSarvamProductChecks() {
  const isSarvam = /sarvam\.ai/i.test(primaryUrl) || /sarvam/i.test(companyName);
  if (!isSarvam) return [];
  return [
    { key: "models", label: "Models product page", terms: ["/models"] },
    { key: "samvaad", label: "Samvaad / conversational agents product page", terms: ["/products/conversational-agents", "/samvaad", "conversational-agents"] },
    { key: "studio", label: "Studio product page", terms: ["/products/studio", "/studio"] },
    { key: "akshar", label: "Akshar product page", terms: ["/products/akshar", "/akshar"] },
    { key: "arya", label: "Arya product page", terms: ["/products/arya", "/arya"] }
  ];
}

function flattenDiscoveryProvenance(diagnostics = {}) {
  const rows = [];
  const audit = Array.isArray(diagnostics.provenance_audit) ? diagnostics.provenance_audit : [];

  for (const family of audit) {
    const geminiAdmitted = family.gemini_primary?.admitted || [];
    const supportAdmitted = family.deterministic_support?.admitted || [];

    for (const record of geminiAdmitted) {
      rows.push({ ...record, provenance_layer: "source_discovery", provenance_family: family.source_family, provenance_role: "gemini_primary" });
    }

    for (const record of supportAdmitted) {
      rows.push({ ...record, provenance_layer: "source_discovery", provenance_family: family.source_family, provenance_role: "deterministic_support" });
    }
  }

  return rows;
}

function provenanceSummary(record) {
  return {
    url: record.url,
    source_family: record.source_family || record.provenance_family || null,
    discovery_method: record.discovery_method || null,
    discovery_role: record.discovery_role || record.provenance_role || null,
    provenance_role: record.provenance_role || null,
    batch_id: record.batch_id || null,
    reason: record.reason || "",
    status: record.status || null,
    http_status: record.http_status || null
  };
}

function evidenceSummary(record) {
  return {
    evidence_source_id: record.evidence_source_id,
    url: record.final_url || record.url,
    source_family: record.source_family,
    discovery_method: record.discovery?.discovery_method || record.discovery_method || null,
    title: record.structure?.title || "",
    word_count: record.text?.word_count || 0,
    clean_text_sha256: record.text?.clean_text_sha256 || null
  };
}

if (!runtimeUrl) fail("RUNTIME_URL or LEXNOVA_RUNTIME_URL is required");
if (!token) fail("RUNTIME_ACCESS_TOKEN is required");

const base = normalizeRuntimeUrl(runtimeUrl);
const targetInput = { primary_url: primaryUrl, company_name: companyName, submitted_at: new Date().toISOString() };
console.log(JSON.stringify({ ok: true, step: "start", phase: "product_source_discovery_audit", target: targetInput, runtime_url: base }, null, 2));

const discoveryResponse = await postJson(base, "/v1/source-discovery", {
  input: targetInput,
  options: {
    max_search_results_per_family: Number(process.env.PRODUCT_AUDIT_MAX_SEARCH_RESULTS_PER_FAMILY || 12),
    searchMaxOutputTokens: Number(process.env.PRODUCT_AUDIT_SEARCH_MAX_OUTPUT_TOKENS || 4096),
    probe_timeout_ms: Number(process.env.PRODUCT_AUDIT_PROBE_TIMEOUT_MS || 8000)
  }
});

const discoveryProvenanceRows = flattenDiscoveryProvenance(discoveryResponse.diagnostics);
const geminiProductDiscoveryRows = discoveryProvenanceRows.filter((record) => record.provenance_role === "gemini_primary" && /product_profile|docs_developer/i.test(record.source_family || record.provenance_family || ""));
const supportProductDiscoveryRows = discoveryProvenanceRows.filter((record) => record.provenance_role === "deterministic_support" && /product_profile|docs_developer/i.test(record.source_family || record.provenance_family || ""));

const sources = collectSources(discoveryResponse.discovery);
if (!sources.length) fail("Source discovery returned no capturable sources", { discovery_counts: discoveryResponse.discovery?.counts || null });

const captureResponse = await postJson(base, "/v1/source-capture", {
  input: { sources },
  options: {
    timeout_ms: Number(process.env.PRODUCT_AUDIT_CAPTURE_TIMEOUT_MS || 12000),
    max_sources: Number(process.env.PRODUCT_AUDIT_CAPTURE_LIMIT || 24)
  }
});

const evidenceInput = buildEvidenceRefinerInput({ targetInput, discoveryResponse, captureResponse, runId: `product_audit_${Date.now()}` });
const admittedRecords = evidenceInput.raw_footprint?.source_records || [];
const productRecords = admittedRecords.filter((record) => /product_profile|docs_developer/i.test(record.source_family || ""));
const productUrls = productRecords.map((record) => record.final_url || record.url).filter(Boolean);
const required = requiredSarvamProductChecks();
const checks = required.map((item) => {
  const geminiMatches = geminiProductDiscoveryRows.filter((record) => urlIncludesAny(record.url, item.terms));
  const supportMatches = supportProductDiscoveryRows.filter((record) => urlIncludesAny(record.url, item.terms));
  const evidenceMatches = productRecords.filter((record) => urlIncludesAny(record.final_url || record.url, item.terms));

  return {
    key: item.key,
    label: item.label,
    passed: geminiMatches.length > 0,
    found_in_admitted_evidence: evidenceMatches.length > 0,
    gemini_primary_found: geminiMatches.length > 0,
    support_only_found: geminiMatches.length === 0 && supportMatches.length > 0,
    gemini_matches: geminiMatches.map(provenanceSummary),
    support_matches: supportMatches.map(provenanceSummary),
    admitted_evidence_matches: evidenceMatches.map(evidenceSummary),
    terms: item.terms
  };
});
const failed = checks.filter((item) => !item.passed);

const result = {
  ok: failed.length === 0,
  service: "lexnova-runtime-api",
  phase: "product_source_discovery_audit",
  discovery_policy: discoveryResponse.diagnostics?.discovery_policy || null,
  support_families: discoveryResponse.diagnostics?.support_families || [],
  target: targetInput,
  discovery_counts: discoveryResponse.discovery?.counts || null,
  diagnostic_candidate_counts: discoveryResponse.diagnostics?.candidate_counts || null,
  source_counts: evidenceInput.scrape_meta?.coverage_summary?.source_counts || null,
  coverage_gaps: discoveryResponse.discovery?.coverage_gaps || [],
  source_discovery_provenance: {
    location: "discoveryResponse.diagnostics.provenance_audit",
    product_gemini_primary_count: geminiProductDiscoveryRows.length,
    product_support_count: supportProductDiscoveryRows.length,
    product_gemini_primary: geminiProductDiscoveryRows.map(provenanceSummary),
    product_support: supportProductDiscoveryRows.map(provenanceSummary)
  },
  admitted_product_evidence: {
    product_document_count: productRecords.length,
    documents: productRecords.map(evidenceSummary)
  },
  required_product_page_checks: checks
};

console.log(JSON.stringify(result, null, 2));

if (failed.length) {
  fail("Required first-party product page(s) missing from Gemini-primary source discovery provenance", {
    failed,
    product_urls: productUrls,
    discovery_policy: discoveryResponse.diagnostics?.discovery_policy || null,
    support_families: discoveryResponse.diagnostics?.support_families || [],
    discovery_counts: discoveryResponse.discovery?.counts || null,
    source_discovery_provenance_location: "diagnostics.provenance_audit"
  });
}
