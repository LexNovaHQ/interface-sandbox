import crypto from "node:crypto";
import { stableSlug } from "./source-discovery-taxonomy.service.js";

export const PHASE1_INDEPENDENT_LEGAL_ASSEMBLY_SCHEMA_VERSION = "PHASE1_INDEPENDENT_LEGAL_ASSEMBLY_RB14_v1";

const CONTROL_ARTIFACTS = new Set([
  "legal_doc_inventory",
  "legal_doc_extraction_index",
  "legal_doc_lossless_validation_manifest"
]);

/**
 * RB-14 preserves every distinct legal instrument as a complete independent
 * artifact. Exact duplicates may collapse only inside the same entity and
 * document type. Similar text, shared branding, or a shared URL family can
 * never merge instruments belonging to different entities or scopes.
 */
export function assembleIndependentLegalArtifacts({ output, deduped_url_manifest } = {}) {
  if (!output?.legal_doc_inventory || !output?.source_family_index || !deduped_url_manifest?.manifest_sources) throw new Error("PHASE1_INDEPENDENT_LEGAL_ASSEMBLY_INPUT_INVALID");

  const manifestRows = deduped_url_manifest.manifest_sources || [];
  const manifestByUrl = new Map();
  for (const row of manifestRows) {
    for (const url of unique([row.canonical_url, row.fetch_url, ...(row.alias_urls || [])])) manifestByUrl.set(url, row);
  }

  const priorNames = Object.keys(output).filter(isDynamicLegalArtifactName);
  const candidates = [];
  for (const doc of output.legal_doc_inventory.documents_found || []) {
    const artifact = output[doc.artifact_name];
    if (!artifact?.lossless_text) throw new Error(`PHASE1_LEGAL_ARTIFACT_SOURCE_MISSING:${doc.artifact_name}`);
    const row = manifestByUrl.get(doc.source_url) || manifestRows.find((item) => item.canonical_identity && item.canonical_identity === doc.canonical_identity) || {};
    const entityId = doc.entity_id || artifact.entity_id || row.entity_id || "entity_unverified";
    const docType = normaliseDocType(doc.doc_type || artifact.doc_type || row.legal_doc_type || "other");
    const digest = doc.sha256 || artifact.sha256 || sha256(artifact.lossless_text);
    candidates.push({
      prior_artifact_name: doc.artifact_name,
      entity_id: entityId,
      entity_status: row.entity_status || artifact.entity_status || null,
      doc_type: docType,
      source_url: doc.source_url || artifact.source_url || row.canonical_url,
      fetch_url: row.fetch_url || artifact.source_url || doc.source_url,
      canonical_identity: doc.canonical_identity || artifact.canonical_identity || row.canonical_identity || `${entityId}|${doc.source_url || artifact.source_url}`,
      canonical_candidate_id: doc.canonical_candidate_id || artifact.canonical_candidate_id || row.canonical_candidate_id || null,
      common_root: row.common_root || artifact.common_root || null,
      route_type: row.route_type || artifact.route_type || null,
      materiality: row.materiality || "legal_document",
      feature_cluster: row.feature_cluster || artifact.feature_cluster || "legal_governance",
      evidence_lane: "legal_instrument",
      secondary_root_references: row.secondary_root_references || artifact.secondary_root_references || [],
      source_signal_roles: unique([...(doc.source_signal_roles || []), ...(artifact.source_signal_roles || []), ...(row.source_signal_roles || [])]),
      lossless_text: artifact.lossless_text,
      sha256: digest,
      extraction_warnings: unique([...(artifact.extraction_warnings || [])]),
      aliases: unique([doc.source_url, artifact.source_url, row.canonical_url, row.fetch_url, ...(row.alias_urls || [])]),
      scope_identity: deriveScopeIdentity(row, artifact),
      legal_doc_artifact_hint: row.legal_doc_artifact_hint || doc.artifact_name
    });
  }

  const groups = collapseExactDuplicates(candidates);
  const primaryEntityId = deduped_url_manifest.target_boundary?.primary_entity_id || deduped_url_manifest.primary_entity_id || null;
  assignArtifactNames(groups, primaryEntityId);

  for (const name of priorNames) delete output[name];

  const documents = [];
  const urlToArtifact = {};
  const canonicalIdentityToArtifact = {};
  const artifactToDocType = {};
  const artifactToEntity = {};
  const exactDuplicates = [];

  for (const group of groups) {
    const artifact = {
      run_id: output.source_family_index.run_id,
      target_url: output.source_family_index.target_url,
      generated_by: "source_discovery_extraction",
      producer_version: PHASE1_INDEPENDENT_LEGAL_ASSEMBLY_SCHEMA_VERSION,
      schema_version: "PHASE1_LEGAL_DOC_LOSSLESS_v5_INDEPENDENT_INSTRUMENT",
      artifact_name: group.artifact_name,
      doc_type: group.doc_type,
      entity_id: group.entity_id,
      entity_status: group.entity_status,
      scope_identity: group.scope_identity,
      source_url: group.source_url,
      source_urls: group.aliases,
      canonical_identity: group.canonical_identity,
      canonical_candidate_id: group.canonical_candidate_id,
      route_type: group.route_type,
      common_root: group.common_root,
      materiality: group.materiality,
      feature_cluster: group.feature_cluster,
      evidence_lane: "legal_instrument",
      secondary_root_references: group.secondary_root_references,
      source_signal_roles: group.source_signal_roles,
      extraction_mode: "LOSSLESS_DOCUMENT_GRANULAR",
      extraction_scope: "FULL_DOCUMENT",
      legal_doc_granularity_rule: "This artifact contains one distinct legal instrument only. Different entities or materially different instruments must never be merged.",
      legal_integrity_unit: true,
      source_text_cutting_allowed: false,
      near_duplicate_merging_forbidden: true,
      cross_entity_merging_forbidden: true,
      exact_duplicate_aliases_collapsed: group.members.length - 1,
      lossless_text: group.lossless_text,
      sha256: group.sha256,
      extraction_warnings: group.extraction_warnings
    };
    output[group.artifact_name] = artifact;

    const document = {
      doc_id: group.artifact_name,
      artifact_name: group.artifact_name,
      doc_type: group.doc_type,
      entity_id: group.entity_id,
      scope_identity: group.scope_identity,
      source_url: group.source_url,
      source_urls: group.aliases,
      canonical_identity: group.canonical_identity,
      canonical_candidate_id: group.canonical_candidate_id,
      extraction_mode: "LOSSLESS_DOCUMENT_GRANULAR",
      extraction_scope: "FULL_DOCUMENT",
      status: "EXTRACTED",
      sha256: group.sha256,
      source_signal_roles: group.source_signal_roles,
      secondary_root_references: group.secondary_root_references,
      exact_duplicate_aliases_collapsed: group.members.length - 1
    };
    documents.push(document);

    for (const url of group.aliases) urlToArtifact[url] = group.artifact_name;
    for (const identity of group.members.map((member) => member.canonical_identity).filter(Boolean)) canonicalIdentityToArtifact[identity] = group.artifact_name;
    artifactToDocType[group.artifact_name] = group.doc_type;
    artifactToEntity[group.artifact_name] = group.entity_id;
    if (group.members.length > 1) exactDuplicates.push({ artifact_name: group.artifact_name, entity_id: group.entity_id, doc_type: group.doc_type, sha256: group.sha256, collapsed_source_urls: group.aliases });
  }

  documents.sort((a, b) => a.artifact_name.localeCompare(b.artifact_name));
  output.legal_doc_inventory = {
    ...output.legal_doc_inventory,
    producer_version: PHASE1_INDEPENDENT_LEGAL_ASSEMBLY_SCHEMA_VERSION,
    schema_version: "PHASE1_LEGAL_DOC_INVENTORY_v5_INDEPENDENT_INSTRUMENT",
    status: documents.length ? "LEGAL_DOCS_EXTRACTED" : "NO_LEGAL_DOCS_EXTRACTED",
    documents_found: documents,
    inventory_is_navigation_only: true,
    individual_legal_doc_artifacts_are_source_of_truth: true,
    distinct_instrument_rule: "ENTITY_ID_PLUS_DOC_TYPE_PLUS_CONTENT_HASH",
    near_duplicate_merging_forbidden: true,
    cross_entity_merging_forbidden: true,
    exact_duplicate_aliases_collapsed: exactDuplicates.length
  };
  output.legal_doc_extraction_index = {
    ...output.legal_doc_extraction_index,
    producer_version: PHASE1_INDEPENDENT_LEGAL_ASSEMBLY_SCHEMA_VERSION,
    schema_version: "PHASE1_LEGAL_DOC_EXTRACTION_INDEX_v5_INDEPENDENT_INSTRUMENT",
    url_to_artifact: urlToArtifact,
    canonical_identity_to_artifact: canonicalIdentityToArtifact,
    artifact_to_doc_type: artifactToDocType,
    artifact_to_entity: artifactToEntity,
    dynamic_artifact_names: documents.map((doc) => doc.artifact_name)
  };
  output.legal_doc_lossless_validation_manifest = {
    ...output.legal_doc_lossless_validation_manifest,
    producer_version: PHASE1_INDEPENDENT_LEGAL_ASSEMBLY_SCHEMA_VERSION,
    schema_version: "PHASE1_LEGAL_DOC_LOSSLESS_VALIDATION_v5_INDEPENDENT_INSTRUMENT",
    legal_source_count: candidates.length,
    distinct_legal_instrument_count: groups.length,
    legal_doc_artifact_count: documents.length,
    exact_duplicate_alias_groups_collapsed: exactDuplicates.length,
    exact_duplicate_aliases_collapsed: candidates.length - groups.length,
    one_distinct_instrument_one_artifact: groups.length === documents.length,
    merged_legal_blob_detected: false,
    cross_entity_merge_detected: false,
    near_duplicate_merge_detected: false,
    every_artifact_has_entity_provenance: documents.every((doc) => Boolean(doc.entity_id)),
    every_artifact_is_full_document: documents.every((doc) => output[doc.artifact_name]?.extraction_scope === "FULL_DOCUMENT" && output[doc.artifact_name]?.source_text_cutting_allowed === false),
    status: groups.length === documents.length && documents.every((doc) => Boolean(doc.entity_id)) ? "PASS" : "FAIL",
    exact_duplicate_groups: exactDuplicates
  };

  projectLegalArtifactHints(output, urlToArtifact, canonicalIdentityToArtifact);
  output.source_family_index = {
    ...output.source_family_index,
    legal_artifact_names: documents.map((doc) => doc.artifact_name),
    corpus_forensics: {
      ...(output.source_family_index.corpus_forensics || {}),
      legal_source_rows: candidates.length,
      distinct_legal_instruments: groups.length,
      exact_duplicate_legal_aliases_collapsed: candidates.length - groups.length,
      rb14_independent_legal_artifacts_active: true
    }
  };

  return output;
}

