import { methodNotAllowed, jsonResponse } from "../_shared/response.js";

function readServerEnv(env, key, fallback = "") {
  return typeof env?.[key] === "string" && env[key].trim() ? env[key].trim() : fallback;
}

export async function onRequestGet({ env }) {
  const primaryModel = readServerEnv(env, "GROQ_PRIMARY_MODEL", "not configured");
  const fallbackModel = readServerEnv(env, "GROQ_FALLBACK_MODEL", "not configured");

  return jsonResponse({
    ok: true,
    groq: {
      configured: Boolean(readServerEnv(env, "GROQ_API_KEY")),
      primary_model: primaryModel,
      fallback_model: fallbackModel,
      key_exposure: "server-only / not exposed"
    },
    runtime: {
      server_time: new Date().toISOString()
    }
  });
}

export async function onRequestPost() {
  return methodNotAllowed(["GET"]);
}
