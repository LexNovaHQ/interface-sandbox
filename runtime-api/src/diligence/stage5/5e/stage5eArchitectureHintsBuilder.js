/* LexNova Runtime — Stage 5E Architecture Hints Builder. */

import { asArray } from '../shared/stage5SharedIndex.js';
import { refs, sourceUrl } from './stage5eSchemaMappers.js';

function hintType(value) {
  const raw = String(value || '').toLowerCase();
  if (/integration|transfer|share/.test(raw)) return 'integration';
  if (/storage|stored/.test(raw)) return 'memory';
  if (/log|telemetry/.test(raw)) return 'unknown';
  return 'unknown';
}

export function buildStage5EArchitectureHints(joined = {}) {
  const seed = asArray(joined.stage5d_data_touchpoint_package?.seeds_for_5e?.architecture_hints_seed);
  return seed.map((row, index) => ({
    hint_id: `AH${String(index + 1).padStart(3, '0')}`,
    feature_id: row.feature_id || 'unknown_feature',
    hint_type: hintType(row.hint_type || row.data_direction),
    hint_value: row.hint_type || row.data_direction || 'Feature architecture hint requires confirmation.',
    disposition: 'confirmation_only',
    source_url: sourceUrl(row.source_url),
    evidence_refs: refs(row.evidence_refs, row.lossless_source_index_refs),
    confidence: 'medium'
  }));
}
