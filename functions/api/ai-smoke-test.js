import { runGeminiJsonStage } from "../_shared/geminiJsonRunner.js";
import { jsonResponse, methodNotAllowed } from "../_shared/response.js";

const SMOKE_PROMPT = "Return valid JSON only with status GEMINI_OK.";

export async function onRequest(context) {
  if (context.request.method !== "POST") {
    return methodNotAllowed(["POST"]);
  }

  const result = await runGeminiJsonStage({
    env: context.env || {},
    stageId: "ai_smoke_test",
    prompt: SMOKE_PROMPT,
    input: { expected_status: "GEMINI_OK" },
    options: {
      maxAttempts: 1,
      maxOutputTokens: 4096,
      temperature: 0
    }
  });

  if (!result.ok) {
    return jsonResponse(
      {
        ok: false,
        provider: "gemini",
        error_type: result.error_type,
        error: result.error,
        model_role: result.model_role || "json",
        attempted_models: result.attempted_models || []
      },
      { status: result.error_type === "CONFIG_ERROR" ? 503 : 502 }
    );
  }

  const passed = result.parsed_json?.status === "GEMINI_OK";

  return jsonResponse({
    ok: passed,
    provider: "gemini",
    test_passed: passed,
    selected_model: result.selected_model || result.model,
    selected_key_alias: result.selected_key_alias || null,
    parsed_status: result.parsed_json?.status || null,
    attempted_models: result.attempted_models || [],
    finish_reason: result.finish_reason || null,
    usage_metadata: result.usage_metadata || null
  });
}
