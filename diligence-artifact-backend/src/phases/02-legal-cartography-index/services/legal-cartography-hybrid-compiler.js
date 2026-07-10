const FINAL_ROOT = "legal_cartography_index";
const SIGNAL_ROOT = "qualified_review_legal_signals";
const FINAL_KEYS = Object.freeze(["document_coverage_index", "document_structure_index", "incorporated_linked_document_map", "control_language_locator", "semantic_navigation_index", "priority_semantic_locator", "qualified_review_locator", SIGNAL_ROOT, "legal_notice_locator", "dispute_resolution_locator", "governing_law_venue_locator", "contact_grievance_locator", "missing_limited_legal_governance_items", "downstream_rules", "lock_status"]);
const ALLOWED_LOCK_STATUS = new Set(["LOCKED", "LOCKED_WITH_LIMITATIONS", "REPAIR_REQUIRED", "CONTROLLED_FAILURE"]);

export function compileM9HybridCartography({ deterministicMap, semanticProfile, reinvestigationWorkpad = null } = {}) {
  const map = unwrapRoot(deterministicMap, "legal_cartography_deterministic_map");
  const semantic = unwrapRoot(semanticProfile, "legal_cartography_semantic_profile");
  const repair = unwrapRoot(reinvestigationWorkpad, "legal_cartography_reinvestigation_workpad") || {};
  const semanticNavigationIndex = buildSemanticNavigationIndex({ map, semantic });
  const semanticCoverage = buildSemanticCoverageSummary({ map, semantic });
  const documentCoverage = compileDocumentCoverage(map);
  const documentStructure = compileDocumentStructure({ map, semanticNavigationIndex });
  const linkedDocuments = compileLinkedDocuments(map);
  const controlLocator = compileControlLocator({ map, semanticNavigationIndex });
  const missingLimited = compileMissingLimitedItems(map);
  const limitations = [...asArray(map.cartography_limitations), ...asArray(repair.repair_rows_unresolved_with_limitations)];

  const index = keepFinalShape({
    document_coverage_index: documentCoverage,
    document_structure_index: documentStructure,
    incorporated_linked_document_map: linkedDocuments,
    control_language_locator: controlLocator,
    semantic_navigation_index: semanticNavigationIndex,
    priority_semantic_locator: semanticNavigationIndex.filter((row) => ["P0", "P1"].includes(row.priority) || row.confidence === "CLEAR").slice(0, 50),
    qualified_review_locator: buildQualifiedReviewLocator({ map, semanticNavigationIndex, missingLimited }),
    [SIGNAL_ROOT]: buildQualifiedReviewLegalSignals(map),
    legal_notice_locator: keywordLocator({ map, keywords: ["legal notice", "notice", "contact", "notification"], type: "LEGAL_NOTICE" }),
    dispute_resolution_locator: keywordLocator({ map, keywords: ["dispute", "arbitration", "resolution"], type: "DISPUTE_RESOLUTION" }),
    governing_law_venue_locator: keywordLocator({ map, keywords: ["governing law", "venue", "jurisdiction"], type: "GOVERNING_LAW_VENUE" }),
    contact_grievance_locator: keywordLocator({ map, keywords: ["contact", "grievance", "redressal", "data protection officer"], type: "CONTACT_GRIEVANCE" }),
    missing_limited_legal_governance_items: missingLimited,
    downstream_rules: {
      m9_is_index_only: true,
      legal_stack_index_only: true,
      source_discovery_is_navigation_not_legal_authority: true,
      m6_is_navigation_not_legal_authority: true,
      embedded_legal_instruments_are_indexable: true,
      referenced_unloaded_documents_must_not_be_fetched: true,
      use_only_phase1_v4_legal_common_roots_and_legal_doc_artifacts: true,
      limitations_must_carry_forward: true,
      deterministic_map_is_source_of_pointers: true,
      semantic_queue_is_authoritative_for_semantic_coverage: true,
      internal_m9_artifacts_not_downstream_required: true,
      full_legal_text_not_copied: true,
      semantic_navigation_index_is_downstream_available: true,
      control_language_locator_is_technical_locator_only: true,
      qualified_review_legal_signals_true_derived_object: true,
      full_clause_text_copied: false,
      legal_advice_generated: false,
      compliance_conclusion_generated: false,
      enforceability_conclusion_generated: false,
      old_family_input_contract_forbidden: true,
      semantic_coverage_summary: semanticCoverage
    },
    lock_status: resolveFinalLockStatus({ map, semantic, repair, limitations, documentCoverage, documentStructure, semanticCoverage })
  });
  return { [FINAL_ROOT]: index };
}

