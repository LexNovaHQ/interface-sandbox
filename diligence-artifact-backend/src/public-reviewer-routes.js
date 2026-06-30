import express from "express";
import { config, requireRuntimeConfig } from "./config.js";
import { createRunFolder, readJsonArtifactFromDrive } from "./drive.js";
import { appendRunDashboardRow, updateRunDashboardRow } from "./sheets.js";
import { createRunRecord, getRunRecord, updateRunRecord, getArtifactMetadata, listArtifactMetadata } from "./firestore.js";
import { createRunId, nowIso, assertRunId } from "./run-id.js";
import { parseOrThrow, reviewerCreateJobSchema, reviewerAdvanceJobSchema } from "./schemas.js";
import { requestReviewerRunAdvance } from "./reviewer-async-runner.js";
import { parseMultipartDiligenceJob, ingestUploadedSourceDocuments } from "./document-source-ingestor.js";

export const publicReviewerRouter = express.Router();

const windowMs = 60 * 60 * 1000;
const limits = { create: 5, advance: 80, read: 120 };
const buckets = new Map();
const jobCreatePaths = ["/diligence-system/jobs"];
const jobCreateWithDocumentsPaths = ["/diligence-system/jobs-with-documents"];
const jobReadPaths = ["/diligence-system/jobs/:run_id"];
const jobAdvancePaths = ["/diligence-system/jobs/:run_id/advance"];
const reportPaths = ["/diligence-system/report/:run_id"];
const qualifiedReviewPaths = ["/diligence-system/qualified-review/:run_id"];

publicReviewerRouter.use((req, res, next) => {
  if (!config.publicReviewerEnabled) return res.status(404).json({ ok: false, error: "PUBLIC_DILIGENCE_SYSTEM_DISABLED", message: "Public diligence-system routes are disabled." });
  return next();
});

publicReviewerRouter.all(["/reviewer", "/reviewer/*"], (_req, res) => {
  return res.status(410).json({ ok: false, error: "PUBLIC_REVIEWER_ALIAS_RETIRED", message: "Public reviewer routes are retired. Use /public/diligence-system routes." });
});

publicReviewerRouter.post(jobCreatePaths, rateLimit("create"), async (req, res) => {
  try {
    requireRuntimeConfig();
    const body = parseOrThrow(reviewerCreateJobSchema, req.body);
    const targetUrl = normalizeTargetUrl(body.target_url);
    const createdAt = nowIso();
    const target = body.target || hostFromUrl(targetUrl);
    const runId = createRunId(target);
    const folder = await createRunFolder({ run_id: runId });
    const run = { ok: true, run_id: runId, target, root_url: targetUrl, source_mode: "url", status: "CREATED", current_phase: "AGENT_1A_URL_MANIFEST", runner_mode: "CLOUD_TASKS_RUNNER", runner_state: "IDLE", created_by: "public-diligence-system", notes: body.notes || "", drive_folder_id: folder.drive_folder_id, drive_folder_link: folder.drive_folder_link, final_report_url: "", created_at: createdAt, updated_at: createdAt, isolation_rule: "Artifacts may be read only by exact run_id and artifact_name. Company/domain lookup is forbidden." };
    await createRunRecord(run);
    const sheetRow = await appendRunDashboardRow(run);
    const saved = await updateRunRecord(runId, { sheet_row_number: sheetRow });
    await updateRunDashboardRow(saved);
    return res.status(201).json(publicRunResponse(saved));
  } catch (error) {
    return sendError(res, error);
  }
});

publicReviewerRouter.post(jobCreateWithDocumentsPaths, rateLimit("create"), async (req, res) => {
  try {
    requireRuntimeConfig();
    const intake = await parseMultipartDiligenceJob(req);
    const targetUrl = normalizeTargetUrl(intake.fields.target_url);
    const createdAt = nowIso();
    const target = intake.fields.target || hostFromUrl(targetUrl);
    const runId = createRunId(target);
    const folder = await createRunFolder({ run_id: runId });
    const baseRun = { ok: true, run_id: runId, target, root_url: targetUrl, source_mode: intake.files.length ? "url_plus_documents" : "url", status: "CREATED", current_phase: "AGENT_1A_URL_MANIFEST", runner_mode: "CLOUD_TASKS_RUNNER", runner_state: "IDLE", created_by: "public-diligence-system", notes: intake.fields.notes || "", drive_folder_id: folder.drive_folder_id, drive_folder_link: folder.drive_folder_link, final_report_url: "", created_at: createdAt, updated_at: createdAt, isolation_rule: "Artifacts may be read only by exact run_id and artifact_name. Company/domain lookup is forbidden." };
    const uploaded = await ingestUploadedSourceDocuments({ run: baseRun, files: intake.files, drive_folder_id: folder.drive_folder_id });
    const run = { ...baseRun, ...uploaded, source_mode: uploaded.source_mode };
    await createRunRecord(run);
    const sheetRow = await appendRunDashboardRow(run);
    const saved = await updateRunRecord(runId, { sheet_row_number: sheetRow });
    await updateRunDashboardRow(saved);
    return res.status(201).json(publicRunResponse(saved));
  } catch (error) {
    return sendError(res, error);
  }
});

