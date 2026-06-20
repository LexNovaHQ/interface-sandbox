import { runGeminiJsonStage } from "../_shared/geminiJsonRunner.js";
import { jsonResponse, methodNotAllowed } from "../_shared/response.js";

const SMOKE_PROMPT = "Return exactly this JSON object and nothing else: {\"status\":\"ok\",\"message\":\"provider pool smoke passed\"}";

async function readBody(request) {
  return request.json().catch(() => ({}));
}

export async function onRequest(context) {
  try {
    if (context.request.method !== "POST") {
      return methodNotAllowed(["POST"]);
    }

    const body = await readBody(context.request);
    const options = body?.options || {};

    const result = await runGeminiJsonStage({
      env: context.env || {},
      stageId: "ai_smoke_test",
      prompt: SMOKE_PROMPT,
      input: {
        run_id: body?.run_id || "provider-pool-smoke",
        expected_status: "ok"
      },
      options: {
        ...options,
        modelRole: "json",
        maxAttempts: options.maxAttempts ?? 1,
        timeoutMs: options.timeoutMs ?? 15000,
        maxOutputTokens: options.maxOutputTokens ?? 256,
        temperature: options.temperature ?? 0
      }
    });

    return jsonResponse({
      ok: Boolean(result.ok),
      service: "provider-pool-smoke",
      model_role: result.model_role || null,
      pool: result.pool || null,
      selected_model: result.selected_model || result.model || null,
      selected_key_alias: result.selected_key_alias || null,
      attempt_policy: result.attempt_policy || null,
      attempted_providers: result.attempted_providers || [],
      parsed_json: result.parsed_json || null,
      error_type: result.error_type || null,
      error: result.error || null
    }, { status: result.ok ? 200 : 502 });
  } catch (error) {
    return jsonResponse({
      ok: false,
      service: "provider-pool-smoke",
      error_type: "PROVIDER_POOL_SMOKE_RUNTIME_ERROR",
      error_name: error?.name || "Error",
      error: error?.message || String(error),
      stack_preview: String(error?.stack || "").split("\n").slice(0, 8)
    }, { status: 500 });
  }
}