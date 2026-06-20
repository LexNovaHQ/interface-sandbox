function splitCsv(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function present(value) {
  return Boolean(String(value || "").trim());
}

export function readRuntimeEnv(env = process.env) {
  const searchKeys = splitCsv(env.GEMINI_SEARCH_API_KEYS);
  const jsonKeys = splitCsv(env.GEMINI_JSON_API_KEYS);
  const reasoningKeys = splitCsv(env.GEMINI_REASONING_API_KEYS);
  const registryKeys = splitCsv(env.GEMINI_REGISTRY_API_KEYS);

  return {
    node_env: env.NODE_ENV || "development",
    port: Number(env.PORT || 8080),
    allowed_origin: env.ALLOWED_ORIGIN || "https://sandbox.lexnovahq.com",
    runtime_access_token_configured: present(env.RUNTIME_ACCESS_TOKEN),
    pools: {
      search: {
        configured: searchKeys.length > 0,
        key_count: searchKeys.length,
        models: splitCsv(env.GEMINI_SEARCH_MODEL_SEQUENCE)
      },
      json: {
        configured: jsonKeys.length > 0,
        key_count: jsonKeys.length,
        models: splitCsv(env.GEMINI_JSON_MODEL_SEQUENCE)
      },
      registry: {
        configured: registryKeys.length > 0,
        key_count: registryKeys.length,
        fallback_pool: "json",
        models: splitCsv(env.GEMINI_REGISTRY_MODEL_SEQUENCE)
      },
      reasoning: {
        configured: reasoningKeys.length > 0,
        key_count: reasoningKeys.length,
        models: splitCsv(env.GEMINI_REASONING_MODEL_SEQUENCE || env.GEMINI_FINAL_MODEL_SEQUENCE)
      },
      final: {
        configured: reasoningKeys.length > 0,
        key_count: reasoningKeys.length,
        source_pool: "reasoning",
        models: splitCsv(env.GEMINI_FINAL_MODEL_SEQUENCE)
      }
    }
  };
}

export function getRequiredRuntimeEnvStatus(env = process.env) {
  const required = [
    "RUNTIME_ACCESS_TOKEN",
    "ALLOWED_ORIGIN"
  ];

  const optionalForPhase1 = [
    "GEMINI_SEARCH_API_KEYS",
    "GEMINI_JSON_API_KEYS",
    "GEMINI_REASONING_API_KEYS",
    "GEMINI_REGISTRY_API_KEYS",
    "GEMINI_SEARCH_MODEL_SEQUENCE",
    "GEMINI_JSON_MODEL_SEQUENCE",
    "GEMINI_REASONING_MODEL_SEQUENCE",
    "GEMINI_REGISTRY_MODEL_SEQUENCE",
    "GEMINI_FINAL_MODEL_SEQUENCE"
  ];

  return {
    required_missing: required.filter((key) => !present(env[key])),
    optional_for_phase_1_missing: optionalForPhase1.filter((key) => !present(env[key]))
  };
}
