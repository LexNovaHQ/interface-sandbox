import crypto from "node:crypto";

const ADMITTED_SOURCE_FAMILIES = new Set([
  "product_profile",
  "legal_governance",
  "docs_developer"
]);

const EXCLUDED_SOURCE_FAMILIES = new Set([
  "commercial",
  "update",
  "updates",
  "contact",
  "unknown"
]);

function nowIso() {
  return new Date().toISOString();
}

function stableJson(value) {
  return JSON.stringify(value || {}, Object.keys(value || {}).sort());
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value || ""), "utf8").digest("hex");
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

function hostnameOf(value) {
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function normalizeTargetInput(input = {}) {
  const primaryUrl = input.primary_url || input.url || input.normalized_origin || null;

  return {
    primary_url: primaryUrl,
    company_name: input.company_name || null,
    normalized_origin: input.normalized_origin || null,
    registrable_domain: input.registrable_domain || null,
    declared_product_name: input.declared_product_name || input.product_name || null,
    submitted_at: input.submitted_at || null
  };
}

function unwrapDiscovery(input = {}) {
  if (input?.discovery) return input.discovery;
  if (input?.source_discovery) return input.source_discovery;
  return input || {};
}

function unwrapCapture(input = {}) {
  if (input?.capture) return input.capture;
  if (input?.source_capture) return input.source_capture;
  return input || {};
}

function flattenDiscoverySources(discovery = {}) {
  const bucketNames = [
    "product_profile_sources",
    "legal_governance_sources",
    "docs_developer_sources",
    "commercial_sources",
    "update_sources"
  ];

  const byUrl = new Map();

  for (const bucketName of bucketNames) {
    const records = Array.isArray(discovery[bucketName]) ? discovery[bucketName] : [];
    for (const record of records) {
      const url = normalizeUrl(record?.url);
      if (!url || byUrl.has(url)) continue;
      byUrl.set(url, {
        url,
        source_family: normalizeSourceFamily(record.source_family || bucketName.replace(/_sources$/, ""), record),
        source_bucket: bucketName,
        priority: record.priority ?? null,
        discovery_method: record.discovery_method || null,
        probe_method: record.probe_method || null,
        status: record.status || null,
        content_type: record.content_type || "",
        inferred: record.inferred === true
      });
    }
  }

  const candidates = Array.isArray(discovery.candidate_sources) ? discovery.candidate_sources : [];
  for (const record of candidates) {
    const url = normalizeUrl(record?.url);
    if (!url || byUrl.has(url)) continue;
    byUrl.set(url, {
      url,
      source_family: normalizeSourceFamily(record.source_family || null, record),
      source_bucket: "candidate_sources",
      priority: record.priority ?? null,
      discovery_method: record.discovery_method || null,
      probe_method: record.probe_method || null,
      status: record.status || null,
      content_type: record.content_type || "",
      inferred: record.inferred === true
    });
  }

  return [...byUrl.values()];
}

function normalizeSourceFamily(value, record = {}) {
  const raw = String(value || "").toLowerCase().trim();
  const url = String(record.url || "").toLowerCase();
  const label = String(record.label || record.title || record.source_label || "").toLowerCase();
  const haystack = `${raw} ${url} ${label}`;

  if (raw === "legal_governance" || /terms|privacy|dpa|sub[-_ ]?processor|processor|security|trust|gdpr|data protection|policy|sla|acceptable use|aup/.test(haystack)) {
    return "legal_governance";
  }
  if (raw === "docs_developer" || /docs|developer|api|sdk|guide|reference/.test(haystack)) {
    return "docs_developer";
  }
  if (raw === "product_profile" || /product|model|platform|feature|solution|capabilit|homepage|home/.test(haystack)) {
    return "product_profile";
  }
  if (raw === "commercial" || /pricing|contact|sales|demo|book/.test(haystack)) {
    return "commercial";
  }
  if (raw === "update" || raw === "updates" || /blog|news|release|changelog|announcement|update/.test(haystack)) {
    return "update";
  }
  return raw || "unknown";
}

function isFirstPartySource(url, targetInput = {}) {
  const sourceHost = hostnameOf(url);
  if (!sourceHost) return false;

  const targetHost = hostnameOf(targetInput.primary_url || targetInput.normalized_origin || "");
  const registrableDomain = String(targetInput.registrable_domain || "").toLowerCase().replace(/^www\./, "");

  if (targetHost && (sourceHost === targetHost || sourceHost.endsWith(`.${targetHost}`))) return true;
  if (registrableDomain && (sourceHost === registrableDomain || sourceHost.endsWith(`.${registrableDomain}`))) return true;

  return false;
}

function getCleanText(captureRecord = {}) {
  return captureRecord.clean_text_lossless || captureRecord.text?.clean_text_lossless || captureRecord.text?.clean_text || "";
}

function getCleanTextHash(captureRecord = {}, cleanText = "") {
  return captureRecord.text?.clean_text_sha256 || captureRecord.clean_text_sha256 || sha256(cleanText);
}

function shouldAdmitSource({ captureRecord, discoveryRecord, targetInput }) {
  const finalUrl = normalizeUrl(captureRecord?.fetch?.final_url || captureRecord?.url) || captureRecord?.url || null;
  const originalUrl = normalizeUrl(captureRecord?.url) || finalUrl;
  const sourceFamily = normalizeSourceFamily(captureRecord.source_family || discoveryRecord?.source_family || null, {
    url: finalUrl || originalUrl,
    title: captureRecord.structure?.title || ""
  });

  if (captureRecord.fetch?.ok !== true) {
    return { admitted: false, source_family: sourceFamily, reason: "fetch_failed" };
  }

  if (!isFirstPartySource(finalUrl || originalUrl, targetInput)) {
    return { admitted: false, source_family: sourceFamily, reason: "not_first_party" };
  }

  if (ADMITTED_SOURCE_FAMILIES.has(sourceFamily)) {
    return { admitted: true, source_family: sourceFamily, reason: "admitted_first_party_relevant_source" };
  }

  if (EXCLUDED_SOURCE_FAMILIES.has(sourceFamily)) {
    return { admitted: false, source_family: sourceFamily, reason: "filtered_irrelevant_source_family" };
  }

  return { admitted: false, source_family: sourceFamily, reason: "filtered_unknown_source_family" };
}

function buildAdmittedSourceRecord({ captureRecord = {}, discoveryRecord = null, index = 0, sourceFamily }) {
  const finalUrl = normalizeUrl(captureRecord?.fetch?.final_url || captureRecord?.url) || captureRecord?.url || null;
  const originalUrl = normalizeUrl(captureRecord?.url) || finalUrl;
  const evidenceSourceId = `SRC_${String(index + 1).padStart(3, "0")}`;
  const cleanText = getCleanText(captureRecord);
  const cleanTextSha = getCleanTextHash(captureRecord, cleanText);
  const chunks = Array.isArray(captureRecord.chunks) ? captureRecord.chunks : [];

  return {
    evidence_source_id: evidenceSourceId,
    url: originalUrl,
    final_url: finalUrl,
    source_family: sourceFamily,
    admission: {
      status: "admitted",
      reason: "admitted_first_party_relevant_source",
      duplicate: false,
      full_text_sent_downstream: true
    },
    discovery: discoveryRecord || null,
    fetch: captureRecord.fetch || { ok: false },
    raw: {
      raw_html_length: captureRecord.raw?.raw_html_length || 0,
      raw_html_sha256: captureRecord.raw?.raw_html_sha256 || sha256("")
    },
    text: {
      extraction_mode: captureRecord.text?.extraction_mode || "lossless_visible_text",
      clean_text_length: captureRecord.text?.clean_text_length || cleanText.length || 0,
      clean_text_sha256: cleanTextSha,
      word_count: captureRecord.text?.word_count || 0,
      truncated_in_storage: captureRecord.text?.truncated_in_storage === true,
      truncated_in_response: captureRecord.text?.truncated_in_response === true,
      clean_text_lossless: cleanText
    },
    structure: captureRecord.structure || {
      title: "",
      meta_description: "",
      headings: [],
      section_index: [],
      links: []
    },
    chunk_index: chunks.map((chunk) => ({
      chunk_id: chunk.chunk_id || null,
      source_url: chunk.source_url || finalUrl || originalUrl,
      start_char: chunk.start_char ?? null,
      end_char: chunk.end_char ?? null,
      text_sha256: chunk.text_sha256 || sha256(chunk.text || "")
    })),
    quality: captureRecord.quality || {
      empty_page: true,
      likely_js_rendered: false,
      word_count: 0,
      coverage_status: "unknown"
    }
  };
}

function groupEvidenceByFamily(sourceEvidence = []) {
  const grouped = {};

  for (const record of sourceEvidence) {
    const family = record.source_family || "unknown";
    if (!grouped[family]) grouped[family] = [];
    grouped[family].push({
      evidence_source_id: record.evidence_source_id,
      url: record.url,
      final_url: record.final_url,
      fetch_ok: record.fetch?.ok === true,
      word_count: record.text?.word_count || 0,
      title: record.structure?.title || "",
      coverage_status: record.quality?.coverage_status || "unknown"
    });
  }

  return grouped;
}

function buildCoverageSummary(discovery = {}, capture = {}, sourceEvidence = [], filteredSources = [], duplicateSources = []) {
  return {
    discovery_counts: discovery.counts || {},
    capture_counts: capture.counts || {},
    coverage: discovery.coverage || {},
    coverage_gaps: Array.isArray(discovery.coverage_gaps) ? discovery.coverage_gaps : [],
    source_counts: {
      admitted: sourceEvidence.length,
      filtered: filteredSources.length,
      duplicates_removed: duplicateSources.length,
      fetch_ok: sourceEvidence.filter((record) => record.fetch?.ok === true).length,
      total_words: sourceEvidence.reduce((sum, record) => sum + (record.text?.word_count || 0), 0)
    },
    by_family: groupEvidenceByFamily(sourceEvidence)
  };
}

export function buildEvidenceRefinerInput({
  targetInput = {},
  discoveryResponse = {},
  captureResponse = {},
  runId = null,
  sourceMode = "runtime_discovery_capture",
  generatedAt = nowIso()
} = {}) {
  const discovery = unwrapDiscovery(discoveryResponse);
  const capture = unwrapCapture(captureResponse);
  const target_input = normalizeTargetInput(targetInput);
  const discoveredSources = flattenDiscoverySources(discovery);
  const discoveryByUrl = new Map(discoveredSources.map((record) => [record.url, record]));
  const captureRecords = Array.isArray(capture.source_records) ? capture.source_records : [];

  const admitted = [];
  const filtered_sources = [];
  const duplicate_sources = [];
  const seenUrls = new Set();
  const seenTextHashes = new Set();

  for (const captureRecord of captureRecords) {
    const url = normalizeUrl(captureRecord?.url);
    const finalUrl = normalizeUrl(captureRecord?.fetch?.final_url);
    const discoveryRecord = discoveryByUrl.get(url) || discoveryByUrl.get(finalUrl) || null;
    const admission = shouldAdmitSource({ captureRecord, discoveryRecord, targetInput: target_input });
    const cleanText = getCleanText(captureRecord);
    const textHash = getCleanTextHash(captureRecord, cleanText);
    const urlKey = finalUrl || url || captureRecord?.url || "";

    if (!admission.admitted) {
      filtered_sources.push({
        url: urlKey,
        source_family: admission.source_family,
        reason: admission.reason
      });
      continue;
    }

    if (seenUrls.has(urlKey) || (textHash && seenTextHashes.has(textHash))) {
      duplicate_sources.push({
        url: urlKey,
        source_family: admission.source_family,
        reason: seenUrls.has(urlKey) ? "duplicate_url" : "duplicate_clean_text_sha256",
        clean_text_sha256: textHash
      });
      continue;
    }

    seenUrls.add(urlKey);
    if (textHash) seenTextHashes.add(textHash);

    admitted.push(buildAdmittedSourceRecord({
      captureRecord,
      discoveryRecord,
      index: admitted.length,
      sourceFamily: admission.source_family
    }));
  }

  const raw_footprint = {
    source_records: admitted,
    filtered_sources,
    duplicate_sources,
    downstream_policy: {
      full_admitted_documents_sent_once: true,
      chunks_text_omitted_to_avoid_duplicate_evidence: true,
      summaries_used_as_evidence: false,
      admitted_source_families: [...ADMITTED_SOURCE_FAMILIES],
      filtered_source_families: [...EXCLUDED_SOURCE_FAMILIES]
    }
  };

  const scrape_meta = {
    adapter: "sourceBundleAdapter",
    adapter_version: "1.2.0",
    generated_at: generatedAt,
    source_mode: sourceMode,
    hashes: {
      discovery_sha256: sha256(stableJson(discovery)),
      capture_sha256: sha256(stableJson(capture)),
      raw_footprint_sha256: sha256(stableJson(raw_footprint))
    },
    coverage_summary: buildCoverageSummary(discovery, capture, admitted, filtered_sources, duplicate_sources)
  };

  const resolvedRunId = runId || `runtime_${sha256(`${target_input.primary_url || "unknown"}|${generatedAt}`).slice(0, 16)}`;

  return {
    run_id: resolvedRunId,
    source_mode: sourceMode,
    target_input,
    source_discovery: {
      ...discovery,
      flattened_sources: discoveredSources
    },
    raw_footprint,
    scrape_meta
  };
}
