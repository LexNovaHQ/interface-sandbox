// diligence-system/run-store.js
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const DEFAULT_TOTAL_NODES = 9;

export const JOB_NODE_SEQUENCE = Object.freeze([
  "S0",
  "P1",
  "P2",
  "P3",
  "P4",
  "P5",
  "P6",
  "P7",
  "RENDERER",
]);

const ALLOWED_NODE_IDS = new Set(JOB_NODE_SEQUENCE);

function nowIso() {
  return new Date().toISOString();
}

function makeRunId() {
  const stamp = new Date()
    .toISOString()
    .replace(/[-:.TZ]/g, "")
    .slice(0, 14);

  const suffix = crypto.randomBytes(4).toString("hex");
  return `run_${stamp}_${suffix}`;
}

function assertSafeRunId(runId) {
  if (typeof runId !== "string" || !/^run_[A-Za-z0-9_-]+$/.test(runId)) {
    throw new Error(`INVALID_RUN_ID:${runId || "missing"}`);
  }
}

function assertSafeNodeId(nodeId) {
  if (!ALLOWED_NODE_IDS.has(nodeId)) {
    throw new Error(`INVALID_NODE_ID:${nodeId || "missing"}`);
  }
}

function resolveBaseDir(baseDir) {
  return baseDir || process.cwd();
}

function resolveRunStoreRoot(baseDir) {
  const configured = process.env.DILIGENCE_RUN_STORE_DIR;

  if (configured && configured.trim()) {
    return path.resolve(configured.trim());
  }

  return path.join(resolveBaseDir(baseDir), ".runs");
}

function resolveRunDir({ runId, baseDir }) {
  assertSafeRunId(runId);
  return path.join(resolveRunStoreRoot(baseDir), runId);
}

function resolveArtifactsDir({ runId, baseDir }) {
  return path.join(resolveRunDir({ runId, baseDir }), "artifacts");
}

function resolveArtifactPath({ runId, nodeId, baseDir }) {
  assertSafeNodeId(nodeId);
  return path.join(resolveArtifactsDir({ runId, baseDir }), `${nodeId}.json`);
}


function resolveScratchpadPath({ runId, baseDir }) {
  return path.join(resolveRunDir({ runId, baseDir }), "scratchpad.json");
}

function resolveForensicsPath({ runId, baseDir }) {
  return path.join(resolveRunDir({ runId, baseDir }), "forensics.json");
}
async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function atomicWriteJson(filePath, value) {
  const dir = path.dirname(filePath);
  await ensureDir(dir);

  const tmpName = `.${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`;
  const tmpPath = path.join(dir, tmpName);

  const json = `${JSON.stringify(value, null, 2)}\n`;

  await fs.writeFile(tmpPath, json, "utf8");
  await fs.rename(tmpPath, filePath);
}

async function readJsonFile(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

function normalizeInput(input = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("INVALID_RUN_INPUT: input must be an object");
  }

  return { ...input };
}

function normalizeProgress(completed) {
  const safeCompleted = Math.max(0, Math.min(DEFAULT_TOTAL_NODES, Number(completed) || 0));

  return {
    completed: safeCompleted,
    total: DEFAULT_TOTAL_NODES,
    percent: safeCompleted >= DEFAULT_TOTAL_NODES
      ? 100
      : Math.round((safeCompleted / DEFAULT_TOTAL_NODES) * 100),
  };
}

function publicError(error) {
  if (!error) return "UNKNOWN_ERROR";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message || error.name || "UNKNOWN_ERROR";
  if (typeof error === "object" && error.message) return String(error.message);
  return String(error);
}

export async function createRunRecord({ input = {}, baseDir } = {}) {
  const runInput = normalizeInput(input);
  const runId = makeRunId();
  const createdAt = nowIso();

  const runDir = resolveRunDir({ runId, baseDir });
  const artifactsDir = resolveArtifactsDir({ runId, baseDir });

  await ensureDir(artifactsDir);

  const state = {
    ok: true,
    run_id: runId,
    status: "QUEUED",
    current_node: null,
    next_node: "S0",
    completed_nodes: [],
    failed_node: null,
    created_at: createdAt,
    updated_at: createdAt,
    input: runInput,
    progress: normalizeProgress(0),
    latest_message: "Run queued.",
  };

  await atomicWriteJson(path.join(runDir, "input.json"), runInput);
  await atomicWriteJson(path.join(runDir, "state.json"), state);

  return state;
}

export async function readRunState({ runId, baseDir } = {}) {
  const runDir = resolveRunDir({ runId, baseDir });
  const statePath = path.join(runDir, "state.json");

  if (!(await pathExists(statePath))) {
    throw new Error(`RUN_NOT_FOUND:${runId}`);
  }

  return readJsonFile(statePath);
}

export async function writeRunState({ runId, state, baseDir } = {}) {
  if (!state || typeof state !== "object" || Array.isArray(state)) {
    throw new Error("INVALID_RUN_STATE: state must be an object");
  }

  const existing = await readRunState({ runId, baseDir });
  const updatedAt = nowIso();

  const nextState = {
    ...existing,
    ...state,
    run_id: runId,
    updated_at: updatedAt,
  };

  const runDir = resolveRunDir({ runId, baseDir });
  await atomicWriteJson(path.join(runDir, "state.json"), nextState);

  return nextState;
}


