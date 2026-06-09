import crypto from "crypto";
import dns from "node:dns/promises";
import net from "node:net";

const BLOCKED_HOSTNAMES = new Set(["localhost", "metadata.google.internal", "metadata", "169.254.169.254"]);

class BlockedCaptureUrlError extends Error {
  constructor(reason, url) {
    super(reason);
    this.name = "BlockedCaptureUrlError";
    this.code = "BLOCKED_CAPTURE_URL";
    this.url = url;
  }
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value || ""), "utf8").digest("hex");
}

function nowIso() {
  return new Date().toISOString();
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

function buildSourceDiscoveryProvenance(source = {}) {
  return {
    source_family: source?.source_family || null,
    discovery_method: source?.discovery_method || null,
    discovery_role: source?.discovery_role || null,
    batch_id: source?.batch_id || null,
    reason: source?.reason || "",
    probe_method: source?.probe_method || null,
    source_bucket: source?.source_bucket || null
  };
}

function parseIpv4Address(value) {
  const text = String(value || "").trim();
  const mapped = text.toLowerCase().startsWith("::ffff:") ? text.slice(7) : text;
  const parts = mapped.split(".");
  if (parts.length !== 4) return null;
  const octets = parts.map((part) => Number(part));
  if (octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) return null;
  return octets;
}

function isBlockedIpv4(value) {
  const octets = parseIpv4Address(value);
  if (!octets) return false;
  const [a, b] = octets;
  return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 198 && (b === 18 || b === 19)) || a >= 224;
}

function isBlockedIpv6(value) {
  const text = String(value || "").trim().toLowerCase();
  if (!text) return false;
  if (text.startsWith("::ffff:")) return isBlockedIpv4(text.slice(7));
  return text === "::" || text === "::1" || text.startsWith("fc") || text.startsWith("fd") || text.startsWith("fe80") || text.startsWith("fe81") || text.startsWith("fe82") || text.startsWith("fe83") || text.startsWith("fe84") || text.startsWith("fe85") || text.startsWith("fe86") || text.startsWith("fe87") || text.startsWith("fe88") || text.startsWith("fe89") || text.startsWith("fe8a") || text.startsWith("fe8b") || text.startsWith("fe8c") || text.startsWith("fe8d") || text.startsWith("fe8e") || text.startsWith("fe8f") || text.startsWith("fe90") || text.startsWith("fea") || text.startsWith("feb");
}

function isBlockedIpAddress(value) {
  const ipType = net.isIP(value);
  if (ipType === 4) return isBlockedIpv4(value);
  if (ipType === 6) return isBlockedIpv6(value);
  return false;
}

function isBlockedHostname(hostname) {
  const host = String(hostname || "").toLowerCase().replace(/\.$/, "");
  return BLOCKED_HOSTNAMES.has(host) || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal") || host.endsWith(".metadata.google.internal");
}

