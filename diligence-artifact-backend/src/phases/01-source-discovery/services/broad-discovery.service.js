export const PHASE1_BROAD_DISCOVERY_SCHEMA_VERSION = "PHASE1_BROAD_DISCOVERY_INVENTORY_v1";

/**
 * Consolidate every existing Phase 1 discovery event and supplement it with a
 * non-narrowing root-page link inventory. Newly observed external surfaces are
 * recorded only; they are not admitted to final extraction at this stage.
 */
export async function buildBroadDiscoveryInventory({ targetUrl, legacyOutput, rootHtml, fetchImpl = globalThis.fetch, timeoutMs = 12000 } = {}) {
  const manifest = legacyOutput?.deduped_url_manifest || {};
  const events = [];
  const candidates = new Map();

  for (const row of manifest.manifest_sources || []) {
    const channels = Array.isArray(row.discovered_by) ? row.discovered_by : [];
    addCandidate(candidates, events, {
      raw_url: row.fetch_url || row.canonical_url,
      canonical_url: provisionalCanonicalUrl(row.canonical_url || row.fetch_url),
      discovery_channels: channels.length ? channels : ["LEGACY_MANIFEST"],
      source_scope: "LEGACY_PUBLIC_MANIFEST",
      extraction_authorized: row.extraction_decision === "EXTRACT" && row.admission_tier === "PRIMARY",
      legacy_manifest_ids: [row.manifest_id],
      root_candidates: [row.common_root]
    });
  }

  for (const rejected of manifest.rejected_candidates || []) {
    addEvent(events, {
      raw_url: rejected.url,
      canonical_url: provisionalCanonicalUrl(rejected.url),
      discovery_channel: rejected.route_found_by || "LEGACY_REJECTED_CANDIDATE",
      event_status: "REJECTED_BY_ACTIVE_DISCOVERY",
      reason: rejected.rejection_reason
    });
  }

  for (const item of manifest.discovery_log || []) {
    addEvent(events, {
      raw_url: item.url,
      canonical_url: provisionalCanonicalUrl(item.url),
      discovery_channel: item.step || "LEGACY_DISCOVERY_LOG",
      event_status: item.status || "UNKNOWN",
      reason: item.error || null
    });
  }

  for (const failure of manifest.scout_failures || []) {
    addEvent(events, {
      raw_url: failure.url,
      canonical_url: provisionalCanonicalUrl(failure.url),
      discovery_channel: failure.stage || "LEGACY_SCOUT_FAILURE",
      event_status: "FETCH_FAILED",
      reason: failure.error || null
    });
  }

  let rootFetch = { status: "NOT_ATTEMPTED", html: "", error: null };
  if (typeof rootHtml === "string") rootFetch = { status: "PROVIDED", html: rootHtml, error: null };
  else rootFetch = await safeFetchRoot(targetUrl, fetchImpl, timeoutMs);

  if (rootFetch.html) {
    const linkRecords = extractRootLinkRecords(rootFetch.html, targetUrl);
    for (const link of linkRecords) {
      addCandidate(candidates, events, {
        raw_url: link.raw_url,
        canonical_url: provisionalCanonicalUrl(link.raw_url, targetUrl),
        discovery_channels: [link.discovery_channel],
        source_scope: link.source_scope,
        extraction_authorized: false,
        anchor_texts: link.anchor_text ? [link.anchor_text] : [],
        relationship_evidence: link.relationship_evidence || [],
        root_candidates: []
      });
    }
  }

  const candidateUrls = [...candidates.values()]
    .map((candidate) => ({
      ...candidate,
      discovery_channels: unique(candidate.discovery_channels),
      raw_url_variants: unique(candidate.raw_url_variants),
      anchor_texts: unique(candidate.anchor_texts),
      relationship_evidence: unique(candidate.relationship_evidence),
      legacy_manifest_ids: unique(candidate.legacy_manifest_ids),
      root_candidates: unique(candidate.root_candidates),
      discovery_only_not_final_extraction_authority: true
    }))
    .sort((a, b) => String(a.canonical_url).localeCompare(String(b.canonical_url)));

  const targetHost = safeHost(targetUrl);
  return {
    schema_version: PHASE1_BROAD_DISCOVERY_SCHEMA_VERSION,
    status: rootFetch.status === "FAILED" ? "COMPLETE_WITH_ROOT_REFRESH_LIMITATION" : "COMPLETE",
    target_url: targetUrl,
    target_host: targetHost,
    discovery_doctrine: "BROAD_DISCOVERY_BEFORE_SELECTION",
    discovery_narrowing_allowed: false,
    final_extraction_authority: false,
    domain_hint_effect: "EXPAND_ONLY",
    root_refresh: { status: rootFetch.status, error: rootFetch.error },
    channels: summarizeChannels(candidateUrls, events),
    counts: {
      raw_candidate_events: events.length,
      candidate_urls: candidateUrls.length,
      same_host_or_subdomain_candidates: candidateUrls.filter((candidate) => isSameHostFamily(candidate.canonical_url, targetHost)).length,
      external_surface_candidates: candidateUrls.filter((candidate) => candidate.canonical_url && !isSameHostFamily(candidate.canonical_url, targetHost)).length,
      extraction_authorized_by_legacy_manifest: candidateUrls.filter((candidate) => candidate.extraction_authorized).length,
      newly_observed_discovery_only_candidates: candidateUrls.filter((candidate) => !candidate.legacy_manifest_ids.length).length
    },
    candidate_urls: candidateUrls,
    raw_candidate_events: events.slice(0, 5000)
  };
}

