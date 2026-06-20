import crypto from "crypto";

export const SEARCH_MODEL_ORDER = [
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-3.1-flash-lite"
];

export const NON_SEARCH_MODEL_ORDER = [
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash"
];

export const ERROR_CLASSES = Object.freeze({
  KEY_BUCKET_NOT_CONFIGURED: "KEY_BUCKET_NOT_CONFIGURED",
  QUOTA_EXHAUSTED: "QUOTA_EXHAUSTED",
  RATE_LIMITED: "RATE_LIMITED",
  KEY_INVALID: "KEY_INVALID",
  PROJECT_BLOCKED: "PROJECT_BLOCKED",
  MODEL_NOT_FOUND: "MODEL_NOT_FOUND",
  PROVIDER_5XX: "PROVIDER_5XX",
  TIMEOUT: "TIMEOUT",
  OUTPUT_TRUNCATED: "OUTPUT_TRUNCATED",
  MODEL_JSON_PARSE_FAILED: "MODEL_JSON_PARSE_FAILED",
  SAFETY_BLOCKED: "SAFETY_BLOCKED",
  UNKNOWN_RETRYABLE: "UNKNOWN_RETRYABLE",
  UNKNOWN_TERMINAL: "UNKNOWN_TERMINAL"
});

export const ROTATION_DECISIONS = Object.freeze({
  SUCCESS: "SUCCESS",
  RETRY_SAME_KEY_SAME_MODEL: "RETRY_SAME_KEY_SAME_MODEL",
  ROTATE_KEY_SAME_MODEL: "ROTATE_KEY_SAME_MODEL",
  ROTATE_MODEL_SAME_BUCKET: "ROTATE_MODEL_SAME_BUCKET",
  FALLBACK_BUCKET: "FALLBACK_BUCKET",
  TERMINAL_FAIL: "TERMINAL_FAIL",
  REPAIR_ONLY: "REPAIR_ONLY"
});

export const GEMINI_BUCKETS = {
  S0_SEARCH_API_KEYS: {
    bucketName: "S0_SEARCH_API_KEYS",
    expectedKeyCount: 2,
    modelOrder: SEARCH_MODEL_ORDER,
    usedByPhases: ["S0", "P1 fallback", "P2 fallback"],
    fallbackBucket: null,
    groundingAllowed: true
  },
  P1_ROUTING_API_KEYS: {
    bucketName: "P1_ROUTING_API_KEYS",
    expectedKeyCount: 3,
    modelOrder: NON_SEARCH_MODEL_ORDER,
    usedByPhases: ["P1", "P2"],
    fallbackBucket: "S0_SEARCH_API_KEYS",
    groundingAllowed: false
  },
  P3_PROFILE_KEYS: {
    bucketName: "P3_PROFILE_KEYS",
    expectedKeyCount: 3,
    modelOrder: NON_SEARCH_MODEL_ORDER,
    usedByPhases: ["P3", "P4", "P5"],
    fallbackBucket: null,
    groundingAllowed: false
  },
  P6_REGISTRY_KEYS: {
    bucketName: "P6_REGISTRY_KEYS",
    expectedKeyCount: 4,
    modelOrder: NON_SEARCH_MODEL_ORDER,
    usedByPhases: ["P6"],
    fallbackBucket: "P7_OPERATION_KEY",
    groundingAllowed: false
  },
  P7_OPERATION_KEY: {
    bucketName: "P7_OPERATION_KEY",
    expectedKeyCount: 2,
    modelOrder: NON_SEARCH_MODEL_ORDER,
    usedByPhases: ["P7", "repair", "P6 fallback"],
    fallbackBucket: null,
    groundingAllowed: false
  }
};

export const PHASE_BUCKET_ROUTING = {
  S0: { primaryBucket: "S0_SEARCH_API_KEYS", fallbackBucket: null },
  P1: { primaryBucket: "P1_ROUTING_API_KEYS", fallbackBucket: "S0_SEARCH_API_KEYS" },
  P2: { primaryBucket: "P1_ROUTING_API_KEYS", fallbackBucket: "S0_SEARCH_API_KEYS" },
  P3: { primaryBucket: "P3_PROFILE_KEYS", fallbackBucket: null },
  P4: { primaryBucket: "P3_PROFILE_KEYS", fallbackBucket: null },
  P5: { primaryBucket: "P3_PROFILE_KEYS", fallbackBucket: null },
  P6: { primaryBucket: "P6_REGISTRY_KEYS", fallbackBucket: "P7_OPERATION_KEY" },
  P7: { primaryBucket: "P7_OPERATION_KEY", fallbackBucket: null },
  REPAIR: { primaryBucket: "P7_OPERATION_KEY", fallbackBucket: null }
};

