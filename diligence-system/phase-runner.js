import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import {
  REQUIRED_KEYS_BY_PHASE,
  parseJsonObject,
  normalizeP1PhasePackages,
  validateMechanicalPhaseOutput,
  validatePromptStackReadiness
} from "./mechanical-output-validator.js";
import { runSourceAdapter } from "./source-adapter.js";
import { loadReferenceBundle, formatReferencesForPrompt, validatePhaseReferences } from "./reference-loader.js";
import { renderDiligenceReport } from "./renderer.js";
import { extractAndStripScratchpadSidecar } from "./scratchpad-manager.js";
const __filename = fileURLToPath(import.meta.url);
const BASE_DIR = path.dirname(__filename);

export const CORE_PROMPT_FILES = [
  "00_RUNTIME_SPINE.md",
  "00_RUNTIME_SPINE_INDEX.md",
  "00_SOURCE_EXTRACTION_CONTRACT.md",
  "08_PHASE_STACK_EXECUTION_MAP.md",
  "09_OUTPUT_HANDOFF_CONTRACT.md",
  "10_RUNTIME_AUDIT_CHECKLIST.md"
];

const EXECUTION_MAP_FILE = "08_PHASE_STACK_EXECUTION_MAP.md";
const JSON_REPAIR_SYSTEM_PROMPT = "You are a mechanical JSON repair function. You receive malformed JSON-like text emitted by a prior model. Return only valid JSON. Do not add, remove, summarize, infer, or reinterpret content. Do not include markdown. Preserve keys and values as closely as possible. If content is impossible to repair, return {\"repair_failed\":true,\"repair_error\":\"UNREPAIRABLE_JSON\"}.";
const P6_MODEL_BATCH_SIZE = 15;
const DEFAULT_GEMINI_TIMEOUT_MS =600000;
const DEFAULT_GEMINI_MAX_OUTPUT_TOKENS = 165535;
const EXPRESS_JSON_LIMIT = "50mb";
const SOURCE_MAX_CANDIDATES_DEFAULT = 100;
const SOURCE_FETCH_TIMEOUT_MS_DEFAULT = 120000;
const SOURCE_MAX_EXTRACTION_PASSES = 2;
const P6_HUNTER_RULES_FILE = "AI_THREAT_REGISTRY_HUNTER_ENGINE_RULES.csv";
const ACTIVE_RUNTIME = "phase_stack_prompt_supremacy";
const RUN_UNTIL_VALUES = new Set(["S0", "P1", "P2", "P3", "P4", "P5", "P6_ROUTE_PLAN", "P6_BATCH", "P6_ALL_BATCHES", "P7", "RENDERER"]);

export async function loadPromptStack(baseDir = BASE_DIR) {
  const missingFiles = [];
  const core = {};

  for (const file of CORE_PROMPT_FILES) core[file] = await readFileSafe(baseDir, file, missingFiles);

  const executionNodes = extractExecutionNodes(core[EXECUTION_MAP_FILE]);
  const phaseNodes = executionNodes.filter((node) => node.type === "model_phase");
  const phases = [];

  for (const node of phaseNodes) {
    const prompt = await readFileSafe(baseDir, node.file, missingFiles);
    phases.push({ ...node, prompt, required_top_level_keys: getRequiredKeysForPhase(node.node_id) });
  }

  const readiness = validatePromptStackReadiness({ missingFiles });
  return {
    ok: readiness.ok && phaseNodes.length > 0,
    errors: [...readiness.errors, ...(phaseNodes.length ? [] : ["EXECUTION_MAP_MODEL_PHASES_MISSING"])],
    core,
    execution_nodes: executionNodes,
    phases,
    manifest: [
      ...CORE_PROMPT_FILES.map((file) => ({ kind: "core", file, present: Boolean(core[file]) })),
      ...executionNodes.map((node) => ({
        kind: node.type,
        node_id: node.node_id,
        order: node.order,
        file: node.file,
        pool: node.pool,
        present: node.type === "model_phase"
          ? Boolean(phases.find((phase) => phase.node_id === node.node_id)?.prompt)
          : Boolean(core[node.file] || node.file === "deterministic_renderer")
      })),
      ...phases.map((phase) => ({ kind: "phase_prompt", node_id: phase.node_id, file: phase.file, required_top_level_keys: phase.required_top_level_keys }))
    ]
  };
}

