const REQUIRED_FIREBASE_ENV_KEYS = Object.freeze([
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID"
]);

export const DEFAULT_GEMINI_MODELS = Object.freeze({
  primary: "gemini-3.5-flash",
  fast: "gemini-3.1-flash-lite",
  fallback: "gemini-2.5-flash-lite",
  secondary_fallback: "gemini-2.5-flash"
});

export const GEMINI_POOL_ENV = Object.freeze({
  search: {
    keysEnv: "GEMINI_SEARCH_API_KEYS",
    modelsEnv: "GEMINI_SEARCH_MODEL_SEQUENCE"
  },
  json: {
    keysEnv: "GEMINI_JSON_API_KEYS",
    modelsEnv: "GEMINI_JSON_MODEL_SEQUENCE"
  },
  reasoning: {
    keysEnv: "GEMINI_REASONING_API_KEYS",
    modelsEnv: "GEMINI_FINAL_MODEL_SEQUENCE"
  }
});

const SERVER_SECRET_PLACEHOLDERS = new Set([
  "server_secret_only_do_not_commit",
  "changeme",
  "change_me",
  "placeholder"
]);

export function parseBoolean(value, defaultValue = false) {
  if (value === undefined || value === null || value === "") return defaultValue;
  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "on", "enabled"].includes(normalized)) return true;
  if (["0", "false", "no", "off", "disabled"].includes(normalized)) return false;
  return defaultValue;
}

export function maskConfigured(value) {
  if (value === undefined || value === null) return false;
  const normalized = String(value).trim();
  if (!normalized) return false;
  return !SERVER_SECRET_PLACEHOLDERS.has(normalized.toLowerCase());
}

export function safeModelName(model, fallback = DEFAULT_GEMINI_MODELS.primary) {
  return String(model || fallback).trim().replace(/^models\//, "");
}

function splitCsv(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function configuredCsvCount(value) {
  return splitCsv(value).filter(maskConfigured).length;
}

function configuredModelSequence(value) {
  return [...new Set(splitCsv(value).map((model) => safeModelName(model, "")).filter(Boolean))];
}

function readGeminiPoolConfig(env = {}) {
  const pools = {};

  for (const [role, config] of Object.entries(GEMINI_POOL_ENV)) {
    const keyCount = configuredCsvCount(env[config.keysEnv]);
    const models = configuredModelSequence(env[config.modelsEnv]);

    pools[role] = {
      configured: keyCount > 0,
      key_count: keyCount,
      keys_env: config.keysEnv,
      models_env: config.modelsEnv,
      models
    };
  }

  return pools;
}

function readFirebaseClientConfig(env) {
  const missingVariables = REQUIRED_FIREBASE_ENV_KEYS.filter((key) => !maskConfigured(env[key]));

  return {
    configured: missingVariables.length === 0,
    project_id_present: maskConfigured(env.VITE_FIREBASE_PROJECT_ID),
    client_config_source: "vite-build-env",
    missingVariables
  };
}

export function readAiProviderConfig(env = {}) {
  const firebase = readFirebaseClientConfig(env);
  const geminiPools = readGeminiPoolConfig(env);
  const missingPools = Object.entries(geminiPools)
    .filter(([, status]) => !status.configured)
    .map(([role, status]) => `${role}:${status.keys_env}`);
  const warnings = [];

  if (missingPools.length) {
    warnings.push(`Gemini pool keys missing: ${missingPools.join(", ")}`);
  }

  if (!firebase.configured) {
    warnings.push("Firebase client config missing");
  }

  return {
    environment: {
      runtime: "cloudflare-pages-functions",
      node_env: env.NODE_ENV || env.APP_ENV || "unknown",
      sandbox_public_mode: parseBoolean(env.SANDBOX_PUBLIC_MODE, true),
      client_confidential_inputs_allowed: parseBoolean(
        env.CLIENT_CONFIDENTIAL_INPUTS_ALLOWED,
        false
      )
    },
    firebase: {
      configured: firebase.configured,
      project_id_present: firebase.project_id_present,
      client_config_source: firebase.client_config_source
    },
    ai: {
      primary_provider: "gemini",
      key_exposure: "server-only",
      configured: missingPools.length === 0,
      gemini_configured: missingPools.length === 0,
      pools: geminiPools,
      rate_limit_mode: env.AI_RATE_LIMIT_MODE || "conservative"
    },
    capabilities: {
      search_discovery: parseBoolean(env.ENABLE_SEARCH_DISCOVERY, false),
      gemini_url_context: parseBoolean(env.ENABLE_GEMINI_URL_CONTEXT, false),
      diligence_source_mode: env.DILIGENCE_SOURCE_MODE || "known_paths_plus_search",
      firebase_client: firebase.configured,
      firestore_client: firebase.configured
    },
    warnings
  };
}
