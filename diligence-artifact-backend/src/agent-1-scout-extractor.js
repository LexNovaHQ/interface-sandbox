import crypto from "node:crypto";
import { config } from "./config.js";
import { ROOT_FAMILY_CODES, LOSSLESS_ROOT_FAMILY_ARTIFACT_NAMES } from "./constants.js";

const FAMILY_META = Object.freeze({
  T0_ROOT: ["target_profile_urls", "homepage_primary_public_root"],
  T1_IDENTITY: ["target_profile_urls", "about_company_identity"],
  T2_LEGAL_IDENTITY: ["target_profile_urls", "legal_identity_notice"],
  T3_OPERATOR_ENTITY: ["target_profile_urls", "operator_entity_fallback"],
  T4_SUPPORTING_IDENTITY: ["target_profile_urls", "supporting_company_signals"],
  P1_PRODUCT: ["product_activity_profile_urls", "product_root_and_product_slug_pages"],
  P2_PLATFORM_FEATURE_SOLUTION: ["product_activity_profile_urls", "platform_feature_solution_pages"],
  P3_AI_CAPABILITY_TECHNICAL: ["product_activity_profile_urls", "ai_api_docs_integrations_capability"],
  P4_USE_CASE_INDUSTRY: ["product_activity_profile_urls", "use_case_industry_customer_context"],
  P5_ENTERPRISE_PRICING: ["product_activity_profile_urls", "pricing_enterprise_plans"],
  D1_SECURITY_TRUST: ["data_asset_provenance_profile_urls", "security_trust_compliance"],
  D2_SUBPROCESSOR_PRIVACY_CENTER: ["data_asset_provenance_profile_urls", "subprocessor_privacy_center_dpa"],
  D3_DATA_GOVERNANCE_CONTROLS: ["data_asset_provenance_profile_urls", "data_governance_controls"],
  D4_DOCS_API_DATA_FLOW: ["data_asset_provenance_profile_urls", "docs_api_data_flow_signal"],
  D5_AI_SAFETY_TRANSPARENCY: ["data_asset_provenance_profile_urls", "ai_safety_transparency"],
  L1_CORE_TERMS_PRIVACY: ["legal_governance_profile_urls", "core_terms_privacy_eula"],
  L2_B2B_CONTRACTING: ["legal_governance_profile_urls", "b2b_contracting_documents"],
  L3_AI_USAGE_GOVERNANCE: ["legal_governance_profile_urls", "ai_usage_governance"],
  L4_PRIVACY_ADJACENT_NOTICES: ["legal_governance_profile_urls", "privacy_adjacent_notices"],
  L5_LEGAL_HUB_HOSTED: ["legal_governance_profile_urls", "legal_policy_trust_hub"],
  L6_ENTITY_NOTICE: ["legal_governance_profile_urls", "entity_notice_controller"]
});

const KNOWN_PATHS = Object.freeze([
  "/", "/about", "/about-us", "/company", "/our-company", "/who-we-are",
  "/legal", "/legal-notice", "/imprint", "/controller", "/team", "/careers", "/newsroom", "/press", "/blog", "/blogs",
  "/product", "/products", "/platform", "/features", "/solutions", "/models", "/agents", "/assistant", "/assistants", "/studio",
  "/api", "/apis", "/developer", "/developers", "/docs", "/integrations", "/connectors", "/actions", "/workflows", "/automation",
  "/use-cases", "/industries", "/customers", "/stories", "/pricing", "/api-pricing", "/enterprise", "/contact-sales", "/plans",
  "/security", "/security-center", "/data-security", "/trust", "/trust-center", "/compliance", "/compliance-center", "/soc-2", "/iso-27001",
  "/subprocessors", "/subprocessor", "/privacy-center", "/data-protection", "/gdpr", "/dpa", "/data-processing-agreement",
  "/enterprise-privacy", "/customer-data", "/data-processing", "/data-residency", "/retention", "/deletion", "/data-export", "/data-deletion",
  "/responsible-ai", "/ai-policy", "/ai-transparency", "/transparency", "/safety", "/model-card", "/model-cards", "/model-details", "/usage-policy",
  "/terms", "/terms-of-use", "/terms-of-service", "/terms-and-conditions", "/privacy", "/privacy-policy", "/eula",
  "/aup", "/acceptable-use", "/acceptable-use-policy", "/sla", "/service-level-agreement", "/service-credit-terms", "/platform-agreement", "/customer-agreement",
  "/content-policy", "/model-policy", "/safety-policy", "/cookie-policy", "/cookies", "/do-not-sell", "/data-privacy-framework", "/ccpa", "/legal-center", "/legal-hub", "/policies", "/terms-and-policies"
]);

const LANGUAGE_SEGMENTS = new Set([
  "arabic", "assamese", "bengali", "bodo", "dogri", "english", "gujarati", "hindi", "kannada", "kashmiri", "konkani", "maithili", "malayalam", "manipuri", "marathi", "nepali", "odia", "punjabi", "sanskrit", "santali", "sindhi", "tamil", "telugu", "urdu",
  "en", "hi", "bn", "ta", "te", "mr", "gu", "kn", "ml", "as", "ur", "sa", "ne", "pa", "or", "od", "kok", "mai", "sd", "ks"
]);
const SOCIAL_HOST_PARTS = ["linkedin.com", "x.com", "twitter.com", "youtube.com", "github.com", "discord.com", "facebook.com", "instagram.com"];
const DATA_FLOW_SIGNALS = ["upload", "storage", "retention", "delete", "deletion", "export", "webhook", "connector", "auth", "authentication", "permission", "audit", "log", "subprocessor", "training", "customer-data", "customer content"];