export async function runPhaseStack({ input = {}, callModel, baseDir = BASE_DIR } = {}) {
  if (typeof callModel !== "function") throw new Error("CALL_MODEL_FUNCTION_REQUIRED");

  const run = normalizeInput(input);
  const runUntil = normalizeRunUntil(run.run_until);
  const debugTrace = Boolean(run.debug_trace || runUntil);
  const runtimeTrace = createRuntimeTrace({ run, activeRuntime: ACTIVE_RUNTIME, enabled: debugTrace });
  const promptStack = await loadPromptStack(baseDir);
  if (runtimeTrace) addPromptArtifacts(runtimeTrace, promptStack);
  if (!promptStack.ok) return fail({ run, promptStack, runtimeTrace, status: "PROMPT_STACK_NOT_READY", failedNode: "PROMPT_STACK", error: promptStack.errors.join(";") });

  let stage0;
  const s0Stage = startStage(runtimeTrace, "S0", { source_mode: run.source_mode, target_url_present: Boolean(run.target_url), pasted_public_material_present: Boolean(run.pasted_public_material) });
  try {
    stage0 = await runSourceAdapter({ input: run, baseDir, callModel });
    updateRuntimeTraceSourceLimits(runtimeTrace, stage0);
    finishStage(runtimeTrace, s0Stage, { output: stage0, validation: { ok: true, errors: [], warnings: [] }, counts: getS0Counts(stage0), summary: "Source adapter completed" });
  } catch (err) {
    failStage(runtimeTrace, s0Stage, err, "Source adapter failed");
    return fail({ run, promptStack, runtimeTrace, status: "S0_SOURCE_ADAPTER_FAILED", failedNode: "S0", error: err?.message || String(err) });
  }

  const upstream = { S0: stage0 };
  const phaseOutputs = {};
  const referenceBundles = {};
  const mechanicalValidations = { S0: { ok: true, phase_id: "S0", errors: [], mechanical_only: true } };
  const completedNodes = ["S0"];
  const modelMetaByPhase = {};
  const parseRepairTraces = {};
  let lastModelMeta = null;

  if (shouldStopAt(runUntil, "S0")) {
    return stoppedResponse({ run, promptStack, runtimeTrace, upstream, phaseOutputs, referenceBundles, mechanicalValidations, completedNodes, modelMetaByPhase, status: "STOPPED_AFTER_S0", nextNode: "P1" });
  }

  const s0Gate = validateTransitionGate({ edge: "S0_to_P1", upstream, referenceBundles });
  mechanicalValidations.GATE_S0_to_P1 = s0Gate;
  traceGate(runtimeTrace, "S0_to_P1", s0Gate);
  if (!s0Gate.ok) {
    return fail({ run, promptStack, runtimeTrace, upstream, phaseOutputs, referenceBundles, mechanicalValidations, completedNodes, modelMetaByPhase, status: "S0_TO_P1_TRANSITION_GATE_FAILED", failedNode: "P1", error: s0Gate.errors.join(";"), lastModelMeta });
  }

  for (const phase of promptStack.phases) {
    const stage = startStage(runtimeTrace, phase.node_id, { upstream, prompt_file: phase.file, required_top_level_keys: phase.required_top_level_keys || [] });
    const referenceBundle = await loadReferenceBundle({ phaseId: phase.node_id, baseDir });
    referenceBundles[phase.node_id] = referenceBundle;
    const referenceValidation = validatePhaseReferences({ phaseId: phase.node_id, bundle: referenceBundle });
    mechanicalValidations[`REF_${phase.node_id}`] = referenceValidation;
    traceGate(runtimeTrace, `REF_${phase.node_id}`, referenceValidation);
    if (!referenceValidation.ok) {
      failStage(runtimeTrace, stage, referenceValidation.errors, "Reference validation failed");
      return fail({ run, promptStack, runtimeTrace, upstream, phaseOutputs, referenceBundles, mechanicalValidations, completedNodes, modelMetaByPhase, status: `${phase.node_id}_REFERENCE_VALIDATION_FAILED`, failedNode: phase.node_id, error: referenceValidation.errors.join(";"), lastModelMeta });
    }

    const inboundGateName = inboundTransitionForPhase(phase.node_id);
    if (inboundGateName && inboundGateName !== "S0_to_P1") {
      const gate = validateTransitionGate({ edge: inboundGateName, upstream, referenceBundles });
      mechanicalValidations[`GATE_${inboundGateName}`] = gate;
      traceGate(runtimeTrace, inboundGateName, gate);
      if (!gate.ok) {
        failStage(runtimeTrace, stage, gate.errors, "Transition gate failed");
        return fail({ run, promptStack, runtimeTrace, upstream, phaseOutputs, referenceBundles, mechanicalValidations, completedNodes, modelMetaByPhase, status: `${inboundGateName.toUpperCase()}_TRANSITION_GATE_FAILED`, failedNode: phase.node_id, error: gate.errors.join(";"), lastModelMeta });
      }
    }

    if (phase.node_id === "P6") {
      const p6BatchResult = await runP6Batched({ run, promptStack, phase, upstream, referenceBundle, baseDir, callModel, modelMetaByPhase, parseRepairTraces, runtimeTrace, runUntil });
      lastModelMeta = p6BatchResult.lastModelMeta || lastModelMeta;
      if (p6BatchResult.coverageValidation) mechanicalValidations.P6_BATCH_COVERAGE = p6BatchResult.coverageValidation;
      if (p6BatchResult.selectedBatchValidation) mechanicalValidations[p6BatchResult.completedNode || p6BatchResult.failedNode || phase.node_id] = p6BatchResult.selectedBatchValidation;
      if (p6BatchResult.selectedBatchFailure) {
        failStage(runtimeTrace, stage, p6BatchResult.error || p6BatchResult.status, "P6 selected batch validation failed");
        const response = {
          ok: false,
          mode: ACTIVE_RUNTIME,
          status: "P6_SELECTED_BATCH_VALIDATION_FAILED",
          run_id: run.run_id,
          target_url: run.target_url,
          company_name: run.company_name,
          source_mode: run.source_mode,
          completed_nodes: completedNodes,
          prompt_stack: promptStack?.manifest || [],
          reference_bundles: summarizeReferenceBundles(referenceBundles),
          mechanical_validations: mechanicalValidations,
          phase_outputs: phaseOutputs,
          hybrid_extraction_manifest: upstream?.S0 ? compactStage0ForPrompt(upstream.S0, { includeCleanText: false }) : null,
          runtime_orchestration_manifest: buildOrchestrationManifest({ run, promptStack, completedNodes, failedNode: p6BatchResult.failedNode, referenceBundles, modelMetaByPhase }),
          phase_stack: { completed_nodes: completedNodes, failed_node: p6BatchResult.failedNode, next_node: `${p6BatchResult.failedNode}_RETRY_OR_PROMPT_REPAIR` },
          failed_node: p6BatchResult.failedNode,
          expected_registry_row_ids: p6BatchResult.expectedRegistryRowIds || [],
          returned_registry_row_ids: p6BatchResult.returnedRegistryRowIds || [],
          missing_registry_row_ids: p6BatchResult.missingRegistryRowIds || [],
          unexpected_registry_row_ids: p6BatchResult.unexpectedRegistryRowIds || [],
          error: p6BatchResult.error,
          model_meta_last: lastModelMeta,
          model_meta_by_phase: modelMetaByPhase,
          ...(hasEntries(parseRepairTraces) ? { parse_repair_trace: parseRepairTraces } : {}),
          ...flatten(phaseOutputs)
        };
        return withObservability(response, { runtimeTrace, upstream, phaseOutputs, mechanicalValidations, modelMetaByPhase, debugTrace: true });
      }
      if (p6BatchResult.stopped) {
        finishStage(runtimeTrace, stage, { output: p6BatchResult.tracePayload || p6BatchResult.parsed || {}, validation: p6BatchResult.selectedBatchValidation || p6BatchResult.coverageValidation || { ok: true, errors: [], warnings: p6BatchResult.warnings || [] }, modelMeta: lastModelMeta, summary: p6BatchResult.status });
        return stoppedResponse({ run, promptStack, runtimeTrace, upstream, phaseOutputs, referenceBundles, mechanicalValidations, completedNodes: [...completedNodes, p6BatchResult.completedNode], modelMetaByPhase, parseRepairTraces, status: p6BatchResult.status, nextNode: p6BatchResult.nextNode });
      }
      if (!p6BatchResult.ok) {
        mechanicalValidations[phase.node_id] = p6BatchResult.validation || { ok: false, phase_id: phase.node_id, errors: [p6BatchResult.error || "P6_BATCHING_FAILED"], mechanical_only: true };
        failStage(runtimeTrace, stage, p6BatchResult.error || "P6_BATCHING_FAILED", "P6 batching failed");
        return fail({ run, promptStack, runtimeTrace, upstream, phaseOutputs, referenceBundles, mechanicalValidations, completedNodes, modelMetaByPhase, parseRepairTraces, status: p6BatchResult.status || "P6_BATCHING_FAILED", failedNode: phase.node_id, error: p6BatchResult.error || "P6_BATCHING_FAILED", lastModelMeta });
      }

      const phaseParsed = p6BatchResult.parsed;
      const validation = validateMechanicalPhaseOutput({
        phaseId: phase.node_id,
        rawText: JSON.stringify(phaseParsed),
        parsed: phaseParsed,
        requiredTopLevelKeys: getRequiredKeysForPhase(phase.node_id),
        context: { s0_candidate_count: upstream.S0?.hybrid_extraction_manifest?.candidate_sources?.length }
      });
      validation.warnings = [...(validation.warnings || []), ...(p6BatchResult.warnings || [])];
      mechanicalValidations[phase.node_id] = validation;
      traceGate(runtimeTrace, "P6_BATCH_COVERAGE", p6BatchResult.coverageValidation);
      if (!validation.ok) {
        failStage(runtimeTrace, stage, validation.errors, "Mechanical validation failed");
        return fail({ run, promptStack, runtimeTrace, upstream, phaseOutputs, referenceBundles, mechanicalValidations, completedNodes, modelMetaByPhase, parseRepairTraces, status: `${phase.node_id}_MECHANICAL_VALIDATION_FAILED`, failedNode: phase.node_id, error: validation.errors.join(";"), lastModelMeta });
      }

      phaseOutputs[phase.node_id] = phaseParsed;
      upstream[phase.node_id] = phaseParsed;
      completedNodes.push(phase.node_id);
      finishStage(runtimeTrace, stage, { output: phaseParsed, validation, modelMeta: lastModelMeta, summary: "P6 all batches completed" });
      if (shouldStopAt(runUntil, "P6_ALL_BATCHES")) {
        return stoppedResponse({ run, promptStack, runtimeTrace, upstream, phaseOutputs, referenceBundles, mechanicalValidations, completedNodes: [...completedNodes, "P6_ALL_BATCHES"], modelMetaByPhase, parseRepairTraces, status: "STOPPED_AFTER_P6_ALL_BATCHES", nextNode: "P7" });
      }
      continue;
    }

    const payload = buildPayload({ run, promptStack, phase, upstream, referenceBundle });
    let modelResult;
    try {
      modelResult = await callModel({ phaseId: phase.node_id, poolName: phase.pool, systemPrompt: payload.systemPrompt, userPrompt: payload.userPrompt, responseMimeType: "application/json", temperature: 0, allowGrounding: false });
    } catch (err) {
      failStage(runtimeTrace, stage, err, "Model call failed");
      return fail({ run, promptStack, runtimeTrace, upstream, phaseOutputs, referenceBundles, mechanicalValidations, completedNodes, modelMetaByPhase, status: `${phase.node_id}_MODEL_CALL_FAILED`, failedNode: phase.node_id, error: err?.message || String(err), lastModelMeta });
    }

    lastModelMeta = compactModelMeta(modelResult?.meta || modelResult || null, phase);
    modelMetaByPhase[phase.node_id] = lastModelMeta;
    traceModel(runtimeTrace, phase.node_id, lastModelMeta);
    const rawText = String(modelResult?.text || "");
    let parsed = parseJsonObject(rawText);
    let jsonRepairWarning = null;
    if (!parsed.ok) {
      const originalParseError = parsed.error;
      const repairPhaseId = `${phase.node_id}_JSON_REPAIR`;
      const repairTrace = { phase_id: phase.node_id, original_parse_error: originalParseError, repair_attempted: true, repair_succeeded: false, repair_model_meta: null };
      let repairResult;
      try {
        repairResult = await callModel({ phaseId: repairPhaseId, poolName: "repair", systemPrompt: JSON_REPAIR_SYSTEM_PROMPT, userPrompt: buildJsonRepairUserPrompt({ phase, originalParseError, rawText }), responseMimeType: "application/json", temperature: 0, allowGrounding: false });
      } catch (err) {
        repairTrace.repair_error = err?.message || String(err);
        parseRepairTraces[phase.node_id] = repairTrace;
        mechanicalValidations[phase.node_id] = { ok: false, phase_id: phase.node_id, errors: [originalParseError], mechanical_only: true };
        failStage(runtimeTrace, stage, originalParseError, "JSON parse failed");
        return fail({ run, promptStack, runtimeTrace, upstream, phaseOutputs, referenceBundles, mechanicalValidations, completedNodes, modelMetaByPhase, parseRepairTraces, status: `${phase.node_id}_JSON_PARSE_FAILED`, failedNode: phase.node_id, error: originalParseError, lastModelMeta });
      }

      const repairModelMeta = compactModelMeta(repairResult?.meta || repairResult || null, { node_id: repairPhaseId, pool: "repair" });
      modelMetaByPhase[repairPhaseId] = repairModelMeta;
      repairTrace.repair_model_meta = repairModelMeta;
      const repairParsed = parseJsonObject(String(repairResult?.text || ""));
      const repairFailed = repairParsed.ok && repairParsed.parsed?.repair_failed === true;
      if (!repairParsed.ok || repairFailed) {
        repairTrace.repair_error = repairFailed ? (repairParsed.parsed?.repair_error || "UNREPAIRABLE_JSON") : repairParsed.error;
        parseRepairTraces[phase.node_id] = repairTrace;
        mechanicalValidations[phase.node_id] = { ok: false, phase_id: phase.node_id, errors: [originalParseError], mechanical_only: true };
        failStage(runtimeTrace, stage, originalParseError, "JSON repair failed");
        return fail({ run, promptStack, runtimeTrace, upstream, phaseOutputs, referenceBundles, mechanicalValidations, completedNodes, modelMetaByPhase, parseRepairTraces, status: `${phase.node_id}_JSON_PARSE_FAILED`, failedNode: phase.node_id, error: originalParseError, lastModelMeta });
      }

      repairTrace.repair_succeeded = true;
      parseRepairTraces[phase.node_id] = repairTrace;
      parsed = repairParsed;
      jsonRepairWarning = `${phase.node_id}_JSON_REPAIRED_AFTER_PARSE_FAILURE`;
    }

    const sidecar = extractAndStripScratchpadSidecar({
      nodeId: phase.node_id,
      parsed: parsed.parsed
    });
    const phaseParsed = phase.node_id === "P1" ? normalizeP1PhasePackages(sidecar.canonical_output) : sidecar.canonical_output;
    const validation = validateMechanicalPhaseOutput({ phaseId: phase.node_id, rawText, parsed: phaseParsed, requiredTopLevelKeys: getRequiredKeysForPhase(phase.node_id), context: { s0_candidate_count: upstream.S0?.hybrid_extraction_manifest?.candidate_sources?.length } });
    if (jsonRepairWarning) validation.warnings = [...(validation.warnings || []), jsonRepairWarning];
    mechanicalValidations[phase.node_id] = validation;
    if (!validation.ok) {
      failStage(runtimeTrace, stage, validation.errors, "Mechanical validation failed");
      return fail({ run, promptStack, runtimeTrace, upstream, phaseOutputs, referenceBundles, mechanicalValidations, completedNodes, modelMetaByPhase, parseRepairTraces, status: `${phase.node_id}_MECHANICAL_VALIDATION_FAILED`, failedNode: phase.node_id, error: validation.errors.join(";"), lastModelMeta });
    }

    phaseOutputs[phase.node_id] = phaseParsed;
    upstream[phase.node_id] = phaseParsed;
    completedNodes.push(phase.node_id);
    finishStage(runtimeTrace, stage, { output: phaseParsed, validation, modelMeta: lastModelMeta, summary: `${phase.node_id} completed` });
    if (shouldStopAt(runUntil, phase.node_id)) {
      return stoppedResponse({ run, promptStack, runtimeTrace, upstream, phaseOutputs, referenceBundles, mechanicalValidations, completedNodes, modelMetaByPhase, parseRepairTraces, status: `STOPPED_AFTER_${phase.node_id}`, nextNode: nextNodeAfter(phase.node_id) });
    }
  }

  const rendererGate = validateTransitionGate({ edge: "P7_to_RENDERER", upstream, referenceBundles });
  mechanicalValidations.GATE_P7_to_RENDERER = rendererGate;
  traceGate(runtimeTrace, "P7_to_RENDERER", rendererGate);
  if (!rendererGate.ok) {
    return fail({ run, promptStack, runtimeTrace, upstream, phaseOutputs, referenceBundles, mechanicalValidations, completedNodes, modelMetaByPhase, status: "P7_TO_RENDERER_TRANSITION_GATE_FAILED", failedNode: "RENDERER", error: rendererGate.errors.join(";"), lastModelMeta });
  }

  const rendererStage = startStage(runtimeTrace, "RENDERER", {
  final_output_handoff_present: Boolean(upstream.P7?.final_output_handoff),
  screen_report_payload_present: Boolean(upstream.P7?.final_output_handoff?.screen_report_payload),
  renderer_contract_present: Boolean(upstream.P7?.final_output_handoff?.screen_report_payload?.renderer_contract)
});

let rendererResult;

try {
  rendererResult = renderDiligenceReport({
    run,
    phaseOutputs,
    upstream,
    mechanicalValidations,
    runtimeTrace
  });
} catch (err) {
  failStage(runtimeTrace, rendererStage, err, "Renderer failed");
  return fail({
    run,
    promptStack,
    runtimeTrace,
    upstream,
    phaseOutputs,
    referenceBundles,
    mechanicalValidations,
    completedNodes,
    modelMetaByPhase,
    parseRepairTraces,
    status: "RENDERER_FAILED",
    failedNode: "RENDERER",
    error: err?.message || String(err),
    lastModelMeta
  });
}

const rendererValidation = {
  ok: rendererResult?.renderer_output?.render_status !== "FAILURE_RENDERED",
  phase_id: "RENDERER",
  errors: rendererResult?.renderer_output?.render_status === "FAILURE_RENDERED"
    ? [rendererResult?.renderer_trace?.errors?.join(";") || "RENDERER_FAILURE_RENDERED"]
    : [],
  warnings: rendererResult?.renderer_trace?.warnings || [],
  mechanical_only: true
};

mechanicalValidations.RENDERER = rendererValidation;

if (!rendererValidation.ok) {
  failStage(runtimeTrace, rendererStage, rendererValidation.errors, "Renderer validation failed");
  return fail({
    run,
    promptStack,
    runtimeTrace,
    upstream,
    phaseOutputs,
    referenceBundles,
    mechanicalValidations,
    completedNodes,
    modelMetaByPhase,
    parseRepairTraces,
    status: "RENDERER_VALIDATION_FAILED",
    failedNode: "RENDERER",
    error: rendererValidation.errors.join(";"),
    lastModelMeta
  });
}

finishStage(runtimeTrace, rendererStage, {
  output: rendererResult,
  validation: rendererValidation,
  summary: "Renderer completed"
});

const renderCompletedNodes = [...completedNodes, "RENDERER"];
const rendererStatus = rendererResult?.renderer_output?.render_status || "RENDERED";

const response = {
  ok: true,
  mode: ACTIVE_RUNTIME,
  status: shouldStopAt(runUntil, "RENDERER")
    ? "STOPPED_AFTER_RENDERER"
    : rendererStatus === "RENDERED_WITH_WARNINGS"
      ? "PHASE_STACK_RENDERED_WITH_WARNINGS"
      : "PHASE_STACK_RENDERED",
  run_id: run.run_id,
  target_url: run.target_url,
  company_name: run.company_name,
  source_mode: run.source_mode,
  completed_nodes: renderCompletedNodes,
  prompt_stack: promptStack.manifest,
  reference_bundles: summarizeReferenceBundles(referenceBundles),
  mechanical_validations: mechanicalValidations,
  phase_outputs: phaseOutputs,
  hybrid_extraction_manifest: stage0.hybrid_extraction_manifest,
  extraction_forensic_ledger: stage0.extraction_forensic_ledger,
  runtime_orchestration_manifest: buildOrchestrationManifest({
    run,
    promptStack,
    completedNodes: renderCompletedNodes,
    failedNode: null,
    referenceBundles,
    modelMetaByPhase
  }),
  operational_limits: runtimeTrace?.operational_limits || buildOperationalLimits(),
  source_runtime_trace: runtimeTrace?.source_runtime_trace || null,
  phase_stack: {
    completed_nodes: renderCompletedNodes,
    failed_node: null,
    next_node: "COMPLETE"
  },
  renderer_output: rendererResult.renderer_output,
  renderer_trace: rendererResult.renderer_trace,
  rendered_report: rendererResult.rendered_report,
  html_report: rendererResult.renderer_output?.html_report || rendererResult.rendered_report?.html || null,
  report_json: rendererResult.renderer_output?.report_json || rendererResult.rendered_report?.report_json || null,
  model_meta_last: lastModelMeta,
  model_meta_by_phase: modelMetaByPhase,
  ...(hasEntries(parseRepairTraces) ? { parse_repair_trace: parseRepairTraces } : {}),
  ...flatten(phaseOutputs)
};

return withObservability(response, {
  runtimeTrace,
  upstream,
  phaseOutputs,
  mechanicalValidations,
  modelMetaByPhase,
  debugTrace
});
}

export async function runSingleNode({
  run: input = {},
  nodeId,
  artifacts = {},
  callModel,
  baseDir = BASE_DIR,
  scratchpadContext = null
} = {}) {
  const run = normalizeInput(input);

  if (!nodeId) {
    return singleNodeFailure({
      nodeId: "UNKNOWN",
      status: "RUN_SINGLE_NODE_NODE_ID_MISSING",
      error: "RUN_SINGLE_NODE_NODE_ID_MISSING"
    });
  }

  if (nodeId === "S0") {
    return runSingleS0Node({ run, baseDir, callModel });
  }

  if (nodeId === "RENDERER") {
    return runSingleRendererNode({ run, artifacts, baseDir });
  }

  if (!["P1", "P2", "P3", "P4", "P5", "P6", "P7"].includes(nodeId)) {
    return singleNodeFailure({
      nodeId,
      status: "RUN_SINGLE_NODE_NOT_IMPLEMENTED",
      error: `RUN_SINGLE_NODE_NOT_IMPLEMENTED:${nodeId}`
    });
  }

  if (typeof callModel !== "function") {
    return singleNodeFailure({
      nodeId,
      status: `${nodeId}_CALL_MODEL_FUNCTION_REQUIRED`,
      error: "CALL_MODEL_FUNCTION_REQUIRED"
    });
  }

  const promptStack = await loadPromptStack(baseDir);
  if (!promptStack.ok) {
    return singleNodeFailure({
      nodeId,
      status: "PROMPT_STACK_NOT_READY",
      error: promptStack.errors.join(";"),
      prompt_stack: promptStack.manifest || []
    });
  }

  const phase = promptStack.phases.find((item) => item.node_id === nodeId);
  if (!phase) {
    return singleNodeFailure({
      nodeId,
      status: `${nodeId}_PHASE_PROMPT_NOT_FOUND`,
      error: `${nodeId}_PHASE_PROMPT_NOT_FOUND`,
      prompt_stack: promptStack.manifest || []
    });
  }

  const upstream = buildSingleNodeUpstreamFromArtifacts({ nodeId, artifacts });
  const referenceBundles = {};
  const mechanicalValidations = collectMechanicalValidationsFromArtifacts(artifacts);
  const modelMetaByPhase = {};
  const parseRepairTraces = {};

  const referenceBundle = await loadReferenceBundle({
    phaseId: nodeId,
    baseDir
  });

  referenceBundles[nodeId] = referenceBundle;

  const referenceValidation = validatePhaseReferences({
    phaseId: nodeId,
    bundle: referenceBundle
  });

  mechanicalValidations[`REF_${nodeId}`] = referenceValidation;

  if (!referenceValidation.ok) {
    return singleNodeFailure({
      nodeId,
      status: `${nodeId}_REFERENCE_VALIDATION_FAILED`,
      error: referenceValidation.errors.join(";"),
      mechanical_validation: referenceValidation,
      reference_bundle: summarizeReferenceBundles(referenceBundles)
    });
  }

  const inboundGateName = inboundTransitionForPhase(nodeId);
  if (inboundGateName) {
    const gate = validateTransitionGate({
      edge: inboundGateName,
      upstream,
      referenceBundles
    });

    mechanicalValidations[`GATE_${inboundGateName}`] = gate;

    if (!gate.ok) {
      return singleNodeFailure({
        nodeId,
        status: `${inboundGateName.toUpperCase()}_TRANSITION_GATE_FAILED`,
        error: gate.errors.join(";"),
        mechanical_validation: gate,
        upstream_keys: Object.keys(upstream),
        reference_bundle: summarizeReferenceBundles(referenceBundles)
      });
    }
  }

  if (nodeId === "P6") {
    return runSingleP6Node({
      run,
      promptStack,
      phase,
      upstream,
      referenceBundle,
      referenceBundles,
      mechanicalValidations,
      modelMetaByPhase,
      parseRepairTraces,
      callModel,
      baseDir,
      scratchpadContext
    });
  }

  return runSingleModelPhaseNode({
    run,
    promptStack,
    phase,
    upstream,
    referenceBundle,
    referenceBundles,
    mechanicalValidations,
    modelMetaByPhase,
    parseRepairTraces,
    callModel,
    scratchpadContext
  });
}

