export const PHASE11_ATTEMPT_CLASSIFIER_VERSION = "phase11_attempt_classifier.v1";

const NON_SUBSTANTIVE_ERROR_PATTERNS = Object.freeze([
  /PHASE11_TARGETED_PROPOSAL_NOT_COMMITTED/i,
  /PHASE11_TARGETED_PROPOSAL/i,
  /PHASE11_WRITE_MANIFEST_REJECTED/i,
  /PHASE11_MUTATION_GUARD_REJECTED/i,
  /PHASE11_REINVESTIGATION_COMMIT_ERROR/i,
  /PHASE11_TARGET_BATCH_NOT_FOUND/i,
  /PHASE11_TARGET_BATCH_SCOPE_EMPTY/i,
  /PHASE11_PHASE7_TARGET_BATCH/i,
  /PHASE11_DISPATCH_LEASE/i,
  /timeout/i,
  /rate.?limit/i,
  /temporar/i,
  /unavailable/i,
  /429|502|503|504/
]);

export function classifyPhase11AttemptOutcome({ proposal = null, commitReceipt = null, runtimeError = null } = {}) {
  if (commitReceipt?.substantive_attempt_committed === true && commitReceipt?.status === "COMMITTED") {
    return Object.freeze({
      schema_version: PHASE11_ATTEMPT_CLASSIFIER_VERSION,
      status: "SUBSTANTIVE_ATTEMPT_COMMITTED",
      substantive_attempt: true,
      attempts_used_increment_allowed: true,
      reason: "A targeted owner proposal passed the mutation guard and was committed."
    });
  }

  const proposalStatus = String(proposal?.status || "");
  const errorText = String(runtimeError?.message || runtimeError || "");
  const nonSubstantiveByPattern = NON_SUBSTANTIVE_ERROR_PATTERNS.some((pattern) => pattern.test(errorText));
  const nonSubstantiveByProposal = ["TECHNICAL_FAILURE", "INVALID_OWNER_OUTPUT", "NO_MATERIAL_CHANGE"].includes(proposalStatus);

  return Object.freeze({
    schema_version: PHASE11_ATTEMPT_CLASSIFIER_VERSION,
    status: nonSubstantiveByPattern || nonSubstantiveByProposal || runtimeError ? "NON_SUBSTANTIVE_RETRY_REQUIRED" : "NON_SUBSTANTIVE_NO_COMMIT",
    substantive_attempt: false,
    attempts_used_increment_allowed: false,
    reason: errorText || proposal?.owner_notes || `Proposal status ${proposalStatus || "missing"} was not committed.`,
    proposal_status: proposalStatus,
    technical_failure: Boolean(runtimeError),
    mutation_guard_rejection_is_not_substantive_attempt: /MUTATION_GUARD/i.test(errorText),
    output_repair_is_not_substantive_attempt: proposalStatus === "INVALID_OWNER_OUTPUT",
    technical_retry_is_not_substantive_attempt: Boolean(runtimeError)
  });
}

export function buildPhase11NonSubstantiveReceipt({ dispatch, classification, technicalRetryCount = 0 } = {}) {
  return Object.freeze({
    dispatch_id: dispatch?.dispatch_id,
    challenge_candidate_id: dispatch?.challenge_candidate_id,
    attempt_number: dispatch?.attempt_number,
    owning_phase: dispatch?.owning_phase,
    owner_internal_job: dispatch?.owner_internal_job,
    result: classification?.status || "NON_SUBSTANTIVE_RETRY_REQUIRED",
    substantive_attempt_recorded: false,
    attempts_used_increment_allowed: false,
    technical_retry_count: technicalRetryCount,
    technical_retry_is_not_substantive_attempt: true,
    output_repair_is_not_substantive_attempt: true,
    mutation_guard_rejection_is_not_substantive_attempt: true,
    validation_basis: classification?.reason || "No guarded targeted mutation was committed."
  });
}
