export const M9_DETERMINISTIC_ARTIFACT_NAME = "legal_cartography_deterministic_map";

const LEGAL_SOURCE_ROOTS = Object.freeze(["lossless_root__legal_identity_notice", "lossless_root__privacy_data_processing", "lossless_root__security_trust", "lossless_root__trust_compliance", "lossless_root__contact_notice", "lossless_root__technical_docs_api_developer", "lossless_root__docs_api_data_flow"]);
const LEGAL_DOC_CONTROL_ARTIFACTS = Object.freeze(["legal_doc_inventory", "legal_doc_extraction_index", "legal_doc_lossless_validation_manifest"]);
const CONTROL_LANGUAGE_FAMILIES = Object.freeze(["FORMATION_CONTRACT", "ACTIVITY_SPECIFIC_DISCLOSURE", "DATA_PRIVACY", "VENDORS_TRANSFER", "SECURITY", "USE_SAFETY", "AGENT_AUTHORITY", "IP_CONTENT", "COMMERCIAL_LEGAL_ALLOCATION", "CONTACT_ROUTES", "INDEMNITY", "UNKNOWN_CONTROL_LANGUAGE"]);

export function buildM9DeterministicMap({ run = {}, artifacts = {} } = {}) {
  const sourceDiscovery = unwrapArtifact(artifacts.source_discovery_handoff);
  const runId = run.run_id || sourceDiscovery?.run_id || findRunId(artifacts) || "UNKNOWN_RUN";
  const targetUrl = run.target_url || sourceDiscovery?.target_url || "";
  const sourceArtifactsRead = [];
  const documentMap = [];
  const macroUnitMap = [];
  const embeddedUnitMap = [];
  const controlLanguageCandidateMap = [];
  const noticeCandidateMap = [];
  const missingSourceMap = [];
  const semanticLabelQueue = [];
  const qualityRepairQueue = [];
  const legalSources = collectLegalGovernanceSources(artifacts);

  for (const route of legalSources.routes) sourceArtifactsRead.push(route);
  for (const source of legalSources.sources) ingestSource({ source, documentMap, macroUnitMap, embeddedUnitMap, controlLanguageCandidateMap, noticeCandidateMap, semanticLabelQueue, qualityRepairQueue });
  for (const gap of legalSources.gaps) missingSourceMap.push(gap);

  const status = !documentMap.length ? "CONTROLLED_FAILURE" : qualityRepairQueue.length || missingSourceMap.length ? "LOCKED_WITH_LIMITATIONS" : "LOCKED";
  return { [M9_DETERMINISTIC_ARTIFACT_NAME]: { run_id: runId, target_url: targetUrl, generated_by: "phase_owned_m9_deterministic_layer", schema_version: "M9_DETERMINISTIC_LEGAL_STACK_INDEX_v9_PHASE2_NEW_INPUT_CONTRACT", model_used: false, artifact_role: "Indexes loaded legal/governance documents and creates semantic locator queue from the Phase 1 common-root and legal_doc source contract.", active_registry_context: { active_registry_domain: "AI_PRODUCT_LEGAL_EXPOSURE", registry_row_id_schema: "{ARCHETYPE}_{SUBCAT}_{VARIANT}", archetype_gate_owned_by: "ACTIVITY_PROFILE_REVIEW", surface_gate_owned_by: "ACTIVITY_PROFILE_REVIEW_AND_DATA_PROVENANCE_PROFILE", subcat_relevance_owned_by: "LEGAL_CARTOGRAPHY_INDEX", row_status_owned_by: "EXPOSURE_PROFILE", m9_role: "legal_stack_navigation_and_semantic_label_support_only", registry_application_forbidden_in_layer_1: true }, deterministic_vocabularies: { control_language_family_vocab: [...CONTROL_LANGUAGE_FAMILIES], semantic_queue_priority_vocab: ["P0", "P1", "P2", "P3"] }, source_text_policy: { source_artifacts_remain_source_of_truth: true, full_legal_text_copied_into_map: false, full_control_text_copied_into_map: false, downstream_must_use_navigation_pointers_to_read_source_text: true }, source_artifacts_read: sourceArtifactsRead, artifact_inventory_map: documentMap.map((row) => ({ artifact_id: row.document_id, document_id: row.document_id, document_name: row.document_or_artifact, artifact_class: row.artifact_class, source_url: row.source, source_artifact_name: row.source_artifact_name, boundary_note: "Document inventory only." })), legal_document_index: documentMap.map((row) => ({ document_id: row.document_id, document_title: row.document_or_artifact, artifact_class: row.artifact_class, source_url: row.source, source_corpus_status: row.source_corpus_status, macro_unit_count: macroUnitMap.filter((unit) => unit.document_id === row.document_id).length })), macro_unit_map: macroUnitMap, embedded_unit_map: embeddedUnitMap, notice_candidate_map: noticeCandidateMap, control_language_candidate_map: controlLanguageCandidateMap, indemnity_candidate_map: controlLanguageCandidateMap.filter((row) => row.control_language_family_candidate === "INDEMNITY"), legal_notice_contact_signal_map: noticeCandidateMap.map((row) => ({ signal_id: `${row.notice_id}.CONTACT`, document_id: row.document_id, unit_id: row.unit_id, signal_type: "NOTICE_OR_CONTACT_ROUTE", source_corpus_status: row.source_corpus_status, navigation_pointer: row.navigation_pointer })), liability_cap_signal_map: [], sla_support_signal_map: [], cross_document_reference_map: [], artifact_absence_access_map: missingSourceMap, missing_source_map: missingSourceMap, semantic_label_queue: semanticLabelQueue, legal_governance_source_coverage: { input_contract: "phase1_common_roots_plus_legal_doc_artifacts", source_artifact_count: sourceArtifactsRead.length, loaded_document_count: documentMap.length, macro_unit_count: macroUnitMap.length, embedded_unit_count: embeddedUnitMap.length, semantic_label_queue_count: semanticLabelQueue.length, missing_or_limited_count: missingSourceMap.length }, cartography_limitations: buildLimitations({ documentMap, missingSourceMap, qualityRepairQueue }), document_map: documentMap, section_map: macroUnitMap, referenced_document_map: [], quality_repair_queue: qualityRepairQueue, downstream_rules: { m9_deterministic_layer_only: true, legal_stack_index_only: true, semantic_queue_is_authoritative_for_semantic_coverage: true, no_new_url_discovery: true, no_new_extraction: true, use_only_loaded_phase1_legal_doc_and_common_root_sources: true, map_not_parallel_evidence: true, semantic_labels_pending: true, phase7_data_provenance_is_active_dap_source: true, old_family_input_contract_forbidden: true, m10_4b_4c_not_active: true }, status, lock_status: status } };
}

