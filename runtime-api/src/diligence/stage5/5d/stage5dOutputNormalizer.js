/* LexNova Runtime — Stage 5D Output Normalizer. */

import { asArray, asText, normalizeConfidence, uniqueStrings } from '../shared/stage5SharedIndex.js';
import { STAGE5D_CONTROLLED } from './stage5dDeterministicDataSignalBuilder.js';

function controlled(value, allowed, fallback) {
  const text = asText(value).toUpperCase();
  return allowed.includes(text) ? text : fallback;
}

function byFeature(contexts = []) {
  const map = new Map();
  for (const ctx of asArray(contexts)) if (ctx?.feature_id) map.set(ctx.feature_id, ctx);
  return map;
}

export function normalizeStage5DOutput({ rawOutput = {}, featureContext = {}, dataSignalSeed = {} } = {}) {
  const contextByFeature = byFeature(featureContext.feature_contexts);
  const rawRows = asArray(rawOutput?.feature_data_touchpoints);
  const touchpoints = rawRows.map((row, index) => {
    const featureId = asText(row?.feature_id);
    const ctx = contextByFeature.get(featureId) || {};
    return {
      touchpoint_id: asText(row?.touchpoint_id) || `DT${String(index + 1).padStart(3, '0')}`,
      feature_id: featureId || ctx.feature_id || null,
      function_id: asText(row?.function_id || ctx.function_id),
      core_product_name: asText(row?.core_product_name || ctx.core_product_name),
      feature_name: asText(row?.feature_name || ctx.feature_name),
      touchpoint_type: controlled(row?.touchpoint_type, STAGE5D_CONTROLLED.touchpoint_type, 'UNKNOWN'),
      data_category: controlled(row?.data_category, STAGE5D_CONTROLLED.data_category, 'UNKNOWN'),
      data_subject: controlled(row?.data_subject, STAGE5D_CONTROLLED.data_subject, 'UNKNOWN'),
      data_origin: controlled(row?.data_origin, STAGE5D_CONTROLLED.data_origin, 'UNKNOWN'),
      data_direction: controlled(row?.data_direction, STAGE5D_CONTROLLED.data_direction, 'UNKNOWN'),
      processing_action: asText(row?.processing_action || ctx.mechanics?.system_action),
      input_data: uniqueStrings(asArray(row?.input_data || ctx.mechanics?.input_data)),
      output_data: uniqueStrings(asArray(row?.output_data || (ctx.mechanics?.output_or_result ? [ctx.mechanics.output_or_result] : []))),
      storage_signal: asText(row?.storage_signal || 'NOT_EVIDENCED'),
      retention_signal: asText(row?.retention_signal || 'NOT_EVIDENCED'),
      training_or_finetuning_signal: asText(row?.training_or_finetuning_signal || 'NOT_EVIDENCED'),
      sharing_or_subprocessor_signal: asText(row?.sharing_or_subprocessor_signal || 'NOT_EVIDENCED'),
      logging_or_telemetry_signal: asText(row?.logging_or_telemetry_signal || 'NOT_EVIDENCED'),
      explicitness_level: controlled(row?.explicitness_level, STAGE5D_CONTROLLED.explicitness_level, 'NOT_EVIDENCED'),
      evidence_refs: uniqueStrings(asArray(row?.evidence_refs).filter((ref) => asArray(ctx.evidence_refs).includes(ref))),
      lossless_source_index_refs: uniqueStrings(asArray(row?.lossless_source_index_refs).filter((ref) => asArray(ctx.lossless_source_index_refs).includes(ref))),
      confidence: normalizeConfidence(row?.confidence) || 'LOW',
      unknown_reason: row?.unknown_reason || null
    };
  });

  return {
    stage5d_version: 'stage5d_feature_data_touchpoints_v1',
    target_profile_ref: featureContext?.target_profile_ref || null,
    feature_data_touchpoints: touchpoints,
    feature_level_unknowns: asArray(rawOutput?.feature_level_unknowns),
    data_signal_ledger: asArray(dataSignalSeed?.feature_signal_seeds),
    limitations: asArray(rawOutput?.limitations)
  };
}