export async function buildAgent1aDedupedUrlManifest({ run }) {
  const rootUrl = normalizeRootUrl(run.root_url || run.target);
  const rootHost = stripWww(new URL(rootUrl).hostname);
  const candidates = new Map();
  const rejectedCandidates = [];
  const scoutFailures = [];
  const discoveryLog = [];

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
  await scoutKnownPaths({ candidates, rejectedCandidates, scoutFailures, discoveryLog, rootUrl, rootHost });

  const familyMap = new Map();
  let rawFamilyMatchRows = 0;
  for (const candidate of [...candidates.values()].sort(sortCandidates)) {
    const matches = classifyCandidate(candidate, rootHost);
    rawFamilyMatchRows += matches.length;
    for (const match of matches) {
      const key = `${match.root_family}|${candidate.canonical_url_key}`;
      const existing = familyMap.get(key);
      if (existing) {
        existing.route_type_aliases = unique([...existing.route_type_aliases, match.route_type]);
        existing.discovered_by = unique([...existing.discovered_by, ...candidate.discovered_by]);
        existing.url_variants = unique([...existing.url_variants, ...candidate.url_variants]);
        existing.duplicate_match_count += 1;
        continue;
      }
      familyMap.set(key, {
        bucket: match.bucket,
        root_family: match.root_family,
        canonical_url: candidate.canonical_url,
        canonical_url_key: candidate.canonical_url_key,
        fetch_url: candidate.preferred_fetch_url,
        url_variants: candidate.url_variants,
        route_type: match.route_type,
        route_type_aliases: [],
        materiality: match.materiality,
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
        duplicate_match_count: 0
      });
    }
  }

  const sortedRows = [...familyMap.values()].sort((a, b) => a.root_family.localeCompare(b.root_family) || a.canonical_url.localeCompare(b.canonical_url));
  const familyCounters = Object.fromEntries(ROOT_FAMILY_CODES.map((code) => [code, 0]));
  const manifestSources = sortedRows.map((row) => {
    const n = String(++familyCounters[row.root_family]).padStart(3, "0");
    return { manifest_id: `${row.root_family}.URL.${n}`, ...row };
  });
  const familyIndex = Object.fromEntries(ROOT_FAMILY_CODES.map((code) => [code, manifestSources.filter((row) => row.root_family === code).map((row) => row.manifest_id)]));

  return {
    deduped_url_manifest: {
      run_id: run.run_id,
      target: run.target,
      target_url: rootUrl,
      generated_by: "agent_1a_url_manifest",
      taxonomy_version: "M6_PHASE_1A_TIERED_DEDUPED_URL_MANIFEST_v2",
      target_boundary: {
        submitted_url: run.root_url || run.target,
        resolved_primary_url: rootUrl,
        source_mode: run.source_mode || "url",
        target_controlled_root: new URL(rootUrl).origin,
        target_host: rootHost,
        allowed_host_rule: "same root host and target-controlled subdomains only"
      },
      source_search_rule_applied: {
        mandatory_discovery_first: "ROOT, HEADER, FOOTER, /sitemap.xml, sitemap-index, linked sitemaps, robots sitemap references, then known-path probes. No extraction occurs in Phase 1A.",
        dedupe_rule: "Dedupe happens before extraction using canonical root_family + canonical URL keys. www/non-www variants collapse into one manifest row.",
        tier_rule: "PRIMARY is extracted by Phase 1B. SECONDARY and CONTEXT_ONLY remain manifest-only. METADATA_ONLY and REJECTED_NOT_EVIDENCE are never extracted.",
        legal_exception: "Distinct public legal/governance documents are PRIMARY. Only exact aliases, gated docs, and broken pages are excluded.",
        extraction_boundary: "Phase 1B may extract only rows with admission_tier PRIMARY and extraction_decision EXTRACT."
      },
      root_family_artifacts: LOSSLESS_ROOT_FAMILY_ARTIFACT_NAMES,
      family_index: familyIndex,
      manifest_sources: manifestSources,
      rejected_candidates: rejectedCandidates,
      scout_failures: scoutFailures,
      discovery_log: discoveryLog,
      dedupe_forensics: {
        raw_candidate_events_seen: [...candidates.values()].reduce((sum, item) => sum + item.url_variants.length, 0) + rejectedCandidates.length,
        canonical_candidate_urls: candidates.size,
        raw_family_match_rows: rawFamilyMatchRows,
        deduped_manifest_rows: manifestSources.length,
        primary_rows_for_extraction: manifestSources.filter((row) => row.admission_tier === "PRIMARY").length,
        manifest_only_rows: manifestSources.filter((row) => ["SECONDARY", "CONTEXT_ONLY"].includes(row.admission_tier)).length,
        no_extract_rows: manifestSources.filter((row) => ["METADATA_ONLY", "REJECTED_NOT_EVIDENCE"].includes(row.admission_tier)).length,
        duplicate_candidate_events_removed: [...candidates.values()].reduce((sum, item) => sum + Math.max(0, item.url_variants.length - 1), 0),
        duplicate_family_matches_collapsed: sortedRows.reduce((sum, row) => sum + row.duplicate_match_count + row.route_type_aliases.length, 0),
        generated_at: new Date().toISOString()
      }
    }
  };
}