async function runSingleS0Node({ run, baseDir, callModel }) {
  try {
    const stage0 = await runSourceAdapter({
      input: run,
      baseDir,
      callModel
    });

    if (!stage0 || typeof stage0 !== "object") {
      return singleNodeFailure({
        nodeId: "S0",
        status: "S0_SOURCE_ADAPTER_EMPTY_OUTPUT",
        error: "S0_SOURCE_ADAPTER_EMPTY_OUTPUT"
      });
    }

    if (!stage0.hybrid_extraction_manifest) {
      return singleNodeFailure({
        nodeId: "S0",
        status: "S0_HYBRID_EXTRACTION_MANIFEST_MISSING",
        error: "S0_HYBRID_EXTRACTION_MANIFEST_MISSING"
      });
    }

    if (!stage0.extraction_forensic_ledger) {
      return singleNodeFailure({
        nodeId: "S0",
        status: "S0_EXTRACTION_FORENSIC_LEDGER_MISSING",
        error: "S0_EXTRACTION_FORENSIC_LEDGER_MISSING"
      });
    }

    return singleNodeEnvelope({
      nodeId: "S0",
      output: stage0,
      mechanicalValidation: {
        ok: true,
        phase_id: "S0",
        errors: [],
        warnings: [],
        mechanical_only: true
      },
      modelMeta: null
    });
  } catch (err) {
    return singleNodeFailure({
      nodeId: "S0",
      status: "S0_SOURCE_ADAPTER_FAILED",
      error: err?.message || String(err)
    });
  }
}

async function runSingleModelPhaseNode({
  run,
  promptStack,
  phase,
  upstream,
  referenceBundle,
  referenceBundles,
  mechanicalValidations,
  modelMetaByPhase,
  parseRepairTraces,
  callModel,
  scratchpadContext = null
}) {
  const nodeId = phase.node_id;
  const payload = buildPayload({
    run,
    promptStack,
    phase,
    upstream,
    referenceBundle,
    scratchpadContext
  });

  let modelResult;

  try {
    modelResult = await callModel({
      phaseId: nodeId,
      poolName: phase.pool,
      systemPrompt: payload.systemPrompt,
      userPrompt: payload.userPrompt,
      responseMimeType: "application/json",
      temperature: 0,
      allowGrounding: false
    });
  } catch (err) {
    return singleNodeFailure({
      nodeId,
      status: `${nodeId}_MODEL_CALL_FAILED`,
      error: err?.message || String(err),
      reference_bundle: summarizeReferenceBundles(referenceBundles),
      mechanical_validations: mechanicalValidations
    });
  }

  const modelMeta = compactModelMeta(modelResult?.meta || modelResult || null, phase);
  modelMetaByPhase[nodeId] = modelMeta;

  const rawText = String(modelResult?.text || "");
  const parsedResult = await parseSingleNodeJsonWithRepair({
    phase,
    rawText,
    callModel,
    modelMetaByPhase,
    parseRepairTraces
  });

  if (!parsedResult.ok) {
    const validation = {
      ok: false,
      phase_id: nodeId,
      errors: [parsedResult.error],
      warnings: parsedResult.warning ? [parsedResult.warning] : [],
      mechanical_only: true
    };

    mechanicalValidations[nodeId] = validation;

    return singleNodeFailure({
      nodeId,
      status: `${nodeId}_JSON_PARSE_FAILED`,
      error: parsedResult.error,
      mechanical_validation: validation,
      model_meta: modelMeta,
      model_meta_by_phase: modelMetaByPhase,
      parse_repair_trace: parseRepairTraces
    });
  }

  const sidecar = extractAndStripScratchpadSidecar({
    nodeId,
    parsed: parsedResult.parsed
  });

  const phaseParsed = nodeId === "P1"
    ? normalizeP1PhasePackages(sidecar.canonical_output)
    : sidecar.canonical_output;

  const validation = validateMechanicalPhaseOutput({
    phaseId: nodeId,
    rawText,
    parsed: phaseParsed,
    requiredTopLevelKeys: getRequiredKeysForPhase(nodeId),
    context: {
      s0_candidate_count: upstream.S0?.hybrid_extraction_manifest?.candidate_sources?.length
    }
  });

  if (parsedResult.warning) {
    validation.warnings = [
      ...(validation.warnings || []),
      parsedResult.warning
    ];
  }

  mechanicalValidations[nodeId] = validation;

  if (!validation.ok) {
    return singleNodeFailure({
      nodeId,
      status: `${nodeId}_MECHANICAL_VALIDATION_FAILED`,
      error: validation.errors.join(";"),
      mechanical_validation: validation,
      model_meta: modelMeta,
      model_meta_by_phase: modelMetaByPhase
    });
  }

  return singleNodeEnvelope({
    nodeId,
    output: phaseParsed,
    referenceBundle: summarizeReferenceBundles(referenceBundles),
    mechanicalValidation: validation,
    modelMeta,
    extra: {
      scratchpad_update: sidecar.scratchpad_update,
      model_meta_by_phase: modelMetaByPhase,
      ...(hasEntries(parseRepairTraces) ? { parse_repair_trace: parseRepairTraces } : {})
    }
  });
}

async function runSingleP6Node({
  run,
  promptStack,
  phase,
  upstream,
  referenceBundle,
  referenceBundles,
  mechanicalValidations,
  modelMetaByPhase,
  parseRepairTraces,
  callModel,
  baseDir,
  scratchpadContext = null
}) {
  const nodeId = "P6";

  let p6BatchResult;

  try {
    p6BatchResult = await runP6Batched({
      run,
      promptStack,
      phase,
      upstream,
      referenceBundle,
      baseDir,
      callModel,
      modelMetaByPhase,
      parseRepairTraces,
      runtimeTrace: null,
      runUntil: null,
      scratchpadContext
    });
  } catch (err) {
    return singleNodeFailure({
      nodeId,
      status: "P6_BATCHING_FAILED",
      error: err?.message || String(err),
      reference_bundle: summarizeReferenceBundles(referenceBundles),
      mechanical_validations: mechanicalValidations,
      model_meta_by_phase: modelMetaByPhase
    });
  }

  if (!p6BatchResult?.ok) {
    const validation = p6BatchResult?.validation || {
      ok: false,
      phase_id: nodeId,
      errors: [p6BatchResult?.error || "P6_BATCHING_FAILED"],
      warnings: p6BatchResult?.warnings || [],
      mechanical_only: true
    };

    mechanicalValidations[nodeId] = validation;

    return singleNodeFailure({
      nodeId,
      status: p6BatchResult?.status || "P6_BATCHING_FAILED",
      error: p6BatchResult?.error || "P6_BATCHING_FAILED",
      mechanical_validation: validation,
      reference_bundle: summarizeReferenceBundles(referenceBundles),
      model_meta_by_phase: modelMetaByPhase
    });
  }

  const phaseParsed = p6BatchResult.parsed;

  const validation = validateMechanicalPhaseOutput({
    phaseId: nodeId,
    rawText: JSON.stringify(phaseParsed),
    parsed: phaseParsed,
    requiredTopLevelKeys: getRequiredKeysForPhase(nodeId),
    context: {
      s0_candidate_count: upstream.S0?.hybrid_extraction_manifest?.candidate_sources?.length
    }
  });

  validation.warnings = [
    ...(validation.warnings || []),
    ...(p6BatchResult.warnings || [])
  ];

  mechanicalValidations[nodeId] = validation;

  if (!validation.ok) {
    return singleNodeFailure({
      nodeId,
      status: "P6_MECHANICAL_VALIDATION_FAILED",
      error: validation.errors.join(";"),
      mechanical_validation: validation,
      reference_bundle: summarizeReferenceBundles(referenceBundles),
      model_meta_by_phase: modelMetaByPhase
    });
  }

  const p6ScratchpadUpdate = {
    node_id: "P6",
    status: "LOCKED",
    summary: "P6 registry ledger assembled from routed model batches and deterministic registry rows.",
    working_notes: [
      {
        note: "P6 route plan, model batch plan, registry row ledger, and merged coverage validation completed."
      }
    ],
    decisions: [
      {
        note: "P6 canonical output remains target_exposure_profile, exposure_profile_forensic_ledger, and registry_evaluation_trace."
      }
    ],
    validation_notes: [
      {
        note: "P6 batch coverage validation completed.",
        validation: p6BatchResult.coverageValidation || null
      }
    ],
    model_retention_hints: [
      {
        note: "Use registry_evaluation_trace.batch_coverage_validation and target_exposure_profile.registry_ledger for downstream final compiler limitations and report support."
      }
    ],
    route_plan_summary: phaseParsed?.exposure_profile_forensic_ledger?.routing_packet_summary || null,
    model_batch_plan: phaseParsed?.registry_evaluation_trace?.model_batch_plan || []
  };

  return singleNodeEnvelope({
    nodeId,
    output: phaseParsed,
    referenceBundle: summarizeReferenceBundles(referenceBundles),
    mechanicalValidation: validation,
    modelMeta: p6BatchResult.lastModelMeta || null,
    extra: {
      scratchpad_update: p6ScratchpadUpdate,
      model_meta_by_phase: modelMetaByPhase,
      ...(p6BatchResult.coverageValidation ? { p6_batch_coverage_validation: p6BatchResult.coverageValidation } : {}),
      ...(hasEntries(parseRepairTraces) ? { parse_repair_trace: parseRepairTraces } : {})
    }
  });
}

function runSingleRendererNode({ run, artifacts }) {
  const upstream = buildSingleNodeUpstreamFromArtifacts({
    nodeId: "RENDERER",
    artifacts
  });

  const referenceBundles = {};
  const mechanicalValidations = collectMechanicalValidationsFromArtifacts(artifacts);
  const phaseOutputs = collectPhaseOutputsFromUpstream(upstream);

  const rendererGate = validateTransitionGate({
    edge: "P7_to_RENDERER",
    upstream,
    referenceBundles
  });

  mechanicalValidations.GATE_P7_to_RENDERER = rendererGate;

  if (!rendererGate.ok) {
    return singleNodeFailure({
      nodeId: "RENDERER",
      status: "P7_TO_RENDERER_TRANSITION_GATE_FAILED",
      error: rendererGate.errors.join(";"),
      mechanical_validation: rendererGate
    });
  }

  let rendererResult;

  try {
    rendererResult = renderDiligenceReport({
      run,
      phaseOutputs,
      upstream,
      mechanicalValidations,
      runtimeTrace: null
    });
  } catch (err) {
    return singleNodeFailure({
      nodeId: "RENDERER",
      status: "RENDERER_FAILED",
      error: err?.message || String(err)
    });
  }

  const rendererValidation = {
    ok: rendererResult?.renderer_output?.render_status !== "FAILURE_RENDERED",
    phase_id: "RENDERER",
    errors: rendererResult?.renderer_output?.render_status === "FAILURE_RENDERED"
      ? [rendererResult?.renderer_trace?.errors?.join(";") || "RENDERER_FAILURE_RENDERED"]
      : [],
    warnings: rendererResult?.renderer_trace?.warnings || [],
    mechanical_only: true
  };

  if (!rendererValidation.ok) {
    return singleNodeFailure({
      nodeId: "RENDERER",
      status: "RENDERER_VALIDATION_FAILED",
      error: rendererValidation.errors.join(";"),
      mechanical_validation: rendererValidation
    });
  }

  return singleNodeEnvelope({
    nodeId: "RENDERER",
    output: {
      ok: true,
      status: "PUBLIC_REPORT_READY",
      renderer_output: rendererResult.renderer_output,
      renderer_trace: rendererResult.renderer_trace,
      rendered_report: rendererResult.rendered_report,
      html_report: rendererResult.renderer_output?.html_report || rendererResult.rendered_report?.html || null,
      report_json: rendererResult.renderer_output?.report_json || rendererResult.rendered_report?.report_json || null,
      vault_assembly_handoff: rendererResult.vault_assembly_handoff || null,
      runtime_orchestration_manifest: rendererResult.runtime_orchestration_manifest || null
    },
    mechanicalValidation: rendererValidation,
    modelMeta: null
  });
}

async function parseSingleNodeJsonWithRepair({
  phase,
  rawText,
  callModel,
  modelMetaByPhase,
  parseRepairTraces
}) {
  let parsed = parseJsonObject(rawText);
  let warning = null;

  if (parsed.ok) {
    return {
      ok: true,
      parsed: parsed.parsed,
      warning: null
    };
  }

  const originalParseError = parsed.error;
  const repairPhaseId = `${phase.node_id}_JSON_REPAIR`;
  const repairTrace = {
    phase_id: phase.node_id,
    original_parse_error: originalParseError,
    repair_attempted: true,
    repair_succeeded: false,
    repair_model_meta: null
  };

  let repairResult;

  try {
    repairResult = await callModel({
      phaseId: repairPhaseId,
      poolName: "repair",
      systemPrompt: JSON_REPAIR_SYSTEM_PROMPT,
      userPrompt: buildJsonRepairUserPrompt({
        phase,
        originalParseError,
        rawText
      }),
      responseMimeType: "application/json",
      temperature: 0,
      allowGrounding: false
    });
  } catch (err) {
    repairTrace.repair_error = err?.message || String(err);
    parseRepairTraces[phase.node_id] = repairTrace;

    return {
      ok: false,
      error: originalParseError
    };
  }

  const repairModelMeta = compactModelMeta(
    repairResult?.meta || repairResult || null,
    {
      node_id: repairPhaseId,
      pool: "repair"
    }
  );

  modelMetaByPhase[repairPhaseId] = repairModelMeta;
  repairTrace.repair_model_meta = repairModelMeta;

  const repairParsed = parseJsonObject(String(repairResult?.text || ""));
  const repairFailed = repairParsed.ok && repairParsed.parsed?.repair_failed === true;

  if (!repairParsed.ok || repairFailed) {
    repairTrace.repair_error = repairFailed
      ? (repairParsed.parsed?.repair_error || "UNREPAIRABLE_JSON")
      : repairParsed.error;

    parseRepairTraces[phase.node_id] = repairTrace;

    return {
      ok: false,
      error: originalParseError
    };
  }

  repairTrace.repair_succeeded = true;
  parseRepairTraces[phase.node_id] = repairTrace;
  parsed = repairParsed;
  warning = `${phase.node_id}_JSON_REPAIRED_AFTER_PARSE_FAILURE`;

  return {
    ok: true,
    parsed: parsed.parsed,
    warning
  };
}

