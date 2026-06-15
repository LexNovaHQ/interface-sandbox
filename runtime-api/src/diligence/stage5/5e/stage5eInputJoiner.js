/* LexNova Runtime — Stage 5E Input Joiner. Final profile assembly only. */

import { asArray, asPlainObject } from '../shared/stage5SharedIndex.js';

export function buildStage5EInputJoin({ adapterResult = {}, companyProfile = {} } = {}) {
  const input = adapterResult.target_feature_profile_input || {};
  const stage5a = adapterResult.stage5a_batch2 || input.stage5a_batch2 || {};
  const stage5b = adapterResult.stage5b_batch3 || input.stage5b_batch3 || {};
  const stage5c = adapterResult.stage5c_batch4 || input.stage5c_batch4 || {};
  const stage5d = adapterResult.stage5d_batch5 || input.stage5d_batch5 || {};
  return {
    stage5e_input_join_version: 'stage5e_input_join_v1',
    company_profile: asPlainObject(companyProfile),
    target_profile_ref_seed: input.target_profile_ref || null,
    adapter_metrics: {
      deterministic_cluster_count: asArray(adapterResult.stage5_candidate_clusters).length,
      deterministic_candidate_count: adapterResult.target_feature_candidate_index?.candidate_count || 0,
      product_family_source_count: asArray(adapterResult.product_family_discovery_sources).length
    },
    stage5a_product_function_mapping: stage5a.stage5a_product_function_mapping || {},
    stage5a_feature_package: stage5a.stage5a_feature_package || {},
    stage5a_validation: stage5a.stage5a_validation || {},
    stage5b_tag_package: stage5b.stage5b_tag_package || {},
    stage5b_validation: stage5b.stage5b_validation || {},
    stage5c_feature_inventory_package: stage5c.stage5c_feature_inventory_package || {},
    stage5c_validation: stage5c.stage5c_validation || {},
    stage5d_data_touchpoint_package: stage5d.stage5d_data_touchpoint_package || {},
    stage5d_validation: stage5d.stage5d_validation || {},
    source_coverage_seed: asArray(adapterResult.product_family_discovery_sources || input.product_family_sources),
    limitations_seed: asArray(input.limitations)
  };
}
