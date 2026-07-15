import {
  PHASE7_DAP_BATCH_ARTIFACT_NAMES,
  PHASE7_DAP_BATCH_VALIDATION_ARTIFACT_PATTERN
} from "../../runtime/contracts/artifact-permissions.contract.js";
import { assertPhase11TargetedMutationProposal } from "./operator-challenge-targeted-adapter.contract.js";
import { assertPhase11TargetedPacket } from "./operator-challenge-targeted-packet.js";

export const PHASE11_WRITE_AUTHORITY_VERSION = "phase11_write_authority.v1";

const PHASE7_VALIDATION_PREFIX = "dap_semantic_batch_validation__";
const PHASE10_BATCH_PREFIX = "exposure_registry_batch__";
const PHASE10_VALIDATION_PREFIX = "exposure_registry_batch_validation__";

const PHASE7_VALIDATION_BY_BATCH_ARTIFACT = Object.freeze({
  dap_semantic_batch_exec_artifact: `${PHASE7_VALIDATION_PREFIX}DAP-SEM-BATCH-01`,
  dap_semantic_batch_lim_artifact: `${PHASE7_VALIDATION_PREFIX}DAP-SEM-BATCH-02`,
  dap_semantic_batch_party_artifact: `${PHASE7_VALIDATION_PREFIX}DAP-SEM-BATCH-03`,
  dap_semantic_batch_role_artifact: `${PHASE7_VALIDATION_PREFIX}DAP-SEM-BATCH-04`,
  dap_semantic_batch_flow_artifact: `${PHASE7_VALIDATION_PREFIX}DAP-SEM-BATCH-05`,
  dap_semantic_batch_obj_artifact: `${PHASE7_VALIDATION_PREFIX}DAP-SEM-BATCH-06`,
  dap_semantic_batch_auth_artifact: `${PHASE7_VALIDATION_PREFIX}DAP-SEM-BATCH-07`,
  dap_semantic_batch_ctrl_artifact: `${PHASE7_VALIDATION_PREFIX}DAP-SEM-BATCH-08`,
  dap_semantic_batch_contact_cm_artifact: `${PHASE7_VALIDATION_PREFIX}DAP-SEM-BATCH-09`,
  dap_semantic_batch_vend_artifact: `${PHASE7_VALIDATION_PREFIX}DAP-SEM-BATCH-10`,
  dap_semantic_batch_loc_artifact: `${PHASE7_VALIDATION_PREFIX}DAP-SEM-BATCH-11`,
  dap_semantic_batch_ret_artifact: `${PHASE7_VALIDATION_PREFIX}DAP-SEM-BATCH-12`,
  dap_semantic_batch_sec_artifact: `${PHASE7_VALIDATION_PREFIX}DAP-SEM-BATCH-13`,
  dap_semantic_batch_sens_artifact: `${PHASE7_VALIDATION_PREFIX}DAP-SEM-BATCH-14`,
  dap_semantic_batch_dom_artifact: `${PHASE7_VALIDATION_PREFIX}DAP-SEM-BATCH-15`,
  dap_semantic_batch_ready_artifact: `${PHASE7_VALIDATION_PREFIX}DAP-SEM-BATCH-16`,
  dap_semantic_batch_req_artifact: `${PHASE7_VALIDATION_PREFIX}DAP-SEM-BATCH-17`
});

export const PHASE11_OWNER_WRITE_POLICIES = Object.freeze({
  P3_DOMAIN_DERIVATION_LAYER: Object.freeze({ direct: Object.freeze(["domain_derivation_profile"]), mechanical: Object.freeze([]), max_direct: 1 }),
  M8_TARGET_FEATURE_PROFILE: Object.freeze({ direct: Object.freeze(["target_feature_profile"]), mechanical: Object.freeze([]), max_direct: 1 }),
  DATA_PROVENANCE_PROFILE_LAYER4: Object.freeze({ direct: Object.freeze([...PHASE7_DAP_BATCH_ARTIFACT_NAMES]), mechanical: Object.freeze([`${PHASE7_VALIDATION_PREFIX}{BATCH_ID}`]), max_direct: 1 }),
  DOMAIN_CONTROL_OBLIGATION_PROFILE: Object.freeze({ direct: Object.freeze(["domain_control_obligation_profile"]), mechanical: Object.freeze([]), max_direct: 1 }),
  M11: Object.freeze({ direct: Object.freeze([`${PHASE10_BATCH_PREFIX}{SUFFIX}`, `${PHASE10_VALIDATION_PREFIX}{SUFFIX}`]), mechanical: Object.freeze(["exposure_registry_workpad_98", "exposure_registry_controlled_profile", "exposure_registry_triggered_profile", "exposure_registry_profile_forensics"]), max_direct: 2 })
});

