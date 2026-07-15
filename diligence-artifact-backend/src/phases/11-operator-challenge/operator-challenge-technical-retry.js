export const PHASE11_TECHNICAL_RETRY_VERSION = "phase11_technical_retry.v1";
export const MAX_PHASE11_TECHNICAL_RETRIES = 2;

const TRANSIENT = [
  /timeout/i,
  /timed out/i,
  /rate.?limit/i,
  /429/,
  /temporar/i,
  /unavailable/i,
  /econnreset/i,
  /econnrefused/i,
  /socket hang up/i,
  /502|503|504/
];

export async function callPhase11WithTechnicalRetry({ call, label = "PHASE11_PROVIDER", maximumRetries = MAX_PHASE11_TECHNICAL_RETRIES } = {}) {
  if (typeof call !== "function") throw new Error("PHASE11_TECHNICAL_RETRY_CALL_MISSING");
  let retries = 0;
  while (true) {
    try {
      const result = await call();
      return { result, technical_retry_count: retries, technical_retry_version: PHASE11_TECHNICAL_RETRY_VERSION };
    } catch (error) {
      if (!isTransientPhase11TechnicalError(error) || retries >= maximumRetries) {
        error.phase11_technical_retry_count = retries;
        error.phase11_technical_retry_exhausted = isTransientPhase11TechnicalError(error);
        error.phase11_technical_retry_label = label;
        throw error;
      }
      retries += 1;
    }
  }
}

export function isTransientPhase11TechnicalError(error) {
  const text = `${error?.code || ""} ${error?.status || ""} ${error?.message || error || ""}`;
  return TRANSIENT.some((pattern) => pattern.test(text));
}