export async function buildAgent1bExtractArtifacts({ run, deduped_url_manifest }) {
  if (!deduped_url_manifest?.manifest_sources?.length) throw new Error("AGENT_1B_BLOCKED:deduped_url_manifest_missing_or_empty");

  const rootUrl = deduped_url_manifest.target_url || normalizeRootUrl(run.root_url || run.target);
  const rootHost = stripWww(new URL(rootUrl).hostname);
  const inventories = emptyFamilyArtifacts({ run, rootUrl });
  const sourceIndex = [];
  const manifestOnlyIndex = [];
  const failedSourceIndex = [];
  const extractionCache = new Map();
  const familyCounters = Object.fromEntries(ROOT_FAMILY_CODES.map((code) => [code, 0]));

  for (const manifestRow of deduped_url_manifest.manifest_sources) {
    const familyArtifact = inventories[`lossless_family__${manifestRow.root_family}`];
    if (!familyArtifact) continue;

    if (manifestRow.extraction_decision !== "EXTRACT" || manifestRow.admission_tier !== "PRIMARY") {
      const indexed = {
        manifest_id: manifestRow.manifest_id,
        bucket: manifestRow.bucket,
        root_family: manifestRow.root_family,
        canonical_url: manifestRow.canonical_url,
        fetch_url: manifestRow.fetch_url,
        route_type: manifestRow.route_type,
        admission_tier: manifestRow.admission_tier,
        variant_class: manifestRow.variant_class,
        extraction_decision: manifestRow.extraction_decision,
        tier_reason: manifestRow.tier_reason
      };
      familyArtifact.manifest_only_sources.push(indexed);
      manifestOnlyIndex.push(indexed);
      continue;
    }

    const extracted = await getOrExtract(extractionCache, manifestRow, rootUrl, rootHost);
    const sourceNumber = String(++familyCounters[manifestRow.root_family]).padStart(3, "0");
    const sourceId = `${manifestRow.root_family}.SRC.${sourceNumber}`;
    const baseRow = {
      source_id: sourceId,
      manifest_id: manifestRow.manifest_id,
      bucket: manifestRow.bucket,
      root_family: manifestRow.root_family,
      canonical_url: manifestRow.canonical_url,
      url: manifestRow.fetch_url,
      route_type: manifestRow.route_type,
      route_type_aliases: manifestRow.route_type_aliases || [],
      materiality: manifestRow.materiality,
      discovered_by: manifestRow.discovered_by,
      route_found_by: manifestRow.priority_route_found_by,
      priority_result: manifestRow.priority_result,
      admission_tier: manifestRow.admission_tier,
      variant_class: manifestRow.variant_class,
      extraction_decision: manifestRow.extraction_decision,
      tier_reason: manifestRow.tier_reason,
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
      familyArtifact.sources.push(row);
      sourceIndex.push(withoutLosslessText(row));
    } else {
      const failed = { ...baseRow, extraction_status: extracted.status || "FETCH_FAILED", error: extracted.error };
      familyArtifact.rejected_sources.push(failed);
      failedSourceIndex.push(failed);
    }
  }

  const missingLimited = buildMissingLimited(inventories, deduped_url_manifest);
  for (const artifactName of LOSSLESS_ROOT_FAMILY_ARTIFACT_NAMES) {
    const artifact = inventories[artifactName];
    artifact.missing_limited_primary_sources = missingLimited.filter((item) => item.root_family === artifact.root_family);
    artifact.corpus_forensics.total_sources = artifact.sources.length;
    artifact.corpus_forensics.manifest_only_sources = artifact.manifest_only_sources.length;
    artifact.corpus_forensics.rejected_sources = artifact.rejected_sources.length;
    artifact.dedupe_forensics = buildFamilyDedupeForensics(deduped_url_manifest, artifact);
  }

  return {
    source_family_index: {
      run_id: run.run_id,
      target: run.target,
      target_url: rootUrl,
      generated_by: "agent_1b_extract",
      taxonomy_version: "M6_PHASE_1B_PRIMARY_ONLY_EXTRACTION_v2",
      manifest_artifact_required: "deduped_url_manifest",
      extraction_boundary: "Phase 1B extracted only PRIMARY rows from Phase 1A. SECONDARY and CONTEXT_ONLY remain manifest-only for downstream request.",
      root_family_artifacts: LOSSLESS_ROOT_FAMILY_ARTIFACT_NAMES,
      discovered_source_index: sourceIndex,
      manifest_only_index: manifestOnlyIndex,
      failed_source_index: failedSourceIndex,
      missing_limited_primary_sources: missingLimited,
      corpus_forensics: {
        manifest_rows_read: deduped_url_manifest.manifest_sources.length,
        primary_rows_seen: deduped_url_manifest.manifest_sources.filter((row) => row.admission_tier === "PRIMARY").length,
        sources_extracted: sourceIndex.length,
        manifest_only_rows: manifestOnlyIndex.length,
        failed_or_rejected_sources: failedSourceIndex.length,
        extraction_cache_entries: extractionCache.size,
        generated_at: new Date().toISOString()
      }
    },
    ...inventories
  };
}