function compileDocumentCoverage(map) {
  const rows = asArray(map.document_map).map((doc) => stripEmpty({
    document_id: doc.document_id,
    artifact_id: doc.artifact_id || doc.document_id,
    document_or_artifact: doc.document_or_artifact || doc.document_name || "Unknown legal/governance document",
    artifact_class: doc.artifact_class || "UNKNOWN_LEGAL_ARTIFACT",
    source: doc.source || doc.source_url || "",
    source_type: doc.source_type || "URL",
    source_corpus_status: doc.source_corpus_status || "FOUND_AS_PRIMARY_SOURCE",
    status: doc.status || "FOUND_INDEXED",
    document_role: doc.document_role || "Loaded source.",
    lossless_artifact_name: doc.lossless_artifact_name || doc.source_artifact_name || "",
    navigation_pointer: doc.navigation_pointer || doc.text_pointer || null,
    limitation: doc.limitation || ""
  }));
  for (const unit of asArray(map.embedded_unit_map)) rows.push(stripEmpty({ document_id: unit.embedded_unit_id || unit.unit_id || unit.section_id, artifact_id: unit.embedded_unit_id || unit.unit_id || unit.section_id, document_or_artifact: unit.internal_unit || unit.heading_label || "Embedded unit", artifact_class: unit.artifact_class || "HOSTED_LEGAL_ARTIFACT", source: unit.source || "", source_type: "EMBEDDED_UNIT", source_corpus_status: "FOUND_EMBEDDED_IN_LEGAL_CORPUS", status: "FOUND_EMBEDDED_IN_LEGAL_CORPUS", document_role: "Embedded unit inside host document.", navigation_pointer: unit.navigation_pointer || null, limitation: unit.limitation || "Embedded unit." }));
  return dedupeRows(rows, (row) => [row.document_id, row.document_or_artifact, row.source_type].join("|"));
}

function compileDocumentStructure({ map, semanticNavigationIndex }) {
  const semanticByUnit = new Map(semanticNavigationIndex.map((row) => [String(row.unit_id || ""), row]));
  return asArray(map.macro_unit_map).map((unit) => {
    const semantic = semanticByUnit.get(String(unit.unit_id || unit.section_id || "")) || {};
    return stripEmpty({ section_id: unit.section_id, unit_id: unit.unit_id || unit.section_id, document_id: unit.document_id || unit.artifact_reference, internal_unit: unit.heading_label || unit.internal_unit || "", unit_type: unit.unit_type || "SECTION", apparent_function: unit.heading_label || "Mapped unit.", relationship_to_host: unit.relationship_to_host || "HOSTS_UNIT", source: unit.source || "", status: unit.status || "FOUND_INDEXED", lossless_artifact_name: unit.lossless_artifact_name || pointerValue(unit.location_reference, "lossless_artifact_name") || pointerValue(unit.location_reference, "source_artifact_name"), heading_level: unit.heading_level || 1, navigation_pointer: unit.location_reference || unit.navigation_pointer || null, semantic_registry_subcat_relevance: semantic.subcats || [], semantic_control_language_family: semantic.control_families || [], semantic_confidence: semantic.confidence || "", limitation: unit.limitation || "" });
  });
}

function compileLinkedDocuments(map) {
  return asArray(map.cross_document_reference_map || map.referenced_document_map).map((ref) => stripEmpty({ cross_reference_id: ref.cross_reference_id || ref.reference_id, referring_document: ref.from_document_id || ref.referring_document || "", referenced_document_or_policy: ref.to_document_or_policy || ref.referenced_document_or_policy || "", source_or_reference: ref.to_url_or_label || ref.source_or_reference || "", relationship: ref.reference_type_candidate || ref.relationship || "EXTERNAL_REFERENCE", source_type: ref.source_type || "REFERENCED_URL", source_corpus_status: ref.source_corpus_status || ref.loaded_status || "REFERENCED_BUT_NOT_FETCHED", artifact_class: ref.artifact_class || "HOSTED_LEGAL_ARTIFACT", status: ref.status || ref.loaded_status || "REFERENCED_BUT_NOT_FETCHED", limitation: ref.boundary_note || "" }));
}

