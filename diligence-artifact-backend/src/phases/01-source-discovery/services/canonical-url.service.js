import crypto from "node:crypto";

export const PHASE1_CANONICAL_URL_SCHEMA_VERSION = "PHASE1_CANONICAL_URL_INVENTORY_v1";

const TRACKING_QUERY_KEYS = new Set([
  "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "utm_id",
  "gclid", "dclid", "fbclid", "msclkid", "mc_cid", "mc_eid", "ref", "referrer",
  "source", "campaign", "_ga", "_gl"
]);

/**
 * RB-05 address-level canonicalisation. The identity key is entity + canonical
 * URL, so similarly branded or textually identical pages owned by different
 * entities can never collapse at this stage.
 */
export function buildCanonicalUrlInventory({ rawDiscoveryInventory, entityBoundary } = {}) {
  const surfaces = entityBoundary?.entity_surface_map?.surfaces || [];
  const grouped = new Map();

  for (const raw of rawDiscoveryInventory?.candidate_urls || []) {
    const variants = unique([raw.raw_url, raw.canonical_url, ...(raw.raw_url_variants || [])]);
    for (const value of variants) {
      const normalized = canonicalizeUrl(value);
      if (!normalized) continue;
      const surface = surfaceForHost(normalized.host, surfaces);
      const entityId = surface?.entity_id || stableId("ENTITY_UNRESOLVED", normalized.host);
      const identity = `${entityId}|${normalized.canonical_url}`;
      const existing = grouped.get(identity) || {
        record_type: "CanonicalUrlCandidate",
        schema_version: PHASE1_CANONICAL_URL_SCHEMA_VERSION,
        candidate_id: stableId("CANON", identity),
        canonical_identity: identity,
        entity_id: entityId,
        entity_surface_id: surface?.surface_id || null,
        entity_status: surface?.status || "UNVERIFIED",
        canonical_url: normalized.canonical_url,
        canonical_host: normalized.host,
        fetch_url: normalized.fetch_url,
        aliases: [],
        discovery_channels: [],
        source_scopes: [],
        legacy_manifest_ids: [],
        root_candidates: [],
        extraction_authorized_by_legacy_manifest: false,
        final_extraction_authority: false
      };
      existing.aliases = unique([...existing.aliases, value, ...(raw.raw_url_variants || [])]);
      existing.fetch_url = choosePreferredFetchUrl(existing.fetch_url, normalized.fetch_url);
      existing.discovery_channels = unique([...existing.discovery_channels, ...(raw.discovery_channels || [])]);
      existing.source_scopes = unique([...existing.source_scopes, ...(raw.source_scopes || [])]);
      existing.legacy_manifest_ids = unique([...existing.legacy_manifest_ids, ...(raw.legacy_manifest_ids || [])]);
      existing.root_candidates = unique([...existing.root_candidates, ...(raw.root_candidates || [])]);
      existing.extraction_authorized_by_legacy_manifest ||= Boolean(raw.extraction_authorized);
      grouped.set(identity, existing);
    }
  }

  const candidates = [...grouped.values()].sort(sortCanonicalCandidates);
  return {
    schema_version: PHASE1_CANONICAL_URL_SCHEMA_VERSION,
    status: "URL_LEVEL_CANONICALISATION_COMPLETE",
    identity_rule: "ENTITY_ID_PLUS_CANONICAL_URL",
    protocol_rule: "HTTP_AND_HTTPS_COLLAPSE_TO_HTTPS_EXCEPT_LOOPBACK",
    query_rule: "TRACKING_KEYS_REMOVED_MATERIAL_KEYS_SORTED_AND_RETAINED",
    fragment_rule: "REMOVED",
    canonical_link_reconciliation_pending: true,
    public_manifest_selection_changed: false,
    counts: {
      raw_candidates_read: rawDiscoveryInventory?.candidate_urls?.length || 0,
      canonical_candidates: candidates.length,
      aliases_collapsed: candidates.reduce((sum, record) => sum + Math.max(0, record.aliases.length - 1), 0)
    },
    canonical_candidates: candidates
  };
}

