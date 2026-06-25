import { config, requireGeminiConfig } from "./config.js";

const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);

export async function callGeminiJson({ prompt, phase, temperature = 0, maxOutputTokens = null } = {}) {
  requireGeminiConfig();

  const errors = [];
  for (let index = 0; index < config.geminiApiKeys.length; index += 1) {
    const key = config.geminiApiKeys[index];
    try {
      const result = await callGeminiOnce({
        key,
        model: config.geminiModel,
        prompt,
        temperature,
        maxOutputTokens
      });
      return {
        json: parseJsonFromText(result.text),
        raw_text: result.text,
        metadata: {
          phase,
          model: config.geminiModel,
          key_alias: `GEMINI_API_KEYS_${index + 1}`,
          usage_metadata: result.usageMetadata,
          finish_reason: result.finishReason
        }
      };
    } catch (error) {
      errors.push({
        key_alias: `GEMINI_API_KEYS_${index + 1}`,
        message: error?.message || String(error),
        status: error?.status || null
      });
      if (!isRetryableGeminiError(error)) break;
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
  return RETRYABLE_STATUS.has(status) || message.includes("quota") || message.includes("rate") || message.includes("timeout");
}
