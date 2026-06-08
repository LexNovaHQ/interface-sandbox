function normalizeCandidateUrl(value) {
  try {
    const url = new URL(value);
    url.hash = "";
    if (url.pathname !== "/" && url.pathname.endsWith("/")) url.pathname = url.pathname.slice(0, -1);
    return url.toString();
  } catch {
    return null;
  }
}

function isFirstPartyUrl(value, registrableDomain) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    const domain = String(registrableDomain || "").toLowerCase();
    return hostname === domain || hostname.endsWith("." + domain);
  } catch {
    return false;
  }
}

function decodeHtmlEntities(value = "") {
  return String(value)
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripTags(value = "") {
  return decodeHtmlEntities(String(value).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function locationHint(html, index) {
  const context = html.slice(Math.max(0, index - 800), Math.min(html.length, index + 800)).toLowerCase();
  if (context.includes("<nav") || context.includes("menu")) return "nav";
  if (context.includes("<footer") || context.includes("footer")) return "footer";
  if (context.includes("product") || context.includes("platform") || context.includes("<main")) return "body";
  return "unknown";
}

export function extractFirstPartyLinksFromHtml({ html, anchorUrl, registrableDomain, limit = 200 }) {
  const text = String(html || "");
  const out = [];
  const seen = new Set();
  const regex = /<a\b[^>]*href\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))[^>]*>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const href = decodeHtmlEntities(match[1] || match[2] || match[3] || "").trim();
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) continue;
    let resolved;
    try { resolved = new URL(href, anchorUrl).toString(); } catch { continue; }
    const url = normalizeCandidateUrl(resolved);
    if (!url || !isFirstPartyUrl(url, registrableDomain) || seen.has(url)) continue;
    seen.add(url);
    out.push({
      url,
      anchor_url: normalizeCandidateUrl(anchorUrl),
      link_text: stripTags(match[4] || "").slice(0, 180),
      location_hint: locationHint(text, match.index)
    });
    if (out.length >= limit) break;
  }
  return out;
}

export function mergeAnchorLinks(anchorResults = []) {
  const seen = new Map();
  for (const result of anchorResults || []) {
    for (const link of result.links || []) {
      const url = normalizeCandidateUrl(link.url);
      if (!url) continue;
      if (!seen.has(url)) {
        seen.set(url, {
          url,
          anchors: [result.anchor_url].filter(Boolean),
          location_hints: [link.location_hint].filter(Boolean),
          link_texts: [link.link_text].filter(Boolean)
        });
      } else {
        const existing = seen.get(url);
        if (result.anchor_url && !existing.anchors.includes(result.anchor_url)) existing.anchors.push(result.anchor_url);
        if (link.location_hint && !existing.location_hints.includes(link.location_hint)) existing.location_hints.push(link.location_hint);
        if (link.link_text && !existing.link_texts.includes(link.link_text) && existing.link_texts.length < 3) existing.link_texts.push(link.link_text);
      }
    }
  }
  return [...seen.values()];
}

export function buildAnchorClassificationPrompt({ familyPlan, links, identity, company_name = null }) {
  const compactLinks = (links || []).slice(0, 160).map((link, index) => ({
    link_id: `L${String(index + 1).padStart(3, "0")}`,
    url: link.url,
    link_texts: link.link_texts || [],
    location_hints: link.location_hints || [],
    anchors: link.anchors || []
  }));

  return `You are the Gemini source-family link classifier for Lex Nova HQ diligence.
Gemini decides whether extracted first-party links belong to the requested source family.
Deterministic code only extracted first-party links from Gemini-selected anchor pages.

Target:
- primary_url: ${identity.primary_url}
- normalized_origin: ${identity.normalized_origin}
- registrable_domain: ${identity.registrable_domain}
- company_name: ${company_name || "unknown"}

Requested source family:
- source_family: ${familyPlan.source_family}
- label: ${familyPlan.label}
- mission: ${familyPlan.mission}
- target_min: ${familyPlan.target_min}
- target_max: ${familyPlan.target_max}

Page-family plan:
${(familyPlan.page_family_plan || []).map((item) => `- ${item}`).join("\n")}

Extracted first-party links:
${JSON.stringify(compactLinks, null, 2)}

Return only valid JSON:
{
  "source_family": "${familyPlan.source_family}",
  "classification_method": "gemini_anchor_classification",
  "admitted": [{ "url": "https://example.com/path", "reason": "why admitted", "anchor_url": "https://example.com/anchor", "link_text": "visible text" }],
  "rejected": [{ "url": "https://example.com/path", "reason": "why rejected" }],
  "coverage_gap": null
}

Rules:
- Do not invent URLs.
- Only use URLs present in extracted first-party links.
- Prefer deeper family-specific pages over homepage/about pages.
- Admit only links that truly belong to ${familyPlan.source_family}.
`;
}

export function extractAnchorClassifiedCandidates({ classifierJson, familyPlan, registrableDomain }) {
  const admitted = Array.isArray(classifierJson?.admitted) ? classifierJson.admitted : [];
  const out = [];
  for (const item of admitted) {
    const url = normalizeCandidateUrl(item?.url);
    if (!url || !isFirstPartyUrl(url, registrableDomain)) continue;
    out.push({
      url,
      source_family: familyPlan.source_family,
      discovery_method: "gemini_anchor_classification",
      discovery_role: "primary",
      retrieval_intent_id: "anchor_link_classification",
      reason: item?.reason || "Gemini classified extracted anchor link into this source family.",
      batch_id: `${familyPlan.source_family}:anchor_link_classification`,
      anchor_url: normalizeCandidateUrl(item?.anchor_url) || null,
      link_text: item?.link_text || ""
    });
  }
  return out.slice(0, familyPlan.target_max || 6);
}
