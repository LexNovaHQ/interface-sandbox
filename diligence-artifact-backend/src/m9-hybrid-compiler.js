const FINAL_ROOT = "legal_cartography_index";

const FINAL_KEYS = Object.freeze([
  "document_coverage_index",
  "document_structure_index",
  "incorporated_linked_document_map",
  "control_language_locator",
  "missing_limited_legal_governance_items",
  "downstream_rules",
  "lock_status"
]);

const ALLOWED_LOCK_STATUS = new Set(["LOCKED", "LOCKED_WITH_LIMITATIONS", "REPAIR_REQUIRED", "CONTROLLED_FAILURE"]);

export function compileM9HybridCartography({ deterministicMap, semanticProfile, reinvestigationWorkpad = null } = {}) {
  const map = unwrapRoot(deterministicMap, "legal_cartography_deterministic_map");
  const semantic = unwrapRoot(semanticProfile, "legal_cartography_semantic_profile");
  const repair = unwrapRoot(reinvestigationWorkpad, "legal_cartography_reinvestigation_workpad") || {};

  const compileNotes = [];
  const quarantinedSemanticRows = [];
  const deterministicIds = collectDeterministicIds(map);
  const semanticIndexes = buildSemanticIndexes({ map, semantic, deterministicIds, quarantinedSemanticRows, compileNotes });

  const documentCoverage = compileDocumentCoverage({ map, semanticIndexes });
  const documentStructure = compileDocumentStructure({ map, semanticIndexes });
  const linkedDocuments = compileLinkedDocuments({ map, semanticIndexes });
  const controlLocator = compileControlLocator({ map, semanticIndexes });
  const missingLimited = compileMissingLimitedItems({ map, semanticIndexes });

  const limitations = [
    ...asArray(map.cartography_limitations),
    ...asArray(semantic.semantic_repair_queue),
    ...asArray(repair.repair_rows_unresolved_with_limitations),
    ...quarantinedSemanticRows.map((row) => ({ limitation_type: "QUARANTINED_SEMANTIC_ROW", limitation: row.reason, affected_ref: row.pointer || "", blocking: false }))
  ];

  const lockStatus = resolveFinalLockStatus({ map, semantic, repair, limitations, documentCoverage });

  return {
    [FINAL_ROOT]: keepFinalShape({
      document_coverage_index: documentCoverage,
      document_structure_index: documentStructure,
      incorporated_linked_document_map: linkedDocuments,
      control_language_locator: controlLocator,
      missing_limited_legal_governance_items: missingLimited,
      downstream_rules: {
        m9_is_index_only: true,
        legal_advice_forbidden: true,
        compliance_conclusions_forbidden: true,
        sufficiency_conclusions_forbidden: true,
        enforceability_assessments_forbidden: true,
        risk_conclusions_forbidden: true,
        registry_evaluation_forbidden: true,
        registry_row_status_forbidden: true,
        new_url_discovery_forbidden: true,
        use_only_loaded_legal_corpus: true,
        m6_is_navigation_not_legal_authority: true,
        embedded_legal_instruments_are_indexable: true,
        referenced_unloaded_documents_must_not_be_fetched: true,
        limitations_must_carry_forward: true,
        deterministic_map_is_source_of_pointers: true,
        semantic_rows_must_attach_to_deterministic_ids: true,
        internal_m9_artifacts_not_downstream_required: true,
        full_legal_text_not_copied: true,
        compiler_notes_count: compileNotes.length,
        quarantined_semantic_rows_count: quarantinedSemanticRows.length
      },
      lock_status: lockStatus
    })
  };
}

