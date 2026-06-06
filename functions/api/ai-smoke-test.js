import { getGeminiModelSequence, maskConfigured } from "../_shared/aiProviderConfig.js";
import { runGeminiJsonStage } from "../_shared/geminiJsonRunner.js";
import { jsonResponse, methodNotAllowed } from "../_shared/response.js";

const SMOKE_PROMPT = "Return valid JSON only with this exact shape: {\"status\":\"GEMINI_OK\"}.";

export async function onRequest(context) {
  if (context.request.method !== "POST") {
    return methodNotAllowed(["POST"]);
  }

  const env = context.env || {};

  if (!maskConfigured(env.GEMINI_API_KEY)) {
    return jsonResponse(
      {
        ok: false,
        provider: "gemini",
        configured: false,
        error: "GEMINI_API_KEY missing"
      },
      { status: 503 }
    );
  }

  const modelSequence = getGeminiModelSequence(env);
  const attempts = [];

  for (const model of modelSequence) {
    const result = await runGeminiJsonStage({
      env,
      stageId: "ai_smoke_test",
      prompt: SMOKE_PROMPT,
      input: {
        expected_status: "GEMINI_OK"
      },
      options: {
        model,
        maxOutputTokens: 4096,
        temperature: 0
      }
    });

    attempts.push({
      model,
      ok: result.ok,
      error_type: result.error_type || null,
      error: result.error || null,
      finish_reason: result.finish_reason || null,
      usage_metadata: result.usage_metadata || null
    });

    if (result.ok && result.parsed_json?.status === "GEMINI_OK") {
      return jsonResponse({
        ok: true,
        provider: "gemini",
        configured: true,
        test_passed: true,
        selected_model: model,
        parsed_status: result.parsed_json.status,
        attempted_models: attempts
      });
    }
  }

  const lastAttempt = attempts[attempts.length - 1] || null;

  return jsonResponse(
    {
      ok: true,
      provider: "gemini",
      configured: true,
      test_passed: false,
      selected_model: null,
      parsed_status: null,
      attempted_models: attempts,
      error: lastAttempt?.error || "All Gemini smoke attempts failed"
    },
    { status: 502 }
  );
}
