import { runGeminiSearchDiscovery } from "../_shared/geminiSearchDiscoveryRunner.js";
import { jsonResponse, methodNotAllowed } from "../_shared/response.js";

async function readJsonBody(request) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new Error("Request body must be application/json");
  }
  return request.json();
}

function getPrimaryUrl(input = {}) {
  return input.primary_url || input.url || input.target_url || input.website || "";
}

function normalizeInput(input = {}) {
  return {
    run_id: input.run_id || null,
    source_mode: input.source_mode || "url",
    primary_url: getPrimaryUrl(input),
    company_name: input.company_name || input.companyName || null,
    product_context: input.product_context || input.productDesc || null,
    submitted_at: input.submitted_at || new Date().toISOString()
  };
}

function publicFailureStatus(errorType) {
  if (errorType === "CONFIG_ERROR") return 503;
  if (errorType === "INPUT_ERROR") return 400;
  if (errorType === "TIMEOUT") return 504;
  return 502;
}

export async function onRequest(context) {
  if (context.request.method !== "POST") {
    return methodNotAllowed(["POST"]);
  }

  let body;
  try {
    body = await readJsonBody(context.request);
  } catch (error) {
    return jsonResponse({ ok: false, error_type: "INPUT_ERROR", error: error.message }, { status: 400 });
  }

  const input = normalizeInput(body?.input || body || {});
  const options = body?.options || {};

  if (!input.primary_url && !input.company_name) {
    return jsonResponse({
      ok: false,
      error_type: "INPUT_ERROR",
      error: "source-discovery-scout requires primary_url, target_url, url, website, or company_name"
    }, { status: 400 });
  }

  const result = await runGeminiSearchDiscovery({
    env: context.env || {},
    input,
    options
  });

  if (!result.ok) {
    return jsonResponse({
      ok: false,
      service: "source-discovery-scout",
      error_type: result.error_type,
      error: result.error,
      selected_model: result.selected_model || result.model || null,
      attempted_models: result.attempted_models || [],
      grounding: result.grounding || null
    }, { status: publicFailureStatus(result.error_type) });
  }

  return jsonResponse({
    ok: true,
    service: "source-discovery-scout",
    selected_model: result.selected_model,
    attempted_models: result.attempted_models || [],
    discovery: result.discovery,
    grounding: result.grounding,
    usage_metadata: result.usage_metadata || null,
    finish_reason: result.finish_reason || null
  });
}
