import { config, requireGeminiConfig } from "./config.js";

const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);

export async function callGeminiJson({ prompt, phase, temperature = 0, maxOutputTokens = null, repairOnJsonParse = false } = {}) {
  requireGeminiConfig();

  const errors = [];
  const keyCount = config.geminiApiKeys.length;
  const models = config.geminiModels.length ? config.geminiModels : [config.geminiModel];
  const rounds = Math.max(1, Number(config.geminiRetryRounds || 1));
  const keysPerModel = Math.min(keyCount, Math.max(1, Number(config.geminiKeysPerModelPerRound || keyCount)));
  const effectiveMaxOutputTokens = resolveMaxOutputTokens(maxOutputTokens);

  for (let round = 0; round < rounds; round += 1) {
    for (const model of models) {
      for (let offset = 0; offset < keysPerModel; offset += 1) {
        const keyIndex = (round * keysPerModel + offset) % keyCount;
        const key = config.geminiApiKeys[keyIndex];
        try {
          const result = await callGeminiOnce({
            key,
            model,
            prompt,
            temperature,
            maxOutputTokens: effectiveMaxOutputTokens
          });
          const parsed = await parseGeminiJsonWithOptionalRepair({
            result,
            key,
            model,
            phase,
            originalPrompt: prompt,
            temperature,
            maxOutputTokens: effectiveMaxOutputTokens,
            repairOnJsonParse
          });
          return {
            json: parsed.json,
            raw_text: result.text,
            repair_raw_text: parsed.repairRawText || "",
            metadata: {
              phase,
              model,
              primary_model: config.geminiModel,
              fallback_models: models,
              retry_round: round + 1,
              key_alias: `GEMINI_API_KEYS_${keyIndex + 1}`,
              max_output_tokens_sent: effectiveMaxOutputTokens || null,
              warnings: [...buildGeminiWarnings(result), ...parsed.warnings],
              usage_metadata: result.usageMetadata,
              repair_usage_metadata: parsed.repairUsageMetadata || null,
              finish_reason: result.finishReason,
              repair_finish_reason: parsed.repairFinishReason || null
            }
          };
        } catch (error) {
          errors.push({
            phase,
            model,
            retry_round: round + 1,
            key_alias: `GEMINI_API_KEYS_${keyIndex + 1}`,
            max_output_tokens_sent: effectiveMaxOutputTokens || null,
            message: error?.message || String(error),
            status: error?.status || null,
            finish_reason: error?.finishReason || null,
            provider_error_type: providerErrorType(error)
          });
          if (!isRetryableGeminiError(error)) {
            throw new Error(`GEMINI_CALL_FAILED:${phase}:${JSON.stringify(errors)}`);
          }
        }
      }
    }

    if (round < rounds - 1) {
      await sleep(backoffDelay(round));
    }
  }

  throw new Error(`GEMINI_CALL_FAILED:${phase}:${JSON.stringify(errors)}`);
}

