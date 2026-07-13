import assert from "node:assert/strict";
import { buildOperatorChallengeLayer3, PHASE11_CRITICAL_CHALLENGE_TYPES } from "../src/phases/11-operator-challenge/operator-challenge-adjudication.js";
import { candidate, inventory, semanticFor, run, printReceipt } from "./phase11-executable-test-fixtures.mjs";

const critical = candidate({ candidate_class: "CRITICAL_SUBSTRATE_CANDIDATE", challenge_type: "PHASE10_PROFILE_OVERLAP", proposed_owner: "PHASE_10_EXPOSURE_PROFILE" });
const inv = inventory([critical]);
const sem = semanticFor([critical], { recommended_disposition: "REJECT" });
const gate = buildOperatorChallengeLayer3({ inventory: inv, semanticLedger: sem, run }).challenge_gate;
assert.equal(gate.status, "CONTROLLED_FAILURE");
assert.equal(gate.compiler_handoff_allowed, false);
assert.equal(gate.confirmed_critical_failures.length, 1);
assert.equal(gate.adjudications[0].criticality_confirmed_by_backend, true);
assert.ok(PHASE11_CRITICAL_CHALLENGE_TYPES.includes("PHASE10_PROFILE_OVERLAP"));
assert.equal(PHASE11_CRITICAL_CHALLENGE_TYPES.includes("MATERIAL_PROFILE_" + "OVERLAP"), false);

const malformed = buildOperatorChallengeLayer3({ inventory: inventory([]), semanticLedger: { schema_version: "operator_challenge_semantic_ledger.v1", inventory_fingerprint: "inv-", semantic_output_fingerprint: "bad", challenge_reviews: [] }, run }).challenge_gate;
assert.equal(malformed.status, "PASS");

printReceipt("phase11 false blockers", ["CO14-01", "CO14-02", "CO14-03"], 8);
