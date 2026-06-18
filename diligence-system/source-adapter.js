import crypto from "crypto";

const ADAPTER_VERSION = "source_adapter_prompt_supremacy_v1";
const DEFAULT_MAX_CANDIDATES = 24;
const DEFAULT_FETCH_TIMEOUT_MS = 15000;
const DEFAULT_USER_AGENT = "InterfaceDiligenceSystem/1.0 (+public-footprint-diligence)";

const PRIORITY_PATHS = [
  "/",
  "/privacy", "/privacy-policy", "/legal/privacy", "/policies/privacy-policy",
  "/terms", "/terms-of-service", "/legal/terms", "/terms-and-conditions",
  "/security", "/trust", "/trust-center", "/subprocessors", "/sub-processors", "/dpa",
  "/product", "/products", "/platform", "/solutions", "/features",
  "/docs", "/documentation", "/developers", "/developer", "/api", "/pricing"
];

export async function runSourceAdapter({ input = {}, baseDir = process.cwd(), fetchImpl = globalThis.fetch, now = new Date() } = {}) {
  const run = normalizeInput(input);
  const startedAt = now.toISOString();
  const maxCandidates = positiveInt(input.max_candidate_sources || input.maxCandidateSources || process.env.DILIGENCE_SOURCE_MAX_URLS, DEFAULT_MAX_CANDIDATES);
  const timeoutMs = positiveInt(input.fetch_timeout_ms || input.fetchTimeoutMs || process.env.DILIGENCE_SOURCE_FETCH_TIMEOUT_MS, DEFAULT_FETCH_TIMEOUT_MS);
  const candidateQueue = [];
  const discoveryRecords = [];
  const failedSources = [];
  const rejectedSources = [];
  const deferredSources = [];
  const limitations = [];

  if (run.pasted_public_material) {
    candidateQueue.push(buildTextCandidate({ run, startedAt }));
  }

  if (isUrlMode(run.source_mode) && run.target_url) {
    if (typeof fetchImpl !== "function") {
      limitations.push("FETCH_IMPL_UNAVAILABLE_FOR_URL_MODE");
    } else {
      const discovered = await discoverUrlCandidates({ run, fetchImpl, timeoutMs, maxCandidates, discoveryRecords, failedSources });
      candidateQueue.push(...discovered);
    }
  }

  const uniqueQueue = uniqueCandidates(candidateQueue, rejectedSources).slice(0, maxCandidates);
  if (candidateQueue.length > uniqueQueue.length) {
    deferredSources.push(...candidateQueue.slice(uniqueQueue.length).map((item) => ({ source_url: item.source_url, reason: "CANDIDATE_LIMIT_DEFERRED" })));
  }

  const fetchedCandidates = [];
  for (let index = 0; index < uniqueQueue.length; index += 1) {
    const item = uniqueQueue[index];
    if (item.inline_text) {
      fetchedCandidates.push(materializeCandidate({ item, index, run, startedAt, rejectedSources }));
      continue;
    }
    const fetched = await fetchCandidate({ item, index, run, fetchImpl, timeoutMs, startedAt, failedSources });
    if (fetched) fetchedCandidates.push(fetched);
  }

  const finalCandidates = dedupeByText(fetchedCandidates, rejectedSources);
  if (!finalCandidates.length) limitations.push("NO_CANDIDATE_SOURCE_MATERIAL_AVAILABLE_AFTER_STAGE0");

  const losslessTextArtifacts = finalCandidates.map((source) => ({
    source_id: source.source_id,
    source_url: source.source_url,
    raw_text_ref: source.raw_text_ref,
    clean_text_ref: source.clean_text_ref,
    raw_content_hash: source.raw_content_hash,
    normalized_text_hash: source.normalized_text_hash,
    raw_char_count: source.raw_char_count,
    clean_char_count: source.clean_char_count,
    word_count: source.word_count,
    custody_status: source.custody_status
  }));

  const hybrid_extraction_manifest = {
    node_id: "S0",
    adapter_version: ADAPTER_VERSION,
    source_mode: run.source_mode,
    run_id: run.run_id,
    target_url: run.target_url || "N/A",
    normalized_target_url: run.target_url ? normalizeUrl(run.target_url) : "N/A",
    company_name: run.company_name || "N/A",
    generated_at: startedAt,
    candidate_sources: finalCandidates,
    lossless_text_artifacts: losslessTextArtifacts,
    artifact_store_manifest: losslessTextArtifacts,
    rejected_sources: rejectedSources,
    deferred_sources: deferredSources,
    failed_sources: failedSources,
    batch_plan: {
      max_candidate_sources: maxCandidates,
      candidate_count: finalCandidates.length,
      discovery_record_count: discoveryRecords.length,
      fetch_timeout_ms: timeoutMs
    },
    controlled_limitations: limitations
  };

  const extraction_forensic_ledger = {
    node_id: "S0",
    adapter_version: ADAPTER_VERSION,
    run_id: run.run_id,
    source_mode: run.source_mode,
    target_url: run.target_url || null,
    started_at: startedAt,
    completed_at: new Date().toISOString(),
    candidate_count: finalCandidates.length,
    rejected_count: rejectedSources.length,
    deferred_count: deferredSources.length,
    failed_count: failedSources.length,
    discovery_records: discoveryRecords,
    controlled_limitations: limitations
  };

  return { hybrid_extraction_manifest, extraction_forensic_ledger };
}

