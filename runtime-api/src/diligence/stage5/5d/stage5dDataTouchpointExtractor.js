/* LexNova Runtime — Stage 5D Touchpoint adjudication bridge. */

import { buildStage5DModelInput, buildStage5DPrompt } from './stage5dPromptBuilder.js';

export async function runStage5DDataTouchpointExtractor({ ports, featureContext = {}, dataSignalSeed = {}, instructionPacket = {}, routingPlan = {}, runId = null } = {}) {
  const input = buildStage5DModelInput({ featureContext, dataSignalSeed, instructionPacket });
  const prompt = buildStage5DPrompt(input);
  const empty = (reason) => ({ stage5d_data_touchpoints_raw: { stage5d_version: 'stage5d_feature_data_touchpoints_v1', feature_data_touchpoints: [], feature_level_unknowns: [], limitations: [reason] }, run_metadata: { skipped: true, reason }, prompt_preview: prompt });
  if (!featureContext?.feature_contexts?.length) return empty('NO_FEATURE_CONTEXTS');
  const runner = ports?.runner?.runJsonStage || ports?.model?.runJsonStage;
  if (!runner) return empty('NO_RUNNER_PORT');
  const result = await runner({ phaseId: 'STAGE5D_FEATURE_DATA_TOUCHPOINT_EXTRACTION', prompt, modelPool: routingPlan?.model_pool || 'JSON', runId });
  return { stage5d_data_touchpoints_raw: result?.json || {}, run_metadata: result?.model_metadata || result?.run_metadata || {}, prompt_preview: prompt };
}
