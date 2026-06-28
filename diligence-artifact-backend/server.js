import express from "express";
import helmet from "helmet";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config, configStatus, requireRuntimeConfig } from "./src/config.js";
import { requireApiKey, resolveAgentId } from "./src/auth.js";
import { createRunId, nowIso, assertRunId } from "./src/run-id.js";
import { publicPermissionMatrix } from "./src/permissions.js";
import { createRunSchema, parseOrThrow } from "./src/schemas.js";
import { createRunFolder, readJsonArtifactFromDrive } from "./src/drive.js";
import { appendRunDashboardRow } from "./src/sheets.js";
import { createRunRecord, getRunRecord, updateRunRecord, getArtifactMetadata, listArtifactMetadata } from "./src/firestore.js";
import { reviewerRouter } from "./src/reviewer-routes.js";
import { publicReviewerRouter } from "./src/public-reviewer-routes.js";
import { artifactSaveBody, lockPhase, readArtifact, saveArtifact } from "./src/artifact-service.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicUiDir = path.join(__dirname, "public");
const AGENT3_ID = "agent_" + "3_target_feature";
const TP = "target_" + "profile";
const TPF = "target_" + "profile_forensics";
const TFP = "target_" + "feature_profile";
const TFPF = "target_" + "feature_profile_forensics";

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: config.allowedOrigin === "*" ? true : config.allowedOrigin }));
app.use(express.json({ limit: config.expressJsonLimit }));

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: config.serviceName,
    mode: "artifact_backend_plus_reviewer_runner",
    gpt_reasoning_api: false,
    gemini_runner: true,
    storage: { firestore: "runs/{run_id}", drive: "one_folder_per_run", sheets: "dashboard_only" },
    config: configStatus(),
    permissions: publicPermissionMatrix()
  });
});

app.use("/public", publicReviewerRouter);
app.use(express.static(publicUiDir, { extensions: ["html"], index: false, maxAge: "0", etag: false }));
app.get("/", (_req, res) => res.sendFile(path.join(publicUiDir, "index.html")));
app.get("/reviewer", (_req, res) => res.redirect(308, "/reviewer/"));
app.get("/reviewer/", (_req, res) => res.sendFile(path.join(publicUiDir, "reviewer", "index.html")));
app.get("/reviewer/report.html", (_req, res) => res.sendFile(path.join(publicUiDir, "reviewer", "report.html")));

app.use("/v1", requireApiKey);
app.use("/v1", reviewerRouter);
app.use("/agent3", requireApiKey);

app.post("/v1/runs/create", async (req, res) => {
  try {
    requireRuntimeConfig();
    const body = parseOrThrow(createRunSchema, req.body);
    const createdAt = nowIso();
    const runId = createRunId(body.target);
    const folder = await createRunFolder({ run_id: runId });
    const run = { ok: true, run_id: runId, target: body.target, root_url: body.root_url, source_mode: body.source_mode, status: "CREATED", current_phase: "AGENT_1A_URL_MANIFEST", created_by: body.created_by, notes: body.notes || "", drive_folder_id: folder.drive_folder_id, drive_folder_link: folder.drive_folder_link, final_report_url: "", created_at: createdAt, updated_at: createdAt, isolation_rule: "Artifacts may be read only by exact run_id and artifact_name. Company/domain lookup is forbidden." };
    await createRunRecord(run);
    const sheetRow = await appendRunDashboardRow(run);
    const saved = await updateRunRecord(runId, { sheet_row_number: sheetRow });
    return res.status(201).json({ ok: true, run_id: runId, status: saved.status, current_phase: saved.current_phase, drive_folder_link: saved.drive_folder_link, next_action: `POST /v1/reviewer/jobs/${runId}/advance` });
  } catch (error) {
    return sendError(res, error);
  }
});

app.get("/v1/runs/:run_id", async (req, res) => {
  try {
    assertRunId(req.params.run_id);
    const run = await getRunRecord(req.params.run_id);
    const artifacts = await listArtifactMetadata(req.params.run_id);
    return res.json({ ok: true, run, artifacts });
  } catch (error) {
    return sendError(res, error);
  }
});

app.get("/agent3/health", (_req, res) => {
  res.json({ ok: true, service: config.serviceName, agent_id: AGENT3_ID, phases: ["M7_TARGET_PROFILE", "M7_TARGET_PROFILE_FORENSICS", "M8_TARGET_FEATURE_PROFILE", "M8_TARGET_FEATURE_PROFILE_FORENSICS"], mode: "artifact_backend_plus_reviewer_runner" });
});

