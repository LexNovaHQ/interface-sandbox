import { createHash, randomUUID } from "node:crypto";
import { getDb, runRef } from "../../runtime/services/storage/firestore.service.js";

export const PHASE11_DISPATCH_CHECKPOINT_VERSION = "phase11_dispatch_checkpoint.v2";
export const PHASE11_DISPATCH_LEASE_VERSION = "phase11_dispatch_lease.v2";
const LEASE_MS = 10 * 60 * 1000;

export async function acquirePhase11DispatchLease({ runId, dispatch, workerId = "phase11-runtime" } = {}) {
  const db = getDb();
  const ref = runRef(runId).collection("phase11_dispatch_leases").doc(dispatch.dispatch_id);
  const now = Date.now();
  const expiresAt = now + LEASE_MS;
  const leaseToken = randomUUID();
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const existing = snap.exists ? snap.data() : null;
    if (existing?.active === true && Number(existing.expires_at_epoch || 0) > now) throw new Error(`PHASE11_DISPATCH_LEASE_HELD:${dispatch.dispatch_id}`);
    tx.set(ref, {
      schema_version: PHASE11_DISPATCH_LEASE_VERSION,
      run_id: runId,
      dispatch_id: dispatch.dispatch_id,
      challenge_candidate_id: dispatch.challenge_candidate_id,
      attempt_number: dispatch.attempt_number,
      worker_id: workerId,
      lease_token: leaseToken,
      active: true,
      acquired_at_epoch: existing?.active === true ? Number(existing.acquired_at_epoch || now) : now,
      renewed_at_epoch: now,
      expires_at_epoch: expiresAt,
      release_reason: ""
    }, { merge: true });
  });
  return { dispatch_id: dispatch.dispatch_id, worker_id: workerId, lease_token: leaseToken, expires_at_epoch: expiresAt };
}

export async function renewPhase11DispatchLease({ runId, dispatchId, workerId = "phase11-runtime", leaseToken } = {}) {
  const db = getDb();
  const ref = runRef(runId).collection("phase11_dispatch_leases").doc(dispatchId);
  const now = Date.now();
  const expiresAt = now + LEASE_MS;
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const existing = snap.exists ? snap.data() : null;
    assertLeaseOwner(existing, { dispatchId, workerId, leaseToken });
    tx.set(ref, { renewed_at_epoch: now, expires_at_epoch: expiresAt, active: true }, { merge: true });
  });
  return { dispatch_id: dispatchId, worker_id: workerId, lease_token: leaseToken, expires_at_epoch: expiresAt };
}

export async function releasePhase11DispatchLease({ runId, dispatchId, workerId = "phase11-runtime", leaseToken, reason = "complete" } = {}) {
  const db = getDb();
  const ref = runRef(runId).collection("phase11_dispatch_leases").doc(dispatchId);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const existing = snap.exists ? snap.data() : null;
    assertLeaseOwner(existing, { dispatchId, workerId, leaseToken });
    tx.set(ref, { active: false, released_at_epoch: Date.now(), release_reason: reason, worker_id: workerId }, { merge: true });
  });
}

export function buildPhase11DispatchCheckpoint({ run, dispatch, stage, previous = null, payload = {} } = {}) {
  const allowed = new Set([
    "DISPATCH_CREATED",
    "OWNER_PROPOSAL_RUNNING",
    "OWNER_PROPOSAL_CREATED",
    "PROPOSAL_COMMITTED",
    "NON_SUBSTANTIVE_RETRY_REQUIRED",
    "ATTEMPT_RECORDED",
    "COMPLETE"
  ]);
  if (!allowed.has(stage)) throw new Error(`PHASE11_DISPATCH_CHECKPOINT_STAGE_INVALID:${stage}`);
  const sequence = ["DISPATCH_CREATED", "OWNER_PROPOSAL_RUNNING", "OWNER_PROPOSAL_CREATED", "PROPOSAL_COMMITTED", "NON_SUBSTANTIVE_RETRY_REQUIRED", "ATTEMPT_RECORDED", "COMPLETE"];
  if (previous?.stage && sequence.indexOf(stage) < sequence.indexOf(previous.stage)) throw new Error("PHASE11_DISPATCH_CHECKPOINT_REGRESSION");
  const checkpoint = {
    schema_version: PHASE11_DISPATCH_CHECKPOINT_VERSION,
    status: stage === "COMPLETE" ? "COMPLETE" : "IN_PROGRESS",
    run_id: String(run?.run_id || dispatch?.run_id || ""),
    dispatch_id: dispatch.dispatch_id,
    challenge_candidate_id: dispatch.challenge_candidate_id,
    attempt_number: dispatch.attempt_number,
    owner_internal_job: dispatch.owner_internal_job,
    stage,
    previous_stage: previous?.stage || null,
    payload,
    checkpoint_fingerprint: sha({ dispatch_id: dispatch.dispatch_id, stage, payload })
  };
  return Object.freeze(checkpoint);
}

export function checkpointMayResume(checkpoint, dispatch) {
  return Boolean(
    checkpoint
    && checkpoint.schema_version === PHASE11_DISPATCH_CHECKPOINT_VERSION
    && checkpoint.dispatch_id === dispatch.dispatch_id
    && checkpoint.challenge_candidate_id === dispatch.challenge_candidate_id
    && Number(checkpoint.attempt_number) === Number(dispatch.attempt_number)
    && sameBaselineVersions(checkpoint.payload?.baseline_artifact_versions, dispatch.baseline_artifact_versions)
  );
}

function assertLeaseOwner(existing, { dispatchId, workerId, leaseToken }) {
  if (!existing?.active) throw new Error(`PHASE11_DISPATCH_LEASE_NOT_ACTIVE:${dispatchId || "missing"}`);
  if (String(existing.worker_id || "") !== String(workerId || "")) throw new Error(`PHASE11_DISPATCH_LEASE_WORKER_MISMATCH:${dispatchId || "missing"}`);
  if (String(existing.lease_token || "") !== String(leaseToken || "")) throw new Error(`PHASE11_DISPATCH_LEASE_TOKEN_MISMATCH:${dispatchId || "missing"}`);
}
function sameBaselineVersions(a = {}, b = {}) {
  const left = a || {};
  const right = b || {};
  const keys = [...new Set([...Object.keys(left), ...Object.keys(right)])].sort();
  return keys.every((key) => Number(left[key] || 0) === Number(right[key] || 0));
}
function sha(value) { return createHash("sha256").update(JSON.stringify(value)).digest("hex"); }
