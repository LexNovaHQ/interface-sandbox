import express from "express";
import { captureSources } from "../source-capture/sourceCapture.js";

export function createSourceCaptureRouter() {
  const router = express.Router();

  router.post("/", async (req, res) => {
    try {
      const input = req.body?.input || req.body || {};
      const options = req.body?.options || input.options || {};
      const sources = input.sources || input.candidate_sources || req.body?.sources || [];

      if (!Array.isArray(sources) || sources.length === 0) {
        return res.status(400).json({
          ok: false,
          service: "lexnova-runtime-api",
          phase: "phase_3c_lossless_source_capture",
          error_type: "BAD_REQUEST",
          error: "input.sources must be a non-empty array"
        });
      }

      const capture = await captureSources(sources, options);

      return res.json({
        ok: true,
        service: "lexnova-runtime-api",
        phase: "phase_3c_lossless_source_capture",
        capture
      });
    } catch (error) {
      return res.status(500).json({
        ok: false,
        service: "lexnova-runtime-api",
        phase: "phase_3c_lossless_source_capture",
        error_type: "RUNTIME_ERROR",
        error: error?.message || "source capture failed"
      });
    }
  });

  return router;
}
