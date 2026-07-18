import crypto from "node:crypto";
import { COMMON_ROOTS } from "./source-discovery-taxonomy.service.js";

export const PHASE1_LOGICAL_ROOT_ASSEMBLY_SCHEMA_VERSION = "PHASE1_LOGICAL_ROOT_ASSEMBLY_RB13_v1";
export const DEFAULT_MAX_ROOT_ARTIFACT_BYTES = 819200;

/**
 * RB-13 reassembles every populated non-legal root after selected extraction
 * and block dedupe. Source count is never a sharding trigger. Physical shards
 * exist only when the final serialised logical-root payload exceeds the byte
 * ceiling, and complete source text is never cut between shards.
 */
export function assembleLogicalRootArtifacts({ output, maxBytes = configuredMaxBytes() } = {}) {
  if (!output?.source_family_index?.root_artifact_manifest) throw new Error("PHASE1_LOGICAL_ROOT_ASSEMBLY_INPUT_INVALID");
  if (!Number.isFinite(maxBytes) || maxBytes <= 0) throw new Error("PHASE1_LOGICAL_ROOT_ASSEMBLY_MAX_BYTES_INVALID");

  const manifest = output.source_family_index.root_artifact_manifest;
  const savedNames = [];
  const rootAssemblyIndex = {};

  for (const rootDefinition of COMMON_ROOTS) {
    const root = rootDefinition.id;
    const entry = manifest[root] || emptyManifestEntry(root, rootDefinition.traversal_policy);
    manifest[root] = entry;
    const baseName = `lossless_root__${root}`;
    const priorNames = unique([...(entry.required_artifacts || []), ...(output[baseName] ? [baseName] : [])]);
    const priorArtifacts = priorNames.map((name) => output[name]).filter(Boolean);
    const template = priorArtifacts[0] || emptyTemplate({ output, root, rootDefinition });
    const sources = uniqueSources(priorArtifacts.flatMap((artifact) => artifact.sources || []));

    for (const name of priorNames) delete output[name];

    if (!sources.length) {
      normaliseEmptyEntry(entry, template);
      rootAssemblyIndex[root] = assemblyIndexEntry({ root, entry, maxBytes, logicalBytes: 0, sourceCount: 0 });
      continue;
    }

    const single = buildPhysicalArtifact({ template, root, sources, name: baseName, index: 1, count: 1, includeContext: true, maxBytes });
    let artifacts;
    if (byteLength(single) <= maxBytes) {
      artifacts = [single];
    } else {
      const groups = packByFinalPayloadBytes({ template, root, sources, maxBytes });
      artifacts = groups.map((group, index) => buildPhysicalArtifact({
        template,
        root,
        sources: group,
        name: `lossless_root__${root}__part_${String(index + 1).padStart(3, "0")}`,
        index: index + 1,
        count: groups.length,
        includeContext: index === 0,
        maxBytes
      }));
      artifacts = artifacts.map((artifact, index) => ({
        ...artifact,
        previous_shard: index > 0 ? artifacts[index - 1].artifact_name : null,
        next_shard: index < artifacts.length - 1 ? artifacts[index + 1].artifact_name : null
      }));
    }

    for (const artifact of artifacts) {
      artifact.artifact_size_estimate_bytes = byteLength(artifact);
      output[artifact.artifact_name] = artifact;
      savedNames.push(artifact.artifact_name);
    }

    const names = artifacts.map((artifact) => artifact.artifact_name);
    const logicalBytes = artifacts.reduce((sum, artifact) => sum + byteLength(artifact), 0);
    Object.assign(entry, {
      common_root: root,
      root_traversal_policy: entry.root_traversal_policy || rootDefinition.traversal_policy,
      status: artifacts.length === 1 ? "SINGLE" : "SHARDED",
      complete: true,
      virtual_artifact_name: baseName,
      required_artifacts: names,
      shard_count: names.length,
      source_count: sources.length,
      saved_source_rows: sources.length,
      source_ids: sources.map((source) => source.source_id),
      total_text_bytes: sources.reduce((sum, source) => sum + Buffer.byteLength(String(source.lossless_text || ""), "utf8"), 0),
      artifact_bytes: artifacts.map((artifact) => ({ artifact_name: artifact.artifact_name, bytes: byteLength(artifact) })),
      root_sources_required_together: names.length > 1,
      source_text_cutting_allowed: false,
      legal_documents_stored_separately: true,
      logical_root_id: root,
      logical_root_schema_version: PHASE1_LOGICAL_ROOT_ASSEMBLY_SCHEMA_VERSION,
      sharding_policy: "FINAL_PAYLOAD_BYTES_ONLY_AFTER_DEDUPE",
      max_physical_artifact_bytes: maxBytes,
      source_count_sharding_forbidden: true,
      oversized_atomic_source_allowed: true
    });
    rootAssemblyIndex[root] = assemblyIndexEntry({ root, entry, maxBytes, logicalBytes, sourceCount: sources.length });
  }

  output.source_family_index = {
    ...output.source_family_index,
    saved_root_artifacts: savedNames.sort(),
    root_artifact_manifest: manifest,
    logical_root_assembly: {
      schema_version: PHASE1_LOGICAL_ROOT_ASSEMBLY_SCHEMA_VERSION,
      status: "COMPLETE",
      assembly_order: "SELECTED_EXTRACTION_THEN_BLOCK_DEDUPE_THEN_LOGICAL_ROOT_ASSEMBLY",
      one_logical_artifact_per_populated_root: true,
      source_count_sharding_forbidden: true,
      sharding_trigger: "FINAL_SERIALISED_PAYLOAD_EXCEEDS_BYTE_CEILING",
      max_physical_artifact_bytes: maxBytes,
      source_text_cutting_allowed: false,
      roots: rootAssemblyIndex
    },
    corpus_forensics: {
      ...(output.source_family_index.corpus_forensics || {}),
      root_artifacts_saved: savedNames.length,
      roots_with_material_sources: Object.values(manifest).filter((entry) => (entry.source_count || 0) > 0).length,
      sharded_roots: Object.values(manifest).filter((entry) => entry.status === "SHARDED").length,
      rb13_logical_root_assembly_active: true,
      rb13_source_count_sharding_removed: true,
      rb13_max_physical_artifact_bytes: maxBytes
    }
  };

  return output;
}

