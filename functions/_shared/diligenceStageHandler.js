import { DILIGENCE_SCHEMA_BUNDLE } from "../_generated/diligenceSchemaBundle.js";
import { getGeminiModelSequence } from "./aiProviderConfig.js";
import { jsonResponse, methodNotAllowed } from "./response.js";
import { runGeminiJsonStage } from "./geminiJsonRunner.js";
import { loadDiligencePrompt } from "./diligencePromptLoader.js";
import { formatSchemaErrors, validateJsonSchema } from "./jsonSchemaValidator.js";

function resolveSchemaEntry(schemaKey) {
  const direct = DILIGENCE_SCHEMA_BUNDLE.schemas?.[schemaKey];
  if (direct) return direct;

  const canonicalPath = DILIGENCE_SCHEMA_BUNDLE.canonical_schema_paths?.[schemaKey];
  if (!canonicalPath) return null;

  return Object.values(DILIGENCE_SCHEMA_BUNDLE.schemas || {}).find((entry) => entry.path === canonicalPath) || null;
}

async function readJsonBody(request) {
  const contentType = request.headers.get("content-type") || "";

  if (!contentType.toLowerCase().includes("application/json")) {
    throw new Error("Request body must be application/json");
  }

  try {
    return await request.json();
  } catch (error) {
    throw new Error("Invalid JSON request body");
  }
}

function getStageInput(body) {
  if (body && Object.prototype.hasOwnProperty.call(body, "input")) {
    return body.input;
  }

  return body;
}

function providerFailureStatus(result) {
  if (result.error_type === "CONFIG_ERROR") return 503;
  if (result.error_type === "INPUT_ERROR") return 400;
  if (result.error_type === "TIMEOUT") return 504;
  return 502;
}

function publicModelMetadata(result) {
  return {
    provider: result.provider,
    model: result.model,
    selected_model: result.selected_model || result.model,
    attempted_models: result.attempted_models || [],
    finish_reason: result.finish_reason,
    usage_metadata: result.usage_metadata || null
  };
}

function runtimeErrorPayload(stageId, error) {
  return {
    ok: false,
    stage_id: stageId || "unknown_stage",
    error_type: "STAGE_HANDLER_RUNTIME_ERROR",
    error_name: error?.name || "Error",
    error: error?.message || String(error),
    stack_preview: String(error?.stack || "").split("\n").slice(0, 6)
  };
}

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

function maybeNormalizeStageOutput({ config, value, input, stageId }) {
  if (typeof config.normalizeOutput !== "function") {
    return {
      value,
      normalized: false
    };
  }

  return {
    value: config.normalizeOutput(value, input, { stageId }),
    normalized: true
  };
}

function shouldTryNextModel(result) {
  return [
    "PROVIDER_ERROR",
    "MODEL_JSON_PARSE_ERROR",
    "TIMEOUT",
    "REQUEST_ERROR"
  ].includes(result?.error_type);
}

async function runStageModelWithFallback({ context, stageId, prompt, input, options }) {
  const env = context.env || {};
  const modelSequence = getGeminiModelSequence(env, {
    model: options?.model,
    modelSequence: options?.modelSequence
  });

  const attempted_models = [];
  let lastResult = null;

  for (const model of modelSequence) {
    const result = await runGeminiJsonStage({
      env,
      stageId,
      prompt,
      input,
      options: {
        ...(options || {}),
        model
      }
    });

    attempted_models.push({
      model,
      ok: result.ok,
      error_type: result.error_type || null,
      error: result.error || null,
      status: result.status || null,
      finish_reason: result.finish_reason || null
    });

    if (result.ok) {
      return {
        ...result,
        selected_model: model,
        attempted_models
      };
    }

    lastResult = result;
    if (!shouldTryNextModel(result)) break;
  }

  return {
    ...(lastResult || {
      ok: false,
      provider: "gemini",
      stage_id: stageId,
      model: modelSequence[0] || null,
      configured: true,
      error_type: "NO_MODEL_ATTEMPTED",
      error: "No Gemini model attempts were run"
    }),
    attempted_models
  };
}

