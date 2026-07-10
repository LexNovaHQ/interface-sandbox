import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { P2D_DATA_PRIVACY_ARTIFACTS, P2D_DATA_PRIVACY_SAVE_ORDER } from "../data-privacy-navigation-index.contract.js";
import { buildDataPrivacyDeterministicMap, buildDataPrivacySemanticProfile } from "../services/data-privacy-deterministic-map.builder.js";
import { compileDataPrivacyNavigationIndex } from "../services/data-privacy-navigation-index.compiler.js";
import { validateDataPrivacyDeterministicMap, validateDataPrivacySemanticProfile, validateDataPrivacyNavigationIndex } from "../validators/data-privacy-navigation-index.validator.js";
import { compilePhase7DapRegistryDerivationRules, PHASE7_REGISTRY_SOURCE_PATH } from "../../07-data-provenance-profile/dap-registry-derivation-rule-compiler.js";
import { buildPhase7StrategicDerivationMatrixArtifact } from "../../07-data-provenance-profile/dap-strategic-derivation-matrix.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = path.resolve(__dirname, "../../..");

export async function runDataPrivacyNavigationIndexRuntimeJob({ run, contract, readArtifacts, saveArtifact } = {}) {
  assertCallback(readArtifacts, "readArtifacts");
  assertCallback(saveArtifact, "saveArtifact");
  const artifacts = await readArtifacts({ reads: contract?.reads || [], agent_id: contract?.agent_id || contract?.actor_id || "agent_2_cartography_index" });
  const bootstrap = buildDataPrivacyNavigationIndexArtifacts({ run, artifacts });
  const saved = [];
  for (const artifactName of P2D_DATA_PRIVACY_SAVE_ORDER) {
    const artifact = bootstrap[artifactName];
    if (!artifact || typeof artifact !== "object" || Array.isArray(artifact)) throw new Error(`P2D_OUTPUT_MISSING:${artifactName}`);
    await saveArtifact({ artifact_name: artifactName, artifact, lock_status: resolveLockStatus(artifact) });
    saved.push(artifactName);
  }
  return Object.freeze({ ok: true, output: bootstrap, saved_artifacts: saved, required_save_order: [...P2D_DATA_PRIVACY_SAVE_ORDER], phase_lock_status: resolveAggregateLockStatus(bootstrap), model_usage: "NONE_DETERMINISTIC", p2d_data_privacy_navigation_index_runtime_job_used: true });
}

export function buildDataPrivacyNavigationIndexArtifacts({ run, artifacts = {} } = {}) {
  const registryText = fs.readFileSync(path.join(BACKEND_ROOT, PHASE7_REGISTRY_SOURCE_PATH), "utf8");
  const dapRegistryManifest = compilePhase7DapRegistryDerivationRules(registryText);
  const strategicMatrix = buildPhase7StrategicDerivationMatrixArtifact(dapRegistryManifest.material_rules);
  const deterministicMap = buildDataPrivacyDeterministicMap({ artifacts, runId: run?.run_id || run?.id || null });
  const deterministicValidation = validateDataPrivacyDeterministicMap(deterministicMap);
  if (deterministicValidation.status !== "PASS") throw new Error(`P2D_DETERMINISTIC_MAP_VALIDATION_FAILED:${JSON.stringify(deterministicValidation.errors)}`);
  const semanticProfile = buildDataPrivacySemanticProfile({ deterministicMap, strategicDerivationMatrix: strategicMatrix });
  const semanticValidation = validateDataPrivacySemanticProfile(semanticProfile);
  if (semanticValidation.status !== "PASS") throw new Error(`P2D_SEMANTIC_PROFILE_VALIDATION_FAILED:${JSON.stringify(semanticValidation.errors)}`);
  const finalIndex = compileDataPrivacyNavigationIndex({ deterministicMap, semanticProfile });
  const finalValidation = validateDataPrivacyNavigationIndex(finalIndex);
  if (finalValidation.status !== "PASS") throw new Error(`P2D_FINAL_INDEX_VALIDATION_FAILED:${JSON.stringify(finalValidation.errors)}`);
  return Object.freeze({
    ...deterministicMap,
    ...semanticProfile,
    ...finalIndex,
    dap_registry_manifest: dapRegistryManifest,
    dap_strategic_derivation_matrix: strategicMatrix
  });
}

function resolveLockStatus(artifact = {}) {
  if (artifact.lock_status === "LOCKED") return "LOCKED";
  if (artifact.validation_quality_control_result?.status === "PASS") return "LOCKED";
  return "LOCKED_WITH_LIMITATIONS";
}

function resolveAggregateLockStatus(output = {}) {
  const final = output[P2D_DATA_PRIVACY_ARTIFACTS.finalIndex];
  return resolveLockStatus(final);
}

function assertCallback(fn, label) {
  if (typeof fn !== "function") throw new Error(`P2D_RUNTIME_JOB_MISSING_CALLBACK:${label}`);
}