async function discoverUrlCandidates({ run, fetchImpl, timeoutMs, maxCandidates, discoveryRecords, failedSources }) {
  const root = normalizeUrl(run.target_url);
  const origin = getOrigin(root);
  const candidates = [];
  const add = (url, basis) => {
    const normalized = normalizeUrl(url, origin);
    if (!normalized || !sameOrigin(normalized, origin)) return;
    const hint = classifyCandidateSource(normalized);
    candidates.push({
      source_url: normalized,
      normalized_url: normalized,
      discovery_basis: basis,
      source_family_hint: hint.source_family_hint,
      priority_tier: hint.priority_tier,
      inline_text: ""
    });
  };

  add(root, "TARGET_ROOT");
  for (const p of PRIORITY_PATHS) add(new URL(p, origin).href, "DETERMINISTIC_PRIORITY_PATH");

  const rootFetch = await fetchUrlText({ url: root, fetchImpl, timeoutMs });
  discoveryRecords.push({ source_url: root, method: "ROOT_LINK_DISCOVERY", ok: rootFetch.ok, status_code: rootFetch.status_code || null, error: rootFetch.error || null });
  if (rootFetch.ok) {
    const links = extractLinks(rootFetch.raw_text, origin).slice(0, maxCandidates * 4);
    for (const link of links) {
      if (isUsefulFirstPartyPath(link)) add(link, "ROOT_LINK_DISCOVERY");
    }
  } else {
    failedSources.push({ source_url: root, failure_stage: "DISCOVERY_ROOT_FETCH", error: rootFetch.error || "ROOT_FETCH_FAILED", status_code: rootFetch.status_code || null });
  }

  return uniqueCandidates(candidates, []).slice(0, maxCandidates);
}

async function fetchCandidate({ item, index, run, fetchImpl, timeoutMs, startedAt, failedSources }) {
  const result = await fetchUrlText({ url: item.source_url, fetchImpl, timeoutMs });
  if (!result.ok) {
    failedSources.push({ source_url: item.source_url, failure_stage: "FETCH_OR_EXTRACT", error: result.error || "FETCH_FAILED", status_code: result.status_code || null });
    return null;
  }
  const rawText = result.raw_text || "";
  const cleanText = cleanExtractedText(rawText, result.content_type);
  if (!cleanText.trim()) {
    failedSources.push({ source_url: item.source_url, failure_stage: "CLEAN_TEXT_EMPTY", error: "NO_EXTRACTABLE_TEXT", status_code: result.status_code || null });
    return null;
  }
  return buildCandidateRecord({ item, index, run, startedAt, rawText, cleanText, fetchMeta: result });
}

function materializeCandidate({ item, index, run, startedAt }) {
  const rawText = item.inline_text;
  const cleanText = cleanPlainText(rawText);
  return buildCandidateRecord({ item, index, run, startedAt, rawText, cleanText, fetchMeta: { ok: true, status_code: null, content_type: "text/plain", fetch_method: "USER_SUPPLIED_TEXT" } });
}

