import { buildSourceExtractionArtifactSet as buildLegacySourceExtractionArtifactSet } from "./source-extraction.service.js";
import { applySelectedExtractionScope, assertSelectedExtractionResult } from "./selected-extraction.service.js";
import { createBlockDedupeState, dedupeExtractedSource, serialiseBlockDedupeState, assertBlockDedupeState } from "./post-extraction-block-dedupe.service.js";

export const PHASE1_UNIVERSAL_EXTRACTION_SCHEMA_VERSION = "PHASE1_UNIVERSAL_EXTRACTION_RB12_v1";

export async function buildUniversalSourceExtractionArtifactSet({ run, deduped_url_manifest } = {}) {
  const output = await buildLegacySourceExtractionArtifactSet({ run, deduped_url_manifest });
  return applyUniversalExtractionControls({ output, deduped_url_manifest });
}

export function applyUniversalExtractionControls({ output, deduped_url_manifest } = {}) {
  if (!output?.source_family_index || !deduped_url_manifest?.manifest_sources) throw new Error("PHASE1_UNIVERSAL_EXTRACTION_INPUT_INVALID");
  const manifestById = new Map(deduped_url_manifest.manifest_sources.map((row) => [row.manifest_id, row]));
  const blockState = createBlockDedupeState();
  const retainedIndex = [];
  const suppressedIndex = [];
  const savedNames = [];

  for (const [root, entry] of Object.entries(output.source_family_index.root_artifact_manifest || {})) {
    const physicalNames = [...(entry.required_artifacts || [])];
    const templates = physicalNames.map((name) => output[name]).filter(Boolean);
    const sources = templates.flatMap((artifact) => artifact.sources || []);
    const retained = [];

    for (const source of sources) {
      const manifestRow = manifestById.get(source.manifest_id) || {};
      const enriched = enrichSource(source, manifestRow);
      const scoped = applySelectedExtractionScope({
        manifestRow,
        extracted: {
          ok: true,
          lossless_text: enriched.lossless_text,
          extraction_warnings: enriched.extraction_warnings || []
        }
      });
      assertSelectedExtractionResult(manifestRow, scoped);
      const scopedSource = {
        ...enriched,
        lossless_text: scoped.lossless_text,
        sha256: scoped.extraction_scope_forensics.selected_sha256,
        extraction_scope: scoped.extraction_scope,
        extraction_scope_applied: true,
        selected_extraction_schema_version: scoped.selected_extraction_schema_version,
        extraction_scope_forensics: scoped.extraction_scope_forensics,
        extraction_warnings: scoped.extraction_warnings
      };
      const deduped = dedupeExtractedSource({ root, source: scopedSource, state: blockState });
      if (deduped.action === "RETAIN") {
        retained.push(deduped.source);
        retainedIndex.push(withoutLosslessText(deduped.source));
      } else {
        suppressedIndex.push({
          ...withoutLosslessText(scopedSource),
          extraction_status: deduped.action,
          source_disposition: deduped.action === "SUPPRESS_EXACT_DUPLICATE" ? "ALIAS_EXACT_DUPLICATE" : "SUPPRESSED_NEAR_DUPLICATE",
          extraction_decision: "MANIFEST_ONLY",
          admission_tier: "CONTEXT_ONLY",
          duplicate_owner_source_id: deduped.duplicate_owner_source_id,
          block_dedupe_forensics: deduped.forensics
        });
      }
    }

    redistributeRootArtifacts({ output, root, entry, templates, retained, savedNames });
  }

  const legalRows = output.source_family_index.discovered_source_index.filter((row) => row.legal_doc_candidate);
  const enrichedLegalIndex = legalRows.map((row) => enrichSource(row, manifestById.get(row.manifest_id) || {}));
  retainedIndex.push(...enrichedLegalIndex);
  enrichLegalArtifacts(output, manifestById);

  const blockDedupe = serialiseBlockDedupeState(blockState);
  assertBlockDedupeState(blockDedupe);
  output.source_family_index = {
    ...output.source_family_index,
    producer_version: PHASE1_UNIVERSAL_EXTRACTION_SCHEMA_VERSION,
    discovered_source_index: retainedIndex,
    manifest_only_index: [...(output.source_family_index.manifest_only_index || []), ...suppressedIndex],
    saved_root_artifacts: savedNames.sort(),
    block_dedupe_forensics: blockDedupe,
    extraction_boundary: "Agent 1B extracted only rows authorised by the final RB-10 manifest, applied the declared extraction scope, preserved full legal instruments, and deduplicated non-legal blocks inside each primary logical root.",
    corpus_forensics: {
      ...output.source_family_index.corpus_forensics,
      sources_extracted: retainedIndex.length,
      manifest_only_rows: (output.source_family_index.manifest_only_index || []).length + suppressedIndex.length,
      exact_duplicate_sources_suppressed: blockDedupe.totals.exact_duplicate_sources_suppressed,
      block_only_duplicate_sources_suppressed: blockDedupe.totals.block_only_duplicate_sources_suppressed,
      duplicate_blocks_removed: blockDedupe.totals.duplicate_blocks_removed,
      rb11_selected_extraction_active: true,
      rb12_block_dedupe_active: true
    }
  };
  return output;
}

