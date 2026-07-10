import { P2G_PHASE_ROUTING_SAVE_ORDER, P2G_PHASE_ROUTING_ARTIFACTS } from "../phase-routing.contract.js";
import { buildPhaseRoutingArtifacts } from "../services/phase-routing-manifest.builder.js";
import { validatePhaseRoutingManifest, validatePhaseRouteValidationManifest } from "../validators/phase-routing-manifest.validator.js";

export async function runPhaseRoutingManifestOrchestrator({ run, artifacts = {}, saveArtifact, logger = null } = {}) {
  if (typeof saveArtifact !== "function") throw new Error("P2G_ORCHESTRATOR_MISSING_SAVE_ARTIFACT_CALLBACK");
  const output = buildPhaseRoutingArtifacts({ artifacts, runId: run?.run_id || run?.id || null, validate: validatePhaseRoutingManifest });
  const manifestValidation = validatePhaseRoutingManifest(output[P2G_PHASE_ROUTING_ARTIFACTS.manifest]);
  if (!manifestValidation.ok) throw new Error(`P2G_PHASE_ROUTING_MANIFEST_VALIDATION_FAILED:${JSON.stringify(manifestValidation.errors)}`);
  const validationManifestValidation = validatePhaseRouteValidationManifest(output[P2G_PHASE_ROUTING_ARTIFACTS.validation]);
  if (!validationManifestValidation.ok) throw new Error(`P2G_PHASE_ROUTE_VALIDATION_MANIFEST_FAILED:${JSON.stringify(validationManifestValidation.errors)}`);
  const saved = [];
  for (const artifactName of P2G_PHASE_ROUTING_SAVE_ORDER) {
    await saveArtifact({ artifact_name: artifactName, artifact: output[artifactName], lock_status: output[artifactName]?.lock_status || "LOCKED" });
    saved.push(artifactName);
  }
  if (typeof logger === "function") logger(`P2G saved ${saved.join(" -> ")}`);
  return Object.freeze({ ok: true, output, saved_artifacts: saved, final_validation: manifestValidation, phase_lock_status: "LOCKED", model_usage: "NONE_DETERMINISTIC", p2g_phase_router_runtime_job_used: true });
}
