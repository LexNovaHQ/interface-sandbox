import express from "express";
import { config, requireRuntimeConfig } from "../config.js";
import { parseOrThrow, runtimeCreateRunSchema, runtimeAdvanceRunSchema } from "../contracts/schemas.contract.js";
import { assertRunId } from "../utils/run-id.js";
import { getRunRecord, getArtifactMetadata, listArtifactMetadata } from "../services/storage/firestore.service.js";
import { readJsonArtifactFromDrive } from "../services/storage/drive.service.js";
import { sendError } from "../errors.js";
import { CENTRAL_PHASES } from "../contracts/central-phase.contract.js";
import { createDiligenceRun } from "../services/runs.service.js";
import { requestPipelineAdvance } from "../services/async-phase13.service.js";
import {
  readQualifiedReviewDraft,
  saveQualifiedReviewDraft,
  attestQualifiedReviewSection,
  createQualifiedReviewSubmissionRequest,
  QUALIFIED_REVIEW_SUBMISSION_REQUEST_ARTIFACT
} from "../services/qualified-review-draft.service.js";
import { rebuildQualifiedReviewWorkspace } from "../services/qualified-review-workspace.service.js";

export const publicRouter = express.Router();

const PRIVATE_ANNEXURE_ARTIFACTS = new Set([
  "qualified_review_draft",
  "qualified_review_submission_request",
  "qualified_review_submission",
  "qr_final_value_ledger",
  "document_activation_manifest",
  "document_assembly_payload",
  "review_ready_draft_manifest",
  "document_assembly_validation_manifest"
]);
const NON_ANNEXURE_UI_ARTIFACTS = new Set(["renderer_payload", "qualified_review_handoff", "qualified_review_renderer_payload"]);

publicRouter.get("/runtime/central-phases", (_req, res) => res.json({ ok: true, phases: CENTRAL_PHASES }));

publicRouter.use((req, res, next) => {
  if (!config.publicReviewerEnabled) return res.status(404).json({ ok: false, error: "PUBLIC_DILIGENCE_SYSTEM_DISABLED", message: "Public diligence-system routes are disabled." });
  return next();
});

publicRouter.all(["/reviewer", "/reviewer/*"], (_req, res) => res.status(410).json({ ok: false, error: "PUBLIC_REVIEWER_ALIAS_RETIRED", message: "Public reviewer routes are retired. Use /public/diligence-system routes." }));

publicRouter.post("/diligence-system/jobs", async (req, res) => {
  try {
    requireRuntimeConfig();
    const body = parseOrThrow(runtimeCreateRunSchema, req.body);
    const run = await createDiligenceRun({ target: body.target, target_url: body.target_url, source_mode: "url", created_by: "public-diligence-system", notes: body.notes, runner_mode: "CLOUD_TASKS_RUNNER", runner_state: "IDLE" });
    return res.status(201).json(publicRunResponse(run));
  } catch (error) { return sendError(res, error); }
});

publicRouter.post("/diligence-system/jobs-with-documents", (_req, res) => res.status(409).json({ ok: false, error: "DOCUMENT_UPLOAD_17_ROOT_CUTOVER_REQUIRED", message: "Uploaded-document intake is fenced until it is rebuilt against the active 17-root Source Discovery contract. The retired lossless-family uploader is not permitted in the central runtime." }));

publicRouter.get("/diligence-system/jobs/:run_id", async (req, res) => {
  try {
    assertRunId(req.params.run_id);
    const run = await getRunRecord(req.params.run_id);
    const artifacts = await listArtifactMetadata(req.params.run_id);
    return res.json({ ok: true, run: publicRunResponse(run, { artifact_count: artifacts.length }), artifacts: publicArtifactList(artifacts) });
  } catch (error) { return sendError(res, error); }
});

publicRouter.post("/diligence-system/jobs/:run_id/advance", async (req, res) => {
  try {
    assertRunId(req.params.run_id);
    const body = parseOrThrow(runtimeAdvanceRunSchema, req.body || {});
    if (body.sync) throw new Error("SYNC_ADVANCE_RETIRED:Use async /advance and poll /public/diligence-system/jobs/:run_id instead.");
    const result = await requestPipelineAdvance({
      run_id: req.params.run_id,
      requested_by: "public-diligence-system",
      base_url: baseUrlFromRequest(req),
      auto_continue: body.auto_continue,
      authorize_assembly: body.authorize_assembly,
      action: body.action,
      authorized_by: body.authorized_by
    });
    return res.status(result.queued ? 202 : 200).json(publicAsyncResponse(result));
  } catch (error) { return sendError(res, error); }
});

publicRouter.get("/diligence-system/report/:run_id", async (req, res) => {
  try {
    assertRunId(req.params.run_id);
    const rendererPayload = await readRequiredArtifact(req.params.run_id, "renderer_payload");
    return res.json({ ok: true, run_id: req.params.run_id, renderer_payload: rendererPayload });
  } catch (error) { return sendError(res, error); }
});

