import express from "express";
import { createRunFolder, readJsonArtifactFromDrive } from "./drive.js";
import { appendRunDashboardRow, updateRunDashboardRow } from "./sheets.js";
import { createRunRecord, getRunRecord, updateRunRecord, getArtifactMetadata, listArtifactMetadata } from "./firestore.js";
import { createRunId, nowIso, assertRunId } from "./run-id.js";
import { parseOrThrow, reviewerCreateJobSchema, reviewerAdvanceJobSchema, reviewerWorkerJobSchema } from "./schemas.js";
import { requireRuntimeConfig } from "./config.js";
import { advanceReviewerRun } from "./reviewer-runner-normalized.js";
import { requestReviewerRunAdvance, runReviewerWorkerOnce } from "./reviewer-async-runner.js";

export const reviewerRouter = express.Router();

const allowSyncReviewerAdvance = () => ["1", "true", "yes", "on"].includes(String(process.env.ALLOW_SYNC_REVIEWER_ADVANCE || "false").toLowerCase());

reviewerRouter.post("/reviewer/jobs", async (req, res) => {
  try {
    requireRuntimeConfig();
    const body = parseOrThrow(reviewerCreateJobSchema, req.body);
    const targetUrl = normalizeTargetUrl(body.target_url);
    const createdAt = nowIso();
    const target = body.target || hostFromUrl(targetUrl);
    const runId = createRunId(target);
    const folder = await createRunFolder({ run_id: runId });

    const run = { ok: true, run_id: runId, target, root_url: targetUrl, source_mode: "url", status: "CREATED", current_phase: "AGENT_1A_URL_MANIFEST", runner_mode: "ASYNC_NODE_RUNNER", runner_state: "IDLE", created_by: body.created_by, notes: body.notes || "", drive_folder_id: folder.drive_folder_id, drive_folder_link: folder.drive_folder_link, final_report_url: "", created_at: createdAt, updated_at: createdAt, isolation_rule: "Artifacts may be read only by exact run_id and artifact_name. Company/domain lookup is forbidden." };
    await createRunRecord(run);
    const sheetRow = await appendRunDashboardRow(run);
    const saved = await updateRunRecord(runId, { sheet_row_number: sheetRow });
    await updateRunDashboardRow(saved);
    return res.status(201).json({ ok: true, run_id: runId, status: saved.status, current_phase: saved.current_phase, runner_mode: saved.runner_mode, runner_state: saved.runner_state, drive_folder_link: saved.drive_folder_link, next_action: `POST /v1/reviewer/jobs/${runId}/advance`, poll: `GET /v1/reviewer/jobs/${runId}` });
  } catch (error) {
    return sendError(res, error);
  }
});

reviewerRouter.get("/reviewer/jobs/:run_id", async (req, res) => {
  try {
    assertRunId(req.params.run_id);
    const run = await getRunRecord(req.params.run_id);
    const artifacts = await listArtifactMetadata(req.params.run_id);
    return res.json({ ok: true, run, artifacts });
  } catch (error) {
    return sendError(res, error);
  }
});

reviewerRouter.post("/reviewer/jobs/:run_id/advance", async (req, res) => {
  try {
    assertRunId(req.params.run_id);
    const body = parseOrThrow(reviewerAdvanceJobSchema, req.body || {});
    if (body.sync) {
      if (!allowSyncReviewerAdvance()) throw new Error("SYNC_ADVANCE_RETIRED:Use async /advance and poll /reviewer/jobs/:run_id instead.");
      const result = await advanceSync({ run_id: req.params.run_id, max_steps: body.max_steps });
      return res.json(result);
    }
    const result = await requestReviewerRunAdvance({ run_id: req.params.run_id, requested_by: "operator", base_url: baseUrlFromRequest(req), auto_continue: body.auto_continue });
    return res.status(result.queued ? 202 : 200).json(result);
  } catch (error) {
    return sendError(res, error);
  }
});

reviewerRouter.post("/reviewer/jobs/:run_id/advance-sync", async (req, res) => {
  try {
    assertRunId(req.params.run_id);
    if (!allowSyncReviewerAdvance()) throw new Error("SYNC_ADVANCE_RETIRED:Use async /advance and poll /reviewer/jobs/:run_id instead.");
    const body = parseOrThrow(reviewerAdvanceJobSchema, { ...(req.body || {}), sync: true });
    const result = await advanceSync({ run_id: req.params.run_id, max_steps: body.max_steps });
    return res.json(result);
  } catch (error) {
    return sendError(res, error);
  }
});

reviewerRouter.post("/reviewer/jobs/:run_id/worker", async (req, res) => {
  try {
    assertRunId(req.params.run_id);
    const body = parseOrThrow(reviewerWorkerJobSchema, req.body || {});
    const result = await runReviewerWorkerOnce({ run_id: req.params.run_id, actor: "async_worker", auto_continue: body.auto_continue });
    return res.json(result);
  } catch (error) {
    return sendError(res, error);
  }
});

reviewerRouter.get("/reviewer/report/:run_id", async (req, res) => {
  try {
    assertRunId(req.params.run_id);
    await getRunRecord(req.params.run_id);
    const meta = await getArtifactMetadata(req.params.run_id, "renderer_payload");
    const rendererPayload = await readJsonArtifactFromDrive(meta.drive_file_id);
    return res.json({ ok: true, run_id: req.params.run_id, renderer_payload: rendererPayload });
  } catch (error) {
    return sendError(res, error);
  }
});

async function advanceSync({ run_id, max_steps }) {
  let result = null;
  for (let step = 0; step < max_steps; step += 1) {
    result = await advanceReviewerRun({ run_id });
    if (result.current_phase === "COMPLETE" || result.status === "COMPLETE") break;
  }
  return result;
}

function normalizeTargetUrl(value) { const raw = String(value || "").trim(); const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`; const url = new URL(withProtocol); url.hash = ""; return url.toString(); }
function hostFromUrl(value) { return new URL(value).hostname.replace(/^www\./i, ""); }
function baseUrlFromRequest(req) { const proto = String(req.get("x-forwarded-proto") || req.protocol || "https").split(",")[0].trim() || "https"; const host = String(req.get("x-forwarded-host") || req.get("host") || "").split(",")[0].trim(); if (!host) return ""; return `${proto}://${host}`; }
function sendError(res, error) { const message = error?.message || String(error); const status = statusForMessage(message); return res.status(status).json({ ok: false, error: publicErrorCode(message), message }); }
function statusForMessage(message) { if (message.startsWith("SYNC_ADVANCE_RETIRED")) return 410; if (message.startsWith("UNAUTHORIZED")) return 401; if (message.includes("FORBIDDEN")) return 403; if (message.startsWith("RUN_NOT_FOUND") || message.startsWith("ARTIFACT_NOT_FOUND")) return 404; if (message.startsWith("INVALID_") || message.startsWith("READ_FORBIDDEN") || message.startsWith("WRITE_FORBIDDEN") || message.startsWith("PHASE_LOCK_BLOCKED") || message.startsWith("SOURCE_EXTRACTION_BLOCKED")) return 400; if (message.startsWith("MISSING_RUNTIME_CONFIG")) return 500; if (message.startsWith("ASYNC_WORKER_HTTP_FAILED")) return 502; return 500; }
function publicErrorCode(message) { return String(message).split(":")[0] || "REVIEWER_BACKEND_ERROR"; }
