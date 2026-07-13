import assert from "node:assert/strict";
import { buildOperatorChallengeLayer3 } from "../src/phases/11-operator-challenge/operator-challenge-adjudication.js";
import { buildPhase10CompilerCompatibility } from "../src/phases/12-normalized-compiler/phase10-downstream-compatibility.js";
import { candidate, inventory, semanticFor, run, printReceipt } from "./phase11-executable-test-fixtures.mjs";

const cleanGate = buildOperatorChallengeLayer3({ inventory: inventory([]), semanticLedger: { schema_version: "operator_challenge_semantic_ledger.v1", inventory_fingerprint: "inv-", semantic_output_fingerprint: "sem", challenge_reviews: [] }, run }).challenge_gate;
assert.equal(cleanGate.status, "PASS");
assert.equal(cleanGate.compiler_handoff_allowed, true);
const material = candidate();
const pending = buildOperatorChallengeLayer3({ inventory: inventory([material]), semanticLedger: semanticFor([material]), run }).challenge_gate;
assert.equal(pending.status, "REINVESTIGATION_REQUIRED");
assert.equal(pending.compiler_handoff_allowed, false);
const exhausted = buildOperatorChallengeLayer3({ inventory: inventory([material]), semanticLedger: semanticFor([material]), priorChallengeGate: { operator_challenge_reinvestigation_ledger: { schema_version: "operator_challenge_reinvestigation_ledger.v1", entries: [{ challenge_candidate_id: material.challenge_candidate_id, owning_phase: "PHASE_5_ACTIVITY_PROFILE", field_paths: material.affected_field_paths, attempts: [{ result: "UNRESOLVED", validated: true }, { result: "UNRESOLVED", validated: true }], attempts_used: 2 }] } }, run }).challenge_gate;
assert.equal(exhausted.status, "PASS_WITH_LIMITATION");
assert.equal(exhausted.compiler_handoff_allowed, true);
const compatibility = buildPhase10CompilerCompatibility({ artifacts: { active_threat_registry_manifest: { expected_registry_row_key_count: 1, report_row_contract: { report_row_schema_version: "phase10_report_row.v1.complete_registry_spine", registry_spine_completeness_status: "PASS", severity_validation_status: "PASS" } }, exposure_registry_route_plan: { route_rows: [{ registry_row_key: "pkg::T1" }] }, exposure_registry_workpad_98: { registry_rows: [{ registry_row_key: "pkg::T1", final_material_status: "NOT_TRIGGERED_NOT_APPLICABLE" }] }, exposure_registry_controlled_profile: { report_row_schema_version: "phase10_report_row.v1.complete_registry_spine", controlled_rows: [] }, exposure_registry_triggered_profile: { report_row_schema_version: "phase10_report_row.v1.complete_registry_spine", triggered_rows: [] }, challenge_gate: cleanGate } }).phase10_downstream_compatibility;
assert.equal(compatibility.challenge_status, "PASS");
printReceipt("phase11 central runtime e2e", ["CO14-04", "CO14-05", "CO14-06", "CO14-07", "CO14-08", "CO14-18"], 7);
