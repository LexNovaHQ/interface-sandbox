export const SOURCE_DISCOVERY_FAMILIES = [
  {
    source_family: "product_profile",
    priority: 1,
    target_min: 4,
    target_max: 12,
    label: "Product / Profile",
    mission: "Find first-party pages explaining what the company is, what products it offers, what capabilities/features exist, and what the platform does. Product pages are core evidence for feature mapping and must include product index pages plus nested product detail pages where available.",
    page_family_plan: [
      "Find the product or platform navigation surface first.",
      "Expand beyond homepage/about into first-party product detail pages, capability pages, model pages, agent pages, solution pages, and API/product pages.",
      "Prefer pages that describe concrete product mechanics, named products, named models, named agents, workflow capabilities, input/output behavior, deployment options, or integrations.",
      "Return distinct capability URLs; do not return repeated generic profile pages when deeper first-party product pages are discoverable."
    ],
    common_route_hints: [
      "/products",
      "/product",
      "/platform",
      "/solutions",
      "/features",
      "/models",
      "/agents",
      "/studio",
      "/apis"
    ],
    query_terms: [
      "product",
      "products",
      "product pages",
      "platform",
      "features",
      "solutions",
      "use cases",
      "about",
      "company",
      "team",
      "customers",
      "models",
      "AI",
      "voice",
      "speech",
      "translation",
      "transcription",
      "agents",
      "conversational agents",
      "workflow agents",
      "studio",
      "document intelligence",
      "OCR",
      "vision",
      "dubbing"
    ]
  },
  {
    source_family: "legal_governance",
    priority: 1,
    target_min: 1,
    target_max: 6,
    label: "Legal / Governance",
    mission: "Find first-party pages containing legal terms, privacy, security, trust, compliance, responsible AI, governance, DPA, subprocessors, acceptable use, SLA, or cookie/data protection posture.",
    page_family_plan: [
      "Find first-party legal navigation surfaces and footer legal links.",
      "Expand beyond Terms and Privacy where separate DPA, SLA, security, trust, compliance, subprocessor, acceptable-use, cookie, responsible-AI, or governance pages exist.",
      "If legal artifacts are embedded inside a Terms page rather than standalone pages, return the containing first-party URL and explain the embedded artifact in the reason field.",
      "Do not treat marketing/product pages as legal evidence unless the page itself contains legal/governance obligations or disclosures."
    ],
    common_route_hints: [
      "/legal",
      "/terms",
      "/terms-of-service",
      "/privacy",
      "/privacy-policy",
      "/security",
      "/trust",
      "/compliance",
      "/dpa",
      "/data-processing-addendum",
      "/subprocessors",
      "/acceptable-use",
      "/sla",
      "/responsible-ai"
    ],
    query_terms: [
      "terms",
      "terms of service",
      "privacy",
      "privacy policy",
      "legal",
      "security",
      "trust",
      "compliance",
      "DPA",
      "data processing",
      "subprocessors",
      "acceptable use",
      "SLA",
      "cookie",
      "responsible AI",
      "governance",
      "data protection"
    ]
  },
  {
    source_family: "docs_developer",
    priority: 1,
    target_min: 1,
    target_max: 8,
    label: "Docs / Developer / API",
    mission: "Find first-party developer, API, docs, documentation, SDK, guide, quickstart, integration, or reference pages showing how the product is used technically.",
    page_family_plan: [
      "Find the developer/docs/API navigation surface first.",
      "Expand to first-party API reference, quickstart, SDK, authentication, endpoint, guide, playground, integration, or model-specific docs where available.",
      "Prefer pages showing technical mechanism, inputs/outputs, endpoints, SDKs, or implementation behavior.",
      "Do not use third-party GitHub, package registries, or community docs unless they are first-party controlled and hosted on the company's domain/subdomain."
    ],
    common_route_hints: [
      "/docs",
      "/documentation",
      "/developer",
      "/developers",
      "/api",
      "/apis",
      "/reference",
      "/sdk",
      "/quickstart",
      "/guides"
    ],
    query_terms: [
      "docs",
      "documentation",
      "developer",
      "developers",
      "API",
      "API reference",
      "SDK",
      "guide",
      "quickstart",
      "integration",
      "reference"
    ]
  },
  {
    source_family: "commercial",
    priority: 2,
    target_min: 1,
    target_max: 4,
    label: "Commercial / Enterprise",
    mission: "Find first-party pricing, plans, enterprise, sales, contact-sales, onboarding, or commercial posture pages.",
    page_family_plan: [
      "Find first-party pricing, plans, enterprise, contact-sales, demo, onboarding, procurement, dashboard, or account creation surfaces.",
      "Prefer pages that reveal buyer flow, enterprise posture, account tiers, onboarding path, or commercial constraints.",
      "A contact page can belong here only if it is the best available commercial/sales route; do not treat it as product or legal evidence.",
      "If no commercial page is public, return a coverage gap rather than inventing a sales/pricing URL."
    ],
    common_route_hints: [
      "/pricing",
      "/plans",
      "/enterprise",
      "/contact-sales",
      "/sales",
      "/contact",
      "/demo",
      "/signup",
      "/dashboard"
    ],
    query_terms: [
      "pricing",
      "plans",
      "enterprise",
      "contact sales",
      "sales",
      "contact",
      "onboarding",
      "signup",
      "dashboard",
      "demo"
    ]
  },
  {
    source_family: "updates",
    priority: 2,
    target_min: 1,
    target_max: 5,
    label: "Updates / Blog / Releases",
    mission: "Find first-party blog, changelog, release note, announcement, launch, update, or product update pages that reveal product movement.",
    page_family_plan: [
      "Find first-party blog, updates, changelog, release notes, news, announcement, launch, or product-update surfaces.",
      "Prefer pages with product movement, feature launches, model releases, version changes, policy changes, or dated announcements.",
      "Do not use third-party press/news sites as source evidence for this family.",
      "If no updates surface is public, return a coverage gap instead of reusing generic homepage/product pages."
    ],
    common_route_hints: [
      "/blog",
      "/changelog",
      "/release-notes",
      "/updates",
      "/news",
      "/announcements",
      "/releases"
    ],
    query_terms: [
      "blog",
      "changelog",
      "release notes",
      "updates",
      "news",
      "announcements",
      "launch",
      "product update",
      "new feature",
      "release"
    ]
  }
];

