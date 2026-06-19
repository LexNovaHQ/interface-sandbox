// diligence-system/scripts/smoke-job-create.mjs
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createRun, getRun } from "../run-manager.js";

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
    "Public synthetic material for smoke test. The company provides an AI assistant for public support workflows. It publishes basic terms and privacy statements in public material.",
};

const created = await createRun({
  input,
  baseDir: BASE_DIR,
});

assert(created.ok === true, "createRun did not return ok=true");
assert(typeof created.run_id === "string", "createRun did not return run_id");
assert(created.status === "QUEUED", `expected QUEUED, got ${created.status}`);
assert(created.next_node === "S0", `expected next_node S0, got ${created.next_node}`);
assert(
  created.poll_url === `/api/diligence/jobs/${created.run_id}`,
  "poll_url does not match run_id",
);
assert(
  created.advance_url === `/api/diligence/jobs/${created.run_id}/advance`,
  "advance_url does not match run_id",
);

const fetched = await getRun({
  runId: created.run_id,
  baseDir: BASE_DIR,
});

assert(fetched.ok === true, "getRun did not return ok=true");
assert(fetched.run_id === created.run_id, "getRun returned different run_id");
assert(fetched.status === "QUEUED", `expected fetched QUEUED, got ${fetched.status}`);
assert(fetched.next_node === "S0", `expected fetched next_node S0, got ${fetched.next_node}`);
assert(Array.isArray(fetched.completed_nodes), "completed_nodes is not an array");
assert(fetched.completed_nodes.length === 0, "completed_nodes should be empty");
assert(fetched.progress?.completed === 0, "progress.completed should be 0");
assert(fetched.progress?.total === 9, "progress.total should be 9");

console.log(JSON.stringify({
  ok: true,
  run_id: created.run_id,
  status: fetched.status,
  next_node: fetched.next_node,
  completed_nodes: fetched.completed_nodes,
  progress: fetched.progress,
}, null, 2));
