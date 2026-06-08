#!/usr/bin/env node

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

function compactRecord(record = {}) {
  return {
    url: record.url || null,
    source_family: record.source_family || null,
    reason: record.reason || "",
    anchor_url: record.anchor_url || null,
    link_text: record.link_text || "",
    status: record.status || null,
    content_type: record.content_type || "",
    provenance: Array.isArray(record.provenance) ? record.provenance.slice(0, 6) : []
  };
}

function compactAnchorFetch(result = {}) {
  return {
    ok: result.ok === true,
    anchor_url: result.anchor_url || null,
    source_family: result.source_family || null,
    status: result.status || null,
    content_type: result.content_type || "",
    link_count: result.link_count || 0,
    error: result.error || null
  };
}

function compactRun(run = {}) {
  return {
    source_family: run.source_family || null,
    retrieval_intent_id: run.retrieval_intent_id || null,
    ok: run.ok === true,
    admitted_count: run.admitted_count || 0,
    rejected_count: run.rejected_count || 0,
    error_type: run.error_type || null,
    error: run.error || null,
    coverage_gap: run.coverage_gap || null
  };
}

function diagnoseMagnaCartaDiscovery(diagnostics = {}) {
  const anchor = diagnostics.anchor_link_discovery || {};
  const anchorFetch = Array.isArray(anchor.anchor_fetch_results) ? anchor.anchor_fetch_results : [];
  const fetchOk = anchorFetch.filter((item) => item?.ok === true);
  const extractedCount = Number(anchor.extracted_first_party_link_count || 0);
  const classifyRuns = Array.isArray(diagnostics.gemini_anchor_classification_runs) ? diagnostics.gemini_anchor_classification_runs : [];
  const classifyOk = classifyRuns.filter((run) => run?.ok === true);
  const admittedByClassifier = classifyRuns.reduce((sum, run) => sum + Number(run?.admitted_count || 0), 0);

  if (!diagnostics.discovery_policy?.source_discovery_version) return "magna_carta_policy_missing_from_runtime";
  if (!anchorFetch.length) return "anchor_fetch_not_executed";
  if (!fetchOk.length) return "all_anchor_fetches_failed_or_non_html";
  if (extractedCount === 0) return "anchor_fetch_ok_but_no_first_party_links_extracted";
  if (!classifyRuns.length) return "gemini_anchor_classifier_not_run";
  if (!classifyOk.length) return "gemini_anchor_classifier_all_failed";
  if (admittedByClassifier === 0) return "gemini_anchor_classifier_admitted_zero";
  return "magna_carta_discovery_executed";
}

const base = normalizeRuntimeUrl(runtimeUrl);
if (!base) fail("RUNTIME_URL is required");
if (!token) fail("RUNTIME_ACCESS_TOKEN is required");

console.log(JSON.stringify({
  ok: true,
  step: "start",
  phase: "product_source_discovery_audit_magna_carta",
  target: { primary_url: primaryUrl, company_name: companyName, submitted_at: new Date().toISOString() },
  runtime_url: base
}, null, 2));

const discoveryResponse = await postJson(base, "/v1/source-discovery", {
  input: { primary_url: primaryUrl, company_name: companyName },
  options: {
    anchorFetchMaxAnchors: Number(process.env.AUDIT_ANCHOR_FETCH_MAX || 64),
    anchorLinkLimit: Number(process.env.AUDIT_ANCHOR_LINK_LIMIT || 240),
    anchorClassifyMaxOutputTokens: Number(process.env.AUDIT_ANCHOR_CLASSIFY_TOKENS || 4096)
  }
});

const discovery = discoveryResponse.discovery || {};
const diagnostics = discoveryResponse.diagnostics || {};
const productSources = Array.isArray(discovery.product_profile_sources) ? discovery.product_profile_sources : [];
const required = requiredSarvamProductChecks();
const checks = required.map((check) => {
  const matches = productSources.filter((record) => urlIncludesAny(record.url, check.terms));
  return {
    ...check,
    passed: matches.length > 0,
    matched_sources: matches.map(compactRecord)
  };
});
const failed = checks.filter((check) => !check.passed);

const report = {
  ok: failed.length === 0,
  service: "lexnova-runtime-api",
  phase: "product_source_discovery_audit_magna_carta",
  target: { primary_url: primaryUrl, company_name: companyName },
  discovery_policy: diagnostics.discovery_policy || null,
  counts: discovery.counts || null,
  diagnosis: diagnoseMagnaCartaDiscovery(diagnostics),
  anchor_link_report: {
    anchor_fetch_count: diagnostics.anchor_link_discovery?.anchor_fetch_results?.length || 0,
    anchor_fetch_ok_count: (diagnostics.anchor_link_discovery?.anchor_fetch_results || []).filter((item) => item?.ok === true).length,
    extracted_first_party_link_count: diagnostics.anchor_link_discovery?.extracted_first_party_link_count || 0,
    sample_extracted_links: (diagnostics.anchor_link_discovery?.sample_extracted_links || []).slice(0, 30),
    anchor_fetch_results: (diagnostics.anchor_link_discovery?.anchor_fetch_results || []).slice(0, 40).map(compactAnchorFetch)
  },
  gemini_anchor_classification_runs: (diagnostics.gemini_anchor_classification_runs || []).map(compactRun),
  free_first_party_search_runs: (diagnostics.free_first_party_search_runs || []).map(compactRun),
  candidate_counts: diagnostics.candidate_counts || null,
  product_evidence: {
    product_document_count: productSources.length,
    documents: productSources.map(compactRecord)
  },
  required_product_page_checks: checks,
  provenance_audit: diagnostics.provenance_audit || []
};

console.log(JSON.stringify(report, null, 2));

if (failed.length > 0) {
  fail("Required first-party product page(s) missing from admitted product_profile sources", {
    failed,
    product_urls: productSources.map((source) => source.url),
    diagnosis: report.diagnosis,
    candidate_counts: diagnostics.candidate_counts || null
  });
}
