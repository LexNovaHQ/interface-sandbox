export function buildSourceDiscoveryPrompt({ primary_url, normalized_origin, registrable_domain, company_name = null }) {
  return `You are Lex Nova HQ Source Discovery Runtime.

TASK
Find public, review-relevant source URLs controlled by, hosted by, or traceably linked to the target company.

TARGET
primary_url: ${primary_url}
normalized_origin: ${normalized_origin}
registrable_domain: ${registrable_domain}
company_name: ${company_name || "unknown"}

SOURCE DISCIPLINE
Return only URLs that are useful as first-party evidence for a legal / product / security / governance diligence run.

ADMIT CANDIDATES WHEN THEY ARE:
- target domain or target subdomain pages
- docs, developer docs, API docs, help docs, product docs
- product, platform, enterprise, pricing, signup, onboarding, or public product pages
- legal center, terms, privacy, DPA, AUP, SLA, cookie policy, subprocessors
- trust center, security, compliance, status, data protection, AI policy, responsible AI, governance pages
- public first-party blog/changelog pages only when they explain product capabilities, AI use, security, privacy, enterprise controls, or legal/governance commitments
- hosted legal/governance pages only when there is a clear traceable relationship to the target company

REJECT:
- LinkedIn, Crunchbase, PitchBook, app stores, review sites, investor databases
- news articles, press commentary, third-party blogs, podcasts, generic social media
- images, CSS, JS, fonts, PDFs unless they are official policies or whitepapers
- login-only URLs, tracking URLs, ad URLs, duplicate URLs
- untraceable hosted legal pages

DISCOVERY METHOD
Use search grounding and search broadly. Include sitemap, robots sitemap references, footer/legal links, docs and trust centers, known legal paths, and subdomains. Do not impose a fixed URL cap. Return every relevant URL you can identify.

IMPORTANT
Do not invent URLs. If unsure, list in rejected_sources with a reason or missing_expected_paths.

Return only valid JSON matching this shape:
{
  "candidate_sources": [
    {
      "url": "https://example.com/legal/privacy",
      "source_zone": "legal|privacy|terms|security|trust|docs|developer|api|product|enterprise|pricing|signup|status|blog_product|other_governance",
      "artifact_type": "short human label",
      "artifact_class": "first_party_domain|first_party_subdomain|trace_qualified_hosted|public_governance",
      "confidence": 0.0,
      "admission_readiness": "admit|review",
      "relationship_explanation": "why this is controlled by or traceably linked to the target",
      "discovery_method": "search_grounding|sitemap|footer|known_path|subdomain|other"
    }
  ],
  "rejected_sources": [
    {
      "url": "https://example.com/rejected",
      "reason": "why rejected",
      "rejection_class": "third_party|press|social|asset|login_only|duplicate|untraceable|irrelevant"
    }
  ],
  "missing_expected_paths": [
    {
      "expected_artifact": "Privacy Policy",
      "searched_pattern": "privacy policy / legal privacy / footer privacy",
      "status": "not_found|uncertain"
    }
  ],
  "search_queries_used": ["query string"],
  "discovery_limitations": ["limitation string"]
}`;
}
