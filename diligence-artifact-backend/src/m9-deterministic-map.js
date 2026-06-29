const LEGAL_GOVERNANCE_FAMILY_ARTIFACTS = Object.freeze([
  "lossless_family__L1_CORE_TERMS_PRIVACY",
  "lossless_family__L2_B2B_CONTRACTING",
  "lossless_family__L3_AI_USAGE_GOVERNANCE",
  "lossless_family__L4_PRIVACY_ADJACENT_NOTICES",
  "lossless_family__L5_LEGAL_HUB_HOSTED",
  "lossless_family__L6_ENTITY_NOTICE"
]);

const REGISTRY_SUBCAT_VOCAB = Object.freeze(["CNS", "LIA", "HAL", "INF", "PRV", "BIO", "DEC", "HRM", "FRD", "TRD"]);

const CONTROL_LANGUAGE_FAMILY_VOCAB = Object.freeze([
  "FORMATION_CONTRACT",
  "ACTIVITY_SPECIFIC_DISCLOSURE",
  "DATA_PRIVACY",
  "VENDORS_TRANSFER",
  "SECURITY",
  "USE_SAFETY",
  "AGENT_AUTHORITY",
  "IP_CONTENT",
  "COMMERCIAL_LEGAL_ALLOCATION",
  "CONTACT_ROUTES",
  "INDEMNITY",
  "UNKNOWN_CONTROL_LANGUAGE"
]);

const DOCUMENT_ROUTE_VOCAB = Object.freeze([
  "DOC_TOS",
  "DOC_AUP",
  "DOC_DPA",
  "DOC_AGT",
  "DOC_DPIA",
  "DOC_SOP",
  "DOC_HND",
  "DOC_IP",
  "DOC_SLA",
  "DOC_PP",
  "DOC_SECURITY",
  "DOC_SUBPROCESSOR",
  "DOC_COOKIE",
  "DOC_NOTICE",
  "DOC_UNKNOWN"
]);

const CORE_DOCUMENT_STACK = Object.freeze([
  { route: "DOC_TOS", expected_artifact_class: "TERMS_OF_SERVICE", aliases: ["terms", "terms of service", "terms of use", "customer terms"] },
  { route: "DOC_PP", expected_artifact_class: "PRIVACY_POLICY", aliases: ["privacy", "privacy policy", "privacy notice"] },
  { route: "DOC_DPA", expected_artifact_class: "DATA_PROCESSING_AGREEMENT", aliases: ["dpa", "data processing", "data processing agreement", "data protection addendum"] },
  { route: "DOC_AUP", expected_artifact_class: "ACCEPTABLE_USE_POLICY", aliases: ["acceptable use", "aup", "usage policy", "prohibited use", "content policy"] },
  { route: "DOC_SLA", expected_artifact_class: "SLA_SUPPORT_TERMS", aliases: ["sla", "service level", "support terms", "support services"] },
  { route: "DOC_SECURITY", expected_artifact_class: "SECURITY_POLICY", aliases: ["security", "trust", "trust center", "security policy"] },
  { route: "DOC_SUBPROCESSOR", expected_artifact_class: "SUBPROCESSOR_LIST", aliases: ["subprocessor", "sub-processors", "service providers"] },
  { route: "DOC_COOKIE", expected_artifact_class: "COOKIE_POLICY", aliases: ["cookie", "cookies"] },
  { route: "DOC_NOTICE", expected_artifact_class: "NOTICE_PAGE", aliases: ["notice", "legal notice", "impressum", "contact", "grievance"] },
  { route: "DOC_IP", expected_artifact_class: "IP_POLICY", aliases: ["intellectual property", "copyright", "dmca", "ownership"] },
  { route: "DOC_AGT", expected_artifact_class: "AGENTIC_ADDENDUM", aliases: ["agent", "agentic", "authority", "actions on behalf"] },
  { route: "DOC_DPIA", expected_artifact_class: "AI_IMPACT_ASSESSMENT", aliases: ["impact assessment", "dpia", "fria", "risk assessment"] },
  { route: "DOC_SOP", expected_artifact_class: "HOSTED_LEGAL_ARTIFACT", aliases: ["sop", "standard operating", "procedure", "incident response"] },
  { route: "DOC_HND", expected_artifact_class: "HITL_POLICY", aliases: ["human review", "human in the loop", "hitl", "human oversight"] }
]);

const MAX_UNITS_PER_SOURCE = 120;
const MAX_REFERENCES_PER_SOURCE = 50;

export const M9_DETERMINISTIC_ARTIFACT_NAME = "legal_cartography_deterministic_map";

