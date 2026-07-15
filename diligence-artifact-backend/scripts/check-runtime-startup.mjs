import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = 18080 + (process.pid % 1000);
const baseUrl = `http://127.0.0.1:${port}`;
const outputLimit = 24000;
let stdout = "";
let stderr = "";

function appendOutput(current, chunk) {
  const next = current + String(chunk || "");
  return next.length <= outputLimit ? next : next.slice(-outputLimit);
}

const child = spawn(process.execPath, ["src/runtime/main.js"], {
  cwd: backendRoot,
  env: {
    ...process.env,
    PORT: String(port),
    GCP_PROJECT_ID: process.env.GCP_PROJECT_ID || "runtime-startup-check",
    GCP_REGION: process.env.GCP_REGION || "asia-south1",
    GCP_CLOUD_RUN_SERVICE: process.env.GCP_CLOUD_RUN_SERVICE || "interface-diligence-artifacts",
    FIRESTORE_DATABASE_ID: process.env.FIRESTORE_DATABASE_ID || "(default)",
    DRIVE_PARENT_FOLDER_ID: process.env.DRIVE_PARENT_FOLDER_ID || "runtime-startup-check",
    SHEETS_SPREADSHEET_ID: process.env.SHEETS_SPREADSHEET_ID || "runtime-startup-check",
    RUNS_SHEET_NAME: process.env.RUNS_SHEET_NAME || "runs",
    GPT_ACTION_API_KEY: process.env.GPT_ACTION_API_KEY || "runtime-startup-check",
    GEMINI_API_KEYS: process.env.GEMINI_API_KEYS || "runtime-startup-check",
    GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    GEMINI_MODELS: process.env.GEMINI_MODELS || "gemini-2.5-flash",
    ALLOWED_ORIGIN: process.env.ALLOWED_ORIGIN || "*",
    PUBLIC_REVIEWER_ENABLED: process.env.PUBLIC_REVIEWER_ENABLED || "true",
    EXPRESS_JSON_LIMIT: process.env.EXPRESS_JSON_LIMIT || "50mb",
    CLOUD_TASKS_QUEUE: process.env.CLOUD_TASKS_QUEUE || "diligence-reviewer-worker",
    CLOUD_TASKS_LOCATION: process.env.CLOUD_TASKS_LOCATION || "asia-south1",
    CLOUD_TASKS_DISPATCH_DEADLINE_SECONDS: process.env.CLOUD_TASKS_DISPATCH_DEADLINE_SECONDS || "1800"
  },
  stdio: ["ignore", "pipe", "pipe"]
});

child.stdout.on("data", (chunk) => {
  stdout = appendOutput(stdout, chunk);
});
child.stderr.on("data", (chunk) => {
  stderr = appendOutput(stderr, chunk);
});

const exitPromise = new Promise((resolve) => {
  child.once("exit", (code, signal) => resolve({ code, signal }));
});

function startupFailure(reason) {
  const details = [
    reason,
    stdout.trim() ? `stdout:\n${stdout.trim()}` : "stdout: <empty>",
    stderr.trim() ? `stderr:\n${stderr.trim()}` : "stderr: <empty>"
  ].join("\n\n");
  return new Error(details);
}

let healthPayload;
try {
  for (let attempt = 1; attempt <= 40; attempt += 1) {
    if (child.exitCode !== null) {
      const exited = await exitPromise;
      throw startupFailure(`Production entrypoint exited before binding to PORT=${port}: ${JSON.stringify(exited)}`);
    }

    try {
      const response = await fetch(`${baseUrl}/health`, {
        signal: AbortSignal.timeout(1000)
      });
      if (response.ok) {
        healthPayload = await response.json();
        break;
      }
    } catch {
      // The process may still be loading its import graph. Retry within the bounded window.
    }

    await delay(250);
  }

  if (!healthPayload) {
    throw startupFailure(`Production entrypoint did not answer /health on PORT=${port} within 10 seconds.`);
  }

  assert.equal(healthPayload.ok, true, "health endpoint must report ok=true");
  assert.equal(healthPayload.service, "interface-diligence-central-runtime", "health endpoint must identify the central runtime");
  assert.ok(Number.isInteger(healthPayload.central_phase_count) && healthPayload.central_phase_count > 0, "health endpoint must report central phases");
  assert.ok(healthPayload.permissions && healthPayload.permissions.known_artifact_count > 0, "health endpoint must expose the bounded permission summary");
  assert.ok(healthPayload.permissions.agent_count > 0, "health endpoint must report registered agents");
  assert.equal(healthPayload.permissions.status.canonical_post_review_permissions_synced, true, "health permission status must remain synchronized");

  console.log(JSON.stringify({
    check: "production runtime startup",
    status: "PASS",
    port,
    service: healthPayload.service,
    mode: healthPayload.mode,
    central_phase_count: healthPayload.central_phase_count,
    known_artifact_count: healthPayload.permissions.known_artifact_count,
    agent_count: healthPayload.permissions.agent_count
  }, null, 2));
} finally {
  if (child.exitCode === null) {
    child.kill("SIGTERM");
  }
  await Promise.race([exitPromise, delay(2000)]);
  if (child.exitCode === null) {
    child.kill("SIGKILL");
  }
}
