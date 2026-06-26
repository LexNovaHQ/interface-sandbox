import express from "express";
import helmet from "helmet";
import cors from "cors";
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
    storage: {
      firestore: "runs/{run_id}",
      drive: "one_folder_per_run",
      sheets: "dashboard_only"
    },
    config: configStatus(),
    permissions: publicPermissionMatrix()
  });
});

app.use("/public", publicReviewerRouter);
app.use("/v1", requireApiKey);
app.use("/v1", reviewerRouter);
app.use("/agent2", requireApiKey);
app.use("/agent3", requireApiKey);

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
      current_phase: "URL_MANIFEST",
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
      next_action: `POST /v1/reviewer/jobs/${runId}/advance`
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

app.get("/agent3/health", (_req, res) => {
  res.json({
    ok: true,
    service: config.serviceName,
    agent_id: "agent_3_target_feature",
    phases: ["M7_TARGET_PROFILE", "M8_TARGET_FEATURE_PROFILE"],
    mode: "artifact_backend_plus_reviewer_runner"
  });
});

app.get("/agent2/health", (_req, res) => {
  res.json({
    ok: true,
    service: config.serviceName,
    agent_id: "agent_3_target_feature",
    legacy_alias: "agent2",
    canonical_agent: "agent3",
    phases: ["M7_TARGET_PROFILE", "M8_TARGET_FEATURE_PROFILE"],
    mode: "artifact_backend_plus_reviewer_runner"
  });
});

app.get("/agent3/runs/:run_id/source-discovery-handoff", agent3ReadRoute("source_discovery_handoff"));
app.get("/agent3/runs/:run_id/legal-cartography-index", agent3ReadRoute("legal_cartography_index"));
app.get("/agent2/runs/:run_id/source-discovery-handoff", agent3ReadRoute("source_discovery_handoff"));
app.get("/agent2/runs/:run_id/legal-cartography-index", agent3ReadRoute("legal_cartography_index"));

app.post("/agent3/runs/:run_id/target-profile", agent3SaveRoute("target_profile"));
app.post("/agent3/runs/:run_id/target-profile-forensics", agent3SaveRoute("target_profile_forensics"));
app.post("/agent3/runs/:run_id/target-feature-profile", agent3SaveRoute("target_feature_profile"));
app.post("/agent3/runs/:run_id/target-feature-profile-forensics", agent3SaveRoute("target_feature_profile_forensics"));
app.post("/agent2/runs/:run_id/target-profile", agent3SaveRoute("target_profile"));
app.post("/agent2/runs/:run_id/target-profile-forensics", agent3SaveRoute("target_profile_forensics"));
app.post("/agent2/runs/:run_id/target-feature-profile", agent3SaveRoute("target_feature_profile"));
app.post("/agent2/runs/:run_id/target-feature-profile-forensics", agent3SaveRoute("target_feature_profile_forensics"));

app.post("/agent3/runs/:run_id/lock-m7-m8", agent3LockRoute);
app.post("/agent2/runs/:run_id/lock-m7-m8", agent3LockRoute);

app.post("/v1/artifacts/save", saveArtifactHandler);
app.post("/v1/artifacts/save-source-discovery", saveArtifactHandler);
app.post("/v1/artifacts/save-legal-cartography", saveArtifactHandler);
app.post("/v1/artifacts/save-target-profile", saveArtifactHandler);
app.post("/v1/artifacts/save-target-profile-forensics", saveArtifactHandler);
app.post("/v1/artifacts/save-target-feature-profile", saveArtifactHandler);
app.post("/v1/artifacts/save-target-feature-profile-forensics", saveArtifactHandler);
app.post("/v1/artifacts/save-data-provenance-profile", saveArtifactHandler);
app.post("/v1/artifacts/save-exposure-registry-profile", saveArtifactHandler);
app.post("/v1/artifacts/save-challenge-gate", saveArtifactHandler);
app.post("/v1/artifacts/save-final-output-handoff", saveArtifactHandler);
app.post("/v1/artifacts/save-renderer-payload", saveArtifactHandler);

app.get("/v1/artifacts/:run_id/:artifact_name", async (req, res) => {
  try {
    const { run_id, artifact_name } = req.params;
    const agentId = resolveAgentId(req);
    const result = await readArtifact({ run_id, artifact_name, agent_id: agentId });
    return res.json(result);
  } catch (error) {
    return sendError(res, error);
  }
});

app.post("/v1/phases/lock", async (req, res) => {
  try {
    const result = await lockPhase(req.body);
    return res.json(result);
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

function agent3ReadRoute(artifactName) {
  return async (req, res) => {
    try {
      const result = await readArtifact({
        run_id: req.params.run_id,
        artifact_name: artifactName,
        agent_id: "agent_3_target_feature"
      });
      return res.json(result);
    } catch (error) {
      return sendError(res, error);
    }
  };
}

function agent3SaveRoute(artifactName) {
  return async (req, res) => {
    try {
      const suppliedArtifactName = req.body?.artifact_name;
      if (suppliedArtifactName && suppliedArtifactName !== artifactName) {
        throw new Error(`INVALID_ARTIFACT_NAME:${suppliedArtifactName}:expected:${artifactName}`);
      }

      const result = await saveArtifact(artifactSaveBody({
        run_id: req.params.run_id,
        phase: agent3PhaseForArtifact(artifactName),
        agent_id: "agent_3_target_feature",
        artifact_name: artifactName,
        lock_status: req.body?.lock_status || "LOCKED",
        artifact: req.body?.artifact
      }));
      return res.status(201).json(result);
    } catch (error) {
      return sendError(res, error);
    }
  };
}

async function agent3LockRoute(req, res) {
  try {
    const lockStatus = req.body?.lock_status || req.body?.status;
    if (!lockStatus) throw new Error("INVALID_REQUEST:lock_status: Required");

    const result = await lockPhase({
      run_id: req.params.run_id,
      phase: "M8_TARGET_FEATURE_PROFILE",
      agent_id: "agent_3_target_feature",
      status: lockStatus,
      next_phase: ["LOCKED", "LOCKED_WITH_LIMITATIONS"].includes(lockStatus) ? "M10" : null,
      final_report_url: ""
    });

    return res.json({
      ok: true,
      run_id: result.run_id,
      phase: "M7_M8",
      backend_phase: result.phase,
      lock_status: result.status,
      next_phase: result.next_phase,
      receipt: `M7_M8 ${result.status} for ${result.run_id}`
    });
  } catch (error) {
    return sendError(res, error);
  }
}

function agent3PhaseForArtifact(artifactName) {
  if (artifactName === "target_profile" || artifactName === "target_profile_forensics") {
    return "M7_TARGET_PROFILE";
  }
  return "M8_TARGET_FEATURE_PROFILE";
}

async function saveArtifactHandler(req, res) {
  try {
    const result = await saveArtifact(req.body);
    return res.status(201).json(result);
  } catch (error) {
    return sendError(res, error);
  }
}

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
  if (message.startsWith("INVALID_") || message.startsWith("READ_FORBIDDEN") || message.startsWith("WRITE_FORBIDDEN") || message.startsWith("PHASE_LOCK_BLOCKED") || message.startsWith("SOURCE_EXTRACTION_BLOCKED")) return 400;
  if (message.startsWith("MISSING_RUNTIME_CONFIG")) return 500;
  if (message.startsWith("GEMINI_CALL_FAILED")) return 502;
  return 500;
}

function publicErrorCode(message) {
  return String(message).split(":")[0] || "ARTIFACT_BACKEND_ERROR";
}
