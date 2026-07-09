import { config } from "../../../runtime/config.js";
import { ADAPTERS, COMMON_ROOTS, COMMON_ROOT_ARTIFACT_NAMES, adapterExpansionPathsFromPreflight, emptyNeutralBuckets, legalDocTypeFromUrlOrRoute, neutralBucketsForSource, noLockNoNarrow, primaryNeutralBucket, selectedAdaptersFromPreflight } from "./source-discovery-taxonomy.service.js";

const COMMON_ROOT_BY_ID = Object.freeze(Object.fromEntries(COMMON_ROOTS.map((root) => [root.id, root])));
const COMMON_KNOWN_PATHS = Object.freeze([...new Set(COMMON_ROOTS.flatMap((root) => root.paths || []))]);
const LANGUAGE_SEGMENTS = new Set(["arabic", "assamese", "bengali", "bodo", "dogri", "english", "gujarati", "hindi", "kannada", "kashmiri", "konkani", "maithili", "malayalam", "manipuri", "marathi", "nepali", "odia", "punjabi", "sanskrit", "santali", "sindhi", "tamil", "telugu", "urdu", "en", "hi", "bn", "ta", "te", "mr", "gu", "kn", "ml", "as", "ur", "sa", "ne", "pa", "or", "od", "kok", "mai", "sd", "ks"]);
const SOCIAL_HOST_PARTS = ["linkedin.com", "x.com", "twitter.com", "youtube.com", "github.com", "discord.com", "facebook.com", "instagram.com"];
const DATA_FLOW_SIGNALS = ["upload", "storage", "retention", "delete", "deletion", "export", "webhook", "connector", "auth", "authentication", "permission", "audit", "log", "subprocessor", "training", "customer-data", "customer content"];

