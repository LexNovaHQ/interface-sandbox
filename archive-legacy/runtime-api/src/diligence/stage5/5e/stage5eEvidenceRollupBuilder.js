/* LexNova Runtime — Stage 5E Evidence Rollup Builder. */

import { asArray, uniqueStrings } from '../shared/stage5SharedIndex.js';
import { refs, toConfidence } from './stage5eSchemaMappers.js';

export function buildStage5EEvidenceRollup(joined = {}, profileParts = {}) {
  const field_evidence_refs = [];
  const add = (field_path, evidence_refs, basis, confidence = 'medium') => {
    field_evidence_refs.push({ field_path, evidence_refs: refs(evidence_refs), basis, confidence: toConfidence(confidence) });
  };
  for (const feature of asArray(profileParts.feature_inventory)) add(`feature_inventory.${feature.feature_id}`, feature.evidence_refs, 'Feature row assembled from Stage 5A/5B/5C/5D packages.', feature.confidence);
  for (const row of asArray(profileParts.data_provenance_map)) add(`data_provenance_map.${row.provenance_id}`, row.evidence_refs, 'Data provenance row assembled from Stage 5D touchpoint seed.', row.confidence);
  for (const row of asArray(profileParts.regulated_surface_map)) add(`regulated_surface_map.${row.surface_id}`, row.evidence_refs, 'Surface row assembled from Stage 5B tags and 5D data context.', row.confidence);
  const unresolved_questions = uniqueStrings([
    ...asArray(joined.stage5a_feature_package?.limitations),
    ...asArray(joined.stage5b_tag_package?.tagging_failures).map((x) => x.reason || x.message || '5B tagging failure'),
    ...asArray(joined.stage5c_feature_inventory_package?.true_unknowns).map((x) => x.reason || x.field || '5C true unknown'),
    ...asArray(joined.stage5d_data_touchpoint_package?.feature_level_unknowns).map((x) => x.reason || x.field || '5D feature-level unknown')
  ]);
  return { field_evidence_refs, unresolved_questions };
}
