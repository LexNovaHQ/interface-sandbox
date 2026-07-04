import { compileM9HybridCartography as compileBaseM9HybridCartography } from "./m9-hybrid-compiler.js";

const ALIAS_EQUIVALENTS = Object.freeze({ "terms-of-use": "terms-of-service" });
const LOCATORS = Object.freeze({
  legal_notice_locator: ["legal notice", "notice", "notification", "changes to terms", "contact information"],
  dispute_resolution_locator: ["dispute resolution", "arbitration", "exceptions to arbitration"],
  governing_law_venue_locator: ["governing law", "venue", "jurisdiction", "arbitration"],
  contact_grievance_locator: ["contact", "grievance", "redressal", "data protection officer", "privacy governance"]
});
const QR_SIGNAL_VERSION = "m9_qualified_review_legal_signals_true_derived_v1";
const QR_SOURCE_BOUNDARY = "Derived only from M9 deterministic legal signal maps and loaded-corpus navigation pointers; M9 remains index-only.";

export function compileM9HybridCartography(args = {}) {
  const output = compileBaseM9HybridCartography(args);
  const index = output.legal_cartography_index || {};
  const map = unwrapRoot(args.deterministicMap, "legal_cartography_deterministic_map");
  const semantic = unwrapRoot(args.semanticProfile, "legal_cartography_semantic_profile");
  enhanceLegalCartographyIndex({ index, map, semantic });
  return output;
}

export function enhanceLegalCartographyIndex({ index = {}, map = {}, semantic = {} } = {}) {
  const semanticNavigationIndex = buildSemanticNavigationIndex({ index, map, semantic });
  index.semantic_navigation_index = semanticNavigationIndex;
  index.priority_semantic_locator = semanticNavigationIndex.filter((row) => ["P0", "P1"].includes(row.priority) || row.confidence === "HIGH").map((row, index) => stripEmpty({ locator_id: `M9-SEM-${String(index + 1).padStart(3, "0")}`, document_id: row.document_id, unit_id: row.unit_id, heading_label: row.heading_label, subcats: row.subcats, control_families: row.control_families, priority: row.priority, confidence: row.confidence, navigation_pointer: row.navigation_pointer, review_use: "Priority legal/governance navigation locator; index only." }));
  index.control_language_locator = asArray(index.control_language_locator).map((row) => ({ ...row, limitation: row.limitation || "Technical locator only; not a qualified-review point by itself.", display_in_main_report: false, technical_annexure_only: true }));
  index.missing_limited_legal_governance_items = normalizeMissingLimitedRows(index.missing_limited_legal_governance_items, index.document_coverage_index);
  for (const [key, keywords] of Object.entries(LOCATORS)) index[key] = buildKeywordLocator({ documentStructure: index.document_structure_index, keywords, locatorType: key.replace(/_locator$/, "").toUpperCase() });
  index.qualified_review_locator = buildQualifiedReviewLocator(index);
  index.qualified_review_legal_signals = buildQrLegalSignalsFromMap({ index, map });
  index.downstream_rules = { ...(index.downstream_rules || {}), semantic_navigation_index_is_downstream_available: true, control_language_locator_is_technical_locator_only: true, qualified_review_locator_is_not_all_control_candidates: true, qualified_review_legal_signals_index_only: true, qualified_review_legal_signals_true_derived_object: true, qualified_review_legal_signals_are_derived_from_m9_deterministic_maps: true, alias_missing_sources_with_canonical_equivalent_are_non_blocking: true, report_should_render_summary_not_raw_m9_maps: true };
  return index;
}

function buildSemanticNavigationIndex({ index, map, semantic }) {
  const queueById = new Map(asArray(map.semantic_label_queue).map((row) => [String(row.queue_id || ""), row]).filter(([id]) => id));
  const unitById = new Map(asArray(index.document_structure_index).map((row) => [String(row.unit_id || row.section_id || ""), row]).filter(([id]) => id));
  return asArray(semantic.semantic_navigation_index).map((row) => { const queue = queueById.get(String(row.queue_id || "")) || {}; const unitId = row.unit_id || queue.unit_id || queue.section_id || ""; const unit = unitById.get(String(unitId)) || {}; return stripEmpty({ semantic_reference_id: row.semantic_reference_id || row.queue_id || unitId, queue_id: row.queue_id || "", unit_id: unitId, section_id: unit.section_id || queue.section_id || "", document_id: unit.document_id || queue.document_id || "", heading_label: unit.internal_unit || queue.heading_label || queue.internal_unit || "", subcats: asArray(row.subcats), control_families: asArray(row.control_families), confidence: row.confidence || "", priority: queue.priority || row.priority || "P2", navigation_pointer: unit.navigation_pointer || queue.navigation_pointer || null, index_only: true }); });
}