export async function buildSourceUrlManifestArtifact({ run, preflightContext = {} }) {
  const rootUrl = normalizeRootUrl(run.root_url || run.target);
  const rootHost = stripWww(new URL(rootUrl).hostname);
  const candidates = new Map();
  const rejectedCandidates = [];
  const scoutFailures = [];
  const discoveryLog = [];
  const adapterPaths = adapterExpansionPathsFromPreflight(preflightContext);

  addCandidate(candidates, rejectedCandidates, rootUrl, "ROOT", rootHost);
  const rootFetch = await safeFetchRaw(rootUrl);
  if (rootFetch.ok) {
    discoveryLog.push({ step: "ROOT_FETCH", status: "PASS", url: rootUrl });
    addScopedAnchors(candidates, rejectedCandidates, rootFetch.raw_text, rootUrl, rootHost);
    addLinkedSitemaps(candidates, rejectedCandidates, rootFetch.raw_text, rootUrl, rootHost);
  } else {
    discoveryLog.push({ step: "ROOT_FETCH", status: "FAIL", url: rootUrl, error: rootFetch.error });
    scoutFailures.push({ url: rootUrl, stage: "ROOT", error: rootFetch.error });
  }

  await scoutSitemaps({ candidates, rejectedCandidates, scoutFailures, discoveryLog, rootUrl, rootHost, rootHtml: rootFetch.raw_text || "" });
  await scoutKnownPaths({ candidates, rejectedCandidates, scoutFailures, discoveryLog, rootUrl, rootHost, paths: COMMON_KNOWN_PATHS, probeClass: "COMMON_CORE" });
  if (adapterPaths.length) await scoutKnownPaths({ candidates, rejectedCandidates, scoutFailures, discoveryLog, rootUrl, rootHost, paths: adapterPaths, probeClass: "EXPAND_ONLY_ADAPTER" });

  const rowMap = new Map();
  let rawRootMatchRows = 0;
  for (const candidate of [...candidates.values()].sort(sortCandidates)) {
    const matches = classifyCandidate(candidate, rootHost);
    rawRootMatchRows += matches.length;
    for (const match of matches) {
      const key = `${match.common_root}|${candidate.canonical_url_key}`;
      const existing = rowMap.get(key);
      if (existing) {
        existing.route_type_aliases = unique([...existing.route_type_aliases, match.route_type]);
        existing.discovered_by = unique([...existing.discovered_by, ...candidate.discovered_by]);
        existing.url_variants = unique([...existing.url_variants, ...candidate.url_variants]);
        existing.duplicate_match_count += 1;
        continue;
      }
      const legal = legalDocTypeFromUrlOrRoute(`${match.route_type} ${candidate.canonical_url}`);
      const row = {
        common_root: match.common_root,
        canonical_url: candidate.canonical_url,
        canonical_url_key: candidate.canonical_url_key,
        fetch_url: candidate.preferred_fetch_url,
        url_variants: candidate.url_variants,
        route_type: match.route_type,
        route_type_aliases: [],
        materiality: match.materiality,
        neutral_buckets: neutralBucketsForSource({ ...match, canonical_url: candidate.canonical_url, fetch_url: candidate.preferred_fetch_url }),
        discovered_by: candidate.discovered_by,
        priority_route_found_by: candidate.priority_route_found_by,
        priority_result: "PRIMARY_FOUND",
        admission_tier: match.admission_tier,
        variant_class: match.variant_class,
        variant_cluster_id: match.variant_cluster_id,
        variant_rank: match.variant_rank,
        extraction_decision: extractionDecision(match.admission_tier),
        downstream_default: match.admission_tier === "PRIMARY",
        tier_reason: match.tier_reason,
        legal_doc_candidate: legal.docType !== "other" || match.materiality === "legal_document",
        legal_doc_type: legal.docType,
        legal_doc_artifact_hint: legal.artifactName,
        classification_effect: "NONE",
        domain_lock_allowed: false,
        duplicate_match_count: 0
      };
      rowMap.set(key, row);
    }
  }

  const sortedRows = [...rowMap.values()].sort((a, b) => a.common_root.localeCompare(b.common_root) || a.canonical_url.localeCompare(b.canonical_url));
  const rootCounters = Object.fromEntries(COMMON_ROOTS.map((root) => [root.id, 0]));
  const manifestSources = sortedRows.map((row) => ({ manifest_id: `${row.common_root}.URL.${String(++rootCounters[row.common_root]).padStart(3, "0")}`, ...row }));
  const rootIndex = Object.fromEntries(COMMON_ROOTS.map((root) => [root.id, manifestSources.filter((row) => row.common_root === root.id).map((row) => row.manifest_id)]));
  const neutralBuckets = emptyNeutralBuckets();
  for (const row of manifestSources) for (const bucket of row.neutral_buckets || []) neutralBuckets[bucket].sources.push(manifestRef(row));
  const selectedAdapters = selectedAdaptersFromPreflight(preflightContext);

  return {
    deduped_url_manifest: {
      run_id: run.run_id,
      target: run.target,
      target_url: rootUrl,
      generated_by: "source_discovery_url_manifest",
      taxonomy_version: "PHASE1_AGNOSTIC_URL_MANIFEST_v1",
      target_boundary: {
        submitted_url: run.root_url || run.target,
        resolved_primary_url: rootUrl,
        source_mode: run.source_mode || "url",
        target_controlled_root: new URL(rootUrl).origin,
        target_host: rootHost,
        allowed_host_rule: "same root host and target-controlled subdomains only"
      },
      source_search_rule_applied: {
        mandatory_discovery_first: "ROOT, HEADER, FOOTER, sitemap discovery, then common known-path probes. Adapter probes are expand-only and cannot narrow or exclude.",
        dedupe_rule: "Dedupe happens before extraction using common_root + canonical URL keys. www/non-www variants collapse into one manifest row.",
        tier_rule: "PRIMARY is extracted by Source Extraction. SECONDARY and CONTEXT_ONLY remain manifest-only. METADATA_ONLY and REJECTED_NOT_EVIDENCE are never extracted.",
        legal_doc_rule: "Distinct public legal documents are PRIMARY and must be extracted into independent legal_doc_* artifacts.",
        extraction_boundary: "Source Extraction may extract only rows with admission_tier PRIMARY and extraction_decision EXTRACT.",
        forbidden_actions_confirmed: noLockNoNarrow()
      },
      common_root_artifacts: COMMON_ROOT_ARTIFACT_NAMES,
      common_root_index: rootIndex,
      manifest_sources: manifestSources,
      rejected_candidates: rejectedCandidates,
      scout_failures: scoutFailures,
      discovery_log: discoveryLog,
      dedupe_forensics: {
        raw_candidate_events_seen: [...candidates.values()].reduce((sum, item) => sum + item.url_variants.length, 0) + rejectedCandidates.length,
        canonical_candidate_urls: candidates.size,
        raw_common_root_match_rows: rawRootMatchRows,
        deduped_manifest_rows: manifestSources.length,
        primary_rows_for_extraction: manifestSources.filter((row) => row.admission_tier === "PRIMARY").length,
        manifest_only_rows: manifestSources.filter((row) => ["SECONDARY", "CONTEXT_ONLY"].includes(row.admission_tier)).length,
        no_extract_rows: manifestSources.filter((row) => ["METADATA_ONLY", "REJECTED_NOT_EVIDENCE"].includes(row.admission_tier)).length,
        duplicate_candidate_events_removed: [...candidates.values()].reduce((sum, item) => sum + Math.max(0, item.url_variants.length - 1), 0),
        duplicate_common_root_matches_collapsed: sortedRows.reduce((sum, row) => sum + row.duplicate_match_count + row.route_type_aliases.length, 0),
        generated_at: new Date().toISOString()
      }
    },
    source_discovery_matrix_manifest: {
      run_id: run.run_id,
      target_url: rootUrl,
      generated_by: "source_discovery_url_manifest",
      schema_version: "PHASE1_AGNOSTIC_SOURCE_DISCOVERY_MATRIX_v1",
      classifications: ["COMMON_CORE_ROOT", "EXPAND_ONLY_ADAPTER_ROOT", "NEUTRAL_SIGNAL_BUCKET"],
      common_core_roots: COMMON_ROOTS.map(({ id, priority, buckets, paths }) => ({ id, artifact_name: `lossless_root__${id}`, priority, neutral_buckets: buckets, probe_paths: paths })),
      adapter_expansion_roots: ADAPTERS.map((adapter) => ({ adapter_id: adapter.adapter_id, adapter_type: adapter.adapter_type, mode: "EXPAND_ONLY", may_expand_discovery: true, may_narrow_discovery: false, may_exclude_sources: false, probe_paths: adapter.paths })),
      neutral_signal_buckets: Object.keys(neutralBuckets).map((bucket) => ({ bucket, priority: primaryNeutralBucket(bucket) ? "PRIMARY" : "SECONDARY" })),
      primary_secondary_rule: "Primary/secondary controls discovery priority only. It is not legal-strength or domain-classification ranking.",
      forbidden_actions_confirmed: noLockNoNarrow()
    },
    adapter_expansion_log: {
      run_id: run.run_id,
      generated_by: "source_discovery_url_manifest",
      schema_version: "PHASE1_ADAPTER_EXPANSION_LOG_v1",
      adapter_mode: "EXPAND_ONLY",
      selected_from_preflight_candidates: selectedAdapters.map((adapter) => ({ adapter_id: adapter.adapter_id, adapter_type: adapter.adapter_type, tested_paths: adapter.paths, may_narrow_discovery: false, may_exclude_sources: false, classification_effect: "NONE" })),
      adapter_paths_registered: adapterPaths,
      dynamic_routing_used: false,
      domain_lock_used: false
    },
    neutral_evidence_bucket_manifest: {
      run_id: run.run_id,
      generated_by: "source_discovery_url_manifest",
      schema_version: "PHASE1_NEUTRAL_EVIDENCE_BUCKET_MANIFEST_v1",
      buckets: neutralBuckets,
      bucket_rule: "Buckets store source evidence only. Domain classification is forbidden inside Phase 1.",
      forbidden_actions_confirmed: noLockNoNarrow()
    }
  };
}