function classifyCandidate(candidate, rootHost) {
  const url = new URL(candidate.preferred_fetch_url);
  const host = stripWww(url.hostname);
  const path = normalizePath(url.pathname);
  const segments = path.split("/").filter(Boolean);
  const matches = [];
  const subdomain = host !== rootHost;

  if (!subdomain && path === "/") matches.push(primary("T0_ROOT", "primary_homepage", "target_boundary", "Exact submitted/root host homepage."));
  if (subdomain && path === "/" && host.startsWith("docs.")) matches.push(primary("P3_AI_CAPABILITY_TECHNICAL", "docs_subdomain_root", "product_activity", "Docs subdomain root."));
  if (subdomain && path === "/" && isAppHost(host)) matches.push(metadata("P3_AI_CAPABILITY_TECHNICAL", "app_shell_subdomain", "Dashboard/app shell metadata only."));
  if (subdomain && path === "/" && !host.startsWith("docs.") && !isAppHost(host)) matches.push(primary("P1_PRODUCT", "target_controlled_product_subdomain", "product_activity", "Target-controlled product subdomain root."));

  if (!subdomain && matchAny(path, ["/about", "/about-us", "/company", "/our-company", "/who-we-are"])) matches.push(primary("T1_IDENTITY", "company_identity", "target_identity", "Official company identity page."));
  if (!subdomain && matchAny(path, ["/legal-notice", "/imprint", "/controller"])) {
    matches.push(primary("T2_LEGAL_IDENTITY", "legal_identity_notice", "target_identity", "Public legal/entity identity notice."));
    matches.push(primary("L6_ENTITY_NOTICE", "entity_notice_controller", "legal_governance", "Public entity/controller notice; legal exception."));
  }
  if (!subdomain && matchAny(path, ["/team", "/careers", "/newsroom", "/press"])) matches.push(secondary("T4_SUPPORTING_IDENTITY", "supporting_identity", "target_context", "Supporting identity page; manifest-only by default."));
  if (!subdomain && isBlogPath(path)) matches.push(context("T4_SUPPORTING_IDENTITY", "blog_or_announcement", "Blog/news context; manifest-only."));

  if (matchAny(path, ["/product", "/products"]) || /^\/(product|products)\/[^/]+\/?$/i.test(path)) matches.push(primary("P1_PRODUCT", path === "/product" || path === "/products" ? "product_root" : "product_slug", "product_activity", "Official product root or product slug page."));
  if (matchAny(path, ["/platform", "/features", "/solutions"])) matches.push(pathDepth(path) <= 1 ? primary("P2_PLATFORM_FEATURE_SOLUTION", "platform_feature_solution_root", "product_activity", "Core platform/feature/solution root page.") : secondary("P2_PLATFORM_FEATURE_SOLUTION", "platform_feature_solution_child", "product_activity", "Feature child page; manifest-only by default."));
  if (matchAny(path, ["/use-cases", "/industries", "/customers", "/stories"])) matches.push(pathDepth(path) <= 1 ? secondary("P4_USE_CASE_INDUSTRY", "use_case_index", "use_case_context", "Use-case/customer index; manifest-only.") : context("P4_USE_CASE_INDUSTRY", "case_study_or_story", "Customer story/case-study context; manifest-only unless downstream requests."));
  if (matchAny(path, ["/pricing", "/api-pricing", "/plans"])) matches.push(primary("P5_ENTERPRISE_PRICING", "pricing_or_plans", "commercial_terms", "Pricing/plans page."));
  if (matchAny(path, ["/enterprise", "/contact-sales"])) matches.push(secondary("P5_ENTERPRISE_PRICING", "enterprise_or_sales", "commercial_context", "Enterprise/contact-sales page; manifest-only unless substantive pricing gap."));

  classifyTechnical(path, host, segments, matches);
  classifyDataAndLegal(path, matches);

  return mergeMatchesByFamily(matches);
}

function classifyTechnical(path, host, segments, matches) {
  const docsHost = host.startsWith("docs.");
  const machineReadable = /(?:^|\/)(llms\.txt|openapi\.json|openapi\.ya?ml|swagger\.json|asyncapi\.json|asyncapi\.ya?ml)$/i.test(path);
  if (machineReadable) matches.push(primary("P3_AI_CAPABILITY_TECHNICAL", "machine_readable_api_or_docs_index", "api_reference", "Machine-readable docs/API index."));
  if (docsHost || matchAny(path, ["/docs", "/developer", "/developers", "/api", "/apis", "/api-reference"])) {
    if (isExamplePath(path) || isFaqSupportPath(path)) matches.push(context("P3_AI_CAPABILITY_TECHNICAL", "deep_docs_context", "technical_context", "Examples/FAQ/support docs are manifest-only."));
    else if (isSdkPath(path)) matches.push(secondary("P3_AI_CAPABILITY_TECHNICAL", "sdk_or_client_docs", "technical_support", "SDK/client docs are secondary manifest-only."));
    else if (isLanguageVariant(segments)) matches.push(context("P3_AI_CAPABILITY_TECHNICAL", "language_or_locale_variant", "technical_variant", "Language/locale/API variant; manifest-only."));
    else if (/^\/apis\/[^/]+\/?$/i.test(path) || pathDepth(path) <= 1 || docsHost) matches.push(primary("P3_AI_CAPABILITY_TECHNICAL", "api_docs_or_api_family_root", "product_activity", "API/docs root or API family root."));
    else matches.push(secondary("P3_AI_CAPABILITY_TECHNICAL", "technical_child_page", "technical_support", "Technical child page; manifest-only by default."));
  }
  if (matchAny(path, ["/models"])) matches.push(pathDepth(path) <= 1 ? primary("P3_AI_CAPABILITY_TECHNICAL", "models_overview", "model_capability", "Model overview page.") : secondary("P3_AI_CAPABILITY_TECHNICAL", "model_detail", "model_support", "Model detail page; manifest-only unless only model source."));
  if (matchAny(path, ["/integrations", "/connectors"])) matches.push(pathDepth(path) <= 1 ? primary("P3_AI_CAPABILITY_TECHNICAL", "integrations_root", "product_activity", "Official integrations root page.") : secondary("P3_AI_CAPABILITY_TECHNICAL", "integration_child", "integration_support", "Integration child page; manifest-only by default."));
  if (matchAny(path, ["/changelog", "/release-notes", "/updates"])) matches.push(pathDepth(path) <= 1 ? secondary("P3_AI_CAPABILITY_TECHNICAL", "changelog_index", "technical_context", "Changelog index is secondary manifest-only.") : context("P3_AI_CAPABILITY_TECHNICAL", "changelog_entry", "technical_context", "Individual changelog entry; manifest-only."));
}