function collectLegalGovernanceSources(artifacts = {}) {
  const sources = [];
  const routes = [];
  const gaps = [];
  for (const artifactName of LEGAL_SOURCE_ROOTS) {
    const artifact = unwrapArtifact(artifacts[artifactName]);
    const rows = collectSourcesFromArtifact({ artifactName, artifact, sourceClass: "common_root", docType: artifactName.replace(/^lossless_root__/, "") });
    routes.push(readSummaryForArtifact({ artifactName, artifact, sourceCount: rows.length, sourceClass: "common_root" }));
    if (!rows.length) gaps.push(missingSourceRow({ artifactName, reason: "No loaded source rows in Phase 1 common-root artifact." }));
    sources.push(...rows);
  }
  for (const artifactName of LEGAL_DOC_CONTROL_ARTIFACTS) routes.push(readSummaryForArtifact({ artifactName, artifact: unwrapArtifact(artifacts[artifactName]), sourceCount: 0, sourceClass: "legal_doc_control" }));
  const inventory = unwrapArtifact(artifacts.legal_doc_inventory);
  const docs = legalDocumentsFromInventory(inventory);
  if (!docs.length) gaps.push(missingSourceRow({ artifactName: "legal_doc_inventory", reason: "No legal_doc inventory rows available." }));
  for (const doc of docs) {
    const artifactName = doc.artifact_name || doc.legal_doc_artifact_name || (doc.doc_type ? `legal_doc_${normalizeSlug(doc.doc_type)}` : "");
    if (!artifactName) continue;
    const artifact = unwrapArtifact(artifacts[artifactName]);
    const docType = normalizeSlug(doc.doc_type || artifact.doc_type || artifact.document_type || artifactName.replace(/^legal_doc_/, ""));
    const rows = collectSourcesFromArtifact({ artifactName, artifact, fallback: doc, sourceClass: "legal_doc", docType });
    routes.push(readSummaryForArtifact({ artifactName, artifact, sourceCount: rows.length, sourceClass: "legal_doc" }));
    if (!rows.length) gaps.push(missingSourceRow({ artifactName, reason: "Legal document artifact listed in inventory but not loaded." }));
    sources.push(...rows);
  }
  return { sources: dedupeSources(sources), routes, gaps };
}

