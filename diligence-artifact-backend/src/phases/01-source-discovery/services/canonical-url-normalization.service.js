import crypto from "node:crypto";

export const PHASE1_CANONICAL_URL_SCHEMA_VERSION = "PHASE1_CANONICAL_URL_NORMALIZATION_v1";

const TRACKING_PARAMETER_PATTERNS = Object.freeze([
  /^utm_/i,
  /^gclid$/i,
  /^dclid$/i,
  /^fbclid$/i,
  /^msclkid$/i,
  /^twclid$/i,
  /^yclid$/i,
  /^mc_(cid|eid)$/i,
  /^_hs(enc|mi)$/i,
  /^hs(c|a|s|e|l)ta$/i,
  /^vero_(id|conv)$/i,
  /^wickedid$/i,
  /^oly_(anon_id|enc_id)$/i,
  /^rb_clickid$/i,
  /^s_cid$/i,
  /^igshid$/i,
  /^mkt_tok$/i
]);

/**
 * RB-05 canonicalisation is address-level only. It does not claim that two
 * different canonical URLs have the same content. One identity is emitted for
 * each entity + canonical URL, while every raw alias and legacy manifest row is
 * retained for audit and compatibility projection.
 */
export function buildCanonicalUrlNormalization({ manifest, rawDiscoveryInventory, entityBoundary } = {}) {
  const manifestRows = Array.isArray(manifest?.manifest_sources) ? manifest.manifest_sources : [];
  const rawCandidates = Array.isArray(rawDiscoveryInventory?.candidate_urls) ? rawDiscoveryInventory.candidate_urls : [];
  const surfaces = entityBoundary?.entity_surface_map?.surfaces || [];
  const observations = [];

  for (const row of manifestRows) {
    const values = unique([row.fetch_url, row.canonical_url, ...(row.url_variants || [])]);
    for (const value of values) observations.push(observationFromManifestRow(value, row));
  }

  for (const candidate of rawCandidates) {
    const values = unique([candidate.raw_url, candidate.canonical_url, ...(candidate.raw_url_variants || [])]);
    for (const value of values) observations.push(observationFromRawCandidate(value, candidate));
  }

  const normalizedObservations = observations
    .map((observation) => normalizeObservation(observation, surfaces))
    .filter(Boolean);

  const groups = new Map();
  for (const observation of normalizedObservations) {
    const key = `${observation.entity_id}|${observation.address_equivalence_key}`;
    const group = groups.get(key) || [];
    group.push(observation);
    groups.set(key, group);
  }

  const canonicalCandidates = [...groups.values()].map(buildCanonicalCandidate);
  canonicalCandidates.sort((a, b) => a.entity_id.localeCompare(b.entity_id) || a.canonical_url.localeCompare(b.canonical_url));

  const publicManifestProjection = [];
  for (const candidate of canonicalCandidates) {
    for (const manifestId of candidate.legacy_manifest_ids) {
      publicManifestProjection.push({
        manifest_id: manifestId,
        canonical_candidate_id: candidate.canonical_candidate_id,
        canonical_identity_key: candidate.canonical_identity_key,
        entity_id: candidate.entity_id,
        canonical_url: candidate.canonical_url
      });
    }
  }
  publicManifestProjection.sort((a, b) => a.manifest_id.localeCompare(b.manifest_id));

  const aliasIndex = [];
  for (const candidate of canonicalCandidates) {
    for (const alias of candidate.alias_urls) aliasIndex.push({
      alias_url: alias,
      canonical_candidate_id: candidate.canonical_candidate_id,
      canonical_url: candidate.canonical_url,
      entity_id: candidate.entity_id
    });
  }
  aliasIndex.sort((a, b) => a.alias_url.localeCompare(b.alias_url) || a.entity_id.localeCompare(b.entity_id));

  return {
    schema_version: PHASE1_CANONICAL_URL_SCHEMA_VERSION,
    status: "ACTIVE_INTERNAL_ONLY",
    doctrine: "ENTITY_PLUS_CANONICAL_URL_IS_INTERNAL_SOURCE_IDENTITY",
    normalisation_scope: "ADDRESS_LEVEL_ONLY_NOT_CONTENT_EQUIVALENCE",
    public_contract_changed: false,
    public_manifest_rows_mutated: false,
    final_extraction_authority: false,
    downstream_reader_required: false,
    tracking_parameter_policy: {
      recognised_tracking_parameters_removed: true,
      unknown_query_parameters_preserved: true,
      retained_query_parameters_sorted: true
    },
    protocol_policy: "PREFER_HTTPS_WHEN_OBSERVED_IN_ALIAS_GROUP_OTHERWISE_PRESERVE_OBSERVED_PROTOCOL",
    host_policy: "LOWERCASE_REMOVE_WWW_REMOVE_DEFAULT_PORT",
    path_policy: "COLLAPSE_DUPLICATE_SLASHES_REMOVE_TRAILING_SLASH_EXCEPT_ROOT_NORMALISE_UNRESERVED_ESCAPES",
    counts: {
      raw_observations: observations.length,
      valid_normalized_observations: normalizedObservations.length,
      canonical_candidates: canonicalCandidates.length,
      alias_urls: canonicalCandidates.reduce((sum, candidate) => sum + candidate.alias_urls.length, 0),
      public_manifest_rows: manifestRows.length,
      public_manifest_rows_projected: publicManifestProjection.length,
      tracking_parameters_removed: canonicalCandidates.reduce((sum, candidate) => sum + candidate.removed_tracking_parameters.length, 0)
    },
    canonical_candidates: canonicalCandidates,
    public_manifest_projection: publicManifestProjection,
    alias_index: aliasIndex
  };
}

