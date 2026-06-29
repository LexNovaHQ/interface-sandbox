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
  const labels = buildLabelIndexes(semantic);
  const semanticCoverage = buildSemanticCoverageSummary({ map, semantic });

  const documentCoverage = compileDocumentCoverage({ map, labels });
  const documentStructure = compileDocumentStructure({ map, labels });
  const linkedDocuments = compileLinkedDocuments({ map, labels });
  const controlLocator = compileControlLocator({ map, labels });
  const missingLimited = compileMissingLimitedItems({ map, labels });
  const limitations = [...asArray(map.cartography_limitations), ...asArray(semantic.semantic_repair_queue), ...asArray(repair.repair_rows_unresolved_with_limitations)];

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
        semantic_rows_must_attach_to_deterministic_ids: true,
        semantic_queue_is_authoritative_for_semantic_coverage: true,
        internal_m9_artifacts_not_downstream_required: true,
        full_legal_text_not_copied: true,
        semantic_coverage_summary: semanticCoverage
      },
      lock_status: resolveFinalLockStatus({ map, semantic, repair, limitations, documentCoverage, documentStructure, semanticCoverage })
    })
  };
}

function compileDocumentCoverage({ map, labels }) {
  const rows = asArray(map.document_map).map((doc) => {
    const label = labels.documents.get(doc.document_id) || {};
    return stripEmpty({
      document_id: doc.document_id,
      artifact_id: doc.artifact_id || doc.document_id,
      document_or_artifact: doc.document_or_artifact || doc.document_name || "Unknown legal/governance document",
      artifact_class: doc.artifact_class || label.artifact_class_label || "UNKNOWN_LEGAL_ARTIFACT",
      source: doc.source || doc.source_url || "",
      source_type: doc.source_type || "URL",
      source_corpus_status: doc.source_corpus_status || "FOUND_AS_PRIMARY_SOURCE",
      status: doc.status || "FOUND_INDEXED",
      document_role: label.document_role_label || doc.document_role || "Loaded source.",
      lossless_artifact_name: doc.lossless_artifact_name || "",
      semantic_confidence: label.confidence || "",
      unit_semantic_status: label.unit_semantic_status || "",
      navigation_pointer: doc.text_pointer || null,
      limitation: joinLimitations(doc.limitation, label.boundary_note)
    });
  });

  for (const unit of asArray(map.embedded_unit_map)) {
    rows.push(stripEmpty({
      document_id: unit.embedded_unit_id || unit.unit_id || unit.section_id,
      artifact_id: unit.embedded_unit_id || unit.unit_id || unit.section_id,
      document_or_artifact: unit.internal_unit || unit.heading_label || "Embedded unit",
      artifact_class: unit.artifact_class || "HOSTED_LEGAL_ARTIFACT",
      source: unit.source || "",
      source_type: "EMBEDDED_UNIT",
      source_corpus_status: "FOUND_EMBEDDED_IN_LEGAL_CORPUS",
      status: "FOUND_EMBEDDED_IN_LEGAL_CORPUS",
      document_role: "Embedded unit inside host document.",
      navigation_pointer: unit.navigation_pointer || null,
      limitation: unit.limitation || "Embedded unit."
    }));
  }

  return dedupeRows(rows, (row) => [row.document_id, row.document_or_artifact, row.source_type].join("|"));
}

function compileDocumentStructure({ map, labels }) {
  return asArray(map.macro_unit_map).map((unit) => {
    const label = labels.units.get(unit.unit_id) || labels.units.get(unit.section_id) || {};
    return stripEmpty({
      section_id: unit.section_id,
      unit_id: unit.unit_id || unit.section_id,
      document_id: unit.document_id || unit.artifact_reference,
      internal_unit: unit.heading_label || unit.internal_unit || "",
      unit_type: unit.unit_type || "SECTION",
      apparent_function: label.unit_label || unit.heading_label || "Mapped unit.",
      relationship_to_host: unit.relationship_to_host || "HOSTS_UNIT",
      source: unit.source || "",
      status: unit.status || "FOUND_INDEXED",
      lossless_artifact_name: unit.lossless_artifact_name || pointerValue(unit.location_reference, "lossless_artifact_name"),
      heading_level: unit.heading_level || 1,
      navigation_pointer: unit.location_reference || unit.navigation_pointer || null,
      semantic_registry_subcat_relevance: label.registry_subcat_relevance || [],
      semantic_control_language_family: label.control_language_family || [],
      semantic_confidence: label.confidence || "",
      unit_semantic_status: label.unit_semantic_status || "LOCKED_WITH_LIMITATIONS",
      limitation: joinLimitations(unit.limitation, label.boundary_note)
    });
  });
}

