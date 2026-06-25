import crypto from "node:crypto";
import { config } from "./config.js";
import { ROOT_FAMILY_CODES, LOSSLESS_ROOT_FAMILY_ARTIFACT_NAMES } from "./constants.js";

const TAXONOMY = Object.freeze([
  { bucket: "target_profile_urls", root_family: "T0_ROOT", paths: ["/"], purpose: "homepage_primary_public_root" },
  { bucket: "target_profile_urls", root_family: "T1_IDENTITY", paths: ["/about", "/about-us", "/company", "/our-company", "/who-we-are"], purpose: "about_company_identity" },
  { bucket: "target_profile_urls", root_family: "T2_LEGAL_IDENTITY", paths: ["/legal", "/legal-notice", "/imprint", "/contact", "/contact-us"], purpose: "legal_contact_identity" },
  { bucket: "target_profile_urls", root_family: "T3_OPERATOR_ENTITY", paths: ["/privacy", "/terms", "/dpa", "/legal"], purpose: "operator_entity_fallback" },
  { bucket: "target_profile_urls", root_family: "T4_SUPPORTING_IDENTITY", paths: ["/team", "/careers", "/newsroom", "/press", "/blog", "/blogs"], purpose: "supporting_company_signals" },
  { bucket: "product_activity_profile_urls", root_family: "P0_PRODUCT_ROOT", paths: ["/product", "/products", "/platform"], purpose: "product_platform_root" },
  { bucket: "product_activity_profile_urls", root_family: "P1_PRODUCT_SLUG", dynamic: "product_slug", purpose: "specific_product_pages" },
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
  { bucket: "legal_governance_profile_urls", root_family: "L6_ENTITY_NOTICE", paths: ["/legal-notice", "/imprint", "/contact", "/controller"], purpose: "entity_notice_controller_contact" }
]);

const DATA_FLOW_SIGNALS = ["data", "file", "upload", "storage", "retention", "delete", "deletion", "export", "webhook", "connector", "integration", "auth", "authentication", "permission", "audit", "log", "subprocessor", "model", "training", "customer content"];
const TECHNICAL_ROUTE_SIGNALS = ["api", "apis", "docs", "developer", "developers", "openapi", "asyncapi", "llms.txt", "model", "models", "studio", "agent", "agents", "integration", "integrations", "text-to-speech", "voice-to-text", "speech", "translation", "dubbing", "digitisation", "digitization", "ocr", "webhook", "ratelimit", "rate-limit", "changelog"];
const SOCIAL_HOST_PARTS = ["linkedin.com", "x.com", "twitter.com", "youtube.com", "github.com", "discord.com", "facebook.com", "instagram.com"];

