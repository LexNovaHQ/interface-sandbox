import assert from "node:assert/strict";
import { validatePhase11ProposalWriteAuthority } from "../src/phases/11-operator-challenge/operator-challenge-write-authority.js";
import { candidate, dispatchFor, packetFor, proposalFor, printReceipt } from "./phase11-executable-test-fixtures.mjs";

const dispatch = dispatchFor(candidate({ proposed_owner: "PHASE_3_DOMAIN_DERIVATION", affected_artifacts: ["domain_derivation_profile"], affected_field_paths: ["domain_derivation_profile.primary_domain"] }), { domain_derivation_profile: 1 });
const proposal = proposalFor({ dispatch, artifactName: "domain_derivation_profile", artifact: { status: "LOCKED", primary_domain: "example.com" } });
assert.equal(validatePhase11ProposalWriteAuthority({ dispatch, packet: packetFor(dispatch), proposal, baselineArtifactVersions: { domain_derivation_profile: 1 } }).status, "PASS");
printReceipt("phase11 phase3 targeted", ["CO14-05"], 1);
