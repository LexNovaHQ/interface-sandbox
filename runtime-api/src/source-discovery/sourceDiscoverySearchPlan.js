export const SOURCE_DISCOVERY_FAMILIES = [
  {
    source_family: "product_profile",
    priority: 1,
    target_min: 4,
    target_max: 12,
    label: "Product / Profile",
    mission: "Find first-party pages explaining what the company is, what products it offers, what capabilities/features exist, and what the platform does. Product pages are core evidence for feature mapping and must include product index pages plus nested product detail pages where available.",
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
    target_max: 3,
    label: "Legal / Governance",
    mission: "Find first-party pages containing legal terms, privacy, security, trust, compliance, responsible AI, governance, DPA, subprocessors, acceptable use, SLA, or cookie/data protection posture.",
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
    target_max: 5,
    label: "Docs / Developer / API",
    mission: "Find first-party developer, API, docs, documentation, SDK, guide, quickstart, integration, or reference pages showing how the product is used technically.",
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
    target_max: 3,
    label: "Commercial / Enterprise",
    mission: "Find first-party pricing, plans, enterprise, sales, contact-sales, onboarding, or commercial posture pages.",
    query_terms: [
      "pricing",
      "plans",
      "enterprise",
      "contact sales",
      "sales",
      "contact",
      "onboarding",
      "signup",
      "dashboard"
    ]
  },
  {
    source_family: "updates",
    priority: 2,
    target_min: 1,
    target_max: 3,
    label: "Updates / Blog / Releases",
    mission: "Find first-party blog, changelog, release note, announcement, launch, update, or product update pages that reveal product movement.",
    query_terms: [
      "blog",
      "changelog",
      "release notes",
      "updates",
      "news",
      "announcements",
      "launch",
      "product update",
      "new feature"
    ]
  }
];

function quoteTerm(term) {
  return term.includes(" ") ? `"${term}"` : term;
}

export function buildFamilySearchQueries({ registrable_domain, company_name = null }) {
  const domain = String(registrable_domain || "").trim().toLowerCase();
  if (!domain) {
    throw new Error("registrable_domain is required");
  }

  return SOURCE_DISCOVERY_FAMILIES.map((family) => {
    const groupedTerms = family.query_terms.map(quoteTerm).join(" OR ");
    const companyHint = company_name ? ` OR "${company_name}"` : "";
    const productPathHint = family.source_family === "product_profile" ? ` OR site:${domain}/products/` : "";

    return {
      source_family: family.source_family,
      priority: family.priority,
      target_min: family.target_min,
      target_max: family.target_max,
      label: family.label,
      mission: family.mission,
      query: `site:${domain} (${groupedTerms}${companyHint})${productPathHint}`
    };
  });
}

export function buildBoundedGeminiUrlDiscoveryPrompt({
  primary_url,
  normalized_origin,
  registrable_domain,
  company_name = null,
  family_plan
}) {
  const productInstruction = family_plan.source_family === "product_profile"
    ? "\nProduct discovery priority:\n- Product pages are core evidence for feature mapping.\n- Do not stop at the homepage/about/models page if first-party nested product pages exist.\n- Prefer product detail pages under /products/*, /product/*, /solutions/*, /agents/*, /studio, /models, /apis, or equivalent product-capability paths.\n- Return distinct product capability URLs, not repeated generic pages.\n"
    : "";

  return `You are the source discovery engine for Lex Nova HQ legal architecture diligence.

Your job is to find first-party source URLs for a company.

Input:
- primary_url: ${primary_url}
- normalized_origin: ${normalized_origin}
- registrable_domain: ${registrable_domain}
- company_name: ${company_name || "unknown"}

Boundaries:
- Return first-party URLs only.
- Include same-domain and first-party subdomain URLs.
- Do not include LinkedIn, Crunchbase, GitHub, app stores, news sites, social media, or third-party URLs.
- Do not invent URLs.
- Do not summarize.
- Do not return page descriptions except the short reason field.
- Search specifically for the requested source family.
- Find ${family_plan.target_min} to ${family_plan.target_max} strong URLs for this source family if publicly available.
- If none are publicly discoverable, return an empty urls array and explain the coverage gap.${productInstruction}

Source family:
- source_family: ${family_plan.source_family}
- label: ${family_plan.label}
- mission: ${family_plan.mission}
- target_min: ${family_plan.target_min}
- target_max: ${family_plan.target_max}

Search query to use as retrieval intent:
${family_plan.query}

Return only valid JSON in this exact shape:
{
  "source_family": "${family_plan.source_family}",
  "urls": [
    {
      "url": "https://example.com/path",
      "reason": "short reason",
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
