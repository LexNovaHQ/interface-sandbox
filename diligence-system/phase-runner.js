import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { parseJsonObject, validateMechanicalPhaseOutput, validatePromptStackReadiness } from "./mechanical-output-validator.js";

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

export async function loadPromptStack(baseDir = BASE_DIR) {
  const missingFiles = [];
  const core = {};

  for (const file of CORE_PROMPT_FILES) core[file] = await readFileSafe(baseDir, file, missingFiles);

  const executionNodes = extractExecutionNodes(core[EXECUTION_MAP_FILE]);
  const phaseNodes = executionNodes.filter((node) => node.type === "model_phase");
  const phases = [];

  for (const node of phaseNodes) {
    const prompt = await readFileSafe(baseDir, node.file, missingFiles);
    phases.push({
      ...node,
      prompt,
      required_top_level_keys: extractRequiredTopLevelKeys(prompt)
    });
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
      ...executionNodes.map((node) => ({ kind: node.type, node_id: node.node_id, order: node.order, file: node.file, pool: node.pool, present: node.type === "model_phase" ? Boolean(phases.find((phase) => phase.node_id === node.node_id)?.prompt) : Boolean(core[node.file] || node.file === "deterministic_renderer") })),
      ...phases.map((phase) => ({ kind: "phase_prompt", node_id: phase.node_id, file: phase.file, required_top_level_keys: phase.required_top_level_keys }))
    ]
  };
}

export async function runPhaseStack({ input = {}, callModel, baseDir = BASE_DIR } = {}) {
  if (typeof callModel !== "function") throw new Error("CALL_MODEL_FUNCTION_REQUIRED");

  const run = normalizeInput(input);
  const promptStack = await loadPromptStack(baseDir);
  if (!promptStack.ok) return fail({ run, promptStack, status: "PROMPT_STACK_NOT_READY", failedNode: "PROMPT_STACK", error: promptStack.errors.join(";") });

  const stage0 = buildStage0(run);
  const upstream = { S0: stage0 };
  const phaseOutputs = {};
  const mechanicalValidations = { S0: { ok: true, phase_id: "S0", errors: [], mechanical_only: true } };
  const completedNodes = ["S0"];
  let lastModelMeta = null;

  for (const phase of promptStack.phases) {
    const payload = buildPayload({ run, promptStack, phase, upstream });
    let modelResult;
    try {
      modelResult = await callModel({
        phaseId: phase.node_id,
        poolName: phase.pool,
        systemPrompt: payload.systemPrompt,
        userPrompt: payload.userPrompt,
        responseMimeType: "application/json",
        temperature: 0,
        allowGrounding: false
      });
    } catch (err) {
      return fail({ run, promptStack, upstream, phaseOutputs, mechanicalValidations, completedNodes, status: `${phase.node_id}_MODEL_CALL_FAILED`, failedNode: phase.node_id, error: err?.message || String(err), lastModelMeta });
    }

    lastModelMeta = modelResult?.meta || modelResult || null;
    const rawText = String(modelResult?.text || "");
    const parsed = parseJsonObject(rawText);
    if (!parsed.ok) {
      mechanicalValidations[phase.node_id] = { ok: false, phase_id: phase.node_id, errors: [parsed.error], mechanical_only: true };
      return fail({ run, promptStack, upstream, phaseOutputs, mechanicalValidations, completedNodes, status: `${phase.node_id}_JSON_PARSE_FAILED`, failedNode: phase.node_id, error: parsed.error, lastModelMeta });
    }

    const validation = validateMechanicalPhaseOutput({ phaseId: phase.node_id, rawText, parsed: parsed.parsed, requiredTopLevelKeys: phase.required_top_level_keys });
    mechanicalValidations[phase.node_id] = validation;
    if (!validation.ok) {
      return fail({ run, promptStack, upstream, phaseOutputs, mechanicalValidations, completedNodes, status: `${phase.node_id}_MECHANICAL_VALIDATION_FAILED`, failedNode: phase.node_id, error: validation.errors.join(";"), lastModelMeta });
    }

    phaseOutputs[phase.node_id] = parsed.parsed;
    upstream[phase.node_id] = parsed.parsed;
    completedNodes.push(phase.node_id);
  }

  return {
    ok: true,
    mode: "phase_stack_prompt_supremacy",
    status: "PHASE_STACK_COMPLETE",
    run_id: run.run_id,
    target_url: run.target_url,
    company_name: run.company_name,
    source_mode: run.source_mode,
    prompt_stack: promptStack.manifest,
    mechanical_validations: mechanicalValidations,
    phase_outputs: phaseOutputs,
    hybrid_extraction_manifest: stage0.hybrid_extraction_manifest,
    extraction_forensic_ledger: stage0.extraction_forensic_ledger,
    runtime_orchestration_manifest: buildOrchestrationManifest({ run, promptStack, completedNodes, failedNode: null }),
    phase_stack: { completed_nodes: completedNodes, failed_node: null, next_node: "RENDERER" },
    model_meta_last: lastModelMeta,
    ...flatten(phaseOutputs)
  };
}

