import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PRODUCTION_GATE_CHECKS } from "./production-gate.manifest.mjs";
import {
  CHECK_RESULT_PREFIX,
  CHECK_STATUSES,
  emitCheckResult,
  exitCodeForStatus,
  highestStatus,
  parseCheckResults,
  resolveChildCheckStatus
} from "./test-support/check-severity.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packageJson = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
const scripts = packageJson.scripts || {};

assert.equal(scripts.check, "npm run check:critical");
assert.equal(scripts["check:critical"], "node scripts/run-production-gate.mjs");
assert.equal(scripts["check:production-gate-severity"], "node scripts/check-production-gate-severity.mjs");

assert.ok(PRODUCTION_GATE_CHECKS.length > 0);
assert.equal(new Set(PRODUCTION_GATE_CHECKS.map((check) => check.id)).size, PRODUCTION_GATE_CHECKS.length);
assert.equal(new Set(PRODUCTION_GATE_CHECKS.map((check) => check.script)).size, PRODUCTION_GATE_CHECKS.length);
for (const check of PRODUCTION_GATE_CHECKS) {
  assert.ok(scripts[check.script], `missing package script: ${check.script}`);
  assert.notEqual(check.script, "check");
  assert.notEqual(check.script, "check:critical");
  for (const status of check.allowed_non_blocking_statuses) {
    assert.ok([
      CHECK_STATUSES.MATERIAL_REINVESTIGATION,
      CHECK_STATUSES.PASS_WITH_WARNING
    ].includes(status), `${check.id}: unsupported advisory status ${status}`);
  }
}

const warningLine = `${CHECK_RESULT_PREFIX}${JSON.stringify({
  status: CHECK_STATUSES.PASS_WITH_WARNING,
  check: "fixture",
  message: "warning",
  findings: ["fixture-warning"]
})}`;
const materialLine = `${CHECK_RESULT_PREFIX}${JSON.stringify({
  status: CHECK_STATUSES.MATERIAL_REINVESTIGATION,
  check: "fixture",
  message: "reinvestigate",
  findings: ["fixture-material"]
})}`;

assert.equal(parseCheckResults(`noise\n${warningLine}\n`).length, 1);
assert.equal(resolveChildCheckStatus({ exitCode: 0, output: "plain pass" }).status, CHECK_STATUSES.PASS);
assert.equal(resolveChildCheckStatus({
  exitCode: 0,
  output: warningLine,
  allowedNonBlockingStatuses: [CHECK_STATUSES.PASS_WITH_WARNING]
}).status, CHECK_STATUSES.PASS_WITH_WARNING);
assert.equal(resolveChildCheckStatus({
  exitCode: 0,
  output: materialLine,
  allowedNonBlockingStatuses: [CHECK_STATUSES.MATERIAL_REINVESTIGATION]
}).status, CHECK_STATUSES.MATERIAL_REINVESTIGATION);
assert.equal(resolveChildCheckStatus({
  exitCode: 0,
  output: warningLine,
  allowedNonBlockingStatuses: []
}).status, CHECK_STATUSES.CRITICAL_FAILURE);
assert.equal(resolveChildCheckStatus({
  exitCode: 1,
  output: materialLine,
  allowedNonBlockingStatuses: [CHECK_STATUSES.MATERIAL_REINVESTIGATION]
}).status, CHECK_STATUSES.CRITICAL_FAILURE);
assert.equal(resolveChildCheckStatus({ exitCode: null, output: "" }).status, CHECK_STATUSES.CRITICAL_FAILURE);
assert.equal(resolveChildCheckStatus({ exitCode: 0, signal: "SIGTERM", output: "" }).status, CHECK_STATUSES.CRITICAL_FAILURE);
assert.equal(highestStatus([
  CHECK_STATUSES.PASS,
  CHECK_STATUSES.PASS_WITH_WARNING,
  CHECK_STATUSES.MATERIAL_REINVESTIGATION
]), CHECK_STATUSES.MATERIAL_REINVESTIGATION);
assert.equal(exitCodeForStatus(CHECK_STATUSES.PASS), 0);
assert.equal(exitCodeForStatus(CHECK_STATUSES.PASS_WITH_WARNING), 0);
assert.equal(exitCodeForStatus(CHECK_STATUSES.MATERIAL_REINVESTIGATION), 0);
assert.equal(exitCodeForStatus(CHECK_STATUSES.CRITICAL_FAILURE), 1);

emitCheckResult({
  status: CHECK_STATUSES.PASS,
  check: "production_gate_severity_policy",
  message: "Severity protocol, manifest sync and exit-code doctrine are valid."
});