function compileDocumentCoverage({ map, semanticIndexes }) {
  const docs = asArray(map.document_map).map((doc) => {
    const labels = semanticIndexes.byDocumentId.get(doc.document_id) || {};
    return stripEmpty({
      document_id: doc.document_id,
      artifact_id: doc.artifact_id || doc.document_id,
      document_or_artifact: doc.document_or_artifact || doc.document_name || "Unknown legal/governance artifact",
      artifact_class: doc.artifact_class || labels.artifact_class_label || "UNKNOWN_LEGAL_ARTIFACT",
      source: doc.source || doc.source_url || "",
      source_type: doc.source_type || "URL",
      source_corpus_status: doc.source_corpus_status || "FOUND_AS_PRIMARY_SOURCE",
      status: doc.status || "FOUND_INDEXED",
      document_role: labels.document_role_label || doc.document_role || "Loaded legal/governance source.",
      lossless_artifact_name: doc.lossless_artifact_name || "",
      expected_core_document_slot_candidates: doc.expected_core_document_slot_candidates || [],
      semantic_document_route: labels.expected_core_document_slot || first(doc.expected_core_document_slot_candidates),
      semantic_confidence: labels.classification_confidence || "",
      navigation_pointer: doc.text_pointer || null,
      limitation: joinLimitations(doc.limitation, labels.boundary_note)
    });
  });

  for (const slot of asArray(map.core_document_stack_slots)) {
    for (const embeddedId of asArray(slot.found_embedded_unit_ids)) {
      const unit = semanticIndexes.deterministicEmbeddedUnits.get(embeddedId) || {};
      docs.push(stripEmpty({
        document_id: embeddedId,
        artifact_id: embeddedId,
        document_or_artifact: unit.internal_unit || `${slot.slot_id} embedded unit`,
        artifact_class: slot.expected_artifact_class || unit.artifact_class || "HOSTED_LEGAL_ARTIFACT",
        source: unit.source || "",
        source_type: "EMBEDDED_UNIT",
        source_corpus_status: "FOUND_EMBEDDED_IN_LEGAL_CORPUS",
        status: "FOUND_EMBEDDED_IN_LEGAL_CORPUS",
        document_role: `Embedded legal/governance unit for ${slot.slot_id}`,
        semantic_document_route: slot.slot_id,
        navigation_pointer: unit.navigation_pointer || null,
        limitation: unit.limitation || "Embedded unit detected from loaded legal corpus."
      }));
    }
  }

  return dedupeRows(docs, (row) => [row.document_id, row.document_or_artifact, row.source].join("|"));
}

function compileDocumentStructure({ map, semanticIndexes }) {
  return asArray(map.macro_unit_map || map.section_map).map((unit) => {
    const label = semanticIndexes.byUnitId.get(unit.unit_id || unit.section_id) || semanticIndexes.bySectionId.get(unit.section_id) || {};
    return stripEmpty({
      section_id: unit.section_id,
      unit_id: unit.unit_id || unit.section_id,
      document_id: unit.document_id || unit.artifact_reference,
      host_document: unit.host_document || "",
      internal_unit: unit.heading_label || unit.internal_unit || "",
      unit_type: unit.unit_type || unit.macro_unit_type || "SECTION",
      apparent_function: label.heading_interpretation || unit.apparent_function || "Macro-unit mapped for downstream navigation.",
      relationship_to_host: unit.relationship_to_host || "HOSTS_UNIT",
      source: unit.source || "",
      status: unit.status || "FOUND_INDEXED",
      lossless_artifact_name: unit.lossless_artifact_name || pointerValue(unit.location_reference, "lossless_artifact_name"),
      heading_path: unit.heading_path || [],
      navigation_pointer: unit.location_reference || unit.navigation_pointer || null,
      semantic_registry_subcat_relevance: label.registry_subcat_relevance || [],
      semantic_document_route_relevance: label.document_route_relevance || [],
      semantic_confidence: label.confidence || "",
      limitation: joinLimitations(unit.limitation, label.boundary_note)
    });
  });
}

