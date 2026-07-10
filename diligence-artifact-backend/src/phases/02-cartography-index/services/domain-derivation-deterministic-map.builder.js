import {
  P2B_DOMAIN_DERIVATION_ARTIFACTS,
  P2B_DOMAIN_DERIVATION_ROOT_INPUTS,
  P2B_DOMAIN_DERIVATION_ROUTE_FAMILIES
} from "../domain-derivation-source-index.contract.js";

export const DOMAIN_DERIVATION_DETERMINISTIC_ARTIFACT_NAME = P2B_DOMAIN_DERIVATION_ARTIFACTS.deterministicMap;

const ROOT_ARTIFACTS = Object.freeze([...P2B_DOMAIN_DERIVATION_ROOT_INPUTS]);
const ROOT_PRIMARY_HINTS = toCommonRoots(P2B_DOMAIN_DERIVATION_ROUTE_FAMILIES.primaryDomain.source_roots);
const ROOT_AI_HINTS = toCommonRoots(P2B_DOMAIN_DERIVATION_ROUTE_FAMILIES.aiOverlay.source_roots);
const ROOT_REGULATORY_HINTS = toCommonRoots(P2B_DOMAIN_DERIVATION_ROUTE_FAMILIES.regulatoryOverlay.source_roots);
const ROOT_FUSION_HINTS = toCommonRoots(P2B_DOMAIN_DERIVATION_ROUTE_FAMILIES.fusionCandidate.source_roots);
const ROOT_ACTIVITY_HINTS = Object.freeze(["product_service", "platform_feature_solution", "technical_docs_api", "docs_api_data_flow", "integrations_ecosystem", "use_case_customer_industry"]);
const ROOT_COMMERCIAL_HINTS = Object.freeze(["pricing_commercial_availability", "product_service", "homepage_landing"]);
const ROOT_TECHNICAL_HINTS = Object.freeze(["technical_docs_api", "docs_api_data_flow", "platform_feature_solution", "product_service"]);
const ROOT_INTEGRATION_HINTS = Object.freeze(["integrations_ecosystem", "technical_docs_api", "platform_feature_solution"]);
const ROOT_USE_CASE_HINTS = Object.freeze(["use_case_customer_industry", "homepage_landing", "product_service", "pricing_commercial_availability"]);

