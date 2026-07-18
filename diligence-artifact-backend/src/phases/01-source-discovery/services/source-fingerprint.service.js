import crypto from "node:crypto";
import { canonicalizeUrl } from "./canonical-url.service.js";
import { assessSourceContentMateriality, assertSourceContentMateriality } from "./source-content-materiality.service.js";

export const PHASE1_SOURCE_FINGERPRINT_SCHEMA_VERSION = "PHASE1_SOURCE_FINGERPRINT_INVENTORY_v1";

const CRAWLABLE_ENTITY_STATUSES = new Set(["PRIMARY_TARGET", "CONTROLLED_OPERATING_SURFACE", "SEPARATE_ENTITY_INCLUDED"]);
const DEFAULT_TIMEOUT_MS = positiveInt(process.env.LN_PHASE1_FINGERPRINT_TIMEOUT_MS, 12000);
const DEFAULT_CONCURRENCY = positiveInt(process.env.LN_PHASE1_FINGERPRINT_CONCURRENCY, 6);
const MAX_FINGERPRINT_BYTES = positiveInt(process.env.LN_PHASE1_FINGERPRINT_MAX_BYTES, 1500000);
const MATERIAL_FETCH_STATUS = "FETCHED";
const NO_MATERIAL_FETCH_STATUS = "FETCHED_NO_MATERIAL_CONTENT";

/**
 * RB-06 lightweight content pass. Each canonical source candidate is fetched at
 * most once inside this pass. The serialised inventory stores only fingerprints
 * and bounded excerpts; complete analysis text stays in the run-local cache.
 * A successful HTTP response is not extractable unless the material-content gate
 * confirms a substantive body after boilerplate removal.
 */
export async function buildSourceFingerprintPass({ canonicalInventory, fetchImpl = globalThis.fetch, fetchCache = new Map(), timeoutMs = DEFAULT_TIMEOUT_MS, concurrency = DEFAULT_CONCURRENCY } = {}) {
  const candidates = canonicalInventory?.canonical_candidates || [];
  const analysisCache = new Map();
  const fingerprints = new Array(candidates.length);
  let cursor = 0;

  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= candidates.length) return;
      const candidate = candidates[index];
      fingerprints[index] = await fingerprintCandidate({ candidate, fetchImpl, fetchCache, timeoutMs, analysisCache });
    }
  }

  await Promise.all(Array.from({ length: Math.max(1, Math.min(concurrency, candidates.length || 1)) }, () => worker()));
  const serialised = fingerprints.filter(Boolean).sort((a, b) => String(a.candidate_id).localeCompare(String(b.candidate_id)));
  const hasFetchLimitations = serialised.some((item) => item.fetch_status === "FETCH_FAILED");
  const hasContentLimitations = serialised.some((item) => item.fetch_status === NO_MATERIAL_FETCH_STATUS);
  const inventory = {
    schema_version: PHASE1_SOURCE_FINGERPRINT_SCHEMA_VERSION,
    status: hasFetchLimitations ? "COMPLETE_WITH_FETCH_LIMITATIONS" : hasContentLimitations ? "COMPLETE_WITH_CONTENT_LIMITATIONS" : "COMPLETE",
    model_usage: "NONE",
    pass_type: "LIGHTWEIGHT_CONTENT_FINGERPRINT_NOT_FINAL_EXTRACTION",
    fetch_once_per_candidate_inside_pass: true,
    http_success_is_not_material_evidence: true,
    material_content_required_for_extraction: true,
    final_extraction_authority: false,
    full_analysis_text_persisted: false,
    counts: {
      canonical_candidates_read: candidates.length,
      fingerprints_created: serialised.length,
      fetched: serialised.filter((item) => item.fetch_status === MATERIAL_FETCH_STATUS).length,
      material_content: serialised.filter((item) => item.extraction_eligible === true).length,
      fetched_no_material_content: serialised.filter((item) => item.fetch_status === NO_MATERIAL_FETCH_STATUS).length,
      extraction_eligible: serialised.filter((item) => item.extraction_eligible === true).length,
      skipped_by_entity_boundary: serialised.filter((item) => item.fetch_status === "SKIPPED_ENTITY_BOUNDARY").length,
      failed: serialised.filter((item) => item.fetch_status === "FETCH_FAILED").length,
      exact_content_hashes: new Set(serialised.map((item) => item.exact_content_hash).filter(Boolean)).size,
      fetch_cache_entries: fetchCache.size
    },
    fingerprints: serialised
  };
  return { inventory, analysis_cache: analysisCache, fetch_cache: fetchCache };
}

