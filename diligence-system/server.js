import express from "express";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import { loadPromptStack, runPhaseStack } from "./phase-runner.js";
import { PHASE_POOL_ENV, buildRuntimePool, callGeminiClient, fingerprint } from "./gemini-client.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 8080);
const ACTIVE_RUNTIME = "phase_stack_prompt_supremacy";

const GEMINI_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS || 600000);
const GEMINI_MAX_OUTPUT_TOKENS = Number(process.env.GEMINI_MAX_OUTPUT_TOKENS || 65535);

const EXPRESS_JSON_LIMIT = process.env.EXPRESS_JSON_LIMIT || "50mb";

const SOURCE_MAX_CANDIDATES_DEFAULT = Number(process.env.SOURCE_MAX_CANDIDATES || 75);
const SOURCE_FETCH_TIMEOUT_MS_DEFAULT = Number(process.env.SOURCE_FETCH_TIMEOUT_MS || 45000);

const P6_MODEL_BATCH_SIZE = Number(process.env.P6_MODEL_BATCH_SIZE || 15);

const CLOUD_RUN_TIMEOUT_ASSUMPTION_SECONDS = Number(
  process.env.CLOUD_RUN_TIMEOUT_ASSUMPTION_SECONDS || 900
);

const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: EXPRESS_JSON_LIMIT }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (_req, res) => res.redirect(302, "/diligence.html"));

app.get("/health", async (_req, res) => {
  const stack = await safePromptStack();
  res.json({
    ok: true,
    service: "interface-diligence-system",
    active_diligence_runtime: ACTIVE_RUNTIME,
    mode: ACTIVE_RUNTIME,
    supported_modes: [ACTIVE_RUNTIME],

    prompt_stack_ready: stack.ok,
    prompt_stack_files: stack.manifest || [],
    prompt_stack_errors: stack.errors || [],

    pools: publicPoolsSnapshot(),

    gemini_timeout_ms: GEMINI_TIMEOUT_MS,
    gemini_max_output_tokens: GEMINI_MAX_OUTPUT_TOKENS,
    express_json_limit: EXPRESS_JSON_LIMIT,

    source_max_candidates_used: SOURCE_MAX_CANDIDATES_DEFAULT,
    source_fetch_timeout_ms_used: SOURCE_FETCH_TIMEOUT_MS_DEFAULT,
    source_candidate_limit_hit: false,

    p6_model_batch_size: P6_MODEL_BATCH_SIZE,
    cloud_run_timeout_assumption: `${CLOUD_RUN_TIMEOUT_ASSUMPTION_SECONDS}s`,

    runtime_limits: buildRuntimeLimitTrace({
      sourceCandidateLimitHit: false
    })
  });
});
app.get("/api/diligence/prompt-stack", async (_req, res) => {
  const stack = await safePromptStack();
  res.status(stack.ok ? 200 : 500).json({ ok: stack.ok, active_diligence_runtime: ACTIVE_RUNTIME, manifest: stack.manifest || [], errors: stack.errors || [] });
});

app.get("/api/diligence/pools", (_req, res) => {
  res.json({ ok: true, active_diligence_runtime: ACTIVE_RUNTIME, pools: publicPoolsSnapshot() });
});

app.post("/api/gemini/ping", async (_req, res) => {
  const startedAt = Date.now();
  try {
    const result = await callModel({
      phaseId: "PING",
      poolName: "repair",
      systemPrompt: "Return JSON.",
      userPrompt: "{\"ok\":true,\"ping\":\"pong\"}",
      responseMimeType: "application/json",
      temperature: 0,
      maxOutputTokens: 128
    });
    res.json({ ok: true, latency_ms: Date.now() - startedAt, ...result.meta, response: result.text });
  } catch (err) {
    res.status(502).json({ ok: false, error: "GEMINI_PING_FAILED", message: err?.message || String(err), latency_ms: Date.now() - startedAt });
  }
});

