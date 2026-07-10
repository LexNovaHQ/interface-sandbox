import {
  P2B_DOMAIN_ACTIVITY_ARTIFACTS,
  P2B_DOMAIN_ACTIVITY_ROOT_INPUTS,
  P2B_DOMAIN_ACTIVITY_ROUTE_FAMILIES
} from "../domain-activity-source-index.contract.js";

export const DOMAIN_ACTIVITY_DETERMINISTIC_ARTIFACT_NAME = P2B_DOMAIN_ACTIVITY_ARTIFACTS.deterministicMap;

const DOMAIN_ACTIVITY_ROOT_ARTIFACTS = Object.freeze([...P2B_DOMAIN_ACTIVITY_ROOT_INPUTS]);
const ROOT_PRIMARY_HINTS = toCommonRoots(P2B_DOMAIN_ACTIVITY_ROUTE_FAMILIES.primaryDomain.source_roots);
const ROOT_AI_HINTS = toCommonRoots(P2B_DOMAIN_ACTIVITY_ROUTE_FAMILIES.aiOverlay.source_roots);
const ROOT_REGULATORY_HINTS = toCommonRoots(P2B_DOMAIN_ACTIVITY_ROUTE_FAMILIES.regulatoryOverlay.source_roots);
const ROOT_FUSION_HINTS = toCommonRoots(P2B_DOMAIN_ACTIVITY_ROUTE_FAMILIES.fusionCandidate.source_roots);
const ROOT_ACTIVITY_HINTS = Object.freeze(["product_service", "platform_feature_solution", "technical_docs_api", "docs_api_data_flow", "integrations_ecosystem", "use_case_customer_industry"]);
const ROOT_COMMERCIAL_HINTS = Object.freeze(["pricing_commercial_availability", "product_service", "homepage_landing"]);
const ROOT_TECHNICAL_HINTS = Object.freeze(["technical_docs_api", "docs_api_data_flow", "platform_feature_solution", "product_service"]);
const ROOT_INTEGRATION_HINTS = Object.freeze(["integrations_ecosystem", "technical_docs_api", "platform_feature_solution"]);
const ROOT_USE_CASE_HINTS = Object.freeze(["use_case_customer_industry", "homepage_landing", "product_service", "pricing_commercial_availability"]);

