import crypto from "crypto";

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

function decodeHtmlEntities(input) {
  let text = String(input || "");

  const named = {
    nbsp: " ",
    amp: "&",
    lt: "<",
    gt: ">",
    quot: "\"",
    apos: "'"
  };

  text = text.replace(/&([a-zA-Z][a-zA-Z0-9]+);/g, (match, name) => {
    const key = String(name || "").toLowerCase();
    return Object.prototype.hasOwnProperty.call(named, key) ? named[key] : match;
  });

  text = text.replace(/&#(\d+);/g, (match, code) => {
    const n = Number(code);
    if (!Number.isFinite(n)) return match;
    try {
      return String.fromCodePoint(n);
    } catch {
      return match;
    }
  });

  text = text.replace(/&#x([0-9a-fA-F]+);/g, (match, code) => {
    const n = Number.parseInt(code, 16);
    if (!Number.isFinite(n)) return match;
    try {
      return String.fromCodePoint(n);
    } catch {
      return match;
    }
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

  text = removeTagBlock(text, "script");
  text = removeTagBlock(text, "style");
  text = removeTagBlock(text, "svg");
  text = removeTagBlock(text, "canvas");

  text = text.replace(/<!--[\s\S]*?-->/g, "\n");
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<\/p>/gi, "\n");
  text = text.replace(/<\/div>/gi, "\n");
  text = text.replace(/<\/section>/gi, "\n");
  text = text.replace(/<\/article>/gi, "\n");
  text = text.replace(/<\/header>/gi, "\n");
  text = text.replace(/<\/footer>/gi, "\n");
  text = text.replace(/<\/main>/gi, "\n");
  text = text.replace(/<\/li>/gi, "\n");
  text = text.replace(/<\/tr>/gi, "\n");
  text = text.replace(/<\/h[1-6]>/gi, "\n");
  text = text.replace(/<[^>]+>/g, " ");
  text = decodeHtmlEntities(text);

  text = text.replace(/\r\n/g, "\n");
  text = text.replace(/\r/g, "\n");
  text = text.replace(/[ \t\f\v]+/g, " ");
  text = text.replace(/\n[ \t]+/g, "\n");
  text = text.replace(/[ \t]+\n/g, "\n");
  text = text.replace(/\n{3,}/g, "\n\n");

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
    if (!text) continue;
    headings.push({ level: Number(match[1]), text });
  }

  return headings;
}

function extractLinks(html, baseUrl) {
  const links = [];
  const source = String(html || "");
  const re = /<a\s[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = re.exec(source)) !== null) {
    try {
      const href = new URL(match[1], baseUrl).toString();
      const text = stripTagsPreserveVisibleText(match[2]);
      links.push({ href, text });
    } catch {
      continue;
    }
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
    if (index === -1) continue;

    sections.push({
      heading: heading.text,
      level: heading.level,
      start_char: index,
      end_char: null
    });
  }

  sections.sort((a, b) => a.start_char - b.start_char);

  for (let i = 0; i < sections.length; i += 1) {
    sections[i].end_char = i + 1 < sections.length ? sections[i + 1].start_char : cleanText.length;
  }

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

    chunks.push({
      chunk_id: "chunk_" + String(index).padStart(4, "0"),
      source_url: sourceUrl,
      start_char: start,
      end_char: end,
      text: chunkText,
      text_sha256: sha256(chunkText)
    });

    if (end >= text.length) break;

    start = end - overlap;
    index += 1;
  }

  return chunks;
}

