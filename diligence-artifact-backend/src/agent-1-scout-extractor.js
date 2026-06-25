import crypto from "node:crypto";
import { config } from "./config.js";
import { ROOT_FAMILY_CODES, LOSSLESS_ROOT_FAMILY_ARTIFACT_NAMES } from "./constants.js";

const TAXONOMY = Object.freeze([
  { bucket: "target_profile_urls", root_family: "T0_ROOT", paths: ["/"], purpose: "homepage_primary_public_root" },
  { bucket: "target_profile_urls", root_family: "T1_IDENTITY", paths: ["/about", "/about-us", "/company", "/our-company", "/who-we-are"], purpose: "about_company_identity" },
  { bucket: "target_profile_urls", root_family: "T2_LEGAL_IDENTITY", paths: ["/legal", "/legal-notice", "/imprint"], purpose: "legal_identity_notice" },
  { bucket: "target_profile_urls", root_family: "T3_OPERATOR_ENTITY", paths: ["/privacy", "/terms", "/dpa", "/legal"], purpose: "operator_entity_fallback" },
  { bucket: "target_profile_urls", root_family: "T4_SUPPORTING_IDENTITY", paths: ["/team", "/careers", "/newsroom", "/press", "/blog", "/blogs"], purpose: "supporting_company_signals" },

  { bucket: "product_activity_profile_urls", root_family: "P1_PRODUCT", paths: ["/product", "/products"], dynamic: "product", purpose: "product_root_and_product_slug_pages" },
  { bucket: "product_activity_profile_urls", root_family: "P2_PLATFORM_FEATURE_SOLUTION", paths: ["/platform", "/features", "/solutions"], dynamic: "platform_feature_solution_slug", purpose: "platform_feature_solution_pages" },
  { bucket: "product_activity_profile_urls", root_family: "P3_AI_CAPABILITY_TECHNICAL", paths: ["/models", "/agents", "/assistant", "/assistants", "/studio", "/api", "/apis", "/developer", "/developers", "/docs", "/integrations", "/connectors", "/actions", "/workflows", "/automation", "/search", "/knowledge", "/vault"], dynamic: "ai_capability_technical", purpose: "ai_api_docs_integrations_capability" },
  { bucket: "product_activity_profile_urls", root_family: "P4_USE_CASE_INDUSTRY", paths: ["/use-cases", "/industries", "/customers"], dynamic: "use_case_industry_slug", purpose: "use_case_industry_customer_context" },
  { bucket: "product_activity_profile_urls", root_family: "P5_ENTERPRISE_PRICING", paths: ["/pricing", "/api-pricing", "/enterprise", "/contact-sales", "/plans"], purpose: "pricing_enterprise_plans" },

  { bucket: "data_asset_provenance_profile_urls", root_family: "D1_SECURITY_TRUST", paths: ["/security", "/security-center", "/data-security", "/trust", "/trust-center", "/compliance", "/compliance-center", "/soc-2", "/iso-27001"], purpose: "security_trust_compliance" },
  { bucket: "data_asset_provenance_profile_urls", root_family: "D2_SUBPROCESSOR_PRIVACY_CENTER", paths: ["/subprocessors", "/subprocessor", "/privacy-center", "/data-protection", "/gdpr", "/dpa", "/data-processing-agreement"], purpose: "subprocessor_privacy_center_dpa" },
  { bucket: "data_asset_provenance_profile_urls", root_family: "D3_DATA_GOVERNANCE_CONTROLS", paths: ["/enterprise-privacy", "/customer-data", "/data-processing", "/data-residency", "/retention", "/deletion", "/data-export", "/data-deletion"], purpose: "data_governance_controls" },
  { bucket: "data_asset_provenance_profile_urls", root_family: "D4_DOCS_API_DATA_FLOW", dynamic: "docs_api_data_flow", purpose: "docs_api_data_flow_signal" },
  { bucket: "data_asset_provenance_profile_urls", root_family: "D5_AI_SAFETY_TRANSPARENCY", paths: ["/responsible-ai", "/ai-policy", "/ai-transparency", "/transparency", "/safety", "/model-card", "/model-cards", "/model-details", "/usage-policy"], purpose: "ai_safety_transparency" },

  { bucket: "legal_governance_profile_urls", root_family: "L1_CORE_TERMS_PRIVACY", paths: ["/terms", "/terms-of-use", "/terms-of-service", "/terms-and-conditions", "/legal/terms", "/policies/terms-of-use", "/privacy", "/privacy-policy", "/legal/privacy", "/policies/privacy-policy", "/eula"], purpose: "core_terms_privacy_eula" },
  { bucket: "legal_governance_profile_urls", root_family: "L2_B2B_CONTRACTING", paths: ["/dpa", "/data-processing-agreement", "/legal/dpa", "/legal/data-processing-agreement", "/policies/data-processing-addendum", "/aup", "/acceptable-use", "/acceptable-use-policy", "/legal/acceptable-use-policy", "/sla", "/service-level-agreement", "/service-credit-terms", "/platform-agreement", "/customer-agreement"], purpose: "b2b_contracting_documents" },
  { bucket: "legal_governance_profile_urls", root_family: "L3_AI_USAGE_GOVERNANCE", paths: ["/usage-policy", "/acceptable-use-policy", "/content-policy", "/ai-policy", "/responsible-ai", "/model-policy", "/safety-policy"], purpose: "ai_usage_governance" },
  { bucket: "legal_governance_profile_urls", root_family: "L4_PRIVACY_ADJACENT_NOTICES", paths: ["/cookie-policy", "/cookies", "/privacy-center", "/do-not-sell", "/data-privacy-framework", "/gdpr", "/ccpa"], purpose: "privacy_adjacent_notices" },
  { bucket: "legal_governance_profile_urls", root_family: "L5_LEGAL_HUB_HOSTED", paths: ["/legal", "/legal-center", "/legal-hub", "/policies", "/terms-and-policies", "/trust", "/trust-center"], purpose: "legal_policy_trust_hub" },
  { bucket: "legal_governance_profile_urls", root_family: "L6_ENTITY_NOTICE", paths: ["/legal-notice", "/imprint", "/controller"], purpose: "entity_notice_controller" }
]);

