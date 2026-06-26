import { config, requireGeminiConfig } from "./config.js";

const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);

export async function callGeminiJson({ prompt, phase, temperature = 0, maxOutputTokens = null } = {}) {
  requireGeminiConfig();

  const errors = [];
  const keyCount = config.geminiApiKeys.length;
  const models = config.geminiModels.length ? config.geminiModels : [config.geminiModel];
  const rounds = Math.max(1, Number(config.geminiRetryRounds || 1));
  const keysPerModel = Math.min(keyCount, Math.max(1, Number(config.geminiKeysPerModelPerRound || keyCount)));

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
            maxOutputTokens
          });
          return {
            json: parseJsonFromText(result.text),
            raw_text: result.text,
            metadata: {
              phase,
              model,
              primary_model: config.geminiModel,
              fallback_models: models,
              retry_round: round + 1,
              key_alias: `GEMINI_API_KEYS_${keyIndex + 1}`,
              usage_metadata: result.usageMetadata,
              finish_reason: result.finishReason
            }
          };
        } catch (error) {
          errors.push({
            phase,
            model,
            retry_round: round + 1,
            key_alias: `GEMINI_API_KEYS_${keyIndex + 1}`,
            message: error?.message || String(error),
            status: error?.status || null,
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
    if (!text.trim()) {
      throw new Error("GEMINI_EMPTY_RESPONSE");
    }

    return {
      text,
      finishReason: candidate?.finishReason || null,
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
  const raw = String(text || "").trim();
  if (!raw) throw new Error("MODEL_JSON_PARSE_FAILED:empty");

  try {
    return JSON.parse(raw);
  } catch (_first) {
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced?.[1]) {
      return JSON.parse(fenced[1].trim());
    }

    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(raw.slice(start, end + 1));
    }

    throw new Error("MODEL_JSON_PARSE_FAILED:no_json_object");
  }
}

function isRetryableGeminiError(error) {
  const status = Number(error?.status || 0);
  const message = String(error?.message || "").toLowerCase();
  return RETRYABLE_STATUS.has(status) || message.includes("quota") || message.includes("rate") || message.includes("timeout") || message.includes("high demand") || message.includes("temporarily unavailable");
}

function providerErrorType(error) {
  const status = Number(error?.status || 0);
  const message = String(error?.message || "").toLowerCase();
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