export function assertLogicalRootAssembly(output, { maxBytes } = {}) {
  const assembly = output?.source_family_index?.logical_root_assembly;
  if (assembly?.schema_version !== PHASE1_LOGICAL_ROOT_ASSEMBLY_SCHEMA_VERSION) throw new Error("PHASE1_LOGICAL_ROOT_ASSEMBLY_SCHEMA_INVALID");
  if (assembly.one_logical_artifact_per_populated_root !== true || assembly.source_count_sharding_forbidden !== true || assembly.source_text_cutting_allowed !== false) throw new Error("PHASE1_LOGICAL_ROOT_ASSEMBLY_POLICY_INVALID");
  const ceiling = maxBytes || assembly.max_physical_artifact_bytes;

  for (const rootDefinition of COMMON_ROOTS) {
    const root = rootDefinition.id;
    const entry = output.source_family_index.root_artifact_manifest?.[root];
    if (!entry || entry.virtual_artifact_name !== `lossless_root__${root}` || entry.logical_root_id !== root) throw new Error(`PHASE1_LOGICAL_ROOT_ENTRY_INVALID:${root}`);
    const names = entry.required_artifacts || [];
    if ((entry.source_count || 0) > 0 && names.length === 0) throw new Error(`PHASE1_LOGICAL_ROOT_POPULATED_WITHOUT_ARTIFACT:${root}`);
    if (entry.status === "SINGLE" && (names.length !== 1 || names[0] !== `lossless_root__${root}`)) throw new Error(`PHASE1_LOGICAL_ROOT_SINGLE_NAME_INVALID:${root}`);
    if (entry.status === "SHARDED" && (names.length < 2 || names.some((name) => !new RegExp(`^lossless_root__${escapeRegex(root)}__part_\\d{3}$`).test(name)))) throw new Error(`PHASE1_LOGICAL_ROOT_SHARD_NAME_INVALID:${root}`);
    for (const name of names) {
      const artifact = output[name];
      if (!artifact || artifact.common_root !== root || artifact.root_virtual_artifact_name !== `lossless_root__${root}`) throw new Error(`PHASE1_LOGICAL_ROOT_ARTIFACT_INVALID:${name}`);
      const bytes = byteLength(artifact);
      const hasOversizedAtomicSource = (artifact.sources || []).some((source) => source.oversized_atomic_source === true);
      if (bytes > ceiling && !hasOversizedAtomicSource) throw new Error(`PHASE1_LOGICAL_ROOT_SHARD_EXCEEDS_CEILING:${name}:${bytes}`);
    }
    if (entry.status === "SHARDED") {
      const combinedSourceIds = names.flatMap((name) => (output[name]?.sources || []).map((source) => source.source_id));
      if (combinedSourceIds.length !== new Set(combinedSourceIds).size || combinedSourceIds.length !== entry.source_count) throw new Error(`PHASE1_LOGICAL_ROOT_SHARD_RECONSTRUCTION_INVALID:${root}`);
    }
  }
  return { ok: true, roots: COMMON_ROOTS.length, saved_artifacts: output.source_family_index.saved_root_artifacts.length };
}

