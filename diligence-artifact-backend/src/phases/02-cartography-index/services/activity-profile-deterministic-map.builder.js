import {
  P2C_ACTIVITY_PROFILE_ARTIFACTS,
  P2C_ACTIVITY_PROFILE_CANDIDATE_CREATION_ROOTS,
  P2C_ACTIVITY_PROFILE_CONTEXT_ONLY_ROOTS,
  P2C_ACTIVITY_PROFILE_ROOT_INPUTS,
  P2C_ACTIVITY_PROFILE_ROUTE_FAMILIES
} from "../activity-profile-source-index.contract.js";

export const ACTIVITY_PROFILE_DETERMINISTIC_ARTIFACT_NAME = P2C_ACTIVITY_PROFILE_ARTIFACTS.deterministicMap;

const ROOT_ARTIFACTS = Object.freeze([...P2C_ACTIVITY_PROFILE_ROOT_INPUTS]);
const CANDIDATE_CREATION_ROOTS = new Set(toCommonRoots(P2C_ACTIVITY_PROFILE_CANDIDATE_CREATION_ROOTS));
const CONTEXT_ONLY_ROOTS = new Set(toCommonRoots(P2C_ACTIVITY_PROFILE_CONTEXT_ONLY_ROOTS));

const LOCATOR_PATTERNS = Object.freeze({
  ACTIVITY_CANDIDATE_SOURCE_ROUTE: Object.freeze([
    pattern("product_or_service", /\b(product|service|solution|platform|tool|module)\b/i),
    pattern("capability_or_feature", /\b(feature|capability|functionality|workflow|use\s+case)\b/i),
    pattern("action_verb", /\b(create|generate|process|analy[sz]e|search|detect|monitor|verify|route|send|receive|upload|export|sync|configure|manage)\b/i),
    pattern("commercial_product_signal", /\b(plan|pricing|enterprise|trial|beta|available|subscription)\b/i)
  ]),
  PRODUCT_CAPABILITY_ROUTE: Object.freeze([
    pattern("capability_language", /\b(capability|feature|module|workflow|service|solution|tool)\b/i),
    pattern("product_wrapper_language", /\b(product|platform|suite|workspace|dashboard|console)\b/i),
    pattern("availability_language", /\b(available|launch|offer|plan|edition|package)\b/i)
  ]),
  FEATURE_MECHANICS_ROUTE: Object.freeze([
    pattern("how_it_works", /\b(how\s+it\s+works|workflow|step|configure|setup|run|execute|process)\b/i),
    pattern("user_action", /\b(user|admin|customer|team|developer)\s+(can|may|will|uses?|configure|selects?|uploads?|creates?|sends?|reviews?)\b/i),
    pattern("system_action", /\b(system|platform|service|tool)\s+(can|will|automatically|processes?|generates?|routes?|sends?|returns?)\b/i)
  ]),
  TECHNICAL_MECHANICS_ROUTE: Object.freeze([
    pattern("technical_docs", /\b(api|sdk|docs?|developer|endpoint|webhook|authentication|authorization|request|response|payload)\b/i),
    pattern("technical_flow", /\b(integration|architecture|data\s+flow|event|callback|schema|parameter|configuration)\b/i)
  ]),
  API_INTERACTION_ROUTE: Object.freeze([
    pattern("api_endpoint", /\b(api|endpoint|request|response|method|parameter|payload|token|key)\b/i),
    pattern("webhook_callback", /\b(webhook|callback|event|subscription|listener|trigger)\b/i),
    pattern("developer_integration", /\b(sdk|developer|docs|sample|client|server)\b/i)
  ]),
  DATA_OBJECT_INTERACTION_ROUTE: Object.freeze([
    pattern("data_object", /\b(data|record|file|document|message|content|metadata|payload|object|field)\b/i),
    pattern("input_output", /\b(input|output|upload|download|import|export|return|result|response)\b/i),
    pattern("transformation", /\b(extract|transform|parse|classify|convert|summari[sz]e|translate|generate)\b/i)
  ]),
  INTEGRATION_ACTION_ROUTE: Object.freeze([
    pattern("integration_surface", /\b(integration|connector|plugin|app|marketplace|partner|embed|extension)\b/i),
    pattern("system_interop", /\b(sync|connect|push|pull|send|receive|import|export|third[-\s]?party)\b/i)
  ]),
  COMMERCIAL_AVAILABILITY_ROUTE: Object.freeze([
    pattern("pricing", /\b(pricing|plan|tier|subscription|seat|usage|quote|contact\s+sales)\b/i),
    pattern("availability", /\b(available|beta|pilot|trial|free|freemium|enterprise|production)\b/i)
  ]),
  CUSTOMER_USE_CONTEXT_ROUTE: Object.freeze([
    pattern("use_case", /\b(use\s+case|customer|industry|team|department|workflow|scenario)\b/i),
    pattern("audience", /\b(users?|customers?|developers?|operators?|admins?|teams?|enterprises?)\b/i)
  ]),
  SUPPORT_OPERATIONAL_CONTEXT_ROUTE: Object.freeze([
    pattern("support_docs", /\b(help|support|guide|tutorial|faq|troubleshoot|documentation|knowledge\s+base)\b/i),
    pattern("operational_controls", /\b(settings|configuration|account|admin|permission|role|access|delete|disable|manage)\b/i)
  ]),
  AUTOMATION_TRANSPARENCY_CONTEXT_ROUTE: Object.freeze([
    pattern("automation_context", /\b(automated|automation|algorithm|model|decision|recommendation|prediction|classification)\b/i),
    pattern("transparency_context", /\b(transparency|explain|explanation|review|evaluation|monitoring|safety|guardrail)\b/i)
  ]),
  HUMAN_CONTROL_CONTEXT_ROUTE: Object.freeze([
    pattern("human_review", /\b(human|manual|review|approve|approval|override|control|supervise|supervision)\b/i),
    pattern("admin_control", /\b(admin|owner|operator|permission|role|setting|configuration|policy)\b/i)
  ]),
  EXTERNAL_ACTION_CONTEXT_ROUTE: Object.freeze([
    pattern("external_action", /\b(send|share|publish|notify|invite|transfer|route|submit|deliver|connect)\b/i),
    pattern("external_party", /\b(external|third[-\s]?party|partner|customer|vendor|recipient|client)\b/i)
  ]),
  INPUT_OUTPUT_OBJECT_CONTEXT_ROUTE: Object.freeze([
    pattern("input_output_object", /\b(input|output|file|document|record|message|content|image|audio|video|text|payload|result)\b/i),
    pattern("object_handling", /\b(upload|download|import|export|store|retrieve|delete|return|convert|extract)\b/i)
  ])
});

