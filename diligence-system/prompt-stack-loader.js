import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REQUIRED_PHASE_STACK_FILES = [
  "00_RUNTIME_SPINE.md",
  "00_RUNTIME_SPINE_INDEX.md",
  "00_SOURCE_EXTRACTION_CONTRACT.md",
  "01_SOURCE_DISCOVERY_EVIDENCE_BOX.md",
  "02_TARGET_PROFILE.md",
  "03_TARGET_FEATURE_PROFILE.md",
  "04_LEGAL_CARTOGRAPHY_INDEX.md",
  "05_TARGET_DATA_PROVENANCE_PROFILE.md",
  "06_EXPOSURE_PROFILE_REGISTRY_LEDGER.md",
  "07_FINAL_OUTPUT_COMPILER_AND_HANDOFF.md",
  "08_PHASE_STACK_EXECUTION_MAP.md",
  "09_OUTPUT_HANDOFF_CONTRACT.md",
  "10_RUNTIME_AUDIT_CHECKLIST.md"
];

const REQUIRED_REFERENCE_FILES = [
  "REGISTRY_KEY_v3_0.md",
  "AI_THREAT_REGISTRY_REGISTRY.csv",
  "VAULT_JS_CANONICAL_MAP_v1.md",
  "INTERFACE_DILIGENCE_CONTRACT_SPINE_v1.md"
];

const OPTIONAL_REFERENCE_FILES = [
  "AI_THREAT_REGISTRY_HUNTER_ENGINE_RULES.csv",
  "README.md"
];

const EXPECTED_NODES = ["S0", "P1", "P2", "P3", "P4", "P5", "P6", "P7", "RENDERER"];
const ALLOWED_POOLS = new Set(["search", "extract", "router", "profile", "registry", "final", "repair"]);

let cachedStack = null;

export function loadPromptStack() {
  if (cachedStack) return cachedStack;

  const stackDir = path.join(__dirname, "prompts", "phase-stack");
  const referenceDir = path.join(__dirname, "reference");
  const phaseStackFiles = {};
  const referenceFiles = {};

  for (const file of REQUIRED_PHASE_STACK_FILES) {
    const filePath = path.join(stackDir, file);
    if (fs.existsSync(filePath)) {
      phaseStackFiles[file] = fs.readFileSync(filePath, "utf8");
    }
  }

  for (const file of [...REQUIRED_REFERENCE_FILES, ...OPTIONAL_REFERENCE_FILES]) {
    const filePath = path.join(referenceDir, file);
    if (fs.existsSync(filePath)) {
      referenceFiles[file] = fs.readFileSync(filePath, "utf8");
    }
  }

  const executionMap = phaseStackFiles["08_PHASE_STACK_EXECUTION_MAP.md"] || "";
  const executionGraph = parseExecutionGraph(executionMap);

  cachedStack = {
    stackDir,
    referenceDir,
    requiredPhaseStackFiles: REQUIRED_PHASE_STACK_FILES,
    requiredReferenceFiles: REQUIRED_REFERENCE_FILES,
    optionalReferenceFiles: OPTIONAL_REFERENCE_FILES,
    phaseStackFiles,
    referenceFiles,
    executionGraph
  };

  return cachedStack;
}

