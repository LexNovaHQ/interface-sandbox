// s0-source-classifier.js
// Deterministic URL/route classification helpers for S0.
// This file imports canon from s0-source-contract.js and does not redefine taxonomy/path banks.

import {
  S0_SOURCE_FAMILY_ORDER,
  S0_FAMILY_CAPS,
  S0_TOTAL_ACCEPTED_LOSSLESS_SOURCES_HARD_MAX,
  S0_SOURCE_TAXONOMY,
  S0_SUBFAMILY_HARD_CAPS,
  S0_KNOWN_PATH_BANK,
  S0_DATA_FLOW_SIGNALS,
  S0_ROUTE_SOURCE_STRENGTH
} from "./s0-source-contract.js";

export function normalizeInput(input = {}) {
  if (typeof input === "string") {
    return {
      target_url: input,
      source_mode: "url",
      downstream_mode: "PHASE_STACK_RUNTIME"
    };
  }

  const sourceMode =
    input.source_mode ||
    (input.target_url
      ? input.text
        ? "url_plus_text"
        : "url"
      : input.text
        ? "text"
        : "synthetic_demo");

  return {
    ...input,
    source_mode: sourceMode,
    downstream_mode: input.downstream_mode || "PHASE_STACK_RUNTIME"
  };
}

export function canonicalizeTarget(targetUrl, companyNameCandidate = "") {
  const url = new URL(
    String(targetUrl).startsWith("http") ? targetUrl : `https://${targetUrl}`
  );

  const hostname = url.hostname.replace(/^www\./i, "").toLowerCase();
  const rootUrl = `${url.protocol}//${hostname}/`;

  return {
    target_url: targetUrl,
    normalized_target_url: url.toString(),
    canonical_domain: hostname,
    root_url: rootUrl,
    allowed_hosts: [hostname, `www.${hostname}`],
    company_name_candidate: companyNameCandidate || domainToName(hostname),
    normalization_notes: []
  };
}

export function canonicalizeTextTarget(input = {}) {
  return {
    target_url: "pasted://public-material",
    normalized_target_url: "pasted://public-material",
    canonical_domain: "pasted-public-material",
    root_url: "pasted://public-material",
    allowed_hosts: [],
    company_name_candidate:
      input.company_name_candidate || input.target_name || "pasted-public-material-target",
    normalization_notes: ["text mode disables search/fetch"]
  };
}

export function canonicalizeSyntheticTarget(input = {}) {
  return {
    target_url: "synthetic://demo-fixture",
    normalized_target_url: "synthetic://demo-fixture",
    canonical_domain: "synthetic-demo",
    root_url: "synthetic://demo-fixture",
    allowed_hosts: [],
    company_name_candidate:
      input.company_name_candidate || input.target_name || "synthetic-demo-target",
    normalization_notes: ["synthetic_demo marked demo-only"]
  };
}

export function canonicalizeUrl(inputUrl, baseUrl) {
  try {
    const url = new URL(inputUrl, baseUrl);

    // Preserve SPA routes only when they are actual hash routes.
    url.hash = url.hash && url.hash.startsWith("#/") ? url.hash : "";

    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_|fbclid|gclid|mc_)/i.test(key)) {
        url.searchParams.delete(key);
      }
    }

    return url.toString();
  } catch {
    return "";
  }
}

export function scopeClassForUrl(url, target = {}) {
  if (!url) return "PRIVATE_OR_PROHIBITED";
  if (url.startsWith("pasted://")) return "PASTED_PUBLIC_MATERIAL_CANDIDATE";
  if (url.startsWith("synthetic://")) return "SYNTHETIC_DEMO_CANDIDATE";

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");

    if (host === target.canonical_domain) return "TARGET_DOMAIN_CANDIDATE";
    if (host.endsWith(`.${target.canonical_domain}`)) {
      return "COMPANY_CONTROLLED_SUBDOMAIN_CANDIDATE";
    }
    if (isHostedGovernanceHost(host)) return "HOSTED_GOVERNANCE_CANDIDATE";

    return "THIRD_PARTY_NON_GOVERNANCE";
  } catch {
    return "PRIVATE_OR_PROHIBITED";
  }
}