publicReviewerRouter.get(jobReadPaths, rateLimit("read"), async (req, res) => {
  try {
    assertRunId(req.params.run_id);
    const run = await getRunRecord(req.params.run_id);
    const artifacts = await listArtifactMetadata(req.params.run_id);
    return res.json({ ok: true, run: publicRunResponse(run, { artifact_count: artifacts.length }), artifacts: publicArtifactList(artifacts) });
  } catch (error) {
    return sendError(res, error);
  }
});

publicReviewerRouter.post(jobAdvancePaths, rateLimit("advance"), async (req, res) => {
  try {
    assertRunId(req.params.run_id);
    const body = parseOrThrow(reviewerAdvanceJobSchema, req.body || {});
    const result = await requestReviewerRunAdvance({ run_id: req.params.run_id, requested_by: "public-diligence-system", base_url: baseUrlFromRequest(req), auto_continue: body.auto_continue });
    return res.status(result.queued ? 202 : 200).json(publicAsyncResponse(result));
  } catch (error) {
    return sendError(res, error);
  }
});

publicReviewerRouter.get(reportPaths, rateLimit("read"), async (req, res) => {
  try {
    assertRunId(req.params.run_id);
    const run = await getRunRecord(req.params.run_id);
    if (run.status !== "COMPLETE" && run.current_phase !== "COMPLETE") return res.status(409).json({ ok: false, error: "REPORT_NOT_READY", message: "Renderer payload is not ready for this run." });
    const meta = await getArtifactMetadata(req.params.run_id, "renderer_payload");
    const rendererPayload = await readJsonArtifactFromDrive(meta.drive_file_id);
    return res.json({ ok: true, run_id: req.params.run_id, renderer_payload: rendererPayload });
  } catch (error) {
    return sendError(res, error);
  }
});

publicReviewerRouter.get(qualifiedReviewPaths, rateLimit("read"), async (req, res) => {
  try {
    assertRunId(req.params.run_id);
    const run = await getRunRecord(req.params.run_id);
    if (run.status !== "COMPLETE" && run.current_phase !== "COMPLETE") return res.status(409).json({ ok: false, error: "QUALIFIED_REVIEW_NOT_READY", message: "Qualified Review is available only after the diligence report renderer has completed." });

    const reportMeta = await getArtifactMetadata(req.params.run_id, "renderer_payload");
    const reportPayload = await readJsonArtifactFromDrive(reportMeta.drive_file_id);
    const handoffMeta = await getArtifactMetadata(req.params.run_id, "qualified_review_handoff");
    const rendererMeta = await getArtifactMetadata(req.params.run_id, "qualified_review_renderer_payload");
    const handoff = await readJsonArtifactFromDrive(handoffMeta.drive_file_id);
    const rendererPayload = await readJsonArtifactFromDrive(rendererMeta.drive_file_id);

    return res.json({
      ok: true,
      run_id: req.params.run_id,
      public_label: "Qualified Review",
      system_boundary: {
        source_system: "Interface Diligence Engine",
        entry_condition: "renderer_payload exists and run is COMPLETE",
        qualified_review_is_separate_system: true,
        shares_pipeline_run_id: true,
        no_document_assembly: true
      },
      report_ready: true,
      report_renderer_ref: "renderer_payload",
      report_summary: {
        validation_status: reportPayload?.validation_status || reportPayload?.report_shell?.validation_status || "",
        report_title: reportPayload?.report_shell?.report_title || "Interface Public-Footprint Diligence Report"
      },
      qualified_review_handoff: handoff,
      qualified_review_renderer_payload: rendererPayload
    });
  } catch (error) {
    return sendError(res, error);
  }
});

