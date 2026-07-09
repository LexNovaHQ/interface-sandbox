import { createHash } from "node:crypto";
import { CARTOGRAPHY_INDEX_CONTRACT, getCartographyIndexJobContract } from "./cartography-index.contract.js";

const PROFILE_INDEXES = Object.freeze(["target_profile_source_index", "activity_profile_source_index", "data_provenance_source_index", "legal_governance_source_index"]);
const PROFILE_BY_ROOT = Object.freeze({
  homepage_landing: ["target_profile_source_index"],
  about_company: ["target_profile_source_index"],
  legal_identity_notice: ["target_profile_source_index", "legal_governance_source_index"],
  product_service: ["activity_profile_source_index"],
  platform_feature_solution: ["activity_profile_source_index"],
  pricing_commercial_availability: ["target_profile_source_index", "activity_profile_source_index"],
  privacy_data_processing: ["data_provenance_source_index", "legal_governance_source_index"],
  security_trust: ["data_provenance_source_index", "legal_governance_source_index"],
  technical_docs_api_developer: ["activity_profile_source_index", "data_provenance_source_index"],
  docs_api_data_flow: ["activity_profile_source_index", "data_provenance_source_index"],
  trust_compliance: ["data_provenance_source_index", "legal_governance_source_index"],
  contact_notice: ["target_profile_source_index", "data_provenance_source_index", "legal_governance_source_index"],
  operator_entity_signals: ["target_profile_source_index"],
  supporting_company_signals: ["target_profile_source_index"],
  use_case_customer_industry: ["activity_profile_source_index"],
  integrations_ecosystem: ["activity_profile_source_index"],
  support_help: ["activity_profile_source_index"],
  blog_resources: ["activity_profile_source_index"],
  careers_hiring: ["target_profile_source_index"],
  public_repository_developer_assets: ["activity_profile_source_index", "data_provenance_source_index"],
  third_party_profiles: ["target_profile_source_index"]
});
const PROFILE_BY_DOC_TYPE = Object.freeze({
  terms_of_service: ["legal_governance_source_index", "target_profile_source_index", "activity_profile_source_index", "data_provenance_source_index"],
  privacy_policy: ["legal_governance_source_index", "data_provenance_source_index"],
  data_processing_agreement: ["legal_governance_source_index", "data_provenance_source_index"],
  subprocessor_list: ["legal_governance_source_index", "data_provenance_source_index"],
  cookie_policy: ["legal_governance_source_index", "data_provenance_source_index"],
  acceptable_use_policy: ["legal_governance_source_index", "activity_profile_source_index"],
  ai_policy: ["legal_governance_source_index", "activity_profile_source_index", "data_provenance_source_index"],
  developer_terms: ["legal_governance_source_index", "activity_profile_source_index"],
  service_level_agreement: ["legal_governance_source_index", "data_provenance_source_index"],
  legal_notice: ["legal_governance_source_index", "target_profile_source_index"],
  eula: ["legal_governance_source_index", "activity_profile_source_index"],
  baa: ["legal_governance_source_index", "data_provenance_source_index"],
  other: ["legal_governance_source_index"]
});

export async function runCartographyIndexJob({ run, internalJobId, contract, readArtifacts, readArtifact, saveArtifact } = {}) {
  const job = getCartographyIndexJobContract(internalJobId);
  const artifacts = await readArtifacts({ reads: contract.reads || job.reads, agent_id: contract.actor_id || "agent_2_cartography_index" });
  const dynamicLegalDocs = await loadLegalDocArtifacts({ artifacts, readArtifact });
  const input = { run, artifacts: { ...artifacts, ...dynamicLegalDocs } };
  const output = await buildOutputForJob({ jobId: internalJobId, input });
  const saved = [];
  for (const artifactName of job.writes) {
    const artifact = output[artifactName];
    if (!artifact || typeof artifact !== "object" || Array.isArray(artifact)) throw new Error(`CARTOGRAPHY_OUTPUT_MISSING:${internalJobId}:${artifactName}`);
    await saveArtifact({ artifact_name: artifactName, artifact, lock_status: artifact.status || "LOCKED" });
    saved.push(artifactName);
  }
  return { ok: true, phase_id: CARTOGRAPHY_INDEX_CONTRACT.central_phase_id, job_id: internalJobId, saved_artifacts: saved, output, phase_lock_status: resolveJobStatus(output), model_usage: internalJobId === "P2_SEMANTIC_NAVIGATION_OVERLAY" ? "SEMANTIC_GUIDANCE_BOUNDED_NO_FREE_CORPUS_READ" : "NONE_DETERMINISTIC" };
}

