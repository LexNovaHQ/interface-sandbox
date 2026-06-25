import crypto from "node:crypto";
import { config } from "./config.js";

export async function buildLosslessSourceCorpus({ run, url_manifest }) {
  const urls = extractUrls(url_manifest);
  if (!urls.length) {
    throw new Error("SOURCE_EXTRACTION_BLOCKED:url_manifest_has_no_urls");
  }

  const documents = [];
  const failed_sources = [];

  for (let index = 0; index < urls.length; index += 1) {
    const entry = urls[index];
    try {
      const fetched = await fetchSource(entry.url);
      documents.push({
        source_id: entry.source_id || `SRC_${String(index + 1).padStart(3, "0")}`,
        url: entry.url,
        family: entry.family || "UNKNOWN",
        subfamily: entry.subfamily || "",
        label: entry.label || "",
        status: "FETCHED",
        http_status: fetched.http_status,
        content_type: fetched.content_type,
        final_url: fetched.final_url,
        sha256: sha256(fetched.raw_text),
        raw_text: fetched.raw_text,
        clean_text: cleanHtmlToText(fetched.raw_text),
        extraction_warnings: fetched.extraction_warnings
      });
    } catch (error) {
      failed_sources.push({
        source_id: entry.source_id || `SRC_${String(index + 1).padStart(3, "0")}`,
        url: entry.url,
        family: entry.family || "UNKNOWN",
        status: "FETCH_FAILED",
        error: error?.message || String(error)
      });
    }
  }

  return {
    lossless_source_corpus: {
      run_id: run.run_id,
      target_url: run.root_url || run.target,
      generated_by: "deterministic_source_extractor",
      documents,
      failed_sources,
      corpus_forensics: {
        total_urls: urls.length,
        fetched: documents.length,
        failed: failed_sources.length,
        fetched_at: new Date().toISOString()
      }
    }
  };
}

function extractUrls(url_manifest) {
  const manifest = url_manifest?.url_manifest || url_manifest || {};
  const candidates = manifest.accepted_urls || manifest.urls || manifest.routes || manifest.url_manifest || [];
  if (!Array.isArray(candidates)) return [];

  const seen = new Set();
  const urls = [];

  for (const item of candidates) {
    const entry = typeof item === "string" ? { url: item } : { ...item };
    const url = normalizeUrl(entry.url || entry.href || entry.source_url);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    urls.push({ ...entry, url });
  }

  return urls;
}

function normalizeUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    if (!["http:", "https:"].includes(url.protocol)) return "";
    url.hash = "";
    return url.toString();
  } catch {
    return "";
  }
}

async function fetchSource(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.sourceFetchTimeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "user-agent": "LexNovaHQ-DiligenceReviewer/0.1 (+public-footprint-diligence)",
        "accept": "text/html,application/xhtml+xml,text/plain,application/json,application/pdf;q=0.8,*/*;q=0.5"
      }
    });

    const contentType = response.headers.get("content-type") || "";
    const rawText = await response.text();

    if (!response.ok) {
      throw new Error(`HTTP_${response.status}`);
    }

    return {
      http_status: response.status,
      content_type: contentType,
      final_url: response.url,
      raw_text: rawText,
      extraction_warnings: contentType.toLowerCase().includes("pdf") ? ["PDF_FETCHED_AS_TEXT_NOT_PARSED"] : []
    };
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("FETCH_TIMEOUT");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function cleanHtmlToText(raw) {
  return String(raw || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value || "")).digest("hex");
}
