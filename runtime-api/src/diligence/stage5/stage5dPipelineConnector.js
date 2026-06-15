/* LexNova Runtime — Stage 5D Batch 5 Pipeline Connector. */

import { buildStage5RoutingPlan, summarizeStage5RoutingPlan } from './shared/stage5SharedIndex.js';
import { runStage5D } from './5d/stage5dIndex.js';

function serializePrompt(prompt) {
  if (typeof prompt === 'string') return prompt;
  return [prompt?.system || '', '\n---EXPECTED_JSON_CONTRACT---\n', JSON.stringify(prompt?.expected_json_contract || {}, null, 2), '\n---INPUT_JSON---\n', typeof prompt?.user === 'string' ? prompt.user : JSON.stringify(prompt?.user || {}, null, 2)].join('\n');
}

function runMeta(runResult = {}) {
  return {
    ok: runResult.ok === true,
    pool: runResult.model_meta?.pool || null,
    selected_model: runResult.model_meta?.selected_model || null,
    selected_key_alias: runResult.model_meta?.selected_key_alias || null,
    attempts: runResult.attempts || [],
    usage_metadata: runResult.usage_metadata || null,
    primary_error: runResult.primary_error || null
  };
}

function buildPorts({ runGeminiPool, logs, logStage, env }) {
  return {
    runner: {
      async runJsonStage({ phaseId, prompt, modelPool, runId }) {
        if (typeof runGeminiPool !== 'function') throw new Error('Stage 5D connector requires runGeminiPool');
        const promptText = serializePrompt(prompt);
        logStage?.(logs, 'stage5d_data_touchpoints', 'model_running', { phase_id: phaseId, model_pool: modelPool || 'JSON', prompt_chars: promptText.length });
        const runResult = await runGeminiPool({
          poolName: env.STAGE5D_MODEL_POOL || env.LIVE_STAGE5D_POOL || env.STAGE5_FEATURE_POOL || 'reasoning',
          prompt: promptText,
          env,
          options: {
            responseMimeType: 'application/json',
            temperature: Number(env.STAGE5D_TEMPERATURE || 0.1),
            maxOutputTokens: Number(env.STAGE5D_MAX_OUTPUT_TOKENS || env.LIVE_STAGE5D_MAX_OUTPUT_TOKENS || 9000),
            timeoutMs: Number(env.STAGE5D_TIMEOUT_MS || env.LIVE_STAGE5D_TIMEOUT_MS || 90000),
            maxAttempts: Number(env.STAGE5D_MAX_ATTEMPTS || 1)
          }
        });
        if (!runResult.ok) {
          const error = new Error(runResult.error || 'Stage 5D model call failed');
          error.status = runResult.error_type === 'TIMEOUT' ? 504 : 502;
          error.run_metadata = runMeta(runResult);
          throw error;
        }
        return { json: runResult.json, run_metadata: runMeta(runResult), run_id: runId };
      }
    }
  };
}

export async function runStage5DBatch5Pipeline({ adapterResult = {}, runGeminiPool, logs, logStage, runId = null, env = process.env } = {}) {
  const stage5aBatch2 = adapterResult.stage5a_batch2 || adapterResult.target_feature_profile_input?.stage5a_batch2 || null;
  const stage5bBatch3 = adapterResult.stage5b_batch3 || adapterResult.target_feature_profile_input?.stage5b_batch3 || null;
  const stage5cBatch4 = adapterResult.stage5c_batch4 || adapterResult.target_feature_profile_input?.stage5c_batch4 || null;
  const stage5aFeaturePackage = stage5aBatch2?.stage5a_feature_package || null;
  const stage5bTagPackage = stage5bBatch3?.stage5b_tag_package || null;
  const stage5cFeatureInventoryPackage = stage5cBatch4?.stage5c_feature_inventory_package || null;
  const featureInventory = stage5cFeatureInventoryPackage?.feature_inventory || [];
  if (!stage5aFeaturePackage || !stage5bTagPackage || !stage5cFeatureInventoryPackage || !featureInventory.length) {
    const error = new Error('Stage 5D Batch 5 requires Stage 5A, 5B, and 5C packages with feature_inventory.');
    error.status = 500;
    error.stage5a_available = Boolean(stage5aFeaturePackage);
    error.stage5b_available = Boolean(stage5bTagPackage);
    error.stage5c_available = Boolean(stage5cFeatureInventoryPackage);
    error.feature_inventory_count = featureInventory.length;
    throw error;
  }

  const context = {
    run_id: `${runId || 'runtime'}_stage5d_batch5`,
    run_mode: 'LIVE_STAGE5D_BATCH5',
    target_profile_ref: stage5cFeatureInventoryPackage.target_profile_ref || adapterResult.target_feature_profile_input?.target_profile_ref || null,
    feature_inventory_count: featureInventory.length
  };
  const routingPlan = buildStage5RoutingPlan(context);
  logStage?.(logs, 'stage5d_data_touchpoints', 'running', { feature_inventory_count: featureInventory.length, routing: summarizeStage5RoutingPlan(routingPlan) });

  const ports = buildPorts({ runGeminiPool, logs, logStage, env });
  const result = await runStage5D({ stage5aFeaturePackage, stage5bTagPackage, stage5cFeatureInventoryPackage, ports, routingPlan, runId: context.run_id });
  const metrics = result.stage5d_validation?.metrics || {};
  logStage?.(logs, 'stage5d_data_touchpoints', 'complete', {
    touchpoint_count: result.stage5d_data_touchpoint_package?.feature_data_touchpoints?.length || 0,
    data_provenance_seed_count: result.stage5d_data_touchpoint_package?.seeds_for_5e?.data_provenance_map_seed?.length || 0,
    unknown_category_count: metrics.unknown_category_count || 0,
    validation_ok: result.stage5d_validation?.ok === true,
    validation_severity: result.stage5d_validation?.severity || null
  });
  return { ok: result.stage5d_validation?.ok !== false, routing_plan: routingPlan, ...result };
}