const DATA_FLOW_SIGNALS = ["data", "file", "upload", "storage", "retention", "delete", "deletion", "export", "webhook", "connector", "integration", "auth", "authentication", "permission", "audit", "log", "subprocessor", "model", "training", "customer content"];
const TECHNICAL_ROUTE_SIGNALS = ["api", "apis", "docs", "developer", "developers", "openapi", "asyncapi", "llms.txt", "model", "models", "studio", "agent", "agents", "integration", "integrations", "text-to-speech", "voice-to-text", "speech", "translation", "dubbing", "digitisation", "digitization", "ocr", "webhook", "ratelimit", "rate-limit", "changelog"];
const SOCIAL_HOST_PARTS = ["linkedin.com", "x.com", "twitter.com", "youtube.com", "github.com", "discord.com", "facebook.com", "instagram.com"];

export async function buildAgent1ScoutExtractArtifacts({ run }) {
  const rootUrl = normalizeRootUrl(run.root_url || run.target);
  const targetHost = new URL(rootUrl).hostname.replace(/^www\./i, "");
  const candidates = new Map();
  const scoutFailures = [];
  const discoveryLog = [];

  addCandidate(candidates, rootUrl, "ROOT");

  // Mandatory discovery block: root/header/footer and sitemap routes are completed before any evidence extraction.
  const rootFetch = await safeFetchRaw(rootUrl);
  if (rootFetch.ok) {
    discoveryLog.push({ step: "ROOT_FETCH", status: "PASS", url: rootUrl });
    addScopedAnchors(candidates, rootFetch.raw_text, rootUrl, targetHost);
    addLinkedSitemaps(candidates, rootFetch.raw_text, rootUrl, targetHost);
  } else {
    discoveryLog.push({ step: "ROOT_FETCH", status: "FAIL", url: rootUrl, error: rootFetch.error });
    scoutFailures.push({ url: rootUrl, stage: "ROOT", error: rootFetch.error });
  }

  await scoutSitemaps({ candidates, scoutFailures, discoveryLog, rootUrl, targetHost, rootHtml: rootFetch.raw_text || "" });
  await scoutKnownPaths({ candidates, scoutFailures, discoveryLog, rootUrl });

  const inventories = emptyFamilyArtifacts({ run, rootUrl });
  const sourceIndex = [];
  const failedSourceIndex = [];
  const perFamilyCounts = Object.fromEntries(ROOT_FAMILY_CODES.map((code) => [code, 0]));

  for (const candidate of [...candidates.values()].sort(sortCandidates)) {
    const matches = classifyCandidate(candidate);
    if (!matches.length) continue;
    const extracted = await fetchBestEvidenceText(candidate.url, rootUrl, targetHost);

    for (const match of matches) {
      const sourceNumber = String(++perFamilyCounts[match.root_family]).padStart(3, "0");
      const sourceId = `${match.root_family}.SRC.${sourceNumber}`;
      const baseRow = {
        source_id: sourceId,
        bucket: match.bucket,
        root_family: match.root_family,
        url: candidate.url,
        route_type: match.route_type,
        materiality: match.materiality,
        route_found_by: candidate.route_found_by,
        priority_result: candidate.priority_result || "PRIMARY_FOUND",
        execution_status: extracted.ok ? "executed_bucketed" : "access_failed_recorded_limited"
      };

      if (extracted.ok) {
        const row = {
          ...baseRow,
          extraction_status: "FETCHED",
          evidence_text_source: extracted.evidence_text_source,
          http_status: extracted.http_status,
          content_type: extracted.content_type,
          final_url: extracted.final_url,
          sha256: sha256(extracted.lossless_text),
          lossless_text: extracted.lossless_text,
          extraction_warnings: extracted.extraction_warnings
        };
        inventories[`lossless_family__${match.root_family}`].sources.push(row);
        sourceIndex.push(withoutLosslessText(row));
      } else {
        failedSourceIndex.push({ ...baseRow, extraction_status: "FETCH_FAILED", error: extracted.error });
      }
    }
  }

  const missingLimited = buildMissingLimited(inventories);
  for (const artifactName of LOSSLESS_ROOT_FAMILY_ARTIFACT_NAMES) {
    const artifact = inventories[artifactName];
    artifact.missing_limited_primary_sources = missingLimited.filter((item) => item.root_family === artifact.root_family);
    artifact.corpus_forensics.total_sources = artifact.sources.length;
  }

  return {
    source_family_index: {
      run_id: run.run_id,
      target: run.target,
      target_url: rootUrl,
      generated_by: "agent_1_scout_extract",
      taxonomy_version: "M6_INTEGRATED_PRODUCT_MERGED_CLEAN_TEXT_v2",
      target_boundary: {
        submitted_url: run.root_url || run.target,
        resolved_primary_url: rootUrl,
        source_mode: run.source_mode || "url",
        target_controlled_root: new URL(rootUrl).origin,
        target_host: targetHost,
        lock_status: sourceIndex.length ? "LOCKED_WITH_LIMITATIONS" : "CONTROLLED_FAILURE"
      },
      source_search_rule_applied: {
        mandatory_discovery_first: "ROOT, HEADER, FOOTER, /sitemap.xml, sitemap-index, and linked sitemaps are completed before evidence extraction.",
        primary_first_rule: "Primary routes were scouted before fallback/context routes according to the integrated M6 taxonomy.",
        discovery_routes_executed: ["ROOT", "HEADER", "FOOTER", "SITEMAP", "KNOWN_PATH_PROBE"],
        markdown_preference_rule: ".md evidence is preferred first; cleaned HTML is used only when markdown is unavailable or not clear text.",
        no_guessed_slug_rule: "Dynamic slugs were admitted only when discovered from root/header/footer/sitemap routes.",
        downstream_new_url_rule: "Downstream agents may not discover or add new URLs. They may read only saved source IDs and artifacts."
      },
      root_family_artifacts: LOSSLESS_ROOT_FAMILY_ARTIFACT_NAMES,
      discovered_source_index: sourceIndex,
      failed_source_index: failedSourceIndex,
      missing_limited_primary_sources: missingLimited,
      scout_failures: scoutFailures,
      discovery_log: discoveryLog,
      corpus_forensics: {
        candidate_urls: candidates.size,
        discovered_sources: sourceIndex.length,
        failed_sources: failedSourceIndex.length,
        generated_at: new Date().toISOString()
      }
    },
    ...inventories
  };
}

