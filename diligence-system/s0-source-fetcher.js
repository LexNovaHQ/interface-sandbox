// s0-source-fetcher.js
// Public HTTP fetch, navigation extraction, robots/sitemap extraction, and lossless text construction.

import crypto from "crypto";
import { canonicalizeUrl, classifyCandidate, scopeClassForUrl } from "./s0-source-classifier.js";

export async function fetchRootNavigation({ target, fetchImpl = globalThis.fetch }) {
  const root = await fetchWithRetryOnce({ url: target.root_url, fetchImpl });

  if (!root.ok) {
    return {
      root,
      navigation_map: blankNavigationMap(target.root_url),
      route_candidates: []
    };
  }

  const nav = extractNavigationLinks(root.raw_text, target.root_url);
  const routeCandidates = [];

  for (const link of [...nav.header_links, ...nav.footer_links, ...nav.body_links, ...nav.spa_hash_routes]) {
    const classified = classifyCandidate({
      candidate_url: link.url,
      canonical_url: canonicalizeUrl(link.url, target.root_url),
      route_basis: link.text
    });

    routeCandidates.push({
      candidate_url: link.url,
      canonical_url: canonicalizeUrl(link.url, target.root_url),
      source_family: classified.source_family,
      source_subfamily: classified.source_subfamily,
      route_source: link.location === "hash" ? "HASH_ROUTE" : link.location.toUpperCase(),
      route_basis: link.text || link.url,
      scope_class: scopeClassForUrl(link.url, target)
    });
  }

  return {
    root,
    navigation_map: {
      root_url: target.root_url,
      header_links: nav.header_links,
      footer_links: nav.footer_links,
      sitemap_links: [],
      robots_sitemap_links: [],
      spa_hash_routes: nav.spa_hash_routes,
      candidate_routes_by_family: blankCandidateRoutesByFamily()
    },
    route_candidates: routeCandidates
  };
}

export async function fetchRobotsAndSitemaps({ target, fetchImpl = globalThis.fetch, maxSitemapUrls = 200 }) {
  const robotsUrl = new URL("/robots.txt", target.root_url).toString();
  const robots = await fetchNoThrow({ url: robotsUrl, fetchImpl });

  if (!robots.ok) {
    return {
      robots_sitemap_links: [],
      sitemap_links: [],
      route_candidates: [],
      fetch_log: [{ url: robotsUrl, ok: false, status: robots.status, error: robots.error || "" }]
    };
  }

  const robotsSitemaps = extractSitemapUrlsFromRobots(robots.raw_text);
  const sitemapLinks = [];
  const routeCandidates = [];
  const fetchLog = [{ url: robotsUrl, ok: true, status: robots.status, error: "" }];

  for (const sitemapUrl of robotsSitemaps.slice(0, 3)) {
    const sitemap = await fetchNoThrow({ url: sitemapUrl, fetchImpl });
    fetchLog.push({ url: sitemapUrl, ok: sitemap.ok, status: sitemap.status, error: sitemap.error || "" });

    if (!sitemap.ok) continue;

    const urls = extractUrlsFromSitemap(sitemap.raw_text).slice(0, maxSitemapUrls);
    sitemapLinks.push(...urls);

    for (const url of urls) {
      const classified = classifyCandidate({ candidate_url: url, canonical_url: canonicalizeUrl(url, target.root_url), route_basis: "sitemap" });
      routeCandidates.push({
        candidate_url: url,
        canonical_url: canonicalizeUrl(url, target.root_url),
        source_family: classified.source_family,
        source_subfamily: classified.source_subfamily,
        route_source: "SITEMAP",
        route_basis: "sitemap URL",
        scope_class: scopeClassForUrl(url, target)
      });
    }
  }

  return {
    robots_sitemap_links: robotsSitemaps,
    sitemap_links: sitemapLinks,
    route_candidates: routeCandidates,
    fetch_log: fetchLog
  };
}

