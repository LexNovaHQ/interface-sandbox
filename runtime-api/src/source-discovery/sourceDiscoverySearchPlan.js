export const SOURCE_DISCOVERY_MAGNA_CARTA_VERSION = "source_discovery_magna_carta_v1";

const NO_SOURCE_CAP = Number.MAX_SAFE_INTEGER;

export const SOURCE_DISCOVERY_FAMILIES = [
  {
    source_family: "company_profile",
    priority: 1,
    target_min: 1,
    target_max: NO_SOURCE_CAP,
    label: "Company Profile",
    mission: "Find first-party company identity, market, customer, team, mission, and company-substance pages.",
    page_family_plan: ["Inspect homepage/about anchors first.", "Return every first-party company-substance page found; anchors are not limits."],
    common_route_hints: ["/", "/about", "/about-us", "/company", "/team", "/mission", "/customers", "/customer-stories", "/case-studies"],
    query_terms: ["about", "about us", "company", "team", "mission", "customers", "case studies", "company profile", "market", "platform"]
  },
  {
    source_family: "product_profile",
    priority: 1,
    target_min: 4,
    target_max: NO_SOURCE_CAP,
    label: "Product Profile",
    mission: "Find first-party product, feature, model, API, docs, workflow, deployment, integration, and capability pages.",
    page_family_plan: ["Inspect product/platform/model/API/docs anchors first.", "Return every first-party product/API/capability page found; anchors and target_max are not caps."],
    common_route_hints: ["/", "/products", "/product", "/platform", "/features", "/solutions", "/use-cases", "/models", "/agents", "/studio", "/apis", "/api", "/developers", "/developer", "/docs", "/documentation", "/reference", "/sdk", "/quickstart", "/guides", "/integrations", "/playground", "/blog", "/changelog", "/release-notes", "/updates", "/news", "/announcements", "/releases", "/customers", "/customer-stories", "/case-studies", "/pricing", "/plans"],
    query_terms: ["product", "products", "features", "platform", "solutions", "use cases", "models", "agents", "studio", "API", "docs", "developer", "documentation", "reference", "SDK", "quickstart", "integrations", "voice", "speech", "text to speech", "speech to text", "transcription", "translation", "dubbing", "document intelligence", "OCR", "workflow agents", "deployment"]
  },
  {
    source_family: "legal_profile",
    priority: 1,
    target_min: 1,
    target_max: NO_SOURCE_CAP,
    label: "Legal Profile",
    mission: "Find first-party legal terms, privacy, DPA, SLA, EULA, AUP, subprocessors, cookies, and data-protection pages.",
    page_family_plan: ["Inspect legal/footer anchors first.", "Return every first-party legal/customer obligation page found; embedded legal artifacts count."],
    common_route_hints: ["/legal", "/terms", "/terms-of-service", "/terms-and-conditions", "/privacy", "/privacy-policy", "/cookie-policy", "/data-protection", "/dpa", "/data-processing-addendum", "/subprocessors", "/acceptable-use", "/acceptable-use-policy", "/aup", "/eula", "/sla"],
    query_terms: ["legal", "terms", "terms of service", "terms and conditions", "privacy", "privacy policy", "cookie policy", "data protection", "DPA", "data processing addendum", "subprocessors", "acceptable use", "AUP", "EULA", "SLA"]
  },
  {
    source_family: "governance_profile",
    priority: 1,
    target_min: 0,
    target_max: NO_SOURCE_CAP,
    label: "Governance Profile",
    mission: "Find first-party trust, security, compliance, responsible AI, safety, governance, certifications, status, and model/data-control pages.",
    page_family_plan: ["Inspect trust/security/compliance anchors first.", "Return every first-party governance/security/compliance page found."],
    common_route_hints: ["/trust", "/trust-center", "/security", "/compliance", "/status", "/responsible-ai", "/ai-policy", "/governance", "/safety", "/model-safety", "/data-security", "/certifications", "/enterprise-security"],
    query_terms: ["trust", "trust center", "security", "compliance", "status", "responsible AI", "AI policy", "governance", "safety", "model safety", "data security", "certifications", "enterprise security", "SOC 2", "ISO"]
  }
];

