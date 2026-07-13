import assert from "node:assert/strict";
import { classifyPhase11AttemptOutcome, buildPhase11NonSubstantiveReceipt } from "../src/phases/11-operator-challenge/operator-challenge-attempt-classifier.js";
import { PHASE11_MAX_NON_SUBSTANTIVE_EXECUTION_CYCLES } from "../src/phases/11-operator-challenge/operator-challenge-dispatch.runtime.js";
import { dispatchFor, printReceipt } from "./phase11-executable-test-fixtures.mjs";

const dispatch = dispatchFor();
const classification = classifyPhase11AttemptOutcome({ runtimeError: new Error("503 temporarily unavailable") });
assert.equal(classification.substantive_attempt, false);
assert.equal(classification.attempts_used_increment_allowed, false);
const receipt = buildPhase11NonSubstantiveReceipt({ dispatch, classification, technicalRetryCount: 2 });
assert.equal(receipt.substantive_attempt_recorded, false);
assert.equal(receipt.technical_retry_is_not_substantive_attempt, true);
assert.equal(PHASE11_MAX_NON_SUBSTANTIVE_EXECUTION_CYCLES, 3);
printReceipt("phase11 technical attempt separation", ["CO14-09", "CO14-10", "CO14-11"], 5);
