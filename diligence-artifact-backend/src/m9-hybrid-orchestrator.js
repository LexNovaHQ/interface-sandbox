import { buildM9DeterministicMap, M9_DETERMINISTIC_ARTIFACT_NAME } from "./m9-deterministic-map.js";
import { validateM9SemanticProfile } from "./m9-semantic-profile-validator.js";
import { compileM9HybridCartography } from "./m9-hybrid-compiler.js";

export const M9_SEMANTIC_ARTIFACT_NAME = "legal_cartography_semantic_profile";
export const M9_REINVESTIGATION_ARTIFACT_NAME = "legal_cartography_reinvestigation_workpad";
export const M9_FINAL_ARTIFACT_NAME = "legal_cartography_index";

export const M9_HYBRID_SAVE_ORDER = Object.freeze([
  M9_DETERMINISTIC_ARTIFACT_NAME,
  M9_SEMANTIC_ARTIFACT_NAME,
  M9_FINAL_ARTIFACT_NAME
]);

export async function runM9HybridOrchestrator({
  run = {},
  artifacts = {},
  runSemanticModel,
  runReinvestigationModel = null,
  saveArtifact = null,
  validateFinalIndex = null,
  logger = null
} = {}) {
  assertCallback(runSemanticModel, "runSemanticModel");

  const saved = [];
  const notes = [];
  const runId = run.run_id || inferRunId(artifacts) || "UNKNOWN_RUN";

  const deterministicWrapper = buildM9DeterministicMap({ run: { ...run, run_id: runId }, artifacts });
  await saveM9Artifact({ saveArtifact, artifactName: M9_DETERMINISTIC_ARTIFACT_NAME, artifactWrapper: deterministicWrapper, saved, logger });

  const semanticRaw = await runSemanticModel({
    run: { ...run, run_id: runId },
    artifacts: {
      ...artifacts,
      [M9_DETERMINISTIC_ARTIFACT_NAME]: deterministicWrapper
    },
    expected_artifact_name: M9_SEMANTIC_ARTIFACT_NAME
  });

  const semanticWrapper = normalizeSemanticWrapper({ semanticRaw, runId });
  const semanticValidation = validateM9SemanticProfile(semanticWrapper, deterministicWrapper);

  await saveM9Artifact({ saveArtifact, artifactName: M9_SEMANTIC_ARTIFACT_NAME, artifactWrapper: semanticWrapper, saved, logger });

  let reinvestigationWrapper = null;
  if (shouldRunReinvestigation(semanticValidation, semanticWrapper)) {
    reinvestigationWrapper = await buildOrRunReinvestigation({
      run: { ...run, run_id: runId },
      artifacts,
      deterministicWrapper,
      semanticWrapper,
      semanticValidation,
      runReinvestigationModel,
      logger
    });
    if (reinvestigationWrapper) {
      await saveM9Artifact({ saveArtifact, artifactName: M9_REINVESTIGATION_ARTIFACT_NAME, artifactWrapper: reinvestigationWrapper, saved, logger, optional: true });
      notes.push("M9 reinvestigation workpad saved for semantic repair/limitation rows.");
    }
  }

  const finalWrapper = compileM9HybridCartography({
    deterministicMap: deterministicWrapper,
    semanticProfile: semanticWrapper,
    reinvestigationWorkpad: reinvestigationWrapper
  });

  const finalValidation = validateFinalIndex ? validateFinalIndex(finalWrapper) : { ok: true, warnings: [], errors: [], status: finalWrapper[M9_FINAL_ARTIFACT_NAME]?.lock_status || "LOCKED_WITH_LIMITATIONS" };

  if (finalValidation?.ok === false) {
    const error = new Error("M9 hybrid final legal_cartography_index failed validation.");
    error.phase = "M9";
    error.artifact_name = M9_FINAL_ARTIFACT_NAME;
    error.validation = finalValidation;
    throw error;
  }

  await saveM9Artifact({ saveArtifact, artifactName: M9_FINAL_ARTIFACT_NAME, artifactWrapper: finalWrapper, saved, logger });

  return {
    ok: true,
    run_id: runId,
    agent_id: "agent_2b_m9",
    phase: "M9",
    artifacts_saved_in_order: saved,
    required_save_order: [...M9_HYBRID_SAVE_ORDER],
    required_save_order_respected: requiredSaveOrderRespected(saved),
    optional_artifacts_saved: saved.includes(M9_REINVESTIGATION_ARTIFACT_NAME) ? [M9_REINVESTIGATION_ARTIFACT_NAME] : [],
    semantic_validation: semanticValidation,
    final_validation: finalValidation,
    notes,
    final_output: finalWrapper
  };
}

