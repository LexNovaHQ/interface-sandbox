import { createHash } from "node:crypto";

export const PHASE11_REINVESTIGATION_DISPATCH_VERSION = "phase11_reinvestigation_dispatch.v1";
export const PHASE11_REINVESTIGATION_RETURN_VERSION = "phase11_reinvestigation_return.v1";

const OWNER_JOB = Object.freeze({
  PHASE_3_DOMAIN_DERIVATION: "P3_DOMAIN_DERIVATION_LAYER",
  PHASE_5_ACTIVITY_PROFILE: "M8_TARGET_FEATURE_PROFILE",
  PHASE_7_DATA_PROVENANCE: "DATA_PROVENANCE_PROFILE_LAYER4",
  PHASE_8_DOMAIN_CONTROL_OBLIGATION: "DOMAIN_CONTROL_OBLIGATION_PROFILE",
  PHASE_10_EXPOSURE_PROFILE: "M11",
  PHASE_2G_ROUTING: "P2G_PHASE_ROUTER"
});

export function createPhase11ReinvestigationDispatch({ challengeGate, run = {}, baselineArtifactVersions = {} } = {}) {
  const gate = unwrapGate(challengeGate);
  if (gate.status !== "REINVESTIGATION_REQUIRED") throw new Error(`PHASE11_DISPATCH_GATE_NOT_PENDING:${gate.status || "missing"}`);
  const directives = array(gate.reinvestigation_directives);
  if (!directives.length) throw new Error("PHASE11_DISPATCH_DIRECTIVE_MISSING");
  const directive = directives.slice().sort((a, b) => Number(a.attempt_number || 0) - Number(b.attempt_number || 0) || String(a.challenge_candidate_id).localeCompare(String(b.challenge_candidate_id)))[0];
  const ownerJob = OWNER_JOB[String(directive.owning_phase || "")];
  if (!ownerJob) throw new Error(`PHASE11_DISPATCH_OWNER_UNSUPPORTED:${directive.owning_phase || "missing"}`);
  if (directive.full_phase_rerun_required === true || directive.smallest_affected_unit_only !== true) throw new Error(`PHASE11_DISPATCH_SCOPE_NOT_TARGETED:${directive.challenge_candidate_id || "unknown"}`);
  const dispatchMaterial = {
    run_id: String(run.run_id || gate.run_id || ""),
    challenge_candidate_id: String(directive.challenge_candidate_id || ""),
    owning_phase: String(directive.owning_phase || ""),
    owner_internal_job: ownerJob,
    return_internal_job: "M12",
    attempt_number: Number(directive.attempt_number || 0),
    artifact_names: unique(directive.artifact_names),
    field_paths: unique(directive.field_paths),
    affected_row_identity: unique(directive.affected_row_identity),
    problem: String(directive.problem || ""),
    required_reinvestigation: String(directive.required_reinvestigation || ""),
    baseline_artifact_versions: { ...baselineArtifactVersions },
    source_gate_fingerprint: String(gate.final_gate_fingerprint || "")
  };
  if (!dispatchMaterial.challenge_candidate_id || !dispatchMaterial.attempt_number) throw new Error("PHASE11_DISPATCH_IDENTITY_INVALID");
  return Object.freeze({
    schema_version: PHASE11_REINVESTIGATION_DISPATCH_VERSION,
    status: "DISPATCHED",
    active: true,
    dispatch_id: sha(dispatchMaterial),
    dispatched_at: new Date().toISOString(),
    targeted_reinvestigation_only: true,
    full_phase_rerun_forbidden: true,
    ...dispatchMaterial
  });
}

export function phase11DispatchContractForRun({ contract = {}, dispatch = null } = {}) {
  if (!isActivePhase11Dispatch(dispatch)) return contract;
  return Object.freeze({
    ...contract,
    phase11_reinvestigation_mode: true,
    phase11_reinvestigation_context: {
      schema_version: dispatch.schema_version,
      dispatch_id: dispatch.dispatch_id,
      challenge_candidate_id: dispatch.challenge_candidate_id,
      attempt_number: dispatch.attempt_number,
      owning_phase: dispatch.owning_phase,
      artifact_names: dispatch.artifact_names,
      field_paths: dispatch.field_paths,
      affected_row_identity: dispatch.affected_row_identity,
      problem: dispatch.problem,
      required_reinvestigation: dispatch.required_reinvestigation,
      targeted_reinvestigation_only: true,
      full_phase_rerun_forbidden: true,
      return_to_phase11_after_completion: true
    }
  });
}

export function isActivePhase11Dispatch(dispatch) {
  return Boolean(dispatch && dispatch.active === true && dispatch.status === "DISPATCHED" && dispatch.schema_version === PHASE11_REINVESTIGATION_DISPATCH_VERSION);
}

