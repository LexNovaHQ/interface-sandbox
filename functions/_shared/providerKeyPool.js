import { maskConfigured, safeModelName } from "./aiProviderConfig.js";
import { getModelRoleConfig, listModelRoleConfigs } from "./modelRoleConfig.js";

function splitCsv(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

export function parseKeyPool(env = {}, keysEnv) {
  const keys = splitCsv(env[keysEnv]).filter(maskConfigured);
  return keys.map((key, index) => ({
    key,
    key_alias: `${keysEnv.toLowerCase().replace(/_api_keys$/, "")}_key_${index + 1}`
  }));
}

export function parseModelSequence(env = {}, modelsEnv, defaultModels = [], preferredModel = "") {
  const configured = splitCsv(env[modelsEnv]).map((model) => safeModelName(model, ""));
  const preferred = preferredModel ? [safeModelName(preferredModel, "")] : [];
  return unique([...preferred, ...configured, ...defaultModels.map((model) => safeModelName(model, ""))]);
}

export function createProviderAttempts({ env = {}, roleConfig, preferredModel = "" }) {
  const keys = parseKeyPool(env, roleConfig.keysEnv);
  const models = parseModelSequence(env, roleConfig.modelsEnv, roleConfig.defaultModels, preferredModel);
  const attempts = [];

  for (const model of models) {
    for (const keyRecord of keys) {
      attempts.push({
        provider: "gemini",
        pool: roleConfig.pool,
        model,
        apiKey: keyRecord.key,
        key_alias: keyRecord.key_alias
      });
    }
  }

  return attempts;
}

export function classifyGeminiProviderError(status, message = "") {
  const text = String(message || "").toLowerCase();

  if (status === 401 || status === 403) return "AUTH_OR_PERMISSION_ERROR";
  if (status === 429) return "RATE_LIMIT_OR_QUOTA";
  if (status >= 500) return "PROVIDER_ERROR";
  if (text.includes("quota")) return "RATE_LIMIT_OR_QUOTA";
  if (text.includes("rate limit")) return "RATE_LIMIT_OR_QUOTA";
  if (text.includes("permission")) return "AUTH_OR_PERMISSION_ERROR";
  if (text.includes("api key")) return "AUTH_OR_PERMISSION_ERROR";

  return "PROVIDER_ERROR";
}

export function shouldTryNextProviderAttempt(result) {
  return [
    "PROVIDER_ERROR",
    "RATE_LIMIT_OR_QUOTA",
    "TIMEOUT",
    "REQUEST_ERROR",
    "MODEL_JSON_PARSE_ERROR"
  ].includes(result?.error_type);
}

export function getSafePoolStatus(env = {}) {
  const configs = listModelRoleConfigs();
  const status = {};

  for (const [role, config] of Object.entries(configs)) {
    const keys = parseKeyPool(env, config.keysEnv);
    const models = parseModelSequence(env, config.modelsEnv, config.defaultModels);
    status[role] = {
      pool: config.pool,
      configured: keys.length > 0,
      key_count: keys.length,
      models,
      tools: config.tools || [],
      response_mime_json: Boolean(config.responseMimeType),
      keys_env: config.keysEnv,
      models_env: config.modelsEnv
    };
  }

  return status;
}

export function getRoleAttempts({ env = {}, role, preferredModel = "" }) {
  const roleConfig = getModelRoleConfig(role);
  return {
    roleConfig,
    attempts: createProviderAttempts({ env, roleConfig, preferredModel })
  };
}