const ROUTE_META = Object.freeze({
  ACTIVITY_CANDIDATE_SOURCE_ROUTE: { key: "activity_candidate_source_locator_map", routeCode: "ACTIVITY_CANDIDATE_SOURCE", signalFamilies: ["ACTIVITY_CANDIDATE_SOURCE_SIGNAL"], priority: "P0", candidateCreationAllowed: true },
  PRODUCT_CAPABILITY_ROUTE: { key: "product_capability_locator_map", routeCode: "PRODUCT_CAPABILITY", signalFamilies: ["PRODUCT_CAPABILITY_SIGNAL"], priority: "P0", candidateCreationAllowed: true },
  FEATURE_MECHANICS_ROUTE: { key: "feature_mechanics_locator_map", routeCode: "FEATURE_MECHANICS", signalFamilies: ["FEATURE_MECHANICS_SIGNAL"], priority: "P0", candidateCreationAllowed: true },
  TECHNICAL_MECHANICS_ROUTE: { key: "technical_mechanics_locator_map", routeCode: "TECHNICAL_MECHANICS", signalFamilies: ["TECHNICAL_MECHANICS_SIGNAL"], priority: "P1", candidateCreationAllowed: true },
  API_INTERACTION_ROUTE: { key: "api_interaction_locator_map", routeCode: "API_INTERACTION", signalFamilies: ["API_INTERACTION_SIGNAL"], priority: "P1", candidateCreationAllowed: true },
  DATA_OBJECT_INTERACTION_ROUTE: { key: "data_object_interaction_locator_map", routeCode: "DATA_OBJECT_INTERACTION", signalFamilies: ["DATA_OBJECT_INTERACTION_SIGNAL"], priority: "P1", candidateCreationAllowed: true },
  INTEGRATION_ACTION_ROUTE: { key: "integration_action_locator_map", routeCode: "INTEGRATION_ACTION", signalFamilies: ["INTEGRATION_ACTION_SIGNAL"], priority: "P1", candidateCreationAllowed: true },
  COMMERCIAL_AVAILABILITY_ROUTE: { key: "commercial_availability_locator_map", routeCode: "COMMERCIAL_AVAILABILITY", signalFamilies: ["COMMERCIAL_AVAILABILITY_SIGNAL"], priority: "P1", candidateCreationAllowed: true },
  CUSTOMER_USE_CONTEXT_ROUTE: { key: "customer_use_context_locator_map", routeCode: "CUSTOMER_USE_CONTEXT", signalFamilies: ["CUSTOMER_USE_CONTEXT_SIGNAL"], priority: "P2", candidateCreationAllowed: false },
  SUPPORT_OPERATIONAL_CONTEXT_ROUTE: { key: "support_operational_context_locator_map", routeCode: "SUPPORT_OPERATIONAL_CONTEXT", signalFamilies: ["SUPPORT_OPERATIONAL_CONTEXT_SIGNAL"], priority: "P2", candidateCreationAllowed: false },
  AUTOMATION_TRANSPARENCY_CONTEXT_ROUTE: { key: "automation_transparency_context_locator_map", routeCode: "AUTOMATION_TRANSPARENCY_CONTEXT", signalFamilies: ["AUTOMATION_TRANSPARENCY_CONTEXT_SIGNAL"], priority: "P2", candidateCreationAllowed: false },
  HUMAN_CONTROL_CONTEXT_ROUTE: { key: "human_control_context_locator_map", routeCode: "HUMAN_CONTROL_CONTEXT", signalFamilies: ["HUMAN_CONTROL_CONTEXT_SIGNAL"], priority: "P2", candidateCreationAllowed: false },
  EXTERNAL_ACTION_CONTEXT_ROUTE: { key: "external_action_context_locator_map", routeCode: "EXTERNAL_ACTION_CONTEXT", signalFamilies: ["EXTERNAL_ACTION_CONTEXT_SIGNAL"], priority: "P2", candidateCreationAllowed: true },
  INPUT_OUTPUT_OBJECT_CONTEXT_ROUTE: { key: "input_output_object_context_locator_map", routeCode: "INPUT_OUTPUT_OBJECT_CONTEXT", signalFamilies: ["INPUT_OUTPUT_OBJECT_CONTEXT_SIGNAL"], priority: "P2", candidateCreationAllowed: true }
});

