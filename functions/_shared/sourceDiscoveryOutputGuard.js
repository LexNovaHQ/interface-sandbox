const REQUIRED = [
  "url",
  "source_zone",
  "artifact_type",
  "artifact_class",
  "search_query_used",
  "cascade_level",
  "path_taken",
  "why_relevant",
  "expected_evidence_type",
  "confidence"
];

function arr(value) {
  return Array.isArray(value) ? value : [];
}

function str(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function bool(value) {
  return typeof value === "boolean" ? value : false;
}

function normalizeCandidate(item = {}, index = 0) {
  const c = item && typeof item === "object" ? item : {};

  const normalized = {
    url: str(c.url || c.source_url) || "",
    title: str(c.title) || null,
    source_zone: str(c.source_zone) || "unknown",
    artifact_type: str(c.artifact_type) || "Unknown",
    artifact_class: str(c.artifact_class) || "FOOTPRINT_WIDE",
    search_query_used: str(c.search_query_used || c.query_used || c.search_query) || null,
    cascade_level: str(c.cascade_level) || null,
    path_taken: str(c.path_taken || c.discovery_path || c.reason) || null,
    first_party_claim: bool(c.first_party_claim),
    legal_host_claim: bool(c.legal_host_claim),
    why_relevant: str(c.why_relevant || c.reason || c.relevance) || null,
    expected_evidence_type: str(c.expected_evidence_type || c.expected_evidence) || null,
    confidence: str(c.confidence) || "LOW",
    original_index: index
  };

  normalized.missing_required_fields = REQUIRED.filter((field) => !str(normalized[field]));
  normalized.admission_readiness = normalized.missing_required_fields.length
    ? "TRACE_INCOMPLETE"
    : "READY_FOR_ADMISSION";

  return normalized;
}
export function guardSourceDiscoveryOutput(discovery = {}, { grounding = {} } = {}) {
  const raw = discovery && typeof discovery === "object" ? discovery : {};

  const candidateSources = arr(raw.candidate_sources).map(normalizeCandidate);
  const traceCompleteCount = candidateSources.filter((c) => c.admission_readiness === "READY_FOR_ADMISSION").length;
  const traceIncompleteCount = candidateSources.length - traceCompleteCount;
  const searchQueriesUsed = arr(raw.search_queries_used).filter((q) => str(q));

  const groundingCounts = {
    web_search_queries_count: arr(grounding.web_search_queries).length,
    grounding_chunks_count: arr(grounding.grounding_chunks).length,
    grounding_supports_count: arr(grounding.grounding_supports).length
  };

  const groundingPresent = groundingCounts.web_search_queries_count > 0 ||
    groundingCounts.grounding_chunks_count > 0 ||
    groundingCounts.grounding_supports_count > 0;

  const warnings = [];
  if (!candidateSources.length) warnings.push("No candidate sources returned.");
  if (!groundingPresent) warnings.push("Grounding metadata absent.");
  if (!searchQueriesUsed.length) warnings.push("search_queries_used missing or empty.");
  if (traceIncompleteCount > 0) warnings.push("Candidate trace fields missing.");

  let qualityStatus = "READY_FOR_ADMISSION";
  if (!candidateSources.length) qualityStatus = "BLOCKED_NO_CANDIDATES";
  else if (traceIncompleteCount > 0) qualityStatus = "BLOCKED_FOR_ADMISSION";
  else if (!groundingPresent && !searchQueriesUsed.length) qualityStatus = "WARN_UNGROUNDED_CANDIDATES";

  const scoutQuality = {
    candidate_count: candidateSources.length,
    trace_complete_count: traceCompleteCount,
    trace_incomplete_count: traceIncompleteCount,
    search_queries_used_count: searchQueriesUsed.length,
    grounding_present: groundingPresent,
    ...groundingCounts,
    ready_for_admission_gate: qualityStatus === "READY_FOR_ADMISSION",
    warnings
  };

  return {
    quality_status: qualityStatus,
    scout_quality: scoutQuality,
    discovery: {
      ...raw,
      search_queries_used: searchQueriesUsed,
      candidate_sources: candidateSources,
      quality_status: qualityStatus,
      scout_quality: scoutQuality
    }
  };
}