function compileLinkedDocuments({ map, labels }) {
  return asArray(map.cross_document_reference_map || map.referenced_document_map).map((ref) => {
    const label = labels.links.get(ref.cross_reference_id || ref.reference_id) || {};
    return stripEmpty({
      cross_reference_id: ref.cross_reference_id || ref.reference_id,
      referring_document: ref.from_document_id || ref.referring_document || "",
      referenced_document_or_policy: ref.to_document_or_policy || ref.referenced_document_or_policy || "",
      source_or_reference: ref.to_url_or_label || ref.source_or_reference || "",
      relationship: label.reference_type_label || ref.reference_type_candidate || ref.relationship || "EXTERNAL_REFERENCE",
      source_type: ref.source_type || "REFERENCED_URL",
      source_corpus_status: ref.source_corpus_status || ref.loaded_status || "REFERENCED_BUT_NOT_FETCHED",
      artifact_class: ref.artifact_class || "HOSTED_LEGAL_ARTIFACT",
      status: ref.status || ref.loaded_status || "REFERENCED_BUT_NOT_FETCHED",
      semantic_confidence: label.confidence || "",
      limitation: joinLimitations(ref.boundary_note, label.boundary_note)
    });
  });
}

function compileControlLocator({ map, labels }) {
  const rows = [];
  for (const candidate of asArray(map.control_language_candidate_map)) {
    const label = labels.controls.get(candidate.control_candidate_id) || {};
    rows.push(stripEmpty({
      control_reference_id: candidate.control_candidate_id,
      control_candidate_id: candidate.control_candidate_id,
      control_type: first(label.control_language_family) || candidate.control_language_family_candidate || "UNKNOWN_CONTROL_LANGUAGE",
      control_language_family: first(label.control_language_family) || candidate.control_language_family_candidate || "UNKNOWN_CONTROL_LANGUAGE",
      located_in_document: candidate.document_id || label.document_id || "",
      unit_or_heading: label.unit_label || candidate.unit_id || candidate.section_id || "",
      section_id: candidate.section_id || label.section_id || "",
      document_id: candidate.document_id || label.document_id || "",
      source: "",
      status: candidate.status || "FOUND_INDEXED",
      registry_subcat_relevance: label.registry_subcat_relevance || [],
      semantic_confidence: label.confidence || "",
      unit_semantic_status: label.unit_semantic_status || "LOCKED_WITH_LIMITATIONS",
      navigation_pointer: candidate.navigation_pointer || null,
      limitation: joinLimitations(candidate.boundary_note, label.boundary_note)
    }));
  }
  for (const item of asArray(map.indemnity_candidate_map)) {
    const label = labels.indemnities.get(item.indemnity_candidate_id) || {};
    rows.push(stripEmpty({
      control_reference_id: item.indemnity_candidate_id,
      control_type: "INDEMNITY",
      control_language_family: "INDEMNITY",
      located_in_document: item.document_id || "",
      unit_or_heading: item.indemnity_clause_location || item.unit_id || "",
      section_id: item.section_id || "",
      document_id: item.document_id || "",
      source: "",
      status: item.status || "FOUND_INDEXED",
      registry_subcat_relevance: ["LIA"],
      semantic_confidence: label.confidence || "",
      unit_semantic_status: label.unit_semantic_status || "LOCKED_WITH_LIMITATIONS",
      navigation_pointer: item.navigation_pointer || null,
      limitation: joinLimitations(item.boundary_note, label.boundary_note)
    }));
  }
  return dedupeRows(rows, (row) => [row.control_reference_id, row.section_id, row.unit_or_heading].join("|"));
}

function compileMissingLimitedItems({ map, labels }) {
  return asArray(map.missing_source_map || map.artifact_absence_access_map).map((missing) => {
    const label = labels.missing.get(missing.missing_id || missing.absence_id) || {};
    return stripEmpty({
      missing_id: missing.missing_id || missing.absence_id,
      missing_or_limited_item: missing.missing_or_limited_item || "Unknown item",
      expected_location: missing.expected_location || "Loaded corpus",
      search_basis: missing.search_basis || "",
      source_type: missing.source_type || "ABSENT_FAMILY",
      source_corpus_status: missing.source_corpus_status || "STANDALONE_SOURCE_ABSENT",
      artifact_class: missing.artifact_class || missing.expected_artifact_class || "UNKNOWN_LEGAL_ARTIFACT",
      downstream_effect: label.downstream_treatment || "REVIEW_WITH_LIMITATION",
      status: missing.status || "STANDALONE_SOURCE_ABSENT",
      semantic_confidence: label.confidence || "",
      limitation: joinLimitations(missing.limitation || missing.boundary_statement, label.boundary_note)
    });
  });
}