function compileLinkedDocuments({ map, semanticIndexes }) {
  const refs = asArray(map.cross_document_reference_map || map.referenced_document_map).map((ref) => {
    const label = semanticIndexes.byCrossReferenceId.get(ref.cross_reference_id || ref.reference_id) || {};
    return stripEmpty({
      cross_reference_id: ref.cross_reference_id || ref.reference_id,
      referring_document: ref.from_document || ref.referring_document || "",
      referenced_document_or_policy: ref.to_document_or_policy || ref.referenced_document_or_policy || "",
      source_or_reference: ref.to_url_or_label || ref.source_or_reference || "",
      relationship: label.reference_type_label || ref.reference_type_candidate || ref.relationship || "EXTERNAL_REFERENCE",
      source_type: ref.source_type || "REFERENCED_URL",
      source_corpus_status: ref.loaded_status || ref.source_corpus_status || "REFERENCED_BUT_NOT_FETCHED",
      artifact_class: ref.artifact_class || "HOSTED_LEGAL_ARTIFACT",
      status: ref.status || ref.loaded_status || "REFERENCED_BUT_NOT_FETCHED",
      document_route_relevance: label.document_route_relevance || [],
      semantic_confidence: label.confidence || "",
      limitation: joinLimitations(ref.boundary_note, label.boundary_note)
    });
  });
  return dedupeRows(refs, (row) => [row.cross_reference_id, row.source_or_reference].join("|"));
}

function compileControlLocator({ map, semanticIndexes }) {
  const controls = [];

  for (const candidate of asArray(map.control_language_candidate_map)) {
    const label = semanticIndexes.byControlCandidateId.get(candidate.control_candidate_id) || {};
    const unit = semanticIndexes.deterministicUnits.get(candidate.related_unit_or_section) || {};
    controls.push(stripEmpty({
      control_reference_id: label.control_reference_id || candidate.control_candidate_id,
      control_candidate_id: candidate.control_candidate_id,
      control_type: label.control_language_type || candidate.control_language_family_candidate || label.control_language_family || "UNKNOWN_CONTROL_LANGUAGE",
      control_language_family: label.control_language_family || candidate.control_language_family_candidate || "UNKNOWN_CONTROL_LANGUAGE",
      located_in_document: unit.host_document || candidate.related_artifact || label.document_id || "",
      unit_or_heading: unit.heading_label || unit.internal_unit || candidate.related_unit_or_section || "",
      section_id: candidate.related_unit_or_section || label.section_id || "",
      document_id: candidate.related_artifact || label.document_id || "",
      source: unit.source || "",
      status: "FOUND_INDEXED",
      visible_control_posture: label.visible_control_posture || "UNCLEAR_CONTROL",
      registry_subcat_relevance: label.registry_subcat_relevance || [],
      document_route_relevance: label.document_route_relevance || [],
      semantic_confidence: label.confidence || candidate.confidence || "DETERMINISTIC_CANDIDATE",
      navigation_pointer: candidate.location_reference || unit.location_reference || unit.navigation_pointer || null,
      limitation: joinLimitations(candidate.boundary_note, label.boundary_note)
    }));
  }

  for (const indemnity of asArray(map.indemnity_candidate_map)) {
    const label = semanticIndexes.byIndemnityCandidateId.get(indemnity.indemnity_candidate_id) || {};
    controls.push(stripEmpty({
      control_reference_id: indemnity.indemnity_candidate_id,
      control_type: "INDEMNITY",
      control_language_family: "INDEMNITY",
      located_in_document: indemnity.document_id || "",
      unit_or_heading: indemnity.indemnity_clause_location || "",
      section_id: indemnity.section_id || "",
      document_id: indemnity.document_id || "",
      source: "",
      status: "FOUND_INDEXED",
      visible_control_posture: label.confidence === "CLEAR" ? "VISIBLE_CONTROL" : "UNCLEAR_CONTROL",
      registry_subcat_relevance: ["LIA"],
      document_route_relevance: ["DOC_TOS"],
      semantic_confidence: label.confidence || indemnity.location_confidence || "DETERMINISTIC_CANDIDATE",
      navigation_pointer: indemnity.location_reference || null,
      limitation: joinLimitations(indemnity.boundary_note, label.boundary_note)
    }));
  }

  for (const sub of semanticIndexes.substituteControls) {
    controls.push(stripEmpty({
      control_reference_id: `SUBSTITUTE.${sub.missing_or_limited_item_ref || sub.expected_document_route}`,
      control_type: "SUBSTITUTE_CONTROL",
      control_language_family: "UNKNOWN_CONTROL_LANGUAGE",
      located_in_document: "Substitute control location map",
      unit_or_heading: asArray(sub.substitute_control_locations).join(" | "),
      source: "",
      status: "FOUND_THIN",
      visible_control_posture: sub.substitute_control_signal || "SUBSTITUTE_CONTROL",
      registry_subcat_relevance: sub.registry_subcat_relevance || [],
      document_route_relevance: [sub.expected_document_route].filter(Boolean),
      semantic_confidence: sub.confidence || "PARTIAL",
      limitation: sub.boundary_note || "Substitute control requires downstream review before any gap finding."
    }));
  }

  return dedupeRows(controls, (row) => [row.control_reference_id, row.section_id, row.unit_or_heading].join("|"));
}

