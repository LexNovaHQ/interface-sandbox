import { methodNotAllowed, jsonResponse } from "../_shared/response.js";

const present = (env, key) => Boolean(typeof env?.[key] === "string" && env[key].trim());
const value = (env, key, fallback) => (typeof env?.[key] === "string" && env[key].trim() ? env[key].trim() : fallback);

export async function onRequestGet({ env }) {
  const primaryModel = value(env, "GEMINI_MODEL", "gemini-2.5-flash");
  const