const LOCATOR_PATTERNS = Object.freeze({
  PRIMARY_DOMAIN_ROUTE: Object.freeze([/\bplatform\b/i, /\bproduct\b/i, /\bsolution\b/i, /\bservice\b/i, /\bapi\b/i, /\bdeveloper\b/i, /\bfintech\b/i, /\bpayments?\b/i, /\blending\b/i, /\bbanking\b/i, /\binsurance\b/i, /\bhealth\s?tech\b/i, /\bhr\s?tech\b/i, /\bed\s?tech\b/i, /\bsecurity\b/i, /\bworkflow\b/i]),
  AI_OVERLAY_ROUTE: Object.freeze([/\bai\b/i, /\bartificial intelligence\b/i, /\bmachine learning\b/i, /\bml\b/i, /\bmodel\b/i, /\bllm\b/i, /\bgenerative\b/i, /\bagent(?:ic)?\b/i, /\bautomated\b/i, /\bautomation\b/i, /\bpredict(?:ion|ive)\b/i, /\bclassif(?:y|ication)\b/i, /\brecommend(?:ation)?\b/i, /\bocr\b/i, /\bmodel card\b/i, /\bresponsible ai\b/i, /\bai safety\b/i, /\bevaluation\b/i, /\btransparency\b/i]),
  REGULATORY_OVERLAY_ROUTE: Object.freeze([/\bregulat(?:ed|ory|ion)\b/i, /\blicen[cs](?:e|ed|ing)\b/i, /\bauthori[sz](?:ed|ation)\b/i, /\bregistered\b/i, /\bdisclosure\b/i, /\bbank partner\b/i, /\bsponsor bank\b/i, /\bnbfc\b/i, /\brbi\b/i, /\bsebi\b/i, /\bfca\b/i, /\bkyc\b/i, /\baml\b/i, /\bconsumer\b/i, /\bgrievance\b/i, /\bcomplaint\b/i, /\bnodal\b/i, /\bombudsman\b/i]),
  FUSION_CANDIDATE_ROUTE: Object.freeze([/\bai\b/i, /\bmodel\b/i, /\bapi\b/i, /\bplatform\b/i, /\bfinancial\b/i, /\bpayments?\b/i, /\blending\b/i, /\bbanking\b/i, /\bregulated\b/i, /\bworkflow\b/i, /\bautomation\b/i, /\bdata flow\b/i]),
  ACTIVITY_CAPABILITY_ROUTE: Object.freeze([/\banaly[sz]e\b/i, /\bgenerate\b/i, /\bcreate\b/i, /\bscore\b/i, /\bmonitor\b/i, /\bdetect\b/i, /\bsearch\b/i, /\brank\b/i, /\bverify\b/i, /\bprocess\b/i, /\broute\b/i, /\borchestrate\b/i, /\bintegrate\b/i, /\bupload\b/i, /\bextract\b/i]),
  COMMERCIAL_AVAILABILITY_ROUTE: Object.freeze([/\bpricing\b/i, /\bplans?\b/i, /\benterprise\b/i, /\bcontact sales\b/i, /\btrial\b/i, /\bfreemium\b/i, /\bbeta\b/i, /\bpilot\b/i, /\bavailable\b/i, /\bsubscription\b/i, /\bquote\b/i]),
  TECHNICAL_CAPABILITY_ROUTE: Object.freeze([/\bapi\b/i, /\bsdk\b/i, /\bdeveloper\b/i, /\bdocs?\b/i, /\bwebhook\b/i, /\bintegration\b/i, /\bdata flow\b/i, /\bendpoint\b/i, /\bauthentication\b/i, /\barchitecture\b/i, /\bworkflow\b/i]),
  INTEGRATION_ECOSYSTEM_ROUTE: Object.freeze([/\bintegration\b/i, /\bpartner\b/i, /\bmarketplace\b/i, /\bapp(?:s)?\b/i, /\bconnector\b/i, /\bplugin\b/i, /\bslack\b/i, /\bsalesforce\b/i, /\bgithub\b/i, /\bzapier\b/i]),
  USE_CASE_CUSTOMER_INDUSTRY_ROUTE: Object.freeze([/\buse case\b/i, /\bcustomer\b/i, /\bindustry\b/i, /\bteams?\b/i, /\benterprise\b/i, /\bdevelopers?\b/i, /\bconsumer\b/i, /\bmerchant\b/i, /\bborrower\b/i, /\bfinance\b/i, /\bhealth\b/i, /\beducation\b/i])
});

