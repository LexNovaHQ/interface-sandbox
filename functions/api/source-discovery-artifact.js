import { buildSourceDiscoveryArtifactPrompt } from "../_shared/sourceDiscoveryArtifactPrompt.js";
import { classifyGeminiProviderError, getRoleAttempts } from "../_shared/providerKeyPool.js";
import { jsonResponse, methodNotAllowed } from "../_shared/response.js";

const DEFAULT_TIMEOUT_MS = 7500;
const DEFAULT_MAX_OUTPUT_TOKENS = 2048;

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function clampNumber(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
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

function buildRequestBody(input, options = {}) {
  return {
    contents: [
      {
        role: "user",
        parts: [{ text: buildSourceDiscoveryArtifactPrompt(input) }]
      }
    ],
    tools: [{ google_search: {} }],
    generationConfig: {
      temperature: 0,
      maxOutputTokens: options.maxOutputTokens || DEFAULT_MAX_OUTPUT_TOKENS
    }
  };
}

function normalizeInput(value = {}) {
  return {
    primary_url: cleanString(value.primary_url || value.url || value.target_url || value.website),
    company_name: cleanString(value.company_name || value.companyName) || null,
    product_context: cleanString(value.product_context || value.productDesc) || null,
    artifact_type: cleanString(value.artifact_type || value.artifactType),
    source_zone: cleanString(value.source_zone || value.sourceZone || "unknown"),
    attempt_offset: Number(value.attempt_offset || value.attemptOffset || 0) || 0
  };
}

function orderAttempts(attempts, offset) {
  if (!attempts.length) return [];
  const normalizedOffset = Math.abs(Number(offset) || 0) % attempts.length;
  return [...attempts.slice(normalizedOffset), ...attempts.slice(0, normalizedOffset)];
}

function publicStatus(errorType) {
  if (errorType === "INPUT_ERROR") return 400;
  if (errorType === "CONFIG_ERROR") return 503;
  if (errorType === "TIMEOUT") return 504;
  if (errorType === "AUTH_OR_PERMISSION_ERROR") return 502;
  if (errorType === "RATE_LIMIT_OR_QUOTA") return 502;
  return 502;
}

async function runAttempt({ attempt, input, options, fetchImpl }) {
  const timeoutMs = clampNumber(options.timeoutMs ?? options.timeout_ms, DEFAULT_TIMEOUT_MS, 3000, 9000);
  const abort = createAbortSignal(timeoutMs);

  try {
    const response = await fetchImpl(buildGeminiUrl(attempt.model, attempt.apiKey), {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: abort.signal,
      body: JSON.stringify(buildRequestBody(input, options))
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
      const providerMessage = payload?.error?.message || responseText.slice(0, 800) || "Gemini artifact discovery failed";
      return {
        ok: false,
        error_type: classifyGeminiProviderError(response.status, providerMessage),
        error: providerMessage,
        status: response.status,
        grounding
      };
    }

    const rawText = extractText(payload);
    const parsed = parseJsonText(rawText);
    if (!parsed.ok) {
      return {
        ok: false,
        error_type: "MODEL_JSON_PARSE_ERROR",
        error: parsed.error,
        status: response.status,
        raw_candidate_preview: String(parsed.candidate || rawText || "").slice(0, 1200),
        grounding
      };
    }

    return {
      ok: true,
      parsed_json: parsed.value,
      grounding,
      status: response.status,
      usage_metadata: payload?.usageMetadata || null,
      finish_reason: payload?.candidates?.[0]?.finishReason || "unknown"
    };
  } catch (error) {
    return {
      ok: false,
      error_type: error?.name === "AbortError" ? "TIMEOUT" : "REQUEST_ERROR",
      error: error?.name === "AbortError" ? `Artifact discovery timed out after ${timeoutMs}ms` : (error?.message || "Artifact discovery request failed"),
      status: null
    };
  } finally {
    abort.cancel();
  }
}

async function handlePost(context) {
  let body;
  try {
    body = await context.request.json();
  } catch {
    return jsonResponse({ ok: false, service: "source-discovery-artifact", error_type: "INPUT_ERROR", error: "Request body must be JSON" }, { status: 400 });
  }

  const input = normalizeInput(body?.input || body || {});
  const options = body?.options || {};

  if (!input.primary_url || !input.artifact_type) {
    return jsonResponse({
      ok: false,
      service: "source-discovery-artifact",
      error_type: "INPUT_ERROR",
      error: "source-discovery-artifact requires primary_url and artifact_type"
    }, { status: 400 });
  }

  const { roleConfig, attempts } = getRoleAttempts({
    env: context.env || {},
    role: "search",
    preferredModel: options.model || ""
  });

  if (!attempts.length) {
    return jsonResponse({
      ok: false,
      service: "source-discovery-artifact",
      error_type: "CONFIG_ERROR",
      error: "No Gemini Search API keys configured using " + roleConfig.keysEnv
    }, { status: 503 });
  }

  const maxAttempts = clampNumber(options.maxAttempts ?? options.max_attempts, 1, 1, 2);
  const orderedAttempts = orderAttempts(attempts, input.attempt_offset).slice(0, maxAttempts);
  const attempted_models = [];
  let lastResult = null;

  for (const attempt of orderedAttempts) {
    const result = await runAttempt({ attempt, input, options, fetchImpl: fetch });
    attempted_models.push({
      provider: "gemini",
      pool: attempt.pool,
      key_alias: attempt.key_alias,
      model: attempt.model,
      ok: result.ok,
      status: result.status || null,
      error_type: result.error_type || null,
      error: result.error || null
    });

    if (result.ok) {
      return jsonResponse({
        ok: true,
        service: "source-discovery-artifact",
        model_role: "search",
        pool: attempt.pool,
        selected_model: attempt.model,
        selected_key_alias: attempt.key_alias,
        artifact_type: input.artifact_type,
        source_zone: input.source_zone,
        discovery: result.parsed_json,
        grounding: result.grounding,
        attempted_models,
        usage_metadata: result.usage_metadata || null,
        finish_reason: result.finish_reason || null
      });
    }

    lastResult = result;
    if (!["RATE_LIMIT_OR_QUOTA", "PROVIDER_ERROR", "REQUEST_ERROR", "TIMEOUT"].includes(result.error_type)) break;
  }

  return jsonResponse({
    ok: false,
    service: "source-discovery-artifact",
    model_role: "search",
    artifact_type: input.artifact_type,
    source_zone: input.source_zone,
    error_type: lastResult?.error_type || "ARTIFACT_DISCOVERY_FAILED",
    error: lastResult?.error || "Artifact discovery failed",
    attempted_models
  }, { status: publicStatus(lastResult?.error_type) });
}

export async function onRequest(context) {
  if (context.request.method !== "POST") return methodNotAllowed(["POST"]);
  try {
    return await handlePost(context);
  } catch (error) {
    return jsonResponse({
      ok: false,
      service: "source-discovery-artifact",
      error_type: "SOURCE_DISCOVERY_ARTIFACT_RUNTIME_ERROR",
      error: error?.message || String(error)
    }, { status: 500 });
  }
}