function buildCandidateRecord({ item, index, run, startedAt, rawText, cleanText, fetchMeta }) {
  const sourceId = `S0_CAND_${String(index + 1).padStart(3, "0")}`;
  const rawHash = sha256(rawText);
  const cleanHash = sha256(normalizeForHash(cleanText));
  return {
    source_id: sourceId,
    source_url: item.source_url,
    normalized_url: item.normalized_url || item.source_url,
    canonical_url: item.normalized_url || item.source_url,
    source_kind: run.source_mode === "synthetic_demo" ? "synthetic_demo_material" : item.source_url === "PASTED_PUBLIC_MATERIAL" ? "user_supplied_public_material" : "first_party_public_url",
    source_family_hint: item.source_family_hint || "unknown_candidate",
    priority_tier: item.priority_tier || "P3",
    discovery_basis: item.discovery_basis || "USER_SUPPLIED_TEXT",
    fetch_method: fetchMeta.fetch_method || "HTTP_FETCH",
    status_code: fetchMeta.status_code || null,
    content_type: fetchMeta.content_type || null,
    fetched_at: startedAt,
    raw_text_ref: `stage0://${sourceId}/raw_text`,
    clean_text_ref: `stage0://${sourceId}/clean_text`,
    raw_content_hash: rawHash,
    normalized_text_hash: cleanHash,
    raw_text: rawText,
    clean_text: cleanText,
    raw_char_count: rawText.length,
    clean_char_count: cleanText.length,
    char_count: cleanText.length,
    word_count: countWords(cleanText),
    extraction_quality: classifyExtractionQuality(cleanText),
    custody_status: "candidate_only_pending_phase_1_admission"
  };
}

function buildTextCandidate({ run }) {
  return {
    source_url: run.target_url || "PASTED_PUBLIC_MATERIAL",
    normalized_url: run.target_url || "PASTED_PUBLIC_MATERIAL",
    discovery_basis: run.source_mode === "synthetic_demo" ? "SYNTHETIC_DEMO_INPUT" : "USER_SUPPLIED_PUBLIC_TEXT",
    source_family_hint: run.source_mode === "synthetic_demo" ? "synthetic_demo_candidate" : "user_supplied_public_material",
    priority_tier: "P1",
    inline_text: run.pasted_public_material
  };
}

async function fetchUrlText({ url, fetchImpl, timeoutMs }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, {
      method: "GET",
      signal: controller.signal,
      headers: { "user-agent": DEFAULT_USER_AGENT, "accept": "text/html,text/plain,application/xhtml+xml,application/xml;q=0.8,*/*;q=0.5" }
    });
    const contentType = response.headers?.get?.("content-type") || "";
    const rawText = await response.text();
    return { ok: response.ok, status_code: response.status, content_type: contentType, raw_text: rawText, fetch_method: "HTTP_FETCH", error: response.ok ? null : `HTTP_${response.status}` };
  } catch (err) {
    return { ok: false, error: err?.name === "AbortError" ? "FETCH_TIMEOUT" : err?.message || String(err) };
  } finally {
    clearTimeout(timeout);
  }
}

function classifyCandidateSource(url) {
  const pathname = safePathname(url);
  if (pathname === "/" || pathname === "") return { source_family_hint: "root_homepage_candidate", priority_tier: "P1" };
  if (/(privacy|terms|legal|dpa|subprocessor|sub-processors|aup|acceptable-use|cookie|policy|policies)/i.test(pathname)) return { source_family_hint: "legal_governance_candidate", priority_tier: "P1" };
  if (/(trust|security|compliance|gdpr|soc|iso|status)/i.test(pathname)) return { source_family_hint: "trust_security_candidate", priority_tier: "P2" };
  if (/(docs|documentation|developer|developers|api|reference|sdk|guide)/i.test(pathname)) return { source_family_hint: "docs_developer_candidate", priority_tier: "P2" };
  if (/(product|products|platform|solution|solutions|feature|features|model|models|studio|agent|agents)/i.test(pathname)) return { source_family_hint: "product_surface_candidate", priority_tier: "P1" };
  if (/(pricing|plans|enterprise|customers|case-stud)/i.test(pathname)) return { source_family_hint: "commercial_candidate", priority_tier: "P3" };
  return { source_family_hint: "general_first_party_candidate", priority_tier: "P3" };
}

