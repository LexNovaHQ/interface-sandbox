import express from "express";
import { parseOrThrow, runtimeCreateRunSchema, runtimeAdvanceRunSchema, runtimeWorkerRunSchema } from "../contracts/schemas.contract.js";
import { assertRunId } from "../utils/run-id.js";
import { requireRuntimeConfig } from "../config.js";
import { getRunRecord, listArtifactMetadata } from "../services/storage/firestore.service.js";
import { sendError } from "../errors.js";
import { CENTRAL_PHASES } from "../contracts/central-phase.contract.js";
import { listInternalJobContracts } from "../contracts/internal-job.contract.js";
import { createDiligenceRun, publicRunCreatedResponse } from "../services/runs.service.js";
import { requestPipelineAdvance, runPipelineWorkerOnce } from "../services/async-phase13.service.js";

export const operatorRouter = express.Router();

operatorRouter.get("/runtime/central-phases", (_req, res) => res.json({ ok: true, phases: CENTRAL_PHASES }));
operatorRouter.get("/runtime/internal-jobs", (_req, res) => res.json({ ok: true, internal_jobs: listInternalJobContracts() }));

operatorRouter.post("/reviewer/jobs", async (req, res) => {
  try {
    requireRuntimeConfig();
    const body = parseOrThrow(runtimeCreateRunSchema, req.body);
    const run = await createDiligenceRun({ target: body.target, target_url: body.target_url, source_mode: body.source_mode, created_by: body.created_by, notes: body.notes, runner_mode: "CLOUD_TASKS_RUNNER", runner_state: "IDLE" });
    return res.status(201).json(publicRunCreatedResponse(run));
  } catch (error) {
    return sendError(res, error);
  }
});

operatorRouter.get("/reviewer/jobs/:run_id", async (req, res) => {
  try {
    assertRunId(req.params.run_id);
    const run = await getRunRecord(req.params.run_id);
    const artifacts = await listArtifactMetadata(req.params.run_id);
    return res.json({ ok: true, run, artifacts });
  } catch (error) {
    return sendError(res, error);
  }
});

operatorRouter.post("/reviewer/jobs/:run_id/advance", async (req, res) => {
  try {
    assertRunId(req.params.run_id);
    const body = parseOrThrow(runtimeAdvanceRunSchema, req.body || {});
    if (body.sync) throw new Error("SYNC_ADVANCE_RETIRED:Use async /advance and poll /reviewer/jobs/:run_id instead.");
    const result = await requestPipelineAdvance({ run_id: req.params.run_id, requested_by: "operator", base_url: baseUrlFromRequest(req), auto_continue: body.auto_continue });
    return res.status(result.queued ? 202 : 200).json(result);
  } catch (error) {
    return sendError(res, error);
  }
});

operatorRouter.post("/reviewer/jobs/:run_id/worker", async (req, res) => {
  try {
    assertRunId(req.params.run_id);
    const body = parseOrThrow(runtimeWorkerRunSchema, req.body || {});
    const actor = req.get("x-cloudtasks-taskname") ? "cloud_tasks_worker" : "manual_worker";
    const result = await runPipelineWorkerOnce({ run_id: req.params.run_id, actor, auto_continue: body.auto_continue });
    return res.json(result);
  } catch (error) {
    return sendError(res, error);
  }
});

function baseUrlFromRequest(req) {
  const proto = String(req.get("x-forwarded-proto") || req.protocol || "https").split(",")[0].trim() || "https";
  const host = String(req.get("x-forwarded-host") || req.get("host") || "").split(",")[0].trim();
  return host ? `${proto}://${host}` : "";
}
