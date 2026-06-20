function jsonResponse(payload, init = {}) {
  return new Response(JSON.stringify(payload, null, 2), {
    status: init.status || 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init.headers || {})
    }
  });
}

function summarizeModule(mod) {
  return Object.keys(mod || {}).sort();
}

async function probe(name, fn) {
  try {
    const result = await fn();
    return { name, ok: true, ...result };
  } catch (error) {
    return {
      name,
      ok: false,
      error_name: error?.name || "Error",
      error: error?.message || String(error),
      stack_preview: String(error?.stack || "").split("\n").slice(0, 8)
    };
  }
}

async function readBody(request) {
  if (request.method !== "POST") return {};
  return request.json().catch(() => ({}));
}

export async function onRequest(context) {
  const startedAt = new Date().toISOString();
  const env = context.env || {};
  const request = context.request;
  const body = await readBody(request);
  const runOutbound = Boolean(body?.outbound);

  const probes = [];

  probes.push(await probe("model_role_config_import", async () => {
    const mod = await import("../_shared/modelRoleConfig.js");
    return { exports: summarizeModule(mod) };
  }));

  probes.push(await probe("provider_key_pool_import", async () => {
    const mod = await import("../_shared/providerKeyPool.js");
    return { exports: summarizeModule(mod) };
  }));

  probes.push(await probe("gemini_json_runner_import", async () => {
    const mod = await import("../_shared/geminiJsonRunner.js");
    return { exports: summarizeModule(mod) };
  }));

  probes.push(await probe("safe_pool_status", async () => {
    const mod = await import("../_shared/providerKeyPool.js");
    const status = mod.getSafePoolStatus(env);
    return {
      pools: status
    };
  }));

  probes.push(await probe("json_role_attempts_without_outbound", async () => {
    const mod = await import("../_shared/providerKeyPool.js");
    const result = mod.getRoleAttempts({
      env,
      role: "json",
      preferredModel: ""
    });

    return {
      role_config: {
        pool: result.roleConfig?.pool,
        keysEnv: result.roleConfig?.keysEnv,
        modelsEnv: result.roleConfig?.modelsEnv,
        responseMimeType: result.roleConfig?.responseMimeType
      },
      attempt_count: Array.isArray(result.attempts) ? result.attempts.length : null,
      attempts_preview: Array.isArray(result.attempts)
        ? result.attempts.slice(0, 5).map((attempt) => ({
            provider: attempt.provider,
            pool: attempt.pool,
            model: attempt.model,
            key_alias: attempt.key_alias,
            apiKey_present: Boolean(attempt.apiKey)
          }))
        : []
    };
  }));

  if (runOutbound) {
    probes.push(await probe("json_runner_tiny_outbound", async () => {
      const mod = await import("../_shared/geminiJsonRunner.js");
      const result = await mod.runGeminiJsonStage({
        env,
        stageId: "ai_smoke_test",
        prompt: "Return exactly this JSON object and nothing else: {\"status\":\"ok\",\"message\":\"tiny outbound passed\"}",
        input: { run_id: body?.run_id || "provider-runtime-debug-outbound" },
        options: {
          modelRole: "json",
          maxAttempts: 1,
          timeoutMs: 15000,
          maxOutputTokens: 256,
          temperature: 0
        }
      });

      return {
        result_ok: Boolean(result.ok),
        model_role: result.model_role || null,
        pool: result.pool || null,
        selected_model: result.selected_model || result.model || null,
        selected_key_alias: result.selected_key_alias || null,
        attempt_policy: result.attempt_policy || null,
        attempted_providers: result.attempted_providers || [],
        parsed_json: result.parsed_json || null,
        error_type: result.error_type || null,
        error: result.error || null
      };
    }));
  }

  const failed = probes.filter((item) => !item.ok);

  return jsonResponse({
    ok: failed.length === 0,
    service: "provider-runtime-debug",
    started_at: startedAt,
    completed_at: new Date().toISOString(),
    method: request.method,
    outbound_enabled: runOutbound,
    failed_count: failed.length,
    probes
  }, { status: failed.length === 0 ? 200 : 500 });
}