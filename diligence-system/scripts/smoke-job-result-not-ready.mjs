// diligence-system/scripts/smoke-job-result-not-ready.mjs
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createRun, getRunResult } from "../run-manager.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE_DIR = path.resolve(__dirname, "..");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const input = {
  source_mode: "synthetic_demo",
  target_url: "https://example.test/",
  company_name: "Example Test",
  pasted_public_material:
    "Public synthetic material for result-not-ready smoke test. This job is intentionally not advanced to completion.",
};

const created = await createRun({
  input,
  baseDir: BASE_DIR,
});

assert(created.ok === true, "createRun did not return ok=true");
assert(typeof created.run_id === "string", "createRun did not return run_id");
assert(created.status === "QUEUED", `expected QUEUED, got ${created.status}`);
assert(created.next_node === "S0", `expected next_node S0, got ${created.next_node}`);

const result = await getRunResult({
  runId: created.run_id,
  baseDir: BASE_DIR,
});

assert(result.ok === false, "getRunResult should not be ok before completion");
assert(
  result.status === "RESULT_NOT_READY",
  `expected RESULT_NOT_READY, got ${result.status}`,
);
assert(result.run_id === created.run_id, "result run_id mismatch");
assert(
  result.current_status === "QUEUED",
  `expected current_status QUEUED, got ${result.current_status}`,
);
assert(result.next_node === "S0", `expected result next_node S0, got ${result.next_node}`);
assert(Array.isArray(result.completed_nodes), "completed_nodes should be an array");
assert(result.completed_nodes.length === 0, "completed_nodes should be empty");

console.log(JSON.stringify({
  ok: true,
  run_id: created.run_id,
  result_status: result.status,
  current_status: result.current_status,
  next_node: result.next_node,
  completed_nodes: result.completed_nodes,
}, null, 2));
