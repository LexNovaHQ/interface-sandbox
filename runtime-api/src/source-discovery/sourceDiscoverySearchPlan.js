export const SOURCE_DISCOVERY_MAGNA_CARTA_VERSION = "source_discovery_magna_carta_v1";

export const SOURCE_DISCOVERY_FAMILIES = [
  {
    source_family: "company_profile",
    priority: 1,
    target_min: 1,
    target_max: 5,
    label: "Company Profile",
    mission: "Find first-party pages that establish company identity, public positioning, geography/entity clues, market posture, and broad marketing claims.",
    page_family_plan: [
      "Start with homepage and core company/about anchors.",
      "Expand to first-party about, company, team, mission, customer, and case-study pages only if they reveal company identity, market posture, or product/company substance.",
      "Reject pure contact, demo, sales, signup, auth, or generic pricing pages unless they reveal substantive company/product information."
    ],
    common_route_hints: ["/", "/about", "/about-us", "/company", "/team", "/mission", "/customers", "/customer-stories", "/case-studies"],
    query_terms: ["about", "about us", "company", "team", "mission", "customers", "customer stories", "case studies", "company profile", "market", "platform"]
  },
  {
    source_family: "product_profile",
    priority: 1,
    target_min: 4,
    target_max: 15,
    label: "Product Profile",
    mission: "Find first-party pages that explain products, product features, models, APIs, workflows, agents, inputs, outputs, deployment modes, integrations, docs, or product capabilities.",
    page_family_plan: [
      "Start with product/platform/model/API/docs anchors and every first-party link those anchors lead to.",
      "Find named products, named models, named agents, feature pages, API/reference pages, deployment pages, integration pages, and capability pages.",
      "Prefer concrete pages that reveal features, mechanics, inputs/outputs, endpoints, workflows, deployment options, integrations, or feature tiers.",
      "Blog, news, release, customer, case-study, pricing, and plan pages survive only if they reveal product features, product movement, feature tiers, or usage mechanics."
    ],
    common_route_hints: ["/", "/products", "/product", "/platform", "/features", "/solutions", "/use-cases", "/models", "/agents", "/studio", "/apis", "/api", "/developers", "/developer", "/docs", "/documentation", "/reference", "/sdk", "/quickstart", "/guides", "/integrations", "/playground", "/blog", "/changelog", "/release-notes", "/updates", "/news", "/announcements", "/releases", "/customers", "/customer-stories", "/case-studies", "/pricing", "/plans"],
    query_terms: ["product", "products", "features", "platform", "solutions", "use cases", "models", "agents", "studio", "API", "docs", "developer", "documentation", "reference", "SDK", "quickstart", "integrations", "voice", "speech", "text to speech", "speech to text", "transcription", "translation", "dubbing", "document intelligence", "OCR", "vision", "workflow agents", "deployment", "private cloud", "on prem", "VPC"]
  },
  {
    source_family: "legal_profile",
    priority: 1,
    target_min: 1,
    target_max: 12,
    label: "Legal Profile",
    mission: "Find first-party binding legal terms and customer/user/data obligations, including Terms, Privacy, DPA, SLA, EULA, AUP, subprocessors, cookie policy, and data protection terms. Embedded legal artifacts count; if a DPA or SLA is inside Terms, return the containing Terms URL.",
    page_family_plan: [
      "Start with legal/footer anchors and every first-party legal link those anchors lead to.",
      "Find Terms, Privacy, Cookie Policy, DPA, data processing, subprocessors, AUP, EULA, SLA, and legal center pages.",
      "If legal artifacts are embedded in a containing page, return the containing first-party URL and identify the embedded artifact in the reason field.",
      "Do not classify trust/security/compliance pages here unless they contain binding legal/customer obligations."
    ],
    common_route_hints: ["/legal", "/terms", "/terms-of-service", "/terms-and-conditions", "/privacy", "/privacy-policy", "/cookie-policy", "/data-protection", "/dpa", "/data-processing-addendum", "/subprocessors", "/acceptable-use", "/acceptable-use-policy", "/aup", "/eula", "/sla"],
    query_terms: ["legal", "terms", "terms of service", "terms and conditions", "privacy", "privacy policy", "cookie policy", "data protection", "DPA", "data processing addendum", "subprocessors", "acceptable use", "AUP", "EULA", "SLA"]
  },
  {
    source_family: "governance_profile",
    priority: 1,
    target_min: 0,
    target_max: 12,
    label: "Governance Profile",
    mission: "Find first-party trust, security, compliance, responsible AI, safety, governance, certifications, auditability, model/data controls, and status/incident posture pages.",
    page_family_plan: [
      "Start with trust, security, compliance, status, responsible-AI, governance, and safety anchors.",
      "Find first-party pages that explain data security, enterprise security, certifications, model safety, responsible AI, governance controls, status, or auditability.",
      "Classify subprocessor governance here only if framed as trust/security/compliance rather than legal terms.",
      "Do not classify generic product or legal pages here unless they contain governance/security/compliance posture."
    ],
    common_route_hints: ["/trust", "/trust-center", "/security", "/compliance", "/status", "/responsible-ai", "/ai-policy", "/governance", "/safety", "/model-safety", "/data-security", "/certifications", "/enterprise-security"],
    query_terms: ["trust", "trust center", "security", "compliance", "status", "responsible AI", "AI policy", "governance", "safety", "model safety", "data security", "certifications", "enterprise security", "SOC 2", "ISO"]
  }
];