function buildSingleNodeUpstreamFromArtifacts({ nodeId, artifacts = {} }) {
  const upstream = {};
  const requiredPriorNodes = priorNodesFor(nodeId);

  for (const priorNode of requiredPriorNodes) {
    const output = unwrapArtifactOutput(artifacts[priorNode]);

    if (output !== undefined && output !== null) {
      upstream[priorNode] = priorNode === "P1"
        ? normalizeP1PhasePackages(output)
        : output;
    }
  }

  return upstream;
}
function collectPhaseOutputsFromUpstream(upstream = {}) {
  const phaseOutputs = {};

  for (const nodeId of ["P1", "P2", "P3", "P4", "P5", "P6", "P7"]) {
    if (upstream[nodeId]) {
      phaseOutputs[nodeId] = upstream[nodeId];
    }
  }

  return phaseOutputs;
}

function collectMechanicalValidationsFromArtifacts(artifacts = {}) {
  const validations = {};

  for (const [nodeId, artifact] of Object.entries(artifacts || {})) {
    if (artifact?.mechanical_validation) {
      validations[nodeId] = artifact.mechanical_validation;
    }
  }

  return validations;
}

function unwrapArtifactOutput(artifact) {
  if (!artifact) return null;
  if (artifact.output !== undefined) return artifact.output;
  return artifact;
}

function priorNodesFor(nodeId) {
  const order = ["S0", "P1", "P2", "P3", "P4", "P5", "P6", "P7", "RENDERER"];
  const idx = order.indexOf(nodeId);

  if (idx <= 0) return [];

  return order.slice(0, idx);
}

function singleNodeEnvelope({
  nodeId,
  output,
  referenceBundle = null,
  mechanicalValidation,
  modelMeta = null,
  extra = {}
}) {
  return {
    ok: true,
    node_id: nodeId,
    status: "LOCKED",
    created_at: nowIso(),
    output,
    ...(referenceBundle ? { reference_bundle: referenceBundle } : {}),
    mechanical_validation: mechanicalValidation || {
      ok: true,
      phase_id: nodeId,
      errors: [],
      warnings: [],
      mechanical_only: true
    },
    model_meta: modelMeta,
    ...extra
  };
}

function singleNodeFailure({
  nodeId,
  status,
  error,
  mechanical_validation,
  ...extra
}) {
  return {
    ok: false,
    node_id: nodeId,
    status,
    error,
    created_at: nowIso(),
    mechanical_validation: mechanical_validation || {
      ok: false,
      phase_id: nodeId,
      errors: [error],
      warnings: [],
      mechanical_only: true
    },
    ...extra
  };
}

async function runP6Batched({ run, promptStack, phase, upstream, referenceBundle, baseDir, callModel, modelMetaByPhase, parseRepairTraces, runtimeTrace, runUntil, scratchpadContext = null }) {
  const registryRows = parseP6RegistryRows(referenceBundle);
  if (!registryRows.length) {
    return {
      ok: false,
      status: "P6_REGISTRY_ROWS_MISSING",
      error: "P6_REGISTRY_ROWS_MISSING",
      validation: { ok: false, phase_id: "P6", errors: ["P6_REGISTRY_ROWS_MISSING"], mechanical_only: true }
    };
  }

  const duplicateRegistryIds = findDuplicateValues(registryRows.map((row) => row.id));
  if (duplicateRegistryIds.length) {
    return {
      ok: false,
      status: "P6_REGISTRY_DUPLICATE_IDS",
      error: `P6_REGISTRY_DUPLICATE_IDS:${duplicateRegistryIds.join(",")}`,
      validation: { ok: false, phase_id: "P6", errors: [`P6_REGISTRY_DUPLICATE_IDS:${duplicateRegistryIds.join(",")}`], mechanical_only: true }
    };
  }

  const hunterRules = await loadP6HunterEngineRules({ baseDir });
  const routePlan = buildP6RoutePlan({ registryRows, p3Output: upstream.P3, targetFeatureProfile: upstream.P3?.target_feature_profile });
  const modelBatches = chunkArray(routePlan.modelRoutedRows, P6_MODEL_BATCH_SIZE).map((rows, index, batches) => ({
    batch_id: `P6_BATCH_${String(index + 1).padStart(3, "0")}`,
    batch_number: index + 1,
    batch_count: batches.length,
    expected_registry_row_ids: rows.map((item) => item.id),
    route_reasons: Object.fromEntries(rows.map((item) => [item.id, item.route_reason])),
    registry_rows: rows.map((item) => item.row.raw)
  }));
  const routingPacketSummary = {
    route_planner_version: "p6_batch_route_planner_v1",
    active_archetypes: routePlan.active_archetypes,
    active_surfaces: routePlan.active_surfaces,
    active_archetype_sources: routePlan.active_archetype_sources,
    active_surface_sources: routePlan.active_surface_sources,
    model_batch_size_max: P6_MODEL_BATCH_SIZE,
    registry_row_count: registryRows.length,
    model_routed_count: routePlan.modelRoutedRows.length,
    deterministic_not_applicable_count: routePlan.deterministicNotApplicableRows.length,
    model_batch_count: modelBatches.length,
    hunter_engine_rules_file: P6_HUNTER_RULES_FILE,
    hunter_engine_rules_loaded: hunterRules.loaded,
    ...(hunterRules.warning ? { hunter_engine_rules_warning: hunterRules.warning } : {})
  };
  const modelBatchPlan = compactP6ModelBatchPlan(modelBatches);
  if (runtimeTrace) {
    runtimeTrace.p6.route_plan_summary = routingPacketSummary;
    runtimeTrace.p6.model_batch_plan = modelBatchPlan;
    traceEvent(runtimeTrace, {
      type: "p6_route_plan",
      node_id: "P6_ROUTE_PLAN",
      status: "READY",
      summary: "P6 route plan built",
      counts: {
        registry_rows: registryRows.length,
        model_routed: routePlan.modelRoutedRows.length,
        deterministic_not_applicable: routePlan.deterministicNotApplicableRows.length,
        model_batches: modelBatches.length
      },
      warnings: hunterRules.warning ? [hunterRules.warning] : []
    });
  }
  if (shouldStopAt(runUntil, "P6_ROUTE_PLAN")) {
    return {
      ok: true,
      stopped: true,
      status: "STOPPED_AFTER_P6_ROUTE_PLAN",
      completedNode: "P6_ROUTE_PLAN",
      nextNode: "P6_BATCH_001",
      tracePayload: { route_plan_summary: routingPacketSummary, model_batch_plan: modelBatchPlan },
      warnings: hunterRules.warning ? [hunterRules.warning] : []
    };
  }

  const modelLedgerRows = [];
  let lastModelMeta = null;
  const warnings = [];
  if (hunterRules.warning) warnings.push(hunterRules.warning);
  const selectedBatch = resolveSelectedP6Batch({ run, runUntil, modelBatches });
  if (selectedBatch.error) {
    return {
      ok: false,
      status: "P6_SELECTED_BATCH_NOT_FOUND",
      error: selectedBatch.error,
      failedNode: selectedBatch.batchId || "P6_BATCH",
      validation: { ok: false, phase_id: selectedBatch.batchId || "P6_BATCH", errors: [selectedBatch.error], mechanical_only: true },
      lastModelMeta
    };
  }

  if (selectedBatch.batch) {
    const batchResult = await executeP6Batch({ run, promptStack, phase, upstream, referenceBundle, batch: selectedBatch.batch, routePlan, hunterRules, callModel, modelMetaByPhase, parseRepairTraces, runtimeTrace, scratchpadContext });
    lastModelMeta = batchResult.lastModelMeta || lastModelMeta;
    if (batchResult.warning) warnings.push(batchResult.warning);
    if (runtimeTrace) runtimeTrace.p6.batch_results_summary = batchResult.summary ? [batchResult.summary] : [];
    if (!batchResult.ok) {
      if (batchResult.validation) {
        const detail = summarizeP6BatchValidation({ batch: selectedBatch.batch, ledgerBatch: batchResult.ledgerBatch });
        return {
          ok: false,
          selectedBatchFailure: true,
          status: "P6_SELECTED_BATCH_VALIDATION_FAILED",
          failedNode: selectedBatch.batch.batch_id,
          error: `${selectedBatch.batch.batch_id}:${batchResult.validation.errors.join(";")}`,
          selectedBatchValidation: batchResult.validation,
          expectedRegistryRowIds: detail.expectedRegistryRowIds,
          returnedRegistryRowIds: detail.returnedRegistryRowIds,
          missingRegistryRowIds: detail.missingRegistryRowIds,
          unexpectedRegistryRowIds: detail.unexpectedRegistryRowIds,
          warnings,
          lastModelMeta
        };
      }
      return { ...batchResult, lastModelMeta };
    }
    const selectedBatchId = selectedBatch.batch.batch_id;
    return {
      ok: true,
      stopped: true,
      status: `STOPPED_AFTER_${selectedBatchId}`,
      completedNode: selectedBatchId,
      nextNode: nextP6BatchId(selectedBatch.batch, modelBatches),
      tracePayload: { route_plan_summary: routingPacketSummary, model_batch_plan: modelBatchPlan, batch_results_summary: [batchResult.summary] },
      selectedBatchValidation: batchResult.validation,
      warnings,
      lastModelMeta
    };
  }

  const batchResultsSummary = [];
  for (const batch of modelBatches) {
    const batchResult = await executeP6Batch({ run, promptStack, phase, upstream, referenceBundle, batch, routePlan, hunterRules, callModel, modelMetaByPhase, parseRepairTraces, runtimeTrace, scratchpadContext });
    lastModelMeta = batchResult.lastModelMeta || lastModelMeta;
    if (batchResult.warning) warnings.push(batchResult.warning);
    if (batchResult.summary) batchResultsSummary.push(batchResult.summary);
    if (!batchResult.ok) return { ...batchResult, lastModelMeta };
    modelLedgerRows.push(...batchResult.ledgerBatch);
  }
  if (runtimeTrace) runtimeTrace.p6.batch_results_summary = batchResultsSummary;

  const deterministicRows = routePlan.deterministicNotApplicableRows.map((item) => buildP6DeterministicNotApplicableRow(item.row.raw));
  const coverageValidation = validateP6MergedCoverage({ registryRows, modelLedgerRows, deterministicRows, modelRoutedIds: routePlan.modelRoutedRows.map((item) => item.id) });
  if (!coverageValidation.ok) {
    return {
      ok: false,
      status: "P6_BATCH_COVERAGE_VALIDATION_FAILED",
      error: coverageValidation.errors.join(";"),
      coverageValidation,
      lastModelMeta
    };
  }

  const mergedLedger = mergeP6LedgerRows({ registryRows, modelLedgerRows, deterministicRows });
  if (runtimeTrace) runtimeTrace.p6.batch_coverage_validation = compactValidation(coverageValidation);

  return {
    ok: true,
    parsed: {
      exposure_profile_forensic_ledger: {
        routing_packet_summary: routingPacketSummary
      },
      registry_evaluation_trace: {
        hunter_route_plan: routePlan.hunter_route_plan,
        model_batch_plan: modelBatchPlan,
        batch_coverage_validation: coverageValidation
      },
      target_exposure_profile: {
        registry_ledger: mergedLedger
      }
    },
    coverageValidation,
    warnings,
    lastModelMeta
  };
}

function resolveSelectedP6Batch({ run, runUntil, modelBatches }) {
  const requestedId = normalizeP6BatchId(runUntil) || normalizeP6BatchId(run.p6_batch_id);
  const requestedNumber = positiveInt(run.p6_batch_number, 0);
  if (!requestedId && runUntil !== "P6_BATCH" && !requestedNumber) return {};
  const batchId = requestedId || (requestedNumber ? `P6_BATCH_${String(requestedNumber).padStart(3, "0")}` : "");
  if (!batchId) {
    return { error: "P6_SELECTED_BATCH_ID_OR_NUMBER_REQUIRED", batchId: "P6_BATCH" };
  }
  const batch = modelBatches.find((item) => item.batch_id === batchId);
  if (!batch) {
    return { error: `P6_SELECTED_BATCH_NOT_FOUND:${batchId}`, batchId };
  }
  return { batch };
}

function normalizeP6BatchId(value) {
  const normalized = String(value || "").trim().toUpperCase();
  const match = normalized.match(/^P6_BATCH_(\d{1,3})$/);
  return match ? `P6_BATCH_${String(Number(match[1])).padStart(3, "0")}` : "";
}

function nextP6BatchId(batch, modelBatches) {
  const next = modelBatches.find((item) => item.batch_number === batch.batch_number + 1);
  return next?.batch_id || "P6_ALL_BATCHES";
}

function summarizeP6BatchValidation({ batch, ledgerBatch }) {
  const returnedRegistryRowIds = Array.isArray(ledgerBatch) ? ledgerBatch.map((row) => getP6LedgerRowId(row)).filter(Boolean) : [];
  const returned = new Set(returnedRegistryRowIds);
  const expected = new Set(batch.expected_registry_row_ids);
  return {
    expectedRegistryRowIds: batch.expected_registry_row_ids,
    returnedRegistryRowIds,
    missingRegistryRowIds: batch.expected_registry_row_ids.filter((id) => !returned.has(id)),
    unexpectedRegistryRowIds: returnedRegistryRowIds.filter((id) => !expected.has(id))
  };
}

