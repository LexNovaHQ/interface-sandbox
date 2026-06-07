import express from "express";
import { runGeminiPool } from "../gemini/geminiPool.js";
import { buildSourceDiscoveryPrompt } from "../source-discovery/sourceDiscoveryPrompt.js";
import { buildInputIdentity, guardSourceDiscoveryResult } from "../source-discovery/sourceDiscoveryGuard.js";

export function createSourceDiscoveryRouter() {
  const router = express.Router();

  router.post("/", async (req, res, next) => {
    try {
      const primary_url = req.body?.primary_url || req.body?.input?.primary_url;
      const company_name = req.body?.company_name || req.body?.input?.company_name || null;
      const options = req.body?.options || {};

      const identity = buildInputIdentity({ primary_url });

      const prompt = buildSourceDiscoveryPrompt({
        primary_url: identity.primary_url,
        normalized_origin: identity.normalized_origin,
        registrable_domain: identity.registrable_domain,
        company_name
      });

      const result = await runGeminiPool({
        poolName: "search",
        prompt,
        options: {
          timeoutMs: Number(options.timeoutMs || 90000),
          maxOutputTokens: Number(options.maxOutputTokens || 4096),
          temperature: Number(options.temperature ?? 0),
          responseMimeType: "application/json",
          enableSearchGrounding: true
        }
      });

      if (!result.ok) {
        return res.status(502).json({
          ok: false,
          service: "lexnova-runtime-api",
          phase: "phase_3_source_discovery_runtime",
          input: identity,
          error_type: result.error_type,
          error: result.error,
          model_meta: result.model_meta || null,
          attempts: result.attempts || [],
          primary_error: result.primary_error || null
        });
      }

      const guardedDiscovery = guardSourceDiscoveryResult({
        rawDiscovery: result.json,
        input: identity
      });

      return res.json({
        ok: true,
        service: "lexnova-runtime-api",
        phase: "phase_3_source_discovery_runtime",
        input: {
          primary_url: identity.primary_url,
          normalized_origin: identity.normalized_origin,
          hostname: identity.hostname,
          registrable_domain: identity.registrable_domain,
          company_name
        },
        discovery: guardedDiscovery,
        counts: {
          candidate_sources: guardedDiscovery.candidate_sources.length,
          rejected_sources: guardedDiscovery.rejected_sources.length,
          missing_expected_paths: guardedDiscovery.missing_expected_paths.length,
          discovery_limitations: guardedDiscovery.discovery_limitations.length
        },
        model_meta: result.model_meta,
        usage_metadata: result.usage_metadata || null,
        grounding_metadata_present: Boolean(result.grounding_metadata),
        fallback_used: result.fallback_used === true,
        primary_error: result.primary_error || null
      });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}