export function buildActivityProfileDeterministicMap({ run = {}, artifacts = {} } = {}) {
  const runId = run.run_id || "UNKNOWN_RUN";
  const targetUrl = run.target_url || run.root_url || "";
  const sourceArtifactsRead = [];
  const coverageIndex = [];
  const structureIndex = [];
  const semanticQueue = [];
  const qualityRepairQueue = [];
  const missingLimited = [];
  const locatorBuckets = Object.fromEntries(Object.values(ROUTE_META).map((meta) => [meta.key, []]));

  const collected = collectActivityProfileSources(artifacts);
  sourceArtifactsRead.push(...collected.routes);
  missingLimited.push(...collected.gaps);

  for (const source of collected.sources) ingestSource({ source, coverageIndex, structureIndex, locatorBuckets, semanticQueue, qualityRepairQueue });

  const finalMap = {
    run_id: runId,
    target_url: targetUrl,
    generated_by: "phase2c_activity_profile_deterministic_layer",
    schema_version: "P2C_ACTIVITY_PROFILE_DETERMINISTIC_MAP_v1_PHASE1_V5_DOMAIN_AGNOSTIC",
    model_used: false,
    artifact_role: "Navigation-only deterministic map for Phase 5 Activity Profile Review. It locates generic public activity evidence and defers all package-specific classifications to the mounted domain package.",
    source_text_policy: {
      source_artifacts_remain_source_of_truth: true,
      full_text_copied_into_map: false,
      excerpts_copied_into_map: false,
      summaries_generated: false,
      downstream_must_use_navigation_pointers_to_read_source_text: true
    },
    source_artifacts_read: dedupeRows(sourceArtifactsRead, (row) => row.artifact_name),
    activity_profile_source_coverage_index: dedupeRows(coverageIndex, (row) => row.coverage_id),
    activity_profile_document_structure_index: dedupeRows(structureIndex, (row) => row.unit_id),
    activity_candidate_source_locator_map: dedupeRows(locatorBuckets.activity_candidate_source_locator_map, (row) => row.locator_id),
    product_capability_locator_map: dedupeRows(locatorBuckets.product_capability_locator_map, (row) => row.locator_id),
    feature_mechanics_locator_map: dedupeRows(locatorBuckets.feature_mechanics_locator_map, (row) => row.locator_id),
    technical_mechanics_locator_map: dedupeRows(locatorBuckets.technical_mechanics_locator_map, (row) => row.locator_id),
    api_interaction_locator_map: dedupeRows(locatorBuckets.api_interaction_locator_map, (row) => row.locator_id),
    data_object_interaction_locator_map: dedupeRows(locatorBuckets.data_object_interaction_locator_map, (row) => row.locator_id),
    integration_action_locator_map: dedupeRows(locatorBuckets.integration_action_locator_map, (row) => row.locator_id),
    commercial_availability_locator_map: dedupeRows(locatorBuckets.commercial_availability_locator_map, (row) => row.locator_id),
    customer_use_context_locator_map: dedupeRows(locatorBuckets.customer_use_context_locator_map, (row) => row.locator_id),
    support_operational_context_locator_map: dedupeRows(locatorBuckets.support_operational_context_locator_map, (row) => row.locator_id),
    automation_transparency_context_locator_map: dedupeRows(locatorBuckets.automation_transparency_context_locator_map, (row) => row.locator_id),
    human_control_context_locator_map: dedupeRows(locatorBuckets.human_control_context_locator_map, (row) => row.locator_id),
    external_action_context_locator_map: dedupeRows(locatorBuckets.external_action_context_locator_map, (row) => row.locator_id),
    input_output_object_context_locator_map: dedupeRows(locatorBuckets.input_output_object_context_locator_map, (row) => row.locator_id),
    missing_limited_activity_profile_source_map: dedupeRows(missingLimited, (row) => row.missing_id),
    semantic_label_queue: dedupeRows(semanticQueue, (row) => row.queue_id),
    quality_repair_queue: dedupeRows(qualityRepairQueue, (row) => `${row.repair_type}:${row.source_artifact}:${row.source_id}`),
    downstream_rules: {
      phase_2c_is_index_only: true,
      activity_profile_source_index_owned_by_2c: true,
      phase_5_activity_profile_review_derives_values_later: true,
      domain_package_specific_activity_taxonomy_deferred_to_phase5: true,
      mounted_domain_package_controls_archetypes_surfaces_and_activity_fields: true,
      package_specific_classification_forbidden_in_2c: true,
      archetype_derivation_forbidden_in_2c: true,
      surface_derivation_forbidden_in_2c: true,
      mechanics_proof_forbidden_in_2c: true,
      feature_candidate_inventory_forbidden_in_2c: true,
      context_only_roots_may_not_create_standalone_candidates: true,
      source_artifacts_remain_source_of_truth: true,
      full_text_copied: false,
      summaries_allowed: false,
      excerpts_allowed: false,
      legal_or_compliance_conclusions_allowed: false,
      phase1_v5_domain_agnostic_source_contract_required: true,
      old_family_input_contract_forbidden: true
    },
    lock_status: resolveStatus({ coverageIndex, missingLimited, qualityRepairQueue })
  };

  return { [ACTIVITY_PROFILE_DETERMINISTIC_ARTIFACT_NAME]: finalMap };
}

