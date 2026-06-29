const LEGAL_GOVERNANCE_FAMILY_ARTIFACTS = Object.freeze([
  "lossless_family__L1_CORE_TERMS_PRIVACY",
  "lossless_family__L2_B2B_CONTRACTING",
  "lossless_family__L3_AI_USAGE_GOVERNANCE",
  "lossless_family__L4_PRIVACY_ADJACENT_NOTICES",
  "lossless_family__L5_LEGAL_HUB_HOSTED",
  "lossless_family__L6_ENTITY_NOTICE"
]);

const REGISTRY_SUBCAT_VOCAB = Object.freeze(["CNS", "LIA", "HAL", "INF", "PRV", "BIO", "DEC", "HRM", "FRD", "TRD"]);
const CONTROL_LANGUAGE_FAMILY_VOCAB = Object.freeze(["FORMATION_CONTRACT", "ACTIVITY_SPECIFIC_DISCLOSURE", "DATA_PRIVACY", "VENDORS_TRANSFER", "SECURITY", "USE_SAFETY", "AGENT_AUTHORITY", "IP_CONTENT", "COMMERCIAL_LEGAL_ALLOCATION", "CONTACT_ROUTES", "INDEMNITY", "UNKNOWN_CONTROL_LANGUAGE"]);
const UNIT_TYPE_VOCAB = Object.freeze(["DOCUMENT_TITLE", "SECTION", "SUBSECTION", "ANNEXURE", "SCHEDULE", "APPENDIX", "ADDENDUM", "EXHIBIT", "NOTICE"]);
const MAX_UNITS_PER_SOURCE = 90;
const MAX_QUEUE_PER_SOURCE = 30;

export const M9_DETERMINISTIC_ARTIFACT_NAME = "legal_cartography_deterministic_map";

