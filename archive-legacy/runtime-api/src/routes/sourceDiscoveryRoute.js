import express from "express";
import { runGeminiPool } from "../gemini/geminiPool.js";
import { buildInputIdentity } from "../source-discovery/sourceDiscoveryGuard.js";
import { runSourceDiscoveryOrchestrator } from "../source-discovery/sourceDiscoveryOrchestrator.js";

export function createSourceDiscoveryRouter() {
  const router = express.Router();

  router.post("/", async (req, res) => {
    try {
      const input = req.body?.input || req.body || {};
      const primary_url = input.primary_url || req.body?.primary_url;
      const company_name = input.company_name || req.body?.company_name || null;
      const options = req.body?.options || input.options || {};

      const identity = buildInputIdentity({ primary_url });

      const orchestrated = await runSourceDiscoveryOrchestrator({
        identity,
        company_name,
        options,
        runPool: runGeminiPool
      });

      return res.json({
        ok: true,
        service: "lexnova-runtime-api",
        phase: "phase_3b_product_legal_source_discovery",
        input: identity,
        discovery: orchestrated.discovery,
        diagnostics: orchestrated.diagnostics
      });
    } catch (error) {
      const statusCode = error?.statusCode || 500;

      return res.status(statusCode).json({
        ok: false,
        service: "lexnova-runtime-api",
        phase: "phase_3b_product_legal_source_discovery",
        error_type: error?.error_type || "RUNTIME_ERROR",
        error: error?.message || "source discovery failed"
      });
    }
  });

  return router;
}