export async function fetchCandidateText({ candidate, fetchImpl = globalThis.fetch, cachedRootFetch = null }) {
  if (candidate.route_source === "PASTED_TEXT" || candidate.candidate_url?.startsWith("pasted://")) {
    return { ok: false, status: 0, raw_text: "", clean_text: "", error: "PASTED_TEXT_REQUIRES_INLINE_INPUT" };
  }

  if (candidate.route_source === "SYNTHETIC_DEMO" || candidate.candidate_url?.startsWith("synthetic://")) {
    return { ok: false, status: 0, raw_text: "", clean_text: "", error: "SYNTHETIC_REQUIRES_INLINE_INPUT" };
  }

  const url = candidate.canonical_url || candidate.candidate_url;
  const result = cachedRootFetch?.ok && candidate.route_source === "ROOT" ? cachedRootFetch : await fetchWithRetryOnce({ url, fetchImpl });

  return {
    ...result,
    clean_text: result.ok ? stripHtmlToCleanText(result.raw_text) : ""
  };
}

export function buildLosslessArtifact({ candidate, rawText, cleanText = null, method, artifactId, losslessId }) {
  const clean = cleanText || stripHtmlToCleanText(rawText);
  const hashes = computeHashes(rawText, clean);

  return {
    inventory: {
      artifact_id: artifactId,
      candidate_source_id: candidate.candidate_source_id,
      artifact_type: inferArtifactType(candidate),
      artifact_class: inferArtifactClass(candidate),
      status: "FOUND",
      source_url: candidate.canonical_url || candidate.candidate_url,
      source_family: candidate.source_family,
      source_subfamily: candidate.source_subfamily,
      lossless_artifact_ref: losslessId,
      absence_basis: "",
      warning: ""
    },
    lossless: {
      lossless_artifact_id: losslessId,
      candidate_source_id: candidate.candidate_source_id,
      artifact_id: artifactId,
      source_url: candidate.canonical_url || candidate.candidate_url,
      source_family: candidate.source_family,
      source_subfamily: candidate.source_subfamily,
      artifact_type: inferArtifactType(candidate),
      fetch_method_lineage: [method],
      raw_text: String(rawText || ""),
      clean_text: clean,
      normalized_text_hash: hashes.normalized_text_hash,
      content_hash: hashes.content_hash,
      char_count: clean.length,
      word_count: wordCount(clean),
      extraction_quality: extractionQuality(clean),
      lossless_preservation_status: rawText && clean ? "PRESERVED" : "FAILED",
      snippet_only: false
    }
  };
}

export function buildAbsentInventoryRow({ candidate, artifactId, status, warning = "" }) {
  return {
    artifact_id: artifactId,
    candidate_source_id: candidate.candidate_source_id,
    artifact_type: inferArtifactType(candidate),
    artifact_class: inferArtifactClass(candidate),
    status,
    source_url: candidate.canonical_url || candidate.candidate_url,
    source_family: candidate.source_family,
    source_subfamily: candidate.source_subfamily,
    lossless_artifact_ref: "",
    absence_basis: status === "ABSENT" ? warning : "",
    warning
  };
}

export async function fetchWithRetryOnce({ url, fetchImpl }) {
  const first = await fetchNoThrow({ url, fetchImpl });
  if (first.ok) return first;
  const second = await fetchNoThrow({ url, fetchImpl });
  return second.ok ? second : first;
}

export async function fetchNoThrow({ url, fetchImpl }) {
  if (!fetchImpl) return { ok: false, status: 0, raw_text: "", error: "fetch unavailable" };
  if (!/^https?:\/\//i.test(url)) return { ok: false, status: 0, raw_text: "", error: "non-http URL" };

  try {
    const response = await fetchImpl(url, { redirect: "follow" });
    const raw_text = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      final_url: response.url || url,
      raw_text,
      method: "HTTP_FETCH"
    };
  } catch (error) {
    return { ok: false, status: 0, raw_text: "", error: error?.message || String(error) };
  }
}