function emptyFamilyArtifacts({ run, rootUrl }) {
  const out = {};
  for (const code of ROOT_FAMILY_CODES) {
    const item = TAXONOMY.find((entry) => entry.root_family === code);
    out[`lossless_family__${code}`] = {
      run_id: run.run_id,
      target_url: rootUrl,
      artifact_name: `lossless_family__${code}`,
      generated_by: "agent_1_scout_extract",
      bucket: item?.bucket || "UNMAPPED_BUCKET",
      root_family: code,
      purpose: item?.purpose || "unmapped_root_family",
      sources: [],
      missing_limited_primary_sources: [],
      corpus_forensics: { total_sources: 0 }
    };
  }
  return out;
}

function addScopedAnchors(candidates, html, rootUrl, targetHost) {
  const scopedChunks = [
    ...extractTagChunks(html, "header").map((chunk) => ({ chunk, route_found_by: "HEADER" })),
    ...extractTagChunks(html, "footer").map((chunk) => ({ chunk, route_found_by: "FOOTER" })),
    { chunk: html, route_found_by: "ROOT" }
  ];
  for (const scoped of scopedChunks) {
    for (const href of extractHrefs(scoped.chunk)) {
      const url = normalizeCandidateUrl(href, rootUrl, targetHost);
      if (url) addCandidate(candidates, url, scoped.route_found_by);
    }
  }
}