const ROUTE_META = Object.freeze({
  PRIMARY_DOMAIN_ROUTE: { key: "primary_domain_locator_map", routeCode: "PRIMARY_DOMAIN", signalFamilies: ["PRIMARY_DOMAIN_SIGNAL"], priority: "P0" },
  AI_OVERLAY_ROUTE: { key: "ai_overlay_locator_map", routeCode: "AI_OVERLAY", signalFamilies: ["AI_OVERLAY_SIGNAL"], priority: "P0" },
  REGULATORY_OVERLAY_ROUTE: { key: "regulatory_overlay_locator_map", routeCode: "REGULATORY_OVERLAY", signalFamilies: ["REGULATORY_OVERLAY_SIGNAL"], priority: "P0" },
  FUSION_CANDIDATE_ROUTE: { key: "fusion_candidate_locator_map", routeCode: "FUSION_CANDIDATE", signalFamilies: ["FUSION_CANDIDATE_SIGNAL"], priority: "P1" },
  ACTIVITY_CAPABILITY_ROUTE: { key: "activity_capability_locator_map", routeCode: "ACTIVITY_CAPABILITY", signalFamilies: ["ACTIVITY_CAPABILITY_SIGNAL"], priority: "P1" },
  COMMERCIAL_AVAILABILITY_ROUTE: { key: "commercial_availability_locator_map", routeCode: "COMMERCIAL_AVAILABILITY", signalFamilies: ["COMMERCIAL_AVAILABILITY_SIGNAL"], priority: "P1" },
  TECHNICAL_CAPABILITY_ROUTE: { key: "technical_capability_locator_map", routeCode: "TECHNICAL_CAPABILITY", signalFamilies: ["TECHNICAL_CAPABILITY_SIGNAL"], priority: "P1" },
  INTEGRATION_ECOSYSTEM_ROUTE: { key: "integration_ecosystem_locator_map", routeCode: "INTEGRATION_ECOSYSTEM", signalFamilies: ["INTEGRATION_ECOSYSTEM_SIGNAL"], priority: "P2" },
  USE_CASE_CUSTOMER_INDUSTRY_ROUTE: { key: "use_case_customer_industry_locator_map", routeCode: "USE_CASE_CUSTOMER_INDUSTRY", signalFamilies: ["USE_CASE_CUSTOMER_INDUSTRY_SIGNAL"], priority: "P1" }
});

export function buildDomainActivityDeterministicMap({ run = {}, artifacts = {} } = {}) {
  const runId = run.run_id || findRunId(artifacts) || "UNKNOWN_RUN";
  const targetUrl = run.target_url || run.root_url || readString(unwrapArtifact(artifacts.source_discovery_handoff), "target_url") || "";
  const sourceArtifactsRead = [];
  const coverageIndex = [];
  const structureIndex = [];
  const semanticQueue = [];
  const qualityRepairQueue = [];
  const missingLimited = [];
  const locatorBuckets = Object.fromEntries(Object.values(ROUTE_META).map((meta) => [meta.key, []]));

  const collected = collectDomainActivitySources(artifacts);
  sourceArtifactsRead.push(...collected.routes);
  missingLimited.push(...collected.gaps);

  for (const source of collected.sources) ingestDomainActivitySource({ source, coverageIndex, structureIndex, locatorBuckets, semanticQueue, qualityRepairQueue });

  const finalMap = {
    run_id: runId,
    target_url: targetUrl,
    generated_by: "phase2b_domain_activity_deterministic_layer",
    schema_version: "P2B_DOMAIN_ACTIVITY_DETERMINISTIC_MAP_v2_PHASE1_V5_12_ROOT_STRICT_FUSION",
    model_used: false,
    artifact_role: "Navigation-only deterministic map for 3B Domain Derivation over scoped Phase 1 v5 domain/activity/AI/regulatory roots.",
    source_text_policy: {
      source_artifacts_remain_source_of_truth: true,
      full_text_copied_into_map: false,
      excerpts_copied_into_map: false,
      summaries_generated: false,
      downstream_must_use_navigation_pointers_to_read_source_text: true
    },
    source_artifacts_read: dedupeRows(sourceArtifactsRead, (row) => row.artifact_name),
    domain_activity_source_coverage_index: dedupeRows(coverageIndex, (row) => row.coverage_id),
    domain_activity_document_structure_index: dedupeRows(structureIndex, (row) => row.unit_id),
    primary_domain_locator_map: dedupeRows(locatorBuckets.primary_domain_locator_map, (row) => row.locator_id),
    ai_overlay_locator_map: dedupeRows(locatorBuckets.ai_overlay_locator_map, (row) => row.locator_id),
    regulatory_overlay_locator_map: dedupeRows(locatorBuckets.regulatory_overlay_locator_map, (row) => row.locator_id),
    fusion_candidate_locator_map: dedupeRows(locatorBuckets.fusion_candidate_locator_map, (row) => row.locator_id),
    activity_capability_locator_map: dedupeRows(locatorBuckets.activity_capability_locator_map, (row) => row.locator_id),
    commercial_availability_locator_map: dedupeRows(locatorBuckets.commercial_availability_locator_map, (row) => row.locator_id),
    technical_capability_locator_map: dedupeRows(locatorBuckets.technical_capability_locator_map, (row) => row.locator_id),
    integration_ecosystem_locator_map: dedupeRows(locatorBuckets.integration_ecosystem_locator_map, (row) => row.locator_id),
    use_case_customer_industry_locator_map: dedupeRows(locatorBuckets.use_case_customer_industry_locator_map, (row) => row.locator_id),
    missing_limited_domain_activity_source_map: dedupeRows(missingLimited, (row) => row.missing_id),
    semantic_label_queue: dedupeRows(semanticQueue, (row) => row.queue_id),
    quality_repair_queue: dedupeRows(qualityRepairQueue, (row) => `${row.repair_type}:${row.source_artifact}:${row.source_id}`),
    downstream_rules: {
      phase_2b_is_index_only: true,
      activity_profile_source_index_owned_by_2b: true,
      domain_activity_deterministic_map_is_navigation_only: true,
      domain_derivation_layer_derives_values_later: true,
      primary_domain_derivation_forbidden_in_2b: true,
      ai_overlay_derivation_forbidden_in_2b: true,
      regulatory_overlay_derivation_forbidden_in_2b: true,
      fusion_candidate_requires_composite_signal: true,
      fusion_lock_forbidden_in_2b: true,
      source_artifacts_remain_source_of_truth: true,
      full_text_copied: false,
      summaries_allowed: false,
      excerpts_allowed: false,
      legal_or_compliance_conclusions_allowed: false,
      legal_cartography_reserved_for_2e: true,
      data_privacy_navigation_reserved_for_dpni: true,
      phase1_v5_12_root_source_contract_required: true,
      old_family_input_contract_forbidden: true
    },
    lock_status: resolveStatus({ coverageIndex, missingLimited, qualityRepairQueue })
  };

  return { [DOMAIN_ACTIVITY_DETERMINISTIC_ARTIFACT_NAME]: keepDeterministicShape(finalMap) };
}

