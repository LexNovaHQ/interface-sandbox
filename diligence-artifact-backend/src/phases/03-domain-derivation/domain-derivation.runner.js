import { DOMAIN_DERIVATION_CONTRACT } from "./domain-derivation.contract.js";
import { loadDomainDerivationRegistryV0 } from "../../runtime/domain-gate/domain-derivation-registry.loader.js";
import { compileDomainDerivationArtifacts } from "./validators/domain-derivation.validator.js";
import { readPhaseRouteRuntimePacket } from "../02-cartography-index/services/phase-route-runtime.reader.js";

export const DOMAIN_DERIVATION_RUNNER_STATUS = Object.freeze({
  phase_runner: "domain-derivation.runner",
  central_phase_id: DOMAIN_DERIVATION_CONTRACT.central_phase_id,
  internal_job_id: DOMAIN_DERIVATION_CONTRACT.internal_job_id,
  public_label: DOMAIN_DERIVATION_CONTRACT.public_label,
  phase_owned_runner: true,
  semantic_first_deterministic_gated: true,
  registry_ladder_prompt_active: true,
  phase2g_route_scoped_runtime_reader_active: true,
  direct_contract_read_loading_forbidden: true,
  profile_forensics_inputs_forbidden: true,
  agent_id: DOMAIN_DERIVATION_CONTRACT.agent_id,
  agent_package_root: DOMAIN_DERIVATION_CONTRACT.agent_package_binding.agent_package_root,
  prompt_package_status: DOMAIN_DERIVATION_CONTRACT.agent_package_binding.prompt_package_status,
  prompt_files: [...DOMAIN_DERIVATION_CONTRACT.agent_package_binding.prompt_files],
  writes: [...DOMAIN_DERIVATION_CONTRACT.writes],
  routing_manifest_read: "phase_routing_manifest"
});

export async function runDomainDerivationPhase({ run, internalJobId = DOMAIN_DERIVATION_CONTRACT.internal_job_id, contract, readArtifacts, buildPrompt, callProvider, saveArtifact } = {}) {
  assertRuntimeContract(contract);
  assertCallback(readArtifacts, "readArtifacts");
  assertCallback(buildPrompt, "buildPrompt");
  assertCallback(callProvider, "callProvider");
  assertCallback(saveArtifact, "saveArtifact");
  assertPromptPackageDeclared(contract);
  const routed = await readPhaseRouteRuntimePacket({ internalJobId, readArtifacts, consumerAgentId: contract.agent_id || contract.actor_id });
  const artifacts = routed.artifacts;
  assertRoutePacket(artifacts.phase_route_runtime_packet, internalJobId);
  const registryPacket = await loadDomainDerivationRegistryV0();
  const prompt = await buildPrompt({ prompt_files: contract.prompt_files, prompt_file: contract.prompt_file, phase: internalJobId, run, artifacts, writes: contract.writes, references: contract.references || [] });
  const providerResult = await callProvider({ prompt, phase: DOMAIN_DERIVATION_CONTRACT.central_phase_id });
  const modelOutput = providerResult?.json || providerResult || {};
  const compiled = await compileDomainDerivationArtifacts({ run, artifacts, modelOutput, registryPacket });
  const saved_artifacts = [];
  for (const artifactName of contract.writes) {
    const artifact = compiled.output?.[artifactName];
    if (!artifact || typeof artifact !== "object" || Array.isArray(artifact)) throw new Error(`P3_DOMAIN_DERIVATION_OUTPUT_MISSING_ARTIFACT:${artifactName}`);
    await saveArtifact({ artifact_name: artifactName, artifact, lock_status: compiled.phase_lock_status });
    saved_artifacts.push(artifactName);
  }
  return {
    ok: true,
    output: compiled.output,
    artifacts_read: Object.keys(artifacts).sort(),
    saved_artifacts,
    phase_lock_status: compiled.phase_lock_status,
    validation: compiled.validation,
    model_metadata: providerResult?.metadata || {},
    registry_id: registryPacket.registry?.registry_id || "",
    registry_ladder_prompt_used: true,
    phase2g_route_id: routed.route.route_id,
    phase2g_bucket_id: routed.route.bucket_id,
    domain_derivation_phase_runner_used: true
  };
}