async function buildOutputForJob({ jobId, input }) {
  if (jobId === "P2_SOURCE_INVENTORY_CARTOGRAPHY") return buildSourceInventory(input);
  if (jobId === "P2_LOCATOR_SPINE") return buildLocatorSpine(input);
  if (jobId === "P2_PROFILE_ROUTE_MATRIX") return buildProfileRouteMatrix(input);
  if (jobId === "P2_SEMANTIC_NAVIGATION_OVERLAY") return buildSemanticNavigationOverlay(input);
  if (jobId === "P2_INDEX_COMPILER_VALIDATION") return buildCompiledIndexes(input);
  throw new Error(`UNKNOWN_CARTOGRAPHY_INDEX_JOB:${jobId || "missing"}`);
}

function buildSourceInventory({ run, artifacts }) {
  const rows = [];
  const sourceFamilyIndex = unwrap(artifacts.source_family_index);
  const rootEntries = Object.keys(artifacts || {}).filter((name) => name.startsWith("lossless_root__")).sort();
  for (const artifactName of rootEntries) {
    const artifact = unwrap(artifacts[artifactName]);
    const sourceRoot = artifact.common_root || artifactName.replace(/^lossless_root__/, "").replace(/__part_\d{3}$/, "");
    const sources = Array.isArray(artifact.sources) ? artifact.sources : [];
    if (!sources.length) rows.push(sourceInventoryRow({ run, artifactName, sourceRoot, source: {}, sourceClass: "common_root", sourceStatus: "EMPTY_OR_MISSING", sourceFamilyIndex }));
    for (const source of sources) rows.push(sourceInventoryRow({ run, artifactName, sourceRoot, source, sourceClass: "common_root", sourceStatus: "AVAILABLE", sourceFamilyIndex }));
  }
  const legalInventory = unwrap(artifacts.legal_doc_inventory);
  for (const doc of legalDocumentsFromInventory(legalInventory)) {
    const artifactName = doc.artifact_name || doc.legal_doc_artifact_name || `legal_doc_${doc.doc_type || "other"}`;
    rows.push(sourceInventoryRow({ run, artifactName, sourceRoot: "legal_governance", source: { source_id: doc.doc_id || doc.source_id || artifactName, canonical_url: doc.source_url || doc.url || "", url: doc.source_url || doc.url || "", doc_type: doc.doc_type || "other" }, sourceClass: "legal_doc", sourceStatus: doc.status || "AVAILABLE", docType: doc.doc_type || "other", legalDocInventoryLink: doc.doc_id || artifactName }));
  }
  const gaps = buildInventoryGaps({ artifacts, rootEntries, rows });
  return { cartography_source_inventory: baseArtifact({ run, artifact_type: "cartography_source_inventory", layer_id: "P2-L1", rows: rows.map((row, index) => ({ ...row, source_inventory_id: `CSI.${String(index + 1).padStart(4, "0")}` })), source_count: rows.length, root_artifact_count: rootEntries.length, legal_doc_count: rows.filter((row) => row.source_class === "legal_doc").length, access_gap_ledger: gaps }) };
}

