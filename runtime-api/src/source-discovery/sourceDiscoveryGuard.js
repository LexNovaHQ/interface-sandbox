const REJECT_HOSTS = [
  "linkedin.com",
  "crunchbase.com",
  "pitchbook.com",
  "g2.com",
  "capterra.com",
  "trustpilot.com",
  "facebook.com",
  "instagram.com",
  "x.com",
  "twitter.com",
  "youtube.com",
  "medium.com",
  "techcrunch.com",
  "forbes.com",
  "bloomberg.com",
  "reuters.com"
];

const ASSET_EXTENSIONS = [
  ".css",
  ".js",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg",
  ".webp",
  ".ico",
  ".woff",
  ".woff2",
  ".ttf",
  ".map"
];

const GOVERNANCE_HOST_HINTS = [
  "termly.io",
  "iubenda.com",
  "cookiebot.com",
  "onetrust.com",
  "trustarc.com",
  "privacycenter",
  "trustcenter",
  "trust-center",
  "legal",
  "termsfeed.com"
];

function stripWww(hostname) {
  return String(hostname || "").toLowerCase().replace(/^www\./, "");
}

export function normalizeUrl(input) {
  const raw = String(input || "").trim();
  if (!raw) throw new Error("primary_url is required.");
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const url = new URL(withProtocol);
  url.hash = "";
  return url.toString().replace(/\/$/, "");
}

export function getRegistrableDomain(urlLike) {
  const url = new URL(normalizeUrl(urlLike));
  const host = stripWww(url.hostname);
  const parts = host.split(".").filter(Boolean);
  if (parts.length <= 2) return host;

  const lastTwo = parts.slice(-2).join(".");
  const lastThree = parts.slice(-3).join(".");
  const twoLevelSuffixes = ["co.uk", "com.au", "co.in", "com.br", "co.jp"];
  if (twoLevelSuffixes.includes(lastTwo) && parts.length >= 3) return lastThree;
  return lastTwo;
}

export function buildInputIdentity(primary_url) {
  const normalized = normalizeUrl(primary_url);
  const url = new URL(normalized);
  const origin = `${url.protocol}//${url.hostname}`;
  return {
    primary_url: normalized,
    normalized_origin: origin,
    hostname: stripWww(url.hostname),
    registrable_domain: getRegistrableDomain(normalized)
  };
}

function normalizeCandidateUrl(input) {
  try {
    return normalizeUrl(input);
  } catch {
    return null;
  }
}

function isAssetUrl(url) {
  const pathname = new URL(url).pathname.toLowerCase();
  return ASSET_EXTENSIONS.some((ext) => pathname.endsWith(ext));
}

function isRejectedHost(hostname) {
  const host = stripWww(hostname);
  return REJECT_HOSTS.some((blocked) => host === blocked || host.endsWith(`.${blocked}`));
}

function isFirstPartyHost(hostname, registrableDomain) {
  const host = stripWww(hostname);
  return host === registrableDomain || host.endsWith(`.${registrableDomain}`);
}

function isTraceQualifiedHosted(candidate, hostname) {
  const artifactClass = String(candidate.artifact_class || "").toLowerCase();
  const relationship = String(candidate.relationship_explanation || "").trim();
  const zone = String(candidate.source_zone || "").toLowerCase();
  const host = stripWww(hostname);
  const hostHint = GOVERNANCE_HOST_HINTS.some((hint) => host.includes(hint));
  const governanceZone = /legal|privacy|terms|security|trust|governance|cookie|dpa|subprocessor|compliance/.test(zone);
  return artifactClass === "trace_qualified_hosted" && relationship.length >= 12 && governanceZone && hostHint;
}

function dedupeByUrl(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = String(item.url || "").toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

export function guardSourceDiscoveryResult(rawDiscovery, identity) {
  const candidateSources = Array.isArray(rawDiscovery?.candidate_sources) ? rawDiscovery.candidate_sources : [];
  const rejectedSources = Array.isArray(rawDiscovery?.rejected_sources) ? rawDiscovery.rejected_sources : [];
  const admitted = [];
  const rejected = [...rejectedSources];

  for (const candidate of candidateSources) {
    const normalized = normalizeCandidateUrl(candidate?.url);
    if (!normalized) {
      rejected.push({ url: candidate?.url || "", reason: "Invalid URL returned by discovery model.", rejection_class: "invalid_url" });
      continue;
    }

    const url = new URL(normalized);
    const host = stripWww(url.hostname);

    if (isRejectedHost(host)) {
      rejected.push({ url: normalized, reason: "Rejected host class for first-party diligence.", rejection_class: "third_party" });
      continue;
    }

    if (isAssetUrl(normalized)) {
      rejected.push({ url: normalized, reason: "Asset URL is not usable source evidence.", rejection_class: "asset" });
      continue;
    }

    const firstParty = isFirstPartyHost(host, identity.registrable_domain);
    const traceQualified = isTraceQualifiedHosted(candidate, host);

    if (!firstParty && !traceQualified) {
      rejected.push({ url: normalized, reason: "URL is not first-party and not trace-qualified hosted governance evidence.", rejection_class: "untraceable" });
      continue;
    }

    admitted.push({
      url: normalized,
      source_zone: candidate.source_zone || "other_governance",
      artifact_type: candidate.artifact_type || "Discovered source",
      artifact_class: firstParty ? (host === identity.registrable_domain ? "first_party_domain" : "first_party_subdomain") : "trace_qualified_hosted",
      confidence: Number(candidate.confidence ?? 0.7),
      admission_readiness: candidate.admission_readiness === "review" ? "review" : "admit",
      relationship_explanation: candidate.relationship_explanation || (firstParty ? `Host belongs to ${identity.registrable_domain}.` : "Trace-qualified hosted governance source."),
      discovery_method: candidate.discovery_method || "search_grounding"
    });
  }

  return {
    candidate_sources: dedupeByUrl(admitted),
    rejected_sources: dedupeByUrl(rejected.map((item) => ({
      url: item.url || "",
      reason: item.reason || "Rejected by source discovery guard.",
      rejection_class: item.rejection_class || "rejected"
    }))),
    missing_expected_paths: Array.isArray(rawDiscovery?.missing_expected_paths) ? rawDiscovery.missing_expected_paths : [],
    search_queries_used: Array.isArray(rawDiscovery?.search_queries_used) ? rawDiscovery.search_queries_used : [],
    discovery_limitations: Array.isArray(rawDiscovery?.discovery_limitations) ? rawDiscovery.discovery_limitations : []
  };
}