export function assertSourceFingerprintInventory(inventory) {
  if (inventory?.schema_version !== PHASE1_SOURCE_FINGERPRINT_SCHEMA_VERSION) throw new Error("PHASE1_SOURCE_FINGERPRINT_SCHEMA_INVALID");
  if (inventory.model_usage !== "NONE" || inventory.final_extraction_authority !== false || inventory.full_analysis_text_persisted !== false) throw new Error("PHASE1_SOURCE_FINGERPRINT_BOUNDARY_INVALID");
  if (inventory.http_success_is_not_material_evidence !== true || inventory.material_content_required_for_extraction !== true) throw new Error("PHASE1_SOURCE_FINGERPRINT_MATERIALITY_POLICY_MISSING");
  const seen = new Set();
  for (const item of inventory.fingerprints || []) {
    if (!item.candidate_id || !item.canonical_identity || !item.fetch_status) throw new Error("PHASE1_SOURCE_FINGERPRINT_RECORD_INCOMPLETE");
    if (seen.has(item.candidate_id)) throw new Error(`PHASE1_SOURCE_FINGERPRINT_DUPLICATE_CANDIDATE:${item.candidate_id}`);
    seen.add(item.candidate_id);

    if (item.fetch_status === MATERIAL_FETCH_STATUS) {
      if (item.extraction_eligible !== true || item.content_materiality?.status !== "MATERIAL_CONTENT") throw new Error(`PHASE1_SOURCE_FINGERPRINT_MATERIAL_STATUS_INVALID:${item.candidate_id}`);
      if (!item.exact_content_hash || !item.template_signature || !Array.isArray(item.block_hashes) || item.block_hashes.length === 0) throw new Error(`PHASE1_SOURCE_FINGERPRINT_FETCHED_RECORD_INCOMPLETE:${item.candidate_id}`);
      assertSourceContentMateriality(item.content_materiality);
    } else if (item.fetch_status === NO_MATERIAL_FETCH_STATUS) {
      if (item.extraction_eligible !== false || item.content_materiality?.status !== "NO_MATERIAL_CONTENT") throw new Error(`PHASE1_SOURCE_FINGERPRINT_NO_MATERIAL_STATUS_INVALID:${item.candidate_id}`);
      if (item.exact_content_hash !== null || !Array.isArray(item.block_hashes) || item.block_hashes.length !== 0) throw new Error(`PHASE1_SOURCE_FINGERPRINT_NO_MATERIAL_EVIDENCE_LEAK:${item.candidate_id}`);
      assertSourceContentMateriality(item.content_materiality);
    } else if (item.extraction_eligible === true) {
      throw new Error(`PHASE1_SOURCE_FINGERPRINT_NON_FETCHED_MARKED_ELIGIBLE:${item.candidate_id}`);
    }
  }
  if ((inventory.counts?.extraction_eligible || 0) !== (inventory.fingerprints || []).filter((item) => item.fetch_status === MATERIAL_FETCH_STATUS && item.extraction_eligible === true).length) throw new Error("PHASE1_SOURCE_FINGERPRINT_ELIGIBILITY_COUNT_MISMATCH");
  return { ok: true, fingerprints: seen.size };
}

