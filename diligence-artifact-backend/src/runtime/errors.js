export function errorMessage(error) {
  return error?.message || String(error || "UNKNOWN_RUNTIME_ERROR");
}

export function statusForMessage(message = "") {
  const text = String(message || "");
  if (text.startsWith("PUBLIC_REVIEWER_ALIAS_RETIRED")) return 410;
  if (text.startsWith("UNAUTHORIZED")) return 401;
  if (text.includes("FORBIDDEN")) return 403;
  if (text.startsWith("RUN_NOT_FOUND") || text.startsWith("ARTIFACT_NOT_FOUND")) return 404;
  if (
    text.startsWith("INVALID_") ||
    text.startsWith("READ_FORBIDDEN") ||
    text.startsWith("WRITE_FORBIDDEN") ||
    text.startsWith("PHASE_WRITE_FORBIDDEN") ||
    text.startsWith("PHASE_LOCK_BLOCKED") ||
    text.startsWith("SAVE_ORDER_BLOCKED") ||
    text.startsWith("SOURCE_EXTRACTION_BLOCKED") ||
    text.startsWith("SYNC_ADVANCE_RETIRED")
  ) return 400;
  if (text.startsWith("MISSING_RUNTIME_CONFIG")) return 500;
  if (text.startsWith("GEMINI_CALL_FAILED")) return 502;
  if (text.startsWith("CLOUD_TASKS_")) return 500;
  return 500;
}

export function publicErrorCode(message = "") {
  return String(message || "RUNTIME_ERROR").split(":")[0] || "RUNTIME_ERROR";
}

export function publicErrorBody(error) {
  const message = errorMessage(error);
  return { ok: false, error: publicErrorCode(message), message };
}

export function sendError(res, error) {
  const message = errorMessage(error);
  return res.status(statusForMessage(message)).json(publicErrorBody(error));
}
