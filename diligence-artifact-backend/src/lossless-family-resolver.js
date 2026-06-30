import { readArtifactPayload } from "./artifact-service.js";

export async function readPhaseArtifactWithResolvedLosslessFamilies({ run_id, artifact_name, agent_id, cache = {} }) {
  if (!isFamilyName(artifact_name)) return readArtifactPayload({ run_id, artifact_name, agent_id });
  return resolveFamily({ run_id, artifact_name, agent_id, cache });
}

async function resolveFamily({ run_id, artifact_name, agent_id, cache }) {
  const family = artifact_name.replace(/^lossless_family__/, "");
  const index = await getIndex({ run_id, agent_id, cache });
  const entry = index?.family_artifact_manifest?.[family];
  const required = Array.isArray(entry?.required_artifacts) ? entry.required_artifacts.filter(Boolean) : [];

  if (!entry) {
    try { return await readArtifactPayload({ run_id, artifact_name, agent_id }); }
    catch { return emptyFamily({ artifact_name, family, reason: "INDEX_ENTRY_MISSING" }); }
  }
  if (!required.length) return emptyFamily({ artifact_name, family, reason: entry.status || "UNSAVED_EMPTY", entry });

  const parts = [];
  for (const name of required) parts.push(await readArtifactPayload({ run_id, artifact_name: name, agent_id }));
  const ordered = parts.map((artifact, index) => ({ artifact, index })).sort((a, b) => Number(a.artifact.shard_index || a.index + 1) - Number(b.artifact.shard_index || b.index + 1));
  if (ordered.some(({ artifact }) => artifact.root_family && artifact.root_family !== family)) throw new Error(`FAMILY_PART_MISMATCH:${family}`);
  if (required.length > 1 && ordered.some(({ artifact }) => Number(artifact.shard_count || required.length) !== required.length)) throw new Error(`FAMILY_PART_COUNT_MISMATCH:${family}`);

  const base = ordered[0]?.artifact || {};
  const merged = {
    ...base,
    artifact_name,
    storage_mode: required.length > 1 ? "RESOLVED_FAMILY_PARTS" : base.storage_mode || "SINGLE",
    physical_artifact_names: required,
    family_part_resolution: { status: "COMPLETE", family, required_artifacts: required, loaded_artifacts: required, required_together: required.length > 1 },
    sources: ordered.flatMap(({ artifact }) => artifact.sources || []),
    manifest_only_sources: ordered.flatMap(({ artifact }) => artifact.manifest_only_sources || []),
    metadata_only_sources: ordered.flatMap(({ artifact }) => artifact.metadata_only_sources || []),
    rejected_sources: ordered.flatMap(({ artifact }) => artifact.rejected_sources || []),
    missing_limited_primary_sources: ordered.flatMap(({ artifact }) => artifact.missing_limited_primary_sources || [])
  };
  merged.corpus_forensics = { ...(base.corpus_forensics || {}), total_sources: merged.sources.length, resolved_physical_artifacts: required.length, source_fragments_loaded: merged.sources.filter((source) => source.parent_source_id).length };
  merged.dedupe_forensics = ordered.find(({ artifact }) => Object.keys(artifact.dedupe_forensics || {}).length)?.artifact.dedupe_forensics || base.dedupe_forensics || {};
  return merged;
}

async function getIndex({ run_id, agent_id, cache }) {
  if (cache.source_family_index !== undefined) return cache.source_family_index;
  try { cache.source_family_index = await readArtifactPayload({ run_id, artifact_name: "source_family_index", agent_id }); }
  catch { cache.source_family_index = null; }
  return cache.source_family_index;
}

function emptyFamily({ artifact_name, family, reason, entry = {} }) {
  return { artifact_name, root_family: family, bucket: entry.bucket || "", storage_mode: entry.status || "UNSAVED_EMPTY", sources: [], manifest_only_sources: [], metadata_only_sources: [], rejected_sources: [], missing_limited_primary_sources: [], family_part_resolution: { status: "UNSAVED_EMPTY", reason, required_artifacts: [] }, corpus_forensics: { total_sources: 0 } };
}

function isFamilyName(value) { return /^lossless_family__[A-Z0-9_]+$/.test(String(value || "")); }
