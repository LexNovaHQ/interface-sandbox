import { assertPhase11TargetedMutationProposal } from "./operator-challenge-targeted-adapter.contract.js";
import { validatePhase11ProposalWriteAuthority } from "./operator-challenge-write-authority.js";

export const PHASE11_WRITE_MANIFEST_VALIDATION_VERSION = "phase11_write_manifest_validation.v2.backend_authority";

export function validatePhase11WriteManifest({ dispatch, packet = null, proposal, baselineArtifactVersions = {} } = {}) {
  assertPhase11TargetedMutationProposal({ proposal });
  const authority = validatePhase11ProposalWriteAuthority({ dispatch, packet, proposal, baselineArtifactVersions });
  const manifestNames = unique(proposal.actual_write_manifest.map((row) => row.artifact_name));
  const writeNames = unique(proposal.proposed_writes.map((row) => row.artifact_name));
  const unauthorized = [];
  const missingBaseline = [];
  const duplicateWrites = duplicates(proposal.proposed_writes.map((row) => row.artifact_name));
  if (!sameSet(manifestNames, writeNames)) unauthorized.push("manifest/write-set mismatch");
  for (const artifactName of manifestNames) {
    if (!Number(baselineArtifactVersions[artifactName] || 0)) missingBaseline.push(artifactName);
  }
  for (const write of proposal.proposed_writes) {
    const expected = Number(write.expected_previous_version || 0);
    const actual = Number(baselineArtifactVersions[write.artifact_name] || 0);
    if (!actual || expected !== actual) missingBaseline.push(write.artifact_name);
  }
  const status = unauthorized.length || missingBaseline.length || duplicateWrites.length || authority.status !== "PASS" ? "REJECTED" : "PASS";
  return Object.freeze({
    schema_version: PHASE11_WRITE_MANIFEST_VALIDATION_VERSION,
    status,
    dispatch_id: proposal.dispatch_id,
    challenge_candidate_id: proposal.challenge_candidate_id,
    actual_write_manifest: proposal.actual_write_manifest,
    proposed_write_names: writeNames,
    manifest_names: manifestNames,
    duplicate_writes: duplicateWrites,
    missing_or_mismatched_baseline_artifacts: unique(missingBaseline),
    unauthorized_reasons: unauthorized,
    authority,
    exact_runtime_write_manifest_required: true,
    new_artifact_creation_during_material_reinvestigation: false
  });
}

function unique(value) { return [...new Set(Array.isArray(value) ? value.filter(Boolean).map(String) : [])]; }
function duplicates(value) { const seen = new Set(); const out = new Set(); for (const item of value || []) { const text = String(item || ""); if (!text) continue; if (seen.has(text)) out.add(text); seen.add(text); } return [...out]; }
function sameSet(a, b) { const left = unique(a).sort(); const right = unique(b).sort(); return left.length === right.length && left.every((value, index) => value === right[index]); }