/**
 * Reconcile rel=canonical hints only where source and target resolve to the same
 * entity. Cross-entity canonical hints are retained as blocked evidence and can
 * never merge legal capacity.
 */
export function reconcileFingerprintCanonicalHints({ canonicalInventory, fingerprintInventory, entityBoundary } = {}) {
  const surfaces = entityBoundary?.entity_surface_map?.surfaces || [];
  const fingerprints = new Map((fingerprintInventory?.fingerprints || []).map((item) => [item.candidate_id, item]));
  const groups = new Map();
  const blockedHints = [];

  for (const record of canonicalInventory?.canonical_candidates || []) {
    const fingerprint = fingerprints.get(record.candidate_id);
    let target = null;
    if (fingerprint?.canonical_link) {
      const normalized = canonicalizeUrl(fingerprint.canonical_link, record.fetch_url);
      if (normalized) {
        const targetSurface = surfaceForHost(normalized.host, surfaces);
        const targetEntity = targetSurface?.entity_id || (normalized.host === record.canonical_host ? record.entity_id : null);
        if (targetEntity === record.entity_id) target = normalized;
        else blockedHints.push({ candidate_id: record.candidate_id, source_url: record.canonical_url, canonical_hint: normalized.canonical_url, reason: "CROSS_ENTITY_CANONICAL_MERGE_FORBIDDEN" });
      }
    }

    const canonicalUrl = target?.canonical_url || record.canonical_url;
    const identity = `${record.entity_id}|${canonicalUrl}`;
    const existing = groups.get(identity) || {
      ...record,
      candidate_id: stableId("CANON", identity),
      canonical_identity: identity,
      canonical_url: canonicalUrl,
      canonical_host: target?.host || record.canonical_host,
      member_candidate_ids: [],
      aliases: [],
      canonical_hint_applied: Boolean(target)
    };
    existing.member_candidate_ids = unique([...existing.member_candidate_ids, record.candidate_id, ...(record.member_candidate_ids || [])]);
    existing.aliases = unique([...existing.aliases, record.canonical_url, ...(record.aliases || [])]);
    existing.discovery_channels = unique([...existing.discovery_channels, ...(record.discovery_channels || [])]);
    existing.source_scopes = unique([...existing.source_scopes, ...(record.source_scopes || [])]);
    existing.legacy_manifest_ids = unique([...existing.legacy_manifest_ids, ...(record.legacy_manifest_ids || [])]);
    existing.root_candidates = unique([...existing.root_candidates, ...(record.root_candidates || [])]);
    existing.fetch_url = choosePreferredFetchUrl(existing.fetch_url, record.fetch_url);
    existing.extraction_authorized_by_legacy_manifest ||= Boolean(record.extraction_authorized_by_legacy_manifest);
    existing.canonical_hint_applied ||= Boolean(target);
    groups.set(identity, existing);
  }

  const candidates = [...groups.values()].sort(sortCanonicalCandidates);
  return {
    ...canonicalInventory,
    status: "URL_LEVEL_AND_CANONICAL_LINK_RECONCILIATION_COMPLETE",
    canonical_link_reconciliation_pending: false,
    counts: {
      ...(canonicalInventory?.counts || {}),
      canonical_candidates_after_hint_reconciliation: candidates.length,
      canonical_hints_applied: candidates.filter((candidate) => candidate.canonical_hint_applied).length,
      canonical_hints_blocked_cross_entity: blockedHints.length
    },
    canonical_candidates: candidates,
    blocked_canonical_hints: blockedHints
  };
}