app.post("/api/diligence/run", async (req, res) => {
  const startedAt = Date.now();

  try {
    if (!hasAnyGeminiKey()) {
     return sendDiligenceResponse(req, res, {
  ok: false,
  error: "DILIGENCE_RUN_FAILED",
  message: err?.message || String(err),
  runtime_trace: buildServerRuntimeTrace({
    startedAt,
    status: "SERVER_EXCEPTION",
    failure_stage: "SERVER_CATCH",
    sourceCandidateLimitHit: false,
    exception: err
  }),
  operational_limits: buildRuntimeLimitTrace({
    sourceCandidateLimitHit: false
  })
}, 500);
    }

    const runInput = buildRunInput(req);
    const result = await runPhaseStack({
      input: runInput,
      callModel,
      baseDir: __dirname
    });

    const sourceTrace = extractSourceTrace(result);
    const runtimeTrace = buildServerRuntimeTrace({
      startedAt,
      status: result.ok ? "RUN_RETURNED" : "RUN_RETURNED_WITH_ERRORS",
      failure_stage: result.ok ? null : result?.status || result?.error || "UNKNOWN_PHASE_STACK_FAILURE",
      sourceCandidateLimitHit: sourceTrace.source_candidate_limit_hit
    });

    const payload = {
      ...result,
      runtime_trace: mergeRuntimeTrace(result?.runtime_trace, runtimeTrace),
      operational_limits: buildRuntimeLimitTrace({
        sourceMaxCandidatesUsed: sourceTrace.source_max_candidates_used,
        sourceFetchTimeoutMsUsed: sourceTrace.source_fetch_timeout_ms_used,
        sourceCandidateLimitHit: sourceTrace.source_candidate_limit_hit
      })
    };

    const htmlRequested = wantsHtmlReport(req);
const debugCompact = wantsCompactFailure(req);

const responsePayload = !payload.ok && debugCompact && !htmlRequested
  ? buildCompactFailure(payload)
  : payload;

return sendDiligenceResponse(req, res, responsePayload, payload.ok ? 200 : 422);
  } catch (err) {
    console.error("[diligence/run] failed", err);

    return sendDiligenceResponse(req, res, {
  ok: false,
  error: "GEMINI_API_KEYS_NOT_CONFIGURED",
  message: "No Gemini API key is configured for any diligence runtime pool.",
  runtime_trace: buildServerRuntimeTrace({
    startedAt,
    status: "FAILED_BEFORE_RUN",
    failure_stage: "SERVER_KEY_CHECK",
    sourceCandidateLimitHit: false
  }),
  operational_limits: buildRuntimeLimitTrace({
    sourceCandidateLimitHit: false
  })
}, 500);
  }
});

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  app.listen(PORT, () => {
    console.log(`Interface Diligence System listening on :${PORT}`);
    console.log(`Active runtime: ${ACTIVE_RUNTIME}`);
  });
}

async function safePromptStack() {
  try { return await loadPromptStack(__dirname); }
  catch (err) { return { ok: false, errors: [err?.message || String(err)], manifest: [] }; }
}

async function callModel({
  phaseId,
  poolName = "repair",
  systemPrompt,
  userPrompt,
  responseMimeType = "application/json",
  temperature = 0,
  maxOutputTokens = GEMINI_MAX_OUTPUT_TOKENS,
  allowGrounding = false
}) {
  const pool = buildRuntimePool(poolName);
  let lastError = null;
  const attempts = [];

  for (let keyIndex = 0; keyIndex < pool.keys.length; keyIndex += 1) {
    for (let modelIndex = 0; modelIndex < pool.models.length; modelIndex += 1) {
      const key = pool.keys[keyIndex];
      const model = pool.models[modelIndex];
      const startedAt = Date.now();

      try {
        const text = await callGeminiClient({
          key,
          model,
          systemPrompt,
          userPrompt,
          responseMimeType,
          temperature,
          maxOutputTokens,
          timeoutMs: GEMINI_TIMEOUT_MS,
          allowGrounding
        });

        const fallbackUsed = keyIndex > 0 || modelIndex > 0;

        return {
          text,
          meta: {
            phase_id: phaseId,
            pool_name: poolName,
            model,
            model_index: modelIndex + 1,
            key_index: keyIndex + 1,
            key_fingerprint: fingerprint(key),
            latency_ms: Date.now() - startedAt,
            grounding_requested: Boolean(allowGrounding),
            fallback_used: fallbackUsed,
            fallback_reason: fallbackUsed ? "PRIMARY_MODEL_OR_KEY_FAILED" : null,
            gemini_timeout_ms: GEMINI_TIMEOUT_MS,
            gemini_max_output_tokens: maxOutputTokens,
            attempts
          }
        };
      } catch (err) {
        lastError = err;
        attempts.push({
          model,
          model_index: modelIndex + 1,
          key_index: keyIndex + 1,
          key_fingerprint: fingerprint(key),
          latency_ms: Date.now() - startedAt,
          error: err?.message || String(err)
        });
      }
    }
  }

  const finalError = lastError || new Error(`MODEL_POOL_FAILED:${poolName}`);
  finalError.model_attempts = attempts;
  finalError.pool_name = poolName;
  finalError.phase_id = phaseId;
  throw finalError;
}