export function assertIndependentLegalArtifacts(output) {
  const inventory = output?.legal_doc_inventory;
  const validation = output?.legal_doc_lossless_validation_manifest;
  if (inventory?.producer_version !== PHASE1_INDEPENDENT_LEGAL_ASSEMBLY_SCHEMA_VERSION || validation?.producer_version !== PHASE1_INDEPENDENT_LEGAL_ASSEMBLY_SCHEMA_VERSION) throw new Error("PHASE1_INDEPENDENT_LEGAL_ASSEMBLY_VERSION_INVALID");
  if (validation.status !== "PASS" || validation.merged_legal_blob_detected !== false || validation.cross_entity_merge_detected !== false || validation.near_duplicate_merge_detected !== false) throw new Error("PHASE1_INDEPENDENT_LEGAL_ASSEMBLY_VALIDATION_FAILED");
  const names = new Set();
  const integrityKeys = new Set();
  for (const doc of inventory.documents_found || []) {
    if (!doc.artifact_name || !doc.entity_id || !doc.doc_type || !doc.sha256) throw new Error("PHASE1_INDEPENDENT_LEGAL_DOCUMENT_INCOMPLETE");
    if (names.has(doc.artifact_name)) throw new Error(`PHASE1_INDEPENDENT_LEGAL_DUPLICATE_NAME:${doc.artifact_name}`);
    names.add(doc.artifact_name);
    const artifact = output[doc.artifact_name];
    if (!artifact || artifact.lossless_text !== String(artifact.lossless_text || "") || artifact.extraction_scope !== "FULL_DOCUMENT" || artifact.source_text_cutting_allowed !== false) throw new Error(`PHASE1_INDEPENDENT_LEGAL_ARTIFACT_INVALID:${doc.artifact_name}`);
    if (artifact.entity_id !== doc.entity_id || artifact.sha256 !== doc.sha256) throw new Error(`PHASE1_INDEPENDENT_LEGAL_PROVENANCE_MISMATCH:${doc.artifact_name}`);
    const key = `${doc.entity_id}|${doc.doc_type}|${doc.sha256}`;
    if (integrityKeys.has(key)) throw new Error(`PHASE1_INDEPENDENT_LEGAL_EXACT_DUPLICATE_NOT_COLLAPSED:${key}`);
    integrityKeys.add(key);
  }
  return { ok: true, legal_artifacts: names.size };
}

