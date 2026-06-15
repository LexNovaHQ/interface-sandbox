/* LexNova Runtime — Stage 5D Validator. */

import { asArray } from '../shared/stage5SharedIndex.js';
import { STAGE5D_CONTROLLED } from './stage5dDeterministicDataSignalBuilder.js';

function hasForbiddenKeys(obj = {}) {
  return ['threat_ids','linked_threat_ids','legal_conclusions','privacy_conclusions','data_provenance_map','regulated_surface_map','target_feature_profile'].some((key) => Object.prototype.hasOwnProperty.call(obj, key));
}

export function validateStage5D({ normalizedOutput = {}, featureContext = {} } = {}) {
  const contexts = asArray(featureContext?.feature_contexts);
  const featureIds = new Set(contexts.map((ctx) => ctx.feature_id).filter(Boolean));
  const rows = asArray(normalizedOutput?.feature_data_touchpoints);
  const blocking_errors = [];
  const warnings = [];

  if (contexts.length && !rows.length) blocking_errors.push({ code: 'NO_TOUCHPOINTS', message: '5D produced no feature data touchpoints.' });

  for (const row of rows) {
    if (!row.feature_id || !featureIds.has(row.feature_id)) blocking_errors.push({ code: 'UNKNOWN_FEATURE_ID', feature_id: row.feature_id, message: 'Touchpoint does not map to a 5C feature.' });
    if (!STAGE5D_CONTROLLED.touchpoint_type.includes(row.touchpoint_type)) blocking_errors.push({ code: 'BAD_TOUCHPOINT_TYPE', feature_id: row.feature_id, value: row.touchpoint_type });
    if (!STAGE5D_CONTROLLED.data_category.includes(row.data_category)) blocking_errors.push({ code: 'BAD_DATA_CATEGORY', feature_id: row.feature_id, value: row.data_category });
    if (!STAGE5D_CONTROLLED.data_subject.includes(row.data_subject)) blocking_errors.push({ code: 'BAD_DATA_SUBJECT', feature_id: row.feature_id, value: row.data_subject });
    if (!STAGE5D_CONTROLLED.data_origin.includes(row.data_origin)) blocking_errors.push({ code: 'BAD_DATA_ORIGIN', feature_id: row.feature_id, value: row.data_origin });
    if (!STAGE5D_CONTROLLED.data_direction.includes(row.data_direction)) blocking_errors.push({ code: 'BAD_DATA_DIRECTION', feature_id: row.feature_id, value: row.data_direction });
    if (!STAGE5D_CONTROLLED.explicitness_level.includes(row.explicitness_level)) blocking_errors.push({ code: 'BAD_EXPLICITNESS_LEVEL', feature_id: row.feature_id, value: row.explicitness_level });
    if (hasForbiddenKeys(row)) blocking_errors.push({ code: 'FORBIDDEN_STAGE5D_FIELD', feature_id: row.feature_id, message: '5D output attempted to include forbidden profile/legal/threat fields.' });
    if (!asArray(row.evidence_refs).length && !asArray(row.lossless_source_index_refs).length) warnings.push({ code: 'NO_REFS_ON_TOUCHPOINT', feature_id: row.feature_id, touchpoint_id: row.touchpoint_id });
    if (row.data_category === 'UNKNOWN') warnings.push({ code: 'UNKNOWN_DATA_CATEGORY', feature_id: row.feature_id, touchpoint_id: row.touchpoint_id });
  }

  const touchedFeatureIds = new Set(rows.map((row) => row.feature_id).filter(Boolean));
  for (const ctx of contexts) {
    if (!touchedFeatureIds.has(ctx.feature_id)) warnings.push({ code: 'FEATURE_WITHOUT_TOUCHPOINT', feature_id: ctx.feature_id, message: 'No touchpoint row was emitted for this 5C feature.' });
  }

  return {
    ok: blocking_errors.length === 0,
    stage: 'stage5',
    phase: 'STAGE5D_FEATURE_DATA_TOUCHPOINT_EXTRACTION',
    severity: blocking_errors.length ? 'BLOCKING' : warnings.length ? 'WARNING' : 'PASS',
    blocking_errors,
    repairable_errors: [],
    warnings,
    metrics: {
      feature_context_count: contexts.length,
      touchpoint_count: rows.length,
      unknown_category_count: rows.filter((row) => row.data_category === 'UNKNOWN').length,
      not_evidenced_count: rows.filter((row) => [row.storage_signal,row.retention_signal,row.training_or_finetuning_signal,row.sharing_or_subprocessor_signal,row.logging_or_telemetry_signal].includes('NOT_EVIDENCED')).length
    },
    summary: blocking_errors.length ? '5D validation failed.' : '5D validation passed.',
    next_action: blocking_errors.length ? 'repair_stage5d_output' : 'continue_to_5e'
  };
}