export function buildM9DeterministicMap({ run = {}, artifacts = {} } = {}) {
  const sourceDiscovery = unwrapArtifact(artifacts.source_discovery_handoff);
  const runId = run.run_id || sourceDiscovery?.run_id || findRunId(artifacts) || "UNKNOWN_RUN";
  const targetUrl = run.target_url || sourceDiscovery?.target_url || "";

  const documentMap = [];
  const sectionMap = [];
  const embeddedUnitMap = [];
  const referencedDocumentMap = [];
  const missingSourceMap = [];
  const sourceArtifactsRead = [];
  const qualityRepairQueue = [];

  for (const artifactName of LEGAL_GOVERNANCE_FAMILY_ARTIFACTS) {
    const family = unwrapArtifact(artifacts[artifactName]);
    sourceArtifactsRead.push(readSummaryForFamily({ artifactName, family }));
    ingestFamily({
      artifactName,
      family,
      documentMap,
      sectionMap,
      embeddedUnitMap,
      referencedDocumentMap,
      missingSourceMap,
      qualityRepairQueue
    });
  }

  ingestSourceDiscoveryLegalAbsences({ sourceDiscovery, missingSourceMap, qualityRepairQueue });

  const artifactInventoryMap = buildArtifactInventoryMap(documentMap);
  const macroUnitMap = buildMacroUnitMap(sectionMap);
  const noticeCandidateMap = buildNoticeCandidateMap({ documentMap, sectionMap });
  const controlLanguageCandidateMap = buildControlLanguageCandidateMap(sectionMap);
  const indemnityCandidateMap = buildIndemnityCandidateMap(sectionMap);
  const crossDocumentReferenceMap = buildCrossDocumentReferenceMap(referencedDocumentMap);
  const artifactAbsenceAccessMap = buildArtifactAbsenceAccessMap(missingSourceMap);
  const coreDocumentStackSlots = buildCoreDocumentStackSlots({ documentMap, embeddedUnitMap, artifactAbsenceAccessMap });
  const legalGovernanceSourceCoverage = buildLegalGovernanceSourceCoverage({ sourceArtifactsRead, documentMap, sectionMap, embeddedUnitMap, referencedDocumentMap, missingSourceMap });
  const cartographyLimitations = buildCartographyLimitations({ sourceArtifactsRead, documentMap, sectionMap, missingSourceMap, qualityRepairQueue });

  const mapStatus = resolveMapStatus({ documentMap, sourceArtifactsRead, qualityRepairQueue });

  return {
    [M9_DETERMINISTIC_ARTIFACT_NAME]: {
      run_id: runId,
      target_url: targetUrl,
      generated_by: "m9_hybrid_deterministic_layer",
      schema_version: "M9_DETERMINISTIC_LEGAL_MAP_v2_REGISTRY_AWARE",
      model_used: false,
      artifact_role: "M9 factual navigation map. This is not legal evidence and does not replace lossless source text.",
      active_registry_context: {
        active_registry_domain: "AI_PRODUCT_LEGAL_EXPOSURE",
        registry_row_id_schema: "{ARCHETYPE}_{SUBCAT}_{VARIANT}",
        archetype_gate_owned_by: "M8_TARGET_FEATURE_PROFILE",
        surface_gate_owned_by: "M8_TARGET_FEATURE_PROFILE_AND_M10_DATA_PROVENANCE",
        subcat_relevance_owned_by: "M9_SEMANTIC_LAYER",
        row_status_owned_by: "M11_EXPOSURE_REGISTRY",
        m9_role: "document_control_navigation_only",
        registry_application_forbidden_in_layer_1: true
      },
      deterministic_vocabularies: {
        registry_subcat_vocab: [...REGISTRY_SUBCAT_VOCAB],
        document_route_vocab: [...DOCUMENT_ROUTE_VOCAB],
        control_language_family_vocab: [...CONTROL_LANGUAGE_FAMILY_VOCAB]
      },
      source_text_policy: {
        lossless_artifacts_remain_source_of_truth: true,
        full_legal_text_copied_into_map: false,
        full_control_text_copied_into_map: false,
        downstream_must_use_navigation_pointers_to_read_lossless_text: true
      },
      source_artifacts_read: sourceArtifactsRead,
      core_document_stack_slots: coreDocumentStackSlots,
      artifact_inventory_map: artifactInventoryMap,
      macro_unit_map: macroUnitMap,
      notice_candidate_map: noticeCandidateMap,
      control_language_candidate_map: controlLanguageCandidateMap,
      indemnity_candidate_map: indemnityCandidateMap,
      cross_document_reference_map: crossDocumentReferenceMap,
      artifact_absence_access_map: artifactAbsenceAccessMap,
      legal_governance_source_coverage: legalGovernanceSourceCoverage,
      cartography_limitations: cartographyLimitations,
      document_map: documentMap,
      section_map: sectionMap,
      embedded_unit_map: embeddedUnitMap,
      referenced_document_map: referencedDocumentMap,
      missing_source_map: dedupeRows(missingSourceMap, (row) => [row.missing_or_limited_item, row.expected_location, row.search_basis].join("|")),
      quality_repair_queue: dedupeRows(qualityRepairQueue, (row) => [row.repair_type, row.scope, row.pointer || row.document_id || row.source_artifact].join("|")),
      downstream_rules: {
        m9_deterministic_layer_only: true,
        legal_advice_forbidden: true,
        compliance_conclusions_forbidden: true,
        sufficiency_conclusions_forbidden: true,
        enforceability_assessments_forbidden: true,
        risk_conclusions_forbidden: true,
        registry_evaluation_forbidden: true,
        registry_row_status_forbidden: true,
        no_new_url_discovery: true,
        no_new_extraction: true,
        use_only_loaded_legal_corpus: true,
        map_not_parallel_evidence: true,
        semantic_labels_pending: true,
        reinvestigation_before_blocking: true
      },
      status: mapStatus,
      lock_status: mapStatus
    }
  };
}

function ingestFamily({ artifactName, family, documentMap, sectionMap, embeddedUnitMap, referencedDocumentMap, missingSourceMap, qualityRepairQueue }) {
  if (!family || typeof family !== "object") {
    missingSourceMap.push(missingFamilyRow({ artifactName, reason: "Artifact not available to deterministic M9 layer." }));
    qualityRepairQueue.push(repairRow({ repair_type: "MISSING_SOURCE_ARTIFACT", scope: artifactName, source_artifact: artifactName, reason: "Legal/governance lossless family artifact was not supplied." }));
    return;
  }

  for (const source of asArray(family.sources)) ingestSource({ artifactName, family, source, documentMap, sectionMap, embeddedUnitMap, referencedDocumentMap, qualityRepairQueue });
  for (const row of asArray(family.missing_limited_primary_sources)) missingSourceMap.push(missingRowFromSource({ artifactName, row, status: "STANDALONE_SOURCE_ABSENT" }));
  for (const row of asArray(family.rejected_sources)) missingSourceMap.push(missingRowFromSource({ artifactName, row, status: "SOURCE_REJECTED_OR_FAILED" }));
  for (const row of asArray(family.manifest_only_sources)) missingSourceMap.push(missingRowFromSource({ artifactName, row, status: "REFERENCED_BUT_NOT_FETCHED" }));
  for (const row of asArray(family.metadata_only_sources)) missingSourceMap.push(missingRowFromSource({ artifactName, row, status: "UNKNOWN_NOT_SEARCHED" }));
}

