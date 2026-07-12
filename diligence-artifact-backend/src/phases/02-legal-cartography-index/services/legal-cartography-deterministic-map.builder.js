const LEGAL_GOVERNANCE_SOURCE_ARTIFACTS = Object.freeze([
  "lossless_root__company_identity",
  "lossless_root__contact_notice",
  "lossless_root__privacy_data_processing",
  "lossless_root__security_trust_compliance",
  "lossless_root__data_governance_controls",
  "lossless_root__ai_safety_transparency",
  "lossless_root__technical_docs_api",
  "lossless_root__docs_api_data_flow",
  "lossless_root__regulatory_licensing_status",
  "lossless_root__grievance_complaints"
]);
const LEGAL_DOC_CONTROL_ARTIFACTS = Object.freeze(["legal_doc_inventory", "legal_doc_extraction_index", "legal_doc_lossless_validation_manifest"]);
const REGISTRY_SUBCAT_VOCAB = Object.freeze(["CNS", "LIA", "HAL", "INF", "PRV", "BIO", "DEC", "HRM", "FRD", "TRD", "REGULATORY_DISCLOSURE", "LICENSING_REGISTRATION", "GRIEVANCE_REDRESSAL", "COMPLAINTS_ESCALATION", "CONSUMER_DISCLOSURE", "COUNTERPARTY_INSTITUTION", "FINANCIAL_TERMS_DISCLOSURE"]);
const CONTROL_LANGUAGE_FAMILY_VOCAB = Object.freeze(["FORMATION_CONTRACT", "ACTIVITY_SPECIFIC_DISCLOSURE", "DATA_PRIVACY", "VENDORS_TRANSFER", "SECURITY", "USE_SAFETY", "AGENT_AUTHORITY", "IP_CONTENT", "COMMERCIAL_LEGAL_ALLOCATION", "CONTACT_ROUTES", "INDEMNITY", "REGULATORY_GOVERNANCE", "GRIEVANCE_REDRESSAL", "CONSUMER_DISCLOSURE", "COUNTERPARTY_INSTITUTION", "FINANCIAL_TERMS_DISCLOSURE", "UNKNOWN_CONTROL_LANGUAGE"]);
const UNIT_TYPE_VOCAB = Object.freeze(["DOCUMENT_TITLE", "SECTION", "SUBSECTION", "ANNEXURE", "SCHEDULE", "APPENDIX", "ADDENDUM", "EXHIBIT", "NOTICE"]);
const MAX_UNITS_PER_SOURCE = 90;
const MAX_QUEUE_PER_SOURCE = 30;

export const M9_DETERMINISTIC_ARTIFACT_NAME = "legal_cartography_deterministic_map";

