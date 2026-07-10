import { config } from "../../../runtime/config.js";
import { ADAPTERS, API_DATA_FLOW_FAMILY_SEGMENTS, COMMON_ROOTS, COMMON_ROOT_ARTIFACT_NAMES, LEGAL_DOC_RULES, ROOT_TRAVERSAL_POLICY, adapterExpansionPathsFromPreflight, allDomainHintPaths, emptyNeutralBuckets, legalDocTypeFromUrlOrRoute, loadedDomainHintPacksSummary, neutralBucketsForSource, noLockNoNarrow, primaryNeutralBucket, selectedAdaptersFromPreflight } from "./source-discovery-taxonomy.service.js";

const COMMON_ROOT_BY_ID = Object.freeze(Object.fromEntries(COMMON_ROOTS.map((root) => [root.id, root])));
const LEGAL_DOC_KNOWN_PATHS = Object.freeze([...new Set(LEGAL_DOC_RULES.flatMap(([, , terms]) => terms.map((term) => `/${term}`)))]);
const LANGUAGE_SEGMENTS = new Set(["arabic", "assamese", "bengali", "bodo", "dogri", "english", "gujarati", "hindi", "kannada", "kashmiri", "konkani", "maithili", "malayalam", "manipuri", "marathi", "nepali", "odia", "punjabi", "sanskrit", "santali", "sindhi", "tamil", "telugu", "urdu", "en", "hi", "bn", "ta", "te", "mr", "gu", "kn", "ml", "as", "ur", "sa", "ne", "pa", "or", "od", "kok", "mai", "sd", "ks"]);
const SOCIAL_HOST_PARTS = ["linkedin.com", "x.com", "twitter.com", "youtube.com", "github.com", "discord.com", "facebook.com", "instagram.com"];
const DATA_FLOW_SIGNALS = ["upload", "storage", "retention", "delete", "deletion", "export", "webhook", "connector", "auth", "authentication", "permission", "audit", "log", "subprocessor", "training", "customer-data", "customer-content", "file", "image", "audio", "document", "payment", "transaction", "ledger", "settlement", "disbursement", "payout", "mandate", "kyc", "onboarding"];

