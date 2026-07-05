import { ACTIVITY_CANDIDATE_INVENTORY_CONTRACT } from "./activity-candidate-inventory.contract.js";
import { buildFeatureCandidateInventoryIndex, validateFeatureCandidateInventoryIndex } from "../../m8-feature-candidate-inventory-index.js";

export const ACTIVITY_CANDIDATE_INVENTORY_RUNNER_STATUS = Object.freeze({
  phase_runner: "activity-candidate-inventory.runner",
  central_phase_id: ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.central_phase_id,
  phase_job_id: ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.phase_job_id,
  public_label: ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.public_label,
  compatibility_internal_job_id: ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.compatibility_internal_job_id,
  phase_owned_runner: true,
  production_entrypoint_switched: true,
  global_production_deployment_switched: false,
  model_usage: "NONE_DETERMINISTIC",
  source_helper: ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.deterministic_job.source_helper,
  validator: ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.deterministic_job.validator,
  writes: [...ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.deterministic_job.writes],
  reads: [...ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.deterministic_job.reads]
});

export async function runActivityCandidateInventoryPhase({ run, internalJobId = "M8_FEATURE_CANDIDATE_INVENTORY", contract, readArtifacts, saveArtifact } = {}) {
  assertRuntimeContract(contract);
  assertCallback(readArtifacts, "readArtifacts");
  assertCallback(saveArtifact, "saveArtifact");

  const artifacts = await readArtifacts({ reads: contract.reads, agent_id: contract.agent_id || contract.actor_id });
  assertAllowedRuntimeArtifacts(artifacts);
  const productActivityArtifacts = selectCandidateCreationArtifacts(artifacts);

  const inventory = buildFeatureCandidateInventoryIndex(productActivityArtifacts, { runId: run?.run_id || run?.id || null });
  assertInventoryOutputContract(inventory);
  const validation = validateFeatureCandidateInventoryIndex(inventory);
  if (validation.status !== "PASS") throw new Error(`ACTIVITY_CANDIDATE_INVENTORY_VALIDATION_FAILED:${JSON.stringify(validation)}`);
  assertCandidateCreationFamilyBoundary(inventory);

  const artifactName = contract.writes[0];
  await saveArtifact({ artifact_name: artifactName, artifact: inventory, lock_status: "LOCKED" });

  return {
    ok: true,
    output: { [artifactName]: inventory },
    saved_artifacts: [artifactName],
    phase_lock_status: "LOCKED",
    artifacts_read: Object.keys(artifacts).sort(),
    source_families_indexed: inventory.source_families_indexed || [],
    raw_hit_count: inventory.raw_hit_count,
    canonical_candidate_count: inventory.canonical_candidate_count,
    model_usage: "NONE_DETERMINISTIC",
    activity_candidate_inventory_phase_runner_used: true,
    source_helper: ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.deterministic_job.source_helper,
    validator: ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.deterministic_job.validator,
    internal_job_id: internalJobId
  };
}

function assertRuntimeContract(contract = {}) {
  if (contract.central_phase_id !== ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.central_phase_id) throw new Error(`ACTIVITY_CANDIDATE_INVENTORY_CONTRACT_MISMATCH:${contract.central_phase_id || "missing"}`);
  if (contract.public_label !== ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.central_phase_label) throw new Error(`ACTIVITY_CANDIDATE_INVENTORY_PHASE_LABEL_MISMATCH:${contract.public_label || "missing"}`);
  assertSameArray(contract.reads || [], ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.deterministic_job.reads, "ACTIVITY_CANDIDATE_INVENTORY_READS");
  assertSameArray(contract.writes || [], ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.deterministic_job.writes, "ACTIVITY_CANDIDATE_INVENTORY_WRITES");
}

function assertAllowedRuntimeArtifacts(artifacts = {}) {
  const allowed = new Set(ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.deterministic_job.reads);
  for (const key of Object.keys(artifacts)) {
    if (!allowed.has(key)) throw new Error(`ACTIVITY_CANDIDATE_INVENTORY_FORBIDDEN_RUNTIME_ARTIFACT:${key}`);
  }
}

function selectCandidateCreationArtifacts(artifacts = {}) {
  return ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.deterministic_job.reads
    .filter((name) => name.startsWith("lossless_family__"))
    .map((name) => artifacts[name])
    .filter(Boolean);
}

function assertInventoryOutputContract(inventory = {}) {
  const required = ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.output_contract;
  for (const branch of required.required_branches) {
    if (!(branch in inventory)) throw new Error(`ACTIVITY_CANDIDATE_INVENTORY_MISSING_BRANCH:${branch}`);
  }
  if (inventory.artifact_type !== required.artifact_type) throw new Error(`ACTIVITY_CANDIDATE_INVENTORY_ARTIFACT_TYPE_MISMATCH:${inventory.artifact_type || "missing"}`);
  if (inventory.inventory_version !== required.inventory_version) throw new Error(`ACTIVITY_CANDIDATE_INVENTORY_VERSION_MISMATCH:${inventory.inventory_version || "missing"}`);
  if (inventory.derivation_mode !== required.derivation_mode) throw new Error(`ACTIVITY_CANDIDATE_INVENTORY_DERIVATION_MODE_MISMATCH:${inventory.derivation_mode || "missing"}`);
  if (inventory.index_boundary?.index_only !== true) throw new Error("ACTIVITY_CANDIDATE_INVENTORY_INDEX_ONLY_BOUNDARY_MISSING");
  if (inventory.index_boundary?.no_source_text_copy !== true) throw new Error("ACTIVITY_CANDIDATE_INVENTORY_NO_SOURCE_TEXT_COPY_BOUNDARY_MISSING");
}

function assertCandidateCreationFamilyBoundary(inventory = {}) {
  const allowedFamilies = new Set(ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.source_family_scope.candidate_creation_families);
  for (const family of inventory.source_families_indexed || []) {
    if (!allowedFamilies.has(family)) throw new Error(`ACTIVITY_CANDIDATE_INVENTORY_FORBIDDEN_INDEXED_FAMILY:${family}`);
  }
  for (const candidate of inventory.candidates || []) {
    for (const pointer of candidate.source_pointers || []) {
      if (!allowedFamilies.has(pointer.source_family)) throw new Error(`ACTIVITY_CANDIDATE_INVENTORY_FORBIDDEN_POINTER_FAMILY:${pointer.source_family}`);
    }
  }
}

function assertSameArray(actual, expected, label) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`${label}_MISMATCH:${JSON.stringify({ actual, expected })}`);
}

function assertCallback(fn, label) {
  if (typeof fn !== "function") throw new Error(`ACTIVITY_CANDIDATE_INVENTORY_RUNNER_MISSING_CALLBACK:${label}`);
}
