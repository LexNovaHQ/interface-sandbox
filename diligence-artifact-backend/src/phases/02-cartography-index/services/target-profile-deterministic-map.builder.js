import {
  P2A_TARGET_PROFILE_ARTIFACTS,
  P2A_TARGET_PROFILE_MATERIAL_FIELD_INVENTORY,
  P2A_TARGET_PROFILE_TARGET_ROOT_INPUTS,
  P2A_TARGET_PROFILE_SECONDARY_CONTEXT_ROOT_INPUTS
} from "../target-profile-source-index.contract.js";
import { matchLegalTargetSignalRules } from "./target-legal-signal-locator.rules.js";

export const TARGET_PROFILE_DETERMINISTIC_ARTIFACT_NAME = P2A_TARGET_PROFILE_ARTIFACTS.deterministicMap;

const TARGET_ROOT_ARTIFACTS = Object.freeze([...P2A_TARGET_PROFILE_TARGET_ROOT_INPUTS, ...P2A_TARGET_PROFILE_SECONDARY_CONTEXT_ROOT_INPUTS]);
const LEGAL_DOC_CONTROL_ARTIFACTS = Object.freeze(["legal_doc_inventory", "legal_doc_extraction_index", "legal_doc_lossless_validation_manifest"]);
const REGULATORY_ROOT = "regulatory_licensing_status";
const GRIEVANCE_ROOT = "grievance_complaints";
const REGULATORY_LOCATOR_FAMILIES = Object.freeze(["REGULATORY_LICENSING_SIGNAL_LOCATOR", "REGULATORY_DISCLOSURE_LOCATOR", "BANK_PARTNER_SPONSOR_BANK_LOCATOR", "CONSUMER_DISCLOSURE_LOCATOR", "COUNTERPARTY_INSTITUTION_LOCATOR"]);
const GRIEVANCE_LOCATOR_FAMILIES = Object.freeze(["GRIEVANCE_COMPLAINTS_SIGNAL_LOCATOR", "NODAL_GRIEVANCE_OFFICER_LOCATOR", "OMBUDSMAN_ESCALATION_LOCATOR", "COMPLAINTS_ROUTE_LOCATOR"]);
const GOVERNING_LAW_VENUE_FAMILIES = Object.freeze(["GOVERNING_LAW_LOCATOR", "COURTS_VENUE_LOCATOR"]);
const TARGET_LOCATOR_FAMILIES = Object.freeze({
  ENTITY_IDENTITY_LOCATOR: [/\blegal name\b/i, /\bcompany\b/i, /\bentity\b/i, /\bincorporated\b/i, /\bregistered\b/i, /\babout\b/i],
  BRAND_TRADE_NAME_LOCATOR: [/\bbrand\b/i, /\btrade name\b/i, /\boperat(?:es|ing) as\b/i, /\bplatform\b/i],
  HOMEPAGE_POSITIONING_LOCATOR: [/\bplatform\b/i, /\bcompany\b/i, /\bsolution\b/i, /\bproduct\b/i, /\bfor\b/i],
  CONTACT_ROUTE_LOCATOR: [/\bcontact\b/i, /\bemail\b/i, /\bsupport\b/i, /\bsales\b/i, /\bnotice\b/i, /\bgrievance\b/i, /\bcomplaint\b/i],
  COMMERCIAL_AVAILABILITY_LOCATOR: [/\bpricing\b/i, /\bplans?\b/i, /\benterprise\b/i, /\bcontact sales\b/i, /\btrial\b/i],
  PRICING_SALES_ROUTE_LOCATOR: [/\bsales\b/i, /\bpricing\b/i, /\bbilling\b/i, /\bsubscription\b/i, /\bquote\b/i, /\bfees?\b/i, /\bcharges?\b/i],
  CUSTOMER_SEGMENT_CONTEXT_LOCATOR: [/\bcustomer\b/i, /\bconsumer\b/i, /\bborrower\b/i, /\bmerchant\b/i, /\buse case\b/i, /\bindustry\b/i, /\bteams?\b/i, /\bbusinesses\b/i]
});

