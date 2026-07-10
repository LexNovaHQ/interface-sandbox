import { P2E_DOMAIN_CONTROL_OBLIGATION_SAVE_ORDER } from "../domain-control-obligation-navigation-index.contract.js";
import { buildDomainControlObligationNavigationArtifacts } from "../services/domain-control-obligation-navigation-index.builder.js";
import { validateDomainControlObligationDeterministicMap, validateDomainControlObligationSemanticProfile, validateDomainControlObligationNavigationIndex } from "../validators/domain-control-obligation-navigation-index.validator.js";

export async function runDomainControlObligationNavigationIndexOrchestrator({ run, artifacts = {}, saveArtifact, logger = null } = {}) {
  if (typeof saveArtifact !== "function") throw new Error("P2E_ORCHESTRATOR_MISSING_SAVE_ARTIFACT_CALLBACK");
  const output = buildDomainControlObligationNavigationArtifacts({ artifacts, runId: run?.run_id || run?.id || null });
  const deterministicValidation = validateDomainControlObligationDeterministicMap(output.domain_control_obligation_deterministic_map);
  if (!deterministicValidation.ok) throw new Error(`P2E_DETERMINISTIC_MAP_VALIDATION_FAILED:${JSON.stringify(deterministicValidation.errors)}`);
  const semanticValidation = validateDomainControlObligationSemanticProfile(output.domain_control_obligation_semantic_profile);
  if (!semanticValidation.ok) throw new Error(`P2E_SEMANTIC_PROFILE_VALIDATION_FAILED:${JSON.stringify(semanticValidation.errors)}`);
  const finalValidation = validateDomainControlObligationNavigationIndex(output.domain_control_obligation_navigation_index);
  if (!finalValidation.ok) throw new Error(`P2E_FINAL_INDEX_VALIDATION_FAILED:${JSON.stringify(finalValidation.errors)}`);
  const saved = [];
  for (const artifactName of P2E_DOMAIN_CONTROL_OBLIGATION_SAVE_ORDER) {
    await saveArtifact({ artifact_name: artifactName, artifact: output[artifactName], lock_status: output[artifactName]?.lock_status || "LOCKED" });
    saved.push(artifactName);
  }
  if (typeof logger === "function") logger(`P2E saved ${saved.join(" -> ")}`);
  return Object.freeze({ ok: true, output, saved_artifacts: saved, final_validation: finalValidation, phase_lock_status: "LOCKED", model_usage: "NONE_DETERMINISTIC", p2e_domain_control_obligation_navigation_index_runtime_job_used: true });
}