publicRouter.get("/diligence-system/technical-annexure/:run_id", async (req, res) => {
  try {
    assertRunId(req.params.run_id);
    const run = await getRunRecord(req.params.run_id);
    const artifacts = await listArtifactMetadata(req.params.run_id);
    return res.json(publicTechnicalAnnexureResponse({ run, artifacts }));
  } catch (error) { return sendError(res, error); }
});

publicRouter.get(["/diligence-system/qualified-review/:run_id", "/diligence-system/jobs/:run_id/qualified-review"], async (req, res) => {
  try {
    assertRunId(req.params.run_id);
    return res.json(await qualifiedReviewResponse(req.params.run_id));
  } catch (error) {
    const message = String(error?.message || error);
    if (message.includes("ARTIFACT_NOT_FOUND") || message.includes("QUALIFIED_REVIEW")) return res.status(409).json({ ok: false, error: "QUALIFIED_REVIEW_NOT_READY", message: "Qualified Review has not been generated for this run." });
    return sendError(res, error);
  }
});

publicRouter.put("/diligence-system/qualified-review/:run_id/draft", async (req, res) => {
  try {
    requireRuntimeConfig();
    assertRunId(req.params.run_id);
    const run = await getRunRecord(req.params.run_id);
    const handoff = await readRequiredArtifact(req.params.run_id, "qualified_review_handoff");
    const saved = await saveQualifiedReviewDraft({ run, handoff, request_body: req.body || {} });
    await rebuildQualifiedReviewWorkspace({ run: await getRunRecord(req.params.run_id), reviewer_values: saved.artifact.field_edits || {} });
    return res.json(await qualifiedReviewResponse(req.params.run_id));
  } catch (error) { return sendError(res, error); }
});

publicRouter.put("/diligence-system/qualified-review/:run_id/sections/:section_id/attestation", async (req, res) => {
  try {
    requireRuntimeConfig();
    assertRunId(req.params.run_id);
    const run = await getRunRecord(req.params.run_id);
    const handoff = await readRequiredArtifact(req.params.run_id, "qualified_review_handoff");
    const saved = await attestQualifiedReviewSection({ run, handoff, section_id: req.params.section_id, request_body: req.body || {} });
    await rebuildQualifiedReviewWorkspace({ run: await getRunRecord(req.params.run_id), reviewer_values: saved.artifact.field_edits || {} });
    return res.json(await qualifiedReviewResponse(req.params.run_id));
  } catch (error) { return sendError(res, error); }
});

publicRouter.post("/diligence-system/qualified-review/:run_id/submit", async (req, res) => {
  try {
    requireRuntimeConfig();
    assertRunId(req.params.run_id);
    const run = await getRunRecord(req.params.run_id);
    const handoff = await readRequiredArtifact(req.params.run_id, "qualified_review_handoff");
    const draft = await readQualifiedReviewDraft(req.params.run_id);
    const saved = await createQualifiedReviewSubmissionRequest({ run, handoff, draft });
    return res.status(201).json({ ok: true, run_id: req.params.run_id, artifact_name: saved.artifact_name, version: saved.version, qualified_review_submission_request: saved.artifact });
  } catch (error) { return sendError(res, error); }
});

publicRouter.post("/diligence-system/qualified-review/:run_id/responses", (_req, res) => res.status(410).json({ ok: false, error: "QUALIFIED_REVIEW_MATRIX_SUBMISSION_RETIRED", message: "Per-question matrix submission is retired. Use section-attested Qualified Review draft and submit routes." }));

async function qualifiedReviewResponse(runId) {
  const run = await getRunRecord(runId);
  const reportPayload = await readOptionalArtifact(runId, "renderer_payload");
  const handoff = await readRequiredArtifact(runId, "qualified_review_handoff");
  const rendererPayload = await readRequiredArtifact(runId, "qualified_review_renderer_payload");
  const validationManifest = await readRequiredArtifact(runId, "qualified_review_validation_manifest");
  const activeLedger = await readRequiredArtifact(runId, "qr_active_field_ledger");
  const registryResolution = await readRequiredArtifact(runId, "qr_registry_resolution_manifest");
  const draft = await readQualifiedReviewDraft(runId);
  const submissionRequest = await readOptionalArtifact(runId, QUALIFIED_REVIEW_SUBMISSION_REQUEST_ARTIFACT);
  return {
    ok: true,
    run_id: runId,
    public_label: "Qualified Review",
    system_boundary: { source_system: "Interface Diligence Engine", qualified_review_is_separate_system: true, shares_pipeline_run_id: true, no_document_assembly: true, confirmation_unit: "SECTION", per_question_confirmation_forbidden: true },
    run_status: run.status,
    current_phase: run.current_phase,
    central_phase: run.central_phase || "",
    central_phase_label: run.central_phase_label || "",
    report_ready: Boolean(reportPayload),
    report_summary: { validation_status: reportPayload?.validation_status || reportPayload?.report_shell?.validation_status || "", report_title: reportPayload?.report_shell?.report_title || "Interface Diligence Report" },
    qualified_review_handoff: handoff,
    qualified_review_renderer_payload: rendererPayload,
    qualified_review_validation_manifest: validationManifest,
    qr_active_field_ledger: activeLedger,
    qr_registry_resolution_manifest: registryResolution,
    qualified_review_draft: draft,
    qualified_review_submission_request: submissionRequest
  };
}

