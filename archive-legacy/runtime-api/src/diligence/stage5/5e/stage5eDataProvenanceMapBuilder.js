/* LexNova Runtime — Stage 5E Data Provenance Map Builder. */

import { asArray } from '../shared/stage5SharedIndex.js';
import { mapDataCategory, mapDataOrigin, mapDataSubject, refs, sourceUrl, toConfidence } from './stage5eSchemaMappers.js';

export function buildStage5EDataProvenanceMap(joined = {}) {
  const seed = asArray(joined.stage5d_data_touchpoint_package?.seeds_for_5e?.data_provenance_map_seed);
  return seed.map((row, index) => ({
    provenance_id: `DP${String(index + 1).padStart(3, '0')}`,
    feature_id: row.feature_id || 'unknown_feature',
    data_origin: mapDataOrigin(row.data_origin),
    data_subject: mapDataSubject(row.data_subject),
    data_category: mapDataCategory(row.data_category),
    processing_context: row.processing_action || 'Feature-level data processing context not fully evidenced.',
    storage_or_retention_signal: row.storage_or_retention_signal || row.storage_signal || 'NOT_EVIDENCED',
    training_or_finetuning_signal: row.training_or_finetuning_signal || 'NOT_EVIDENCED',
    source_url: sourceUrl(row.source_url),
    evidence_refs: refs(row.evidence_refs, row.lossless_source_index_refs),
    confidence: toConfidence(row.confidence)
  }));
}
