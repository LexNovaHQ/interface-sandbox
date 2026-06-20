/* LexNova Runtime — Stage 5E Vault Candidates Builder. */

import { asArray } from '../shared/stage5SharedIndex.js';

export function buildStage5EVaultCandidates(joined = {}, featureInventory = []) {
  const seed = asArray(joined.stage5d_data_touchpoint_package?.seeds_for_5e?.vault_feature_candidates_seed);
  const baseline = {};
  const archetypes = {};
  const compliance = {};
  for (const feature of asArray(featureInventory)) {
    baseline[feature.feature_id] = { feature_name: feature.feature_name, core_product_area: feature.business_label_or_product_area, questions: [] };
    archetypes[feature.feature_id] = { archetype_codes: feature.archetype_codes, surface_tokens: feature.surface_tokens };
    compliance[feature.feature_id] = { data_questions: [] };
  }
  for (const item of seed) {
    const id = item.feature_id;
    if (!id) continue;
    if (!baseline[id]) baseline[id] = { feature_name: item.feature_name || id, questions: [] };
    baseline[id].questions = asArray(item.questions);
    if (!compliance[id]) compliance[id] = { data_questions: [] };
    compliance[id].data_questions = asArray(item.questions);
  }
  return { baseline, archetypes, compliance };
}
