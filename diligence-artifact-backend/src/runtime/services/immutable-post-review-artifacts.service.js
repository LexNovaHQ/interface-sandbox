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

export async function assertPostReviewArtifactsAbsent(runId, artifactNames) {
  for (const artifactName of artifactNames || []) {
    try {
      await getArtifactMetadata(runId, artifactName);
      throw new Error(`IMMUTABLE_POST_REVIEW_ARTIFACT_ALREADY_EXISTS:${artifactName}`);
    } catch (error) {
      const message = String(error?.message || error);
      if (message === `IMMUTABLE_POST_REVIEW_ARTIFACT_ALREADY_EXISTS:${artifactName}`) throw error;
      if (!message.startsWith(`ARTIFACT_NOT_FOUND:${runId}:${artifactName}`)) throw error;
    }
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
  await assertPostReviewArtifactsAbsent(run.run_id, [artifact_name]);
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
    artifact_name,
    version,
    drive_file_id: meta.drive_file_id,
    drive_web_view_link: meta.drive_web_view_link,
    artifact
  };
}
