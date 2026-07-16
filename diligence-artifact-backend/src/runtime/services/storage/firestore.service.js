import { initializeApp, getApps, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { config } from "../runtime-config.service.js";
import { assertRunId, nowIso } from "../../utils/run-id.js";

let cachedDb = null;
const SOURCE_DISCOVERY_JOB_IDS = new Set(["AGENT_1A_URL_MANIFEST", "AGENT_1B_EXTRACT", "M6_BUCKET_INDEX"]);

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
  const ref = runRef(runId);
  const [artifactDoc, runDoc] = await Promise.all([
    ref.collection("artifacts").doc(artifactName).get(),
    ref.get()
  ]);
  return resolveNextArtifactVersion({
    artifact_metadata: artifactDoc.exists ? artifactDoc.data() : null,
    run_record: runDoc.exists ? runDoc.data() : null
  });
}

export function resolveNextArtifactVersion({ artifact_metadata, run_record } = {}) {
  if (!artifact_metadata) return 1;
  const latest = Math.max(1, Number(artifact_metadata.latest_version || artifact_metadata.version || 1));
  return isSourceDiscoveryPersistenceContext(run_record) ? latest : latest + 1;
}

export function isSourceDiscoveryPersistenceContext(runRecord = {}) {
  if (runRecord.central_phase === "SOURCE_DISCOVERY") return true;
  if (SOURCE_DISCOVERY_JOB_IDS.has(runRecord.active_internal_job)) return true;
  if (SOURCE_DISCOVERY_JOB_IDS.has(runRecord.current_phase)) return true;
  return false;
}

export async function saveArtifactMetadata({ run_id, artifact_name, phase, agent_id, lock_status, version, drive_file_id, drive_web_view_link, drive_folder_id, artifact_size_bytes }) {
  const at = nowIso();
  const artifactRef = runRef(run_id).collection("artifacts").doc(artifact_name);
  const versionRef = artifactRef.collection("versions").doc(`v${version}`);
  const existing = await artifactRef.get();
  const previous = existing.exists ? existing.data() : {};
  const samePhysicalFile = Boolean(previous.drive_file_id && previous.drive_file_id === drive_file_id && Number(previous.latest_version || previous.version || 0) === Number(version));
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
    persistence_mode: samePhysicalFile ? "IDEMPOTENT_IN_PLACE" : "VERSIONED_CREATE",
    write_revision: samePhysicalFile ? Number(previous.write_revision || 1) + 1 : 1,
    created_at: previous.created_at || at,
    updated_at: at
  };
  await versionRef.set(versionMeta, { merge: true });
  await artifactRef.set({ ...versionMeta, latest_version: version }, { merge: true });
  await logEvent({
    run_id,
    event_type: samePhysicalFile ? "ARTIFACT_REPERSISTED_IDEMPOTENTLY" : "ARTIFACT_SAVED",
    actor: agent_id,
    payload: { artifact_name, phase, lock_status, version, drive_file_id, persistence_mode: versionMeta.persistence_mode, write_revision: versionMeta.write_revision }
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
  collection_root: "runs",
  phase1_artifact_version_reuse: true,
  downstream_artifact_version_increment_preserved: true,
  idempotent_rewrite_revision_tracked: true
});
