import { buildStage6ALegalCartographySkeleton } from "./stage6aLegalCartographyBuilder.js";
import { buildStage6AControlFamilyIndex, buildStage6ADocumentControlSignalMap } from "./stage6aLegalControlSignalBuilder.js";
import {
  STAGE6_CONTROL_FAMILIES,
  STAGE6_CONTROL_SIGNALS,
  STAGE6_LEGAL_UNIT_TYPES,
  STAGE6_SECTION_FUNCTIONS,
  normalizeStage6BasisCodes,
  normalizeStage6Enum,
  uniqueStage6Values
} from "./stage6CanonicalVocabulary.js";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function byLegalUnitId(indexRows = []) {
  return new Map(indexRows.map((row) => [row.legal_unit_id, row]));
}

function applyLegalUnitOverlay(indexRows = [], overlayRows = []) {
  if (!asArray(overlayRows).length) return indexRows;
  const overlayByUnit = new Map(overlayRows.map((row) => [row.legal_unit_id, row]));
  return indexRows.map((row) => {
    const overlay = overlayByUnit.get(row.legal_unit_id);
    if (!overlay) return row;
    return {
      ...row,
      legal_unit_type: normalizeStage6Enum(overlay.legal_unit_type || row.legal_unit_type, STAGE6_LEGAL_UNIT_TYPES),
      section_function: normalizeStage6Enum(overlay.section_function || row.section_function, STAGE6_SECTION_FUNCTIONS),
      control_families_detected: asArray(overlay.control_families_detected).length ? overlay.control_families_detected : row.control_families_detected,
      basis_codes: normalizeStage6BasisCodes([...(row.basis_codes || []), ...(overlay.basis_codes || [])]),
      confidence: overlay.confidence || row.confidence
    };
  });
}

function signalKey(legalUnitId, controlFamily) {
  return `${legalUnitId}::${controlFamily}`;
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
    source_refs: uniqueStage6Values([...(existing.source_refs || []), ...(signal.source_refs || [])]),
    feature_refs: uniqueStage6Values([...(existing.feature_refs || []), ...(signal.feature_refs || [])]),
    data_flow_refs: uniqueStage6Values([...(existing.data_flow_refs || []), ...(signal.data_flow_refs || [])]),
    basis_codes: normalizeStage6BasisCodes([...(existing.basis_codes || []), ...(signal.basis_codes || [])])
  });
}

function buildControlSignalsFromOverlay(indexRows = [], deterministicSignals = [], overlay = {}) {
  const legalUnits = byLegalUnitId(indexRows);
  const signalMap = new Map();
  for (const signal of deterministicSignals) {
    pushSignal(signalMap, signalKey(signal.legal_unit_id, signal.control_family), { ...signal });
  }
  for (const row of asArray(overlay.legal_unit_classification_overlay)) {
    const legalUnit = legalUnits.get(row.legal_unit_id);
    if (!legalUnit) continue;
    for (const controlFamily of asArray(row.control_families_detected)) {
      pushSignal(signalMap, signalKey(row.legal_unit_id, controlFamily), {
        document_id: legalUnit.document_id,
        legal_unit_id: row.legal_unit_id,
        control_family: normalizeStage6Enum(controlFamily, STAGE6_CONTROL_FAMILIES),
        control_signal: "visible",
        basis_codes: normalizeStage6BasisCodes(row.basis_codes || []),
        source_refs: uniqueStage6Values([legalUnit.source_record_ref, legalUnit.legal_unit_id]),
        feature_refs: [],
        data_flow_refs: [],
        confidence: row.confidence || "unknown"
      });
    }
  }
  for (const row of asArray(overlay.document_control_overlay)) {
    const legalUnit = legalUnits.get(row.legal_unit_id);
    if (!legalUnit) continue;
    pushSignal(signalMap, signalKey(row.legal_unit_id, row.control_family), {
      document_id: legalUnit.document_id,
      legal_unit_id: row.legal_unit_id,
      control_family: normalizeStage6Enum(row.control_family, STAGE6_CONTROL_FAMILIES),
      control_signal: normalizeStage6Enum(row.control_signal, STAGE6_CONTROL_SIGNALS),
      basis_codes: normalizeStage6BasisCodes(row.basis_codes || []),
      source_refs: uniqueStage6Values([legalUnit.source_record_ref, legalUnit.legal_unit_id]),
      feature_refs: row.feature_refs || [],
      data_flow_refs: row.data_flow_refs || [],
      confidence: row.confidence || "unknown"
    });
  }
  return [...signalMap.values()].map((signal, index) => ({
    control_signal_id: `CTRL_${String(index + 1).padStart(3, "0")}`,
    document_id: signal.document_id,
    legal_unit_id: signal.legal_unit_id,
    control_family: normalizeStage6Enum(signal.control_family, STAGE6_CONTROL_FAMILIES),
    control_signal: normalizeStage6Enum(signal.control_signal, STAGE6_CONTROL_SIGNALS),
    basis_codes: normalizeStage6BasisCodes(signal.basis_codes || []),
    source_refs: uniqueStage6Values(signal.source_refs || []),
    feature_refs: uniqueStage6Values(signal.feature_refs || []),
    data_flow_refs: uniqueStage6Values(signal.data_flow_refs || []),
    confidence: signal.confidence || "unknown"
  }));
}

