import { classifyGeminiError } from "./geminiErrorClassifier.js";
import { parseGeminiJsonPayload } from "./geminiResponseParser.js";

function splitCsv(value) {
  return String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
}

const POOL_CONFIG = {
  search: { keys_env: "GEMINI_SEARCH_API_KEYS", models_env: "GEMINI_SEARCH_MODEL_SEQUENCE", alias_prefix: "search_key", enable_search_grounding: true },
  json: { keys_env: "GEMINI_JSON_API_KEYS", models_env: "GEMINI_JSON_MODEL_SEQUENCE", alias_prefix: "json_key", enable_search_grounding: false },
  registry: { keys_env: "GEMINI_REGISTRY_API_KEYS", models_env: "GEMINI_REGISTRY_MODEL_SEQUENCE", alias_prefix: "registry_key", enable_search_grounding: false, fallback_pool: "json" },
  reasoning: { keys_env: "GEMINI_REASONING_API_KEYS", models_env: "GEMINI_REASONING_MODEL_SEQUENCE", alias_prefix: "reasoning_key", enable_search_grounding: false },
  final: { keys_env: "GEMINI_REASONING_API_KEYS", models_env: "GEMINI_FINAL_MODEL_SEQUENCE", alias_prefix: "reasoning_key", enable_search_grounding: false }
};

// FOUNDER-LOCKED MODEL POLICY — DO NOT CHANGE WITHOUT EXPLICIT USER APPROVAL.
// All non-search pools must use this exact sequence.
const LOCKED_NON_SEARCH_MODEL_SEQUENCE = ["gemini-3.1-flash-lite", "gemini-3-flash", "gemini-2.5-flash-lite", "gemini-2.5-flash"];
// Search pool must use this exact sequence.
const LOCKED_SEARCH_MODEL_SEQUENCE = ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-3-flash", "gemini-3.1-flash-lite"];

export function getGeminiPoolNames() { return Object.keys(POOL_CONFIG); }
export function getPoolConfig(poolName) { const config = POOL_CONFIG[poolName]; if (!config) throw new Error(`Unknown Gemini pool: ${poolName}`); return config; }

function lockedSequenceForPool(poolName) {
  return poolName === "search" ? LOCKED_SEARCH_MODEL_SEQUENCE : LOCKED_NON_SEARCH_MODEL_SEQUENCE;
}

function orderedModelsForPool(poolName, rawModels = []) {
  const configured = new Set(splitCsv(rawModels.join(",")));
  const locked = lockedSequenceForPool(poolName);
  const allowedConfigured = locked.filter((model) => configured.size === 0 || configured.has(model));
  return allowedConfigured.length ? allowedConfigured : locked;
}

export function getPoolSnapshot(poolName, env = process.env) {
  const config = getPoolConfig(poolName);
  const keys = splitCsv(env[config.keys_env]);
  const configuredModels = splitCsv(env[config.models_env]);
  const models = orderedModelsForPool(poolName, configuredModels);
  const blockedConfigured = configuredModels.filter((model) => !lockedSequenceForPool(poolName).includes(model));
  return { pool: poolName, configured: keys.length > 0 && models.length > 0, keys_env: config.keys_env, models_env: config.models_env, key_count: keys.length, key_aliases: keys.map((_, index) => `${config.alias_prefix}_${index + 1}`), model_count: models.length, configured_models: configuredModels, excluded_models: blockedConfigured, models, model_ordering: "founder_locked", alias_prefix: config.alias_prefix, fallback_pool: config.fallback_pool || null, enable_search_grounding: config.enable_search_grounding === true };
}
export function getAllPoolSnapshots(env = process.env) { return Object.fromEntries(getGeminiPoolNames().map((poolName) => [poolName, getPoolSnapshot(poolName, env)])); }

function buildGenerateContentBody({ prompt, responseMimeType = "application/json", maxOutputTokens = 1024, temperature = 0.1, enableSearchGrounding = false }) {
  const generationConfig = { temperature, maxOutputTokens };
  if (!enableSearchGrounding && responseMimeType) generationConfig.responseMimeType = responseMimeType;
  const body = { contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig };
  if (enableSearchGrounding) body.tools = [{ google_search: {} }];
  return body;
}

async function callGeminiRest({ apiKey, model, body, timeoutMs }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  try {
    const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), signal: controller.signal });
    const payload = await response.json().catch(async () => ({ raw_text: await response.text().catch(() => "") }));
    if (!response.ok) { const err = new Error(payload?.error?.message || payload?.message || `Gemini HTTP ${response.status}`); err.status = response.status; err.payload = payload; throw err; }
    return payload;
  } finally { clearTimeout(timer); }
}
function safeError(error) { return { status: error?.status || null, message: error?.message || String(error), provider_status: error?.payload?.error?.status || null, provider_code: error?.payload?.error?.code || null }; }
function decideRotation(classification, keyIndex, keyCount) { if (!classification?.retryable) return "terminal"; if (classification.rotate_model === true && classification.rotate_key !== true) return "rotate_model"; if (classification.rotate_key === true && classification.rotate_model !== true) return keyIndex + 1 < keyCount ? "rotate_key" : "rotate_model_after_keys_exhausted"; if (classification.rotate_key === true && classification.rotate_model === true) return keyIndex + 1 < keyCount ? "rotate_key_then_model_if_needed" : "rotate_model_after_keys_exhausted"; return "retry_exhausted"; }
function parseFailureClassification(parsed) { if (parsed.finish_reason === "MAX_TOKENS") return { category: "OUTPUT_TRUNCATED", retryable: true, rotate_key: false, rotate_model: true }; return { category: "MODEL_JSON_PARSE_FAILED", retryable: true, rotate_key: false, rotate_model: true }; }
function shouldContinueSameModel(decision) { return decision === "rotate_key" || decision === "rotate_key_then_model_if_needed"; }
function shouldContinueNextModel(decision) { return decision === "rotate_model" || decision === "rotate_model_after_keys_exhausted"; }

