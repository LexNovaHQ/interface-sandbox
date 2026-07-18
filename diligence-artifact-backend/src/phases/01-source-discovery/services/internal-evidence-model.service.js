import crypto from "node:crypto";

export const PHASE1_INTERNAL_EVIDENCE_SCHEMA_VERSION = "PHASE1_INTERNAL_EVIDENCE_MODEL_v1";

export const ENTITY_SURFACE_STATUSES = Object.freeze([
  "PRIMARY_TARGET",
  "CONTROLLED_OPERATING_SURFACE",
  "SEPARATE_ENTITY_INCLUDED",
  "AFFILIATE_REFERENCE_ONLY",
  "THIRD_PARTY",
  "UNVERIFIED",
  "EXCLUDED"
]);

export const EVIDENCE_LANES = Object.freeze([
  "commercial_product",
  "technical_operation",
  "data_flow",
  "legal_instrument",
  "regulatory_disclosure",
  "security_compliance",
  "support_operations",
  "corporate_strategy",
  "unassigned"
]);

export const SOURCE_DISPOSITIONS = Object.freeze([
  "DISCOVERED_UNCLASSIFIED",
  "SELECTED_CANONICAL",
  "SELECTED_PARTIAL_CONTRIBUTOR",
  "ALIAS_EXACT_DUPLICATE",
  "SUPPRESSED_TEMPLATE_VARIANT",
  "SUPPRESSED_NEAR_DUPLICATE",
  "REFERENCE_ONLY",
  "LEGAL_INSTRUMENT",
  "METADATA_ONLY",
  "REJECTED_NOT_EVIDENCE",
  "FETCH_FAILED",
  "LEGACY_EXTRACT_PENDING"
]);

/**
 * Build the private Phase 1 evidence model without changing the public artifact
 * contract. One internal source candidate is created per canonical URL. Legacy
 * root rows become root references on that candidate instead of separate source
 * identities.
 */