export function buildM9DeterministicMap({ run = {}, artifacts = {} } = {}) {
  const sourceDiscovery = unwrapArtifact(artifacts.source_discovery_handoff);
  const runId = run.run_id || sourceDiscovery?.run_id || findRunId(artifacts) || "UNKNOWN_RUN";
  const targetUrl = run.target_url || sourceDiscovery?.target_url || "";

  const sourceArtifactsRead = [];
  const documentMap = [];
  const artifactInventoryMap = [];
  const legalDocumentIndex = [];
  const macroUnitMap = [];
  const embeddedUnitMap = [];
  const noticeCandidateMap = [];
  const controlLanguageCandidateMap = [];
  const indemnityCandidateMap = [];
  const crossDocumentReferenceMap = [];
  const artifactAbsenceAccessMap = [];
  const missingSourceMap = [];
  const semanticLabelQueue = [];
  const qualityRepairQueue = [];

  for (const artifactName of LEGAL_GOVERNANCE_FAMILY_ARTIFACTS) {
    const family = unwrapArtifact(artifacts[artifactName]);
    sourceArtifactsRead.push(readSummaryForFamily({ artifactName, family }));
    ingestFamily({ artifactName, family, documentMap, artifactInventoryMap, legalDocumentIndex, macroUnitMap, embeddedUnitMap, noticeCandidateMap, controlLanguageCandidateMap, indemnityCandidateMap, crossDocumentReferenceMap, artifactAbsenceAccessMap, missingSourceMap, semanticLabelQueue, qualityRepairQueue });
  }

  const mapStatus = !documentMap.length ? "CONTROLLED_FAILURE" : qualityRepairQueue.length ? "LOCKED_WITH_LIMITATIONS" : "LOCKED";

  return {
    [M9_DETERMINISTIC_ARTIFACT_NAME]: {
      run_id: runId,
      target_url: targetUrl,
      generated_by: "m9_hybrid_deterministic_layer",
      schema_version: "M9_DETERMINISTIC_LEGAL_STACK_INDEX_v6",
      model_used: false,
      artifact_role: "Indexes loaded legal/governance documents at document, section, subsection, and annexure/schedule levels only.",
      active_registry_context: {
        active_registry_domain: "AI_PRODUCT_LEGAL_EXPOSURE",
        registry_row_id_schema: "{ARCHETYPE}_{SUBCAT}_{VARIANT}",
        archetype_gate_owned_by: "M8_TARGET_FEATURE_PROFILE",
        surface_gate_owned_by: "M8_TARGET_FEATURE_PROFILE_AND_M10_DATA_PROVENANCE",
        subcat_relevance_owned_by: "M9_SEMANTIC_LAYER",
        row_status_owned_by: "M11_EXPOSURE_REGISTRY",
        m9_role: "legal_stack_navigation_and_semantic_label_support_only",
        registry_application_forbidden_in_layer_1: true
      },
      deterministic_vocabularies: {
        registry_subcat_vocab: [...REGISTRY_SUBCAT_VOCAB],
        control_language_family_vocab: [...CONTROL_LANGUAGE_FAMILY_VOCAB],
        unit_type_vocab: [...UNIT_TYPE_VOCAB],
        semantic_queue_priority_vocab: ["P0", "P1", "P2", "P3"]
      },
      source_text_policy: {
        lossless_artifacts_remain_source_of_truth: true,
        full_legal_text_copied_into_map: false,
        full_control_text_copied_into_map: false,
        downstream_must_use_navigation_pointers_to_read_lossless_text: true
      },
      deterministic_boundary_rules: {
        maximum_depth: "SUBSECTION",
        clause_level_extraction_disabled: true,
        third_level_numbered_units_disabled: true,
        sentence_fragments_disabled: true,
        page_furniture_disabled: true,
        model_judgment_disabled: true
      },
      source_artifacts_read: sourceArtifactsRead,
      artifact_inventory_map: dedupeRows(artifactInventoryMap, (row) => row.artifact_id),
      legal_document_index: dedupeRows(legalDocumentIndex, (row) => row.document_id),
      macro_unit_map: dedupeRows(macroUnitMap, (row) => row.unit_id),
      embedded_unit_map: dedupeRows(embeddedUnitMap, (row) => row.embedded_unit_id),
      notice_candidate_map: dedupeRows(noticeCandidateMap, (row) => row.notice_id),
      control_language_candidate_map: dedupeRows(controlLanguageCandidateMap, (row) => row.control_candidate_id),
      indemnity_candidate_map: dedupeRows(indemnityCandidateMap, (row) => row.indemnity_candidate_id),
      cross_document_reference_map: dedupeRows(crossDocumentReferenceMap, (row) => row.cross_reference_id),
      artifact_absence_access_map: dedupeRows(artifactAbsenceAccessMap, (row) => row.absence_id),
      semantic_label_queue: dedupeRows(semanticLabelQueue, (row) => row.queue_id),
      legal_governance_source_coverage: {
        source_artifact_count: sourceArtifactsRead.length,
        loaded_document_count: documentMap.length,
        macro_unit_count: macroUnitMap.length,
        embedded_unit_count: embeddedUnitMap.length,
        semantic_label_queue_count: semanticLabelQueue.length,
        missing_or_limited_count: missingSourceMap.length
      },
      cartography_limitations: buildLimitations({ documentMap, macroUnitMap, missingSourceMap, qualityRepairQueue }),
      document_map: dedupeRows(documentMap, (row) => row.document_id),
      section_map: dedupeRows(macroUnitMap, (row) => row.section_id),
      referenced_document_map: [],
      missing_source_map: dedupeRows(missingSourceMap, (row) => row.missing_id),
      quality_repair_queue: dedupeRows(qualityRepairQueue, (row) => [row.repair_type, row.scope, row.pointer || row.document_id || row.source_artifact].join("|")),
      downstream_rules: {
        m9_deterministic_layer_only: true,
        legal_stack_index_only: true,
        semantic_queue_is_authoritative_for_semantic_coverage: true,
        clause_level_units_disabled: true,
        no_new_url_discovery: true,
        no_new_extraction: true,
        use_only_loaded_legal_corpus: true,
        map_not_parallel_evidence: true,
        semantic_labels_pending: true
      },
      status: mapStatus,
      lock_status: mapStatus
    }
  };
}

function ingestFamily(ctx) {
  const { artifactName, family } = ctx;
  if (!family || typeof family !== "object") {
    pushMissing(ctx, missingFamilyRow({ artifactName, reason: "Family artifact was not supplied." }));
    return;
  }
  for (const source of asArray(family.sources)) ingestSource({ ...ctx, source });
  for (const row of asArray(family.missing_limited_primary_sources)) pushMissing(ctx, missingRowFromSource({ artifactName, row, status: "STANDALONE_SOURCE_ABSENT" }));
  for (const row of asArray(family.rejected_sources)) pushMissing(ctx, missingRowFromSource({ artifactName, row, status: "SOURCE_REJECTED_OR_FAILED" }));
  for (const row of asArray(family.manifest_only_sources)) pushMissing(ctx, missingRowFromSource({ artifactName, row, status: "REFERENCED_BUT_NOT_FETCHED" }));
  for (const row of asArray(family.metadata_only_sources)) pushMissing(ctx, missingRowFromSource({ artifactName, row, status: "UNKNOWN_NOT_SEARCHED" }));
}