async function runPoolOnce({ poolName, prompt, options = {}, env = process.env }) {
  const config = getPoolConfig(poolName);
  const keys = splitCsv(env[config.keys_env]);
  const configuredModels = splitCsv(env[config.models_env]);
  const models = orderedModelsForPool(poolName, configuredModels);
  if (!keys.length) return { ok: false, error_type: "POOL_KEYS_NOT_CONFIGURED", error: `${config.keys_env} is empty.`, attempts: [] };
  if (!models.length) return { ok: false, error_type: "POOL_MODELS_NOT_CONFIGURED", error: `${config.models_env} has no usable founder-locked models.`, attempts: [] };
  const attempts = [];
  const timeoutMs = Number(options.timeoutMs || 45000);
  const maxOutputTokens = Number(options.maxOutputTokens || 1024);
  const temperature = Number(options.temperature ?? 0.1);
  const responseMimeType = options.responseMimeType || "application/json";
  const enableSearchGrounding = options.enableSearchGrounding ?? config.enable_search_grounding;
  const maxAttempts = Number(options.maxAttempts || models.length * keys.length);
  const model_ordering = "founder_locked";

  modelLoop: for (const model of models) {
    for (let keyIndex = 0; keyIndex < keys.length; keyIndex += 1) {
      if (attempts.length >= maxAttempts) return { ok: false, error_type: "ATTEMPT_BUDGET_EXHAUSTED", error: `Attempt budget exhausted for pool ${poolName}.`, attempts };
      const selected_key_alias = `${config.alias_prefix}_${keyIndex + 1}`;
      const model_meta = { pool: poolName, selected_key_alias, selected_model: model, attempt_number: attempts.length + 1, search_grounding_enabled: enableSearchGrounding === true, model_ordering };
      try {
        const body = buildGenerateContentBody({ prompt, responseMimeType, maxOutputTokens, temperature, enableSearchGrounding });
        const provider_payload = await callGeminiRest({ apiKey: keys[keyIndex], model, body, timeoutMs });
        const parsed = parseGeminiJsonPayload(provider_payload);
        const attempt = { ok: parsed.ok, model_meta, finish_reason: parsed.finish_reason, usage_metadata: parsed.usage_metadata, decision: parsed.ok ? "success" : null, repaired: parsed.repaired === true };
        attempts.push(attempt);
        if (!parsed.ok) {
          const classification = parseFailureClassification(parsed);
          const decision = decideRotation(classification, keyIndex, keys.length);
          attempts[attempts.length - 1] = { ...attempts[attempts.length - 1], ok: false, classification, decision, error: { message: parsed.error, finish_reason: parsed.finish_reason || null, raw_text_preview: String(parsed.raw_text || "").slice(0, 500) } };
          if (shouldContinueNextModel(decision)) continue modelLoop;
          if (shouldContinueSameModel(decision)) continue;
          return { ok: false, error_type: classification.category, error: parsed.error, model_meta, attempts, raw_text: parsed.raw_text };
        }
        return { ok: true, json: parsed.json, model_meta: { ...model_meta, attempt_count: attempts.length }, attempts, usage_metadata: parsed.usage_metadata, grounding_metadata: parsed.grounding_metadata || null, repaired: parsed.repaired === true };
      } catch (error) {
        const classification = classifyGeminiError(error);
        const decision = decideRotation(classification, keyIndex, keys.length);
        attempts.push({ ok: false, model_meta, classification, decision, error: safeError(error) });
        if (decision === "terminal") return { ok: false, error_type: classification.category, error: error?.message || String(error), model_meta, attempts };
        if (shouldContinueNextModel(decision)) continue modelLoop;
        if (shouldContinueSameModel(decision)) continue;
        return { ok: false, error_type: classification.category, error: error?.message || String(error), model_meta, attempts };
      }
    }
  }
  return { ok: false, error_type: "POOL_EXHAUSTED", error: `All Gemini attempts failed for pool ${poolName}.`, attempts };
}

export async function runGeminiPool({ poolName, prompt, options = {}, env = process.env }) {
  const primary = await runPoolOnce({ poolName, prompt, options, env });
  if (primary.ok) return { ...primary, fallback_used: false, primary_error: null };
  const config = getPoolConfig(poolName);
  if (config.fallback_pool) {
    const fallback = await runPoolOnce({ poolName: config.fallback_pool, prompt, options, env });
    return { ...fallback, fallback_used: true, primary_error: { pool: poolName, error_type: primary.error_type, error: primary.error, attempts: primary.attempts } };
  }
  return { ...primary, fallback_used: false, primary_error: null };
}
