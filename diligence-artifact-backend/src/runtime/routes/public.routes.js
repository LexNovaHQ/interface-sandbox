import express from "express";
import { config, requireRuntimeConfig } from "../config.js";
import { parseOrThrow, runtimeCreateRunSchema, runtimeAdvanceRunSchema } from "../contracts/schemas.contract.js";
import { assertRunId } from "../utils/run-id.js";
import { getRunRecord, getArtifactMetadata, listArtifactMetadata } from "../services/storage/firestore.service.js";
import { readJsonArtifactFromDrive } from "../services/storage/drive.service.js";
import { sendError } from "../errors.js";
import { CENTRAL_PHASES } from "../contracts/central-phase.contract.js";
import { createDiligenceRun } from "../services/runs.service.js";
import { requestPipelineAdvance } from "../services/async.service.js";

export const publicRouter = express.Router();

const PRIVATE_ANNEXURE_ARTIFACTS = new Set(["qualified_review_submission"]);
const NON_ANNEXURE_UI_ARTIFACTS = new Set(["renderer_payload", "qualified_review_handoff", "qualified_review_renderer_payload"]);
const QR_SECTION_ARTIFACTS = Object.freeze(["qr_artifact__entity_commercial", "qr_artifact__technology_infrastructure", "qr_artifact__ai_capability_product_behavior", "qr_artifact__dap_privacy_india_cyber"]);

publicRouter.get("/runtime/central-phases", (_req, res) => res.json({ ok: true, phases: CENTRAL_PHASES }));

publicRouter.use((req, res, next) => {
  if (!config.publicReviewerEnabled) return res.status(404).json({ ok: false, error: "PUBLIC_DILIGENCE_SYSTEM_DISABLED", message: "Public diligence-system routes are disabled." });
  return next();
});

publicRouter.all(["/reviewer", "/reviewer/*"], (_req, res) => {
  return res.status(410).json({ ok: false, error: "PUBLIC_REVIEWER_ALIAS_RETIRED", message: "Public reviewer routes are retired. Use /public/diligence-system routes." });
});

publicRouter.post("/diligence-system/jobs", async (req, res) => {
  try {
    requireRuntimeConfig();
    const body = parseOrThrow(runtimeCreateRunSchema, req.body);
    const run = await createDiligenceRun({
      target: body.target,
      target_url: body.target_url,
      source_mode: "url",
      created_by: "public-diligence-system",
      notes: body.notes,
      runner_mode: "CLOUD_TASKS_RUNNER",
      runner_state: "IDLE"
    });
    return res.status(201).json(publicRunResponse(run));
  } catch (error) {
    return sendError(res, error);
  }
});

publicRouter.post("/diligence-system/jobs-with-documents", (_req, res) => {
  return res.status(409).json({
    ok: false,
    error: "DOCUMENT_UPLOAD_17_ROOT_CUTOVER_REQUIRED",
    message: "Uploaded-document intake is fenced until it is rebuilt against the active 17-root Source Discovery contract. The retired lossless-family uploader is not permitted in the central runtime."
  });
});

publicRouter.get("/diligence-system/jobs/:run_id", async (req, res) => {
  try {
    assertRunId(req.params.run_id);
    const run = await getRunRecord(req.params.run_id);
    const artifacts = await listArtifactMetadata(req.params.run_id);
    return res.json({ ok: true, run: publicRunResponse(run, { artifact_count: artifacts.length }), artifacts: publicArtifactList(artifacts) });
  } catch (error) {
    return sendError(res, error);
  }
});

publicRouter.post("/diligence-system/jobs/:run_id/advance", async (req, res) => {
  try {
    assertRunId(req.params.run_id);
    const body = parseOrThrow(runtimeAdvanceRunSchema, req.body || {});
    if (body.sync) throw new Error("SYNC_ADVANCE_RETIRED:Use async /advance and poll /public/diligence-system/jobs/:run_id instead.");
    const result = await requestPipelineAdvance({ run_id: req.params.run_id, requested_by: "public-diligence-system", base_url: baseUrlFromRequest(req), auto_continue: body.auto_continue });
    return res.status(result.queued ? 202 : 200).json(publicAsyncResponse(result));
  } catch (error) {
    return sendError(res, error);
  }
});

