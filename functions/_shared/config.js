export function getRuntimeConfig(env = {}) {
  return {
    app: "lexnova-interface-sandbox",
    env: env.APP_ENV || "demo",
    phase: "skeleton",
    ai: {
      provider: "groq",
      primary_model: env.GROQ_MODEL_PRIMARY || "openai/gpt-oss-120b",
      fallback_model: env.GROQ_MODEL_FALLBACK || "llama-3.3-70b-versatile",
      live_call_enabled: false
    }
  };
}
