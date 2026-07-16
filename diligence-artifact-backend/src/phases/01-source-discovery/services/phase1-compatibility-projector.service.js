import { COMMON_ROOTS, COMMON_ROOT_ARTIFACT_NAMES } from "./source-discovery-taxonomy.service.js";
import { PHASE1_LOGICAL_ROOT_ASSEMBLY_SCHEMA_VERSION } from "./logical-root-assembly.service.js";
import { PHASE1_INDEPENDENT_LEGAL_ASSEMBLY_SCHEMA_VERSION } from "./independent-legal-artifact-assembly.service.js";

export const PHASE1_COMPATIBILITY_PROJECTOR_SCHEMA_VERSION = "PHASE1_COMPATIBILITY_PROJECTOR_RB15_v1";
export const PHASE1_FROZEN_PUBLIC_CONTRACT_ID = "PHASE1_PUBLIC_CONTRACT_FREEZE_v1";

const FIXED_AGENT_1B_ARTIFACTS = Object.freeze([
  "source_family_index",
  "legal_doc_inventory",
  "legal_doc_extraction_index",
  "legal_doc_lossless_validation_manifest"
]);

/**
 * RB-15 projects the rebuilt internals into the frozen Phase 1 public contract.
 * It does not create a new public artifact and does not require any downstream
 * reader change. Existing names and fields remain authoritative; new metadata
 * is strictly additive.
 */