function normalizeMissingLimitedRows(rows, documentCoverage) { return asArray(rows).map((row) => { const alias = aliasEquivalent(row, documentCoverage); if (!alias.found) return { ...row, blocking: row.blocking !== false, display_in_main_report: row.display_in_main_report !== false }; return { ...row, status: "NOT_APPLICABLE_CONTEXTUAL", source_type: "REFERENCED_URL", source_corpus_status: "REFERENCED_BUT_NOT_FETCHED", downstream_effect: "TECHNICAL_ANNEXURE_ONLY_NON_BLOCKING_ALIAS", limitation: "Requested URL appears to be a non-blocking alias; canonical equivalent legal document is present in the loaded legal corpus.", alias_failed_equivalent_found: true, canonical_equivalent: alias.canonical, blocking: false, display_in_main_report: false, technical_annexure_only: true }; }); }
function aliasEquivalent(row, documentCoverage) { const text = rowText(row); const aliasKey = Object.keys(ALIAS_EQUIVALENTS).find((key) => text.includes(key)); if (!aliasKey) return { found: false, canonical: "" }; const canonical = ALIAS_EQUIVALENTS[aliasKey]; const found = asArray(documentCoverage).some((coverage) => rowText(coverage).includes(canonical) || coverage.artifact_class === "TERMS_OF_SERVICE"); return { found, canonical: found ? "Terms of Service" : "" }; }
function buildKeywordLocator({ documentStructure, keywords, locatorType }) { const rows = []; const seen = new Set(); for (const unit of asArray(documentStructure)) { const text = rowText(unit); if (!keywords.some((keyword) => text.includes(keyword))) continue; const key = `${unit.document_id}|${unit.unit_id}|${locatorType}`; if (seen.has(key)) continue; seen.add(key); rows.push(stripEmpty({ locator_id: `${locatorType}-${String(rows.length + 1).padStart(3, "0")}`, locator_type: locatorType, document_id: unit.document_id, unit_id: unit.unit_id || unit.section_id, heading_label: unit.internal_unit || unit.apparent_function, status: unit.status || "FOUND_INDEXED", navigation_pointer: unit.navigation_pointer || null, index_only: true })); } return rows; }
function buildQualifiedReviewLocator(index) { const missing = asArray(index.missing_limited_legal_governance_items).filter((row) => row.display_in_main_report !== false).map((row, index) => stripEmpty({ locator_id: `M9-QRL-MISS-${String(index + 1).padStart(3, "0")}`, locator_type: "MISSING_OR_LIMITED_SOURCE", artifact_or_unit: row.missing_or_limited_item, expected_location: row.expected_location, status: row.status, blocking: row.blocking !== false, reviewer_action: "Verify whether the missing or limited legal/governance source exists before reliance." })); const priority = asArray(index.priority_semantic_locator).slice(0, 25).map((row, index) => stripEmpty({ locator_id: `M9-QRL-SEM-${String(index + 1).padStart(3, "0")}`, locator_type: "PRIORITY_SEMANTIC_NAVIGATION", document_id: row.document_id, unit_id: row.unit_id, heading_label: row.heading_label, subcats: row.subcats, control_families: row.control_families, navigation_pointer: row.navigation_pointer, reviewer_action: "Use as legal/governance locator; M9 is index-only." })); const locatorRows = ["legal_notice_locator", "dispute_resolution_locator", "governing_law_venue_locator", "contact_grievance_locator"].flatMap((key) => asArray(index[key])).slice(0, 20).map((row, index) => stripEmpty({ locator_id: `M9-QRL-LOC-${String(index + 1).padStart(3, "0")}`, locator_type: row.locator_type, document_id: row.document_id, unit_id: row.unit_id, heading_label: row.heading_label, navigation_pointer: row.navigation_pointer, reviewer_action: "Use as legal/governance locator; M9 is index-only." })); return [...missing, ...priority, ...locatorRows]; }