export function assertCanonicalUrlNormalization(model) {
  if (model?.schema_version !== PHASE1_CANONICAL_URL_SCHEMA_VERSION) throw new Error("PHASE1_CANONICAL_URL_SCHEMA_INVALID");
  if (model.public_contract_changed !== false || model.public_manifest_rows_mutated !== false || model.final_extraction_authority !== false || model.downstream_reader_required !== false) throw new Error("PHASE1_CANONICAL_URL_BOUNDARY_VIOLATION");
  if (model.normalisation_scope !== "ADDRESS_LEVEL_ONLY_NOT_CONTENT_EQUIVALENCE") throw new Error("PHASE1_CANONICAL_URL_SCOPE_INVALID");

  const identityKeys = new Set();
  const candidateIds = new Set();
  for (const candidate of model.canonical_candidates || []) {
    if (!candidate.canonical_candidate_id || !candidate.canonical_identity_key || !candidate.entity_id || !candidate.canonical_url) throw new Error("PHASE1_CANONICAL_URL_CANDIDATE_INCOMPLETE");
    if (identityKeys.has(candidate.canonical_identity_key)) throw new Error(`PHASE1_CANONICAL_URL_DUPLICATE_IDENTITY:${candidate.canonical_identity_key}`);
    if (candidateIds.has(candidate.canonical_candidate_id)) throw new Error(`PHASE1_CANONICAL_URL_DUPLICATE_CANDIDATE_ID:${candidate.canonical_candidate_id}`);
    identityKeys.add(candidate.canonical_identity_key);
    candidateIds.add(candidate.canonical_candidate_id);
    if (!Array.isArray(candidate.alias_urls) || candidate.alias_urls.length === 0) throw new Error(`PHASE1_CANONICAL_URL_ALIAS_SET_EMPTY:${candidate.canonical_candidate_id}`);
    const parsed = safeUrl(candidate.canonical_url);
    if (!parsed) throw new Error(`PHASE1_CANONICAL_URL_INVALID:${candidate.canonical_url}`);
    if (parsed.hash) throw new Error(`PHASE1_CANONICAL_URL_FRAGMENT_RETAINED:${candidate.canonical_url}`);
    for (const key of parsed.searchParams.keys()) if (isTrackingParameter(key)) throw new Error(`PHASE1_CANONICAL_URL_TRACKING_PARAMETER_RETAINED:${candidate.canonical_url}:${key}`);
  }

  const projectionIds = new Set();
  for (const projection of model.public_manifest_projection || []) {
    if (!projection.manifest_id || !candidateIds.has(projection.canonical_candidate_id)) throw new Error(`PHASE1_CANONICAL_URL_PROJECTION_INVALID:${projection.manifest_id || "missing"}`);
    if (projectionIds.has(projection.manifest_id)) throw new Error(`PHASE1_CANONICAL_URL_MANIFEST_PROJECTED_MORE_THAN_ONCE:${projection.manifest_id}`);
    projectionIds.add(projection.manifest_id);
  }
  if (model.counts?.public_manifest_rows !== projectionIds.size) throw new Error(`PHASE1_CANONICAL_URL_MANIFEST_PROJECTION_INCOMPLETE:${projectionIds.size}/${model.counts?.public_manifest_rows || 0}`);
  return { ok: true, canonical_candidates: identityKeys.size, projected_manifest_rows: projectionIds.size };
}