function packByFinalPayloadBytes({ template, root, sources, maxBytes }) {
  const groups = [];
  let current = [];
  for (const original of sources) {
    const source = markOversizedAtomicSourceIfNeeded({ template, root, source: original, maxBytes, includeContext: groups.length === 0 });
    const candidate = [...current, source];
    const candidatePayload = buildPhysicalArtifact({ template, root, sources: candidate, name: "__candidate__", index: groups.length + 1, count: 999, includeContext: groups.length === 0, maxBytes });
    if (current.length && byteLength(candidatePayload) > maxBytes) {
      groups.push(current);
      current = [source];
    } else {
      current = candidate;
    }
  }
  if (current.length) groups.push(current);
  return groups;
}

function markOversizedAtomicSourceIfNeeded({ template, root, source, maxBytes, includeContext }) {
  const candidate = buildPhysicalArtifact({ template, root, sources: [source], name: "__atomic__", index: 1, count: 1, includeContext, maxBytes });
  if (byteLength(candidate) <= maxBytes) return source;
  return {
    ...source,
    oversized_atomic_source: true,
    oversized_atomic_source_policy: "COMPLETE_SOURCE_PRESERVED_WITHOUT_TEXT_CUTTING",
    extraction_warnings: unique([...(source.extraction_warnings || []), "SOURCE_EXCEEDS_800_KIB_PHYSICAL_TARGET_STORED_ATOMIC"])
  };
}

function buildPhysicalArtifact({ template, root, sources, name, index, count, includeContext, maxBytes }) {
  const multi = count > 1;
  const artifact = {
    ...template,
    schema_version: template.schema_version || "PHASE1_LOSSLESS_ROOT_v5_LOGICAL_ASSEMBLY",
    producer_version: PHASE1_LOGICAL_ROOT_ASSEMBLY_SCHEMA_VERSION,
    artifact_name: name,
    common_root: root,
    logical_root_id: root,
    root_virtual_artifact_name: `lossless_root__${root}`,
    storage_mode: multi ? "SHARD" : "SINGLE",
    shard_index: index,
    shard_count: count,
    previous_shard: null,
    next_shard: null,
    root_shard_integrity: {
      required_together: multi,
      physical_storage_only: multi,
      downstream_must_resolve_all_shards: multi,
      source_text_cutting_allowed: false,
      sharding_trigger: "FINAL_PAYLOAD_BYTES_ONLY",
      source_count_trigger_used: false,
      max_physical_artifact_bytes: maxBytes
    },
    sources,
    manifest_only_sources: includeContext ? template.manifest_only_sources || [] : [],
    metadata_only_sources: includeContext ? template.metadata_only_sources || [] : [],
    legal_document_sources: includeContext ? template.legal_document_sources || [] : [],
    rejected_sources: includeContext ? template.rejected_sources || [] : [],
    missing_limited_primary_sources: includeContext ? template.missing_limited_primary_sources || [] : [],
    corpus_forensics: {
      ...(template.corpus_forensics || {}),
      total_sources: sources.length,
      root_total_sources: template.sources?.length || sources.length,
      oversized_atomic_sources_included: sources.filter((source) => source.oversized_atomic_source === true).length
    },
    dedupe_forensics: includeContext ? {
      ...(template.dedupe_forensics || {}),
      canonical_sources_saved: template.sources?.length || sources.length,
      post_extraction_block_dedupe_applied: true,
      logical_root_assembly_applied: true
    } : {}
  };
  delete artifact.artifact_size_estimate_bytes;
  return artifact;
}

