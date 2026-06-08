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
    const anchorAdmitted = family.gemini_anchor_classification?.admitted || [];
    const supportAdmitted = family.deterministic_support?.admitted || [];

    for (const record of geminiAdmitted) {
      rows.push({ ...record, provenance_layer: "source_discovery", provenance_family: family.source_family, provenance_role: "gemini_primary" });
    }

    for (const record of anchorAdmitted) {
      rows.push({ ...record, provenance_layer: "source_discovery", provenance_family: family.source_family, provenance_role: "gemini_anchor_classification" });
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
    retrieval_intent_id: record.retrieval_intent_id || null,
    reason: record.reason || "",
    anchor_url: record.anchor_url || null,
    link_text: record.link_text || "",
    status: record.status || null,
    http_status: record.http_status || null,
    content_type: record.content_type || ""
  };
}

function compactArray(value, limit = 20) {
  return Array.isArray(value) ? value.slice(0, limit) : [];
}

function summarizeAnchorFetch(result = {}) {
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

function summarizeClassifierRun(run = {}) {
  return {
    source_family: run.source_family || null,
    retrieval_intent_id: run.retrieval_intent_id || null,
    ok: run.ok === true,
    model: run.model_meta?.selected_model || run.model_meta?.model || null,
    key_alias: run.model_meta?.selected_key_alias || null,
    admitted_count: run.admitted_count || 0,
    rejected_count: run.rejected_count || 0,
    coverage_gap: run.coverage_gap || null,
    error_type: run.error_type || null,
    error: run.error || null
  };
}

function diagnoseAnchorLinkDiscovery(anchor = {}, diagnostics = {}) {
  const anchorsAttempted = Array.isArray(anchor.anchors_attempted) ? anchor.anchors_attempted : [];
  const fetchResults = Array.isArray(anchor.anchor_fetch_results) ? anchor.anchor_fetch_results : [];
  const classifierRuns = Array.isArray(anchor.classifier_runs) ? anchor.classifier_runs : [];
  const fetchOkCount = fetchResults.filter((item) => item?.ok === true).length;
  const extractedCount = Number(anchor.extracted_first_party_link_count || 0);
  const classifiedCount = Number(anchor.classified_candidate_count || 0);
  const classifierOkCount = classifierRuns.filter((item) => item?.ok === true).length;
  const classifierAdmittedTotal = classifierRuns.reduce((sum, item) => sum + Number(item?.admitted_count || 0), 0);

  if (!diagnostics?.anchor_link_discovery) {
    return "anchor_diagnostics_missing_from_source_discovery_response";
  }
  if (anchorsAttempted.length === 0) {
    return "anchor_selection_empty__gemini_search_probe_did_not_produce_primary_anchors_or_anchor_filter_removed_them";
  }
  if (fetchResults.length === 0) {
    return "anchor_fetch_not_executed__anchors_exist_but_no_fetch_results_recorded";
  }
  if (fetchOkCount === 0) {
    return "anchor_fetch_all_failed__check_status_content_type_timeout_or_ssrf_validation";
  }
  if (extractedCount === 0) {
    return "anchor_link_extraction_zero__check_html_link_extractor_js_rendered_links_www_domain_or_relative_url_handling";
  }
  if (classifierRuns.length === 0) {
    return "anchor_classifier_not_run__links_extracted_but_no_gemini_classification_runs_recorded";
  }
  if (classifierOkCount === 0) {
    return "anchor_classifier_all_failed__check_gemini_pool_errors_prompt_or_json_parse";
  }
  if (classifierAdmittedTotal === 0) {
    return "anchor_classifier_admitted_zero__gemini_rejected_all_extracted_links_or_prompt_too_strict";
  }
  if (classifiedCount === 0) {
    return "anchor_classifier_admitted_but_candidate_extraction_zero__check_extractAnchorClassifiedCandidates_contract";
  }
  return "anchor_candidates_created__if_audit_still_fails_check_probe_admission_or_required_fixture_terms";
}

function summarizeAnchorDiagnostics(diagnostics = {}) {
  const anchor = diagnostics.anchor_link_discovery || null;
  if (!anchor) {
    return {
      present: false,
      diagnosis: diagnoseAnchorLinkDiscovery(null, diagnostics),
      available_diagnostic_keys: Object.keys(diagnostics || {})
    };
  }

  const anchorsAttempted = Array.isArray(anchor.anchors_attempted) ? anchor.anchors_attempted : [];
  const fetchResults = Array.isArray(anchor.anchor_fetch_results) ? anchor.anchor_fetch_results : [];
  const classifierRuns = Array.isArray(anchor.classifier_runs) ? anchor.classifier_runs : [];
  const fetchOk = fetchResults.filter((item) => item?.ok === true);
  const fetchFailed = fetchResults.filter((item) => item?.ok !== true);
  const classifierOk = classifierRuns.filter((item) => item?.ok === true);
  const classifierFailed = classifierRuns.filter((item) => item?.ok !== true);
  const classifierAdmittedTotal = classifierRuns.reduce((sum, item) => sum + Number(item?.admitted_count || 0), 0);
  const classifierRejectedTotal = classifierRuns.reduce((sum, item) => sum + Number(item?.rejected_count || 0), 0);

  return {
    present: true,
    diagnosis: diagnoseAnchorLinkDiscovery(anchor, diagnostics),
    counts: {
      anchors_attempted: anchorsAttempted.length,
      anchor_fetch_results: fetchResults.length,
      anchor_fetch_ok: fetchOk.length,
      anchor_fetch_failed: fetchFailed.length,
      extracted_first_party_link_count: Number(anchor.extracted_first_party_link_count || 0),
      classifier_runs: classifierRuns.length,
      classifier_runs_ok: classifierOk.length,
      classifier_runs_failed: classifierFailed.length,
      classifier_admitted_total: classifierAdmittedTotal,
      classifier_rejected_total: classifierRejectedTotal,
      classified_candidate_count: Number(anchor.classified_candidate_count || 0)
    },
    anchors_attempted: compactArray(anchorsAttempted, 25).map(provenanceSummary),
    anchor_fetch_results: compactArray(fetchResults, 25).map(summarizeAnchorFetch),
    classifier_runs: compactArray(classifierRuns, 25).map(summarizeClassifierRun),
    failure_report: {
      anchor_selection_empty: anchorsAttempted.length === 0,
      anchor_fetch_all_failed: fetchResults.length > 0 && fetchOk.length === 0,
      link_extraction_zero: fetchOk.length > 0 && Number(anchor.extracted_first_party_link_count || 0) === 0,
      classifier_not_run: Number(anchor.extracted_first_party_link_count || 0) > 0 && classifierRuns.length === 0,
      classifier_all_failed: classifierRuns.length > 0 && classifierOk.length === 0,
      classifier_admitted_zero: classifierOk.length > 0 && classifierAdmittedTotal === 0,
      candidate_extraction_zero: classifierAdmittedTotal > 0 && Number(anchor.classified_candidate_count || 0) === 0
    },
    next_debug_action: diagnoseAnchorLinkDiscovery(anchor, diagnostics)
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

const anchorLinkDiagnosis = summarizeAnchorDiagnostics(discoveryResponse.diagnostics || {});
const discoveryProvenanceRows = flattenDiscoveryProvenance(discoveryResponse.diagnostics);
const geminiProductDiscoveryRows = discoveryProvenanceRows.filter((record) => ["gemini_primary", "gemini_anchor_classification"].includes(record.provenance_role) && /product_profile|docs_developer/i.test(record.source_family || record.provenance_family || ""));
const supportProductDiscoveryRows = discoveryProvenanceRows.filter((record) => record.provenance_role === "deterministic_support" && /product_profile|docs_developer/i.test(record.source_family || record.provenance_family || ""));

const sources = collectSources(discoveryResponse.discovery);
if (!sources.length) fail("Source discovery returned no capturable sources", { discovery_counts: discoveryResponse.discovery?.counts || null, anchor_link_diagnosis: anchorLinkDiagnosis });

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
    gemini_primary_or_anchor_found: geminiMatches.length > 0,
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
  probe_counts: discoveryResponse.diagnostics?.probe_counts || null,
  source_counts: evidenceInput.scrape_meta?.coverage_summary?.source_counts || null,
  coverage_gaps: discoveryResponse.discovery?.coverage_gaps || [],
  anchor_link_diagnosis: anchorLinkDiagnosis,
  source_discovery_provenance: {
    location: "discoveryResponse.diagnostics.provenance_audit",
    product_gemini_or_anchor_count: geminiProductDiscoveryRows.length,
    product_support_count: supportProductDiscoveryRows.length,
    product_gemini_or_anchor: geminiProductDiscoveryRows.map(provenanceSummary),
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
  fail("Required first-party product page(s) missing from Gemini-primary or Gemini-anchor source discovery provenance", {
    failed,
    product_urls: productUrls,
    discovery_policy: discoveryResponse.diagnostics?.discovery_policy || null,
    support_families: discoveryResponse.diagnostics?.support_families || [],
    discovery_counts: discoveryResponse.discovery?.counts || null,
    diagnostic_candidate_counts: discoveryResponse.diagnostics?.candidate_counts || null,
    probe_counts: discoveryResponse.diagnostics?.probe_counts || null,
    anchor_link_diagnosis: anchorLinkDiagnosis,
    source_discovery_provenance_location: "diagnostics.provenance_audit"
  });
}
