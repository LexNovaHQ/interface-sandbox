import { config, requireRuntimeConfig } from "./config.js";
import { assertRunId } from "./run-id.js";
import { assertKnownArtifactName, assertKnownPhase } from "./constants.js";
import { assertCanReadArtifact, assertCanWriteArtifact } from "./permissions.js";
import { saveArtifactSchema, lockPhaseSchema, parseOrThrow } from "./schemas.js";
import { saveJsonArtifactToDrive, readJsonArtifactFromDrive } from "./drive.js";
import { updateRunDashboardRow } from "./sheets.js";
import {
  getRunRecord,
  updateRunRecord,
  getNextArtifactVersion,
  saveArtifactMetadata,
  getArtifactMetadata,
  listArtifactMetadata,
  logEvent
} from "./firestore.js";
import { getRequiredWritesForPhase } from "./phase-contracts.js";

const LOCK_ADVANCE_STATUSES = new Set(["LOCKED", "LOCKED_WITH_LIMITATIONS", "COMPLETE"]);

export async function saveArtifact(input) {
  requireRuntimeConfig();
  const parsed = parseOrThrow(saveArtifactSchema, input);
  assertRunId(parsed.run_id);
  assertKnownPhase(parsed.phase);
  assertKnownArtifactName(parsed.artifact_name);
  assertCanWriteArtifact(parsed.agent_id, parsed.artifact_name);

  const run = await getRunRecord(parsed.run_id);
  const version = await getNextArtifactVersion(parsed.run_id, parsed.artifact_name);
  const driveResult = await saveJsonArtifactToDrive({
    run_id: parsed.run_id,
    artifact_name: parsed.artifact_name,
    version,
    drive_folder_id: run.drive_folder_id,
    artifact: parsed.artifact
  });

  const meta = await saveArtifactMetadata({
    run_id: parsed.run_id,
    artifact_name: parsed.artifact_name,
    phase: parsed.phase,
    agent_id: parsed.agent_id,
    lock_status: parsed.lock_status,
    version,
    drive_file_id: driveResult.drive_file_id,
    drive_web_view_link: driveResult.drive_web_view_link,
    drive_folder_id: run.drive_folder_id,
    artifact_size_bytes: driveResult.artifact_size_bytes
  });

  await updateRunRecord(parsed.run_id, {
    current_phase: parsed.phase,
    status: parsed.lock_status
  });

  return {
    ok: true,
    run_id: parsed.run_id,
    artifact_name: parsed.artifact_name,
    version,
    lock_status: parsed.lock_status,
    drive_file_id: meta.drive_file_id,
    drive_web_view_link: meta.drive_web_view_link,
    receipt: `${parsed.artifact_name}_v${version} saved for ${parsed.run_id}`
  };
}

export async function readArtifact({ run_id, artifact_name, agent_id = "operator" }) {
  assertRunId(run_id);
  assertKnownArtifactName(artifact_name);
  assertCanReadArtifact(agent_id, artifact_name);

  await getRunRecord(run_id);
  const meta = await getArtifactMetadata(run_id, artifact_name);
  const artifact = await readJsonArtifactFromDrive(meta.drive_file_id);

  return {
    ok: true,
    run_id,
    artifact_name,
    version: meta.latest_version || meta.version,
    lock_status: meta.lock_status,
    artifact
  };
}

export async function readArtifactPayload({ run_id, artifact_name, agent_id = "operator" }) {
  const result = await readArtifact({ run_id, artifact_name, agent_id });
  return result.artifact;
}

export async function listArtifacts(runId) {
  assertRunId(runId);
  return listArtifactMetadata(runId);
}

export async function assertRequiredArtifactsExist(runId, artifactNames) {
  for (const artifactName of artifactNames) {
    await getArtifactMetadata(runId, artifactName);
  }
}

export async function lockPhase(input) {
  const body = parseOrThrow(lockPhaseSchema, input);
  assertRunId(body.run_id);
  assertKnownPhase(body.phase);

  if (LOCK_ADVANCE_STATUSES.has(body.status) && body.phase !== "COMPLETE") {
    await assertRequiredArtifactsExist(body.run_id, getRequiredWritesForPhase(body.phase));
  }

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

  return {
    ok: true,
    run_id: body.run_id,
    phase: body.phase,
    status: body.status,
    next_phase: body.next_phase || null
  };
}

export function buildReportUrl(runId) {
  const base = config.reviewerPublicBaseUrl || config.rendererBaseUrl || "";
  if (!base) return "";
  const clean = base.replace(/\/$/, "");
  return `${clean}/interface-diligence/reviewer/report.html?run_id=${encodeURIComponent(runId)}`;
}

export function artifactSaveBody({ run_id, phase, agent_id, artifact_name, artifact, lock_status = "LOCKED" }) {
  return { run_id, phase, agent_id, artifact_name, lock_status, artifact };
}
