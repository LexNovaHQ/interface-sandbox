import crypto from "node:crypto";

function nowIso() {
  return new Date().toISOString();
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value || ""), "utf8").digest("hex");
}

function wordCount(value) {
  return String(value || "").split(/\s+/).filter(Boolean).length;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value || {}));
}

function normalizeText(value) {
  return String(value || "").replace(/\r\n/g, "\n").trim();
}

function safeLabel(value) {
  const label = String(value || "").trim();
  return label || "Reviewer supplied document text";
}

function sourceId(existingCount = 0) {
  return `SRC_${String(Number(existingCount || 0) + 1).padStart(3, "0")}`;
}

export function hasReviewerDocumentText(input = {}) {
  return normalizeText(input.document_text || input.documentText || input.doc_text || input.docText).length > 0;
}

export function buildReviewerDocumentSourceRecord({ documentText = "", documentLabel = "", index = 0, targetInput = {}, generatedAt = nowIso() } = {}) {
  const cleanText = normalizeText(documentText);
  if (!cleanText) return null;
  const id = sourceId(index);
  const label = safeLabel(documentLabel);
  const hash = sha256(cleanText);
  const pseudoUrl = `reviewer-supplied://document/${hash.slice(0, 16)}`;

  return {
    evidence_source_id: id,
    url: pseudoUrl,
    final_url: pseudoUrl,
    source_family: "legal_profile",
    source_bucket: "reviewer_supplied_document_text",
    reviewer_supplied: true,
    document_source: {
      source_type: "reviewer_supplied_document_text",
      document_label: label,
      included_in_legal_stack_review: true,
      supplied_at: generatedAt,
      target_primary_url: targetInput.primary_url || null
    },
    admission: {
      status: "admitted",
      reason: "reviewer_supplied_document_text",
      duplicate: false,
      full_text_sent_downstream: true,
      summaries_used_as_evidence: false
    },
    discovery: {
      url: pseudoUrl,
      final_url: pseudoUrl,
      source_family: "legal_profile",
      source_bucket: "reviewer_supplied_document_text",
      title: label,
      inferred: false,
      provenance: ["reviewer_supplied_document_text"]
    },
    provenance: ["reviewer_supplied_document_text"],
    fetch: {
      ok: true,
      final_url: pseudoUrl,
      status: 200,
      source_type: "reviewer_supplied_document_text"
    },
    raw: {
      raw_html_length: 0,
      raw_html_sha256: sha256("")
    },
    text: {
      extraction_mode: "reviewer_supplied_plain_text",
      clean_text_length: cleanText.length,
      clean_text_sha256: hash,
      word_count: wordCount(cleanText),
      truncated_in_storage: false,
      truncated_in_response: false,
      clean_text_lossless: cleanText
    },
    structure: {
      title: label,
      meta_description: "Reviewer-supplied document text admitted as legal evidence for this live review.",
      headings: [],
      section_index: [],
      links: []
    },
    chunk_index: [{
      chunk_id: `${id}_FULL_TEXT`,
      source_url: pseudoUrl,
      start_char: 0,
      end_char: cleanText.length,
      text_sha256: hash
    }],
    quality: {
      empty_page: false,
      likely_js_rendered: false,
      word_count: wordCount(cleanText),
      coverage_status: "reviewer_supplied_full_text"
    }
  };
}

function updateCoverageSummary(sourceBundle = {}) {
  const records = Array.isArray(sourceBundle.raw_footprint?.source_records) ? sourceBundle.raw_footprint.source_records : [];
  const filtered = Array.isArray(sourceBundle.raw_footprint?.filtered_sources) ? sourceBundle.raw_footprint.filtered_sources : [];
  const duplicates = Array.isArray(sourceBundle.raw_footprint?.duplicate_sources) ? sourceBundle.raw_footprint.duplicate_sources : [];
  const byFamily = records.reduce((acc, record) => {
    const family = record.source_family || "unknown";
    if (!acc[family]) acc[family] = [];
    acc[family].push({
      evidence_source_id: record.evidence_source_id,
      url: record.url,
      final_url: record.final_url,
      fetch_ok: record.fetch?.ok === true,
      word_count: record.text?.word_count || 0,
      title: record.structure?.title || "",
      coverage_status: record.quality?.coverage_status || "unknown"
    });
    return acc;
  }, {});

  sourceBundle.scrape_meta = sourceBundle.scrape_meta || {};
  sourceBundle.scrape_meta.coverage_summary = {
    ...(sourceBundle.scrape_meta.coverage_summary || {}),
    source_counts: {
      admitted: records.length,
      filtered: filtered.length,
      duplicates_removed: duplicates.length,
      fetch_ok: records.filter((record) => record.fetch?.ok === true).length,
      total_words: records.reduce((sum, record) => sum + (record.text?.word_count || 0), 0)
    },
    by_family: {
      company_profile: byFamily.company_profile || [],
      product_profile: byFamily.product_profile || [],
      legal_profile: byFamily.legal_profile || [],
      governance_profile: byFamily.governance_profile || []
    }
  };

  sourceBundle.scrape_meta.hashes = {
    ...(sourceBundle.scrape_meta.hashes || {}),
    raw_footprint_sha256: sha256(JSON.stringify(records.map((record) => ({ id: record.evidence_source_id, hash: record.text?.clean_text_sha256 || null }))))
  };
}