export function generateKnownPathCandidates({ target }) {
  const candidates = [];

  for (const family of S0_SOURCE_FAMILY_ORDER) {
    const subfamilies = S0_KNOWN_PATH_BANK[family] || {};

    for (const [subfamily, paths] of Object.entries(subfamilies)) {
      for (const path of paths) {
        if (path.includes("{slug}")) continue;

        // Contract rule: product fallback pages cannot be fetched merely to fill quota.
        if (
          family === "PRODUCT_FAMILY" &&
          ["P4_USE_CASE_INDUSTRY", "P5_ENTERPRISE_PRICING"].includes(subfamily)
        ) {
          continue;
        }

        const url = new URL(path, target.root_url).toString();
        candidates.push({
          candidate_url: url,
          canonical_url: canonicalizeUrl(url, target.root_url),
          source_family: family,
          source_subfamily: subfamily,
          route_source: "KNOWN_PATH_PROBE",
          route_basis: `known path bank: ${path}`,
          scope_class: scopeClassForUrl(url, target)
        });
      }
    }
  }

  return candidates;
}

export function classifyCandidate(candidate = {}) {
  const url = candidate.canonical_url || candidate.candidate_url || "";
  const path = safePath(url).toLowerCase();
  const text = `${path} ${candidate.route_basis || ""}`.toLowerCase();

  const exact = classifyByKnownPath(path);
  if (exact.source_family && exact.source_subfamily) return exact;

  if (/privacy|terms|dpa|aup|sla|legal|policy|acceptable-use|eula/.test(text)) {
    return {
      source_family: "LEGAL_FAMILY",
      source_subfamily: guessLegalSubfamily(text)
    };
  }

  if (
    /security|trust|subprocessor|retention|deletion|data-residency|audit|permission|webhook|connector|api|docs|developer/.test(
      text
    )
  ) {
    return {
      source_family: "DATA_FAMILY",
      source_subfamily: guessDataSubfamily(text)
    };
  }

  if (/product|platform|feature|solution|model|agent|studio|pricing|enterprise|api/.test(text)) {
    return {
      source_family: "PRODUCT_FAMILY",
      source_subfamily: guessProductSubfamily(text)
    };
  }

  if (/about|company|contact|imprint|team|careers|press|newsroom/.test(text)) {
    return {
      source_family: "TARGET_FAMILY",
      source_subfamily: guessTargetSubfamily(text)
    };
  }

  return { source_family: "", source_subfamily: "" };
}

export function isKnownFamilySubfamily(family, subfamily) {
  return Boolean(family && subfamily && S0_SOURCE_TAXONOMY[family]?.includes(subfamily));
}

export function isDiscoveredProductSlug(candidate = {}) {
  return ["HEADER", "FOOTER", "SITEMAP", "ROOT", "HASH_ROUTE", "SEARCH_SCOUT"].includes(
    normalizeRouteSource(candidate.route_source)
  );
}

export function hasD4DataFlowSignal(candidate = {}) {
  const text = `${candidate.candidate_url || ""} ${candidate.route_basis || ""}`.toLowerCase();
  return S0_DATA_FLOW_SIGNALS.some((signal) => text.includes(String(signal).toLowerCase()));
}

export function compareCandidatePriority(a, b) {
  const familyA = S0_SOURCE_FAMILY_ORDER.indexOf(a.source_family);
  const familyB = S0_SOURCE_FAMILY_ORDER.indexOf(b.source_family);

  if (familyA !== familyB) return familyA - familyB;
  return routeStrength(a.route_source) - routeStrength(b.route_source);
}

export function hardFamilyCap(family) {
  return S0_FAMILY_CAPS[family]?.hard_max || 0;
}

export function hardSubfamilyCap(subfamily) {
  return S0_SUBFAMILY_HARD_CAPS[subfamily] || 0;
}

export function routeStrength(routeSource) {
  const normalized = normalizeRouteSource(routeSource);
  return S0_ROUTE_SOURCE_STRENGTH[normalized] || 999;
}

