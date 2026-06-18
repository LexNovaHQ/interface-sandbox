import crypto from "crypto";

export const PHASE_POOL_ENV = {
  search: {
    keys: ["DILIGENCE_SEARCH_API_KEYS", "DILIGENCE_SEARCH_API_KEY"],
    models: ["DILIGENCE_SEARCH_MODEL_SEQUENCE", "DILIGENCE_SEARCH_MODEL"],
    defaults: ["gemini-2.5-flash-lite", "gemini-2.5-flash"]
  },
  extract: {
    keys: ["DILIGENCE_EXTRACT_API_KEYS", "DILIGENCE_EXTRACT_API_KEY"],
    models: ["DILIGENCE_EXTRACT_MODEL_SEQUENCE", "DILIGENCE_EXTRACT_MODEL"],
    defaults: ["gemini-2.5-flash-lite", "gemini-2.5-flash"]
  },
  router: {
    keys: ["DILIGENCE_ROUTER_API_KEYS", "DILIGENCE_ROUTER_API_KEY"],
    models: ["DILIGENCE_ROUTER_MODEL_SEQUENCE", "DILIGENCE_ROUTER_MODEL"],
    defaults: ["gemini-2.5-flash-lite", "gemini-2.5-flash"]
  },
  profile: {
    keys: ["DILIGENCE_PROFILE_API_KEYS", "DILIGENCE_PROFILE_API_KEY"],
    models: ["DILIGENCE_PROFILE_MODEL_SEQUENCE", "DILIGENCE_PROFILE_MODEL"],
    defaults: ["gemini-2.5-flash", "gemini-2.5-flash-lite"]
  },
  registry: {
    keys: ["DILIGENCE_REGISTRY_API_KEYS", "DILIGENCE_REGISTRY_API_KEY"],
    models: ["DILIGENCE_REGISTRY_MODEL_SEQUENCE", "DILIGENCE_REGISTRY_MODEL"],
    defaults: ["gemini-2.5-flash", "gemini-2.5-flash-lite"]
  },
  final: {
    keys: ["DILIGENCE_FINAL_API_KEYS", "DILIGENCE_FINAL_API_KEY"],
    models: ["DILIGENCE_FINAL_MODEL_SEQUENCE", "DILIGENCE_FINAL_MODEL"],
    defaults: ["gemini-2.5-flash", "gemini-2.5-flash-lite"]
  },
  repair: {
    keys: ["DILIGENCE_REPAIR_API_KEYS", "DILIGENCE_REPAIR_API_KEY"],
    models: ["DILIGENCE_REPAIR_MODEL_SEQUENCE", "DILIGENCE_REPAIR_MODEL"],
    defaults: ["gemini-2.5-flash-lite", "gemini-2.5-flash"]
  }
};

export function buildRuntimePool(poolName, env = process.env) {
  const pool = PHASE_POOL_ENV[poolName] || PHASE_POOL_ENV.repair;
  const keyCsv = [
    ...pool.keys.map((name) => env[name]),
    env.GEMINI_API_KEYS,
    env.GEMINI_API_KEY
  ].join(",");
  const modelCsv = firstDefined([
    ...pool.models.map((name) => env[name]),
    env.GEMINI_MODELS,
    env.GEMINI_MODEL
  ]);
  return buildPool({ keys: keyCsv, models: modelCsv, defaults: pool.defaults });
}

export function buildPool({ keys = "", models = "", defaults = [] } = {}) {
  const keyList = uniqueCsv(keys);
  const modelList = uniqueCsv(models);
  return {
    keys: keyList,
    models: modelList.length ? modelList : defaults
  };
}

export async function callGeminiClient({ key, model, systemPrompt, userPrompt, responseMimeType = "application/json", temperature = 0, maxOutputTokens = 65535, timeoutMs = 240000 } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
    const response = await fetch(endpoint, {
      method: "POST",
      signal: controller.signal,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: { temperature, maxOutputTokens, responseMimeType }
      })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload?.error?.message || `GEMINI_HTTP_${response.status}`);
    return payload?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "";
  } finally {
    clearTimeout(timeout);
  }
}

export function fingerprint(value) {
  return crypto.createHash("sha256").update(String(value || "")).digest("hex").slice(0, 12);
}

export function uniqueCsv(value) {
  return Array.from(new Set(String(value || "").split(",").map((x) => x.trim()).filter(Boolean)));
}

function firstDefined(values) {
  for (const value of values) if (String(value || "").trim()) return value;
  return "";
}
