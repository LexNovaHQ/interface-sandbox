import assert from "node:assert/strict";
import { validatePhase11ProposalWriteAuthority } from "../src/phases/11-operator-challenge/operator-challenge-write-authority.js";
import { validatePhase11TargetedMutation } from "../src/phases/11-operator-challenge/operator-challenge-mutation-guard.js";
import { dispatchFor, proposalFor, packetFor, printReceipt, assertPass } from "./phase11-executable-test-fixtures.mjs";

const dispatch = dispatchFor();
const proposal = proposalFor({ dispatch });
const authority = validatePhase11ProposalWriteAuthority({ dispatch, packet: packetFor(dispatch), proposal, baselineArtifactVersions: { target_feature_profile: 1 } });
assertPass(authority, "write authority");
const before = { target_feature_profile: { status: "LOCKED", activities: [{ primary_classification: { package_id: "fintech" }, activity_name: "Payments" }] } };
const after = { target_feature_profile: { status: "LOCKED", activities: [{ primary_classification: { package_id: "ai-governance" }, activity_name: "Payments" }] } };
assertPass(validatePhase11TargetedMutation({ dispatch: { ...dispatch, artifact_names: authority.authorized_write_names, field_paths: authority.authorized_mutation_paths }, beforeArtifacts: before, afterArtifacts: after }), "mutation guard");
const badProposal = proposalFor({ dispatch, artifactName: "challenge_gate", artifact: { status: "PASS" } });
assert.equal(validatePhase11ProposalWriteAuthority({ dispatch, packet: packetFor(dispatch), proposal: badProposal, baselineArtifactVersions: { challenge_gate: 1 } }).status, "REJECTED");
assert.equal(validatePhase11ProposalWriteAuthority({ dispatch, packet: packetFor(dispatch), proposal, baselineArtifactVersions: { target_feature_profile: 2 } }).status, "REJECTED");

printReceipt("phase11 staged mutation commit", ["CO14-12", "CO14-13"], 7);