export function buildTargetProfileDeterministicMap({ run = {}, artifacts = {} } = {}) {
  const runId = run.run_id || findRunId(artifacts) || "UNKNOWN_RUN";
  const targetUrl = run.target_url || run.root_url || readString(unwrapArtifact(artifacts.source_discovery_handoff), "target_url") || "";
  const sourceArtifactsRead = [];
  const targetCoverage = [];
  const structureIndex = [];
  const materialTargetFields = [];
  const entityIdentity = [];
  const brandTradeName = [];
  const homepagePositioning = [];
  const contactRoute = [];
  const commercialAvailability = [];
  const pricingSalesRoute = [];
  const customerSegmentContext = [];
  const regulatoryLicensing = [];
  const grievanceComplaints = [];
  const legalTargetSignals = [];
  const missingLimited = [];
  const semanticQueue = [];
  const repairQueue = [];

  const collected = collectTargetSources(artifacts);
  for (const route of collected.routes) sourceArtifactsRead.push(route);
  for (const gap of collected.gaps) missingLimited.push(gap);

  for (const source of collected.sources) {
    ingestTargetSource({
      source,
      targetCoverage,
      structureIndex,
      materialTargetFields,
      entityIdentity,
      brandTradeName,
      homepagePositioning,
      contactRoute,
      commercialAvailability,
      pricingSalesRoute,
      customerSegmentContext,
      regulatoryLicensing,
      grievanceComplaints,
      legalTargetSignals,
      semanticQueue,
      repairQueue
    });
  }

  const status = !targetCoverage.length ? "CONTROLLED_FAILURE" : missingLimited.length || repairQueue.length ? "LOCKED_WITH_LIMITATIONS" : "LOCKED";

  return {
    [TARGET_PROFILE_DETERMINISTIC_ARTIFACT_NAME]: {
      run_id: runId,
      target_url: targetUrl,
      generated_by: "phase2a_target_profile_deterministic_layer",
      schema_version: "P2A_TARGET_PROFILE_DETERMINISTIC_MAP_v3_PHASE1_V5_FIELD_LOCATORS",
      model_used: false,
      artifact_role: "Navigation-only deterministic map for Target Profile Review over Phase 1 v5 target-family roots and limited target-relevant legal/regulatory/grievance signal locators.",
      source_text_policy: {
        source_artifacts_remain_source_of_truth: true,
        full_text_copied_into_map: false,
        excerpts_copied_into_map: false,
        summaries_generated: false,
        downstream_must_use_navigation_pointers_to_read_source_text: true
      },
      source_artifacts_read: dedupeRows(sourceArtifactsRead, (row) => row.artifact_name),
      target_source_coverage_index: dedupeRows(targetCoverage, (row) => row.coverage_id),
      target_document_structure_index: dedupeRows(structureIndex, (row) => row.unit_id),
      material_target_field_locator_map: dedupeRows(materialTargetFields, (row) => row.field_locator_id),
      entity_identity_locator_map: dedupeRows(entityIdentity, (row) => row.locator_id),
      brand_trade_name_locator_map: dedupeRows(brandTradeName, (row) => row.locator_id),
      homepage_positioning_locator_map: dedupeRows(homepagePositioning, (row) => row.locator_id),
      contact_route_locator_map: dedupeRows(contactRoute, (row) => row.locator_id),
      commercial_availability_locator_map: dedupeRows(commercialAvailability, (row) => row.locator_id),
      pricing_sales_route_locator_map: dedupeRows(pricingSalesRoute, (row) => row.locator_id),
      customer_segment_context_locator_map: dedupeRows(customerSegmentContext, (row) => row.locator_id),
      regulatory_licensing_locator_map: dedupeRows(regulatoryLicensing, (row) => row.locator_id),
      grievance_complaints_locator_map: dedupeRows(grievanceComplaints, (row) => row.locator_id),
      legal_target_signal_locator_map: dedupeRows(legalTargetSignals, (row) => row.locator_id),
      missing_limited_target_source_map: dedupeRows(missingLimited, (row) => row.missing_id),
      semantic_label_queue: dedupeRows(semanticQueue, (row) => row.queue_id),
      quality_repair_queue: dedupeRows(repairQueue, (row) => `${row.repair_type}:${row.source_artifact}:${row.source_id}`),
      downstream_rules: {
        target_profile_deterministic_map_is_navigation_only: true,
        material_target_field_locators_are_pointer_only: true,
        regulatory_licensing_locators_are_factual_signal_only: true,
        grievance_complaints_locators_are_route_visibility_only: true,
        legal_target_signals_are_locators_only: true,
        target_profile_review_must_derive_values_from_source_reads: true,
        phase_2a_must_not_emit_target_profile_values: true,
        domain_derivation_forbidden_in_2a: true,
        activity_derivation_forbidden_in_2a: true,
        full_legal_cartography_reserved_for_2e: true,
        legal_advice_forbidden: true,
        compliance_conclusion_forbidden: true,
        enforceability_assessment_forbidden: true,
        license_validity_forbidden: true,
        license_requirement_forbidden: true,
        applicable_regulator_conclusion_forbidden: true,
        grievance_sufficiency_forbidden: true,
        governing_law_from_regulatory_or_grievance_roots_forbidden: true,
        courts_venue_from_regulatory_or_grievance_roots_forbidden: true,
        legal_signal_rule_source: "target-legal-signal-locator.rules.js",
        source_artifacts_remain_source_of_truth: true,
        full_text_copied: false,
        summaries_allowed: false,
        excerpts_allowed: false,
        old_family_input_contract_forbidden: true,
        phase1_v5_source_contract_required: true
      },
      lock_status: status
    }
  };
}