export function validatePhase11ProposalWriteAuthority({ dispatch, packet = null, proposal, baselineArtifactVersions = {} } = {}) {
  const failures = [];
  try { assertPhase11TargetedMutationProposal({ proposal, dispatch }); } catch (error) { failures.push(error.message); }
  const targetedPacket = packet || proposal?.phase11_reinvestigation_context;
  try { assertPhase11TargetedPacket({ packet: targetedPacket, dispatch }); } catch (error) { failures.push(error.message); }
  const ownerJob = String(dispatch?.owner_internal_job || proposal?.owner_internal_job || "");
  const policy = PHASE11_OWNER_WRITE_POLICIES[ownerJob];
  if (!policy) failures.push(`PHASE11_WRITE_AUTHORITY_OWNER_UNSUPPORTED:${ownerJob || "missing"}`);

  const writes = Array.isArray(proposal?.proposed_writes) ? proposal.proposed_writes : [];
  const manifest = Array.isArray(proposal?.actual_write_manifest) ? proposal.actual_write_manifest : [];
  const writeNames = unique(writes.map((row) => row.artifact_name));
  const manifestNames = unique(manifest.map((row) => row.artifact_name));
  if (!sameSet(writeNames, manifestNames)) failures.push("PHASE11_WRITE_AUTHORITY_MANIFEST_MISMATCH");
  for (const name of duplicates(writes.map((row) => row.artifact_name))) failures.push(`PHASE11_WRITE_AUTHORITY_DUPLICATE:${name}`);

  const manifestByName = new Map(manifest.map((row) => [row.artifact_name, row]));
  const direct = [];
  const mechanical = [];
  for (const write of writes) {
    const artifactName = String(write.artifact_name || "");
    const row = manifestByName.get(artifactName) || {};
    const kind = String(row.direct_or_mechanical_dependency || "direct");
    const expected = classifyWrite({ ownerJob, artifactName, dispatch });
    if (!expected) failures.push(`PHASE11_WRITE_AUTHORITY_ARTIFACT_FORBIDDEN:${ownerJob}:${artifactName}`);
    if (expected && kind !== expected.kind) failures.push(`PHASE11_WRITE_AUTHORITY_KIND_MISMATCH:${artifactName}:${kind}:${expected.kind}`);
    if (!Number(baselineArtifactVersions[artifactName] || 0)) failures.push(`PHASE11_WRITE_AUTHORITY_BASELINE_MISSING:${artifactName}`);
    if (Number(write.expected_previous_version || 0) !== Number(baselineArtifactVersions[artifactName] || 0)) failures.push(`PHASE11_WRITE_AUTHORITY_BASELINE_MISMATCH:${artifactName}`);
    if (kind === "direct") {
      direct.push(artifactName);
      const allowed = unique(write.allowed_field_paths);
      const dispatchPaths = unique(dispatch?.field_paths);
      if (!allowed.length && requiresDirectFieldScope({ ownerJob, artifactName })) failures.push(`PHASE11_WRITE_AUTHORITY_DIRECT_PATHS_MISSING:${artifactName}`);
      for (const path of allowed) {
        if (!dispatchPaths.some((scope) => pathsOverlap(path, scope))) failures.push(`PHASE11_WRITE_AUTHORITY_PATH_FORBIDDEN:${artifactName}:${path}`);
      }
    } else {
      mechanical.push(artifactName);
      if (unique(write.allowed_field_paths).length) failures.push(`PHASE11_WRITE_AUTHORITY_MECHANICAL_DIRECT_PATHS:${artifactName}`);
    }
  }
  if (policy && direct.length > Number(policy.max_direct || direct.length)) failures.push(`PHASE11_WRITE_AUTHORITY_DIRECT_COUNT:${ownerJob}:${direct.length}`);
  if (ownerJob === "DATA_PROVENANCE_PROFILE_LAYER4") validatePhase7Pair({ direct, mechanical, failures });
  if (ownerJob === "M11") validatePhase10Pair({ direct, mechanical, failures });

  const status = failures.length ? "REJECTED" : "PASS";
  const authorizedMutationPaths = unique(writes.flatMap((write) => write.allowed_field_paths));
  return Object.freeze({
    schema_version: PHASE11_WRITE_AUTHORITY_VERSION,
    status,
    policy_id: ownerJob,
    policy_version: PHASE11_WRITE_AUTHORITY_VERSION,
    failures,
    authorized_write_names: writeNames,
    authorized_direct_write_names: direct,
    authorized_mechanical_write_names: mechanical,
    authorized_mutation_paths: authorizedMutationPaths,
    backend_owned_write_authority: true,
    proposal_is_not_authority: true
  });
}

