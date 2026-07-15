import { createHash } from "node:crypto";

export const OPERATOR_CHALLENGE_REINVESTIGATION_ATTEMPT_VERSION = "operator_challenge_reinvestigation_attempt.v1";

const RESULTS = new Set(["RESOLVED", "UNRESOLVED"]);

export function recordOperatorChallengeReinvestigationAttempt({ challengeGate, result } = {}) {
  const gate = unwrapGate(challengeGate);
  const ledger = gate.operator_challenge_reinvestigation_ledger;
  if (!ledger || ledger.schema_version !== "operator_challenge_reinvestigation_ledger.v1") throw new Error("PHASE11_REINVESTIGATION_LEDGER_INVALID");
  const candidateId = String(result?.challenge_candidate_id || "").trim();
  if (!candidateId) throw new Error("PHASE11_REINVESTIGATION_CANDIDATE_ID_MISSING");
  const entries = Array.isArray(ledger.entries) ? ledger.entries.map((row) => ({ ...row, attempts: Array.isArray(row.attempts) ? [...row.attempts] : [] })) : [];
  const entry = entries.find((row) => row.challenge_candidate_id === candidateId);
  if (!entry) throw new Error(`PHASE11_REINVESTIGATION_CANDIDATE_UNKNOWN:${candidateId}`);
  if (entry.attempts.length >= 2) throw new Error(`PHASE11_REINVESTIGATION_ATTEMPT_LIMIT_EXCEEDED:${candidateId}`);
  const expectedAttempt = entry.attempts.length + 1;
  const attemptNumber = Number(result?.attempt_number || 0);
  if (attemptNumber !== expectedAttempt) throw new Error(`PHASE11_REINVESTIGATION_ATTEMPT_SEQUENCE_INVALID:${candidateId}:${attemptNumber}:${expectedAttempt}`);
  const disposition = String(result?.result || "").toUpperCase();
  if (!RESULTS.has(disposition)) throw new Error(`PHASE11_REINVESTIGATION_RESULT_INVALID:${candidateId}:${disposition || "missing"}`);
  if (String(result?.owning_phase || "") !== String(entry.owning_phase || "")) throw new Error(`PHASE11_REINVESTIGATION_OWNER_MISMATCH:${candidateId}`);
  if (!sameArray(result?.field_paths, entry.field_paths)) throw new Error(`PHASE11_REINVESTIGATION_FIELD_SCOPE_MISMATCH:${candidateId}`);
  const attempt = {
    schema_version: OPERATOR_CHALLENGE_REINVESTIGATION_ATTEMPT_VERSION,
    challenge_candidate_id: candidateId,
    attempt_number: attemptNumber,
    owning_phase: entry.owning_phase,
    artifact_names: unique(result?.artifact_names || entry.artifact_names),
    field_paths: unique(entry.field_paths),
    affected_row_identity: unique(result?.affected_row_identity || []),
    result: disposition,
    validated: result?.validated === true,
    validation_basis: String(result?.validation_basis || ""),
    remaining_uncertainty: String(result?.remaining_uncertainty || ""),
    returned_artifact_versions: Array.isArray(result?.returned_artifact_versions) ? result.returned_artifact_versions : [],
    attempt_fingerprint: sha({ candidateId, attemptNumber, disposition, field_paths: entry.field_paths, validation_basis: result?.validation_basis || "", returned_artifact_versions: result?.returned_artifact_versions || [] })
  };
  if (disposition === "RESOLVED" && attempt.validated !== true) throw new Error(`PHASE11_REINVESTIGATION_RESOLUTION_NOT_VALIDATED:${candidateId}`);
  entry.attempts.push(attempt);
  entry.attempts_used = entry.attempts.length;
  return {
    ...gate,
    operator_challenge_reinvestigation_ledger: {
      ...ledger,
      entries,
      ledger_fingerprint: sha(entries)
    },
    reinvestigation_attempt_recorded: {
      challenge_candidate_id: candidateId,
      attempt_number: attemptNumber,
      result: disposition,
      attempt_fingerprint: attempt.attempt_fingerprint
    }
  };
}

function unwrapGate(value) { return value?.challenge_gate || value?.artifact?.challenge_gate || value || {}; }
function sameArray(a, b) {
  const left = unique(a);
  const right = unique(b);
  return left.length === right.length && left.every((value, index) => value === right[index]);
}
function unique(value) { return [...new Set(Array.isArray(value) ? value.filter(Boolean) : [])]; }
function sha(value) { return createHash("sha256").update(JSON.stringify(value)).digest("hex"); }
