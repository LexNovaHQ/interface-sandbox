import crypto from "node:crypto";
import { ENTITY_SURFACE_STATUSES } from "./internal-evidence-model.service.js";

export const PHASE1_ENTITY_BOUNDARY_SCHEMA_VERSION = "PHASE1_ENTITY_BOUNDARY_v1";

/**
 * Resolve a provisional entity/surface boundary before content dedupe. The
 * resolver never narrows discovery and never merges separate hosts into one
 * legal entity without explicit evidence.
 */
export function resolveEntityBoundary({ targetUrl, discoveredLinks = [], explicitEntitySurfaces = [] } = {}) {
  const primary = parseUrl(targetUrl);
  if (!primary) throw new Error("PHASE1_ENTITY_BOUNDARY_TARGET_URL_INVALID");
  const primaryHost = normalizeHost(primary.hostname);
  const primaryRegistrableDomain = registrableDomain(primaryHost);
  const explicitByHost = new Map((explicitEntitySurfaces || []).map((surface) => [normalizeHost(surface.host || hostFromUrl(surface.url)), surface]));
  const surfaceInputs = new Map();

  addSurfaceInput(surfaceInputs, {
    url: primary.toString(),
    host: primaryHost,
    discovery_channels: ["SUBMITTED_TARGET"],
    relationship_evidence: ["SUBMITTED_TARGET"]
  });

  for (const link of discoveredLinks || []) {
    const value = typeof link === "string" ? { url: link } : link || {};
    const parsed = parseUrl(value.url || value.canonical_url || value.raw_url);
    if (!parsed) continue;
    addSurfaceInput(surfaceInputs, {
      url: parsed.toString(),
      host: normalizeHost(parsed.hostname),
      discovery_channels: value.discovery_channels || value.discovered_by || [],
      anchor_texts: value.anchor_texts || (value.anchor_text ? [value.anchor_text] : []),
      relationship_evidence: value.relationship_evidence || []
    });
  }

  for (const explicit of explicitEntitySurfaces || []) {
    const host = normalizeHost(explicit.host || hostFromUrl(explicit.url));
    if (!host) continue;
    addSurfaceInput(surfaceInputs, {
      url: explicit.url || `https://${host}/`,
      host,
      discovery_channels: ["EXPLICIT_ENTITY_SURFACE"],
      anchor_texts: explicit.entity_name ? [explicit.entity_name] : [],
      relationship_evidence: explicit.evidence || ["EXPLICIT_ENTITY_SURFACE"]
    });
  }

  const surfaces = [];
  for (const input of surfaceInputs.values()) {
    const explicit = explicitByHost.get(input.host);
    const classification = explicit
      ? explicitClassification(explicit, input.host, primaryHost)
      : inferSurfaceClassification({ input, primaryHost, primaryRegistrableDomain });
    surfaces.push({
      surface_id: stableId("SURFACE", input.host),
      host: input.host,
      registrable_domain: registrableDomain(input.host),
      status: classification.status,
      entity_id: classification.entity_id,
      entity_name: classification.entity_name || null,
      entity_resolution_status: classification.entity_resolution_status,
      included_in_discovery_inventory: classification.status !== "EXCLUDED",
      targeted_crawl_allowed: ["PRIMARY_TARGET", "CONTROLLED_OPERATING_SURFACE", "SEPARATE_ENTITY_INCLUDED"].includes(classification.status),
      legal_capacity_merge_forbidden: input.host !== primaryHost && !classification.explicit_same_entity,
      discovery_channels: unique(input.discovery_channels),
      representative_urls: unique(input.urls).slice(0, 20),
      anchor_texts: unique(input.anchor_texts).slice(0, 20),
      relationship_evidence: unique([...input.relationship_evidence, ...classification.relationship_evidence]),
      confidence: classification.confidence
    });
  }

  surfaces.sort((a, b) => statusRank(a.status) - statusRank(b.status) || a.host.localeCompare(b.host));
  const targetSurface = surfaces.find((surface) => surface.host === primaryHost);
  return {
    target_boundary_manifest: {
      schema_version: PHASE1_ENTITY_BOUNDARY_SCHEMA_VERSION,
      status: "PROVISIONAL_NON_NARROWING",
      target_url: primary.toString(),
      primary_host: primaryHost,
      primary_registrable_domain: primaryRegistrableDomain,
      primary_surface_id: targetSurface?.surface_id,
      primary_entity_id: targetSurface?.entity_id,
      brand_boundary_is_not_legal_entity_boundary: true,
      different_hosts_not_merged_without_explicit_evidence: true,
      unresolved_surfaces_preserved: true,
      discovery_narrowing_allowed: false,
      downstream_routing_effect: "NONE"
    },
    entity_surface_map: {
      schema_version: PHASE1_ENTITY_BOUNDARY_SCHEMA_VERSION,
      status: surfaces.some((surface) => surface.status === "UNVERIFIED") ? "PROVISIONAL_WITH_UNVERIFIED_SURFACES" : "PROVISIONAL_COMPLETE",
      surfaces,
      counts: Object.fromEntries(ENTITY_SURFACE_STATUSES.map((status) => [status, surfaces.filter((surface) => surface.status === status).length]))
    }
  };
}

