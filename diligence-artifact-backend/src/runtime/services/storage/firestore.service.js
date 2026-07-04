import { initializeApp, getApps, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { config } from "../../config.js";
import { assertRunId, nowIso } from "../../utils/run-id.js";

let cachedDb = null;

export function getDb() {
  if (cachedDb) return cachedDb;
  if (!getApps().length) {
    initializeApp({
      credential: applicationDefault(),
      projectId: config.projectId
    });
  }
  cachedDb = getFirestore();
  return cachedDb;
}

export function runRef(runId) {
  assertRunId(runId);
  return getDb().collection("runs").doc(runId);
}

export async function createRunRecord(run) {
  await runRef(run.run_id).create(run);
  await logEvent({
    run_id: run.run_id,
    event_type: "RUN_CREATED",
    actor: run.created_by || "operator",
    payload: {
      target: run.target,
      root_url: run.root_url,
      source_mode: run.source_mode,
      central_phase: run.central_phase || "SOURCE_DISCOVERY"
    }
  });
  return run;
}

export async function getRunRecord(runId) {
  const snap = await runRef(runId).get();
  if (!snap.exists) throw new Error(`RUN_NOT_FOUND:${runId}`);
  return snap.data();
}

export async function updateRunRecord(runId, patch) {
  const ref = runRef(runId);
  const existing = await ref.get();
  if (!existing.exists) throw new Error(`RUN_NOT_FOUND:${runId}`);
  const next = { ...patch, run_id: runId, updated_at: nowIso() };
  await ref.set(next, { merge: true });
  return getRunRecord(runId);
}

export async function getNextArtifactVersion(runId, artifactName) {
  const doc = await runRef(runId).collection("artifacts").doc(artifactName).get();
  if (!doc.exists) return 1;
  return Number(doc.data()?.latest_version || 0) + 1;
}

export async function saveArtifactMetadata({ run_id, artifact_name, phase, agent_id, lock_status, version, drive_file_id, drive_web_view_link, drive_folder_id, artifact_size_bytes }) {
  const at = nowIso();
  const artifactRef = runRef(run_id).collection("artifacts").doc(artifact_name);
  const versionRef = artifactRef.collection("versions").doc(`v${version}`);
  const versionMeta = {
    run_id,
    artifact_name,
    phase,
    agent_id,
    lock_status,
    version,
    drive_file_id,
    drive_web_view_link,
    drive_folder_id,
    artifact_size_bytes,
    created_at: at
  };
  await versionRef.set(versionMeta);
  await artifactRef.set({ ...versionMeta, latest_version: version, updated_at: at }, { merge: true });
  await logEvent({
    run_id,
    event_type: "ARTIFACT_SAVED",
    actor: agent_id,
    payload: { artifact_name, phase, lock_status, version, drive_file_id }
  });
  return versionMeta;
}

export async function getArtifactMetadata(runId, artifactName) {
  const doc = await runRef(runId).collection("artifacts").doc(artifactName).get();
  if (!doc.exists) throw new Error(`ARTIFACT_NOT_FOUND:${runId}:${artifactName}`);
  return doc.data();
}

export async function listArtifactMetadata(runId) {
  const snap = await runRef(runId).collection("artifacts").get();
  return snap.docs.map((doc) => doc.data()).sort((a, b) => String(a.artifact_name).localeCompare(String(b.artifact_name)));
}

export async function logEvent({ run_id, event_type, actor = "system", payload = {} }) {
  const eventRef = runRef(run_id).collection("events").doc();
  await eventRef.set({
    run_id,
    event_id: eventRef.id,
    event_type,
    actor,
    payload,
    created_at: nowIso()
  });
}

export const FIRESTORE_STORAGE_SERVICE_STATUS = Object.freeze({
  central_runtime_service: "storage/firestore.service",
  collection_root: "runs"
});