async function fingerprintCandidate({ candidate, fetchImpl, fetchCache, timeoutMs, analysisCache }) {
  const base = {
    record_type: "SourceFingerprint",
    schema_version: PHASE1_SOURCE_FINGERPRINT_SCHEMA_VERSION,
    fingerprint_id: stableId("FP", candidate.canonical_identity),
    candidate_id: candidate.candidate_id,
    canonical_identity: candidate.canonical_identity,
    entity_id: candidate.entity_id,
    entity_status: candidate.entity_status,
    canonical_url: candidate.canonical_url,
    fetch_url: candidate.fetch_url,
    extraction_eligible: false,
    final_extraction_authority: false
  };

  if (!CRAWLABLE_ENTITY_STATUSES.has(candidate.entity_status)) return {
    ...base,
    fetch_status: "SKIPPED_ENTITY_BOUNDARY",
    limitation: `ENTITY_STATUS_${candidate.entity_status || "UNVERIFIED"}_NOT_CRAWLABLE`
  };

  const fetched = await fetchMaterialized(candidate.fetch_url, { fetchImpl, fetchCache, timeoutMs });
  if (!fetched.ok) return {
    ...base,
    fetch_status: "FETCH_FAILED",
    http_status: fetched.http_status || null,
    limitation: fetched.error || "FETCH_FAILED"
  };

  const parsed = parseDocument(fetched.raw_text, fetched.content_type, fetched.final_url || candidate.fetch_url);
  const boundedText = parsed.main_text.slice(0, MAX_FINGERPRINT_BYTES);
  const blocks = splitMeaningfulBlocks(boundedText);
  const contentMateriality = assessSourceContentMateriality({ text: boundedText, blocks });
  assertSourceContentMateriality(contentMateriality);
  const structureSignals = detectStructureSignals(`${parsed.title}\n${parsed.headings.join("\n")}\n${boundedText}`);
  const common = {
    ...base,
    http_status: fetched.http_status,
    response_url: fetched.final_url,
    content_type: fetched.content_type,
    content_bytes_read: Buffer.byteLength(fetched.raw_text, "utf8"),
    fingerprint_bytes_used: Buffer.byteLength(boundedText, "utf8"),
    text_truncated_for_fingerprint: fetched.raw_text.length > MAX_FINGERPRINT_BYTES,
    title: parsed.title,
    meta_description: parsed.meta_description,
    headings: parsed.headings.slice(0, 80),
    document_date: parsed.document_date,
    canonical_link: parsed.canonical_link,
    template_signature: templateSignature(candidate.canonical_url),
    boilerplate_removed: parsed.boilerplate_removed,
    legal_structure_signals: structureSignals,
    analysis_text_persisted_in_full: false,
    content_materiality: contentMateriality
  };

  if (!contentMateriality.extraction_eligible) return {
    ...common,
    fetch_status: NO_MATERIAL_FETCH_STATUS,
    extraction_eligible: false,
    limitation: "NO_MATERIAL_CONTENT_AFTER_BOILERPLATE_REMOVAL",
    exact_content_hash: null,
    block_hashes: [],
    near_duplicate_signature: { shingle_size: 3, distinct_shingle_count: 0, sampled_hashes: [] },
    analysis_excerpt: "",
    warnings: unique([...(parsed.warnings || []), "NO_MATERIAL_CONTENT_NOT_EXTRACTION_ELIGIBLE"])
  };

  const blockHashes = blocks.map((text, index) => ({ block_index: index + 1, sha256: sha256(normalizeForHash(text)), character_count: text.length }));
  const exactContentHash = sha256(normalizeForHash(boundedText));
  const shingles = buildShingleHashes(boundedText);

  analysisCache.set(candidate.candidate_id, {
    main_text: boundedText,
    blocks,
    normalized_text: normalizeForHash(boundedText),
    token_set: new Set(tokenize(boundedText)),
    structure_signals: structureSignals,
    title: parsed.title,
    headings: parsed.headings,
    meta_description: parsed.meta_description,
    content_materiality: contentMateriality
  });

  return {
    ...common,
    fetch_status: MATERIAL_FETCH_STATUS,
    extraction_eligible: true,
    exact_content_hash: exactContentHash,
    block_hashes: blockHashes,
    near_duplicate_signature: {
      shingle_size: 3,
      distinct_shingle_count: shingles.length,
      sampled_hashes: shingles.slice(0, 96)
    },
    analysis_excerpt: boundedText.slice(0, 4000),
    warnings: parsed.warnings
  };
}