export function validatePromptStack() {
  const stack = loadPromptStack();
  const validationErrors = [];
  const validationWarnings = [];

  const loadedPhaseStackFiles = Object.keys(stack.phaseStackFiles);
  const loadedReferenceFiles = Object.keys(stack.referenceFiles);
  const missingPhaseStackFiles = REQUIRED_PHASE_STACK_FILES.filter((file) => !loadedPhaseStackFiles.includes(file));
  const missingReferenceFiles = REQUIRED_REFERENCE_FILES.filter((file) => !loadedReferenceFiles.includes(file));
  const missingOptionalReferenceFiles = OPTIONAL_REFERENCE_FILES.filter((file) => !loadedReferenceFiles.includes(file));

  for (const file of missingPhaseStackFiles) validationErrors.push(`MISSING_PHASE_STACK_FILE:${file}`);
  for (const file of missingReferenceFiles) validationErrors.push(`MISSING_REFERENCE_FILE:${file}`);
  for (const file of missingOptionalReferenceFiles) validationWarnings.push(`MISSING_OPTIONAL_REFERENCE_FILE:${file}`);

  const nodesById = new Map(stack.executionGraph.map((node) => [node.node_id, node]));
  for (const nodeId of EXPECTED_NODES) {
    if (!nodesById.has(nodeId)) validationErrors.push(`MISSING_EXECUTION_NODE:${nodeId}`);
  }

  for (const node of stack.executionGraph) {
    if (node.file && !(node.node_id === "RENDERER" && node.file === "deterministic_renderer")) {
      if (!REQUIRED_PHASE_STACK_FILES.includes(node.file)) validationErrors.push(`EXECUTION_NODE_FILE_NOT_REGISTERED:${node.node_id}:${node.file}`);
      if (!fs.existsSync(path.join(stack.stackDir, node.file))) validationErrors.push(`EXECUTION_NODE_FILE_MISSING:${node.node_id}:${node.file}`);
    }

    for (const pool of [...node.pool.primary, ...node.pool.fallback]) {
      if (!ALLOWED_POOLS.has(pool)) validationErrors.push(`UNKNOWN_POOL:${node.node_id}:${pool}`);
    }
  }

  const p6 = nodesById.get("P6");
  const p7 = nodesById.get("P7");
  const p1 = nodesById.get("P1");

  if (!p6?.pool.primary.includes("registry")) validationErrors.push("P6_PRIMARY_POOL_MISSING_REGISTRY");
  if (!p7?.pool.primary.includes("final")) validationErrors.push("P7_PRIMARY_POOL_MISSING_FINAL");
  if (p1 && p1.access.search !== false) validationErrors.push("P1_SEARCH_ACCESS_NOT_FALSE");

  for (const nodeId of ["P2", "P3", "P4", "P5", "P6", "P7"]) {
    const node = nodesById.get(nodeId);
    if (node && node.access.search !== false) validationErrors.push(`${nodeId}_SEARCH_ACCESS_NOT_FALSE`);
  }

  for (const node of stack.executionGraph) {
    if (node.node_id !== "S0" && node.access.grounding === true) {
      validationErrors.push(`GROUNDING_TRUE_AFTER_S0:${node.node_id}`);
    }
  }

  return {
    ok: validationErrors.length === 0,
    stack_dir: stack.stackDir,
    reference_dir: stack.referenceDir,
    required_phase_stack_files: REQUIRED_PHASE_STACK_FILES,
    required_reference_files: REQUIRED_REFERENCE_FILES,
    optional_reference_files: OPTIONAL_REFERENCE_FILES,
    loaded_phase_stack_files: loadedPhaseStackFiles,
    loaded_reference_files: loadedReferenceFiles,
    missing_phase_stack_files: missingPhaseStackFiles,
    missing_reference_files: missingReferenceFiles,
    missing_optional_reference_files: missingOptionalReferenceFiles,
    execution_graph: stack.executionGraph,
    execution_graph_summary: stack.executionGraph.map((node) => ({
      node_id: node.node_id,
      order: node.order,
      file: node.file,
      type: node.type,
      primary_pool: node.pool.primary,
      fallback_pool: node.pool.fallback,
      emits: node.emits
    })),
    phase_pool_bindings: getPhasePoolBindings(),
    validation_errors: validationErrors,
    validation_warnings: validationWarnings
  };
}

export function getPhasePoolBindings() {
  const stack = loadPromptStack();
  const bindings = {};

  for (const nodeId of EXPECTED_NODES) {
    const node = stack.executionGraph.find((entry) => entry.node_id === nodeId);
    bindings[nodeId] = node
      ? { primary: node.pool.primary, fallback: node.pool.fallback }
      : { primary: [], fallback: [] };
  }

  return bindings;
}

export function getPromptStackFileText(fileName) {
  const stack = loadPromptStack();
  const safeFileName = assertPhaseStackFileName(fileName);
  const text = stack.phaseStackFiles[safeFileName];
  if (typeof text !== "string") {
    throw new Error(`PROMPT_STACK_FILE_TEXT_MISSING:${safeFileName}`);
  }
  return text;
}

export function getExecutionNode(nodeId) {
  const stack = loadPromptStack();
  const normalizedNodeId = String(nodeId || "").trim();
  const node = stack.executionGraph.find((entry) => entry.node_id === normalizedNodeId);
  if (!node) throw new Error(`PROMPT_STACK_EXECUTION_NODE_MISSING:${normalizedNodeId || "UNKNOWN"}`);
  return node;
}

export function getRuntimeSpineText() {
  return getPromptStackFileText("00_RUNTIME_SPINE.md");
}

export function getPhasePromptText(nodeId) {
  const node = getExecutionNode(nodeId);
  if (!node.file || node.file === "deterministic_renderer") {
    throw new Error(`PROMPT_STACK_NODE_HAS_NO_PHASE_PROMPT:${node.node_id}`);
  }
  return getPromptStackFileText(node.file);
}