const LEGACY_POOL_TO_BUCKET = {
  search: "S0_SEARCH_API_KEYS",
  router: "P1_ROUTING_API_KEYS",
  extract: "P3_PROFILE_KEYS",
  profile: "P3_PROFILE_KEYS",
  registry: "P6_REGISTRY_KEYS",
  final: "P7_OPERATION_KEY",
  repair: "P7_OPERATION_KEY"
};

export function resolveRuntimeBucketChain({ phaseId, poolName = "repair", allowGrounding = false, env = process.env } = {}) {
  const routingPhase = normalizeRoutingPhase({ phaseId, poolName });
  const route = PHASE_BUCKET_ROUTING[routingPhase];

  if (!route) {
    const err = new Error(`UNKNOWN_PHASE_BUCKET_ROUTE:${phaseId || poolName || "UNKNOWN"}`);
    err.errorClass = ERROR_CLASSES.UNKNOWN_TERMINAL;
    err.phaseId = phaseId || null;
    err.poolName = poolName || null;
    throw err;
  }

  const bucketNames = [route.primaryBucket, route.fallbackBucket].filter(Boolean);

  return bucketNames.map((bucketName, index) => {
    const bucket = GEMINI_BUCKETS[bucketName];

    if (!bucket) {
      const err = new Error(`UNKNOWN_KEY_BUCKET:${bucketName}`);
      err.errorClass = ERROR_CLASSES.UNKNOWN_TERMINAL;
      err.phaseId = phaseId || null;
      err.poolName = poolName || null;
      err.bucketName = bucketName;
      throw err;
    }

    const keys = uniqueCsv(env[bucketName]);
    return {
      bucketName,
      requestedPoolName: poolName,
      phaseId,
      routingPhase,
      keys,
      models: [...bucket.modelOrder],
      fallback: index > 0,
      fallbackBucket: bucket.fallbackBucket,
      grounding: Boolean(allowGrounding && routingPhase === "S0" && bucketName === "S0_SEARCH_API_KEYS")
    };
  });
}

export function buildRuntimePool(poolName, env = process.env, options = {}) {
  const [bucket] = resolveRuntimeBucketChain({ poolName, env, ...options });
  return bucket ? { keys: bucket.keys, models: bucket.models, bucketName: bucket.bucketName } : { keys: [], models: [], bucketName: null };
}

export function publicBucketSnapshot(env = process.env) {
  return Object.fromEntries(Object.keys(GEMINI_BUCKETS).map((bucketName) => {
    const bucket = GEMINI_BUCKETS[bucketName];
    const keys = uniqueCsv(env[bucketName]);
    return [
      bucketName,
      {
        bucketName,
        configured: keys.length > 0,
        keyCount: keys.length,
        expectedKeyCount: bucket.expectedKeyCount,
        keyAliases: keys.map((_key, index) => `${bucketName}_${index + 1}`),
        modelOrder: [...bucket.modelOrder],
        usedByPhases: [...bucket.usedByPhases],
        fallbackBucket: bucket.fallbackBucket,
        groundingAllowed: bucket.groundingAllowed
      }
    ];
  }));
}

export function hasAnyConfiguredBucket(env = process.env) {
  return Object.keys(GEMINI_BUCKETS).some((bucketName) => uniqueCsv(env[bucketName]).length > 0);
}

export function buildPool({ keys = "", models = "", defaults = [] } = {}) {
  const keyList = uniqueCsv(keys);
  const modelList = uniqueCsv(models);
  return { keys: keyList, models: modelList.length ? modelList : defaults };
}