async function fetchMaterialized(url, { fetchImpl, fetchCache, timeoutMs }) {
  const cacheKey = fetchCacheKey(url);
  if (fetchCache.has(cacheKey)) return fetchCache.get(cacheKey);
  if (typeof fetchImpl !== "function") {
    const failed = { ok: false, error: "FETCH_UNAVAILABLE" };
    fetchCache.set(cacheKey, failed);
    return failed;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": "LexNovaHQ-DiligenceReviewer/1.0 (+phase1-lightweight-fingerprint)",
        accept: "text/html,application/xhtml+xml,text/plain,text/markdown,application/json,application/xml,text/xml,*/*;q=0.4"
      }
    });
    const rawText = await response.text();
    const result = response.ok
      ? { ok: true, http_status: response.status, content_type: response.headers?.get?.("content-type") || "", final_url: response.url || url, raw_text: rawText }
      : { ok: false, http_status: response.status, error: `HTTP_${response.status}`, raw_text: rawText };
    fetchCache.set(cacheKey, result);
    return result;
  } catch (error) {
    const result = { ok: false, error: error?.name === "AbortError" ? "FETCH_TIMEOUT" : error?.message || String(error) };
    fetchCache.set(cacheKey, result);
    return result;
  } finally {
    clearTimeout(timer);
  }
}