export async function buildSourceUrlManifestArtifact({ run, preflightContext = {} }) {
  const rootUrl = normalizeRootUrl(run.root_url || run.target);
  const rootHost = stripWww(new URL(rootUrl).hostname);
  const candidates = new Map();
  const rejectedCandidates = [];
  const scoutFailures = [];
  const discoveryLog = [];
  const adapterPaths = adapterExpansionPathsFromPreflight(preflightContext);
  const unionHintPaths = allDomainHintPaths();
  const expandedAdapterProbePaths = [...new Set([...adapterPaths, ...unionHintPaths])];

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
  await scoutLockedRootMatrix({ candidates, rejectedCandidates, scoutFailures, discoveryLog, rootUrl, rootHost });
  await scoutKnownPaths({ candidates, rejectedCandidates, scoutFailures, discoveryLog, rootUrl, rootHost, paths: LEGAL_DOC_KNOWN_PATHS, probeClass: "LEGAL_DOC" });
  await scoutKnownPaths({ candidates, rejectedCandidates, scoutFailures, discoveryLog, rootUrl, rootHost, paths: expandedAdapterProbePaths, probeClass: "EXPAND_ONLY_ADAPTER" });

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
        existing.source_signal_roles = unique([...existing.source_signal_roles, ...(match.source_signal_roles || [])]);
        existing.discovered_by = unique([...existing.discovered_by, ...candidate.discovered_by]);
        existing.url_variants = unique([...existing.url_variants, ...candidate.url_variants]);
        existing.duplicate_match_count += 1;
        continue;
      }
      const legal = legalDocTypeFromUrlOrRoute(`${match.route_type} ${candidate.canonical_url}`);
      const row = {
        common_root: match.common_root,
        root_traversal_policy: ROOT_TRAVERSAL_POLICY[match.common_root] || "UNSPECIFIED",
        canonical_url: candidate.canonical_url,
        canonical_url_key: candidate.canonical_url_key,
        fetch_url: candidate.preferred_fetch_url,
        url_variants: candidate.url_variants,
        route_type: match.route_type,
        route_type_aliases: [],
        materiality: match.materiality,
        source_signal_roles: unique(match.source_signal_roles || []),
        technical_route_shape: match.technical_route_shape || null,
        api_data_flow_signal: match.api_data_flow_signal || { present: false, basis: [] },
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
        legal_doc_candidate: legal.docType !== "other" || match.materiality === "legal_document" || (match.source_signal_roles || []).includes("LEGAL_DOCUMENT_SIGNAL"),
        legal_doc_type: legal.docType,
        legal_doc_artifact_hint: legal.artifactName,
        adapter_discovery: adapterDiscovery(candidate.discovered_by),
        phase_1_classification_effect: "SOURCE_ROUTING_ONLY_NOT_JOB_ROUTING",
        classification_effect: "NONE",
        domain_lock_allowed: false,
        duplicate_match_count: 0
      };
      row.neutral_buckets = neutralBucketsForSource(row);
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
      taxonomy_version: "PHASE1_AGNOSTIC_URL_MANIFEST_v3_MULTI_DOMAIN_UNION_PROBE",
      target_boundary: { submitted_url: run.root_url || run.target, resolved_primary_url: rootUrl, source_mode: run.source_mode || "url", target_controlled_root: new URL(rootUrl).origin, target_host: rootHost, allowed_host_rule: "same root host and target-controlled subdomains only" },
      source_search_rule_applied: { mandatory_discovery_first: "ROOT, HEADER, FOOTER, sitemap discovery, locked root-ordered matrix traversal, legal-document probes, then union probe over all loaded domain source-hint packs. PRIMARY_FULL_EXTRACT roots are touched through the full same-root slug chain before moving to the next root. Domain hint probes are expand-only and cannot narrow or exclude.", dedupe_rule: "Dedupe happens before extraction using common_root + canonical URL keys. www/non-www variants collapse into one manifest row.", tier_rule: "PRIMARY is extracted by Source Extraction. SECONDARY and CONTEXT_ONLY remain manifest-only. METADATA_ONLY and REJECTED_NOT_EVIDENCE are never extracted.", legal_doc_rule: "Distinct public legal documents are PRIMARY and must be extracted into independent legal_doc_* artifacts.", extraction_boundary: "Source Extraction may extract only rows with admission_tier PRIMARY and extraction_decision EXTRACT.", forbidden_actions_confirmed: noLockNoNarrow() },
      common_root_artifacts: COMMON_ROOT_ARTIFACT_NAMES,
      common_root_index: rootIndex,
      manifest_sources: manifestSources,
      rejected_candidates: rejectedCandidates,
      scout_failures: scoutFailures,
      discovery_log: discoveryLog,
      root_traversal_policy: ROOT_TRAVERSAL_POLICY,
      dedupe_forensics: { raw_candidate_events_seen: [...candidates.values()].reduce((sum, item) => sum + item.url_variants.length, 0) + rejectedCandidates.length, canonical_candidate_urls: candidates.size, raw_common_root_match_rows: rawRootMatchRows, deduped_manifest_rows: manifestSources.length, primary_rows_for_extraction: manifestSources.filter((row) => row.admission_tier === "PRIMARY").length, manifest_only_rows: manifestSources.filter((row) => ["SECONDARY", "CONTEXT_ONLY"].includes(row.admission_tier)).length, no_extract_rows: manifestSources.filter((row) => ["METADATA_ONLY", "REJECTED_NOT_EVIDENCE"].includes(row.admission_tier)).length, duplicate_candidate_events_removed: [...candidates.values()].reduce((sum, item) => sum + Math.max(0, item.url_variants.length - 1), 0), duplicate_common_root_matches_collapsed: sortedRows.reduce((sum, row) => sum + row.duplicate_match_count + row.route_type_aliases.length, 0), generated_at: new Date().toISOString() }
    },
    source_discovery_matrix_manifest: { run_id: run.run_id, target_url: rootUrl, generated_by: "source_discovery_url_manifest", schema_version: "PHASE1_AGNOSTIC_SOURCE_DISCOVERY_MATRIX_v3_MULTI_DOMAIN_UNION_PROBE", classifications: ["COMMON_CORE_ROOT", "ROOT_ORDERED_SLUG_CHAIN", "EXPAND_ONLY_ADAPTER_ROOT", "DOMAIN_SOURCE_HINT_UNION_PROBE", "NEUTRAL_SIGNAL_BUCKET"], common_core_roots: COMMON_ROOTS.map(({ id, priority, traversal_policy, buckets, paths }) => ({ id, artifact_name: `lossless_root__${id}`, priority, traversal_policy, neutral_buckets: buckets, probe_paths: paths })), adapter_expansion_roots: ADAPTERS.map((adapter) => ({ adapter_id: adapter.adapter_id, adapter_type: adapter.adapter_type, mode: "EXPAND_ONLY", may_expand_discovery: true, may_narrow_discovery: false, may_exclude_sources: false, probe_paths: adapter.paths })), loaded_domain_hint_packs: loadedDomainHintPacksSummary(), union_hint_path_count: unionHintPaths.length, neutral_signal_buckets: Object.keys(neutralBuckets).map((bucket) => ({ bucket, priority: primaryNeutralBucket(bucket) ? "PRIMARY" : "SECONDARY" })), primary_secondary_rule: "Primary/secondary controls discovery priority only. It is not legal-strength or domain-classification ranking.", slug_chain_rule: "Every PRIMARY_FULL_EXTRACT root is crawled through all same-root child slugs discovered from root pages, sitemap rows, header/footer links, and child pages before moving to the next root.", forbidden_actions_confirmed: noLockNoNarrow() },
    adapter_expansion_log: { run_id: run.run_id, generated_by: "source_discovery_url_manifest", schema_version: "PHASE1_ADAPTER_EXPANSION_LOG_v3_MULTI_DOMAIN_UNION_PROBE", adapter_mode: "EXPAND_ONLY", union_probe_mode: "ALL_DOMAIN_HINT_PACKS_PLUS_PREFLIGHT_HINTS", selected_from_preflight_candidates: selectedAdapters.map((adapter) => ({ adapter_id: adapter.adapter_id, adapter_type: adapter.adapter_type, tested_paths: adapter.paths, may_narrow_discovery: false, may_exclude_sources: false, classification_effect: "NONE" })), preflight_adapter_paths_registered: adapterPaths, adapter_paths_registered: unionHintPaths, expanded_adapter_probe_paths: expandedAdapterProbePaths, loaded_domain_hint_packs: loadedDomainHintPacksSummary(), dynamic_routing_used: false, domain_lock_used: false },
    neutral_evidence_bucket_manifest: { run_id: run.run_id, generated_by: "source_discovery_url_manifest", schema_version: "PHASE1_NEUTRAL_EVIDENCE_BUCKET_MANIFEST_v3_MULTI_DOMAIN_UNION_PROBE", buckets: neutralBuckets, bucket_rule: "Buckets store source evidence only. Domain classification is forbidden inside Phase 1.", forbidden_actions_confirmed: noLockNoNarrow() }
  };
}