function collectTargetSources(artifacts = {}) {
  const sources = [];
  const routes = [];
  const gaps = [];
  for (const artifactName of TARGET_ROOT_ARTIFACTS) {
    const artifact = unwrapArtifact(artifacts[artifactName]);
    const rows = collectSourcesFromArtifact({ artifactName, artifact, sourceClass: "target_common_root", docType: artifactName.replace(/^lossless_root__/, "") });
    routes.push(routeSummary({ artifactName, artifact, sourceClass: "target_common_root", sourceCount: rows.length }));
    if (!rows.length) gaps.push(missingRow({ artifactName, sourceClass: "target_common_root", reason: "No material source rows available for this Phase 1 v5 target-family root." }));
    sources.push(...rows);
  }

  for (const artifactName of LEGAL_DOC_CONTROL_ARTIFACTS) routes.push(routeSummary({ artifactName, artifact: unwrapArtifact(artifacts[artifactName]), sourceClass: "legal_doc_control", sourceCount: 0 }));
  const docs = legalDocumentsFromInventory(unwrapArtifact(artifacts.legal_doc_inventory));
  if (!docs.length) gaps.push(missingRow({ artifactName: "legal_doc_inventory", sourceClass: "legal_doc_control", reason: "No legal document inventory rows available for target legal signal locator mapping." }));

  for (const doc of docs) {
    const artifactName = doc.artifact_name || doc.legal_doc_artifact_name || (doc.doc_type ? `legal_doc_${normalizeSlug(doc.doc_type)}` : "");
    if (!artifactName) continue;
    const artifact = unwrapArtifact(artifacts[artifactName]);
    const docType = normalizeSlug(doc.doc_type || artifact?.doc_type || artifact?.document_type || artifactName.replace(/^legal_doc_/, ""));
    const rows = collectSourcesFromArtifact({ artifactName, artifact, fallback: doc, sourceClass: "legal_doc_target_signal", docType });
    routes.push(routeSummary({ artifactName, artifact, sourceClass: "legal_doc_target_signal", sourceCount: rows.length, docType }));
    if (!rows.length) gaps.push(missingRow({ artifactName, sourceClass: "legal_doc_target_signal", reason: "Legal document artifact listed in inventory but not loaded for target legal signal locator mapping." }));
    sources.push(...rows);
  }

  return { sources: dedupeRows(sources, (row) => `${row.source_artifact}:${row.source_id}`), routes, gaps };
}

