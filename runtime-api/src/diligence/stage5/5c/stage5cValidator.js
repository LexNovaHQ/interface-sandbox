/* LexNova Runtime — Stage 5C Validator. */

import { asArray, asText, createValidationPass, createValidationFailure, createValidationWarning } from '../shared/stage5SharedIndex.js';

const REQUIRED_TEXT = ['feature_id', 'function_id', 'feature_name', 'feature_role', 'commercial_function', 'business_label_or_product_area', 'feature_description', 'actor_or_user', 'system_action', 'output_or_result'];
const REQUIRED_ARRAY = ['input_data', 'delivery_channels', 'archetype_codes', 'surface_tokens', 'evidence_refs'];

function missingText(row, field) {
  return !asText(row?.[field]) || asText(row?.[field]) === 'UNKNOWN_NOT_EVIDENCED';
}

function missingArray(row, field) {
  return !asArray(row?.[field]).length;
}

export function validateStage5C({ mergedOutput = {}, joinedInput = {}, completenessAnalysis = {} } = {}) {
  const rows = asArray(mergedOutput?.feature_inventory);
  const expected = asArray(joinedInput?.joined_features);
  const blocking_errors = [];
  const warnings = [];
  if (!rows.length) blocking_errors.push({ code: 'NO_FEATURE_INVENTORY_ROWS', message: '5C produced no feature_inventory rows.' });
  if (rows.length !== expected.length) blocking_errors.push({ code: 'FEATURE_ROW_COUNT_MISMATCH', expected: expected.length, actual: rows.length });
  const ids = new Set();
  for (const row of rows) {
    if (ids.has(row.feature_id)) blocking_errors.push({ code: 'DUPLICATE_FEATURE_ID', feature_id: row.feature_id });
    ids.add(row.feature_id);
    for (const field of REQUIRED_TEXT) {
      if (missingText(row, field)) blocking_errors.push({ code: 'MISSING_REQUIRED_TEXT_FIELD', feature_id: row.feature_id, function_id: row.function_id, field });
    }
    for (const field of REQUIRED_ARRAY) {
      if (missingArray(row, field)) blocking_errors.push({ code: 'MISSING_REQUIRED_ARRAY_FIELD', feature_id: row.feature_id, function_id: row.function_id, field });
    }
    if (asArray(row.linked_threat_ids).length) blocking_errors.push({ code: 'STAGE5C_THREAT_ID_LEAK', feature_id: row.feature_id });
    if (!row.core_product_name) warnings.push({ code: 'CORE_PRODUCT_NAME_MISSING', feature_id: row.feature_id, function_id: row.function_id });
    if (row.autonomy_level === 'UNKNOWN_NOT_EVIDENCED') warnings.push({ code: 'AUTONOMY_UNKNOWN_FROM_5B', feature_id: row.feature_id });
  }
  for (const unknown of asArray(mergedOutput?.true_unknowns)) {
    warnings.push({ code: 'TRUE_UNKNOWN_RECORDED', function_id: unknown.function_id, field: unknown.field, reason: unknown.reason || null });
  }
  const metrics = {
    feature_inventory_count: rows.length,
    expected_feature_count: expected.length,
    repair_count: asArray(mergedOutput?.canonicalization_repairs).length,
    true_unknown_count: asArray(mergedOutput?.true_unknowns).length,
    completeness_repair_needed_count: completenessAnalysis?.metrics?.repair_needed_count || 0
  };
  if (blocking_errors.length) return createValidationFailure({ stage: 'stage5', phase: 'STAGE5C_FEATURE_INVENTORY_BUILD', severity: 'BLOCKING', blocking_errors, warnings, metrics, summary: '5C feature inventory validation failed.', next_action: 'Fix 5A/5B inputs or 5C canonicalization.' });
  if (warnings.length) return createValidationWarning({ stage: 'stage5', phase: 'STAGE5C_FEATURE_INVENTORY_BUILD', warnings, metrics, summary: '5C feature inventory passed with warnings.', next_action: 'Proceed to 5D/5E with warnings visible.' });
  return createValidationPass({ stage: 'stage5', phase: 'STAGE5C_FEATURE_INVENTORY_BUILD', metrics, summary: '5C feature inventory passed.', next_action: 'Proceed to 5D.' });
}
