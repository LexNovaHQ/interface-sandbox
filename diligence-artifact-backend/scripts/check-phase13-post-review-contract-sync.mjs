import assert from "node:assert/strict";
import { INTERNAL_PIPELINE_JOB_IDS, PIPELINE_CONTRACTS, PIPELINE_CONTRACT_STATUS } from "../src/runtime/contracts/pipeline.contract.js";
import { getInternalJobContract } from "../src/runtime/contracts/internal-job.contract.js";
import { QUALIFIED_REVIEW_RUNTIME_READS, QUALIFIED_REVIEW_RUNTIME_WRITES } from "../src/runtime/contracts/phase13-runtime.contract.js";
import { QUALIFIED_REVIEW_SUBMISSION_RUNTIME_READS, QUALIFIED_REVIEW_SUBMISSION_RUNTIME_WRITES } from "../src/runtime/contracts/phase14-submission-runtime.contract.js";
import { DILIGENCE_QA_COMPLETE_RUNTIME_READS, DILIGENCE_QA_COMPLETE_RUNTIME_WRITES } from "../src/runtime/contracts/phase15-diligence-qa-runtime.contract.js";

const qrIndex = INTERNAL_PIPELINE_JOB_IDS.indexOf("QUALIFIED_REVIEW");
const submissionIndex = INTERNAL_PIPELINE_JOB_IDS.indexOf("QUALIFIED_REVIEW_SUBMISSION");
const qaIndex = INTERNAL_PIPELINE_JOB_IDS.indexOf("DILIGENCE_QA_COMPLETE");
assert(qrIndex >= 0 && submissionIndex > qrIndex && qaIndex > submissionIndex);

assert.deepEqual(PIPELINE_CONTRACTS.QUALIFIED_REVIEW.reads, QUALIFIED_REVIEW_RUNTIME_READS);
assert.deepEqual(PIPELINE_CONTRACTS.QUALIFIED_REVIEW.writes, QUALIFIED_REVIEW_RUNTIME_WRITES);
assert.equal(PIPELINE_CONTRACTS.QUALIFIED_REVIEW.next, "AWAITING_QUALIFIED_REVIEW");

assert.deepEqual(PIPELINE_CONTRACTS.QUALIFIED_REVIEW_SUBMISSION.reads, QUALIFIED_REVIEW_SUBMISSION_RUNTIME_READS);
assert.deepEqual(PIPELINE_CONTRACTS.QUALIFIED_REVIEW_SUBMISSION.writes, QUALIFIED_REVIEW_SUBMISSION_RUNTIME_WRITES);
assert.equal(PIPELINE_CONTRACTS.QUALIFIED_REVIEW_SUBMISSION.next, "DILIGENCE_QA_COMPLETE");

assert.deepEqual(PIPELINE_CONTRACTS.DILIGENCE_QA_COMPLETE.reads, DILIGENCE_QA_COMPLETE_RUNTIME_READS);
assert.deepEqual(PIPELINE_CONTRACTS.DILIGENCE_QA_COMPLETE.writes, DILIGENCE_QA_COMPLETE_RUNTIME_WRITES);
assert.equal(PIPELINE_CONTRACTS.DILIGENCE_QA_COMPLETE.next, "AWAITING_ASSEMBLY");

for (const jobId of ["QUALIFIED_REVIEW", "QUALIFIED_REVIEW_SUBMISSION", "DILIGENCE_QA_COMPLETE"]) {
  assert.deepEqual(getInternalJobContract(jobId), PIPELINE_CONTRACTS[jobId]);
}

assert.equal(PIPELINE_CONTRACT_STATUS.phase13_canonical_pipeline_contract_synced, true);
assert.equal(PIPELINE_CONTRACT_STATUS.phase14_submission_canonical_pipeline_contract_synced, true);
assert.equal(PIPELINE_CONTRACT_STATUS.phase15_diligence_qa_canonical_pipeline_contract_synced, true);

console.log("Phase 13 post-review canonical contract sync: PASS");
console.log(JSON.stringify({
  sequence: ["QUALIFIED_REVIEW", "QUALIFIED_REVIEW_SUBMISSION", "DILIGENCE_QA_COMPLETE", "AWAITING_ASSEMBLY"],
  split_brain_contract_removed: true,
  canonical_and_runtime_overrides_identical: true
}, null, 2));
