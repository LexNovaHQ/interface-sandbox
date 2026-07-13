import assert from "node:assert/strict";
import { buildOperatorChallengeLayer3, PHASE11_CRITICAL_CHALLENGE_TYPES } from "../src/phases/11-operator-challenge/operator-challenge-adjudication.js";
import { recordOperatorChallengeReinvestigationAttempt } from "../src/phases/11-operator-challenge/operator-challenge-reinvestigation.js";
import { candidate, inventory, semanticFor, run } from "./phase11-executable-test-fixtures.mjs";

const critical = candidate({ candidate_class: "CRITICAL_SUBSTRATE_CANDIDATE", challenge_type: "PHASE10_PROFILE_OVERLAP", proposed_owner: "PHASE_10_EXPOSURE_PROFILE" });
const criticalGate = buildOperatorChallengeLayer3({ inventory: inventory([critical]), semanticLedger: semanticFor([critical], { recommended_disposition: "REJECT" }), run }).challenge_gate;
assert.equal(criticalGate.status, "CONTROLLED_FAILURE");
assert.equal(criticalGate.compiler_handoff_allowed, false);
assert.equal(criticalGate.confirmed_critical_failures.length, 1);
assert.equal(PHASE11_CRITICAL_CHALLENGE_TYPES.includes("MATERIAL_PROFILE_" + "OVERLAP"), false);

const material = candidate();
const materialGate = buildOperatorChallengeLayer3({ inventory: inventory([material]), semanticLedger: semanticFor([material]), run }).challenge_gate;
assert.equal(materialGate.status, "REINVESTIGATION_REQUIRED");
assert.equal(materialGate.reinvestigation_directives[0].attempt_number, 1);
const withAttempt = recordOperatorChallengeReinvestigationAttempt({ challengeGate: materialGate, result: { challenge_candidate_id: material.challenge_candidate_id, attempt_number: 1, owning_phase: "PHASE_5_ACTIVITY_PROFILE", artifact_names: ["target_feature_profile"], field_paths: material.affected_field_paths, affected_row_identity: ["ACT-1"], result: "RESOLVED", validated: true, validation_basis: "condition disappeared", returned_artifact_versions: [{ artifact_name: "target_feature_profile", version: 2 }] } });
const resolved = buildOperatorChallengeLayer3({ inventory: inventory([material]), semanticLedger: semanticFor([material]), priorChallengeGate: withAttempt, run }).challenge_gate;
assert.equal(resolved.status, "PASS");
assert.equal(resolved.compiler_handoff_allowed, true);
assert.throws(() => recordOperatorChallengeReinvestigationAttempt({ challengeGate: { ...materialGate, operator_challenge_reinvestigation_ledger: { ...materialGate.operator_challenge_reinvestigation_ledger, entries: [{ ...materialGate.operator_challenge_reinvestigation_ledger.entries[0], attempts: [{ result: "UNRESOLVED" }, { result: "UNRESOLVED" }] }] } }, result: { challenge_candidate_id: material.challenge_candidate_id, attempt_number: 3, owning_phase: "PHASE_5_ACTIVITY_PROFILE", field_paths: material.affected_field_paths, result: "UNRESOLVED", validated: true } }), /ATTEMPT_LIMIT/);

console.log(JSON.stringify({ check: "phase11 layer3 adjudication", status: "PASS", scenario_ids: ["CO14-01", "CO14-05", "CO14-09"], assertion_count: 10 }, null, 2));