function ingestSource({ artifactName, family, source, documentMap, sectionMap, embeddedUnitMap, referencedDocumentMap, qualityRepairQueue }) {
  const text = String(source?.lossless_text || "");
  const sourceId = source.source_id || `${family.root_family || artifactName}.SRC.${String(documentMap.length + 1).padStart(3, "0")}`;
  const documentId = makeId(sourceId);
  const title = deriveDocumentTitle({ source, text });
  const artifactClass = inferArtifactClass({ source, title, text });
  const sourceUrl = source.final_url || source.url || source.canonical_url || "";
  const routeCandidates = inferDocumentRouteCandidates({ artifactClass, title, sourceUrl, textHead: text.slice(0, 700) });

  documentMap.push({
    document_id: documentId,
    artifact_id: documentId,
    document_or_artifact: title,
    artifact_class: artifactClass,
    artifact_family: source.root_family || family.root_family || family.artifact_name || stripLosslessPrefix(artifactName),
    expected_core_document_slot_candidates: routeCandidates,
    hosted_governance_flag: isHostedGovernanceArtifact({ artifactClass, artifactName, sourceUrl, title }),
    lossless_artifact_name: artifactName,
    root_family: source.root_family || family.root_family || family.artifact_name || stripLosslessPrefix(artifactName),
    source: sourceUrl,
    source_url: sourceUrl,
    canonical_url: source.canonical_url || source.url || "",
    source_type: "URL",
    source_corpus_status: "FOUND_AS_PRIMARY_SOURCE",
    status: "FOUND_INDEXED",
    route_type: source.route_type || "",
    document_role: source.tier_reason || source.materiality || family.purpose || "Loaded legal/governance source.",
    version_or_effective_date_signal: extractVersionOrDateSignal(text.slice(0, 1200)),
    jurisdiction_or_governing_law_signal_pointer: pointerIfHeadingLike({ sourceId, artifactName, text, patterns: [/governing law/i, /jurisdiction/i, /venue/i, /courts?/i] }),
    document_scope_signal_pointer: pointerIfHeadingLike({ sourceId, artifactName, text, patterns: [/scope/i, /services/i, /use of/i, /applicability/i] }),
    classification_basis: buildClassificationBasis({ source, title, artifactClass, routeCandidates }),
    text_pointer: {
      lossless_artifact_name: artifactName,
      source_id: sourceId,
      text_field: "lossless_text",
      sha256: source.sha256 || "",
      char_count: text.length
    },
    limitation: text ? "" : "Loaded source has no lossless_text available to deterministic M9."
  });

  if (!text) {
    qualityRepairQueue.push(repairRow({ repair_type: "MISSING_LOSSLESS_TEXT", scope: "document", document_id: documentId, source_artifact: artifactName, pointer: sourceId, reason: "Source row exists but lossless_text is empty." }));
    return;
  }

  const units = extractMacroUnitPointers({ artifactName, source, sourceId, documentId, title, text });
  if (!units.length) {
    qualityRepairQueue.push(repairRow({ repair_type: "MACRO_UNIT_MAP_THIN", scope: "document", document_id: documentId, source_artifact: artifactName, pointer: sourceId, reason: "Deterministic heading scan found no macro-unit boundaries; fallback whole-document pointer should be used downstream." }));
    sectionMap.push(fallbackWholeDocumentUnit({ artifactName, source, sourceId, documentId, title, text }));
  } else {
    sectionMap.push(...units);
  }

  for (const unit of units) if (isEmbeddedLegalUnit(unit)) embeddedUnitMap.push(embeddedRowFromUnit(unit));

  const references = extractReferencedUrls({ text, sourceUrl, sourceId, artifactName, title });
  referencedDocumentMap.push(...references);
}

function extractMacroUnitPointers({ artifactName, source, sourceId, documentId, title, text }) {
  const lines = splitLinesWithOffsets(text);
  const headingIndexes = [];
  for (let i = 0; i < lines.length; i += 1) {
    if (looksLikeHeading(lines[i].text, i)) headingIndexes.push(i);
    if (headingIndexes.length >= MAX_UNITS_PER_SOURCE) break;
  }
  if (!headingIndexes.length) return [];

  const rows = [];
  for (let i = 0; i < headingIndexes.length; i += 1) {
    const startLine = lines[headingIndexes[i]];
    const nextLine = headingIndexes[i + 1] !== undefined ? lines[headingIndexes[i + 1]] : null;
    const charStart = startLine.start;
    const charEnd = nextLine ? Math.max(charStart, nextLine.start - 1) : text.length;
    const heading = cleanHeading(startLine.text) || `Unit ${String(i + 1).padStart(3, "0")}`;
    const unitType = inferUnitType(heading);
    const sectionId = `${makeId(sourceId)}.UNIT.${String(i + 1).padStart(3, "0")}`;
    const candidateFamilies = inferControlFamilyCandidates(heading);

    rows.push({
      section_id: sectionId,
      unit_id: sectionId,
      document_id: makeId(documentId),
      host_document: title,
      internal_unit: heading,
      heading_label: heading,
      unit_type: unitType,
      macro_unit_type: unitType,
      parent_unit_id: "",
      child_unit_ids: [],
      relationship_to_host: "HOSTS_UNIT",
      apparent_function: "DETERMINISTIC_UNLABELED_SEMANTIC_LAYER_PENDING",
      deterministic_control_family_candidates: candidateFamilies,
      deterministic_document_route_candidates: inferDocumentRouteCandidates({ artifactClass: "", title: heading, sourceUrl: "", textHead: "" }),
      lossless_artifact_name: artifactName,
      source: source.final_url || source.url || source.canonical_url || "",
      source_type: "URL",
      source_corpus_status: "FOUND_AS_PRIMARY_SOURCE",
      status: "FOUND_INDEXED",
      heading_path: [title, heading],
      location_reference: {
        lossless_artifact_name: artifactName,
        source_id: sourceId,
        text_field: "lossless_text",
        line_start: startLine.line_number,
        line_end: nextLine ? Math.max(startLine.line_number, nextLine.line_number - 1) : lines.length,
        char_start: charStart,
        char_end: charEnd,
        char_count: Math.max(0, charEnd - charStart)
      },
      navigation_pointer: {
        lossless_artifact_name: artifactName,
        source_id: sourceId,
        text_field: "lossless_text",
        line_start: startLine.line_number,
        line_end: nextLine ? Math.max(startLine.line_number, nextLine.line_number - 1) : lines.length,
        char_start: charStart,
        char_end: charEnd,
        char_count: Math.max(0, charEnd - charStart)
      },
      extraction_method: inferExtractionMethod(heading),
      confidence: "DETERMINISTIC_CANDIDATE",
      boundary_note: "Macro-unit pointer only; semantic labeling belongs to M9-B.",
      limitation: "Semantic topic/control labels pending M9 semantic layer."
    });
  }
  return rows;
}