function collectDomainActivitySources(artifacts = {}) {
  const sources = [];
  const routes = [];
  const gaps = [];
  for (const artifactName of DOMAIN_ACTIVITY_ROOT_ARTIFACTS) {
    const artifact = unwrapArtifact(artifacts[artifactName]);
    const commonRoot = normalizeCommonRoot(artifactName);
    const rows = collectSourcesFromArtifact({ artifactName, artifact, commonRoot });
    routes.push(routeSummary({ artifactName, artifact, commonRoot, sourceCount: rows.length }));
    if (!rows.length) gaps.push(missingRow({ artifactName, commonRoot, reason: "No material source rows available for this Phase 1 v5 domain/activity root." }));
    sources.push(...rows);
  }
  return { sources: dedupeRows(sources, (row) => `${row.source_artifact}:${row.source_id}`), routes, gaps };
}

function ingestDomainActivitySource({ source, coverageIndex, structureIndex, locatorBuckets, semanticQueue, qualityRepairQueue }) {
  const text = String(source.lossless_text || "");
  const sourceArtifact = source.source_artifact;
  const sourceRoot = normalizeCommonRoot(source.common_root || sourceArtifact);
  const sourceId = source.source_id;
  const sourceUrl = source.canonical_url || source.final_url || source.url || "";
  const pointer = pointerForSource({ ...source, common_root: sourceRoot });
  const documentId = makeStableId(`${sourceArtifact}:${sourceId}`);
  const title = firstHeading(text) || source.title || source.page_title || titleFromUrl(sourceUrl) || sourceArtifact;
  const normalizedSource = { ...source, common_root: sourceRoot };

  coverageIndex.push({
    coverage_id: `P2B.COV.${documentId}`,
    source_artifact: sourceArtifact,
    source_id: sourceId,
    common_root: sourceRoot,
    source_url: sourceUrl,
    source_class: "domain_activity_common_root",
    source_corpus_status: text ? "FOUND_AS_PRIMARY_SOURCE" : "FOUND_THIN",
    status: text ? "FOUND_INDEXED" : "FOUND_THIN",
    root_route_scope: routeScopeForRoot(sourceRoot),
    lossless_text_pointer: pointer,
    phase_1_classification_effect: source.phase_1_classification_effect || "SOURCE_ROUTING_ONLY_NOT_JOB_ROUTING",
    limitation: text ? "" : "Source row has no lossless_text available."
  });

  if (!text) qualityRepairQueue.push({ repair_type: "MISSING_LOSSLESS_TEXT", source_artifact: sourceArtifact, source_id: sourceId, reason: "Source row exists but lossless_text is empty." });

  const units = buildStructureUnits({ text, title, source: normalizedSource, documentId, pointer });
  for (const unit of units) {
    structureIndex.push(unit);
    addDomainActivityLocators({ unit, source: normalizedSource, locatorBuckets, semanticQueue });
  }
}

