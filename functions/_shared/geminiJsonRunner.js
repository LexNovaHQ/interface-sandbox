import { maskConfigured } from "./aiProviderConfig.js";
import { resolveModelRole } from "./modelRoleConfig.js";
import { classifyGeminiProviderError, getRoleAttempts, shouldTryNextProviderAttempt } from "./providerKeyPool.js";

const DEFAULT_TIMEOUT_MS = 90000;
const DEFAULT_MAX_OUTPUT_TOKENS = 8192;

function buildGeminiUrl(model, apiKey) {
  const url = new URL("https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model) + ":generateContent");
  url.searchParams.set("key", apiKey);
  return url.toString();
}

function createAbortSignal(timeoutMs) {
  if (typeof AbortController === "undefined") return { signal: undefined, cancel: () => {} };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return { signal: controller.signal, cancel: () => clearTimeout(timer) };
}

function extractGeminiText(payload) {
  const parts = payload?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return "";
  return parts.map((part) => (typeof part?.text === "string" ? part.text : "")).join("").trim();
}

function stripJsonFences(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed.startsWith("```")) return trimmed;
  return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

function extractJsonCandidate(text) {
  const stripped = stripJsonFences(text);
  if (stripped.startsWith("{") || stripped.startsWith("[")) return stripped;

  const objectStart = stripped.indexOf("{");
  const arrayStart = stripped.indexOf("[");
  const starts = [objectStart, arrayStart].filter((index) => index >= 0);
  if (!starts.length) return stripped;

  const start = Math.min(...starts);
  const closeChar = stripped[start] === "{" ? "}" : "]";
  const end = stripped.lastIndexOf(closeChar);
  return end > start ? stripped.slice(start, end + 1).trim() : stripped;
}

export function parseGeminiJsonText(text) {
  const candidate = extractJsonCandidate(text);
  try {
    return { ok: true, parsed: JSON.parse(candidate), candidate };
  } catch (error) {
    return { ok: false, parsed: null, candidate, error: error.message };
  }
}

function buildPromptInput({ stageId, prompt, input }) {
  return `${prompt.trim()}

---

Return valid JSON only. Do not include Markdown fences or commentary outside JSON.

---INPUT_JSON---
${JSON.stringify({ stage_id: stageId, input }, null, 2)}`;
}

function buildRequestBody({ stageId, prompt, input, options }) {
  return {
    contents: [
      {
        role: "user",
        parts: [{ text: buildPromptInput({ stageId, prompt, input }) }]
      }
    ],
    generationConfig: {
      temperature: options.temperature ?? 0,
      maxOutputTokens: options.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
      responseMimeType: "application/json"
    }
  };
}

function diagnosticsFromPayload(payload) {
  const candidate = payload?.candidates?.[0] || null;
  const parts = candidate?.content?.parts || [];
  return {
    candidate_count: Array.isArray(payload?.candidates) ? payload.candidates.length : 0,
    finish_reason: candidate?.finishReason || "unknown",
    parts_count: Array.isArray(parts) ? parts.length : 0,
    usage_metadata: payload?.usageMetadata || null
  };
}
async function runSingleJsonAttempt({ env, stageId, prompt, input, options, fetchImpl, attempt }) {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const abort = createAbortSignal(timeoutMs);

  try {
    const response = await fetchImpl(buildGeminiUrl(attempt.model, attempt.apiKey), {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: abort.signal,
      body: JSON.stringify(buildRequestBody({ stageId, prompt, input, options }))
    });

    const providerPayload = await response.json().catch(() => null);

    if (!response.ok) {
      const providerMessage = providerPayload?.error?.message || "Gemini request failed";
      return {
        ok: false,
        provider: "gemini",
        stage_id: stageId,
        model: attempt.model,
        selected_model: attempt.model,
        selected_key_alias: attempt.key_alias,
        pool: attempt.pool,
        configured: true,
        status: response.status,
        error_type: classifyGeminiProviderError(response.status, providerMessage),
        error: providerMessage,
        diagnostics: diagnosticsFromPayload(providerPayload)
      };
    }

    const rawText = extractGeminiText(providerPayload);
    const parsed = parseGeminiJsonText(rawText);

    if (!parsed.ok) {
      return {
        ok: false,
        provider: "gemini",
        stage_id: stageId,
        model: attempt.model,
        selected_model: attempt.model,
        selected_key_alias: attempt.key_alias,
        pool: attempt.pool,
        configured: true,
        status: response.status,
        error_type: "MODEL_JSON_PARSE_ERROR",
        error: parsed.error,
        finish_reason: providerPayload?.candidates?.[0]?.finishReason || "unknown",
        usage_metadata: providerPayload?.usageMetadata || null,
        diagnostics: diagnosticsFromPayload(providerPayload)
      };
    }

    return {
      ok: true,
      provider: "gemini",
      stage_id: stageId,
      model: attempt.model,
      selected_model: attempt.model,
      selected_key_alias: attempt.key_alias,
      pool: attempt.pool,
      configured: true,
      status: response.status,
      parsed_json: parsed.parsed,
      finish_reason: providerPayload?.candidates?.[0]?.finishReason || "unknown",
      usage_metadata: providerPayload?.usageMetadata || null,
      diagnostics: diagnosticsFromPayload(providerPayload)
    };
  } catch (error) {
    return {
      ok: false,
      provider: "gemini",
      stage_id: stageId,
      model: attempt.model,
      selected_model: attempt.model,
      selected_key_alias: attempt.key_alias,
      pool: attempt.pool,
      configured: true,
      error_type: error?.name === "AbortError" ? "TIMEOUT" : "REQUEST_ERROR",
      error: error?.name === "AbortError" ? "Gemini request timed out after " + timeoutMs + "ms" : "Gemini request failed"
    };
  } finally {
    abort.cancel();
  }
}
export async function runGeminiJsonStage({ env = {}, stageId, prompt, input, options = {}, fetchImpl = fetch }) {
  const normalizedStageId = String(stageId || "").trim();

  if (!normalizedStageId) {
    return { ok: false, provider: "gemini", error_type: "INPUT_ERROR", error: "stageId is required" };
  }

  if (!prompt || typeof prompt !== "string") {
    return {
      ok: false,
      provider: "gemini",
      stage_id: normalizedStageId,
      error_type: "INPUT_ERROR",
      error: "prompt must be a non-empty string"
    };
  }

  const modelRole = resolveModelRole(normalizedStageId, options);
  const preferredModel = options.model || "";
  const { roleConfig, attempts } = getRoleAttempts({
    env,
    role: modelRole,
    preferredModel
  });

  if (!attempts.length) {
    return {
      ok: false,
      provider: "gemini",
      stage_id: normalizedStageId,
      model_role: modelRole,
      pool: roleConfig.pool,
      configured: false,
      error_type: "CONFIG_ERROR",
      error: "No Gemini API keys configured for role " + modelRole + " using " + roleConfig.keysEnv
    };
  }

  const attempted_providers = [];
  let lastResult = null;

  for (const attempt of attempts) {
    if (!maskConfigured(attempt.apiKey)) continue;

    const result = await runSingleJsonAttempt({
      env,
      stageId: normalizedStageId,
      prompt,
      input,
      options,
      fetchImpl,
      attempt
    });

    attempted_providers.push({
      provider: "gemini",
      pool: attempt.pool,
      key_alias: attempt.key_alias,
      model: attempt.model,
      ok: result.ok,
      status: result.status || null,
      error_type: result.error_type || null,
      error: result.error || null,
      finish_reason: result.finish_reason || result.diagnostics?.finish_reason || null
    });

    if (result.ok) {
      return {
        ...result,
        model_role: modelRole,
        attempted_providers,
        attempted_models: attempted_providers
      };
    }

    lastResult = result;
    if (!shouldTryNextProviderAttempt(result)) break;
  }

  return {
    ...(lastResult || {
      ok: false,
      provider: "gemini",
      stage_id: normalizedStageId,
      configured: true,
      error_type: "NO_PROVIDER_ATTEMPTED",
      error: "No Gemini provider attempts were run"
    }),
    model_role: modelRole,
    attempted_providers,
    attempted_models: attempted_providers
  };
}
