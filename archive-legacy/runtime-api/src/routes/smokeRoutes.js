import express from "express";
import { runGeminiPool } from "../gemini/geminiPool.js";
import { SMOKE_PROMPTS } from "../gemini/smokePrompts.js";

export function createSmokeRouter() {
  const router = express.Router();

  async function runSmoke(poolName, req, res) {
    const prompt = req.body?.prompt || SMOKE_PROMPTS[poolName];
    const options = {
      timeoutMs: Number(req.body?.timeoutMs || 45000),
      maxOutputTokens: Number(req.body?.maxOutputTokens || (poolName === "reasoning" ? 2048 : 768)),
      temperature: Number(req.body?.temperature ?? 0.1),
      responseMimeType: "application/json"
    };

    const result = await runGeminiPool({ poolName, prompt, options });
    const status = result.ok ? 200 : 502;
    return res.status(status).json({
      ok: result.ok,
      service: "lexnova-runtime-api",
      phase: "phase_2_gemini_pool_engine",
      smoke_pool: poolName,
      result: result.json || null,
      model_meta: result.model_meta || null,
      attempts: result.attempts || [],
      usage_metadata: result.usage_metadata || null,
      grounding_metadata_present: Boolean(result.grounding_metadata),
      fallback_used: result.fallback_used === true,
      primary_error: result.primary_error || null,
      error_type: result.error_type || null,
      error: result.error || null
    });
  }

  router.post("/search", (req, res, next) => runSmoke("search", req, res).catch(next));
  router.post("/json", (req, res, next) => runSmoke("json", req, res).catch(next));
  router.post("/registry", (req, res, next) => runSmoke("registry", req, res).catch(next));
  router.post("/reasoning", (req, res, next) => runSmoke("reasoning", req, res).catch(next));

  return router;
}

