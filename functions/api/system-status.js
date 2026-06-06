import { readAiProviderConfig } from "../_shared/aiProviderConfig.js";
import { getSafePoolStatus } from "../_shared/providerKeyPool.js";
import { jsonResponse, methodNotAllowed } from "../_shared/response.js";

export async function onRequest(context) {
  if (context.request.method !== "GET") {
    return methodNotAllowed(["GET"]);
  }

  const env = context.env || {};
  const status = readAiProviderConfig(env);

  return jsonResponse({
    ok: true,
    service: "interface-sandbox",
    ...status,
    ai_pools: getSafePoolStatus(env)
  });
}