function classifyDataAndLegal(path, matches) {
  if (matchAny(path, ["/security", "/security-center", "/data-security", "/trust", "/trust-center", "/compliance", "/compliance-center", "/soc-2", "/iso-27001"])) matches.push(primary("D1_SECURITY_TRUST", "security_trust_compliance", "data_security", "Public security/trust/compliance source."));
  if (matchAny(path, ["/trust", "/trust-center", "/legal", "/legal-center", "/legal-hub", "/policies", "/terms-and-policies"])) matches.push(primary("L5_LEGAL_HUB_HOSTED", "legal_or_trust_hub", "legal_governance", "Public legal/trust hub; legal exception."));
  if (matchAny(path, ["/subprocessors", "/subprocessor", "/privacy-center", "/data-protection", "/gdpr"])) matches.push(primary("D2_SUBPROCESSOR_PRIVACY_CENTER", "privacy_center_or_subprocessors", "data_processing", "Public privacy center/subprocessor source."));
  if (matchAny(path, ["/customer-data", "/data-processing", "/enterprise-privacy", "/data-residency", "/retention", "/deletion", "/data-export", "/data-deletion"])) matches.push(primary("D3_DATA_GOVERNANCE_CONTROLS", "data_lifecycle_controls", "data_governance", "Public customer-data/data-lifecycle controls."));
  if (hasDataFlowSignal(path) && isDocsApiOrIntegrationPath(path)) matches.push(isExamplePath(path) ? context("D4_DOCS_API_DATA_FLOW", "data_flow_example", "data_flow_context", "Example data-flow page; manifest-only.") : primary("D4_DOCS_API_DATA_FLOW", "central_docs_api_data_flow", "data_flow_signal", "Central docs/API page showing data flow/control signal."));
  if (matchAny(path, ["/responsible-ai", "/ai-policy", "/ai-transparency", "/transparency", "/safety", "/model-card", "/model-cards", "/model-details"])) matches.push(pathDepth(path) <= 1 ? primary("D5_AI_SAFETY_TRANSPARENCY", "ai_safety_transparency", "ai_governance", "Official AI safety/transparency/model-card source.") : secondary("D5_AI_SAFETY_TRANSPARENCY", "ai_safety_child", "ai_governance_support", "AI safety child page; manifest-only."));

  if (matchAny(path, ["/terms", "/terms-of-use", "/terms-of-service", "/terms-and-conditions", "/privacy", "/privacy-policy", "/eula"])) matches.push(primary("L1_CORE_TERMS_PRIVACY", path.includes("privacy") ? "privacy_policy" : path.includes("eula") ? "eula" : "terms", "legal_governance", "Public core legal document; legal exception."));
  if (matchAny(path, ["/dpa", "/data-processing-agreement", "/data-processing-addendum"])) {
    matches.push(primary("L2_B2B_CONTRACTING", "dpa_or_data_processing_addendum", "legal_governance", "Public DPA/data-processing document; legal exception."));
    matches.push(primary("D2_SUBPROCESSOR_PRIVACY_CENTER", "dpa_or_data_processing_addendum", "data_processing", "Public DPA/data-processing document."));
  }
  if (matchAny(path, ["/aup", "/acceptable-use", "/acceptable-use-policy", "/sla", "/service-level-agreement", "/service-credit-terms", "/platform-agreement", "/customer-agreement", "/msa", "/order-terms"])) matches.push(primary("L2_B2B_CONTRACTING", "b2b_contracting_document", "legal_governance", "Public B2B/legal contract document; legal exception."));
  if (matchAny(path, ["/usage-policy", "/content-policy", "/ai-policy", "/model-policy", "/safety-policy"])) matches.push(primary("L3_AI_USAGE_GOVERNANCE", "ai_or_usage_policy", "legal_governance", "Public usage/AI governance policy; legal exception."));
  if (matchAny(path, ["/cookie-policy", "/cookies", "/do-not-sell", "/ccpa", "/gdpr", "/data-privacy-framework"])) matches.push(primary("L4_PRIVACY_ADJACENT_NOTICES", "privacy_adjacent_notice", "legal_governance", "Public privacy-adjacent notice; legal exception."));
}

function primary(rootFamily, routeType, materiality, reason) { return row(rootFamily, routeType, materiality, "PRIMARY", "NONE", reason); }
function secondary(rootFamily, routeType, materiality, reason) { return row(rootFamily, routeType, materiality, "SECONDARY", "SECONDARY_SUPPORT", reason); }
function context(rootFamily, routeType, materiality, reason) { return row(rootFamily, routeType, materiality, "CONTEXT_ONLY", "CONTEXT", reason); }
function metadata(rootFamily, routeType, reason) { return row(rootFamily, routeType, "metadata_only", "METADATA_ONLY", "APP_OR_GATED_SHELL", reason); }
function row(rootFamily, routeType, materiality, tier, variantClass, reason) {
  const [bucket] = FAMILY_META[rootFamily];
  return { bucket, root_family: rootFamily, route_type: routeType, materiality, admission_tier: tier, variant_class: variantClass, variant_cluster_id: routeType, variant_rank: tier === "PRIMARY" ? 1 : 99, tier_reason: reason };
}
function extractionDecision(tier) { return tier === "PRIMARY" ? "EXTRACT" : ["SECONDARY", "CONTEXT_ONLY"].includes(tier) ? "MANIFEST_ONLY" : "NO_EXTRACT"; }