export function stripHtmlToCleanText(value) {
  return String(value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function wordCount(text) {
  return String(text || "").trim().split(/\s+/).filter(Boolean).length;
}

export function blankNavigationMap(rootUrl = "") {
  return {
    root_url: rootUrl,
    header_links: [],
    footer_links: [],
    sitemap_links: [],
    robots_sitemap_links: [],
    spa_hash_routes: [],
    candidate_routes_by_family: blankCandidateRoutesByFamily()
  };
}

export function blankCandidateRoutesByFamily() {
  return { TARGET_FAMILY: [], PRODUCT_FAMILY: [], LEGAL_FAMILY: [], DATA_FAMILY: [] };
}

function extractNavigationLinks(html, baseUrl) {
  const links = [];
  const anchorRe = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = anchorRe.exec(html || ""))) {
    const url = canonicalizeUrl(match[1], baseUrl);
    if (!url) continue;

    const text = stripHtmlToCleanText(match[2]).slice(0, 160);
    const location = inferLinkLocation(html, match.index);
    links.push({ url, text, location });
  }

  return {
    header_links: links.filter((link) => link.location === "header"),
    footer_links: links.filter((link) => link.location === "footer"),
    body_links: links.filter((link) => link.location === "body"),
    spa_hash_routes: links.filter((link) => link.url.includes("/#/")).map((link) => ({ ...link, location: "hash" }))
  };
}

function extractSitemapUrlsFromRobots(text) {
  return String(text || "").split(/\r?\n/).map((line) => line.match(/^sitemap:\s*(.+)$/i)?.[1]?.trim()).filter(Boolean);
}

function extractUrlsFromSitemap(xml) {
  return [...String(xml || "").matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)].map((match) => match[1].trim());
}

function inferLinkLocation(html, index) {
  const before = String(html || "").slice(Math.max(0, index - 5000), index).toLowerCase();
  const after = String(html || "").slice(index, index + 5000).toLowerCase();

  if (before.lastIndexOf("<footer") > before.lastIndexOf("</footer")) return "footer";
  if (before.lastIndexOf("<header") > before.lastIndexOf("</header") || after.includes("</header>")) return "header";
  return "body";
}

function computeHashes(rawText, cleanText) {
  return {
    content_hash: sha256(String(rawText || "")),
    normalized_text_hash: sha256(normalizeText(cleanText))
  };
}

function normalizeText(text) {
  return String(text || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value || "")).digest("hex");
}

function extractionQuality(text) {
  const words = wordCount(text);
  if (words >= 250) return "GOOD";
  if (words >= 80) return "PARTIAL";
  if (words >= 20) return "THIN";
  return "EMPTY";
}

function inferArtifactType(candidate) {
  const path = new URL(candidate.canonical_url || candidate.candidate_url, "https://placeholder.local").pathname.toLowerCase();
  const subfamily = candidate.source_subfamily || "";

  if (subfamily === "T0_ROOT") return "Homepage";
  if (subfamily.startsWith("P")) return path.includes("pricing") ? "Pricing Page" : "Product Page";
  if (path.includes("privacy")) return "Privacy Policy";
  if (path.includes("terms")) return "ToS";
  if (path.includes("dpa") || path.includes("data-processing")) return "DPA";
  if (path.includes("acceptable-use") || path.includes("aup")) return "AUP";
  if (path.includes("sla") || path.includes("service-level")) return "SLA";
  if (path.includes("trust")) return "Trust Center";
  if (path.includes("security")) return "Security Page";
  if (path.includes("subprocessor")) return "Subprocessor Page";
  if (path.includes("docs") || path.includes("developer")) return "Documentation";
  if (path.includes("api")) return "API Docs";
  if (path.includes("ai") || path.includes("responsible-ai")) return "AI Policy";
  return "Other";
}

function inferArtifactClass(candidate) {
  if (candidate.source_family === "TARGET_FAMILY") return "TARGET_SURFACE";
  if (candidate.source_family === "PRODUCT_FAMILY") return "PRODUCT_SURFACE";
  if (candidate.source_family === "LEGAL_FAMILY") return candidate.source_subfamily === "L1_CORE_TERMS_PRIVACY" ? "CORE_LEGAL" : "GOVERNANCE_SURFACE";
  if (candidate.source_family === "DATA_FAMILY") return "DATA_SURFACE";
  return "FOOTPRINT_WIDE";
}