function ingestSource(ctx) {
  const { artifactName, family, source, documentMap, artifactInventoryMap, legalDocumentIndex, macroUnitMap, embeddedUnitMap, noticeCandidateMap, controlLanguageCandidateMap, indemnityCandidateMap, crossDocumentReferenceMap, semanticLabelQueue, qualityRepairQueue } = ctx;
  const text = String(source?.lossless_text || "");
  const sourceId = source.source_id || `${family.root_family || stripLosslessPrefix(artifactName)}.SRC.${String(documentMap.length + 1).padStart(3, "0")}`;
  const documentId = makeId(sourceId);
  const sourceUrl = source.final_url || source.url || source.canonical_url || "";
  const title = deriveDocumentTitle({ source, text });
  const artifactClass = inferArtifactClass({ source, title, sourceUrl, textHead: text.slice(0, 1000) });
  const rootFamily = source.root_family || family.root_family || family.artifact_name || stripLosslessPrefix(artifactName);
  const textPointer = { lossless_artifact_name: artifactName, source_id: sourceId, text_field: "lossless_text", sha256: source.sha256 || "", char_count: text.length };

  const documentRow = stripEmpty({ document_id: documentId, artifact_id: documentId, document_or_artifact: title, artifact_class: artifactClass, artifact_family: rootFamily, lossless_artifact_name: artifactName, root_family: rootFamily, source: sourceUrl, source_url: sourceUrl, canonical_url: source.canonical_url || source.url || "", source_type: "URL", source_corpus_status: "FOUND_AS_PRIMARY_SOURCE", status: "FOUND_INDEXED", document_role: source.tier_reason || source.materiality || family.purpose || "Loaded legal/governance source.", version_or_effective_date_signal: extractVersionOrDateSignal(text.slice(0, 1200)), text_pointer: textPointer, limitation: text ? "" : "Loaded source has no lossless_text available." });
  documentMap.push(documentRow);
  artifactInventoryMap.push({ artifact_id: documentId, document_id: documentId, document_name: title, artifact_class: artifactClass, artifact_family: rootFamily, artifact_status: "FOUND_INDEXED", source_url: sourceUrl, canonical_url: source.canonical_url || source.url || "", lossless_artifact_name: artifactName, classification_basis: "SOURCE_URL|TITLE_OR_FIRST_HEADING|LEGAL_ARTIFACT_CLASS_RULE", boundary_note: "Document inventory only." });
  if (!text) {
    qualityRepairQueue.push(repairRow({ repair_type: "MISSING_LOSSLESS_TEXT", scope: "document", document_id: documentId, source_artifact: artifactName, pointer: sourceId, reason: "Source row exists but lossless_text is empty." }));
    return;
  }

  const units = extractMacroUnits({ artifactName, sourceId, documentId, text, artifactClass, title });
  if (!units.length) qualityRepairQueue.push(repairRow({ repair_type: "MACRO_UNIT_MAP_THIN", scope: "document", document_id: documentId, source_artifact: artifactName, pointer: sourceId, reason: "No reliable section or subsection headings were found." }));
  legalDocumentIndex.push({ document_id: documentId, document_title: title, artifact_class: artifactClass, source_url: sourceUrl, source_corpus_status: "FOUND_AS_PRIMARY_SOURCE", macro_unit_count: units.length, macro_unit_ids: units.map((unit) => unit.unit_id), limitation: units.length ? "" : "No reliable section/subsection boundaries were detected." });

  for (const unit of units) {
    macroUnitMap.push(unit);
    if (["ANNEXURE", "SCHEDULE", "APPENDIX", "ADDENDUM", "EXHIBIT"].includes(unit.unit_type)) embeddedUnitMap.push({ embedded_unit_id: unit.unit_id, section_id: unit.section_id, document_id: unit.document_id, host_document_id: unit.document_id, internal_unit: unit.heading_label, unit_type: unit.unit_type, artifact_class: classifyEmbeddedUnit(unit.heading_label), source: sourceUrl, source_type: "EMBEDDED_UNIT", source_corpus_status: "FOUND_EMBEDDED_IN_LEGAL_CORPUS", status: "FOUND_EMBEDDED_IN_LEGAL_CORPUS", navigation_pointer: unit.location_reference, limitation: "Embedded unit indexed inside host document." });
    if (unit.unit_type === "NOTICE" || /^contact|^grievance|^notice$/i.test(unit.heading_label)) noticeCandidateMap.push({ notice_id: `${unit.unit_id}.NOTICE`, document_id: unit.document_id, unit_id: unit.unit_id, notice_candidate_label: unit.heading_label, source_corpus_status: "FOUND_EMBEDDED_IN_LEGAL_CORPUS", status: "FOUND_INDEXED", navigation_pointer: unit.location_reference, boundary_note: "Notice candidate only. Semantic label belongs to canonical M9 instructions." });
    for (const familyLabel of inferControlFamilies(unit.heading_label)) controlLanguageCandidateMap.push({ control_candidate_id: `${unit.unit_id}.${familyLabel}`, document_id: unit.document_id, unit_id: unit.unit_id, section_id: unit.section_id, control_language_family_candidate: familyLabel, source_corpus_status: "FOUND_EMBEDDED_IN_LEGAL_CORPUS", status: "FOUND_INDEXED", navigation_pointer: unit.location_reference, boundary_note: "Control-language candidate only. Semantic confirmation belongs to canonical M9 instructions." });
    if (/indemn/i.test(unit.heading_label)) indemnityCandidateMap.push({ indemnity_candidate_id: `${unit.unit_id}.INDEMNITY`, document_id: unit.document_id, unit_id: unit.unit_id, section_id: unit.section_id, indemnity_clause_location: unit.heading_label, source_corpus_status: "FOUND_EMBEDDED_IN_LEGAL_CORPUS", status: "FOUND_INDEXED", navigation_pointer: unit.location_reference, boundary_note: "Indemnity location candidate only." });
  }

  for (const row of buildSemanticLabelQueue({ units, artifactClass, documentId }).slice(0, MAX_QUEUE_PER_SOURCE)) semanticLabelQueue.push(row);

  let refCount = 0;
  for (const match of text.matchAll(/https?:\/\/[^\s)\]"']+/gi)) {
    if (refCount >= 20) break;
    const url = match[0].replace(/[.,;]+$/, "");
    if (!url || url === sourceUrl) continue;
    refCount += 1;
    crossDocumentReferenceMap.push({ cross_reference_id: `${documentId}.REF.${String(refCount).padStart(3, "0")}`, from_document_id: documentId, to_document_or_policy: url, to_url_or_label: url, reference_type_candidate: "EXTERNAL_URL_REFERENCE", source_type: "REFERENCED_URL", source_corpus_status: "REFERENCED_BUT_NOT_FETCHED", status: "REFERENCED_BUT_NOT_FETCHED", boundary_note: "Reference extracted from loaded text; no new fetch performed." });
  }
}

