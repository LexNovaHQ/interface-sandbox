import { saveJsonArtifactToDrive, readJsonArtifactFromDrive } from "./storage/drive.service.js";
import {
  getArtifactMetadata,
  getNextArtifactVersion,
  saveArtifactMetadata,
  logEvent
} from "./storage/firestore.service.js";

export async function readPostReviewArtifact(runId, artifactName) {
  const meta = await getArtifactMetadata(runId, artifactName);
  return readJsonArtifactFromDrive(meta.drive_file_id);
}

export async function inspectPostReviewArtifact(runId, artifactName) {
  try {
    const meta = await getArtifactMetadata(runId, artifactName);
    const artifact = await readJsonArtifactFromDrive(meta.drive_file_id);
    return { exists: true, meta, artifact };
  } catch (error) {
    const message = String(error?.message || error);
    if (message.startsWith(`ARTIFACT_NOT_FOUND:${runId}:${artifactName}`)) return { exists: false, meta: null, artifact: null };
    throw error;
  }
}

export async function assertPostReviewArtifactsAbsent(runId, artifactNames) {
  for (const artifactName of artifactNames || []) {
    const existing = await inspectPostReviewArtifact(runId, artifactName);
    if (existing.exists) throw new Error(`IMMUTABLE_POST_REVIEW_ARTIFACT_ALREADY_EXISTS:${artifactName}`);
  }
}

export async function persistImmutablePostReviewArtifact({
  run,
  artifact_name,
  artifact,
  phase,
  agent_id,
  lock_status = "LOCKED",
  event_type = "IMMUTABLE_POST_REVIEW_ARTIFACT_SAVED"
}) {
  const existing = await inspectPostReviewArtifact(run.run_id, artifact_name);
  if (existing.exists) {
    if (!artifact.immutable_hash || existing.artifact?.immutable_hash !== artifact.immutable_hash) {
      throw new Error(`IMMUTABLE_POST_REVIEW_ARTIFACT_CONFLICT:${artifact_name}`);
    }
    await logEvent({
      run_id: run.run_id,
      event_type: "IMMUTABLE_POST_REVIEW_ARTIFACT_REUSED",
      actor: agent_id,
      payload: {
        artifact_name,
        version: existing.meta.latest_version || existing.meta.version,
        immutable_hash: artifact.immutable_hash
      }
    });
    return {
      ok: true,
      reused: true,
      artifact_name,
      version: existing.meta.latest_version || existing.meta.version,
      drive_file_id: existing.meta.drive_file_id,
      drive_web_view_link: existing.meta.drive_web_view_link,
      artifact: existing.artifact
    };
  }

  const version = await getNextArtifactVersion(run.run_id, artifact_name);
  if (version !== 1) throw new Error(`IMMUTABLE_POST_REVIEW_VERSION_INVALID:${artifact_name}:${version}`);
  const drive = await saveJsonArtifactToDrive({
    run_id: run.run_id,
    artifact_name,
    version,
    drive_folder_id: run.drive_folder_id,
    artifact
  });
  const meta = await saveArtifactMetadata({
    run_id: run.run_id,
    artifact_name,
    phase,
    agent_id,
    lock_status,
    version,
    drive_file_id: drive.drive_file_id,
    drive_web_view_link: drive.drive_web_view_link,
    drive_folder_id: run.drive_folder_id,
    artifact_size_bytes: drive.artifact_size_bytes || 0
  });
  await logEvent({
    run_id: run.run_id,
    event_type,
    actor: agent_id,
    payload: {
      artifact_name,
      version,
      phase,
      lock_status,
      immutable: true,
      immutable_hash: artifact.immutable_hash || ""
    }
  });
  return {
    ok: true,
    reused: false,
    artifact_name,
    version,
    drive_file_id: meta.drive_file_id,
    drive_web_view_link: meta.drive_web_view_link,
    artifact
  };
}