function emptyTemplate({ output, root, rootDefinition }) {
  return {
    run_id: output.source_family_index.run_id,
    target_url: output.source_family_index.target_url,
    generated_by: "source_discovery_extraction",
    artifact_name: `lossless_root__${root}`,
    common_root: root,
    priority: rootDefinition.priority,
    root_traversal_policy: rootDefinition.traversal_policy,
    neutral_buckets: rootDefinition.buckets,
    sources: [],
    legal_document_sources: [],
    manifest_only_sources: [],
    metadata_only_sources: [],
    rejected_sources: [],
    missing_limited_primary_sources: [],
    corpus_forensics: {},
    dedupe_forensics: {}
  };
}

function emptyManifestEntry(root, traversalPolicy) {
  return { common_root: root, root_traversal_policy: traversalPolicy, status: "UNSAVED_ABSENT", complete: true, required_artifacts: [], virtual_artifact_name: `lossless_root__${root}`, source_count: 0, source_ids: [] };
}

function normaliseEmptyEntry(entry, template) {
  Object.assign(entry, {
    status: entry.manifest_rows_seen ? "UNSAVED_INDEX_ONLY" : "UNSAVED_ABSENT",
    complete: true,
    required_artifacts: [],
    virtual_artifact_name: `lossless_root__${entry.common_root}`,
    shard_count: 0,
    source_count: 0,
    saved_source_rows: 0,
    source_ids: [],
    root_sources_required_together: false,
    source_text_cutting_allowed: false,
    legal_documents_stored_separately: true,
    logical_root_id: entry.common_root,
    logical_root_schema_version: PHASE1_LOGICAL_ROOT_ASSEMBLY_SCHEMA_VERSION,
    sharding_policy: "FINAL_PAYLOAD_BYTES_ONLY_AFTER_DEDUPE",
    source_count_sharding_forbidden: true,
    reason: entry.reason || (template.legal_document_sources?.length ? "Root contains only independently stored legal documents." : "Root evaluated without extracted non-legal material evidence.")
  });
}

function assemblyIndexEntry({ root, entry, maxBytes, logicalBytes, sourceCount }) {
  return {
    logical_root_id: root,
    virtual_artifact_name: `lossless_root__${root}`,
    status: entry.status,
    physical_artifacts: entry.required_artifacts || [],
    source_count: sourceCount,
    final_serialised_bytes: logicalBytes,
    max_physical_artifact_bytes: maxBytes,
    source_count_trigger_used: false,
    source_text_cutting_allowed: false
  };
}

function uniqueSources(sources) {
  const seen = new Set();
  const output = [];
  for (const source of sources || []) {
    const key = source.source_id || `${source.canonical_url || source.url}|${source.sha256 || sha256(source.lossless_text)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(source);
  }
  return output;
}

function configuredMaxBytes() {
  const parsed = Number.parseInt(process.env.LN_MAX_ROOT_ARTIFACT_BYTES || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_ROOT_ARTIFACT_BYTES;
}
function unique(values) { return [...new Set((values || []).filter(Boolean))]; }
function byteLength(value) { return Buffer.byteLength(JSON.stringify(value), "utf8"); }
function sha256(value) { return crypto.createHash("sha256").update(String(value || "")).digest("hex"); }
function escapeRegex(value) { return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