function classifyCandidate(candidate, rootHost) {
  const url = new URL(candidate.preferred_fetch_url);
  const host = stripWww(url.hostname);
  const path = normalizePath(url.pathname);
  const segments = path.split("/").filter(Boolean);
  const ctx = { path, segments, host, rootHost, subdomain: host !== rootHost };
  const matches = [];
  classifyHomepage(ctx, matches);
  classifyCompanyIdentity(ctx, matches);
  classifyContactNotice(ctx, matches);
  classifyProductService(ctx, matches);
  classifyPlatformFeatureSolution(ctx, matches);
  classifyTechnicalDocsApi(ctx, matches);
  classifyDocsApiDataFlow(ctx, matches);
  classifyIntegrationsEcosystem(ctx, matches);
  classifyPricingCommercialAvailability(ctx, matches);
  classifyUseCaseCustomerIndustry(ctx, matches);
  classifyPrivacyDataProcessing(ctx, matches);
  classifySecurityTrustCompliance(ctx, matches);
  classifyDataGovernanceControls(ctx, matches);
  classifyAiSafetyTransparency(ctx, matches);
  classifySupportHelpResources(ctx, matches);
  classifyLegalDocumentSurfaces(ctx, matches);
  return mergeMatchesByRoot(matches);
}

function classifyHomepage({ path, subdomain }, matches) { if (!subdomain && path === "/") add(matches, "homepage_landing", "primary_homepage", "target_boundary", "PRIMARY", "NONE", "Exact submitted/root host homepage.", ["TARGET_IDENTITY_SIGNAL", "COMMERCIAL_POSITIONING_SIGNAL"]); }
function classifyCompanyIdentity(ctx, matches) {
  const { path } = ctx;
  if (!matchAny(path, ["/about", "/about-us", "/company", "/our-company", "/who-we-are", "/team", "/careers", "/newsroom", "/press", "/legal-notice", "/imprint", "/controller"])) return;
  const route = matchAny(path, ["/legal-notice", "/imprint", "/controller"]) ? "legal_identity_notice" : matchAny(path, ["/team"]) ? "team_or_people" : matchAny(path, ["/careers"]) ? "careers_identity_context" : matchAny(path, ["/newsroom", "/press"]) ? "press_newsroom_context" : "company_identity";
  const roles = ["TARGET_IDENTITY_SIGNAL", route === "legal_identity_notice" ? "LEGAL_NOTICE_SIGNAL" : null, route === "legal_identity_notice" ? "LEGAL_DOCUMENT_SIGNAL" : null].filter(Boolean);
  add(matches, "company_identity", route, route === "legal_identity_notice" ? "legal_document" : "target_identity", "PRIMARY", "NONE", "Company identity matrix route matched.", roles);
}
function classifyContactNotice({ path }, matches) { if (!matchAny(path, ["/contact", "/contact-us", "/support/contact", "/legal", "/privacy/contact"])) return; const route = path.includes("privacy") ? "privacy_contact" : path.includes("legal") ? "legal_contact" : path.includes("support") ? "support_contact" : "general_contact"; add(matches, "contact_notice", route, "contact_notice", "PRIMARY", "NONE", "Contact notice matrix route matched.", ["CONTACT_NOTICE_SIGNAL", route.includes("privacy") ? "DATA_PROCESSING_SIGNAL" : null, route.includes("legal") ? "LEGAL_NOTICE_SIGNAL" : null].filter(Boolean)); }
function classifyProductService({ path, subdomain, host }, matches) { if (subdomain && path === "/" && !host.startsWith("docs.") && !isAppHost(host)) add(matches, "product_service", "product_subdomain_root", "product_activity", "PRIMARY", "NONE", "Target-controlled product subdomain root.", ["PRODUCT_ACTIVITY_SIGNAL"]); if (!matchAny(path, ["/product", "/products", "/services", "/tools"])) return; const first = path.split("/").filter(Boolean)[0] || "product"; const route = pathDepth(path) <= 1 ? `${first}_root` : `${first}_slug`; add(matches, "product_service", route, "product_activity", "PRIMARY", "NONE", "Product/service matrix route matched.", ["PRODUCT_ACTIVITY_SIGNAL", "COMMERCIAL_POSITIONING_SIGNAL"]); }
function classifyPlatformFeatureSolution({ path }, matches) { if (!matchAny(path, ["/platform", "/features", "/solutions", "/workflows", "/automation"])) return; const first = path.split("/").filter(Boolean)[0] || "platform"; const route = pathDepth(path) <= 1 ? `${first}_root` : first === "features" ? "feature_child" : first === "solutions" ? "solution_child" : "platform_child"; add(matches, "platform_feature_solution", route, "product_activity", "PRIMARY", "NONE", "Platform/feature/solution matrix route matched.", ["PRODUCT_ACTIVITY_SIGNAL", path.includes("automation") ? "AI_MECHANISM_SIGNAL" : null].filter(Boolean)); }
function classifyTechnicalDocsApi(ctx, matches) {
  const { path, host, subdomain, segments } = ctx;
  const machineReadable = /(?:^|\/)(llms\.txt|openapi\.json|openapi\.ya?ml|swagger\.json|asyncapi\.json|asyncapi\.ya?ml)$/i.test(path);
  if (machineReadable) add(matches, "technical_docs_api", "machine_readable_api_index", "technical_evidence", "PRIMARY", "NONE", "Machine-readable docs/API index.", ["TECHNICAL_MECHANICS_SIGNAL", "API_INTEGRATION_SIGNAL"], { technical_route_shape: "MACHINE_READABLE_API_INDEX" });
  if (subdomain && path === "/" && host.startsWith("docs.")) add(matches, "technical_docs_api", "docs_subdomain_root", "technical_evidence", "PRIMARY", "NONE", "Docs subdomain root.", ["TECHNICAL_MECHANICS_SIGNAL"], { technical_route_shape: "DOCS_SUBDOMAIN_ROOT" });
  if (subdomain && path === "/" && isAppHost(host)) add(matches, "technical_docs_api", "app_shell_metadata", "metadata_only", "METADATA_ONLY", "APP_OR_GATED_SHELL", "Dashboard/app shell metadata only.", ["TECHNICAL_MECHANICS_SIGNAL"], { technical_route_shape: "APP_SHELL_METADATA" });
  if (!matchAny(path, ["/docs", "/developer", "/developers", "/api", "/apis", "/api-reference", "/sdk", "/sdks", "/models", "/reference"])) return;
  const techShape = isLanguageVariant(segments) ? "LANGUAGE_VARIANT" : isSdkPath(path) ? "SDK_CLIENT_DOCS" : matchAny(path, ["/models"]) ? pathDepth(path) <= 1 ? "MODEL_OVERVIEW" : "MODEL_DETAIL" : /^\/apis\/[^/]+\/?$/i.test(path) ? "API_FAMILY_ROOT" : pathDepth(path) <= 1 ? "API_DOCS_ROOT" : "TECHNICAL_CHILD_PAGE";
  const tier = techShape === "LANGUAGE_VARIANT" ? "CONTEXT_ONLY" : "PRIMARY";
  add(matches, "technical_docs_api", techShape.toLowerCase(), "technical_evidence", tier, tier === "PRIMARY" ? "NONE" : "CONTEXT", "Technical docs/API matrix route matched.", ["TECHNICAL_MECHANICS_SIGNAL", "API_INTEGRATION_SIGNAL", techShape.startsWith("MODEL") ? "AI_MECHANISM_SIGNAL" : null].filter(Boolean), { technical_route_shape: techShape });
}
function classifyDocsApiDataFlow({ path, segments }, matches) {
  const apiFamily = /^\/apis\/([^/]+)\/?$/i.exec(path)?.[1] || "";
  const familySignal = apiFamily && API_DATA_FLOW_FAMILY_SEGMENTS.includes(apiFamily.toLowerCase());
  const explicitDataFlow = matchAny(path, ["/webhooks", "/authentication", "/permissions", "/audit-logs", "/data-flow", "/data-flows"]);
  const docsDataFlow = isDocsApiOrIntegrationPath(path) && hasDataFlowSignal(path);
  if (!familySignal && !explicitDataFlow && !docsDataFlow) return;
  const route = familySignal ? "central_api_family_data_flow" : path.includes("webhook") ? "webhook_data_flow" : path.includes("audit") ? "audit_log_data_flow" : path.includes("auth") || path.includes("permission") ? "auth_permissions_data_flow" : "docs_api_data_flow";
  add(matches, "docs_api_data_flow", route, "data_flow_signal", "PRIMARY", "NONE", "Docs/API data-flow matrix route matched.", ["DATA_FLOW_SIGNAL", "TECHNICAL_MECHANICS_SIGNAL", "API_INTEGRATION_SIGNAL"], { api_data_flow_signal: { present: true, basis: [apiFamily || null, ...segments].filter(Boolean) } });
}
function classifyIntegrationsEcosystem({ path }, matches) { if (!matchAny(path, ["/integrations", "/connectors", "/apps", "/marketplace"])) return; const route = pathDepth(path) <= 1 ? path.split("/").filter(Boolean)[0] + "_root" : "integration_child"; add(matches, "integrations_ecosystem", route, "technical_evidence", "SECONDARY", "SECONDARY_SUPPORT", "Integration/ecosystem matrix route matched.", ["API_INTEGRATION_SIGNAL", hasDataFlowSignal(path) ? "DATA_FLOW_SIGNAL" : null].filter(Boolean)); }
function classifyPricingCommercialAvailability({ path }, matches) { if (!matchAny(path, ["/pricing", "/api-pricing", "/plans", "/enterprise", "/contact-sales"])) return; const route = path.includes("api-pricing") ? "api_pricing" : path.includes("enterprise") ? "enterprise_sales" : path.includes("contact-sales") ? "contact_sales" : path.includes("plans") ? "plans_page" : "pricing_page"; add(matches, "pricing_commercial_availability", route, "commercial_terms", "SECONDARY", "SECONDARY_SUPPORT", "Pricing/commercial availability matrix route matched.", ["COMMERCIAL_AVAILABILITY_SIGNAL"]); }
function classifyUseCaseCustomerIndustry({ path }, matches) { if (!matchAny(path, ["/use-cases", "/industries", "/customers", "/stories", "/case-studies"])) return; const route = path.includes("industr") ? pathDepth(path) <= 1 ? "industry_index" : "industry_child" : path.includes("customers") ? "customer_index" : path.includes("stories") || path.includes("case-studies") ? "customer_story" : pathDepth(path) <= 1 ? "use_case_index" : "use_case_child"; add(matches, "use_case_customer_industry", route, "use_case_context", "SECONDARY", "SECONDARY_SUPPORT", "Use-case/customer/industry matrix route matched.", ["CUSTOMER_SEGMENT_SIGNAL", regulatedTokenPresent(path) ? "REGULATED_ACTIVITY_SIGNAL" : null].filter(Boolean)); }
function classifyPrivacyDataProcessing({ path }, matches) { if (!matchAny(path, ["/privacy", "/privacy-policy", "/privacy-center", "/data-protection", "/gdpr", "/data-processing", "/data-processing-agreement", "/data-processing-addendum", "/dpa", "/subprocessors", "/subprocessor", "/cookies", "/cookie-policy"])) return; const route = path.includes("subprocessor") ? "subprocessor_list" : path.includes("cookie") ? "cookie_policy" : path.includes("dpa") || path.includes("data-processing-agreement") || path.includes("data-processing-addendum") ? "dpa_or_data_processing_addendum" : path.includes("privacy-center") ? "privacy_center" : path.includes("gdpr") ? "gdpr_privacy_notice" : path.includes("data-processing") ? "data_processing_page" : "privacy_policy"; add(matches, "privacy_data_processing", route, "data_processing", "PRIMARY", "NONE", "Privacy/data-processing matrix route matched.", ["DATA_PROCESSING_SIGNAL", "LEGAL_DOCUMENT_SIGNAL", route.includes("subprocessor") ? "VENDOR_PROCESSING_SIGNAL" : null].filter(Boolean)); }
function classifySecurityTrustCompliance({ path }, matches) { if (!matchAny(path, ["/security", "/security-center", "/data-security", "/trust", "/trust-center", "/compliance", "/compliance-center", "/soc-2", "/iso-27001", "/certifications"])) return; const route = path.includes("soc-2") ? "soc2_signal" : path.includes("iso-27001") ? "iso27001_signal" : path.includes("trust") ? "trust_center" : path.includes("compliance") || path.includes("certifications") ? "compliance_center" : pathDepth(path) <= 1 ? "security_overview" : "security_child"; add(matches, "security_trust_compliance", route, "trust_compliance", "PRIMARY", "NONE", "Security/trust/compliance matrix route matched.", ["SECURITY_TRUST_SIGNAL", "DATA_PROCESSING_SIGNAL"]); }
function classifyDataGovernanceControls({ path }, matches) { if (!matchAny(path, ["/customer-data", "/enterprise-privacy", "/data-residency", "/retention", "/deletion", "/data-export", "/data-deletion"])) return; const route = path.includes("residency") ? "data_residency" : path.includes("retention") ? "retention_controls" : path.includes("deletion") ? "deletion_controls" : path.includes("export") ? "data_export_controls" : path.includes("enterprise-privacy") ? "enterprise_privacy_controls" : "customer_data_controls"; add(matches, "data_governance_controls", route, "data_governance", "PRIMARY", "NONE", "Data-governance controls matrix route matched.", ["DATA_GOVERNANCE_SIGNAL", "DATA_PROCESSING_SIGNAL"]); }
function classifyAiSafetyTransparency({ path }, matches) { if (!matchAny(path, ["/responsible-ai", "/ai-policy", "/ai-transparency", "/transparency", "/safety", "/model-card", "/model-cards", "/model-details", "/usage-policy"])) return; const route = path.includes("model-card") ? pathDepth(path) <= 1 ? "model_card" : "model_card_child" : path.includes("model-details") ? "model_details" : path.includes("usage-policy") ? "usage_policy" : path.includes("safety") ? "safety_policy_or_page" : path.includes("transparency") ? "ai_transparency" : path.includes("ai-policy") ? "ai_policy" : "responsible_ai"; add(matches, "ai_safety_transparency", route, "ai_governance", "PRIMARY", "NONE", "AI safety/transparency matrix route matched.", ["AI_MECHANISM_SIGNAL", "AI_SAFETY_TRANSPARENCY_SIGNAL", "LEGAL_DOCUMENT_SIGNAL"]); }
function classifySupportHelpResources({ path }, matches) { if (!matchAny(path, ["/help", "/support", "/faq", "/knowledge-base"]) && !isBlogPath(path)) return; const route = isBlogPath(path) ? "blog_or_resource" : path.includes("faq") ? "faq_root" : path.includes("knowledge-base") ? "knowledge_base" : pathDepth(path) <= 1 ? "support_root" : "support_article"; add(matches, "support_help_resources", route, "support_context", "SECONDARY", "SECONDARY_SUPPORT", "Support/help resources matrix route matched.", ["SUPPORT_CONTEXT_SIGNAL"]); }
function classifyLegalDocumentSurfaces({ path }, matches) {
  const legal = legalDocTypeFromUrlOrRoute(path);
  if (legal.docType === "other") return;
  if (legal.docType === "legal_notice") add(matches, "company_identity", "legal_identity_notice", "legal_document", "PRIMARY", "NONE", "Legal notice document surface matched.", ["TARGET_IDENTITY_SIGNAL", "LEGAL_NOTICE_SIGNAL", "LEGAL_DOCUMENT_SIGNAL"]);
  else if (["privacy_policy", "data_processing_agreement", "subprocessor_list", "cookie_policy"].includes(legal.docType)) add(matches, "privacy_data_processing", legal.docType, "legal_document", "PRIMARY", "NONE", "Privacy/data legal document surface matched.", ["DATA_PROCESSING_SIGNAL", "LEGAL_DOCUMENT_SIGNAL", legal.docType === "subprocessor_list" ? "VENDOR_PROCESSING_SIGNAL" : null].filter(Boolean));
  else if (["ai_policy", "usage_policy", "content_policy", "safety_policy"].includes(legal.docType)) add(matches, "ai_safety_transparency", legal.docType, "legal_document", "PRIMARY", "NONE", "AI/safety legal document surface matched.", ["AI_MECHANISM_SIGNAL", "AI_SAFETY_TRANSPARENCY_SIGNAL", "LEGAL_DOCUMENT_SIGNAL"]);
  else add(matches, "privacy_data_processing", legal.docType, "legal_document", "PRIMARY", "NONE", "General legal document surface matched for independent legal_doc_* extraction.", ["LEGAL_DOCUMENT_SIGNAL"]);
}