function redistributeRootArtifacts({ output, root, entry, templates, retained, savedNames }) {
  for (const name of entry.required_artifacts || []) delete output[name];
  if (!retained.length) {
    entry.status = entry.manifest_rows_seen ? "UNSAVED_INDEX_ONLY" : "UNSAVED_ABSENT";
    entry.required_artifacts = [];
    entry.source_count = 0;
    entry.source_ids = [];
    entry.saved_source_rows = 0;
    entry.root_sources_required_together = false;
    return;
  }

  const desiredParts = Math.max(1, Math.min(templates.length || 1, retained.length));
  const groups = partition(retained, desiredParts);
  const names = desiredParts === 1
    ? [templates.length === 1 ? templates[0].artifact_name : `lossless_root__${root}`]
    : groups.map((_, index) => `lossless_root__${root}__part_${String(index + 1).padStart(3, "0")}`);
  const baseTemplate = templates[0] || { common_root: root };

  groups.forEach((group, index) => {
    const name = names[index];
    const artifact = {
      ...baseTemplate,
      artifact_name: name,
      storage_mode: desiredParts === 1 ? "SINGLE" : "SHARD",
      shard_index: index + 1,
      shard_count: desiredParts,
      previous_shard: index > 0 ? names[index - 1] : null,
      next_shard: index < desiredParts - 1 ? names[index + 1] : null,
      root_virtual_artifact_name: `lossless_root__${root}`,
      root_shard_integrity: {
        required_together: desiredParts > 1,
        physical_storage_only: desiredParts > 1,
        downstream_must_resolve_all_shards: desiredParts > 1,
        source_text_cutting_allowed: false
      },
      sources: group,
      manifest_only_sources: index === 0 ? baseTemplate.manifest_only_sources || [] : [],
      metadata_only_sources: index === 0 ? baseTemplate.metadata_only_sources || [] : [],
      legal_document_sources: index === 0 ? baseTemplate.legal_document_sources || [] : [],
      rejected_sources: index === 0 ? baseTemplate.rejected_sources || [] : [],
      missing_limited_primary_sources: index === 0 ? baseTemplate.missing_limited_primary_sources || [] : [],
      corpus_forensics: {
        ...(baseTemplate.corpus_forensics || {}),
        total_sources: group.length,
        root_total_sources: retained.length
      },
      dedupe_forensics: {
        ...(baseTemplate.dedupe_forensics || {}),
        canonical_sources_saved: retained.length,
        post_extraction_block_dedupe_applied: true
      }
    };
    artifact.artifact_size_estimate_bytes = Buffer.byteLength(JSON.stringify(artifact), "utf8");
    output[name] = artifact;
    savedNames.push(name);
  });

  entry.status = desiredParts === 1 ? "SINGLE" : "SHARDED";
  entry.required_artifacts = names;
  entry.shard_count = names.length;
  entry.source_count = retained.length;
  entry.saved_source_rows = retained.length;
  entry.source_ids = retained.map((source) => source.source_id);
  entry.total_text_bytes = retained.reduce((sum, source) => sum + Buffer.byteLength(String(source.lossless_text || ""), "utf8"), 0);
  entry.artifact_bytes = names.map((name) => ({ artifact_name: name, bytes: Buffer.byteLength(JSON.stringify(output[name]), "utf8") }));
  entry.root_sources_required_together = names.length > 1;
}

function enrichSource(source, row) {
  return {
    ...source,
    entity_id: row.entity_id || source.entity_id || null,
    entity_status: row.entity_status || source.entity_status || null,
    canonical_candidate_id: row.canonical_candidate_id || source.canonical_candidate_id || null,
    canonical_identity: row.canonical_identity || source.canonical_identity || null,
    feature_cluster: row.feature_cluster || source.feature_cluster || row.variant_cluster_id || row.route_type,
    evidence_lane: row.evidence_lane || source.evidence_lane || "unassigned",
    variant_family: row.variant_family || source.variant_family || "none",
    structured_coverage: row.structured_coverage || source.structured_coverage || null,
    secondary_root_references: row.secondary_root_references || source.secondary_root_references || [],
    ai_overlay: row.ai_overlay || source.ai_overlay || null,
    source_disposition: row.source_disposition || source.source_disposition || "SELECTED_CANONICAL",
    canonical_owner_candidate_id: row.canonical_owner_candidate_id || source.canonical_owner_candidate_id || null,
    extraction_scope: row.legal_doc_candidate ? "FULL_DOCUMENT" : row.extraction_scope || source.extraction_scope || "FULL_MAIN_CONTENT"
  };
}

function enrichLegalArtifacts(output, manifestById) {
  const inventory = output.legal_doc_inventory?.documents_found || [];
  for (const doc of inventory) {
    const sourceIndex = output.source_family_index.discovered_source_index.find((row) => row.canonical_url === doc.source_url && row.legal_doc_candidate);
    const manifestRow = manifestById.get(sourceIndex?.manifest_id) || {};
    Object.assign(doc, {
      entity_id: manifestRow.entity_id || sourceIndex?.entity_id || null,
      canonical_candidate_id: manifestRow.canonical_candidate_id || null,
      canonical_identity: manifestRow.canonical_identity || null,
      feature_cluster: manifestRow.feature_cluster || "legal_governance",
      evidence_lane: "legal_instrument",
      secondary_root_references: manifestRow.secondary_root_references || [],
      extraction_scope: "FULL_DOCUMENT"
    });
    const artifact = output[doc.artifact_name];
    if (artifact) Object.assign(artifact, {
      entity_id: doc.entity_id,
      canonical_candidate_id: doc.canonical_candidate_id,
      canonical_identity: doc.canonical_identity,
      feature_cluster: doc.feature_cluster,
      evidence_lane: doc.evidence_lane,
      secondary_root_references: doc.secondary_root_references,
      extraction_scope: "FULL_DOCUMENT"
    });
  }
}

function partition(items, count) {
  const groups = Array.from({ length: count }, () => []);
  items.forEach((item, index) => groups[index % count].push(item));
  return groups.filter((group) => group.length);
}
function withoutLosslessText(row) { const { lossless_text, ...rest } = row; return rest; }