function buildQrLegalSignalsFromMap({ index, map }) {
  const noticeRows = asArray(map.legal_notice_contact_signal_map);
  const liabilityRows = asArray(map.liability_cap_signal_map);
  const slaRows = asArray(map.sla_support_signal_map);
  const notice = firstRow(noticeRows);
  const liability = firstRow(liabilityRows);
  const sla = firstRow(slaRows);
  const fallbackRefs = asArray(index.qualified_review_locator).slice(0, 12).map((row) => row.locator_id || row.unit_id || row.document_id || "").filter(Boolean);
  const legalNoticeContact = buildSignalBranch({
    sourceRows: noticeRows,
    row: notice,
    fallbackRefs,
    signalKey: "legal_notice_contact",
    questionId: "QR-004",
    fieldKey: "legal_notice_email",
    reviewerQuestion: "What email address should receive contractual/legal notices?",
    sourceMapName: "legal_notice_contact_signal_map",
    values: {
      legal_notice_email: firstString(notice.legal_notice_emails),
      legal_notice_contact_route: valueOr(notice.legal_notice_contact_route, notice.heading_label || ""),
      legal_notice_contact_source: valueOr(notice.legal_notice_contact_source, notice.document_id || ""),
      legal_notice_contact_limitation: valueOr(notice.legal_notice_contact_limitation, notice.signal_id ? "M9 derived legal notice/contact signal from loaded legal corpus." : "No M9 legal notice/contact signal derived from loaded legal corpus."),
      derived_answer_summary: valueOr(notice.derived_answer_summary, notice.signal_id ? "Legal notice/contact route signal is available for qualified-review confirmation." : "No legal notice/contact route signal was derived."),
      downstream_use_limit: "Use as an index-backed question prefill candidate only; verify against the loaded legal source before reliance."
    }
  });
  const liabilityCapBasis = buildSignalBranch({
    sourceRows: liabilityRows,
    row: liability,
    fallbackRefs,
    signalKey: "liability_cap_basis",
    questionId: "QR-013",
    fieldKey: "acv_liability_reference",
    reviewerQuestion: "What contract value or pricing level should guide liability caps?",
    sourceMapName: "liability_cap_signal_map",
    values: {
      clause_location: valueOr(liability.clause_location, liability.heading_label || ""),
      cap_formula_reference_basis: valueOr(liability.cap_formula_reference_basis, liability.signal_id ? "Locator found; cap formula requires source confirmation." : "No liability cap signal derived from loaded legal corpus."),
      cap_period_lookback_window: valueOr(liability.cap_period_lookback_window, ""),
      exclusions_carveouts_signal: valueOr(liability.exclusions_carveouts_signal, ""),
      fees_pricing_reference_signal: valueOr(liability.fees_pricing_reference_signal, ""),
      private_value_required: valueOr(liability.private_value_required, liability.signal_id ? "Confirm during qualified review." : ""),
      limitation: valueOr(liability.limitation, liability.signal_id ? "M9 supplies deterministic legal-signal map only; qualified review controls reliance." : "No liability cap signal derived from loaded legal corpus."),
      derived_answer_summary: valueOr(liability.derived_answer_summary, liability.signal_id ? "Liability-cap basis locator is available for qualified-review confirmation." : "No liability-cap basis locator was derived."),
      downstream_use_limit: "Use as an index-backed question prefill candidate only; do not compute legal effect, cap amount, enforceability, or risk."
    }
  });
  const slaSupportPosture = buildSignalBranch({
    sourceRows: slaRows,
    row: sla,
    fallbackRefs,
    signalKey: "sla_support_posture",
    questionId: "QR-016",
    fieldKey: "sla_posture",
    reviewerQuestion: "Will the company offer no SLA, a standard SLA, or a custom SLA?",
    sourceMapName: "sla_support_signal_map",
    values: {
      sla_support_artifact_found: valueOr(sla.sla_support_artifact_found, sla.signal_id ? "SLA/support signal found in loaded legal corpus." : "No SLA/support signal derived from loaded legal corpus."),
      availability_uptime_commitment_signal: valueOr(sla.availability_uptime_commitment_signal, ""),
      service_credit_remedy_signal: valueOr(sla.service_credit_remedy_signal, ""),
      support_tier_response_commitment_signal: valueOr(sla.support_tier_response_commitment_signal, ""),
      standard_vs_custom_sla_posture: valueOr(sla.standard_vs_custom_sla_posture, ""),
      sla_exclusions_dependencies_signal: valueOr(sla.sla_exclusions_dependencies_signal, ""),
      private_confirmation_required: valueOr(sla.private_confirmation_required, sla.signal_id ? "Qualified review must confirm controlling SLA/support terms." : ""),
      derived_answer_summary: valueOr(sla.derived_answer_summary, sla.signal_id ? "SLA/support posture locator is available for qualified-review confirmation." : "No SLA/support posture locator was derived."),
      downstream_use_limit: "Use as an index-backed question prefill candidate only; qualified review must confirm the final SLA posture."
    }
  });
  const questionRows = [questionRow(legalNoticeContact), questionRow(liabilityCapBasis), questionRow(slaSupportPosture)];
  return {
    signal_object_version: QR_SIGNAL_VERSION,
    derivation_mode: "compiler_true_derived_from_m9_deterministic_maps",
    source_boundary: QR_SOURCE_BOUNDARY,
    full_clause_text_copied: false,
    legal_advice_generated: false,
    compliance_conclusion_generated: false,
    enforceability_conclusion_generated: false,
    legal_notice_contact: legalNoticeContact,
    liability_cap_basis: liabilityCapBasis,
    sla_support_posture: slaSupportPosture,
    question_rows: questionRows,
    question_index: Object.fromEntries(questionRows.map((row) => [row.question_id, row])),
    coverage_summary: {
      required_question_count: 3,
      derived_question_count: questionRows.filter((row) => row.signal_status === "DERIVED").length,
      legal_notice_contact_source_count: noticeRows.length,
      liability_cap_basis_source_count: liabilityRows.length,
      sla_support_posture_source_count: slaRows.length
    },
    downstream_rules: {
      qualified_review_legal_signals_true_derived_object: true,
      index_only: true,
      full_clause_text_copied: false,
      legal_advice_generated: false,
      compliance_conclusion_generated: false,
      enforceability_conclusion_generated: false,
      reviewer_confirmation_required: true
    }
  };
}