export function assertPhase11DispatchOwner({ dispatch, internalJobId } = {}) {
  if (!isActivePhase11Dispatch(dispatch)) return false;
  if (String(internalJobId || "") !== String(dispatch.owner_internal_job || "")) throw new Error(`PHASE11_DISPATCH_JOB_MISMATCH:${internalJobId || "missing"}:${dispatch.owner_internal_job || "missing"}`);
  return true;
}

export function evaluatePhase11ReinvestigationReturn({ dispatch, previousCandidate, currentInventory, returnedArtifactVersions = {}, runtimeError = null } = {}) {
  assertPhase11DispatchOwner({ dispatch, internalJobId: dispatch?.owner_internal_job });
  if (!previousCandidate || previousCandidate.challenge_candidate_id !== dispatch.challenge_candidate_id) throw new Error("PHASE11_RETURN_PREVIOUS_CANDIDATE_MISMATCH");
  const currentCandidates = array(currentInventory?.challenge_candidates);
  const persisted = currentCandidates.find((candidate) => sameCandidateCondition(previousCandidate, candidate));
  const versionsAdvanced = dispatch.artifact_names.length === 0 || dispatch.artifact_names.some((name) => Number(returnedArtifactVersions[name] || 0) > Number(dispatch.baseline_artifact_versions?.[name] || 0));
  const resolved = !runtimeError && versionsAdvanced && !persisted;
  const validationBasis = runtimeError
    ? `Owning phase runtime error: ${runtimeError.message || String(runtimeError)}`
    : !versionsAdvanced
      ? "No challenged artifact version advanced after targeted reinvestigation."
      : resolved
        ? "The exact deterministic Layer 1 challenge condition no longer exists in the rebuilt inventory."
        : "The exact deterministic Layer 1 challenge condition remains in the rebuilt inventory.";
  return Object.freeze({
    schema_version: PHASE11_REINVESTIGATION_RETURN_VERSION,
    dispatch_id: dispatch.dispatch_id,
    challenge_candidate_id: dispatch.challenge_candidate_id,
    attempt_number: dispatch.attempt_number,
    owning_phase: dispatch.owning_phase,
    artifact_names: [...dispatch.artifact_names],
    field_paths: [...dispatch.field_paths],
    affected_row_identity: [...dispatch.affected_row_identity],
    result: resolved ? "RESOLVED" : "UNRESOLVED",
    validated: true,
    validation_basis: validationBasis,
    remaining_uncertainty: resolved ? "" : String(persisted?.contradiction_statement || previousCandidate.contradiction_statement || validationBasis),
    returned_artifact_versions: Object.entries(returnedArtifactVersions).map(([artifact_name, version]) => ({ artifact_name, version: Number(version || 0) })),
    condition_persisted: Boolean(persisted),
    artifact_version_advanced: versionsAdvanced,
    return_internal_job: "M12",
    return_fingerprint: sha({ dispatch_id: dispatch.dispatch_id, result: resolved ? "RESOLVED" : "UNRESOLVED", validationBasis, returnedArtifactVersions })
  });
}

export function candidateForDispatch({ challengeGate, dispatch } = {}) {
  const gate = unwrapGate(challengeGate);
  const candidates = array(gate.operator_challenge_inventory?.challenge_candidates);
  const candidate = candidates.find((row) => row.challenge_candidate_id === dispatch?.challenge_candidate_id);
  if (!candidate) throw new Error(`PHASE11_DISPATCH_CANDIDATE_NOT_FOUND:${dispatch?.challenge_candidate_id || "missing"}`);
  return candidate;
}

function sameCandidateCondition(left = {}, right = {}) {
  return String(left.challenge_type || "") === String(right.challenge_type || "")
    && sameSet(left.affected_registry_row_keys, right.affected_registry_row_keys)
    && sameSet(left.affected_activity_ids, right.affected_activity_ids)
    && sameSet(left.affected_data_field_ids, right.affected_data_field_ids)
    && sameSet(left.affected_obligation_ids, right.affected_obligation_ids)
    && sameSet(left.affected_field_paths, right.affected_field_paths);
}
function sameSet(a, b) { const left = unique(a).sort(); const right = unique(b).sort(); return left.length === right.length && left.every((value, index) => value === right[index]); }
function unwrapGate(value) { return value?.challenge_gate || value?.artifact?.challenge_gate || value || {}; }
function array(value) { return Array.isArray(value) ? value : []; }
function unique(value) { return [...new Set(array(value).filter(Boolean).map(String))]; }
function sha(value) { return createHash("sha256").update(JSON.stringify(value)).digest("hex"); }
