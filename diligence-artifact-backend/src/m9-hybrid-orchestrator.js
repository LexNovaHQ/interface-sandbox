import { buildM9DeterministicMap, M9_DETERMINISTIC_ARTIFACT_NAME } from "./m9-deterministic-map.js";
import { validateM9SemanticProfile } from "./m9-semantic-profile-validator.js";
import { compileM9HybridCartography } from "./m9-hybrid-compiler-v2.js";

export const M9_SEMANTIC_ARTIFACT_NAME = "legal_cartography_semantic_profile";
export const M9_REINVESTIGATION_ARTIFACT_NAME = "legal_cartography_reinvestigation_workpad";
export const M9_FINAL_ARTIFACT_NAME = "legal_cartography_index";

export const M9_HYBRID_SAVE_ORDER = Object.freeze([
  M9_DETERMINISTIC_ARTIFACT_NAME,
  M9_SEMANTIC_ARTIFACT_NAME,
  M9_FINAL_ARTIFACT_NAME
]);

export async function runM9HybridOrchestrator({ run = {}, artifacts = {}, runSemanticModel, runReinvestigationModel = null, saveArtifact = null, validateFinalIndex = null, logger = null } = {}) {
  assertCallback(runSemanticModel, "runSemanticModel");
  const saved = [];
  const notes = [];
  const runId = run.run_id || inferRunId(artifacts) || "UNKNOWN_RUN";

  const deterministicWrapper = buildM9DeterministicMap({ run: { ...run, run_id: runId }, artifacts });
  await saveM9Artifact({ saveArtifact, artifactName: M9_DETERMINISTIC_ARTIFACT_NAME, artifactWrapper: deterministicWrapper, saved, logger });

  const semanticRaw = await runSemanticModel({
    run: { ...run, run_id: runId },
    artifacts: { ...artifacts, [M9_DETERMINISTIC_ARTIFACT_NAME]: deterministicWrapper },
    expected_artifact_name: M9_SEMANTIC_ARTIFACT_NAME
  });
  const semanticWrapper = normalizeSemanticWrapper({ semanticRaw, runId });
  const semanticValidation = validateM9SemanticProfile(semanticWrapper, deterministicWrapper);
  await saveM9Artifact({ saveArtifact, artifactName: M9_SEMANTIC_ARTIFACT_NAME, artifactWrapper: semanticWrapper, saved, logger });

  let reinvestigationWrapper = null;
  if (shouldRunReinvestigation(semanticValidation, semanticWrapper)) {
    reinvestigationWrapper = await buildOrRunReinvestigation({ run: { ...run, run_id: runId }, artifacts, deterministicWrapper, semanticWrapper, semanticValidation, runReinvestigationModel, logger });
    if (reinvestigationWrapper) {
      await saveM9Artifact({ saveArtifact, artifactName: M9_REINVESTIGATION_ARTIFACT_NAME, artifactWrapper: reinvestigationWrapper, saved, logger, optional: true });
      notes.push("M9 reinvestigation workpad saved for semantic validation rows.");
    }
  }

  const finalWrapper = compileM9HybridCartography({ deterministicMap: deterministicWrapper, semanticProfile: semanticWrapper, reinvestigationWorkpad: reinvestigationWrapper });
  const finalValidation = validateFinalIndex ? validateFinalIndex(finalWrapper) : { ok: true, warnings: [], errors: [], status: finalWrapper[M9_FINAL_ARTIFACT_NAME]?.lock_status || "LOCKED_WITH_LIMITATIONS" };
  if (finalValidation?.ok === false) {
    const error = new Error("M9 hybrid final legal_cartography_index failed validation.");
    error.phase = "M9";
    error.artifact_name = M9_FINAL_ARTIFACT_NAME;
    error.validation = finalValidation;
    throw error;
  }
  await saveM9Artifact({ saveArtifact, artifactName: M9_FINAL_ARTIFACT_NAME, artifactWrapper: finalWrapper, saved, logger });

  return { ok: true, run_id: runId, agent_id: "agent_2b_m9", phase: "M9", artifacts_saved_in_order: saved, required_save_order: [...M9_HYBRID_SAVE_ORDER], required_save_order_respected: requiredSaveOrderRespected(saved), optional_artifacts_saved: saved.includes(M9_REINVESTIGATION_ARTIFACT_NAME) ? [M9_REINVESTIGATION_ARTIFACT_NAME] : [], semantic_validation: semanticValidation, final_validation: finalValidation, notes, final_output: finalWrapper };
}

function shouldRunReinvestigation(validation, semanticWrapper) {
  const semantic = unwrapRoot(semanticWrapper, M9_SEMANTIC_ARTIFACT_NAME);
  return Boolean(validation?.errors?.length || validation?.warnings?.length || semantic.lock_status === "REPAIR_REQUIRED");
}

