import assert from "node:assert/strict";
import { buildOperatorChallengeLayer3 } from "../src/phases/11-operator-challenge/operator-challenge-adjudication.js";
import { candidate, inventory, semanticFor, run, printReceipt } from "./phase11-executable-test-fixtures.mjs";

const c = candidate({ proposed_owner: "PHASE_10_EXPOSURE_PROFILE", affected_artifacts: ["exposure_registry_batch__PRIMARYFINTECH001__001"], affected_field_paths: ["exposure_registry_batch__PRIMARYFINTECH001__001.row"] });
const gate1 = buildOperatorChallengeLayer3({ inventory: inventory([c]), semanticLedger: semanticFor([c]), run }).challenge_gate;
assert.equal(gate1.reinvestigation_directives[0].owning_phase, "PHASE_10_EXPOSURE_PROFILE");
const prior = { ...gate1, operator_challenge_reinvestigation_ledger: { ...gate1.operator_challenge_reinvestigation_ledger, entries: [{ ...gate1.operator_challenge_reinvestigation_ledger.entries[0], attempts: [{ result: "UNRESOLVED", validated: true, attempt_number: 1, owning_phase: "PHASE_10_EXPOSURE_PROFILE", field_paths: c.affected_field_paths }], attempts_used: 1 }] } };
const gate2 = buildOperatorChallengeLayer3({ inventory: inventory([c]), semanticLedger: semanticFor([c]), priorChallengeGate: prior, run }).challenge_gate;
assert.equal(gate2.status, "REINVESTIGATION_REQUIRED");
assert.equal(gate2.reinvestigation_directives[0].attempt_number, 2);
printReceipt("phase11 multi owner routing", ["CO14-16", "CO14-17"], 4);
