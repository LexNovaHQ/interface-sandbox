import { createHash } from "node:crypto";
import { buildPhasePrompt } from "../../../runtime/services/prompts.service.js";
import { callProviderJson } from "../../../runtime/services/provider.service.js";
import { readRuntimeArtifactPayload } from "../../../runtime/services/artifacts.service.js";
import { getArtifactMetadata } from "../../../runtime/services/storage/firestore.service.js";
import { readPhaseRouteRuntimePacket } from "../../02-cartography-index/services/phase-route-runtime.reader.js";
import { buildPhase11TargetedMutationProposal, PHASE11_TARGETED_PROPOSAL_STATUS } from "../operator-challenge-targeted-adapter.contract.js";
import { assertPhase11TargetedPacket, injectPhase11TargetedPacket } from "../operator-challenge-targeted-packet.js";

export const PHASE11_TARGETED_OWNER_COMMON_VERSION = "phase11_targeted_owner_common.v1";
export const PHASE11_TARGETED_ADDENDUM = "agent-packages/agent_7_operator_challenge/PHASE11_TARGETED_REINVESTIGATION_ADDENDUM.md";

export async function runSingleArtifactTargetedOwnerAdapter({
  ownerInternalJob,
  canonicalArtifactName,
  run,
  dispatch,
  contract,
  readArtifacts,
  buildPrompt = buildPhasePrompt,
  callProvider = callProviderJson,
  phase11TargetedPacket,
  ownerNotes = "",
  promptPhase = null
} = {}) {
  assertPhase11TargetedPacket({ packet: phase11TargetedPacket, dispatch });
  if (!ownerInternalJob || ownerInternalJob !== dispatch.owner_internal_job) throw new Error(`PHASE11_OWNER_ADAPTER_JOB_MISMATCH:${ownerInternalJob || "missing"}`);
  if (!canonicalArtifactName) throw new Error("PHASE11_OWNER_ADAPTER_CANONICAL_ARTIFACT_MISSING");
  const agentId = contract?.agent_id || contract?.actor_id || "agent_7_m12";
  const routed = await readPhaseRouteRuntimePacket({ internalJobId: ownerInternalJob, readArtifacts, consumerAgentId: agentId });
  const currentArtifact = await readRuntimeArtifactPayload({ run_id: run.run_id, artifact_name: canonicalArtifactName, agent_id: agentId });
  const expectedVersion = await artifactVersion(run.run_id, canonicalArtifactName);
  const prompt = await buildPrompt({
    prompt_files: withTargetedAddendum(contract?.prompt_files || (contract?.prompt_file ? [contract.prompt_file] : [])),
    phase: promptPhase || `PHASE11_TARGETED_REINVESTIGATION:${ownerInternalJob}`,
    run: { ...run, current_phase: ownerInternalJob, phase11_reinvestigation_context: phase11TargetedPacket },
    artifacts: injectPhase11TargetedPacket({
      artifacts: {
        ...(routed?.artifacts || {}),
        [`current_${canonicalArtifactName}`]: currentArtifact
      },
      packet: phase11TargetedPacket
    }),
    writes: [canonicalArtifactName],
    references: contract?.references || []
  });
  const providerResult = await callProvider({ prompt, phase: `OPERATOR_CHALLENGE_TARGETED_${ownerInternalJob}` });
  const proposedArtifact = extractProviderArtifact(providerResult, canonicalArtifactName);
  if (!isObject(proposedArtifact)) {
    return buildPhase11TargetedMutationProposal({
      dispatch,
      phase11_reinvestigation_context: phase11TargetedPacket,
      status: PHASE11_TARGETED_PROPOSAL_STATUS.invalidOwnerOutput,
      proposed_writes: [],
      actual_write_manifest: [],
      provider_call_count: 1,
      substantive_reinvestigation_performed: false,
      owner_notes: `Owner returned no object for ${canonicalArtifactName}. ${ownerNotes}`.trim()
    });
  }
  return buildPhase11TargetedMutationProposal({
    dispatch,
    phase11_reinvestigation_context: phase11TargetedPacket,
    status: PHASE11_TARGETED_PROPOSAL_STATUS.proposedMutation,
    baseline_artifact_versions: { [canonicalArtifactName]: expectedVersion },
    proposed_writes: [{
      artifact_name: canonicalArtifactName,
      expected_previous_version: expectedVersion,
      proposed_artifact: proposedArtifact,
      lock_status: proposedArtifact?.status || "LOCKED_WITH_LIMITATIONS",
      allowed_field_paths: ownerAllowedPaths(canonicalArtifactName, dispatch.field_paths),
      mechanically_dependent_paths: []
    }],
    actual_write_manifest: [{
      artifact_name: canonicalArtifactName,
      reason: `Phase 11 targeted ${ownerInternalJob} material-field reinvestigation`,
      direct_or_mechanical_dependency: "direct"
    }],
    provider_call_count: 1,
    output_repair_count: 0,
    technical_retry_count: 0,
    substantive_reinvestigation_performed: true,
    owner_notes
  });
}

export async function artifactVersion(runId, artifactName) {
  const meta = await getArtifactMetadata(runId, artifactName);
  return Number(meta.latest_version || meta.version || 0);
}

export async function readArtifactAsOwner({ runId, artifactName, agentId }) {
  return readRuntimeArtifactPayload({ run_id: runId, artifact_name: artifactName, agent_id: agentId });
}

export function withTargetedAddendum(promptFiles = []) {
  return [...new Set([...(Array.isArray(promptFiles) ? promptFiles : []), PHASE11_TARGETED_ADDENDUM])];
}

export function ownerAllowedPaths(artifactName, fieldPaths = []) {
  const normalized = unique(fieldPaths).flatMap((path) => {
    const clean = normalizePath(path);
    if (!clean) return [];
    return clean === artifactName || clean.startsWith(`${artifactName}.`) ? [clean] : [clean, `${artifactName}.${clean}`];
  });
  return normalized.length ? normalized : [artifactName];
}

export function fingerprint(value) {
  return createHash("sha256").update(JSON.stringify(sortDeep(value))).digest("hex");
}

export function extractProviderArtifact(providerResult, artifactName) {
  const json = providerResult?.json || providerResult || {};
  if (isObject(json?.[artifactName])) return json[artifactName];
  if (isObject(json?.artifact?.[artifactName])) return json.artifact[artifactName];
  if (isObject(json?.artifact)) return json.artifact;
  if (isObject(json)) return json;
  return null;
}

export function isObject(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
export function unique(value) { return [...new Set(Array.isArray(value) ? value.filter(Boolean).map(String) : [])]; }
export function normalizePath(value) { return String(value || "").replace(/\[([^\]]+)\]/g, ".$1").replace(/\.+/g, ".").replace(/^\.|\.$/g, ""); }
function sortDeep(value) {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (!isObject(value)) return value;
  return Object.keys(value).sort().reduce((acc, key) => {
    if (value[key] !== undefined) acc[key] = sortDeep(value[key]);
    return acc;
  }, {});
}