function buildSignalBranch({ sourceRows, row, fallbackRefs, signalKey, questionId, fieldKey, reviewerQuestion, sourceMapName, values }) {
  const locatorRefs = refs(sourceRows, fallbackRefs);
  const primaryLocator = locatorFromRow(row, locatorRefs[0] || "");
  return {
    signal_key: signalKey,
    question_id: questionId,
    field_key: fieldKey,
    reviewer_question: reviewerQuestion,
    signal_status: sourceRows.length ? "DERIVED" : "NOT_DERIVED",
    ...values,
    evidence_basis: evidenceBasis(sourceRows),
    locator_refs: locatorRefs,
    registry_basis: asArray(row.registry_basis || row.registry_refs || row.registry_references),
    source_path: `legal_cartography_deterministic_map.${sourceMapName}`,
    primary_locator: primaryLocator,
    downstream_use_limit: values.downstream_use_limit
  };
}

function questionRow(branch) {
  return {
    question_id: branch.question_id,
    field_key: branch.field_key,
    reviewer_question: branch.reviewer_question,
    signal_key: branch.signal_key,
    signal_status: branch.signal_status,
    primary_locator: branch.primary_locator,
    locator_refs: branch.locator_refs,
    downstream_use_limit: branch.downstream_use_limit
  };
}

function evidenceBasis(rows) {
  return asArray(rows).map((row) => stripEmpty({
    signal_id: row.signal_id,
    document_id: row.document_id,
    unit_id: row.unit_id || row.section_id,
    heading_label: row.heading_label,
    navigation_pointer: row.navigation_pointer || row.location_reference || null
  }));
}

function locatorFromRow(row, fallbackRef) {
  return stripEmpty({
    locator_ref: row.signal_id || row.locator_id || row.unit_id || fallbackRef,
    document_id: row.document_id,
    unit_id: row.unit_id || row.section_id,
    heading_label: row.heading_label,
    navigation_pointer: row.navigation_pointer || row.location_reference || null
  });
}

function firstRow(rows) { return asArray(rows)[0] || {}; }
function firstString(values) { return asArray(values).find((value) => typeof value === "string" && value.trim()) || ""; }
function valueOr(value, fallback) { return typeof value === "string" && value.trim() ? value.trim() : fallback; }
function refs(rows, fallback = []) { return [...new Set([...asArray(rows).map((row) => row.signal_id || row.unit_id || row.document_id || ""), ...fallback].filter(Boolean))].slice(0, 12); }
function unwrapRoot(value, root) { if (!value || typeof value !== "object") return {}; const artifact = value.artifact && typeof value.artifact === "object" ? value.artifact : value; return artifact[root] || artifact || {}; }
function asArray(value) { return Array.isArray(value) ? value : []; }
function rowText(row) { if (!row || typeof row !== "object") return ""; return Object.values(row).map((value) => typeof value === "string" ? value : Array.isArray(value) ? value.join(" ") : "").join(" ").toLowerCase(); }
function stripEmpty(row) { const out = {}; for (const [key, value] of Object.entries(row)) { if (value === "" || value === undefined) continue; if (Array.isArray(value) && value.length === 0) continue; if (value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0) continue; out[key] = value; } return out; }