function classifyCandidate(candidate, rootHost) {
  const url = new URL(candidate.preferred_fetch_url);
  const host = stripWww(url.hostname);
  const path = normalizePath(url.pathname);
  const segments = path.split("/").filter(Boolean);
  const matches = [];
  const subdomain = host !== rootHost;

  if (!subdomain && path === "/") matches.push(primary("homepage_landing", "primary_homepage", "target_boundary", "Exact submitted/root host homepage."));
  if (subdomain && path === "/" && host.startsWith("docs.")) matches.push(primary("technical_docs_api_developer", "docs_subdomain_root", "technical_docs", "Docs subdomain root."));
  if (subdomain && path === "/" && isAppHost(host)) matches.push(metadata("technical_docs_api_developer", "app_shell_subdomain", "Dashboard/app shell metadata only."));
  if (subdomain && path === "/" && !host.startsWith("docs.") && !isAppHost(host)) matches.push(primary("product_service", "target_controlled_product_subdomain", "product_activity", "Target-controlled product subdomain root."));

  for (const root of COMMON_ROOTS) {
    if (!root.paths?.length) continue;
    if (root.id === "homepage_landing" && path !== "/") continue;
    if (matchAny(path, root.paths)) {
      const tier = root.priority === "PRIMARY" ? primary : secondary;
      matches.push(tier(root.id, routeTypeForRoot(root.id, path), materialityForRoot(root.id), `${root.id} public route matched.`));
    }
  }

  if (isBlogPath(path)) matches.push(context("blog_resources", "blog_or_resource", "supporting_context", "Blog/resource context; manifest-only."));
  if (isDocsApiOrIntegrationPath(path) && hasDataFlowSignal(path)) matches.push(primary("docs_api_data_flow", "docs_api_data_flow", "data_flow_signal", "Docs/API route shows data flow/control signal."));
  if (isLanguageVariant(segments)) matches.push(context("technical_docs_api_developer", "language_or_locale_variant", "technical_variant", "Language/locale/API variant; manifest-only."));

  return mergeMatchesByRoot(matches);
}