function addDomainActivityLocators({ unit, source, locatorBuckets, semanticQueue }) {
  const unitText = textForRange(source.lossless_text, unit.char_range);
  const commonRoot = normalizeCommonRoot(source.common_root);
  const text = `${unit.heading_path.join(" ")} ${unitText} ${source.url} ${commonRoot}`;
  const matched = new Set();
  for (const [routeClass, patterns] of Object.entries(LOCATOR_PATTERNS)) {
    if (routeClass === "FUSION_CANDIDATE_ROUTE") continue;
    const meta = ROUTE_META[routeClass];
    if (!meta || !patterns.some((pattern) => pattern.test(text))) continue;
    if (!rootSupportsRoute(commonRoot, routeClass)) continue;
    const locator = locatorRow({ unit, source, routeClass, meta });
    locatorBuckets[meta.key].push(locator);
    semanticQueue.push(semanticQueueRow({ locator, unit, source, meta }));
    matched.add(routeClass);
  }
  addFusionIfComposite({ unit, source, locatorBuckets, semanticQueue, text, matchedRouteClasses: matched });
}

function addFusionIfComposite({ unit, source, locatorBuckets, semanticQueue, text, matchedRouteClasses }) {
  const commonRoot = normalizeCommonRoot(source.common_root);
  if (!ROOT_FUSION_HINTS.includes(commonRoot)) return;
  const aiHit = matchedRouteClasses.has("AI_OVERLAY_ROUTE") || LOCATOR_PATTERNS.AI_OVERLAY_ROUTE.some((pattern) => pattern.test(text));
  const regHit = matchedRouteClasses.has("REGULATORY_OVERLAY_ROUTE") || LOCATOR_PATTERNS.REGULATORY_OVERLAY_ROUTE.some((pattern) => pattern.test(text));
  const activityHit = matchedRouteClasses.has("ACTIVITY_CAPABILITY_ROUTE") || matchedRouteClasses.has("TECHNICAL_CAPABILITY_ROUTE");
  const commercialHit = matchedRouteClasses.has("COMMERCIAL_AVAILABILITY_ROUTE");
  const primaryHit = matchedRouteClasses.has("PRIMARY_DOMAIN_ROUTE");
  const compositeSignalCount = [aiHit, regHit, activityHit, commercialHit, primaryHit].filter(Boolean).length;
  if (!(aiHit && compositeSignalCount >= 2)) return;
  const meta = ROUTE_META.FUSION_CANDIDATE_ROUTE;
  const locator = locatorRow({
    unit,
    source,
    routeClass: "FUSION_CANDIDATE_ROUTE",
    meta,
    fusion_basis: {
      ai_signal_visible: aiHit,
      regulatory_signal_visible: regHit,
      activity_signal_visible: activityHit,
      commercial_signal_visible: commercialHit,
      primary_domain_signal_visible: primaryHit,
      composite_signal_count: compositeSignalCount
    }
  });
  locatorBuckets[meta.key].push(locator);
  semanticQueue.push(semanticQueueRow({ locator, unit, source, meta }));
}

