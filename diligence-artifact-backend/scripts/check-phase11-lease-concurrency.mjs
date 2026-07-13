import assert from "node:assert/strict";
import { acquirePhase11DispatchLease, renewPhase11DispatchLease, releasePhase11DispatchLease } from "../src/phases/11-operator-challenge/operator-challenge-dispatch-checkpoint.js";
import { dispatchFor, printReceipt } from "./phase11-executable-test-fixtures.mjs";

function memoryDb() {
  const store = new Map();
  return { collection: () => ({ doc: (runId) => ({ collection: () => ({ doc: (id) => ({ key: `${runId}:${id}` }) }) }) }), runTransaction: async (fn) => fn({ get: async (ref) => ({ exists: store.has(ref.key), data: () => store.get(ref.key) }), set: (ref, value) => store.set(ref.key, { ...(store.get(ref.key) || {}), ...value }) }) };
}
const db = memoryDb();
const dispatch = dispatchFor();
const lease = await acquirePhase11DispatchLease({ runId: "RUN", dispatch, workerId: "w1", db });
await assert.rejects(() => acquirePhase11DispatchLease({ runId: "RUN", dispatch, workerId: "w2", db }), /LEASE_HELD/);
await assert.rejects(() => renewPhase11DispatchLease({ runId: "RUN", dispatchId: dispatch.dispatch_id, workerId: "w2", leaseToken: lease.lease_token, db }), /WORKER_MISMATCH/);
await renewPhase11DispatchLease({ runId: "RUN", dispatchId: dispatch.dispatch_id, workerId: "w1", leaseToken: lease.lease_token, db });
await releasePhase11DispatchLease({ runId: "RUN", dispatchId: dispatch.dispatch_id, workerId: "w1", leaseToken: lease.lease_token, db });
printReceipt("phase11 lease concurrency", ["CO14-18"], 5);
