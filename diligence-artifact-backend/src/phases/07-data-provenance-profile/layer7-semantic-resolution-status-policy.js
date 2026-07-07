export const PHASE7_SEMANTIC_RESOLUTION_STATUSES = Object.freeze([
  "SEMANTIC_PACKET_READY",
  "SEMANTIC_RESOLVED_WITH_BOUNDED_SUPPORT",
  "SEMANTIC_RESOLVED_WITH_LIMITATION",
  "SEMANTIC_MISSING_PROOF_REQUIRED",
  "SEMANTIC_PRIVATE_CONFIRMATION_REQUIRED",
  "SEMANTIC_CONFLICT_REQUIRES_REVIEW"
]);

export const PHASE7_FORBIDDEN_SEMANTIC_CONCLUSION_PATTERNS = Object.freeze([
  /\bcompliant\b/i,
  /\bnon[- ]?compliant\b/i,
  /\bviolat(e|es|ion)\b/i,
  /\blawful\b/i,
  /\billegal\b/i,
  /\badequate\b/i,
  /\bsufficient\b/i,
  /\bDPDP applies\b/i,
  /\bGDPR applies\b/i,
  /\bCCPA applies\b/i
]);

export function normalizePhase7SemanticStatus(value = "") {
  const status = String(value || "SEMANTIC_PACKET_READY").trim().toUpperCase();
  return PHASE7_SEMANTIC_RESOLUTION_STATUSES.includes(status) ? status : "SEMANTIC_PACKET_READY";
}

export function assertNoPhase7ForbiddenSemanticConclusion(value, context = "semantic_resolution") {
  const text = String(value || "");
  const hit = PHASE7_FORBIDDEN_SEMANTIC_CONCLUSION_PATTERNS.find((pattern) => pattern.test(text));
  if (hit) throw new Error(`PHASE7_FORBIDDEN_SEMANTIC_CONCLUSION:${context}`);
  return true;
}
