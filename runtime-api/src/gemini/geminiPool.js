import { classifyGeminiError } from "./geminiErrorClassifier.js";
import { parseGeminiJsonPayload } from "./geminiResponseParser.js";

function splitCsv(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

const POOL_CONFIG = {
  search: {
    keys_env: "GEMINI_SEARCH_API_KEYS",
    models_env: "GEMINI_SEARCH_MODEL_SEQUENCE",
    alias_prefix: "search_key",
    enable_search_grounding: true
  },
  json: {
    keys_env: "GEMINI_JSON_API_KEYS",
    models_env: "GEMINI_JSON_MODEL_SEQUENCE",
    alias_prefix: "json_key",
    enable_search_grounding: false
  },
  registry: {
    keys_env: "GEMINI_REGISTRY_API_KEYS",
    models_env: "GEMINI_REGISTRY_MODEL_SEQUENCE",
    alias_prefix: "registry_key",
    enable_search_grounding: false,
    fallback_pool: "json"
  },
  reasoning: {
    keys_env: "GEMINI_REASONING_API_KEYS",
    models_env: "GEMINI_REASONING_MODEL_SEQUENCE",
    alias_prefix: "reasoning_key",
    enable_search_grounding: false
  },
  final: {
    keys_env: "GEMINI_REASONING_API_KEYS",
    models_env: "GEMINI_FINAL_MODEL_SEQUENCE",
    alias_prefix: "reasoning_key",
    enable_search_grounding: false
  }
};

function getPoolConfig(poolName) {
  const config = POOL_CONFIG[poolName];
  if (!config) throw new Error(`Unknown Gemini pool: ${poolName}`);
  return config;
}

export function getPoolSnapshot(poolName, env = process.env) {
  const config = getPoolConfig(poolName);
  const keys = splitCsv(env[config.keys_env]);
  const models = splitCsv(env[config.models_env]);
  return {
    pool: poolName,
    configured: keys.length > 0 && models.length > 0,
    key_count: keys.length,
    model_count: models.length,
    models,
    alias_prefix: config.alias_prefix,
    fallback_pool: config.fallback_pool || null,
    enable_search_grounding: config.enable_search_grounding === true
  };
}

function buildGenerateContentBody({ prompt, responseMimeType = "application/json", maxOutputTokens = 1024, temperature = 0.1, enableSearchGrounding = false }) {
  const generationConfig = {
    temperature,
    maxOutputTokens
  };

  // Gemini search grounding does not support responseMimeType.
  // For grounded calls, prompt for JSON and parse JSON from returned text.
  if (!enableSearchGrounding && responseMimeType) {
    generationConfig.responseMimeType = responseMimeType;
  }

  const body = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }]
      }
    ],
    generationConfig
  };

  if (enableSearchGrounding) {
    body.tools = [{ google_search: {} }];
  }

  return body;
}

async function callGeminiRest({ apiKey, model, body, timeoutMs }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    const payload = await response.json().catch(async () => ({ raw_text: await response.text().catch(() => "") }));
    if (!response.ok) {
      const err = new Error(payload?.error?.message || payload?.message || `Gemini HTTP ${response.status}`);
      err.status = response.status;
      err.payload = payload;
      throw err;
    }
    return payload;
  } finally {
    clearTimeout(timer);
  }
}

function safeError(error) {
  return {
    status: error?.status || null,
    message: error?.message || String(error),
    provider_status: error?.payload?.error?.status || null,
    provider_code: error?.payload?.error?.code || null
  };
}

async function runPoolOnce({ poolName, prompt, options = {}, env = process.env }) {
  const config = getPoolConfig(poolName);
  const keys = splitCsv(env[config.keys_env]);
  const models = splitCsv(env[config.models_env]);

  if (!keys.length) {
    return { ok: false, error_type: "POOL_KEYS_NOT_CONFIGURED", error: `${config.keys_env} is empty.`, attempts: [] };
  }

  if (!models.length) {
    return { ok: false, error_type: "POOL_MODELS_NOT_CONFIGURED", error: `${config.models_env} is empty.`, attempts: [] };
  }

  const attempts = [];
  const timeoutMs = Number(options.timeoutMs || 45000);
  const maxOutputTokens = Number(options.maxOutputTokens || 1024);
  const temperature = Number(options.temperature ?? 0.1);
  const responseMimeType = options.responseMimeType || "application/json";
  const enableSearchGrounding = options.enableSearchGrounding ?? config.enable_search_grounding;

  modelLoop: for (const model of models) {
    for (let keyIndex = 0; keyIndex < keys.length; keyIndex += 1) {
      const selected_key_alias = `${config.alias_prefix}_${keyIndex + 1}`;
      const model_meta = {
        pool: poolName,
        selected_key_alias,
        selected_model: model,
        attempt_number: attempts.length + 1,
        search_grounding_enabled: enableSearchGrounding === true
      };

      try {
        const body = buildGenerateContentBody({ prompt, responseMimeType, maxOutputTokens, temperature, enableSearchGrounding });
        const provider_payload = await callGeminiRest({ apiKey: keys[keyIndex], model, body, timeoutMs });
        const parsed = parseGeminiJsonPayload(provider_payload);
        const attempt = { ok: parsed.ok, model_meta, finish_reason: parsed.finish_reason, usage_metadata: parsed.usage_metadata };
        attempts.push(attempt);

        if (!parsed.ok) {
          const parseClassification = parsed.finish_reason === "MAX_TOKENS"
            ? { category: "OUTPUT_TRUNCATED", retryable: true, rotate_key: false, rotate_model: true }
            : { category: "JSON_PARSE_FAILED", retryable: true, rotate_key: false, rotate_model: true };

          attempts[attempts.length - 1] = {
            ...attempts[attempts.length - 1],
            ok: false,
            classification: parseClassification,
            error: {
              message: parsed.error,
              finish_reason: parsed.finish_reason || null,
              raw_text_preview: String(parsed.raw_text || "").slice(0, 500)
            }
          };

          if (parseClassification.rotate_model) {
            continue modelLoop;
          }

          return {
            ok: false,
            error_type: parseClassification.category,
            error: parsed.error,
            model_meta,
            attempts,
            raw_text: parsed.raw_text
          };
        }

        return {
          ok: true,
          json: parsed.json,
          model_meta: {
            ...model_meta,
            attempt_count: attempts.length
          },
          attempts,
          usage_metadata: parsed.usage_metadata,
          grounding_metadata: parsed.grounding_metadata || null,
          repaired: parsed.repaired === true
        };
      } catch (error) {
        const classification = classifyGeminiError(error);
        attempts.push({ ok: false, model_meta, classification, error: safeError(error) });
        if (!classification.retryable) {
          return {
            ok: false,
            error_type: classification.category,
            error: error?.message || String(error),
            model_meta,
            attempts
          };
        }
      }
    }
  }

  return {
    ok: false,
    error_type: "POOL_EXHAUSTED",
    error: `All Gemini attempts failed for pool ${poolName}.`,
    attempts
  };
}

export async function runGeminiPool({ poolName, prompt, options = {}, env = process.env }) {
  const primary = await runPoolOnce({ poolName, prompt, options, env });
  if (primary.ok) return primary;

  const config = getPoolConfig(poolName);
  if (config.fallback_pool) {
    const fallback = await runPoolOnce({ poolName: config.fallback_pool, prompt, options, env });
    return {
      ...fallback,
      fallback_used: true,
      primary_error: {
        pool: poolName,
        error_type: primary.error_type,
        error: primary.error,
        attempts: primary.attempts
      }
    };
  }

  return primary;
}