function ingestTargetSource(ctx) {
  const { source, targetCoverage, structureIndex, materialTargetFields, entityIdentity, brandTradeName, homepagePositioning, contactRoute, commercialAvailability, pricingSalesRoute, customerSegmentContext, regulatoryLicensing, grievanceComplaints, legalTargetSignals, semanticQueue, repairQueue } = ctx;
  const text = String(source.lossless_text || "");
  const sourceArtifact = source.source_artifact;
  const sourceRoot = source.common_root || sourceArtifact.replace(/^lossless_root__/, "");
  const sourceId = source.source_id;
  const sourceUrl = source.canonical_url || source.final_url || source.url || "";
  const pointer = pointerForSource(source);
  const documentId = makeStableId(`${sourceArtifact}:${sourceId}`);
  const title = firstHeading(text) || source.title || source.page_title || titleFromUrl(sourceUrl) || sourceArtifact;

  targetCoverage.push({
    coverage_id: `P2A.COV.${documentId}`,
    source_artifact: sourceArtifact,
    source_id: sourceId,
    common_root: sourceRoot,
    source_url: sourceUrl,
    source_class: source.source_class,
    doc_type: source.doc_type || "",
    source_corpus_status: text ? "FOUND_AS_PRIMARY_SOURCE" : "FOUND_THIN",
    status: text ? "FOUND_INDEXED" : "FOUND_THIN",
    materiality: source.materiality || "Target profile source locator.",
    lossless_text_pointer: pointer,
    phase_1_classification_effect: source.phase_1_classification_effect || "SOURCE_ROUTING_ONLY_NOT_JOB_ROUTING",
    limitation: text ? "" : "Source row has no lossless_text available."
  });

  if (!text) repairQueue.push({ repair_type: "MISSING_LOSSLESS_TEXT", source_artifact: sourceArtifact, source_id: sourceId, reason: "Source row exists but lossless_text is empty." });

  const units = buildStructureUnits({ text, title, source, documentId, pointer });
  for (const unit of units) {
    structureIndex.push(unit);
    addTargetLocators({ unit, source, materialTargetFields, entityIdentity, brandTradeName, homepagePositioning, contactRoute, commercialAvailability, pricingSalesRoute, customerSegmentContext, regulatoryLicensing, grievanceComplaints, legalTargetSignals, semanticQueue });
  }
}

function addTargetLocators(ctx) {
  const { unit, source, materialTargetFields, entityIdentity, brandTradeName, homepagePositioning, contactRoute, commercialAvailability, pricingSalesRoute, customerSegmentContext, regulatoryLicensing, grievanceComplaints, legalTargetSignals, semanticQueue } = ctx;
  const unitSearchText = textForRange(source.lossless_text, unit.char_range);
  const text = `${unit.heading_path.join(" ")} ${unitSearchText} ${source.url} ${source.doc_type} ${source.common_root}`;
  pushLocatorMatches({ unit, source, locatorFamily: "ENTITY_IDENTITY_LOCATOR", patterns: TARGET_LOCATOR_FAMILIES.ENTITY_IDENTITY_LOCATOR, rows: entityIdentity, materialTargetFields, semanticQueue, targetSubcats: ["ENTITY_IDENTITY"], signalFamilies: ["IDENTITY"], priority: "P0", text });
  pushLocatorMatches({ unit, source, locatorFamily: "BRAND_TRADE_NAME_LOCATOR", patterns: TARGET_LOCATOR_FAMILIES.BRAND_TRADE_NAME_LOCATOR, rows: brandTradeName, materialTargetFields, semanticQueue, targetSubcats: ["BRAND_IDENTITY"], signalFamilies: ["IDENTITY"], priority: "P1", text });
  pushLocatorMatches({ unit, source, locatorFamily: "HOMEPAGE_POSITIONING_LOCATOR", patterns: TARGET_LOCATOR_FAMILIES.HOMEPAGE_POSITIONING_LOCATOR, rows: homepagePositioning, materialTargetFields, semanticQueue, targetSubcats: ["MARKET_POSITIONING"], signalFamilies: ["MARKET"], priority: "P1", text });
  pushLocatorMatches({ unit, source, locatorFamily: "CONTACT_ROUTE_LOCATOR", patterns: TARGET_LOCATOR_FAMILIES.CONTACT_ROUTE_LOCATOR, rows: contactRoute, materialTargetFields, semanticQueue, targetSubcats: ["CONTACT_NOTICE"], signalFamilies: ["CONTACT"], priority: "P0", text });
  pushLocatorMatches({ unit, source, locatorFamily: "COMMERCIAL_AVAILABILITY_LOCATOR", patterns: TARGET_LOCATOR_FAMILIES.COMMERCIAL_AVAILABILITY_LOCATOR, rows: commercialAvailability, materialTargetFields, semanticQueue, targetSubcats: ["COMMERCIAL_AVAILABILITY"], signalFamilies: ["COMMERCIAL"], priority: "P1", text });
  pushLocatorMatches({ unit, source, locatorFamily: "PRICING_SALES_ROUTE_LOCATOR", patterns: TARGET_LOCATOR_FAMILIES.PRICING_SALES_ROUTE_LOCATOR, rows: pricingSalesRoute, materialTargetFields, semanticQueue, targetSubcats: ["PRICING_SALES"], signalFamilies: ["COMMERCIAL"], priority: "P1", text });
  pushLocatorMatches({ unit, source, locatorFamily: "CUSTOMER_SEGMENT_CONTEXT_LOCATOR", patterns: TARGET_LOCATOR_FAMILIES.CUSTOMER_SEGMENT_CONTEXT_LOCATOR, rows: customerSegmentContext, materialTargetFields, semanticQueue, targetSubcats: ["CUSTOMER_SEGMENT"], signalFamilies: ["MARKET"], priority: "P2", text });

  for (const rule of matchLegalTargetSignalRules(text)) {
    if (!ruleAllowedForSource(rule, source)) continue;
    const row = buildTargetSignalLocator({ unit, source, rule });
    legalTargetSignals.push(row);
    if (REGULATORY_LOCATOR_FAMILIES.includes(rule.locator_family)) regulatoryLicensing.push(row);
    if (GRIEVANCE_LOCATOR_FAMILIES.includes(rule.locator_family)) grievanceComplaints.push(row);
    pushMaterialFieldLocatorRows({ materialTargetFields, locatorRow: row, source, unit });
    pushSemanticQueue({ semanticQueue, unit, source, locatorId: row.locator_id, locatorFamily: rule.locator_family, targetSubcats: rule.target_subcats, signalFamilies: rule.target_signal_families, priority: rule.priority, materialFieldRows: materialRowsForLocatorFamily(rule.locator_family) });
  }
}

