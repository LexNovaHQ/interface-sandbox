import crypto from "node:crypto";
import { createRequire } from "node:module";
import { validateCaptureUrl } from "../source-capture/sourceCapture.js";

const require = createRequire(import.meta.url);
const LEGAL_PATH_RE = /(^|[\/_-])(terms(?:-of-service)?|privacy(?:-policy)?|dpa|data-processing|data-processing-addendum|data_protection|data-protection|subprocessors?|acceptable-use|aup|eula|sla|service-level|security|trust|legal|cookie(?:-policy)?)([\/_\-.]|$)/i;
const PDF_CONTENT_RE = /application\/(pdf|octet-stream)|binary\/octet-stream/i;
const HTML_CONTENT_RE = /text\/html|application\/xhtml\+xml|application\/xml|text\/plain/i;
const DEFAULT_MAX_BYTES = 15 * 1024 * 1024;

function nowIso() {
  return new Date().toISOString();
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function normalizeUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    url.hash = "";
    if ((url.pathname || "") !== "/") url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    return url.toString();
  } catch {
    return null;
  }
}

function hostname(value) {
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function sameOrSubdomain(candidateUrl, targetUrl) {
  const candidateHost = hostname(candidateUrl);
  const targetHost = hostname(targetUrl);
  if (!candidateHost || !targetHost) return false;
  return candidateHost === targetHost || candidateHost.endsWith(`.${targetHost}`) || targetHost.endsWith(`.${candidateHost}`);
}

function isLegalDocumentCandidate(url) {
  try {
    const parsed = new URL(url);
    const path = `${parsed.pathname || ""} ${parsed.search || ""}`;
    return LEGAL_PATH_RE.test(path) || /\.pdf$/i.test(parsed.pathname || "");
  } catch {
    return false;
  }
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asText(value) {
  return String(value || "").trim();
}

function unique(values = []) {
  return [...new Set(values.map(asText).filter(Boolean))];
}

function collectCandidatesFromLegalStack(legalStackReview = {}) {
  const candidates = [];
  for (const doc of asArray(legalStackReview.legal_stack)) {
    const urls = unique([
      doc?.unadmitted_document_url,
      ...(Array.isArray(doc?.unadmitted_document_url_candidates) ? doc.unadmitted_document_url_candidates : []),
      ...(Array.isArray(doc?.missed_document_url_candidates) ? doc.missed_document_url_candidates : [])
    ]);
    for (const url of urls) {
      const normalized = normalizeUrl(url);
      if (!normalized) continue;
      candidates.push({ url: normalized, document_type: doc?.document_type || "Legal Document" });
    }
  }
  const seen = new Set();
  return candidates.filter((candidate) => {
    const key = candidate.url;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function decodeHtmlEntities(input) {
  let text = String(input || "");
  const named = { nbsp: " ", amp: "&", lt: "<", gt: ">", quot: "\"", apos: "'" };
  text = text.replace(/&([a-zA-Z][a-zA-Z0-9]+);/g, (match, name) => Object.prototype.hasOwnProperty.call(named, String(name || "").toLowerCase()) ? named[String(name || "").toLowerCase()] : match);
  text = text.replace(/&#(\d+);/g, (match, code) => {
    try { return String.fromCodePoint(Number(code)); } catch { return match; }
  });
  text = text.replace(/&#x([0-9a-fA-F]+);/g, (match, code) => {
    try { return String.fromCodePoint(Number.parseInt(code, 16)); } catch { return match; }
  });
  return text;
}

function stripHtml(html) {
  let text = String(html || "");
  text = text.replace(/<script[\s\S]*?<\/script>/gi, "\n");
  text = text.replace(/<style[\s\S]*?<\/style>/gi, "\n");
  text = text.replace(/<!--([\s\S]*?)-->/g, "\n");
  text = text.replace(/<\/(p|div|section|article|header|footer|main|li|tr|h[1-6])>/gi, "\n");
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<[^>]+>/g, " ");
  text = decodeHtmlEntities(text);
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/[ \t\f\v]+/g, " ").replace(/\n[ \t]+/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function titleFromHtml(html, fallback = "") {
  const match = String(html || "").match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? stripHtml(match[1]) : fallback;
}

function titleFromUrl(url, documentType = "Legal Document") {
  try {
    const parsed = new URL(url);
    const last = decodeURIComponent((parsed.pathname || "").split("/").filter(Boolean).pop() || "");
    return last ? `${documentType}: ${last.replace(/\.pdf$/i, "")}` : documentType;
  } catch {
    return documentType;
  }
}

function countWords(value) {
  return String(value || "").split(/\s+/).filter(Boolean).length;
}

function buildChunks({ cleanText, sourceUrl, chunkSize = 6000, chunkOverlap = 300 }) {
  const text = String(cleanText || "");
  const chunks = [];
  if (!text) return chunks;
  const size = Math.max(1000, Number(chunkSize || 6000));
  const overlap = Math.max(0, Math.min(Number(chunkOverlap || 0), Math.floor(size / 2)));
  let start = 0;
  let index = 1;
  while (start < text.length) {
    const end = Math.min(start + size, text.length);
    const chunkText = text.slice(start, end);
    chunks.push({ chunk_id: `chunk_${String(index).padStart(4, "0")}`, source_url: sourceUrl, start_char: start, end_char: end, text: chunkText, text_sha256: sha256(chunkText) });
    if (end >= text.length) break;
    start = end - overlap;
    index += 1;
  }
  return chunks;
}

async function fetchLegalDocument(url, { timeoutMs = 15000, maxBytes = DEFAULT_MAX_BYTES } = {}) {
  const safeUrl = await validateCaptureUrl(url);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(safeUrl, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": "LexNovaHQ-LegalDocumentResolver/0.1",
        accept: "application/pdf,text/html,application/xhtml+xml,application/xml,text/plain,*/*;q=0.5"
      }
    });
    const finalUrl = normalizeUrl(response.url) || safeUrl;
    const contentType = response.headers.get("content-type") || "";
    const contentLength = Number(response.headers.get("content-length") || 0);
    if (contentLength && contentLength > maxBytes) throw new Error(`legal_document_too_large:${contentLength}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > maxBytes) throw new Error(`legal_document_too_large:${buffer.length}`);
    return { ok: response.ok, status: response.status, final_url: finalUrl, content_type: contentType, buffer };
  } finally {
    clearTimeout(timer);
  }
}

async function extractPdfText(buffer) {
  const pdfParse = require("pdf-parse");
  const parsed = await pdfParse(buffer);
  return String(parsed?.text || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/[ \t\f\v]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

async function extractLegalDocumentText(fetched, candidate = {}) {
  const contentType = fetched.content_type || "";
  const isPdf = PDF_CONTENT_RE.test(contentType) || /\.pdf(?:$|[?#])/i.test(fetched.final_url || candidate.url || "");
  if (isPdf) {
    const text = await extractPdfText(fetched.buffer);
    return { extraction_mode: "pdf_text_extraction", clean_text: text, title: titleFromUrl(fetched.final_url || candidate.url, candidate.document_type || "Legal Document"), source_type: "legal_document_pdf" };
  }
  if (HTML_CONTENT_RE.test(contentType) || !contentType) {
    const html = fetched.buffer.toString("utf8");
    const text = stripHtml(html);
    return { extraction_mode: "html_visible_text_extraction", clean_text: text, title: titleFromHtml(html, titleFromUrl(fetched.final_url || candidate.url, candidate.document_type || "Legal Document")), source_type: "legal_document_html" };
  }
  throw new Error(`unsupported_legal_document_content_type:${contentType}`);
}

function nextEvidenceSourceId(sourceBundle = {}) {
  const count = Array.isArray(sourceBundle.raw_footprint?.source_records) ? sourceBundle.raw_footprint.source_records.length : 0;
  return `SRC_${String(count + 1).padStart(3, "0")}`;
}

function buildLegalDocumentSourceRecord({ sourceBundle, candidate, fetched, extracted, targetInput = {} }) {
  const cleanText = extracted.clean_text || "";
  const textHash = sha256(cleanText);
  const finalUrl = normalizeUrl(fetched.final_url || candidate.url) || candidate.url;
  const id = nextEvidenceSourceId(sourceBundle);
  const chunks = buildChunks({ cleanText, sourceUrl: finalUrl });
  const rawHash = sha256(fetched.buffer || Buffer.from(""));
  return {
    evidence_source_id: id,
    url: normalizeUrl(candidate.url) || candidate.url,
    final_url: finalUrl,
    source_family: "legal_profile",
    source_bucket: "legal_document_reconciliation",
    legal_document_reconciliation: {
      source_type: extracted.source_type,
      document_type: candidate.document_type || "Legal Document",
      resolved_from_model_mentioned_url: true,
      included_in_legal_stack_review: true,
      target_primary_url: targetInput.primary_url || null
    },
    admission: {
      status: "admitted",
      reason: "same_domain_legal_document_reconciliation",
      duplicate: false,
      full_text_sent_downstream: true,
      summaries_used_as_evidence: false
    },
    discovery: {
      url: normalizeUrl(candidate.url) || candidate.url,
      final_url: finalUrl,
      source_family: "legal_profile",
      source_bucket: "legal_document_reconciliation",
      title: extracted.title,
      inferred: true,
      provenance: ["legal_stack_model_url_reconciliation", extracted.source_type]
    },
    provenance: ["legal_stack_model_url_reconciliation", extracted.source_type],
    fetch: {
      ok: fetched.ok,
      final_url: finalUrl,
      http_status: fetched.status,
      content_type: fetched.content_type,
      fetched_at: nowIso(),
      source_type: extracted.source_type
    },
    raw: {
      raw_html_length: extracted.source_type === "legal_document_html" ? fetched.buffer.length : 0,
      raw_html_sha256: extracted.source_type === "legal_document_html" ? rawHash : sha256(""),
      raw_binary_length: fetched.buffer.length,
      raw_binary_sha256: rawHash
    },
    text: {
      extraction_mode: extracted.extraction_mode,
      clean_text_length: cleanText.length,
      clean_text_sha256: textHash,
      word_count: countWords(cleanText),
      truncated_in_storage: false,
      truncated_in_response: false,
      clean_text_lossless: cleanText
    },
    structure: {
      title: extracted.title,
      meta_description: `${candidate.document_type || "Legal document"} resolved from same-domain legal document URL.`,
      headings: [],
      section_index: [],
      links: []
    },
    chunk_index: chunks.map((chunk) => ({ chunk_id: chunk.chunk_id, source_url: chunk.source_url, start_char: chunk.start_char, end_char: chunk.end_char, text_sha256: chunk.text_sha256 })),
    chunks,
    quality: {
      empty_page: cleanText.length === 0,
      likely_js_rendered: false,
      word_count: countWords(cleanText),
      coverage_status: cleanText.length > 0 ? `${extracted.source_type}_text_extracted` : "legal_document_extraction_empty"
    }
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value || {}));
}

function updateCoverageSummary(sourceBundle = {}) {
  const records = asArray(sourceBundle.raw_footprint?.source_records);
  const byFamily = records.reduce((acc, record) => {
    const family = record.source_family || "unknown";
    if (!acc[family]) acc[family] = [];
    acc[family].push({ evidence_source_id: record.evidence_source_id, url: record.url, final_url: record.final_url, fetch_ok: record.fetch?.ok === true, word_count: record.text?.word_count || 0, title: record.structure?.title || "", coverage_status: record.quality?.coverage_status || "unknown" });
    return acc;
  }, {});
  sourceBundle.scrape_meta = sourceBundle.scrape_meta || {};
  sourceBundle.scrape_meta.coverage_summary = {
    ...(sourceBundle.scrape_meta.coverage_summary || {}),
    source_counts: {
      admitted: records.length,
      filtered: asArray(sourceBundle.raw_footprint?.filtered_sources).length,
      duplicates_removed: asArray(sourceBundle.raw_footprint?.duplicate_sources).length,
      fetch_ok: records.filter((record) => record.fetch?.ok === true).length,
      total_words: records.reduce((sum, record) => sum + (record.text?.word_count || 0), 0)
    },
    by_family: {
      ...(sourceBundle.scrape_meta.coverage_summary?.by_family || {}),
      legal_profile: byFamily.legal_profile || []
    }
  };
  sourceBundle.scrape_meta.hashes = {
    ...(sourceBundle.scrape_meta.hashes || {}),
    raw_footprint_sha256: sha256(JSON.stringify(records.map((record) => ({ id: record.evidence_source_id, hash: record.text?.clean_text_sha256 || null }))))
  };
}

function appendResolvedSource(sourceBundle = {}, record) {
  const next = clone(sourceBundle);
  next.raw_footprint = next.raw_footprint || { source_records: [], filtered_sources: [], duplicate_sources: [] };
  next.raw_footprint.source_records = asArray(next.raw_footprint.source_records);
  next.raw_footprint.filtered_sources = asArray(next.raw_footprint.filtered_sources);
  next.raw_footprint.duplicate_sources = asArray(next.raw_footprint.duplicate_sources);
  next.source_discovery = next.source_discovery || { flattened_sources: [], allowed_families: ["company_profile", "product_profile", "legal_profile", "governance_profile"], counts: {}, coverage_gaps: [] };
  next.source_discovery.flattened_sources = asArray(next.source_discovery.flattened_sources);
  next.raw_footprint.source_records.push(record);
  next.source_discovery.flattened_sources.push(record.discovery);
  next.raw_footprint.downstream_policy = {
    ...(next.raw_footprint.downstream_policy || {}),
    same_domain_legal_document_reconciliation: true,
    full_admitted_documents_sent_once: true,
    full_text_lossless_required: true,
    summaries_used_as_evidence: false,
    no_summary_no_compression_no_truncation: true
  };
  updateCoverageSummary(next);
  return next;
}

export function legalDocumentCandidatesFromReview(legalStackReview = {}) {
  return collectCandidatesFromLegalStack(legalStackReview);
}

export async function reconcileLegalDocumentUrls({ legalStackReview, sourceBundle, targetInput = {}, timeoutMs = 15000, maxBytes = DEFAULT_MAX_BYTES } = {}) {
  const candidates = collectCandidatesFromLegalStack(legalStackReview);
  const targetUrl = targetInput.primary_url || sourceBundle?.target_input?.primary_url || null;
  const admittedUrls = new Set(asArray(sourceBundle?.raw_footprint?.source_records).flatMap((record) => [normalizeUrl(record?.url), normalizeUrl(record?.final_url)].filter(Boolean)));
  let nextSourceBundle = sourceBundle;
  const resolved_sources = [];
  const rejected_candidates = [];

  for (const candidate of candidates) {
    const normalized = normalizeUrl(candidate.url);
    if (!normalized) continue;
    if (admittedUrls.has(normalized)) continue;
    if (targetUrl && !sameOrSubdomain(normalized, targetUrl)) {
      rejected_candidates.push({ ...candidate, reason: "not_same_domain" });
      continue;
    }
    if (!isLegalDocumentCandidate(normalized)) {
      rejected_candidates.push({ ...candidate, reason: "not_legal_document_path" });
      continue;
    }
    try {
      const fetched = await fetchLegalDocument(normalized, { timeoutMs, maxBytes });
      if (!fetched.ok) {
        rejected_candidates.push({ ...candidate, reason: `fetch_status_${fetched.status}` });
        continue;
      }
      const extracted = await extractLegalDocumentText(fetched, candidate);
      if (!extracted.clean_text || extracted.clean_text.length < 40) {
        rejected_candidates.push({ ...candidate, reason: "extracted_text_too_short" });
        continue;
      }
      const record = buildLegalDocumentSourceRecord({ sourceBundle: nextSourceBundle, candidate, fetched, extracted, targetInput });
      nextSourceBundle = appendResolvedSource(nextSourceBundle, record);
      admittedUrls.add(normalizeUrl(record.url));
      admittedUrls.add(normalizeUrl(record.final_url));
      resolved_sources.push({ url: candidate.url, final_url: record.final_url, document_type: candidate.document_type, source_type: record.legal_document_reconciliation?.source_type, evidence_source_id: record.evidence_source_id, clean_text_length: record.text?.clean_text_length || 0, word_count: record.text?.word_count || 0 });
    } catch (error) {
      rejected_candidates.push({ ...candidate, reason: error?.message || "resolution_failed" });
    }
  }

  return {
    ok: true,
    resolved_count: resolved_sources.length,
    candidate_count: candidates.length,
    resolved_sources,
    rejected_candidates,
    source_bundle: nextSourceBundle
  };
}
