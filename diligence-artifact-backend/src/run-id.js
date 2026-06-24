import crypto from "node:crypto";

function pad(value) {
  return String(value).padStart(2, "0");
}

export function slugifyTarget(value = "TARGET") {
  return String(value || "TARGET")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24)
    .toUpperCase() || "TARGET";
}

export function createRunId(target = "TARGET", now = new Date()) {
  const stamp = [
    now.getUTCFullYear(),
    pad(now.getUTCMonth() + 1),
    pad(now.getUTCDate())
  ].join("");

  const time = [
    pad(now.getUTCHours()),
    pad(now.getUTCMinutes()),
    pad(now.getUTCSeconds())
  ].join("");

  const suffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `LN-${stamp}-${time}-${slugifyTarget(target)}-${suffix}`;
}

export function assertRunId(runId) {
  if (typeof runId !== "string" || !/^LN-\d{8}-\d{6}-[A-Z0-9-]+-[A-F0-9]{6}$/.test(runId)) {
    throw new Error(`INVALID_RUN_ID:${runId || "missing"}`);
  }
}

export function nowIso() {
  return new Date().toISOString();
}