export function buildM9DeterministicMap({ run = {}, artifacts = {} } = {}) {
  const sourceDiscovery = unwrapArtifact(artifacts.source_discovery_handoff);
  const runId = run.run_id || sourceDiscovery?.run_id || findRunId(artifacts) || "UNKNOWN_RUN";
  const targetUrl = run.target_url || sourceDiscovery?.target_url || run.root_url || sourceDiscovery?.root_url || "";
  const sourceArtifactsRead = [];
  const documentMap = [];
  const artifactInventoryMap = [];
  const legalDocumentIndex = [];
  const macroUnitMap = [];
  const embeddedUnitMap = [];
  const noticeCandidateMap = [];
  const controlLanguageCandidateMap = [];
  const indemnityCandidateMap = [];
  const legalNoticeContactSignalMap = [];
  const liabilityCapSignalMap = [];
  const slaSupportSignalMap = [];
  const regulatoryGovernanceLocatorMap = [];
  const grievanceRedressalLocatorMap = [];
  const consumerDisclosureLocatorMap = [];
  const counterpartyInstitutionLocatorMap = [];
  const crossDocumentReferenceMap = [];
  const artifactAbsenceAccessMap = [];
  const missingSourceMap = [];
  const semanticLabelQueue = [];
  const qualityRepairQueue = [];
  const collected = collectLegalGovernanceSources(artifacts);

  for (const route of collected.routes) sourceArtifactsRead.push(route);
  for (const gap of collected.gaps) pushMissing({ missingSourceMap, artifactAbsenceAccessMap }, gap);
  for (const source of collected.sources) ingestSource({ source, documentMap, artifactInventoryMap, legalDocumentIndex, macroUnitMap, embeddedUnitMap, noticeCandidateMap, controlLanguageCandidateMap, indemnityCandidateMap, legalNoticeContactSignalMap, liabilityCapSignalMap, slaSupportSignalMap, regulatoryGovernanceLocatorMap, grievanceRedressalLocatorMap, consumerDisclosureLocatorMap, counterpartyInstitutionLocatorMap, crossDocumentReferenceMap, semanticLabelQueue, qualityRepairQueue });

  const mapStatus = !documentMap.length ? "CONTROLLED_FAILURE" : qualityRepairQueue.length || missingSourceMap.length ? "LOCKED_WITH_LIMITATIONS" : "LOCKED";
  return {
    [M9_DETERMINISTIC_ARTIFACT_NAME]: {
      run_id: runId,
      target_url: targetUrl,
      generated_by: "m9_hybrid_deterministic_layer",
      schema_version: "M9_DETERMINISTIC_LEGAL_STACK_INDEX_v11_PHASE1_V5_REGULATORY_GRIEVANCE_SYNC",
      model_used: false,
      artifact_role: "Indexes loaded legal/governance documents and maps regulatory/grievance governance locators from Phase 1 v5 common-root and legal_doc corpus only.",
      active_registry_context: { active_registry_domain: "AI_PRODUCT_LEGAL_EXPOSURE", registry_row_id_schema: "{ARCHETYPE}_{SUBCAT}_{VARIANT}", archetype_gate_owned_by: "ACTIVITY_PROFILE_REVIEW", surface_gate_owned_by: "ACTIVITY_PROFILE_REVIEW_AND_DATA_PROVENANCE_PROFILE", subcat_relevance_owned_by: "M9_SEMANTIC_LAYER", row_status_owned_by: "EXPOSURE_PROFILE", m9_role: "legal_stack_navigation_and_semantic_label_support_only", registry_application_forbidden_in_layer_1: true },
      deterministic_vocabularies: { registry_subcat_vocab: [...REGISTRY_SUBCAT_VOCAB], control_language_family_vocab: [...CONTROL_LANGUAGE_FAMILY_VOCAB], unit_type_vocab: [...UNIT_TYPE_VOCAB], semantic_queue_priority_vocab: ["P0", "P1", "P2", "P3"] },
      source_text_policy: { source_artifacts_remain_source_of_truth: true, full_legal_text_copied_into_map: false, full_control_text_copied_into_map: false, downstream_must_use_navigation_pointers_to_read_source_text: true },
      source_artifacts_read: dedupeRows(sourceArtifactsRead, (row) => row.artifact_name),
      artifact_inventory_map: dedupeRows(artifactInventoryMap, (row) => row.artifact_id),
      legal_document_index: dedupeRows(legalDocumentIndex, (row) => row.document_id),
      macro_unit_map: dedupeRows(macroUnitMap, (row) => row.unit_id),
      embedded_unit_map: dedupeRows(embeddedUnitMap, (row) => row.embedded_unit_id),
      notice_candidate_map: dedupeRows(noticeCandidateMap, (row) => row.notice_id),
      control_language_candidate_map: dedupeRows(controlLanguageCandidateMap, (row) => row.control_candidate_id),
      indemnity_candidate_map: dedupeRows(indemnityCandidateMap, (row) => row.indemnity_candidate_id),
      legal_notice_contact_signal_map: dedupeRows(legalNoticeContactSignalMap, (row) => row.signal_id),
      liability_cap_signal_map: dedupeRows(liabilityCapSignalMap, (row) => row.signal_id),
      sla_support_signal_map: dedupeRows(slaSupportSignalMap, (row) => row.signal_id),
      regulatory_governance_locator_map: dedupeRows(regulatoryGovernanceLocatorMap, (row) => row.locator_id),
      grievance_redressal_locator_map: dedupeRows(grievanceRedressalLocatorMap, (row) => row.locator_id),
      consumer_disclosure_locator_map: dedupeRows(consumerDisclosureLocatorMap, (row) => row.locator_id),
      counterparty_institution_locator_map: dedupeRows(counterpartyInstitutionLocatorMap, (row) => row.locator_id),
      cross_document_reference_map: dedupeRows(crossDocumentReferenceMap, (row) => row.cross_reference_id),
      artifact_absence_access_map: dedupeRows(artifactAbsenceAccessMap, (row) => row.absence_id),
      semantic_label_queue: dedupeRows(semanticLabelQueue, (row) => row.queue_id),
      legal_governance_source_coverage: { input_contract: "phase1_v5_17_root_common_roots_plus_individual_legal_doc_artifacts", phase1_common_roots_plus_legal_doc_artifacts: true, source_artifact_count: sourceArtifactsRead.length, loaded_document_count: documentMap.length, macro_unit_count: macroUnitMap.length, embedded_unit_count: embeddedUnitMap.length, semantic_label_queue_count: semanticLabelQueue.length, missing_or_limited_count: missingSourceMap.length, regulatory_governance_locator_count: regulatoryGovernanceLocatorMap.length, grievance_redressal_locator_count: grievanceRedressalLocatorMap.length, consumer_disclosure_locator_count: consumerDisclosureLocatorMap.length, counterparty_institution_locator_count: counterpartyInstitutionLocatorMap.length },
      cartography_limitations: buildLimitations({ documentMap, macroUnitMap, missingSourceMap, qualityRepairQueue }),
      document_map: dedupeRows(documentMap, (row) => row.document_id),
      section_map: dedupeRows(macroUnitMap, (row) => row.section_id),
      referenced_document_map: [],
      missing_source_map: dedupeRows(missingSourceMap, (row) => row.missing_id),
      quality_repair_queue: dedupeRows(qualityRepairQueue, (row) => [row.repair_type, row.scope, row.pointer || row.document_id || row.source_artifact].join("|")),
      downstream_rules: { m9_deterministic_layer_only: true, legal_stack_index_only: true, semantic_queue_is_authoritative_for_semantic_coverage: true, clause_level_units_disabled: true, no_new_url_discovery: true, no_new_extraction: true, use_only_phase1_v5_legal_common_roots_and_legal_doc_artifacts: true, phase1_v5_source_contract_required: true, old_family_input_contract_forbidden: true, map_not_parallel_evidence: true, semantic_labels_pending: true, qr_legal_signal_maps_derived_from_loaded_corpus_only: true, target_profile_legal_signal_locators_owned_by_2a: true, full_legal_governance_cartography_owned_by_2f: true, regulatory_grievance_conclusions_forbidden: true },
      status: mapStatus,
      lock_status: mapStatus
    }
  };
}

