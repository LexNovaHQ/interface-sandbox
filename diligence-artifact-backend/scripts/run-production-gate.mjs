import { spawnSync } from "node:child_process";

import { PRODUCTION_GATE_CHECKS } from "./production-gate.manifest.mjs";
import {
  CHECK_STATUSES,
  exitCodeForStatus,
  highestStatus,
  resolveChildCheckStatus
} from "./test-support/check-severity.mjs";

const npmExecutable = process.platform === "win32" ? "npm.cmd" : "npm";
const useShellForNpmCmd = process.platform === "win32";
const results = [];

for (const check of PRODUCTION_GATE_CHECKS) {
  const startedAt = Date.now();
  console.log(`\n=== ${check.label} (${check.script}) ===`);

  const child = spawnSync(npmExecutable, ["run", check.script], {
    cwd: process.cwd(),
    env: process.env,
    encoding: "utf8",
    shell: useShellForNpmCmd,
    maxBuffer: 64 * 1024 * 1024
  });

  const stdout = String(child.stdout || "");
  const stderr = String(child.stderr || "");
  if (stdout) process.stdout.write(stdout);
  if (stderr) process.stderr.write(stderr);
  if (child.error) process.stderr.write(`${child.error.stack || child.error.message || String(child.error)}\n`);

  const resolved = resolveChildCheckStatus({
    exitCode: child.status,
    signal: child.signal,
    output: `${stdout}\n${stderr}`,
    allowedNonBlockingStatuses: check.allowed_non_blocking_statuses
  });

  const result = {
    id: check.id,
    label: check.label,
    script: check.script,
    category: check.category,
    status: resolved.status,
    reason: resolved.reason,
    child_exit_code: child.status,
    child_signal: child.signal,
    duration_ms: Date.now() - startedAt,
    explicit_marker_count: resolved.markers.length
  };
  results.push(result);
  console.log(`LEXNOVA_GATE_SUITE_RESULT ${JSON.stringify(result)}`);
}

const status = highestStatus(results.map((result) => result.status));
const counts = Object.fromEntries(Object.values(CHECK_STATUSES).map((value) => [value, 0]));
for (const result of results) counts[result.status] += 1;

const summary = {
  check: "universal production gate",
  status,
  exit_code: exitCodeForStatus(status),
  blocking_rule: "ONLY_CRITICAL_FAILURE_EXITS_NONZERO",
  suite_count: results.length,
  counts,
  results
};

console.log(`\nLEXNOVA_PRODUCTION_GATE_RESULT ${JSON.stringify(summary, null, 2)}`);
process.exitCode = summary.exit_code;
