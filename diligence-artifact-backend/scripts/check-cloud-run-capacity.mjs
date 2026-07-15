import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const workflowPath = path.resolve(scriptsDir, "../..", ".github/workflows/artifact-backend-deploy.yml");
const workflow = fs.readFileSync(workflowPath, "utf8");

assert.match(workflow, /--timeout=1800s\s*\\/, "Cloud Run worker request timeout must remain 1800 seconds");
assert.match(workflow, /--memory=2Gi\s*\\/, "Cloud Run worker must retain the 2 GiB memory floor required by M9 live execution");
assert.match(workflow, /--concurrency=1\s*\\/, "Cloud Run worker containers must process one request at a time to isolate memory-heavy phase execution");

console.log(JSON.stringify({
  check: "cloud run worker capacity",
  status: "PASS",
  memory: "2Gi",
  concurrency: 1,
  timeout_seconds: 1800,
  incident_guard: "M9_WORKER_OOM_503"
}, null, 2));