function locatorRow({ unit, source, routeClass, meta, fusion_basis = null }) {
  return stripEmpty({
    locator_id: `P2B.LOC.${makeStableId(`${routeClass}:${unit.unit_id}`)}`,
    unit_id: unit.unit_id,
    route_class: routeClass,
    route_code: meta.routeCode,
    source_artifact: source.source_artifact,
    source_id: source.source_id,
    common_root: normalizeCommonRoot(source.common_root),
    source_url: source.canonical_url || source.final_url || source.url || "",
    navigation_pointer: unit.navigation_pointer,
    priority: meta.priority,
    downstream_owner: "P3_DOMAIN_DERIVATION_LAYER",
    phase_2b_action: "LOCATE_ONLY",
    derived_value_emitted: false,
    source_text_copied: false,
    fusion_basis,
    limitation: "Locator only. 3B must read scoped source evidence and apply the domain derivation registry before deriving any domain, AI overlay, regulatory overlay, or fusion result."
  });
}

function semanticQueueRow({ locator, unit, source, meta }) {
  return {
    queue_id: `P2B.SEM.${makeStableId(locator.locator_id)}`,
    unit_id: unit.unit_id,
    source_artifact: source.source_artifact,
    source_id: source.source_id,
    common_root: normalizeCommonRoot(source.common_root),
    route_class: locator.route_class,
    route_code: locator.route_code,
    route_signal_families: meta.signalFamilies,
    priority: meta.priority,
    semantic_label_required: ["P0", "P1"].includes(meta.priority),
    navigation_pointer: unit.navigation_pointer,
    source_text_copied: false,
    limitation: "Semantic layer may label route relevance only. It must not derive or lock domain, AI overlay, regulatory overlay, fusion, package selection, or legal/compliance conclusions."
  };
}

function rootSupportsRoute(commonRootRaw, routeClass) {
  const commonRoot = normalizeCommonRoot(commonRootRaw);
  if (routeClass === "PRIMARY_DOMAIN_ROUTE") return ROOT_PRIMARY_HINTS.includes(commonRoot);
  if (routeClass === "AI_OVERLAY_ROUTE") return ROOT_AI_HINTS.includes(commonRoot);
  if (routeClass === "REGULATORY_OVERLAY_ROUTE") return ROOT_REGULATORY_HINTS.includes(commonRoot);
  if (routeClass === "FUSION_CANDIDATE_ROUTE") return ROOT_FUSION_HINTS.includes(commonRoot);
  if (routeClass === "ACTIVITY_CAPABILITY_ROUTE") return ROOT_ACTIVITY_HINTS.includes(commonRoot);
  if (routeClass === "COMMERCIAL_AVAILABILITY_ROUTE") return ROOT_COMMERCIAL_HINTS.includes(commonRoot);
  if (routeClass === "TECHNICAL_CAPABILITY_ROUTE") return ROOT_TECHNICAL_HINTS.includes(commonRoot);
  if (routeClass === "INTEGRATION_ECOSYSTEM_ROUTE") return ROOT_INTEGRATION_HINTS.includes(commonRoot);
  if (routeClass === "USE_CASE_CUSTOMER_INDUSTRY_ROUTE") return ROOT_USE_CASE_HINTS.includes(commonRoot);
  return false;
}