function add(matches, commonRoot, routeType, materiality, tier, variantClass, reason, sourceSignalRoles = [], extra = {}) { matches.push({ common_root: commonRoot, route_type: routeType, materiality, admission_tier: tier, variant_class: variantClass, variant_cluster_id: routeType, variant_rank: tier === "PRIMARY" ? 1 : 99, tier_reason: reason, source_signal_roles: sourceSignalRoles, technical_route_shape: extra.technical_route_shape || null, api_data_flow_signal: extra.api_data_flow_signal || { present: false, basis: [] } }); }
function extractionDecision(tier) { return tier === "PRIMARY" ? "EXTRACT" : ["SECONDARY", "CONTEXT_ONLY"].includes(tier) ? "MANIFEST_ONLY" : "NO_EXTRACT"; }
function mergeMatchesByRoot(matches) { const byRoot = new Map(); for (const match of matches) { const existing = byRoot.get(match.common_root); if (!existing) { byRoot.set(match.common_root, { ...match }); continue; } const better = betterTier(match, existing) ? match : existing; better.route_type_aliases = unique([...(existing.route_type_aliases || []), existing.route_type, match.route_type].filter((x) => x !== better.route_type)); better.source_signal_roles = unique([...(existing.source_signal_roles || []), ...(match.source_signal_roles || [])]); if (!better.technical_route_shape) better.technical_route_shape = existing.technical_route_shape || match.technical_route_shape || null; if (!better.api_data_flow_signal?.present) better.api_data_flow_signal = existing.api_data_flow_signal?.present ? existing.api_data_flow_signal : match.api_data_flow_signal || { present: false, basis: [] }; byRoot.set(match.common_root, better); } return [...byRoot.values()]; }
function betterTier(a, b) { return tierRank(a.admission_tier) < tierRank(b.admission_tier); }
function tierRank(tier) { return { PRIMARY: 1, SECONDARY: 2, CONTEXT_ONLY: 3, METADATA_ONLY: 4, REJECTED_NOT_EVIDENCE: 5 }[tier] || 9; }
function manifestRef(row) { return { manifest_id: row.manifest_id, common_root: row.common_root, canonical_url: row.canonical_url, fetch_url: row.fetch_url, route_type: row.route_type, admission_tier: row.admission_tier, extraction_decision: row.extraction_decision, source_signal_roles: row.source_signal_roles || [] }; }