function addLinkedSitemaps(candidates, html, rootUrl, targetHost) {
  for (const href of extractLinkedSitemaps(html)) {
    const url = normalizeCandidateUrl(href, rootUrl, targetHost);
    if (url) addCandidate(candidates, url, "SITEMAP_LINK");
  }
}

async function scoutSitemaps({ candidates, scoutFailures, discoveryLog, rootUrl, targetHost, rootHtml }) {
  const origin = new URL(rootUrl).origin;
  const sitemapUrls = new Set([`${origin}/sitemap.xml`, `${origin}/sitemap-index.xml`]);

  for (const href of extractLinkedSitemaps(rootHtml)) {
    const url = normalizeCandidateUrl(href, rootUrl, targetHost);
    if (url) sitemapUrls.add(url);
  }

  const robots = await safeFetchRaw(`${origin}/robots.txt`);
  if (robots.ok) {
    for (const line of robots.raw_text.split(/\r?\n/)) {
      const match = line.match(/^\s*sitemap:\s*(\S+)/i);
      if (match?.[1]) sitemapUrls.add(match[1].trim());
    }
  }

  const visited = new Set();
  const queue = [...sitemapUrls];
  while (queue.length && visited.size < 12) {
    const sitemapUrl = queue.shift();
    if (!sitemapUrl || visited.has(sitemapUrl)) continue;
    visited.add(sitemapUrl);
    const fetched = await safeFetchRaw(sitemapUrl);
    if (!fetched.ok) {
      discoveryLog.push({ step: "SITEMAP_FETCH", status: "FAIL", url: sitemapUrl, error: fetched.error });
      scoutFailures.push({ url: sitemapUrl, stage: "SITEMAP", error: fetched.error });
      continue;
    }
    discoveryLog.push({ step: "SITEMAP_FETCH", status: "PASS", url: sitemapUrl });
    for (const loc of extractSitemapLocs(fetched.raw_text).slice(0, 250)) {
      const url = normalizeCandidateUrl(loc, rootUrl, targetHost);
      if (!url) continue;
      if (url.endsWith(".xml") && visited.size < 12) queue.push(url);
      else addCandidate(candidates, url, "SITEMAP");
    }
  }
}

async function scoutKnownPaths({ candidates, scoutFailures, discoveryLog, rootUrl }) {
  const origin = new URL(rootUrl).origin;
  const paths = new Set(TAXONOMY.flatMap((item) => item.paths || []));
  for (const path of paths) {
    const url = new URL(path, origin).toString();
    const fetched = await safeFetchRaw(url);
    if (fetched.ok) {
      discoveryLog.push({ step: "KNOWN_PATH_PROBE", status: "PASS", url });
      addCandidate(candidates, url, "KNOWN_PATH_PROBE");
    } else if (![404, 410].includes(Number(fetched.http_status || 0))) {
      discoveryLog.push({ step: "KNOWN_PATH_PROBE", status: "LIMITED", url, error: fetched.error, http_status: fetched.http_status || null });
      scoutFailures.push({ url, stage: "KNOWN_PATH_PROBE", error: fetched.error, http_status: fetched.http_status || null });
    }
  }
}