function extractMacroUnits({ artifactName, sourceId, documentId, text, artifactClass, title }) {
  const lines = text.split(/\r?\n/);
  const candidates = [];
  const titleKey = normalizeComparable(title);
  let titleAdded = false;

  for (let i = 0; i < lines.length; i += 1) {
    const heading = normalizeLine(lines[i]);
    if (!heading) continue;
    const previous = normalizeLine(lines[i - 1]);
    const next = normalizeLine(lines[i + 1]);
    const charStart = charOffsetForLine(lines, i);

    if (!titleAdded && isDocumentTitleLine({ heading, title, titleKey })) {
      candidates.push({ line: i + 1, heading: title, char_start: charStart, unit_type: "DOCUMENT_TITLE" });
      titleAdded = true;
      continue;
    }
    if (normalizeComparable(heading) === titleKey) continue;

    const unitType = classifyStructuralHeading({ heading, previous, next, artifactClass });
    if (unitType) candidates.push({ line: i + 1, heading, char_start: charStart, unit_type: unitType });
  }

  if (!titleAdded && title) candidates.unshift({ line: 1, heading: title, char_start: 0, unit_type: "DOCUMENT_TITLE" });

  const selected = dedupeHeadingRows(candidates).slice(0, MAX_UNITS_PER_SOURCE);
  const units = selected.map((item, index) => {
    const next = selected[index + 1];
    const charEnd = next ? Math.max(item.char_start, next.char_start - 1) : text.length;
    const unitId = `${makeId(sourceId)}.UNIT.${String(index + 1).padStart(3, "0")}`;
    const unitType = item.unit_type;
    return { unit_id: unitId, section_id: unitId, artifact_reference: documentId, document_id: documentId, unit_type: unitType, heading_label: item.heading, heading_level: inferHeadingLevel(unitType), parent_unit_id: "", child_unit_ids: [], relationship_to_host: "HOSTS_UNIT", source_corpus_status: "FOUND_EMBEDDED_IN_LEGAL_CORPUS", status: "FOUND_INDEXED", lossless_artifact_name: artifactName, location_reference: { lossless_artifact_name: artifactName, source_id: sourceId, text_field: "lossless_text", line_start: item.line, line_end: next ? Math.max(item.line, next.line - 1) : lines.length, char_start: item.char_start, char_end: charEnd, char_count: Math.max(0, charEnd - item.char_start) }, extraction_method: unitType === "SECTION" || unitType === "SUBSECTION" ? "HEADING_INDEX" : `${unitType}_PATTERN`, confidence: "DETERMINISTIC_CANDIDATE", boundary_note: "Structural unit pointer only." };
  });

  const stack = [];
  for (const unit of units) {
    const level = Number(unit.heading_level || 0);
    if (level > 0) {
      for (let idx = level; idx < stack.length; idx += 1) stack[idx] = null;
      const parent = [...stack].slice(0, level).reverse().find(Boolean);
      if (parent) {
        unit.parent_unit_id = parent.unit_id;
        parent.child_unit_ids.push(unit.unit_id);
        unit.relationship_to_host = "CHILD_UNIT";
      }
    }
    stack[level] = unit;
  }
  return units;
}