export function appendReviewerDocumentSource({ sourceBundle = {}, documentText = "", documentLabel = "", targetInput = {}, generatedAt = nowIso() } = {}) {
  const cleanText = normalizeText(documentText);
  const next = clone(sourceBundle);
  if (!cleanText) return { source_bundle: next, added: false, source_record: null };

  next.source_bundle_version = next.source_bundle_version || "source_bundle_v2_magna_carta";
  next.target_input = next.target_input || targetInput || {};
  next.source_mode = next.source_mode || "runtime_live_review";
  next.raw_footprint = next.raw_footprint || { source_records: [], filtered_sources: [], duplicate_sources: [] };
  next.raw_footprint.source_records = Array.isArray(next.raw_footprint.source_records) ? next.raw_footprint.source_records : [];
  next.raw_footprint.filtered_sources = Array.isArray(next.raw_footprint.filtered_sources) ? next.raw_footprint.filtered_sources : [];
  next.raw_footprint.duplicate_sources = Array.isArray(next.raw_footprint.duplicate_sources) ? next.raw_footprint.duplicate_sources : [];
  next.source_discovery = next.source_discovery || { flattened_sources: [], allowed_families: ["company_profile", "product_profile", "legal_profile", "governance_profile"], counts: {}, coverage_gaps: [] };
  next.source_discovery.flattened_sources = Array.isArray(next.source_discovery.flattened_sources) ? next.source_discovery.flattened_sources : [];

  const record = buildReviewerDocumentSourceRecord({
    documentText: cleanText,
    documentLabel,
    index: next.raw_footprint.source_records.length,
    targetInput,
    generatedAt
  });

  next.raw_footprint.source_records.push(record);
  next.source_discovery.flattened_sources.push(record.discovery);
  next.raw_footprint.downstream_policy = {
    ...(next.raw_footprint.downstream_policy || {}),
    reviewer_supplied_document_text_admitted: true,
    no_summary_no_compression_no_truncation: true
  };

  updateCoverageSummary(next);
  return { source_bundle: next, added: true, source_record: record };
}

export function buildDocumentOnlySourceBundle({ targetInput = {}, documentText = "", documentLabel = "", runId = null, generatedAt = nowIso() } = {}) {
  const base = {
    run_id: runId || `live_document_source_bundle_${Date.now()}`,
    generated_at: generatedAt,
    source_mode: "reviewer_supplied_document_text_only",
    source_bundle_version: "source_bundle_v2_magna_carta",
    target_input: targetInput,
    source_discovery: {
      source_discovery_version: "reviewer_supplied_document_text_v1",
      flattened_sources: [],
      allowed_families: ["company_profile", "product_profile", "legal_profile", "governance_profile"],
      counts: { reviewer_supplied_document_text: hasReviewerDocumentText({ document_text: documentText }) ? 1 : 0 },
      coverage_gaps: targetInput.primary_url ? [] : ["No public target URL was supplied. Review basis is reviewer-supplied document text only."],
      provenance_audit: ["reviewer_supplied_document_text"]
    },
    raw_footprint: {
      source_records: [],
      filtered_sources: [],
      duplicate_sources: [],
      downstream_policy: {
        full_admitted_documents_sent_once: true,
        full_text_lossless_required: true,
        summaries_used_as_evidence: false,
        no_summary_no_compression_no_truncation: true,
        processing_responsibility: "downstream_stages",
        reviewer_supplied_document_text_admitted: true
      }
    },
    scrape_meta: { coverage_summary: {}, hashes: {} }
  };

  return appendReviewerDocumentSource({ sourceBundle: base, documentText, documentLabel, targetInput, generatedAt }).source_bundle;
}
