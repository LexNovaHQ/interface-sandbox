/* LexNova Runtime — Stage 5B Archetype/Surface Tagger. Model call wrapper only. */

import { asPlainObject, nowIso } from '../shared/stage5SharedIndex.js';
import { buildStage5BModelInput, buildStage5BPrompt } from './stage5bPromptBuilder.js';

export async function runStage5BArchetypeSurfaceTagging({
  ports,
  taxonomySlice,
  investigationPacket,
  signalSeed,
  instructionPacket,
  routingPlan,
  runId
} = {}) {
  if (!ports?.model?.runJsonStage) throw new Error('Stage 5B requires ports.model.runJsonStage');
  const startedAt = nowIso();
  const prompt = buildStage5BPrompt({ taxonomySlice, investigationPacket, signalSeed, instructionPacket });
  const input = buildStage5BModelInput({ taxonomySlice, investigationPacket, signalSeed, instructionPacket });
  const result = await ports.model.runJsonStage({
    phaseId: 'STAGE5B_ARCHETYPE_SURFACE_TAGGING',
    stage: 'stage5',
    substage: '5B',
    prompt,
    schemaName: 'stage5b_archetype_surface_tagging_v1',
    input,
    tokenBudget: routingPlan?.phase_plan?.find?.((phase) => phase.phase_id === 'STAGE5B_ARCHETYPE_SURFACE_TAGGING')?.model_budget_ref || '5B_DEFAULT',
    modelPool: 'JSON',
    runId
  });
  const output = asPlainObject(result?.json || result?.output || result);
  return {
    stage5b_archetype_surface_tagging: {
      stage5b_version: output.stage5b_version || 'stage5b_archetype_surface_tagging_v1',
      target_profile_ref: output.target_profile_ref || investigationPacket?.target_profile_ref || null,
      feature_tags: output.feature_tags || [],
      tagging_failures: output.tagging_failures || [],
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