function quoteTerm(term) {
  return term.includes(" ") ? `"${term}"` : term;
}

function routeHintQuery(domain, family) {
  const hints = Array.isArray(family.common_route_hints) ? family.common_route_hints : [];
  if (!hints.length) return "";
  return hints.map((hint) => `site:${domain}${hint.endsWith("/") ? hint : hint + ""}`).join(" OR ");
}

export function buildFamilySearchQueries({ registrable_domain, company_name = null }) {
  const domain = String(registrable_domain || "").trim().toLowerCase();
  if (!domain) {
    throw new Error("registrable_domain is required");
  }

  return SOURCE_DISCOVERY_FAMILIES.map((family) => {
    const groupedTerms = family.query_terms.map(quoteTerm).join(" OR ");
    const companyHint = company_name ? ` OR "${company_name}"` : "";
    const routeHints = routeHintQuery(domain, family);
    const routeHintClause = routeHints ? ` OR (${routeHints})` : "";

    return {
      source_family: family.source_family,
      priority: family.priority,
      target_min: family.target_min,
      target_max: family.target_max,
      label: family.label,
      mission: family.mission,
      page_family_plan: family.page_family_plan,
      common_route_hints: family.common_route_hints,
      query: `site:${domain} (${groupedTerms}${companyHint})${routeHintClause}`
    };
  });
}

function lines(items = []) {
  return (items || []).map((item) => `- ${item}`).join("\n");
}

export function buildBoundedGeminiUrlDiscoveryPrompt({
  primary_url,
  normalized_origin,
  registrable_domain,
  company_name = null,
  family_plan
}) {
  return `You are the source discovery engine for Lex Nova HQ legal architecture diligence.

Your job is to find first-party source URLs for a company for exactly one source family.

Input:
- primary_url: ${primary_url}
- normalized_origin: ${normalized_origin}
- registrable_domain: ${registrable_domain}
- company_name: ${company_name || "unknown"}

Architecture rule:
- Gemini is the PRIMARY discovery layer for every source family.
- Deterministic systems later validate, probe, fetch, dedupe, and prepare sources. They do not replace your discovery work.
- Your output must therefore be a serious page-family discovery plan result, not a shallow homepage/footer guess.

Boundaries:
- Return first-party URLs only.
- Include same-domain and first-party subdomain URLs.
- Do not include LinkedIn, Crunchbase, GitHub, app stores, news sites, social media, or third-party URLs.
- Do not invent URLs.
- Do not summarize.
- Do not return page descriptions except the short reason field.
- Search specifically for the requested source family.
- Find ${family_plan.target_min} to ${family_plan.target_max} strong URLs for this source family if publicly available.
- If none are publicly discoverable, return an empty urls array and explain the coverage gap.

Source family:
- source_family: ${family_plan.source_family}
- label: ${family_plan.label}
- mission: ${family_plan.mission}
- target_min: ${family_plan.target_min}
- target_max: ${family_plan.target_max}

Page-family discovery plan:
${lines(family_plan.page_family_plan)}

Known/common route hints:
${lines(family_plan.common_route_hints)}

Important:
- The common route hints are hints only. They are not a limit.
- You must look beyond these common routes when first-party pages exist under different naming conventions.
- Return the best first-party pages for this family even if their paths differ from the hints.
- Do not fill the result with generic pages when deeper family-specific pages are discoverable.

Search query to use as retrieval intent:
${family_plan.query}

Return only valid JSON in this exact shape:
{
  "source_family": "${family_plan.source_family}",
  "urls": [
    {
      "url": "https://example.com/path",
      "reason": "short reason explaining why this URL belongs to this source family",
      "discovery_method": "gemini_search"
    }
  ],
  "coverage_gap": null
}

If no source is publicly found, return:
{
  "source_family": "${family_plan.source_family}",
  "urls": [],
  "coverage_gap": {
    "source_family": "${family_plan.source_family}",
    "target_minimum": ${family_plan.target_min},
    "found": 0,
    "attempted_query": "${family_plan.query.replace(/"/g, String.fromCharCode(39))}",
    "status": "not_publicly_found"
  }
}
`;
}