function collectActivityProfileSources(artifacts = {}) {
  const sources = [];
  const routes = [];
  const gaps = [];
  for (const artifactName of ROOT_ARTIFACTS) {
    const artifact = unwrapArtifact(artifacts[artifactName]);
    const commonRoot = normalizeCommonRoot(artifactName);
    const rows = collectSourcesFromArtifact({ artifactName, artifact, commonRoot });
    routes.push(routeSummary({ artifactName, artifact, commonRoot, sourceCount: rows.length }));
    if (!rows.length) gaps.push(missingRow({ artifactName, commonRoot, reason: "No material source rows available for this Phase 1 v5 activity profile root." }));
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

  coverageIndex.push({
    coverage_id: `P2C.COV.${documentId}`,
    source_artifact: sourceArtifact,
    source_id: sourceId,
    common_root: sourceRoot,
    source_url: sourceUrl,
    source_class: CONTEXT_ONLY_ROOTS.has(sourceRoot) ? "activity_context_common_root" : "activity_candidate_common_root",
    candidate_creation_allowed: CANDIDATE_CREATION_ROOTS.has(sourceRoot),
    source_corpus_status: text ? "FOUND_AS_PRIMARY_SOURCE" : "FOUND_THIN",
    status: text ? "FOUND_INDEXED" : "FOUND_THIN",
    root_route_scope: routeScopeForRoot(sourceRoot),
    lossless_text_pointer: pointer,
    phase_1_classification_effect: source.phase_1_classification_effect || "SOURCE_ROUTING_ONLY_NOT_JOB_ROUTING",
    limitation: text ? "" : "Source row has no lossless_text available."
  });

  if (!text) qualityRepairQueue.push({ repair_type: "MISSING_LOSSLESS_TEXT", source_artifact: sourceArtifact, source_id: sourceId, reason: "Source row exists but lossless_text is empty." });

  const units = buildStructureUnits({ text, source: { ...source, common_root: sourceRoot }, documentId, pointer });
  for (const unit of units) {
    structureIndex.push(unit);
    addLocators({ unit, source: { ...source, common_root: sourceRoot }, locatorBuckets, semanticQueue });
  }
}

function addLocators({ unit, source, locatorBuckets, semanticQueue }) {
  const unitText = textForRange(source.lossless_text || source.text || "", unit.char_range);
  const commonRoot = normalizeCommonRoot(source.common_root);
  const searchText = `${unitText} ${source.url || ""} ${commonRoot}`;
  const matchedRoutes = [];

  for (const [routeClass, patterns] of Object.entries(LOCATOR_PATTERNS)) {
    if (!routeSupportedByRoot(routeClass, commonRoot)) continue;
    const matchedPatternLabels = patterns.filter((item) => item.regex.test(searchText)).map((item) => item.label);
    if (!matchedPatternLabels.length) continue;
    const meta = ROUTE_META[routeClass];
    const sourcePointer = pointerForSource(source);
    const locator = {
      locator_id: `P2C.LOC.${meta.routeCode}.${makeStableId(`${unit.unit_id}:${routeClass}`)}`,
      unit_id: unit.unit_id,
      source_artifact: source.source_artifact,
      source_id: source.source_id,
      common_root: commonRoot,
      source_url: source.canonical_url || source.final_url || source.url || "",
      route_class: routeClass,
      route_code: meta.routeCode,
      route_action: "LOCATE_ONLY",
      signal_families: meta.signalFamilies,
      candidate_creation_allowed: Boolean(meta.candidateCreationAllowed && CANDIDATE_CREATION_ROOTS.has(commonRoot)),
      context_only: CONTEXT_ONLY_ROOTS.has(commonRoot),
      matched_signal_labels: matchedPatternLabels,
      confidence_hint: confidenceFromMatches(matchedPatternLabels.length),
      source_pointer: sourcePointer,
      unit_pointer: unit.unit_pointer,
      derived_value_forbidden: true,
      package_specific_classification_forbidden: true,
      source_text_copied: false
    };
    locatorBuckets[meta.key].push(locator);
    matchedRoutes.push({ routeClass, meta, confidence: locator.confidence_hint });
  }

  for (const item of matchedRoutes) semanticQueue.push({
    queue_id: `P2C.SEM.${makeStableId(`${unit.unit_id}:${item.routeClass}`)}`,
    unit_id: unit.unit_id,
    source_artifact: source.source_artifact,
    source_id: source.source_id,
    common_root: commonRoot,
    route_classes: [item.routeClass],
    route_signal_families: item.meta.signalFamilies,
    confidence: item.confidence,
    semantic_task: "LABEL_ACTIVITY_EVIDENCE_ROUTE_ONLY",
    package_classification_forbidden: true,
    source_text_available_by_pointer_only: true
  });
}

function routeSupportedByRoot(routeClass, commonRoot) {
  const supported = {
    ACTIVITY_CANDIDATE_SOURCE_ROUTE: ["product_service", "platform_feature_solution", "technical_docs_api", "docs_api_data_flow", "integrations_ecosystem", "pricing_commercial_availability"],
    PRODUCT_CAPABILITY_ROUTE: ["product_service", "platform_feature_solution", "pricing_commercial_availability"],
    FEATURE_MECHANICS_ROUTE: ["platform_feature_solution", "product_service", "technical_docs_api", "docs_api_data_flow", "support_help_resources"],
    TECHNICAL_MECHANICS_ROUTE: ["technical_docs_api", "docs_api_data_flow", "platform_feature_solution", "integrations_ecosystem"],
    API_INTERACTION_ROUTE: ["technical_docs_api", "docs_api_data_flow", "integrations_ecosystem"],
    DATA_OBJECT_INTERACTION_ROUTE: ["docs_api_data_flow", "technical_docs_api", "platform_feature_solution", "product_service"],
    INTEGRATION_ACTION_ROUTE: ["integrations_ecosystem", "technical_docs_api", "docs_api_data_flow", "platform_feature_solution"],
    COMMERCIAL_AVAILABILITY_ROUTE: ["pricing_commercial_availability", "product_service", "platform_feature_solution"],
    CUSTOMER_USE_CONTEXT_ROUTE: ["use_case_customer_industry", "product_service", "pricing_commercial_availability"],
    SUPPORT_OPERATIONAL_CONTEXT_ROUTE: ["support_help_resources", "product_service", "platform_feature_solution"],
    AUTOMATION_TRANSPARENCY_CONTEXT_ROUTE: ["ai_safety_transparency", "product_service", "platform_feature_solution", "technical_docs_api", "docs_api_data_flow"],
    HUMAN_CONTROL_CONTEXT_ROUTE: ["ai_safety_transparency", "support_help_resources", "technical_docs_api", "platform_feature_solution"],
    EXTERNAL_ACTION_CONTEXT_ROUTE: ["integrations_ecosystem", "technical_docs_api", "docs_api_data_flow", "product_service", "support_help_resources"],
    INPUT_OUTPUT_OBJECT_CONTEXT_ROUTE: ["docs_api_data_flow", "technical_docs_api", "platform_feature_solution", "product_service", "support_help_resources"]
  };
  return (supported[routeClass] || []).includes(normalizeCommonRoot(commonRoot));
}

function buildStructureUnits({ text, source, documentId, pointer }) {
  const raw = String(text || "");
  if (!raw.trim()) return [unitRow({ source, documentId, index: 1, start: 0, end: 0, pointer })];
  const chunkSize = 1400;
  const units = [];
  for (let start = 0, index = 1; start < raw.length; start += chunkSize, index += 1) {
    const end = Math.min(raw.length, start + chunkSize);
    units.push(unitRow({ source, documentId, index, start, end, pointer }));
  }
  return units;
}

function unitRow({ source, documentId, index, start, end, pointer }) {
  return {
    unit_id: `P2C.UNIT.${documentId}.${String(index).padStart(3, "0")}`,
    source_artifact: source.source_artifact,
    source_id: source.source_id,
    common_root: normalizeCommonRoot(source.common_root || source.source_artifact),
    source_url: source.canonical_url || source.final_url || source.url || "",
    unit_type: "activity_source_text_range",
    unit_sequence: index,
    char_range: [start, end],
    unit_pointer: { ...pointer, char_range: [start, end] },
    source_text_copied: false
  };
}

function collectSourcesFromArtifact({ artifactName, artifact, commonRoot }) {
  if (!artifact || typeof artifact !== "object") return [];
  const candidateRows = firstArray(artifact.sources, artifact.source_rows, artifact.rows, artifact.full_matrix_source_index, artifact.source_index);
  if (candidateRows.length) return candidateRows.map((source, index) => normalizeSourceRow({ artifactName, commonRoot, source, index }));
  if (artifact.lossless_text || artifact.text) return [normalizeSourceRow({ artifactName, commonRoot, source: artifact, index: 0 })];
  return [];
}

function normalizeSourceRow({ artifactName, commonRoot, source = {}, index = 0 }) {
  return {
    ...source,
    source_artifact: artifactName,
    common_root: normalizeCommonRoot(source.common_root || commonRoot || artifactName),
    source_id: source.source_id || source.manifest_id || source.id || `${artifactName}#${index + 1}`,
    canonical_url: source.canonical_url || source.final_url || source.url || "",
    url: source.url || source.canonical_url || source.final_url || "",
    lossless_text: source.lossless_text || source.clean_text || source.text || ""
  };
}

function routeSummary({ artifactName, artifact, commonRoot, sourceCount }) {
  return {
    artifact_name: artifactName,
    common_root: normalizeCommonRoot(commonRoot),
    present: Boolean(artifact && typeof artifact === "object"),
    source_count: sourceCount,
    candidate_creation_allowed: CANDIDATE_CREATION_ROOTS.has(normalizeCommonRoot(commonRoot)),
    context_only: CONTEXT_ONLY_ROOTS.has(normalizeCommonRoot(commonRoot)),
    route_scope: routeScopeForRoot(commonRoot),
    source_text_copied: false
  };
}

function missingRow({ artifactName, commonRoot, reason }) {
  return {
    missing_id: `P2C.MISS.${normalizeCommonRoot(commonRoot).toUpperCase()}`,
    artifact_name: artifactName,
    common_root: normalizeCommonRoot(commonRoot),
    reason,
    gap_policy: "Sparse Phase 1 roots may be virtual when no material text exists; downstream must treat this as a limitation, not a runtime crash."
  };
}

function routeScopeForRoot(root) {
  const commonRoot = normalizeCommonRoot(root);
  if (CANDIDATE_CREATION_ROOTS.has(commonRoot)) return "candidate_creation_source";
  if (CONTEXT_ONLY_ROOTS.has(commonRoot)) return "context_support_source";
  return "activity_profile_source";
}

function pointerForSource(source = {}) {
  const commonRoot = normalizeCommonRoot(source.common_root || source.source_artifact);
  return {
    source_artifact_name: source.source_artifact || `lossless_root__${commonRoot}`,
    common_root: commonRoot,
    source_id: source.source_id || "",
    source_url: source.canonical_url || source.final_url || source.url || "",
    text_field: source.lossless_text ? "lossless_text" : (source.text ? "text" : ""),
    locator_type: source.route_type ? "route_type" : "source_id",
    locator_value: source.route_type || source.source_id || ""
  };
}

function pattern(label, regex) { return Object.freeze({ label, regex }); }
function firstArray(...values) { return values.find((value) => Array.isArray(value)) || []; }
function textForRange(text, range = []) { const [start = 0, end = 0] = range; return String(text || "").slice(start, end); }
function confidenceFromMatches(count) { return count >= 2 ? "CLEAR" : "PARTIAL"; }
function normalizeCommonRoot(value = "") { return String(value || "").replace(/^lossless_root__/, "").replace(/__part_\d{3}$/, ""); }
function toCommonRoots(values = []) { return Object.freeze(values.map(normalizeCommonRoot)); }
function unwrapArtifact(value) { return value?.artifact && typeof value.artifact === "object" ? value.artifact : value; }
function dedupeRows(rows, keyFn) { const seen = new Set(); const out = []; for (const row of rows || []) { const key = keyFn(row); if (seen.has(key)) continue; seen.add(key); out.push(Object.freeze(row)); } return Object.freeze(out); }
function makeStableId(value = "") { let hash = 0; for (const ch of String(value)) hash = ((hash << 5) - hash + ch.charCodeAt(0)) | 0; return Math.abs(hash).toString(36).toUpperCase().padStart(6, "0"); }
function resolveStatus({ coverageIndex = [], missingLimited = [], qualityRepairQueue = [] } = {}) { if (!coverageIndex.length) return "CONTROLLED_FAILURE"; if (qualityRepairQueue.length || missingLimited.length) return "LOCKED_WITH_LIMITATIONS"; return "LOCKED"; }
