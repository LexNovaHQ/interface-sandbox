import assert from "node:assert/strict";
import { validatePhase11ProposalWriteAuthority } from "../src/phases/11-operator-challenge/operator-challenge-write-authority.js";
import { candidate, dispatchFor, packetFor, proposalFor, printReceipt } from "./phase11-executable-test-fixtures.mjs";

const dispatch = dispatchFor(candidate({ proposed_owner: "PHASE_8_DOMAIN_CONTROL_OBLIGATION", affected_artifacts: ["domain_control_obligation_profile"], affected_field_paths: ["domain_control_obligation_profile.obligations.0.status"] }), { domain_control_obligation_profile: 1 });
const proposal = proposalFor({ dispatch, artifactName: "domain_control_obligation_profile", artifact: { status: "LOCKED", obligations: [{ status: "UPDATED" }] } });
assert.equal(validatePhase11ProposalWriteAuthority({ dispatch, packet: packetFor(dispatch), proposal, baselineArtifactVersions: { domain_control_obligation_profile: 1 } }).status, "PASS");
printReceipt("phase11 phase8 targeted", ["CO14-05"], 1);