function classifyCandidate(candidate) {
  const url = new URL(candidate.url);
  const path = normalizePath(url.pathname);
  const host = url.hostname.toLowerCase();
  const text = `${host} ${path} ${candidate.url}`.toLowerCase();
  const matches = [];

  for (const item of TAXONOMY) {
    for (const known of item.paths || []) {
      const normalized = normalizePath(known);
      if (path === normalized || path.startsWith(`${normalized}/`)) {
        if (item.root_family === "L6_ENTITY_NOTICE" && !hasLegalEntitySignal(text)) continue;
        matches.push(toMatch(item, routeTypeFor(item, path), materialityFor(item)));
      }
    }
  }

  if (/^\/(product|products)(\/[^/]+)?\/?$/i.test(path)) matches.push(family("P1_PRODUCT", path === "/product" || path === "/products" ? "product_root" : "product_slug", "product_activity"));
  if (/^\/(platform|features|solutions)\/[^/]+/i.test(path) && candidate.route_found_by !== "KNOWN_PATH_PROBE") matches.push(family("P2_PLATFORM_FEATURE_SOLUTION", "platform_feature_solution_slug", "product_activity"));
  if (/^\/(use-cases|industries|customers)\/[^/]+/i.test(path) && candidate.route_found_by !== "KNOWN_PATH_PROBE") matches.push(family("P4_USE_CASE_INDUSTRY", "use_case_industry_customer_slug", "use_case_context"));
  if (hasAnySignal(text, TECHNICAL_ROUTE_SIGNALS) || host.startsWith("docs.")) matches.push(family("P3_AI_CAPABILITY_TECHNICAL", "ai_capability_technical", "product_activity"));
  if ((isDocsOrApiPath(path) || host.startsWith("docs.")) && hasAnySignal(text, DATA_FLOW_SIGNALS)) matches.push(family("D4_DOCS_API_DATA_FLOW", "docs_api_data_flow", "data_flow_signal"));

  return dedupeMatches(matches);
}

async function fetchBestEvidenceText(url, rootUrl, targetHost) {
  const mdCandidates = markdownCandidateUrls(url);
  for (const mdUrl of mdCandidates) {
    const md = await safeFetchRaw(mdUrl);
    if (md.ok && isClearMarkdownText(md.raw_text, md.content_type)) {
      return toEvidence(md, "MARKDOWN_DERIVED");
    }
  }

  const html = await safeFetchRaw(url);
  if (!html.ok) return { ok: false, error: html.error, http_status: html.http_status || null };

  for (const href of extractMarkdownAlternates(html.raw_text)) {
    const mdUrl = normalizeCandidateUrl(href, url || rootUrl, targetHost);
    if (!mdUrl) continue;
    const md = await safeFetchRaw(mdUrl);
    if (md.ok && isClearMarkdownText(md.raw_text, md.content_type)) {
      return toEvidence(md, "MARKDOWN_ALTERNATE");
    }
  }

  const clean = cleanHtmlToText(html.raw_text);
  if (!clean || clean.length < 40) {
    return { ok: false, error: "NO_CLEAR_TEXT_AFTER_HTML_CLEAN", http_status: html.http_status || null };
  }
  return {
    ok: true,
    http_status: html.http_status,
    content_type: html.content_type,
    final_url: html.final_url,
    lossless_text: clean,
    evidence_text_source: "CLEANED_HTML",
    extraction_warnings: [...html.extraction_warnings, "RAW_HTML_NOT_STORED"]
  };
}

function toEvidence(fetchResult, source) {
  return {
    ok: true,
    http_status: fetchResult.http_status,
    content_type: fetchResult.content_type,
    final_url: fetchResult.final_url,
    lossless_text: normalizeEvidenceText(fetchResult.raw_text),
    evidence_text_source: source,
    extraction_warnings: fetchResult.extraction_warnings
  };
}

function markdownCandidateUrls(value) {
  const out = [];
  try {
    const url = new URL(value);
    const path = url.pathname.replace(/\/$/, "");
    if (path && path !== "/" && !path.endsWith(".md")) {
      const md = new URL(url.toString());
      md.pathname = `${path}.md`;
      out.push(md.toString());
    }
    if (path.endsWith(".md")) out.push(url.toString());
  } catch {
    return [];
  }
  return out;
}