export function canonicalizeUrl(value) {
  const parsed = safeUrl(value);
  if (!parsed || !/^https?:$/.test(parsed.protocol)) return null;

  const transformations = [];
  const original = parsed.toString();
  const protocol = parsed.protocol.toLowerCase();
  const originalHost = parsed.hostname;
  const host = normalizeHost(parsed.hostname);
  if (originalHost !== host) transformations.push("HOST_LOWERCASED_OR_WWW_REMOVED");

  const port = normalizePort(protocol, parsed.port);
  if (parsed.port && !port) transformations.push("DEFAULT_PORT_REMOVED");

  const normalizedPath = normalizePath(parsed.pathname);
  if (normalizedPath !== parsed.pathname) transformations.push("PATH_NORMALIZED");

  const query = normalizeQuery(parsed.searchParams);
  if (query.removed_tracking_parameters.length) transformations.push("TRACKING_PARAMETERS_REMOVED");
  if (query.sorted) transformations.push("QUERY_PARAMETERS_SORTED");
  if (parsed.hash) transformations.push("FRAGMENT_REMOVED");

  const authority = `${host}${port ? `:${port}` : ""}`;
  const queryString = query.serialized ? `?${query.serialized}` : "";
  const canonicalUrl = `${protocol}//${authority}${normalizedPath}${queryString}`;
  const addressEquivalenceKey = `${authority}${normalizedPath}${queryString}`;

  return {
    original_url: original,
    protocol,
    host,
    port,
    path: normalizedPath,
    retained_query: query.serialized,
    canonical_url: canonicalUrl,
    address_equivalence_key: addressEquivalenceKey,
    removed_tracking_parameters: query.removed_tracking_parameters,
    transformations
  };
}

function normalizeObservation(observation, surfaces) {
  const normalized = canonicalizeUrl(observation.raw_url);
  if (!normalized) return null;
  const surface = surfaces.find((item) => item.host === normalized.host) || null;
  const entityId = surface?.entity_id || stableId("ENTITY_UNRESOLVED", normalized.host);
  return {
    ...observation,
    ...normalized,
    entity_id: entityId,
    entity_surface_id: surface?.surface_id || null,
    entity_status: surface?.status || "UNVERIFIED"
  };
}

function buildCanonicalCandidate(observations) {
  const protocols = new Set(observations.map((item) => item.protocol));
  const selectedProtocol = protocols.has("https:") ? "https:" : observations[0].protocol;
  const exemplar = [...observations].sort((a, b) => observationRank(a) - observationRank(b) || a.canonical_url.localeCompare(b.canonical_url))[0];
  const canonicalUrl = `${selectedProtocol}//${exemplar.address_equivalence_key}`;
  const identityKey = `${exemplar.entity_id}|${canonicalUrl}`;
  const aliases = unique(observations.flatMap((item) => [item.raw_url, item.original_url, item.canonical_url]));
  const roots = unique(observations.flatMap((item) => item.root_candidates || []));
  const legacyManifestIds = unique(observations.flatMap((item) => item.legacy_manifest_ids || []));

  return clean({
    record_type: "CanonicalUrlCandidate",
    schema_version: PHASE1_CANONICAL_URL_SCHEMA_VERSION,
    canonical_candidate_id: stableId("CANON", identityKey),
    canonical_identity_key: identityKey,
    entity_id: exemplar.entity_id,
    entity_surface_id: exemplar.entity_surface_id,
    entity_status: exemplar.entity_status,
    canonical_url: canonicalUrl,
    address_equivalence_key: exemplar.address_equivalence_key,
    selected_protocol: selectedProtocol,
    protocol_aliases: [...protocols].sort(),
    alias_urls: aliases.sort(),
    alias_count: aliases.length,
    discovery_channels: unique(observations.flatMap((item) => item.discovery_channels || [])).sort(),
    source_scopes: unique(observations.flatMap((item) => item.source_scopes || [])).sort(),
    root_candidates: roots,
    legacy_manifest_ids: legacyManifestIds,
    extraction_authorized_by_legacy_manifest: observations.some((item) => item.extraction_authorized === true),
    discovery_only_not_final_extraction_authority: true,
    removed_tracking_parameters: unique(observations.flatMap((item) => item.removed_tracking_parameters || [])).sort(),
    transformations: unique(observations.flatMap((item) => item.transformations || [])).sort(),
    canonicalisation_reason: aliases.length > 1 ? "MULTIPLE_ADDRESS_ALIASES_COLLAPSED" : "SINGLE_NORMALIZED_ADDRESS",
    content_equivalence_decision: "NOT_EVALUATED_UNTIL_RB06"
  });
}

