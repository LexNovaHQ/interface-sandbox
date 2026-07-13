import { createHash } from "node:crypto";
import { assertPhase11TargetedPacket } from "./operator-challenge-targeted-packet.js";

export const PHASE11_TARGETED_MUTATION_PROPOSAL_VERSION = "phase11_targeted_mutation_proposal.v1";

export const PHASE11_TARGETED_PROPOSAL_STATUS = Object.freeze({
  proposedMutation: "PROPOSED_MUTATION",
  noMaterialChange: "NO_MATERIAL_CHANGE",
  technicalFailure: "TECHNICAL_FAILURE",
  invalidOwnerOutput: "INVALID_OWNER_OUTPUT"
});

const ALLOWED_STATUSES = new Set(Object.values(PHASE11_TARGETED_PROPOSAL_STATUS));

export function buildPhase11TargetedMutationProposal(input = {}) {
  const packet = input.phase11_reinvestigation_context || input.targeted_packet || input.packet;
  assertPhase11TargetedPacket({ packet, dispatch: input.dispatch });
  const proposal = {
    schema_version: PHASE11_TARGETED_MUTATION_PROPOSAL_VERSION,
    status: String(input.status || PHASE11_TARGETED_PROPOSAL_STATUS.proposedMutation),
    dispatch_id: packet.dispatch_id,
    challenge_candidate_id: packet.challenge_candidate_id,
    attempt_number: Number(packet.attempt_number || 0),
    owner_internal_job: packet.owner_internal_job,
    phase11_reinvestigation_context: packet,
    baseline_fingerprint: String(input.baseline_fingerprint || fingerprint(input.baseline_artifact_versions || packet.baseline_artifact_versions || {})),
    proposed_writes: normalizeWrites(input.proposed_writes),
    actual_write_manifest: normalizeManifest(input.actual_write_manifest),
    provider_call_count: Number(input.provider_call_count || 0),
    output_repair_count: Number(input.output_repair_count || 0),
    technical_retry_count: Number(input.technical_retry_count || 0),
    unaffected_batch_count_reused: Number(input.unaffected_batch_count_reused || 0),
    full_phase_batch_rerun_performed: input.full_phase_batch_rerun_performed === true,
    substantive_reinvestigation_performed: input.substantive_reinvestigation_performed === true,
    owner_notes: String(input.owner_notes || "")
  };
  proposal.proposal_fingerprint = fingerprint(proposal);
  assertPhase11TargetedMutationProposal({ proposal, dispatch: input.dispatch });
  return Object.freeze(proposal);
}