function hasAnyGeminiKey() {
  return Object.keys(PHASE_POOL_ENV).some((pool) => buildRuntimePool(pool).keys.length > 0);
}

function wantsCompactFailure(req) {
  return Boolean(
    req?.body?.debug_compact === true ||
    String(req?.query?.debug_compact || "").toLowerCase() === "true"
  );
}

function wantsHtmlReport(req) {
  const body = req.body || {};
  const query = req.query || {};
  const requestedFormat = String(
    body.format ||
    body.response_format ||
    query.format ||
    query.response_format ||
    ""
  ).trim().toLowerCase();

  if (["html", "report_html", "rendered_html"].includes(requestedFormat)) return true;

  const accept = String(req.headers.accept || "").toLowerCase();
  return accept.includes("text/html") && !accept.includes("application/json");
}

function sendDiligenceResponse(req, res, payload, statusCode) {
  if (wantsHtmlReport(req)) {
    const html =
      payload?.html_report ||
      payload?.renderer_output?.html_report ||
      payload?.rendered_report?.html ||
      buildFallbackHtmlReport(payload);

    return res
      .status(statusCode)
      .type("html")
      .send(html);
  }

  return res.status(statusCode).json(payload);
}

function buildFallbackHtmlReport(payload = {}) {
  const title = payload?.ok ? "Diligence Report" : "Diligence Run Failed";
  const status = payload?.status || payload?.error || "UNKNOWN_STATUS";
  const message = payload?.message || payload?.error || "No rendered report was available.";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    body {
      margin: 0;
      background: #f6f4ef;
      color: #1d1d1f;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.55;
    }
    main {
      width: min(920px, calc(100% - 32px));
      margin: 40px auto;
      background: #fff;
      border: 1px solid #ddd7cc;
      border-radius: 20px;
      padding: 28px;
      box-shadow: 0 18px 45px rgba(31,39,54,.08);
    }
    h1 { margin-top: 0; }
    .badge {
      display: inline-flex;
      padding: 6px 10px;
      border-radius: 999px;
      background: #ffe2e2;
      color: #9f2626;
      font-weight: 800;
      font-size: 12px;
      text-transform: uppercase;
    }
    pre {
      overflow-x: auto;
      padding: 14px;
      border-radius: 14px;
      background: #161a22;
      color: #eef2f7;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <main>
    <span class="badge">${escapeHtml(status)}</span>
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(message)}</p>
    <p>This is a controlled server fallback page. The deterministic renderer did not provide an HTML report.</p>
    <pre>${escapeHtml(JSON.stringify({
      ok: payload?.ok,
      status: payload?.status,
      error: payload?.error,
      message: payload?.message,
      operational_limits: payload?.operational_limits || null
    }, null, 2))}</pre>
  </main>
</body>
</html>`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildRunInput(req) {
  const body = req.body || {};
  const query = req.query || {};

  return {
    ...body,

    debug_trace: body.debug_trace ?? parseQueryBoolean(query.debug_trace),
    debug_raw: body.debug_raw ?? parseQueryBoolean(query.debug_raw),
    debug_compact: body.debug_compact ?? parseQueryBoolean(query.debug_compact),

    run_until: body.run_until ?? query.run_until, format: body.format ?? body.response_format ?? query.format ?? query.response_format,

    runtime_limits: {
      ...(body.runtime_limits || {}),
      gemini_timeout_ms: GEMINI_TIMEOUT_MS,
      gemini_max_output_tokens: GEMINI_MAX_OUTPUT_TOKENS,
      express_json_limit: EXPRESS_JSON_LIMIT,
      source_max_candidates_used: Number(
        body?.runtime_limits?.source_max_candidates_used ||
        body?.source_max_candidates ||
        SOURCE_MAX_CANDIDATES_DEFAULT
      ),
      source_fetch_timeout_ms_used: Number(
        body?.runtime_limits?.source_fetch_timeout_ms_used ||
        body?.source_fetch_timeout_ms ||
        SOURCE_FETCH_TIMEOUT_MS_DEFAULT
      ),
      p6_model_batch_size: Number(
        body?.runtime_limits?.p6_model_batch_size ||
        body?.p6_model_batch_size ||
        P6_MODEL_BATCH_SIZE
      ),
      cloud_run_timeout_assumption: `${CLOUD_RUN_TIMEOUT_ASSUMPTION_SECONDS}s`
    }
  };
}

function parseQueryBoolean(value) {
  if (value === undefined || value === null || value === "") return undefined;
  return String(value).toLowerCase() === "true";
}

function extractSourceTrace(result) {
  const s0 =
    result?.stage0 ||
    result?.phase_outputs?.S0 ||
    result?.phase_outputs?.s0 ||
    result?.runtime_trace?.source_trace ||
    {};

  const runtimeLimits = result?.operational_limits || result?.runtime_limits || {};

  const sourceMaxCandidatesUsed = Number(
    s0?.source_max_candidates_used ||
    s0?.max_candidates_used ||
    s0?.candidate_limit ||
    runtimeLimits?.source_max_candidates_used ||
    SOURCE_MAX_CANDIDATES_DEFAULT
  );

  const sourceFetchTimeoutMsUsed = Number(
    s0?.source_fetch_timeout_ms_used ||
    s0?.fetch_timeout_ms_used ||
    s0?.fetch_timeout_ms ||
    runtimeLimits?.source_fetch_timeout_ms_used ||
    SOURCE_FETCH_TIMEOUT_MS_DEFAULT
  );

  const candidateCount = Number(
    s0?.source_candidate_count ||
    s0?.candidate_count ||
    s0?.candidates?.length ||
    0
  );

  const explicitLimitHit =
    s0?.source_candidate_limit_hit === true ||
    s0?.candidate_limit_hit === true ||
    runtimeLimits?.source_candidate_limit_hit === true;

  return {
    source_max_candidates_used: sourceMaxCandidatesUsed,
    source_fetch_timeout_ms_used: sourceFetchTimeoutMsUsed,
    source_candidate_limit_hit: explicitLimitHit || (
      sourceMaxCandidatesUsed > 0 &&
      candidateCount >= sourceMaxCandidatesUsed
    )
  };
}

function buildRuntimeLimitTrace({
  sourceMaxCandidatesUsed = SOURCE_MAX_CANDIDATES_DEFAULT,
  sourceFetchTimeoutMsUsed = SOURCE_FETCH_TIMEOUT_MS_DEFAULT,
  sourceCandidateLimitHit = false
} = {}) {
  return {
    gemini_timeout_ms: GEMINI_TIMEOUT_MS,
    gemini_max_output_tokens: GEMINI_MAX_OUTPUT_TOKENS,
    express_json_limit: EXPRESS_JSON_LIMIT,
    source_max_candidates_used: Number(sourceMaxCandidatesUsed),
    source_fetch_timeout_ms_used: Number(sourceFetchTimeoutMsUsed),
    source_candidate_limit_hit: Boolean(sourceCandidateLimitHit),
    p6_model_batch_size: P6_MODEL_BATCH_SIZE,
    cloud_run_timeout_assumption: `${CLOUD_RUN_TIMEOUT_ASSUMPTION_SECONDS}s`
  };
}

function buildServerRuntimeTrace({
  startedAt,
  status,
  failure_stage = null,
  sourceCandidateLimitHit = false,
  exception = null
}) {
  return {
    server_trace_version: "server_runtime_trace_v1",
    active_diligence_runtime: ACTIVE_RUNTIME,
    status,
    failure_stage,
    elapsed_ms: Date.now() - startedAt,
    limits: buildRuntimeLimitTrace({
      sourceCandidateLimitHit
    }),
    exception: exception ? {
      name: exception?.name || null,
      message: exception?.message || String(exception),
      stack_present: Boolean(exception?.stack)
    } : null
  };
}

function mergeRuntimeTrace(existingTrace, serverTrace) {
  if (!existingTrace) return serverTrace;

  if (Array.isArray(existingTrace)) {
    return [...existingTrace, serverTrace];
  }

  return {
    ...existingTrace,
    server_trace: serverTrace
  };
}

function buildCompactFailure(payload) {
  return {
    ok: false,
    status: payload?.status || "FAILED",
    error: payload?.error || "DILIGENCE_RUN_FAILED",
    message: payload?.message || payload?.failure_reason || null,
    compact_failure: payload?.compact_failure || null,
    runtime_trace: payload?.runtime_trace || null,
    operational_limits: payload?.operational_limits || null
  };
}

function publicPoolsSnapshot() {
  return Object.fromEntries(Object.keys(PHASE_POOL_ENV).map((pool) => {
    const built = buildRuntimePool(pool);
    return [pool, { key_count: built.keys.length, models: built.models, key_pool: built.keys.map((key, index) => ({ index: index + 1, configured: true, fingerprint: fingerprint(key) })) }];
  }));
}