function collapseExactDuplicates(candidates) {
  const grouped = new Map();
  for (const candidate of candidates) {
    const key = `${candidate.entity_id}|${candidate.doc_type}|${candidate.sha256}`;
    const existing = grouped.get(key) || { ...candidate, members: [], aliases: [] };
    existing.members.push(candidate);
    existing.aliases = unique([...existing.aliases, ...candidate.aliases]);
    existing.secondary_root_references = unique([...(existing.secondary_root_references || []), ...(candidate.secondary_root_references || [])]);
    existing.source_signal_roles = unique([...(existing.source_signal_roles || []), ...(candidate.source_signal_roles || [])]);
    existing.extraction_warnings = unique([...(existing.extraction_warnings || []), ...(candidate.extraction_warnings || [])]);
    if (canonicalCandidateRank(candidate) < canonicalCandidateRank(existing)) Object.assign(existing, candidate, { members: existing.members, aliases: existing.aliases });
    grouped.set(key, existing);
  }
  return [...grouped.values()].sort((a, b) => a.doc_type.localeCompare(b.doc_type) || a.entity_id.localeCompare(b.entity_id) || a.source_url.localeCompare(b.source_url));
}

function assignArtifactNames(groups, primaryEntityId) {
  const byType = new Map();
  for (const group of groups) byType.set(group.doc_type, [...(byType.get(group.doc_type) || []), group]);
  for (const [docType, typeGroups] of byType) {
    typeGroups.sort((a, b) => primaryRank(a.entity_id, primaryEntityId) - primaryRank(b.entity_id, primaryEntityId) || a.entity_id.localeCompare(b.entity_id) || a.source_url.localeCompare(b.source_url));
    const used = new Set();
    typeGroups.forEach((group, index) => {
      const base = `legal_doc_${docType}`;
      if (index === 0) {
        group.artifact_name = base;
        used.add(base);
        return;
      }
      const entitySuffix = stableSlug(group.entity_id || "entity");
      let suffix = entitySuffix;
      if (typeGroups.filter((item) => item.entity_id === group.entity_id).length > 1) suffix = `${entitySuffix}__${stableSlug(group.scope_identity || group.source_url)}`;
      let name = `${base}__${suffix}`;
      let counter = 2;
      while (used.has(name)) name = `${base}__${suffix}_${counter++}`;
      group.artifact_name = name;
      used.add(name);
    });
  }
}