function routeScopeForRoot(commonRootRaw) {
  const commonRoot = normalizeCommonRoot(commonRootRaw);
  const scopes = [];
  if (ROOT_PRIMARY_HINTS.includes(commonRoot)) scopes.push("PRIMARY_DOMAIN");
  if (ROOT_AI_HINTS.includes(commonRoot)) scopes.push("AI_OVERLAY");
  if (ROOT_REGULATORY_HINTS.includes(commonRoot)) scopes.push("REGULATORY_OVERLAY");
  if (ROOT_FUSION_HINTS.includes(commonRoot)) scopes.push("FUSION_CANDIDATE");
  if (ROOT_ACTIVITY_HINTS.includes(commonRoot)) scopes.push("ACTIVITY_CAPABILITY");
  if (ROOT_COMMERCIAL_HINTS.includes(commonRoot)) scopes.push("COMMERCIAL_AVAILABILITY");
  if (ROOT_TECHNICAL_HINTS.includes(commonRoot)) scopes.push("TECHNICAL_CAPABILITY");
  if (ROOT_INTEGRATION_HINTS.includes(commonRoot)) scopes.push("INTEGRATION_ECOSYSTEM");
  if (ROOT_USE_CASE_HINTS.includes(commonRoot)) scopes.push("USE_CASE_CUSTOMER_INDUSTRY");
  return scopes;
}

function collectSourcesFromArtifact({ artifactName, artifact, commonRoot }) {
  if (!artifact) return [];
  const candidateArrays = [artifact.sources, artifact.source_rows, artifact.lossless_sources, artifact.root_sources, artifact.pages, artifact.documents, artifact.items, Array.isArray(artifact) ? artifact : null].filter(Array.isArray);
  const rows = candidateArrays.length ? candidateArrays.flat() : (hasText(artifact) ? [artifact] : []);
  return rows.map((row, index) => normalizeSourceRow({ row, index, artifactName, commonRoot })).filter(Boolean);
}

function normalizeSourceRow({ row, index, artifactName, commonRoot }) {
  if (!row || typeof row !== "object") return null;
  const lossless = String(row.lossless_text || row.clean_text || row.text || row.raw_text || row.markdown || row.body || row.content || "");
  const sourceId = String(row.source_id || row.id || row.url_id || row.page_id || `${artifactName}.${index + 1}`);
  const normalizedRoot = normalizeCommonRoot(row.common_root || commonRoot);
  return {
    ...row,
    source_artifact: artifactName,
    source_id: sourceId,
    common_root: normalizedRoot,
    canonical_url: row.canonical_url || row.final_url || row.url || row.href || "",
    url: row.url || row.canonical_url || row.final_url || row.href || "",
    lossless_text: lossless
  };
}

function buildStructureUnits({ text, title, source, documentId, pointer }) {
  if (!text) return [unitFor({ documentId, index: 1, heading: title, start: 0, end: 0, source, pointer, empty: true })];
  const units = [];
  const chunks = splitIntoChunks(text);
  let cursor = 0;
  for (const [index, chunk] of chunks.entries()) {
    const start = text.indexOf(chunk, cursor);
    const safeStart = start >= 0 ? start : cursor;
    const end = safeStart + chunk.length;
    cursor = end;
    units.push(unitFor({ documentId, index: index + 1, heading: firstHeading(chunk) || title, start: safeStart, end, source, pointer }));
  }
  return units.length ? units.slice(0, 80) : [unitFor({ documentId, index: 1, heading: title, start: 0, end: Math.min(text.length, 1200), source, pointer })];
}

function unitFor({ documentId, index, heading, start, end, source, pointer, empty = false }) {
  return {
    unit_id: `P2B.UNIT.${documentId}.${String(index).padStart(3, "0")}`,
    source_artifact: source.source_artifact,
    source_id: source.source_id,
    common_root: normalizeCommonRoot(source.common_root),
    heading_path: [heading || source.source_artifact],
    char_range: { start, end },
    navigation_pointer: { ...pointer, char_range: { start, end } },
    unit_status: empty ? "EMPTY_OR_THIN_SOURCE" : "INDEXABLE_UNIT"
  };
}