function classifyStructuralHeading({ heading, previous, next, artifactClass }) {
  if (!isStructurallyCleanHeading({ heading, previous, next })) return "";
  if (isEmbeddedUnitHeading(heading)) return inferEmbeddedUnitType(heading);
  if (isSectionMarkerHeading(heading)) return "SECTION";
  if (isSubsectionMarkerHeading(heading)) return "SUBSECTION";
  if (isKnownShortLegalHeading(heading, artifactClass)) return inferNamedHeadingType(heading);
  return "";
}

function isStructurallyCleanHeading({ heading, previous, next }) {
  if (!heading || heading.length < 3 || heading.length > 120) return false;
  if (isPageFurniture(heading)) return false;
  if (isClauseText(heading)) return false;
  if (isThirdLevelOrDeeperNumbering(heading)) return false;
  if (/^[a-z]/.test(heading)) return false;
  if (/^\(?[ivx]+\)?[.)]\s+/i.test(heading)) return false;
  if (previous && /[,;:]$/.test(previous)) return false;
  if (next && /^[a-z]/.test(next)) return false;
  return true;
}

function isClauseText(heading) {
  if (/[.!?]$/.test(heading) && !isEmbeddedUnitHeading(heading)) return true;
  if (/[,:;]$/.test(heading) && !isEmbeddedUnitHeading(heading)) return true;
  if (/^\(?[A-Z\s]+ BELOW\)/.test(heading)) return true;
  if (/^(and|or|to|of|for|from|with|without|than|that|which|below|above|except|unless|under|including|subject to|upon payment|effective when|send written notice|low-traffic periods|if payment|if you|we will|we do|we may|we are|you may|you must|you agree|you retain|deletion will|software,|agreement,|maximum extent)\b/i.test(heading)) return true;
  const words = heading.split(/\s+/).filter(Boolean);
  if (words.length > 10 && !isEmbeddedUnitHeading(heading)) return true;
  if (words.length > 6 && /\b(will|shall|must|may|cannot|agree|retain|provide|completed|access|use|payment|notice|unless|within)\b/i.test(heading)) return true;
  if (/\b(within|at least|business days|auto-renews|written notice|payment fails|removal of|provenance metadata)\b/i.test(heading)) return true;
  return false;
}

function isEmbeddedUnitHeading(heading) { return /^(annexure|schedule|appendix|exhibit|addendum)\s+[a-z0-9]+\b\s*[:.-]?\s+[A-Z][A-Za-z0-9/&()\-\s]{2,100}$/i.test(heading); }
function inferEmbeddedUnitType(heading) { if (/^annexure\b/i.test(heading)) return "ANNEXURE"; if (/^schedule\b/i.test(heading)) return "SCHEDULE"; if (/^appendix\b/i.test(heading)) return "APPENDIX"; if (/^exhibit\b/i.test(heading)) return "EXHIBIT"; return "ADDENDUM"; }
function isSectionMarkerHeading(heading) { return /^(section|article)\s+\d+\s*[:.-]\s+[A-Z][A-Za-z0-9/&()\-\s]{2,90}$/i.test(heading) || /^\d+[.)]\s+[A-Z][A-Za-z0-9/&()\-\s]{2,90}$/.test(heading); }
function isSubsectionMarkerHeading(heading) { return /^\d+\.\d+[.)]?\s+[A-Z][A-Za-z0-9/&()\-\s]{2,90}$/.test(heading) && !isThirdLevelOrDeeperNumbering(heading); }
function isThirdLevelOrDeeperNumbering(heading) { return /^\d+\.\d+\.\d+/.test(heading); }
function isKnownShortLegalHeading(heading, artifactClass) { return isTitleCaseHeading(heading) && knownLegalHeadingPattern().test(heading) && (artifactClass !== "PRIVACY_POLICY" || !/^privacy policy for\b/i.test(heading)); }
function inferNamedHeadingType(heading) { if (/\bnotice|contact|grievance|privacy policy\b/i.test(heading)) return "NOTICE"; return "SECTION"; }
function isDocumentTitleLine({ heading, title, titleKey }) { if (!titleKey) return false; return normalizeComparable(heading) === titleKey || (!/[.!?]$/.test(heading) && normalizeComparable(heading).includes(titleKey)); }

function buildSemanticLabelQueue({ units, artifactClass, documentId }) {
  const rows = [];
  for (const unit of units) {
    const decision = semanticQueueDecision({ unit, artifactClass });
    if (!decision) continue;
    rows.push({ queue_id: `${unit.unit_id}.SEMANTIC_QUEUE`, unit_id: unit.unit_id, section_id: unit.section_id, document_id: unit.document_id || documentId, heading_label: unit.heading_label, unit_type: unit.unit_type, priority: decision.priority, semantic_label_required: ["P0", "P1"].includes(decision.priority), semantic_reason: decision.reason, suggested_control_family_candidates: inferControlFamilies(unit.heading_label), suggested_subcat_candidates: inferSubcats(unit.heading_label), navigation_pointer: unit.location_reference });
  }
  return rows.sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));
}

