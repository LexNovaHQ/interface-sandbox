export function classifyGeminiError(errorLike = {}) {
  const status = Number(errorLike.status || errorLike.statusCode || errorLike.code || 0);
  const message = String(errorLike.message || errorLike.error || "").toLowerCase();
  const reason = String(errorLike.reason || errorLike.error_type || "").toLowerCase();
  const combined = `${status} ${reason} ${message}`;

  if (status === 429 || combined.includes("quota") || combined.includes("rate limit") || combined.includes("resource exhausted")) {
    return { category: "QUOTA_OR_RATE", retryable: true, rotate_key: true, rotate_model: false };
  }

  if (status === 401 || combined.includes("api key not valid") || combined.includes("unauthorized")) {
    return { category: "AUTH", retryable: true, rotate_key: true, rotate_model: false };
  }

  if (status === 403) {
    if (combined.includes("quota") || combined.includes("permission") || combined.includes("billing")) {
      return { category: "KEY_OR_PROJECT_BLOCKED", retryable: true, rotate_key: true, rotate_model: false };
    }
    return { category: "FORBIDDEN", retryable: true, rotate_key: true, rotate_model: false };
  }

  if (status === 404 || combined.includes("model") && combined.includes("not found")) {
    return { category: "MODEL_NOT_AVAILABLE", retryable: true, rotate_key: false, rotate_model: true };
  }

  if (status === 408 || status === 499 || status === 500 || status === 502 || status === 503 || status === 504) {
    return { category: "PROVIDER_OR_TIMEOUT", retryable: true, rotate_key: true, rotate_model: true };
  }

  if (combined.includes("timeout") || combined.includes("timed out") || combined.includes("aborted")) {
    return { category: "TIMEOUT", retryable: true, rotate_key: true, rotate_model: true };
  }

  if (combined.includes("json") || combined.includes("parse")) {
    return { category: "PARSE", retryable: false, rotate_key: false, rotate_model: false };
  }

  return { category: "UNKNOWN", retryable: false, rotate_key: false, rotate_model: false };
}