function collectSourcesFromArtifact({ artifactName, artifact, fallback = {}, sourceClass, docType }) {
  const rows = [];
  if (artifact && Array.isArray(artifact.sources)) artifact.sources.forEach((source, index) => rows.push(normalizeSource({ artifactName, source, fallback, index, sourceClass, docType })));
  else if (artifact && typeof artifact === "object") {
    const text = sourceText(artifact) || sourceText(fallback);
    const hasData = text || artifact.url || artifact.final_url || artifact.canonical_url || artifact.source_url || artifact.title || artifact.page_title || artifact.document_title;
    if (hasData) rows.push(normalizeSource({ artifactName, source: artifact, fallback, index: 0, sourceClass, docType }));
  }
  if (!rows.length && fallback && typeof fallback === "object" && Object.keys(fallback).length) rows.push(normalizeSource({ artifactName, source: fallback, fallback, index: 0, sourceClass, docType }));
  return rows;
}

function ingestSource(ctx) {
  const { source, documentMap, macroUnitMap, embeddedUnitMap, controlLanguageCandidateMap, noticeCandidateMap, semanticLabelQueue, qualityRepairQueue } = ctx;
  const text = String(source.lossless_text || "");
  const artifactName = source.source_artifact_name || source.adapter_source_artifact || "unknown_source_artifact";
  const sourceId = source.source_id || `${artifactName}.SRC.001`;
  const documentId = makeId(sourceId);
  const sourceUrl = source.final_url || source.url || source.canonical_url || "";
  const title = firstHeading(text) || source.title || source.page_title || slug(sourceUrl) || documentId;
  const artifactClass = inferArtifactClass({ title, sourceUrl, text });
  const pointer = { source_artifact_name: artifactName, source_id: sourceId, text_field: "lossless_text", sha256: source.sha256 || "", char_count: text.length };
  documentMap.push({ document_id: documentId, artifact_id: documentId, document_or_artifact: title, artifact_class: artifactClass, artifact_family: source.source_class || source.doc_type || "legal_governance_source", source_artifact_name: artifactName, source: sourceUrl, source_url: sourceUrl, source_type: source.source_class === "legal_doc" ? "LEGAL_DOC_ARTIFACT" : "COMMON_ROOT", source_corpus_status: "FOUND_AS_PRIMARY_SOURCE", status: "FOUND_INDEXED", document_role: source.materiality || "Loaded legal/governance source.", navigation_pointer: pointer, limitation: text ? "" : "Loaded source has no lossless_text available." });
  if (!text) qualityRepairQueue.push({ repair_type: "MISSING_LOSSLESS_TEXT", document_id: documentId, source_artifact: artifactName, pointer: sourceId, reason: "Source row exists but lossless_text is empty." });
  const units = extractUnits({ artifactName, documentId, sourceUrl, text, title, pointer });
  units.forEach((unit) => {
    macroUnitMap.push(unit);
    if (["ANNEXURE", "SCHEDULE", "APPENDIX", "ADDENDUM", "EXHIBIT"].includes(unit.unit_type)) embeddedUnitMap.push({ embedded_unit_id: unit.unit_id, section_id: unit.section_id, document_id: unit.document_id, internal_unit: unit.heading_label, unit_type: unit.unit_type, artifact_class: "HOSTED_LEGAL_ARTIFACT", source: sourceUrl, source_type: "EMBEDDED_UNIT", source_corpus_status: "FOUND_EMBEDDED_IN_LEGAL_CORPUS", status: "FOUND_EMBEDDED_IN_LEGAL_CORPUS", navigation_pointer: unit.location_reference, limitation: "Embedded unit indexed inside host document." });
    if (/contact|notice|grievance|redressal|privacy/i.test(unit.heading_label)) noticeCandidateMap.push({ notice_id: `${unit.unit_id}.NOTICE`, document_id: unit.document_id, unit_id: unit.unit_id, notice_candidate_label: unit.heading_label, source_corpus_status: "FOUND_EMBEDDED_IN_LEGAL_CORPUS", status: "FOUND_INDEXED", navigation_pointer: unit.location_reference });
    inferControlFamilies(unit.heading_label).forEach((familyLabel) => controlLanguageCandidateMap.push({ control_candidate_id: `${unit.unit_id}.${familyLabel}`, document_id: unit.document_id, unit_id: unit.unit_id, section_id: unit.section_id, control_language_family_candidate: familyLabel, source_corpus_status: "FOUND_EMBEDDED_IN_LEGAL_CORPUS", status: "FOUND_INDEXED", navigation_pointer: unit.location_reference }));
    semanticLabelQueue.push({ queue_id: `M9Q.${String(semanticLabelQueue.length + 1).padStart(3, "0")}`, unit_id: unit.unit_id, section_id: unit.section_id, document_id: unit.document_id, heading_label: unit.heading_label, priority: /privacy|data|security|indemnity|liability|contact|notice|governing|dispute/i.test(unit.heading_label) ? "P1" : "P2", semantic_label_required: /privacy|data|security|indemnity|liability|contact|notice|governing|dispute/i.test(unit.heading_label), navigation_pointer: unit.location_reference });
  });
}

