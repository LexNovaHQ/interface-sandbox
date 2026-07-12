import { PIPELINE_CONTRACTS, getPipelineContract } from "./pipeline.contract.js";
import { centralPhaseForInternalJob, centralPhaseStatusForInternalJob } from "./central-phase.contract.js";
import { applyPhase11ProductionContract } from "../../phases/11-operator-challenge/operator-challenge-production.contract.js";

export const INTERNAL_JOB_ALIASES = Object.freeze({
  RENDERER: "NORMALIZED_REPORT_RENDERER",
  COMPILER: "NORMALIZED_COMPILER"
});

export function normalizeInternalJobId(internalJobId) {
  return INTERNAL_JOB_ALIASES[internalJobId] || internalJobId;
}

export function getInternalJobContract(internalJobId) {
  const normalized = normalizeInternalJobId(internalJobId);
  const base = getPipelineContract(normalized);
  return normalized === "M12" ? applyPhase11ProductionContract(base) : base;
}

export function listInternalJobContracts() {
  return Object.entries(PIPELINE_CONTRACTS).map(([internal_job_id, contract]) => ({
    internal_job_id,
    normalized_internal_job_id: normalizeInternalJobId(internal_job_id),
    central_phase: centralPhaseStatusForInternalJob(normalizeInternalJobId(internal_job_id)),
    contract: normalizeInternalJobId(internal_job_id) === "M12" ? applyPhase11ProductionContract(contract) : contract,
    runtime_owned_contract: true
  }));
}

export function centralPhaseForCurrentInternalJob(internalJobId) {
  return centralPhaseForInternalJob(normalizeInternalJobId(internalJobId));
}

export const INTERNAL_JOB_CONTRACT_STATUS = Object.freeze({
  central_runtime_contract: "internal-job.contract",
  old_phase_contracts_dependency_removed: true,
  phase11_production_contract_override_active: true,
  source_of_truth: "runtime/contracts/pipeline.contract.js + phase11 production override"
});
