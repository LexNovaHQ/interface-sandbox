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
const EXPRESS_JSON_LIMIT = "50mb";

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
    timeouts: { gemini_timeout_ms: GEMINI_TIMEOUT_MS },
    output_limits: { gemini_max_output_tokens: GEMINI_MAX_OUTPUT_TOKENS },
    request_limits: { express_json_limit: EXPRESS_JSON_LIMIT }
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
  try {
    if (!hasAnyGeminiKey()) return res.status(500).json({ ok: false, error: "GEMINI_API_KEYS_NOT_CONFIGURED" });
    const debugCompact = wantsCompactFailure(req);
    const result = await runPhaseStack({ input: buildRunInput(req), callModel, baseDir: __dirname });
    res.status(result.ok ? 200 : 422).json(!result.ok && debugCompact ? result.compact_failure || result : result);
  } catch (err) {
    console.error("[diligence/run] failed", err);
    res.status(500).json({ ok: false, error: "DILIGENCE_RUN_FAILED", message: err?.message || String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`Interface Diligence System listening on :${PORT}`);
  console.log(`Active runtime: ${ACTIVE_RUNTIME}`);
});

async function safePromptStack() {
  try { return await loadPromptStack(__dirname); }
  catch (err) { return { ok: false, errors: [err?.message || String(err)], manifest: [] }; }
}

async function callModel({ phaseId, poolName = "repair", systemPrompt, userPrompt, responseMimeType = "application/json", temperature = 0, maxOutputTokens = GEMINI_MAX_OUTPUT_TOKENS, allowGrounding = false }) {
  const pool = buildRuntimePool(poolName);
  let lastError = null;
  for (let keyIndex = 0; keyIndex < pool.keys.length; keyIndex += 1) {
    for (let modelIndex = 0; modelIndex < pool.models.length; modelIndex += 1) {
      const key = pool.keys[keyIndex];
      const model = pool.models[modelIndex];
      const startedAt = Date.now();
      try {
        const text = await callGeminiClient({ key, model, systemPrompt, userPrompt, responseMimeType, temperature, maxOutputTokens, timeoutMs: GEMINI_TIMEOUT_MS, allowGrounding });
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
            fallback_reason: fallbackUsed ? "PRIMARY_MODEL_OR_KEY_FAILED" : null
          }
        };
      } catch (err) {
        lastError = err;
      }
    }
  }
  throw lastError || new Error(`MODEL_POOL_FAILED:${poolName}`);
}

function hasAnyGeminiKey() {
  return Object.keys(PHASE_POOL_ENV).some((pool) => buildRuntimePool(pool).keys.length > 0);
}

function wantsCompactFailure(req) {
  return Boolean(req?.body?.debug_compact === true || String(req?.query?.debug_compact || "").toLowerCase() === "true");
}

function buildRunInput(req) {
  const body = req.body || {};
  const query = req.query || {};
  return {
    ...body,
    debug_trace: body.debug_trace ?? query.debug_trace,
    debug_raw: body.debug_raw ?? query.debug_raw,
    run_until: body.run_until ?? query.run_until
  };
}

function publicPoolsSnapshot() {
  return Object.fromEntries(Object.keys(PHASE_POOL_ENV).map((pool) => {
    const built = buildRuntimePool(pool);
    return [pool, { key_count: built.keys.length, models: built.models, key_pool: built.keys.map((key, index) => ({ index: index + 1, configured: true, fingerprint: fingerprint(key) })) }];
  }));
}
