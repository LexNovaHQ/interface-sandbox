import { PIPELINE_CONTRACTS, getPipelineContract } from "./pipeline.contract.js";
import { centralPhaseForInternalJob, centralPhaseStatusForInternalJob } from "./central-phase.contract.js";
import { PHASE13_QUALIFIED_REVIEW_RUNTIME_CONTRACT } from "./phase13-runtime.contract.js";

export const INTERNAL_JOB_ALIASES = Object.freeze({
  RENDERER: "NORMALIZED_REPORT_RENDERER",
  COMPILER: "NORMALIZED_COMPILER"
});

const RUNTIME_CONTRACT_OVERRIDES = Object.freeze({
  QUALIFIED_REVIEW: PHASE13_QUALIFIED_REVIEW_RUNTIME_CONTRACT
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
  source_of_truth: "runtime/contracts/internal-job.contract.js"
});