export function assertEntityBoundary(boundary) {
  const target = boundary?.target_boundary_manifest;
  const surfaces = boundary?.entity_surface_map?.surfaces;
  if (target?.schema_version !== PHASE1_ENTITY_BOUNDARY_SCHEMA_VERSION || !Array.isArray(surfaces)) throw new Error("PHASE1_ENTITY_BOUNDARY_SCHEMA_INVALID");
  if (target.discovery_narrowing_allowed !== false || target.downstream_routing_effect !== "NONE") throw new Error("PHASE1_ENTITY_BOUNDARY_NARROWING_FORBIDDEN");
  const primary = surfaces.filter((surface) => surface.status === "PRIMARY_TARGET");
  if (primary.length !== 1) throw new Error(`PHASE1_ENTITY_BOUNDARY_PRIMARY_COUNT_INVALID:${primary.length}`);
  const hosts = new Set();
  for (const surface of surfaces) {
    if (!surface.surface_id || !surface.host || !surface.entity_id) throw new Error("PHASE1_ENTITY_SURFACE_INCOMPLETE");
    if (!ENTITY_SURFACE_STATUSES.includes(surface.status)) throw new Error(`PHASE1_ENTITY_SURFACE_STATUS_INVALID:${surface.status}`);
    if (hosts.has(surface.host)) throw new Error(`PHASE1_ENTITY_SURFACE_DUPLICATE_HOST:${surface.host}`);
    hosts.add(surface.host);
  }
  return { ok: true, surfaces: surfaces.length };
}

function inferSurfaceClassification({ input, primaryHost, primaryRegistrableDomain }) {
  if (input.host === primaryHost) return {
    status: "PRIMARY_TARGET",
    entity_id: stableId("ENTITY_TARGET", primaryHost),
    entity_resolution_status: "TARGET_ENTITY_PROVISIONAL",
    explicit_same_entity: true,
    relationship_evidence: ["EXACT_TARGET_HOST"],
    confidence: "HIGH"
  };

  if (registrableDomain(input.host) === primaryRegistrableDomain) return {
    status: "CONTROLLED_OPERATING_SURFACE",
    entity_id: stableId("ENTITY_SURFACE", input.host),
    entity_resolution_status: "SEPARATE_CAPACITY_UNRESOLVED",
    explicit_same_entity: false,
    relationship_evidence: ["SAME_REGISTRABLE_DOMAIN"],
    confidence: "HIGH"
  };

  const primaryBrand = brandToken(primaryHost);
  const linkedBrand = brandToken(input.host);
  const anchorText = unique(input.anchor_texts).join(" ").toLowerCase();
  const legalNameSignal = /\b(limited|ltd\.?|private limited|plc|inc\.?|llc|corporation|company)\b/i.test(anchorText);
  const brandRelationship = Boolean(primaryBrand && linkedBrand && (linkedBrand.includes(primaryBrand) || primaryBrand.includes(linkedBrand)));

  if (brandRelationship && legalNameSignal) return {
    status: "UNVERIFIED",
    entity_id: stableId("ENTITY_SURFACE", input.host),
    entity_name: unique(input.anchor_texts).find((value) => /\b(limited|ltd\.?|private limited|plc|inc\.?|llc|corporation|company)\b/i.test(value)) || null,
    entity_resolution_status: "POTENTIAL_SEPARATE_ENTITY_REQUIRES_SOURCE_CONFIRMATION",
    explicit_same_entity: false,
    relationship_evidence: ["BRAND_TOKEN_OVERLAP", "LEGAL_NAME_ANCHOR_SIGNAL"],
    confidence: "MEDIUM"
  };

  if (brandRelationship) return {
    status: "UNVERIFIED",
    entity_id: stableId("ENTITY_SURFACE", input.host),
    entity_resolution_status: "POTENTIAL_CONTROLLED_SURFACE_REQUIRES_SOURCE_CONFIRMATION",
    explicit_same_entity: false,
    relationship_evidence: ["BRAND_TOKEN_OVERLAP"],
    confidence: "LOW"
  };

  return {
    status: "THIRD_PARTY",
    entity_id: stableId("ENTITY_THIRD_PARTY", input.host),
    entity_resolution_status: "EXTERNAL_REFERENCE_ONLY",
    explicit_same_entity: false,
    relationship_evidence: ["EXTERNAL_HOST_NO_CONTROL_EVIDENCE"],
    confidence: "HIGH"
  };
}

