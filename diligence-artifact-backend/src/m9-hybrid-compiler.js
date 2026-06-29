const FINAL_ROOT = "legal_cartography_index";
const FINAL_KEYS = Object.freeze(["document_coverage_index", "document_structure_index", "incorporated_linked_document_map", "control_language_locator", "missing_limited_legal_governance_items", "downstream_rules", "lock_status"]);
const ALLOWED_LOCK_STATUS = new Set(["LOCKED", "LOCKED_WITH_LIMITATIONS", "REPAIR_REQUIRED", "CONTROLLED_FAILURE"]);

export function compileM9HybridCartography({ deterministicMap, semanticProfile, reinvestigationWorkpad = null } = {}) {
  const map = unwrapRoot(deterministicMap, "legal_cartography_deterministic_map");
  const semantic = unwrapRoot(semanticProfile, "legal_cartography_semantic_profile");
  const repair = unwrapRoot(reinvestigationWorkpad, "legal_cartography_reinvestigation_workpad") || {};
  const labels = buildNavigationLabels({ map, semantic });
  const semanticCoverage = buildSemanticCoverageSummary({ map, semantic });

  const documentCoverage = compileDocumentCoverage(map);
  const documentStructure = compileDocumentStructure({ map, labels });
  const linkedDocuments = compileLinkedDocuments(map);
  const controlLocator = compileControlLocator({ map, labels });
  const missingLimited = compileMissingLimitedItems(map);
  const limitations = [...asArray(map.cartography_limitations), ...asArray(repair.repair_rows_unresolved_with_limitations)];

  return {
    [FINAL_ROOT]: keepFinalShape({
      document_coverage_index: documentCoverage,
      document_structure_index: documentStructure,
      incorporated_linked_document_map: linkedDocuments,
      control_language_locator: controlLocator,
      missing_limited_legal_governance_items: missingLimited,
      downstream_rules: {
        m9_is_index_only: true,
        legal_stack_index_only: true,
        m6_is_navigation_not_legal_authority: true,
        embedded_legal_instruments_are_indexable: true,
        referenced_unloaded_documents_must_not_be_fetched: true,
        limitations_must_carry_forward: true,
        deterministic_map_is_source_of_pointers: true,
        semantic_queue_is_authoritative_for_semantic_coverage: true,
        internal_m9_artifacts_not_downstream_required: true,
        full_legal_text_not_copied: true,
        semantic_coverage_summary: semanticCoverage
      },
      lock_status: resolveFinalLockStatus({ map, semantic, repair, limitations, documentCoverage, documentStructure, semanticCoverage })
    })
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
    lossless_artifact_name: doc.lossless_artifact_name || "",
    navigation_pointer: doc.text_pointer || null,
    limitation: doc.limitation || ""
  }));
  for (const unit of asArray(map.embedded_unit_map)) rows.push(stripEmpty({ document_id: unit.embedded_unit_id || unit.unit_id || unit.section_id, artifact_id: unit.embedded_unit_id || unit.unit_id || unit.section_id, document_or_artifact: unit.internal_unit || unit.heading_label || "Embedded unit", artifact_class: unit.artifact_class || "HOSTED_LEGAL_ARTIFACT", source: unit.source || "", source_type: "EMBEDDED_UNIT", source_corpus_status: "FOUND_EMBEDDED_IN_LEGAL_CORPUS", status: "FOUND_EMBEDDED_IN_LEGAL_CORPUS", document_role: "Embedded unit inside host document.", navigation_pointer: unit.navigation_pointer || null, limitation: unit.limitation || "Embedded unit." }));
  return dedupeRows(rows, (row) => [row.document_id, row.document_or_artifact, row.source_type].join("|"));
}