function mergeMatchesByFamily(matches) {
  const byFamily = new Map();
  for (const match of matches) {
    const existing = byFamily.get(match.root_family);
    if (!existing) { byFamily.set(match.root_family, { ...match }); continue; }
    const better = betterTier(match, existing) ? match : existing;
    better.route_type_aliases = unique([...(existing.route_type_aliases || []), existing.route_type, match.route_type].filter((x) => x !== better.route_type));
    byFamily.set(match.root_family, better);
  }
  return [...byFamily.values()];
}
function betterTier(a, b) { return tierRank(a.admission_tier) < tierRank(b.admission_tier); }
function tierRank(tier) { return { PRIMARY: 1, SECONDARY: 2, CONTEXT_ONLY: 3, METADATA_ONLY: 4, REJECTED_NOT_EVIDENCE: 5 }[tier] || 9; }

function addScopedAnchors(candidates, rejectedCandidates, html, rootUrl, rootHost) {
  const chunks = [
    ...extractTagChunks(html, "header").map((chunk) => ({ chunk, by: "HEADER" })),
    ...extractTagChunks(html, "footer").map((chunk) => ({ chunk, by: "FOOTER" })),
    { chunk: html, by: "ROOT" }
  ];
  for (const scoped of chunks) for (const href of extractHrefs(scoped.chunk)) addCandidate(candidates, rejectedCandidates, normalizeCandidateUrl(href, rootUrl, rootHost), scoped.by, rootHost);
}
function addLinkedSitemaps(candidates, rejectedCandidates, html, rootUrl, rootHost) { for (const href of extractLinkedSitemaps(html)) addCandidate(candidates, rejectedCandidates, normalizeCandidateUrl(href, rootUrl, rootHost), "SITEMAP_LINK", rootHost); }
async function scoutSitemaps({ candidates, rejectedCandidates, scoutFailures, discoveryLog, rootUrl, rootHost, rootHtml }) {
  const origin = new URL(rootUrl).origin;
  const sitemapUrls = new Set([`${origin}/sitemap.xml`, `${origin}/sitemap-index.xml`]);
  for (const href of extractLinkedSitemaps(rootHtml)) { const url = normalizeCandidateUrl(href, rootUrl, rootHost); if (url) sitemapUrls.add(url); }
  const robots = await safeFetchRaw(`${origin}/robots.txt`);
  if (robots.ok) for (const line of robots.raw_text.split(/\r?\n/)) { const match = line.match(/^\s*sitemap:\s*(\S+)/i); if (match?.[1]) sitemapUrls.add(match[1].trim()); }
  const visited = new Set();
  const queue = [...sitemapUrls];
  while (queue.length && visited.size < 20) {
    const sitemapUrl = queue.shift();
    if (!sitemapUrl || visited.has(sitemapUrl)) continue;
    visited.add(sitemapUrl);
    const fetched = await safeFetchRaw(sitemapUrl);
    if (!fetched.ok) { discoveryLog.push({ step: "SITEMAP_FETCH", status: "FAIL", url: sitemapUrl, error: fetched.error }); scoutFailures.push({ url: sitemapUrl, stage: "SITEMAP", error: fetched.error }); continue; }
    discoveryLog.push({ step: "SITEMAP_FETCH", status: "PASS", url: sitemapUrl });
    for (const loc of extractSitemapLocs(fetched.raw_text).slice(0, 500)) {
      const url = normalizeCandidateUrl(loc, rootUrl, rootHost);
      if (!url) continue;
      if (url.endsWith(".xml") && visited.size < 20) queue.push(url);
      else addCandidate(candidates, rejectedCandidates, url, "SITEMAP", rootHost);
    }
  }
}
async function scoutKnownPaths({ candidates, rejectedCandidates, scoutFailures, discoveryLog, rootUrl, rootHost }) {
  const origin = new URL(rootUrl).origin;
  for (const path of KNOWN_PATHS) {
    const url = new URL(path, origin).toString();
    const fetched = await safeFetchRaw(url);
    if (fetched.ok) { discoveryLog.push({ step: "KNOWN_PATH_PROBE", status: "PASS", url }); addCandidate(candidates, rejectedCandidates, url, "KNOWN_PATH_PROBE", rootHost); }
    else if (![404, 410].includes(Number(fetched.http_status || 0))) { discoveryLog.push({ step: "KNOWN_PATH_PROBE", status: "LIMITED", url, error: fetched.error, http_status: fetched.http_status || null }); scoutFailures.push({ url, stage: "KNOWN_PATH_PROBE", error: fetched.error, http_status: fetched.http_status || null }); }
  }
}
function addCandidate(candidates, rejectedCandidates, url, routeFoundBy, rootHost) {
  if (!url) return;
  const normalized = normalizeCandidateForManifest(url, rootHost);
  if (!normalized) return;
  const host = new URL(normalized.fetch_url).hostname;
  if (isSocialHost(host)) { rejectedCandidates.push({ url, route_found_by: routeFoundBy, rejection_reason: "external_social_host" }); return; }
  const existing = candidates.get(normalized.canonical_url_key);
  if (existing) { existing.discovered_by = unique([...existing.discovered_by, routeFoundBy]); existing.url_variants = unique([...existing.url_variants, normalized.original_url]); existing.priority_route_found_by = chooseBetterDiscovery(existing.priority_route_found_by, routeFoundBy); return; }
  candidates.set(normalized.canonical_url_key, { canonical_url: normalized.canonical_url, canonical_url_key: normalized.canonical_url_key, preferred_fetch_url: normalized.fetch_url, discovered_by: [routeFoundBy], priority_route_found_by: routeFoundBy, url_variants: [normalized.original_url] });
}
async function getOrExtract(cache, manifestRow, rootUrl, rootHost) { const key = manifestRow.canonical_url_key; if (cache.has(key)) return cache.get(key); const extracted = await fetchBestEvidenceText(manifestRow.fetch_url, rootUrl, rootHost); cache.set(key, extracted); return extracted; }
async function fetchBestEvidenceText(url, rootUrl, rootHost) {
  for (const mdUrl of markdownCandidateUrls(url)) { const md = await safeFetchRaw(mdUrl); if (md.ok && isClearMarkdownText(md.raw_text, md.content_type) && !isBadEvidenceText(md.raw_text)) return toEvidence(md, "MARKDOWN_DERIVED"); }
  const html = await safeFetchRaw(url);
  if (!html.ok) return { ok: false, error: html.error, http_status: html.http_status || null };
  for (const href of extractMarkdownAlternates(html.raw_text)) { const mdUrl = normalizeCandidateUrl(href, url || rootUrl, rootHost); const md = mdUrl ? await safeFetchRaw(mdUrl) : { ok: false }; if (md.ok && isClearMarkdownText(md.raw_text, md.content_type) && !isBadEvidenceText(md.raw_text)) return toEvidence(md, "MARKDOWN_ALTERNATE"); }
  const clean = cleanHtmlToText(html.raw_text);
  if (!clean || clean.length < 120) return { ok: false, status: "REJECTED_NOT_EVIDENCE", error: "NO_CLEAR_TEXT_AFTER_HTML_CLEAN", http_status: html.http_status || null };
  if (isBadEvidenceText(clean)) return { ok: false, status: "REJECTED_NOT_EVIDENCE", error: "BAD_OR_PLACEHOLDER_EVIDENCE_TEXT", http_status: html.http_status || null };
  return { ok: true, http_status: html.http_status, content_type: html.content_type, final_url: html.final_url, lossless_text: clean, evidence_text_source: "CLEANED_HTML", extraction_warnings: [...html.extraction_warnings, "RAW_HTML_NOT_STORED"] };
}