function quoteTerm(term) { return term.includes(" ") ? `"${term}"` : term; }
function routeHintQuery(domain, family) { return (family.common_route_hints || []).map((hint) => `site:${domain}${hint}`).join(" OR "); }
function anchorUrlsForFamily({ normalized_origin, family }) {
  const origin = String(normalized_origin || "").replace(/\/+$/, "");
  return [...new Set([origin || null, ...(family.common_route_hints || []).map((hint) => `${origin}${hint.startsWith("/") ? hint : "/" + hint}`)].filter(Boolean))];
}
function compactTerms(terms = [], limit = 12) { return terms.slice(0, limit).map(quoteTerm).join(" OR "); }
function buildRetrievalIntents({ domain, companyHint, family }) {
  const routeHints = routeHintQuery(domain, family);
  const focusedTerms = compactTerms(family.query_terms, 12);
  const broadTerms = family.query_terms.map(quoteTerm).join(" OR ");
  const nameClause = companyHint ? ` OR ${companyHint}` : "";
  return [
    { intent_id: "family_anchor_minimum", label: "Inspect minimum family anchors first", query: routeHints || `site:${domain} (${focusedTerms}${nameClause})`, instruction: "Anchors are minimum surfaces, not limits. Consider every linked first-party page in the requested family." },
    { intent_id: "family_feature_or_artifact_expansion", label: "Expand from anchors", query: `site:${domain} (${focusedTerms}${nameClause})`, instruction: "Find deeper first-party pages in this family." },
    { intent_id: "free_first_party_search", label: "Free first-party search", query: `site:${domain} (${broadTerms}${nameClause})`, instruction: "Catch first-party pages not reached through anchors." }
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

function lines(items = []) { return (items || []).map((item) => `- ${item}`).join("\n"); }

export function buildBoundedGeminiUrlDiscoveryPrompt({ primary_url, normalized_origin, registrable_domain, company_name = null, family_plan, retrieval_intent = null }) {
  const activeIntent = retrieval_intent || { intent_id: "family_anchor_minimum", label: "Inspect minimum family anchors first", query: family_plan.query, instruction: "Inspect anchors and return matching first-party URLs." };
  const attemptedQuery = String(activeIntent.query || family_plan.query).replace(/"/g, String.fromCharCode(39));
  return `You are the Source Discovery engine for Lex Nova HQ diligence.

TARGET
- primary_url: ${primary_url}
- normalized_origin: ${normalized_origin}
- registrable_domain: ${registrable_domain}
- company_name: ${company_name || "unknown"}

RULES
- Return first-party URLs only.
- Do not invent URLs.
- Do not return non-web assets or login-only URLs.
- Anchor URLs are minimum starting points, not limits.
- Return every first-party URL that fits the requested source family and retrieval intent.

SOURCE FAMILY
- source_family: ${family_plan.source_family}
- label: ${family_plan.label}
- mission: ${family_plan.mission}
- target_min: ${family_plan.target_min}
- target_max_guidance: no artificial cap

PAGE-FAMILY PLAN
${lines(family_plan.page_family_plan)}

ANCHORS
${lines(family_plan.anchor_urls)}

ROUTE HINTS
${lines(family_plan.common_route_hints)}

RETRIEVAL INTENT
- intent_id: ${activeIntent.intent_id}
- label: ${activeIntent.label}
- instruction: ${activeIntent.instruction}

QUERY
${activeIntent.query}

Return only valid JSON:
{
  "source_discovery_version": "${SOURCE_DISCOVERY_MAGNA_CARTA_VERSION}",
  "source_family": "${family_plan.source_family}",
  "retrieval_intent_id": "${activeIntent.intent_id}",
  "urls": [
    { "url": "https://example.com/path", "reason": "why this first-party URL belongs to this source family", "discovery_method": "gemini_search" }
  ],
  "coverage_gap": null
}

If none are found, return:
{
  "source_discovery_version": "${SOURCE_DISCOVERY_MAGNA_CARTA_VERSION}",
  "source_family": "${family_plan.source_family}",
  "retrieval_intent_id": "${activeIntent.intent_id}",
  "urls": [],
  "coverage_gap": { "source_family": "${family_plan.source_family}", "retrieval_intent_id": "${activeIntent.intent_id}", "target_minimum": ${family_plan.target_min}, "found": 0, "attempted_query": "${attemptedQuery}", "reason": "No public first-party source found." }
}`;
}
