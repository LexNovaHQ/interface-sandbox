import { getHealthPayload } from "../_shared/mockData.js";
import { methodNotAllowed, jsonResponse } from "../_shared/response.js";

export async function onRequestGet({ env }) {
  return jsonResponse(getHealthPayload(env));
}

export async function onRequestPost() {
  return methodNotAllowed(["GET"]);
}
