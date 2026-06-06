import { maskConfigured } from "./aiProviderConfig.js";

const DEFAULT_MODEL = "gemini-3.5-flash";
const DEFAULT_TIMEOUT_MS = 90000;
const DEFAULT_MAX_OUTPUT_TOKENS = 8192;

function safeModelName(model) {
  return String(model || DEFAULT_MODEL).replace(/^models\//, "");
}

function buildGeminiUrl(model, apiKey) {
  const url = new URL(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`
  );
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
  return `${prompt.trim()}\n\n---\n\nReturn valid JSON only. Do not include Markdown fences or commentary outside JSON.\n\n---INPUT_JSON---\n${JSON.stringify(
    { stage_id: stageId, input },
    null,
    2
  )}`;
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

export async function runGeminiJsonStage({ env = {}, stageId, prompt, input, options = {}, fetchImpl = fetch }) {
  const normalizedStageId = String(stageId || "").trim();
  const model = safeModelName(options.model || env.GEMINI_PRIMARY_MODEL || DEFAULT_MODEL);

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

  if (!maskConfigured(env.GEMINI_API_KEY)) {
    return {
      ok: false,
      provider: "gemini",
      stage_id: normalizedStageId,
      model,
      configured: false,
      error_type: "CONFIG_ERROR",
      error: "Gemini key missing"
    };
  }

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const abort = createAbortSignal(timeoutMs);

  try {
    const response = await fetchImpl(buildGeminiUrl(model, env.GEMINI_API_KEY), {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: abort.signal,
      body: JSON.stringify(buildRequestBody({ stageId: normalizedStageId, prompt, input, options }))
    });

    const providerPayload = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        ok: false,
        provider: "gemini",
        stage_id: normalizedStageId,
        model,
        configured: true,
        status: response.status,
        error_type: "PROVIDER_ERROR",
        error: providerPayload?.error?.message || "Gemini request failed"
      };
    }

    const rawText = extractGeminiText(providerPayload);
    const parsed = parseGeminiJsonText(rawText);

    if (!parsed.ok) {
      return {
        ok: false,
        provider: "gemini",
        stage_id: normalizedStageId,
        model,
        configured: true,
        status: response.status,
        error_type: "MODEL_JSON_PARSE_ERROR",
        error: parsed.error,
        finish_reason: providerPayload?.candidates?.[0]?.finishReason || "unknown",
        usage_metadata: providerPayload?.usageMetadata || null
      };
    }

    return {
      ok: true,
      provider: "gemini",
      stage_id: normalizedStageId,
      model,
      configured: true,
      status: response.status,
      parsed_json: parsed.parsed,
      finish_reason: providerPayload?.candidates?.[0]?.finishReason || "unknown",
      usage_metadata: providerPayload?.usageMetadata || null
    };
  } catch (error) {
    return {
      ok: false,
      provider: "gemini",
      stage_id: normalizedStageId,
      model,
      configured: true,
      error_type: error?.name === "AbortError" ? "TIMEOUT" : "REQUEST_ERROR",
      error: error?.name === "AbortError" ? `Gemini request timed out after ${timeoutMs}ms` : "Gemini request failed"
    };
  } finally {
    abort.cancel();
  }
}
