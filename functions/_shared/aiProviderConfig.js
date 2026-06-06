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

function splitModelCsv(value) {
  return String(value || "")
    .split(",")
    .map((model) => safeModelName(model, ""))
    .filter(Boolean);
}

function uniqueModels(models) {
  return [...new Set(models.map((model) => safeModelName(model, "")).filter(Boolean))];
}

export function getGeminiModelSequence(env = {}, options = {}) {
  if (Array.isArray(options.modelSequence) && options.modelSequence.length) {
    return uniqueModels(options.modelSequence);
  }

  const configuredSequence = splitModelCsv(env.GEMINI_MODEL_SEQUENCE);
  if (configuredSequence.length) return uniqueModels(configuredSequence);

  return uniqueModels([
    options.model,
    env.GEMINI_PRIMARY_MODEL || DEFAULT_GEMINI_MODELS.primary,
    env.GEMINI_FAST_MODEL || DEFAULT_GEMINI_MODELS.fast,
    env.GEMINI_FALLBACK_MODEL || DEFAULT_GEMINI_MODELS.fallback,
    env.GEMINI_SECONDARY_FALLBACK_MODEL || DEFAULT_GEMINI_MODELS.secondary_fallback
  ]);
}

function readFallbackProvider(env, groqConfigured) {
  const configuredProvider = String(env.AI_FALLBACK_PROVIDER || "").trim().toLowerCase();
  if (configuredProvider) return configuredProvider;
  return groqConfigured ? "groq" : "none";
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
  const geminiConfigured = maskConfigured(env.GEMINI_API_KEY);
  const groqConfigured = maskConfigured(env.GROQ_API_KEY);
  const fallbackProvider = readFallbackProvider(env, groqConfigured);
  const firebase = readFirebaseClientConfig(env);
  const geminiModelSequence = getGeminiModelSequence(env);
  const warnings = [];

  if (!geminiConfigured) {
    warnings.push("GEMINI_API_KEY missing");
  }

  if (!firebase.configured) {
    warnings.push("Firebase client config missing");
  }

  if (fallbackProvider === "groq" && !groqConfigured) {
    warnings.push("Groq fallback disabled because GROQ_API_KEY is missing");
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
      primary_model: env.GEMINI_PRIMARY_MODEL || DEFAULT_GEMINI_MODELS.primary,
      fast_model: env.GEMINI_FAST_MODEL || DEFAULT_GEMINI_MODELS.fast,
      gemini_fallback_model: env.GEMINI_FALLBACK_MODEL || DEFAULT_GEMINI_MODELS.fallback,
      gemini_secondary_fallback_model: env.GEMINI_SECONDARY_FALLBACK_MODEL || DEFAULT_GEMINI_MODELS.secondary_fallback,
      gemini_model_sequence: geminiModelSequence,
      fallback_provider: fallbackProvider,
      fallback_model:
        fallbackProvider === "groq"
          ? env.GROQ_FALLBACK_MODEL || env.GROQ_PRIMARY_MODEL || ""
          : "",
      gemini_configured: geminiConfigured,
      groq_configured: groqConfigured,
      key_exposure: "server-only",
      rate_limit_mode: env.AI_RATE_LIMIT_MODE || "conservative"
    },
    capabilities: {
      search_discovery: parseBoolean(env.ENABLE_SEARCH_DISCOVERY, false),
      gemini_url_context: parseBoolean(env.ENABLE_GEMINI_URL_CONTEXT, false),
      diligence_source_mode: env.DILIGENCE_SOURCE_MODE || "known_paths_only",
      firebase_client: firebase.configured,
      firestore_client: firebase.configured
    },
    warnings
  };
}
