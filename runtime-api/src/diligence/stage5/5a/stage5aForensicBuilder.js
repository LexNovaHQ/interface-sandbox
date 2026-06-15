/* LexNova Runtime — Stage 5A Forensic Builder. No model calls. */

import { asArray, buildStage5InputSummary, buildStage5OutputSummary, createStage5ForensicArtifact, nowIso } from '../shared/stage5SharedIndex.js';

export function buildStage5AForensicArtifact({
  runId,
  startedAt,
  completedAt,
  stage5aInput,
  losslessSourceIndex,
  candidatePool,
  instructionPacket,
  mapping,
  featurePackage,
  validationResult,
  tokenUsage,
  promptPreview
} = {}) {
  const started = startedAt || mapping?.model_metadata?.started_at || nowIso();
  const completed = completedAt || mapping?.model_metadata?.completed_at || nowIso();
  return createStage5ForensicArtifact({
    run_id: runId || null,
    target_profile_ref: stage5aInput?.target_profile_ref || mapping?.target_profile_ref || null,
    phase_id: 'STAGE5A_PRODUCT_FUNCTION_EXTRACTION',
    phase_name: '5A Hybrid Product-Function Mapping',
    started_at: started,
    completed_at: completed,
    duration_ms: Date.parse(completed) && Date.parse(started) ? Math.max(0, Date.parse(completed) - Date.parse(started)) : 0,
    input_summary: {
      ...buildStage5InputSummary(stage5aInput || {}),
      lossless_source_count: asArray(stage5aInput?.product_family_source_lossless).length,
      candidate_count: asArray(candidatePool?.deterministic_candidate_pool).length
    },
    output_summary: {
      ...buildStage5OutputSummary(mapping || {}),
      admitted_function_count: asArray(mapping?.product_function_map).length,
      core_product_count: asArray(mapping?.core_products).length,
      features_for_5b_count: asArray(featurePackage?.features_for_5b).length,
      source_index_count: asArray(losslessSourceIndex?.lossless_source_index).length
    },
    canonical_output_pointer: null,
    validation_result: validationResult || null,
    token_usage: tokenUsage || mapping?.model_metadata || null,
    warnings: validationResult?.warnings || [],
    errors: validationResult?.blocking_errors || [],
    handoff_integrity: featurePackage?.handoff_integrity || null,
    artifact_payload: {
      stage5a_input_summary: summarize5AInput(stage5aInput, losslessSourceIndex, candidatePool),
      instruction_packet: instructionPacket || null,
      prompt_preview: promptPreview || null,
      stage5a_product_function_mapping: mapping || null,
      stage5a_feature_package: featurePackage || null
    }
  });
}

function summarize5AInput(stage5aInput = {}, losslessSourceIndex = {}, candidatePool = {}) {
  return {
    target_profile_ref: stage5aInput.target_profile_ref || null,
    lossless_source_count: asArray(stage5aInput.product_family_source_lossless).length,
    source_index_count: asArray(losslessSourceIndex.lossless_source_index).length,
    deterministic_candidate_count: asArray(candidatePool.deterministic_candidate_pool).length,
    candidate_summary: candidatePool.candidate_pool_summary || {}
  };
}
