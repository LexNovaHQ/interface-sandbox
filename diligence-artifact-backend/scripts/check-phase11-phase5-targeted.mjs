import assert from "node:assert/strict";
import { validatePhase11ProposalWriteAuthority } from "../src/phases/11-operator-challenge/operator-challenge-write-authority.js";
import { dispatchFor, packetFor, proposalFor, printReceipt } from "./phase11-executable-test-fixtures.mjs";

const dispatch = dispatchFor();
const proposal = proposalFor({ dispatch });
assert.equal(validatePhase11ProposalWriteAuthority({ dispatch, packet: packetFor(dispatch), proposal, baselineArtifactVersions: { target_feature_profile: 1 } }).status, "PASS");
printReceipt("phase11 phase5 targeted", ["CO14-05"], 1);