export async function buildAgent1ScoutExtractArtifacts({ run }) {
  const rootUrl = normalizeRootUrl(run.root_url || run.target);
  const targetHost = new URL(rootUrl).hostname.replace(/^www\./i, "");
  const candidates = new Map();
  const scoutFailures = [];

  addCandidate(candidates, rootUrl, "ROOT");
  const rootFetch = await safeFetch(rootUrl);
  if (rootFetch.ok) addScopedAnchors(candidates, rootFetch.lossless_text, rootUrl, targetHost);
  else scoutFailures.push({ url: rootUrl, stage: "ROOT", error: rootFetch.error });

  await scoutRobotsAndSitemaps({ candidates, scoutFailures, rootUrl, targetHost });
  await scoutKnownPaths({ candidates, scoutFailures, rootUrl });

  const inventories = emptyFamilyArtifacts({ run, rootUrl });
  const sourceIndex = [];
  const failedSourceIndex = [];
  const perFamilyCounts = Object.fromEntries(ROOT_FAMILY_CODES.map((code) => [code, 0]));

  for (const candidate of [...candidates.values()].sort(sortCandidates)) {
    const matches = classifyCandidate(candidate);
    if (!matches.length) continue;
    const fetched = candidate.fetch || await safeFetch(candidate.url);

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
        execution_status: fetched.ok ? "executed_bucketed" : "access_failed_recorded_limited"
      };

      if (fetched.ok) {
        const row = {
          ...baseRow,
          extraction_status: "FETCHED",
          http_status: fetched.http_status,
          content_type: fetched.content_type,
          final_url: fetched.final_url,
          sha256: sha256(fetched.lossless_text),
          lossless_text: fetched.lossless_text,
          extraction_warnings: fetched.extraction_warnings
        };
        inventories[`lossless_family__${match.root_family}`].sources.push(row);
        sourceIndex.push(withoutLosslessText(row));
      } else {
        failedSourceIndex.push({ ...baseRow, extraction_status: "FETCH_FAILED", error: fetched.error });
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
      taxonomy_version: "M6_INTEGRATED_BUCKET_SUBCATEGORY_ROOT_FAMILY_v1",
      target_boundary: {
        submitted_url: run.root_url || run.target,
        resolved_primary_url: rootUrl,
        source_mode: run.source_mode || "url",
        target_controlled_root: new URL(rootUrl).origin,
        target_host: targetHost,
        lock_status: sourceIndex.length ? "LOCKED_WITH_LIMITATIONS" : "CONTROLLED_FAILURE"
      },
      source_search_rule_applied: {
        primary_first_rule: "Primary routes were scouted before fallback/context routes according to the integrated M6 taxonomy.",
        discovery_routes_executed: ["ROOT", "HEADER", "FOOTER", "SITEMAP", "KNOWN_PATH_PROBE"],
        no_guessed_slug_rule: "Dynamic slugs were admitted only when discovered from root/header/footer/sitemap routes.",
        downstream_new_url_rule: "Downstream agents may not discover or add new URLs. They may read only saved source IDs and artifacts."
      },
      root_family_artifacts: LOSSLESS_ROOT_FAMILY_ARTIFACT_NAMES,
      discovered_source_index: sourceIndex,
      failed_source_index: failedSourceIndex,
      missing_limited_primary_sources: missingLimited,
      scout_failures: scoutFailures,
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
  for (const item of TAXONOMY) {
    out[`lossless_family__${item.root_family}`] = {
      run_id: run.run_id,
      target_url: rootUrl,
      artifact_name: `lossless_family__${item.root_family}`,
      generated_by: "agent_1_scout_extract",
      bucket: item.bucket,
      root_family: item.root_family,
      purpose: item.purpose,
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

async function scoutRobotsAndSitemaps({ candidates, scoutFailures, rootUrl, targetHost }) {
  const origin = new URL(rootUrl).origin;
  const sitemapUrls = new Set([`${origin}/sitemap.xml`]);
  const robots = await safeFetch(`${origin}/robots.txt`);
  if (robots.ok) {
    for (const line of robots.lossless_text.split(/\r?\n/)) {
      const match = line.match(/^\s*sitemap:\s*(\S+)/i);
      if (match?.[1]) sitemapUrls.add(match[1].trim());
    }
  }
  for (const sitemapUrl of [...sitemapUrls].slice(0, 6)) {
    const fetched = await safeFetch(sitemapUrl);
    if (!fetched.ok) {
      scoutFailures.push({ url: sitemapUrl, stage: "SITEMAP", error: fetched.error });
      continue;
    }
    for (const loc of extractSitemapLocs(fetched.lossless_text).slice(0, 180)) {
      const url = normalizeCandidateUrl(loc, rootUrl, targetHost);
      if (url) addCandidate(candidates, url, "SITEMAP");
    }
  }
}

async function scoutKnownPaths({ candidates, scoutFailures, rootUrl }) {
  const origin = new URL(rootUrl).origin;
  const paths = new Set(TAXONOMY.flatMap((item) => item.paths || []));
  for (const path of paths) {
    const url = new URL(path, origin).toString();
    const fetched = await safeFetch(url);
    if (fetched.ok) addCandidate(candidates, url, "KNOWN_PATH_PROBE", fetched);
    else if (![404, 410].includes(Number(fetched.http_status || 0))) scoutFailures.push({ url, stage: "KNOWN_PATH_PROBE", error: fetched.error, http_status: fetched.http_status || null });
  }
}

function classifyCandidate(candidate) {
  const url = new URL(candidate.url);
  const path = normalizePath(url.pathname);
  const text = `${url.hostname} ${path} ${candidate.url}`.toLowerCase();
  const matches = [];
  for (const item of TAXONOMY) {
    if ((item.paths || []).some((known) => path === normalizePath(known) || path.startsWith(`${normalizePath(known)}/`))) {
      matches.push(toMatch(item, routeTypeFor(item, path), materialityFor(item)));
    }
  }
  if (/^\/(product|products)\/[^/]+\/?$/i.test(path) && candidate.route_found_by !== "KNOWN_PATH_PROBE") matches.push(family("P1_PRODUCT_SLUG", "product_slug", "product_activity"));
  if (/^\/(platform|features|solutions)\/[^/]+/i.test(path) && candidate.route_found_by !== "KNOWN_PATH_PROBE") matches.push(family("P2_PLATFORM_FEATURE_SOLUTION", "platform_feature_solution_slug", "product_activity"));
  if (/^\/(use-cases|industries|customers)\/[^/]+/i.test(path) && candidate.route_found_by !== "KNOWN_PATH_PROBE") matches.push(family("P4_USE_CASE_INDUSTRY", "use_case_industry_customer_slug", "use_case_context"));
  if (hasAnySignal(text, TECHNICAL_ROUTE_SIGNALS) || url.hostname.toLowerCase().startsWith("docs.")) matches.push(family("P3_AI_CAPABILITY_TECHNICAL", "ai_capability_technical", "product_activity"));
  if ((isDocsOrApiPath(path) || url.hostname.toLowerCase().startsWith("docs.")) && hasAnySignal(text, DATA_FLOW_SIGNALS)) matches.push(family("D4_DOCS_API_DATA_FLOW", "docs_api_data_flow", "data_flow_signal"));
  return dedupeMatches(matches);
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
  if (item.root_family === "L1_CORE_TERMS_PRIVACY") return path.includes("privacy") ? "privacy_policy" : path.includes("eula") ? "eula" : "terms";
  return item.purpose;
}

function materialityFor(item) {
  if (item.bucket === "target_profile_urls") return "target_boundary_and_identity";
  if (item.bucket === "product_activity_profile_urls") return "product_activity";
  if (item.bucket === "data_asset_provenance_profile_urls") return "data_asset_provenance";
  return "legal_governance";
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
  for (const code of ["T0_ROOT", "P0_PRODUCT_ROOT", "P1_PRODUCT_SLUG", "D1_SECURITY_TRUST", "L1_CORE_TERMS_PRIVACY"]) {
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
  return { ROOT: 1, HEADER: 2, FOOTER: 3, SITEMAP: 4, KNOWN_PATH_PROBE: 5 }[routeFoundBy] || 9;
}

function addCandidate(candidates, url, route_found_by, fetch = null) {
  const clean = stripHash(url);
  if (!clean || candidates.has(clean)) return;
  candidates.set(clean, { url: clean, route_found_by, priority_result: "PRIMARY_FOUND", fetch });
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

function extractSitemapLocs(xml) {
  const out = [];
  const regex = /<loc>\s*([^<]+?)\s*<\/loc>/gi;
  for (const match of String(xml || "").matchAll(regex)) out.push(match[1].trim());
  return out;
}

async function safeFetch(url) {
  try {
    const fetched = await fetchSource(url);
    return { ok: true, ...fetched };
  } catch (error) {
    return { ok: false, url, error: error?.message || String(error), http_status: error?.http_status || null };
  }
}

async function fetchSource(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.sourceFetchTimeoutMs);
  try {
    const response = await fetch(url, { method: "GET", signal: controller.signal, redirect: "follow", headers: { "user-agent": "LexNovaHQ-DiligenceReviewer/0.2 (+deterministic-m6-scout)", "accept": "text/html,application/xhtml+xml,text/plain,application/json,application/xml,text/xml,*/*;q=0.5" } });
    const contentType = response.headers.get("content-type") || "";
    const losslessText = await response.text();
    if (!response.ok) {
      const error = new Error(`HTTP_${response.status}`);
      error.http_status = response.status;
      throw error;
    }
    return { http_status: response.status, content_type: contentType, final_url: response.url, lossless_text: losslessText, extraction_warnings: buildWarnings(contentType, losslessText) };
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