export async function readRunScratchpad({ runId, baseDir } = {}) {
  const scratchpadPath = resolveScratchpadPath({ runId, baseDir });

  if (!(await pathExists(scratchpadPath))) {
    return null;
  }

  return readJsonFile(scratchpadPath);
}

export async function writeRunScratchpad({ runId, scratchpad, baseDir } = {}) {
  if (!scratchpad || typeof scratchpad !== "object" || Array.isArray(scratchpad)) {
    throw new Error("INVALID_RUN_SCRATCHPAD: scratchpad must be an object");
  }

  const scratchpadPath = resolveScratchpadPath({ runId, baseDir });
  await atomicWriteJson(scratchpadPath, scratchpad);

  return scratchpad;
}

export async function readRunForensics({ runId, baseDir } = {}) {
  const forensicsPath = resolveForensicsPath({ runId, baseDir });

  if (!(await pathExists(forensicsPath))) {
    return null;
  }

  return readJsonFile(forensicsPath);
}

export async function writeRunForensics({ runId, forensics, baseDir } = {}) {
  if (!forensics || typeof forensics !== "object" || Array.isArray(forensics)) {
    throw new Error("INVALID_RUN_FORENSICS: forensics must be an object");
  }

  const forensicsPath = resolveForensicsPath({ runId, baseDir });
  await atomicWriteJson(forensicsPath, forensics);

  return forensics;
}

export async function writeArtifact({ runId, nodeId, artifact, baseDir } = {}) {
  assertSafeNodeId(nodeId);

  if (!artifact || typeof artifact !== "object" || Array.isArray(artifact)) {
    throw new Error("INVALID_ARTIFACT: artifact must be an object");
  }

  const artifactPath = resolveArtifactPath({ runId, nodeId, baseDir });

  const normalizedArtifact = {
    ...artifact,
    run_id: artifact.run_id || runId,
    node_id: artifact.node_id || nodeId,
    persisted_at: nowIso(),
  };

  await atomicWriteJson(artifactPath, normalizedArtifact);

  return normalizedArtifact;
}

export async function readArtifact({ runId, nodeId, baseDir } = {}) {
  const artifactPath = resolveArtifactPath({ runId, nodeId, baseDir });

  if (!(await pathExists(artifactPath))) {
    return null;
  }

  return readJsonFile(artifactPath);
}

export async function listArtifacts({ runId, baseDir } = {}) {
  const artifactsDir = resolveArtifactsDir({ runId, baseDir });

  if (!(await pathExists(artifactsDir))) {
    return [];
  }

  const entries = await fs.readdir(artifactsDir, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => name.endsWith(".json"))
    .map((name) => name.replace(/\.json$/u, ""))
    .filter((nodeId) => ALLOWED_NODE_IDS.has(nodeId))
    .sort((a, b) => JOB_NODE_SEQUENCE.indexOf(a) - JOB_NODE_SEQUENCE.indexOf(b));
}

export async function readArtifacts({ runId, baseDir } = {}) {
  const nodeIds = await listArtifacts({ runId, baseDir });
  const artifacts = {};

  for (const nodeId of nodeIds) {
    artifacts[nodeId] = await readArtifact({ runId, nodeId, baseDir });
  }

  return artifacts;
}

export async function markRunFailed({
  runId,
  failedNode = null,
  error,
  baseDir,
} = {}) {
  if (failedNode !== null) {
    assertSafeNodeId(failedNode);
  }

  const existing = await readRunState({ runId, baseDir });
  const message = publicError(error);

  return writeRunState({
    runId,
    baseDir,
    state: {
      status: "FAILED",
      current_node: null,
      next_node: null,
      failed_node: failedNode,
      completed_nodes: Array.isArray(existing.completed_nodes)
        ? existing.completed_nodes
        : [],
      latest_message: `Run failed${failedNode ? ` at ${failedNode}` : ""}: ${message}`,
      error: {
        message,
        failed_node: failedNode,
        at: nowIso(),
      },
    },
  });
}

export async function markRunComplete({ runId, baseDir } = {}) {
  const existing = await readRunState({ runId, baseDir });

  const completedNodes = Array.isArray(existing.completed_nodes)
    ? [...new Set(existing.completed_nodes)]
    : [];

  return writeRunState({
    runId,
    baseDir,
    state: {
      status: "COMPLETE",
      current_node: null,
      next_node: null,
      failed_node: null,
      completed_nodes: completedNodes,
      progress: normalizeProgress(DEFAULT_TOTAL_NODES),
      latest_message: "Run completed.",
    },
  });
}

export function isAllowedJobNode(nodeId) {
  return ALLOWED_NODE_IDS.has(nodeId);
}

export function getJobNodeSequence() {
  return [...JOB_NODE_SEQUENCE];
}

export function getRunStoreRoot({ baseDir } = {}) {
  return resolveRunStoreRoot(baseDir);
}