async function fetchHtml(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": "LexNovaHQ-SourceCapture/0.3C",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.8,*/*;q=0.5"
      }
    });

    const rawHtml = await response.text();

    return {
      ok: response.ok,
      http_status: response.status,
      final_url: normalizeUrl(response.url) || url,
      content_type: response.headers.get("content-type") || "",
      raw_html: rawHtml
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function captureOneSource(source, options = {}) {
  const sourceUrl = normalizeUrl(source?.url || source);
  const sourceFamily = source?.source_family || null;
  const timeoutMs = Number(options.timeoutMs || 15000);
  const includeRawHtml = options.include_raw_html === true;
  const includeCleanText = options.include_clean_text !== false;

  if (!sourceUrl) {
    return {
      url: String(source?.url || source || ""),
      source_family: sourceFamily,
      fetch: { ok: false, error: "invalid_url" },
      raw: {
        raw_html_length: 0,
        raw_html_sha256: sha256("")
      },
      text: {
        extraction_mode: "lossless_visible_text",
        clean_text_length: 0,
        clean_text_sha256: sha256(""),
        word_count: 0,
        truncated_in_storage: false,
        truncated_in_response: false
      },
      structure: {
        title: "",
        meta_description: "",
        headings: [],
        section_index: [],
        links: []
      },
      chunks: [],
      quality: {
        empty_page: true,
        likely_js_rendered: false,
        word_count: 0,
        coverage_status: "invalid_url"
      }
    };
  }

  try {
    const fetched = await fetchHtml(sourceUrl, timeoutMs);
    const rawHtml = fetched.raw_html || "";
    const cleanText = stripTagsPreserveVisibleText(rawHtml);
    const headings = extractHeadings(rawHtml);
    const links = extractLinks(rawHtml, fetched.final_url || sourceUrl);
    const sections = buildSectionIndex(cleanText, headings);

    const chunks = buildChunks({
      cleanText,
      sourceUrl: fetched.final_url || sourceUrl,
      chunkSize: options.chunk_size || 6000,
      chunkOverlap: options.chunk_overlap || 300
    });

    const wordCount = countWords(cleanText);

    const record = {
      url: sourceUrl,
      source_family: sourceFamily,
      fetch: {
        ok: fetched.ok,
        http_status: fetched.http_status,
        final_url: fetched.final_url,
        content_type: fetched.content_type,
        fetched_at: nowIso()
      },
      raw: {
        raw_html_length: rawHtml.length,
        raw_html_sha256: sha256(rawHtml)
      },
      text: {
        extraction_mode: "lossless_visible_text",
        clean_text_length: cleanText.length,
        clean_text_sha256: sha256(cleanText),
        word_count: wordCount,
        truncated_in_storage: false,
        truncated_in_response: false
      },
      structure: {
        title: extractTitle(rawHtml),
        meta_description: extractMetaDescription(rawHtml),
        headings,
        section_index: sections,
        links
      },
      chunks,
      quality: {
        empty_page: cleanText.length === 0,
        likely_js_rendered: rawHtml.length > 0 && cleanText.length < 200,
        word_count: wordCount,
        coverage_status: cleanText.length > 0 ? "full_visible_text_captured" : "html_fetch_insufficient"
      }
    };

    if (includeRawHtml) {
      record.raw.raw_html = rawHtml;
    }

    if (includeCleanText) {
      record.text.clean_text_lossless = cleanText;
    }

    return record;
  } catch (error) {
    return {
      url: sourceUrl,
      source_family: sourceFamily,
      fetch: {
        ok: false,
        error: error?.name || error?.message || "FETCH_FAILED",
        fetched_at: nowIso()
      },
      raw: {
        raw_html_length: 0,
        raw_html_sha256: sha256("")
      },
      text: {
        extraction_mode: "lossless_visible_text",
        clean_text_length: 0,
        clean_text_sha256: sha256(""),
        word_count: 0,
        truncated_in_storage: false,
        truncated_in_response: false
      },
      structure: {
        title: "",
        meta_description: "",
        headings: [],
        section_index: [],
        links: []
      },
      chunks: [],
      quality: {
        empty_page: true,
        likely_js_rendered: false,
        word_count: 0,
        coverage_status: "fetch_failed"
      }
    };
  }
}

export async function captureSources(sources, options = {}) {
  const inputSources = Array.isArray(sources) ? sources : [];
  const maxSources = Number(options.max_sources || 20);
  const selected = inputSources.slice(0, maxSources);
  const sourceRecords = [];

  for (const source of selected) {
    const record = await captureOneSource(source, options);
    sourceRecords.push(record);
  }

  const fetchOk = sourceRecords.filter((record) => record.fetch?.ok === true).length;
  const fetchFailed = sourceRecords.length - fetchOk;
  const totalChunks = sourceRecords.reduce((sum, record) => sum + (record.chunks?.length || 0), 0);

  return {
    source_records: sourceRecords,
    counts: {
      input_sources: inputSources.length,
      processed_sources: sourceRecords.length,
      fetch_ok: fetchOk,
      fetch_failed: fetchFailed,
      total_chunks: totalChunks
    }
  };
}
