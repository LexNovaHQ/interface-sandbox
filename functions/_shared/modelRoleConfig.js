export const MODEL_ROLES = Object.freeze({
  SEARCH: "search",
  JSON: "json",
  REASONING: "reasoning",
  FINAL: "final"
});

const STAGE_ROLE_MAP = Object.freeze({
  ai_smoke_test: MODEL_ROLES.JSON,
  evidence_refiner: MODEL_ROLES.JSON,
  target_feature_profile: MODEL_ROLES.JSON,
  stage6_integrated_handoff: MODEL_ROLES.JSON,
  registry_ledger: MODEL_ROLES.JSON,
  registry_ledger_evaluation: MODEL_ROLES.JSON,
  operator_challenge: MODEL_ROLES.REASONING,
  final_compiler: MODEL_ROLES.FINAL,
  source_discovery: MODEL_ROLES.SEARCH
});

const ROLE_CONFIG = Object.freeze({
  search: {
    pool: "search",
    keysEnv: "GEMINI_SEARCH_API_KEYS",
    modelsEnv: "GEMINI_SEARCH_MODEL_SEQUENCE",
    defaultModels: ["gemini-2.5-flash", "gemini-2.5-flash-lite"],
    responseMimeType: false,
    tools: ["google_search"]
  },
  json: {
    pool: "json",
    keysEnv: "GEMINI_JSON_API_KEYS",
    modelsEnv: "GEMINI_JSON_MODEL_SEQUENCE",
    defaultModels: ["gemini-3.1-flash-lite", "gemini-2.5-flash-lite", "gemini-2.5-flash"],
    responseMimeType: true,
    tools: []
  },
  reasoning: {
    pool: "reasoning",
    keysEnv: "GEMINI_REASONING_API_KEYS",
    modelsEnv: "GEMINI_FINAL_MODEL_SEQUENCE",
    defaultModels: ["gemini-2.5-flash", "gemini-3.5-flash", "gemini-3.1-flash-lite"],
    responseMimeType: true,
    tools: []
  },
  final: {
    pool: "reasoning",
    keysEnv: "GEMINI_REASONING_API_KEYS",
    modelsEnv: "GEMINI_FINAL_MODEL_SEQUENCE",
    defaultModels: ["gemini-3.5-flash", "gemini-2.5-flash", "gemini-3.1-flash-lite"],
    responseMimeType: true,
    tools: []
  }
});

export function resolveModelRole(stageId, options = {}) {
  const explicit = String(options.modelRole || options.model_role || "").trim().toLowerCase();
  if (ROLE_CONFIG[explicit]) return explicit;
  const normalizedStageId = String(stageId || "").trim();
  return STAGE_ROLE_MAP[normalizedStageId] || MODEL_ROLES.JSON;
}

export function getModelRoleConfig(role) {
  return ROLE_CONFIG[role] || ROLE_CONFIG.json;
}

export function listModelRoleConfigs() {
  return ROLE_CONFIG;
}