function assertRuntimeContract(contract = {}) {
  if (contract.central_phase_id !== DOMAIN_DERIVATION_CONTRACT.central_phase_id) throw new Error(`P3_DOMAIN_DERIVATION_CONTRACT_MISMATCH:${contract.central_phase_id || "missing"}`);
  if ((contract.agent_id || contract.actor_id) !== DOMAIN_DERIVATION_CONTRACT.agent_id) throw new Error(`P3_DOMAIN_DERIVATION_AGENT_MISMATCH:${contract.agent_id || contract.actor_id || "missing"}`);
  if (!(contract.reads || []).includes("phase_routing_manifest")) throw new Error("P3_DOMAIN_DERIVATION_PHASE2G_MANIFEST_READ_MISSING");
  assertSameArray(contract.writes || [], DOMAIN_DERIVATION_CONTRACT.writes, "P3_DOMAIN_DERIVATION_WRITES");
  assertSameArray(contract.prompt_files || [], DOMAIN_DERIVATION_CONTRACT.agent_package_binding.prompt_files, "P3_DOMAIN_DERIVATION_PROMPT_FILES");
  if (contract.prompt_package_status !== "ACTIVE_REGISTRY_LADDER_PROMPT") throw new Error("P3_DOMAIN_DERIVATION_PROMPT_PACKAGE_NOT_ACTIVE");
  if (contract.legal_cartography_forbidden !== true) throw new Error("P3_DOMAIN_DERIVATION_LEGAL_CARTOGRAPHY_BOUNDARY_MISSING");
  if (contract.legal_signal_derivation_forbidden !== true) throw new Error("P3_DOMAIN_DERIVATION_LEGAL_SIGNAL_BOUNDARY_MISSING");
  if (contract.registry_ladder_prompt_active !== true) throw new Error("P3_DOMAIN_DERIVATION_REGISTRY_LADDER_PROMPT_FLAG_MISSING");
}

function assertRoutePacket(packet = {}, internalJobId) {
  if (packet.routing_authority !== "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY") throw new Error("P3_DOMAIN_DERIVATION_PHASE2G_AUTHORITY_MISSING");
  if (packet.internal_job_id !== internalJobId) throw new Error(`P3_DOMAIN_DERIVATION_PHASE2G_JOB_MISMATCH:${packet.internal_job_id || "missing"}`);
  if (packet.lossless_evidence_role !== "PRIMARY_EVIDENCE") throw new Error("P3_DOMAIN_DERIVATION_LOSSLESS_PRIMARY_BOUNDARY_MISSING");
  if (packet.index_role !== "MANDATORY_NAVIGATION_MAP_INTO_PRIMARY_EVIDENCE") throw new Error("P3_DOMAIN_DERIVATION_INDEX_NAVIGATION_BOUNDARY_MISSING");
  if (packet.profile_forensics_inputs_allowed !== false) throw new Error("P3_DOMAIN_DERIVATION_FORENSICS_INPUT_BOUNDARY_MISSING");
}

function assertPromptPackageDeclared(contract = {}) {
  const promptFiles = contract.prompt_files || (contract.prompt_file ? [contract.prompt_file] : []);
  if (!promptFiles.length) throw new Error("P3_DOMAIN_DERIVATION_PROMPT_PACKAGE_MISSING:registry ladder prompt files must be declared");
  if (!promptFiles.includes("agent-packages/agent_3_target_feature/02B_P3_DOMAIN_DERIVATION_LAYER_BACKEND.md")) throw new Error("P3_DOMAIN_DERIVATION_REGISTRY_LADDER_PROMPT_MISSING");
}

function assertSameArray(actual, expected, label) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`${label}_MISMATCH:${JSON.stringify({ actual, expected })}`);
}

function assertCallback(fn, label) {
  if (typeof fn !== "function") throw new Error(`P3_DOMAIN_DERIVATION_RUNNER_MISSING_CALLBACK:${label}`);
}
