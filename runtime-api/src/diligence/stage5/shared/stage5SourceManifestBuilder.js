/*
 * LexNova Runtime — Stage 5 Source Candidate Manifest Builder
 * High-recall manifest only. No final feature truth. No model calls.
 */

import { asArray, asPlainObject, asText, normalizeEvidenceRefs, normalizeSourceRefs, uniqueStrings } from './stage5SharedTypes.js';

export const STAGE5_CANDIDATE_SIGNAL_BUCKETS = Object.freeze([
  'PRODUCT_AREA',
  'ATOMIC_FEATURE_CANDIDATE',
  'DELIVERY_CHANNEL_SIGNAL',
  'DATA_SIGNAL',
  'ARCHITECTURE_SIGNAL',
  'COMMERCIAL_OUTCOME_SIGNAL',
  'LEGAL_CONTROL_SIGNAL',
  'DUPLICATE_OR_ALIAS',
  'INSUFFICIENT_FEATURE_EVIDENCE'
]);

export function buildStage5SourceCandidateManifest(context = {}) {
  const targetProfileRef = context.target_profile_ref || context.targetProfileRef || context.target_profile?.target_profile_ref || null;
  const sources = collectSources(context);
  const sourceInventory = sources.map((source, index) => normalizeSource(source, index));
  const candidateSignals = buildCandidateSignals(context, sourceInventory);
  return {
    manifest_version: 'stage5_source_candidate_manifest_v1',
    target_profile_ref: targetProfileRef,
    source_inventory: sourceInventory,
    candidate_clusters: buildCandidateClusters(candidateSignals),
    candidate_signals: candidateSignals,
    source_family_summary: summarizeSourceFamilies(sourceInventory),
    source_coverage_seed: sourceInventory.map((source) => ({ source_id: source.source_id, source_url: source.source_url, family: source.family, coverage_status: 'PENDING_5A' })),
    evidence_ref_index: buildEvidenceRefIndex(sourceInventory),
    limitations: sourceInventory.length ? [] : ['No Stage 5 sources were available to build the source candidate manifest.']
  };
}

export function validateStage5SourceCandidateManifest(manifest = {}) {
  const errors = [];
  if (manifest.manifest_version !== 'stage5_source_candidate_manifest_v1') errors.push('invalid manifest_version');
  if (!Array.isArray(manifest.source_inventory)) errors.push('source_inventory must be an array');
  if (!Array.isArray(manifest.candidate_signals)) errors.push('candidate_signals must be an array');
  const invalidBuckets = asArray(manifest.candidate_signals).filter((row) => !STAGE5_CANDIDATE_SIGNAL_BUCKETS.includes(row.signal_bucket));
  if (invalidBuckets.length) errors.push(`invalid candidate signal buckets: ${invalidBuckets.length}`);
  return { ok: errors.length === 0, errors };
}

export function summarizeStage5SourceCandidateManifest(manifest = {}) {
  const sourceInventory = asArray(manifest.source_inventory);
  const candidateSignals = asArray(manifest.candidate_signals);
  return {
    manifest_version: manifest.manifest_version || null,
    source_count: sourceInventory.length,
    candidate_signal_count: candidateSignals.length,
    candidate_cluster_count: asArray(manifest.candidate_clusters).length,
    source_families: manifest.source_family_summary || {}
  };
}

function collectSources(context = {}) {
  const candidates = [
    context.stage5_source_package?.source_inventory,
    context.stage5_source_package?.sources,
    context.source_inventory,
    context.sources,
    context.source_bundle?.evidence_buffer,
    context.target_feature_profile_input?.source_bundle?.evidence_buffer,
    context.target_feature_profile_input?.product_family_primary_sources,
    context.target_feature_profile_input?.product_family_secondary_sources,
    context.target_feature_profile_input?.product_family_supporting_sources
  ];
  return candidates.flatMap((entry) => asArray(entry)).filter((entry) => entry && typeof entry === 'object');
}

