export const EXECUTION_OUTCOMES = Object.freeze({
  SUCCESS: "SUCCESS",
  LIMITATION: "LIMITATION",
  REINVESTIGATION_REQUIRED: "REINVESTIGATION_REQUIRED",
  TECHNICAL_RETRY_REQUIRED: "TECHNICAL_RETRY_REQUIRED",
  CRITICAL_FAILURE: "CRITICAL_FAILURE"
});

export const EXECUTION_RUNTIME_STATUSES = Object.freeze({
  [EXECUTION_OUTCOMES.SUCCESS]: "LOCKED",
  [EXECUTION_OUTCOMES.LIMITATION]: "LOCKED_WITH_LIMITATIONS",
  [EXECUTION_OUTCOMES.REINVESTIGATION_REQUIRED]: "REINVESTIGATION_REQUIRED",
  [EXECUTION_OUTCOMES.TECHNICAL_RETRY_REQUIRED]: "TECHNICAL_RETRY_REQUIRED",
  [EXECUTION_OUTCOMES.CRITICAL_FAILURE]: "CONTROLLED_FAILURE"
});

const ADVANCE_ALLOWED_STATUSES = new Set([
  "LOCKED",
  "LOCKED_WITH_LIMITATIONS",
  "COMPLETE",
  "PASS",
  "PASS_WITH_LIMITATION",
  "PASS_WITH_LIMITATIONS",
  "PASS_WITH_WARNING",
  "PASS_WITH_WARNINGS"
]);

const CRITICAL_PATTERNS = Object.freeze([
  /UNKNOWN_CENTRAL_PIPELINE_JOB/i,
  /INVALID_DOMAIN_REGISTRY/i,
  /PACKAGE_LIFECYCLE_(?:INVALID|MISSING|CATALOG_MISMATCH|SELECTABLE_ASSET_GAP|NOT_EXECUTABLE_POST_REVIEW)/i,
  /WRITE_PERMISSION|UNAUTHORIZED|PERMISSION_DENIED/i,
  /FORBIDDEN_(?:INPUT|READ|ARTIFACT)|FORENSIC_INPUT_BOUNDARY_BREACH/i,
  /ROUTING_AUTHORITY_MISSING|WRONG_AUTHORITY|ROUTE_(?:ID|BUCKET)_MISMATCH/i,
  /CONTRACT_MISMATCH|SCHEMA_VERSION_MISMATCH|IMMUTABLE_HASH_MISMATCH/i,
  /REQUIRED_ARTIFACT_(?:MISSING|UNUSABLE)/i,
  /MISSING_REQUIRED_(?:INPUT|ARTIFACT)|MISSING_SCOPED_LOSSLESS_ROOT/i,
  /CORRUPT|INTEGRITY_ERROR|DUPLICATE_REGISTRY_ROW_KEY/i,
  /NO_EXECUTABLE_PRIMARY_PACKAGE_AFTER_REINVESTIGATION/i
]);

const TECHNICAL_PATTERNS = Object.freeze([
  /\b(?:ETIMEDOUT|ECONNRESET|ECONNREFUSED|EAI_AGAIN|ENETUNREACH)\b/i,
  /\b(?:timeout|temporar(?:y|ily)|rate limit|429|503|service unavailable)\b/i,
  /\b(?:firestore|cloud tasks|provider|gemini|network)\b.*\b(?:unavailable|failed|timeout|retry)\b/i,
  /JSON_PARSE|MALFORMED_JSON|INVALID_JSON/i
]);

const REINVESTIGATION_PATTERNS = Object.freeze([
  /REINVESTIGATION_REQUIRED/i,
  /MODEL_OUTPUT_VALIDATION_FAILED/i,
  /SEMANTIC_LEDGER_VALIDATION/i,
  /NO_PRIMARY_DOMAIN_RULE_FIRED/i,
  /MULTIPLE_PRIMARY_DOMAIN_RULES_FIRED/i,
  /MISSING_(?:EVIDENCE|ANCHOR|PROOF)/i,
  /ROW_COUNT_MISMATCH|CANDIDATE_COVERAGE/i,
  /UNRESOLVED|PARTIAL|NOT_VISIBLE/i
]);

export class PipelineOutcomeError extends Error {
  constructor(message, { outcome = EXECUTION_OUTCOMES.CRITICAL_FAILURE, code = "", details = null, cause = null } = {}) {
    super(message, cause ? { cause } : undefined);
    this.name = "PipelineOutcomeError";
    this.execution_outcome = outcome;
    this.code = code || "";
    this.details = details;
  }
}

export function classifyPipelineError(error) {
  const explicit = String(error?.execution_outcome || "").trim();
  if (Object.values(EXECUTION_OUTCOMES).includes(explicit)) return explicit;
  const message = String(error?.message || error || "");
  if (CRITICAL_PATTERNS.some((pattern) => pattern.test(message))) return EXECUTION_OUTCOMES.CRITICAL_FAILURE;
  if (TECHNICAL_PATTERNS.some((pattern) => pattern.test(message))) return EXECUTION_OUTCOMES.TECHNICAL_RETRY_REQUIRED;
  if (REINVESTIGATION_PATTERNS.some((pattern) => pattern.test(message))) return EXECUTION_OUTCOMES.REINVESTIGATION_REQUIRED;
  return EXECUTION_OUTCOMES.TECHNICAL_RETRY_REQUIRED;
}

export function runtimeStatusForOutcome(outcome) {
  return EXECUTION_RUNTIME_STATUSES[outcome] || EXECUTION_RUNTIME_STATUSES[EXECUTION_OUTCOMES.TECHNICAL_RETRY_REQUIRED];
}

export function shouldBlockRun(outcome) {
  return outcome === EXECUTION_OUTCOMES.CRITICAL_FAILURE;
}

export function isAdvanceAllowedStatus(status) {
  return ADVANCE_ALLOWED_STATUSES.has(String(status || ""));
}

export function outcomeRecord(error) {
  const outcome = classifyPipelineError(error);
  return Object.freeze({
    execution_outcome: outcome,
    runtime_status: runtimeStatusForOutcome(outcome),
    run_blocked: shouldBlockRun(outcome),
    message: String(error?.message || error || ""),
    code: String(error?.code || "")
  });
}
