import { readAiProviderConfig } from "../_shared/aiProviderConfig.js";
import { jsonResponse, methodNotAllowed } from "../_shared/response.js";

export async function onRequest(context) {
  if (context.request.method !== "GET") {
    return methodNotAllowed(["GET"]);
  }

  const status = readAiProviderConfig(context.env || {});

  return jsonResponse({
    ok: true,
    service: "interface-sandbox",
    ...status
  });
}
