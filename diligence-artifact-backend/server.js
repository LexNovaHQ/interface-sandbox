import express from "express";
import helmet from "helmet";
import cors from "cors";
import { config, configStatus, requireRuntimeConfig } from "./src/config.js";
import { requireApiKey, resolveAgentId } from "./src/auth.js";
import { createRunId, nowIso, assertRunId } from "./src/run-id.js";
import { assertKnownArtifactName, assertKnownPhase } from "./src/constants.js";
import { assertCanReadArtifact, assertCanWriteArtifact, publicPermissionMatrix } from "./src/permissions.js";
import { createRunSchema, saveArtifactSchema, lockPhaseSchema, parseOrThrow } from "./src/schemas.js";
import { createRunFolder, saveJsonArtifactToDrive, readJsonArtifactFromDrive } from "./src/drive.js";
import { appendRunDashboardRow, updateRunDashboardRow } from "./src/sheets.js";
import {
  createRunRecord,
  getRunRecord,
  updateRunRecord,
  getNextArtifactVersion,
  saveArtifactMetadata,
  getArtifactMetadata,
  listArtifactMetadata,
  logEvent
} from "./src/firestore.js";

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: config.allowedOrigin === "*" ? true : config.allowedOrigin }));
app.use(express.json({ limit: config.expressJsonLimit }));

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: config.serviceName,
    mode: "gpt_action_artifact_backend",
    gpt_reasoning_api: false,
    storage: {
      firestore: "runs/{run_id}",
      drive: "one_folder_per_run",
      sheets: "dashboard_only"
    },
    config: configStatus(),
    permissions: publicPermissionMatrix()
  });
});

app.use("/v1", requireApiKey);

app.post("/v1/runs/create", async (req, res) => {
  try {
    requireRuntimeConfig();
    const body = parseOrThrow(createRunSchema, req.body);
    const createdAt = nowIso();
    const runId = createRunId(body.target);
    const folder = await createRunFolder({ run_id: runId });

    const run = {
      ok: true,
      run_id: runId,
      target: body.target,
      root_url: body.root_url,
      source_mode: body.source_mode,
      status: "CREATED",
      current_phase: "M6_M9",
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

    return res.status(201).json({
      ok: true,
      run_id: runId,
      status: saved.status,
      current_phase: saved.current_phase,
      drive_folder_link: saved.drive_folder_link,
      next_action: `Run Agent 1 with run_id ${runId}`
    });
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

async function saveArtifactHandler(req, res) {
  try {
    requireRuntimeConfig();
    const body = parseOrThrow(saveArtifactSchema, req.body);
    assertRunId(body.run_id);
    assertKnownPhase(body.phase);
    assertKnownArtifactName(body.artifact_name);
    assertCanWriteArtifact(body.agent_id, body.artifact_name);

    const run = await getRunRecord(body.run_id);
    const version = await getNextArtifactVersion(body.run_id, body.artifact_name);
    const driveResult = await saveJsonArtifactToDrive({
      run_id: body.run_id,
      artifact_name: body.artifact_name,
      version,
      drive_folder_id: run.drive_folder_id,
      artifact: body.artifact
    });

    const meta = await saveArtifactMetadata({
      run_id: body.run_id,
      artifact_name: body.artifact_name,
      phase: body.phase,
      agent_id: body.agent_id,
      lock_status: body.lock_status,
      version,
      drive_file_id: driveResult.drive_file_id,
      drive_web_view_link: driveResult.drive_web_view_link,
      drive_folder_id: run.drive_folder_id,
      artifact_size_bytes: driveResult.artifact_size_bytes
    });

    await updateRunRecord(body.run_id, {
      current_phase: body.phase,
      status: body.lock_status
    });

    return res.status(201).json({
      ok: true,
      run_id: body.run_id,
      artifact_name: body.artifact_name,
      version,
      lock_status: body.lock_status,
      drive_file_id: meta.drive_file_id,
      drive_web_view_link: meta.drive_web_view_link,
      receipt: `${body.artifact_name}_v${version} saved for ${body.run_id}`
    });
  } catch (error) {
    return sendError(res, error);
  }
}

app.post("/v1/artifacts/save", saveArtifactHandler);
app.post("/v1/artifacts/save-legal-cartography", saveArtifactHandler);

app.get("/v1/artifacts/:run_id/:artifact_name", async (req, res) => {
  try {
    const { run_id, artifact_name } = req.params;
    const agentId = resolveAgentId(req);
    assertRunId(run_id);
    assertKnownArtifactName(artifact_name);
    assertCanReadArtifact(agentId, artifact_name);

    await getRunRecord(run_id);
    const meta = await getArtifactMetadata(run_id, artifact_name);
    const artifact = await readJsonArtifactFromDrive(meta.drive_file_id);

    return res.json({
      ok: true,
      run_id,
      artifact_name,
      version: meta.latest_version || meta.version,
      lock_status: meta.lock_status,
      artifact
    });
  } catch (error) {
    return sendError(res, error);
  }
});

app.post("/v1/phases/lock", async (req, res) => {
  try {
    const body = parseOrThrow(lockPhaseSchema, req.body);
    assertRunId(body.run_id);
    assertKnownPhase(body.phase);

    const existing = await getRunRecord(body.run_id);
    const patch = {
      current_phase: body.next_phase || body.phase,
      status: body.status,
      final_report_url: body.final_report_url || existing.final_report_url || ""
    };

    const updated = await updateRunRecord(body.run_id, patch);
    await updateRunDashboardRow(updated);
    await logEvent({
      run_id: body.run_id,
      event_type: "PHASE_LOCKED",
      actor: body.agent_id,
      payload: {
        phase: body.phase,
        status: body.status,
        next_phase: body.next_phase || null
      }
    });

    return res.json({
      ok: true,
      run_id: body.run_id,
      phase: body.phase,
      status: body.status,
      next_phase: body.next_phase || null
    });
  } catch (error) {
    return sendError(res, error);
  }
});

app.get("/v1/renderer/:run_id", async (req, res) => {
  try {
    const runId = req.params.run_id;
    assertRunId(runId);
    await getRunRecord(runId);
    const meta = await getArtifactMetadata(runId, "renderer_payload");
    const rendererPayload = await readJsonArtifactFromDrive(meta.drive_file_id);
    return res.json({ ok: true, run_id: runId, renderer_payload: rendererPayload });
  } catch (error) {
    return sendError(res, error);
  }
});

if (process.argv[1] && process.argv[1].endsWith("server.js")) {
  app.listen(config.port, () => {
    console.log(`${config.serviceName} listening on :${config.port}`);
  });
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
  if (message.startsWith("INVALID_") || message.startsWith("READ_FORBIDDEN") || message.startsWith("WRITE_FORBIDDEN")) return 400;
  if (message.startsWith("MISSING_RUNTIME_CONFIG")) return 500;
  return 500;
}

function publicErrorCode(message) {
  return String(message).split(":")[0] || "ARTIFACT_BACKEND_ERROR";
}