function compileControlLocator({ map, semanticNavigationIndex }) {
  const semanticByUnit = new Map(semanticNavigationIndex.map((row) => [String(row.unit_id || ""), row]));
  const rows = [];
  for (const candidate of asArray(map.control_language_candidate_map)) {
    const semantic = semanticByUnit.get(String(candidate.unit_id || "")) || {};
    rows.push(stripEmpty({ control_reference_id: candidate.control_candidate_id, control_candidate_id: candidate.control_candidate_id, control_type: first(semantic.control_families) || candidate.control_language_family_candidate || "UNKNOWN_CONTROL_LANGUAGE", control_language_family: first(semantic.control_families) || candidate.control_language_family_candidate || "UNKNOWN_CONTROL_LANGUAGE", located_in_document: candidate.document_id || "", unit_or_heading: candidate.unit_id || candidate.section_id || "", section_id: candidate.section_id || "", document_id: candidate.document_id || "", source: "", status: candidate.status || "FOUND_INDEXED", registry_subcat_relevance: semantic.subcats || [], semantic_confidence: semantic.confidence || "", navigation_pointer: candidate.navigation_pointer || null, limitation: candidate.boundary_note || "", display_in_main_report: false, technical_annexure_only: true }));
  }
  return dedupeRows(rows, (row) => [row.control_reference_id, row.section_id, row.unit_or_heading].join("|"));
}

function buildSemanticNavigationIndex({ map, semantic }) {
  const queueById = new Map(asArray(map.semantic_label_queue).map((row) => [String(row.queue_id || ""), row]).filter(([id]) => id));
  return asArray(semantic.semantic_navigation_index).map((row) => {
    const queue = queueById.get(String(row.queue_id || "")) || {};
    return stripEmpty({ semantic_reference_id: row.queue_id || queue.unit_id || "", queue_id: row.queue_id || "", unit_id: row.unit_id || queue.unit_id || queue.section_id || "", section_id: queue.section_id || "", document_id: queue.document_id || "", heading_label: queue.heading_label || "", subcats: asArray(row.subcats), control_families: asArray(row.control_families), confidence: row.confidence || "", priority: queue.priority || "P2", navigation_pointer: queue.navigation_pointer || null, index_only: true });
  });
}

function keywordLocator({ map, keywords, type }) {
  const rows = [];
  for (const unit of asArray(map.macro_unit_map)) {
    const text = rowText(unit);
    if (!keywords.some((keyword) => text.includes(keyword))) continue;
    rows.push(stripEmpty({ locator_id: `${type}-${String(rows.length + 1).padStart(3, "0")}`, locator_type: type, document_id: unit.document_id, unit_id: unit.unit_id || unit.section_id, heading_label: unit.heading_label || unit.internal_unit, status: unit.status || "FOUND_INDEXED", navigation_pointer: unit.location_reference || unit.navigation_pointer || null, index_only: true }));
  }
  return rows;
}

function compileMissingLimitedItems(map) {
  return asArray(map.missing_source_map || map.artifact_absence_access_map).map((missing) => stripEmpty({ missing_id: missing.missing_id || missing.absence_id, missing_or_limited_item: missing.missing_or_limited_item || "Unknown item", expected_location: missing.expected_location || "Phase 1 v4 legal/governance source contract", search_basis: missing.search_basis || "", source_type: missing.source_type || "METADATA_ONLY", source_corpus_status: missing.source_corpus_status || "STANDALONE_SOURCE_ABSENT", artifact_class: missing.artifact_class || missing.expected_artifact_class || "UNKNOWN_LEGAL_ARTIFACT", downstream_effect: "REVIEW_WITH_LIMITATION", status: missing.status || "STANDALONE_SOURCE_ABSENT", limitation: missing.limitation || missing.boundary_statement || missing.reason || "" }));
}

