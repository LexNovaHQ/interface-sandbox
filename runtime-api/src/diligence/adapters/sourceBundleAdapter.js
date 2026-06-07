import crypto from "node:crypto";

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
    return url.toString();
  } catch {
    return null;
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
        source_family: record.source_family || bucketName.replace(/_sources$/, ""),
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
      source_family: record.source_family || null,
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

function buildSourceEvidenceRecord(captureRecord = {}, discoveryRecord = null, index = 0) {
  const finalUrl = normalizeUrl(captureRecord?.fetch?.final_url || captureRecord?.url) || captureRecord?.url || null;
  const originalUrl = normalizeUrl(captureRecord?.url) || finalUrl;
  const sourceFamily = captureRecord.source_family || discoveryRecord?.source_family || null;
  const cleanText = captureRecord.clean_text_lossless || captureRecord.text?.clean_text_lossless || captureRecord.text?.clean_text || "";
  const chunks = Array.isArray(captureRecord.chunks) ? captureRecord.chunks : [];

  return {
    evidence_source_id: `SRC_${String(index + 1).padStart(3, "0")}`,
    url: originalUrl,
    final_url: finalUrl,
    source_family: sourceFamily,
    discovery: discoveryRecord || null,
    fetch: captureRecord.fetch || { ok: false },
    raw: {
      raw_html_length: captureRecord.raw?.raw_html_length || 0,
      raw_html_sha256: captureRecord.raw?.raw_html_sha256 || sha256("")
    },
    text: {
      extraction_mode: captureRecord.text?.extraction_mode || "lossless_visible_text",
      clean_text_length: captureRecord.text?.clean_text_length || cleanText.length || 0,
      clean_text_sha256: captureRecord.text?.clean_text_sha256 || sha256(cleanText),
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
    chunks: chunks.map((chunk, chunkIndex) => ({
      evidence_source_id: `SRC_${String(index + 1).padStart(3, "0")}`,
      chunk_id: chunk.chunk_id || `chunk_${String(chunkIndex + 1).padStart(4, "0")}`,
      source_url: chunk.source_url || finalUrl || originalUrl,
      start_char: chunk.start_char ?? null,
      end_char: chunk.end_char ?? null,
      text: chunk.text || "",
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

function buildCoverageSummary(discovery = {}, capture = {}, sourceEvidence = []) {
  const successful = sourceEvidence.filter((record) => record.fetch?.ok === true);
  const failed = sourceEvidence.filter((record) => record.fetch?.ok !== true);

  return {
    discovery_counts: discovery.counts || {},
    capture_counts: capture.counts || {},
    coverage: discovery.coverage || {},
    coverage_gaps: Array.isArray(discovery.coverage_gaps) ? discovery.coverage_gaps : [],
    source_counts: {
      total: sourceEvidence.length,
      fetch_ok: successful.length,
      fetch_failed: failed.length,
      total_chunks: sourceEvidence.reduce((sum, record) => sum + (record.chunks?.length || 0), 0),
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

  const sourceEvidence = captureRecords.map((record, index) => {
    const url = normalizeUrl(record?.url);
    const finalUrl = normalizeUrl(record?.fetch?.final_url);
    const discoveryRecord = discoveryByUrl.get(url) || discoveryByUrl.get(finalUrl) || null;
    return buildSourceEvidenceRecord(record, discoveryRecord, index);
  });

  const raw_footprint = {
    source_records: sourceEvidence,
    chunks: sourceEvidence.flatMap((record) => record.chunks || []),
    clean_text_corpus: sourceEvidence
      .filter((record) => record.text?.clean_text_lossless)
      .map((record) => ({
        evidence_source_id: record.evidence_source_id,
        url: record.final_url || record.url,
        source_family: record.source_family,
        clean_text_lossless: record.text.clean_text_lossless,
        clean_text_sha256: record.text.clean_text_sha256,
        word_count: record.text.word_count || 0
      }))
  };

  const scrape_meta = {
    adapter: "sourceBundleAdapter",
    adapter_version: "1.0.0",
    generated_at: generatedAt,
    source_mode: sourceMode,
    hashes: {
      discovery_sha256: sha256(stableJson(discovery)),
      capture_sha256: sha256(stableJson(capture)),
      raw_footprint_sha256: sha256(stableJson(raw_footprint))
    },
    coverage_summary: buildCoverageSummary(discovery, capture, sourceEvidence)
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