publicRouter.get("/diligence-system/report/:run_id", async (req, res) => {
  try {
    assertRunId(req.params.run_id);
    const run = await getRunRecord(req.params.run_id);
    if (run.status !== "COMPLETE" && run.current_phase !== "COMPLETE") return res.status(409).json({ ok: false, error: "REPORT_NOT_READY", message: "Renderer payload is not ready for this run." });
    const rendererPayload = await readRequiredArtifact(req.params.run_id, "renderer_payload");
    return res.json({ ok: true, run_id: req.params.run_id, renderer_payload: rendererPayload });
  } catch (error) {
    return sendError(res, error);
  }
});

publicRouter.get("/diligence-system/technical-annexure/:run_id", async (req, res) => {
  try {
    assertRunId(req.params.run_id);
    const run = await getRunRecord(req.params.run_id);
    if (run.status !== "COMPLETE" && run.current_phase !== "COMPLETE") return res.status(409).json({ ok: false, error: "TECHNICAL_ANNEXURE_NOT_READY", message: "Public Technical Annexure is available only after the diligence report renderer has completed." });
    const artifacts = await listArtifactMetadata(req.params.run_id);
    return res.json(publicTechnicalAnnexureResponse({ run, artifacts }));
  } catch (error) {
    return sendError(res, error);
  }
});

publicRouter.get(["/diligence-system/qualified-review/:run_id", "/diligence-system/jobs/:run_id/qualified-review"], async (req, res) => {
  try {
    assertRunId(req.params.run_id);
    const run = await getRunRecord(req.params.run_id);
    if (run.status !== "COMPLETE" && run.current_phase !== "COMPLETE") return res.status(409).json({ ok: false, error: "QUALIFIED_REVIEW_NOT_READY", message: "Qualified Review is available only after the diligence report renderer has completed." });
    const reportPayload = await readRequiredArtifact(req.params.run_id, "renderer_payload");
    const handoff = await readRequiredArtifact(req.params.run_id, "qualified_review_handoff");
    const rendererPayload = await readRequiredArtifact(req.params.run_id, "qualified_review_renderer_payload");
    const validationManifest = await readOptionalArtifact(req.params.run_id, "qualified_review_validation_manifest");
    const submission = await readOptionalArtifact(req.params.run_id, "qualified_review_submission");
    const sectionArtifacts = {};
    for (const artifactName of QR_SECTION_ARTIFACTS) sectionArtifacts[artifactName] = await readRequiredArtifact(req.params.run_id, artifactName);
    return res.json({
      ok: true,
      run_id: req.params.run_id,
      public_label: "Qualified Review",
      system_boundary: { source_system: "Interface Diligence Engine", entry_condition: "renderer_payload and Qualified Review artifacts exist", qualified_review_is_separate_system: true, shares_pipeline_run_id: true, no_document_assembly: true },
      run_status: run.status,
      current_phase: run.current_phase,
      central_phase: run.central_phase || "",
      central_phase_label: run.central_phase_label || "",
      report_ready: true,
      report_renderer_ref: "renderer_payload",
      report_summary: { validation_status: reportPayload?.validation_status || reportPayload?.report_shell?.validation_status || "", report_title: reportPayload?.report_shell?.report_title || "Interface Diligence Report" },
      qualified_review_handoff: handoff,
      qualified_review_renderer_payload: rendererPayload,
      qualified_review_validation_manifest: validationManifest,
      qualified_review_section_artifacts: sectionArtifacts,
      qualified_review_submission: submission
    });
  } catch (error) {
    return sendError(res, error);
  }
});

async function readRequiredArtifact(runId, artifactName) {
  const meta = await getArtifactMetadata(runId, artifactName);
  return readJsonArtifactFromDrive(meta.drive_file_id);
}

async function readOptionalArtifact(runId, artifactName) {
  try {
    return await readRequiredArtifact(runId, artifactName);
  } catch (error) {
    if (String(error?.message || error).startsWith(`ARTIFACT_NOT_FOUND:${runId}:${artifactName}`)) return null;
    throw error;
  }
}

