/* LexNova Runtime — Stage 5C Input Joiner. */

import { asArray, asPlainObject, asText } from '../shared/stage5SharedIndex.js';

function byFunctionId(rows = []) {
  const map = new Map();
  for (const row of asArray(rows)) {
    const id = asText(row?.function_id);
    if (id && !map.has(id)) map.set(id, row);
  }
  return map;
}

export function buildStage5CInputJoin({ stage5aFeaturePackage = {}, stage5aMapping = {}, stage5bTagPackage = {}, stage5bTagging = {} } = {}) {
  const features = asArray(stage5aFeaturePackage?.features_for_5b);
  const tagRows = asArray(stage5bTagPackage?.feature_tags_for_5c).length
    ? asArray(stage5bTagPackage?.feature_tags_for_5c)
    : asArray(stage5bTagging?.feature_tags);
  const tagById = byFunctionId(tagRows);
  const mappingById = byFunctionId(stage5aMapping?.product_function_map);
  const joined_features = features.map((feature, index) => {
    const functionId = asText(feature?.function_id) || `PF${String(index + 1).padStart(3, '0')}`;
    return {
      join_id: `S5C_JOIN_${String(index + 1).padStart(3, '0')}`,
      function_id: functionId,
      feature_5a: feature,
      mapping_5a: mappingById.get(functionId) || {},
      tag_5b: tagById.get(functionId) || {},
      has_5b_tag: tagById.has(functionId)
    };
  });
  return {
    stage5c_input_join_version: 'stage5c_input_join_v1',
    target_profile_ref: stage5aFeaturePackage?.target_profile_ref || stage5bTagPackage?.target_profile_ref || null,
    joined_features,
    source_context: {
      core_products: asArray(stage5aFeaturePackage?.core_products),
      lossless_source_index: asArray(stage5aFeaturePackage?.lossless_source_index),
      source_coverage: asArray(stage5aFeaturePackage?.source_coverage)
    },
    upstream_validation: {
      stage5a: asPlainObject(stage5aFeaturePackage?.validation_result),
      stage5b: asPlainObject(stage5bTagPackage?.validation_result)
    },
    metrics: {
      feature_count_5a: features.length,
      tag_count_5b: tagRows.length,
      joined_count: joined_features.length,
      missing_tag_count: joined_features.filter((row) => !row.has_5b_tag).length
    }
  };
}