function shouldRunReinvestigation(validation, semanticWrapper) {
  const semantic = unwrapRoot(semanticWrapper, M9_SEMANTIC_ARTIFACT_NAME);
  return Boolean(
    validation?.errors?.length ||
    validation?.warnings?.length ||
    asArray(semantic.semantic_repair_queue).length ||
    semantic.lock_status === "REPAIR_REQUIRED" ||
    semantic.status === "REPAIR_REQUIRED"
  );
}

async function buildOrRunReinvestigation({ run, artifacts, deterministicWrapper, semanticWrapper, semanticValidation, runReinvestigationModel, logger }) {
  if (runReinvestigationModel) {
    const raw = await runReinvestigationModel({
      run,
      artifacts: {
        ...artifacts,
        [M9_DETERMINISTIC_ARTIFACT_NAME]: deterministicWrapper,
        [M9_SEMANTIC_ARTIFACT_NAME]: semanticWrapper
      },
      semantic_validation: semanticValidation,
      expected_artifact_name: M9_REINVESTIGATION_ARTIFACT_NAME
    });
    const normalized = normalizeReinvestigationWrapper({ raw, runId: run.run_id, semanticValidation });
    log(logger, "M9 reinvestigation model returned workpad.");
    return normalized;
  }

  log(logger, "M9 reinvestigation model not supplied; creating deterministic limitation workpad.");
  return createDeterministicReinvestigationWorkpad({ runId: run.run_id, semanticWrapper, semanticValidation });
}

function createDeterministicReinvestigationWorkpad({ runId, semanticWrapper, semanticValidation }) {
  const semantic = unwrapRoot(semanticWrapper, M9_SEMANTIC_ARTIFACT_NAME);
  const repairRows = asArray(semantic.semantic_repair_queue);
  const validationRows = [
    ...asArray(semanticValidation?.errors).map((message) => ({ repair_type: "SEMANTIC_VALIDATION_ERROR", reason: message, blocking: false })),
    ...asArray(semanticValidation?.warnings).map((message) => ({ repair_type: "SEMANTIC_VALIDATION_WARNING", reason: message, blocking: false }))
  ];

  const reviewed = [...repairRows, ...validationRows].map((row, index) => ({
    repair_id: row.repair_id || `M9_REPAIR_${String(index + 1).padStart(3, "0")}`,
    repair_type: row.repair_type || "SEMANTIC_REPAIR",
    target_ref: row.target_ref || row.affected_ref || "",
    reason: row.reason || row.limitation || "Semantic row requires limitation carry-forward.",
    blocking: false,
    disposition: "UNRESOLVED_WITH_LIMITATION"
  }));

  return {
    [M9_REINVESTIGATION_ARTIFACT_NAME]: {
      run_id: runId,
      generated_by: "m9_hybrid_orchestrator_deterministic_repair_workpad",
      schema_version: "M9_REINVESTIGATION_WORKPAD_v1",
      repair_rows_reviewed: reviewed,
      repair_rows_resolved: [],
      repair_rows_unresolved_with_limitations: reviewed,
      compiler_notes: [
        "No reinvestigation model callback was supplied. Ordinary semantic repair rows are carried as limitations."
      ],
      downstream_rules: {
        m9_reinvestigation_only: true,
        no_new_url_discovery: true,
        use_only_loaded_legal_corpus: true,
        ordinary_repairs_are_non_blocking: true,
        limitations_must_carry_forward: true
      },
      status: reviewed.length ? "LOCKED_WITH_LIMITATIONS" : "LOCKED",
      lock_status: reviewed.length ? "LOCKED_WITH_LIMITATIONS" : "LOCKED"
    }
  };
}

function normalizeSemanticWrapper({ semanticRaw, runId }) {
  const semantic = unwrapRoot(semanticRaw, M9_SEMANTIC_ARTIFACT_NAME);
  if (!semantic || Object.keys(semantic).length === 0) return { [M9_SEMANTIC_ARTIFACT_NAME]: emptySemanticProfile({ runId, reason: "Semantic model returned empty or malformed output." }) };
  if (semanticRaw?.[M9_SEMANTIC_ARTIFACT_NAME]) return semanticRaw;
  if (semanticRaw?.artifact?.[M9_SEMANTIC_ARTIFACT_NAME]) return semanticRaw.artifact;
  return { [M9_SEMANTIC_ARTIFACT_NAME]: semantic };
}

