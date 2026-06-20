const VALID_SOURCE_FAMILIES = new Set([
  "company_profile",
  "product_profile",
  "legal_profile",
  "governance_profile"
]);

const LEGACY_FAMILY_ALIASES = new Map([
  ["docs_developer", "product_profile"],
  ["commercial", "company_profile"],
  ["updates", "product_profile"],
  ["update", "product_profile"],
  ["legal_governance", "legal_profile"]
]);

function safeUrl(value) {
  try {
    const url = new URL(value);
    url.hash = "";
    return url;
  } catch {
    return null;
  }
}

function cleanPath(url) {
  return String(url.pathname || "/").toLowerCase().replace(/\/+$/, "") || "/";
}

function includesAny(text, terms) {
  return terms.some((term) => text.includes(term));
}

function normalizeKnownFamily(value) {
  const family = String(value || "").trim().toLowerCase();
  if (VALID_SOURCE_FAMILIES.has(family)) return family;
  return LEGACY_FAMILY_ALIASES.get(family) || null;
}

export function categorizeSourceUrl(value) {
  const url = safeUrl(value);

  if (!url) {
    return {
      url: String(value || ""),
      source_family: "rejected",
      priority: 99,
      reason: "invalid_url"
    };
  }

  const path = cleanPath(url);
  const full = `${url.hostname.toLowerCase()}${path}`;

  const legalTerms = [
    "legal",
    "terms",
    "terms-of-service",
    "terms-and-conditions",
    "privacy",
    "privacy-policy",
    "cookie-policy",
    "data-protection",
    "dpa",
    "data-processing",
    "subprocessor",
    "acceptable-use",
    "aup",
    "eula",
    "sla"
  ];

  const governanceTerms = [
    "trust",
    "trust-center",
    "security",
    "compliance",
    "status",
    "responsible-ai",
    "ai-policy",
    "governance",
    "safety",
    "model-safety",
    "data-security",
    "certifications",
    "enterprise-security"
  ];

  const productTerms = [
    "product",
    "products",
    "platform",
    "feature",
    "features",
    "solution",
    "solutions",
    "use-case",
    "use-cases",
    "models",
    "agents",
    "studio",
    "apis",
    "api",
    "developer",
    "developers",
    "docs",
    "documentation",
    "reference",
    "sdk",
    "quickstart",
    "guide",
    "guides",
    "integrations",
    "playground",
    "blog",
    "changelog",
    "release-notes",
    "updates",
    "news",
    "announcements",
    "releases",
    "pricing",
    "plans",
    "voice",
    "speech",
    "translate",
    "translation",
    "transcription",
    "dubbing",
    "ocr",
    "vision",
    "llm"
  ];

  const companyTerms = [
    "about",
    "about-us",
    "company",
    "team",
    "mission",
    "customers",
    "customer-stories",
    "case-studies"
  ];

  if (includesAny(full, legalTerms)) {
    return { url: url.toString(), source_family: "legal_profile", priority: 1 };
  }

  if (includesAny(full, governanceTerms)) {
    return { url: url.toString(), source_family: "governance_profile", priority: 1 };
  }

  if (includesAny(full, productTerms)) {
    return { url: url.toString(), source_family: "product_profile", priority: 1 };
  }

  if (path === "/" || includesAny(full, companyTerms)) {
    return { url: url.toString(), source_family: "company_profile", priority: 1 };
  }

  return { url: url.toString(), source_family: "company_profile", priority: 2, inferred: true };
}

function priorityForFamily(family, fallbackPriority) {
  if (family === "company_profile" || family === "product_profile" || family === "legal_profile" || family === "governance_profile") return 1;
  return fallbackPriority || 99;
}

function sourceRecordFromProbe(probeRecord) {
  const category = categorizeSourceUrl(probeRecord.url);
  const discoveredFamily = normalizeKnownFamily(probeRecord.source_family);
  const sourceFamily = discoveredFamily || category.source_family;

  return {
    url: category.url,
    source_family: sourceFamily,
    priority: priorityForFamily(sourceFamily, category.priority),
    discovery_method: probeRecord.discovery_method || "unknown",
    probe_method: probeRecord.probe_method || null,
    status: probeRecord.status || null,
    content_type: probeRecord.content_type || "",
    inferred: discoveredFamily ? false : category.inferred === true,
    categorized_from_url: discoveredFamily ? category.source_family : null,
    provenance: probeRecord.provenance || probeRecord.discovery || null
  };
}

export function buildDiscoveryBuckets({ admitted = [], rejected = [], coverage_gaps = [] }) {
  const buckets = {
    company_profile_sources: [],
    product_profile_sources: [],
    legal_profile_sources: [],
    governance_profile_sources: [],
    candidate_sources: [],
    rejected_sources: rejected || [],
    coverage_gaps: coverage_gaps || []
  };

  const seen = new Set();

  for (const item of admitted || []) {
    const record = sourceRecordFromProbe(item);

    if (!record.url || seen.has(record.url)) continue;
    seen.add(record.url);

    buckets.candidate_sources.push(record);

    if (record.source_family === "legal_profile") {
      buckets.legal_profile_sources.push(record);
    } else if (record.source_family === "governance_profile") {
      buckets.governance_profile_sources.push(record);
    } else if (record.source_family === "product_profile") {
      buckets.product_profile_sources.push(record);
    } else if (record.source_family === "company_profile") {
      buckets.company_profile_sources.push(record);
    } else {
      buckets.rejected_sources.push({ ...record, rejection_reason: "not_allowed_family" });
    }
  }

  buckets.coverage = {
    company_profile_found: buckets.company_profile_sources.length > 0,
    product_profile_found: buckets.product_profile_sources.length > 0,
    legal_profile_found: buckets.legal_profile_sources.length > 0,
    governance_profile_found: buckets.governance_profile_sources.length > 0
  };

  buckets.counts = {
    candidate_sources: buckets.candidate_sources.length,
    company_profile_sources: buckets.company_profile_sources.length,
    product_profile_sources: buckets.product_profile_sources.length,
    legal_profile_sources: buckets.legal_profile_sources.length,
    governance_profile_sources: buckets.governance_profile_sources.length,
    rejected_sources: buckets.rejected_sources.length,
    coverage_gaps: buckets.coverage_gaps.length
  };

  return buckets;
}
