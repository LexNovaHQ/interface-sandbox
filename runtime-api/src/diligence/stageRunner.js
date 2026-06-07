import { runGeminiPool } from "../gemini/geminiPool.js";
import { getDiligenceStageConfig } from "./stageConfigs.js";
import { loadDiligencePrompt } from "./stagePromptLoader.js";
import { formatSchemaErrors, resolveSchemaEntry, validateDiligenceStageOutput } from "./stageSchemaValidator.js";

function unwrapStageOutput(parsedJson, outputKey) {
  if (
    parsedJson &&
    typeof parsedJson === "object" &&
    !Array.isArray(parsedJson) &&
    Object.prototype.hasOwnProperty.call(parsedJson, outputKey)
  ) {
    return {
      value: parsedJson[outputKey],
      unwrapped: true
    };
  }

  return {
    value: parsedJson,
    unwrapped: false
  };
}

function buildPromptInput({ stageId, prompt, input }) {
  return [
    prompt.trim(),
    "\n\n---\n\nReturn valid JSON only. Do not include Markdown fences or commentary outside JSON.",
    "\n\n---INPUT_JSON---\n",
    JSON.stringify({ stage_id: stageId, input }, null, 2)
  ].join("");
}

function publicModelMetadata(result) {
  return {
    pool: result?.model_meta?.pool || null,
    model: result?.model_meta?.selected_model || null,
    selected_model: result?.model_meta?.selected_model || null,
    selected_key_alias: result?.model_meta?.selected_key_alias || null,
    attempted_models: result?.attempts || [],
    fallback_used: result?.fallback_used === true,
    primary_error: result?.primary_error || null,
    usage_metadata: result?.usage_metadata || null,
    grounding_metadata: result?.grounding_metadata || null,
    repaired: result?.repaired === true
  };
}

function providerFailureStatus(result) {
  if (result?.error_type === "POOL_KEYS_NOT_CONFIGURED" || result?.error_type === "POOL_MODELS_NOT_CONFIGURED") return 503;
  if (result?.error_type === "ATTEMPT_BUDGET_EXHAUSTED" || result?.error_type === "POOL_EXHAUSTED") return 502;
  if (result?.error_type === "TIMEOUT") return 504;
  return 502;
}

export async function runDiligenceStage({ stageId, input, options = {}, env = process.env }) {
  const config = getDiligenceStageConfig(stageId);
  const schemaEntry = resolveSchemaEntry(config.output_schema_key);

  if (!schemaEntry?.schema) {
    return {
      ok: false,
      status: 500,
      stage_id: config.stage_id,
      error_type: "SCHEMA_NOT_FOUND",
      error: `Output schema not found for ${config.output_schema_key}`,
      output_schema_key: config.output_schema_key
    };
  }

  const promptBundle = loadDiligencePrompt(config.prompt_stage_id);
  const modelPrompt = buildPromptInput({
    stageId: config.stage_id,
    prompt: promptBundle.combined_prompt,
    input
  });

  const runResult = await runGeminiPool({
    poolName: options.pool || config.pool,
    prompt: modelPrompt,
    env,
    options: {
      responseMimeType: "application/json",
      temperature: options.temperature ?? config.temperature,
      maxOutputTokens: options.maxOutputTokens ?? options.max_output_tokens ?? config.max_output_tokens,
      timeoutMs: options.timeoutMs ?? options.timeout_ms ?? config.timeout_ms,
      maxAttempts: options.maxAttempts ?? options.max_attempts
    }
  });

  if (!runResult.ok) {
    return {
      ok: false,
      status: providerFailureStatus(runResult),
      stage_id: config.stage_id,
      error_type: runResult.error_type || "MODEL_STAGE_ERROR",
      error: runResult.error || "Diligence stage model run failed",
      model_metadata: publicModelMetadata(runResult)
    };
  }

  const normalizedOutput = unwrapStageOutput(runResult.json, config.output_key);
  const validation = validateDiligenceStageOutput(config.output_schema_key, normalizedOutput.value);

  if (!validation.ok) {
    return {
      ok: false,
      status: 422,
      stage_id: config.stage_id,
      output_schema_key: config.output_schema_key,
      output_schema_path: validation.schema_path || schemaEntry.path,
      validation_schema_key: validation.resolvedKey,
      validation_mode: validation.validation_mode,
      output_unwrapped: normalizedOutput.unwrapped,
      error_type: "SCHEMA_VALIDATION_ERROR",
      error: "Model output failed schema validation",
      validation_errors: validation.errors,
      error_summary: formatSchemaErrors(validation.errors),
      model_metadata: publicModelMetadata(runResult),
      prompt_metadata: {
        prompt_root: promptBundle.prompt_root,
        shared_sha256: promptBundle.shared_prompt.sha256,
        stage_sha256: promptBundle.stage_prompt.sha256,
        combined_characters: promptBundle.combined_characters
      }
    };
  }

  return {
    ok: true,
    status: 200,
    stage_id: config.stage_id,
    output_schema_key: config.output_schema_key,
    output_schema_path: validation.schema_path || schemaEntry.path,
    validation_schema_key: validation.resolvedKey,
    validation_mode: validation.validation_mode,
    output_unwrapped: normalizedOutput.unwrapped,
    [config.output_key]: normalizedOutput.value,
    model_metadata: publicModelMetadata(runResult),
    prompt_metadata: {
      prompt_root: promptBundle.prompt_root,
      shared_sha256: promptBundle.shared_prompt.sha256,
      stage_sha256: promptBundle.stage_prompt.sha256,
      combined_characters: promptBundle.combined_characters
    }
  };
}
