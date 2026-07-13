export const PHASE11_PRODUCTION_ARTIFACT_NAMES = Object.freeze([
  "operator_challenge_inventory",
  "operator_challenge_semantic_ledger",
  "operator_challenge_reinvestigation_ledger",
  "operator_challenge_dispatch_checkpoint",
  "challenge_gate"
]);

export function applyPhase11ProductionContract(base = {}) {
  return Object.freeze({
    ...base,
    writes: PHASE11_PRODUCTION_ARTIFACT_NAMES,
    independent_artifacts_required: true,
    compiler_reads_final_challenge_gate_only: true,
    mutation_guard_required: true,
    durable_dispatch_checkpoint_required: true,
    dispatch_lease_required: true,
    maximum_reinvestigation_attempts: 2,
    blocking_is_exception: true,
    only_critical_failure_blocks: true,
    unresolved_after_two_attempts: "PASS_WITH_LIMITATION",
    runtime_contract_version: "PHASE11_PRODUCTION_RUNTIME_CONTRACT_v2"
  });
}
