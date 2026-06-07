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

  if (path === "/") {
    return { url: url.toString(), source_family: "product_profile", priority: 1 };
  }

  const legalTerms = [
    "legal",
    "terms",
    "terms-of-service",
    "terms-and-conditions",
    "privacy",
    "privacy-policy",
    "security",
    "trust",
    "compliance",
    "status",
    "data-protection",
    "dpa",
    "data-processing",
    "subprocessor",
    "cookie",
    "acceptable-use",
    "aup",
    "sla",
    "responsible-ai",
    "ai-policy",
    "governance"
  ];

  const docsTerms = [
    "docs",
    "documentation",
    "developer",
    "developers",
    "api",
    "apis",
    "reference",
    "sdk",
    "guide",
    "quickstart",
    "help",
    "support",
    "integration",
    "integrations"
  ];

  const commercialTerms = [
    "pricing",
    "plans",
    "enterprise",
    "contact-sales",
    "sales",
    "signup",
    "sign-up",
    "dashboard",
    "contact"
  ];

  const updateTerms = [
    "blog",
    "changelog",
    "release-notes",
    "updates",
    "launch",
    "announced",
    "new-feature",
    "product-update",
    "news"
  ];

  const productTerms = [
    "about",
    "about-us",
    "company",
    "team",
    "product",
    "products",
    "platform",
    "solution",
    "solutions",
    "use-case",
    "use-cases",
    "customers",
    "industries",
    "features",
    "models",
    "studio",
    "playground",
    "agents",
    "voice",
    "speech",
    "translate",
    "translation",
    "transcription",
    "llm"
  ];

  if (includesAny(full, legalTerms)) {
    return { url: url.toString(), source_family: "legal_governance", priority: 1 };
  }

  if (includesAny(full, docsTerms)) {
    return { url: url.toString(), source_family: "docs_developer", priority: 1 };
  }

  if (includesAny(full, commercialTerms)) {
    return { url: url.toString(), source_family: "commercial", priority: 2 };
  }

  if (includesAny(full, updateTerms)) {
    return { url: url.toString(), source_family: "updates", priority: 2 };
  }

  if (includesAny(full, productTerms)) {
    return { url: url.toString(), source_family: "product_profile", priority: 1 };
  }

  return { url: url.toString(), source_family: "product_profile", priority: 1, inferred: true };
}

function sourceRecordFromProbe(probeRecord) {
  const category = categorizeSourceUrl(probeRecord.url);

  return {
    url: category.url,
    source_family: category.source_family,
    priority: category.priority,
    discovery_method: probeRecord.discovery_method || "deterministic_probe",
    probe_method: probeRecord.probe_method || null,
    status: probeRecord.status || null,
    content_type: probeRecord.content_type || "",
    inferred: category.inferred === true
  };
}

export function buildDiscoveryBuckets({ admitted = [], rejected = [], coverage_gaps = [] }) {
  const buckets = {
    product_profile_sources: [],
    legal_governance_sources: [],
    docs_developer_sources: [],
    commercial_sources: [],
    update_sources: [],
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

    if (record.source_family === "legal_governance") {
      buckets.legal_governance_sources.push(record);
    } else if (record.source_family === "docs_developer") {
      buckets.docs_developer_sources.push(record);
    } else if (record.source_family === "commercial") {
      buckets.commercial_sources.push(record);
    } else if (record.source_family === "updates") {
      buckets.update_sources.push(record);
    } else {
      buckets.product_profile_sources.push(record);
    }
  }

  buckets.coverage = {
    product_profile_found: buckets.product_profile_sources.length > 0,
    legal_governance_found: buckets.legal_governance_sources.length > 0,
    docs_developer_found: buckets.docs_developer_sources.length > 0,
    commercial_found: buckets.commercial_sources.length > 0,
    updates_found: buckets.update_sources.length > 0
  };

  buckets.counts = {
    candidate_sources: buckets.candidate_sources.length,
    product_profile_sources: buckets.product_profile_sources.length,
    legal_governance_sources: buckets.legal_governance_sources.length,
    docs_developer_sources: buckets.docs_developer_sources.length,
    commercial_sources: buckets.commercial_sources.length,
    update_sources: buckets.update_sources.length,
    rejected_sources: buckets.rejected_sources.length,
    coverage_gaps: buckets.coverage_gaps.length
  };

  return buckets;
}