async function runDiligenceStageRequest(context, config) {
  if (context.request.method !== "POST") {
    return methodNotAllowed(["POST"]);
  }

  const stageId = config.stageId;
  const outputSchemaKey = config.outputSchemaKey;
  const outputKey = config.outputKey || "output";
  const schemaEntry = resolveSchemaEntry(outputSchemaKey);
  const validationSchemaKey = schemaEntry?.schema_id || outputSchemaKey;

  if (!schemaEntry?.schema) {
    return jsonResponse(
      {
        ok: false,
        stage_id: stageId,
        error: `Output schema not found for ${outputSchemaKey}`
      },
      { status: 500 }
    );
  }

  let body;

  try {
    body = await readJsonBody(context.request);
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        stage_id: stageId,
        error: error.message
      },
      { status: 400 }
    );
  }

  let promptBundle;

  try {
    promptBundle = loadDiligencePrompt(stageId);
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        stage_id: stageId,
        error: error.message
      },
      { status: 500 }
    );
  }

  const input = getStageInput(body);
  const runResult = await runStageModelWithFallback({
    context,
    stageId,
    prompt: promptBundle.combined_prompt,
    input,
    options: body?.options || {}
  });

  if (!runResult.ok) {
    return jsonResponse(
      {
        ok: false,
        stage_id: stageId,
        error_type: runResult.error_type,
        error: runResult.error,
        provider: runResult.provider,
        model: runResult.model || null,
        selected_model: runResult.selected_model || null,
        attempted_models: runResult.attempted_models || [],
        finish_reason: runResult.finish_reason || null,
        usage_metadata: runResult.usage_metadata || null
      },
      { status: providerFailureStatus(runResult) }
    );
  }

  const normalizedOutput = unwrapStageOutput(runResult.parsed_json, outputKey);
  const stageOutput = maybeNormalizeStageOutput({
    config,
    value: normalizedOutput.value,
    input,
    stageId
  });
  const validation = validateJsonSchema(validationSchemaKey, stageOutput.value);

  if (!validation.ok) {
    return jsonResponse(
      {
        ok: false,
        stage_id: stageId,
        output_schema_key: outputSchemaKey,
        output_schema_path: schemaEntry.path,
        validation_schema_key: validationSchemaKey,
        validation_mode: validation.validation_mode,
        output_unwrapped: normalizedOutput.unwrapped,
        output_normalized: stageOutput.normalized,
        error_type: "SCHEMA_VALIDATION_ERROR",
        error: "Model output failed schema validation",
        validation_errors: validation.errors,
        error_summary: formatSchemaErrors(validation.errors),
        model_metadata: publicModelMetadata(runResult),
        prompt_metadata: {
          shared_sha256: promptBundle.shared_prompt.sha256,
          stage_sha256: promptBundle.stage_prompt.sha256,
          combined_characters: promptBundle.combined_characters
        }
      },
      { status: 422 }
    );
  }

  return jsonResponse({
    ok: true,
    stage_id: stageId,
    output_schema_key: outputSchemaKey,
    output_schema_path: schemaEntry.path,
    validation_schema_key: validationSchemaKey,
    validation_mode: validation.validation_mode,
    output_unwrapped: normalizedOutput.unwrapped,
    output_normalized: stageOutput.normalized,
    [outputKey]: stageOutput.value,
    model_metadata: publicModelMetadata(runResult),
    prompt_metadata: {
      prompt_root: promptBundle.prompt_root,
      shared_sha256: promptBundle.shared_prompt.sha256,
      stage_sha256: promptBundle.stage_prompt.sha256,
      combined_characters: promptBundle.combined_characters
    },
    schema_metadata: {
      title: schemaEntry.title,
      sha256: schemaEntry.sha256
    }
  });
}

export async function handleDiligenceStageRequest(context, config) {
  try {
    return await runDiligenceStageRequest(context, config);
  } catch (error) {
    return jsonResponse(runtimeErrorPayload(config?.stageId, error), { status: 500 });
  }
}
