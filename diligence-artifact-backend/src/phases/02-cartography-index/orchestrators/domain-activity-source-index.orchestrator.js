import { P2B_DOMAIN_ACTIVITY_ARTIFACTS, P2B_DOMAIN_ACTIVITY_SAVE_ORDER } from "../domain-activity-source-index.contract.js";
import { buildDomainActivityDeterministicMap } from "../services/domain-activity-deterministic-map.builder.js";
import { compileDomainActivitySourceIndex } from "../services/domain-activity-source-index.compiler.js";
import { validateDomainActivitySemanticProfile } from "../validators/domain-activity-semantic-profile.validator.js";
import { validateDomainActivitySourceIndex } from "../validators/domain-activity-source-index.validator.js";

export const P2B_DOMAIN_ACTIVITY_SOURCE_SAVE_ORDER = P2B_DOMAIN_ACTIVITY_SAVE_ORDER;

export async function runDomainActivitySourceIndexOrchestrator({ run = {}, artifacts = {}, runSemanticModel, saveArtifact = null, logger = null } = {}) {
  assertCallback(runSemanticModel, "runSemanticModel");
  const saved = [];
  const notes = [];
  const runId = run.run_id || inferRunId(artifacts) || "UNKNOWN_RUN";

  const deterministicWrapper = buildDomainActivityDeterministicMap({ run: { ...run, run_id: runId }, artifacts });
  await saveP2BArtifact({ saveArtifact, artifactName: P2B_DOMAIN_ACTIVITY_ARTIFACTS.deterministicMap, artifactWrapper: deterministicWrapper, saved, logger });

  const semanticRaw = await runSemanticModel({
    run: { ...run, run_id: runId },
    artifacts: { ...artifacts, [P2B_DOMAIN_ACTIVITY_ARTIFACTS.deterministicMap]: deterministicWrapper },
    expected_artifact_name: P2B_DOMAIN_ACTIVITY_ARTIFACTS.semanticProfile
  });
  const semanticWrapper = normalizeSemanticWrapper({ semanticRaw, runId, deterministicWrapper });
  const semanticValidation = validateDomainActivitySemanticProfile(semanticWrapper, deterministicWrapper);
  if (!semanticValidation.ok) notes.push("domain_activity_semantic_profile saved with repair-required validation state for backend-controlled repair.");
  await saveP2BArtifact({ saveArtifact, artifactName: P2B_DOMAIN_ACTIVITY_ARTIFACTS.semanticProfile, artifactWrapper: semanticWrapper, saved, logger });

  const finalWrapper = compileDomainActivitySourceIndex({ deterministicMap: deterministicWrapper, semanticProfile: semanticWrapper });
  const finalValidation = validateDomainActivitySourceIndex(finalWrapper);
  if (!finalValidation.ok) {
    const error = new Error("P2B final activity_profile_source_index failed validation.");
    error.phase = "P2B_DOMAIN_ACTIVITY_SOURCE_INDEX";
    error.artifact_name = P2B_DOMAIN_ACTIVITY_ARTIFACTS.finalIndex;
    error.validation = finalValidation;
    throw error;
  }
  await saveP2BArtifact({ saveArtifact, artifactName: P2B_DOMAIN_ACTIVITY_ARTIFACTS.finalIndex, artifactWrapper: finalWrapper, saved, logger });

  return {
    ok: true,
    run_id: runId,
    phase: "P2B_DOMAIN_ACTIVITY_SOURCE_INDEX",
    artifacts_saved_in_order: saved,
    required_save_order: [...P2B_DOMAIN_ACTIVITY_SOURCE_SAVE_ORDER],
    required_save_order_respected: requiredSaveOrderRespected(saved),
    semantic_validation: semanticValidation,
    final_validation: finalValidation,
    notes,
    final_output: finalWrapper
  };
}

function normalizeSemanticWrapper({ semanticRaw, runId, deterministicWrapper }) {
  const semantic = unwrapRoot(semanticRaw, P2B_DOMAIN_ACTIVITY_ARTIFACTS.semanticProfile);
  if (semantic && Object.keys(semantic).length) {
    if (semanticRaw?.[P2B_DOMAIN_ACTIVITY_ARTIFACTS.semanticProfile]) return semanticRaw;
    if (semanticRaw?.artifact?.[P2B_DOMAIN_ACTIVITY_ARTIFACTS.semanticProfile]) return semanticRaw.artifact;
    return { [P2B_DOMAIN_ACTIVITY_ARTIFACTS.semanticProfile]: semantic };
  }
  const map = unwrapRoot(deterministicWrapper, P2B_DOMAIN_ACTIVITY_ARTIFACTS.deterministicMap);
  const required = asArray(map.semantic_label_queue).filter((row) => row.semantic_label_required === true || ["P0", "P1"].includes(row.priority));
  return {
    [P2B_DOMAIN_ACTIVITY_ARTIFACTS.semanticProfile]: {
      run_id: runId,
      schema_version: "P2B_DOMAIN_ACTIVITY_SEMANTIC_PROFILE_EMPTY_REPAIR_REQUIRED_v1_PHASE1_V5_12_ROOT",
      semantic_navigation_index: [],
      semantic_integrity: {
        required_queue_count: required.length,
        labeled_queue_count: 0,
        coverage_ratio: required.length ? 0 : 1,
        ready_for_compiler: required.length === 0
      },
      lock_status: required.length ? "REPAIR_REQUIRED" : "LOCKED_WITH_LIMITATIONS"
    }
  };
}

async function saveP2BArtifact({ saveArtifact, artifactName, artifactWrapper, saved, logger }) {
  if (!saveArtifact) return;
  const artifact = unwrapRoot(artifactWrapper, artifactName);
  if (!artifact || typeof artifact !== "object" || Array.isArray(artifact)) throw new Error(`P2B_ARTIFACT_MISSING:${artifactName}`);
  await saveArtifact({ artifactName, artifact_name: artifactName, artifact: artifactWrapper, lock_status: artifact.lock_status || artifact.status || "LOCKED_WITH_LIMITATIONS" });
  saved.push(artifactName);
  log(logger, `P2B saved ${artifactName}`);
}

function requiredSaveOrderRespected(saved) { const required = P2B_DOMAIN_ACTIVITY_SOURCE_SAVE_ORDER; let cursor = 0; for (const item of saved) if (item === required[cursor]) cursor += 1; return cursor === required.length; }
function inferRunId(artifacts) { for (const value of Object.values(artifacts || {})) { const root = value && typeof value === "object" ? value : null; if (root?.run_id) return root.run_id; if (root?.artifact?.run_id) return root.artifact.run_id; } return ""; }
function assertCallback(fn, name) { if (typeof fn !== "function") throw new Error(`P2B_ORCHESTRATOR_MISSING_CALLBACK:${name}`); }
function unwrapRoot(value, root) { if (!value || typeof value !== "object") return {}; const artifact = value.artifact && typeof value.artifact === "object" ? value.artifact : value; return artifact[root] || artifact || {}; }
function asArray(value) { return Array.isArray(value) ? value : []; }
function log(logger, message) { if (logger && typeof logger.log === "function") logger.log(message); else if (typeof logger === "function") logger(message); }