export function assertPhase11TargetedMutationProposal({ proposal, dispatch = null } = {}) {
  if (!proposal || proposal.schema_version !== PHASE11_TARGETED_MUTATION_PROPOSAL_VERSION) throw new Error("PHASE11_TARGETED_PROPOSAL_SCHEMA_INVALID");
  if (!ALLOWED_STATUSES.has(proposal.status)) throw new Error(`PHASE11_TARGETED_PROPOSAL_STATUS_INVALID:${proposal.status || "missing"}`);
  assertPhase11TargetedPacket({ packet: proposal.phase11_reinvestigation_context, dispatch });
  if (String(proposal.dispatch_id || "") !== proposal.phase11_reinvestigation_context.dispatch_id) throw new Error("PHASE11_TARGETED_PROPOSAL_DISPATCH_MISMATCH");
  if (String(proposal.challenge_candidate_id || "") !== proposal.phase11_reinvestigation_context.challenge_candidate_id) throw new Error("PHASE11_TARGETED_PROPOSAL_CANDIDATE_MISMATCH");
  if (Number(proposal.attempt_number || 0) !== Number(proposal.phase11_reinvestigation_context.attempt_number || 0)) throw new Error("PHASE11_TARGETED_PROPOSAL_ATTEMPT_MISMATCH");
  if (String(proposal.owner_internal_job || "") !== proposal.phase11_reinvestigation_context.owner_internal_job) throw new Error("PHASE11_TARGETED_PROPOSAL_OWNER_MISMATCH");
  if (!Array.isArray(proposal.proposed_writes)) throw new Error("PHASE11_TARGETED_PROPOSAL_WRITES_INVALID");
  if (!Array.isArray(proposal.actual_write_manifest)) throw new Error("PHASE11_TARGETED_PROPOSAL_MANIFEST_INVALID");
  if (!Number.isFinite(Number(proposal.unaffected_batch_count_reused || 0)) || Number(proposal.unaffected_batch_count_reused || 0) < 0) throw new Error("PHASE11_TARGETED_PROPOSAL_UNAFFECTED_BATCH_COUNT_INVALID");
  if (proposal.full_phase_batch_rerun_performed === true) throw new Error("PHASE11_TARGETED_PROPOSAL_FULL_PHASE_BATCH_RERUN_FORBIDDEN");
  if (proposal.status === PHASE11_TARGETED_PROPOSAL_STATUS.proposedMutation && !proposal.proposed_writes.length) throw new Error("PHASE11_TARGETED_PROPOSAL_EMPTY_MUTATION");
  const manifestNames = unique(proposal.actual_write_manifest.map((row) => row.artifact_name));
  const writeNames = unique(proposal.proposed_writes.map((row) => row.artifact_name));
  if (!sameSet(manifestNames, writeNames)) throw new Error("PHASE11_TARGETED_PROPOSAL_MANIFEST_WRITE_MISMATCH");
  for (const row of proposal.proposed_writes) {
    if (!row.artifact_name) throw new Error("PHASE11_TARGETED_PROPOSAL_ARTIFACT_NAME_MISSING");
    if (!Number.isFinite(Number(row.expected_previous_version)) || Number(row.expected_previous_version) <= 0) throw new Error(`PHASE11_TARGETED_PROPOSAL_BASELINE_VERSION_MISSING:${row.artifact_name}`);
    if (!row.proposed_artifact || typeof row.proposed_artifact !== "object" || Array.isArray(row.proposed_artifact)) throw new Error(`PHASE11_TARGETED_PROPOSAL_ARTIFACT_OBJECT_INVALID:${row.artifact_name}`);
    if (!Array.isArray(row.allowed_field_paths)) throw new Error(`PHASE11_TARGETED_PROPOSAL_ALLOWED_PATHS_INVALID:${row.artifact_name}`);
    if (!Array.isArray(row.mechanically_dependent_paths)) throw new Error(`PHASE11_TARGETED_PROPOSAL_DEPENDENT_PATHS_INVALID:${row.artifact_name}`);
  }
  return true;
}

export function normalizeProposalWrite(row = {}) {
  return Object.freeze({
    artifact_name: String(row.artifact_name || ""),
    expected_previous_version: Number(row.expected_previous_version || 0),
    proposed_artifact: row.proposed_artifact,
    lock_status: String(row.lock_status || row.proposed_artifact?.status || "LOCKED_WITH_LIMITATIONS"),
    allowed_field_paths: unique(row.allowed_field_paths),
    mechanically_dependent_paths: unique(row.mechanically_dependent_paths)
  });
}

export function normalizeManifestRow(row = {}) {
  return Object.freeze({
    artifact_name: String(row.artifact_name || ""),
    reason: String(row.reason || ""),
    direct_or_mechanical_dependency: String(row.direct_or_mechanical_dependency || "direct")
  });
}

function normalizeWrites(rows) { return Array.isArray(rows) ? rows.map(normalizeProposalWrite) : []; }
function normalizeManifest(rows) { return Array.isArray(rows) ? rows.map(normalizeManifestRow) : []; }
function sameSet(a, b) { const left = unique(a).sort(); const right = unique(b).sort(); return left.length === right.length && left.every((value, index) => value === right[index]); }
function unique(value) { return [...new Set(Array.isArray(value) ? value.filter(Boolean).map(String) : [])]; }
function fingerprint(value) { return createHash("sha256").update(JSON.stringify(sortDeep(value))).digest("hex"); }
function sortDeep(value) {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (!value || typeof value !== "object") return value;
  return Object.keys(value).sort().reduce((acc, key) => {
    if (key !== "proposal_fingerprint" && value[key] !== undefined) acc[key] = sortDeep(value[key]);
    return acc;
  }, {});
}