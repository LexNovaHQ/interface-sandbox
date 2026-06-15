/* LexNova Runtime — Stage 5E Regulated Surface Map Builder. */

import { asArray, uniqueStrings } from '../shared/stage5SharedIndex.js';
import { refs, toConfidence } from './stage5eSchemaMappers.js';

export function buildStage5ERegulatedSurfaceMap(joined = {}, featureInventory = []) {
  const rows = [];
  for (const feature of asArray(featureInventory)) {
    for (const token of uniqueStrings(asArray(feature.surface_tokens))) {
      rows.push({
        surface_id: `RS${String(rows.length + 1).padStart(3, '0')}`,
        feature_id: feature.feature_id,
        surface_token: token,
        int_ext_classification: feature.delivery_channels?.api === 'true' || feature.delivery_channels?.web === 'true' ? 'external' : 'unknown',
        basis: `Surface token inherited from Stage 5B for ${feature.feature_name}.`,
        confidence: toConfidence(feature.confidence),
        evidence_refs: refs(feature.evidence_refs)
      });
    }
  }
  const seed = asArray(joined.stage5d_data_touchpoint_package?.seeds_for_5e?.regulated_surface_map_seed);
  for (const row of seed) {
    rows.push({
      surface_id: `RS${String(rows.length + 1).padStart(3, '0')}`,
      feature_id: row.feature_id || 'unknown_feature',
      surface_token: row.data_category || 'data_context',
      int_ext_classification: 'unknown',
      basis: row.basis || 'Data-context surface seed from Stage 5D.',
      confidence: 'medium',
      evidence_refs: refs(row.evidence_refs, row.lossless_source_index_refs)
    });
  }
  return rows;
}
