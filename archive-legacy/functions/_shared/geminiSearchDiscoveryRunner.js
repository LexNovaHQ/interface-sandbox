import { buildSourceDiscoveryPrompt } from "./sourceDiscoveryPrompt.js";
import { guardSourceDiscoveryOutput } from "./sourceDiscoveryOutputGuard.js";
import { classifyGeminiProviderError, getRoleAttempts, shouldTryNextProviderAttempt } from "./providerKeyPool.js";

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_MAX_OUTPUT_TOKENS = 8192;

function clampNumber(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

function getSearchAttemptPolicy(options = {}) {
  return {
    model_role: "search",
    max_attempts: clampNumber(options.maxAttempts ?? options.max_attempts, 1, 1, 2),
    attempt_timeout_ms: clampNumber(options.timeoutMs ?? options.timeout_ms, DEFAULT_TIMEOUT_MS, 5000, 15000)
  };
}

function createAbortSignal(timeoutMs) {
  if (typeof AbortController === "undefined") return { signal: undefined, cancel: () => {} };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return { signal: controller.signal, cancel: () => clearTimeout(timer) };
}

function buildGeminiUrl(model, apiKey) {
  const url = new URL("https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model) + ":generateContent");
  url.searchParams.set("key", apiKey);
  return url.toString();
}

function extractText(payload) {
  const parts = payload?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return "";
  return parts.map((part) => typeof part?.text === "string" ? part.text : "").join("").trim();
}

function stripJsonFences(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed.startsWith("```")) return trimmed;
  return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

function parseJsonText(text) {
  const stripped = stripJsonFences(text);
  const start = stripped.indexOf("{");
  const end = stripped.lastIndexOf("}");
  const candidate = start >= 0 && end > start ? stripped.slice(start, end + 1) : stripped;
  try {
    return { ok: true, value: JSON.parse(candidate), error: null, candidate };
  } catch (error) {
    return { ok: false, value: null, error: error.message, candidate };
  }
}

function collectGroundingMetadata(payload) {
  const candidate = payload?.candidates?.[0] || null;
  const meta = candidate?.groundingMetadata || candidate?.grounding_metadata || null;
  if (!meta) return { web_search_queries: [], grounding_chunks: [], grounding_supports: [] };
  return {
    web_search_queries: meta.webSearchQueries || meta.web_search_queries || [],
    grounding_chunks: meta.groundingChunks || meta.grounding_chunks || [],
    grounding_supports: meta.groundingSupports || meta.grounding_supports || []
  };
}

function buildRequestBody({ input, options = {} }) {
  return {
    contents: [
      {
        role: "user",
        parts: [{ text: buildSourceDiscoveryPrompt(input) }]
      }
    ],
    tools: [{ google_search: {} }],
    generationConfig: {
      temperature: options.temperature ?? 0,
      maxOutputTokens: options.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS
    }
  };
}

async function runSingleDiscoveryAttempt({ attempt, input, options, fetchImpl, attemptPolicy }) {
  const timeoutMs = attemptPolicy.attempt_timeout_ms;
  const abort = createAbortSignal(timeoutMs);

  try {
    const response = await fetchImpl(buildGeminiUrl(attempt.model, attempt.apiKey), {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: abort.signal,
      body: JSON.stringify(buildRequestBody({ input, options }))
    });

    const responseText = await response.text().catch(() => "");
    let payload = null;
    try {
      payload = responseText ? JSON.parse(responseText) : null;
    } catch {
      payload = null;
    }

    const grounding = collectGroundingMetadata(payload);

    if (!response.ok) {
      const providerMessage = payload?.error?.message || responseText.slice(0, 800) || "Gemini Search discovery failed";
      return {
        ok: false,
        provider: "gemini",
        model: attempt.model,
        selected_model: attempt.model,
        selected_key_alias: attempt.key_alias,
        pool: attempt.pool,
        status: response.status,
        error_type: classifyGeminiProviderError(response.status, providerMessage),
        error: providerMessage,
        raw_provider_preview: responseText.slice(0, 1200),
        grounding
      };
    }

    const rawText = extractText(payload);
    const parsed = parseJsonText(rawText);

    if (!parsed.ok) {
      return {
        ok: false,
        provider: "gemini",
        model: attempt.model,
        selected_model: attempt.model,
        selected_key_alias: attempt.key_alias,
        pool: attempt.pool,
        status: response.status,
        error_type: "MODEL_JSON_PARSE_ERROR",
        error: parsed.error,
        raw_candidate_preview: String(parsed.candidate || rawText || "").slice(0, 1200),
        grounding,
        usage_metadata: payload?.usageMetadata || null,
        finish_reason: payload?.candidates?.[0]?.finishReason || "unknown"
      };
    }

    const guarded = guardSourceDiscoveryOutput(parsed.value, { grounding });

    return {
      ok: true,
      provider: "gemini",
      model: attempt.model,
      selected_model: attempt.model,
      selected_key_alias: attempt.key_alias,
      pool: attempt.pool,
      status: response.status,
      discovery: guarded.discovery,
      quality_status: guarded.quality_status,
      scout_quality: guarded.scout_quality,
      grounding,
      usage_metadata: payload?.usageMetadata || null,
      finish_reason: payload?.candidates?.[0]?.finishReason || "unknown"
    };
  } catch (error) {
    return {
      ok: false,
      provider: "gemini",
      model: attempt.model,
      selected_model: attempt.model,
      selected_key_alias: attempt.key_alias,
      pool: attempt.pool,
      status: null,
      error_type: error?.name === "AbortError" ? "TIMEOUT" : "REQUEST_ERROR",
      error: error?.name === "AbortError" ? "Gemini Search discovery timed out after " + timeoutMs + "ms" : (error?.message || "Gemini Search discovery request failed")
    };
  } finally {
    abort.cancel();
  }
}

export async function runGeminiSearchDiscovery({ env = {}, input = {}, options = {}, fetchImpl = fetch }) {
  const attemptPolicy = getSearchAttemptPolicy(options);
  const preferredModel = options.model || "";
  const { roleConfig, attempts } = getRoleAttempts({
    env,
    role: "search",
    preferredModel
  });

  if (!attempts.length) {
    return {
      ok: false,
      provider: "gemini",
      model_role: "search",
      pool: roleConfig.pool,
      configured: false,
      attempt_policy: attemptPolicy,
      error_type: "CONFIG_ERROR",
      error: "No Gemini Search API keys configured using " + roleConfig.keysEnv
    };
  }

  const attempted_models = [];
  let lastResult = null;
  const cappedAttempts = attempts.slice(0, attemptPolicy.max_attempts);

  for (const attempt of cappedAttempts) {
    const result = await runSingleDiscoveryAttempt({
      attempt,
      input,
      options,
      fetchImpl,
      attemptPolicy
    });

    attempted_models.push({
      provider: "gemini",
      pool: attempt.pool,
      key_alias: attempt.key_alias,
      model: attempt.model,
      ok: result.ok,
      status: result.status || null,
      error_type: result.error_type || null,
      error: result.error || null,
      finish_reason: result.finish_reason || null
    });

    if (result.ok) {
      return {
        ...result,
        model_role: "search",
        attempt_policy: attemptPolicy,
        selected_model: attempt.model,
        attempted_models
      };
    }

    lastResult = result;
    if (!shouldTryNextProviderAttempt(result)) break;
  }

  return {
    ...(lastResult || {
      ok: false,
      provider: "gemini",
      error_type: "NO_MODEL_ATTEMPTED",
      error: "No Gemini Search discovery attempts were run"
    }),
    model_role: "search",
    attempt_policy: attemptPolicy,
    attempted_models
  };
}