function compileDocumentStructure({ map, labels }) {
  return asArray(map.macro_unit_map).map((unit) => {
    const label = labels.byUnitId.get(unit.unit_id) || labels.byUnitId.get(unit.section_id) || {};
    return stripEmpty({ section_id: unit.section_id, unit_id: unit.unit_id || unit.section_id, document_id: unit.document_id || unit.artifact_reference, internal_unit: unit.heading_label || unit.internal_unit || "", unit_type: unit.unit_type || "SECTION", apparent_function: unit.heading_label || "Mapped unit.", relationship_to_host: unit.relationship_to_host || "HOSTS_UNIT", source: unit.source || "", status: unit.status || "FOUND_INDEXED", lossless_artifact_name: unit.lossless_artifact_name || pointerValue(unit.location_reference, "lossless_artifact_name"), heading_level: unit.heading_level || 1, navigation_pointer: unit.location_reference || unit.navigation_pointer || null, semantic_registry_subcat_relevance: label.subcats || [], semantic_control_language_family: label.control_families || [], semantic_confidence: label.confidence || "", limitation: unit.limitation || "" });
  });
}

function compileLinkedDocuments(map) {
  return asArray(map.cross_document_reference_map || map.referenced_document_map).map((ref) => stripEmpty({ cross_reference_id: ref.cross_reference_id || ref.reference_id, referring_document: ref.from_document_id || ref.referring_document || "", referenced_document_or_policy: ref.to_document_or_policy || ref.referenced_document_or_policy || "", source_or_reference: ref.to_url_or_label || ref.source_or_reference || "", relationship: ref.reference_type_candidate || ref.relationship || "EXTERNAL_REFERENCE", source_type: ref.source_type || "REFERENCED_URL", source_corpus_status: ref.source_corpus_status || ref.loaded_status || "REFERENCED_BUT_NOT_FETCHED", artifact_class: ref.artifact_class || "HOSTED_LEGAL_ARTIFACT", status: ref.status || ref.loaded_status || "REFERENCED_BUT_NOT_FETCHED", limitation: ref.boundary_note || "" }));
}

function compileControlLocator({ map, labels }) {
  const rows = [];
  for (const candidate of asArray(map.control_language_candidate_map)) {
    const label = labels.byUnitId.get(candidate.unit_id) || {};
    rows.push(stripEmpty({ control_reference_id: candidate.control_candidate_id, control_candidate_id: candidate.control_candidate_id, control_type: first(label.control_families) || candidate.control_language_family_candidate || "UNKNOWN_CONTROL_LANGUAGE", control_language_family: first(label.control_families) || candidate.control_language_family_candidate || "UNKNOWN_CONTROL_LANGUAGE", located_in_document: candidate.document_id || "", unit_or_heading: candidate.unit_id || candidate.section_id || "", section_id: candidate.section_id || "", document_id: candidate.document_id || "", source: "", status: candidate.status || "FOUND_INDEXED", registry_subcat_relevance: label.subcats || [], semantic_confidence: label.confidence || "", navigation_pointer: candidate.navigation_pointer || null, limitation: candidate.boundary_note || "" }));
  }
  return dedupeRows(rows, (row) => [row.control_reference_id, row.section_id, row.unit_or_heading].join("|"));
}

function compileMissingLimitedItems(map) {
  return asArray(map.missing_source_map || map.artifact_absence_access_map).map((missing) => stripEmpty({ missing_id: missing.missing_id || missing.absence_id, missing_or_limited_item: missing.missing_or_limited_item || "Unknown item", expected_location: missing.expected_location || "Loaded corpus", search_basis: missing.search_basis || "", source_type: missing.source_type || "ABSENT_FAMILY", source_corpus_status: missing.source_corpus_status || "STANDALONE_SOURCE_ABSENT", artifact_class: missing.artifact_class || missing.expected_artifact_class || "UNKNOWN_LEGAL_ARTIFACT", downstream_effect: "REVIEW_WITH_LIMITATION", status: missing.status || "STANDALONE_SOURCE_ABSENT", limitation: missing.limitation || missing.boundary_statement || "" }));
}