export function assertBroadDiscoveryInventory(inventory) {
  if (inventory?.schema_version !== PHASE1_BROAD_DISCOVERY_SCHEMA_VERSION) throw new Error("PHASE1_BROAD_DISCOVERY_SCHEMA_INVALID");
  if (inventory.discovery_narrowing_allowed !== false || inventory.final_extraction_authority !== false) throw new Error("PHASE1_BROAD_DISCOVERY_BOUNDARY_VIOLATION");
  const seen = new Set();
  for (const candidate of inventory.candidate_urls || []) {
    if (!candidate.canonical_url) throw new Error("PHASE1_BROAD_DISCOVERY_CANDIDATE_URL_MISSING");
    if (seen.has(candidate.canonical_url)) throw new Error(`PHASE1_BROAD_DISCOVERY_DUPLICATE_CANDIDATE:${candidate.canonical_url}`);
    seen.add(candidate.canonical_url);
    if (candidate.discovery_only_not_final_extraction_authority !== true) throw new Error(`PHASE1_BROAD_DISCOVERY_AUTHORITY_FLAG_MISSING:${candidate.canonical_url}`);
  }
  return { ok: true, candidates: seen.size };
}

function addCandidate(map, events, input) {
  if (!input.canonical_url) return;
  const existing = map.get(input.canonical_url) || {
    canonical_url: input.canonical_url,
    raw_url: input.raw_url || input.canonical_url,
    raw_url_variants: [],
    discovery_channels: [],
    source_scopes: [],
    extraction_authorized: false,
    anchor_texts: [],
    relationship_evidence: [],
    legacy_manifest_ids: [],
    root_candidates: []
  };
  existing.raw_url_variants = unique([...existing.raw_url_variants, input.raw_url]);
  existing.discovery_channels = unique([...existing.discovery_channels, ...(input.discovery_channels || [])]);
  existing.source_scopes = unique([...existing.source_scopes, input.source_scope]);
  existing.extraction_authorized = existing.extraction_authorized || Boolean(input.extraction_authorized);
  existing.anchor_texts = unique([...existing.anchor_texts, ...(input.anchor_texts || [])]);
  existing.relationship_evidence = unique([...existing.relationship_evidence, ...(input.relationship_evidence || [])]);
  existing.legacy_manifest_ids = unique([...existing.legacy_manifest_ids, ...(input.legacy_manifest_ids || [])]);
  existing.root_candidates = unique([...existing.root_candidates, ...(input.root_candidates || [])]);
  map.set(input.canonical_url, existing);
  for (const channel of input.discovery_channels || []) addEvent(events, {
    raw_url: input.raw_url,
    canonical_url: input.canonical_url,
    discovery_channel: channel,
    event_status: "DISCOVERED",
    source_scope: input.source_scope
  });
}

function addEvent(events, value) {
  if (!value.raw_url && !value.canonical_url) return;
  events.push({
    event_id: `DISC.${String(events.length + 1).padStart(5, "0")}`,
    raw_url: value.raw_url || value.canonical_url,
    canonical_url: value.canonical_url || provisionalCanonicalUrl(value.raw_url),
    discovery_channel: value.discovery_channel || "UNKNOWN",
    event_status: value.event_status || "DISCOVERED",
    source_scope: value.source_scope || null,
    reason: value.reason || null
  });
}