function parseDocument(rawText, contentType, baseUrl) {
  const raw = String(rawText || "");
  const htmlLike = /html|xhtml/i.test(contentType || "") || /^\s*<!doctype html|<html[\s>]/i.test(raw);
  if (!htmlLike) {
    const text = normalizeText(raw);
    return { title: "", meta_description: "", headings: [], document_date: null, canonical_link: null, main_text: text, boilerplate_removed: false, warnings: [] };
  }

  const title = decodeEntities(firstMatch(raw, /<title[^>]*>([\s\S]*?)<\/title>/i));
  const metaDescription = decodeEntities(firstMatch(raw, /<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i) || firstMatch(raw, /<meta\s+[^>]*content=["']([^"']*)["'][^>]*name=["']description["'][^>]*>/i));
  const canonicalRaw = firstMatch(raw, /<link\b[^>]*rel=["'][^"']*canonical[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>/i);
  const canonical = canonicalRaw ? canonicalizeUrl(canonicalRaw, baseUrl)?.fetch_url || null : null;
  const headings = [...raw.matchAll(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/gi)].map((match) => normalizeText(decodeEntities(stripTags(match[1])))).filter(Boolean);
  const documentDate = extractDocumentDate(raw);
  const mainHtml = extractMainHtml(raw);
  const withBreaks = mainHtml
    .replace(/<\/(?:p|div|section|article|li|h[1-6]|tr|blockquote)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n");
  const mainText = normalizeTextWithBreaks(decodeEntities(stripTags(withBreaks)));
  const warnings = [];
  if (!mainText) warnings.push("NO_MAIN_TEXT_AFTER_BOILERPLATE_REMOVAL");
  return { title: normalizeText(title), meta_description: normalizeText(metaDescription), headings, document_date: documentDate, canonical_link: canonical, main_text: mainText, boilerplate_removed: true, warnings };
}

function extractMainHtml(html) {
  const cleaned = String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<canvas[\s\S]*?<\/canvas>/gi, " ")
    .replace(/<!--([\s\S]*?)-->/g, " ")
    .replace(/<(?:nav|header|footer|aside|form)[^>]*>[\s\S]*?<\/(?:nav|header|footer|aside|form)>/gi, " ")
    .replace(/<[^>]*(?:cookie|consent|banner|breadcrumb|navigation|site-footer|site-header)[^>]*>[\s\S]*?<\/[^>]+>/gi, " ");
  return firstMatch(cleaned, /<main[^>]*>([\s\S]*?)<\/main>/i) || firstMatch(cleaned, /<article[^>]*>([\s\S]*?)<\/article>/i) || firstMatch(cleaned, /<body[^>]*>([\s\S]*?)<\/body>/i) || cleaned;
}

function splitMeaningfulBlocks(text) {
  const rough = String(text || "").split(/\n{2,}|(?<=[.!?])\s+(?=[A-Z0-9])/).map((item) => normalizeText(item)).filter((item) => item.length >= 40);
  const blocks = [];
  let current = "";
  for (const item of rough) {
    if (!current) current = item;
    else if (current.length + item.length < 900) current += ` ${item}`;
    else { blocks.push(current); current = item; }
  }
  if (current) blocks.push(current);
  return blocks;
}

function buildShingleHashes(text) {
  const tokens = tokenize(text);
  const hashes = new Set();
  for (let index = 0; index <= tokens.length - 3; index += 1) hashes.add(sha256(tokens.slice(index, index + 3).join(" ")).slice(0, 16));
  return [...hashes].sort();
}

function templateSignature(value) {
  const normalized = canonicalizeUrl(value);
  if (!normalized) return "unknown";
  const path = normalized.path
    .replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, "{uuid}")
    .replace(/\b\d{3,}\b/g, "{number}")
    .replace(/\b[a-z]{2,20}-to-[a-z]{2,20}\b/gi, "{language-pair}")
    .replace(/\b(?:english|hindi|tamil|telugu|marathi|bengali|gujarati|kannada|malayalam|punjabi|odia|urdu|assamese)\b/gi, "{language}");
  return `${normalized.host}${path}`;
}

function detectStructureSignals(value) {
  const text = String(value || "").toLowerCase();
  const rules = {
    effective_date: /\b(effective date|last updated|updated on|version date)\b/,
    acceptance: /\b(agree|acceptance|by using|bound by)\b/,
    contracting_party: /\b(company|provider|customer|user|party|parties)\b/,
    governing_law: /\b(governing law|jurisdiction|courts? of)\b/,
    liability: /\b(liability|indemnif|warrant(?:y|ies)|disclaimer)\b/,
    termination: /\b(termination|suspension|terminate)\b/,
    personal_data: /\b(personal data|personal information|data subject|privacy rights?)\b/,
    controller_processor: /\b(data controller|data processor|controller|processor)\b/,
    service_level: /\b(service level|uptime|availability commitment|service credit)\b/,
    complaint_grievance: /\b(grievance|complaint|ombudsman|nodal officer)\b/,
    charges_rates: /\b(schedule of charges|fees and charges|interest rate|annual percentage rate)\b/
  };
  return Object.entries(rules).filter(([, regex]) => regex.test(text)).map(([key]) => key);
}

function extractDocumentDate(html) {
  const candidates = [
    firstMatch(html, /<meta\s+[^>]*property=["']article:modified_time["'][^>]*content=["']([^"']+)["']/i),
    firstMatch(html, /<meta\s+[^>]*name=["'](?:last-modified|date|updated)["'][^>]*content=["']([^"']+)["']/i),
    firstMatch(html, /<time\b[^>]*datetime=["']([^"']+)["']/i)
  ].filter(Boolean);
  return candidates[0] || null;
}

function fetchCacheKey(value) { try { const url = new URL(value); url.hash = ""; return url.toString(); } catch { return String(value || ""); } }
function firstMatch(value, regex) { return String(value || "").match(regex)?.[1] || ""; }
function stripTags(value) { return String(value || "").replace(/<[^>]+>/g, " "); }
function decodeEntities(value) { return String(value || "").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, '"').replace(/&#x27;|&#39;/gi, "'"); }
function normalizeText(value) { return String(value || "").replace(/\s+/g, " ").trim(); }
function normalizeTextWithBreaks(value) { return String(value || "").replace(/\r/g, "\n").replace(/[ \t]+/g, " ").replace(/\n[ \t]+/g, "\n").replace(/\n{3,}/g, "\n\n").trim(); }
function normalizeForHash(value) { return normalizeText(value).toLowerCase(); }
function tokenize(value) { return normalizeForHash(value).split(/[^a-z0-9]+/).filter((token) => token.length > 1); }
function sha256(value) { return crypto.createHash("sha256").update(String(value || "")).digest("hex"); }
function stableId(prefix, value) { return `${prefix}.${sha256(value).slice(0, 16)}`; }
function positiveInt(value, fallback) { const parsed = Number.parseInt(value, 10); return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback; }
function unique(values) { return [...new Set((values || []).filter(Boolean))]; }
