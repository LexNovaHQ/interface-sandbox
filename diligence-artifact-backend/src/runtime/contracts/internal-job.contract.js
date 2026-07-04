import { PIPELINE_CONTRACTS, getPipelineContract } from "./pipeline.contract.js";
import { centralPhaseForInternalJob, centralPhaseStatusForInternalJob } from "./central-phase.contract.js";

export const INTERNAL_JOB_ALIASES = Object.freeze({
  RENDERER: "NORMALIZED_REPORT_RENDERER",
  COMPILER: "NORMALIZED_COMPILER"
});

export function normalizeInternalJobId(internalJobId) {
  return INTERNAL_JOB_ALIASES[internalJobId] || internalJobId;
}

export function getInternalJobContract(internalJobId) {
  const normalized = normalizeInternalJobId(internalJobId);
  return getPipelineContract(normalized);
}

export function listInternalJobContracts() {
  return Object.entries(PIPELINE_CONTRACTS).map(([internal_job_id, contract]) => ({
    internal_job_id,
    normalized_internal_job_id: normalizeInternalJobId(internal_job_id),
    central_phase: centralPhaseStatusForInternalJob(normalizeInternalJobId(internal_job_id)),
    contract,
    runtime_owned_contract: true
  }));
}

export function centralPhaseForCurrentInternalJob(internalJobId) {
  return centralPhaseForInternalJob(normalizeInternalJobId(internalJobId));
}

export const INTERNAL_JOB_CONTRACT_STATUS = Object.freeze({
  central_runtime_contract: "internal-job.contract",
  old_phase_contracts_dependency_removed: true,
  source_of_truth: "runtime/contracts/pipeline.contract.js"
});
