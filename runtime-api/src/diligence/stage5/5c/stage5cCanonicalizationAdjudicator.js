/* LexNova Runtime — Stage 5C Canonicalization Adjudicator. */

import { buildStage5CCanonicalizationModelInput, buildStage5CCanonicalizationPrompt } from './stage5cCanonicalizationPromptBuilder.js';
import { asArray } from '../shared/stage5SharedIndex.js';

export async function runStage5CCanonicalizationAdjudicator({ ports, canonicalDraft = {}, completenessAnalysis = {}, instructionPacket = {}, routingPlan = {}, runId = null } = {}) {
  if (!asArray(completenessAnalysis?.rows_needing_model).length) {
    return {
      stage5c_canonicalization_repair: {
        stage5c_repair_version: 'stage5c_canonicalization_repair_v1',
        repairs: [],
        true_unknowns: [],
        limitations: ['No 5C model repair was required.']
      },
      prompt_preview: null,
      model_metadata: { skipped: true, reason: 'NO_ROWS_NEED_REPAIR' }
    };
  }
  if (!ports?.model?.runJsonStage) throw new Error('Stage 5C canonicalization requires ports.model.runJsonStage');
  const modelInput = buildStage5CCanonicalizationModelInput({ canonicalDraft, completenessAnalysis, instructionPacket });
  const prompt = buildStage5CCanonicalizationPrompt(modelInput);
  const result = await ports.model.runJsonStage({
    phaseId: 'STAGE5C_CANONICALIZATION_REPAIR',
    prompt,
    schemaName: 'stage5c_canonicalization_repair_v1',
    input: modelInput,
    modelPool: routingPlan?.modelPool || 'JSON',
    runId
  });
  return {
    stage5c_canonicalization_repair: result?.json?.stage5c_canonicalization_repair || result?.json || {},
    prompt_preview: prompt,
    model_metadata: result?.model_metadata || null
  };
}