export function projectPhase1Compatibility({ output, deduped_url_manifest } = {}) {
  if (!output || !deduped_url_manifest?.manifest_sources) throw new Error("PHASE1_COMPATIBILITY_PROJECTOR_INPUT_INVALID");
  for (const name of FIXED_AGENT_1B_ARTIFACTS) if (!output[name]) throw new Error(`PHASE1_COMPATIBILITY_PROJECTOR_FIXED_ARTIFACT_MISSING:${name}`);

  const rootManifest = output.source_family_index.root_artifact_manifest || {};
  const savedRootArtifacts = [];
  const logicalRootProjection = {};

  for (const rootDefinition of COMMON_ROOTS) {
    const root = rootDefinition.id;
    const entry = rootManifest[root];
    if (!entry) throw new Error(`PHASE1_COMPATIBILITY_PROJECTOR_ROOT_ENTRY_MISSING:${root}`);
    entry.common_root = root;
    entry.root_traversal_policy = entry.root_traversal_policy || rootDefinition.traversal_policy;
    entry.virtual_artifact_name = `lossless_root__${root}`;
    entry.required_artifacts = entry.required_artifacts || [];
    entry.complete = entry.complete !== false;
    entry.source_ids = entry.source_ids || [];
    entry.source_count = Number.isFinite(entry.source_count) ? entry.source_count : entry.source_ids.length;
    entry.shard_count = entry.required_artifacts.length;
    entry.root_sources_required_together = entry.required_artifacts.length > 1;
    entry.source_text_cutting_allowed = false;
    entry.legal_documents_stored_separately = true;

    for (const name of entry.required_artifacts) {
      const artifact = output[name];
      if (!artifact) throw new Error(`PHASE1_COMPATIBILITY_PROJECTOR_ROOT_ARTIFACT_MISSING:${name}`);
      if (!isValidRootArtifactName(name, root)) throw new Error(`PHASE1_COMPATIBILITY_PROJECTOR_ROOT_NAME_INVALID:${name}`);
      artifact.run_id = artifact.run_id || output.source_family_index.run_id;
      artifact.target_url = artifact.target_url || output.source_family_index.target_url;
      artifact.generated_by = artifact.generated_by || "source_discovery_extraction";
      artifact.artifact_name = name;
      artifact.common_root = root;
      artifact.root_traversal_policy = artifact.root_traversal_policy || rootDefinition.traversal_policy;
      artifact.root_virtual_artifact_name = `lossless_root__${root}`;
      artifact.sources = artifact.sources || [];
      artifact.legal_document_sources = artifact.legal_document_sources || [];
      artifact.manifest_only_sources = artifact.manifest_only_sources || [];
      artifact.metadata_only_sources = artifact.metadata_only_sources || [];
      artifact.rejected_sources = artifact.rejected_sources || [];
      artifact.missing_limited_primary_sources = artifact.missing_limited_primary_sources || [];
      artifact.source_text_cutting_allowed = false;
      artifact.compatibility_projection = compatibilityStamp("ROOT_ARTIFACT");
      savedRootArtifacts.push(name);
    }

    logicalRootProjection[root] = {
      file: `lossless_root__${root}`,
      virtual_root_file: `lossless_root__${root}`,
      storage_status: entry.status,
      physical_artifacts: [...entry.required_artifacts],
      shard_count: entry.required_artifacts.length,
      shard_resolution_required: entry.required_artifacts.length > 1,
      complete: entry.complete,
      source_count: entry.source_count,
      source_ids: [...entry.source_ids],
      source_text_cutting_allowed: false,
      legal_documents_stored_separately: true
    };
  }

  const legalNames = (output.legal_doc_inventory.documents_found || []).map((doc) => doc.artifact_name).sort();
  for (const name of legalNames) {
    if (!isValidLegalArtifactName(name) || !output[name]) throw new Error(`PHASE1_COMPATIBILITY_PROJECTOR_LEGAL_ARTIFACT_INVALID:${name}`);
    output[name].compatibility_projection = compatibilityStamp("LEGAL_DOCUMENT_ARTIFACT");
  }

  output.source_family_index = {
    ...output.source_family_index,
    generated_by: output.source_family_index.generated_by || "source_discovery_extraction",
    taxonomy_version: output.source_family_index.taxonomy_version || "PHASE1_AGNOSTIC_COMMON_ROOT_INDEX_v4_STORAGE_RESOLVER_HARDENED",
    manifest_artifact_required: "deduped_url_manifest",
    storage_taxonomy: "locked common roots plus independent legal documents",
    root_artifacts: [...COMMON_ROOT_ARTIFACT_NAMES],
    saved_root_artifacts: savedRootArtifacts.sort(),
    root_artifact_manifest: rootManifest,
    discovered_source_index: projectSourceRows(output.source_family_index.discovered_source_index || [], rootManifest),
    manifest_only_index: projectSourceRows(output.source_family_index.manifest_only_index || [], rootManifest),
    metadata_only_index: projectSourceRows(output.source_family_index.metadata_only_index || [], rootManifest),
    failed_source_index: projectSourceRows(output.source_family_index.failed_source_index || [], rootManifest),
    missing_limited_primary_sources: output.source_family_index.missing_limited_primary_sources || [],
    legal_doc_inventory_ref: "legal_doc_inventory",
    legal_doc_extraction_index_ref: "legal_doc_extraction_index",
    legal_doc_lossless_validation_manifest_ref: "legal_doc_lossless_validation_manifest",
    logical_root_projection: logicalRootProjection,
    compatibility_projection: {
      ...compatibilityStamp("SOURCE_FAMILY_INDEX"),
      fixed_public_artifacts_preserved: [...FIXED_AGENT_1B_ARTIFACTS],
      logical_root_pattern: "lossless_root__{COMMON_ROOT}",
      physical_root_shard_pattern: "lossless_root__{COMMON_ROOT}__part_{NNN}",
      legal_document_pattern: "legal_doc_{DOC_TYPE}",
      legal_document_stable_suffix_pattern: "legal_doc_{DOC_TYPE}__{STABLE_SUFFIX}",
      legal_document_stable_suffix_character_rule: "LOWERCASE_ALNUM_UNDERSCORE_HYPHEN",
      downstream_consumer_edit_required: false,
      root_reconstruction_supported: true,
      legal_navigation_controls_preserved: true
    },
    corpus_forensics: {
      ...(output.source_family_index.corpus_forensics || {}),
      rb15_compatibility_projector_active: true,
      rb15_downstream_consumer_edit_required: false,
      rb15_fixed_public_artifact_count: FIXED_AGENT_1B_ARTIFACTS.length,
      rb15_dynamic_root_artifact_count: savedRootArtifacts.length,
      rb15_dynamic_legal_artifact_count: legalNames.length
    }
  };

  output.legal_doc_inventory = projectControlArtifact(output.legal_doc_inventory, "LEGAL_DOC_INVENTORY");
  output.legal_doc_extraction_index = projectControlArtifact(output.legal_doc_extraction_index, "LEGAL_DOC_EXTRACTION_INDEX");
  output.legal_doc_lossless_validation_manifest = projectControlArtifact(output.legal_doc_lossless_validation_manifest, "LEGAL_DOC_VALIDATION_MANIFEST");

  return output;
}

