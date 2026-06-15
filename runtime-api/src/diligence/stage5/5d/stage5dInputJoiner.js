/* LexNova Runtime — Stage 5D Input Joiner. Feature-level only. */

import { asArray, asPlainObject, asText } from '../shared/stage5SharedIndex.js';

function by(items, key) {
  const map = new Map();
  for (const item of asArray(items)) {
    const value = asText(item?.[key]);
    if (value && !map.has(value)) map.set(value, item);
  }
  return map;
}

export function buildStage5DInputJoin({ stage5aFeaturePackage = {}, stage5bTagPackage = {}, stage5cFeatureInventoryPackage = {} } = {}) {
  const featureInventory = asArray(stage5cFeatureInventoryPackage?.feature_inventory);
  const byFunction5a = by(stage5aFeaturePackage?.features_for_5b, 'function_id');
  const byFunction5b = by(stage5bTagPackage?.feature_tags_for_5c, 'function_id');
  const featureIdMap = asArray(stage5cFeatureInventoryPackage?.feature_id_map);
  const joined_features = featureInventory.map((featureRow) => {
    const functionId = asText(featureRow?.function_id);
    const source5a = byFunction5a.get(functionId) || {};
    const tag5b = byFunction5b.get(functionId) || {};
    return {
      feature_id: asText(featureRow?.feature_id),
      function_id: functionId,
      core_product_name: asText(featureRow?.core_product_name || source5a?.core_product_name),
      feature_name: asText(featureRow?.feature_name || source5a?.function_name),
      feature_5c: featureRow,
      feature_5a: source5a,
      tag_5b: tag5b,
      has_5a_feature: Boolean(source5a?.function_id),
      has_5b_tag: Boolean(tag5b?.function_id)
    };
  });
  return {
    stage5d_input_join_version: 'stage5d_input_join_v1',
    target_profile_ref: stage5cFeatureInventoryPackage?.target_profile_ref || stage5aFeaturePackage?.target_profile_ref || stage5bTagPackage?.target_profile_ref || null,
    joined_features,
    feature_id_map: featureIdMap,
    lossless_source_index: asArray(stage5aFeaturePackage?.lossless_source_index),
    classification_quality_seed: asPlainObject(stage5cFeatureInventoryPackage?.classification_quality_seed),
    metrics: {
      feature_inventory_count: featureInventory.length,
      joined_count: joined_features.length,
      missing_5a_count: joined_features.filter((row) => !row.has_5a_feature).length,
      missing_5b_count: joined_features.filter((row) => !row.has_5b_tag).length
    }
  };
}