export async function callGeminiClient({ key, model, systemPrompt, userPrompt, responseMimeType = "application/json", temperature = 0, maxOutputTokens = null, sendMaxOutputTokens = false, timeoutMs = 240000, allowGrounding = false, returnMetadata = false } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
    const generationConfig = { temperature, responseMimeType };
    if (sendMaxOutputTokens === true && Number.isFinite(Number(maxOutputTokens)) && Number(maxOutputTokens) > 0) {
      generationConfig.maxOutputTokens = Math.floor(Number(maxOutputTokens));
    }
    const body = {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig
    };
    if (allowGrounding) body.tools = [{ googleSearch: {} }];
    const response = await fetch(endpoint, {
      method: "POST",
      signal: controller.signal,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw createGeminiHttpError({ response, payload });
    }

    const candidate = payload?.candidates?.[0] || {};
    const finishReason = candidate?.finishReason || null;
    const normalizedFinishReason = String(finishReason || "").toUpperCase();
    const text = candidate?.content?.parts?.map((part) => part.text || "").join("") || "";

    if (["SAFETY", "RECITATION", "BLOCKLIST", "PROHIBITED_CONTENT", "SPII"].includes(normalizedFinishReason)) {
      throw createClassifiedGeminiError(`Gemini response blocked: ${finishReason}`, ERROR_CLASSES.SAFETY_BLOCKED, { finishReason, payload });
    }

    const outputLimitNonBlocking = normalizedFinishReason === "MAX_TOKENS";
    const providerWarnings = outputLimitNonBlocking ? ["GEMINI_FINISH_REASON_MAX_TOKENS_NON_BLOCKING"] : [];
    let jsonParseFailed = false;
    let jsonParseError = null;

    if (String(responseMimeType || "").toLowerCase().includes("json")) {
      try {
        JSON.parse(text);
      } catch (err) {
        if (outputLimitNonBlocking) {
          jsonParseFailed = true;
          jsonParseError = err?.message || String(err);
        } else {
          throw createClassifiedGeminiError(`MODEL_JSON_PARSE_FAILED: ${err?.message || String(err)}`, ERROR_CLASSES.MODEL_JSON_PARSE_FAILED, { finishReason, payload });
        }
      }
    }

    const result = {
      text,
      usageMetadata: payload?.usageMetadata || null,
      finishReason,
      rawCandidateCount: Array.isArray(payload?.candidates) ? payload.candidates.length : 0,
      provider_warnings: providerWarnings,
      output_limit_non_blocking: outputLimitNonBlocking,
      model_output_token_limit_sent: Boolean(generationConfig.maxOutputTokens),
      artificial_output_limit_blocking: false,
      json_parse_failed: jsonParseFailed,
      json_parse_error: jsonParseError
    };

    return returnMetadata ? result : text;
  } catch (err) {
    if (err?.name === "AbortError") {
      throw createClassifiedGeminiError("GEMINI_TIMEOUT_ABORTED", ERROR_CLASSES.TIMEOUT, { cause: err });
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export function classifyGeminiError(err) {
  if (err?.errorClass) {
    return {
      errorClass: err.errorClass,
      retryable: ![ERROR_CLASSES.SAFETY_BLOCKED, ERROR_CLASSES.UNKNOWN_TERMINAL].includes(err.errorClass),
      retryAfterSeconds: err.retryAfterSeconds ?? extractRetryAfterSeconds(err)
    };
  }

  const message = String(err?.message || err || "");
  const lower = message.toLowerCase();
  const status = Number(err?.status || err?.httpStatus || 0);
  const retryAfterSeconds = extractRetryAfterSeconds(err);

  if (lower.includes("key_bucket_not_configured")) return classified(ERROR_CLASSES.KEY_BUCKET_NOT_CONFIGURED, false, retryAfterSeconds);
  if (status === 401 || lower.includes("api key not valid") || lower.includes("unauthorized") || lower.includes("invalid api key")) return classified(ERROR_CLASSES.KEY_INVALID, true, retryAfterSeconds);
  if (status === 403 || lower.includes("billing") || lower.includes("permission") || lower.includes("project blocked") || lower.includes("permission denied")) return classified(ERROR_CLASSES.PROJECT_BLOCKED, true, retryAfterSeconds);
  if (status === 429 || lower.includes("quota") || lower.includes("rate limit") || lower.includes("resource exhausted")) return classified(ERROR_CLASSES.QUOTA_EXHAUSTED, true, retryAfterSeconds);
  if (status === 404 || lower.includes("model not found") || lower.includes("not found for api version") || lower.includes("is not found")) return classified(ERROR_CLASSES.MODEL_NOT_FOUND, true, retryAfterSeconds);
  if ([408, 499].includes(status) || lower.includes("timeout") || lower.includes("timed out") || lower.includes("aborted")) return classified(ERROR_CLASSES.TIMEOUT, true, retryAfterSeconds);
  if ([500, 502, 503, 504].includes(status) || lower.includes("unavailable") || lower.includes("internal") || lower.includes("overloaded") || lower.includes("server error")) return classified(ERROR_CLASSES.PROVIDER_5XX, true, retryAfterSeconds);
  if (lower.includes("max_tokens") || lower.includes("max tokens") || lower.includes("output truncated")) return classified(ERROR_CLASSES.OUTPUT_TRUNCATED, true, retryAfterSeconds);
  if (lower.includes("model_json_parse_failed") || lower.includes("json parse")) return classified(ERROR_CLASSES.MODEL_JSON_PARSE_FAILED, true, retryAfterSeconds);
  if (lower.includes("safety") || lower.includes("blocked") || lower.includes("prohibited")) return classified(ERROR_CLASSES.SAFETY_BLOCKED, false, retryAfterSeconds);
  if (lower.includes("retry")) return classified(ERROR_CLASSES.UNKNOWN_RETRYABLE, true, retryAfterSeconds);

  return classified(ERROR_CLASSES.UNKNOWN_TERMINAL, false, retryAfterSeconds);
}

export function isModelSpecificError(errorClass) {
  return [
    ERROR_CLASSES.MODEL_NOT_FOUND,
    ERROR_CLASSES.MODEL_JSON_PARSE_FAILED
  ].includes(errorClass);
}

export function isTerminalError(errorClass) {
  return [
    ERROR_CLASSES.SAFETY_BLOCKED,
    ERROR_CLASSES.UNKNOWN_TERMINAL
  ].includes(errorClass);
}

export function shouldRetrySameKey({ errorClass, retryAfterSeconds = null, retryAlreadyUsed = false, keyIndex = 0, keyCount = 0 } = {}) {
  if (retryAlreadyUsed) return false;

  if ([ERROR_CLASSES.PROVIDER_5XX, ERROR_CLASSES.TIMEOUT, ERROR_CLASSES.UNKNOWN_RETRYABLE].includes(errorClass)) {
    return true;
  }

  if ([ERROR_CLASSES.QUOTA_EXHAUSTED, ERROR_CLASSES.RATE_LIMITED].includes(errorClass)) {
    return Number.isFinite(Number(retryAfterSeconds)) && Number(retryAfterSeconds) <= 20 && keyIndex >= keyCount - 1;
  }

  return false;
}

export function extractRetryAfterSeconds(err) {
  if (Number.isFinite(Number(err?.retryAfterSeconds))) return Number(err.retryAfterSeconds);

  const retryAfterHeader = Number(err?.retryAfterHeader);
  if (Number.isFinite(retryAfterHeader) && retryAfterHeader >= 0) return retryAfterHeader;

  const details = err?.payload?.error?.details || err?.details || [];
  for (const detail of Array.isArray(details) ? details : []) {
    const retryDelay = detail?.retryDelay || detail?.retry_delay;
    const parsed = parseRetryDelay(retryDelay);
    if (Number.isFinite(parsed)) return parsed;
  }

  const message = String(err?.message || err || "");
  const retryMatch = message.match(/retry\s+in\s+([0-9]+(?:\.[0-9]+)?)\s*s/i);
  if (retryMatch) return Number(retryMatch[1]);

  const delayMatch = message.match(/retryDelay[\"'\s:=]+([0-9]+(?:\.[0-9]+)?)s?/i);
  if (delayMatch) return Number(delayMatch[1]);

  return null;
}

export function fingerprint(value) {
  return crypto.createHash("sha256").update(String(value || "")).digest("hex").slice(0, 12);
}

export function uniqueCsv(value) {
  return Array.from(new Set(String(value || "").split(",").map((x) => x.trim()).filter(Boolean)));
}

function normalizeRoutingPhase({ phaseId, poolName } = {}) {
  const phase = String(phaseId || "").trim().toUpperCase();
  const pool = String(poolName || "").trim().toLowerCase();
  if (pool === "repair" || phase.includes("JSON_REPAIR")) return "REPAIR";
  if (phase.startsWith("S0")) return "S0";
  if (phase.startsWith("P6_BATCH") || phase.startsWith("P6")) return "P6";
  const match = phase.match(/^P([1-7])\b/);
  if (match) return `P${match[1]}`;
  if (pool === "search") return "S0";
  if (pool === "router") return "P1";
  if (pool === "extract" || pool === "profile") return "P3";
  if (pool === "registry") return "P6";
  if (pool === "final") return "P7";
  return "REPAIR";
}

function classified(errorClass, retryable, retryAfterSeconds = null) {
  return { errorClass, retryable, retryAfterSeconds };
}

function parseRetryDelay(value) {
  if (!value) return null;
  const match = String(value).match(/^([0-9]+(?:\.[0-9]+)?)s$/i);
  return match ? Number(match[1]) : null;
}

function createGeminiHttpError({ response, payload }) {
  const message = payload?.error?.message || `GEMINI_HTTP_${response.status}`;
  const err = new Error(message);
  err.status = response.status;
  err.httpStatus = response.status;
  err.statusText = response.statusText;
  err.payload = payload;
  err.retryAfterHeader = response.headers?.get?.("retry-after") || null;
  const classifiedError = classifyGeminiError(err);
  err.errorClass = classifiedError.errorClass;
  err.retryAfterSeconds = classifiedError.retryAfterSeconds;
  return err;
}

function createClassifiedGeminiError(message, errorClass, extra = {}) {
  const err = new Error(message);
  err.errorClass = errorClass;
  Object.assign(err, extra);
  return err;
}