function compileMissingLimitedItems({ map, semanticIndexes }) {
  return asArray(map.artifact_absence_access_map || map.missing_source_map).map((absence) => {
    const label = semanticIndexes.byAbsenceId.get(absence.absence_id || absence.missing_id) || {};
    return stripEmpty({
      absence_id: absence.absence_id || absence.missing_id,
      missing_or_limited_item: absence.expected_artifact_family || absence.missing_or_limited_item || absence.expected_document_route || "Unknown legal/governance item",
      expected_location: absence.expected_document_route || absence.expected_location || "DOC_UNKNOWN",
      search_basis: asArray(absence.search_basis_refs).join(" | ") || absence.search_basis || "",
      source_type: absence.source_type || "ABSENT_FAMILY",
      source_corpus_status: absence.absence_or_access_status || absence.source_corpus_status || "STANDALONE_SOURCE_ABSENT",
      artifact_class: absence.expected_artifact_class || absence.artifact_class || "UNKNOWN_LEGAL_ARTIFACT",
      downstream_effect: label.downstream_treatment || absence.downstream_treatment || "CARRY_PUBLIC_FOOTPRINT_LIMITATION",
      substitute_control_signal: label.substitute_control_signal || "NO_CONTROL_LABEL",
      substitute_control_locations: label.substitute_control_locations || [],
      status: absence.status || absence.absence_or_access_status || "STANDALONE_SOURCE_ABSENT",
      semantic_confidence: label.confidence || "",
      limitation: joinLimitations(absence.limitation || absence.boundary_statement, label.boundary_note)
    });
  });
}

function buildSemanticIndexes({ map, semantic, deterministicIds, quarantinedSemanticRows, compileNotes }) {
  const index = {
    byDocumentId: new Map(),
    byUnitId: new Map(),
    bySectionId: new Map(),
    byNoticeId: new Map(),
    byControlCandidateId: new Map(),
    byIndemnityCandidateId: new Map(),
    byCrossReferenceId: new Map(),
    byAbsenceId: new Map(),
    bySlotId: new Map(),
    substituteControls: [],
    deterministicUnits: new Map(),
    deterministicEmbeddedUnits: new Map()
  };

  for (const row of asArray(map.section_map)) index.deterministicUnits.set(String(row.section_id || row.unit_id), row);
  for (const row of asArray(map.macro_unit_map)) index.deterministicUnits.set(String(row.unit_id || row.section_id), row);
  for (const row of asArray(map.embedded_unit_map)) index.deterministicEmbeddedUnits.set(String(row.embedded_unit_id), row);

  for (const row of asArray(semantic.artifact_inventory_labels)) attachOne(index.byDocumentId, row.document_id || row.artifact_id, row, deterministicIds, quarantinedSemanticRows);
  for (const row of asArray(semantic.macro_unit_semantic_labels)) {
    attachOne(index.byUnitId, row.unit_id, row, deterministicIds, quarantinedSemanticRows);
    attachOne(index.bySectionId, row.section_id, row, deterministicIds, quarantinedSemanticRows);
  }
  for (const row of asArray(semantic.notice_semantic_labels)) attachOne(index.byNoticeId, row.notice_id, row, deterministicIds, quarantinedSemanticRows);
  for (const row of asArray(semantic.control_language_location_labels)) attachOne(index.byControlCandidateId, row.control_candidate_id || row.control_reference_id, row, deterministicIds, quarantinedSemanticRows);
  for (const row of asArray(semantic.indemnity_location_labels)) attachOne(index.byIndemnityCandidateId, row.indemnity_candidate_id, row, deterministicIds, quarantinedSemanticRows);
  for (const row of asArray(semantic.cross_reference_semantic_labels)) attachOne(index.byCrossReferenceId, row.cross_reference_id, row, deterministicIds, quarantinedSemanticRows);
  for (const row of asArray(semantic.absence_access_semantic_interpretation)) attachOne(index.byAbsenceId, row.absence_id, row, deterministicIds, quarantinedSemanticRows);
  for (const row of asArray(semantic.document_route_relevance_map)) attachOne(index.bySlotId, row.slot_id, row, deterministicIds, quarantinedSemanticRows);

  for (const row of asArray(semantic.substitute_control_map)) {
    const pointer = row.missing_or_limited_item_ref || row.expected_document_route;
    if (pointer && deterministicIds.has(String(pointer))) index.substituteControls.push(row);
    else quarantinedSemanticRows.push({ pointer, reason: "substitute_control_map row did not attach to deterministic absence or route pointer." });
  }

  if (quarantinedSemanticRows.length) compileNotes.push(`${quarantinedSemanticRows.length} semantic rows quarantined by deterministic compiler.`);
  return index;
}