export function normalizeRouteSource(routeSource) {
  if (routeSource === "HASH" || routeSource === "HASH_ROUTE_ROUTE") return "HASH_ROUTE";
  return routeSource || "ROOT";
}

export function totalAcceptedHardMax() {
  return S0_TOTAL_ACCEPTED_LOSSLESS_SOURCES_HARD_MAX;
}

export function safePath(url) {
  try {
    return new URL(url, "https://placeholder.local").pathname || "/";
  } catch {
    return "/";
  }
}

function classifyByKnownPath(path) {
  let best = { source_family: "", source_subfamily: "", score: 0 };

  for (const [family, subfamilies] of Object.entries(S0_KNOWN_PATH_BANK)) {
    for (const [subfamily, paths] of Object.entries(subfamilies)) {
      for (const knownPath of paths) {
        if (knownPath.includes("{slug}")) continue;
        if (path === knownPath || path.startsWith(`${knownPath}/`)) {
          const score = knownPath.length + 10;
          if (score > best.score) {
            best = { source_family: family, source_subfamily: subfamily, score };
          }
        }
      }
    }
  }

  return best;
}

function guessLegalSubfamily(text) {
  if (/dpa|data-processing|aup|acceptable-use|sla|service-level|customer-agreement|platform-agreement/.test(text)) {
    return "L2_B2B_CONTRACTING";
  }
  if (/usage-policy|content-policy|ai-policy|responsible-ai|model-policy|safety-policy/.test(text)) {
    return "L3_AI_USAGE_GOVERNANCE";
  }
  if (/cookie|privacy-center|do-not-sell|gdpr|ccpa/.test(text)) return "L4_PRIVACY_ADJACENT_NOTICES";
  if (/legal-center|legal-hub|policies|terms-and-policies/.test(text)) return "L5_LEGAL_HUB_HOSTED";
  if (/legal-notice|imprint|controller|contact/.test(text)) return "L6_ENTITY_NOTICE";
  return "L1_CORE_TERMS_PRIVACY";
}

function guessDataSubfamily(text) {
  if (/subprocessor|privacy-center|data-protection|gdpr|dpa/.test(text)) return "D2_SUBPROCESSOR_PRIVACY_CENTER";
  if (/customer-data|data-processing|data-residency|retention|deletion|export/.test(text)) return "D3_DATA_GOVERNANCE_CONTROLS";
  if (/docs|developer|api|webhook|connector|integration|auth|permission|audit/.test(text)) return "D4_DOCS_API_DATA_FLOW";
  if (/responsible-ai|transparency|model-card|model-details|usage-policy|safety/.test(text)) return "D5_AI_SAFETY_TRANSPARENCY";
  return "D1_SECURITY_TRUST";
}

function guessProductSubfamily(text) {
  if (/\/product\/|\/products\//.test(text)) return "P1_PRODUCT_SLUG";
  if (/model|agent|assistant|studio|api|developer|docs|integration|connector|workflow|automation|search|knowledge|vault/.test(text)) {
    return "P3_AI_CAPABILITY_TECHNICAL";
  }
  if (/use-case|industr|customer/.test(text)) return "P4_USE_CASE_INDUSTRY";
  if (/pricing|enterprise|contact-sales|plans/.test(text)) return "P5_ENTERPRISE_PRICING";
  if (/feature|solution|platform/.test(text)) return "P2_PLATFORM_FEATURE_SOLUTION";
  return "P0_PRODUCT_ROOT";
}

function guessTargetSubfamily(text) {
  if (/legal-notice|imprint|contact|legal/.test(text)) return "T2_LEGAL_IDENTITY";
  if (/privacy|terms|dpa/.test(text)) return "T3_OPERATOR_ENTITY";
  if (/team|careers|newsroom|press/.test(text)) return "T4_SUPPORTING_IDENTITY";
  return "T1_IDENTITY";
}

function isHostedGovernanceHost(host) {
  return /iubenda|termly|termsfeed|onetrust|trustarc|vanta|drata|secureframe|safebase|trustcloud|whistic|conveyor|notion|webflow|github\.io/i.test(
    host
  );
}

function domainToName(domain) {
  return String(domain || "").split(".")[0].replace(/[-_]/g, " ");
}