function rateLimit(kind) { return (req, res, next) => { const key = `${kind}:${clientIp(req)}`; const now = Date.now(); const existing = buckets.get(key) || { count: 0, resetAt: now + windowMs }; const current = existing.resetAt < now ? { count: 0, resetAt: now + windowMs } : existing; current.count += 1; buckets.set(key, current); if (current.count > limits[kind]) return res.status(429).json({ ok: false, error: "PUBLIC_RATE_LIMITED", message: `Public diligence-system ${kind} limit reached.` }); return next(); }; }
function clientIp(req) { return String(req.get("x-forwarded-for") || req.ip || "unknown").split(",")[0].trim(); }
function publicRunResponse(run, options = {}) { return { ok: true, run_id: run.run_id, target: run.target, root_url: run.root_url, source_mode: run.source_mode || "url", uploaded_source_documents: run.uploaded_source_documents || { document_count: 0 }, status: run.status, current_phase: run.current_phase, runner_mode: run.runner_mode || "", runner_state: run.runner_state || "", runner_last_error: safeRunnerDiagnostic(run.runner_last_error), runner_failed_at: run.runner_failed_at || "", runner_worker_started_at: run.runner_worker_started_at || "", runner_worker_heartbeat_at: run.runner_worker_heartbeat_at || "", runner_requested_at: run.runner_requested_at || "", runner_last_completed_at: run.runner_last_completed_at || "", runner_task_name: run.runner_task_name || "", artifact_count: Number.isFinite(options.artifact_count) ? options.artifact_count : Number(run.artifact_count || 0), final_report_url: run.final_report_url || "", created_at: run.created_at, updated_at: run.updated_at }; }
function publicAsyncResponse(result) { return { ok: true, async: true, queued: result.queued, already_running: result.already_running, terminal: result.terminal, run_id: result.run_id, status: result.status, current_phase: result.current_phase, runner_mode: result.runner_mode || "", runner_state: result.runner_state, runner_last_error: safeRunnerDiagnostic(result.runner_last_error), runner_failed_at: result.runner_failed_at || "", runner_worker_started_at: result.runner_worker_started_at || "", runner_worker_heartbeat_at: result.runner_worker_heartbeat_at || "", runner_requested_at: result.runner_requested_at || "", runner_last_completed_at: result.runner_last_completed_at || "", runner_task_name: result.runner_task_name || "", artifact_count: Number(result.artifact_count || 0), poll: `/public/diligence-system/jobs/${result.run_id}` }; }
function publicArtifactList(artifacts) { return artifacts.map((artifact) => ({ artifact_name: artifact.artifact_name, phase: artifact.phase, lock_status: artifact.lock_status, latest_version: artifact.latest_version || artifact.version, updated_at: artifact.updated_at || artifact.created_at })); }
function baseUrlFromRequest(req) { const proto = String(req.get("x-forwarded-proto") || req.protocol || "https").split(",")[0].trim() || "https"; const host = String(req.get("x-forwarded-host") || req.get("host") || "").split(",")[0].trim(); return host ? `${proto}://${host}` : ""; }
function normalizeTargetUrl(value) { const raw = String(value || "").trim(); const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`; const url = new URL(withProtocol); url.hash = ""; return url.toString(); }
function hostFromUrl(value) { return new URL(value).hostname.replace(/^www\./i, ""); }
function safeRunnerDiagnostic(value) { return String(value || "").split(/\r?\n/)[0].replace(/AIza[0-9A-Za-z_-]{20,}/g, "[REDACTED_API_KEY]").slice(0, 500); }
function sendError(res, error) { const message = error?.message || String(error); const status = statusForMessage(message); return res.status(status).json({ ok: false, error: publicErrorCode(message), message }); }
function statusForMessage(message) { if (message.startsWith("PUBLIC_REVIEWER_ALIAS_RETIRED")) return 410; if (message.startsWith("UNAUTHORIZED")) return 401; if (message.includes("FORBIDDEN")) return 403; if (message.startsWith("RUN_NOT_FOUND") || message.startsWith("ARTIFACT_NOT_FOUND")) return 404; if (message.startsWith("INVALID_") || message.startsWith("READ_FORBIDDEN") || message.startsWith("WRITE_FORBIDDEN") || message.startsWith("PHASE_LOCK_BLOCKED") || message.startsWith("SOURCE_EXTRACTION_BLOCKED")) return 400; if (message.startsWith("MISSING_RUNTIME_CONFIG")) return 500; if (message.startsWith("GEMINI_CALL_FAILED")) return 502; if (message.startsWith("CLOUD_TASKS_")) return 500; return 500; }
function publicErrorCode(message) { return String(message).split(":")[0] || "PUBLIC_DILIGENCE_SYSTEM_BACKEND_ERROR"; }