export async function validateCaptureUrl(value) {
  const normalized = normalizeUrl(value);
  if (!normalized) throw new BlockedCaptureUrlError("invalid_url", String(value || ""));
  const parsed = new URL(normalized);
  if (!["http:", "https:"].includes(parsed.protocol)) throw new BlockedCaptureUrlError("blocked_protocol", normalized);
  const hostname = parsed.hostname.toLowerCase().replace(/\.$/, "");
  if (isBlockedHostname(hostname)) throw new BlockedCaptureUrlError("blocked_hostname", normalized);
  if (net.isIP(hostname)) {
    if (isBlockedIpAddress(hostname)) throw new BlockedCaptureUrlError("blocked_ip", normalized);
    return normalized;
  }
  let resolved;
  try {
    resolved = await dns.lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new BlockedCaptureUrlError("dns_lookup_failed", normalized);
  }
  if (!Array.isArray(resolved) || resolved.length === 0) throw new BlockedCaptureUrlError("dns_lookup_empty", normalized);
  const blockedAddress = resolved.find((entry) => isBlockedIpAddress(entry.address));
  if (blockedAddress) throw new BlockedCaptureUrlError("blocked_resolved_ip", normalized);
  return normalized;
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

function removeTagBlock(html, tagName) {
  let text = String(html || "");
  const openNeedle = "<" + tagName;
  const closeNeedle = "</" + tagName + ">";
  while (true) {
    const lower = text.toLowerCase();
    const start = lower.indexOf(openNeedle);
    if (start === -1) break;
    const close = lower.indexOf(closeNeedle, start);
    if (close === -1) {
      text = text.slice(0, start);
      break;
    }
    text = text.slice(0, start) + "\n" + text.slice(close + closeNeedle.length);
  }
  return text;
}

function stripTagsPreserveVisibleText(html) {
  let text = String(html || "");
  for (const tag of ["script", "style", "svg", "canvas"]) text = removeTagBlock(text, tag);
  text = text.replace(/<!--[\s\S]*?-->/g, "\n");
  for (const tag of ["br", "p", "div", "section", "article", "header", "footer", "main", "li", "tr", "h[1-6]"]) text = text.replace(new RegExp(`</${tag}>`, "gi"), "\n");
  text = text.replace(/<[^>]+>/g, " ");
  text = decodeHtmlEntities(text);
  text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/[ \t\f\v]+/g, " ").replace(/\n[ \t]+/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n");
  return text.trim();
}

function extractTitle(html) {
  const match = String(html || "").match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? stripTagsPreserveVisibleText(match[1]) : "";
}

function extractMetaDescription(html) {
  const source = String(html || "");
  const tag = source.match(/<meta[^>]+name=["']description["'][^>]*>/i)?.[0] || "";
  const content = tag.match(/content=["']([^"']*)["']/i)?.[1] || "";
  return decodeHtmlEntities(content).trim();
}

function extractHeadings(html) {
  const headings = [];
  const source = String(html || "");
  const re = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
  let match;
  while ((match = re.exec(source)) !== null) {
    const text = stripTagsPreserveVisibleText(match[2]);
    if (text) headings.push({ level: Number(match[1]), text });
  }
  return headings;
}

function extractLinks(html, baseUrl) {
  const links = [];
  const source = String(html || "");
  const re = /<a\s[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = re.exec(source)) !== null) {
    try { links.push({ href: new URL(match[1], baseUrl).toString(), text: stripTagsPreserveVisibleText(match[2]) }); } catch { continue; }
  }
  const seen = new Set();
  return links.filter((link) => {
    const key = link.href + "|" + link.text;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildSectionIndex(cleanText, headings) {
  const sections = [];
  for (const heading of headings || []) {
    const index = cleanText.indexOf(heading.text);
    if (index !== -1) sections.push({ heading: heading.text, level: heading.level, start_char: index, end_char: null });
  }
  sections.sort((a, b) => a.start_char - b.start_char);
  for (let i = 0; i < sections.length; i += 1) sections[i].end_char = i + 1 < sections.length ? sections[i + 1].start_char : cleanText.length;
  return sections;
}

function countWords(text) {
  return String(text || "").trim().split(/\s+/).filter(Boolean).length;
}

function buildChunks({ cleanText, sourceUrl, chunkSize = 6000, chunkOverlap = 300 }) {
  const text = String(cleanText || "");
  const size = Math.max(1000, Number(chunkSize || 6000));
  const overlap = Math.max(0, Math.min(Number(chunkOverlap || 0), Math.floor(size / 2)));
  const chunks = [];
  if (!text) return chunks;
  let start = 0;
  let index = 1;
  while (start < text.length) {
    const end = Math.min(start + size, text.length);
    const chunkText = text.slice(start, end);
    chunks.push({ chunk_id: "chunk_" + String(index).padStart(4, "0"), source_url: sourceUrl, start_char: start, end_char: end, text: chunkText, text_sha256: sha256(chunkText) });
    if (end >= text.length) break;
    start = end - overlap;
    index += 1;
  }
  return chunks;
}

async function fetchHtml(url, timeoutMs) {
  let currentUrl = await validateCaptureUrl(url);
  const maxRedirects = 5;
  for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(currentUrl, { method: "GET", redirect: "manual", signal: controller.signal, headers: { "user-agent": "LexNovaHQ-SourceCapture/0.3C", accept: "text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.8,*/*;q=0.5" } });
      if (response.status >= 300 && response.status < 400 && response.headers.get("location")) {
        currentUrl = await validateCaptureUrl(new URL(response.headers.get("location"), currentUrl).toString());
        continue;
      }
      const rawHtml = await response.text();
      return { ok: response.ok, http_status: response.status, final_url: normalizeUrl(response.url) || currentUrl, content_type: response.headers.get("content-type") || "", raw_html: rawHtml };
    } finally {
      clearTimeout(timer);
    }
  }
  throw new BlockedCaptureUrlError("redirect_limit_exceeded", currentUrl);
}

export async function captureOneSource(source, options = {}) {
  const sourceUrl = normalizeUrl(source?.url || source);
  const sourceFamily = source?.source_family || null;
  const discovery = buildSourceDiscoveryProvenance(source || {});
  const timeoutMs = Number(options.timeoutMs || options.timeout_ms || 15000);
  const includeRawHtml = options.include_raw_html === true;
  const includeCleanText = options.include_clean_text !== false;

  if (!sourceUrl) {
    return { url: String(source?.url || source || ""), source_family: sourceFamily, discovery, fetch: { ok: false, error: "invalid_url" }, raw: { raw_html_length: 0, raw_html_sha256: sha256("") }, text: { extraction_mode: "lossless_visible_text", clean_text_length: 0, clean_text_sha256: sha256(""), word_count: 0, truncated_in_storage: false, truncated_in_response: false }, structure: { title: "", meta_description: "", headings: [], section_index: [], links: [] }, chunks: [], quality: { empty_page: true, likely_js_rendered: false, word_count: 0, coverage_status: "invalid_url" } };
  }

  try {
    const fetched = await fetchHtml(sourceUrl, timeoutMs);
    const rawHtml = fetched.raw_html || "";
    const cleanText = stripTagsPreserveVisibleText(rawHtml);
    const headings = extractHeadings(rawHtml);
    const links = extractLinks(rawHtml, fetched.final_url || sourceUrl);
    const sections = buildSectionIndex(cleanText, headings);
    const chunks = buildChunks({ cleanText, sourceUrl: fetched.final_url || sourceUrl, chunkSize: options.chunk_size || 6000, chunkOverlap: options.chunk_overlap || 300 });
    const wordCount = countWords(cleanText);
    const record = { url: sourceUrl, source_family: sourceFamily, discovery, fetch: { ok: fetched.ok, http_status: fetched.http_status, final_url: fetched.final_url, content_type: fetched.content_type, fetched_at: nowIso() }, raw: { raw_html_length: rawHtml.length, raw_html_sha256: sha256(rawHtml) }, text: { extraction_mode: "lossless_visible_text", clean_text_length: cleanText.length, clean_text_sha256: sha256(cleanText), word_count: wordCount, truncated_in_storage: false, truncated_in_response: false }, structure: { title: extractTitle(rawHtml), meta_description: extractMetaDescription(rawHtml), headings, section_index: sections, links }, chunks, quality: { empty_page: cleanText.length === 0, likely_js_rendered: rawHtml.length > 0 && cleanText.length < 200, word_count: wordCount, coverage_status: cleanText.length > 0 ? "full_visible_text_captured" : "html_fetch_insufficient" } };
    if (includeRawHtml) record.raw.raw_html = rawHtml;
    if (includeCleanText) record.text.clean_text_lossless = cleanText;
    return record;
  } catch (error) {
    return { url: sourceUrl, source_family: sourceFamily, discovery, fetch: { ok: false, error: error?.code || error?.name || error?.message || "FETCH_FAILED", error_detail: error?.message || null, fetched_at: nowIso() }, raw: { raw_html_length: 0, raw_html_sha256: sha256("") }, text: { extraction_mode: "lossless_visible_text", clean_text_length: 0, clean_text_sha256: sha256(""), word_count: 0, truncated_in_storage: false, truncated_in_response: false }, structure: { title: "", meta_description: "", headings: [], section_index: [], links: [] }, chunks: [], quality: { empty_page: true, likely_js_rendered: false, word_count: 0, coverage_status: error?.code === "BLOCKED_CAPTURE_URL" ? "blocked_url" : "fetch_failed" } };
  }
}

function hasExplicitMaxSources(options = {}) {
  return Object.prototype.hasOwnProperty.call(options, "max_sources") && Number.isFinite(Number(options.max_sources)) && Number(options.max_sources) >= 0;
}

export async function captureSources(sources, options = {}) {
  const inputSources = Array.isArray(sources) ? sources : [];
  const selected = hasExplicitMaxSources(options) ? inputSources.slice(0, Number(options.max_sources)) : inputSources;
  const sourceRecords = [];
  for (const source of selected) sourceRecords.push(await captureOneSource(source, options));
  const fetchOk = sourceRecords.filter((record) => record.fetch?.ok === true).length;
  const fetchFailed = sourceRecords.length - fetchOk;
  const totalChunks = sourceRecords.reduce((sum, record) => sum + (record.chunks?.length || 0), 0);
  return { source_records: sourceRecords, counts: { input_sources: inputSources.length, processed_sources: sourceRecords.length, fetch_ok: fetchOk, fetch_failed: fetchFailed, total_chunks: totalChunks, source_limit_applied: hasExplicitMaxSources(options), max_sources: hasExplicitMaxSources(options) ? Number(options.max_sources) : null } };
}