async function readRequiredArtifact(runId, artifactName) { const meta = await getArtifactMetadata(runId, artifactName); return readJsonArtifactFromDrive(meta.drive_file_id); }
async function readOptionalArtifact(runId, artifactName) { try { return await readRequiredArtifact(runId, artifactName); } catch (error) { if (String(error?.message || error).startsWith(`ARTIFACT_NOT_FOUND:${runId}:${artifactName}`)) return null; throw error; } }
function publicRunResponse(run, options = {}) { return { ok: true, run_id: run.run_id, target: run.target, root_url: run.root_url, source_mode: run.source_mode || "url", uploaded_source_documents: run.uploaded_source_documents || { document_count: 0 }, status: run.status, current_phase: run.current_phase, central_phase: run.central_phase || "", central_phase_label: run.central_phase_label || "", runner_mode: run.runner_mode || "", runner_state: run.runner_state || "", runner_last_error: safeRunnerDiagnostic(run.runner_last_error), runner_failed_at: run.runner_failed_at || "", runner_worker_started_at: run.runner_worker_started_at || "", runner_worker_heartbeat_at: run.runner_worker_heartbeat_at || "", runner_requested_at: run.runner_requested_at || "", runner_last_completed_at: run.runner_last_completed_at || "", runner_task_name: run.runner_task_name || "", artifact_count: Number.isFinite(options.artifact_count) ? options.artifact_count : Number(run.artifact_count || 0), final_report_url: run.final_report_url || "", diligence_qa_complete: run.diligence_qa_complete === true, assembly_authorized: run.assembly_authorized === true, assembly_complete: run.assembly_complete === true, generated_document_count: Number(run.generated_document_count || 0), created_at: run.created_at, updated_at: run.updated_at, poll: `/public/diligence-system/jobs/${run.run_id}` }; }
function publicAsyncResponse(result) { return { ok: true, async: true, queued: result.queued, already_running: result.already_running, terminal: result.terminal, paused: result.paused === true, run_id: result.run_id, status: result.status, current_phase: result.current_phase, central_phase: result.central_phase || "", central_phase_label: result.central_phase_label || "", runner_mode: result.runner_mode || "", runner_state: result.runner_state, runner_last_error: safeRunnerDiagnostic(result.runner_last_error), artifact_count: Number(result.artifact_count || 0), poll: `/public/diligence-system/jobs/${result.run_id}` }; }
function publicArtifactList(artifacts) { return artifacts.map((artifact) => ({ artifact_name: artifact.artifact_name, phase: artifact.phase, lock_status: artifact.lock_status, latest_version: artifact.latest_version || artifact.version, updated_at: artifact.updated_at || artifact.created_at })); }
function publicTechnicalAnnexureResponse({ run, artifacts }) { const rows = publicTechnicalAnnexureArtifactList(artifacts); return { ok: true, run_id: run.run_id, public_label: "Public Technical Annexure", layer_id: "layer_2_public_technical_annexure", target: run.target, target_url: run.root_url, status: run.status, current_phase: run.current_phase, expected_pack_name: "technical_annexure_pack.zip", manifest_only: true, report_body_inlines_full_payloads: false, exclusion_rule: "Excludes platform secrets, provider telemetry, raw infrastructure logs, and private reviewer submissions.", artifact_count: rows.length, artifacts: rows, endpoint_contract: { public_manifest_route: true, full_payload_zip_export: false, full_payloads_inline: false } }; }
function publicTechnicalAnnexureArtifactList(artifacts) { return artifacts.map((artifact) => { const name = artifact.artifact_name || ""; const privateExcluded = PRIVATE_ANNEXURE_ARTIFACTS.has(name); const uiExcluded = NON_ANNEXURE_UI_ARTIFACTS.has(name); return { artifact_name: name, phase: artifact.phase, lock_status: artifact.lock_status, latest_version: artifact.latest_version || artifact.version, updated_at: artifact.updated_at || artifact.created_at, included_in_public_annexure_manifest: !privateExcluded && !uiExcluded, exclusion_reason: privateExcluded ? "PRIVATE_REVIEWER_OR_DOCUMENT_STATE" : uiExcluded ? "UI_ARTIFACT_NOT_TECHNICAL_ANNEXURE" : "" }; }).filter((row) => row.included_in_public_annexure_manifest); }
function baseUrlFromRequest(req) { const proto = String(req.get("x-forwarded-proto") || req.protocol || "https").split(",")[0].trim() || "https"; const host = String(req.get("x-forwarded-host") || req.get("host") || "").split(",")[0].trim(); return host ? `${proto}://${host}` : ""; }
function safeRunnerDiagnostic(value) { return String(value || "").replace(/GEMINI_API_KEYS_\d+/g, "provider-key").slice(0, 1000); }
