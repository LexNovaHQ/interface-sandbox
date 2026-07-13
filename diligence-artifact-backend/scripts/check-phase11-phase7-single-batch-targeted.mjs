import assert from "node:assert/strict";
import { validatePhase11ProposalWriteAuthority } from "../src/phases/11-operator-challenge/operator-challenge-write-authority.js";
import { buildPhase11TargetedMutationProposal } from "../src/phases/11-operator-challenge/operator-challenge-targeted-adapter.contract.js";
import { candidate, dispatchFor, packetFor, printReceipt } from "./phase11-executable-test-fixtures.mjs";

const dispatch = dispatchFor(candidate({ proposed_owner: "PHASE_7_DATA_PROVENANCE", affected_artifacts: ["dap_semantic_batch_exec_artifact"], affected_field_paths: ["dap_semantic_batch_exec_artifact.field_rows.DAP.EXEC.001"] }), { dap_semantic_batch_exec_artifact: 1, "dap_semantic_batch_validation__DAP-SEM-BATCH-01": 1 });
const packet = packetFor(dispatch);
const proposal = buildPhase11TargetedMutationProposal({ dispatch, phase11_reinvestigation_context: packet, baseline_artifact_versions: dispatch.baseline_artifact_versions, proposed_writes: [
  { artifact_name: "dap_semantic_batch_exec_artifact", expected_previous_version: 1, proposed_artifact: { status: "LOCKED", field_rows: [{ field_id: "DAP.EXEC.001" }] }, allowed_field_paths: dispatch.field_paths, mechanically_dependent_paths: [] },
  { artifact_name: "dap_semantic_batch_validation__DAP-SEM-BATCH-01", expected_previous_version: 1, proposed_artifact: { status: "PASS" }, allowed_field_paths: [], mechanically_dependent_paths: ["dap_semantic_batch_validation__DAP-SEM-BATCH-01"] }
], actual_write_manifest: [
  { artifact_name: "dap_semantic_batch_exec_artifact", reason: "direct batch", direct_or_mechanical_dependency: "direct" },
  { artifact_name: "dap_semantic_batch_validation__DAP-SEM-BATCH-01", reason: "paired validation", direct_or_mechanical_dependency: "mechanical_dependency" }
], substantive_reinvestigation_performed: true });
assert.equal(validatePhase11ProposalWriteAuthority({ dispatch, packet, proposal, baselineArtifactVersions: dispatch.baseline_artifact_versions }).status, "PASS");
printReceipt("phase11 phase7 single batch targeted", ["CO14-14"], 1);
