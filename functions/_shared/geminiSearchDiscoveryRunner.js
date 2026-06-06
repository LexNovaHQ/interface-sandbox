import { getGeminiModelSequence, maskConfigured, safeModelName } from "./aiProviderConfig.js";
import { buildSourceDiscoveryPrompt } from "./sourceDiscoveryPrompt.js";

const DEFAULT_MODEL = "gemini-3.1-flash-lite";
const DEFAULT_TIMEOUT_MS = 90000;
const DEFAULT_MAX_OUTPUT_TOKENS = 8192;

function createAbortSignal(timeoutMs) {
  if (typeof AbortController === "undefined") {
    return { signal: undefined, cancel: () => {} };
  }
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
  return trimmed.replace(/^```(?:json)?\\s*/i, "").replace(/\\s*```$/i, "").trim();
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
  if (!meta) {
    return {
      web_search_queries: [],
      grounding_chunks: [],
      grounding_supports: []
    };
  }
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
        parts: [
          { text: buildSourceDiscoveryPrompt(input) }
        ]
      }
    ],
    tools: [
      { google_search: {} }
    ],
    generationConfig: {
      temperature: options.temperature ?? 0,
      maxOutputTokens: options.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
      responseMimeType: "application/json"
    }
  };
}

function shouldTryNextModel(result) {
  return ["PROVIDER_ERROR", "MODEL_JSON_PARSE_ERROR", "TIMEOUT", "REQUEST_ERROR"].includes(result?.error_type);
}

async function runSingleDiscoveryAttempt({ env, model, input, options, fetchImpl }) {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const abort = createAbortSignal(timeoutMs);
  try {
    const response = await fetchImpl(buildGeminiUrl(model, env.GEMINI_API_KEY), {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: abort.signal,
      body: JSON.stringify(buildRequestBody({ input, options }))
    });

    const payload = await response.json().catch(() => null);
    const grounding = collectGroundingMetadata(payload);

    if (!response.ok) {
      return {
        ok: false,
        model,
        status: response.status,
        error_type: "PROVIDER_ERROR",
        error: payload?.error?.message || "Gemini Search discovery failed",
        grounding
      };
    }

    const rawText = extractText(payload);
    const parsed = parseJsonText(rawText);

    if (!parsed.ok) {
      return {
        ok: false,
        model,
        status: response.status,
        error_type: "MODEL_JSON_PARSE_ERROR",
        error: parsed.error,
        raw_candidate_preview: String(parsed.candidate || "").slice(0, 1200),
        grounding,
        usage_metadata: payload?.usageMetadata || null,
        finish_reason: payload?.candidates?.[0]?.finishReason || "unknown"
      };
    }

    return {
      ok: true,
      model,
      selected_model: model,
      status: response.status,
      discovery: parsed.value,
      grounding,
      usage_metadata: payload?.usageMetadata || null,
      finish_reason: payload?.candidates?.[0]?.finishReason || "unknown"
    };
  } catch (error) {
    return {
      ok: false,
      model,
      status: null,
      error_type: error?.name === "AbortError" ? "TIMEOUT" : "REQUEST_ERROR",
      error: error?.name === "AbortError" ? "Gemini Search discovery timed out after " + timeoutMs + "ms" : "Gemini Search discovery request failed"
    };
  } finally {
    abort.cancel();
  }
}
export async function runGeminiSearchDiscovery({ env = {}, input = {}, options = {}, fetchImpl = fetch }) {
  if (!maskConfigured(env.GEMINI_API_KEY)) {
    return {
      ok: false,
      error_type: "CONFIG_ERROR",
      error: "Gemini API key missing"
    };
  }

  const modelSequence = getGeminiModelSequence(env, {
    model: options.model || DEFAULT_MODEL,
    modelSequence: options.modelSequence
  }).map((model) => safeModelName(model, DEFAULT_MODEL));

  const attempted_models = [];
  let lastResult = null;

  for (const model of modelSequence) {
    const result = await runSingleDiscoveryAttempt({
      env,
      model,
      input,
      options,
      fetchImpl
    });

    attempted_models.push({
      model,
      ok: result.ok,
      status: result.status || null,
      error_type: result.error_type || null,
      error: result.error || null,
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
      error_type: "NO_MODEL_ATTEMPTED",
      error: "No Gemini Search discovery model attempts were run"
    }),
    attempted_models
  };
}