function quoteTerm(term) {
  return term.includes(" ") ? `"${term}"` : term;
}

function routeHintQuery(domain, family) {
  const hints = Array.isArray(family.common_route_hints) ? family.common_route_hints : [];
  return hints.map((hint) => `site:${domain}${hint}`).join(" OR ");
}

function anchorUrlsForFamily({ normalized_origin, family }) {
  const origin = String(normalized_origin || "").replace(/\/+$/, "");
  const hints = Array.isArray(family.common_route_hints) ? family.common_route_hints : [];
  const anchors = [origin || null, ...hints.map((hint) => `${origin}${hint.startsWith("/") ? hint : "/" + hint}`)];
  return [...new Set(anchors.filter(Boolean))];
}

function compactTerms(terms = [], limit = 12) {
  return terms.slice(0, limit).map(quoteTerm).join(" OR ");
}

function buildRetrievalIntents({ domain, companyHint, family }) {
  const routeHints = routeHintQuery(domain, family);
  const focusedTerms = compactTerms(family.query_terms, 12);
  const broadTerms = family.query_terms.map(quoteTerm).join(" OR ");
  const nameClause = companyHint ? ` OR ${companyHint}` : "";
  return [
    { intent_id: "family_anchor_minimum", label: "Inspect minimum family anchors first", query: routeHints || `site:${domain} (${focusedTerms}${nameClause})`, instruction: "The anchor URLs are the minimum surfaces that must be inspected first. They are not limits. Everything first-party that the anchors lead to must be considered for classification." },
    { intent_id: "family_feature_or_artifact_expansion", label: "Expand from anchors into linked first-party detail pages", query: `site:${domain} (${focusedTerms}${nameClause})`, instruction: "Find deeper first-party pages reached from the anchors or public search results. Prefer feature, product, legal, governance, or company-substance pages over generic pages." },
    { intent_id: "free_first_party_search", label: "Free first-party search for anything missed", query: `site:${domain} (${broadTerms}${nameClause})`, instruction: "Run a compact free first-party search to catch anything not reached through anchors. Do not include third-party pages. Do not include low-value pages unless they reveal substance for the requested family." }
  ];
}

export function buildFamilySearchQueries({ registrable_domain, company_name = null, normalized_origin = null }) {
  const domain = String(registrable_domain || "").trim().toLowerCase();
  if (!domain) throw new Error("registrable_domain is required");
  const inferredOrigin = normalized_origin || `https://${domain}`;
  const companyHint = company_name ? `"${company_name}"` : "";
  return SOURCE_DISCOVERY_FAMILIES.map((family) => {
    const groupedTerms = family.query_terms.map(quoteTerm).join(" OR ");
    const companyClause = company_name ? ` OR "${company_name}"` : "";
    const routeHints = routeHintQuery(domain, family);
    const routeHintClause = routeHints ? ` OR (${routeHints})` : "";
    const query = `site:${domain} (${groupedTerms}${companyClause})${routeHintClause}`;
    return { ...family, anchor_urls: anchorUrlsForFamily({ normalized_origin: inferredOrigin, family }), query, retrieval_intents: buildRetrievalIntents({ domain, companyHint, family }) };
  });
}

