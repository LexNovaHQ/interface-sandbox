import { buildStage6ALegalCartographySkeleton } from "./stage6aLegalCartographyBuilder.js";
import { buildStage6AControlFamilyIndex, buildStage6ADocumentControlSignalMap } from "./stage6aLegalControlSignalBuilder.js";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function unique(values = []) {
  return [...new Set(asArray(values).filter((value) => value !== undefined && value !== null && String(value).trim()).map(String))];
}

function bySectionId(indexRows = []) {
  return new Map(indexRows.map((row) => [row.section_id, row]));
}

function applySectionOverlay(indexRows = [], overlayRows = []) {
  if (!asArray(overlayRows).length) return indexRows;
  const overlayBySection = new Map(overlayRows.map((row) => [row.section_id, row]));
  return indexRows.map((row) => {
    const overlay = overlayBySection.get(row.section_id);
    if (!overlay) return row;
    return {
      ...row,
      section_function: overlay.section_function || row.section_function,
      control_topics_detected: asArray(overlay.control_families).length ? overlay.control_families : row.control_topics_detected,
      confidence: overlay.confidence || row.confidence
    };
  });
}

function signalKey(sectionId, controlFamily) {
  return `${sectionId}::${controlFamily}`;
}

function pushSignal(signalMap, key, signal) {
  const existing = signalMap.get(key);
  if (!existing) {
    signalMap.set(key, signal);
    return;
  }
  signalMap.set(key, {
    ...existing,
    ...signal,
    feature_refs: unique([...(existing.feature_refs || []), ...(signal.feature_refs || [])]),
    data_flow_refs: unique([...(existing.data_flow_refs || []), ...(signal.data_flow_refs || [])]),
    basis_codes: unique([...(existing.basis_codes || []), ...(signal.basis_codes || [])])
  });
}

function buildControlSignalsFromOverlay(indexRows = [], deterministicSignals = [], overlay = {}) {
  const sections = bySectionId(indexRows);
  const signalMap = new Map();
  for (const signal of deterministicSignals) {
    pushSignal(signalMap, signalKey(signal.section_id, signal.control_family), { ...signal });
  }
  for (const row of asArray(overlay.section_classification_overlay)) {
    const section = sections.get(row.section_id);
    if (!section) continue;
    for (const controlFamily of asArray(row.control_families)) {
      pushSignal(signalMap, signalKey(row.section_id, controlFamily), {
        doc_id: section.doc_id,
        section_id: row.section_id,
        control_family: controlFamily,
        coverage_signal: row.coverage_signal || "unknown",
        feature_refs: [],
        data_flow_refs: [],
        basis_codes: row.basis_codes || [],
        source_record_ref: section.source_record_ref,
        confidence: row.confidence || "unknown"
      });
    }
  }
  for (const row of asArray(overlay.document_control_overlay)) {
    const section = sections.get(row.section_id);
    if (!section) continue;
    pushSignal(signalMap, signalKey(row.section_id, row.control_family), {
      doc_id: section.doc_id,
      section_id: row.section_id,
      control_family: row.control_family,
      coverage_signal: row.coverage_signal || "unknown",
      feature_refs: row.feature_refs || [],
      data_flow_refs: row.data_flow_refs || [],
      basis_codes: row.basis_codes || [],
      source_record_ref: section.source_record_ref,
      confidence: row.confidence || "unknown"
    });
  }
  return [...signalMap.values()].map((signal, index) => ({
    control_signal_id: `CTRL_${String(index + 1).padStart(3, "0")}`,
    doc_id: signal.doc_id,
    section_id: signal.section_id,
    control_family: signal.control_family || "unknown",
    coverage_signal: signal.coverage_signal || "unknown",
    feature_refs: unique(signal.feature_refs || []),
    data_flow_refs: unique(signal.data_flow_refs || []),
    basis_codes: unique(signal.basis_codes || []),
    source_record_ref: signal.source_record_ref || "unknown",
    confidence: signal.confidence || "unknown"
  }));
}

function buildRelationshipsFromOverlay(indexRows = [], overlayRows = []) {
  const sections = bySectionId(indexRows);
  return asArray(overlayRows).map((row, index) => {
    const sourceSection = sections.get(row.from_section_id) || sections.get(row.to_section_id);
    return {
      relationship_id: row.relationship_id || `REL_${String(index + 1).padStart(3, "0")}`,
      from_doc_id: row.from_doc_id,
      to_doc_id: row.to_doc_id,
      from_section_id: row.from_section_id,
      to_section_id: row.to_section_id,
      relationship_type: row.relationship_type || "unknown",
      relationship_signal: row.relationship_signal || "unknown",
      section_refs: unique(row.section_refs || []),
      source_record_ref: sourceSection?.source_record_ref || "unknown",
      confidence: row.confidence || "unknown"
    };
  });
}

function buildFeatureToDocumentSectionIndex(overlayRows = []) {
  return asArray(overlayRows).map((row) => ({
    feature_id: row.feature_id,
    doc_ids: [],
    section_ids: unique(row.section_ids || []),
    control_families: unique(row.control_families || [])
  }));
}

function hydrateFeatureIndexDocIds(featureRows = [], indexRows = []) {
  const sections = bySectionId(indexRows);
  return featureRows.map((row) => ({
    ...row,
    doc_ids: unique(asArray(row.section_ids).map((sectionId) => sections.get(sectionId)?.doc_id).filter(Boolean))
  }));
}

export function mergeStage6AModelOverlay(canonical = {}, normalizedOverlay = {}) {
  const output = structuredClone(canonical);
  const currentIndex = output.legal_document_cartography?.legal_document_index || [];
  const updatedIndex = applySectionOverlay(currentIndex, normalizedOverlay.section_classification_overlay || []);
  output.legal_document_cartography.legal_document_index = updatedIndex;

  const deterministicSignals = buildStage6ADocumentControlSignalMap(updatedIndex);
  const signals = buildControlSignalsFromOverlay(updatedIndex, deterministicSignals, normalizedOverlay);
  output.legal_document_cartography.document_control_signal_map = signals;
  output.legal_document_cartography.document_relationship_map = buildRelationshipsFromOverlay(updatedIndex, normalizedOverlay.document_relationship_overlay || []);
  output.legal_document_cartography.document_mismatch_signal_map = asArray(normalizedOverlay.document_mismatch_overlay);
  output.stage7_navigation_index.control_family_index = buildStage6AControlFamilyIndex(signals);
  output.stage7_navigation_index.feature_to_document_section_index = hydrateFeatureIndexDocIds(buildFeatureToDocumentSectionIndex(normalizedOverlay.feature_section_overlay || []), updatedIndex);
  return output;
}

export function buildStage6ACartography(input = {}, options = {}) {
  const output = buildStage6ALegalCartographySkeleton(input);
  const sections = output.legal_document_cartography.legal_document_index || [];
  const signals = buildStage6ADocumentControlSignalMap(sections);
  output.legal_document_cartography.document_control_signal_map = signals;
  output.stage7_navigation_index.control_family_index = buildStage6AControlFamilyIndex(signals);
  if (options.normalized_overlay) return mergeStage6AModelOverlay(output, options.normalized_overlay);
  return output;
}