export function buildInternalEvidenceModel({ run, manifest, entityBoundary, rawDiscoveryInventory } = {}) {
  const manifestRows = Array.isArray(manifest?.manifest_sources) ? manifest.manifest_sources : [];
  const surfaces = entityBoundary?.entity_surface_map?.surfaces || [];
  const grouped = groupRowsByCanonicalUrl(manifestRows);
  const sourceCandidates = [];

  for (const [canonicalUrl, rows] of grouped.entries()) {
    const primary = choosePrimaryLegacyRow(rows);
    const surface = surfaceForUrl(canonicalUrl, surfaces);
    sourceCandidates.push(clean({
      record_type: "SourceCandidate",
      schema_version: PHASE1_INTERNAL_EVIDENCE_SCHEMA_VERSION,
      candidate_id: stableId("SRC", `${surface?.entity_id || "unresolved"}|${canonicalUrl}`),
      run_id: run?.run_id,
      entity_surface_id: surface?.surface_id || null,
      entity_id: surface?.entity_id || null,
      entity_status: surface?.status || "UNVERIFIED",
      raw_url: primary.fetch_url || primary.canonical_url,
      canonical_url: canonicalUrl,
      discovery_channels: unique(rows.flatMap((row) => row.discovered_by || [])),
      primary_root: primary.common_root || null,
      root_candidates: unique(rows.map((row) => row.common_root)),
      secondary_root_references: unique(rows.filter((row) => row !== primary).map((row) => row.common_root)),
      feature_cluster: primary.feature_cluster || primary.variant_cluster_id || primary.route_type || "unassigned",
      evidence_lane: normalizeEvidenceLane(primary.evidence_lane || evidenceLaneFromLegacyRow(primary)),
      variant_family: primary.variant_family || primary.variant_cluster_id || "none",
      materiality: primary.materiality || "unassigned",
      legal_instrument_candidate: Boolean(rows.some((row) => row.legal_doc_candidate)),
      source_disposition: sourceDispositionFromLegacyRows(rows),
      legacy_manifest_refs: rows.map((row) => clean({
        manifest_id: row.manifest_id,
        common_root: row.common_root,
        route_type: row.route_type,
        admission_tier: row.admission_tier,
        extraction_decision: row.extraction_decision
      })),
      persistence_status: "INTERNAL_EMBEDDED_METADATA_ONLY"
    }));
  }

  const manifestUrlSet = new Set(sourceCandidates.map((candidate) => candidate.canonical_url));
  for (const candidate of rawDiscoveryInventory?.candidate_urls || []) {
    if (!candidate.canonical_url || manifestUrlSet.has(candidate.canonical_url)) continue;
    const surface = surfaceForUrl(candidate.canonical_url, surfaces);
    sourceCandidates.push(clean({
      record_type: "RawUrlCandidate",
      schema_version: PHASE1_INTERNAL_EVIDENCE_SCHEMA_VERSION,
      candidate_id: stableId("RAW", `${surface?.entity_id || "unresolved"}|${candidate.canonical_url}`),
      run_id: run?.run_id,
      entity_surface_id: surface?.surface_id || null,
      entity_id: surface?.entity_id || null,
      entity_status: surface?.status || "UNVERIFIED",
      raw_url: candidate.raw_url || candidate.canonical_url,
      canonical_url: candidate.canonical_url,
      discovery_channels: candidate.discovery_channels || [],
      primary_root: null,
      root_candidates: [],
      secondary_root_references: [],
      feature_cluster: "unassigned",
      evidence_lane: "unassigned",
      variant_family: "none",
      materiality: "unassigned",
      legal_instrument_candidate: false,
      source_disposition: "DISCOVERED_UNCLASSIFIED",
      persistence_status: "INTERNAL_EMBEDDED_METADATA_ONLY"
    }));
  }

  sourceCandidates.sort((a, b) => String(a.canonical_url).localeCompare(String(b.canonical_url)));
  return {
    schema_version: PHASE1_INTERNAL_EVIDENCE_SCHEMA_VERSION,
    status: "ACTIVE_INTERNAL_ONLY",
    public_contract_changed: false,
    permanent_artifact_created: false,
    downstream_reader_required: false,
    one_candidate_per_canonical_url: true,
    record_types: [
      "TargetBoundary",
      "EntitySurface",
      "RawUrlCandidate",
      "CanonicalUrlCandidate",
      "SourceFingerprint",
      "FeatureCluster",
      "EvidenceLane",
      "VariantFamily",
      "SourceDisposition",
      "ContentBlock",
      "LegalInstrument",
      "LogicalRoot"
    ],
    enums: {
      entity_surface_statuses: ENTITY_SURFACE_STATUSES,
      evidence_lanes: EVIDENCE_LANES,
      source_dispositions: SOURCE_DISPOSITIONS
    },
    counts: {
      public_manifest_rows: manifestRows.length,
      canonical_source_candidates: sourceCandidates.filter((record) => record.record_type === "SourceCandidate").length,
      raw_unclassified_candidates: sourceCandidates.filter((record) => record.record_type === "RawUrlCandidate").length,
      entity_surfaces: surfaces.length
    },
    source_candidates: sourceCandidates
  };
}

export function assertInternalEvidenceModel(model) {
  if (model?.schema_version !== PHASE1_INTERNAL_EVIDENCE_SCHEMA_VERSION) throw new Error("PHASE1_INTERNAL_EVIDENCE_MODEL_SCHEMA_INVALID");
  if (model.public_contract_changed !== false || model.permanent_artifact_created !== false || model.downstream_reader_required !== false) throw new Error("PHASE1_INTERNAL_EVIDENCE_MODEL_BOUNDARY_VIOLATION");
  const seen = new Set();
  for (const record of model.source_candidates || []) {
    if (!record.candidate_id || !record.canonical_url) throw new Error("PHASE1_INTERNAL_EVIDENCE_RECORD_INCOMPLETE");
    if (seen.has(record.canonical_url)) throw new Error(`PHASE1_INTERNAL_EVIDENCE_DUPLICATE_CANONICAL_URL:${record.canonical_url}`);
    seen.add(record.canonical_url);
    if (!SOURCE_DISPOSITIONS.includes(record.source_disposition)) throw new Error(`PHASE1_INTERNAL_EVIDENCE_DISPOSITION_INVALID:${record.source_disposition}`);
    if (!EVIDENCE_LANES.includes(record.evidence_lane)) throw new Error(`PHASE1_INTERNAL_EVIDENCE_LANE_INVALID:${record.evidence_lane}`);
  }
  return { ok: true, source_candidates: seen.size };
}

