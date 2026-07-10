import { PIPELINE_CONTRACTS, getPipelineContract } from "./runtime/contracts/pipeline.contract.js";

export const PHASE_CONTRACTS = PIPELINE_CONTRACTS;

export function getPhaseContract(phase) {
  return getPipelineContract(phase);
}

export function getRequiredWritesForPhase(phase) {
  return getPhaseContract(phase).writes || [];
}

export const PHASE_CONTRACTS_COMPATIBILITY_STATUS = Object.freeze({
  source_of_truth: "runtime/contracts/pipeline.contract.js",
  old_phase_contract_table_removed: true,
  runtime_contract_reexport_only: true
});
