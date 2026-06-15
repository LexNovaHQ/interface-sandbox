/* LexNova Runtime — Stage 5E Classification Quality Builder. */

import { asArray } from '../shared/stage5SharedIndex.js';

export function buildStage5EClassificationQuality(joined = {}, validationSeed = {}) {
  const blockers = [joined.stage5a_validation, joined.stage5b_validation, joined.stage5c_validation, joined.stage5d_validation, validationSeed].filter((v) => v?.ok === false);
  const unresolvedCount = asArray(joined.stage5c_feature_inventory_package?.unresolved_feature_candidates_seed).length + asArray(joined.stage5b_tag_package?.tagging_failures).length + asArray(joined.stage5d_data_touchpoint_package?.feature_level_unknowns).length;
  return {
    quality_version: 'stage5e_quality_v1',
    status: blockers.length ? 'DEGRADED' : unresolvedCount ? 'DEGRADED' : 'PASS',
    reinvestigation_required: blockers.length > 0,
    reinvestigation_attempted: false,
    reinvestigation_pass_count: 0,
    unresolved_feature_count: unresolvedCount,
    fallback_routing_required: blockers.length > 0
  };
}