const LOCATOR_PATTERNS = Object.freeze({
  PRIMARY_DOMAIN_ROUTE: Object.freeze([/\bplatform\b/i, /\bproduct\b/i, /\bsolution\b/i, /\bservice\b/i, /\bapi\b/i, /\bdeveloper\b/i, /\bfintech\b/i, /\bpayments?\b/i, /\blending\b/i, /\bbanking\b/i, /\binsurance\b/i, /\bhealth\s?tech\b/i, /\bhr\s?tech\b/i, /\bed\s?tech\b/i, /\bsecurity\b/i, /\bworkflow\b/i]),
  AI_OVERLAY_ROUTE: Object.freeze([/\bai\b/i, /\bartificial intelligence\b/i, /\bmachine learning\b/i, /\bml\b/i, /\bmodel\b/i, /\bllm\b/i, /\bgenerative\b/i, /\bagent(?:ic)?\b/i, /\bautomated\b/i, /\bautomation\b/i, /\bpredict(?:ion|ive)\b/i, /\bclassif(?:y|ication)\b/i, /\brecommend(?:ation)?\b/i, /\bocr\b/i, /\bmodel card\b/i, /\bresponsible ai\b/i, /\bai safety\b/i, /\bevaluation\b/i, /\btransparency\b/i]),
  REGULATORY_OVERLAY_ROUTE: Object.freeze([/\bregulat(?:ed|ory|ion)\b/i, /\blicen[cs](?:e|ed|ing)\b/i, /\bauthori[sz](?:ed|ation)\b/i, /\bregistered\b/i, /\bdisclosure\b/i, /\bbank partner\b/i, /\bsponsor bank\b/i, /\bnbfc\b/i, /\brbi\b/i, /\bsebi\b/i, /\bfca\b/i, /\bkyc\b/i, /\baml\b/i, /\bconsumer\b/i, /\bgrievance\b/i, /\bcomplaint\b/i, /\bnodal\b/i, /\bombudsman\b/i]),
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

export function buildDomainDerivationDeterministicMap({ run = {}, artifacts = {} } = {}) {
  const runId = run.run_id || "UNKNOWN_RUN";
  const targetUrl = run.target_url || run.root_url || "";
  const sourceArtifactsRead = [];
  const coverageIndex = [];
  const structureIndex = [];
  const semanticQueue = [];
  const qualityRepairQueue = [];
  const missingLimited = [];
  const locatorBuckets = Object.fromEntries(Object.values(ROUTE_META).map((meta) => [meta.key, []]));

  const collected = collectDomainDerivationSources(artifacts);
  sourceArtifactsRead.push(...collected.routes);
  missingLimited.push(...collected.gaps);

  for (const source of collected.sources) ingestSource({ source, coverageIndex, structureIndex, locatorBuckets, semanticQueue, qualityRepairQueue });

  const finalMap = {
    run_id: runId,
    target_url: targetUrl,
    generated_by: "phase2b_domain_derivation_deterministic_layer",
    schema_version: "P2B_DOMAIN_DERIVATION_DETERMINISTIC_MAP_v1_PHASE1_V5_12_ROOT",
    model_used: false,
    artifact_role: "Navigation-only deterministic map for 3B Domain Derivation over scoped Phase 1 v5 primary-domain, AI-overlay, regulatory-overlay, and fusion-candidate roots.",
    source_text_policy: {
      source_artifacts_remain_source_of_truth: true,
      full_text_copied_into_map: false,
      excerpts_copied_into_map: false,
      summaries_generated: false,
      downstream_must_use_navigation_pointers_to_read_source_text: true
    },
    source_artifacts_read: dedupeRows(sourceArtifactsRead, (row) => row.artifact_name),
    domain_derivation_source_coverage_index: dedupeRows(coverageIndex, (row) => row.coverage_id),
    domain_derivation_document_structure_index: dedupeRows(structureIndex, (row) => row.unit_id),
    primary_domain_locator_map: dedupeRows(locatorBuckets.primary_domain_locator_map, (row) => row.locator_id),
    ai_overlay_locator_map: dedupeRows(locatorBuckets.ai_overlay_locator_map, (row) => row.locator_id),
    regulatory_overlay_locator_map: dedupeRows(locatorBuckets.regulatory_overlay_locator_map, (row) => row.locator_id),
    fusion_candidate_locator_map: dedupeRows(locatorBuckets.fusion_candidate_locator_map, (row) => row.locator_id),
    activity_capability_locator_map: dedupeRows(locatorBuckets.activity_capability_locator_map, (row) => row.locator_id),
    commercial_availability_locator_map: dedupeRows(locatorBuckets.commercial_availability_locator_map, (row) => row.locator_id),
    technical_capability_locator_map: dedupeRows(locatorBuckets.technical_capability_locator_map, (row) => row.locator_id),
    integration_ecosystem_locator_map: dedupeRows(locatorBuckets.integration_ecosystem_locator_map, (row) => row.locator_id),
    use_case_customer_industry_locator_map: dedupeRows(locatorBuckets.use_case_customer_industry_locator_map, (row) => row.locator_id),
    missing_limited_domain_derivation_source_map: dedupeRows(missingLimited, (row) => row.missing_id),
    semantic_label_queue: dedupeRows(semanticQueue, (row) => row.queue_id),
    quality_repair_queue: dedupeRows(qualityRepairQueue, (row) => `${row.repair_type}:${row.source_artifact}:${row.source_id}`),
    downstream_rules: {
      phase_2b_is_index_only: true,
      domain_derivation_source_index_owned_by_2b: true,
      activity_profile_source_index_reserved_for_2c_phase5: true,
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

  return { [DOMAIN_DERIVATION_DETERMINISTIC_ARTIFACT_NAME]: finalMap };
}

function collectDomainDerivationSources(artifacts = {}) {
  const sources = [];
  const routes = [];
  const gaps = [];
  for (const artifactName of ROOT_ARTIFACTS) {
    const artifact = unwrapArtifact(artifacts[artifactName]);
    const commonRoot = normalizeCommonRoot(artifactName);
    const rows = collectSourcesFromArtifact({ artifactName, artifact, commonRoot });
    routes.push(routeSummary({ artifactName, artifact, commonRoot, sourceCount: rows.length }));
    if (!rows.length) gaps.push(missingRow({ artifactName, commonRoot, reason: "No material source rows available for this Phase 1 v5 domain derivation root." }));
    sources.push(...rows);
  }
  return { sources: dedupeRows(sources, (row) => `${row.source_artifact}:${row.source_id}`), routes, gaps };
}

function ingestSource({ source, coverageIndex, structureIndex, locatorBuckets, semanticQueue, qualityRepairQueue }) {
  const text = String(source.lossless_text || source.text || "");
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
    source_class: "domain_derivation_common_root",
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
    addLocators({ unit, source: normalizedSource, locatorBuckets, semanticQueue });
  }
}

function addLocators({ unit, source, locatorBuckets, semanticQueue }) {
  const unitText = textForRange(source.lossless_text || source.text || "", unit.char_range);
  const commonRoot = normalizeCommonRoot(source.common_root);
  const text = `${unit.heading_path.join(" ")} ${unitText} ${source.url || ""} ${commonRoot}`;
  const matchedRoutes = [];

  for (const [routeClass, patterns] of Object.entries(LOCATOR_PATTERNS)) {
    if (routeClass === "FUSION_CANDIDATE_ROUTE") continue;
    if (!routeSupportedByRoot(routeClass, commonRoot)) continue;
    if (!patterns.some((pattern) => pattern.test(text))) continue;
    matchedRoutes.push(routeClass);
    addLocator({ routeClass, unit, source, locatorBuckets, matched_terms: matchedTerms(patterns, text), fusion_basis: null });
  }

  addFusionIfComposite({ unit, source, locatorBuckets, semanticQueue, text, matchedRoutes });
  for (const routeClass of matchedRoutes) enqueueSemantic({ routeClass, unit, source, semanticQueue });
}

function addFusionIfComposite({ unit, source, locatorBuckets, semanticQueue, text, matchedRoutes }) {
  if (!routeSupportedByRoot("FUSION_CANDIDATE_ROUTE", normalizeCommonRoot(source.common_root))) return;
  const hasAi = matchedRoutes.includes("AI_OVERLAY_ROUTE") || LOCATOR_PATTERNS.AI_OVERLAY_ROUTE.some((pattern) => pattern.test(text));
  const materialSignals = [
    matchedRoutes.includes("PRIMARY_DOMAIN_ROUTE") || LOCATOR_PATTERNS.PRIMARY_DOMAIN_ROUTE.some((pattern) => pattern.test(text)),
    matchedRoutes.includes("REGULATORY_OVERLAY_ROUTE") || LOCATOR_PATTERNS.REGULATORY_OVERLAY_ROUTE.some((pattern) => pattern.test(text)),
    matchedRoutes.includes("ACTIVITY_CAPABILITY_ROUTE") || LOCATOR_PATTERNS.ACTIVITY_CAPABILITY_ROUTE.some((pattern) => pattern.test(text)),
    matchedRoutes.includes("COMMERCIAL_AVAILABILITY_ROUTE") || LOCATOR_PATTERNS.COMMERCIAL_AVAILABILITY_ROUTE.some((pattern) => pattern.test(text))
  ].filter(Boolean).length;
  if (!hasAi || materialSignals < 1) return;
  const fusion_basis = { ai_signal_visible: true, composite_signal_count: 1 + materialSignals, rule: "AI_SIGNAL_PLUS_ONE_OR_MORE_PRIMARY_REGULATORY_ACTIVITY_OR_COMMERCIAL_SIGNAL" };
  addLocator({ routeClass: "FUSION_CANDIDATE_ROUTE", unit, source, locatorBuckets, matched_terms: ["composite_signal"], fusion_basis });
  enqueueSemantic({ routeClass: "FUSION_CANDIDATE_ROUTE", unit, source, semanticQueue });
}

function addLocator({ routeClass, unit, source, locatorBuckets, matched_terms, fusion_basis }) {
  const meta = ROUTE_META[routeClass];
  const locator = {
    locator_id: `P2B.LOC.${meta.routeCode}.${makeStableId(`${unit.unit_id}:${routeClass}`)}`,
    unit_id: unit.unit_id,
    source_artifact: source.source_artifact,
    source_id: source.source_id,
    common_root: normalizeCommonRoot(source.common_root),
    route_class: routeClass,
    route_code: meta.routeCode,
    route_signal_families: meta.signalFamilies,
    phase_2b_action: "LOCATE_ONLY",
    downstream_owner: "P3_DOMAIN_DERIVATION_LAYER",
    priority: meta.priority,
    source_url: source.canonical_url || source.final_url || source.url || "",
    heading_path: unit.heading_path,
    navigation_pointer: unit.lossless_text_pointer,
    matched_terms: [...new Set(matched_terms)].slice(0, 8),
    derived_value: null,
    conclusion_forbidden: true
  };
  if (fusion_basis) locator.fusion_basis = fusion_basis;
  locatorBuckets[meta.key].push(locator);
}

function enqueueSemantic({ routeClass, unit, source, semanticQueue }) {
  const meta = ROUTE_META[routeClass];
  semanticQueue.push({
    queue_id: `P2B.SEM.${makeStableId(`${unit.unit_id}:${routeClass}`)}`,
    unit_id: unit.unit_id,
    source_artifact: source.source_artifact,
    source_id: source.source_id,
    common_root: normalizeCommonRoot(source.common_root),
    route_class_hint: routeClass,
    route_signal_family_hint: meta.signalFamilies[0],
    priority: meta.priority,
    semantic_label_required: true,
    instruction: "Label route class, signal family, and confidence only. Do not derive primary domain, AI overlay, regulatory overlay, fusion lock, or package selection."
  });
}

function routeSupportedByRoot(routeClass, commonRoot) {
  const root = normalizeCommonRoot(commonRoot);
  if (routeClass === "PRIMARY_DOMAIN_ROUTE") return ROOT_PRIMARY_HINTS.includes(root);
  if (routeClass === "AI_OVERLAY_ROUTE") return ROOT_AI_HINTS.includes(root);
  if (routeClass === "REGULATORY_OVERLAY_ROUTE") return ROOT_REGULATORY_HINTS.includes(root);
  if (routeClass === "FUSION_CANDIDATE_ROUTE") return ROOT_FUSION_HINTS.includes(root);
  if (routeClass === "ACTIVITY_CAPABILITY_ROUTE") return ROOT_ACTIVITY_HINTS.includes(root);
  if (routeClass === "COMMERCIAL_AVAILABILITY_ROUTE") return ROOT_COMMERCIAL_HINTS.includes(root);
  if (routeClass === "TECHNICAL_CAPABILITY_ROUTE") return ROOT_TECHNICAL_HINTS.includes(root);
  if (routeClass === "INTEGRATION_ECOSYSTEM_ROUTE") return ROOT_INTEGRATION_HINTS.includes(root);
  if (routeClass === "USE_CASE_CUSTOMER_INDUSTRY_ROUTE") return ROOT_USE_CASE_HINTS.includes(root);
  return false;
}

function routeScopeForRoot(commonRoot) {
  const root = normalizeCommonRoot(commonRoot);
  return {
    primary_domain: ROOT_PRIMARY_HINTS.includes(root),
    ai_overlay: ROOT_AI_HINTS.includes(root),
    regulatory_overlay: ROOT_REGULATORY_HINTS.includes(root),
    fusion_candidate: ROOT_FUSION_HINTS.includes(root)
  };
}

function collectSourcesFromArtifact({ artifactName, artifact, commonRoot }) {
  if (!artifact) return [];
  const candidates = Array.isArray(artifact) ? artifact : [artifact, artifact.sources, artifact.source_rows, artifact.rows, artifact.pages, artifact.extracted_sources].filter(Boolean).flat();
  return candidates.filter(Boolean).map((row, index) => {
    const source = unwrapArtifact(row);
    return {
      ...source,
      source_artifact: artifactName,
      common_root: normalizeCommonRoot(source.common_root || commonRoot),
      source_id: String(source.source_id || source.id || source.url || `${artifactName}:${index + 1}`),
      lossless_text: String(source.lossless_text || source.text || source.clean_text || source.raw_text || source.body || source.content || "")
    };
  }).filter((row) => row.lossless_text || row.url || row.canonical_url || row.final_url);
}

function buildStructureUnits({ text, title, source, documentId, pointer }) {
  const clean = String(text || "");
  if (!clean.trim()) return [structureUnit({ documentId, index: 1, title, source, pointer, start: 0, end: 0 })];
  const chunks = clean.split(/\n{2,}/).map((chunk) => chunk.trim()).filter(Boolean).slice(0, 24);
  return chunks.map((chunk, index) => {
    const start = clean.indexOf(chunk);
    return structureUnit({ documentId, index: index + 1, title, source, pointer, start: Math.max(start, 0), end: Math.max(start, 0) + chunk.length });
  });
}

function structureUnit({ documentId, index, title, source, pointer, start, end }) {
  return {
    unit_id: `P2B.UNIT.${documentId}.${String(index).padStart(3, "0")}`,
    source_artifact: source.source_artifact,
    source_id: source.source_id,
    common_root: normalizeCommonRoot(source.common_root),
    source_url: source.canonical_url || source.final_url || source.url || "",
    heading_path: [String(title || source.source_artifact || "source")].filter(Boolean),
    char_range: { start, end },
    lossless_text_pointer: pointer,
    source_text_included: false
  };
}

function routeSummary({ artifactName, artifact, commonRoot, sourceCount }) {
  return { artifact_name: artifactName, common_root: normalizeCommonRoot(commonRoot), status: artifact ? "READ" : "MISSING", material_source_count: sourceCount };
}

function missingRow({ artifactName, commonRoot, reason }) {
  return { missing_id: `P2B.MISSING.${makeStableId(artifactName)}`, source_artifact: artifactName, common_root: normalizeCommonRoot(commonRoot), status: "MISSING_OR_THIN", reason };
}

function pointerForSource(source) {
  return { artifact_name: source.source_artifact, source_id: source.source_id, common_root: normalizeCommonRoot(source.common_root), url: source.canonical_url || source.final_url || source.url || "", text_field: "lossless_text" };
}

function textForRange(text, range = {}) {
  return String(text || "").slice(Math.max(0, range.start || 0), Math.max(0, range.end || 0));
}

function matchedTerms(patterns, text) {
  return patterns.map((pattern) => text.match(pattern)?.[0]).filter(Boolean);
}

function resolveStatus({ coverageIndex, missingLimited, qualityRepairQueue }) {
  if (!coverageIndex.length) return "REPAIR_REQUIRED";
  if (missingLimited.length || qualityRepairQueue.length) return "LOCKED_WITH_LIMITATIONS";
  return "LOCKED";
}

function unwrapArtifact(value) {
  if (value && typeof value === "object" && "payload" in value) return value.payload;
  return value;
}

function normalizeCommonRoot(value = "") {
  return String(value).replace(/^lossless_root__/, "");
}

function toCommonRoots(values = []) {
  return Object.freeze(values.map(normalizeCommonRoot));
}

function firstHeading(text = "") {
  return String(text).split(/\r?\n/).map((line) => line.trim()).find((line) => /^#{1,3}\s+/.test(line))?.replace(/^#{1,3}\s+/, "") || "";
}

function titleFromUrl(url = "") {
  return String(url).split("/").filter(Boolean).pop() || "";
}

function makeStableId(input = "") {
  let hash = 0;
  for (const char of String(input)) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash.toString(16).padStart(8, "0").slice(0, 8).toUpperCase();
}

function dedupeRows(rows = [], keyFn) {
  const seen = new Set();
  return rows.filter((row) => {
    const key = keyFn(row);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
