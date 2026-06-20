import crypto from "node:crypto";
import { createRequire } from "node:module";
import { validateCaptureUrl } from "../source-capture/sourceCapture.js";

const require = createRequire(import.meta.url);
const PDF_CONTENT_RE = /application\/(pdf|octet-stream)|binary\/octet-stream/i;
const HTML_CONTENT_RE = /text\/html|application\/xhtml\+xml|application\/xml|text\/plain|application\/json/i;
const LEGAL_PATH_RE = /(^|[\/_-])(terms(?:-of-service)?|privacy(?:-policy)?|dpa|data-processing|data-processing-addendum|data-protection|subprocessors?|acceptable-use|aup|eula|sla|service-level|security|trust|legal|cookie(?:-policy)?)([\/_\-.]|$)/i;
const DEFAULT_MAX_BYTES = 15 * 1024 * 1024;
const ESTIMATED_CHARS_PER_TOKEN = 2.25;

function nowIso() { return new Date().toISOString(); }
function sha256(value) { return crypto.createHash("sha256").update(value).digest("hex"); }
function asArray(value) { return Array.isArray(value) ? value : []; }
function asText(value) { return String(value || "").trim(); }
function normalizeUrl(value) { try { const url = new URL(asText(value)); url.hash = ""; if ((url.pathname || "") !== "/") url.pathname = url.pathname.replace(/\/+$/, "") || "/"; return url.toString(); } catch { return null; } }
function host(value) { try { return new URL(value).hostname.toLowerCase().replace(/^www\./, ""); } catch { return ""; } }
function sameDomain(candidate, target) { const c = host(candidate); const t = host(target); return Boolean(c && t && (c === t || c.endsWith(`.${t}`) || t.endsWith(`.${c}`))); }
function legalPath(url) { try { const parsed = new URL(url); return LEGAL_PATH_RE.test(`${parsed.pathname || ""} ${parsed.search || ""}`) || /\.pdf$/i.test(parsed.pathname || ""); } catch { return false; } }
function estimateTokens(chars) { return Math.ceil(Number(chars || 0) / ESTIMATED_CHARS_PER_TOKEN); }

function collectCandidates(review = {}) {
  const out = [];
  for (const doc of asArray(review.legal_stack)) {
    const urls = [doc?.unadmitted_document_url, ...(Array.isArray(doc?.unadmitted_document_url_candidates) ? doc.unadmitted_document_url_candidates : [])]
      .map(normalizeUrl)
      .filter(Boolean);
    for (const url of urls) out.push({ url, document_type: doc?.document_type || "Legal Document" });
  }
  const seen = new Set();
  return out.filter((candidate) => {
    if (seen.has(candidate.url)) return false;
    seen.add(candidate.url);
    return true;
  });
}