function buildRelationshipsFromOverlay(overlayRows = []) {
  return asArray(overlayRows).map((row, index) => ({
    relationship_id: row.relationship_id || `REL_${String(index + 1).padStart(3, "0")}`,
    from_ref: row.from_ref || "unknown",
    to_ref: row.to_ref || "unknown",
    relationship_type: row.relationship_type || "unknown",
    basis_codes: normalizeStage6BasisCodes(row.basis_codes || []),
    confidence: row.confidence || "unknown"
  }));
}

function buildMismatchesFromOverlay(overlayRows = []) {
  return asArray(overlayRows).map((row, index) => ({
    mismatch_id: row.mismatch_id || `MM_${String(index + 1).padStart(3, "0")}`,
    mismatch_type: row.mismatch_type || "unknown",
    mismatch_signal: row.mismatch_signal || "unknown",
    expected_ref: row.expected_ref || "unknown",
    actual_ref: row.actual_ref || null,
    control_family: normalizeStage6Enum(row.control_family, STAGE6_CONTROL_FAMILIES),
    basis_codes: normalizeStage6BasisCodes(row.basis_codes || []),
    confidence: row.confidence || "unknown"
  }));
}

function buildFeatureToLegalUnitIndex(overlayRows = [], indexRows = []) {
  const legalUnits = byLegalUnitId(indexRows);
  return asArray(overlayRows).map((row) => {
    const legalUnitIds = uniqueStage6Values(row.legal_unit_ids || []);
    return {
      feature_id: row.feature_id,
      document_ids: uniqueStage6Values(legalUnitIds.map((legalUnitId) => legalUnits.get(legalUnitId)?.document_id).filter(Boolean)),
      legal_unit_ids: legalUnitIds,
      control_families: uniqueStage6Values(row.control_families || []).map((value) => normalizeStage6Enum(value, STAGE6_CONTROL_FAMILIES)).filter((value) => value !== "unknown")
    };
  });
}

export function mergeStage6AModelOverlay(canonical = {}, normalizedOverlay = {}) {
  const output = structuredClone(canonical);
  const currentIndex = output.legal_document_cartography?.legal_document_index || [];
  const updatedIndex = applyLegalUnitOverlay(currentIndex, normalizedOverlay.legal_unit_classification_overlay || []);
  output.legal_document_cartography.legal_document_index = updatedIndex;

  const deterministicSignals = buildStage6ADocumentControlSignalMap(updatedIndex);
  const signals = buildControlSignalsFromOverlay(updatedIndex, deterministicSignals, normalizedOverlay);
  output.legal_document_cartography.document_control_signal_map = signals;
  output.legal_document_cartography.document_relationship_map = buildRelationshipsFromOverlay(normalizedOverlay.document_relationship_overlay || []);
  output.legal_document_cartography.document_mismatch_signal_map = buildMismatchesFromOverlay(normalizedOverlay.document_mismatch_overlay || []);
  output.stage7_navigation_index.control_family_index = buildStage6AControlFamilyIndex(signals);
  output.stage7_navigation_index.feature_to_legal_unit_index = buildFeatureToLegalUnitIndex(normalizedOverlay.feature_legal_unit_overlay || [], updatedIndex);
  return output;
}

export function buildStage6ACartography(input = {}, options = {}) {
  const output = buildStage6ALegalCartographySkeleton(input);
  const legalUnits = output.legal_document_cartography.legal_document_index || [];
  const signals = buildStage6ADocumentControlSignalMap(legalUnits);
  output.legal_document_cartography.document_control_signal_map = signals;
  output.stage7_navigation_index.control_family_index = buildStage6AControlFamilyIndex(signals);
  if (options.normalized_overlay) return mergeStage6AModelOverlay(output, options.normalized_overlay);
  return output;
}