function normalizeReinvestigationWrapper({ raw, runId, semanticValidation }) {
  const workpad = unwrapRoot(raw, M9_REINVESTIGATION_ARTIFACT_NAME);
  if (!workpad || Object.keys(workpad).length === 0) return createDeterministicReinvestigationWorkpad({ runId, semanticWrapper: { [M9_SEMANTIC_ARTIFACT_NAME]: emptySemanticProfile({ runId, reason: "Reinvestigation returned empty output." }) }, semanticValidation });
  if (raw?.[M9_REINVESTIGATION_ARTIFACT_NAME]) return raw;
  if (raw?.artifact?.[M9_REINVESTIGATION_ARTIFACT_NAME]) return raw.artifact;
  return { [M9_REINVESTIGATION_ARTIFACT_NAME]: workpad };
}

function emptySemanticProfile({ runId, reason }) {
  return {
    run_id: runId,
    generated_by: "m9_hybrid_orchestrator_empty_semantic_guard",
    schema_version: "M9_SEMANTIC_LEGAL_STACK_LABELS_v3",
    model_used: true,
    document_labels: [],
    unit_subcat_labels: [],
    control_family_labels: [],
    indemnity_labels: [],
    cross_reference_labels: [],
    missing_source_labels: [],
    semantic_repair_queue: [{ repair_id: "M9_SEMANTIC_EMPTY_OUTPUT", repair_type: "SEMANTIC_EMPTY_OUTPUT", target_ref: "legal_cartography_semantic_profile", reason, blocking: false, recommended_reinvestigation: "Re-run semantic labeling against deterministic legal stack index and loaded legal corpus." }],
    semantic_integrity_summary: {
      deterministic_documents_total: 0,
      semantic_documents_labeled: 0,
      deterministic_macro_units_total: 0,
      semantic_units_labeled: 0,
      deterministic_control_candidates_total: 0,
      semantic_control_candidates_labeled: 0,
      semantic_rows_total: 0,
      semantic_rows_attached_to_deterministic_ids: 0,
      semantic_rows_repaired_or_omitted: 1,
      coverage_ratio: 0,
      full_text_copied: false,
      new_sources_created: false,
      ready_for_compiler: false
    },
    downstream_rules: {
      m9_semantic_layer_only: true,
      legal_stack_labels_only: true,
      registry_aware_not_registry_evaluative: true,
      remediation_routes_forbidden: true,
      new_source_fetch_forbidden: true,
      full_legal_text_copy_forbidden: true,
      use_only_loaded_legal_corpus: true,
      deterministic_map_is_source_of_pointers: true,
      semantic_rows_must_attach_to_deterministic_ids: true,
      coverage_gate_required: true
    },
    status: "REPAIR_REQUIRED",
    lock_status: "REPAIR_REQUIRED"
  };
}

async function saveM9Artifact({ saveArtifact, artifactName, artifactWrapper, saved, logger, optional = false }) {
  if (!saveArtifact) {
    log(logger, `M9 artifact ${artifactName} produced but saveArtifact callback not supplied.`);
    if (!optional) saved.push(`${artifactName}:NOT_SAVED_NO_CALLBACK`);
    return;
  }
  await saveArtifact({ artifactName, artifact: artifactWrapper });
  saved.push(artifactName);
  log(logger, `M9 artifact saved: ${artifactName}`);
}

function requiredSaveOrderRespected(saved) {
  const mandatory = saved.filter((name) => M9_HYBRID_SAVE_ORDER.includes(name));
  return M9_HYBRID_SAVE_ORDER.every((name, index) => mandatory[index] === name);
}

function assertCallback(callback, name) {
  if (typeof callback !== "function") throw new TypeError(`M9 hybrid orchestrator requires ${name} callback.`);
}

function unwrapRoot(value, root) {
  if (!value || typeof value !== "object") return {};
  const artifact = value.artifact && typeof value.artifact === "object" ? value.artifact : value;
  return artifact[root] || artifact || {};
}

function inferRunId(artifacts) {
  for (const value of Object.values(artifacts || {})) {
    const unwrapped = value?.artifact && typeof value.artifact === "object" ? value.artifact : value;
    if (unwrapped?.run_id) return unwrapped.run_id;
    for (const nested of Object.values(unwrapped || {})) if (nested?.run_id) return nested.run_id;
  }
  return "";
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function log(logger, message) {
  if (typeof logger === "function") logger(message);
}