function buildSemanticCoverageSummary({ map, semantic }) {
  const requiredQueueIds = new Set(asArray(map.semantic_label_queue).filter(isRequiredQueueRow).map((row) => String(row.queue_id || "")).filter(Boolean));
  const labeledQueueIds = new Set(asArray(semantic.semantic_navigation_index).map((row) => String(row.queue_id || "")).filter(Boolean));
  const labeledRequired = countIntersection(labeledQueueIds, requiredQueueIds);
  const ratio = requiredQueueIds.size ? Number((labeledRequired / requiredQueueIds.size).toFixed(4)) : 1;
  return { required_queue_count: requiredQueueIds.size, labeled_queue_count: labeledRequired, coverage_ratio: ratio, ready_for_compiler: ratio >= 0.8, status: ratio >= 0.8 ? "PASS" : "LIMITED" };
}

function buildNavigationLabels({ map, semantic }) {
  const out = { byQueueId: new Map(), byUnitId: new Map() };
  const queueToUnit = new Map(asArray(map.semantic_label_queue).map((row) => [String(row.queue_id || ""), String(row.unit_id || row.section_id || "")]).filter(([queueId, unitId]) => queueId && unitId));
  for (const row of asArray(semantic.semantic_navigation_index)) {
    if (!row?.queue_id) continue;
    const normalized = { queue_id: String(row.queue_id), unit_id: String(row.unit_id || queueToUnit.get(String(row.queue_id)) || ""), subcats: asArray(row.subcats), control_families: asArray(row.control_families), confidence: row.confidence || "" };
    out.byQueueId.set(normalized.queue_id, normalized);
    if (normalized.unit_id) out.byUnitId.set(normalized.unit_id, normalized);
  }
  return out;
}

function resolveFinalLockStatus({ map, semantic, repair, limitations, documentCoverage, documentStructure, semanticCoverage }) {
  const statuses = [map.lock_status, map.status, semantic.lock_status, repair.lock_status, repair.status].filter(Boolean);
  if (statuses.includes("CONTROLLED_FAILURE")) return "CONTROLLED_FAILURE";
  if (!documentCoverage.length || !documentStructure.length) return "CONTROLLED_FAILURE";
  if (semanticCoverage?.ready_for_compiler !== true) return "REPAIR_REQUIRED";
  if (statuses.includes("REPAIR_REQUIRED")) return "REPAIR_REQUIRED";
  if (limitations.length || statuses.includes("LOCKED_WITH_LIMITATIONS") || semanticCoverage?.status === "LIMITED") return "LOCKED_WITH_LIMITATIONS";
  return "LOCKED";
}

function isRequiredQueueRow(row) { return row?.semantic_label_required === true || ["P0", "P1"].includes(row?.priority); }
function countIntersection(actual, expected) { let count = 0; for (const value of expected) if (actual.has(value)) count += 1; return count; }
function keepFinalShape(value) { const output = {}; for (const key of FINAL_KEYS) output[key] = value[key]; if (!ALLOWED_LOCK_STATUS.has(output.lock_status)) output.lock_status = "LOCKED_WITH_LIMITATIONS"; return output; }
function unwrapRoot(value, root) { if (!value || typeof value !== "object") return {}; const artifact = value.artifact && typeof value.artifact === "object" ? value.artifact : value; return artifact[root] || artifact || {}; }
function asArray(value) { return Array.isArray(value) ? value : []; }
function first(value) { return Array.isArray(value) && value.length ? value[0] : ""; }
function pointerValue(pointer, field) { return pointer && typeof pointer === "object" ? pointer[field] || "" : ""; }
function stripEmpty(row) { const out = {}; for (const [key, value] of Object.entries(row)) { if (value === "" || value === undefined) continue; if (Array.isArray(value) && value.length === 0) continue; if (value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0) continue; out[key] = value; } return out; }
function dedupeRows(rows, keyFn) { const seen = new Set(); const out = []; for (const row of rows) { const key = keyFn(row); if (seen.has(key)) continue; seen.add(key); out.push(row); } return out; }