function attachOne(map, key, row, deterministicIds, quarantinedRows) {
  if (!key) return;
  if (!deterministicIds.has(String(key))) {
    quarantinedRows.push({ pointer: key, reason: "Semantic row pointer not found in deterministic map." });
    return;
  }
  map.set(String(key), row);
}

function collectDeterministicIds(map) {
  const ids = new Set();
  const arrays = ["document_map", "artifact_inventory_map", "section_map", "macro_unit_map", "embedded_unit_map", "referenced_document_map", "cross_document_reference_map", "missing_source_map", "artifact_absence_access_map", "core_document_stack_slots", "control_language_candidate_map", "indemnity_candidate_map", "notice_candidate_map"];
  const fields = ["document_id", "artifact_id", "unit_id", "section_id", "embedded_unit_id", "reference_id", "cross_reference_id", "missing_id", "absence_id", "slot_id", "control_candidate_id", "indemnity_candidate_id", "notice_id"];
  for (const arrayName of arrays) {
    for (const row of asArray(map[arrayName])) {
      for (const field of fields) if (row?.[field]) ids.add(String(row[field]));
    }
  }
  return ids;
}

function resolveFinalLockStatus({ map, semantic, repair, limitations, documentCoverage }) {
  const statuses = [map.lock_status, map.status, semantic.lock_status, semantic.status, repair.lock_status, repair.status].filter(Boolean);
  if (statuses.includes("CONTROLLED_FAILURE")) return "CONTROLLED_FAILURE";
  if (!documentCoverage.length) return "CONTROLLED_FAILURE";
  if (statuses.includes("REPAIR_REQUIRED")) return "REPAIR_REQUIRED";
  if (limitations.length || statuses.includes("LOCKED_WITH_LIMITATIONS")) return "LOCKED_WITH_LIMITATIONS";
  return "LOCKED";
}

function keepFinalShape(value) {
  const output = {};
  for (const key of FINAL_KEYS) output[key] = value[key];
  if (!ALLOWED_LOCK_STATUS.has(output.lock_status)) output.lock_status = "LOCKED_WITH_LIMITATIONS";
  return output;
}

function unwrapRoot(value, root) {
  if (!value || typeof value !== "object") return {};
  const artifact = value.artifact && typeof value.artifact === "object" ? value.artifact : value;
  return artifact[root] || artifact || {};
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function first(value) {
  return Array.isArray(value) && value.length ? value[0] : "";
}

function pointerValue(pointer, field) {
  return pointer && typeof pointer === "object" ? pointer[field] || "" : "";
}

function joinLimitations(...values) {
  return values.filter(Boolean).join(" | ");
}

function stripEmpty(row) {
  const out = {};
  for (const [key, value] of Object.entries(row)) {
    if (value === "" || value === undefined) continue;
    if (Array.isArray(value) && value.length === 0) continue;
    if (value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0) continue;
    out[key] = value;
  }
  return out;
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