function collectLegalGovernanceSources(artifacts = {}) {
  const sources = [];
  const routes = [];
  const gaps = [];
  for (const artifactName of LEGAL_GOVERNANCE_SOURCE_ARTIFACTS) {
    const artifact = unwrapArtifact(artifacts[artifactName]);
    const rows = collectSourcesFromArtifact({ artifactName, artifact, sourceClass: "common_root", docType: artifactName.replace(/^lossless_root__/, "") });
    routes.push(readSummaryForArtifact({ artifactName, artifact, sourceCount: rows.length, sourceClass: "common_root" }));
    if (!rows.length) gaps.push(missingSourceRow({ artifactName, reason: "No loaded source rows in Phase 1 v5 legal/governance common-root artifact." }));
    sources.push(...rows);
  }
  for (const artifactName of LEGAL_DOC_CONTROL_ARTIFACTS) routes.push(readSummaryForArtifact({ artifactName, artifact: unwrapArtifact(artifacts[artifactName]), sourceCount: 0, sourceClass: "legal_doc_control" }));
  const docs = legalDocumentsFromInventory(unwrapArtifact(artifacts.legal_doc_inventory));
  if (!docs.length) gaps.push(missingSourceRow({ artifactName: "legal_doc_inventory", reason: "No legal_doc inventory rows available." }));
  for (const doc of docs) {
    const artifactName = doc.artifact_name || doc.legal_doc_artifact_name || doc.legal_doc_artifact_hint || (doc.doc_type ? `legal_doc_${normalizeSlug(doc.doc_type)}` : "");
    if (!artifactName) continue;
    const artifact = unwrapArtifact(artifacts[artifactName]);
    const docType = normalizeSlug(doc.doc_type || doc.legal_doc_type || artifact?.doc_type || artifact?.document_type || artifactName.replace(/^legal_doc_/, ""));
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
  const { source, documentMap, artifactInventoryMap, legalDocumentIndex, macroUnitMap, embeddedUnitMap, noticeCandidateMap, controlLanguageCandidateMap, indemnityCandidateMap, legalNoticeContactSignalMap, liabilityCapSignalMap, slaSupportSignalMap, regulatoryGovernanceLocatorMap, grievanceRedressalLocatorMap, consumerDisclosureLocatorMap, counterpartyInstitutionLocatorMap, crossDocumentReferenceMap, semanticLabelQueue, qualityRepairQueue } = ctx;
  const text = String(source.lossless_text || "");
  const artifactName = source.source_artifact_name || "unknown_source_artifact";
  const sourceId = source.source_id || `${artifactName}.SRC.001`;
  const documentId = makeId(sourceId);
  const sourceUrl = source.final_url || source.url || source.canonical_url || "";
  const title = deriveDocumentTitle({ source, text });
  const artifactClass = inferArtifactClass({ source, title, sourceUrl, textHead: text.slice(0, 1200) });
  const rootFamily = source.source_class || source.doc_type || artifactName.replace(/^lossless_root__/, "").replace(/^legal_doc_/, "");
  const textPointer = { source_artifact_name: artifactName, lossless_artifact_name: artifactName, source_id: sourceId, text_field: "lossless_text", sha256: source.sha256 || "", char_count: text.length };
  const documentRow = stripEmpty({ document_id: documentId, artifact_id: documentId, document_or_artifact: title, artifact_class: artifactClass, artifact_family: rootFamily, source_artifact_name: artifactName, lossless_artifact_name: artifactName, root_family: rootFamily, source: sourceUrl, source_url: sourceUrl, canonical_url: source.canonical_url || source.url || "", source_type: source.source_class === "legal_doc" ? "LEGAL_DOC_ARTIFACT" : "URL", source_corpus_status: text ? "FOUND_AS_PRIMARY_SOURCE" : "FOUND_THIN", status: text ? "FOUND_INDEXED" : "FOUND_THIN", document_role: source.materiality || "Loaded legal/governance source.", version_or_effective_date_signal: extractVersionOrDateSignal(text.slice(0, 1200)), text_pointer: textPointer, navigation_pointer: textPointer, limitation: text ? "" : "Loaded source has no lossless_text available." });
  documentMap.push(documentRow);
  artifactInventoryMap.push({ artifact_id: documentId, document_id: documentId, document_name: title, artifact_class: artifactClass, artifact_family: rootFamily, artifact_status: documentRow.status, source_url: sourceUrl, canonical_url: source.canonical_url || source.url || "", lossless_artifact_name: artifactName, source_artifact_name: artifactName, classification_basis: "SOURCE_URL|TITLE_OR_FIRST_HEADING|LEGAL_ARTIFACT_CLASS_RULE", boundary_note: "Document inventory only." });
  if (!text) { qualityRepairQueue.push(repairRow({ repair_type: "MISSING_LOSSLESS_TEXT", scope: "document", document_id: documentId, source_artifact: artifactName, pointer: sourceId, reason: "Source row exists but lossless_text is empty." })); return; }

  const units = extractMacroUnits({ artifactName, sourceId, documentId, text, artifactClass, title, sourceUrl });
  if (!units.length) qualityRepairQueue.push(repairRow({ repair_type: "MACRO_UNIT_MAP_THIN", scope: "document", document_id: documentId, source_artifact: artifactName, pointer: sourceId, reason: "No reliable section or subsection headings were found." }));
  legalDocumentIndex.push({ document_id: documentId, document_title: title, artifact_class: artifactClass, source_url: sourceUrl, source_corpus_status: "FOUND_AS_PRIMARY_SOURCE", macro_unit_count: units.length, macro_unit_ids: units.map((unit) => unit.unit_id), limitation: units.length ? "" : "No reliable section/subsection boundaries were detected." });

  for (const unit of units) {
    macroUnitMap.push(unit);
    const body = sliceUnitText(text, unit);
    const searchable = `${unit.heading_label}\n${body}`;
    if (["ANNEXURE", "SCHEDULE", "APPENDIX", "ADDENDUM", "EXHIBIT"].includes(unit.unit_type)) embeddedUnitMap.push({ embedded_unit_id: unit.unit_id, section_id: unit.section_id, document_id: unit.document_id, host_document_id: unit.document_id, internal_unit: unit.heading_label, unit_type: unit.unit_type, artifact_class: classifyEmbeddedUnit(unit.heading_label), source: sourceUrl, source_type: "EMBEDDED_UNIT", source_corpus_status: "FOUND_EMBEDDED_IN_LEGAL_CORPUS", status: "FOUND_EMBEDDED_IN_LEGAL_CORPUS", navigation_pointer: unit.location_reference, limitation: "Embedded unit indexed inside host document." });
    if (unit.unit_type === "NOTICE" || /^contact|^grievance|^notice$/i.test(unit.heading_label)) noticeCandidateMap.push({ notice_id: `${unit.unit_id}.NOTICE`, document_id: unit.document_id, unit_id: unit.unit_id, notice_candidate_label: unit.heading_label, source_corpus_status: "FOUND_EMBEDDED_IN_LEGAL_CORPUS", status: "FOUND_INDEXED", navigation_pointer: unit.location_reference, boundary_note: "Notice candidate only. Semantic label belongs to canonical M9 instructions." });
    for (const familyLabel of inferControlFamilies(unit.heading_label)) controlLanguageCandidateMap.push({ control_candidate_id: `${unit.unit_id}.${familyLabel}`, document_id: unit.document_id, unit_id: unit.unit_id, section_id: unit.section_id, control_language_family_candidate: familyLabel, source_corpus_status: "FOUND_EMBEDDED_IN_LEGAL_CORPUS", status: "FOUND_INDEXED", navigation_pointer: unit.location_reference, boundary_note: "Control-language candidate only. Semantic confirmation belongs to canonical M9 instructions." });
    if (/indemn/i.test(unit.heading_label)) indemnityCandidateMap.push({ indemnity_candidate_id: `${unit.unit_id}.INDEMNITY`, document_id: unit.document_id, unit_id: unit.unit_id, section_id: unit.section_id, indemnity_clause_location: unit.heading_label, source_corpus_status: "FOUND_EMBEDDED_IN_LEGAL_CORPUS", status: "FOUND_INDEXED", navigation_pointer: unit.location_reference, boundary_note: "Indemnity location candidate only." });
    deriveQrSignalRows({ unit, body, documentId, artifactClass, legalNoticeContactSignalMap, liabilityCapSignalMap, slaSupportSignalMap });
    pushGovernanceLocators({ unit, body: searchable, regulatoryGovernanceLocatorMap, grievanceRedressalLocatorMap, consumerDisclosureLocatorMap, counterpartyInstitutionLocatorMap });
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

function pushGovernanceLocators({ unit, body, regulatoryGovernanceLocatorMap, grievanceRedressalLocatorMap, consumerDisclosureLocatorMap, counterpartyInstitutionLocatorMap }) {
  const base = { document_id: unit.document_id, unit_id: unit.unit_id, heading_label: unit.heading_label, source_corpus_status: "FOUND_EMBEDDED_IN_LEGAL_CORPUS", status: "FOUND_INDEXED", navigation_pointer: unit.location_reference, index_only: true, legal_or_regulatory_conclusion_forbidden: true };
  if (/licen[cs]e|registration|regulatory|authori[sz]ed|fair practice|key fact statement|kfs|mitc|schedule of charges|interest rate policy|responsible lending/i.test(body)) regulatoryGovernanceLocatorMap.push({ ...base, locator_id: `${unit.unit_id}.REGULATORY`, locator_type: "REGULATORY_DISCLOSURE_LOCATOR", limitation: "Locator only. M9 does not determine license validity, license requirement, regulator applicability, or compliance status." });
  if (/grievance|complaint|ombudsman|nodal officer|redressal|escalation|appeal/i.test(body)) grievanceRedressalLocatorMap.push({ ...base, locator_id: `${unit.unit_id}.GRIEVANCE`, locator_type: "GRIEVANCE_REDRESSAL_LOCATOR", limitation: "Locator only. M9 does not determine grievance sufficiency, ombudsman requirement, or statutory complaint obligation." });
  if (/consumer disclosure|borrower|customer protection|fair practice|charges|fees|interest rate|key fact|loan terms|mitc/i.test(body)) consumerDisclosureLocatorMap.push({ ...base, locator_id: `${unit.unit_id}.CONSUMERDISCLOSURE`, locator_type: "CONSUMER_DISCLOSURE_LOCATOR", limitation: "Locator only. No consumer-law compliance conclusion generated." });
  if (/bank partner|partner bank|sponsor bank|nbfc partner|lending partner|payment partner|escrow|issuer|custodian/i.test(body)) counterpartyInstitutionLocatorMap.push({ ...base, locator_id: `${unit.unit_id}.COUNTERPARTY`, locator_type: "COUNTERPARTY_INSTITUTION_LOCATOR", limitation: "Locator only. Counterparty/institution signal is not a legal relationship conclusion." });
}

function deriveQrSignalRows({ unit, body, documentId, artifactClass, legalNoticeContactSignalMap, liabilityCapSignalMap, slaSupportSignalMap }) {
  const heading = unit.heading_label || "";
  const searchable = `${heading}\n${body}`;
  const base = { document_id: documentId, unit_id: unit.unit_id, heading_label: heading, artifact_class: artifactClass, source_corpus_status: "FOUND_EMBEDDED_IN_LEGAL_CORPUS", status: "FOUND_INDEXED", navigation_pointer: unit.location_reference, index_only: true };
  if (/legal notice|notice|contact|grievance|data protection officer|privacy governance/i.test(searchable)) legalNoticeContactSignalMap.push(stripEmpty({ ...base, signal_id: `${unit.unit_id}.QRNOTICE`, legal_notice_emails: extractEmails(body), legal_notice_contact_route: heading || "Notice/contact unit", legal_notice_contact_source: documentId, legal_notice_contact_limitation: "Derived from loaded legal corpus at unit level; verify before reliance.", registry_basis: ["LGC.NOT.010", "LGC.NOT.011", "LGC.NOT.012", "LGC.NOT.013"] }));
  if (/limitation of liability|aggregate liability|cap on liability|maximum liability|liability cap|indirect damages|consequential damages/i.test(searchable)) liabilityCapSignalMap.push(stripEmpty({ ...base, signal_id: `${unit.unit_id}.QRLOL`, clause_location: heading || "Liability unit", cap_formula_reference_basis: capFormulaSignal(body), cap_period_lookback_window: periodSignal(body), exclusions_carveouts_signal: carveoutSignal(body), fees_pricing_reference_signal: feesSignal(body), private_value_required: /fees paid|amount paid|order form|contract value|subscription fees/i.test(body) ? "Yes - cap appears tied to fees/order form/contract value." : "Confirm during qualified review.", limitation: "Derived as a legal-signal map only; M9 does not compute legal effect or cap amount.", registry_basis: ["LGC.LOL.001", "LGC.LOL.002", "LGC.LOL.003", "LGC.LOL.004", "LGC.LOL.005", "LGC.LOL.006", "LGC.LOL.007"] }));
  if (/service level|\bsla\b|support services|support terms|availability|uptime|service credits|response time|maintenance/i.test(searchable)) slaSupportSignalMap.push(stripEmpty({ ...base, signal_id: `${unit.unit_id}.QRSLA`, sla_support_artifact_found: "SLA/support signal found in loaded legal corpus.", availability_uptime_commitment_signal: /availability|uptime|service level/i.test(body) ? "Availability/uptime/service-level language visible at locator." : "No uptime language visible in this unit.", service_credit_remedy_signal: /service credit|credit remedy|credits/i.test(body) ? "Service-credit/remedy language visible at locator." : "No service-credit language visible in this unit.", support_tier_response_commitment_signal: /response time|support tier|priority support|business hours/i.test(body) ? "Support-tier/response language visible at locator." : "No support-tier/response language visible in this unit.", standard_vs_custom_sla_posture: /order form|separate agreement|enterprise|custom/i.test(body) ? "Private/order-form or custom SLA confirmation may be required." : "Public/embedded support posture signal only.", sla_exclusions_dependencies_signal: /maintenance|downtime|third party|excluded|scheduled/i.test(body) ? "Exclusion/dependency language visible at locator." : "No exclusion/dependency language visible in this unit.", private_confirmation_required: "Qualified review must confirm whether public terms or private order-form terms control.", registry_basis: ["LGC.SLA.001", "LGC.SLA.002", "LGC.SLA.003", "LGC.SLA.004", "LGC.SLA.005", "LGC.SLA.006", "LGC.SLA.007", "LGC.SLA.008"] }));
}

function extractMacroUnits({ artifactName, sourceId, documentId, text, artifactClass, title, sourceUrl }) {
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
    if (!titleAdded && isDocumentTitleLine({ heading, title, titleKey })) { candidates.push({ line: i + 1, heading: title, char_start: charStart, unit_type: "DOCUMENT_TITLE" }); titleAdded = true; continue; }
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
    return { unit_id: unitId, section_id: unitId, artifact_reference: documentId, document_id: documentId, unit_type: item.unit_type, heading_label: item.heading, heading_level: inferHeadingLevel(item.unit_type), parent_unit_id: "", child_unit_ids: [], relationship_to_host: "HOSTS_UNIT", source: sourceUrl, source_corpus_status: "FOUND_EMBEDDED_IN_LEGAL_CORPUS", status: "FOUND_INDEXED", lossless_artifact_name: artifactName, source_artifact_name: artifactName, location_reference: { lossless_artifact_name: artifactName, source_artifact_name: artifactName, source_id: sourceId, text_field: "lossless_text", line_start: item.line, line_end: next ? Math.max(item.line, next.line - 1) : lines.length, char_start: item.char_start, char_end: charEnd, char_count: Math.max(0, charEnd - item.char_start) }, extraction_method: item.unit_type === "SECTION" || item.unit_type === "SUBSECTION" ? "HEADING_INDEX" : `${item.unit_type}_PATTERN`, confidence: "DETERMINISTIC_CANDIDATE", boundary_note: "Structural unit pointer only." };
  });
  const stack = [];
  for (const unit of units) {
    const level = Number(unit.heading_level || 0);
    if (level > 0) {
      for (let idx = level; idx < stack.length; idx += 1) stack[idx] = null;
      const parent = [...stack].slice(0, level).reverse().find(Boolean);
      if (parent) { unit.parent_unit_id = parent.unit_id; parent.child_unit_ids.push(unit.unit_id); unit.relationship_to_host = "CHILD_UNIT"; }
    }
    stack[level] = unit;
  }
  return units;
}

function classifyStructuralHeading({ heading, previous, next, artifactClass }) { if (!isStructurallyCleanHeading({ heading, previous, next })) return ""; if (isEmbeddedUnitHeading(heading)) return inferEmbeddedUnitType(heading); if (isSectionMarkerHeading(heading)) return "SECTION"; if (isSubsectionMarkerHeading(heading)) return "SUBSECTION"; if (isKnownShortLegalHeading(heading, artifactClass)) return inferNamedHeadingType(heading); return ""; }
function isStructurallyCleanHeading({ heading, previous, next }) { if (!heading || heading.length < 3 || heading.length > 120) return false; if (isPageFurniture(heading)) return false; if (isClauseText(heading)) return false; if (isThirdLevelOrDeeperNumbering(heading)) return false; if (/^[a-z]/.test(heading)) return false; if (/^\(?[ivx]+\)?[.)]\s+/i.test(heading)) return false; if (previous && /[,;:]$/.test(previous)) return false; if (next && /^[a-z]/.test(next)) return false; return true; }
function isClauseText(heading) { if (/[.!?]$/.test(heading) && !isEmbeddedUnitHeading(heading)) return true; if (/[,:;]$/.test(heading) && !isEmbeddedUnitHeading(heading)) return true; const words = heading.split(/\s+/).filter(Boolean); if (words.length > 10 && !isEmbeddedUnitHeading(heading)) return true; if (words.length > 6 && /\b(will|shall|must|may|cannot|agree|retain|provide|completed|access|use|payment|notice|unless|within)\b/i.test(heading)) return true; return false; }
function isEmbeddedUnitHeading(heading) { return /^(annexure|schedule|appendix|exhibit|addendum)\s+[a-z0-9]+\b\s*[:.-]?\s+[A-Z][A-Za-z0-9/&()\-\s]{2,100}$/i.test(heading); }
function inferEmbeddedUnitType(heading) { if (/^annexure\b/i.test(heading)) return "ANNEXURE"; if (/^schedule\b/i.test(heading)) return "SCHEDULE"; if (/^appendix\b/i.test(heading)) return "APPENDIX"; if (/^exhibit\b/i.test(heading)) return "EXHIBIT"; return "ADDENDUM"; }
function isSectionMarkerHeading(heading) { return /^(section|article)\s+\d+\s*[:.-]\s+[A-Z][A-Za-z0-9/&()\-\s]{2,90}$/i.test(heading) || /^\d+[.)]\s+[A-Z][A-Za-z0-9/&()\-\s]{2,90}$/.test(heading); }
function isSubsectionMarkerHeading(heading) { return /^\d+\.\d+[.)]?\s+[A-Z][A-Za-z0-9/&()\-\s]{2,90}$/.test(heading) && !isThirdLevelOrDeeperNumbering(heading); }
function isThirdLevelOrDeeperNumbering(heading) { return /^\d+\.\d+\.\d+/.test(heading); }
function isKnownShortLegalHeading(heading, artifactClass) { return isTitleCaseHeading(heading) && knownLegalHeadingPattern().test(heading) && (artifactClass !== "PRIVACY_POLICY" || !/^privacy policy for\b/i.test(heading)); }
function inferNamedHeadingType(heading) { if (/\bnotice|contact|grievance|complaint|privacy policy\b/i.test(heading)) return "NOTICE"; return "SECTION"; }
function isDocumentTitleLine({ heading, title, titleKey }) { if (!titleKey) return false; return normalizeComparable(heading) === titleKey || (!/[.!?]$/.test(heading) && normalizeComparable(heading).includes(titleKey)); }
function buildSemanticLabelQueue({ units, artifactClass, documentId }) { const rows = []; for (const unit of units) { const decision = semanticQueueDecision({ unit, artifactClass }); if (!decision) continue; rows.push({ queue_id: `${unit.unit_id}.SEMANTIC_QUEUE`, unit_id: unit.unit_id, section_id: unit.section_id, document_id: unit.document_id || documentId, heading_label: unit.heading_label, unit_type: unit.unit_type, priority: decision.priority, semantic_label_required: ["P0", "P1"].includes(decision.priority), semantic_reason: decision.reason, suggested_control_family_candidates: inferControlFamilies(unit.heading_label), suggested_subcat_candidates: inferSubcats(unit.heading_label), navigation_pointer: unit.location_reference }); } return rows.sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority)); }
function semanticQueueDecision({ unit, artifactClass }) { const h = unit.heading_label || ""; if (!h || unit.unit_type === "DOCUMENT_TITLE") return null; if (!UNIT_TYPE_VOCAB.includes(unit.unit_type)) return null; if (isClauseText(h) || isPageFurniture(h)) return null; if (["ANNEXURE", "SCHEDULE", "APPENDIX", "ADDENDUM", "EXHIBIT"].includes(unit.unit_type)) return { priority: "P0", reason: "embedded_legal_unit" }; if (/regulatory|licen[cs]e|registration|fair practice|key fact|schedule of charges|grievance|complaint|ombudsman|nodal/i.test(h)) return { priority: "P0", reason: "regulatory_grievance_governance_unit" }; if (/data processing|dpa|sub-?processor|personal data|data retention|data security|cross-border data|children's privacy|privacy and data security|security/i.test(h)) return { priority: "P0", reason: "privacy_data_or_security_unit" }; if (/indemn|liability|warranty|disclaimer|damages|governing law|jurisdiction|dispute|termination/i.test(h)) return { priority: "P0", reason: "liability_or_legal_allocation_unit" }; if (/intellectual property|copyright|ownership|license restrictions|content and output|model training|training|reverse engineer|trademark/i.test(h)) return { priority: "P1", reason: "ip_content_or_usage_unit" }; if (/acceptable use|prohibited use|restrictions/i.test(h)) return { priority: "P1", reason: "use_safety_unit" }; if (/contact|support services|service level|sla|billing|payment|cancellation|consent|data subject|data principal/i.test(h)) return { priority: "P1", reason: "material_notice_or_control_unit" }; if (artifactClass === "PRIVACY_POLICY" && /data|privacy|security|notice/i.test(h)) return { priority: "P1", reason: "privacy_document_material_unit" }; return null; }
function knownLegalHeadingPattern() { return /\b(terms|privacy policy|data retention|data security|cross-border data|data processing|data sub-processors|acceptable use|prohibited use|ownership|intellectual property|confidentiality|warrant(y|ies)|disclaimer|limitation of liability|indemnification|indemnity|governing law|jurisdiction|termination|payment|billing|security|trust center|notice|contact|grievance|complaints|ombudsman|regulatory|licen[cs]e|registration|fair practice|key fact statement|schedule of charges|definitions|complete agreement|license restrictions|grant of license|third party programs|your content and output|rights reserved|ai model training|children's privacy|consent management|data principal|data subject|support services|service level agreement|service credits|service administration|software license|service accounts|eligibility|dispute resolution|sub-processors|cookies)\b/i; }
function isPageFurniture(value) { return /^(platform|developers|resources|company|sign up|contact us|home|about|blog|careers|login|request demo|book demo|copyright|all rights reserved)(\s|$)/i.test(value) || /sign up contact us/i.test(value); }
function inferHeadingLevel(unitType) { if (unitType === "DOCUMENT_TITLE") return 0; if (unitType === "SUBSECTION") return 2; return 1; }
function classifyEmbeddedUnit(label) { if (/data processing|dpa/i.test(label)) return "DATA_PROCESSING_AGREEMENT"; if (/fair practice|key fact|schedule of charges|interest rate|responsible lending/i.test(label)) return "REGULATORY_DISCLOSURE"; if (/grievance|complaint|ombudsman/i.test(label)) return "GRIEVANCE_POLICY"; if (/service level|sla|support/i.test(label)) return "SLA_SUPPORT_TERMS"; if (/sub-?processor/i.test(label)) return "SUBPROCESSOR_LIST"; if (/privacy|eea|uk|swiss|california|ccpa|cpra/i.test(label)) return "PRIVACY_POLICY"; if (/acceptable use|prohibited use|content policy/i.test(label)) return "ACCEPTABLE_USE_POLICY"; if (/security|trust/i.test(label)) return "SECURITY_POLICY"; if (/intellectual property|copyright|ip/i.test(label)) return "IP_POLICY"; return "HOSTED_LEGAL_ARTIFACT"; }
function inferControlFamilies(label) { const out = new Set(); if (/terms|agreement|scope|accept|eligibility|account|consent/i.test(label)) out.add("FORMATION_CONTRACT"); if (/data|privacy|retention|deletion|sub-?processor|eea|california|security|breach|transfer|data subject|data principal/i.test(label)) out.add("DATA_PRIVACY"); if (/vendor|sub-?processor|third party|transfer/i.test(label)) out.add("VENDORS_TRANSFER"); if (/security|trust|vulnerability|incident/i.test(label)) out.add("SECURITY"); if (/use|prohibited|restriction|scrape|reverse engineer|train/i.test(label)) out.add("USE_SAFETY"); if (/agent|authority|on behalf/i.test(label)) out.add("AGENT_AUTHORITY"); if (/intellectual property|copyright|ownership|license|output|content|trademark|model training/i.test(label)) out.add("IP_CONTENT"); if (/liability|warranty|disclaimer|fees|payment|billing|indirect|consequential|termination|governing law|jurisdiction|dispute|service level|support/i.test(label)) out.add("COMMERCIAL_LEGAL_ALLOCATION"); if (/contact|support|notice|grievance|complaint|ombudsman/i.test(label)) out.add("CONTACT_ROUTES"); if (/licen[cs]e|registration|regulatory|fair practice|key fact|schedule of charges|interest rate|responsible lending/i.test(label)) out.add("REGULATORY_GOVERNANCE"); if (/grievance|complaint|ombudsman|nodal|redressal/i.test(label)) out.add("GRIEVANCE_REDRESSAL"); if (/consumer|borrower|customer disclosure|charges|loan/i.test(label)) out.add("CONSUMER_DISCLOSURE"); if (/bank partner|partner bank|sponsor bank|nbfc|lending partner|escrow/i.test(label)) out.add("COUNTERPARTY_INSTITUTION"); if (/charges|fees|interest|kfs|mitc|schedule of charges/i.test(label)) out.add("FINANCIAL_TERMS_DISCLOSURE"); if (/indemn/i.test(label)) out.add("INDEMNITY"); return [...out]; }
function inferSubcats(label) { const out = new Set(); if (/accept|consent|terms|account|billing|cancellation|notice|eligibility/i.test(label)) out.add("CNS"); if (/liability|warranty|disclaimer|indemn|damages|governing law|jurisdiction|dispute|service level|support/i.test(label)) out.add("LIA"); if (/accuracy|reliance|generated|output/i.test(label)) out.add("HAL"); if (/intellectual property|copyright|ownership|license|content|output|training|scrape|reverse engineer/i.test(label)) out.add("INF"); if (/privacy|personal data|data protection|data subject|data principal|consent|cookie|retention|deletion/i.test(label)) out.add("PRV"); if (/biometric|voice|health|sensitive|children/i.test(label)) out.add("BIO"); if (/decision|automated|human review/i.test(label)) out.add("DEC"); if (/safety|harm|abuse|prohibited/i.test(label)) out.add("HRM"); if (/fraud|misuse|security/i.test(label)) out.add("FRD"); if (/trade|export|sanction/i.test(label)) out.add("TRD"); if (/regulatory|licen[cs]e|registration/i.test(label)) out.add("LICENSING_REGISTRATION"); if (/disclosure|fair practice|key fact|schedule of charges|interest rate|responsible lending/i.test(label)) out.add("REGULATORY_DISCLOSURE"); if (/grievance|redressal|complaint/i.test(label)) out.add("GRIEVANCE_REDRESSAL"); if (/ombudsman|escalation|appeal|nodal/i.test(label)) out.add("COMPLAINTS_ESCALATION"); if (/consumer|borrower|customer protection/i.test(label)) out.add("CONSUMER_DISCLOSURE"); if (/bank partner|sponsor bank|partner bank|nbfc|lending partner|escrow/i.test(label)) out.add("COUNTERPARTY_INSTITUTION"); if (/fee|charge|interest|kfs|mitc/i.test(label)) out.add("FINANCIAL_TERMS_DISCLOSURE"); return [...out]; }
function inferArtifactClass({ source = {}, title = "", sourceUrl = "", textHead = "" }) { const s = `${source.doc_type || ""} ${title} ${sourceUrl} ${textHead}`.toLowerCase(); if (/fair practice|key fact|schedule of charges|interest rate|responsible lending|regulatory/.test(s)) return "REGULATORY_DISCLOSURE"; if (/grievance|complaint|ombudsman|nodal/.test(s)) return "GRIEVANCE_POLICY"; if (/privacy/.test(s)) return "PRIVACY_POLICY"; if (/cookie/.test(s)) return "COOKIE_POLICY"; if (/data processing|\bdpa\b/.test(s)) return "DATA_PROCESSING_AGREEMENT"; if (/sub-?processor/.test(s)) return "SUBPROCESSOR_LIST"; if (/acceptable use|usage policy|prohibited/.test(s)) return "ACCEPTABLE_USE_POLICY"; if (/security|trust/.test(s)) return "SECURITY_POLICY"; if (/service level|\bsla\b|support/.test(s)) return "SLA_SUPPORT_TERMS"; if (/legal notice|impressum|contact/.test(s)) return "LEGAL_NOTICE_IMPRESSUM"; if (/terms|agreement|conditions/.test(s)) return "TERMS_OF_SERVICE"; if (/ip|copyright|dmca|trademark/.test(s)) return "IP_POLICY"; if (/model|ai|safety|transparency/.test(s)) return "AI_TERMS_POLICY"; return "HOSTED_LEGAL_ARTIFACT"; }
function deriveDocumentTitle({ source = {}, text = "" }) { return source.document_title || source.title || source.page_title || firstHeading(text) || titleFromArtifactName(source.source_artifact_name || source.doc_type || "Legal/governance document"); }
function firstHeading(text) { return String(text || "").split(/\r?\n/).map((line) => line.trim()).find((line) => line && line.length <= 120) || ""; }
function normalizeSource({ artifactName, source = {}, fallback = {}, index, sourceClass, docType }) { const text = sourceText(source) || sourceText(fallback); const url = source.final_url || source.canonical_url || source.url || source.source_url || fallback.final_url || fallback.canonical_url || fallback.url || fallback.source_url || ""; const sourceId = source.source_id || source.manifest_id || source.doc_id || fallback.source_id || fallback.doc_id || `${artifactName}.SRC.${String(index + 1).padStart(3, "0")}`; return { source_id: sourceId, final_url: url, url, canonical_url: source.canonical_url || fallback.canonical_url || url, title: source.title || source.page_title || source.document_title || fallback.title || fallback.document_title || titleFromArtifactName(artifactName), page_title: source.page_title || source.title || fallback.title || "", doc_type: docType || source.doc_type || fallback.doc_type || "", materiality: source.materiality || fallback.materiality || "Legal/governance source mapped from Phase 1 v5 source contract.", sha256: source.sha256 || source.content_sha256 || fallback.sha256 || "", lossless_text: text, source_artifact_name: artifactName, source_class: sourceClass }; }
function sourceText(value = {}) { return String(value.lossless_text || value.clean_text || value.raw_text || value.text || value.body || value.content || ""); }
function legalDocumentsFromInventory(inventory = {}) { return [...asArray(inventory.documents_found), ...asArray(inventory.legal_documents), ...asArray(inventory.documents), ...asArray(inventory.docs)].filter(Boolean); }
function readSummaryForArtifact({ artifactName, artifact, sourceCount, sourceClass }) { return { artifact_name: artifactName, source_class: sourceClass, artifact_present: Boolean(artifact), source_count: sourceCount, source_text_copied_into_map: false, status: artifact ? "READ" : "MISSING_OR_SPARSE" }; }
function missingSourceRow({ artifactName, reason }) { return { missing_id: `${artifactName}.MISSING`, absence_id: `${artifactName}.ABSENT`, missing_or_limited_item: artifactName, expected_location: artifactName, search_basis: "Phase 1 v5 legal/governance input contract", source_type: artifactName.startsWith("legal_doc") ? "LEGAL_DOC_ARTIFACT" : "METADATA_ONLY", source_corpus_status: "STANDALONE_SOURCE_ABSENT", artifact_class: "UNKNOWN_LEGAL_ARTIFACT", status: "STANDALONE_SOURCE_ABSENT", limitation: reason, boundary_statement: reason }; }
function pushMissing({ missingSourceMap, artifactAbsenceAccessMap }, row) { missingSourceMap.push(row); artifactAbsenceAccessMap.push(row); }
function buildLimitations({ documentMap, macroUnitMap, missingSourceMap, qualityRepairQueue }) { const rows = []; if (!documentMap.length) rows.push("No loaded legal/governance document was indexed from Phase 1 v5 source contract."); if (!macroUnitMap.length) rows.push("No reliable legal/governance macro-unit map was produced."); if (missingSourceMap.length) rows.push(`${missingSourceMap.length} legal/governance source inputs were missing, sparse, or metadata-only.`); if (qualityRepairQueue.length) rows.push(`${qualityRepairQueue.length} cartography quality repair rows were generated.`); return rows; }
function repairRow(row) { return { blocking: false, ...row }; }
function sliceUnitText(text, unit) { const ptr = unit.location_reference || {}; return String(text || "").slice(Number(ptr.char_start || 0), Number(ptr.char_end || text.length)); }
function extractEmails(text) { return [...new Set(String(text || "").match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [])]; }
function capFormulaSignal(text) { if (/fees paid|amount paid|subscription fees/i.test(text)) return "Fee/amount-paid formula visible at locator."; if (/\$|usd|eur|gbp|inr/i.test(text)) return "Fixed monetary cap signal visible at locator."; return "Cap formula requires review at locator."; }
function periodSignal(text) { const match = String(text || "").match(/(?:previous|preceding|last)\s+(\d+|twelve|six)\s+months?/i); return match ? `${match[0]} lookback signal visible.` : "No deterministic lookback period visible in this unit."; }
function carveoutSignal(text) { return /gross negligence|willful misconduct|confidentiality|indemn/i.test(text) ? "Carveout/exclusion language visible at locator." : "No carveout/exclusion language visible in this unit."; }
function feesSignal(text) { return /fees|order form|subscription|contract value|amount paid/i.test(text) ? "Fees/order-form reference visible at locator." : "No fee/order-form reference visible in this unit."; }
function extractVersionOrDateSignal(text) { const match = String(text || "").match(/(?:effective|updated|last modified|last updated)\s*(?:date)?\s*[:\-]?\s*([A-Za-z]+\s+\d{1,2},?\s+\d{4}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}-\d{2}-\d{2})/i); return match ? match[0] : ""; }
function charOffsetForLine(lines, index) { let total = 0; for (let i = 0; i < index; i += 1) total += String(lines[i] || "").length + 1; return total; }
function normalizeLine(value) { return String(value || "").replace(/^#{1,6}\s+/, "").replace(/\s+/g, " ").trim(); }
function normalizeComparable(value) { return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
function isTitleCaseHeading(value) { const words = String(value || "").split(/\s+/).filter(Boolean); if (!words.length || words.length > 12) return false; return words.some((word) => /^[A-Z]/.test(word)); }
function dedupeHeadingRows(rows) { const seen = new Set(); const out = []; for (const row of rows) { const key = `${normalizeComparable(row.heading)}|${row.unit_type}`; if (seen.has(key)) continue; seen.add(key); out.push(row); } return out.sort((a, b) => a.char_start - b.char_start); }
function priorityRank(value) { return { P0: 0, P1: 1, P2: 2, P3: 3 }[value] ?? 9; }
function makeId(value) { return String(value || "ID").toUpperCase().replace(/[^A-Z0-9]+/g, ".").replace(/^\.+|\.+$/g, "").slice(0, 80) || "ID"; }
function titleFromArtifactName(value) { return String(value || "Legal document").replace(/^legal_doc_/, "").replace(/^lossless_root__/, "").replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()); }
function normalizeSlug(value) { return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "other"; }
function dedupeSources(rows) { return dedupeRows(rows, (row) => `${row.source_artifact_name}:${row.source_id}`); }
function dedupeRows(rows, keyFn = (row) => JSON.stringify(row)) { const seen = new Set(); const out = []; for (const row of rows) { const key = keyFn(row); if (seen.has(key)) continue; seen.add(key); out.push(row); } return out; }
function stripEmpty(value) { return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined && v !== null && !(Array.isArray(v) && v.length === 0))); }
function unwrapArtifact(value) { if (!value || typeof value !== "object") return value; if (value.artifact && typeof value.artifact === "object") return value.artifact; if (value.data && typeof value.data === "object") return value.data; if (value.payload && typeof value.payload === "object") return value.payload; return value; }
function asArray(value) { return Array.isArray(value) ? value : []; }
function findRunId(artifacts = {}) { for (const value of Object.values(artifacts)) { const artifact = unwrapArtifact(value); if (artifact?.run_id) return artifact.run_id; } return ""; }