function normalizeSource(source, index) {
  const obj = asPlainObject(source);
  const sourceId = asText(obj.source_id || obj.evidence_source_id || obj.id) || `S5SRC_${String(index + 1).padStart(3, '0')}`;
  const url = asText(obj.url || obj.source_url || obj.href || obj.canonical_url);
  const title = asText(obj.title || obj.source_title || obj.label);
  const family = classifySourceFamily(obj, url, title);
  return {
    source_id: sourceId,
    source_url: url,
    title,
    family,
    source_role: asText(obj.source_role || obj.role),
    evidence_refs: normalizeEvidenceRefs(obj.evidence_refs || obj.field_evidence_refs || obj.refs),
    source_refs: normalizeSourceRefs([sourceId]),
    raw: obj
  };
}

function classifySourceFamily(source, url, title) {
  const haystack = `${url} ${title} ${source.family || ''} ${source.source_family || ''}`.toLowerCase();
  if (/privacy|terms|legal|dpa|security|trust/.test(haystack)) return 'legal_governance';
  if (/docs|api|developer|reference|sdk/.test(haystack)) return 'docs_developer';
  if (/pricing|plans|enterprise|commercial|customers/.test(haystack)) return 'commercial';
  if (/product|platform|features|solutions|models|studio/.test(haystack)) return 'product';
  return asText(source.family || source.source_family) || 'unknown';
}

function buildCandidateSignals(context, sourceInventory) {
  const signals = [];
  const indexedCandidates = asArray(context.target_feature_candidate_index?.candidates || context.target_feature_profile_input?.target_feature_candidate_index?.candidates);
  indexedCandidates.forEach((candidate, index) => {
    signals.push({
      signal_id: `S5SIG_${String(index + 1).padStart(3, '0')}`,
      signal_bucket: 'ATOMIC_FEATURE_CANDIDATE',
      candidate_id: asText(candidate.candidate_id) || null,
      label: asText(candidate.candidate_label || candidate.label || candidate.name),
      source_refs: normalizeSourceRefs(candidate.source_refs || candidate.evidence_source_ids),
      evidence_refs: normalizeEvidenceRefs(candidate.evidence_refs),
      raw: candidate
    });
  });
  if (!signals.length) {
    sourceInventory.forEach((source, index) => {
      if (source.family === 'product' || source.family === 'docs_developer') {
        signals.push({
          signal_id: `S5SIG_${String(index + 1).padStart(3, '0')}`,
          signal_bucket: source.family === 'docs_developer' ? 'DELIVERY_CHANNEL_SIGNAL' : 'PRODUCT_AREA',
          label: source.title || source.source_url || source.source_id,
          source_refs: [source.source_id],
          evidence_refs: source.evidence_refs,
          raw: { source_id: source.source_id }
        });
      }
    });
  }
  return signals;
}

function buildCandidateClusters(candidateSignals) {
  const byLabel = new Map();
  for (const signal of candidateSignals) {
    const key = asText(signal.label).toLowerCase() || signal.signal_bucket;
    const existing = byLabel.get(key) || { cluster_id: `S5CL_${String(byLabel.size + 1).padStart(3, '0')}`, label: signal.label, signal_ids: [], buckets: [] };
    existing.signal_ids.push(signal.signal_id);
    existing.buckets = uniqueStrings([...existing.buckets, signal.signal_bucket]);
    byLabel.set(key, existing);
  }
  return [...byLabel.values()];
}

function summarizeSourceFamilies(sourceInventory) {
  return sourceInventory.reduce((acc, source) => {
    acc[source.family] = (acc[source.family] || 0) + 1;
    return acc;
  }, {});
}

function buildEvidenceRefIndex(sourceInventory) {
  return sourceInventory.flatMap((source) => source.evidence_refs.map((ref) => ({ evidence_ref: ref, source_id: source.source_id, source_url: source.source_url })));
}
