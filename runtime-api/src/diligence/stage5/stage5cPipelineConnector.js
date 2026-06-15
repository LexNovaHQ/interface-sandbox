/* LexNova Runtime — Stage 5C Batch 4 Pipeline Connector.
 * Connects Batch 0 doctrine, Batch 1 shared foundation, Batch 2 5A, Batch 3 5B, and Batch 4 5C into runtime.
 * This file builds only stage5c_feature_inventory_package and does not assemble target_feature_profile.
 */

import { buildStage5RoutingPlan, summarizeStage5RoutingPlan } from './shared/stage5SharedIndex.js';
import { runStage5C } from './5c/stage5cIndex.js';

function serializePrompt(prompt) {
  if (typeof prompt === 'string') return prompt;
  return [
    prompt?.system || '',
    '\n---EXPECTED_JSON_CONTRACT---\n',
    JSON.stringify(prompt?.expected_json_contract || {}, null, 2),
    '\n---INPUT_JSON---\n',
    typeof prompt?.user === 'string' ? prompt.user : JSON.stringify(prompt?.user || {}, null, 2)
  ].join('\n');
}

function modelMetadata(runResult = {}) {
  return {
    ok: runResult.ok === true,
    pool: runResult.model_meta?.pool || null,
    model: runResult.model_meta?.selected_model || null,
    selected_model: runResult.model_meta?.selected_model || null,
    selected_key_alias: runResult.model_meta?.selected_key_alias || null,
    attempted_models: runResult.attempts || [],
    fallback_used: runResult.fallback_used === true,
    primary_error: runResult.primary_error || null,
    usage_metadata: runResult.usage_metadata || null
  };
}

function buildPorts({ runGeminiPool, logs, logStage, env }) {
  return {
    model: {
      async runJsonStage({ phaseId, prompt, modelPool, runId }) {
        if (typeof runGeminiPool !== 'function') throw new Error('Stage 5C connector requires runGeminiPool');
        const promptText = serializePrompt(prompt);
        logStage?.(logs, 'stage5c_feature_inventory', 'model_repair_running', {
          phase_id: phaseId,
          model_pool: modelPool || 'JSON',
          prompt_chars: promptText.length
        });
        const runResult = await runGeminiPool({
          poolName: env.STAGE5C_MODEL_POOL || env.LIVE_STAGE5C_POOL || env.STAGE5_FEATURE_POOL || 'reasoning',
          prompt: promptText,
          env,
          options: {
            responseMimeType: 'application/json',
            temperature: Number(env.STAGE5C_TEMPERATURE || 0.1),
            maxOutputTokens: Number(env.STAGE5C_MAX_OUTPUT_TOKENS || env.LIVE_STAGE5C_MAX_OUTPUT_TOKENS || 8000),
            timeoutMs: Number(env.STAGE5C_TIMEOUT_MS || env.LIVE_STAGE5C_TIMEOUT_MS || 90000),
            maxAttempts: Number(env.STAGE5C_MAX_ATTEMPTS || 1)
          }
        });
        if (!runResult.ok) {
          const error = new Error(runResult.error || 'Stage 5C model repair call failed');
          error.status = runResult.error_type === 'TIMEOUT' ? 504 : 502;
          error.model_metadata = modelMetadata(runResult);
          throw error;
        }
        return { json: runResult.json, model_metadata: modelMetadata(runResult), run_id: runId };
      }
    }
  };
}

export async function runStage5CBatch4Pipeline({ adapterResult = {}, runGeminiPool, logs, logStage, runId = null, env = process.env } = {}) {
  const stage5aBatch2 = adapterResult.stage5a_batch2 || adapterResult.target_feature_profile_input?.stage5a_batch2 || null;
  const stage5bBatch3 = adapterResult.stage5b_batch3 || adapterResult.target_feature_profile_input?.stage5b_batch3 || null;
  const stage5aFeaturePackage = stage5aBatch2?.stage5a_feature_package || null;
  const stage5aMapping = stage5aBatch2?.stage5a_product_function_mapping || null;
  const stage5bTagPackage = stage5bBatch3?.stage5b_tag_package || null;
  const stage5bTagging = stage5bBatch3?.stage5b_archetype_surface_tagging || null;
  const featuresFor5C = stage5bTagPackage?.feature_tags_for_5c || [];
  if (!stage5aFeaturePackage || !stage5bTagPackage || !featuresFor5C.length) {
    const error = new Error('Stage 5C Batch 4 requires Stage 5A feature package and Stage 5B tag package with feature_tags_for_5c.');
    error.status = 500;
    error.stage5a_available = Boolean(stage5aFeaturePackage);
    error.stage5b_available = Boolean(stage5bTagPackage);
    error.features_for_5c_count = featuresFor5C.length;
    throw error;
  }

  const context = {
    run_id: `${runId || 'runtime'}_stage5c_batch4`,
    run_mode: 'LIVE_STAGE5C_BATCH4',
    target_profile_ref: stage5aFeaturePackage.target_profile_ref || stage5bTagPackage.target_profile_ref || adapterResult.target_feature_profile_input?.target_profile_ref || null,
    features_for_5c_count: featuresFor5C.length
  };
  const routingPlan = buildStage5RoutingPlan(context);
  logStage?.(logs, 'stage5c_feature_inventory', 'running', {
    features_for_5c_count: featuresFor5C.length,
    routing: summarizeStage5RoutingPlan(routingPlan)
  });

  const ports = buildPorts({ runGeminiPool, logs, logStage, env });
  const result = await runStage5C({
    stage5aFeaturePackage,
    stage5aMapping,
    stage5bTagPackage,
    stage5bTagging,
    ports,
    routingPlan,
    runId: context.run_id
  });
  const metrics = result.stage5c_validation?.metrics || {};
  logStage?.(logs, 'stage5c_feature_inventory', 'complete', {
    feature_inventory_count: metrics.feature_inventory_count || result.stage5c_feature_inventory_package?.feature_inventory?.length || 0,
    repair_count: metrics.repair_count || result.stage5c_feature_inventory_package?.canonicalization_repairs?.length || 0,
    true_unknown_count: metrics.true_unknown_count || result.stage5c_feature_inventory_package?.true_unknowns?.length || 0,
    validation_ok: result.stage5c_validation?.ok === true,
    validation_severity: result.stage5c_validation?.severity || null
  });

  return {
    ok: result.stage5c_validation?.ok !== false,
    routing_plan: routingPlan,
    ...result
  };
}
