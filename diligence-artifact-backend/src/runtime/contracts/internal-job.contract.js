import { PIPELINE_CONTRACTS, getPipelineContract } from "./pipeline.contract.js";
import { centralPhaseForInternalJob, centralPhaseStatusForInternalJob } from "./central-phase.contract.js";
import { PHASE13_QUALIFIED_REVIEW_RUNTIME_CONTRACT } from "./phase13-runtime.contract.js";
import { PHASE14_QUALIFIED_REVIEW_SUBMISSION_RUNTIME_CONTRACT } from "./phase14-submission-runtime.contract.js";
import { PHASE15_DILIGENCE_QA_COMPLETE_RUNTIME_CONTRACT } from "./phase15-diligence-qa-runtime.contract.js";
import { PHASE16_ASSEMBLY_ENGINE_RUNTIME_CONTRACT } from "./phase16-assembly-runtime.contract.js";

export const INTERNAL_JOB_ALIASES = Object.freeze({
  RENDERER: "NORMALIZED_REPORT_RENDERER",
  COMPILER: "NORMALIZED_COMPILER"
});

const RUNTIME_CONTRACT_OVERRIDES = Object.freeze({
  QUALIFIED_REVIEW: PHASE13_QUALIFIED_REVIEW_RUNTIME_CONTRACT,
  QUALIFIED_REVIEW_SUBMISSION: PHASE14_QUALIFIED_REVIEW_SUBMISSION_RUNTIME_CONTRACT,
  DILIGENCE_QA_COMPLETE: PHASE15_DILIGENCE_QA_COMPLETE_RUNTIME_CONTRACT,
  ASSEMBLY_ENGINE: PHASE16_ASSEMBLY_ENGINE_RUNTIME_CONTRACT
});

export function normalizeInternalJobId(internalJobId) {
  return INTERNAL_JOB_ALIASES[internalJobId] || internalJobId;
}

export function getInternalJobContract(internalJobId) {
  const normalized = normalizeInternalJobId(internalJobId);
  return RUNTIME_CONTRACT_OVERRIDES[normalized] || getPipelineContract(normalized);
}

export function listInternalJobContracts() {
  return Object.entries(PIPELINE_CONTRACTS).map(([internal_job_id, pipelineContract]) => {
    const normalized = normalizeInternalJobId(internal_job_id);
    return {
      internal_job_id,
      normalized_internal_job_id: normalized,
      central_phase: centralPhaseStatusForInternalJob(normalized),
      contract: RUNTIME_CONTRACT_OVERRIDES[normalized] || pipelineContract,
      runtime_owned_contract: true,
      runtime_override_active: Boolean(RUNTIME_CONTRACT_OVERRIDES[normalized])
    };
  });
}

export function centralPhaseForCurrentInternalJob(internalJobId) {
  return centralPhaseForInternalJob(normalizeInternalJobId(internalJobId));
}

export const INTERNAL_JOB_CONTRACT_STATUS = Object.freeze({
  central_runtime_contract: "internal-job.contract",
  old_phase_contracts_dependency_removed: true,
  phase11_production_contract_override_active: false,
  phase11_canonical_pipeline_contract_synced: true,
  phase13_qualified_review_runtime_override_active: true,
  phase14_submission_runtime_override_active: true,
  phase15_diligence_qa_runtime_override_active: true,
  phase16_assembly_runtime_override_active: true,
  active_post_review_sequence: ["QUALIFIED_REVIEW_SUBMISSION", "DILIGENCE_QA_COMPLETE", "AWAITING_ASSEMBLY", "ASSEMBLY_ENGINE", "COMPLETE"],
  source_of_truth: "runtime/contracts/internal-job.contract.js"
});