function buildPayload({ run, promptStack, phase, upstream }) {
  return {
    systemPrompt: [
      promptStack.core["00_RUNTIME_SPINE.md"],
      promptStack.core["00_RUNTIME_SPINE_INDEX.md"],
      promptStack.core["00_SOURCE_EXTRACTION_CONTRACT.md"],
      promptStack.core["08_PHASE_STACK_EXECUTION_MAP.md"],
      promptStack.core["09_OUTPUT_HANDOFF_CONTRACT.md"],
      promptStack.core["10_RUNTIME_AUDIT_CHECKLIST.md"],
      phase.prompt
    ].join("\n\n"),
    userPrompt: JSON.stringify({
      run_context: { run_id: run.run_id, target_url: run.target_url, company_name: run.company_name, source_mode: run.source_mode },
      upstream_outputs: upstream,
      current_node: phase.node_id,
      current_prompt_file: phase.file
    }, null, 2)
  };
}

function buildStage0(run) {
  const text = run.pasted_public_material;
  const candidate_sources = text ? [{
    source_id: "S0_CAND_001",
    source_url: run.target_url || "PASTED_PUBLIC_MATERIAL",
    source_kind: run.source_mode === "synthetic_demo" ? "synthetic_demo_material" : "user_supplied_public_material",
    clean_text: text,
    char_count: text.length,
    custody_status: "candidate_only_pending_phase_1_admission"
  }] : [];

  return {
    hybrid_extraction_manifest: {
      node_id: "S0",
      source_mode: run.source_mode,
      target_url: run.target_url || "N/A",
      company_name: run.company_name || "N/A",
      candidate_sources,
      artifact_store_manifest: candidate_sources.map((item) => ({ source_id: item.source_id, source_url: item.source_url, source_kind: item.source_kind, char_count: item.char_count }))
    },
    extraction_forensic_ledger: {
      node_id: "S0",
      run_id: run.run_id,
      source_mode: run.source_mode,
      candidate_count: candidate_sources.length,
      controlled_limitations: candidate_sources.length ? [] : ["NO_CANDIDATE_SOURCE_MATERIAL_SUPPLIED"]
    }
  };
}

function buildOrchestrationManifest({ run, promptStack, completedNodes, failedNode }) {
  return {
    run_id: run.run_id,
    source_mode: run.source_mode,
    active_node: failedNode,
    completed_nodes: completedNodes,
    blocked_nodes: failedNode ? promptStack.phases.map((phase) => phase.node_id).filter((node) => !completedNodes.includes(node)) : [],
    node_execution_records: promptStack.execution_nodes.map((node) => ({
      node_id: node.node_id,
      file: node.file,
      status: completedNodes.includes(node.node_id) ? "LOCKED" : failedNode === node.node_id ? "CONTROLLED_FAILURE" : node.node_id === "RENDERER" ? "PENDING" : "SKIPPED",
      inputs_received: [],
      outputs_emitted: [],
      lock_gates_passed: [],
      lock_gates_failed: []
    })),
    pool_execution_records: promptStack.phases.map((phase) => ({
      node_id: phase.node_id,
      primary_pool: [phase.pool],
      actual_pool_used: [],
      fallback_used: false,
      fallback_reason: null,
      search_allowed: false,
      grounding_allowed: false,
      runtime_model_ref: null,
      runtime_key_pool_ref: phase.pool
    })),
    handoff_chain_status: failedNode ? "PARTIAL" : "COMPLETE",
    ledger_chain_status: failedNode ? "PARTIAL" : "COMPLETE",
    artifact_access_status: "VALID",
    repair_events: [],
    controlled_failures: failedNode ? [failedNode] : [],
    final_readiness: failedNode ? "CONTROLLED_FAILURE" : "READY_FOR_RENDER"
  };
}

function fail({ run, promptStack, upstream = {}, phaseOutputs = {}, mechanicalValidations = {}, completedNodes = [], status, failedNode, error, lastModelMeta = null }) {
  return {
    ok: false,
    mode: "phase_stack_prompt_supremacy",
    status,
    run_id: run.run_id,
    target_url: run.target_url,
    company_name: run.company_name,
    source_mode: run.source_mode,
    prompt_stack: promptStack?.manifest || [],
    mechanical_validations: mechanicalValidations,
    phase_outputs: phaseOutputs,
    hybrid_extraction_manifest: upstream?.S0?.hybrid_extraction_manifest || null,
    extraction_forensic_ledger: upstream?.S0?.extraction_forensic_ledger || null,
    runtime_orchestration_manifest: promptStack ? buildOrchestrationManifest({ run, promptStack, completedNodes, failedNode }) : null,
    phase_stack: { completed_nodes: completedNodes, failed_node: failedNode, next_node: `${failedNode}_RETRY_OR_PROMPT_REPAIR` },
    error,
    model_meta_last: lastModelMeta,
    ...flatten(phaseOutputs)
  };
}

function normalizeInput(input) {
  return {
    run_id: String(input.run_id || input.runId || createRunId()).trim(),
    source_mode: String(input.source_mode || input.sourceMode || "text").trim(),
    target_url: String(input.target_url || input.targetUrl || "").trim(),
    company_name: String(input.company_name || input.companyName || "").trim(),
    pasted_public_material: String(input.pasted_public_material || input.pastedPublicMaterial || "").trim()
  };
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

function extractRequiredTopLevelKeys(text) {
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

function flatten(outputs) {
  const out = {};
  for (const value of Object.values(outputs || {})) {
    if (value && typeof value === "object" && !Array.isArray(value)) Object.assign(out, value);
  }
  return out;
}

async function readFileSafe(baseDir, file, missingFiles) {
  try { return await fs.readFile(path.join(baseDir, file), "utf8"); }
  catch (_err) { missingFiles.push(file); return ""; }
}

function createRunId() {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  return `diligence_${stamp}_${Math.random().toString(36).slice(2, 8)}`;
}