function pointerForSource(source) { return { artifact_name: source.source_artifact, source_id: source.source_id, common_root: normalizeCommonRoot(source.common_root), text_field: "lossless_text" }; }
function splitIntoChunks(text) { return String(text).split(/\n{2,}|(?=^#{1,4}\s+)/gm).map((chunk) => chunk.trim()).filter(Boolean).flatMap((chunk) => chunk.length > 2200 ? chunk.match(/[\s\S]{1,1800}(?:\s|$)/g).map((part) => part.trim()).filter(Boolean) : [chunk]); }
function textForRange(text, range = {}) { const source = String(text || ""); return source.slice(Number(range.start || 0), Number(range.end || 0)); }
function firstHeading(text) { const match = String(text || "").match(/^#{1,4}\s+(.+)$/m); return match ? match[1].trim().slice(0, 160) : ""; }
function titleFromUrl(url) { try { const parsed = new URL(url); return parsed.pathname.split("/").filter(Boolean).pop() || parsed.hostname; } catch { return ""; } }
function routeSummary({ artifactName, artifact, commonRoot, sourceCount }) { const normalizedRoot = normalizeCommonRoot(commonRoot); return { artifact_name: artifactName, common_root: normalizedRoot, present: Boolean(artifact), source_count: sourceCount, route_scope: routeScopeForRoot(normalizedRoot), access_rule: "READ_PHASE1_COMMON_ROOT_SOURCE_THROUGH_2B_INDEX" }; }
function missingRow({ artifactName, commonRoot, reason }) { return { missing_id: `P2B.MISS.${makeStableId(artifactName)}`, source_artifact: artifactName, common_root: normalizeCommonRoot(commonRoot), status: "SOURCE_NOT_PRESENT_OR_EMPTY", limitation: reason }; }
function resolveStatus({ coverageIndex, missingLimited, qualityRepairQueue }) { if (!coverageIndex.length) return "CONTROLLED_FAILURE"; if (missingLimited.length || qualityRepairQueue.length) return "LOCKED_WITH_LIMITATIONS"; return "LOCKED"; }
function keepDeterministicShape(value) { const keys = ["run_id", "target_url", "generated_by", "schema_version", "model_used", "artifact_role", "source_text_policy", "source_artifacts_read", "domain_activity_source_coverage_index", "domain_activity_document_structure_index", "primary_domain_locator_map", "ai_overlay_locator_map", "regulatory_overlay_locator_map", "fusion_candidate_locator_map", "activity_capability_locator_map", "commercial_availability_locator_map", "technical_capability_locator_map", "integration_ecosystem_locator_map", "use_case_customer_industry_locator_map", "missing_limited_domain_activity_source_map", "semantic_label_queue", "quality_repair_queue", "downstream_rules", "lock_status"]; return Object.fromEntries(keys.map((key) => [key, value[key] ?? []])); }
function unwrapArtifact(value) { if (!value || typeof value !== "object") return null; if (value.artifact && typeof value.artifact === "object") return value.artifact; if (value.data && typeof value.data === "object") return value.data; if (value.payload && typeof value.payload === "object") return value.payload; return value; }
function hasText(value) { return Boolean(value && typeof value === "object" && (value.lossless_text || value.clean_text || value.text || value.raw_text || value.markdown || value.body || value.content)); }
function readString(value, key) { return value && typeof value[key] === "string" ? value[key] : ""; }
function dedupeRows(rows, keyFn) { const seen = new Set(); const out = []; for (const row of rows) { const key = keyFn(row); if (seen.has(key)) continue; seen.add(key); out.push(row); } return out; }
function makeStableId(value) { let hash = 0; const text = String(value || ""); for (let i = 0; i < text.length; i += 1) hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0; return Math.abs(hash).toString(36).padStart(6, "0"); }
function findRunId(artifacts) { for (const value of Object.values(artifacts || {})) { const artifact = unwrapArtifact(value); if (artifact?.run_id) return artifact.run_id; } return ""; }
function stripEmpty(row) { return Object.fromEntries(Object.entries(row || {}).filter(([, value]) => value !== undefined && value !== null)); }
function normalizeCommonRoot(value) { return String(value || "").replace(/^lossless_root__/, ""); }
function toCommonRoots(values = []) { return Object.freeze([...values].map(normalizeCommonRoot)); }
