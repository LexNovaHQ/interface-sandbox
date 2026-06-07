import express from "express";
import { getDiligenceStageIds, listDiligenceStageConfigs } from "../diligence/stageConfigs.js";
import { assertDiligencePromptBundleReady } from "../diligence/stagePromptLoader.js";
import { getSchemaBundleStatus } from "../diligence/stageSchemaValidator.js";
import { runDiligenceStage } from "../diligence/stageRunner.js";

export function createDiligenceStageRouter() {
  const router = express.Router();

  router.get("/stages", (req, res) => {
    try {
      return res.json({
        ok: true,
        service: "lexnova-runtime-api",
        phase: "phase_4_runtime_stage_runner",
        stages: listDiligenceStageConfigs(),
        prompt_bundle: assertDiligencePromptBundleReady(),
        schema_bundle: getSchemaBundleStatus()
      });
    } catch (error) {
      return res.status(500).json({
        ok: false,
        service: "lexnova-runtime-api",
        phase: "phase_4_runtime_stage_runner",
        error_type: "STAGE_CONFIG_ERROR",
        error: error?.message || String(error)
      });
    }
  });

  router.post("/", async (req, res) => {
    try {
      const body = req.body || {};
      const stageId = body.stage || body.stage_id;
      const input = Object.prototype.hasOwnProperty.call(body, "input") ? body.input : body;
      const options = body.options || {};

      if (!stageId || !getDiligenceStageIds().includes(String(stageId).trim())) {
        return res.status(400).json({
          ok: false,
          service: "lexnova-runtime-api",
          phase: "phase_4_runtime_stage_runner",
          error_type: "BAD_REQUEST",
          error: `stage must be one of: ${getDiligenceStageIds().join(", ")}`
        });
      }

      const result = await runDiligenceStage({
        stageId,
        input,
        options,
        env: process.env
      });

      return res.status(result.status || (result.ok ? 200 : 500)).json({
        service: "lexnova-runtime-api",
        phase: "phase_4_runtime_stage_runner",
        ...result,
        status: undefined
      });
    } catch (error) {
      return res.status(500).json({
        ok: false,
        service: "lexnova-runtime-api",
        phase: "phase_4_runtime_stage_runner",
        error_type: "RUNTIME_ERROR",
        error: error?.message || String(error),
        stack_preview: String(error?.stack || "").split("\n").slice(0, 6)
      });
    }
  });

  return router;
}