function extractRootLinkRecords(html, targetUrl) {
  const records = [];
  const scopedChunks = [
    ...extractTagChunks(html, "header").map((chunk) => ({ chunk, channel: "HEADER_REFRESH", scope: "HEADER" })),
    ...extractTagChunks(html, "footer").map((chunk) => ({ chunk, channel: "FOOTER_REFRESH", scope: "FOOTER" })),
    { chunk: html, channel: "ROOT_BODY_REFRESH", scope: "ROOT_BODY" }
  ];
  for (const scoped of scopedChunks) for (const anchor of extractAnchors(scoped.chunk)) {
    const resolved = resolveHttpUrl(anchor.href, targetUrl);
    if (!resolved) continue;
    records.push({
      raw_url: resolved,
      anchor_text: normalizeText(anchor.text),
      discovery_channel: scoped.channel,
      source_scope: scoped.scope,
      relationship_evidence: scoped.scope === "FOOTER" ? ["FIRST_PARTY_FOOTER_LINK"] : scoped.scope === "HEADER" ? ["FIRST_PARTY_HEADER_LINK"] : ["FIRST_PARTY_ROOT_LINK"]
    });
  }
  for (const value of extractLinkRel(html, "canonical")) {
    const resolved = resolveHttpUrl(value, targetUrl);
    if (resolved) records.push({ raw_url: resolved, anchor_text: "", discovery_channel: "CANONICAL_LINK_REFRESH", source_scope: "HEAD", relationship_evidence: ["CANONICAL_LINK"] });
  }
  for (const value of extractLinkRel(html, "sitemap")) {
    const resolved = resolveHttpUrl(value, targetUrl);
    if (resolved) records.push({ raw_url: resolved, anchor_text: "", discovery_channel: "SITEMAP_LINK_REFRESH", source_scope: "HEAD", relationship_evidence: ["SITEMAP_LINK"] });
  }
  return records;
}

async function safeFetchRoot(targetUrl, fetchImpl, timeoutMs) {
  if (typeof fetchImpl !== "function") return { status: "FAILED", html: "", error: "FETCH_UNAVAILABLE" };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(targetUrl, { method: "GET", redirect: "follow", signal: controller.signal, headers: { "user-agent": "LexNovaHQ-DiligenceReviewer/1.0 (+phase1-broad-discovery-inventory)", accept: "text/html,application/xhtml+xml,text/plain,*/*;q=0.5" } });
    if (!response?.ok) return { status: "FAILED", html: "", error: `HTTP_${response?.status || "UNKNOWN"}` };
    return { status: "FETCHED", html: await response.text(), error: null };
  } catch (error) {
    return { status: "FAILED", html: "", error: error?.name === "AbortError" ? "FETCH_TIMEOUT" : error?.message || String(error) };
  } finally {
    clearTimeout(timer);
  }
}

function summarizeChannels(candidates, events) {
  const names = unique([
    ...candidates.flatMap((candidate) => candidate.discovery_channels || []),
    ...events.map((event) => event.discovery_channel)
  ]);
  return names.sort().map((channel) => ({
    channel,
    candidate_count: candidates.filter((candidate) => (candidate.discovery_channels || []).includes(channel)).length,
    event_count: events.filter((event) => event.discovery_channel === channel).length
  }));
}

function provisionalCanonicalUrl(value, baseUrl) {
  try {
    const url = new URL(String(value || ""), baseUrl);
    if (!/^https?:$/.test(url.protocol)) return "";
    url.hash = "";
    const host = url.hostname.replace(/^www\./i, "").toLowerCase();
    const path = String(url.pathname || "/").replace(/\/{2,}/g, "/").replace(/\/$/, "") || "/";
    return `${url.protocol}//${host}${path}${url.search || ""}`;
  } catch {
    return "";
  }
}

function isSameHostFamily(value, targetHost) {
  try {
    const host = safeHost(value);
    return host === targetHost || host.endsWith(`.${targetHost}`) || targetHost.endsWith(`.${host}`);
  } catch {
    return false;
  }
}

function safeHost(value) { try { return new URL(String(value || "")).hostname.replace(/^www\./i, "").toLowerCase(); } catch { return ""; } }
function resolveHttpUrl(value, baseUrl) { try { const url = new URL(String(value || ""), baseUrl); return /^https?:$/.test(url.protocol) ? url.toString() : ""; } catch { return ""; } }
function extractTagChunks(html, tag) { const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi"); return [...String(html || "").matchAll(regex)].map((match) => match[1] || ""); }
function extractAnchors(html) { const out = []; const regex = /<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi; for (const match of String(html || "").matchAll(regex)) out.push({ href: match[1], text: match[2].replace(/<[^>]+>/g, " ") }); return out; }
function extractLinkRel(html, rel) { const out = []; const regex = new RegExp(`<link\\b[^>]*rel=["'][^"']*${rel}[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>`, "gi"); for (const match of String(html || "").matchAll(regex)) out.push(match[1]); return out; }
function normalizeText(value) { return String(value || "").replace(/\s+/g, " ").trim(); }
function unique(values) { return [...new Set((values || []).filter(Boolean))]; }