export function assertPhase1CompatibilityProjection(output) {
  const projection = output?.source_family_index?.compatibility_projection;
  if (projection?.schema_version !== PHASE1_COMPATIBILITY_PROJECTOR_SCHEMA_VERSION || projection.frozen_contract_id !== PHASE1_FROZEN_PUBLIC_CONTRACT_ID) throw new Error("PHASE1_COMPATIBILITY_PROJECTOR_SCHEMA_INVALID");
  if (projection.downstream_consumer_edit_required !== false || projection.root_reconstruction_supported !== true || projection.legal_navigation_controls_preserved !== true) throw new Error("PHASE1_COMPATIBILITY_PROJECTOR_BOUNDARY_INVALID");
  for (const name of FIXED_AGENT_1B_ARTIFACTS) if (!output[name]) throw new Error(`PHASE1_COMPATIBILITY_PROJECTOR_FIXED_ARTIFACT_MISSING:${name}`);

  const rootManifest = output.source_family_index.root_artifact_manifest || {};
  for (const rootDefinition of COMMON_ROOTS) {
    const root = rootDefinition.id;
    const entry = rootManifest[root];
    const projected = output.source_family_index.logical_root_projection?.[root];
    if (!entry || !projected || projected.file !== `lossless_root__${root}` || projected.virtual_root_file !== `lossless_root__${root}`) throw new Error(`PHASE1_COMPATIBILITY_PROJECTOR_ROOT_PROJECTION_INVALID:${root}`);
    if (projected.physical_artifacts.length !== entry.required_artifacts.length) throw new Error(`PHASE1_COMPATIBILITY_PROJECTOR_ROOT_ARTIFACT_COUNT_MISMATCH:${root}`);
    for (const name of entry.required_artifacts) if (!output[name]) throw new Error(`PHASE1_COMPATIBILITY_PROJECTOR_ROOT_OUTPUT_MISSING:${name}`);
  }

  const legalNames = output.legal_doc_extraction_index?.dynamic_artifact_names || [];
  for (const name of legalNames) if (!isValidLegalArtifactName(name) || !output[name]) throw new Error(`PHASE1_COMPATIBILITY_PROJECTOR_DYNAMIC_LEGAL_OUTPUT_MISSING:${name}`);

  for (const row of output.source_family_index.discovered_source_index || []) {
    for (const field of ["source_id", "manifest_id", "common_root", "canonical_url", "route_type", "materiality", "admission_tier", "extraction_decision", "status"]) {
      if (row[field] === undefined || row[field] === null || row[field] === "") throw new Error(`PHASE1_COMPATIBILITY_PROJECTOR_SOURCE_FIELD_MISSING:${field}:${row.source_id || row.manifest_id || "unknown"}`);
    }
  }

  if (output.source_family_index.logical_root_assembly?.schema_version !== PHASE1_LOGICAL_ROOT_ASSEMBLY_SCHEMA_VERSION) throw new Error("PHASE1_COMPATIBILITY_PROJECTOR_RB13_NOT_ACTIVE");
  if (output.legal_doc_inventory?.producer_version !== PHASE1_INDEPENDENT_LEGAL_ASSEMBLY_SCHEMA_VERSION) throw new Error("PHASE1_COMPATIBILITY_PROJECTOR_RB14_NOT_ACTIVE");
  return { ok: true, roots: COMMON_ROOTS.length, legal_artifacts: legalNames.length };
}

function projectSourceRows(rows, rootManifest) {
  return rows.map((row) => {
    const entry = rootManifest[row.common_root] || {};
    return {
      ...row,
      canonical_url: row.canonical_url || row.url || row.fetch_url || row.final_url,
      fetch_url: row.fetch_url || row.url || row.canonical_url,
      route_type: row.route_type || "unclassified_source",
      materiality: row.materiality || "public_evidence",
      admission_tier: row.admission_tier || "CONTEXT_ONLY",
      extraction_decision: row.extraction_decision || "MANIFEST_ONLY",
      neutral_buckets: row.neutral_buckets || [],
      legal_doc_candidate: Boolean(row.legal_doc_candidate),
      status: row.status || row.extraction_status || (row.extraction_decision === "EXTRACT" ? "FETCHED" : "INDEXED"),
      file: row.legal_doc_candidate ? row.legal_doc_artifact_hint : entry.virtual_artifact_name || (row.common_root ? `lossless_root__${row.common_root}` : null),
      physical_artifacts: row.legal_doc_candidate ? unique([row.legal_doc_artifact_hint]) : entry.required_artifacts || [],
      text_field: row.legal_doc_candidate ? "lossless_text" : "sources[].lossless_text"
    };
  });
}

function projectControlArtifact(artifact, artifactType) {
  return { ...artifact, compatibility_projection: compatibilityStamp(artifactType) };
}

function compatibilityStamp(artifactType) {
  return {
    schema_version: PHASE1_COMPATIBILITY_PROJECTOR_SCHEMA_VERSION,
    frozen_contract_id: PHASE1_FROZEN_PUBLIC_CONTRACT_ID,
    artifact_type: artifactType,
    public_name_preserved: true,
    required_fields_preserved: true,
    additive_fields_only: true,
    downstream_consumer_edit_required: false
  };
}

function isValidRootArtifactName(name, root) { return name === `lossless_root__${root}` || new RegExp(`^lossless_root__${escapeRegex(root)}__part_\d{3}$`).test(name); }
function isValidLegalArtifactName(name) { return /^legal_doc_(?!.*__.*__)[a-z0-9_]+(?:__[a-z0-9_-]+)?$/.test(name) && !FIXED_AGENT_1B_ARTIFACTS.includes(name); }
function unique(values) { return [...new Set((values || []).filter(Boolean))]; }
function escapeRegex(value) { return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
