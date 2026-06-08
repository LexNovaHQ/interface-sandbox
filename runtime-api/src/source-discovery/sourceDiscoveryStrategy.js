export const DETERMINISTIC_SUPPORT_PATHS_BY_FAMILY = {
  product_profile: [
    "/",
    "/about",
    "/about-us",
    "/company",
    "/products",
    "/product",
    "/platform",
    "/solutions",
    "/use-cases",
    "/features",
    "/models"
  ],
  legal_governance: [
    "/legal",
    "/terms",
    "/terms-of-service",
    "/privacy",
    "/privacy-policy",
    "/security",
    "/trust",
    "/compliance",
    "/data-protection",
    "/dpa",
    "/data-processing-addendum",
    "/subprocessors",
    "/cookie-policy",
    "/acceptable-use",
    "/acceptable-use-policy",
    "/aup",
    "/sla",
    "/responsible-ai",
    "/ai-policy",
    "/governance"
  ],
  docs_developer: [
    "/docs",
    "/documentation",
    "/developer",
    "/developers",
    "/api",
    "/apis",
    "/reference",
    "/sdk",
    "/guide",
    "/quickstart"
  ],
  commercial: [
    "/pricing",
    "/plans",
    "/enterprise",
    "/contact-sales",
    "/sales"
  ],
  updates: [
    "/blog",
    "/changelog",
    "/release-notes",
    "/updates",
    "/news",
    "/announcements"
  ]
};

const VALID_FAMILIES = new Set(Object.keys(DETERMINISTIC_SUPPORT_PATHS_BY_FAMILY));

function normalizeBaseOrigin(value) {
  const parsed = new URL(value);
  parsed.hash = "";
  parsed.search = "";
  return `${parsed.protocol}//${parsed.hostname.toLowerCase().replace(/^www\./, "")}`;
}

function joinUrl(origin, path) {
  const cleanPath = path === "/" ? "/" : "/" + String(path).replace(/^\/+/, "");
  return cleanPath === "/" ? origin : `${origin}${cleanPath}`;
}

export function buildDeterministicSourceCandidates({ normalized_origin, source_families = null }) {
  const origin = normalizeBaseOrigin(normalized_origin);
  const requestedFamilies = Array.isArray(source_families) && source_families.length > 0
    ? source_families.filter((family) => VALID_FAMILIES.has(family))
    : [...VALID_FAMILIES];

  const seen = new Set();
  const candidates = [];

  for (const family of requestedFamilies) {
    const paths = DETERMINISTIC_SUPPORT_PATHS_BY_FAMILY[family] || [];
    for (const path of paths) {
      const url = joinUrl(origin, path);
      const key = `${family}::${url}`;
      if (seen.has(key)) continue;
      seen.add(key);
      candidates.push({
        url,
        source_family: family,
        discovery_method: "deterministic_support_probe",
        reason: "support probe used only after Gemini primary discovery did not meet family coverage target",
        batch_id: `support_${family}`
      });
    }
  }

  return candidates;
}

export function buildSearchDiscoveryBatches({ registrable_domain, company_name = null }) {
  const domain = registrable_domain;
  const nameHint = company_name ? ` OR "${company_name}"` : "";

  return [
    {
      batch_id: "product_profile_core",
      priority: 1,
      source_family: "product_profile",
      queries: [
        `site:${domain} product OR products OR platform OR feature OR features${nameHint}`,
        `site:${domain}/products/ product OR products OR agents OR studio OR models OR OCR OR vision`,
        `site:${domain} solution OR solutions OR use-case OR use-cases OR industry OR industries`,
        `site:${domain} about OR company OR team OR customers`
      ]
    },
    {
      batch_id: "legal_governance_core",
      priority: 1,
      source_family: "legal_governance",
      queries: [
        `site:${domain} privacy OR terms OR legal OR cookie`,
        `site:${domain} security OR trust OR compliance OR status`,
        `site:${domain} DPA OR subprocessors OR acceptable-use OR SLA`,
        `site:${domain} responsible-ai OR governance OR data-protection OR AI-policy`
      ]
    },
    {
      batch_id: "ai_capabilities",
      priority: 2,
      source_family: "product_profile",
      queries: [
        `site:${domain} AI OR model OR models OR LLM OR agent OR agents`,
        `site:${domain} voice OR speech OR transcription OR translation OR translate`,
        `site:${domain} studio OR document OR OCR OR vision OR workflow OR API OR APIs`
      ]
    },
    {
      batch_id: "docs_developer",
      priority: 2,
      source_family: "docs_developer",
      queries: [
        `site:${domain} docs OR documentation OR developer OR developers`,
        `site:${domain} API OR reference OR SDK OR guide OR quickstart`,
        `site:${domain} help OR support OR integration OR integrations`
      ]
    },
    {
      batch_id: "commercial",
      priority: 2,
      source_family: "commercial",
      queries: [
        `site:${domain} pricing OR plans OR enterprise OR contact-sales`,
        `site:${domain} signup OR sign-up OR onboarding OR dashboard`
      ]
    },
    {
      batch_id: "product_updates",
      priority: 3,
      source_family: "updates",
      queries: [
        `site:${domain} blog OR changelog OR release-notes OR updates`,
        `site:${domain} launch OR announced OR new-feature OR product-update`
      ]
    }
  ];
}

export function flattenSearchQueries(batches) {
  return batches.flatMap((batch) => batch.queries.map((query) => ({
    batch_id: batch.batch_id,
    priority: batch.priority,
    source_family: batch.source_family,
    query
  })));
}