function buildLocatorSpine({ run, artifacts }) {
  const inventory = unwrap(artifacts.cartography_source_inventory);
  const locatorRows = [];
  for (const row of inventory.rows || []) {
    const artifact = unwrap(artifacts[row.source_artifact]);
    const source = findSourceForInventoryRow({ artifact, row });
    const text = String(source.lossless_text || source.clean_text || source.text || artifact.lossless_text || artifact.clean_text || artifact.text || "");
    const docType = row.doc_type || artifact.doc_type || "";
    locatorRows.push(locatorRow({ row, text, unitType: row.source_class === "legal_doc" ? "document" : "source", headingPath: [docType || row.source_root || row.source_artifact].filter(Boolean), start: 0, end: text.length }));
    for (const heading of detectHeadingLocators(text).slice(0, 80)) locatorRows.push(locatorRow({ row, text, unitType: "section", headingPath: heading.heading_path, start: heading.start, end: heading.end }));
  }
  return { cartography_locator_spine: baseArtifact({ run, artifact_type: "cartography_locator_spine", layer_id: "P2-L2", locators: locatorRows.map((row, index) => ({ ...row, locator_id: `LOC.${String(index + 1).padStart(5, "0")}` })), locator_count: locatorRows.length, locator_policy: navigationOnlyPolicy() }) };
}

function buildProfileRouteMatrix({ run, artifacts }) {
  const spine = unwrap(artifacts.cartography_locator_spine);
  const routes = [];
  for (const locator of spine.locators || []) {
    const profileIndexes = routeProfilesForLocator(locator);
    for (const profileIndex of profileIndexes) routes.push(routeRow({ locator, profileIndex }));
  }
  return { cartography_profile_route_matrix: baseArtifact({ run, artifact_type: "cartography_profile_route_matrix", layer_id: "P2-L3", routes: routes.map((row, index) => ({ ...row, route_id: `P2.ROUTE.${String(index + 1).padStart(5, "0")}` })), profile_index_counts: countBy(routes, "profile_index"), route_policy: navigationOnlyPolicy() }) };
}

function buildSemanticNavigationOverlay({ run, artifacts }) {
  const matrix = unwrap(artifacts.cartography_profile_route_matrix);
  const overlayRows = (matrix.routes || []).map((route, index) => {
    const labels = semanticLabelsForRoute(route);
    return { overlay_id: `SNO.${String(index + 1).padStart(5, "0")}`, route_id: route.route_id, locator_id: route.locator_id, profile_index: route.profile_index, semantic_labels: labels, reading_priority: priorityForRoute(route, labels), field_family_relevance: fieldFamiliesForRoute(route, labels), profile_relevance: route.profile_index, ambiguity_status: labels.includes("generic_route_candidate") ? "MEDIUM_AMBIGUITY" : "LOW_AMBIGUITY", domain_overlay_candidate_tags: overlayTagsForRoute(route, labels), semantic_guidance_only: true, no_fact_derivation: true, no_summary: true, no_excerpt: true };
  });
  return { cartography_semantic_navigation_overlay: baseArtifact({ run, artifact_type: "cartography_semantic_navigation_overlay", layer_id: "P2-L4", overlays: overlayRows, overlay_count: overlayRows.length, semantic_policy: { ...navigationOnlyPolicy(), semantic_guidance_only: true, no_fact_derivation: true } }) };
}

function buildCompiledIndexes({ run, artifacts }) {
  const inventory = unwrap(artifacts.cartography_source_inventory);
  const spine = unwrap(artifacts.cartography_locator_spine);
  const matrix = unwrap(artifacts.cartography_profile_route_matrix);
  const overlay = unwrap(artifacts.cartography_semantic_navigation_overlay);
  const overlayByRoute = new Map((overlay.overlays || []).map((row) => [row.route_id, row]));
  const routes = (matrix.routes || []).map((route) => ({ ...route, semantic_navigation: overlayByRoute.get(route.route_id) || null })).filter(routeIntegrityPass);
  const profileIndexes = Object.fromEntries(PROFILE_INDEXES.map((name) => [name, profileIndexArtifact({ run, name, routes: routes.filter((route) => route.profile_index === name) })]));
  const validation = validateCompiledIndexes({ inventory, spine, matrix, overlay, profileIndexes, routes });
  const cartographyIndex = baseArtifact({ run, artifact_type: "cartography_index", layer_id: "P2-L5", index_version: "phase2_cartography_index_v1", execution_mode: "DETERMINISTIC_LED_SEMANTIC_GUIDED", navigation_only: true, source_inventory_ref: "cartography_source_inventory", locator_spine_ref: "cartography_locator_spine", profile_route_matrix_ref: "cartography_profile_route_matrix", semantic_navigation_overlay_ref: "cartography_semantic_navigation_overlay", profile_indexes: Object.fromEntries(PROFILE_INDEXES.map((name) => [name, { artifact_name: name, route_count: profileIndexes[name].route_count }])), downstream_free_read_forbidden: true, contains_lossless_text: false, contains_excerpts: false, contains_summaries: false, contains_profile_answers: false, contains_legal_or_compliance_conclusions: false });
  return { ...profileIndexes, cartography_index: cartographyIndex, cartography_validation_manifest: validation };
}