app.get("/agent3/runs/:run_id/source-discovery-handoff", agent3ReadRoute("source_discovery_handoff"));
app.get("/agent3/runs/:run_id/legal-cartography-index", agent3ReadRoute("legal_cartography_index"));
app.post("/agent3/runs/:run_id/target-profile", agent3SaveRoute(TP));
app.post("/agent3/runs/:run_id/target-profile-forensics", agent3SaveRoute(TPF));
app.post("/agent3/runs/:run_id/target-feature-profile", agent3SaveRoute(TFP));
app.post("/agent3/runs/:run_id/target-feature-profile-forensics", agent3SaveRoute(TFPF));
app.post("/agent3/runs/:run_id/lock-m7-target-profile", agent3LockPhaseRoute("M7_TARGET_PROFILE_FORENSICS", "M8_TARGET_FEATURE_PROFILE"));
app.post("/agent3/runs/:run_id/lock-m8-target-feature-profile", agent3LockPhaseRoute("M8_TARGET_FEATURE_PROFILE_FORENSICS", "M10"));

app.post("/v1/artifacts/save", saveArtifactHandler);
app.post("/v1/artifacts/save-source-discovery", saveArtifactHandler);
app.post("/v1/artifacts/save-legal-cartography", saveArtifactHandler);
app.post("/v1/artifacts/save-target-profile", saveArtifactHandler);
app.post("/v1/artifacts/save-target-profile-forensics", saveArtifactHandler);
app.post("/v1/artifacts/save-target-feature-profile", saveArtifactHandler);
app.post("/v1/artifacts/save-target-feature-profile-forensics", saveArtifactHandler);
app.post("/v1/artifacts/save-data-provenance", saveArtifactHandler);
app.post("/v1/artifacts/save-exposure-registry", saveArtifactHandler);
app.post("/v1/artifacts/save-challenge-gate", saveArtifactHandler);
app.post("/v1/artifacts/save-compiler-payload", saveArtifactHandler);
app.post("/v1/artifacts/save-renderer-payload", saveArtifactHandler);
app.get("/v1/artifacts/:run_id/:artifact_name", async (req, res) => {
  try {
    const agentId = resolveAgentId(req);
    const data = await readArtifact({ run_id: req.params.run_id, artifact_name: req.params.artifact_name, agent_id: agentId });
    return res.json(data);
  } catch (error) {
    return sendError(res, error);
  }
});
app.post("/v1/phases/lock", async (req, res) => {
  try {
    const agentId = resolveAgentId(req);
    const data = await lockPhase({ ...req.body, agent_id: agentId });
    return res.json(data);
  } catch (error) {
    return sendError(res, error);
  }
});
app.get("/v1/renderer/:run_id", async (req, res) => {
  try {
    assertRunId(req.params.run_id);
    const meta = await getArtifactMetadata(req.params.run_id, "renderer_payload");
    const rendererPayload = await readJsonArtifactFromDrive(meta.drive_file_id);
    return res.json({ ok: true, run_id: req.params.run_id, renderer_payload: rendererPayload });
  } catch (error) {
    return sendError(res, error);
  }
});

function agent3ReadRoute(artifactName) { return async (req, res) => { try { const data = await readArtifact({ run_id: req.params.run_id, artifact_name: artifactName, agent_id: AGENT3_ID }); return res.json(data); } catch (error) { return sendError(res, error); } }; }
function agent3SaveRoute(artifactName) { return async (req, res) => { try { const body = artifactSaveBody({ ...req.body, artifact_name: artifactName, agent_id: AGENT3_ID }); const data = await saveArtifact(body); return res.json(data); } catch (error) { return sendError(res, error); } }; }
function agent3LockPhaseRoute(phase, nextPhase) { return async (req, res) => { try { const data = await lockPhase({ run_id: req.params.run_id, phase, next_phase: nextPhase, agent_id: AGENT3_ID }); return res.json(data); } catch (error) { return sendError(res, error); } }; }
async function saveArtifactHandler(req, res) { try { const agentId = resolveAgentId(req); const body = artifactSaveBody({ ...req.body, agent_id: agentId }); const data = await saveArtifact(body); return res.json(data); } catch (error) { return sendError(res, error); } }
function sendError(res, error) { const message = error?.message || String(error); const status = statusForMessage(message); return res.status(status).json({ ok: false, error: message.split(":")[0] || "BACKEND_ERROR", message }); }
function statusForMessage(message) { if (message.startsWith("UNAUTHORIZED")) return 401; if (message.includes("FORBIDDEN")) return 403; if (message.startsWith("RUN_NOT_FOUND") || message.startsWith("ARTIFACT_NOT_FOUND")) return 404; if (message.startsWith("INVALID_") || message.startsWith("READ_FORBIDDEN") || message.startsWith("WRITE_FORBIDDEN") || message.startsWith("PHASE_LOCK_BLOCKED") || message.startsWith("SOURCE_EXTRACTION_BLOCKED")) return 400; if (message.startsWith("MISSING_RUNTIME_CONFIG")) return 500; if (message.startsWith("GEMINI_CALL_FAILED")) return 502; return 500; }

app.listen(config.port, () => {
  console.log(`${config.serviceName} listening on :${config.port}`);
});
