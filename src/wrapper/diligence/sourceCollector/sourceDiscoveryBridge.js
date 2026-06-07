import { normalizeHttpUrl } from "./sourceMode.js";

const DEFAULT_SOURCE_DISCOVERY_ENDPOINT = "/api/source-discovery-scout";
const DEFAULT_MAX_DISCOVERED_URLS = 24;
const READY_FOR_ADMISSION = "READY_FOR_ADMISSION";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getHostname(url) {
  try {
    return new URL(normalizeHttpUrl(url)).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function isSameDomainOrSubdomain(candidateUrl, primaryUrl) {
  const candidateHost = getHostname(candidateUrl);
  const primaryHost = getHostname(primaryUrl);
  if (!candidateHost || !primaryHost) return false;
  return candidateHost === primaryHost || candidateHost.endsWith(`.${primaryHost}`);
}

function normalizeCandidateUrl(candidate = {}) {
  try {
    return normalizeHttpUrl(candidate.url || candidate.source_url || "");
  } catch {
    return "";
  }
}

function candidateTraceText(candidate = {}) {
  return [
    candidate.path_taken,
    candidate.why_relevant,
    candidate.search_query_used,
    candidate.cascade_level
  ].map(cleanString).join(" ");
}

function hasHostedGovernanceTrace(candidate = {}) {
  if (candidate.legal_host_claim !== true) return false;
  const trace = candidateTraceText(candidate);
  return trace.length >= 24;
}

function isTraceReady(candidate = {}) {
  const readiness = cleanString(candidate.admission_readiness);
  return !readiness || readiness === READY_FOR_ADMISSION;
}

function admitCandidate(candidate = {}, primaryUrl = "") {
  const url = normalizeCandidateUrl(candidate);
  if (!url) return { admitted: false, reason: "INVALID_URL" };

  const nativeDomain = isSameDomainOrSubdomain(url, primaryUrl);
  const hostedGovernance = hasHostedGovernanceTrace(candidate);
  const traceReady = isTraceReady(candidate);

  if (!traceReady) return { admitted: false, reason: "TRACE_INCOMPLETE" };
  if (nativeDomain) return { admitted: true, reason: "TARGET_DOMAIN_OR_SUBDOMAIN" };
  if (hostedGovernance) return { admitted: true, reason: "HOSTED_GOVERNANCE_WITH_TRACE" };

  return { admitted: false, reason: "NOT_FIRST_PARTY_OR_QUALIFIED_HOST" };
}

function buildScoutInput({ runId, normalized, input }) {
  return {
    run_id: runId,
    source_mode: normalized.source_mode,
    primary_url: normalized.target_input.primary_url || normalized.url_inputs[0] || "",
    company_name: input.company_name || input.companyName || null,
    product_context: input.product_context || input.productDesc || null,
    submitted_at: input.submitted_at || normalized.target_input.submitted_at || new Date().toISOString()
  };
}

function createSkippedDiscovery(reason) {
  return {
    ok: true,
    enabled: false,
    status: "SKIPPED",
    reason,
    admitted_sources: [],
    admitted_urls: [],
    rejected_candidates: [],
    candidate_count: 0,
    admitted_url_count: 0,
    quality_status: null,
    scout_quality: null,
    search_queries_used: [],
    missing_expected_paths: [],
    rejected_sources: [],
    discovery_limitations: []
  };
}

function createFailedDiscovery({ status, error, payload }) {
  return {
    ok: false,
    enabled: true,
    status: "FAILED",
    http_status: status || null,
    error: error || payload?.error || "Source Discovery Scout failed",
    error_type: payload?.error_type || "SOURCE_DISCOVERY_FAILED",
    admitted_sources: [],
    admitted_urls: [],
    rejected_candidates: [],
    candidate_count: 0,
    admitted_url_count: 0,
    quality_status: payload?.quality_status || null,
    scout_quality: payload?.scout_quality || null,
    search_queries_used: [],
    missing_expected_paths: [],
    rejected_sources: [],
    discovery_limitations: [error || payload?.error || "Source Discovery Scout failed"]
  };
}

function createAdmittedSource(candidate, url, reason) {
  return {
    url,
    title: candidate.title || null,
    source_zone: candidate.source_zone || "unknown",
    artifact_type: candidate.artifact_type || "Unknown",
    artifact_class: candidate.artifact_class || "FOOTPRINT_WIDE",
    search_query_used: candidate.search_query_used || null,
    cascade_level: candidate.cascade_level || null,
    path_taken: candidate.path_taken || null,
    first_party_claim: candidate.first_party_claim === true,
    legal_host_claim: candidate.legal_host_claim === true,
    why_relevant: candidate.why_relevant || null,
    expected_evidence_type: candidate.expected_evidence_type || null,
    confidence: candidate.confidence || "LOW",
    admission_reason: reason
  };
}

export async function runSourceDiscoveryBridge({
  runId,
  normalized,
  input = {},
  fetchImpl = fetch,
  endpoint = DEFAULT_SOURCE_DISCOVERY_ENDPOINT,
  enabled = true,
  maxDiscoveredUrls = DEFAULT_MAX_DISCOVERED_URLS,
  options = {}
} = {}) {
  if (!enabled) return createSkippedDiscovery("disabled_by_options");
  if (!normalized?.url_inputs?.length) return createSkippedDiscovery("no_url_input");
  if (normalized.source_mode === "text") return createSkippedDiscovery("text_mode_has_no_search");

  let response;
  let payload;

  try {
    response = await fetchImpl(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        input: buildScoutInput({ runId, normalized, input }),
        options: {
          maxAttempts: 1,
          ...(options || {})
        }
      })
    });

    payload = await response.json().catch(() => null);
  } catch (error) {
    return createFailedDiscovery({ error: error?.message || "Source Discovery Scout request failed" });
  }

  if (!response.ok || !payload?.ok) {
    return createFailedDiscovery({ status: response.status, payload });
  }

  const primaryUrl = normalized.target_input.primary_url || normalized.url_inputs[0] || "";
  const candidates = asArray(payload.discovery?.candidate_sources);
  const admittedSources = [];
  const rejectedCandidates = [];
  const seenUrls = new Set(normalized.url_inputs.map((url) => normalizeHttpUrl(url)));

  for (const candidate of candidates) {
    const url = normalizeCandidateUrl(candidate);
    const admission = admitCandidate(candidate, primaryUrl);

    if (!admission.admitted) {
      rejectedCandidates.push({ url: url || candidate?.url || "", reason: admission.reason });
      continue;
    }

    if (seenUrls.has(url)) continue;
    seenUrls.add(url);
    admittedSources.push(createAdmittedSource(candidate, url, admission.reason));

    if (admittedSources.length >= maxDiscoveredUrls) break;
  }

  return {
    ok: true,
    enabled: true,
    status: "COMPLETED",
    service: payload.service || "source-discovery-scout",
    model_role: payload.model_role || "search",
    selected_model: payload.selected_model || null,
    selected_key_alias: payload.selected_key_alias || null,
    attempt_policy: payload.attempt_policy || null,
    attempted_models: payload.attempted_models || [],
    quality_status: payload.quality_status || payload.discovery?.quality_status || null,
    scout_quality: payload.scout_quality || payload.discovery?.scout_quality || null,
    candidate_count: candidates.length,
    admitted_url_count: admittedSources.length,
    admitted_sources: admittedSources,
    admitted_urls: admittedSources.map((source) => source.url),
    rejected_candidates: rejectedCandidates,
    search_queries_used: asArray(payload.discovery?.search_queries_used),
    missing_expected_paths: asArray(payload.discovery?.missing_expected_paths),
    rejected_sources: asArray(payload.discovery?.rejected_sources),
    discovery_limitations: asArray(payload.discovery?.discovery_limitations),
    grounding: payload.grounding || null
  };
}