function fallbackWholeDocumentUnit({ artifactName, source, sourceId, documentId, title, text }) {
  return {
    section_id: `${makeId(sourceId)}.UNIT.000`,
    unit_id: `${makeId(sourceId)}.UNIT.000`,
    document_id: makeId(documentId),
    host_document: title,
    internal_unit: "Whole document fallback pointer",
    heading_label: "Whole document fallback pointer",
    unit_type: "DOCUMENT_BODY",
    macro_unit_type: "DOCUMENT_BODY",
    parent_unit_id: "",
    child_unit_ids: [],
    relationship_to_host: "HOSTS_UNIT",
    apparent_function: "DETERMINISTIC_FALLBACK_SEMANTIC_LAYER_PENDING",
    deterministic_control_family_candidates: [],
    deterministic_document_route_candidates: [],
    lossless_artifact_name: artifactName,
    source: source.final_url || source.url || source.canonical_url || "",
    source_type: "URL",
    source_corpus_status: "FOUND_AS_PRIMARY_SOURCE",
    status: "FOUND_THIN",
    heading_path: [title],
    location_reference: { lossless_artifact_name: artifactName, source_id: sourceId, text_field: "lossless_text", line_start: 1, line_end: splitLinesWithOffsets(text).length, char_start: 0, char_end: text.length, char_count: text.length },
    navigation_pointer: { lossless_artifact_name: artifactName, source_id: sourceId, text_field: "lossless_text", line_start: 1, line_end: splitLinesWithOffsets(text).length, char_start: 0, char_end: text.length, char_count: text.length },
    extraction_method: "WHOLE_DOCUMENT_FALLBACK",
    confidence: "DETERMINISTIC_FALLBACK",
    boundary_note: "Fallback pointer only; semantic labeling belongs to M9-B.",
    limitation: "No deterministic macro-unit boundary found; downstream may read the full source through this pointer."
  };
}

function buildArtifactInventoryMap(documentMap) {
  return documentMap.map((doc) => ({
    artifact_id: doc.artifact_id || doc.document_id,
    document_id: doc.document_id,
    document_name: doc.document_or_artifact,
    artifact_class: doc.artifact_class,
    artifact_family: doc.artifact_family || doc.root_family,
    artifact_status: doc.status,
    source_url: doc.source_url || doc.source,
    canonical_url: doc.canonical_url || "",
    hosted_governance_flag: Boolean(doc.hosted_governance_flag),
    version_or_effective_date_signal: doc.version_or_effective_date_signal || "",
    jurisdiction_or_governing_law_signal_pointer: doc.jurisdiction_or_governing_law_signal_pointer || null,
    document_scope_signal_pointer: doc.document_scope_signal_pointer || null,
    expected_core_document_slot_candidates: doc.expected_core_document_slot_candidates || [],
    classification_basis: doc.classification_basis || "DETERMINISTIC_SOURCE_METADATA",
    boundary_note: "Deterministic artifact inventory only; classification confidence belongs to M9-B."
  }));
}

function buildMacroUnitMap(sectionMap) {
  return sectionMap.map((row) => ({
    unit_id: row.unit_id || row.section_id,
    section_id: row.section_id,
    artifact_reference: row.document_id,
    document_id: row.document_id,
    unit_type: row.unit_type,
    heading_label: row.heading_label || row.internal_unit,
    unit_family_tags: row.deterministic_control_family_candidates || [],
    control_language_candidates: row.deterministic_control_family_candidates || [],
    location_reference: row.location_reference || row.navigation_pointer,
    parent_unit_id: row.parent_unit_id || "",
    child_unit_ids: row.child_unit_ids || [],
    cross_reference_refs: [],
    extraction_method: row.extraction_method || "HEADING_SCAN",
    confidence: row.confidence || "DETERMINISTIC_CANDIDATE",
    boundary_note: row.boundary_note || "Macro-unit pointer only."
  }));
}

function buildNoticeCandidateMap({ documentMap, sectionMap }) {
  const rows = [];
  for (const unit of sectionMap) {
    const label = `${unit.internal_unit || ""} ${unit.host_document || ""}`.toLowerCase();
    const noticeType = inferNoticeType(label);
    if (!noticeType) continue;
    rows.push({
      notice_id: `${unit.section_id}.NOTICE`,
      artifact_reference: unit.document_id,
      unit_reference: unit.section_id,
      notice_type_candidate: noticeType,
      heading_or_label: unit.internal_unit,
      location_reference: unit.location_reference || unit.navigation_pointer,
      related_control_language_candidates: unit.deterministic_control_family_candidates || [],
      confidence: "DETERMINISTIC_CANDIDATE",
      boundary_note: "Notice candidate detected from heading/path only; semantic confirmation belongs to M9-B."
    });
  }
  for (const doc of documentMap) {
    const noticeType = inferNoticeType(`${doc.document_or_artifact || ""} ${doc.source || ""}`.toLowerCase());
    if (!noticeType) continue;
    rows.push({
      notice_id: `${doc.document_id}.NOTICE`,
      artifact_reference: doc.document_id,
      unit_reference: "",
      notice_type_candidate: noticeType,
      heading_or_label: doc.document_or_artifact,
      location_reference: doc.text_pointer,
      related_control_language_candidates: [],
      confidence: "DETERMINISTIC_CANDIDATE",
      boundary_note: "Document-level notice candidate detected from title/path only."
    });
  }
  return dedupeRows(rows, (row) => row.notice_id);
}

function buildControlLanguageCandidateMap(sectionMap) {
  const rows = [];
  for (const unit of sectionMap) {
    for (const family of unit.deterministic_control_family_candidates || []) {
      rows.push({
        control_candidate_id: `${unit.section_id}.${family}`,
        control_language_family_candidate: family,
        related_artifact: unit.document_id,
        related_unit_or_section: unit.section_id,
        related_notice: "",
        location_reference: unit.location_reference || unit.navigation_pointer,
        detection_basis: "HEADING_KEYWORD_DETERMINISTIC_CANDIDATE",
        control_family_tags: [family],
        requires_downstream_review: true,
        confidence: "DETERMINISTIC_CANDIDATE",
        boundary_note: "Candidate only. No control strength or legal conclusion is made in Layer 1."
      });
    }
  }
  return dedupeRows(rows, (row) => row.control_candidate_id);
}

