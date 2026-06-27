import express from "express";
import { createRunFolder, readJsonArtifactFromDrive } from "./drive.js";
import { appendRunDashboardRow, updateRunDashboardRow } from "./sheets.js";
import { createRunRecord, getRunRecord, updateRunRecord, getArtifactMetadata, listArtifactMetadata } from "./firestore.js";
import { createRunId, nowIso, assertRunId } from "./run-id.js";
import { parseOrThrow, reviewerCreateJobSchema, reviewerAdvanceJobSchema } from "./schemas.js";
import { requireRuntimeConfig } from "./config.js";
import { advanceReviewerRun } from "./reviewer-runner.js";

export const reviewerRouter = express.Router();

reviewerRouter.post("/reviewer/jobs", async (req, res) => {
  try {
    requireRuntimeConfig();
    const body = parseOrThrow(reviewerCreateJobSchema, req.body);
    const targetUrl = normalizeTargetUrl(body.target_url);
    const createdAt = nowIso();
    const target = body.target || hostFromUrl(targetUrl);
    const runId = createRunId(target);
    const folder = await createRunFolder({ run_id: runId });

    const run = {
      ok: true,
      run_id: runId,
      target,
      root_url: targetUrl,
      source_mode: "url",
      status: "CREATED",
      current_phase: "AGENT_1A_URL_MANIFEST",
      created_by: body.created_by,
      notes: body.notes || "",
      drive_folder_id: folder.drive_folder_id,
      drive_folder_link: folder.drive_folder_link,
      final_report_url: "",
      created_at: createdAt,
      updated_at: createdAt,
      isolation_rule: "Artifacts may be read only by exact run_id and artifact_name. Company/domain lookup is forbidden."
    };

    await createRunRecord(run);
    const sheetRow = await appendRunDashboardRow(run);
    const saved = await updateRunRecord(runId, { sheet_row_number: sheetRow });
    await updateRunDashboardRow(saved);

    return res.status(201).json({
      ok: true,
      run_id: runId,
      status: saved.status,
      current_phase: saved.current_phase,
      drive_folder_link: saved.drive_folder_link,
      next_action: `POST /v1/reviewer/jobs/${runId}/advance`
    });
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
    let result = null;

    for (let step = 0; step < body.max_steps; step += 1) {
      result = await advanceReviewerRun({ run_id: req.params.run_id });
      if (result.current_phase === "COMPLETE" || result.status === "COMPLETE") break;
    }

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

function normalizeTargetUrl(value) {
  const raw = String(value || "").trim();
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const url = new URL(withProtocol);
  url.hash = "";
  return url.toString();
}

function hostFromUrl(value) {
  return new URL(value).hostname.replace(/^www\./i, "");
}

function sendError(res, error) {
  const message = error?.message || String(error);
  const status = statusForMessage(message);
  return res.status(status).json({
    ok: false,
    error: publicErrorCode(message),
    message
  });
}

function statusForMessage(message) {
  if (message.startsWith("UNAUTHORIZED")) return 401;
  if (message.includes("FORBIDDEN")) return 403;
  if (message.startsWith("RUN_NOT_FOUND") || message.startsWith("ARTIFACT_NOT_FOUND")) return 404;
  if (message.startsWith("INVALID_") || message.startsWith("READ_FORBIDDEN") || message.startsWith("WRITE_FORBIDDEN") || message.startsWith("PHASE_LOCK_BLOCKED") || message.startsWith("SOURCE_EXTRACTION_BLOCKED")) return 400;
  if (message.startsWith("MISSING_RUNTIME_CONFIG")) return 500;
  return 500;
}

function publicErrorCode(message) {
  return String(message).split(":")[0] || "REVIEWER_BACKEND_ERROR";
}