async function callGeminiOnce({ key, model, prompt, temperature, maxOutputTokens }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.geminiTimeoutMs);

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
    const generationConfig = {
      temperature,
      responseMimeType: "application/json"
    };
    if (Number.isFinite(Number(maxOutputTokens)) && Number(maxOutputTokens) > 0) {
      generationConfig.maxOutputTokens = Math.floor(Number(maxOutputTokens));
    }

    const response = await fetch(endpoint, {
      method: "POST",
      signal: controller.signal,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig
      })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(payload?.error?.message || `GEMINI_HTTP_${response.status}`);
      error.status = response.status;
      error.payload = payload;
      throw error;
    }

    const candidate = payload?.candidates?.[0] || {};
    const text = candidate?.content?.parts?.map((part) => part.text || "").join("") || "";
    const finishReason = candidate?.finishReason || null;
    if (!text.trim()) {
      const emptyError = new Error("GEMINI_EMPTY_RESPONSE");
      emptyError.finishReason = finishReason;
      throw emptyError;
    }

    return {
      text,
      finishReason,
      usageMetadata: payload?.usageMetadata || null
    };
  } catch (error) {
    if (error?.name === "AbortError") {
      const timeoutError = new Error("GEMINI_TIMEOUT");
      timeoutError.status = 408;
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function parseJsonFromText(text) {
  const raw = String(text || "").replace(/^\uFEFF/, "").trim();
  if (!raw) throw new Error("MODEL_JSON_PARSE_FAILED:empty");

  const attempts = [];
  attempts.push(raw);

  const fencedMatches = [...raw.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)];
  for (const match of fencedMatches) {
    if (match?.[1]) attempts.push(match[1].trim());
  }

  const unfenced = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  if (unfenced && unfenced !== raw) attempts.push(unfenced);

  const errors = [];
  for (const candidate of uniqueStrings(attempts)) {
    try {
      return JSON.parse(candidate);
    } catch (error) {
      errors.push(error?.message || String(error));
    }
    const firstJson = extractFirstBalancedJson(candidate);
    if (firstJson) {
      try {
        return JSON.parse(firstJson);
      } catch (error) {
        errors.push(error?.message || String(error));
      }
    }
  }

  throw new Error(`MODEL_JSON_PARSE_FAILED:${errors[0] || "no_json_object"}`);
}

async function parseGeminiJsonWithOptionalRepair({ result, key, model, phase, originalPrompt, temperature, maxOutputTokens, repairOnJsonParse }) {
  const warnings = [];
  try {
    return { json: parseGeminiJsonOrThrow(result), warnings };
  } catch (error) {
    if (result?.finishReason === "MAX_TOKENS") {
      error.finishReason = "MAX_TOKENS";
      error.status = 408;
      error.message = `MODEL_JSON_PARSE_FAILED_AFTER_MAX_TOKENS:${error.message || String(error)}`;
      throw error;
    }
    if (!repairOnJsonParse) throw error;

    const repairPrompt = buildJsonRepairPrompt({ phase, originalPrompt, malformedText: result.text, parseError: error?.message || String(error) });
    const repaired = await callGeminiOnce({
      key,
      model,
      prompt: repairPrompt,
      temperature: 0,
      maxOutputTokens
    });
    try {
      const json = parseGeminiJsonOrThrow(repaired);
      warnings.push({
        code: "MODEL_JSON_REPAIR_RETRY_USED",
        severity: "warning",
        message: "Initial model response was not strict JSON; a single JSON-only repair retry parsed successfully."
      });
      return {
        json,
        warnings,
        repairRawText: repaired.text,
        repairUsageMetadata: repaired.usageMetadata,
        repairFinishReason: repaired.finishReason
      };
    } catch (repairError) {
      repairError.message = `MODEL_JSON_REPAIR_FAILED:${repairError.message || String(repairError)}`;
      if (repaired?.finishReason === "MAX_TOKENS") {
        repairError.finishReason = "MAX_TOKENS";
        repairError.status = 408;
      }
      throw repairError;
    }
  }
}

function parseGeminiJsonOrThrow(result) {
  try {
    return parseJsonFromText(result.text);
  } catch (error) {
    if (result?.finishReason === "MAX_TOKENS") {
      error.finishReason = "MAX_TOKENS";
      error.status = 408;
      error.message = `MODEL_JSON_PARSE_FAILED_AFTER_MAX_TOKENS:${error.message || String(error)}`;
    }
    throw error;
  }
}

function extractFirstBalancedJson(value) {
  const text = String(value || "");
  const start = findFirstJsonStart(text);
  if (start < 0) return "";

  const opener = text[start];
  const closer = opener === "{" ? "}" : "]";
  const stack = [closer];
  let inString = false;
  let escaped = false;

  for (let i = start + 1; i < text.length; i += 1) {
    const ch = text[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "{") stack.push("}");
    else if (ch === "[") stack.push("]");
    else if (ch === "}" || ch === "]") {
      const expected = stack.pop();
      if (ch !== expected) return "";
      if (stack.length === 0) return text.slice(start, i + 1);
    }
  }
  return "";
}

function findFirstJsonStart(text) {
  const object = text.indexOf("{");
  const array = text.indexOf("[");
  if (object < 0) return array;
  if (array < 0) return object;
  return Math.min(object, array);
}

function buildJsonRepairPrompt({ phase, originalPrompt, malformedText, parseError }) {
  return [
    `You are repairing malformed JSON for phase ${phase}.`,
    "Return exactly one valid JSON object. No markdown. No code fence. No explanation. No trailing prose. No second JSON object.",
    "Preserve the original keys, values, arrays, and schema intent. Do not add legal analysis. Do not summarize.",
    `Parser error: ${parseError}`,
    "Original task context follows for schema reference:",
    originalPrompt,
    "Malformed model output to repair follows:",
    malformedText
  ].join("\n\n");
}

function uniqueStrings(values) {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
}

function resolveMaxOutputTokens(requested) {
  if (Number.isFinite(Number(requested)) && Number(requested) > 0) return Math.floor(Number(requested));
  if (Number.isFinite(Number(config.geminiMaxOutputTokens)) && Number(config.geminiMaxOutputTokens) > 0) {
    return Math.floor(Number(config.geminiMaxOutputTokens));
  }
  return null;
}

function buildGeminiWarnings(result) {
  const warnings = [];
  if (result?.finishReason === "MAX_TOKENS") {
    warnings.push({
      code: "GEMINI_FINISH_REASON_MAX_TOKENS",
      severity: "warning",
      message: "Gemini reported MAX_TOKENS, but JSON parsed successfully, so the run was not blocked."
    });
  }
  return warnings;
}

function isRetryableGeminiError(error) {
  const status = Number(error?.status || 0);
  const message = String(error?.message || "").toLowerCase();
  return RETRYABLE_STATUS.has(status) || message.includes("quota") || message.includes("rate") || message.includes("timeout") || message.includes("high demand") || message.includes("temporarily unavailable") || error?.finishReason === "MAX_TOKENS";
}

function providerErrorType(error) {
  const status = Number(error?.status || 0);
  const message = String(error?.message || "").toLowerCase();
  if (error?.finishReason === "MAX_TOKENS" || message.includes("max_tokens") || message.includes("max tokens")) return "TOKEN_LIMIT";
  if (message.includes("model_json_repair_failed") || message.includes("model_json_parse_failed")) return "MODEL_JSON_PARSE";
  if (status === 503 || message.includes("high demand") || message.includes("temporarily unavailable")) return "PROVIDER_CAPACITY";
  if (status === 429 || message.includes("quota") || message.includes("rate")) return "RATE_OR_QUOTA";
  if (status === 408 || message.includes("timeout")) return "TIMEOUT";
  if (status >= 500) return "PROVIDER_5XX";
  if (status >= 400) return "CLIENT_OR_CONFIG";
  return "UNKNOWN";
}

function backoffDelay(round) {
  const base = Number(config.geminiRetryBaseDelayMs || 0);
  const max = Number(config.geminiRetryMaxDelayMs || base);
  const exponential = base * Math.pow(2, round);
  const jitter = Math.floor(Math.random() * Math.max(1, base));
  return Math.min(max, exponential + jitter);
}

function sleep(ms) {
  const duration = Math.max(0, Number(ms || 0));
  if (!duration) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, duration));
}