function explicitClassification(explicit, host, primaryHost) {
  const status = ENTITY_SURFACE_STATUSES.includes(explicit.status) ? explicit.status : "UNVERIFIED";
  return {
    status,
    entity_id: explicit.entity_id || stableId(status === "PRIMARY_TARGET" ? "ENTITY_TARGET" : "ENTITY_EXPLICIT", host),
    entity_name: explicit.entity_name || null,
    entity_resolution_status: explicit.entity_resolution_status || "EXPLICIT_OPERATOR_OR_EVIDENCE_OVERRIDE",
    explicit_same_entity: Boolean(explicit.same_entity_as_primary || host === primaryHost),
    relationship_evidence: unique(["EXPLICIT_ENTITY_SURFACE", ...(Array.isArray(explicit.evidence) ? explicit.evidence : explicit.evidence ? [explicit.evidence] : [])]),
    confidence: explicit.confidence || "HIGH"
  };
}

function addSurfaceInput(map, value) {
  if (!value.host) return;
  const existing = map.get(value.host) || { host: value.host, urls: [], discovery_channels: [], anchor_texts: [], relationship_evidence: [] };
  existing.urls = unique([...existing.urls, value.url]);
  existing.discovery_channels = unique([...existing.discovery_channels, ...(value.discovery_channels || [])]);
  existing.anchor_texts = unique([...existing.anchor_texts, ...(value.anchor_texts || [])]);
  existing.relationship_evidence = unique([...existing.relationship_evidence, ...(Array.isArray(value.relationship_evidence) ? value.relationship_evidence : value.relationship_evidence ? [value.relationship_evidence] : [])]);
  map.set(value.host, existing);
}

function registrableDomain(host) {
  const labels = normalizeHost(host).split(".").filter(Boolean);
  if (labels.length <= 2) return labels.join(".");
  const suffix2 = labels.slice(-2).join(".");
  const knownSecondLevel = new Set(["co.in", "com.au", "co.uk", "org.uk", "gov.uk", "com.sg", "co.nz", "co.za", "com.br", "co.jp"]);
  return knownSecondLevel.has(suffix2) ? labels.slice(-3).join(".") : suffix2;
}

function brandToken(host) {
  const base = registrableDomain(host).split(".")[0] || "";
  return base.toLowerCase().replace(/[^a-z0-9]/g, "").replace(/(payments?|technologies|technology|systems?|services?|digital|online)$/i, "");
}

function parseUrl(value) { try { return new URL(String(value || "")); } catch { return null; } }
function hostFromUrl(value) { return parseUrl(value)?.hostname || ""; }
function normalizeHost(value) { return String(value || "").replace(/^www\./i, "").toLowerCase().trim(); }
function stableId(prefix, value) { return `${prefix}.${crypto.createHash("sha256").update(String(value || "")).digest("hex").slice(0, 12)}`; }
function statusRank(value) { return { PRIMARY_TARGET: 1, CONTROLLED_OPERATING_SURFACE: 2, SEPARATE_ENTITY_INCLUDED: 3, UNVERIFIED: 4, AFFILIATE_REFERENCE_ONLY: 5, THIRD_PARTY: 6, EXCLUDED: 7 }[value] || 9; }
function unique(values) { return [...new Set((values || []).filter(Boolean))]; }
