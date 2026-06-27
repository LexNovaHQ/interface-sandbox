import { config, requireRuntimeConfig } from "./config.js";
import { assertRunId } from "./run-id.js";
import { assertKnownArtifactName, assertKnownPhase, assertPhaseCanWriteArtifact } from "./constants.js";
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
const ACCEPTED_PHASE_STATUSES = new Set(["LOCKED", "LOCKED_WITH_LIMITATIONS"]);

export async function saveArtifact(input) {
  requireRuntimeConfig();
  const parsed = parseOrThrow(saveArtifactSchema, input);
  assertRunId(parsed.run_id);
  assertKnownPhase(parsed.phase);
  assertKnownArtifactName(parsed.artifact_name);
  assertCanWriteArtifact(parsed.agent_id, parsed.artifact_name);
  assertPhaseCanWriteArtifact(parsed.phase, parsed.artifact_name);

  await assertArtifactSaveOrder(parsed);

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

  await logEvent({
    run_id: parsed.run_id,
    event_type: "ARTIFACT_SAVED",
    actor: parsed.agent_id,
    payload: {
      phase: parsed.phase,
      artifact_name: parsed.artifact_name,
      version,
      lock_status: parsed.lock_status,
      save_order_gate: "PASS"
    }
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

async function assertArtifactSaveOrder(parsed) {
  const { run_id, phase, artifact_name } = parsed;

  if (artifact_name === "target_profile_forensics") {
    await requireSavedArtifact(run_id, "target_profile", "SAVE_ORDER_BLOCKED:target_profile_forensics_requires_target_profile");
  }

  if (artifact_name === "target_feature_profile") {
    await requireSavedArtifact(run_id, "target_profile", "SAVE_ORDER_BLOCKED:target_feature_profile_requires_target_profile");
    await requireSavedArtifact(run_id, "target_profile_forensics", "SAVE_ORDER_BLOCKED:target_feature_profile_requires_target_profile_forensics");
    await requirePhaseAccepted(run_id, "target_profile_forensics", "SAVE_ORDER_BLOCKED:target_feature_profile_requires_locked_m7");
  }

  if (artifact_name === "target_feature_profile_forensics") {
    await requireSavedArtifact(run_id, "target_profile", "SAVE_ORDER_BLOCKED:target_feature_profile_forensics_requires_target_profile");
    await requireSavedArtifact(run_id, "target_profile_forensics", "SAVE_ORDER_BLOCKED:target_feature_profile_forensics_requires_target_profile_forensics");
    await requirePhaseAccepted(run_id, "target_profile_forensics", "SAVE_ORDER_BLOCKED:target_feature_profile_forensics_requires_locked_m7");
    await requireSavedArtifact(run_id, "target_feature_profile", "SAVE_ORDER_BLOCKED:target_feature_profile_forensics_requires_target_feature_profile");
  }

  if (artifact_name === "data_provenance_profile") {
    await requireSavedArtifact(run_id, "target_feature_profile", "SAVE_ORDER_BLOCKED:data_provenance_requires_target_feature_profile");
    await requireSavedArtifact(run_id, "target_feature_profile_forensics", "SAVE_ORDER_BLOCKED:data_provenance_requires_target_feature_profile_forensics");
    await requirePhaseAccepted(run_id, "target_feature_profile_forensics", "SAVE_ORDER_BLOCKED:data_provenance_requires_locked_m8");
  }

  if (artifact_name === "data_provenance_profile_forensics") {
    await requireSavedArtifact(run_id, "data_provenance_profile", "SAVE_ORDER_BLOCKED:data_provenance_forensics_requires_data_provenance_profile");
    await requirePhaseAccepted(run_id, "data_provenance_profile", "SAVE_ORDER_BLOCKED:data_provenance_forensics_requires_locked_m10_material");
  }

  if (phase === "M7_TARGET_PROFILE" && !["target_profile", "target_profile_forensics"].includes(artifact_name)) {
    throw new Error(`PHASE_WRITE_FORBIDDEN:${phase}:${artifact_name}`);
  }

  if (phase === "M8_TARGET_FEATURE_PROFILE" && !["target_feature_profile", "target_feature_profile_forensics"].includes(artifact_name)) {
    throw new Error(`PHASE_WRITE_FORBIDDEN:${phase}:${artifact_name}`);
  }
}

async function requireSavedArtifact(runId, artifactName, message) {
  try {
    await getArtifactMetadata(runId, artifactName);
  } catch (_error) {
    throw new Error(message);
  }
}

async function requirePhaseAccepted(runId, artifactName, message) {
  let meta;
  try {
    meta = await getArtifactMetadata(runId, artifactName);
  } catch (_error) {
    throw new Error(message);
  }
  if (!ACCEPTED_PHASE_STATUSES.has(meta.lock_status)) {
    throw new Error(`${message}:status:${meta.lock_status || "missing"}`);
  }
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

  if (body.phase === "M8_TARGET_FEATURE_PROFILE") {
    await requireSavedArtifact(body.run_id, "target_profile", "PHASE_LOCK_BLOCKED:M8_requires_target_profile");
    await requireSavedArtifact(body.run_id, "target_profile_forensics", "PHASE_LOCK_BLOCKED:M8_requires_target_profile_forensics");
    await requirePhaseAccepted(body.run_id, "target_profile_forensics", "PHASE_LOCK_BLOCKED:M8_requires_locked_m7");
  }

  if (body.phase === "M10") {
    await requireSavedArtifact(body.run_id, "target_feature_profile", "PHASE_LOCK_BLOCKED:M10_requires_target_feature_profile");
    await requireSavedArtifact(body.run_id, "target_feature_profile_forensics", "PHASE_LOCK_BLOCKED:M10_requires_target_feature_profile_forensics");
    await requirePhaseAccepted(body.run_id, "target_feature_profile_forensics", "PHASE_LOCK_BLOCKED:M10_requires_locked_m8");
  }

  if (body.phase === "M10_FORENSICS") {
    await requireSavedArtifact(body.run_id, "target_feature_profile", "PHASE_LOCK_BLOCKED:M10_FORENSICS_requires_target_feature_profile");
    await requireSavedArtifact(body.run_id, "target_feature_profile_forensics", "PHASE_LOCK_BLOCKED:M10_FORENSICS_requires_target_feature_profile_forensics");
    await requirePhaseAccepted(body.run_id, "target_feature_profile_forensics", "PHASE_LOCK_BLOCKED:M10_FORENSICS_requires_locked_m8");
    await requireSavedArtifact(body.run_id, "data_provenance_profile", "PHASE_LOCK_BLOCKED:M10_FORENSICS_requires_data_provenance_profile");
    await requirePhaseAccepted(body.run_id, "data_provenance_profile", "PHASE_LOCK_BLOCKED:M10_FORENSICS_requires_locked_m10_material");
  }

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