function profileIndexArtifact({ run, name, routes }) {
  return baseArtifact({ run, artifact_type: name, layer_id: "P2-L5", index_version: "phase2_cartography_index_v1", execution_mode: "DETERMINISTIC_COMPILED_FROM_CARTOGRAPHY", navigation_only: true, route_count: routes.length, route_groups: groupRoutes(routes), routes: routes.map(stripRouteForIndex), contains_lossless_text: false, contains_excerpts: false, contains_summaries: false, contains_profile_answers: false, contains_legal_or_compliance_conclusions: false });
}

function validateCompiledIndexes({ inventory, spine, matrix, overlay, profileIndexes, routes }) {
  const failures = [];
  const warnings = [];
  const locatorIds = new Set((spine.locators || []).map((row) => row.locator_id));
  const inventoryArtifacts = new Set((inventory.rows || []).map((row) => row.source_artifact));
  const overlaysByRoute = new Set((overlay.overlays || []).map((row) => row.route_id));
  for (const route of matrix.routes || []) {
    if (!route.locator_id || !locatorIds.has(route.locator_id)) failures.push(`ROUTE_MISSING_VALID_LOCATOR:${route.route_id || "missing"}`);
    if (!route.lossless_text_pointer?.artifact_name || !inventoryArtifacts.has(route.lossless_text_pointer.artifact_name)) failures.push(`ROUTE_MISSING_LOSSLESS_TEXT_POINTER:${route.route_id || "missing"}`);
    if (!overlaysByRoute.has(route.route_id)) warnings.push(`ROUTE_MISSING_SEMANTIC_OVERLAY:${route.route_id || "missing"}`);
  }
  const compiled = { ...profileIndexes, cartography_source_inventory: inventory, cartography_locator_spine: spine, cartography_profile_route_matrix: matrix, cartography_semantic_navigation_overlay: overlay };
  if (containsForbiddenEvidence(compiled)) failures.push("INDEX_CONTAINS_FORBIDDEN_EVIDENCE_OR_SUMMARY_FIELD");
  if (JSON.stringify(compiled).includes("lossless_family__")) failures.push("OLD_LOSSLESS_FAMILY_ARTIFACT_REFERENCED");
  if (JSON.stringify(compiled).includes("legal_cartography_index")) failures.push("OLD_LEGAL_CARTOGRAPHY_ARTIFACT_REFERENCED");
  if (JSON.stringify(compiled).includes("data_privacy_navigation_index")) failures.push("OLD_DATA_PRIVACY_NAVIGATION_INDEX_REFERENCED");
  return baseArtifact({ run: {}, artifact_type: "cartography_validation_manifest", layer_id: "P2-L5", status: failures.length ? "REPAIR_REQUIRED" : "LOCKED", validation_status: failures.length ? "FAIL" : "PASS", failures, warnings, route_count: routes.length, profile_index_counts: Object.fromEntries(PROFILE_INDEXES.map((name) => [name, profileIndexes[name].route_count])), hard_failures_enforced: CARTOGRAPHY_INDEX_CONTRACT.validation_hard_failures });
}

async function loadLegalDocArtifacts({ artifacts, readArtifact }) {
  const loaded = {};
  if (typeof readArtifact !== "function") return loaded;
  const legalInventory = unwrap(artifacts.legal_doc_inventory);
  for (const doc of legalDocumentsFromInventory(legalInventory)) {
    const artifactName = doc.artifact_name || doc.legal_doc_artifact_name || `legal_doc_${doc.doc_type || "other"}`;
    if (!artifactName || loaded[artifactName]) continue;
    try { loaded[artifactName] = await readArtifact({ artifact_name: artifactName }); } catch { loaded[artifactName] = null; }
  }
  return loaded;
}