function groupRowsByCanonicalUrl(rows) {
  const grouped = new Map();
  for (const row of rows) {
    const key = String(row.canonical_url || row.fetch_url || "").trim();
    if (!key) continue;
    const list = grouped.get(key) || [];
    list.push(row);
    grouped.set(key, list);
  }
  return grouped;
}

function choosePrimaryLegacyRow(rows) {
  return [...rows].sort((a, b) => legacyTierRank(a.admission_tier) - legacyTierRank(b.admission_tier) || rootPriority(a.common_root) - rootPriority(b.common_root) || String(a.manifest_id || "").localeCompare(String(b.manifest_id || "")))[0] || {};
}

function sourceDispositionFromLegacyRows(rows) {
  if (rows.some((row) => row.legal_doc_candidate && row.extraction_decision === "EXTRACT")) return "LEGAL_INSTRUMENT";
  if (rows.some((row) => row.extraction_decision === "EXTRACT")) return "LEGACY_EXTRACT_PENDING";
  if (rows.some((row) => row.admission_tier === "METADATA_ONLY" || row.extraction_decision === "NO_EXTRACT")) return "METADATA_ONLY";
  if (rows.some((row) => row.admission_tier === "REJECTED_NOT_EVIDENCE")) return "REJECTED_NOT_EVIDENCE";
  return "REFERENCE_ONLY";
}

function evidenceLaneFromLegacyRow(row = {}) {
  if (row.legal_doc_candidate || row.materiality === "legal_document") return "legal_instrument";
  if (row.common_root === "docs_api_data_flow" || row.materiality === "data_flow_signal") return "data_flow";
  if (row.common_root === "technical_docs_api" || row.common_root === "integrations_ecosystem") return "technical_operation";
  if (row.common_root === "security_trust_compliance") return "security_compliance";
  if (row.common_root === "regulatory_licensing_status") return "regulatory_disclosure";
  if (row.common_root === "support_help_resources" || row.common_root === "grievance_complaints") return "support_operations";
  if (["company_identity", "homepage_landing", "use_case_customer_industry"].includes(row.common_root)) return "corporate_strategy";
  if (["product_service", "platform_feature_solution", "pricing_commercial_availability"].includes(row.common_root)) return "commercial_product";
  return "unassigned";
}

function normalizeEvidenceLane(value) {
  return EVIDENCE_LANES.includes(value) ? value : "unassigned";
}

function surfaceForUrl(value, surfaces) {
  try {
    const host = new URL(value).hostname.replace(/^www\./i, "").toLowerCase();
    return surfaces.find((surface) => surface.host === host) || null;
  } catch {
    return null;
  }
}

function legacyTierRank(value) { return { PRIMARY: 1, SECONDARY: 2, CONTEXT_ONLY: 3, METADATA_ONLY: 4, REJECTED_NOT_EVIDENCE: 5 }[value] || 9; }
function rootPriority(value) { return { homepage_landing: 1, company_identity: 2, product_service: 3, platform_feature_solution: 4, technical_docs_api: 5, docs_api_data_flow: 6, privacy_data_processing: 7, security_trust_compliance: 8, data_governance_controls: 9, ai_safety_transparency: 10, regulatory_licensing_status: 11, grievance_complaints: 12 }[value] || 50; }
function stableId(prefix, value) { return `${prefix}.${crypto.createHash("sha256").update(String(value || "")).digest("hex").slice(0, 16)}`; }
function unique(values) { return [...new Set((values || []).filter(Boolean))]; }
function clean(value) { return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)); }
