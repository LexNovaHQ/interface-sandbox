/* LexNova Runtime — Stage 5C Feature Inventory Package Builder. */

import { asArray, asPlainObject } from '../shared/stage5SharedIndex.js';

export function buildStage5CFeatureInventoryPackage({ joinedInput = {}, canonicalDraft = {}, completenessAnalysis = {}, mergedOutput = {}, validationResult = {} } = {}) {
  const featureInventory = asArray(mergedOutput?.feature_inventory);
  const unresolved = asArray(validationResult?.blocking_errors).map((error, index) => ({
    unresolved_id: `S5C_UNRESOLVED_${String(index + 1).padStart(3, '0')}`,
    function_id: error.function_id || null,
    feature_id: error.feature_id || null,
    reason_code: error.code,
    reason: error.message || error.field || '5C validation blocker'
  }));
  return {
    stage5c_feature_inventory_package_version: 'stage5c_feature_inventory_package_v1',
    target_profile_ref: joinedInput?.target_profile_ref || canonicalDraft?.target_profile_ref || null,
    feature_inventory: featureInventory,
    feature_id_map: asArray(canonicalDraft?.feature_id_map),
    feature_inventory_build_log: asArray(joinedInput?.joined_features).map((row, index) => ({
      function_id: row.function_id,
      feature_id: canonicalDraft?.feature_id_map?.[index]?.feature_id || null,
      has_5b_tag: row.has_5b_tag === true,
      build_status: featureInventory[index] ? 'BUILT' : 'NOT_BUILT'
    })),
    canonicalization_repairs: asArray(mergedOutput?.canonicalization_repairs),
    true_unknowns: asArray(mergedOutput?.true_unknowns),
    unresolved_feature_candidates_seed: unresolved,
    classification_quality_seed: {
      status: validationResult?.ok === true ? 'PASS' : 'DEGRADED_OR_BLOCKED',
      severity: validationResult?.severity || null,
      metrics: asPlainObject(validationResult?.metrics),
      completeness_metrics: asPlainObject(completenessAnalysis?.metrics)
    },
    limitations: asArray(mergedOutput?.limitations),
    handoff_integrity: {
      consumes: ['stage5a_feature_package', 'stage5b_tag_package'],
      produces: ['stage5c_feature_inventory_package'],
      feature_count_in: joinedInput?.metrics?.joined_count || 0,
      feature_count_out: featureInventory.length,
      validation_ok: validationResult?.ok === true
    }
  };
}
