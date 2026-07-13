import assert from "node:assert/strict";
import { buildPhase11DispatchCheckpoint, checkpointMayResume, assertPhase11DispatchCheckpointTransition } from "../src/phases/11-operator-challenge/operator-challenge-dispatch-checkpoint.js";
import { evaluatePhase11ReinvestigationReturn } from "../src/phases/11-operator-challenge/operator-challenge-dispatch.js";
import { dispatchFor, candidate, inventory, printReceipt } from "./phase11-executable-test-fixtures.mjs";

const base = candidate();
const dispatch = dispatchFor(base);
const cp1 = buildPhase11DispatchCheckpoint({ run: { run_id: "RUN" }, dispatch, stage: "DISPATCH_CREATED", payload: { baseline_artifact_versions: dispatch.baseline_artifact_versions } });
const cp2 = buildPhase11DispatchCheckpoint({ run: { run_id: "RUN" }, dispatch, stage: "OWNER_PROPOSAL_RUNNING", previous: cp1, payload: cp1.payload });
const cp3 = buildPhase11DispatchCheckpoint({ run: { run_id: "RUN" }, dispatch, stage: "OWNER_PROPOSAL_CREATED", previous: cp2, payload: cp2.payload });
const cp4 = buildPhase11DispatchCheckpoint({ run: { run_id: "RUN" }, dispatch, stage: "NON_SUBSTANTIVE_RETRY_REQUIRED", previous: cp3, payload: { ...cp3.payload, technical_retry_cycle: 1 } });
assert.equal(checkpointMayResume(cp4, dispatch), true);
assert.equal(assertPhase11DispatchCheckpointTransition({ previous: cp4, stage: "OWNER_PROPOSAL_RUNNING" }), true);
assert.throws(() => buildPhase11DispatchCheckpoint({ run: { run_id: "RUN" }, dispatch, stage: "OWNER_PROPOSAL_CREATED", previous: cp4, payload: {} }), /REGRESSION/);
const unresolved = evaluatePhase11ReinvestigationReturn({ dispatch, previousCandidate: base, currentInventory: inventory([base]), returnedArtifactVersions: { target_feature_profile: 2 } });
assert.equal(unresolved.result, "UNRESOLVED");
const resolved = evaluatePhase11ReinvestigationReturn({ dispatch, previousCandidate: base, currentInventory: inventory([]), returnedArtifactVersions: { target_feature_profile: 2 } });
assert.equal(resolved.result, "RESOLVED");

printReceipt("phase11 reinvestigation dispatch return", ["CO14-05", "CO14-06", "CO14-07", "CO14-11"], 8);