function pushLocatorMatches({ unit, source, locatorFamily, patterns, rows, materialTargetFields, semanticQueue, targetSubcats, signalFamilies, priority, text }) {
  if (!patterns.some((pattern) => pattern.test(text))) return;
  const locatorId = `P2A.${locatorFamily}.${makeStableId(`${unit.unit_id}:${locatorFamily}`)}`;
  const row = baseLocatorRow({ locatorId, locatorFamily, unit, source, priority, targetSubcats, signalFamilies, limitation: "Locator only. Target Profile Review must read source text and derive any value." });
  rows.push(row);
  pushMaterialFieldLocatorRows({ materialTargetFields, locatorRow: row, source, unit });
  pushSemanticQueue({ semanticQueue, unit, source, locatorId, locatorFamily, targetSubcats, signalFamilies, priority, materialFieldRows: materialRowsForLocatorFamily(locatorFamily) });
}

function buildTargetSignalLocator({ unit, source, rule }) {
  return {
    ...baseLocatorRow({ locatorId: `P2A.${rule.locator_family}.${makeStableId(`${unit.unit_id}:${rule.locator_family}`)}`, locatorFamily: rule.locator_family, unit, source, priority: rule.priority, targetSubcats: rule.target_subcats, signalFamilies: rule.target_signal_families, limitation: locatorLimitation(rule) }),
    target_3a_signal: rule.target_3a_signal,
    matched_terms: rule.matched_terms,
    locator_scope: REGULATORY_LOCATOR_FAMILIES.includes(rule.locator_family) ? "TARGET_PROFILE_REVIEW_REGULATORY_SIGNAL_ONLY" : GRIEVANCE_LOCATOR_FAMILIES.includes(rule.locator_family) ? "TARGET_PROFILE_REVIEW_GRIEVANCE_SIGNAL_ONLY" : "TARGET_PROFILE_REVIEW_LEGAL_SIGNAL_ONLY",
    source_boundary: rule.source_boundary,
    phase_2a_action: "LOCATE_ONLY",
    full_legal_cartography_reserved_for_2e: true,
    legal_or_regulatory_conclusion_forbidden: true
  };
}