function publicRunResponse(run, options = {}) {
  return {
    ok: true,
    run_id: run.run_id,
    target: run.target,
    root_url: run.root_url,
    source_mode: run.source_mode || "url",
    uploaded_source_documents: run.uploaded_source_documents || { document_count: 0 },
    status: run.status,
    current_phase: run.current_phase,
    central_phase: run.central_phase || "",
    central_phase_label: run.central_phase_label || "",
    runner_mode: run.runner_mode || "",
    runner_state: run.runner_state || "",
    runner_last_error: safeRunnerDiagnostic(run.runner_last_error),
    runner_failed_at: run.runner_failed_at || "",
    runner_worker_started_at: run.runner_worker_started_at || "",
    runner_worker_heartbeat_at: run.runner_worker_heartbeat_at || "",
    runner_requested_at: run.runner_requested_at || "",
    runner_last_completed_at: run.runner_last_completed_at || "",
    runner_task_name: run.runner_task_name || "",
    artifact_count: Number.isFinite(options.artifact_count) ? options.artifact_count : Number(run.artifact_count || 0),
    final_report_url: run.final_report_url || "",
    created_at: run.created_at,
    updated_at: run.updated_at,
    qualified_review_submission_status: run.qualified_review_submission_status || "",
    qualified_review_submission_version: run.qualified_review_submission_version || 0,
    poll: `/public/diligence-system/jobs/${run.run_id}`
  };
}

function publicAsyncResponse(result) {
  return { ok: true, async: true, queued: result.queued, already_running: result.already_running, terminal: result.terminal, run_id: result.run_id, status: result.status, current_phase: result.current_phase, central_phase: result.central_phase || "", central_phase_label: result.central_phase_label || "", runner_mode: result.runner_mode || "", runner_state: result.runner_state, runner_last_error: safeRunnerDiagnostic(result.runner_last_error), runner_failed_at: result.runner_failed_at || "", runner_worker_started_at: result.runner_worker_started_at || "", runner_worker_heartbeat_at: result.runner_worker_heartbeat_at || "", runner_requested_at: result.runner_requested_at || "", runner_last_completed_at: result.runner_last_completed_at || "", runner_task_name: result.runner_task_name || "", artifact_count: Number(result.artifact_count || 0), poll: `/public/diligence-system/jobs/${result.run_id}` };
}

function publicArtifactList(artifacts) { return artifacts.map((artifact) => ({ artifact_name: artifact.artifact_name, phase: artifact.phase, lock_status: artifact.lock_status, latest_version: artifact.latest_version || artifact.version, updated_at: artifact.updated_at || artifact.created_at })); }
function publicTechnicalAnnexureResponse({ run, artifacts }) { const rows = publicTechnicalAnnexureArtifactList(artifacts); return { ok: true, run_id: run.run_id, public_label: "Public Technical Annexure", layer_id: "layer_2_public_technical_annexure", target: run.target, target_url: run.root_url, status: run.status, current_phase: run.current_phase, expected_pack_name: "technical_annexure_pack.zip", manifest_only: true, report_body_inlines_full_payloads: false, exclusion_rule: "Excludes platform secrets, provider telemetry, raw infrastructure logs, and private reviewer submissions.", artifact_count: rows.length, artifacts: rows, endpoint_contract: { public_manifest_route: true, full_payload_zip_export: false, full_payloads_inline: false } }; }
function publicTechnicalAnnexureArtifactList(artifacts) { return artifacts.map((artifact) => { const name = artifact.artifact_name || ""; const privateExcluded = PRIVATE_ANNEXURE_ARTIFACTS.has(name); const uiExcluded = NON_ANNEXURE_UI_ARTIFACTS.has(name); return { artifact_name: name, phase: artifact.phase, lock_status: artifact.lock_status, latest_version: artifact.latest_version || artifact.version, updated_at: artifact.updated_at || artifact.created_at, included_in_public_annexure_manifest: !privateExcluded && !uiExcluded, exclusion_reason: privateExcluded ? "PRIVATE_REVIEWER_SUBMISSION" : uiExcluded ? "UI_ARTIFACT_NOT_TECHNICAL_ANNEXURE" : "" }; }).filter((row) => row.included_in_public_annexure_manifest); }
function baseUrlFromRequest(req) { const proto = String(req.get("x-forwarded-proto") || req.protocol || "https").split(",")[0].trim() || "https"; const host = String(req.get("x-forwarded-host") || req.get("host") || "").split(",")[0].trim(); return host ? `${proto}://${host}` : ""; }
function safeRunnerDiagnostic(value) { return String(value || "").replace(/GEMINI_API_KEYS_\d+/g, "provider-key").slice(0, 1000); }