function buildIndemnityCandidateMap(sectionMap) {
  return sectionMap
    .filter((unit) => /indemni|third[- ]party claims?|defen[cs]e obligations?/i.test(`${unit.internal_unit || ""} ${unit.heading_label || ""}`))
    .map((unit) => ({
      indemnity_candidate_id: `${unit.section_id}.INDEMNITY`,
      section_id: unit.section_id,
      document_id: unit.document_id,
      indemnity_clause_location: unit.heading_label || unit.internal_unit,
      location_reference: unit.location_reference || unit.navigation_pointer,
      covered_claims_signal_pointer: null,
      excluded_claims_signal_pointer: null,
      procedure_signal_pointer: null,
      cap_interaction_signal_pointer: null,
      location_confidence: "DETERMINISTIC_CANDIDATE",
      boundary_note: "Location candidate only; no adequacy or enforceability assessment."
    }));
}

function buildCrossDocumentReferenceMap(referencedDocumentMap) {
  return referencedDocumentMap.map((row) => ({
    cross_reference_id: row.reference_id,
    from_document: row.referring_document,
    from_document_id: row.from_document_id || "",
    from_unit_id: row.from_unit_id || "",
    to_document_or_policy: row.referenced_document_or_policy,
    to_url_or_label: row.source_or_reference,
    reference_type_candidate: row.relationship || "REFERENCED_IN_LOSSLESS_TEXT",
    loaded_status: row.source_corpus_status,
    source_type: row.source_type,
    status: row.status,
    confidence: "DETERMINISTIC_URL_EXTRACTION",
    boundary_note: row.limitation || "Reference extracted from loaded text; no new fetch performed."
  }));
}

function buildArtifactAbsenceAccessMap(missingSourceMap) {
  return dedupeRows(missingSourceMap, (row) => [row.missing_or_limited_item, row.expected_location, row.source_corpus_status].join("|")).map((row) => {
    const route = inferDocumentRouteCandidates({ artifactClass: row.artifact_class, title: `${row.missing_or_limited_item} ${row.expected_location}`, sourceUrl: "", textHead: "" })[0] || "DOC_UNKNOWN";
    return {
      absence_id: row.missing_id,
      expected_document_route: route,
      expected_artifact_class: row.artifact_class || "UNKNOWN_LEGAL_ARTIFACT",
      expected_artifact_family: row.expected_location || row.source_artifact || "",
      absence_or_access_status: row.source_corpus_status,
      search_basis_refs: [row.search_basis].filter(Boolean),
      access_failed_refs: row.source_corpus_status === "SOURCE_REJECTED_OR_FAILED" ? [row.limitation].filter(Boolean) : [],
      substitute_control_check_required: route !== "DOC_UNKNOWN",
      downstream_treatment: "LIMITATION_NOT_EXPOSURE",
      boundary_statement: "Public-footprint absence/access map only; absence alone is not a downstream finding.",
      source_type: row.source_type,
      status: row.status,
      limitation: row.limitation || ""
    };
  });
}

function buildCoreDocumentStackSlots({ documentMap, embeddedUnitMap, artifactAbsenceAccessMap }) {
  return CORE_DOCUMENT_STACK.map((slot) => {
    const foundDocs = documentMap.filter((doc) => (doc.expected_core_document_slot_candidates || []).includes(slot.route));
    const embeddedUnits = embeddedUnitMap.filter((unit) => inferDocumentRouteCandidates({ artifactClass: unit.artifact_class || "", title: `${unit.internal_unit || ""} ${unit.host_document || ""}`, sourceUrl: unit.source || "", textHead: "" }).includes(slot.route));
    const absences = artifactAbsenceAccessMap.filter((row) => row.expected_document_route === slot.route);
    return {
      slot_id: slot.route,
      expected_artifact_class: slot.expected_artifact_class,
      aliases: [...slot.aliases],
      found_document_ids: foundDocs.map((doc) => doc.document_id),
      found_embedded_unit_ids: embeddedUnits.map((unit) => unit.embedded_unit_id),
      standalone_status: foundDocs.length ? "FOUND_AS_PRIMARY_SOURCE" : "NOT_FOUND_AS_STANDALONE_IN_LOADED_CORPUS",
      embedded_status: embeddedUnits.length ? "FOUND_EMBEDDED_IN_LEGAL_CORPUS" : "NOT_FOUND_EMBEDDED_BY_DETERMINISTIC_SCAN",
      missing_status: !foundDocs.length && !embeddedUnits.length ? "NOT_FOUND_OR_NOT_DETERMINISTICALLY_CLASSIFIED" : "NOT_MISSING",
      search_basis: absences.map((row) => row.search_basis_refs).flat().filter(Boolean).join(" | "),
      substitute_control_check_required: !foundDocs.length,
      boundary_note: "Core stack slot is deterministic document-route scaffolding. Semantic confirmation belongs to M9-B."
    };
  });
}

function buildLegalGovernanceSourceCoverage({ sourceArtifactsRead, documentMap, sectionMap, embeddedUnitMap, referencedDocumentMap, missingSourceMap }) {
  return {
    admitted_legal_governance_source_count: documentMap.length,
    hosted_governance_source_count: documentMap.filter((doc) => doc.hosted_governance_flag).length,
    macro_unit_count: sectionMap.length,
    embedded_unit_count: embeddedUnitMap.length,
    referenced_document_count: referencedDocumentMap.length,
    missing_or_limited_count: missingSourceMap.length,
    artifact_class_coverage_summary: countBy(documentMap, (doc) => doc.artifact_class || "UNKNOWN_LEGAL_ARTIFACT"),
    source_family_purity_check: sourceArtifactsRead.map((row) => ({ artifact_name: row.artifact_name, supplied: row.supplied, sources_count: row.sources_count })),
    coverage_confidence: documentMap.length ? "USABLE_PUBLIC_LEGAL_CORPUS" : "NO_LOADED_LEGAL_CORPUS",
    coverage_limitations: []
  };
}