async function executeP6Batch({ run, promptStack, phase, upstream, referenceBundle, batch, routePlan, hunterRules, callModel, modelMetaByPhase, parseRepairTraces, runtimeTrace, scratchpadContext = null }) {
  const batchStartedAt = nowIso();
  let modelResult;
  let lastModelMeta = null;
  try {
    const payload = buildP6BatchPayload({ run, promptStack, phase, upstream, referenceBundle, batch, routePlan, hunterRules, scratchpadContext });
    modelResult = await callModel({
      phaseId: batch.batch_id,
      poolName: phase.pool,
      systemPrompt: payload.systemPrompt,
      userPrompt: payload.userPrompt,
      responseMimeType: "application/json",
      temperature: 0,
      allowGrounding: false
    });
  } catch (err) {
    traceEvent(runtimeTrace, { type: "p6_batch", node_id: batch.batch_id, status: "FAILED", summary: "P6 batch model call failed", duration_ms: durationSince(batchStartedAt), errors: [err?.message || String(err)] });
    return {
      ok: false,
      status: "P6_BATCH_MODEL_CALL_FAILED",
      error: `${batch.batch_id}_MODEL_CALL_FAILED:${err?.message || String(err)}`,
      lastModelMeta
    };
  }

  lastModelMeta = compactModelMeta(modelResult?.meta || modelResult || null, { node_id: batch.batch_id, pool: phase.pool });
  modelMetaByPhase[batch.batch_id] = lastModelMeta;
  traceModel(runtimeTrace, batch.batch_id, lastModelMeta);
  const parsedResult = await parseP6BatchModelJson({
    batch,
    phase,
    rawText: String(modelResult?.text || ""),
    callModel,
    modelMetaByPhase,
    parseRepairTraces
  });
  lastModelMeta = parsedResult.lastModelMeta || lastModelMeta;
  if (!parsedResult.ok) {
    traceEvent(runtimeTrace, { type: "p6_batch", node_id: batch.batch_id, status: "FAILED", summary: "P6 batch JSON parse failed", duration_ms: durationSince(batchStartedAt), errors: [parsedResult.error] });
    return {
      ok: false,
      status: "P6_BATCH_JSON_PARSE_FAILED",
      error: parsedResult.error,
      lastModelMeta
    };
  }

  const ledgerBatch = getP6RegistryLedgerBatch(parsedResult.parsed);
  const batchValidation = validateP6ModelBatchOutput({ batch, ledgerBatch });
  const summary = {
    batch_id: batch.batch_id,
    expected_registry_row_ids: batch.expected_registry_row_ids,
    returned_registry_row_count: Array.isArray(ledgerBatch) ? ledgerBatch.length : 0,
    validation: compactValidation(batchValidation),
    model_meta: lastModelMeta
  };
  traceEvent(runtimeTrace, {
    type: "p6_batch",
    node_id: batch.batch_id,
    status: batchValidation.ok ? "OK" : "FAILED",
    summary: `${batch.batch_id} validation ${batchValidation.ok ? "passed" : "failed"}`,
    duration_ms: durationSince(batchStartedAt),
    counts: { expected_registry_rows: batch.expected_registry_row_ids.length, returned_registry_rows: Array.isArray(ledgerBatch) ? ledgerBatch.length : 0 },
    errors: batchValidation.errors || [],
    warnings: batchValidation.warnings || []
  });
  if (!batchValidation.ok) {
    return {
      ok: false,
      status: "P6_BATCH_MECHANICAL_VALIDATION_FAILED",
      error: `${batch.batch_id}:${batchValidation.errors.join(";")}`,
      validation: batchValidation,
      ledgerBatch,
      summary,
      warning: parsedResult.warning,
      lastModelMeta
    };
  }
  return { ok: true, validation: batchValidation, ledgerBatch, summary, warning: parsedResult.warning, lastModelMeta };
}

function buildP6BatchPayload({ run, promptStack, phase, upstream, referenceBundle, batch, routePlan, hunterRules, scratchpadContext = null }) {
  const supplementalReferenceBundle = stripCoreReferences(referenceBundle);
  const batchInstruction = [
    "This is a P6 model-batch invocation. Return only RS6.000 p6_model_batch_output JSON for expected_registry_row_ids. Do not emit the final full P6 envelope. Final P6 envelope is assembled deterministically after all batches.",
    "Return one object with p6_model_batch_output.registry_ledger_batch as an array.",
    "Each registry_ledger_batch row must correspond to exactly one expected_registry_row_ids entry."
  ].join("\n");
  return {
    systemPrompt: [
      promptStack.core["00_RUNTIME_SPINE.md"],
      promptStack.core["00_RUNTIME_SPINE_INDEX.md"],
      promptStack.core["00_SOURCE_EXTRACTION_CONTRACT.md"],
      promptStack.core["08_PHASE_STACK_EXECUTION_MAP.md"],
      promptStack.core["09_OUTPUT_HANDOFF_CONTRACT.md"],
      promptStack.core["10_RUNTIME_AUDIT_CHECKLIST.md"],
      formatReferencesForPrompt(supplementalReferenceBundle),
      phase.prompt,
      batchInstruction
    ].filter(Boolean).join("\n\n"),
    userPrompt: JSON.stringify({
      run_context: { run_id: run.run_id, target_url: run.target_url, company_name: run.company_name, source_mode: run.source_mode },
      reference_manifest: referenceBundle.reference_manifest,
      missing_references: referenceBundle.missing_references,
      current_node: phase.node_id,
      current_prompt_file: phase.file,
      batch_id: batch.batch_id,
      batch_number: batch.batch_number,
      batch_count: batch.batch_count,
      expected_registry_row_ids: batch.expected_registry_row_ids,
      registry_rows: batch.registry_rows,
      target_profile: upstream.P2?.target_profile,
      target_feature_profile: upstream.P3?.target_feature_profile,
      legal_cartography_index: upstream.P4?.legal_cartography_index,
      target_data_provenance_profile: upstream.P5?.target_data_provenance_profile,
      registry_support_package: buildP6EvidencePackage(upstream),
      admitted_evidence_package_available_to_p6: buildP6EvidencePackage(upstream),
      hunter_engine_rules: hunterRules.rows,
      route_plan_for_batch: batch.expected_registry_row_ids.map((id) => routePlan.by_id[id]).filter(Boolean),
      ...(scratchpadContext ? { scratchpad_context: scratchpadContext } : {})
    }, null, 2)
  };
}

function buildP6EvidencePackage(upstream = {}) {
  const handoff = upstream.P1?.source_discovery_handoff || {};
  return {
    registry_support_package: handoff.phase_packages?.registry_support_package || null,
    legal_cartography_package: handoff.phase_packages?.legal_cartography_package || null,
    data_provenance_package: handoff.phase_packages?.data_provenance_package || null,
    final_source_coverage_package: handoff.phase_packages?.final_source_coverage_package || null,
    absence_records: handoff.absence_records || null,
    documented_absences: handoff.documented_absences || []
  };
}

async function parseP6BatchModelJson({ batch, phase, rawText, callModel, modelMetaByPhase, parseRepairTraces }) {
  let parsed = parseJsonObject(rawText);
  if (parsed.ok) return { ok: true, parsed: parsed.parsed };

  const originalParseError = parsed.error;
  const repairPhaseId = `${batch.batch_id}_JSON_REPAIR`;
  const repairTrace = {
    phase_id: batch.batch_id,
    original_parse_error: originalParseError,
    repair_attempted: true,
    repair_succeeded: false,
    repair_model_meta: null
  };
  let repairResult;
  try {
    repairResult = await callModel({
      phaseId: repairPhaseId,
      poolName: "repair",
      systemPrompt: JSON_REPAIR_SYSTEM_PROMPT,
      userPrompt: buildJsonRepairUserPrompt({ phase: { ...phase, node_id: batch.batch_id, required_top_level_keys: ["p6_model_batch_output"] }, originalParseError, rawText }),
      responseMimeType: "application/json",
      temperature: 0,
      allowGrounding: false
    });
  } catch (err) {
    repairTrace.repair_error = err?.message || String(err);
    parseRepairTraces[batch.batch_id] = repairTrace;
    return { ok: false, error: originalParseError };
  }

  const repairModelMeta = compactModelMeta(repairResult?.meta || repairResult || null, { node_id: repairPhaseId, pool: "repair" });
  modelMetaByPhase[repairPhaseId] = repairModelMeta;
  repairTrace.repair_model_meta = repairModelMeta;
  parsed = parseJsonObject(String(repairResult?.text || ""));
  const repairFailed = parsed.ok && parsed.parsed?.repair_failed === true;
  if (!parsed.ok || repairFailed) {
    repairTrace.repair_error = repairFailed ? (parsed.parsed?.repair_error || "UNREPAIRABLE_JSON") : parsed.error;
    parseRepairTraces[batch.batch_id] = repairTrace;
    return { ok: false, error: originalParseError, lastModelMeta: repairModelMeta };
  }

  repairTrace.repair_succeeded = true;
  parseRepairTraces[batch.batch_id] = repairTrace;
  return {
    ok: true,
    parsed: parsed.parsed,
    warning: `${batch.batch_id}_JSON_REPAIRED_AFTER_PARSE_FAILURE`,
    lastModelMeta: repairModelMeta
  };
}

function getP6RegistryLedgerBatch(parsed) {
  if (Array.isArray(parsed?.p6_model_batch_output?.registry_ledger_batch)) return parsed.p6_model_batch_output.registry_ledger_batch;
  if (Array.isArray(parsed?.registry_ledger_batch)) return parsed.registry_ledger_batch;
  return null;
}

function validateP6ModelBatchOutput({ batch, ledgerBatch }) {
  const errors = [];
  if (!Array.isArray(ledgerBatch)) {
    errors.push("P6_BATCH_REGISTRY_LEDGER_BATCH_NOT_ARRAY");
    return { ok: false, phase_id: batch.batch_id, errors, mechanical_only: true };
  }
  const expected = new Set(batch.expected_registry_row_ids);
  const actual = ledgerBatch.map((row) => getP6LedgerRowId(row)).filter(Boolean);
  const actualSet = new Set(actual);
  const duplicates = findDuplicateValues(actual);
  const missing = batch.expected_registry_row_ids.filter((id) => !actualSet.has(id));
  const unexpected = actual.filter((id) => !expected.has(id));
  if (duplicates.length) errors.push(`P6_BATCH_DUPLICATE_ROW_IDS:${duplicates.join(",")}`);
  if (missing.length) errors.push(`P6_BATCH_MISSING_ROW_IDS:${missing.join(",")}`);
  if (unexpected.length) errors.push(`P6_BATCH_UNEXPECTED_ROW_IDS:${unexpected.join(",")}`);
  for (const row of ledgerBatch) {
    const id = getP6LedgerRowId(row);
    if (expected.has(id) && normalizeSignal(row?.evaluation_status) === "NOT_APPLICABLE_CONTEXTUAL") {
      errors.push(`P6_MODEL_ROUTED_ROW_NOT_APPLICABLE_CONTEXTUAL:${id}`);
    }
  }
  return { ok: errors.length === 0, phase_id: batch.batch_id, errors, mechanical_only: true };
}

function validateP6MergedCoverage({ registryRows, modelLedgerRows, deterministicRows, modelRoutedIds }) {
  const expectedIds = registryRows.map((row) => row.id);
  const modelIdSet = new Set(modelRoutedIds);
  const modelIds = modelLedgerRows.map((row) => getP6LedgerRowId(row)).filter(Boolean);
  const deterministicIds = deterministicRows.map((row) => getP6LedgerRowId(row)).filter(Boolean);
  const mergedIds = [...modelIds, ...deterministicIds];
  const mergedSet = new Set(mergedIds);
  const errors = [];
  const missing = expectedIds.filter((id) => !mergedSet.has(id));
  const unexpected = mergedIds.filter((id) => !expectedIds.includes(id));
  const duplicates = findDuplicateValues(mergedIds);
  const deterministicWrong = deterministicIds.filter((id) => modelIdSet.has(id));
  if (missing.length) errors.push(`P6_MERGED_MISSING_ROW_IDS:${missing.join(",")}`);
  if (unexpected.length) errors.push(`P6_MERGED_UNEXPECTED_ROW_IDS:${unexpected.join(",")}`);
  if (duplicates.length) errors.push(`P6_MERGED_DUPLICATE_ROW_IDS:${duplicates.join(",")}`);
  if (deterministicWrong.length) errors.push(`P6_DETERMINISTIC_ROW_OVERLAPS_MODEL_ROUTED:${deterministicWrong.join(",")}`);
  if (mergedIds.length !== expectedIds.length) errors.push(`P6_MERGED_LEDGER_LENGTH_MISMATCH:${mergedIds.length}:${expectedIds.length}`);
  return {
    ok: errors.length === 0,
    phase_id: "P6_BATCH_COVERAGE",
    errors,
    mechanical_only: true,
    expected_registry_row_count: expectedIds.length,
    model_routed_row_count: modelIds.length,
    deterministic_not_applicable_row_count: deterministicIds.length,
    merged_registry_ledger_count: mergedIds.length,
    missing_registry_row_ids: missing,
    duplicate_registry_row_ids: duplicates,
    unexpected_registry_row_ids: unexpected
  };
}

function mergeP6LedgerRows({ registryRows, modelLedgerRows, deterministicRows }) {
  const modelById = new Map(modelLedgerRows.map((row) => [getP6LedgerRowId(row), row]));
  const deterministicById = new Map(deterministicRows.map((row) => [getP6LedgerRowId(row), row]));
  return registryRows.map((registryRow) => ({
    ...registryRow.raw,
    ...(modelById.get(registryRow.id) || deterministicById.get(registryRow.id) || {})
  }));
}

function buildP6DeterministicNotApplicableRow(registryRow) {
  const id = getP6RegistryRowId(registryRow);
  return {
    ...registryRow,
    Threat_ID: registryRow.Threat_ID || id,
    threat_id: id,
    registry_row_id: id,
    row_route_reason: "INT_NOT_TRIGGERED_NOT_APPLICABLE",
    registry_signal_trigger_status: "REGISTRY_SIGNAL_NOT_TRIGGERED",
    trigger_basis_type: "INSUFFICIENT_CONTEXT",
    evaluation_status: "NOT_APPLICABLE_CONTEXTUAL",
    evaluation_confidence: "high",
    requires_qualified_review: false,
    visible_evidence_summary: "",
    visible_control_summary: "",
    row_limitation: "non-UNI row not activated by Phase 03 archetype/surface routing",
    legal_conclusion: null
  };
}

function buildP6RoutePlan({ registryRows, p3Output = {}, targetFeatureProfile }) {
  const profile = targetFeatureProfile || p3Output?.target_feature_profile || {};
  const archetypeSignals = collectP6ActiveArchetypes({ targetFeatureProfile: profile, p3Output });
  const surfaceSignals = collectP6ActiveSurfaces({ targetFeatureProfile: profile, p3Output });
  const activeArchetypes = archetypeSignals.values;
  const activeSurfaces = surfaceSignals.values;
  const byId = {};
  const routed = registryRows.map((row, index) => {
    const archetype = normalizeSignal(row.raw.Archetype);
    const surfaces = splitP6SurfaceTokens(row.raw.Surface);
    const archetypeTriggered = activeArchetypes.includes(archetype);
    const surfaceTriggered = surfaces.some((surface) => activeSurfaces.includes(surface));
    let routeStatus = "DETERMINISTIC_NOT_APPLICABLE";
    let routeReason = "INT_NOT_TRIGGERED_NOT_APPLICABLE";
    let routeGroup = 4;
    if (archetype === "UNI") {
      routeStatus = "MODEL_ROUTED";
      routeReason = "UNI_ALWAYS_RUN";
      routeGroup = 1;
    } else if (archetypeTriggered) {
      routeStatus = "MODEL_ROUTED";
      routeReason = "ARCHETYPE_TRIGGERED";
      routeGroup = 2;
    } else if (surfaceTriggered) {
      routeStatus = "MODEL_ROUTED";
      routeReason = "SURFACE_TRIGGERED";
      routeGroup = 3;
    }
    const item = {
      id: row.id,
      registry_order: index + 1,
      route_status: routeStatus,
      route_reason: routeReason,
      route_group: routeGroup,
      archetype,
      surfaces,
      row
    };
    byId[row.id] = {
      registry_row_id: row.id,
      registry_order: index + 1,
      route_status: routeStatus,
      route_reason: routeReason,
      archetype,
      surfaces
    };
    return item;
  });
  const modelRoutedRows = routed.filter((item) => item.route_status === "MODEL_ROUTED").sort((a, b) => a.route_group - b.route_group || a.registry_order - b.registry_order);
  const deterministicNotApplicableRows = routed.filter((item) => item.route_status === "DETERMINISTIC_NOT_APPLICABLE");
  return {
    active_archetypes: activeArchetypes,
    active_surfaces: activeSurfaces,
    active_archetype_sources: archetypeSignals.sources,
    active_surface_sources: surfaceSignals.sources,
    modelRoutedRows,
    deterministicNotApplicableRows,
    by_id: byId,
    hunter_route_plan: routed.map((item) => byId[item.id])
  };
}

