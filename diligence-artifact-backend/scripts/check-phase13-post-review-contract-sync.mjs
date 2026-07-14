import assert from "node:assert/strict";
import { INTERNAL_PIPELINE_JOB_IDS, PIPELINE_CONTRACTS, PIPELINE_CONTRACT_STATUS } from "../src/runtime/contracts/pipeline.contract.js";
import { getInternalJobContract } from "../src/runtime/contracts/internal-job.contract.js";
import { QUALIFIED_REVIEW_RUNTIME_READS, QUALIFIED_REVIEW_RUNTIME_WRITES } from "../src/runtime/contracts/phase13-runtime.contract.js";
import { QUALIFIED_REVIEW_SUBMISSION_RUNTIME_READS, QUALIFIED_REVIEW_SUBMISSION_RUNTIME_WRITES } from "../src/runtime/contracts/phase14-submission-runtime.contract.js";
import { DILIGENCE_QA_COMPLETE_RUNTIME_READS, DILIGENCE_QA_COMPLETE_RUNTIME_WRITES } from "../src/runtime/contracts/phase15-diligence-qa-runtime.contract.js";
import { ASSEMBLY_ENGINE_RUNTIME_READS, ASSEMBLY_ENGINE_RUNTIME_WRITES } from "../src/runtime/contracts/phase16-assembly-runtime.contract.js";
import {
  AGENT_IDS,
  ARTIFACT_PERMISSION_STATUS,
  QUALIFIED_REVIEW_RUNTIME_ARTIFACT_NAMES,
  QUALIFIED_REVIEW_SUBMISSION_ARTIFACT_NAMES,
  DILIGENCE_QA_ARTIFACT_NAMES,
  ASSEMBLY_ENGINE_ARTIFACT_NAMES,
  assertCanReadArtifact,
  assertCanWriteArtifact,
  assertInternalJobCanWriteArtifact
} from "../src/runtime/contracts/artifact-permissions.contract.js";

const qrIndex = INTERNAL_PIPELINE_JOB_IDS.indexOf("QUALIFIED_REVIEW");
const submissionIndex = INTERNAL_PIPELINE_JOB_IDS.indexOf("QUALIFIED_REVIEW_SUBMISSION");
const qaIndex = INTERNAL_PIPELINE_JOB_IDS.indexOf("DILIGENCE_QA_COMPLETE");
const assemblyIndex = INTERNAL_PIPELINE_JOB_IDS.indexOf("ASSEMBLY_ENGINE");
assert(qrIndex >= 0 && submissionIndex > qrIndex && qaIndex > submissionIndex && assemblyIndex > qaIndex);

assert.deepEqual(PIPELINE_CONTRACTS.QUALIFIED_REVIEW.reads, QUALIFIED_REVIEW_RUNTIME_READS);
assert.deepEqual(PIPELINE_CONTRACTS.QUALIFIED_REVIEW.writes, QUALIFIED_REVIEW_RUNTIME_WRITES);
assert.equal(PIPELINE_CONTRACTS.QUALIFIED_REVIEW.next, "AWAITING_QUALIFIED_REVIEW");

assert.deepEqual(PIPELINE_CONTRACTS.QUALIFIED_REVIEW_SUBMISSION.reads, QUALIFIED_REVIEW_SUBMISSION_RUNTIME_READS);
assert.deepEqual(PIPELINE_CONTRACTS.QUALIFIED_REVIEW_SUBMISSION.writes, QUALIFIED_REVIEW_SUBMISSION_RUNTIME_WRITES);
assert.equal(PIPELINE_CONTRACTS.QUALIFIED_REVIEW_SUBMISSION.next, "DILIGENCE_QA_COMPLETE");

assert.deepEqual(PIPELINE_CONTRACTS.DILIGENCE_QA_COMPLETE.reads, DILIGENCE_QA_COMPLETE_RUNTIME_READS);
assert.deepEqual(PIPELINE_CONTRACTS.DILIGENCE_QA_COMPLETE.writes, DILIGENCE_QA_COMPLETE_RUNTIME_WRITES);
assert.equal(PIPELINE_CONTRACTS.DILIGENCE_QA_COMPLETE.next, "AWAITING_ASSEMBLY");