function baseLocatorRow({ locatorId, locatorFamily, unit, source, priority, targetSubcats, signalFamilies, limitation }) {
  return {
    locator_id: locatorId,
    locator_family: locatorFamily,
    source_artifact: source.source_artifact,
    source_id: source.source_id,
    source_url: source.canonical_url || source.url || "",
    common_root: source.common_root || "",
    doc_type: source.doc_type || "",
    heading_path: unit.heading_path,
    char_range: unit.char_range,
    navigation_pointer: unit.navigation_pointer,
    lossless_text_pointer: unit.lossless_text_pointer,
    target_subcat_candidates: targetSubcats,
    target_signal_family_candidates: signalFamilies,
    priority,
    source_corpus_status: unit.source_corpus_status,
    status: "FOUND_INDEXED",
    index_only: true,
    derived_value_emitted: false,
    value: "",
    limitation
  };
}

function pushMaterialFieldLocatorRows({ materialTargetFields, locatorRow, source, unit }) {
  for (const material of materialRowsForLocatorFamily(locatorRow.locator_family)) {
    materialTargetFields.push({
      field_locator_id: `P2A.FIELD.${material.field_id}.${makeStableId(`${locatorRow.locator_id}:${material.field_key}`)}`,
      field_id: material.field_id,
      field_key: material.field_key,
      field_branch: String(material.field_key || "").split(".")[0] || "target_profile",
      downstream_owner: material.downstream_owner,
      derivation_authority_refs: material.derivation_authority_refs,
      phase_2a_action: "LOCATE_ONLY",
      locator_id: locatorRow.locator_id,
      locator_family: locatorRow.locator_family,
      source_artifact: source.source_artifact,
      source_id: source.source_id,
      common_root: source.common_root || "",
      source_url: source.canonical_url || source.url || "",
      doc_type: source.doc_type || "",
      heading_path: unit.heading_path,
      char_range: unit.char_range,
      navigation_pointer: unit.navigation_pointer,
      lossless_text_pointer: unit.lossless_text_pointer,
      derived_value_emitted: false,
      value: "",
      index_only: true,
      limitation: "Field-aware locator only. Derivation authority must be used by Target Profile Review."
    });
  }
}

function pushSemanticQueue({ semanticQueue, unit, source, locatorId, locatorFamily, targetSubcats, signalFamilies, priority, materialFieldRows = [] }) {
  semanticQueue.push({
    queue_id: `P2A.Q.${String(semanticQueue.length + 1).padStart(4, "0")}`,
    unit_id: unit.unit_id,
    locator_id: locatorId,
    locator_family: locatorFamily,
    source_artifact: source.source_artifact,
    source_id: source.source_id,
    target_subcat_candidates: targetSubcats,
    target_signal_family_candidates: signalFamilies,
    material_field_candidates: materialFieldRows.map((row) => ({ field_id: row.field_id, field_key: row.field_key, derivation_authority_refs: row.derivation_authority_refs })),
    priority,
    semantic_label_required: ["P0", "P1"].includes(priority),
    navigation_pointer: unit.navigation_pointer
  });
}

function materialRowsForLocatorFamily(locatorFamily) {
  return P2A_TARGET_PROFILE_MATERIAL_FIELD_INVENTORY.filter((row) => (row.locator_families || []).includes(locatorFamily));
}

function locatorLimitation(rule) {
  if (REGULATORY_LOCATOR_FAMILIES.includes(rule.locator_family)) return "Regulatory/licensing public operating-context locator only. Do not derive license validity, license requirement, applicable regulator, or compliance status.";
  if (GRIEVANCE_LOCATOR_FAMILIES.includes(rule.locator_family)) return "Grievance/complaints route-visibility locator only. Do not derive grievance sufficiency, legal compliance, ombudsman requirement, or statutory complaint obligation.";
  return "Target legal signal locator only. Target Profile Review must derive any value from the source text and active derivation authority.";
}

function ruleAllowedForSource(rule, source) {
  const root = source.common_root || source.source_artifact?.replace(/^lossless_root__/, "") || "";
  if (GOVERNING_LAW_VENUE_FAMILIES.includes(rule.locator_family) && [REGULATORY_ROOT, GRIEVANCE_ROOT].includes(root)) return false;
  return true;
}

