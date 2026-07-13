import assert from "node:assert/strict";
import { validatePhase11ProposalWriteAuthority } from "../src/phases/11-operator-challenge/operator-challenge-write-authority.js";
import { buildPhase11TargetedMutationProposal } from "../src/phases/11-operator-challenge/operator-challenge-targeted-adapter.contract.js";
import { candidate, dispatchFor, packetFor, printReceipt } from "./phase11-executable-test-fixtures.mjs";

const versions = { "exposure_registry_batch__PRIMARYFINTECH001__001": 1, "exposure_registry_batch_validation__PRIMARYFINTECH001__001": 1, exposure_registry_workpad_98: 1, exposure_registry_controlled_profile: 1, exposure_registry_triggered_profile: 1, exposure_registry_profile_forensics: 1 };
const dispatch = dispatchFor(candidate({ proposed_owner: "PHASE_10_EXPOSURE_PROFILE", affected_artifacts: ["exposure_registry_batch__PRIMARYFINTECH001__001"], affected_field_paths: ["exposure_registry_batch__PRIMARYFINTECH001__001.batch_registry_ledger.fintech::FIN_1"] }), versions);
const packet = packetFor(dispatch);
const writes = Object.keys(versions).map((artifactName) => ({ artifact_name: artifactName, expected_previous_version: 1, proposed_artifact: { status: "LOCKED", artifact_name: artifactName }, allowed_field_paths: artifactName.startsWith("exposure_registry_batch__") ? dispatch.field_paths : [], mechanically_dependent_paths: artifactName.startsWith("exposure_registry_batch__") ? [] : [artifactName] }));
const proposal = buildPhase11TargetedMutationProposal({ dispatch, phase11_reinvestigation_context: packet, baseline_artifact_versions: versions, proposed_writes: writes, actual_write_manifest: writes.map((write) => ({ artifact_name: write.artifact_name, reason: "phase10 targeted", direct_or_mechanical_dependency: write.artifact_name.startsWith("exposure_registry_batch__") || write.artifact_name.startsWith("exposure_registry_batch_validation__") ? "direct" : "mechanical_dependency" })), substantive_reinvestigation_performed: true });
assert.equal(validatePhase11ProposalWriteAuthority({ dispatch, packet, proposal, baselineArtifactVersions: versions }).status, "PASS");
printReceipt("phase11 phase10 targeted hardening", ["CO14-15"], 1);
