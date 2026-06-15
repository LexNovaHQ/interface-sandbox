/* LexNova Runtime — Stage 5D Data Touchpoint Package Builder. */

import { asArray, uniqueStrings } from '../shared/stage5SharedIndex.js';

function groupByFeature(rows) {
  const map = new Map();
  for (const row of asArray(rows)) {
    if (!row.feature_id) continue;
    if (!map.has(row.feature_id)) map.set(row.feature_id, []);
    map.get(row.feature_id).push(row);
  }
  return map;
}

export function buildStage5DDataTouchpointPackage({ featureContext = {}, dataSignalSeed = {}, normalizedOutput = {}, validationResult = {}, extractorResult = {} } = {}) {
  const rows = asArray(normalizedOutput?.feature_data_touchpoints);
  const byFeature = groupByFeature(rows);
  const summaries = asArray(featureContext?.feature_contexts).map((ctx) => {
    const featureRows = byFeature.get(ctx.feature_id) || [];
    return {
      feature_id: ctx.feature_id,
      function_id: ctx.function_id,
      core_product_name: ctx.core_product_name,
      feature_name: ctx.feature_name,
      touchpoint_count: featureRows.length,
      data_categories: uniqueStrings(featureRows.map((row) => row.data_category)),
      lifecycle_not_evidenced_count: featureRows.filter((row) => row.storage_signal === 'NOT_EVIDENCED' || row.retention_signal === 'NOT_EVIDENCED' || row.training_or_finetuning_signal === 'NOT_EVIDENCED' || row.sharing_or_subprocessor_signal === 'NOT_EVIDENCED').length
    };
  });

  const data_provenance_map_seed = rows.map((row) => ({
    feature_id: row.feature_id,
    function_id: row.function_id,
    data_category: row.data_category,
    data_subject: row.data_subject,
    data_origin: row.data_origin,
    data_direction: row.data_direction,
    processing_action: row.processing_action,
    explicitness_level: row.explicitness_level,
    evidence_refs: row.evidence_refs,
    lossless_source_index_refs: row.lossless_source_index_refs
  }));

  const regulated_surface_map_seed = rows
    .filter((row) => ['PAYMENT_OR_FINANCIAL','HEALTH_OR_MEDICAL','EMPLOYMENT_OR_HR','BIOMETRIC_OR_SENSITIVE','MINOR_DATA','LOCATION_DATA'].includes(row.data_category))
    .map((row) => ({ feature_id: row.feature_id, data_category: row.data_category, basis: row.explicitness_level, evidence_refs: row.evidence_refs, lossless_source_index_refs: row.lossless_source_index_refs }));

  const architecture_hints_seed = rows
    .filter((row) => ['INTEGRATION_OR_TRANSFER','SHARING_SIGNAL','LOGGING_OR_TELEMETRY_SIGNAL','STORAGE_SIGNAL'].includes(row.touchpoint_type) || row.data_direction === 'SHARED_WITH_THIRD_PARTY' || row.data_direction === 'STORED_BY_SYSTEM')
    .map((row) => ({ feature_id: row.feature_id, hint_type: row.touchpoint_type, data_direction: row.data_direction, evidence_refs: row.evidence_refs, lossless_source_index_refs: row.lossless_source_index_refs }));

  const vault_feature_candidates_seed = summaries.map((summary) => ({
    feature_id: summary.feature_id,
    feature_name: summary.feature_name,
    questions: [
      'Do you store this feature input or output?',
      'Do you retain feature logs or transcripts?',
      'Is customer content used for model training or fine-tuning?',
      'Which subprocessors or integrations process this feature?',
      'Is human review used for this feature?'
    ]
  }));

  return {
    stage5d_data_touchpoint_package_version: 'stage5d_data_touchpoint_package_v1',
    target_profile_ref: featureContext?.target_profile_ref || null,
    feature_data_touchpoints: rows,
    feature_data_summary: summaries,
    data_signal_ledger: asArray(dataSignalSeed?.feature_signal_seeds),
    feature_level_unknowns: asArray(normalizedOutput?.feature_level_unknowns),
    data_touchpoint_repairs: [],
    data_touchpoint_validation: validationResult,
    seeds_for_5e: {
      data_provenance_map_seed,
      regulated_surface_map_seed,
      architecture_hints_seed,
      vault_feature_candidates_seed
    },
    run_metadata: extractorResult?.run_metadata || extractorResult?.model_metadata || {},
    limitations: asArray(normalizedOutput?.limitations),
    handoff_integrity: {
      consumes: ['stage5a_feature_package','stage5b_tag_package','stage5c_feature_inventory_package'],
      produces: ['stage5d_data_touchpoint_package'],
      feature_count_in: featureContext?.feature_contexts?.length || 0,
      touchpoint_count_out: rows.length,
      validation_ok: validationResult?.ok === true
    }
  };
}