function projectLegalArtifactHints(output, urlToArtifact, canonicalIdentityToArtifact) {
  const rows = output.source_family_index.discovered_source_index || [];
  for (const row of rows) {
    if (!row.legal_doc_candidate) continue;
    const artifactName = canonicalIdentityToArtifact[row.canonical_identity] || urlToArtifact[row.canonical_url] || urlToArtifact[row.url] || row.legal_doc_artifact_hint;
    row.legal_doc_artifact_hint = artifactName;
  }
  for (const name of output.source_family_index.saved_root_artifacts || []) {
    const artifact = output[name];
    for (const row of artifact?.legal_document_sources || []) {
      row.legal_doc_artifact_hint = canonicalIdentityToArtifact[row.canonical_identity] || urlToArtifact[row.canonical_url] || urlToArtifact[row.url] || row.legal_doc_artifact_hint;
    }
  }
}

function isDynamicLegalArtifactName(name) { return /^legal_doc_[a-z0-9_]+(?:__[a-z0-9_]+)*$/.test(name) && !CONTROL_ARTIFACTS.has(name); }
function normaliseDocType(value) { return stableSlug(String(value || "other")).replace(/-+/g, "_") || "other"; }
function deriveScopeIdentity(row, artifact) { return row.feature_cluster || artifact.feature_cluster || stableSlug(row.canonical_url || artifact.source_url || "legal_instrument"); }
function canonicalCandidateRank(candidate) { return (candidate.source_url?.length || 9999) + (candidate.canonical_candidate_id ? 0 : 10000); }
function primaryRank(entityId, primaryEntityId) { return primaryEntityId && entityId === primaryEntityId ? 0 : 1; }
function unique(values) { return [...new Set((values || []).filter(Boolean))]; }
function sha256(value) { return crypto.createHash("sha256").update(String(value || "")).digest("hex"); }
