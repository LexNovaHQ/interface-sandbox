import { DOMAIN_DERIVATION_CONTRACT } from "./domain-derivation.contract.js";
import { loadDomainDerivationRegistryV0 } from "../../runtime/domain-gate/domain-derivation-registry.loader.js";
import { assertDomainDerivationRuntimeArtifacts, compileDomainDerivationArtifacts } from "./validators/domain-derivation.validator.js";

export const DOMAIN_DERIVATION_RUNNER_STATUS = Object.freeze({
  phase_runner: "domain-derivation.runner",
  central_phase_id: DOMAIN_DERIVATION_CONTRACT.central_phase_id,
  internal_job_id: DOMAIN_DERIVATION_CONTRACT.internal_job_id,
  public_label: DOMAIN_DERIVATION_CONTRACT.public_label,
  phase_owned_runner: true,
  semantic_first_deterministic_gated: true,
  agent_id: DOMAIN_DERIVATION_CONTRACT.agent_id,
  agent_package_root: DOMAIN_DERIVATION_CONTRACT.agent_package_binding.agent_package_root,
  prompt_package_status: DOMAIN_DERIVATION_CONTRACT.agent_package_binding.prompt_package_status,
  writes: [...DOMAIN_DERIVATION_CONTRACT.writes],
  reads: [...DOMAIN_DERIVATION_CONTRACT.reads]
});

export async function runDomainDerivationPhase({ run, internalJobId = DOMAIN_DERIVATION_CONTRACT.internal_job_id, contract, readArtifacts, buildPrompt, callProvider, saveArtifact } = {}) {
  assertRuntimeContract(contract);
  assertCallback(readArtifacts, "readArtifacts");
  assertCallback(buildPrompt, "buildPrompt");
  assertCallback(callProvider, "callProvider");
  assertCallback(saveArtifact, "saveArtifact");
  assertPromptPackageDeclared(contract);
  const artifacts = await readArtifacts({ reads: contract.reads, agent_id: contract.agent_id || contract.actor_id, strict: true });
  assertDomainDerivationRuntimeArtifacts(artifacts);
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
    domain_derivation_phase_runner_used: true
  };
}

function assertRuntimeContract(contract = {}) {
  if (contract.central_phase_id !== DOMAIN_DERIVATION_CONTRACT.central_phase_id) throw new Error(`P3_DOMAIN_DERIVATION_CONTRACT_MISMATCH:${contract.central_phase_id || "missing"}`);
  if ((contract.agent_id || contract.actor_id) !== DOMAIN_DERIVATION_CONTRACT.agent_id) throw new Error(`P3_DOMAIN_DERIVATION_AGENT_MISMATCH:${contract.agent_id || contract.actor_id || "missing"}`);
  assertSameArray(contract.reads || [], DOMAIN_DERIVATION_CONTRACT.reads, "P3_DOMAIN_DERIVATION_READS");
  assertSameArray(contract.writes || [], DOMAIN_DERIVATION_CONTRACT.writes, "P3_DOMAIN_DERIVATION_WRITES");
  if (contract.legal_cartography_forbidden !== true) throw new Error("P3_DOMAIN_DERIVATION_LEGAL_CARTOGRAPHY_BOUNDARY_MISSING");
  if (contract.legal_signal_derivation_forbidden !== true) throw new Error("P3_DOMAIN_DERIVATION_LEGAL_SIGNAL_BOUNDARY_MISSING");
}

function assertPromptPackageDeclared(contract = {}) {
  const promptFiles = contract.prompt_files || (contract.prompt_file ? [contract.prompt_file] : []);
  if (!promptFiles.length) throw new Error("P3_DOMAIN_DERIVATION_PROMPT_PACKAGE_PENDING:agent package prompt files must be added after contract/runner lock");
}

function assertSameArray(actual, expected, label) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`${label}_MISMATCH:${JSON.stringify({ actual, expected })}`);
}
function assertCallback(fn, label) { if (typeof fn !== "function") throw new Error(`P3_DOMAIN_DERIVATION_RUNNER_MISSING_CALLBACK:${label}`); }