export function assertCanonicalUrlInventory(inventory) {
  if (inventory?.schema_version !== PHASE1_CANONICAL_URL_SCHEMA_VERSION) throw new Error("PHASE1_CANONICAL_URL_SCHEMA_INVALID");
  if (inventory.identity_rule !== "ENTITY_ID_PLUS_CANONICAL_URL" || inventory.public_manifest_selection_changed !== false) throw new Error("PHASE1_CANONICAL_URL_BOUNDARY_INVALID");
  const seen = new Set();
  for (const record of inventory.canonical_candidates || []) {
    if (!record.candidate_id || !record.entity_id || !record.canonical_identity || !record.canonical_url || !record.fetch_url) throw new Error("PHASE1_CANONICAL_URL_RECORD_INCOMPLETE");
    if (seen.has(record.canonical_identity)) throw new Error(`PHASE1_CANONICAL_URL_DUPLICATE_IDENTITY:${record.canonical_identity}`);
    seen.add(record.canonical_identity);
    if (record.canonical_identity !== `${record.entity_id}|${record.canonical_url}`) throw new Error(`PHASE1_CANONICAL_URL_IDENTITY_MISMATCH:${record.candidate_id}`);
    if (record.final_extraction_authority !== false) throw new Error(`PHASE1_CANONICAL_URL_EARLY_EXTRACTION_AUTHORITY:${record.candidate_id}`);
  }
  return { ok: true, canonical_candidates: seen.size };
}

export function canonicalizeUrl(value, baseUrl) {
  try {
    const url = new URL(String(value || "").trim(), baseUrl);
    if (!/^https?:$/.test(url.protocol)) return null;
    url.hash = "";
    const host = normalizeHost(url.hostname);
    const loopback = host === "localhost" || host === "127.0.0.1" || host === "::1";
    const protocol = loopback ? url.protocol : "https:";
    const port = defaultPort(url.protocol, url.port) ? "" : url.port;
    const path = normalizePath(url.pathname);
    const query = normalizeQuery(url.searchParams);
    const authority = port ? `${host}:${port}` : host;
    const canonicalUrl = `${protocol}//${authority}${path}${query}`;
    const fetchAuthority = url.port ? `${host}:${url.port}` : host;
    const fetchUrl = `${url.protocol}//${fetchAuthority}${path}${query}`;
    return { canonical_url: canonicalUrl, fetch_url: fetchUrl, host, path, query };
  } catch {
    return null;
  }
}

function normalizePath(value) {
  let path = String(value || "/").replace(/\/{2,}/g, "/");
  try { path = decodeURI(path); } catch { /* preserve original encoding */ }
  path = path.replace(/\/(?:index\.html?|default\.aspx?)$/i, "/");
  if (path.length > 1) path = path.replace(/\/+$/g, "");
  return path || "/";
}

function normalizeQuery(searchParams) {
  const entries = [];
  for (const [key, value] of searchParams.entries()) {
    const normalizedKey = key.toLowerCase();
    if (TRACKING_QUERY_KEYS.has(normalizedKey) || normalizedKey.startsWith("utm_")) continue;
    if (!key && !value) continue;
    entries.push([key, value]);
  }
  entries.sort(([aKey, aValue], [bKey, bValue]) => aKey.localeCompare(bKey) || aValue.localeCompare(bValue));
  if (!entries.length) return "";
  const out = new URLSearchParams();
  for (const [key, value] of entries) out.append(key, value);
  return `?${out.toString()}`;
}

function choosePreferredFetchUrl(a, b) {
  return [a, b].filter(Boolean).sort((left, right) => fetchPreference(left) - fetchPreference(right) || left.length - right.length || left.localeCompare(right))[0] || "";
}
function fetchPreference(value) { try { const url = new URL(value); return (url.protocol === "https:" ? 0 : 1) + (url.search ? 2 : 0); } catch { return 9; } }
function surfaceForHost(host, surfaces) { return (surfaces || []).find((surface) => normalizeHost(surface.host) === normalizeHost(host)) || null; }
function normalizeHost(value) { return String(value || "").replace(/^www\./i, "").toLowerCase(); }
function defaultPort(protocol, port) { return !port || protocol === "http:" && port === "80" || protocol === "https:" && port === "443"; }
function stableId(prefix, value) { return `${prefix}.${crypto.createHash("sha256").update(String(value || "")).digest("hex").slice(0, 16)}`; }
function sortCanonicalCandidates(a, b) { return String(a.entity_id).localeCompare(String(b.entity_id)) || String(a.canonical_url).localeCompare(String(b.canonical_url)); }
function unique(values) { return [...new Set((values || []).filter(Boolean))]; }
