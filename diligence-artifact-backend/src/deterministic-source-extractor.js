import crypto from "node:crypto";
import { config } from "./config.js";

export async function buildLosslessSourceCorpus({ run, url_manifest }) {
  const routes = extractDiscoveredRouteInventory(url_manifest);
  if (!routes.length) {
    throw new Error("SOURCE_EXTRACTION_BLOCKED:url_manifest_has_no_discovered_route_inventory");
  }

  const discovered_route_inventory = [];
  const failed_route_inventory = [];

  for (let index = 0; index < routes.length; index += 1) {
    const row = routes[index];
    const sourceId = row.source_id || `SRC_${String(index + 1).padStart(3, "0")}`;

    try {
      const fetched = await fetchSource(row.url);
      discovered_route_inventory.push({
        ...row,
        source_id: sourceId,
        extraction_status: "FETCHED",
        http_status: fetched.http_status,
        content_type: fetched.content_type,
        final_url: fetched.final_url,
        sha256: sha256(fetched.lossless_text),
        lossless_text: fetched.lossless_text,
        extraction_warnings: fetched.extraction_warnings
      });
    } catch (error) {
      failed_route_inventory.push({
        ...row,
        source_id: sourceId,
        extraction_status: "FETCH_FAILED",
        error: error?.message || String(error)
      });
    }
  }

  if (!discovered_route_inventory.length) {
    throw new Error("SOURCE_EXTRACTION_BLOCKED:no_routes_fetched");
  }

  return {
    lossless_source_corpus: {
      run_id: run.run_id,
      target_url: run.root_url || run.target,
      generated_by: "deterministic_source_extractor",
      source_contract: "M6_DISCOVERED_ROUTE_INVENTORY_ENRICHED_IN_PLACE",
      discovered_route_inventory,
      failed_route_inventory,
      corpus_forensics: {
        total_routes: routes.length,
        fetched: discovered_route_inventory.length,
        failed: failed_route_inventory.length,
        fetched_at: new Date().toISOString()
      }
    }
  };
}

function extractDiscoveredRouteInventory(url_manifest) {
  const manifest = url_manifest?.url_manifest || url_manifest || {};
  const candidates = firstArray(
    manifest.discovered_route_inventory,
    manifest.source_discovery_handoff?.discovered_route_inventory,
    manifest.accepted_urls,
    manifest.urls,
    manifest.routes
  );

  const seen = new Set();
  const routes = [];

  for (const item of candidates) {
    const entry = typeof item === "string" ? { url: item } : { ...item };
    const url = normalizeUrl(entry.url || entry.selected_url_or_material || entry.href || entry.source_url);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    routes.push({ ...entry, url });
  }

  return routes;
}

function firstArray(...values) {
  for (const value of values) {
    if (Array.isArray(value)) return value;
  }
  return [];
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
    const losslessText = await response.text();

    if (!response.ok) {
      throw new Error(`HTTP_${response.status}`);
    }

    return {
      http_status: response.status,
      content_type: contentType,
      final_url: response.url,
      lossless_text: losslessText,
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

function sha256(value) {
  return crypto.createHash("sha256").update(String(value || "")).digest("hex");
}
