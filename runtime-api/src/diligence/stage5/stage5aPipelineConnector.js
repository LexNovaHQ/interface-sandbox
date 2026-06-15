/* LexNova Runtime — Stage 5A Batch 2 Pipeline Connector.
 * Connects Batch 0 doctrine, Batch 1 shared foundation, and Batch 2 5A into runtime.
 * This file does not assemble target_feature_profile and does not run 5B-5E.
 */

import { buildStage5RoutingPlan, summarizeStage5RoutingPlan } from './shared/stage5SharedIndex.js';
import { runStage5A } from './5a/stage5aIndex.js';

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function sourceId(record = {}) {
  return asText(record.source_id || record.evidence_source_id || record.id);
}

function sourceText(record = {}) {
  return asText(record.clean_text || record.text?.clean_text_lossless || record.text?.clean_text || record.content || record.body);
}

function normalizeLosslessSource(record = {}, index = 0) {
  const id = sourceId(record) || `S5A_SRC_${String(index + 1).padStart(3, '0')}`;
  return {
    ...record,
    source_id: id,
    evidence_source_id: record.evidence_source_id || id,
    source_url: record.source_url || record.final_url || record.url || null,
    url: record.url || record.source_url || record.final_url || null,
    title: record.title || record.structure?.title || record.source_title || id,
    clean_text: sourceText(record),
    family: record.family || record.source_family || 'product_family_unknown',
    chunk_refs: asArray(record.chunk_refs || record.chunk_index || record.chunks)
  };
}

function collectLosslessProductSources(adapterResult = {}) {
  const input = adapterResult.target_feature_profile_input || {};
  const buffer = asArray(input.source_bundle?.evidence_buffer);
  const wanted = new Set([
    ...asArray(adapterResult.product_family_primary_sources),
    ...asArray(adapterResult.product_family_secondary_sources),
    ...asArray(adapterResult.product_family_supporting_sources),
    ...asArray(adapterResult.product_family_duplicate_sources),
    ...asArray(adapterResult.product_family_discovery_sources)
  ].map(sourceId).filter(Boolean));

  const selected = wanted.size ? buffer.filter((record) => wanted.has(sourceId(record))) : buffer;
  const fallback = selected.length ? selected : buffer;
  return fallback.map(normalizeLosslessSource).filter((record) => record.clean_text || record.source_url || record.url);
}

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
        if (typeof runGeminiPool !== 'function') throw new Error('Stage 5A connector requires runGeminiPool');
        const promptText = serializePrompt(prompt);
        logStage?.(logs, 'stage5a_product_function_mapping', 'model_running', {
          phase_id: phaseId,
          model_pool: modelPool || 'JSON',
          prompt_chars: promptText.length
        });
        const runResult = await runGeminiPool({
          poolName: env.STAGE5A_MODEL_POOL || env.LIVE_STAGE5A_POOL || env.STAGE5_FEATURE_POOL || 'reasoning',
          prompt: promptText,
          env,
          options: {
            responseMimeType: 'application/json',
            temperature: Number(env.STAGE5A_TEMPERATURE || 0.1),
            maxOutputTokens: Number(env.STAGE5A_MAX_OUTPUT_TOKENS || env.LIVE_STAGE5A_MAX_OUTPUT_TOKENS || 12000),
            timeoutMs: Number(env.STAGE5A_TIMEOUT_MS || env.LIVE_STAGE5A_TIMEOUT_MS || 90000),
            maxAttempts: Number(env.STAGE5A_MAX_ATTEMPTS || 1)
          }
        });
        if (!runResult.ok) {
          const error = new Error(runResult.error || 'Stage 5A model call failed');
          error.status = runResult.error_type === 'TIMEOUT' ? 504 : 502;
          error.model_metadata = modelMetadata(runResult);
          throw error;
        }
        return { json: runResult.json, model_metadata: modelMetadata(runResult), run_id: runId };
      }
    }
  };
}

export async function runStage5ABatch2Pipeline({ adapterResult = {}, companyProfile = null, runGeminiPool, logs, logStage, runId = null, env = process.env } = {}) {
  const input = adapterResult.target_feature_profile_input || {};
  const productFamilySources = collectLosslessProductSources(adapterResult);
  const context = {
    run_id: `${runId || 'runtime'}_stage5a_batch2`,
    run_mode: 'LIVE_STAGE5A_BATCH2',
    target_profile: companyProfile || input.target_profile || null,
    company_profile: companyProfile || null,
    target_profile_ref: input.target_profile_ref || companyProfile?.identity?.domain || companyProfile?.identity?.brand_name || null,
    target_feature_profile_input: input,
    source_bundle: input.source_bundle || {},
    product_family_source_lossless: productFamilySources,
    stage5_candidate_clusters: adapterResult.stage5_candidate_clusters || input.stage5_candidate_clusters || [],
    target_feature_candidate_index: adapterResult.target_feature_candidate_index || input.target_feature_candidate_index || null
  };

  const routingPlan = buildStage5RoutingPlan(context);
  logStage?.(logs, 'stage5a_product_function_mapping', 'running', {
    source_count: productFamilySources.length,
    candidate_count: context.target_feature_candidate_index?.candidate_count || 0,
    routing: summarizeStage5RoutingPlan(routingPlan)
  });

  const ports = buildPorts({ runGeminiPool, logs, logStage, env });
  const result = await runStage5A({ context, ports, routingPlan, runId: context.run_id });
  const mapped = result.stage5a_product_function_mapping?.product_function_map?.length || 0;
  const packaged = result.stage5a_feature_package?.features_for_5b?.length || 0;
  logStage?.(logs, 'stage5a_product_function_mapping', 'complete', {
    mapped_function_count: mapped,
    features_for_5b_count: packaged,
    validation_ok: result.stage5a_validation?.ok === true,
    validation_severity: result.stage5a_validation?.severity || null
  });

  return {
    ok: result.stage5a_validation?.ok !== false,
    routing_plan: routingPlan,
    ...result
  };
}