function buildQualifiedReviewLocator({ map, semanticNavigationIndex, missingLimited }) {
  return [...missingLimited.slice(0, 25).map((row, index) => ({ locator_id: `M9-QRL-MISS-${String(index + 1).padStart(3, "0")}`, locator_type: "MISSING_OR_LIMITED_SOURCE", artifact_or_unit: row.missing_or_limited_item, expected_location: row.expected_location, status: row.status, blocking: false, reviewer_action: "Verify whether the missing or limited source exists before reliance." })), ...semanticNavigationIndex.slice(0, 25).map((row, index) => ({ locator_id: `M9-QRL-SEM-${String(index + 1).padStart(3, "0")}`, locator_type: "PRIORITY_SEMANTIC_NAVIGATION", document_id: row.document_id, unit_id: row.unit_id, heading_label: row.heading_label, subcats: row.subcats, control_families: row.control_families, navigation_pointer: row.navigation_pointer, reviewer_action: "Use as locator; M9 is index-only." }))];
}

function buildQualifiedReviewLegalSignals(map) {
  const notice = first(asArray(map.legal_notice_contact_signal_map)) || {};
  const liability = first(asArray(map.liability_cap_signal_map)) || {};
  const sla = first(asArray(map.sla_support_signal_map)) || {};
  const branches = {
    legal_notice_contact: signalBranch({ signal_key: "legal_notice_contact", question_id: "QR-004", field_key: "legal_notice_contact", reviewer_question: "What public legal notice/contact route is visible?", source: notice, fields: ["legal_notice_email", "legal_notice_contact_route", "legal_notice_contact_source", "legal_notice_contact_limitation"] }),
    liability_cap_basis: signalBranch({ signal_key: "liability_cap_basis", question_id: "QR-013", field_key: "liability_cap_basis", reviewer_question: "What liability-cap basis is publicly locatable?", source: liability, fields: ["clause_location", "cap_formula_reference_basis", "cap_period_lookback_window", "exclusions_carveouts_signal", "fees_pricing_reference_signal", "private_value_required", "limitation"] }),
    sla_support_posture: signalBranch({ signal_key: "sla_support_posture", question_id: "QR-016", field_key: "sla_support_posture", reviewer_question: "What SLA/support posture is publicly locatable?", source: sla, fields: ["sla_support_artifact_found", "availability_uptime_commitment_signal", "service_credit_remedy_signal", "support_tier_response_commitment_signal", "standard_vs_custom_sla_posture", "sla_exclusions_dependencies_signal", "private_confirmation_required"] })
  };
  const questionRows = Object.values(branches).map((branch) => ({ question_id: branch.question_id, signal_key: branch.signal_key, signal_status: branch.signal_status, source_path: branch.source_path, primary_locator: branch.primary_locator }));
  return {
    signal_object_version: "M9_QR_LEGAL_SIGNALS_v1_MAIN_RESTORED_PHASE1_V4",
    derivation_mode: "deterministic_locator_signal_from_m9_map_only",
    source_boundary: "Phase 1 v4 legal/common-root and individual legal_doc artifacts; M9 index-only; no legal advice.",
    full_clause_text_copied: false,
    legal_advice_generated: false,
    compliance_conclusion_generated: false,
    enforceability_conclusion_generated: false,
    ...branches,
    question_rows: questionRows,
    question_index: Object.fromEntries(questionRows.map((row) => [row.question_id, row])),
    coverage_summary: { required_question_count: 3, derived_question_count: questionRows.filter((row) => row.signal_status !== "SOURCE_NOT_PUBLIC").length, source_not_public_count: questionRows.filter((row) => row.signal_status === "SOURCE_NOT_PUBLIC").length },
    downstream_rules: { qualified_review_legal_signals_true_derived_object: true, full_clause_text_copied: false, legal_advice_generated: false, compliance_conclusion_generated: false, enforceability_conclusion_generated: false }
  };
}