function observationFromManifestRow(value, row) {
  return {
    raw_url: value,
    source_scope: "LEGACY_PUBLIC_MANIFEST",
    source_scopes: ["LEGACY_PUBLIC_MANIFEST"],
    discovery_channels: row.discovered_by || ["LEGACY_MANIFEST"],
    legacy_manifest_ids: row.manifest_id ? [row.manifest_id] : [],
    root_candidates: row.common_root ? [row.common_root] : [],
    extraction_authorized: row.extraction_decision === "EXTRACT" && row.admission_tier === "PRIMARY",
    source_priority: 1
  };
}

function observationFromRawCandidate(value, candidate) {
  return {
    raw_url: value,
    source_scope: "RAW_DISCOVERY_INVENTORY",
    source_scopes: candidate.source_scopes || ["RAW_DISCOVERY_INVENTORY"],
    discovery_channels: candidate.discovery_channels || [],
    legacy_manifest_ids: candidate.legacy_manifest_ids || [],
    root_candidates: candidate.root_candidates || [],
    extraction_authorized: Boolean(candidate.extraction_authorized),
    source_priority: candidate.legacy_manifest_ids?.length ? 2 : 3
  };
}

function normalizeQuery(searchParams) {
  const retained = [];
  const removed = [];
  let originalIndex = 0;
  for (const [key, value] of searchParams.entries()) {
    if (isTrackingParameter(key)) removed.push(key);
    else retained.push({ key, value, originalIndex });
    originalIndex += 1;
  }
  const before = retained.map((item) => `${item.key}\u0000${item.value}`).join("\u0001");
  retained.sort((a, b) => a.key.localeCompare(b.key) || a.value.localeCompare(b.value) || a.originalIndex - b.originalIndex);
  const after = retained.map((item) => `${item.key}\u0000${item.value}`).join("\u0001");
  const output = new URLSearchParams();
  for (const item of retained) output.append(item.key, item.value);
  return {
    serialized: output.toString(),
    removed_tracking_parameters: unique(removed),
    sorted: retained.length > 1 && before !== after
  };
}

function normalizePath(value) {
  let path = String(value || "/").replace(/\\/g, "/").replace(/\/{2,}/g, "/");
  path = normalizeUnreservedEscapes(path);
  path = path.replace(/\/(?:index|default)\.(?:html?|xhtml)$/i, "/");
  if (path.length > 1) path = path.replace(/\/+$/g, "");
  return path || "/";
}

function normalizeUnreservedEscapes(value) {
  return String(value || "").replace(/%[0-9a-f]{2}/gi, (escape) => {
    const code = Number.parseInt(escape.slice(1), 16);
    const character = String.fromCharCode(code);
    return /[A-Za-z0-9\-._~]/.test(character) ? character : escape.toUpperCase();
  });
}

function normalizePort(protocol, port) {
  if (!port) return "";
  if (protocol === "http:" && port === "80") return "";
  if (protocol === "https:" && port === "443") return "";
  return port;
}

function isTrackingParameter(key) {
  return TRACKING_PARAMETER_PATTERNS.some((pattern) => pattern.test(String(key || "")));
}

function observationRank(value) {
  return Number(value.source_priority || 9) * 10 + (value.protocol === "https:" ? 0 : 1);
}

function normalizeHost(value) { return String(value || "").replace(/^www\./i, "").toLowerCase(); }
function safeUrl(value) { try { return new URL(String(value || "")); } catch { return null; } }
function stableId(prefix, value) { return `${prefix}.${crypto.createHash("sha256").update(String(value || "")).digest("hex").slice(0, 16)}`; }
function unique(values) { return [...new Set((values || []).filter(Boolean))]; }
function clean(value) { return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)); }