async function scoutLockedRootMatrix({ candidates, rejectedCandidates, scoutFailures, discoveryLog, rootUrl, rootHost }) { for (const root of COMMON_ROOTS) await scoutRootChain({ root, candidates, rejectedCandidates, scoutFailures, discoveryLog, rootUrl, rootHost }); }
async function scoutRootChain({ root, candidates, rejectedCandidates, scoutFailures, discoveryLog, rootUrl, rootHost }) {
  const origin = new URL(rootUrl).origin;
  const queue = [];
  const queued = new Set();
  for (const path of root.paths || []) enqueueUrl(queue, queued, new URL(path, origin).toString(), rootHost);
  for (const candidate of candidates.values()) if (candidateMatchesRoot(candidate.preferred_fetch_url, root, rootHost)) enqueueUrl(queue, queued, candidate.preferred_fetch_url, rootHost);
  const visited = new Set();
  while (queue.length) {
    const url = queue.shift();
    const normalized = normalizeCandidateForManifest(url, rootHost);
    if (!normalized || visited.has(normalized.canonical_url_key)) continue;
    visited.add(normalized.canonical_url_key);
    const fetched = await safeFetchRaw(url);
    if (fetched.ok) {
      discoveryLog.push({ step: `${root.id.toUpperCase()}_ROOT_CHAIN`, status: "PASS", url, traversal_policy: root.traversal_policy });
      addCandidate(candidates, rejectedCandidates, url, `${root.id.toUpperCase()}_ROOT_CHAIN`, rootHost);
      if (root.traversal_policy === "PRIMARY_FULL_EXTRACT") {
        for (const href of extractHrefs(fetched.raw_text)) {
          const child = normalizeCandidateUrl(href, url, rootHost);
          if (child && candidateMatchesRoot(child, root, rootHost)) enqueueUrl(queue, queued, child, rootHost);
        }
      }
    } else if (![404, 410].includes(Number(fetched.http_status || 0))) {
      discoveryLog.push({ step: `${root.id.toUpperCase()}_ROOT_CHAIN`, status: "LIMITED", url, error: fetched.error, http_status: fetched.http_status || null, traversal_policy: root.traversal_policy });
      scoutFailures.push({ url, stage: `${root.id.toUpperCase()}_ROOT_CHAIN`, error: fetched.error, http_status: fetched.http_status || null });
    }
  }
}
function enqueueUrl(queue, queued, url, rootHost) { const normalized = normalizeCandidateForManifest(url, rootHost); if (!normalized || queued.has(normalized.canonical_url_key)) return; queued.add(normalized.canonical_url_key); queue.push(normalized.fetch_url); }
function candidateMatchesRoot(value, root, rootHost) { const normalized = normalizeCandidateForManifest(value, rootHost); if (!normalized) return false; const path = normalizePath(new URL(normalized.fetch_url).pathname); return (root.paths || []).some((prefix) => prefix !== "/" && (path === prefix || path.startsWith(`${prefix}/`))) || (root.id === "homepage_landing" && path === "/"); }
function adapterDiscovery(discoveredBy = []) { const adapter = (discoveredBy || []).some((item) => String(item || "").includes("EXPAND_ONLY_ADAPTER")); return { adapter_discovered: adapter, adapter_id: null, adapter_effect: adapter ? "EXPAND_ONLY" : "NONE", may_narrow_discovery: false, may_exclude_sources: false }; }
function addScopedAnchors(candidates, rejectedCandidates, html, rootUrl, rootHost) { const chunks = [...extractTagChunks(html, "header").map((chunk) => ({ chunk, by: "HEADER" })), ...extractTagChunks(html, "footer").map((chunk) => ({ chunk, by: "FOOTER" })), { chunk: html, by: "ROOT" }]; for (const scoped of chunks) for (const href of extractHrefs(scoped.chunk)) addCandidate(candidates, rejectedCandidates, normalizeCandidateUrl(href, rootUrl, rootHost), scoped.by, rootHost); }
function addLinkedSitemaps(candidates, rejectedCandidates, html, rootUrl, rootHost) { for (const href of extractLinkedSitemaps(html)) addCandidate(candidates, rejectedCandidates, normalizeCandidateUrl(href, rootUrl, rootHost), "SITEMAP_LINK", rootHost); }
async function scoutSitemaps({ candidates, rejectedCandidates, scoutFailures, discoveryLog, rootUrl, rootHost, rootHtml }) { const origin = new URL(rootUrl).origin; const sitemapUrls = new Set([`${origin}/sitemap.xml`, `${origin}/sitemap-index.xml`]); for (const href of extractLinkedSitemaps(rootHtml)) { const url = normalizeCandidateUrl(href, rootUrl, rootHost); if (url) sitemapUrls.add(url); } const robots = await safeFetchRaw(`${origin}/robots.txt`); if (robots.ok) for (const line of robots.raw_text.split(/\r?\n/)) { const match = line.match(/^\s*sitemap:\s*(\S+)/i); if (match?.[1]) sitemapUrls.add(match[1].trim()); } const visited = new Set(); const queue = [...sitemapUrls]; while (queue.length && visited.size < 20) { const sitemapUrl = queue.shift(); if (!sitemapUrl || visited.has(sitemapUrl)) continue; visited.add(sitemapUrl); const fetched = await safeFetchRaw(sitemapUrl); if (!fetched.ok) { discoveryLog.push({ step: "SITEMAP_FETCH", status: "FAIL", url: sitemapUrl, error: fetched.error }); scoutFailures.push({ url: sitemapUrl, stage: "SITEMAP", error: fetched.error }); continue; } discoveryLog.push({ step: "SITEMAP_FETCH", status: "PASS", url: sitemapUrl }); for (const loc of extractSitemapLocs(fetched.raw_text).slice(0, 500)) { const url = normalizeCandidateUrl(loc, rootUrl, rootHost); if (!url) continue; if (url.endsWith(".xml") && visited.size < 20) queue.push(url); else addCandidate(candidates, rejectedCandidates, url, "SITEMAP"); } } }
async function scoutKnownPaths({ candidates, rejectedCandidates, scoutFailures, discoveryLog, rootUrl, rootHost, paths, probeClass }) { const origin = new URL(rootUrl).origin; for (const path of paths) { const url = new URL(path, origin).toString(); const fetched = await safeFetchRaw(url); if (fetched.ok) { discoveryLog.push({ step: `${probeClass}_PATH_PROBE`, status: "PASS", url }); addCandidate(candidates, rejectedCandidates, url, `${probeClass}_PATH_PROBE`, rootHost); } else if (![404, 410].includes(Number(fetched.http_status || 0))) { discoveryLog.push({ step: `${probeClass}_PATH_PROBE`, status: "LIMITED", url, error: fetched.error, http_status: fetched.http_status || null }); scoutFailures.push({ url, stage: `${probeClass}_PATH_PROBE`, error: fetched.error, http_status: fetched.http_status || null }); } } }
function addCandidate(candidates, rejectedCandidates, url, routeFoundBy, rootHost) { if (!url) return; const normalized = normalizeCandidateForManifest(url, rootHost); if (!normalized) return; const host = new URL(normalized.fetch_url).hostname; if (isSocialHost(host)) { rejectedCandidates.push({ url, route_found_by: routeFoundBy, rejection_reason: "external_social_host" }); return; } const existing = candidates.get(normalized.canonical_url_key); if (existing) { existing.discovered_by = unique([...existing.discovered_by, routeFoundBy]); existing.url_variants = unique([...existing.url_variants, normalized.original_url]); existing.priority_route_found_by = chooseBetterDiscovery(existing.priority_route_found_by, routeFoundBy); return; } candidates.set(normalized.canonical_url_key, { canonical_url: normalized.canonical_url, canonical_url_key: normalized.canonical_url_key, preferred_fetch_url: normalized.fetch_url, discovered_by: [routeFoundBy], priority_route_found_by: routeFoundBy, url_variants: [normalized.original_url] }); }
function matchAny(path, roots) { return roots.some((root) => path === root || path.startsWith(`${root}/`)); }
function pathDepth(path) { return String(path || "/").split("/").filter(Boolean).length; }
function isAppHost(host) { return /^(app|dashboard|console|account|login)\./i.test(host); }
function isBlogPath(path) { return /^\/(blog|blogs|news|press|resources)($|\/)/i.test(path); }
function isDocsApiOrIntegrationPath(path) { return /\/(docs|developer|developers|api|apis|api-reference|integrations|connectors|webhooks|authentication|permissions|audit-logs)/i.test(path); }
function hasDataFlowSignal(path) { return DATA_FLOW_SIGNALS.some((signal) => path.toLowerCase().includes(signal)); }
function regulatedTokenPresent(path) { return /(credit|loan|lend|health|clinical|hiring|recruit|legal|biometric|kyc|aml|children|minor|student|payment|pay|banking|bank|deposit|savings|underwriting|medical|patient|upi|wallet|remittance|transfer|payout|settlement|card|debit|bnpl|installment|emi|mortgage|insurance|broking|mutual-fund|securities|trading|forex|crypto|fee|charge|interest-rate|apr|mitc|kfs|grievance|ombudsman|licen|nbfc|escrow|nodal|custody)/i.test(path); }
function isSdkPath(path) { return /\/(sdk|sdks|client|clients)($|\/)/i.test(path); }
function isLanguageVariant(segments) { return segments.some((segment) => LANGUAGE_SEGMENTS.has(segment.toLowerCase()) || /^[a-z]{2}-[a-z]{2}$/i.test(segment)); }
function sortCandidates(a, b) { return priority(a.priority_route_found_by) - priority(b.priority_route_found_by) || a.canonical_url.localeCompare(b.canonical_url); }
function priority(routeFoundBy) { const value = String(routeFoundBy || ""); if (value.endsWith("_ROOT_CHAIN")) return 5; return { ROOT: 1, HEADER: 2, FOOTER: 3, SITEMAP: 4, SITEMAP_LINK: 4, LEGAL_DOC_PATH_PROBE: 5, EXPAND_ONLY_ADAPTER_PATH_PROBE: 6 }[value] || 9; }
function chooseBetterDiscovery(a, b) { return priority(b) < priority(a) ? b : a; }
function unique(values) { return [...new Set(values.filter(Boolean))]; }
function stripWww(hostname) { return String(hostname || "").replace(/^www\./i, "").toLowerCase(); }
function normalizePath(pathname) { return String(pathname || "/").replace(/\/+$/g, "").toLowerCase() || "/"; }
function normalizeRootUrl(value) { const raw = String(value || "").trim(); const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`; const url = new URL(withProtocol); url.hash = ""; if (!url.pathname || url.pathname === "/") url.pathname = "/"; return url.toString(); }
function normalizeCandidateUrl(value, baseUrl, rootHost) { try { const url = new URL(String(value || "").trim(), baseUrl); if (!["http:", "https:"].includes(url.protocol)) return ""; const host = stripWww(url.hostname); if (!(host === rootHost || host.endsWith(`.${rootHost}`))) return ""; url.hash = ""; return url.toString(); } catch { return ""; } }
function normalizeCandidateForManifest(value, rootHost) { try { const url = new URL(value); url.hash = ""; url.search = ""; const host = stripWww(url.hostname); if (!(host === rootHost || host.endsWith(`.${rootHost}`))) return null; const path = normalizePath(url.pathname); const canonicalUrl = `${url.protocol}//${host}${path}`; return { original_url: value, fetch_url: url.toString(), canonical_url: canonicalUrl, canonical_url_key: canonicalUrl }; } catch { return null; } }
function isSocialHost(hostname) { const host = String(hostname || "").toLowerCase(); return SOCIAL_HOST_PARTS.some((part) => host === part || host.endsWith(`.${part}`)); }
function extractTagChunks(html, tag) { const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`, "gi"); return [...String(html || "").matchAll(regex)].map((match) => match[1] || ""); }
function extractHrefs(html) { const out = []; const regex = /<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/gi; for (const match of String(html || "").matchAll(regex)) out.push(match[1]); return out; }
function extractLinkedSitemaps(html) { const out = []; const regex = /<link\b[^>]*rel=["'][^"']*sitemap[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>/gi; for (const match of String(html || "").matchAll(regex)) out.push(match[1]); return out; }
function extractSitemapLocs(xml) { const out = []; const regex = /<loc>\s*([^<]+?)\s*<\/loc>/gi; for (const match of String(xml || "").matchAll(regex)) out.push(match[1].trim()); return out; }
async function safeFetchRaw(url) { try { const fetched = await fetchRaw(url); return { ok: true, ...fetched }; } catch (error) { return { ok: false, url, error: error?.message || String(error), http_status: error?.http_status || null }; } }
async function fetchRaw(url) { const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), config.sourceFetchTimeoutMs); try { const response = await fetch(url, { method: "GET", signal: controller.signal, redirect: "follow", headers: { "user-agent": "LexNovaHQ-DiligenceReviewer/1.0 (+phase1-agnostic-source-discovery)", "accept": "text/markdown,text/plain,text/html,application/xhtml+xml,application/json,application/xml,text/xml,*/*;q=0.5" } }); const contentType = response.headers.get("content-type") || ""; const rawText = await response.text(); if (!response.ok) { const error = new Error(`HTTP_${response.status}`); error.http_status = response.status; throw error; } return { http_status: response.status, content_type: contentType, final_url: response.url, raw_text: rawText, extraction_warnings: buildWarnings(contentType, rawText) }; } catch (error) { if (error?.name === "AbortError") throw new Error("FETCH_TIMEOUT"); throw error; } finally { clearTimeout(timeout); } }
function buildWarnings(contentType, text) { const warnings = []; const lower = String(contentType || "").toLowerCase(); if (lower.includes("pdf")) warnings.push("PDF_FETCHED_AS_TEXT_NOT_PARSED"); if (String(text || "").length > 900000) warnings.push("LARGE_SOURCE_TEXT"); return warnings; }