function emptyFamilyArtifacts({ run, rootUrl }) { const out = {}; for (const code of ROOT_FAMILY_CODES) { const [bucket, purpose] = FAMILY_META[code] || ["UNMAPPED_BUCKET", "unmapped_root_family"]; out[`lossless_family__${code}`] = { run_id: run.run_id, target_url: rootUrl, artifact_name: `lossless_family__${code}`, generated_by: "agent_1b_extract", bucket, root_family: code, purpose, sources: [], manifest_only_sources: [], rejected_sources: [], missing_limited_primary_sources: [], corpus_forensics: { total_sources: 0, manifest_only_sources: 0, rejected_sources: 0 }, dedupe_forensics: {} }; } return out; }
function buildFamilyDedupeForensics(manifest, artifact) { const rows = manifest.manifest_sources.filter((row) => row.root_family === artifact.root_family); return { manifest_rows_seen: rows.length, primary_rows_seen: rows.filter((row) => row.admission_tier === "PRIMARY").length, manifest_only_rows_seen: rows.filter((row) => ["SECONDARY", "CONTEXT_ONLY"].includes(row.admission_tier)).length, canonical_urls_seen: new Set(rows.map((row) => row.canonical_url_key)).size, canonical_sources_saved: artifact.sources.length, duplicate_rows_allowed: false }; }
function buildMissingLimited(inventories, manifest) { const rows = []; for (const code of ROOT_FAMILY_CODES) { const artifact = inventories[`lossless_family__${code}`]; const primaryManifestRows = manifest.manifest_sources.filter((row) => row.root_family === code && row.admission_tier === "PRIMARY"); if (artifact && primaryManifestRows.length === 0 && shouldReportEmptyFamily(code)) rows.push({ root_family: code, bucket_affected: artifact.bucket, missing_or_limited_source: code, search_exhausted: true, attempted_manifest_rows: manifest.manifest_sources.filter((row) => row.root_family === code).length, why_it_matters: "No PRIMARY public source was found in Phase 1A for this root family.", status: "ABSENT_AFTER_TARGETED_PROBE" }); } return rows; }
function shouldReportEmptyFamily(code) { return !["P2_PLATFORM_FEATURE_SOLUTION", "P4_USE_CASE_INDUSTRY", "D2_SUBPROCESSOR_PRIVACY_CENTER", "D3_DATA_GOVERNANCE_CONTROLS", "D5_AI_SAFETY_TRANSPARENCY", "L2_B2B_CONTRACTING", "L3_AI_USAGE_GOVERNANCE", "L4_PRIVACY_ADJACENT_NOTICES", "L6_ENTITY_NOTICE"].includes(code); }

