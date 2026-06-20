import { parseBoolean } from "../_shared/aiProviderConfig.js";
import { runGeminiSearchDiscovery } from "../_shared/geminiSearchDiscoveryRunner.js";
import { jsonResponse, methodNotAllowed } from "../_shared/response.js";

const SCOUT_FUNCTION_BUDGET_MS = 11000;

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
  if (errorType === "AUTH_OR_PERMISSION_ERROR") return 502;
  if (errorType === "RATE_LIMIT_OR_QUOTA") return 502;
  return 502;
}

function runtimeErrorPayload(error) {
  return {
    ok: false,
    service: "source-discovery-scout",
    error_type: "SOURCE_DISCOVERY_RUNTIME_ERROR",
    error_name: error?.name || "Error",
    error: error?.message || String(error),
    stack_preview: String(error?.stack || "").split("\n").slice(0, 8)
  };
}

function createScoutTimeoutResult(input) {
  return {
    ok: false,
    provider: "gemini",
    model_role: "search",
    configured: true,
    error_type: "TIMEOUT",
    error: `Source Discovery Scout exceeded ${SCOUT_FUNCTION_BUDGET_MS}ms production budget before Gemini Search returned. Use smaller search scope or move source discovery to queued/batched execution.`,
    attempt_policy: {
      model_role: "search",
      max_attempts: 1,
      function_budget_ms: SCOUT_FUNCTION_BUDGET_MS
    },
    attempted_models: [],
    grounding: null,
    quality_status: "SCOUT_TIMEOUT",
    scout_quality: {
      candidate_count: 0,
      trace_complete_count: 0,
      trace_incomplete_count: 0,
      ready_for_admission_gate: false,
      warnings: ["Gemini Search did not return before the production function budget."],
      target: {
        primary_url: input.primary_url || null,
        company_name: input.company_name || null
      }
    }
  };
}

function withFunctionBudget(promise, input) {
  let timer;
  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => resolve(createScoutTimeoutResult(input)), SCOUT_FUNCTION_BUDGET_MS);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function handlePost(context) {
  if (!parseBoolean(context.env?.ENABLE_SEARCH_DISCOVERY, false)) {
    return jsonResponse({
      ok: false,
      service: "source-discovery-scout",
      error_type: "SEARCH_DISCOVERY_DISABLED",
      error: "ENABLE_SEARCH_DISCOVERY is not enabled"
    }, { status: 403 });
  }

  let body;
  try {
    body = await readJsonBody(context.request);
  } catch (error) {
    return jsonResponse({ ok: false, service: "source-discovery-scout", error_type: "INPUT_ERROR", error: error.message }, { status: 400 });
  }

  const input = normalizeInput(body?.input || body || {});
  const options = {
    maxAttempts: 1,
    timeoutMs: 9000,
    maxOutputTokens: 4096,
    ...(body?.options || {})
  };

  if (!input.primary_url && !input.company_name) {
    return jsonResponse({
      ok: false,
      service: "source-discovery-scout",
      error_type: "INPUT_ERROR",
      error: "source-discovery-scout requires primary_url, target_url, url, website, or company_name"
    }, { status: 400 });
  }

  const result = await withFunctionBudget(runGeminiSearchDiscovery({
    env: context.env || {},
    input,
    options
  }), input);

  if (!result.ok) {
    return jsonResponse({
      ok: false,
      service: "source-discovery-scout",
      error_type: result.error_type,
      error: result.error,
      model_role: result.model_role || "search",
      pool: result.pool || null,
      selected_model: result.selected_model || result.model || null,
      selected_key_alias: result.selected_key_alias || null,
      attempt_policy: result.attempt_policy || null,
      attempted_models: result.attempted_models || [],
      raw_provider_preview: result.raw_provider_preview || null,
      raw_candidate_preview: result.raw_candidate_preview || null,
      quality_status: result.quality_status || null,
      scout_quality: result.scout_quality || null,
      grounding: result.grounding || null
    }, { status: publicFailureStatus(result.error_type) });
  }

  return jsonResponse({
    ok: true,
    service: "source-discovery-scout",
    model_role: result.model_role || "search",
    pool: result.pool || null,
    selected_model: result.selected_model,
    selected_key_alias: result.selected_key_alias || null,
    attempt_policy: result.attempt_policy || null,
    attempted_models: result.attempted_models || [],
    quality_status: result.quality_status || null,
    scout_quality: result.scout_quality || null,
    discovery: result.discovery,
    grounding: result.grounding,
    usage_metadata: result.usage_metadata || null,
    finish_reason: result.finish_reason || null
  });
}

export async function onRequest(context) {
  try {
    if (context.request.method !== "POST") {
      return methodNotAllowed(["POST"]);
    }
    return await handlePost(context);
  } catch (error) {
    return jsonResponse(runtimeErrorPayload(error), { status: 500 });
  }
}
