import assert from "node:assert/strict";
import { buildOperatorChallengeLayer3 } from "../src/phases/11-operator-challenge/operator-challenge-adjudication.js";
import { createPhase11ReinvestigationDispatch } from "../src/phases/11-operator-challenge/operator-challenge-dispatch.js";
import { buildPhase11TargetedPacket } from "../src/phases/11-operator-challenge/operator-challenge-targeted-packet.js";
import { buildPhase11TargetedMutationProposal } from "../src/phases/11-operator-challenge/operator-challenge-targeted-adapter.contract.js";

export const run = Object.freeze({ run_id: "PHASE11-CO14", target: "Example" });

export function candidate(overrides = {}) {
  return {
    challenge_candidate_id: "OCI-001",
    candidate_class: "MATERIAL_FIELD_CANDIDATE",
    challenge_type: "MATERIAL_FIELD_SUPPORT_GAP",
    affected_artifacts: ["target_feature_profile"],
    affected_field_paths: ["target_feature_profile.activities.0.primary_classification"],
    affected_registry_row_keys: [],
    affected_activity_ids: ["ACT-1"],
    affected_data_field_ids: [],
    affected_obligation_ids: [],
    contradiction_statement: "Visible support is incomplete.",
    deterministic_basis: ["fixture"],
    proposed_owner: "PHASE_5_ACTIVITY_PROFILE",
    proposed_reinvestigation_scope: "SMALLEST_AFFECTED_UNIT",
    ...overrides
  };
}

export function inventory(candidates = [candidate()]) {
  return {
    schema_version: "operator_challenge_inventory.v1",
    run_id: run.run_id,
    target: run.target,
    inventory_fingerprint: `inv-${candidates.map((row) => row.challenge_candidate_id).join("-")}`,
    challenge_candidates: candidates
  };
}

export function semanticFor(candidates, overrides = {}) {
  return {
    schema_version: "operator_challenge_semantic_ledger.v1",
    inventory_fingerprint: inventory(candidates).inventory_fingerprint,
    semantic_output_fingerprint: "sem-fixture",
    challenge_reviews: candidates.map((row) => ({
      challenge_candidate_id: row.challenge_candidate_id,
      recommended_disposition: "MATERIAL_REINVESTIGATION",
      confidence: 0.9,
      proposed_owner: row.proposed_owner,
      proposed_reinvestigation_scope: row.proposed_reinvestigation_scope,
      adversarial_analysis: "Fixture semantic support.",
      materiality_analysis: "Qualified review impact if unresolved.",
      limitation_if_unresolved: "Carry limitation.",
      ...overrides
    }))
  };
}

export function pendingGate(baseCandidate = candidate()) {
  const inv = inventory([baseCandidate]);
  const sem = semanticFor([baseCandidate]);
  return buildOperatorChallengeLayer3({ inventory: inv, semanticLedger: sem, run }).challenge_gate;
}

export function dispatchFor(baseCandidate = candidate(), versions = { target_feature_profile: 1 }) {
  const gate = pendingGate(baseCandidate);
  return createPhase11ReinvestigationDispatch({ challengeGate: gate, run, baselineArtifactVersions: versions });
}

export function packetFor(dispatch) {
  return buildPhase11TargetedPacket({ dispatch, baselineArtifactVersions: dispatch.baseline_artifact_versions });
}

export function proposalFor({ dispatch, artifactName = "target_feature_profile", artifact = { status: "LOCKED", activities: [{ primary_classification: { package_id: "ai-governance" } }] }, kind = "direct", paths = dispatch.field_paths, versions = dispatch.baseline_artifact_versions } = {}) {
  return buildPhase11TargetedMutationProposal({
    dispatch,
    phase11_reinvestigation_context: packetFor(dispatch),
    baseline_artifact_versions: versions,
    proposed_writes: [{
      artifact_name: artifactName,
      expected_previous_version: versions[artifactName] || 1,
      proposed_artifact: artifact,
      lock_status: artifact.status || "LOCKED_WITH_LIMITATIONS",
      allowed_field_paths: kind === "direct" ? paths : [],
      mechanically_dependent_paths: kind === "direct" ? [] : [artifactName]
    }],
    actual_write_manifest: [{ artifact_name: artifactName, reason: "fixture", direct_or_mechanical_dependency: kind }],
    provider_call_count: 1,
    substantive_reinvestigation_performed: true
  });
}

export function printReceipt(check, scenarioIds, assertionCount, extra = {}) {
  console.log(JSON.stringify({
    check,
    status: "PASS",
    scenario_ids: scenarioIds,
    assertion_count: assertionCount,
    runtime_versions: extra.runtime_versions || {},
    ...extra
  }, null, 2));
}

export function assertPass(value, message = "expected PASS") {
  assert.equal(value?.status, "PASS", `${message}: ${JSON.stringify(value?.failures || value)}`);
}