export function assertPhase11ProposalWriteAuthority(args = {}) {
  const result = validatePhase11ProposalWriteAuthority(args);
  if (result.status !== "PASS") throw new Error(`PHASE11_WRITE_AUTHORITY_REJECTED:${result.failures.join("|")}`);
  return result;
}

function classifyWrite({ ownerJob, artifactName, dispatch }) {
  if (ownerJob === "DATA_PROVENANCE_PROFILE_LAYER4") {
    if (PHASE7_DAP_BATCH_ARTIFACT_NAMES.includes(artifactName)) return { kind: "direct" };
    if (PHASE7_DAP_BATCH_VALIDATION_ARTIFACT_PATTERN.test(artifactName)) return { kind: "mechanical_dependency" };
    return null;
  }
  if (ownerJob === "M11") {
    if (artifactName.startsWith(PHASE10_BATCH_PREFIX) || artifactName.startsWith(PHASE10_VALIDATION_PREFIX)) return { kind: "direct" };
    if (PHASE11_OWNER_WRITE_POLICIES.M11.mechanical.includes(artifactName)) return { kind: "mechanical_dependency" };
    return null;
  }
  const policy = PHASE11_OWNER_WRITE_POLICIES[ownerJob];
  if (!policy) return null;
  if (policy.direct.includes(artifactName)) return { kind: "direct" };
  if (policy.mechanical.includes(artifactName)) return { kind: "mechanical_dependency" };
  return null;
}
function validatePhase7Pair({ direct, mechanical, failures }) {
  if (direct.length !== 1) failures.push(`PHASE11_WRITE_AUTHORITY_PHASE7_DIRECT_COUNT:${direct.length}`);
  if (mechanical.length !== 1) failures.push(`PHASE11_WRITE_AUTHORITY_PHASE7_VALIDATION_COUNT:${mechanical.length}`);
  const expectedValidation = PHASE7_VALIDATION_BY_BATCH_ARTIFACT[direct[0]];
  if (direct[0] && !expectedValidation) failures.push(`PHASE11_WRITE_AUTHORITY_PHASE7_BATCH_UNKNOWN:${direct[0]}`);
  if (direct[0] && mechanical[0] && mechanical[0] !== expectedValidation) failures.push(`PHASE11_WRITE_AUTHORITY_PHASE7_PAIR_MISMATCH:${direct[0]}:${mechanical[0]}`);
}
function validatePhase10Pair({ direct, mechanical, failures }) {
  const batch = direct.find((name) => name.startsWith(PHASE10_BATCH_PREFIX));
  const validation = direct.find((name) => name.startsWith(PHASE10_VALIDATION_PREFIX));
  if (!batch || !validation) failures.push("PHASE11_WRITE_AUTHORITY_PHASE10_PAIR_MISSING");
  if (batch && validation && batch.slice(PHASE10_BATCH_PREFIX.length) !== validation.slice(PHASE10_VALIDATION_PREFIX.length)) failures.push(`PHASE11_WRITE_AUTHORITY_PHASE10_PAIR_MISMATCH:${batch}:${validation}`);
  for (const required of PHASE11_OWNER_WRITE_POLICIES.M11.mechanical) if (!mechanical.includes(required)) failures.push(`PHASE11_WRITE_AUTHORITY_PHASE10_MECHANICAL_MISSING:${required}`);
}
function requiresDirectFieldScope({ ownerJob, artifactName }) {
  return !(ownerJob === "M11" && artifactName.startsWith(PHASE10_VALIDATION_PREFIX));
}
function unique(value) { return [...new Set(Array.isArray(value) ? value.filter(Boolean).map(String) : [])]; }
function duplicates(value = []) { const seen = new Set(); const out = new Set(); for (const raw of Array.isArray(value) ? value : []) { const item = String(raw || ""); if (!item) continue; if (seen.has(item)) out.add(item); seen.add(item); } return [...out]; }
function sameSet(a, b) { const left = unique(a).sort(); const right = unique(b).sort(); return left.length === right.length && left.every((item, index) => item === right[index]); }
function pathsOverlap(a, b) { const left = String(a || ""); const right = String(b || ""); return left === right || left.startsWith(`${right}.`) || right.startsWith(`${left}.`); }
