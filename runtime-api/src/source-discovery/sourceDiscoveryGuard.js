export function buildInputIdentity({ primary_url }) {
  if (!primary_url || typeof primary_url !== "string") {
    const err = new Error("primary_url is required");
    err.statusCode = 400;
    err.error_type = "BAD_REQUEST";
    throw err;
  }

  let parsed;
  try {
    const candidate = primary_url.match(/^https?:\/\//i) ? primary_url : `https://${primary_url}`;
    parsed = new URL(candidate);
  } catch {
    const err = new Error("primary_url must be a valid URL");
    err.statusCode = 400;
    err.error_type = "BAD_REQUEST";
    throw err;
  }

  parsed.hash = "";
  parsed.search = "";

  const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
  const labels = hostname.split(".").filter(Boolean);
  const registrable_domain = labels.length >= 2 ? labels.slice(-2).join(".") : hostname;

  return {
    primary_url,
    normalized_origin: `${parsed.protocol}//${hostname}`,
    hostname,
    registrable_domain
  };
}
function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeUrl(value) {
  if (!value || typeof value !== "string") return null;
  try {
    const url = new URL(value.trim());
    url.hash = "";
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

function hostnameOf(value) {
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function pathOf(value) {
  try {
    return new URL(value).pathname.toLowerCase();
  } catch {
    return "";
  }
}

function isLikelyAsset(url) {
  const path = pathOf(url);
  return /\.(png|jpg|jpeg|gif|webp|svg|ico|css|js|woff|woff2|ttf|otf|pdf)$/i.test(path);
}

function inferSourceZone(url) {
  const host = hostnameOf(url);
  const path = pathOf(url);
  const haystack = `${host}${path}`;

  if (/privacy|data-protection|personal-data/.test(haystack)) return "privacy";
  if (/terms|tos|legal|conditions/.test(haystack)) return "terms";
  if (/security|trust|compliance|iso|soc|gdpr|hipaa/.test(haystack)) return "security";
  if (/docs|documentation|developer|developers|api|reference|sdk/.test(haystack)) return "docs";
  if (/status/.test(haystack)) return "status";
  if (/pricing|plans|enterprise/.test(haystack)) return "enterprise";
  if (/signup|sign-up|register|onboarding/.test(haystack)) return "signup";
  if (/blog|changelog|release|updates/.test(haystack)) return "blog_product";
  return "product";
}

function inferArtifactType(url) {
  const host = hostnameOf(url);
  const path = pathOf(url);
  const haystack = `${host}${path}`;

  if (/privacy/.test(haystack)) return "Privacy Policy";
  if (/cookie/.test(haystack)) return "Cookie Policy";
  if (/subprocessor/.test(haystack)) return "Subprocessors";
  if (/dpa|data-processing/.test(haystack)) return "Data Processing Addendum";
  if (/aup|acceptable-use/.test(haystack)) return "Acceptable Use Policy";
  if (/sla|service-level/.test(haystack)) return "Service Level Agreement";
  if (/terms|tos|conditions/.test(haystack)) return "Terms of Service";
  if (/security|trust|compliance/.test(haystack)) return "Security / Trust Center";
  if (/docs|documentation/.test(haystack)) return "Product Documentation";
  if (/developer|developers|api|reference|sdk/.test(haystack)) return "Developer / API Documentation";
  if (/pricing|plans/.test(haystack)) return "Pricing / Plans";
  if (/enterprise/.test(haystack)) return "Enterprise Page";
  if (/signup|sign-up|register|onboarding/.test(haystack)) return "Signup / Onboarding Page";
  if (/blog|changelog|release|updates/.test(haystack)) return "Product Blog / Changelog";
  return "Company Homepage / Product Page";
}

function isFirstPartyOrSubdomain(url, registrable_domain) {
  const host = hostnameOf(url);
  const root = String(registrable_domain || "").toLowerCase().replace(/^www\./, "");
  return host === root || host.endsWith(`.${root}`);
}

function isBlockedThirdParty(url) {
  const host = hostnameOf(url);
  const blocked = [
    "linkedin.com",
    "crunchbase.com",
    "pitchbook.com",
    "twitter.com",
    "x.com",
    "facebook.com",
    "instagram.com",
    "youtube.com",
    "g2.com",
    "capterra.com",
    "trustpilot.com",
    "apps.apple.com",
    "play.google.com"
  ];
  return blocked.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

function artifactClassFor(url, registrable_domain) {
  const host = hostnameOf(url);
  const root = String(registrable_domain || "").toLowerCase().replace(/^www\./, "");
  if (host === root) return "first_party_domain";
  if (host.endsWith(`.${root}`)) return "first_party_subdomain";
  return "trace_qualified_hosted";
}

function normalizeRawUrlEntries(rawDiscovery) {
  const fromUrls = safeArray(rawDiscovery?.urls).map((url) => ({ url }));
  const fromCandidates = safeArray(rawDiscovery?.candidate_sources);
  return [...fromUrls, ...fromCandidates];
}

export function guardSourceDiscoveryResult({ rawDiscovery, input }) {
  const registrable_domain = input?.registrable_domain;
  const entries = normalizeRawUrlEntries(rawDiscovery);
  const seen = new Set();
  const candidate_sources = [];
  const rejected_sources = [];

  for (const entry of entries) {
    const normalized = normalizeUrl(typeof entry === "string" ? entry : entry?.url);

    if (!normalized) {
      rejected_sources.push({ url: String(entry?.url || entry || ""), reason: "invalid_url" });
      continue;
    }

    if (seen.has(normalized)) continue;
    seen.add(normalized);

    if (isLikelyAsset(normalized)) {
      rejected_sources.push({ url: normalized, reason: "asset_url" });
      continue;
    }

    if (isBlockedThirdParty(normalized)) {
      rejected_sources.push({ url: normalized, reason: "blocked_third_party" });
      continue;
    }

    const firstParty = isFirstPartyOrSubdomain(normalized, registrable_domain);

    if (!firstParty) {
      rejected_sources.push({ url: normalized, reason: "not_first_party_or_trace_qualified" });
      continue;
    }

    candidate_sources.push({
      url: normalized,
      source_zone: entry?.source_zone || inferSourceZone(normalized),
      artifact_type: entry?.artifact_type || inferArtifactType(normalized),
      artifact_class: entry?.artifact_class || artifactClassFor(normalized, registrable_domain),
      confidence: Number(entry?.confidence || 0.8),
      admission_readiness: entry?.admission_readiness || "admit"
    });
  }

  return {
    candidate_sources,
    rejected_sources,
    missing_expected_paths: safeArray(rawDiscovery?.missing_expected_paths),
    search_queries_used: safeArray(rawDiscovery?.search_queries_used),
    discovery_limitations: safeArray(rawDiscovery?.limitations || rawDiscovery?.discovery_limitations)
  };
}


