import { methodNotAllowed, jsonResponse } from "../_shared/response.js";

function readServerEnv(env, key, fallback = "") {
  return typeof env?.[key] === "string" && env[key].trim() ? env[key].trim() : fallback;
}

function hasServerSecret(env, key) {
  return Boolean(readServerEnv(env, key));
}

export async function onRequestGet({ env }) {
  const geminiModel = readServerEnv(env, "GEMINI_MODEL", "gemini-2.5-flash");