function buildSemanticCoverageSummary({ map, semantic }) {
  const requiredUnitIds = new Set(asArray(map.semantic_label_queue).filter(isRequiredQueueRow).map((row) => String(row.unit_id || row.section_id || "")).filter(Boolean));
  const requiredControlIds = new Set(asArray(map.control_language_candidate_map).filter((row) => requiredUnitIds.has(String(row.unit_id || ""))).map((row) => String(row.control_candidate_id || "")).filter(Boolean));
  const labeledUnitIds = new Set(asArray(semantic.unit_subcat_labels).map((row) => String(row.unit_id || row.section_id || "")).filter(Boolean));
  const labeledControlIds = new Set(asArray(semantic.control_family_labels).map((row) => String(row.control_candidate_id || "")).filter(Boolean));
  const requiredTotal = requiredUnitIds.size + requiredControlIds.size;
  const labeledTotal = countIntersection(labeledUnitIds, requiredUnitIds) + countIntersection(labeledControlIds, requiredControlIds);
  const ratio = requiredTotal ? Number((labeledTotal / requiredTotal).toFixed(4)) : 1;
  return {
    semantic_queue_total: asArray(map.semantic_label_queue).length,
    semantic_queue_required_total: requiredUnitIds.size,
    semantic_required_units_labeled: countIntersection(labeledUnitIds, requiredUnitIds),
    semantic_required_controls_total: requiredControlIds.size,
    semantic_required_controls_labeled: countIntersection(labeledControlIds, requiredControlIds),
    semantic_required_coverage_ratio: ratio,
    ready_for_compiler: ratio >= 0.8,
    status: ratio >= 0.8 ? "PASS" : "LIMITED"
  };
}

function buildLabelIndexes(semantic) {
  const out = { documents: new Map(), units: new Map(), controls: new Map(), indemnities: new Map(), links: new Map(), missing: new Map() };
  for (const row of asArray(semantic.document_labels)) setIfKey(out.documents, row.document_id || row.artifact_id, row);
  for (const row of asArray(semantic.unit_subcat_labels)) { setIfKey(out.units, row.unit_id, row); setIfKey(out.units, row.section_id, row); }
  for (const row of asArray(semantic.control_family_labels)) setIfKey(out.controls, row.control_candidate_id, row);
  for (const row of asArray(semantic.indemnity_labels)) setIfKey(out.indemnities, row.indemnity_candidate_id, row);
  for (const row of asArray(semantic.cross_reference_labels)) setIfKey(out.links, row.cross_reference_id, row);
  for (const row of asArray(semantic.missing_source_labels)) setIfKey(out.missing, row.missing_id || row.absence_id, row);
  return out;
}

function resolveFinalLockStatus({ map, semantic, repair, limitations, documentCoverage, documentStructure, semanticCoverage }) {
  const statuses = [map.lock_status, map.status, semantic.lock_status, semantic.status, repair.lock_status, repair.status].filter(Boolean);
  if (statuses.includes("CONTROLLED_FAILURE")) return "CONTROLLED_FAILURE";
  if (!documentCoverage.length || !documentStructure.length) return "CONTROLLED_FAILURE";
  if (statuses.includes("REPAIR_REQUIRED") && semanticCoverage?.ready_for_compiler !== true) return "REPAIR_REQUIRED";
  if (limitations.length || statuses.includes("LOCKED_WITH_LIMITATIONS") || semanticCoverage?.status === "LIMITED") return "LOCKED_WITH_LIMITATIONS";
  return "LOCKED";
}

function isRequiredQueueRow(row) { return row?.semantic_label_required === true || ["P0", "P1"].includes(row?.priority); }
function countIntersection(actual, expected) { let count = 0; for (const value of expected) if (actual.has(value)) count += 1; return count; }
function keepFinalShape(value) { const output = {}; for (const key of FINAL_KEYS) output[key] = value[key]; if (!ALLOWED_LOCK_STATUS.has(output.lock_status)) output.lock_status = "LOCKED_WITH_LIMITATIONS"; return output; }
function unwrapRoot(value, root) { if (!value || typeof value !== "object") return {}; const artifact = value.artifact && typeof value.artifact === "object" ? value.artifact : value; return artifact[root] || artifact || {}; }
function setIfKey(map, key, row) { if (key) map.set(String(key), row); }
function asArray(value) { return Array.isArray(value) ? value : []; }
function first(value) { return Array.isArray(value) && value.length ? value[0] : ""; }
function pointerValue(pointer, field) { return pointer && typeof pointer === "object" ? pointer[field] || "" : ""; }
function joinLimitations(...values) { return values.filter(Boolean).join(" | "); }
function stripEmpty(row) { const out = {}; for (const [key, value] of Object.entries(row)) { if (value === "" || value === undefined) continue; if (Array.isArray(value) && value.length === 0) continue; if (value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0) continue; out[key] = value; } return out; }
function dedupeRows(rows, keyFn) { const seen = new Set(); const out = []; for (const row of rows) { const key = keyFn(row); if (seen.has(key)) continue; seen.add(key); out.push(row); } return out; }