function buildStructureUnits({ text, title, source, documentId, pointer }) {
  const units = [];
  const normalizedText = String(text || title || "Document Overview");
  const headings = detectHeadingRanges(normalizedText, title).slice(0, 80);
  for (const [index, heading] of headings.entries()) {
    const unitId = `${documentId}.U${String(index + 1).padStart(3, "0")}`;
    units.push({
      unit_id: unitId,
      section_id: `${documentId}.S${String(index + 1).padStart(3, "0")}`,
      document_id: documentId,
      source_artifact: source.source_artifact,
      source_id: source.source_id,
      source_url: source.canonical_url || source.url || "",
      common_root: source.common_root || "",
      doc_type: source.doc_type || "",
      unit_type: heading.unit_type,
      heading_path: [heading.heading].filter(Boolean),
      heading_level: heading.heading_level,
      char_range: { start: heading.start, end: heading.end },
      navigation_pointer: { ...pointer, heading: heading.heading, char_range: { start: heading.start, end: heading.end } },
      lossless_text_pointer: pointer,
      source_corpus_status: source.lossless_text ? "FOUND_AS_PRIMARY_SOURCE" : "FOUND_THIN",
      status: "FOUND_INDEXED",
      index_only: true
    });
  }
  return units;
}

function detectHeadingRanges(text, title) {
  const clean = String(text || "");
  if (!clean.trim()) return [{ heading: title || "Document Overview", start: 0, end: 0, heading_level: 1, unit_type: "DOCUMENT_TITLE" }];
  const lines = clean.split(/\r?\n/);
  const candidates = [];
  let offset = 0;
  for (const raw of lines) {
    const line = raw.trim();
    const looksHeading = line.length >= 3 && line.length <= 140 && (/^#{1,4}\s+/.test(line) || /^\d+(\.\d+){0,2}\s+/.test(line) || /^[A-Z][A-Za-z0-9 ,/&()\-:]{2,}$/.test(line));
    if (looksHeading && !isPageFurniture(line)) candidates.push({ heading: cleanHeading(line), start: offset, heading_level: headingLevel(line), unit_type: inferUnitType(line) });
    offset += raw.length + 1;
  }
  if (!candidates.length) candidates.push({ heading: title || "Document Overview", start: 0, heading_level: 1, unit_type: "DOCUMENT_TITLE" });
  return candidates.map((item, index) => ({ ...item, end: index + 1 < candidates.length ? candidates[index + 1].start : clean.length }));
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

function normalizeSource({ artifactName, source = {}, fallback = {}, index, sourceClass, docType }) {
  const url = source.final_url || source.canonical_url || source.url || source.source_url || fallback.final_url || fallback.canonical_url || fallback.url || fallback.source_url || "";
  const sourceId = source.source_id || source.manifest_id || source.doc_id || fallback.source_id || fallback.doc_id || `${artifactName}.SRC.${String(index + 1).padStart(3, "0")}`;
  return {
    source_artifact: artifactName,
    source_id: sourceId,
    source_class: sourceClass,
    common_root: source.common_root || artifactName.replace(/^lossless_root__/, ""),
    doc_type: docType || source.doc_type || fallback.doc_type || "",
    canonical_url: source.canonical_url || fallback.canonical_url || url,
    final_url: source.final_url || fallback.final_url || url,
    url,
    title: source.title || source.page_title || source.document_title || fallback.title || fallback.document_title || titleFromUrl(url) || artifactName,
    page_title: source.page_title || source.title || fallback.title || "",
    materiality: source.materiality || fallback.materiality || "Target Profile Source Index input.",
    phase_1_classification_effect: source.phase_1_classification_effect || fallback.phase_1_classification_effect || "SOURCE_ROUTING_ONLY_NOT_JOB_ROUTING",
    sha256: source.sha256 || source.content_sha256 || fallback.sha256 || "",
    lossless_text: sourceText(source) || sourceText(fallback)
  };
}

function legalDocumentsFromInventory(inventory = {}) {
  return inventory.documents_found || inventory.legal_documents || inventory.documents || inventory.docs || [];
}

function routeSummary({ artifactName, artifact, sourceClass, sourceCount, docType = "" }) {
  return {
    artifact_name: artifactName,
    source_class: sourceClass,
    doc_type: docType,
    source_count: sourceCount,
    available: sourceCount > 0,
    root_manifest_status: artifact?.root_manifest_status || artifact?.storage_status || "UNKNOWN",
    index_only: true
  };
}

function missingRow({ artifactName, sourceClass, reason }) {
  return {
    missing_id: `P2A.MISS.${makeStableId(artifactName)}`,
    source_artifact: artifactName,
    source_class: sourceClass,
    missing_or_limited_item: artifactName,
    expected_location: artifactName,
    source_corpus_status: "STANDALONE_SOURCE_ABSENT",
    status: "STANDALONE_SOURCE_ABSENT",
    limitation: reason,
    downstream_effect: "TARGET_PROFILE_REVIEW_MUST_CARRY_LIMITATION"
  };
}

function pointerForSource(source) {
  return {
    artifact_name: source.source_artifact,
    source_id: source.source_id,
    text_field: "lossless_text",
    sha256: source.sha256 || "",
    char_count: String(source.lossless_text || "").length
  };
}

function sourceText(value = {}) {
  return String(value.lossless_text || value.clean_text || value.text || value.raw_text || value.body || value.content || "").trim();
}

function textForRange(text, range = {}) {
  const clean = String(text || "");
  const start = Number.isFinite(range.start) ? range.start : 0;
  const end = Number.isFinite(range.end) ? range.end : clean.length;
  return clean.slice(Math.max(0, start), Math.min(clean.length, Math.max(start, end)));
}

function inferUnitType(value) {
  const text = String(value || "").toLowerCase();
  if (/annex/.test(text)) return "ANNEXURE";
  if (/schedule/.test(text)) return "SCHEDULE";
  if (/appendix/.test(text)) return "APPENDIX";
  if (/addendum/.test(text)) return "ADDENDUM";
  if (/exhibit/.test(text)) return "EXHIBIT";
  if (/notice/.test(text)) return "NOTICE";
  if (/^\d+\.\d+\s+/.test(String(value || ""))) return "SUBSECTION";
  return "SECTION";
}

function headingLevel(value) {
  const text = String(value || "");
  if (/^#{1,4}\s+/.test(text)) return text.match(/^#+/)?.[0]?.length || 1;
  if (/^\d+\.\d+\s+/.test(text)) return 2;
  return 1;
}

function firstHeading(text) {
  return detectHeadingRanges(String(text || ""), "")[0]?.heading || "";
}

function isPageFurniture(value) {
  return /^(home|login|sign in|sign up|copyright|all rights reserved|privacy|terms|cookie settings)$/i.test(String(value || "").trim());
}

function cleanHeading(value) {
  return String(value || "").replace(/^#{1,4}\s+/, "").replace(/\s+/g, " ").trim().slice(0, 160);
}

function titleFromUrl(value) {
  try {
    const path = new URL(value).pathname.split("/").filter(Boolean).pop() || "";
    return path.replace(/[-_]+/g, " ").trim();
  } catch {
    return "";
  }
}

function normalizeSlug(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "unknown";
}

function makeStableId(value) {
  let hash = 0;
  const text = String(value || "");
  for (let index = 0; index < text.length; index += 1) hash = ((hash << 5) - hash + text.charCodeAt(index)) | 0;
  return Math.abs(hash).toString(36).toUpperCase().padStart(6, "0").slice(0, 10);
}

function readString(value = {}, key) {
  return typeof value?.[key] === "string" ? value[key] : "";
}

function unwrapArtifact(value) {
  if (!value || typeof value !== "object") return value;
  if (value.artifact && typeof value.artifact === "object") return value.artifact;
  if (value.data && typeof value.data === "object") return value.data;
  if (value.payload && typeof value.payload === "object") return value.payload;
  return value;
}

function findRunId(artifacts = {}) {
  for (const value of Object.values(artifacts)) {
    const artifact = unwrapArtifact(value);
    if (artifact?.run_id) return artifact.run_id;
  }
  return "";
}

function dedupeRows(rows = [], keyFn = (row) => JSON.stringify(row)) {
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