function isClearMarkdownText(text, contentType) {
  const value = String(text || "").trim();
  if (value.length < 80) return false;
  if (/^<!doctype html/i.test(value) || /<html[\s>]/i.test(value)) return false;
  const lowerType = String(contentType || "").toLowerCase();
  return lowerType.includes("markdown") || lowerType.includes("text/plain") || /(^|\n)#{1,3}\s+/.test(value) || value.includes("\n- ") || value.includes("\n## ");
}

function cleanHtmlToText(html) {
  const title = extractFirst(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const meta = extractMetaDescription(html);
  const body = String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<canvas[\s\S]*?<\/canvas>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ");
  return normalizeEvidenceText([title, meta, decodeEntities(body)].filter(Boolean).join("\n\n"));
}

function normalizeEvidenceText(text) {
  return decodeEntities(String(text || ""))
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function decodeEntities(value) {
  return String(value || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#x27;/gi, "'")
    .replace(/&#39;/gi, "'");
}

function extractMetaDescription(html) {
  return extractFirst(html, /<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i) || extractFirst(html, /<meta\s+[^>]*content=["']([^"']*)["'][^>]*name=["']description["'][^>]*>/i);
}

function extractFirst(value, regex) {
  const match = String(value || "").match(regex);
  return match?.[1] ? decodeEntities(match[1]).trim() : "";
}

function family(rootFamily, route_type, materiality) {
  const item = TAXONOMY.find((entry) => entry.root_family === rootFamily);
  return toMatch(item, route_type, materiality);
}

function toMatch(item, route_type, materiality) {
  return { bucket: item.bucket, root_family: item.root_family, route_type, materiality };
}

function dedupeMatches(matches) {
  const seen = new Set();
  return matches.filter((match) => {
    if (!match?.root_family) return false;
    const key = `${match.root_family}:${match.route_type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function routeTypeFor(item, path) {
  if (item.root_family === "T0_ROOT") return "primary_homepage";
  if (item.root_family === "P1_PRODUCT") return path === "/product" || path === "/products" ? "product_root" : "product_slug";
  if (item.root_family === "L1_CORE_TERMS_PRIVACY") return path.includes("privacy") ? "privacy_policy" : path.includes("eula") ? "eula" : "terms";
  return item.purpose;
}

function materialityFor(item) {
  if (item.bucket === "target_profile_urls") return "target_boundary_and_identity";
  if (item.bucket === "product_activity_profile_urls") return "product_activity";
  if (item.bucket === "data_asset_provenance_profile_urls") return "data_asset_provenance";
  return "legal_governance";
}

function hasLegalEntitySignal(value) {
  return hasAnySignal(value, ["legal-notice", "imprint", "controller", "registered", "grievance", "dpo", "data-protection-officer"]);
}

function isDocsOrApiPath(path) {
  return /\/(docs|developer|developers|api|api-reference|openapi|asyncapi|integrations|connectors|webhooks|authentication|permissions|audit-logs)/i.test(path);
}

function hasAnySignal(value, signals) {
  const lower = String(value || "").toLowerCase();
  return signals.some((signal) => lower.includes(signal));
}

function buildMissingLimited(inventories) {
  const rows = [];
  for (const code of ["T0_ROOT", "P1_PRODUCT", "D1_SECURITY_TRUST", "L1_CORE_TERMS_PRIVACY"]) {
    const artifact = inventories[`lossless_family__${code}`];
    if (artifact && artifact.sources.length === 0) {
      rows.push({ root_family: code, bucket_affected: artifact.bucket, missing_or_limited_source: code, search_exhausted: true, why_it_matters: "Primary source family was not found or could not be fetched during deterministic Agent 1 scouting.", status: "ABSENT_AFTER_TARGETED_PROBE" });
    }
  }
  return rows;
}

function sortCandidates(a, b) {
  return priority(a.route_found_by) - priority(b.route_found_by) || a.url.localeCompare(b.url);
}

function priority(routeFoundBy) {
  return { ROOT: 1, HEADER: 2, FOOTER: 3, SITEMAP: 4, SITEMAP_LINK: 4, KNOWN_PATH_PROBE: 5 }[routeFoundBy] || 9;
}

function addCandidate(candidates, url, route_found_by) {
  const clean = stripHash(url);
  if (!clean || candidates.has(clean)) return;
  candidates.set(clean, { url: clean, route_found_by, priority_result: "PRIMARY_FOUND" });
}

function normalizeRootUrl(value) {
  const raw = String(value || "").trim();
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const url = new URL(withProtocol);
  url.hash = "";
  if (!url.pathname || url.pathname === "/") url.pathname = "/";
  return url.toString();
}

function normalizeCandidateUrl(value, baseUrl, targetHost) {
  try {
    const url = new URL(String(value || "").trim(), baseUrl);
    if (!["http:", "https:"].includes(url.protocol)) return "";
    if (isSocialHost(url.hostname)) return "";
    if (!isAllowedHost(url.hostname, targetHost)) return "";
    return stripHash(url.toString());
  } catch {
    return "";
  }
}

function stripHash(value) {
  try {
    const url = new URL(value);
    url.hash = "";
    return url.toString();
  } catch {
    return "";
  }
}

function isAllowedHost(hostname, targetHost) {
  const host = hostname.replace(/^www\./i, "").toLowerCase();
  const target = targetHost.toLowerCase();
  return host === target || host.endsWith(`.${target}`);
}

function isSocialHost(hostname) {
  const host = hostname.toLowerCase();
  return SOCIAL_HOST_PARTS.some((part) => host === part || host.endsWith(`.${part}`));
}

function normalizePath(pathname) {
  return String(pathname || "/").replace(/\/+$/g, "").toLowerCase() || "/";
}

function extractTagChunks(html, tag) {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
  return [...String(html || "").matchAll(regex)].map((match) => match[1] || "");
}

function extractHrefs(html) {
  const out = [];
  const regex = /<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/gi;
  for (const match of String(html || "").matchAll(regex)) out.push(match[1]);
  return out;
}

function extractLinkedSitemaps(html) {
  const out = [];
  const regex = /<link\b[^>]*rel=["'][^"']*sitemap[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>/gi;
  for (const match of String(html || "").matchAll(regex)) out.push(match[1]);
  return out;
}

function extractMarkdownAlternates(html) {
  const out = [];
  const regex = /<link\b[^>]*rel=["'][^"']*alternate[^"']*["'][^>]*type=["']text\/markdown["'][^>]*href=["']([^"']+)["'][^>]*>/gi;
  for (const match of String(html || "").matchAll(regex)) out.push(match[1]);
  return out;
}

function extractSitemapLocs(xml) {
  const out = [];
  const regex = /<loc>\s*([^<]+?)\s*<\/loc>/gi;
  for (const match of String(xml || "").matchAll(regex)) out.push(match[1].trim());
  return out;
}

async function safeFetchRaw(url) {
  try {
    const fetched = await fetchRaw(url);
    return { ok: true, ...fetched };
  } catch (error) {
    return { ok: false, url, error: error?.message || String(error), http_status: error?.http_status || null };
  }
}

async function fetchRaw(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.sourceFetchTimeoutMs);
  try {
    const response = await fetch(url, { method: "GET", signal: controller.signal, redirect: "follow", headers: { "user-agent": "LexNovaHQ-DiligenceReviewer/0.3 (+deterministic-m6-clean-text)", "accept": "text/markdown,text/plain,text/html,application/xhtml+xml,application/json,application/xml,text/xml,*/*;q=0.5" } });
    const contentType = response.headers.get("content-type") || "";
    const rawText = await response.text();
    if (!response.ok) {
      const error = new Error(`HTTP_${response.status}`);
      error.http_status = response.status;
      throw error;
    }
    return { http_status: response.status, content_type: contentType, final_url: response.url, raw_text: rawText, extraction_warnings: buildWarnings(contentType, rawText) };
  } catch (error) {
    if (error?.name === "AbortError") throw new Error("FETCH_TIMEOUT");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function buildWarnings(contentType, text) {
  const warnings = [];
  const lower = String(contentType || "").toLowerCase();
  if (lower.includes("pdf")) warnings.push("PDF_FETCHED_AS_TEXT_NOT_PARSED");
  if (String(text || "").length > 900000) warnings.push("LARGE_SOURCE_TEXT");
  return warnings;
}

function withoutLosslessText(row) {
  const { lossless_text: _losslessText, ...rest } = row;
  return rest;
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value || "")).digest("hex");
}
