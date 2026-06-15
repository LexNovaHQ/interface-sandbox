/* LexNova Runtime — Stage 5D Forensic Builder. */

import { asArray } from '../shared/stage5SharedIndex.js';

export function buildStage5DForensicArtifact({ runId, joinedInput = {}, featureContext = {}, dataSignalSeed = {}, instructionPacket = {}, extractorResult = {}, normalizedOutput = {}, validationResult = {}, packageResult = {} } = {}) {
  const rows = asArray(normalizedOutput?.feature_data_touchpoints);
  return {
    artifact_version: 'stage5_5d_forensic_v1',
    run_id: runId || null,
    target_profile_ref: featureContext?.target_profile_ref || joinedInput?.target_profile_ref || null,
    phase_id: 'STAGE5D_FEATURE_DATA_TOUCHPOINT_EXTRACTION',
    phase_name: '5D Feature Data Touchpoint Extraction',
    input_summary: {
      joined_feature_count: joinedInput?.metrics?.joined_count || 0,
      feature_context_count: featureContext?.feature_contexts?.length || 0,
      signal_seed_count: dataSignalSeed?.feature_signal_seeds?.length || 0
    },
    output_summary: {
      touchpoint_count: rows.length,
      input_touchpoint_count: rows.filter((row) => row.touchpoint_type === 'INPUT').length,
      output_touchpoint_count: rows.filter((row) => row.touchpoint_type === 'OUTPUT').length,
      not_evidenced_count: validationResult?.metrics?.not_evidenced_count || 0,
      unknown_category_count: validationResult?.metrics?.unknown_category_count || 0,
      seed_count: packageResult?.seeds_for_5e?.data_provenance_map_seed?.length || 0
    },
    instruction_summary: {
      controlled_touchpoint_types: instructionPacket?.controlled_values?.touchpoint_type?.length || 0,
      controlled_data_categories: instructionPacket?.controlled_values?.data_category?.length || 0
    },
    token_usage: extractorResult?.run_metadata?.usage_metadata || null,
    run_metadata: extractorResult?.run_metadata || {},
    validation_result: validationResult,
    artifact_payload: { package_summary: packageResult?.handoff_integrity || {} }
  };
}
