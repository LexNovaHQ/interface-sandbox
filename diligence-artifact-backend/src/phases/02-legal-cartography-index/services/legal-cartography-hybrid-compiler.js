const FINAL_ROOT = "legal_cartography_index";
const SIGNAL_ROOT = "qualified_review_legal_signals";
const FINAL_KEYS = Object.freeze(["document_coverage_index", "document_structure_index", "incorporated_linked_document_map", "control_language_locator", "semantic_navigation_index", "priority_semantic_locator", "qualified_review_locator", SIGNAL_ROOT, "legal_notice_locator", "dispute_resolution_locator", "governing_law_venue_locator", "contact_grievance_locator", "regulatory_governance_locator", "grievance_redressal_locator", "consumer_disclosure_locator", "counterparty_institution_locator", "missing_limited_legal_governance_items", "downstream_rules", "lock_status"]);
const ALLOWED_LOCK_STATUS = new Set(["LOCKED", "LOCKED_WITH_LIMITATIONS", "REPAIR_REQUIRED", "CONTROLLED_FAILURE"]);
const SIGNAL_PROFILE_ROOT = "legal_signal_derivation_profile";
const COMPAT_FIELDS = Object.freeze([
  ["legal_notice_contact_signal_map", "LGC.NOT.010", "legal_notice_email"],
  ["legal_notice_contact_signal_map", "LGC.NOT.011", "legal_notice_contact_route"],
  ["legal_notice_contact_signal_map", "LGC.NOT.012", "legal_notice_contact_evidence_basis"],
  ["legal_notice_contact_signal_map", "LGC.NOT.013", "legal_notice_contact_limitation"],
  ["jurisdiction_dispute_signal_map", "TP.JUR.003", "governing_law_country"],
  ["jurisdiction_dispute_signal_map", "TP.JUR.004", "governing_law_state"],
  ["jurisdiction_dispute_signal_map", "TP.JUR.005", "courts_venue"],
  ["jurisdiction_dispute_signal_map", "TP.JUR.007", "jurisdiction_evidence_basis"],
  ["jurisdiction_dispute_signal_map", "TP.JUR.008", "jurisdiction_uncertainty"],
  ["privacy_grievance_contact_signal_map", "DAP.CONTACT.001", "privacy_contact_email"],
  ["privacy_grievance_contact_signal_map", "DAP.CONTACT.002", "grievance_contact_email"],
  ["privacy_grievance_contact_signal_map", "DAP.CONTACT.003", "officer_contact"],
  ["privacy_grievance_contact_signal_map", "DAP.CONTACT.004", "evidence_basis"],
  ["privacy_grievance_contact_signal_map", "DAP.CONTACT.005", "limitation"],
  ["consent_manager_signal_map", "DAP.CM.001", "applicability_signal"],
  ["consent_manager_signal_map", "DAP.CM.002", "public_flow_visible"],
  ["consent_manager_signal_map", "DAP.CM.003", "consent_artifact_route"],
  ["consent_manager_signal_map", "DAP.CM.004", "withdrawal_revocation_grievance_route"],
  ["consent_manager_signal_map", "DAP.CM.005", "third_party_route_signal"],
  ["consent_manager_signal_map", "DAP.CM.006", "evidence_basis"],
  ["consent_manager_signal_map", "DAP.CM.007", "limitation"]
]);

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
    contact_grievance_locator: keywordLocator({ map, keywords: ["contact", "grievance", "complaint", "redressal", "data protection officer"], type: "CONTACT_GRIEVANCE" }),
    regulatory_governance_locator: compileLocatorMap(map.regulatory_governance_locator_map, "REGULATORY_GOVERNANCE"),
    grievance_redressal_locator: compileLocatorMap(map.grievance_redressal_locator_map, "GRIEVANCE_REDRESSAL"),
    consumer_disclosure_locator: compileLocatorMap(map.consumer_disclosure_locator_map, "CONSUMER_DISCLOSURE"),
    counterparty_institution_locator: compileLocatorMap(map.counterparty_institution_locator_map, "COUNTERPARTY_INSTITUTION"),
    missing_limited_legal_governance_items: missingLimited,
    downstream_rules: {
      m9_is_index_only: true,
      legal_stack_index_only: true,
      source_discovery_is_navigation_not_legal_authority: true,
      m6_is_navigation_not_legal_authority: true,
      embedded_legal_instruments_are_indexable: true,
      referenced_unloaded_documents_must_not_be_fetched: true,
      use_only_phase1_v5_legal_common_roots_and_legal_doc_artifacts: true,
      phase1_v5_source_contract_required: true,
      limitations_must_carry_forward: true,
      deterministic_map_is_source_of_pointers: true,
      semantic_queue_is_authoritative_for_semantic_coverage: true,
      internal_m9_artifacts_not_downstream_required: true,
      full_legal_text_not_copied: true,
      semantic_navigation_index_is_downstream_available: true,
      control_language_locator_is_technical_locator_only: true,
      qualified_review_legal_signals_true_derived_object: true,
      legal_signal_derivation_profile_compatibility_preserved: true,
      target_profile_legal_signal_locators_owned_by_2a: true,
      full_legal_governance_cartography_owned_by_2e: true,
      regulatory_grievance_conclusions_forbidden: true,
      license_validity_forbidden: true,
      license_requirement_forbidden: true,
      applicable_regulator_conclusion_forbidden: true,
      grievance_sufficiency_forbidden: true,
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

export function compileM9CompatibilityLegalSignalDerivationProfile({ finalIndex, deterministicMap } = {}) {
  const final = unwrapRoot(finalIndex, FINAL_ROOT);
  const map = unwrapRoot(deterministicMap, "legal_cartography_deterministic_map");
  const scannedSources = asArray(final.document_coverage_index || map.document_map).map((row) => row.lossless_artifact_name || row.source_artifact_name || row.document_id).filter(Boolean);
  const locatorRows = [...asArray(final.legal_notice_locator), ...asArray(final.governing_law_venue_locator), ...asArray(final.dispute_resolution_locator), ...asArray(final.contact_grievance_locator), ...asArray(final.grievance_redressal_locator)];
  const grouped = {};
  for (const [family, field_id, field_key] of COMPAT_FIELDS) {
    const locator_basis = locatorRows.slice(0, 5).map((row) => ({ locator_id: row.locator_id || row.semantic_reference_id || row.unit_id || "locator", navigation_pointer: row.navigation_pointer || row.primary_locator || null })).filter((row) => row.locator_id);
    const status = locator_basis.length ? "LOCATOR_FOUND_VALUE_NOT_VISIBLE" : scannedSources.length ? "NOT_DERIVED_AFTER_EXHAUSTIVE_SCAN" : "SOURCE_NOT_PUBLIC";
    const row = {
      field_id,
      field_key,
      field_family: family,
      derivation_status: status,
      value: "",
      evidence_basis: [],
      locator_basis,
      scanned_sources: scannedSources,
      failure_reason: status === "NOT_DERIVED_AFTER_EXHAUSTIVE_SCAN" ? "Compatibility profile preserved; active target-profile locator authority is Phase 2A after cutover." : "",
      limitation: "Compatibility-only row. Target-profile legal signal locators are owned by Phase 2A after cutover; 2E remains full legal/governance cartography authority.",
      confidence: locator_basis.length ? "PARTIAL" : "UNCLEAR",
      downstream_consumers: ["TARGET_PROFILE_REVIEW_COMPATIBILITY", "DATA_PROVENANCE_PROFILE_COMPATIBILITY"]
    };
    grouped[family] ||= [];
    grouped[family].push(row);
  }
  return {
    [SIGNAL_PROFILE_ROOT]: {
      schema_version: "LEGAL_SIGNAL_DERIVATION_PROFILE_v3_PHASE1_V5_COMPATIBILITY_BOUNDARY",
      model_generated: false,
      derivation_mode: "compatibility_only_not_active_target_profile_legal_signal_authority",
      ...grouped,
      compatibility_boundary: {
        legal_signal_derivation_profile_preserved: true,
        target_profile_legal_signal_locators_owned_by_2a: true,
        m9_full_legal_governance_cartography_source_of_truth: "legal_cartography_index",
        legal_advice_generated: false,
        compliance_conclusion_generated: false,
        enforceability_conclusion_generated: false,
        regulatory_grievance_conclusions_forbidden: true
      },
      required_field_count: COMPAT_FIELDS.length,
      emitted_field_count: Object.values(grouped).flat().length,
      lock_status: "LOCKED_WITH_LIMITATIONS"
    }
  };
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

function compileLinkedDocuments(map) { return asArray(map.cross_document_reference_map || map.referenced_document_map).map((ref) => stripEmpty({ cross_reference_id: ref.cross_reference_id || ref.reference_id, referring_document: ref.from_document_id || ref.referring_document || "", referenced_document_or_policy: ref.to_document_or_policy || ref.referenced_document_or_policy || "", source_or_reference: ref.to_url_or_label || ref.source_or_reference || "", relationship: ref.reference_type_candidate || ref.relationship || "EXTERNAL_REFERENCE", source_type: ref.source_type || "REFERENCED_URL", source_corpus_status: ref.source_corpus_status || ref.loaded_status || "REFERENCED_BUT_NOT_FETCHED", artifact_class: ref.artifact_class || "HOSTED_LEGAL_ARTIFACT", status: ref.status || ref.loaded_status || "REFERENCED_BUT_NOT_FETCHED", limitation: ref.boundary_note || "" })); }

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

function compileLocatorMap(rows = [], type = "LOCATOR") { return asArray(rows).map((row, index) => stripEmpty({ locator_id: row.locator_id || `${type}-${String(index + 1).padStart(3, "0")}`, locator_type: row.locator_type || type, document_id: row.document_id, unit_id: row.unit_id, heading_label: row.heading_label, status: row.status || "FOUND_INDEXED", source_corpus_status: row.source_corpus_status || "FOUND_EMBEDDED_IN_LEGAL_CORPUS", navigation_pointer: row.navigation_pointer || null, index_only: true, legal_or_regulatory_conclusion_forbidden: true, limitation: row.limitation || "Locator only." })); }
function keywordLocator({ map, keywords, type }) { const rows = []; for (const unit of asArray(map.macro_unit_map)) { const text = rowText(unit); if (!keywords.some((keyword) => text.includes(keyword))) continue; rows.push(stripEmpty({ locator_id: `${type}-${String(rows.length + 1).padStart(3, "0")}`, locator_type: type, document_id: unit.document_id, unit_id: unit.unit_id || unit.section_id, heading_label: unit.heading_label || unit.internal_unit, status: unit.status || "FOUND_INDEXED", navigation_pointer: unit.location_reference || unit.navigation_pointer || null, index_only: true })); } return rows; }
function compileMissingLimitedItems(map) { return asArray(map.missing_source_map || map.artifact_absence_access_map).map((missing) => stripEmpty({ missing_id: missing.missing_id || missing.absence_id, missing_or_limited_item: missing.missing_or_limited_item || "Unknown item", expected_location: missing.expected_location || "Phase 1 v5 legal/governance source contract", search_basis: missing.search_basis || "", source_type: missing.source_type || "METADATA_ONLY", source_corpus_status: missing.source_corpus_status || "STANDALONE_SOURCE_ABSENT", artifact_class: missing.artifact_class || missing.expected_artifact_class || "UNKNOWN_LEGAL_ARTIFACT", downstream_effect: "REVIEW_WITH_LIMITATION", status: missing.status || "STANDALONE_SOURCE_ABSENT", limitation: missing.limitation || missing.boundary_statement || missing.reason || "" })); }
function buildQualifiedReviewLocator({ map, semanticNavigationIndex, missingLimited }) { return [...missingLimited.slice(0, 25).map((row, index) => ({ locator_id: `M9-QRL-MISS-${String(index + 1).padStart(3, "0")}`, locator_type: "MISSING_OR_LIMITED_SOURCE", artifact_or_unit: row.missing_or_limited_item, expected_location: row.expected_location, status: row.status, blocking: false, reviewer_action: "Verify whether the missing or limited source exists before reliance." })), ...semanticNavigationIndex.slice(0, 25).map((row, index) => ({ locator_id: `M9-QRL-SEM-${String(index + 1).padStart(3, "0")}`, locator_type: "PRIORITY_SEMANTIC_NAVIGATION", document_id: row.document_id, unit_id: row.unit_id, heading_label: row.heading_label, subcats: row.subcats, control_families: row.control_families, navigation_pointer: row.navigation_pointer, reviewer_action: "Use as locator; M9 is index-only." }))]; }

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
  return { signal_object_version: "M9_QR_LEGAL_SIGNALS_v2_PHASE1_V5", derivation_mode: "deterministic_locator_signal_from_m9_map_only", source_boundary: "Phase 1 v5 legal/common-root and individual legal_doc artifacts; M9 index-only; no legal advice.", full_clause_text_copied: false, legal_advice_generated: false, compliance_conclusion_generated: false, enforceability_conclusion_generated: false, ...branches, question_rows: questionRows, question_index: Object.fromEntries(questionRows.map((row) => [row.question_id, row])), coverage_summary: { required_question_count: 3, derived_question_count: questionRows.filter((row) => row.signal_status !== "SOURCE_NOT_PUBLIC").length, source_not_public_count: questionRows.filter((row) => row.signal_status === "SOURCE_NOT_PUBLIC").length }, downstream_rules: { qualified_review_legal_signals_true_derived_object: true, full_clause_text_copied: false, legal_advice_generated: false, compliance_conclusion_generated: false, enforceability_conclusion_generated: false } };
}
function signalBranch({ signal_key, question_id, field_key, reviewer_question, source, fields }) { const hasSource = Boolean(source && Object.keys(source).length); const derived = Object.fromEntries(fields.map((field) => [field, source?.[field] || ""])); return { signal_key, question_id, field_key, reviewer_question, signal_status: hasSource ? "LOCATOR_FOUND_VALUE_NOT_VISIBLE" : "SOURCE_NOT_PUBLIC", ...derived, derived_answer_summary: hasSource ? "Locator signal found; qualified review must confirm legal effect." : "No public locator signal found in loaded M9 corpus.", evidence_basis: hasSource ? [source.document_id || source.unit_id || "M9 locator"] : [], locator_refs: hasSource ? [source.signal_id || source.unit_id || "M9 locator"] : [], registry_basis: asArray(source.registry_basis), source_path: source.document_id || source.unit_id || "", primary_locator: source.navigation_pointer || {}, downstream_use_limit: "Locator only; not legal advice or compliance conclusion." }; }

function buildSemanticCoverageSummary({ map, semantic }) { const required = asArray(map.semantic_label_queue).filter((row) => row.semantic_label_required === true || ["P0", "P1"].includes(row.priority)); const labeled = asArray(semantic.semantic_navigation_index).filter((row) => required.some((queue) => queue.queue_id === row.queue_id)); const coverageRatio = required.length ? Number((labeled.length / required.length).toFixed(4)) : 1; return { required_queue_count: required.length, labeled_queue_count: labeled.length, coverage_ratio: coverageRatio, ready_for_compiler: coverageRatio >= 0.8 }; }
function resolveFinalLockStatus({ map, semantic, repair, limitations, documentCoverage, documentStructure, semanticCoverage }) { const candidates = [map.lock_status, semantic.lock_status, repair.lock_status].filter(Boolean); if (!documentCoverage.length || !documentStructure.length) return "CONTROLLED_FAILURE"; if (candidates.includes("REPAIR_REQUIRED") || !semanticCoverage.ready_for_compiler) return "REPAIR_REQUIRED"; if (limitations.length || candidates.includes("LOCKED_WITH_LIMITATIONS")) return "LOCKED_WITH_LIMITATIONS"; return ALLOWED_LOCK_STATUS.has(map.lock_status) ? map.lock_status : "LOCKED"; }
function keepFinalShape(value) { const out = {}; for (const key of FINAL_KEYS) out[key] = value[key] ?? (key === "downstream_rules" ? {} : key === "lock_status" ? "LOCKED_WITH_LIMITATIONS" : key === SIGNAL_ROOT ? {} : []); return out; }
function unwrapRoot(value, root) { if (!value || typeof value !== "object") return {}; const artifact = value.artifact && typeof value.artifact === "object" ? value.artifact : value; return artifact[root] || artifact; }
function pointerValue(pointer, key) { return pointer && typeof pointer === "object" ? pointer[key] || "" : ""; }
function first(value) { return asArray(value)[0]; }
function asArray(value) { return Array.isArray(value) ? value : []; }
function rowText(row) { return `${row.heading_label || row.internal_unit || row.unit_or_heading || ""}`.toLowerCase(); }
function dedupeRows(rows, keyFn) { const seen = new Set(); const out = []; for (const row of asArray(rows)) { const key = keyFn(row); if (seen.has(key)) continue; seen.add(key); out.push(row); } return out; }
function stripEmpty(row) { return Object.fromEntries(Object.entries(row).filter(([, value]) => value !== undefined && value !== null && !(Array.isArray(value) && value.length === 0))); }
