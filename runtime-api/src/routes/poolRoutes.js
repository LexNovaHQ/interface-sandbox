import express from "express";
import { getAllPoolSnapshots, getPoolConfig, getPoolSnapshot, runGeminiPool } from "../gemini/geminiPool.js";

function splitCsv(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildTinyJsonPrompt(poolName) {
  return `Return only valid JSON exactly matching this shape:
{
  "pool": "${poolName}",
  "answer": "ok"
}`;
}

function buildEnvOverrideForForcedMode({ poolName, mode }) {
  const env = { ...process.env };
  const config = getPoolConfig(poolName);
  const keys = splitCsv(process.env[config.keys_env]);
  const models = splitCsv(process.env[config.models_env]);

  if (mode === "bad_key") {
    if (!keys.length) {
      throw new Error(`Cannot force bad_key because ${config.keys_env} is empty.`);
    }

    env[config.keys_env] = ["BAD_KEY_FORCE_ROTATION_TEST", ...keys].join(",");
    return env;
  }

  if (mode === "bad_model") {
    if (!models.length) {
      throw new Error(`Cannot force bad_model because ${config.models_env} is empty.`);
    }

    env[config.models_env] = ["gemini-force-bad-model-rotation-test", ...models].join(",");
    return env;
  }

  return env;
}

export function createPoolRouter() {
  const router = express.Router();

  router.get("/diagnostics", (req, res) => {
    const poolName = req.query.pool ? String(req.query.pool) : null;

    if (poolName) {
      return res.json({
        ok: true,
        service: "lexnova-runtime-api",
        phase: "phase_3q_pool_hardening",
        diagnostics: getPoolSnapshot(poolName)
      });
    }

    return res.json({
      ok: true,
      service: "lexnova-runtime-api",
      phase: "phase_3q_pool_hardening",
      diagnostics: getAllPoolSnapshots()
    });
  });

  router.post("/test", async (req, res) => {
    const poolName = req.body?.poolName || "json";
    const mode = req.body?.mode || "normal";
    const prompt = req.body?.prompt || buildTinyJsonPrompt(poolName);

    const options = {
      timeoutMs: Number(req.body?.timeoutMs || 45000),
      maxOutputTokens: Number(req.body?.maxOutputTokens || 512),
      temperature: Number(req.body?.temperature ?? 0.1),
      responseMimeType: "application/json",
      maxAttempts: Number(req.body?.maxAttempts || 12)
    };

    const env = buildEnvOverrideForForcedMode({ poolName, mode });
    const result = await runGeminiPool({ poolName, prompt, options, env });
    const status = result.ok ? 200 : 502;

    return res.status(status).json({
      ok: result.ok,
      service: "lexnova-runtime-api",
      phase: "phase_3q_pool_hardening",
      pool: poolName,
      mode,
      result: result.json || null,
      model_meta: result.model_meta || null,
      attempts: result.attempts || [],
      fallback_used: result.fallback_used === true,
      primary_error: result.primary_error || null,
      error_type: result.error_type || null,
      error: result.error || null
    });
  });

  return router;
}

