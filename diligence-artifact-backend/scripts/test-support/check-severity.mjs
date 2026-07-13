export const CHECK_RESULT_PREFIX = "LEXNOVA_CHECK_RESULT ";

export const CHECK_STATUSES = Object.freeze({
  CRITICAL_FAILURE: "CRITICAL_FAILURE",
  MATERIAL_REINVESTIGATION: "MATERIAL_REINVESTIGATION",
  PASS_WITH_WARNING: "PASS_WITH_WARNING",
  PASS: "PASS"
});

export const CHECK_STATUS_PRIORITY = Object.freeze({
  [CHECK_STATUSES.PASS]: 0,
  [CHECK_STATUSES.PASS_WITH_WARNING]: 1,
  [CHECK_STATUSES.MATERIAL_REINVESTIGATION]: 2,
  [CHECK_STATUSES.CRITICAL_FAILURE]: 3
});

const VALID_STATUSES = new Set(Object.values(CHECK_STATUSES));
const ANSI_PATTERN = /\u001B\[[0-?]*[ -/]*[@-~]/g;

export function emitCheckResult({ status, check, message = "", findings = [] }) {
  assertStatus(status);
  const payload = {
    status,
    check: String(check || "unnamed_check"),
    message: String(message || ""),
    findings: Array.isArray(findings) ? findings : [findings]
  };
  console.log(`${CHECK_RESULT_PREFIX}${JSON.stringify(payload)}`);
  return payload;
}

export function parseCheckResults(output = "") {
  const results = [];
  for (const rawLine of String(output).split(/\r?\n/)) {
    const line = rawLine.replace(ANSI_PATTERN, "").trim();
    if (!line.startsWith(CHECK_RESULT_PREFIX)) continue;
    const payload = JSON.parse(line.slice(CHECK_RESULT_PREFIX.length));
    assertStatus(payload?.status);
    results.push(payload);
  }
  return results;
}

export function resolveChildCheckStatus({ exitCode, signal = null, output = "", allowedNonBlockingStatuses = [] }) {
  const markers = parseCheckResults(output);
  if (signal || exitCode === null || exitCode === undefined || Number(exitCode) !== 0) {
    return {
      status: CHECK_STATUSES.CRITICAL_FAILURE,
      markers,
      reason: signal
        ? `CHILD_SIGNAL:${signal}`
        : exitCode === null || exitCode === undefined
          ? "CHILD_EXIT_MISSING"
          : `CHILD_EXIT_NONZERO:${exitCode}`
    };
  }

  if (markers.length === 0) {
    return {
      status: CHECK_STATUSES.PASS,
      markers,
      reason: "LEGACY_PASS_WITHOUT_EXPLICIT_MARKER"
    };
  }

  const status = highestStatus(markers.map((marker) => marker.status));
  const allowed = new Set([
    CHECK_STATUSES.PASS,
    CHECK_STATUSES.CRITICAL_FAILURE,
    ...allowedNonBlockingStatuses
  ]);

  if (!allowed.has(status)) {
    return {
      status: CHECK_STATUSES.CRITICAL_FAILURE,
      markers,
      reason: `STATUS_NOT_ALLOWED_BY_GATE_POLICY:${status}`
    };
  }

  return {
    status,
    markers,
    reason: "EXPLICIT_CHECK_RESULT"
  };
}

export function highestStatus(statuses = []) {
  if (!Array.isArray(statuses) || statuses.length === 0) return CHECK_STATUSES.PASS;
  return statuses.reduce((highest, status) => {
    assertStatus(status);
    return CHECK_STATUS_PRIORITY[status] > CHECK_STATUS_PRIORITY[highest] ? status : highest;
  }, CHECK_STATUSES.PASS);
}

export function exitCodeForStatus(status) {
  assertStatus(status);
  return status === CHECK_STATUSES.CRITICAL_FAILURE ? 1 : 0;
}

export function assertStatus(status) {
  if (!VALID_STATUSES.has(status)) throw new Error(`INVALID_CHECK_STATUS:${status}`);
  return status;
}