assert.deepEqual(PIPELINE_CONTRACTS.ASSEMBLY_ENGINE.reads, ASSEMBLY_ENGINE_RUNTIME_READS);
assert.deepEqual(PIPELINE_CONTRACTS.ASSEMBLY_ENGINE.writes, ASSEMBLY_ENGINE_RUNTIME_WRITES);
assert.equal(PIPELINE_CONTRACTS.ASSEMBLY_ENGINE.next, "COMPLETE");
assert.deepEqual(PIPELINE_CONTRACTS.COMPLETE.reads, ASSEMBLY_ENGINE_RUNTIME_WRITES);

for (const jobId of ["QUALIFIED_REVIEW", "QUALIFIED_REVIEW_SUBMISSION", "DILIGENCE_QA_COMPLETE", "ASSEMBLY_ENGINE"]) {
  assert.deepEqual(getInternalJobContract(jobId), PIPELINE_CONTRACTS[jobId]);
}

assert.deepEqual(QUALIFIED_REVIEW_RUNTIME_ARTIFACT_NAMES, QUALIFIED_REVIEW_RUNTIME_WRITES);
assert.deepEqual(QUALIFIED_REVIEW_SUBMISSION_ARTIFACT_NAMES, QUALIFIED_REVIEW_SUBMISSION_RUNTIME_WRITES);
assert.deepEqual(DILIGENCE_QA_ARTIFACT_NAMES, DILIGENCE_QA_COMPLETE_RUNTIME_WRITES);
assert.deepEqual(ASSEMBLY_ENGINE_ARTIFACT_NAMES, ASSEMBLY_ENGINE_RUNTIME_WRITES);

for (const artifact of QUALIFIED_REVIEW_RUNTIME_WRITES) {
  assert.doesNotThrow(() => assertCanWriteArtifact(AGENT_IDS.qualifiedReview, artifact));
  assert.doesNotThrow(() => assertInternalJobCanWriteArtifact("QUALIFIED_REVIEW", artifact));
}
for (const artifact of QUALIFIED_REVIEW_SUBMISSION_RUNTIME_WRITES) {
  assert.doesNotThrow(() => assertCanWriteArtifact(AGENT_IDS.qualifiedReview, artifact));
  assert.doesNotThrow(() => assertInternalJobCanWriteArtifact("QUALIFIED_REVIEW_SUBMISSION", artifact));
}
for (const artifact of DILIGENCE_QA_COMPLETE_RUNTIME_READS) assert.doesNotThrow(() => assertCanReadArtifact(AGENT_IDS.diligenceQaGate, artifact));
for (const artifact of DILIGENCE_QA_COMPLETE_RUNTIME_WRITES) {
  assert.doesNotThrow(() => assertCanWriteArtifact(AGENT_IDS.diligenceQaGate, artifact));
  assert.doesNotThrow(() => assertInternalJobCanWriteArtifact("DILIGENCE_QA_COMPLETE", artifact));
}
for (const artifact of ASSEMBLY_ENGINE_RUNTIME_READS) assert.doesNotThrow(() => assertCanReadArtifact(AGENT_IDS.assemblyEngine, artifact));
for (const artifact of ASSEMBLY_ENGINE_RUNTIME_WRITES) {
  assert.doesNotThrow(() => assertCanWriteArtifact(AGENT_IDS.assemblyEngine, artifact));
  assert.doesNotThrow(() => assertInternalJobCanWriteArtifact("ASSEMBLY_ENGINE", artifact));
}

assert.equal(PIPELINE_CONTRACT_STATUS.phase13_canonical_pipeline_contract_synced, true);
assert.equal(PIPELINE_CONTRACT_STATUS.phase14_submission_canonical_pipeline_contract_synced, true);
assert.equal(PIPELINE_CONTRACT_STATUS.phase15_diligence_qa_canonical_pipeline_contract_synced, true);
assert.equal(PIPELINE_CONTRACT_STATUS.phase16_assembly_canonical_pipeline_contract_synced, true);
assert.equal(ARTIFACT_PERMISSION_STATUS.canonical_post_review_permissions_synced, true);
assert.equal(ARTIFACT_PERMISSION_STATUS.phase16_assembly_writes_synced, true);

console.log("Phase 13-16 post-review canonical contract sync: PASS");
console.log(JSON.stringify({
  sequence: ["QUALIFIED_REVIEW", "QUALIFIED_REVIEW_SUBMISSION", "DILIGENCE_QA_COMPLETE", "AWAITING_ASSEMBLY", "ASSEMBLY_ENGINE", "COMPLETE"],
  split_brain_contract_removed: true,
  canonical_and_runtime_overrides_identical: true,
  canonical_artifact_permissions_synced: true
}, null, 2));