function buildCartographyLimitations({ sourceArtifactsRead, documentMap, sectionMap, missingSourceMap, qualityRepairQueue }) {
  const rows = [];
  if (!sourceArtifactsRead.some((row) => row.supplied)) rows.push(limitRow("NO_SOURCE_ARTIFACTS", "No legal/governance lossless family artifacts were supplied."));
  if (!documentMap.length) rows.push(limitRow("NO_DOCUMENTS_MAPPED", "No legal/governance documents were mapped."));
  if (documentMap.length && !sectionMap.length) rows.push(limitRow("NO_MACRO_UNITS", "Documents exist but no macro units were deterministically mapped."));
  if (missingSourceMap.length) rows.push(limitRow("MISSING_OR_LIMITED_ITEMS", "Some expected or referenced legal/governance items are absent, thin, failed, or not loaded."));
  for (const repair of qualityRepairQueue) rows.push(limitRow(repair.repair_type, repair.reason, repair));
  return rows;
}

function extractReferencedUrls({ text, sourceUrl, sourceId, artifactName, title }) {
  const rows = [];
  const seen = new Set();
  const regex = /https?:\/\/[^\s)\]"'<>]+/gi;
  let match;
  while ((match = regex.exec(text)) && rows.length < MAX_REFERENCES_PER_SOURCE) {
    const url = stripTrailingPunctuation(match[0]);
    if (!url || url === sourceUrl || seen.has(url)) continue;
    seen.add(url);
    rows.push({
      reference_id: `${makeId(sourceId)}.REF.${String(rows.length + 1).padStart(3, "0")}`,
      from_document_id: makeId(sourceId),
      from_unit_id: "",
      referring_document: title,
      referenced_document_or_policy: inferNameFromUrl(url),
      source_or_reference: url,
      relationship: "EXTERNAL_REFERENCE",
      lossless_artifact_name: artifactName,
      source_type: "REFERENCED_URL",
      source_corpus_status: "REFERENCED_BUT_NOT_FETCHED",
      artifact_class: inferArtifactClass({ source: { url }, title: inferNameFromUrl(url), text: "" }),
      status: "REFERENCED_BUT_NOT_FETCHED",
      navigation_pointer: { lossless_artifact_name: artifactName, source_id: sourceId, text_field: "lossless_text", char_start: match.index, char_end: match.index + match[0].length },
      limitation: "Reference detected inside loaded legal corpus; deterministic M9 does not fetch new URLs."
    });
  }
  return rows;
}

function ingestSourceDiscoveryLegalAbsences({ sourceDiscovery, missingSourceMap, qualityRepairQueue }) {
  const families = sourceDiscovery?.bucket_family_index?.legal_governance_profile_urls?.families;
  if (!families || typeof families !== "object") return;
  for (const [familyCode, family] of Object.entries(families)) {
    for (const absent of asArray(family?.failed_absent)) {
      missingSourceMap.push({
        missing_id: `M6.${makeId(familyCode)}.ABS.${String(missingSourceMap.length + 1).padStart(3, "0")}`,
        missing_or_limited_item: absent.missing || familyCode,
        expected_location: familyCode,
        source_artifact: family.file || `lossless_family__${familyCode}`,
        search_basis: attemptedPaths(absent),
        source_type: "ABSENT_FAMILY",
        source_corpus_status: "STANDALONE_SOURCE_ABSENT",
        artifact_class: inferArtifactClass({ source: { route_type: familyCode }, title: familyCode, text: "" }),
        status: "STANDALONE_SOURCE_ABSENT",
        limitation: "Absence carried from source discovery targeted probe; deterministic M9 does not fetch new URLs."
      });
    }
  }
  if (!Object.keys(families).length) qualityRepairQueue.push(repairRow({ repair_type: "LEGAL_DISCOVERY_INDEX_EMPTY", scope: "source_discovery_handoff", reason: "source_discovery_handoff has no legal_governance_profile_urls families." }));
}

function readSummaryForFamily({ artifactName, family }) {
  const unwrapped = family && typeof family === "object" ? family : {};
  return {
    artifact_name: artifactName,
    supplied: Boolean(family),
    root_family: unwrapped.root_family || stripLosslessPrefix(artifactName),
    sources_count: asArray(unwrapped.sources).length,
    missing_limited_count: asArray(unwrapped.missing_limited_primary_sources).length,
    rejected_count: asArray(unwrapped.rejected_sources).length,
    manifest_only_count: asArray(unwrapped.manifest_only_sources).length,
    metadata_only_count: asArray(unwrapped.metadata_only_sources).length
  };
}

function missingFamilyRow({ artifactName, reason }) {
  return { missing_id: `${makeId(artifactName)}.ABS.000`, missing_or_limited_item: stripLosslessPrefix(artifactName), expected_location: artifactName, source_artifact: artifactName, search_basis: "Artifact not supplied to M9 deterministic layer.", source_type: "ABSENT_FAMILY", source_corpus_status: "UNKNOWN_NOT_SEARCHED", artifact_class: "UNKNOWN_LEGAL_ARTIFACT", status: "UNKNOWN_NOT_SEARCHED", limitation: reason };
}

function missingRowFromSource({ artifactName, row, status }) {
  const name = row.missing || row.document_or_artifact || row.url || row.canonical_url || row.route_type || row.source_id || "Unknown legal/governance item";
  return { missing_id: `${makeId(artifactName)}.ABS.${makeId(String(name)).slice(0, 48)}`, missing_or_limited_item: String(name), expected_location: row.expected_location || row.route_type || stripLosslessPrefix(artifactName), source_artifact: artifactName, search_basis: attemptedPaths(row), source_type: status === "REFERENCED_BUT_NOT_FETCHED" ? "REFERENCED_URL" : "ABSENT_FAMILY", source_corpus_status: status, artifact_class: inferArtifactClass({ source: row, title: String(name), text: "" }), status, limitation: row.limitation || row.reason || row.error || row.status || "Carried from loaded legal/governance source family metadata." };
}

function repairRow({ repair_type, scope, source_artifact = "", document_id = "", pointer = "", reason }) {
  return { repair_type, scope, source_artifact, document_id, pointer, reason, blocking: false, recommended_action: "Route to M9 reinvestigation if this affects downstream navigation; otherwise carry limitation." };
}