async function buildOrRunReinvestigation({ run, artifacts, deterministicWrapper, semanticWrapper, semanticValidation, runReinvestigationModel, logger }) {
  if (runReinvestigationModel) {
    const raw = await runReinvestigationModel({ run, artifacts: { ...artifacts, [M9_DETERMINISTIC_ARTIFACT_NAME]: deterministicWrapper, [M9_SEMANTIC_ARTIFACT_NAME]: semanticWrapper }, semantic_validation: semanticValidation, expected_artifact_name: M9_REINVESTIGATION_ARTIFACT_NAME });
    const normalized = normalizeReinvestigationWrapper({ raw, runId: run.run_id, semanticValidation });
    log(logger, "M9 reinvestigation model returned workpad.");
    return normalized;
  }
  log(logger, "M9 reinvestigation model not supplied; creating deterministic validation workpad.");
  return createDeterministicReinvestigationWorkpad({ runId: run.run_id, semanticValidation });
}

function createDeterministicReinvestigationWorkpad({ runId, semanticValidation }) {
  const validationRows = [...asArray(semanticValidation?.errors).map((message) => ({ repair_type: "SEMANTIC_VALIDATION_ERROR", reason: message, blocking: false })), ...asArray(semanticValidation?.warnings).map((message) => ({ repair_type: "SEMANTIC_VALIDATION_WARNING", reason: message, blocking: false }))];
  const reviewed = validationRows.map((row, index) => ({ repair_id: `M9_REPAIR_${String(index + 1).padStart(3, "0")}`, repair_type: row.repair_type, target_ref: "legal_cartography_semantic_profile", reason: row.reason, blocking: false, disposition: "UNRESOLVED_WITH_LIMITATION" }));
  return { [M9_REINVESTIGATION_ARTIFACT_NAME]: { run_id: runId, generated_by: "m9_hybrid_orchestrator_deterministic_repair_workpad", schema_version: "M9_REINVESTIGATION_WORKPAD_v1", repair_rows_reviewed: reviewed, repair_rows_resolved: [], repair_rows_unresolved_with_limitations: reviewed, compiler_notes: ["Semantic validation rows are carried as limitations."], downstream_rules: { m9_reinvestigation_only: true, no_new_url_discovery: true, use_only_loaded_legal_corpus: true, limitations_must_carry_forward: true }, status: reviewed.length ? "LOCKED_WITH_LIMITATIONS" : "LOCKED", lock_status: reviewed.length ? "LOCKED_WITH_LIMITATIONS" : "LOCKED" } };
}

function normalizeSemanticWrapper({ semanticRaw, runId }) {
  const semantic = unwrapRoot(semanticRaw, M9_SEMANTIC_ARTIFACT_NAME);
  if (!semantic || Object.keys(semantic).length === 0) return { [M9_SEMANTIC_ARTIFACT_NAME]: emptySemanticProfile({ runId }) };
  if (semanticRaw?.[M9_SEMANTIC_ARTIFACT_NAME]) return semanticRaw;
  if (semanticRaw?.artifact?.[M9_SEMANTIC_ARTIFACT_NAME]) return semanticRaw.artifact;
  return { [M9_SEMANTIC_ARTIFACT_NAME]: semantic };
}

function normalizeReinvestigationWrapper({ raw, runId, semanticValidation }) {
  const workpad = unwrapRoot(raw, M9_REINVESTIGATION_ARTIFACT_NAME);
  if (!workpad || Object.keys(workpad).length === 0) return createDeterministicReinvestigationWorkpad({ runId, semanticValidation });
  if (raw?.[M9_REINVESTIGATION_ARTIFACT_NAME]) return raw;
  if (raw?.artifact?.[M9_REINVESTIGATION_ARTIFACT_NAME]) return raw.artifact;
  return { [M9_REINVESTIGATION_ARTIFACT_NAME]: workpad };
}

function emptySemanticProfile({ runId }) {
  return { run_id: runId, schema_version: "M9_SEMANTIC_PROFILE_v1", semantic_navigation_index: [], semantic_coverage: { required_queue_count: 0, labeled_queue_count: 0, coverage_ratio: 1, status: "PASS" }, status: "LOCKED_WITH_LIMITATIONS", lock_status: "LOCKED_WITH_LIMITATIONS", limitations: ["Semantic model returned no rows; deterministic index locked with limitation."] };
}

async function saveM9Artifact({ saveArtifact, artifactName, artifactWrapper, saved, logger, optional = false }) {
  if (saveArtifact) await saveArtifact({ artifact_name: artifactName, artifact: artifactWrapper, optional });
  saved.push(artifactName);
  log(logger, `M9 saved ${artifactName}`);
}

function requiredSaveOrderRespected(saved) {
  const required = M9_HYBRID_SAVE_ORDER;
  let cursor = 0;
  for (const item of saved) if (item === required[cursor]) cursor += 1;
  return cursor === required.length;
}

function inferRunId(artifacts) {
  for (const value of Object.values(artifacts || {})) {
    const root = value && typeof value === "object" ? value : null;
    if (root?.run_id) return root.run_id;
    if (root?.artifact?.run_id) return root.artifact.run_id;
  }
  return "";
}
function assertCallback(fn, name) { if (typeof fn !== "function") throw new Error(`M9_ORCHESTRATOR_MISSING_CALLBACK:${name}`); }
function unwrapRoot(value, root) { if (!value || typeof value !== "object") return {}; const artifact = value.artifact && typeof value.artifact === "object" ? value.artifact : value; return artifact[root] || artifact || {}; }
function asArray(value) { return Array.isArray(value) ? value : []; }
function log(logger, message) { if (logger && typeof logger.log === "function") logger.log(message); }