function matchAny(path, roots) { return roots.some((root) => path === root || path.startsWith(`${root}/`)); }
function pathDepth(path) { return path.split("/").filter(Boolean).length; }
function isAppHost(host) { return /^(app|dashboard|console|account|login)\./i.test(host); }
function isBlogPath(path) { return /^\/(blog|blogs|news|press)($|\/)/i.test(path); }
function isExamplePath(path) { return /\/(examples?|samples?|cookbook|tutorials?)($|\/)/i.test(path); }
function isSdkPath(path) { return /\/(sdk|sdks|python|javascript|node|curl|client-libraries?)($|\/)/i.test(path); }
function isFaqSupportPath(path) { return /\/(faq|support|help|troubleshooting)($|\/)/i.test(path); }
function isDocsApiOrIntegrationPath(path) { return /\/(docs|developer|developers|api|apis|api-reference|integrations|connectors|webhooks|authentication|permissions|audit-logs)/i.test(path); }
function hasDataFlowSignal(path) { return DATA_FLOW_SIGNALS.some((signal) => path.toLowerCase().includes(signal)); }
function isLanguageVariant(segments) { return segments.some((segment) => LANGUAGE_SEGMENTS.has(segment.toLowerCase()) || /^[a-z]{2}-[a-z]{2}$/i.test(segment)); }
function isBadEvidenceText(text) { const value = String(text || "").trim().toLowerCase(); return value.includes("page not found") || value.includes("this page does not exist") || value === "sarvam platform\nbuild powerful multilingual voice and speech applications with sarvam platform.\nsarvam platform"; }
function sortCandidates(a, b) { return priority(a.priority_route_found_by) - priority(b.priority_route_found_by) || a.canonical_url.localeCompare(b.canonical_url); }
function priority(routeFoundBy) { return { ROOT: 1, HEADER: 2, FOOTER: 3, SITEMAP: 4, SITEMAP_LINK: 4, KNOWN_PATH_PROBE: 5 }[routeFoundBy] || 9; }
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
function extractMarkdownAlternates(html) { const out = []; const regex = /<link\b[^>]*rel=["'][^"']*alternate[^"']*["'][^>]*type=["']text\/markdown["'][^>]*href=["']([^"']+)["'][^>]*>/gi; for (const match of String(html || "").matchAll(regex)) out.push(match[1]); return out; }
function extractSitemapLocs(xml) { const out = []; const regex = /<loc>\s*([^<]+?)\s*<\/loc>/gi; for (const match of String(xml || "").matchAll(regex)) out.push(match[1].trim()); return out; }
function markdownCandidateUrls(value) { const out = []; try { const url = new URL(value); const path = url.pathname.replace(/\/$/, ""); if (path && path !== "/" && !path.endsWith(".md")) { const md = new URL(url.toString()); md.pathname = `${path}.md`; out.push(md.toString()); } if (path.endsWith(".md")) out.push(url.toString()); } catch { return []; } return out; }
function isClearMarkdownText(text, contentType) { const value = String(text || "").trim(); if (value.length < 80) return false; if (/^<!doctype html/i.test(value) || /<html[\s>]/i.test(value)) return false; const lowerType = String(contentType || "").toLowerCase(); return lowerType.includes("markdown") || lowerType.includes("text/plain") || lowerType.includes("octet-stream") || /(^|\n)#{1,3}\s+/.test(value) || value.includes("\n- ") || value.includes("\n## "); }
function toEvidence(fetchResult, source) { return { ok: true, http_status: fetchResult.http_status, content_type: fetchResult.content_type, final_url: fetchResult.final_url, lossless_text: normalizeEvidenceText(fetchResult.raw_text), evidence_text_source: source, extraction_warnings: fetchResult.extraction_warnings }; }
function cleanHtmlToText(html) { const title = extractFirst(html, /<title[^>]*>([\s\S]*?)<\/title>/i); const meta = extractMetaDescription(html); const body = String(html || "").replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<noscript[\s\S]*?<\/noscript>/gi, " ").replace(/<svg[\s\S]*?<\/svg>/gi, " ").replace(/<canvas[\s\S]*?<\/canvas>/gi, " ").replace(/<!--[\s\S]*?-->/g, " ").replace(/<[^>]+>/g, " "); return normalizeEvidenceText([title, meta, decodeEntities(body)].filter(Boolean).join("\n\n")); }
function normalizeEvidenceText(text) { return decodeEntities(String(text || "")).replace(/\r/g, "\n").replace(/[ \t]+/g, " ").replace(/\n[ \t]+/g, "\n").replace(/\n{3,}/g, "\n\n").trim(); }
function decodeEntities(value) { return String(value || "").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, '"').replace(/&#x27;/gi, "'").replace(/&#39;/gi, "'").replace(/&ldquo;/gi, '"').replace(/&rdquo;/gi, '"').replace(/&rsquo;/gi, "'").replace(/&lsquo;/gi, "'"); }
function extractMetaDescription(html) { return extractFirst(html, /<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i) || extractFirst(html, /<meta\s+[^>]*content=["']([^"']*)["'][^>]*name=["']description["'][^>]*>/i); }
function extractFirst(value, regex) { const match = String(value || "").match(regex); return match?.[1] ? decodeEntities(match[1]).trim() : ""; }
async function safeFetchRaw(url) { try { const fetched = await fetchRaw(url); return { ok: true, ...fetched }; } catch (error) { return { ok: false, url, error: error?.message || String(error), http_status: error?.http_status || null }; } }
async function fetchRaw(url) { const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), config.sourceFetchTimeoutMs); try { const response = await fetch(url, { method: "GET", signal: controller.signal, redirect: "follow", headers: { "user-agent": "LexNovaHQ-DiligenceReviewer/0.5 (+tiered-primary-extraction)", "accept": "text/markdown,text/plain,text/html,application/xhtml+xml,application/json,application/xml,text/xml,*/*;q=0.5" } }); const contentType = response.headers.get("content-type") || ""; const rawText = await response.text(); if (!response.ok) { const error = new Error(`HTTP_${response.status}`); error.http_status = response.status; throw error; } return { http_status: response.status, content_type: contentType, final_url: response.url, raw_text: rawText, extraction_warnings: buildWarnings(contentType, rawText) }; } catch (error) { if (error?.name === "AbortError") throw new Error("FETCH_TIMEOUT"); throw error; } finally { clearTimeout(timeout); } }
function buildWarnings(contentType, text) { const warnings = []; const lower = String(contentType || "").toLowerCase(); if (lower.includes("pdf")) warnings.push("PDF_FETCHED_AS_TEXT_NOT_PARSED"); if (String(text || "").length > 900000) warnings.push("LARGE_SOURCE_TEXT"); return warnings; }
function withoutLosslessText(row) { const { lossless_text: _losslessText, ...rest } = row; return rest; }
function sha256(value) { return crypto.createHash("sha256").update(String(value || "")).digest("hex"); }