function embeddedRowFromUnit(unit) {
  return { embedded_unit_id: unit.section_id, host_document: unit.host_document, internal_unit: unit.internal_unit, unit_type: unit.unit_type, artifact_class: inferArtifactClass({ source: { url: unit.source }, title: unit.internal_unit, text: "" }), relationship_to_host: "EMBEDDED_OR_INTERNAL_LEGAL_UNIT", lossless_artifact_name: unit.lossless_artifact_name, source: unit.source, source_type: "EMBEDDED_UNIT", source_corpus_status: "FOUND_EMBEDDED_IN_LEGAL_CORPUS", status: "FOUND_EMBEDDED_IN_LEGAL_CORPUS", navigation_pointer: unit.navigation_pointer, limitation: "Deterministically detected embedded/internal legal unit; semantic confirmation pending." };
}

function looksLikeHeading(rawLine, index) {
  const line = cleanHeading(rawLine);
  if (!line) return false;
  if (index <= 2 && line.length <= 140) return true;
  if (line.length > 180 || wordCount(line) > 18) return false;
  if (/^(\d+(\.\d+)*|[A-Z]\.|[IVX]+\.|\([a-z0-9]+\))\s+\S+/i.test(line)) return true;
  if (/^(annexure|schedule|exhibit|appendix|addendum|attachment)\b/i.test(line)) return true;
  if (/\b(policy|agreement|terms|notice|privacy|security|support|service level|data processing|acceptable use|subprocessor|retention|deletion|children|minors|breach|incident|confidentiality|intellectual property|ownership|disclaimer|limitations?|indemnity|indemnification)\b/i.test(line) && wordCount(line) <= 12) return true;
  if (line === line.toUpperCase() && /[A-Z]/.test(line) && wordCount(line) <= 12) return true;
  return false;
}

function inferUnitType(heading) {
  if (/^annexure\b/i.test(heading)) return "ANNEXURE";
  if (/^schedule\b/i.test(heading)) return "SCHEDULE";
  if (/^exhibit\b/i.test(heading)) return "EXHIBIT";
  if (/^appendix\b/i.test(heading)) return "APPENDIX";
  if (/^addendum\b/i.test(heading)) return "ADDENDUM";
  if (/notice/i.test(heading)) return "NOTICE";
  return "SECTION";
}

function inferExtractionMethod(heading) {
  if (/^(annexure|schedule|exhibit|appendix|addendum|attachment)\b/i.test(heading)) return "ANNEXURE_PATTERN";
  return "HEADING_SCAN";
}

function isEmbeddedLegalUnit(unit) {
  const text = `${unit.internal_unit} ${unit.unit_type}`.toLowerCase();
  return ["annexure", "schedule", "exhibit", "appendix", "addendum", "data processing", "dpa", "service level", "sla", "support terms", "acceptable use", "subprocessor"].some((needle) => text.includes(needle));
}

function deriveDocumentTitle({ source, text }) {
  const firstLine = splitLinesWithOffsets(text).map((line) => cleanHeading(line.text)).find(Boolean);
  if (firstLine && firstLine.length <= 180) return firstLine;
  if (source.route_type) return titleCase(String(source.route_type).replace(/_/g, " "));
  return inferNameFromUrl(source.final_url || source.url || source.canonical_url || "Loaded legal document");
}

function inferArtifactClass({ source = {}, title = "", text = "" }) {
  const haystack = `${source.route_type || ""} ${source.url || ""} ${source.final_url || ""} ${source.canonical_url || ""} ${title} ${text.slice(0, 500)}`.toLowerCase();
  if (haystack.includes("eula") || haystack.includes("end user license")) return "EULA";
  if (haystack.includes("privacy-policy") || haystack.includes("privacy policy")) return "PRIVACY_POLICY";
  if (haystack.includes("cookie")) return "COOKIE_POLICY";
  if (haystack.includes("terms-of-service") || haystack.includes("terms of service") || /\bterms\b/.test(haystack)) return "TERMS_OF_SERVICE";
  if (haystack.includes("data processing") || haystack.includes("dpa")) return "DATA_PROCESSING_AGREEMENT";
  if (haystack.includes("subprocessor")) return "SUBPROCESSOR_LIST";
  if (haystack.includes("acceptable use") || haystack.includes("aup")) return "ACCEPTABLE_USE_POLICY";
  if (haystack.includes("support")) return "SUPPORT_TERMS";
  if (haystack.includes("service level") || haystack.includes("sla")) return "SLA_SUPPORT_TERMS";
  if (haystack.includes("trust") || haystack.includes("security")) return "TRUST_CENTER";
  if (haystack.includes("legal notice") || haystack.includes("impressum")) return "LEGAL_NOTICE_IMPRESSUM";
  if (haystack.includes("transparency")) return "TRANSPARENCY_REPORT";
  if (haystack.includes("content policy") || haystack.includes("usage policy")) return "CONTENT_POLICY";
  if (haystack.includes("responsible ai") || haystack.includes("ai policy") || haystack.includes("ai terms")) return "AI_TERMS_POLICY";
  return "UNKNOWN_LEGAL_ARTIFACT";
}

function inferDocumentRouteCandidates({ artifactClass = "", title = "", sourceUrl = "", textHead = "" }) {
  const haystack = `${artifactClass} ${title} ${sourceUrl} ${textHead}`.toLowerCase();
  const out = [];
  for (const slot of CORE_DOCUMENT_STACK) if (artifactClass === slot.expected_artifact_class || slot.aliases.some((alias) => haystack.includes(alias))) out.push(slot.route);
  return [...new Set(out.length ? out : ["DOC_UNKNOWN"])].filter((route) => DOCUMENT_ROUTE_VOCAB.includes(route));
}

function inferControlFamilyCandidates(value) {
  const h = String(value || "").toLowerCase();
  const out = [];
  if (/accept|formation|account|authority to bind|order form|subscription|cancel|renew/.test(h)) out.push("FORMATION_CONTRACT");
  if (/disclosure|ai|automated|output|professional|medical|financial|clinical|advice/.test(h)) out.push("ACTIVITY_SPECIFIC_DISCLOSURE");
  if (/privacy|personal data|retention|deletion|children|minors|biometric|voice|consent|rights|request/.test(h)) out.push("DATA_PRIVACY");
  if (/vendor|subprocessor|service provider|transfer|cross-border|location|residency/.test(h)) out.push("VENDORS_TRANSFER");
  if (/security|breach|incident|vulnerability|audit|logging|access/.test(h)) out.push("SECURITY");
  if (/acceptable use|prohibited|abuse|safety|harm|deepfake|impersonation/.test(h)) out.push("USE_SAFETY");
  if (/agent|authority|on behalf|tool|api call|credential|rollback/.test(h)) out.push("AGENT_AUTHORITY");
  if (/ip|intellectual property|copyright|ownership|license|dmca|content/.test(h)) out.push("IP_CONTENT");
  if (/warrant|disclaimer|liability|cap|indemn|payment|billing|sla|support/.test(h)) out.push("COMMERCIAL_LEGAL_ALLOCATION");
  if (/contact|grievance|dpo|privacy officer|support|abuse|security contact/.test(h)) out.push("CONTACT_ROUTES");
  if (/indemni|third[- ]party claims?|defen[cs]e/.test(h)) out.push("INDEMNITY");
  return [...new Set(out)];
}

