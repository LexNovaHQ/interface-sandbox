import { getRuntimeConfig } from "../_shared/config.js";
import { methodNotAllowed, jsonResponse } from "../_shared/response.js";

export async function onRequestGet({ env }) {
  return jsonResponse({
    ok: true,
    ...getRuntimeConfig(env)
  });
}

export async function onRequestPost() {
  return methodNotAllowed(["GET"]);
}