function collectP6ActiveArchetypes({ targetFeatureProfile = {}, p3Output = {} } = {}) {
  const values = [];
  const sources = [];
  const features = Array.isArray(targetFeatureProfile.feature_inventory) ? targetFeatureProfile.feature_inventory : [];
  for (const feature of features) {
    collectSignalValues(feature?.archetype_codes, values, ["archetype_code", "code", "value"], sources, "target_feature_profile.feature_inventory[].archetype_codes");
    const provenance = feature?.archetype_provenance || {};
    collectSignalValues(provenance?.candidate_archetypes, values, ["archetype_code", "code", "value"], sources, "target_feature_profile.feature_inventory[].archetype_provenance.candidate_archetypes");
    collectSignalValues(provenance?.matched_archetypes, values, ["archetype_code", "code", "value"], sources, "target_feature_profile.feature_inventory[].archetype_provenance.matched_archetypes");
    collectSignalValues(provenance?.active_archetypes, values, ["archetype_code", "code", "value"], sources, "target_feature_profile.feature_inventory[].archetype_provenance.active_archetypes");
  }
  collectSignalValues(targetFeatureProfile.archetype_codes, values, ["archetype_code", "code", "value"], sources, "target_feature_profile.archetype_codes");
  collectSignalValues(targetFeatureProfile.active_archetypes, values, ["archetype_code", "code", "value"], sources, "target_feature_profile.active_archetypes");
  collectSignalValues(targetFeatureProfile.matched_archetypes, values, ["archetype_code", "code", "value"], sources, "target_feature_profile.matched_archetypes");
  collectSignalValues(targetFeatureProfile.archetype_matches, values, ["archetype_code", "code", "value"], sources, "target_feature_profile.archetype_matches");
  collectSignalValues(targetFeatureProfile.feature_signal_map?.archetype_matches, values, ["archetype_code", "code", "value"], sources, "target_feature_profile.feature_signal_map.archetype_matches");
  for (const item of asArray(targetFeatureProfile.feature_signal_map)) {
    collectSignalValues(item?.linked_archetype_codes, values, ["archetype_code", "code", "value"], sources, "target_feature_profile.feature_signal_map[].linked_archetype_codes");
  }
  collectSignalValues(p3Output?.feature_profile_forensic_ledger?.coverage_matrix?.archetype_matches, values, ["archetype_code", "code", "value"], sources, "feature_profile_forensic_ledger.coverage_matrix.archetype_matches");
  return { values: uniqueNormalized(values), sources: uniqueSignalSources(sources) };
}

function collectP6ActiveSurfaces({ targetFeatureProfile = {}, p3Output = {} } = {}) {
  const values = [];
  const sources = [];
  const features = Array.isArray(targetFeatureProfile.feature_inventory) ? targetFeatureProfile.feature_inventory : [];
  for (const feature of features) {
    collectSignalValues(feature?.surface_tokens, values, ["surface_token", "token", "code", "value"], sources, "target_feature_profile.feature_inventory[].surface_tokens");
    const provenance = feature?.surface_provenance || {};
    collectSignalValues(provenance?.candidate_surfaces, values, ["surface_token", "token", "code", "value"], sources, "target_feature_profile.feature_inventory[].surface_provenance.candidate_surfaces");
    collectSignalValues(provenance?.matched_surfaces, values, ["surface_token", "token", "code", "value"], sources, "target_feature_profile.feature_inventory[].surface_provenance.matched_surfaces");
    collectSignalValues(provenance?.active_surfaces, values, ["surface_token", "token", "code", "value"], sources, "target_feature_profile.feature_inventory[].surface_provenance.active_surfaces");
  }
  collectSignalValues(targetFeatureProfile.surface_tokens, values, ["surface_token", "token", "code", "value"], sources, "target_feature_profile.surface_tokens");
  collectSignalValues(targetFeatureProfile.active_surfaces, values, ["surface_token", "token", "code", "value"], sources, "target_feature_profile.active_surfaces");
  collectSignalValues(targetFeatureProfile.matched_surfaces, values, ["surface_token", "token", "code", "value"], sources, "target_feature_profile.matched_surfaces");
  collectSignalValues(targetFeatureProfile.surface_matches, values, ["surface_token", "token", "code", "value"], sources, "target_feature_profile.surface_matches");
  collectSignalValues(targetFeatureProfile.feature_signal_map?.surface_matches, values, ["surface_token", "token", "code", "value"], sources, "target_feature_profile.feature_signal_map.surface_matches");
  for (const item of asArray(targetFeatureProfile.feature_signal_map)) {
    collectSignalValues(item?.surface_token, values, ["surface_token", "token", "code", "value"], sources, "target_feature_profile.feature_signal_map[].surface_token");
    collectSignalValues(item?.surface_tokens, values, ["surface_token", "token", "code", "value"], sources, "target_feature_profile.feature_signal_map[].surface_tokens");
  }
  collectSignalValues(p3Output?.feature_profile_forensic_ledger?.coverage_matrix?.surface_matches, values, ["surface_token", "token", "code", "value"], sources, "feature_profile_forensic_ledger.coverage_matrix.surface_matches");
  return { values: uniqueNormalized(values), sources: uniqueSignalSources(sources) };
}

function collectSignalValues(value, out, objectKeys, sources, source) {
  if (value === undefined || value === null) return;
  if (typeof value === "string" || typeof value === "number") {
    const raw = String(value);
    out.push(raw);
    if (sources && source) sources.push({ source, value: raw, normalized: normalizeSignal(raw) });
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectSignalValues(item, out, objectKeys, sources, source);
    return;
  }
  if (typeof value === "object") {
    for (const key of objectKeys) if (value[key] !== undefined) collectSignalValues(value[key], out, objectKeys, sources, source);
  }
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  return value === undefined || value === null ? [] : [value];
}