function signalBranch({ signal_key, question_id, field_key, reviewer_question, source, fields }) {
  const hasSource = Boolean(source && Object.keys(source).length);
  const base = { signal_key, question_id, field_key, reviewer_question, signal_status: hasSource ? "DERIVED_WITH_LIMITATION" : "SOURCE_NOT_PUBLIC" };
  const values = Object.fromEntries(fields.map((field) => [field, String(source?.[field] || "")]));
  return { ...base, ...values, derived_answer_summary: hasSource ? "Public locator signal found; qualified review must verify legal effect." : "No public locator signal found in M9 deterministic map.", evidence_basis: hasSource ? [source.signal_id || source.unit_id || "M9_SIGNAL"] : [], locator_refs: hasSource && source.navigation_pointer ? [source.navigation_pointer] : [], registry_basis: asArray(source?.registry_basis), source_path: hasSource ? `${source.document_id || ""}.${source.unit_id || ""}` : "", primary_locator: source?.navigation_pointer || {}, downstream_use_limit: "Locator signal only. M9 does not generate legal advice, compliance conclusion, enforceability conclusion, or full clause text." };
}

function buildSemanticCoverageSummary({ map, semantic }) {
  const requiredQueueIds = new Set(asArray(map.semantic_label_queue).filter(isRequiredQueueRow).map((row) => String(row.queue_id || "")).filter(Boolean));
  const labeledQueueIds = new Set(asArray(semantic.semantic_navigation_index).map((row) => String(row.queue_id || "")).filter(Boolean));
  const labeledRequired = countIntersection(labeledQueueIds, requiredQueueIds);
  const ratio = requiredQueueIds.size ? Number((labeledRequired / requiredQueueIds.size).toFixed(4)) : 1;
  return { required_queue_count: requiredQueueIds.size, labeled_queue_count: labeledRequired, coverage_ratio: ratio, ready_for_compiler: ratio >= 0.8, status: ratio >= 0.8 ? "PASS" : "LIMITED" };
}
function resolveFinalLockStatus({ map, semantic, repair, limitations, documentCoverage, documentStructure, semanticCoverage }) { const statuses = [map.lock_status, map.status, semantic.lock_status, repair.lock_status, repair.status].filter(Boolean); if (statuses.includes("CONTROLLED_FAILURE")) return "CONTROLLED_FAILURE"; if (!documentCoverage.length || !documentStructure.length) return "CONTROLLED_FAILURE"; if (semanticCoverage?.ready_for_compiler !== true) return "REPAIR_REQUIRED"; if (statuses.includes("REPAIR_REQUIRED")) return "REPAIR_REQUIRED"; if (limitations.length || statuses.includes("LOCKED_WITH_LIMITATIONS") || semanticCoverage?.status === "LIMITED") return "LOCKED_WITH_LIMITATIONS"; return "LOCKED"; }
function isRequiredQueueRow(row) { return row?.semantic_label_required === true || ["P0", "P1"].includes(row?.priority); }
function countIntersection(actual, expected) { let count = 0; for (const value of expected) if (actual.has(value)) count += 1; return count; }
function keepFinalShape(value) { const output = {}; for (const key of FINAL_KEYS) output[key] = value[key]; if (!ALLOWED_LOCK_STATUS.has(output.lock_status)) output.lock_status = "LOCKED_WITH_LIMITATIONS"; return output; }
function unwrapRoot(value, root) { if (!value || typeof value !== "object") return {}; const artifact = value.artifact && typeof value.artifact === "object" ? value.artifact : value; return artifact[root] || artifact || {}; }
function asArray(value) { return Array.isArray(value) ? value : []; }
function first(value) { return Array.isArray(value) && value.length ? value[0] : ""; }
function pointerValue(pointer, field) { return pointer && typeof pointer === "object" ? pointer[field] || "" : ""; }
function rowText(row) { return Object.values(row || {}).flatMap((value) => Array.isArray(value) ? value : [value]).filter((value) => typeof value === "string").join(" ").toLowerCase(); }
function stripEmpty(row) { const out = {}; for (const [key, value] of Object.entries(row)) { if (value === "" || value === undefined || value === null) continue; if (Array.isArray(value) && value.length === 0) continue; if (value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0) continue; out[key] = value; } return out; }
function dedupeRows(rows, keyFn) { const seen = new Set(); const out = []; for (const row of rows) { const key = keyFn(row); if (seen.has(key)) continue; seen.add(key); out.push(row); } return out; }
