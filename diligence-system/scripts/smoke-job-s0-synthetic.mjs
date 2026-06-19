// diligence-system/scripts/smoke-job-s0-synthetic.mjs
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createRun, advanceRun, getRun } from "../run-manager.js";
import { readArtifact } from "../run-store.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE_DIR = path.resolve(__dirname, "..");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function getCandidateCount(s0Output) {
  const manifest = s0Output?.hybrid_extraction_manifest || s0Output?.output?.hybrid_extraction_manifest;

  if (Array.isArray(manifest?.candidate_sources)) return manifest.candidate_sources.length;
  if (Array.isArray(manifest?.sources)) return manifest.sources.length;
  if (Array.isArray(manifest?.admitted_sources)) return manifest.admitted_sources.length;
  if (Array.isArray(manifest?.source_manifest)) return manifest.source_manifest.length;

  return null;
}

function getSourceMode(s0Output) {
  const manifest = s0Output?.hybrid_extraction_manifest || s0Output?.output?.hybrid_extraction_manifest;

  return (
    manifest?.source_mode ||
    manifest?.input_mode ||
    s0Output?.source_mode ||
    s0Output?.mode ||
    "unknown"
  );
}

async function callModel() {
  throw new Error("SMOKE_UNEXPECTED_MODEL_CALL_FOR_SYNTHETIC_S0");
}

const input = {
  source_mode: "synthetic_demo",
  target_url: "https://example.test/",
  company_name: "Example Test",
  pasted_public_material:
    "Public synthetic material for S0 smoke test. The company provides an AI assistant for public support workflows. It publishes basic terms and privacy statements in public material.",
};

const created = await createRun({
  input,
  baseDir: BASE_DIR,
});

assert(created.ok === true, "createRun did not return ok=true");
assert(created.next_node === "S0", `expected initial next_node S0, got ${created.next_node}`);

const advanced = await advanceRun({
  runId: created.run_id,
  callModel,
  baseDir: BASE_DIR,
});

assert(advanced.ok === true, `advanceRun failed: ${advanced.error || advanced.latest_message}`);
assert(advanced.status === "RUNNING", `expected RUNNING after S0, got ${advanced.status}`);
assert(advanced.next_node === "P1", `expected next_node P1, got ${advanced.next_node}`);
assert(Array.isArray(advanced.completed_nodes), "completed_nodes is not an array");
assert(advanced.completed_nodes.includes("S0"), "completed_nodes does not include S0");
assert(
  advanced.completed_nodes.filter((nodeId) => nodeId === "S0").length === 1,
  "completed_nodes contains duplicate S0",
);
assert(advanced.progress?.completed === 1, "progress.completed should be 1 after S0");
assert(advanced.progress?.total === 9, "progress.total should be 9 after S0");

const fetched = await getRun({
  runId: created.run_id,
  baseDir: BASE_DIR,
});

assert(fetched.ok === true, "getRun after S0 did not return ok=true");
assert(fetched.next_node === "P1", `fetched next_node expected P1, got ${fetched.next_node}`);
assert(fetched.completed_nodes.includes("S0"), "fetched completed_nodes missing S0");

const s0Artifact = await readArtifact({
  runId: created.run_id,
  nodeId: "S0",
  baseDir: BASE_DIR,
});

assert(s0Artifact, "S0 artifact was not persisted");
assert(s0Artifact.node_id === "S0", `artifact.node_id expected S0, got ${s0Artifact.node_id}`);
assert(s0Artifact.status === "LOCKED", `artifact.status expected LOCKED, got ${s0Artifact.status}`);
assert(s0Artifact.output, "S0 artifact output missing");
assert(
  s0Artifact.output.hybrid_extraction_manifest,
  "S0 artifact output.hybrid_extraction_manifest missing",
);
assert(
  s0Artifact.output.extraction_forensic_ledger,
  "S0 artifact output.extraction_forensic_ledger missing",
);

console.log(JSON.stringify({
  ok: true,
  run_id: created.run_id,
  status: fetched.status,
  completed_nodes: fetched.completed_nodes,
  next_node: fetched.next_node,
  s0_artifact_present: true,
  candidate_count: getCandidateCount(s0Artifact.output),
  source_mode: getSourceMode(s0Artifact.output),
  synthetic_s0_model_call: false,
}, null, 2));