function inferNoticeType(value) {
  if (/privacy/.test(value)) return "PRIVACY_NOTICE";
  if (/cookie/.test(value)) return "COOKIE_NOTICE";
  if (/children|minors/.test(value)) return "CHILDREN_NOTICE";
  if (/breach|incident/.test(value)) return "BREACH_OR_INCIDENT_NOTICE";
  if (/legal notice|impressum/.test(value)) return "LEGAL_NOTICE";
  if (/grievance|contact|dpo|privacy officer/.test(value)) return "CONTACT_NOTICE";
  if (/vulnerability|security contact/.test(value)) return "SECURITY_NOTICE";
  return "";
}

function isHostedGovernanceArtifact({ artifactClass, artifactName, sourceUrl, title }) {
  const h = `${artifactClass} ${artifactName} ${sourceUrl} ${title}`.toLowerCase();
  return /trust|security|status|vulnerability|transparency|legal hub|notice|hosted/.test(h);
}

function buildClassificationBasis({ source, title, artifactClass, routeCandidates }) {
  return [source.route_type ? "ROUTE_TYPE" : "", source.url || source.final_url ? "URL_PATH" : "", title ? "TITLE_OR_FIRST_HEADING" : "", artifactClass ? "ARTIFACT_CLASS_RULE" : "", routeCandidates.length ? "DOCUMENT_ROUTE_CANDIDATE_RULE" : ""].filter(Boolean).join("|") || "DETERMINISTIC_SOURCE_METADATA";
}

function extractVersionOrDateSignal(value) {
  const text = String(value || "");
  const match = text.match(/(effective|updated|last updated|version)[:\s]+([^\n]{1,80})/i) || text.match(/\b(20\d{2}[-/][01]?\d[-/][0-3]?\d|[A-Z][a-z]+\s+[0-3]?\d,\s+20\d{2})\b/);
  return match ? cleanHeading(match[0]) : "";
}

function pointerIfHeadingLike({ sourceId, artifactName, text, patterns }) {
  const lines = splitLinesWithOffsets(text);
  const line = lines.find((candidate) => patterns.some((pattern) => pattern.test(candidate.text)));
  return line ? { lossless_artifact_name: artifactName, source_id: sourceId, text_field: "lossless_text", line_start: line.line_number, line_end: line.line_number, char_start: line.start, char_end: line.start + line.text.length } : null;
}

function limitRow(limitation_type, limitation, source = {}) {
  return { limitation_type, limitation, affected_ref: source.pointer || source.document_id || source.source_artifact || "", blocking: false, downstream_effect: "Carry limitation; do not block unless source custody or final artifact shape is unsafe." };
}

function countBy(rows, fn) {
  const out = {};
  for (const row of rows) {
    const key = fn(row);
    out[key] = (out[key] || 0) + 1;
  }
  return out;
}

function splitLinesWithOffsets(text) {
  const rows = [];
  const parts = String(text || "").split(/\n/);
  let offset = 0;
  for (let i = 0; i < parts.length; i += 1) {
    rows.push({ line_number: i + 1, start: offset, text: parts[i] });
    offset += parts[i].length + 1;
  }
  return rows;
}

function cleanHeading(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function wordCount(value) {
  return cleanHeading(value).split(/\s+/).filter(Boolean).length;
}

function attemptedPaths(row) {
  if (Array.isArray(row?.attempted_paths) && row.attempted_paths.length) return row.attempted_paths.join(", ");
  if (Array.isArray(row?.searched_paths) && row.searched_paths.length) return row.searched_paths.join(", ");
  if (row?.search_basis) return String(row.search_basis);
  if (row?.url || row?.canonical_url) return String(row.url || row.canonical_url);
  return "Source family metadata / source discovery handoff.";
}

function stripLosslessPrefix(value) {
  return String(value || "").replace(/^lossless_family__/, "");
}

function makeId(value) {
  return String(value || "UNKNOWN").toUpperCase().replace(/[^A-Z0-9]+/g, ".").replace(/^\.+|\.+$/g, "").slice(0, 96) || "UNKNOWN";
}

function inferNameFromUrl(url) {
  const clean = stripTrailingPunctuation(String(url || ""));
  try {
    const parsed = new URL(clean);
    const last = parsed.pathname.split("/").filter(Boolean).pop() || parsed.hostname;
    return titleCase(decodeURIComponent(last).replace(/[-_]/g, " "));
  } catch {
    return titleCase(clean.replace(/[-_]/g, " ").slice(0, 80) || "Referenced Legal Artifact");
  }
}

function stripTrailingPunctuation(value) {
  return String(value || "").replace(/[.,;:]+$/g, "");
}

function titleCase(value) {
  return String(value || "").replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).trim();
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function unwrapArtifact(value) {
  if (!value || typeof value !== "object") return value;
  if (value.artifact && typeof value.artifact === "object") return value.artifact;
  return value;
}

function findRunId(artifacts) {
  for (const value of Object.values(artifacts || {})) {
    const artifact = unwrapArtifact(value);
    if (artifact?.run_id) return artifact.run_id;
  }
  return "";
}

function dedupeRows(rows, keyFn) {
  const seen = new Set();
  const out = [];
  for (const row of rows) {
    const key = keyFn(row);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

function resolveMapStatus({ documentMap, sourceArtifactsRead, qualityRepairQueue }) {
  if (!sourceArtifactsRead.some((row) => row.supplied)) return "CONTROLLED_FAILURE";
  if (!documentMap.length) return "LOCKED_WITH_LIMITATIONS";
  if (qualityRepairQueue.length) return "LOCKED_WITH_LIMITATIONS";
  return "LOCKED";
}