function routeTypeForRoot(root, path) {
  const legal = legalDocTypeFromUrlOrRoute(path);
  if (legal.docType !== "other") return legal.docType;
  return root;
}
function materialityForRoot(root) {
  if (["legal_identity_notice", "privacy_data_processing"].includes(root)) return "legal_document";
  if (["security_trust", "trust_compliance"].includes(root)) return "trust_compliance";
  if (["technical_docs_api_developer", "docs_api_data_flow", "integrations_ecosystem"].includes(root)) return "technical_evidence";
  if (["product_service", "platform_feature_solution"].includes(root)) return "product_activity";
  if (root === "pricing_commercial_availability") return "commercial_terms";
  return "source_evidence";
}
function primary(commonRoot, routeType, materiality, reason) { return row(commonRoot, routeType, materiality, "PRIMARY", "NONE", reason); }
function secondary(commonRoot, routeType, materiality, reason) { return row(commonRoot, routeType, materiality, "SECONDARY", "SECONDARY_SUPPORT", reason); }
function context(commonRoot, routeType, materiality, reason) { return row(commonRoot, routeType, materiality, "CONTEXT_ONLY", "CONTEXT", reason); }
function metadata(commonRoot, routeType, reason) { return row(commonRoot, routeType, "metadata_only", "METADATA_ONLY", "APP_OR_GATED_SHELL", reason); }
function row(commonRoot, routeType, materiality, tier, variantClass, reason) { return { common_root: commonRoot, route_type: routeType, materiality, admission_tier: tier, variant_class: variantClass, variant_cluster_id: routeType, variant_rank: tier === "PRIMARY" ? 1 : 99, tier_reason: reason }; }
function extractionDecision(tier) { return tier === "PRIMARY" ? "EXTRACT" : ["SECONDARY", "CONTEXT_ONLY"].includes(tier) ? "MANIFEST_ONLY" : "NO_EXTRACT"; }
function mergeMatchesByRoot(matches) { const byRoot = new Map(); for (const match of matches) { const existing = byRoot.get(match.common_root); if (!existing) { byRoot.set(match.common_root, { ...match }); continue; } const better = betterTier(match, existing) ? match : existing; better.route_type_aliases = unique([...(existing.route_type_aliases || []), existing.route_type, match.route_type].filter((x) => x !== better.route_type)); byRoot.set(match.common_root, better); } return [...byRoot.values()]; }
function betterTier(a, b) { return tierRank(a.admission_tier) < tierRank(b.admission_tier); }
function tierRank(tier) { return { PRIMARY: 1, SECONDARY: 2, CONTEXT_ONLY: 3, METADATA_ONLY: 4, REJECTED_NOT_EVIDENCE: 5 }[tier] || 9; }
function manifestRef(row) { return { manifest_id: row.manifest_id, common_root: row.common_root, canonical_url: row.canonical_url, fetch_url: row.fetch_url, route_type: row.route_type, admission_tier: row.admission_tier, extraction_decision: row.extraction_decision }; }
function addScopedAnchors(candidates, rejectedCandidates, html, rootUrl, rootHost) { const chunks = [...extractTagChunks(html, "header").map((chunk) => ({ chunk, by: "HEADER" })), ...extractTagChunks(html, "footer").map((chunk) => ({ chunk, by: "FOOTER" })), { chunk: html, by: "ROOT" }]; for (const scoped of chunks) for (const href of extractHrefs(scoped.chunk)) addCandidate(candidates, rejectedCandidates, normalizeCandidateUrl(href, rootUrl, rootHost), scoped.by, rootHost); }
function addLinkedSitemaps(candidates, rejectedCandidates, html, rootUrl, rootHost) { for (const href of extractLinkedSitemaps(html)) addCandidate(candidates, rejectedCandidates, normalizeCandidateUrl(href, rootUrl, rootHost), "SITEMAP_LINK", rootHost); }
async function scoutSitemaps({ candidates, rejectedCandidates, scoutFailures, discoveryLog, rootUrl, rootHost, rootHtml }) { const origin = new URL(rootUrl).origin; const sitemapUrls = new Set([`${origin}/sitemap.xml`, `${origin}/sitemap-index.xml`]); for (const href of extractLinkedSitemaps(rootHtml)) { const url = normalizeCandidateUrl(href, rootUrl, rootHost); if (url) sitemapUrls.add(url); } const robots = await safeFetchRaw(`${origin}/robots.txt`); if (robots.ok) for (const line of robots.raw_text.split(/\r?\n/)) { const match = line.match(/^\s*sitemap:\s*(\S+)/i); if (match?.[1]) sitemapUrls.add(match[1].trim()); } const visited = new Set(); const queue = [...sitemapUrls]; while (queue.length && visited.size < 20) { const sitemapUrl = queue.shift(); if (!sitemapUrl || visited.has(sitemapUrl)) continue; visited.add(sitemapUrl); const fetched = await safeFetchRaw(sitemapUrl); if (!fetched.ok) { discoveryLog.push({ step: "SITEMAP_FETCH", status: "FAIL", url: sitemapUrl, error: fetched.error }); scoutFailures.push({ url: sitemapUrl, stage: "SITEMAP", error: fetched.error }); continue; } discoveryLog.push({ step: "SITEMAP_FETCH", status: "PASS", url: sitemapUrl }); for (const loc of extractSitemapLocs(fetched.raw_text).slice(0, 500)) { const url = normalizeCandidateUrl(loc, rootUrl, rootHost); if (!url) continue; if (url.endsWith(".xml") && visited.size < 20) queue.push(url); else addCandidate(candidates, rejectedCandidates, url, "SITEMAP", rootHost); } } }
async function scoutKnownPaths({ candidates, rejectedCandidates, scoutFailures, discoveryLog, rootUrl, rootHost, paths, probeClass }) { const origin = new URL(rootUrl).origin; for (const path of paths) { const url = new URL(path, origin).toString(); const fetched = await safeFetchRaw(url); if (fetched.ok) { discoveryLog.push({ step: `${probeClass}_PATH_PROBE`, status: "PASS", url }); addCandidate(candidates, rejectedCandidates, url, `${probeClass}_PATH_PROBE`, rootHost); } else if (![404, 410].includes(Number(fetched.http_status || 0))) { discoveryLog.push({ step: `${probeClass}_PATH_PROBE`, status: "LIMITED", url, error: fetched.error, http_status: fetched.http_status || null }); scoutFailures.push({ url, stage: `${probeClass}_PATH_PROBE`, error: fetched.error, http_status: fetched.http_status || null }); } } }
function addCandidate(candidates, rejectedCandidates, url, routeFoundBy, rootHost) { if (!url) return; const normalized = normalizeCandidateForManifest(url, rootHost); if (!normalized) return; const host = new URL(normalized.fetch_url).hostname; if (isSocialHost(host)) { rejectedCandidates.push({ url, route_found_by: routeFoundBy, rejection_reason: "external_social_host" }); return; } const existing = candidates.get(normalized.canonical_url_key); if (existing) { existing.discovered_by = unique([...existing.discovered_by, routeFoundBy]); existing.url_variants = unique([...existing.url_variants, normalized.original_url]); existing.priority_route_found_by = chooseBetterDiscovery(existing.priority_route_found_by, routeFoundBy); return; } candidates.set(normalized.canonical_url_key, { canonical_url: normalized.canonical_url, canonical_url_key: normalized.canonical_url_key, preferred_fetch_url: normalized.fetch_url, discovered_by: [routeFoundBy], priority_route_found_by: routeFoundBy, url_variants: [normalized.original_url] }); }
function matchAny(path, roots) { return roots.some((root) => path === root || path.startsWith(`${root}/`)); }
function isAppHost(host) { return /^(app|dashboard|console|account|login)\./i.test(host); }
function isBlogPath(path) { return /^\/(blog|blogs|news|press|resources)($|\/)/i.test(path); }
function isDocsApiOrIntegrationPath(path) { return /\/(docs|developer|developers|api|apis|api-reference|integrations|connectors|webhooks|authentication|permissions|audit-logs)/i.test(path); }
function hasDataFlowSignal(path) { return DATA_FLOW_SIGNALS.some((signal) => path.toLowerCase().includes(signal)); }
function isLanguageVariant(segments) { return segments.some((segment) => LANGUAGE_SEGMENTS.has(segment.toLowerCase()) || /^[a-z]{2}-[a-z]{2}$/i.test(segment)); }
function sortCandidates(a, b) { return priority(a.priority_route_found_by) - priority(b.priority_route_found_by) || a.canonical_url.localeCompare(b.canonical_url); }
function priority(routeFoundBy) { return { ROOT: 1, HEADER: 2, FOOTER: 3, SITEMAP: 4, SITEMAP_LINK: 4, COMMON_CORE_PATH_PROBE: 5, EXPAND_ONLY_ADAPTER_PATH_PROBE: 6 }[routeFoundBy] || 9; }
function chooseBetterDiscovery(a, b) { return priority(b) < priority(a) ? b : a; }
function unique(values) { return [...new Set(values.filter(Boolean))]; }
function stripWww(hostname) { return String(hostname || "").replace(/^www\./i, "").toLowerCase(); }
function normalizePath(pathname) { return String(pathname || "/").replace(/\/+$/g, "").toLowerCase() || "/"; }
function normalizeRootUrl(value) { const raw = String(value || "").trim(); const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`; const url = new URL(withProtocol); url.hash = ""; if (!url.pathname || url.pathname === "/") url.pathname = "/"; return url.toString(); }
function normalizeCandidateUrl(value, baseUrl, rootHost) { try { const url = new URL(String(value || "").trim(), baseUrl); if (!["http:", "https:"].includes(url.protocol)) return ""; const host = stripWww(url.hostname); if (!(host === rootHost || host.endsWith(`.${rootHost}`))) return ""; url.hash = ""; return url.toString(); } catch { return ""; } }
function normalizeCandidateForManifest(value, rootHost) { try { const url = new URL(value); url.hash = ""; url.search = ""; const host = stripWww(url.hostname); if (!(host === rootHost || host.endsWith(`.${rootHost}`))) return null; const path = normalizePath(url.pathname); const canonicalUrl = `${url.protocol}//${host}${path}`; return { original_url: value, fetch_url: url.toString(), canonical_url: canonicalUrl, canonical_url_key: canonicalUrl }; } catch { return null; } }
function isSocialHost(hostname) { const host = String(hostname || "").toLowerCase(); return SOCIAL_HOST_PARTS.some((part) => host === part || host.endsWith(`.${part}`)); }
function extractTagChunks(html, tag) { const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi"); return [...String(html || "").matchAll(regex)].map((match) => match[1] || ""); }
function extractHrefs(html) { const out = []; const regex = /<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/gi; for (const match of String(html || "").matchAll(regex)) out.push(match[1]); return out; }
function extractLinkedSitemaps(html) { const out = []; const regex = /<link\b[^>]*rel=["'][^"']*sitemap[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>/gi; for (const match of String(html || "").matchAll(regex)) out.push(match[1]); return out; }
function extractSitemapLocs(xml) { const out = []; const regex = /<loc>\s*([^<]+?)\s*<\/loc>/gi; for (const match of String(xml || "").matchAll(regex)) out.push(match[1].trim()); return out; }
async function safeFetchRaw(url) { try { const fetched = await fetchRaw(url); return { ok: true, ...fetched }; } catch (error) { return { ok: false, url, error: error?.message || String(error), http_status: error?.http_status || null }; } }
async function fetchRaw(url) { const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), config.sourceFetchTimeoutMs); try { const response = await fetch(url, { method: "GET", signal: controller.signal, redirect: "follow", headers: { "user-agent": "LexNovaHQ-DiligenceReviewer/1.0 (+phase1-agnostic-source-discovery)", "accept": "text/markdown,text/plain,text/html,application/xhtml+xml,application/json,application/xml,text/xml,*/*;q=0.5" } }); const contentType = response.headers.get("content-type") || ""; const rawText = await response.text(); if (!response.ok) { const error = new Error(`HTTP_${response.status}`); error.http_status = response.status; throw error; } return { http_status: response.status, content_type: contentType, final_url: response.url, raw_text: rawText, extraction_warnings: buildWarnings(contentType, rawText) }; } catch (error) { if (error?.name === "AbortError") throw new Error("FETCH_TIMEOUT"); throw error; } finally { clearTimeout(timeout); } }
function buildWarnings(contentType, text) { const warnings = []; const lower = String(contentType || "").toLowerCase(); if (lower.includes("pdf")) warnings.push("PDF_FETCHED_AS_TEXT_NOT_PARSED"); if (String(text || "").length > 900000) warnings.push("LARGE_SOURCE_TEXT"); return warnings; }
