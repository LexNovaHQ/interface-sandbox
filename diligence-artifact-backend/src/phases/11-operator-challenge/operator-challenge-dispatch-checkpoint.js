import { createHash } from "node:crypto";
import { getDb, runRef } from "../../runtime/services/storage/firestore.service.js";

export const PHASE11_DISPATCH_CHECKPOINT_VERSION = "phase11_dispatch_checkpoint.v1";
export const PHASE11_DISPATCH_LEASE_VERSION = "phase11_dispatch_lease.v1";
const LEASE_MS = 10 * 60 * 1000;

export async function acquirePhase11DispatchLease({ runId, dispatch, workerId = "phase11-runtime" } = {}) {
  const db = getDb();
  const ref = runRef(runId).collection("phase11_dispatch_leases").doc(dispatch.dispatch_id);
  const now = Date.now();
  const expiresAt = now + LEASE_MS;
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const existing = snap.exists ? snap.data() : null;
    if (existing?.active === true && Number(existing.expires_at_epoch || 0) > now) throw new Error(`PHASE11_DISPATCH_LEASE_HELD:${dispatch.dispatch_id}`);
    tx.set(ref, { schema_version: PHASE11_DISPATCH_LEASE_VERSION, run_id: runId, dispatch_id: dispatch.dispatch_id, challenge_candidate_id: dispatch.challenge_candidate_id, attempt_number: dispatch.attempt_number, worker_id: workerId, active: true, acquired_at_epoch: now, expires_at_epoch: expiresAt }, { merge: true });
  });
  return { dispatch_id: dispatch.dispatch_id, worker_id: workerId, expires_at_epoch: expiresAt };
}

export async function releasePhase11DispatchLease({ runId, dispatchId, workerId = "phase11-runtime" } = {}) {
  const ref = runRef(runId).collection("phase11_dispatch_leases").doc(dispatchId);
  await ref.set({ active: false, released_at_epoch: Date.now(), worker_id: workerId }, { merge: true });
}

export function buildPhase11DispatchCheckpoint({ run, dispatch, stage, previous = null, payload = {} } = {}) {
  const allowed = new Set(["DISPATCH_CREATED", "OWNER_RUNNING", "OWNER_RETURNED", "RETURN_VALIDATED", "ATTEMPT_RECORDED", "COMPLETE"]);
  if (!allowed.has(stage)) throw new Error(`PHASE11_DISPATCH_CHECKPOINT_STAGE_INVALID:${stage}`);
  const sequence = ["DISPATCH_CREATED", "OWNER_RUNNING", "OWNER_RETURNED", "RETURN_VALIDATED", "ATTEMPT_RECORDED", "COMPLETE"];
  if (previous?.stage && sequence.indexOf(stage) < sequence.indexOf(previous.stage)) throw new Error("PHASE11_DISPATCH_CHECKPOINT_REGRESSION");
  const checkpoint = { schema_version: PHASE11_DISPATCH_CHECKPOINT_VERSION, status: stage === "COMPLETE" ? "COMPLETE" : "IN_PROGRESS", run_id: String(run?.run_id || dispatch?.run_id || ""), dispatch_id: dispatch.dispatch_id, challenge_candidate_id: dispatch.challenge_candidate_id, attempt_number: dispatch.attempt_number, owner_internal_job: dispatch.owner_internal_job, stage, previous_stage: previous?.stage || null, payload, checkpoint_fingerprint: sha({ dispatch_id: dispatch.dispatch_id, stage, payload }) };
  return Object.freeze(checkpoint);
}

export function checkpointMayResume(checkpoint, dispatch) {
  return Boolean(checkpoint && checkpoint.schema_version === PHASE11_DISPATCH_CHECKPOINT_VERSION && checkpoint.dispatch_id === dispatch.dispatch_id && checkpoint.challenge_candidate_id === dispatch.challenge_candidate_id && Number(checkpoint.attempt_number) === Number(dispatch.attempt_number));
}
function sha(value) { return createHash("sha256").update(JSON.stringify(value)).digest("hex"); }
