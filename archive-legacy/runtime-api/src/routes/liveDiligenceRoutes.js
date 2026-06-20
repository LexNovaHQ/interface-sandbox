import express from "express";
import { runLiveDiligenceReview } from "../live/liveDiligenceRunOrchestratorLocked.js";

function publicError(error) {
  return {
    ok: false,
    service: "lexnova-runtime-api",
    phase: "live_diligence_review",
    error_type: error?.error_type || "RUNTIME_ERROR",
    error: error?.message || "live diligence review failed",
    detail: error?.result || null
  };
}

export function createLiveDiligenceRouter() {
  const router = express.Router();

  router.post("/", async (req, res) => {
    try {
      const body = req.body || {};
      const input = body.input || body.target_input || body;
      const options = body.options || {};
      const result = await runLiveDiligenceReview(input, options);
      return res.json({
        service: "lexnova-runtime-api",
        phase: "live_diligence_review",
        ...result
      });
    } catch (error) {
      const status = error?.status || 500;
      return res.status(status).json(publicError(error));
    }
  });

  return router;
}
