import assert from "node:assert/strict";

const captured = [];
const originalLog = console.log;
const originalError = console.error;
console.log = (...items) => captured.push(items.join(" "));
console.error = (...items) => captured.push(items.join(" "));

await import("./check-phase1-universal-baseline-characterization.mjs");

console.log = originalLog;
console.error = originalError;
const priorExitCode = process.exitCode;
process.exitCode = 0;
const output = captured.join("\n");
const payload = parseJsonPayload(output);

assert.equal(priorExitCode, 1, `future-green baseline unexpectedly exited ${priorExitCode}; output=${output}`);
assert.equal(payload.status, "FAIL", `future-green baseline did not return FAIL; output=${output}`);

const failureIds = new Set((payload.failures || []).map((item) => item.id));
const requiredRemainingFailures = [
  "SARVAM_EXACT_CONTENT_DEDUPE",
  "SARVAM_FEATURE_METADATA_PROPAGATION",
  "SARVAM_ONE_LOGICAL_PRODUCT_ROOT_BELOW_800_KIB",
  "PAYTM_ONE_LOGICAL_PRODUCT_ROOT_BELOW_800_KIB",
  "PAYTM_ENTITY_ID_PROPAGATION",
  "PAYTM_LEGAL_ENTITY_SEPARATION"
];
for (const id of requiredRemainingFailures) assert.ok(failureIds.has(id), `expected remaining red failure missing: ${id}`);
assert.equal(failureIds.has("LEGAL_TOKEN_BOUNDARY_TRANSLATION_NOT_SLA"), false, "RB-08 regression: translation again false-matches SLA");

originalLog(JSON.stringify({
  check: "phase1 universal baseline progressive expected-red characterization",
  status: "EXPECTED_RED_CONFIRMED",
  repaired_failure_ids: ["LEGAL_TOKEN_BOUNDARY_TRANSLATION_NOT_SLA"],
  remaining_failure_count: failureIds.size,
  remaining_failure_ids: [...failureIds].sort()
}, null, 2));

function parseJsonPayload(value) {
  const start = value.indexOf("{");
  const end = value.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error(`baseline output did not contain JSON: ${value}`);
  return JSON.parse(value.slice(start, end + 1));
}