function extractLinks(html, origin) {
  const links = [];
  const re = /href\s*=\s*["']([^"'#]+)["']/gi;
  let match;
  while ((match = re.exec(String(html || "")))) {
    const href = match[1];
    if (/^(mailto:|tel:|javascript:|#)/i.test(href)) continue;
    const normalized = normalizeUrl(href, origin);
    if (normalized) links.push(normalized);
  }
  return links;
}

function isUsefulFirstPartyPath(url) {
  const path = safePathname(url);
  return path === "/" || /(privacy|terms|legal|dpa|subprocessor|trust|security|docs|developer|api|product|platform|solution|feature|pricing|models|studio|agents?)/i.test(path);
}

function cleanExtractedText(raw, contentType = "") {
  if (/html|xml/i.test(contentType) || /<html|<body|<div|<p|<section|<article/i.test(raw)) return cleanHtmlText(raw);
  return cleanPlainText(raw);
}

function cleanHtmlText(html) {
  return cleanPlainText(String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"'));
}

function cleanPlainText(value) {
  return String(value || "").replace(/\r/g, "\n").replace(/[\t ]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function dedupeByText(candidates, rejectedSources) {
  const seen = new Map();
  const out = [];
  for (const candidate of candidates) {
    const hash = candidate.normalized_text_hash;
    if (seen.has(hash)) {
      rejectedSources.push({ source_url: candidate.source_url, reason: "DUPLICATE_NORMALIZED_TEXT", duplicate_of: seen.get(hash) });
      continue;
    }
    seen.set(hash, candidate.source_id);
    out.push(candidate);
  }
  return out;
}

function uniqueCandidates(candidates, rejectedSources = []) {
  const seen = new Set();
  const out = [];
  for (const candidate of candidates) {
    const key = candidate.normalized_url || candidate.source_url;
    if (!key || seen.has(key)) {
      if (key) rejectedSources.push({ source_url: candidate.source_url, reason: "DUPLICATE_URL_CANDIDATE" });
      continue;
    }
    seen.add(key);
    out.push(candidate);
  }
  return out;
}

function normalizeInput(input) {
  return {
    run_id: String(input.run_id || input.runId || createRunId()).trim(),
    source_mode: String(input.source_mode || input.sourceMode || "text").trim(),
    target_url: String(input.target_url || input.targetUrl || "").trim(),
    company_name: String(input.company_name || input.companyName || "").trim(),
    pasted_public_material: String(input.pasted_public_material || input.pastedPublicMaterial || "").trim()
  };
}

function isUrlMode(mode) {
  return /url/i.test(String(mode || ""));
}

function normalizeUrl(value, base) {
  try {
    const raw = String(value || "").trim();
    if (!raw) return "";
    const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : base ? raw : `https://${raw}`;
    const u = new URL(withScheme, base || undefined);
    u.hash = "";
    if (u.pathname !== "/") u.pathname = u.pathname.replace(/\/$/, "");
    return u.href;
  } catch {
    return "";
  }
}

function getOrigin(url) {
  try { return new URL(url).origin; } catch { return ""; }
}

function sameOrigin(url, origin) {
  try { return new URL(url).origin === origin; } catch { return false; }
}

function safePathname(url) {
  try { return new URL(url).pathname || "/"; } catch { return "/"; }
}

function classifyExtractionQuality(text) {
  const words = countWords(text);
  if (words >= 800) return "HIGH_TEXT_DENSITY";
  if (words >= 250) return "MEDIUM_TEXT_DENSITY";
  if (words >= 40) return "LOW_TEXT_DENSITY";
  return "VERY_LOW_TEXT_DENSITY";
}

function countWords(text) {
  return String(text || "").trim().split(/\s+/).filter(Boolean).length;
}

function normalizeForHash(text) {
  return String(text || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value || "")).digest("hex");
}

function positiveInt(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function createRunId() {
  return `run_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
}