function lines(items = []) {
  return (items || []).map((item) => `- ${item}`).join("\n");
}

export function buildBoundedGeminiUrlDiscoveryPrompt({ primary_url, normalized_origin, registrable_domain, company_name = null, family_plan, retrieval_intent = null }) {
  const activeIntent = retrieval_intent || { intent_id: "family_anchor_minimum", label: "Inspect minimum family anchors first", query: family_plan.query, instruction: "Inspect the family anchors and return first-party URLs for this family." };
  const attemptedQuery = String(activeIntent.query || family_plan.query).replace(/"/g, String.fromCharCode(39));
  return `You are the Source Discovery engine for Lex Nova HQ legal architecture diligence.

MAGNA CARTA SOURCE DISCOVERY RULES
- Gemini discovers and classifies.
- Deterministic code fetches, extracts, normalizes, deduplicates, verifies first-party status, and prepares source text.
- Provenance reports history. Provenance never blocks a URL before classification.
- Only four final families exist: company_profile, product_profile, legal_profile, governance_profile.
- The anchor URLs are minimum surfaces to inspect first. They are not limits.
- Everything first-party that an anchor leads to must be considered for classification.
- After anchor coverage, use a compact free first-party search to catch anything missed.

TARGET
- primary_url: ${primary_url}
- normalized_origin: ${normalized_origin}
- registrable_domain: ${registrable_domain}
- company_name: ${company_name || "unknown"}

BOUNDARIES
- Return first-party URLs only.
- Include same-domain and first-party subdomain URLs.
- Do not include LinkedIn, Crunchbase, GitHub, app stores, news sites, social media, third-party URLs, images, CSS, JS, font files, tracking URLs, ad URLs, login-only URLs, unsafe protocols, or malformed URLs.
- Do not invent URLs.
- Do not summarize page contents.
- Do not return full text.

SOURCE FAMILY
- source_family: ${family_plan.source_family}
- label: ${family_plan.label}
- mission: ${family_plan.mission}
- target_min: ${family_plan.target_min}
- target_max_guidance: ${family_plan.target_max}

PAGE-FAMILY PLAN
${lines(family_plan.page_family_plan)}

MINIMUM FAMILY ANCHOR URLS TO INSPECT FIRST
${lines(family_plan.anchor_urls)}

KNOWN/COMMON ROUTE HINTS
${lines(family_plan.common_route_hints)}

ANCHOR RULE
- The listed anchors are the minimum starting points.
- They are not limits.
- If a first-party anchor leads to deeper first-party pages that belong to this family, those deeper pages must be returned.
- Do not stop at homepage/about pages when deeper product, legal, governance, or company-substance pages are visible.

RETRIEVAL INTENT
- intent_id: ${activeIntent.intent_id}
- label: ${activeIntent.label}
- instruction: ${activeIntent.instruction}

SEARCH QUERY / RETRIEVAL HINT
${activeIntent.query}

Return only valid JSON in this exact shape:
{
  "source_discovery_version": "${SOURCE_DISCOVERY_MAGNA_CARTA_VERSION}",
  "source_family": "${family_plan.source_family}",
  "retrieval_intent_id": "${activeIntent.intent_id}",
  "urls": [
    { "url": "https://example.com/path", "reason": "short reason explaining why this URL belongs to this source family and retrieval intent", "discovery_method": "gemini_search" }
  ],
  "coverage_gap": null
}

If no source is publicly found, return:
{
  "source_discovery_version": "${SOURCE_DISCOVERY_MAGNA_CARTA_VERSION}",
  "source_family": "${family_plan.source_family}",
  "retrieval_intent_id": "${activeIntent.intent_id}",
  "urls": [],
  "coverage_gap": { "source_family": "${family_plan.source_family}", "retrieval_intent_id": "${activeIntent.intent_id}", "target_minimum": ${family_plan.target_min}, "found": 0, "attempted_query": "${attemptedQuery}", "reason": "No public first-party source found." }
}`;
}