function assertPhaseStackFileName(fileName) {
  const value = String(fileName || "").trim();
  if (!value) throw new Error("PROMPT_STACK_FILE_NAME_MISSING");
  const stack = loadPromptStack();
  const resolved = path.resolve(stack.stackDir, value);
  const stackRoot = path.resolve(stack.stackDir);
  if (!resolved.startsWith(`${stackRoot}${path.sep}`)) {
    throw new Error(`PROMPT_STACK_FILE_OUTSIDE_PHASE_STACK:${value}`);
  }
  const base = path.basename(value);
  if (base !== value || !REQUIRED_PHASE_STACK_FILES.includes(base)) {
    throw new Error(`PROMPT_STACK_FILE_NOT_REGISTERED:${value}`);
  }
  return base;
}

function parseExecutionGraph(text) {
  const graphStart = text.indexOf("EXECUTION_GRAPH:");
  if (graphStart < 0) return [];

  const graphEndCandidates = ["TRANSITION_GATES:", "POOL_RULES:", "REPAIR_POLICY:"]
    .map((marker) => text.indexOf(marker, graphStart))
    .filter((index) => index > graphStart);
  const graphEnd = graphEndCandidates.length ? Math.min(...graphEndCandidates) : text.length;
  const graphText = text.slice(graphStart, graphEnd);
  const lines = graphText.split(/\r?\n/);
  const blocks = [];
  let current = null;

  for (const line of lines) {
    const nodeMatch = line.match(/^\s*-\s+node_id:\s*(\S+)\s*$/);
    if (nodeMatch) {
      if (current) blocks.push(current);
      current = [line];
      continue;
    }
    if (current) current.push(line);
  }
  if (current) blocks.push(current);

  return blocks.map(parseNodeBlock);
}

function parseNodeBlock(blockLines) {
  const node = {
    node_id: "",
    order: null,
    file: "",
    type: "",
    pool: { primary: [], fallback: [] },
    access: { search: null, grounding: null, full_text: "" },
    requires: [],
    emits: [],
    lock_requires: [],
    block_if: []
  };

  for (const rawLine of blockLines) {
    const line = rawLine.trim();
    if (!line) continue;

    const nodeIdMatch = line.match(/^-\s+node_id:\s*(\S+)\s*$/);
    if (nodeIdMatch) {
      node.node_id = nodeIdMatch[1];
      continue;
    }

    const fieldMatch = line.match(/^([A-Za-z_]+):\s*(.*)$/);
    if (!fieldMatch) continue;

    const key = fieldMatch[1];
    const rawValue = fieldMatch[2].trim();
    if (key === "order") node.order = Number(rawValue);
    else if (key === "file") node.file = rawValue;
    else if (key === "type") node.type = rawValue;
    else if (key === "pool") node.pool = normalizePool(parseInlineObject(rawValue));
    else if (key === "access") node.access = normalizeAccess(parseInlineObject(rawValue));
    else if (["requires", "emits", "lock_requires", "block_if"].includes(key)) node[key] = parseArrayValue(rawValue);
  }

  return node;
}

function normalizePool(value) {
  return {
    primary: Array.isArray(value.primary) ? value.primary : [],
    fallback: Array.isArray(value.fallback) ? value.fallback : []
  };
}

function normalizeAccess(value) {
  return {
    search: typeof value.search === "boolean" ? value.search : null,
    grounding: typeof value.grounding === "boolean" ? value.grounding : null,
    full_text: value.full_text ?? ""
  };
}

function parseInlineObject(rawValue) {
  const trimmed = rawValue.trim();
  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) return {};

  const body = trimmed.slice(1, -1).trim();
  const result = {};
  for (const part of splitTopLevel(body, ",")) {
    const index = part.indexOf(":");
    if (index < 0) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    result[key] = parseScalarOrArray(value);
  }
  return result;
}

function parseScalarOrArray(value) {
  if (value.startsWith("[") && value.endsWith("]")) return parseArrayValue(value);
  if (value === "true") return true;
  if (value === "false") return false;
  if (/^-?\d+$/.test(value)) return Number(value);
  return value;
}

function parseArrayValue(rawValue) {
  const trimmed = rawValue.trim();
  if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) return [];
  const body = trimmed.slice(1, -1).trim();
  if (!body) return [];
  return splitTopLevel(body, ",").map((entry) => entry.trim()).filter(Boolean);
}

function splitTopLevel(value, delimiter) {
  const parts = [];
  let depth = 0;
  let current = "";

  for (const char of value) {
    if (char === "[") depth += 1;
    if (char === "]") depth -= 1;
    if (char === delimiter && depth === 0) {
      parts.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }

  if (current.trim()) parts.push(current.trim());
  return parts;
}
