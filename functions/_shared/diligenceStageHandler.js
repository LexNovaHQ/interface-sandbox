import { DILIGENCE_SCHEMA_BUNDLE } from "../_generated/diligenceSchemaBundle.js";
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
    finish_reason: result.finish_reason,
    usage_metadata: result.usage_metadata || null
  };
}

export async function handleDiligenceStageRequest(context, config) {
  if (context.request.method !== "POST") {
    return methodNotAllowed(["POST"]);
  }

  const stageId = config.stageId;
  const outputSchemaKey = config.outputSchemaKey;
  const outputKey = config.outputKey || "output";
  const schemaEntry = resolveSchemaEntry(outputSchemaKey);

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
  const runResult = await runGeminiJsonStage({
    env: context.env || {},
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
        model: runResult.model || null
      },
      { status: providerFailureStatus(runResult) }
    );
  }

  const validation = validateJsonSchema(schemaEntry.schema, runResult.parsed_json);

  if (!validation.ok) {
    return jsonResponse(
      {
        ok: false,
        stage_id: stageId,
        output_schema_key: outputSchemaKey,
        output_schema_path: schemaEntry.path,
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
    [outputKey]: runResult.parsed_json,
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
