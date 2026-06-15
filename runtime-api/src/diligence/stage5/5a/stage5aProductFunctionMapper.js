/* LexNova Runtime — Stage 5A Product Function Mapper. Model call wrapper only. */

import { asPlainObject, nowIso } from '../shared/stage5SharedIndex.js';
import { buildStage5APrompt } from './stage5aPromptBuilder.js';

export async function runStage5AProductFunctionMapping({
  ports,
  stage5aInput,
  losslessSourceIndex,
  candidatePool,
  instructionPacket,
  routingPlan,
  runId
} = {}) {
  if (!ports?.model?.runJsonStage) throw new Error('Stage 5A requires ports.model.runJsonStage');
  const startedAt = nowIso();
  const prompt = buildStage5APrompt({ stage5aInput, losslessSourceIndex, candidatePool, instructionPacket });
  const result = await ports.model.runJsonStage({
    phaseId: 'STAGE5A_PRODUCT_FUNCTION_EXTRACTION',
    stage: 'stage5',
    substage: '5A',
    prompt,
    schemaName: 'stage5a_product_function_mapping_v1',
    input: {
      target_profile_ref: stage5aInput?.target_profile_ref || null,
      deterministic_candidate_pool: candidatePool?.deterministic_candidate_pool || [],
      lossless_source_index: losslessSourceIndex?.lossless_source_index || []
    },
    tokenBudget: routingPlan?.phase_plan?.find?.((phase) => phase.phase_id === 'STAGE5A_PRODUCT_FUNCTION_EXTRACTION')?.model_budget_ref || '5A_DEFAULT',
    modelPool: 'JSON',
    runId
  });

  const output = asPlainObject(result?.json || result?.output || result);
  return {
    stage5a_product_function_mapping: {
      stage5a_version: output.stage5a_version || 'stage5a_product_function_mapping_v1',
      target_profile_ref: output.target_profile_ref || stage5aInput?.target_profile_ref || null,
      core_products: output.core_products || [],
      product_function_map: output.product_function_map || output.product_functions || [],
      candidate_disposition: output.candidate_disposition || [],
      visible_but_unmapped_candidates: output.visible_but_unmapped_candidates || [],
      source_function_bindings: output.source_function_bindings || [],
      commercial_outcome_candidates: output.commercial_outcome_candidates || [],
      limitations: output.limitations || [],
      model_metadata: {
        ...(output.model_metadata || {}),
        ...(result?.model_metadata || {}),
        started_at: startedAt,
        completed_at: nowIso()
      }
    },
    raw_model_result: result,
    prompt_preview: prompt
  };
}
