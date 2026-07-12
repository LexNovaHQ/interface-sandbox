import { createHash } from "node:crypto";

export const PHASE11_TARGETED_PACKET_VERSION = "phase11_targeted_reinvestigation_packet.v1";
export const PHASE11_TARGETED_PACKET_ARTIFACT_KEY = "phase11_reinvestigation_context";

export function buildPhase11TargetedPacket({ dispatch, baselineArtifactVersions = null } = {}) {
  if (!dispatch || dispatch.active !== true || dispatch.status !== "DISPATCHED") throw new Error("PHASE11_TARGETED_PACKET_DISPATCH_INVALID");
  const packetMaterial = {
    schema_version: PHASE11_TARGETED_PACKET_VERSION,
    dispatch_id: String(dispatch.dispatch_id || ""),
    challenge_candidate_id: String(dispatch.challenge_candidate_id || ""),
    attempt_number: Number(dispatch.attempt_number || 0),
    owning_phase: String(dispatch.owning_phase || ""),
    owner_internal_job: String(dispatch.owner_internal_job || ""),
    artifact_names: unique(dispatch.artifact_names),
    field_paths: unique(dispatch.field_paths),
    affected_row_identity: unique(dispatch.affected_row_identity),
    problem: String(dispatch.problem || ""),
    required_reinvestigation: String(dispatch.required_reinvestigation || ""),
    baseline_artifact_versions: { ...(baselineArtifactVersions || dispatch.baseline_artifact_versions || {}) },
    targeted_reinvestigation_only: true,
    full_phase_rerun_forbidden: true,
    return_to_phase11_after_completion: true
  };
  if (!packetMaterial.dispatch_id || !packetMaterial.challenge_candidate_id || !packetMaterial.attempt_number || !packetMaterial.owner_internal_job) throw new Error("PHASE11_TARGETED_PACKET_IDENTITY_INVALID");
  return Object.freeze({
    ...packetMaterial,
    packet_fingerprint: phase11TargetedPacketFingerprint(packetMaterial)
  });
}

export function injectPhase11TargetedPacket({ artifacts = {}, packet } = {}) {
  assertPhase11TargetedPacket({ packet });
  return Object.freeze({
    ...(artifacts || {}),
    [PHASE11_TARGETED_PACKET_ARTIFACT_KEY]: packet
  });
}

export function assertPhase11TargetedPacket({ packet, dispatch = null } = {}) {
  if (!packet || packet.schema_version !== PHASE11_TARGETED_PACKET_VERSION) throw new Error("PHASE11_TARGETED_PACKET_SCHEMA_INVALID");
  if (packet.targeted_reinvestigation_only !== true || packet.full_phase_rerun_forbidden !== true || packet.return_to_phase11_after_completion !== true) throw new Error("PHASE11_TARGETED_PACKET_SCOPE_INVALID");
  if (!packet.dispatch_id || !packet.challenge_candidate_id || !Number(packet.attempt_number || 0) || !packet.owner_internal_job) throw new Error("PHASE11_TARGETED_PACKET_IDENTITY_INVALID");
  const expected = phase11TargetedPacketFingerprint({ ...packet, packet_fingerprint: undefined });
  if (String(packet.packet_fingerprint || "") !== expected) throw new Error("PHASE11_TARGETED_PACKET_FINGERPRINT_INVALID");
  if (dispatch) {
    if (String(packet.dispatch_id) !== String(dispatch.dispatch_id || "")) throw new Error("PHASE11_TARGETED_PACKET_DISPATCH_MISMATCH");
    if (String(packet.challenge_candidate_id) !== String(dispatch.challenge_candidate_id || "")) throw new Error("PHASE11_TARGETED_PACKET_CANDIDATE_MISMATCH");
    if (Number(packet.attempt_number) !== Number(dispatch.attempt_number || 0)) throw new Error("PHASE11_TARGETED_PACKET_ATTEMPT_MISMATCH");
    if (String(packet.owner_internal_job) !== String(dispatch.owner_internal_job || "")) throw new Error("PHASE11_TARGETED_PACKET_OWNER_MISMATCH");
  }
  return true;
}

export function phase11TargetedPacketFingerprint(packet = {}) {
  const material = { ...(packet || {}) };
  delete material.packet_fingerprint;
  return createHash("sha256").update(JSON.stringify(sortDeep(material))).digest("hex");
}

function unique(value) { return [...new Set(Array.isArray(value) ? value.filter(Boolean).map(String) : [])]; }
function sortDeep(value) {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (!value || typeof value !== "object") return value;
  return Object.keys(value).sort().reduce((acc, key) => {
    if (value[key] !== undefined) acc[key] = sortDeep(value[key]);
    return acc;
  }, {});
}
