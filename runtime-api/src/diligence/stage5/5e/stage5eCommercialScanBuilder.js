/* LexNova Runtime — Stage 5E Commercial Scan Builder. */

import { asArray, asText, uniqueStrings } from '../shared/stage5SharedIndex.js';
import { refs, sourceUrl } from './stage5eSchemaMappers.js';

export function buildStage5ECommercialScan(joined = {}, featureInventory = []) {
  const mapping = joined.stage5a_product_function_mapping || {};
  const outcomes = uniqueStrings([
    ...asArray(mapping.commercial_outcome_candidates).map((x) => asText(x?.outcome || x?.candidate_text || x)).filter(Boolean),
    ...asArray(featureInventory).map((f) => asText(f.commercial_function)).filter(Boolean)
  ]);
  const coverageSeed = asArray(joined.source_coverage_seed);
  const sourceCoverage = coverageSeed.slice(0, 50).map((src, index) => ({
    source_id: asText(src.evidence_source_id || src.source_id || `SRC${String(index + 1).padStart(3, '0')}`),
    source_url: sourceUrl(src.url || src.final_url || src.source_url),
    source_family: asText(src.source_family || src.source_bucket || 'product_family'),
    coverage_status: 'supporting',
    mapped_feature_ids: asArray(featureInventory).map((f) => f.feature_id),
    unmapped_reason: '',
    evidence_refs: refs(src.evidence_refs, [src.evidence_source_id || src.source_id || `SRC${String(index + 1).padStart(3, '0')}`])
  }));
  return {
    distinct_commercial_outcomes_seen: outcomes,
    mapped_core_feature_ids: asArray(featureInventory).map((f) => f.feature_id),
    source_coverage: sourceCoverage,
    unmapped_outcomes_due_to_insufficient_detail: asArray(mapping.visible_but_unmapped_candidates).map((x) => asText(x?.candidate_text || x)).filter(Boolean),
    completeness_status: featureInventory.length ? 'PARTIAL' : 'THIN',
    completeness_warnings: featureInventory.length ? [] : ['No final feature inventory rows were available for commercial scan mapping.']
  };
}