function decodeHtmlEntities(input) {
  let text = String(input || "");
  const named = { nbsp: " ", amp: "&", lt: "<", gt: ">", quot: "\"", apos: "'" };
  text = text.replace(/&([a-zA-Z][a-zA-Z0-9]+);/g, (match, name) => Object.prototype.hasOwnProperty.call(named, String(name || "").toLowerCase()) ? named[String(name || "").toLowerCase()] : match);
  text = text.replace(/&#(\d+);/g, (match, code) => { try { return String.fromCodePoint(Number(code)); } catch { return match; } });
  text = text.replace(/&#x([0-9a-fA-F]+);/g, (match, code) => { try { return String.fromCodePoint(Number.parseInt(code, 16)); } catch { return match; } });
  return text;
}

function stripHtml(html) {
  let text = String(html || "");
  text = text.replace(/<script[\s\S]*?<\/script>/gi, "\n").replace(/<style[\s\S]*?<\/style>/gi, "\n").replace(/<!--[\s\S]*?-->/g, "\n");
  text = text.replace(/<\/(p|div|section|article|header|footer|main|li|tr|h[1-6])>/gi, "\n").replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<[^>]+>/g, " ");
  text = decodeHtmlEntities(text);
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/[ \t\f\v]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function titleFromHtml(html, fallback) {
  const match = String(html || "").match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? stripHtml(match[1]) : fallback;
}

function titleFromUrl(url, documentType = "Legal Document") {
  try {
    const last = decodeURIComponent((new URL(url).pathname || "").split("/").filter(Boolean).pop() || "");
    return last ? `${documentType}: ${last.replace(/\.pdf$/i, "")}` : documentType;
  } catch {
    return documentType;
  }
}

async function fetchBuffer(url, timeoutMs, maxBytes) {
  const safeUrl = await validateCaptureUrl(url);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(safeUrl, { method: "GET", redirect: "follow", signal: controller.signal, headers: { "user-agent": "LexNovaHQ-Stage6LegalDocReconciler/0.1", accept: "application/pdf,text/html,application/xhtml+xml,application/xml,text/plain,*/*;q=0.5" } });
    const contentLength = Number(response.headers.get("content-length") || 0);
    if (contentLength && contentLength > maxBytes) throw new Error(`legal_document_too_large:${contentLength}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > maxBytes) throw new Error(`legal_document_too_large:${buffer.length}`);
    return { ok: response.ok, status: response.status, final_url: normalizeUrl(response.url) || safeUrl, content_type: response.headers.get("content-type") || "", buffer };
  } finally {
    clearTimeout(timer);
  }
}

async function extractText(fetched, candidate) {
  const contentType = fetched.content_type || "";
  const isPdf = PDF_CONTENT_RE.test(contentType) || /\.pdf(?:$|[?#])/i.test(fetched.final_url || candidate.url || "");
  if (isPdf) {
    const pdfParse = require("pdf-parse");
    const parsed = await pdfParse(fetched.buffer);
    const text = String(parsed?.text || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/[ \t\f\v]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
    return { clean_text: text, extraction_mode: "pdf_text_extraction", source_type: "legal_document_pdf", title: titleFromUrl(fetched.final_url || candidate.url, candidate.document_type) };
  }
  if (HTML_CONTENT_RE.test(contentType) || !contentType) {
    const html = fetched.buffer.toString("utf8");
    return { clean_text: stripHtml(html), extraction_mode: "html_visible_text_extraction", source_type: "legal_document_html", title: titleFromHtml(html, titleFromUrl(fetched.final_url || candidate.url, candidate.document_type)) };
  }
  throw new Error(`unsupported_content_type:${contentType}`);
}

function buildEvidence({ candidate, fetched, extracted, index }) {
  const sourceUrl = normalizeUrl(candidate.url) || candidate.url;
  const finalUrl = normalizeUrl(fetched.final_url) || sourceUrl;
  const id = `LEGAL_RECON_${String(index + 1).padStart(3, "0")}`;
  const text = extracted.clean_text || "";
  const textHash = sha256(text);
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const common = { evidence_source_id: id, source_family: "legal_profile", source_url: sourceUrl, final_url: finalUrl, title: extracted.title, clean_text_sha256: textHash, word_count: wordCount, estimated_source_tokens: estimateTokens(text.length) };
  return {
    artifact: { ...common, clean_text_length: text.length, coverage_status: `${extracted.source_type}_text_extracted`, full_text_in_evidence_buffer: true, reconciled_legal_document_url: true },
    evidence: { ...common, clean_text_lossless: text, evidence_policy: { admitted_source: true, discovery_only: false, full_text_lossless: true, summarized: false, compressed: false, truncated_by_stage_6_adapter: false, same_domain_legal_document_reconciliation: true, source_type: extracted.source_type } }
  };
}

export function hasUnadmittedLegalDocumentCandidates(legalStackReview = {}) {
  return collectCandidates(legalStackReview).length > 0;
}

export async function reconcileStage6LegalDocumentInput({ legalStackReview, legalStackReviewInput, timeoutMs = 15000, maxBytes = DEFAULT_MAX_BYTES } = {}) {
  const candidates = collectCandidates(legalStackReview);
  const targetUrl = legalStackReviewInput?.source_bundle?.target_input?.primary_url || null;
  const admittedUrls = new Set(asArray(legalStackReviewInput?.source_bundle?.evidence_buffer).flatMap((record) => [normalizeUrl(record.source_url), normalizeUrl(record.final_url)].filter(Boolean)));
  const resolved = [];
  const rejected = [];
  const nextInput = JSON.parse(JSON.stringify(legalStackReviewInput || {}));
  nextInput.source_bundle = nextInput.source_bundle || {};
  nextInput.source_bundle.artifact_inventory = asArray(nextInput.source_bundle.artifact_inventory);
  nextInput.source_bundle.evidence_buffer = asArray(nextInput.source_bundle.evidence_buffer);
  nextInput.source_bundle.source_review = nextInput.source_bundle.source_review || {};
  nextInput.source_bundle.limitations = asArray(nextInput.source_bundle.limitations);

  for (const candidate of candidates) {
    const url = normalizeUrl(candidate.url);
    if (!url) continue;
    if (admittedUrls.has(url)) continue;
    if (targetUrl && !sameDomain(url, targetUrl)) { rejected.push({ ...candidate, reason: "not_same_domain" }); continue; }
    if (!legalPath(url)) { rejected.push({ ...candidate, reason: "not_legal_document_path" }); continue; }
    try {
      const fetched = await fetchBuffer(url, timeoutMs, maxBytes);
      if (!fetched.ok) { rejected.push({ ...candidate, reason: `fetch_status_${fetched.status}` }); continue; }
      const extracted = await extractText(fetched, candidate);
      if (!extracted.clean_text || extracted.clean_text.length < 40) { rejected.push({ ...candidate, reason: "extracted_text_too_short" }); continue; }
      const built = buildEvidence({ candidate, fetched, extracted, index: nextInput.source_bundle.evidence_buffer.length });
      nextInput.source_bundle.artifact_inventory.push(built.artifact);
      nextInput.source_bundle.evidence_buffer.push(built.evidence);
      admittedUrls.add(normalizeUrl(built.evidence.source_url));
      admittedUrls.add(normalizeUrl(built.evidence.final_url));
      resolved.push({ url, final_url: built.evidence.final_url, document_type: candidate.document_type, source_type: built.evidence.evidence_policy.source_type, clean_text_length: built.evidence.clean_text_lossless.length, word_count: built.evidence.word_count });
    } catch (error) {
      rejected.push({ ...candidate, reason: error?.message || "resolution_failed" });
    }
  }

  if (resolved.length) {
    nextInput.source_bundle.source_review.included_source_count = Number(nextInput.source_bundle.source_review.included_source_count || 0) + resolved.length;
    nextInput.source_bundle.source_review.packet_source_count = Number(nextInput.source_bundle.source_review.packet_source_count || 0) + resolved.length;
    nextInput.source_bundle.limitations.push(`Stage 6 reconciled ${resolved.length} same-domain legal document URL(s) surfaced during legal-stack review and reran the review with extracted legal text.`);
    nextInput.adapter_policy = { ...(nextInput.adapter_policy || {}), stage6_legal_document_reconciliation_applied: true, reconciliation_rerun_limit: 1 };
  }

  return { ok: true, resolved_count: resolved.length, candidate_count: candidates.length, resolved, rejected, legal_stack_review_input: nextInput };
}