function sourceInventoryRow({ run, artifactName, sourceRoot, source, sourceClass, sourceStatus, sourceFamilyIndex, docType = "", legalDocInventoryLink = "" }) {
  const sourceId = source.source_id || source.manifest_id || legalDocInventoryLink || artifactName;
  return { run_id: run?.run_id || "", source_artifact: artifactName, source_root: sourceRoot, source_id: sourceId, source_url: source.canonical_url || source.url || source.final_url || "", doc_type: docType || source.doc_type || "", source_class: sourceClass, available_for_indexing: sourceStatus === "AVAILABLE" || sourceStatus === "EXTRACTED" || sourceStatus === "LOCKED", source_status: sourceStatus, neutral_bucket_tags: neutralBucketTagsForSource({ sourceRoot, source }), lossless_text_pointer: { artifact_name: artifactName, source_id: sourceId, text_field: "lossless_text" }, legal_doc_inventory_link: legalDocInventoryLink, index_contains_lossless_text: false };
}
function locatorRow({ row, text, unitType, headingPath, start, end }) { return { source_inventory_id: row.source_inventory_id || "", source_artifact: row.source_artifact, source_id: row.source_id, source_url: row.source_url, source_root: row.source_root, doc_type: row.doc_type || "", unit_type: unitType, heading_path: headingPath.map(cleanHeading).filter(Boolean).slice(0, 6), section_label: cleanHeading(headingPath.at(-1) || unitType), char_range: { start: Number(start) || 0, end: Math.max(Number(end) || 0, Number(start) || 0) }, text_hash: text ? `sha256:${createHash("sha256").update(text).digest("hex")}` : "", lossless_text_pointer: row.lossless_text_pointer, index_contains_lossless_text: false };
}
function routeRow({ locator, profileIndex }) { return { profile_index: profileIndex, locator_id: locator.locator_id, source_artifact: locator.source_artifact, source_id: locator.source_id, source_url: locator.source_url, source_root: locator.source_root, doc_type: locator.doc_type, route_class: routeClass({ locator, profileIndex }), access_rule: "READ_ONLY_BY_LOCATOR", priority_default: defaultPriority({ locator, profileIndex }), heading_path: locator.heading_path, char_range: locator.char_range, lossless_text_pointer: locator.lossless_text_pointer, domain_overlay_slots: [], capability_overlay_slots: [], regulatory_overlay_slots: [], overlay_status: "CANDIDATE_ONLY_PHASE_2", index_contains_lossless_text: false };
}
function stripRouteForIndex(route) { return { route_id: route.route_id, locator_id: route.locator_id, source_artifact: route.source_artifact, source_id: route.source_id, source_url: route.source_url, source_root: route.source_root, doc_type: route.doc_type, route_class: route.route_class, access_rule: route.access_rule, heading_path: route.heading_path, char_range: route.char_range, lossless_text_pointer: route.lossless_text_pointer, semantic_labels: route.semantic_navigation?.semantic_labels || [], reading_priority: route.semantic_navigation?.reading_priority || route.priority_default, field_family_relevance: route.semantic_navigation?.field_family_relevance || [], overlay_candidate_tags: route.semantic_navigation?.domain_overlay_candidate_tags || [], index_contains_lossless_text: false }; }
function routeProfilesForLocator(locator) { if (locator.source_artifact?.startsWith("legal_doc_")) return PROFILE_BY_DOC_TYPE[locator.doc_type || "other"] || PROFILE_BY_DOC_TYPE.other; return PROFILE_BY_ROOT[locator.source_root] || []; }
function routeClass({ locator, profileIndex }) { const root = locator.source_root || "unknown"; const doc = locator.doc_type ? `${locator.doc_type}_` : ""; return `${profileIndex.replace(/_source_index$/, "").toUpperCase()}_${doc}${root}_ROUTE`.replace(/[^A-Z0-9_]+/g, "_"); }
function defaultPriority({ locator, profileIndex }) { if (profileIndex === "legal_governance_source_index" && locator.source_artifact?.startsWith("legal_doc_")) return "PRIMARY"; if (profileIndex === "data_provenance_source_index" && ["privacy_data_processing", "security_trust", "trust_compliance", "docs_api_data_flow"].includes(locator.source_root)) return "PRIMARY"; if (profileIndex === "activity_profile_source_index" && ["product_service", "platform_feature_solution", "technical_docs_api_developer"].includes(locator.source_root)) return "PRIMARY"; if (profileIndex === "target_profile_source_index" && ["homepage_landing", "about_company", "legal_identity_notice"].includes(locator.source_root)) return "PRIMARY"; return "SECONDARY"; }
function semanticLabelsForRoute(route) { const text = `${route.source_root} ${route.doc_type} ${(route.heading_path || []).join(" ")} ${route.source_url}`.toLowerCase(); const labels = []; if (/retention|delete|deletion|erasure|retain/.test(text)) labels.push("retention_deletion_route_candidate"); if (/privacy|personal|data|dpa|processor|controller|subprocessor|cookie/.test(text)) labels.push("privacy_data_route_candidate"); if (/security|soc|iso|incident|breach|encryption|trust/.test(text)) labels.push("security_trust_route_candidate"); if (/terms|agreement|law|court|dispute|liability|warranty|aup|acceptable/.test(text)) labels.push("legal_terms_route_candidate"); if (/api|docs|developer|sdk|webhook|authentication|model/.test(text)) labels.push("technical_docs_route_candidate"); if (/pricing|plan|enterprise|commercial|sales/.test(text)) labels.push("commercial_route_candidate"); if (/product|feature|solution|platform|integration/.test(text)) labels.push("activity_route_candidate"); if (/about|company|contact|legal-notice|imprint/.test(text)) labels.push("target_identity_route_candidate"); return labels.length ? [...new Set(labels)] : ["generic_route_candidate"]; }
function priorityForRoute(route, labels) { if (route.priority_default === "PRIMARY") return "HIGH"; if (labels.some((label) => !label.startsWith("generic"))) return "MEDIUM"; return "LOW"; }
function fieldFamiliesForRoute(route, labels) { const families = new Set(); if (route.profile_index === "target_profile_source_index") families.add("TARGET"); if (route.profile_index === "activity_profile_source_index") families.add("ACTIVITY"); if (route.profile_index === "data_provenance_source_index") families.add("DATA"); if (route.profile_index === "legal_governance_source_index") families.add("LEGAL"); for (const label of labels) { if (label.includes("retention")) families.add("RET"); if (label.includes("security")) families.add("SEC"); if (label.includes("privacy")) families.add("PRIVACY"); if (label.includes("technical")) families.add("TECH"); if (label.includes("commercial")) families.add("COMMERCIAL"); } return [...families]; }
function overlayTagsForRoute(route, labels) { const tags = new Set(); const text = `${route.source_root} ${route.doc_type} ${(route.heading_path || []).join(" ")} ${route.source_url}`.toLowerCase(); if (/ai|model|agent|llm/.test(text)) tags.add("ai-native"); if (/api|developer|sdk|webhook/.test(text)) tags.add("developer-tools"); if (/privacy|data|gdpr|dpa|cookie/.test(text) || labels.some((label) => label.includes("privacy"))) tags.add("privacy"); if (/security|trust|soc|iso/.test(text)) tags.add("security"); if (/payment|bank|kyc|credit/.test(text)) tags.add("fintech"); if (/health|clinical|patient|hipaa/.test(text)) tags.add("healthtech"); return [...tags]; }
function routeIntegrityPass(route) { return Boolean(route.locator_id && route.source_artifact && route.lossless_text_pointer?.artifact_name); }
function groupRoutes(routes) { const groups = {}; for (const route of routes) { const key = route.route_class || "GENERIC_ROUTE"; if (!groups[key]) groups[key] = { route_group_id: key, route_count: 0, route_ids: [] }; groups[key].route_count += 1; groups[key].route_ids.push(route.route_id); } return Object.values(groups).sort((a, b) => a.route_group_id.localeCompare(b.route_group_id)); }
function detectHeadingLocators(text) { const lines = String(text || "").split(/\r?\n/); const headings = []; let offset = 0; for (let i = 0; i < lines.length; i += 1) { const raw = lines[i] || ""; const trimmed = raw.trim(); const looksHeading = trimmed.length >= 3 && trimmed.length <= 120 && (/^#{1,4}\s+/.test(trimmed) || /^[A-Z][A-Za-z0-9 ,/&()\-:]{2,}$/.test(trimmed) || /^\d+(\.\d+)*\s+/.test(trimmed)); if (looksHeading) { const start = offset; const end = Math.min(text.length, start + raw.length + Math.max(300, raw.length)); headings.push({ heading_path: [trimmed.replace(/^#{1,4}\s+/, "")], start, end }); } offset += raw.length + 1; } return headings; }
function findSourceForInventoryRow({ artifact, row }) { const sources = Array.isArray(artifact?.sources) ? artifact.sources : []; return sources.find((source) => (source.source_id || source.manifest_id) === row.source_id) || sources.find((source) => (source.canonical_url || source.url || source.final_url || "") === row.source_url) || artifact || {}; }
function legalDocumentsFromInventory(inventory = {}) { return inventory.documents_found || inventory.legal_documents || inventory.documents || inventory.docs || []; }
function neutralBucketTagsForSource({ sourceRoot, source }) { return [...new Set([...(Array.isArray(source.neutral_bucket_tags) ? source.neutral_bucket_tags : []), ...(Array.isArray(source.buckets) ? source.buckets : []), sourceRoot].filter(Boolean))]; }
function buildInventoryGaps({ artifacts, rootEntries, rows }) { const gaps = []; if (!rootEntries.length) gaps.push({ gap_id: "P2.GAP.ROOTS", status: "MISSING", message: "No lossless_root__ artifacts were available for cartography indexing." }); if (!rows.some((row) => row.source_class === "legal_doc")) gaps.push({ gap_id: "P2.GAP.LEGAL_DOCS", status: "MISSING_OR_NOT_DISCOVERED", message: "No legal_doc inventory rows were available for legal governance indexing." }); if (!artifacts.source_discovery_handoff) gaps.push({ gap_id: "P2.GAP.HANDOFF", status: "MISSING", message: "source_discovery_handoff was not available." }); return gaps; }
function countBy(rows, key) { return rows.reduce((acc, row) => { const value = row[key] || "UNKNOWN"; acc[value] = (acc[value] || 0) + 1; return acc; }, {}); }
function containsForbiddenEvidence(value) { if (!value || typeof value !== "object") return false; if (Array.isArray(value)) return value.some(containsForbiddenEvidence); for (const [key, inner] of Object.entries(value)) { if (["lossless_text", "clean_text", "text", "excerpt", "snippet", "summary", "profile_answer", "legal_conclusion", "compliance_conclusion", "risk_conclusion"].includes(key)) return true; if (containsForbiddenEvidence(inner)) return true; } return false; }
function baseArtifact({ run, artifact_type, layer_id, ...rest }) { return { artifact_type, cartography_phase_id: CARTOGRAPHY_INDEX_CONTRACT.central_phase_id, layer_id, run_id: run?.run_id || "", status: "LOCKED", navigation_only: true, contains_lossless_text: false, contains_excerpts: false, contains_summaries: false, contains_profile_answers: false, contains_legal_or_compliance_conclusions: false, domain_lock_allowed: false, ...rest }; }
function navigationOnlyPolicy() { return { navigation_only: true, contains_lossless_text: false, contains_excerpts: false, contains_summaries: false, contains_profile_answers: false, contains_legal_or_compliance_conclusions: false, domain_lock_allowed: false, downstream_free_read_allowed: false }; }
function unwrap(value) { return value?.artifact && typeof value.artifact === "object" ? value.artifact : value || {}; }
function cleanHeading(value) { return String(value || "").replace(/\s+/g, " ").trim().slice(0, 160); }
function resolveJobStatus(output) { return Object.values(output || {}).some((artifact) => artifact?.status === "REPAIR_REQUIRED" || artifact?.validation_status === "FAIL") ? "REPAIR_REQUIRED" : "LOCKED"; }