function semanticQueueDecision({ unit, artifactClass }) {
  const h = unit.heading_label || "";
  if (!h || unit.unit_type === "DOCUMENT_TITLE") return null;
  if (!UNIT_TYPE_VOCAB.includes(unit.unit_type)) return null;
  if (isClauseText(h) || isPageFurniture(h)) return null;
  if (["ANNEXURE", "SCHEDULE", "APPENDIX", "ADDENDUM", "EXHIBIT"].includes(unit.unit_type)) return { priority: "P0", reason: "embedded_legal_unit" };
  if (/data processing|dpa|sub-?processor|personal data|data retention|data security|cross-border data|children's privacy|privacy and data security|security/i.test(h)) return { priority: "P0", reason: "privacy_data_or_security_unit" };
  if (/indemn|liability|warranty|disclaimer|damages|governing law|jurisdiction|dispute|termination/i.test(h)) return { priority: "P0", reason: "liability_or_legal_allocation_unit" };
  if (/intellectual property|copyright|ownership|license restrictions|content and output|model training|training|reverse engineer|trademark/i.test(h)) return { priority: "P1", reason: "ip_content_or_usage_unit" };
  if (/acceptable use|prohibited use|restrictions/i.test(h)) return { priority: "P1", reason: "use_safety_unit" };
  if (/contact|grievance|support services|service level|sla|billing|payment|cancellation|consent|data subject|data principal|algorithmic transparency|voice cloning|synthetic media/i.test(h)) return { priority: "P1", reason: "material_notice_or_control_unit" };
  if (artifactClass === "PRIVACY_POLICY" && /data|privacy|security|notice/i.test(h)) return { priority: "P1", reason: "privacy_document_material_unit" };
  return null;
}

function knownLegalHeadingPattern() { return /\b(terms|privacy policy|data retention|data security|cross-border data|data processing|data sub-processors|acceptable use|prohibited use|ownership|intellectual property|confidentiality|warrant(y|ies)|disclaimer|limitation of liability|indemnification|indemnity|governing law|jurisdiction|termination|payment|billing|security|trust center|notice|contact|grievance|definitions|complete agreement|license restrictions|grant of license|third party programs|your content and output|rights reserved|ai model training|algorithmic transparency|voice cloning|synthetic media|children's privacy|consent management|data principal|data subject|support services|service level agreement|service credits|service administration|software license|service accounts|eligibility|dispute resolution|sub-processors|cookies)\b/i; }
function isPageFurniture(value) { return /^(platform|developers|resources|company|sign up|contact us|home|about|blog|careers|login|request demo|book demo|copyright|all rights reserved)(\s|$)/i.test(value) || /sign up contact us/i.test(value); }
function inferHeadingLevel(unitType) { if (unitType === "DOCUMENT_TITLE") return 0; if (unitType === "SUBSECTION") return 2; return 1; }
function classifyEmbeddedUnit(label) { if (/data processing|dpa/i.test(label)) return "DATA_PROCESSING_AGREEMENT"; if (/service level|sla|support/i.test(label)) return "SLA_SUPPORT_TERMS"; if (/sub-?processor/i.test(label)) return "SUBPROCESSOR_LIST"; if (/privacy|eea|uk|swiss|california|ccpa|cpra/i.test(label)) return "PRIVACY_POLICY"; if (/acceptable use|prohibited use|content policy/i.test(label)) return "ACCEPTABLE_USE_POLICY"; if (/security|trust/i.test(label)) return "SECURITY_POLICY"; if (/intellectual property|copyright|ip/i.test(label)) return "IP_POLICY"; return "HOSTED_LEGAL_ARTIFACT"; }
function inferControlFamilies(label) { const out = new Set(); if (/terms|agreement|scope|accept|eligibility|account|consent/i.test(label)) out.add("FORMATION_CONTRACT"); if (/data|privacy|retention|deletion|sub-?processor|eea|california|security|breach|transfer|data subject|data principal/i.test(label)) out.add("DATA_PRIVACY"); if (/security|trust|vulnerability|incident/i.test(label)) out.add("SECURITY"); if (/use|prohibited|restriction|scrape|reverse engineer|train/i.test(label)) out.add("USE_SAFETY"); if (/agent|authority|on behalf/i.test(label)) out.add("AGENT_AUTHORITY"); if (/intellectual property|copyright|ownership|license|output|content|trademark|model training/i.test(label)) out.add("IP_CONTENT"); if (/liability|warranty|disclaimer|fees|payment|billing|indirect|consequential|termination|governing law|jurisdiction|dispute|service level|support/i.test(label)) out.add("COMMERCIAL_LEGAL_ALLOCATION"); if (/contact|support|notice|grievance/i.test(label)) out.add("CONTACT_ROUTES"); if (/indemn/i.test(label)) out.add("INDEMNITY"); return [...out]; }
function inferSubcats(label) { const out = new Set(); if (/accept|consent|terms|account|billing|cancellation|notice|eligibility/i.test(label)) out.add("CNS"); if (/liability|warranty|disclaimer|indemn|damages|governing law|jurisdiction|dispute|service level|support/i.test(label)) out.add("LIA"); if (/accuracy|reliance|generated|output/i.test(label)) out.add("HAL"); if (/intellectual property|copyright|ownership|license|content|output|training|scrap|trademark/i.test(label)) out.add("INF"); if (/personal data|privacy|retention|deletion|processing|transfer|sub-?processor|security|breach|data subject|data principal/i.test(label)) out.add("PRV"); if (/voice|face|speaker|voice cloning/i.test(label)) out.add("BIO"); if (/automated decision|human review|impact assessment|algorithmic transparency/i.test(label)) out.add("DEC"); if (/minor|children/i.test(label)) out.add("HRM"); if (/authenticity|synthetic media/i.test(label)) out.add("FRD"); if (/trading|investment|financial transaction|pricing/i.test(label)) out.add("TRD"); return [...out]; }
function pushMissing(ctx, row) { ctx.missingSourceMap.push(row); ctx.artifactAbsenceAccessMap.push({ absence_id: row.missing_id, missing_or_limited_item: row.missing_or_limited_item, expected_location: row.expected_location, expected_artifact_class: row.artifact_class, source_type: row.source_type, source_corpus_status: row.source_corpus_status, status: row.status, limitation: row.limitation, boundary_note: "Absence/access row only." }); }
function missingFamilyRow({ artifactName, reason }) { const family = stripLosslessPrefix(artifactName); return { missing_id: `${family}.ABS.001`, missing_or_limited_item: family, expected_location: "Loaded legal/governance corpus", source_type: "ABSENT_FAMILY", source_corpus_status: "UNKNOWN_NOT_SEARCHED", artifact_class: "UNKNOWN_LEGAL_ARTIFACT", status: "UNKNOWN_NOT_SEARCHED", search_basis: artifactName, limitation: reason }; }
function missingRowFromSource({ artifactName, row, status }) { const family = stripLosslessPrefix(artifactName); const label = row?.title || row?.url || row?.path || row?.reason || row?.source_id || family; return { missing_id: `${family}.ABS.${hashish(String(label)).slice(0, 8)}`, missing_or_limited_item: label, expected_location: row?.url || row?.path || "Loaded legal/governance corpus", source_type: status === "REFERENCED_BUT_NOT_FETCHED" ? "REFERENCED_URL" : "ABSENT_FAMILY", source_corpus_status: status, artifact_class: inferArtifactClass({ source: row || {}, title: label, sourceUrl: row?.url || "", textHead: "" }), status, search_basis: row?.search_basis || row?.url || row?.path || artifactName, limitation: row?.reason || row?.limitation || row?.status || "Legal/governance source was missing, limited, or not loaded." }; }
function buildLimitations({ documentMap, macroUnitMap, missingSourceMap, qualityRepairQueue }) { const out = []; if (!documentMap.length) out.push({ limitation_type: "NO_LOADED_LEGAL_DOCUMENTS", limitation: "No loaded legal/governance documents were available for deterministic indexing.", blocking: true }); if (documentMap.length && !macroUnitMap.length) out.push({ limitation_type: "NO_SECTION_OR_SUBSECTION_UNITS", limitation: "Loaded legal/governance documents were found, but no reliable section/subsection headings were detected.", blocking: false }); if (missingSourceMap.length) out.push({ limitation_type: "MISSING_OR_LIMITED_SOURCES", limitation: `${missingSourceMap.length} legal/governance source rows were missing, limited, rejected, or reference-only.`, blocking: false }); for (const row of qualityRepairQueue) out.push({ limitation_type: row.repair_type, limitation: row.reason, affected_ref: row.pointer || row.document_id || row.source_artifact || "", blocking: false }); return out; }
function readSummaryForFamily({ artifactName, family }) { const rootFamily = family?.root_family || family?.artifact_name || stripLosslessPrefix(artifactName); return { artifact_name: artifactName, supplied: Boolean(family && typeof family === "object"), root_family: rootFamily, sources_count: asArray(family?.sources).length, missing_limited_count: asArray(family?.missing_limited_primary_sources).length, rejected_count: asArray(family?.rejected_sources).length, manifest_only_count: asArray(family?.manifest_only_sources).length, metadata_only_count: asArray(family?.metadata_only_sources).length }; }
function inferArtifactClass({ source = {}, title = "", sourceUrl = "", textHead = "" }) { const target = `${source.artifact_class || ""} ${source.classification || ""} ${title} ${sourceUrl}`.toLowerCase(); const all = `${target} ${textHead}`.toLowerCase(); if (/eula|end user license/.test(target)) return "EULA"; if (/terms-of-service|terms of service|terms of use|customer terms/.test(target)) return "TERMS_OF_SERVICE"; if (/privacy-policy|privacy policy|privacy notice/.test(target)) return "PRIVACY_POLICY"; if (/cookie/.test(all)) return "COOKIE_POLICY"; if (/data processing|dpa|data protection addendum/.test(all)) return "DATA_PROCESSING_AGREEMENT"; if (/sub-?processor/.test(all)) return "SUBPROCESSOR_LIST"; if (/acceptable use|aup|prohibited use|content policy/.test(all)) return "ACCEPTABLE_USE_POLICY"; if (/ai terms|model terms|usage governance/.test(all)) return "AI_TERMS_POLICY"; if (/agentic|agent addendum|authority/.test(all)) return "AGENTIC_ADDENDUM"; if (/impact assessment|dpia|fria/.test(all)) return "AI_IMPACT_ASSESSMENT"; if (/security policy/.test(all)) return "SECURITY_POLICY"; if (/trust center|trust-cent/.test(all)) return "TRUST_CENTER"; if (/sla|service level|support services|support terms/.test(all)) return "SLA_SUPPORT_TERMS"; if (/billing|cancellation/.test(all)) return "BILLING_CANCELLATION_TERMS"; if (/legal notice|impressum|grievance/.test(all)) return "LEGAL_NOTICE_IMPRESSUM"; return "HOSTED_LEGAL_ARTIFACT"; }
function deriveDocumentTitle({ source, text }) { const explicit = source.title || source.page_title || source.name || source.label; if (explicit) return cleanTitle(explicit); const first = text.split(/\r?\n/).map((line) => normalizeLine(line)).find(Boolean); return cleanTitle(first || source.final_url || source.url || "Unknown legal/governance document"); }
function cleanTitle(value) { return String(value || "").replace(/\s+/g, " ").trim().slice(0, 180); }
function normalizeLine(value) { return String(value || "").replace(/\s+/g, " ").trim(); }
function normalizeComparable(value) { return cleanTitle(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
function dedupeHeadingRows(rows) { const seen = new Set(); const out = []; for (const row of rows) { const key = `${row.unit_type}:${normalizeComparable(row.heading)}`; if (!key || seen.has(key)) continue; seen.add(key); out.push(row); } return out; }
function isTitleCaseHeading(value) { const words = value.split(/\s+/).filter(Boolean); if (!words.length || words.length > 8) return false; const titleish = words.filter((word) => /^[A-Z0-9][A-Za-z0-9'()&/-]*$/.test(word)).length; return titleish / words.length >= 0.7; }
function priorityRank(value) { return { P0: 0, P1: 1, P2: 2, P3: 3 }[value] ?? 9; }
function extractVersionOrDateSignal(text) { const match = String(text || "").match(/(updated on|effective date|last updated|version)[:\s]+([^\n.]{4,80})/i); return match ? cleanTitle(`${match[1]} ${match[2]}`) : ""; }
function charOffsetForLine(lines, targetIndex) { let offset = 0; for (let i = 0; i < targetIndex; i += 1) offset += String(lines[i] || "").length + 1; return offset; }
function repairRow({ repair_type, scope, source_artifact = "", document_id = "", pointer = "", reason }) { return { repair_type, scope, source_artifact, document_id, pointer, reason, blocking: false }; }
function unwrapArtifact(value) { if (!value || typeof value !== "object") return value; if (value.artifact && typeof value.artifact === "object") return value.artifact; return value; }
function findRunId(artifacts) { for (const value of Object.values(artifacts || {})) { const artifact = unwrapArtifact(value); if (artifact?.run_id) return artifact.run_id; for (const nested of Object.values(artifact || {})) if (nested?.run_id) return nested.run_id; } return ""; }
function stripLosslessPrefix(value) { return String(value || "").replace(/^lossless_family__/, ""); }
function makeId(value) { return String(value || "UNKNOWN").replace(/[^A-Za-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "").toUpperCase(); }
function hashish(value) { let hash = 0; for (let i = 0; i < value.length; i += 1) hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0; return Math.abs(hash).toString(16); }
function asArray(value) { return Array.isArray(value) ? value : []; }
function stripEmpty(row) { const out = {}; for (const [key, value] of Object.entries(row)) { if (value === "" || value === undefined || value === null) continue; if (Array.isArray(value) && value.length === 0) continue; out[key] = value; } return out; }
function dedupeRows(rows, keyFn) { const seen = new Set(); const out = []; for (const row of rows) { const key = keyFn(row); if (!key || seen.has(key)) continue; seen.add(key); out.push(row); } return out; }