function uniqueSignalSources(sources = []) {
  const seen = new Set();
  const unique = [];
  for (const item of sources) {
    if (!item.normalized) continue;
    const key = `${item.source}\u0000${item.normalized}\u0000${item.value}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }
  return unique;
}

function parseP6RegistryRows(referenceBundle = {}) {
  const registryRef = (referenceBundle.references || []).find((ref) => ref.name === "AI_THREAT_REGISTRY" && /Threat_ID\s*,/i.test(ref.content || ""));
  if (!registryRef) return [];
  return parseCsv(registryRef.content).map((raw, index) => ({ id: getP6RegistryRowId(raw), raw, registry_order: index + 1 })).filter((row) => row.id);
}

async function loadP6HunterEngineRules({ baseDir }) {
  try {
    const content = await fs.readFile(path.join(baseDir, "reference", P6_HUNTER_RULES_FILE), "utf8");
    return { loaded: true, rows: parseCsv(content), warning: null };
  } catch {
    return {
      loaded: false,
      rows: [],
      warning: `${P6_HUNTER_RULES_FILE}_MISSING_CONTINUING_WITH_EMPTY_HUNTER_ENGINE_RULES`
    };
  }
}

function parseCsv(text) {
  const lines = String(text || "").replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (!lines.length) return [];
  const headers = parseCsvLine(lines[0]).map((header, index) => header.trim() || `_empty_${index}`);
  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = cells[index] ?? "";
    });
    return row;
  });
}

function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    const next = line[i + 1];
    if (ch === "\"" && inQuotes && next === "\"") {
      current += "\"";
      i += 1;
    } else if (ch === "\"") {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      cells.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells;
}

function getP6RegistryRowId(row) {
  return String(row?.Threat_ID || row?.threat_id || row?.registry_row_id || row?.row_id || "").trim();
}

function getP6LedgerRowId(row) {
  return getP6RegistryRowId(row);
}

function splitP6SurfaceTokens(value) {
  return String(value || "").split("|").map(normalizeSignal).filter(Boolean);
}

function normalizeSignal(value) {
  return String(value || "").trim().toUpperCase();
}

function uniqueNormalized(values) {
  return Array.from(new Set((values || []).map(normalizeSignal).filter(Boolean)));
}

function chunkArray(values, size) {
  const chunks = [];
  for (let i = 0; i < values.length; i += size) chunks.push(values.slice(i, i + size));
  return chunks;
}

function findDuplicateValues(values) {
  const seen = new Set();
  const dupes = new Set();
  for (const value of values || []) {
    if (!value) continue;
    if (seen.has(value)) dupes.add(value);
    seen.add(value);
  }
  return Array.from(dupes);
}

function buildPayload({ run, promptStack, phase, upstream, referenceBundle, scratchpadContext = null }) {
  const supplementalReferenceBundle = stripCoreReferences(referenceBundle);
  return {
    systemPrompt: [promptStack.core["00_RUNTIME_SPINE.md"], promptStack.core["00_RUNTIME_SPINE_INDEX.md"], promptStack.core["00_SOURCE_EXTRACTION_CONTRACT.md"], promptStack.core["08_PHASE_STACK_EXECUTION_MAP.md"], promptStack.core["09_OUTPUT_HANDOFF_CONTRACT.md"], promptStack.core["10_RUNTIME_AUDIT_CHECKLIST.md"], formatReferencesForPrompt(supplementalReferenceBundle), phase.prompt].filter(Boolean).join("\n\n"),
    userPrompt: JSON.stringify({
      run_context: { run_id: run.run_id, target_url: run.target_url, company_name: run.company_name, source_mode: run.source_mode },
      reference_manifest: referenceBundle.reference_manifest,
      missing_references: referenceBundle.missing_references,
      upstream_outputs: compactUpstreamForPrompt(upstream),
      current_node: phase.node_id,
      current_prompt_file: phase.file,
      ...(scratchpadContext ? { scratchpad_context: scratchpadContext } : {})
    }, null, 2)
  };
}

function compactUpstreamForPrompt(upstream = {}) {
  const out = {};
  if (upstream.S0) out.S0 = compactStage0ForPrompt(upstream.S0);
  for (const [node, value] of Object.entries(upstream)) {
    if (node !== "S0") out[node] = value;
  }
  return out;
}

function compactStage0ForPrompt(stage0 = {}, { includeCleanText = true } = {}) {
  const m = stage0.hybrid_extraction_manifest || {};
  return {
    node_id: m.node_id || "S0",
    adapter_version: m.adapter_version,
    source_mode: m.source_mode,
    run_id: m.run_id,
    target: m.target,
    target_url: m.target_url,
    company_name: m.company_name,
    generated_at: m.generated_at,
    extraction_call_card: m.extraction_call_card,
    collection_summary: m.collection_summary,
    collection_limitations: m.collection_limitations || [],
    batch_plan: m.batch_plan || [],
    root_clusters: m.root_clusters || [],
    candidate_sources: (m.candidate_sources || []).map((source) => compactCandidateSourceForPrompt(source, { includeCleanText })),
    fetch_failures: (m.fetch_failures || []).map((x) => ({
      candidate_url: x.candidate_url,
      fetch_status: x.fetch_status,
      failure_basis: x.failure_basis,
      phase1_review_required: true
    })),
    deferred_candidates: (m.deferred_candidates || []).map((x) => ({
      candidate_url: x.candidate_url,
      priority: x.priority,
      source_family_hint: x.source_family_hint,
      defer_reason: x.defer_reason,
      not_silently_dropped: true,
      phase1_review_required: true
    })),
    rejected_by_scope: (m.rejected_by_scope || []).map((x) => ({
      candidate_url: x.candidate_url,
      scope_class: x.scope_class,
      reason: x.reason
    })),
    prompt_payload_policy: {
      raw_text_removed_from_prompt: true,
      raw_html_removed_from_prompt: true,
      raw_refs_preserved_not_inlined: true,
      clean_text_preserved_for_candidate_sources: true,
      full_custody_retained_in_stage0_internal_output: true,
      phase1_admission_required: true
    }
  };
}

function compactCandidateSourceForPrompt(x = {}, { includeCleanText = true } = {}) {
  return {
    source_id: x.source_id,
    candidate_source_id: x.candidate_source_id,
    source_url: x.source_url,
    canonical_url: x.canonical_url,
    root_cluster_id: x.root_cluster_id,
    root_cluster_type: x.root_cluster_type,
    source_kind: x.source_kind,
    scope_class: x.scope_class,
    priority: x.priority,
    source_family_hint: x.source_family_hint,
    discovery_methods: x.discovery_methods || [],
    fetch_status: x.fetch_status,
    http_status: x.http_status,
    fetch_method: x.fetch_method,
    fetched_at: x.fetched_at,
    content_hash: x.content_hash,
    normalized_text_hash: x.normalized_text_hash,
    clean_text_ref: x.clean_text_ref,
    ...(includeCleanText ? { clean_text: x.clean_text || "" } : {}),
    clean_char_count: x.clean_char_count,
    char_count: x.char_count,
    word_count: x.word_count,
    extraction_quality: x.extraction_quality,
    snippet_only: Boolean(x.snippet_only),
    phase1_admission_forbidden: Boolean(x.phase1_admission_forbidden),
    requires_phase1_admission: x.requires_phase1_admission !== false,
    requires_phase1_limitation_review: Boolean(x.requires_phase1_limitation_review),
    custody_status: x.custody_status,
    collection_notes: x.collection_notes || []
  };
}

function buildOrchestrationManifest({ run, promptStack, completedNodes, failedNode, referenceBundles = {}, modelMetaByPhase = {} }) {
  return {
    run_id: run.run_id,
    source_mode: run.source_mode,
    active_node: failedNode,
    completed_nodes: completedNodes,
    blocked_nodes: failedNode ? promptStack.phases.map((phase) => phase.node_id).filter((node) => !completedNodes.includes(node)) : [],
    node_execution_records: promptStack.execution_nodes.map((node) => ({ node_id: node.node_id, file: node.file, status: completedNodes.includes(node.node_id) ? "LOCKED" : failedNode === node.node_id ? "CONTROLLED_FAILURE" : node.node_id === "RENDERER" ? "PENDING" : "SKIPPED", inputs_received: [], outputs_emitted: [], lock_gates_passed: [], lock_gates_failed: [] })),
    pool_execution_records: promptStack.phases.map((phase) => {
      const meta = modelMetaByPhase[phase.node_id] || {};
      return {
        node_id: phase.node_id,
        primary_pool: [phase.pool],
        actual_pool_used: meta.pool_name ? [meta.pool_name] : [],
        fallback_used: Boolean(meta.fallback_used),
        fallback_reason: meta.fallback_reason || null,
        search_allowed: false,
        grounding_allowed: Boolean(meta.grounding_requested),
        runtime_model_ref: meta.model || null,
        runtime_key_pool_ref: phase.pool,
        model_execution_record: meta
      };
    }),
    reference_execution_records: summarizeReferenceBundles(referenceBundles),
    handoff_chain_status: failedNode ? "PARTIAL" : "COMPLETE",
    ledger_chain_status: failedNode ? "PARTIAL" : "COMPLETE",
    artifact_access_status: "VALID",
    repair_events: [],
    controlled_failures: failedNode ? [failedNode] : [],
    final_readiness: failedNode ? "CONTROLLED_FAILURE" : "READY_FOR_RENDER"
  };
}

function createRuntimeTrace({ run, activeRuntime, enabled }) {
  if (!enabled) return null;
  return {
    run_id: run.run_id,
    started_at: nowIso(),
    ended_at: null,
    active_runtime: activeRuntime,
    events: [],
    stages: {},
    gates: {},
    models: {},
    operational_limits: buildOperationalLimits(),
    p6: {
      route_plan_summary: null,
      model_batch_plan: [],
      batch_coverage_validation: null,
      batch_results_summary: []
    },
    artifacts: []
  };
}

function buildOperationalLimits(overrides = {}) {
  const source = overrides.source || overrides;

  return {
    gemini_timeout_ms: positiveInt(process.env.GEMINI_TIMEOUT_MS, DEFAULT_GEMINI_TIMEOUT_MS),
    gemini_max_output_tokens: positiveInt(process.env.GEMINI_MAX_OUTPUT_TOKENS, DEFAULT_GEMINI_MAX_OUTPUT_TOKENS),
    express_json_limit: process.env.EXPRESS_JSON_LIMIT || EXPRESS_JSON_LIMIT,

    source_max_candidates_used: Number(
      source.source_max_candidates_used ??
      source.max_candidate_sources_used ??
      process.env.SOURCE_MAX_CANDIDATES ??
      process.env.DILIGENCE_SOURCE_MAX_URLS ??
      SOURCE_MAX_CANDIDATES_DEFAULT
    ),

    source_fetch_timeout_ms_used: Number(
      source.source_fetch_timeout_ms_used ??
      source.fetch_timeout_ms_used ??
      process.env.SOURCE_FETCH_TIMEOUT_MS ??
      process.env.DILIGENCE_SOURCE_FETCH_TIMEOUT_MS ??
      SOURCE_FETCH_TIMEOUT_MS_DEFAULT
    ),

    source_candidate_limit_hit: Boolean(
      source.source_candidate_limit_hit ??
      source.candidate_limit_hit ??
      false
    ),

    source_max_extraction_passes: SOURCE_MAX_EXTRACTION_PASSES,
    p6_model_batch_size: P6_MODEL_BATCH_SIZE,
    cloud_run_timeout_assumption: `${CLOUD_RUN_TIMEOUT_ASSUMPTION_SECONDS}s`,

    reference_max_chars_if_any: positiveInt(process.env.DILIGENCE_REFERENCE_MAX_CHARS, 0) || null
  };
}

function updateRuntimeTraceSourceLimits(trace, stage0) {
  if (!trace) return;

  const manifest = stage0?.hybrid_extraction_manifest || {};
  const summary = manifest.collection_summary || {};
  const sourceTrace =
    manifest.source_runtime_trace ||
    manifest.runtime_limits ||
    summary ||
    {};

  trace.operational_limits = buildOperationalLimits({
    source: {
      source_max_candidates_used:
        sourceTrace.source_max_candidates_used ??
        summary.source_max_candidates_used,

      source_fetch_timeout_ms_used:
        sourceTrace.source_fetch_timeout_ms_used ??
        summary.source_fetch_timeout_ms_used,

      source_candidate_limit_hit:
        sourceTrace.source_candidate_limit_hit ??
        summary.source_candidate_limit_hit
    }
  });

  trace.source_runtime_trace = {
    source_max_candidates_used: trace.operational_limits.source_max_candidates_used,
    source_fetch_timeout_ms_used: trace.operational_limits.source_fetch_timeout_ms_used,
    source_candidate_limit_hit: trace.operational_limits.source_candidate_limit_hit,

    source_candidate_count:
      sourceTrace.source_candidate_count ??
      summary.discovered_candidate_count ??
      summary.source_candidate_count ??
      null,

    source_fetch_queue_count:
      sourceTrace.source_fetch_queue_count ??
      summary.fetch_queue_count ??
      null,

    source_deferred_count:
      sourceTrace.source_deferred_count ??
      summary.deferred_count ??
      null,

    fetch_failure_count:
      sourceTrace.fetch_failure_count ??
      summary.fetch_failure_count ??
      null,

    fetch_timeout_failure_count:
      sourceTrace.fetch_timeout_failure_count ??
      null
  };
}

function startStage(trace, nodeId, input) {
  if (!trace) return null;
  const startedAt = nowIso();
  trace.stages[nodeId] = {
    node_id: nodeId,
    status: "RUNNING",
    started_at: startedAt,
    ended_at: null,
    duration_ms: null,
    input_shape: compactShape(input),
    output_top_level_keys: [],
    validation: null,
    model_meta: null
  };
  traceEvent(trace, { type: "stage", node_id: nodeId, status: "RUNNING", summary: `${nodeId} started` });
  return { nodeId, startedAt };
}

function finishStage(trace, stage, { output, validation, modelMeta, counts, summary }) {
  if (!trace || !stage) return;
  const record = trace.stages[stage.nodeId] || {};
  record.status = "OK";
  record.ended_at = nowIso();
  record.duration_ms = durationSince(stage.startedAt);
  record.output_top_level_keys = topLevelKeys(output);
  record.validation = compactValidation(validation);
  record.model_meta = modelMeta || null;
  trace.stages[stage.nodeId] = record;
  traceEvent(trace, { type: "stage", node_id: stage.nodeId, status: "OK", summary: summary || `${stage.nodeId} completed`, duration_ms: record.duration_ms, counts, warnings: record.validation?.warnings || [] });
}

function failStage(trace, stage, error, summary) {
  if (!trace || !stage) return;
  const record = trace.stages[stage.nodeId] || {};
  record.status = "FAILED";
  record.ended_at = nowIso();
  record.duration_ms = durationSince(stage.startedAt);
  record.validation = { ok: false, errors: arrayify(error), warnings: [] };
  trace.stages[stage.nodeId] = record;
  traceEvent(trace, { type: "stage", node_id: stage.nodeId, status: "FAILED", summary: summary || `${stage.nodeId} failed`, duration_ms: record.duration_ms, errors: arrayify(error) });
}

function traceEvent(trace, event) {
  if (!trace) return;
  trace.events.push({
    at: event.at || nowIso(),
    type: event.type || "runtime",
    node_id: event.node_id || null,
    status: event.status || null,
    summary: event.summary || "",
    duration_ms: event.duration_ms ?? null,
    counts: event.counts || {},
    warnings: event.warnings || [],
    errors: event.errors || []
  });
}

function traceGate(trace, gateId, validation) {
  if (!trace || !validation) return;
  const compact = compactValidation(validation);
  trace.gates[gateId] = compact;
  traceEvent(trace, { type: "gate", node_id: gateId, status: compact.ok ? "OK" : "FAILED", summary: `${gateId} ${compact.ok ? "passed" : "failed"}`, errors: compact.errors, warnings: compact.warnings });
}

function traceModel(trace, nodeId, modelMeta) {
  if (!trace || !modelMeta) return;
  trace.models[nodeId] = modelMeta;
}

function stopTrace(trace) {
  if (trace && !trace.ended_at) trace.ended_at = nowIso();
  return trace;
}

function stoppedResponse({ run, promptStack, runtimeTrace, upstream = {}, phaseOutputs = {}, referenceBundles = {}, mechanicalValidations = {}, completedNodes = [], modelMetaByPhase = {}, parseRepairTraces = {}, status, nextNode }) {
  const response = {
    ok: true,
    mode: ACTIVE_RUNTIME,
    status,
    run_id: run.run_id,
    target_url: run.target_url,
    company_name: run.company_name,
    source_mode: run.source_mode,
    completed_nodes: completedNodes,
    prompt_stack: promptStack?.manifest || [],
    reference_bundles: summarizeReferenceBundles(referenceBundles),
    mechanical_validations: mechanicalValidations,
    phase_outputs: phaseOutputs,
    hybrid_extraction_manifest: upstream?.S0 ? compactStage0ForPrompt(upstream.S0, { includeCleanText: false }) : null,
    runtime_orchestration_manifest: promptStack ? buildOrchestrationManifest({ run, promptStack, completedNodes, failedNode: null, referenceBundles, modelMetaByPhase }) : null,
    phase_stack: { completed_nodes: completedNodes, failed_node: null, next_node: nextNode || null },
    model_meta_by_phase: modelMetaByPhase,
    ...(hasEntries(parseRepairTraces) ? { parse_repair_trace: parseRepairTraces } : {}),
    ...flatten(phaseOutputs)
  };
  return withObservability(response, { runtimeTrace, upstream, phaseOutputs, mechanicalValidations, modelMetaByPhase, debugTrace: true });
}

function withObservability(response, { runtimeTrace, upstream, phaseOutputs, mechanicalValidations, modelMetaByPhase, debugTrace }) {
  const enriched = {
    ...response,
    completed_nodes: response.completed_nodes || response.phase_stack?.completed_nodes || [],
    phase_top_level_presence: buildPhaseTopLevelPresence(phaseOutputs),
    s0_counts: getS0Counts(upstream?.S0),
    mechanical_validations: mechanicalValidations,
    model_meta_by_phase: modelMetaByPhase
  };
  if (debugTrace && runtimeTrace) enriched.runtime_trace = stopTrace(runtimeTrace);
  return enriched;
}

function buildPhaseTopLevelPresence(phaseOutputs = {}) {
  return Object.fromEntries(Object.entries(phaseOutputs || {}).map(([phaseId, value]) => [phaseId, topLevelKeys(value)]));
}

function getS0Counts(stage0 = {}) {
  const manifest = stage0?.hybrid_extraction_manifest || {};
  return {
    candidate_sources: Array.isArray(manifest.candidate_sources) ? manifest.candidate_sources.length : 0,
    fetch_failures: Array.isArray(manifest.fetch_failures) ? manifest.fetch_failures.length : 0,
    deferred_candidates: Array.isArray(manifest.deferred_candidates) ? manifest.deferred_candidates.length : 0,
    rejected_by_scope: Array.isArray(manifest.rejected_by_scope) ? manifest.rejected_by_scope.length : 0
  };
}

function compactShape(value) {
  if (Array.isArray(value)) return { type: "array", length: value.length };
  if (!value || typeof value !== "object") return { type: typeof value };
  return {
    type: "object",
    top_level_keys: Object.keys(value),
    array_counts: Object.fromEntries(Object.entries(value).filter(([, item]) => Array.isArray(item)).map(([key, item]) => [key, item.length]))
  };
}

function compactValidation(validation = {}) {
  return {
    ok: Boolean(validation?.ok),
    phase_id: validation?.phase_id || validation?.edge || null,
    errors: validation?.errors || [],
    warnings: validation?.warnings || [],
    mechanical_only: validation?.mechanical_only ?? true,
    counts: {
      expected_registry_row_count: validation?.expected_registry_row_count,
      model_routed_row_count: validation?.model_routed_row_count,
      deterministic_not_applicable_row_count: validation?.deterministic_not_applicable_row_count,
      merged_registry_ledger_count: validation?.merged_registry_ledger_count
    }
  };
}

function compactP6ModelBatchPlan(modelBatches = []) {
  return modelBatches.map((batch) => ({
    batch_id: batch.batch_id,
    batch_number: batch.batch_number,
    batch_count: batch.batch_count,
    expected_registry_row_ids: batch.expected_registry_row_ids,
    registry_row_count: batch.expected_registry_row_ids.length
  }));
}

function normalizeRunUntil(value) {
  const normalized = String(value || "").trim().toUpperCase();
  if (/^P6_BATCH_\d{1,3}$/.test(normalized)) return normalizeP6BatchId(normalized);
  return RUN_UNTIL_VALUES.has(normalized) ? normalized : null;
}

function shouldStopAt(runUntil, nodeId) {
  return Boolean(runUntil && runUntil === nodeId);
}

function nextNodeAfter(nodeId) {
  return {
    S0: "P1",
    P1: "P2",
    P2: "P3",
    P3: "P4",
    P4: "P5",
    P5: "P6",
    P6: "P7",
    P7: "RENDERER",
    RENDERER: null
  }[nodeId] || null;
}

function nowIso() {
  return new Date().toISOString();
}

function durationSince(startedAt) {
  return Math.max(0, Date.now() - Date.parse(startedAt || nowIso()));
}

function topLevelKeys(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? Object.keys(value) : [];
}

function positiveInt(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function arrayify(value) {
  if (Array.isArray(value)) return value.map(String);
  if (value instanceof Error) return [value.message];
  if (value === undefined || value === null) return [];
  return [String(value)];
}

function fail({ run, promptStack, runtimeTrace = null, upstream = {}, phaseOutputs = {}, referenceBundles = {}, mechanicalValidations = {}, completedNodes = [], modelMetaByPhase = {}, parseRepairTraces = {}, status, failedNode, error, lastModelMeta = null }) {
  const response = {
    ok: false,
    mode: ACTIVE_RUNTIME,
    status,
    run_id: run.run_id,
    target_url: run.target_url,
    company_name: run.company_name,
    source_mode: run.source_mode,
    prompt_stack: promptStack?.manifest || [],
    reference_bundles: summarizeReferenceBundles(referenceBundles),
    mechanical_validations: mechanicalValidations,
    phase_outputs: phaseOutputs,
    hybrid_extraction_manifest: upstream?.S0 ? compactStage0ForPrompt(upstream.S0, { includeCleanText: false }) : null,
    extraction_forensic_ledger: upstream?.S0?.extraction_forensic_ledger ? {
      redacted_for_failure_response: true,
      ledger_event_count: upstream.S0.extraction_forensic_ledger?.ledger_events?.length || 0,
      retry_log_count: upstream.S0.extraction_forensic_ledger?.retry_log?.length || 0,
      fetch_attempt_log_count: upstream.S0.extraction_forensic_ledger?.fetch_attempt_log?.length || 0
    } : null,
    runtime_orchestration_manifest: promptStack ? buildOrchestrationManifest({ run, promptStack, completedNodes, failedNode, referenceBundles, modelMetaByPhase }) : null,
    operational_limits: runtimeTrace?.operational_limits || buildOperationalLimits(),
    source_runtime_trace: runtimeTrace?.source_runtime_trace || null,
    phase_stack: { completed_nodes: completedNodes, failed_node: failedNode, next_node: `${failedNode}_RETRY_OR_PROMPT_REPAIR` },
    error,
    model_meta_last: lastModelMeta,
    model_meta_by_phase: modelMetaByPhase,
    ...(hasEntries(parseRepairTraces) ? { parse_repair_trace: parseRepairTraces } : {}),
    ...flatten(phaseOutputs)
  };
  response.compact_failure = buildCompactFailureObject({
  response,
  upstream,
  phaseOutputs,
  mechanicalValidations,
  modelMetaByPhase
});

const renderedFailureResponse = attachRendererArtifacts(response, {
  run,
  phaseOutputs,
  upstream,
  mechanicalValidations,
  runtimeTrace
});

return withObservability(renderedFailureResponse, {
  runtimeTrace,
  upstream,
  phaseOutputs,
  mechanicalValidations,
  modelMetaByPhase,
  debugTrace: Boolean(runtimeTrace)
});
}

export function validateTransitionGate({ edge, upstream = {}, referenceBundles = {} } = {}) {
  const errors = [];
  const requirePath = (pathExpression) => {
    const value = getPath(upstream, pathExpression);
    if (value === undefined || value === null) errors.push(`TRANSITION_GATE_MISSING:${edge}:${pathExpression}`);
    return value;
  };
  const requireArray = (pathExpression) => {
    const value = requirePath(pathExpression);
    if (value !== undefined && !Array.isArray(value)) errors.push(`TRANSITION_GATE_NOT_ARRAY:${edge}:${pathExpression}`);
  };
  const requireOneOf = (paths) => {
    if (!paths.some((pathExpression) => getPath(upstream, pathExpression) !== undefined && getPath(upstream, pathExpression) !== null)) {
      errors.push(`TRANSITION_GATE_ONE_OF_MISSING:${edge}:${paths.join("|")}`);
    }
  };

  if (edge === "S0_to_P1") {
    requirePath("S0.hybrid_extraction_manifest");
    requireArray("S0.hybrid_extraction_manifest.candidate_sources");
    requirePath("S0.extraction_forensic_ledger");
  } else if (edge === "P1_to_P2") {
    requirePath("P1.source_discovery_handoff");
    requirePath("P1.source_discovery_handoff.phase_packages.target_profile_package");
    requirePath("P1.source_discovery_handoff.phase_packages.final_source_coverage_package");
    requirePath("P1.source_discovery_forensic_ledger");
    requirePath("P1.source_discovery_trace");
  } else if (edge === "P2_to_P3") {
    requirePath("P2.target_profile");
    requirePath("P2.target_profile_forensic_ledger");
    requirePath("P2.target_profile_trace");
    requirePath("P1.source_discovery_handoff.phase_packages.feature_profile_package");
  } else if (edge === "P3_to_P4") {
    requirePath("P2.target_profile");
    requirePath("P3.target_feature_profile");
    requirePath("P3.feature_profile_forensic_ledger");
    requirePath("P3.feature_function_trace");
    requirePath("P1.source_discovery_handoff.phase_packages.legal_cartography_package");
    requirePath("P1.source_discovery_handoff.absence_records");
    requirePath("P1.source_discovery_handoff.access_failed_sources");
  } else if (edge === "P4_to_P5") {
    requirePath("P2.target_profile");
    requirePath("P3.target_feature_profile");
    requirePath("P4.legal_cartography_index");
    requirePath("P4.legal_cartography_forensic_ledger");
    requirePath("P4.legal_cartography_trace");
    requirePath("P1.source_discovery_handoff.phase_packages.data_provenance_package");
  } else if (edge === "P5_to_P6") {
    requirePath("P2.target_profile");
    requirePath("P3.target_feature_profile");
    requirePath("P4.legal_cartography_index");
    requirePath("P5.target_data_provenance_profile");
    requirePath("P5.data_provenance_forensic_ledger");
    requirePath("P5.data_provenance_trace");
    requirePath("P1.source_discovery_handoff.phase_packages.registry_support_package");
    requireReference(referenceBundles.P6, "REGISTRY_KEY_v3_0.md", errors, edge);
    requireReference(referenceBundles.P6, "AI_THREAT_REGISTRY", errors, edge);
  } else if (edge === "P6_to_P7") {
    requirePath("P2.target_profile");
    requirePath("P3.target_feature_profile");
    requirePath("P4.legal_cartography_index");
    requirePath("P5.target_data_provenance_profile");
    requirePath("P6.target_exposure_profile");
    requireArray("P6.target_exposure_profile.registry_ledger");
    requirePath("P6.exposure_profile_forensic_ledger");
    requirePath("P6.registry_evaluation_trace");
  } else if (edge === "P7_to_RENDERER") {
  requirePath("P7.final_output_handoff");
  requirePath("P7.final_output_forensic_ledger");
  requirePath("P7.final_compiler_trace");
  requirePath("P7.final_output_handoff.screen_report_payload");
  requirePath("P7.final_output_handoff.screen_report_payload.renderer_contract");
  } else {
    errors.push(`UNKNOWN_TRANSITION_GATE:${edge}`);
  }

  return {
    ok: errors.length === 0,
    edge,
    errors,
    mechanical_only: true
  };
}

function buildJsonRepairUserPrompt({ phase, originalParseError, rawText }) {
  return JSON.stringify({
    phase_id: phase.node_id,
    required_top_level_keys: phase.required_top_level_keys || getRequiredKeysForPhase(phase.node_id),
    original_parse_error: originalParseError,
    malformed_output_text: rawText
  }, null, 2);
}

function inboundTransitionForPhase(phaseId) {
  return {
    P1: "S0_to_P1",
    P2: "P1_to_P2",
    P3: "P2_to_P3",
    P4: "P3_to_P4",
    P5: "P4_to_P5",
    P6: "P5_to_P6",
    P7: "P6_to_P7"
  }[phaseId] || null;
}

function compactModelMeta(meta, phase) {
  const source = meta && typeof meta === "object" ? meta : {};
  return {
    phase_id: source.phase_id || phase?.node_id || null,
    pool_name: source.pool_name || phase?.pool || null,
    model: source.model || null,
    model_index: source.model_index ?? null,
    key_index: source.key_index ?? null,
    key_fingerprint: source.key_fingerprint || null,
    latency_ms: source.latency_ms ?? null,
    grounding_requested: source.grounding_requested ?? null,
    fallback_used: source.fallback_used ?? Boolean((source.model_index && source.model_index > 1) || (source.key_index && source.key_index > 1)),
    fallback_reason: source.fallback_reason || null
  };
}

function buildCompactFailureObject({ response, upstream, phaseOutputs, mechanicalValidations, modelMetaByPhase }) {
  const s0 = upstream?.S0?.hybrid_extraction_manifest || {};
  const repairTrace = response.parse_repair_trace?.[response.phase_stack?.failed_node];
  return {
    ok: false,
    status: response.status,
    failed_node: response.phase_stack?.failed_node || null,
    completed_nodes: response.phase_stack?.completed_nodes || [],
    error: response.error,
    ...(repairTrace ? {
      original_parse_error: repairTrace.original_parse_error,
      repair_attempted: repairTrace.repair_attempted,
      repair_succeeded: repairTrace.repair_succeeded,
      repair_error: repairTrace.repair_error || null,
      parse_repair_trace: response.parse_repair_trace
    } : {}),
    mechanical_validations: summarizeMechanicalValidations(mechanicalValidations),
    model_meta_by_phase: modelMetaByPhase,
    s0_counts: {
      candidate_sources: Array.isArray(s0.candidate_sources) ? s0.candidate_sources.length : 0,
      fetch_failures: Array.isArray(s0.fetch_failures) ? s0.fetch_failures.length : 0,
      deferred_candidates: Array.isArray(s0.deferred_candidates) ? s0.deferred_candidates.length : 0,
      rejected_by_scope: Array.isArray(s0.rejected_by_scope) ? s0.rejected_by_scope.length : 0
    },
    phase_top_level_presence: Object.fromEntries(Object.entries(phaseOutputs || {}).map(([phaseId, value]) => [
      phaseId,
      value && typeof value === "object" && !Array.isArray(value) ? Object.keys(value) : []
    ]))
  };
}

function attachRendererArtifacts(response, {
  run,
  phaseOutputs = {},
  upstream = {},
  mechanicalValidations = {},
  runtimeTrace = null
} = {}) {
  try {
    const rendererResult = renderDiligenceReport({
      run,
      phaseOutputs,
      upstream,
      mechanicalValidations,
      runtimeTrace,
      response
    });

    return {
      ...response,
      renderer_output: rendererResult.renderer_output,
      renderer_trace: rendererResult.renderer_trace,
      rendered_report: rendererResult.rendered_report,
      html_report: rendererResult.renderer_output?.html_report || rendererResult.rendered_report?.html || null,
      report_json: rendererResult.renderer_output?.report_json || rendererResult.rendered_report?.report_json || null
    };
  } catch (err) {
    return {
      ...response,
      renderer_output: {
        renderer_version: "deterministic_html_renderer_v1",
        render_status: "RENDERER_FAILED_DURING_FAILURE_RENDER",
        report_title: "Diligence Run Failed",
        html_report: null,
        plain_text_summary: `Renderer failed while building controlled failure report: ${err?.message || String(err)}`,
        report_json: null,
        export_payload: {
          artifact_type: "renderer_failure",
          html_report_present: false,
          report_json_present: false
        },
        download_artifacts: []
      },
      renderer_trace: {
        renderer_version: "deterministic_html_renderer_v1",
        render_mode: "FAILURE_RENDER",
        errors: [err?.message || String(err)],
        warnings: ["RENDERER_FAILED_WHILE_RENDERING_FAILURE_RESPONSE"]
      },
      html_report: null,
      report_json: null
    };
  }
}

function summarizeMechanicalValidations(validations = {}) {
  return Object.fromEntries(Object.entries(validations).map(([key, validation]) => [
    key,
    {
      ok: Boolean(validation?.ok),
      errors: validation?.errors || [],
      warnings: validation?.warnings || []
    }
  ]));
}

function requireReference(bundle, name, errors, edge) {
  const loadedNames = new Set((bundle?.references || []).map((ref) => ref.name));
  if (!loadedNames.has(name)) errors.push(`TRANSITION_GATE_REFERENCE_MISSING:${edge}:${name}`);
}

function getPath(root, pathExpression) {
  return String(pathExpression || "").split(".").reduce((value, key) => {
    if (value === undefined || value === null) return undefined;
    return value[key];
  }, root);
}

function normalizeInput(input) {
  return {
    run_id: String(input.run_id || input.runId || createRunId()).trim(),
    source_mode: String(input.source_mode || input.sourceMode || "text").trim(),
    target_url: String(input.target_url || input.targetUrl || "").trim(),
    company_name: String(input.company_name || input.companyName || "").trim(),
    pasted_public_material: String(input.pasted_public_material || input.pastedPublicMaterial || "").trim(),
    max_candidate_sources: input.max_candidate_sources || input.maxCandidateSources,
    fetch_timeout_ms: input.fetch_timeout_ms || input.fetchTimeoutMs,

    source_max_candidates: input.source_max_candidates || input.sourceMaxCandidates,
    source_fetch_timeout_ms: input.source_fetch_timeout_ms || input.sourceFetchTimeoutMs,

    runtime_limits: input.runtime_limits || input.runtimeLimits || {},

    debug_trace: toBoolean(input.debug_trace ?? input.debugTrace),
    debug_raw: toBoolean(input.debug_raw ?? input.debugRaw),
    debug_compact: toBoolean(input.debug_compact ?? input.debugCompact),

    run_until: String(input.run_until || input.runUntil || "").trim(),
    p6_batch_number: input.p6_batch_number || input.p6BatchNumber,
    p6_batch_id: String(input.p6_batch_id || input.p6BatchId || "").trim()
  };
}

function toBoolean(value) {
  if (value === true) return true;
  if (value === false || value === undefined || value === null) return false;
  return ["1", "true", "yes", "on"].includes(String(value).trim().toLowerCase());
}

function extractExecutionNodes(text) {
  const nodes = [];
  const lines = String(text || "").split(/\r?\n/);
  let current = null;
  for (const line of lines) {
    const node = line.match(/^\s*-\s+node_id:\s*([A-Za-z0-9_]+)/);
    if (node) {
      if (current) nodes.push(current);
      current = { node_id: node[1], order: null, file: null, type: null, pool: "repair" };
      continue;
    }
    if (!current) continue;
    const order = line.match(/^\s+order:\s*(\d+)/);
    if (order) current.order = Number(order[1]);
    const file = line.match(/^\s+file:\s*([^\s]+)/);
    if (file) current.file = file[1].trim();
    const type = line.match(/^\s+type:\s*([^\s]+)/);
    if (type) current.type = type[1].trim();
    const pool = line.match(/^\s+pool:\s*\{\s*primary:\s*\[([^\]]*)\]/);
    if (pool) current.pool = pool[1].split(",").map((item) => item.trim()).filter(Boolean)[0] || "repair";
  }
  if (current) nodes.push(current);
  return nodes.sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
}

export function extractRequiredTopLevelKeys(text) {
  const keys = new Set();
  const marker = String(text || "").match(/required_top_level_output_keys\s*:\s*([\s\S]{0,600})/i);
  if (marker) for (const match of marker[1].matchAll(/-\s*`?([A-Za-z0-9_]+)`?/g)) keys.add(match[1]);
  const primary = String(text || "").match(/primary_output(?:_object)?\s*:\s*`?([A-Za-z0-9_]+)`?/i);
  if (keys.size === 0 && primary) keys.add(primary[1]);
  const primaryMd = String(text || "").match(/\*\*Primary Output:\*\*\s*`([^`]+)`/i);
  if (keys.size === 0 && primaryMd) keys.add(primaryMd[1]);
  const handoff = String(text || "").match(/\*\*Output handoff:\*\*\s*`([^`]+)`/i);
  if (keys.size === 0 && handoff) keys.add(handoff[1]);
  return Array.from(keys);
}

function getRequiredKeysForPhase(nodeId) {
  return [...(REQUIRED_KEYS_BY_PHASE[nodeId] || [])];
}

function stripCoreReferences(bundle) {
  const core = new Set(CORE_PROMPT_FILES);
  return { ...(bundle || {}), references: (bundle?.references || []).filter((ref) => !core.has(ref.name)) };
}

function summarizeReferenceBundles(bundles = {}) {
  return Object.fromEntries(Object.entries(bundles).map(([phaseId, bundle]) => [phaseId, { ok: bundle.ok, missing_references: bundle.missing_references, reference_manifest: bundle.reference_manifest }]));
}

function flatten(outputs) {
  const out = {};
  for (const value of Object.values(outputs || {})) if (value && typeof value === "object" && !Array.isArray(value)) Object.assign(out, value);
  return out;
}

function hasEntries(value) {
  return value && typeof value === "object" && Object.keys(value).length > 0;
}

async function readFileSafe(baseDir, file, missingFiles) {
  try { return await fs.readFile(path.join(baseDir, file), "utf8"); }
  catch { missingFiles.push(file); return ""; }
}

function createRunId() {
  return `run_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
}