function normalizeSource({ artifactName, source, fallback, index, sourceClass, docType }) {
  const text = sourceText(source) || sourceText(fallback);
  const url = source.final_url || source.canonical_url || source.url || source.source_url || fallback.final_url || fallback.canonical_url || fallback.url || fallback.source_url || "";
  const sourceId = source.source_id || source.manifest_id || source.doc_id || fallback.source_id || fallback.doc_id || `${artifactName}.SRC.${String(index + 1).padStart(3, "0")}`;
  return { source_id: sourceId, final_url: url, url, canonical_url: source.canonical_url || fallback.canonical_url || url, title: source.title || source.page_title || source.document_title || fallback.title || fallback.document_title || titleFromArtifactName(artifactName), page_title: source.page_title || source.title || fallback.title || "", doc_type: docType || source.doc_type || fallback.doc_type || "", materiality: source.materiality || fallback.materiality || "Legal/governance source mapped from Phase 1 source contract.", sha256: source.sha256 || source.content_sha256 || fallback.sha256 || "", lossless_text: text, source_artifact_name: artifactName, source_class: sourceClass };
}
function extractUnits({ artifactName, documentId, sourceUrl, text, title, pointer }) { const lines = String(text || title || "Document").split(/\n+/).map((line) => line.trim()).filter(Boolean); const headings = lines.filter((line) => line.length < 120 && (/^\d+(\.\d+)*\s+/.test(line) || /^[A-Z][A-Za-z\s/&-]{3,}$/.test(line))).slice(0, 40); const selected = headings.length ? headings : [title || "Document Overview"]; return selected.map((heading, index) => ({ unit_id: `${documentId}.U${String(index + 1).padStart(3, "0")}`, section_id: `${documentId}.S${String(index + 1).padStart(3, "0")}`, document_id: documentId, heading_label: heading.slice(0, 100), internal_unit: heading.slice(0, 100), unit_type: inferUnitType(heading), heading_level: 1, source: sourceUrl, status: "FOUND_INDEXED", source_artifact_name: artifactName, location_reference: { ...pointer, heading: heading.slice(0, 100), heading_index: index } })); }
function inferControlFamilies(text) { const raw = String(text || "").toLowerCase(); const out = []; if (/privacy|data|subprocessor|retention|deletion|consent/.test(raw)) out.push("DATA_PRIVACY"); if (/security|trust|vulnerability|incident/.test(raw)) out.push("SECURITY"); if (/indemn/.test(raw)) out.push("INDEMNITY"); if (/liability|limitation|damages/.test(raw)) out.push("COMMERCIAL_LEGAL_ALLOCATION"); if (/contact|notice|grievance|redressal/.test(raw)) out.push("CONTACT_ROUTES"); if (/acceptable|use|content|safety|ai/.test(raw)) out.push("USE_SAFETY"); return out.length ? out : ["UNKNOWN_CONTROL_LANGUAGE"]; }
function readSummaryForArtifact({ artifactName, artifact, sourceCount, sourceClass }) { return { artifact_name: artifactName, present: Boolean(artifact), source_class: sourceClass, source_count: sourceCount, storage_mode: artifact?.storage_mode || "PHASE1_SOURCE_CONTRACT" }; }
function buildLimitations({ documentMap, missingSourceMap, qualityRepairQueue }) { return [...missingSourceMap.map((row) => row.limitation || row.reason), ...qualityRepairQueue.map((row) => row.reason)].filter(Boolean).map((limitation, index) => ({ limitation_id: `M9-LIM-${String(index + 1).padStart(3, "0")}`, limitation, blocking: false })); }
function missingSourceRow({ artifactName, reason }) { return { missing_id: `${artifactName}.MISSING`, missing_or_limited_item: artifactName, expected_location: "Phase 1 common-root/legal-doc source contract", source_type: "ABSENT_SOURCE", source_corpus_status: "STANDALONE_SOURCE_ABSENT", artifact_class: "UNKNOWN_LEGAL_ARTIFACT", downstream_effect: "REVIEW_WITH_LIMITATION", status: "STANDALONE_SOURCE_ABSENT", reason, limitation: reason, blocking: false }; }
function inferArtifactClass({ title, sourceUrl, text }) { const raw = `${title} ${sourceUrl} ${String(text || "").slice(0, 500)}`.toLowerCase(); if (raw.includes("privacy")) return "PRIVACY_POLICY"; if (raw.includes("terms")) return "TERMS_OF_SERVICE"; if (raw.includes("data processing") || raw.includes("dpa")) return "DATA_PROCESSING_AGREEMENT"; if (raw.includes("security") || raw.includes("trust")) return "SECURITY_POLICY"; if (raw.includes("subprocessor")) return "SUBPROCESSOR_LIST"; if (raw.includes("sla") || raw.includes("support")) return "SLA_SUPPORT_TERMS"; return "HOSTED_LEGAL_ARTIFACT"; }
function inferUnitType(value) { const raw = String(value || "").toLowerCase(); if (/annex|annexure/.test(raw)) return "ANNEXURE"; if (/schedule/.test(raw)) return "SCHEDULE"; if (/appendix/.test(raw)) return "APPENDIX"; if (/addendum/.test(raw)) return "ADDENDUM"; if (/notice|contact|grievance/.test(raw)) return "NOTICE"; return "SECTION"; }
function firstHeading(text) { return String(text || "").split(/\n+/).map((line) => line.trim()).find((line) => line && line.length < 100) || ""; }
function slug(value) { try { return new URL(String(value || "")).pathname.split("/").filter(Boolean).at(-1) || ""; } catch { return ""; } }
function makeId(value) { return String(value || "DOC").replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 80) || "DOC"; }
function legalDocumentsFromInventory(inventory = {}) { const docs = inventory.documents_found || inventory.legal_documents || inventory.documents || inventory.docs || []; return Array.isArray(docs) ? docs : []; }
function sourceText(value = {}) { return String(value.lossless_text || value.clean_text || value.text || value.raw_text || value.content || value.markdown || ""); }
function normalizeSlug(value) { return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "other"; }
function titleFromArtifactName(artifactName) { return String(artifactName || "Legal Document").replace(/^legal_doc_/, "").replace(/^lossless_root__/, "").replace(/_/g, " "); }
function dedupeSources(sources) { const seen = new Set(); const out = []; for (const source of sources || []) { const key = `${source.source_id || ""}|${source.url || source.final_url || ""}|${source.source_artifact_name || ""}`; if (seen.has(key)) continue; seen.add(key); out.push(source); } return out; }
function unwrapArtifact(value) { return value?.artifact && typeof value.artifact === "object" ? value.artifact : value; }
function findRunId(artifacts) { for (const value of Object.values(artifacts || {})) if (value?.run_id || value?.artifact?.run_id) return value.run_id || value.artifact.run_id; return null; }
