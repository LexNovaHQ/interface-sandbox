import {
  STAGE6_CONTROL_FAMILIES,
  STAGE6_CONTROL_SIGNALS,
  normalizeStage6BasisCodes,
  normalizeStage6Enum,
  uniqueStage6Values
} from "./stage6CanonicalVocabulary.js";

export function buildStage6ADocumentControlSignalMap(indexRows = []) {
  const rows = [];
  for (const row of indexRows) {
    const controlFamilies = Array.isArray(row.control_families_detected) ? row.control_families_detected : [];
    for (const controlFamily of controlFamilies) {
      rows.push({
        control_signal_id: `CTRL_${String(rows.length + 1).padStart(3, "0")}`,
        document_id: row.document_id,
        legal_unit_id: row.legal_unit_id,
        control_family: normalizeStage6Enum(controlFamily, STAGE6_CONTROL_FAMILIES),
        control_signal: normalizeStage6Enum("visible", STAGE6_CONTROL_SIGNALS),
        basis_codes: normalizeStage6BasisCodes(["macro_heading_classification", "source_bundle_record_ref", "deterministic_seed"]),
        source_refs: uniqueStage6Values([row.source_record_ref, row.legal_unit_id]),
        feature_refs: [],
        data_flow_refs: [],
        confidence: row.confidence || "medium"
      });
    }
  }
  return rows;
}

export function buildStage6AControlFamilyIndex(controlSignalMap = []) {
  const grouped = new Map();
  for (const signal of controlSignalMap) {
    const key = signal.control_family || "unknown";
    const existing = grouped.get(key) || {
      control_family: key,
      control_signal: "visible",
      control_signal_ids: [],
      document_ids: [],
      legal_unit_ids: []
    };
    existing.control_signal_ids.push(signal.control_signal_id);
    existing.document_ids.push(signal.document_id);
    existing.legal_unit_ids.push(signal.legal_unit_id);
    if (signal.control_signal === "partial" && existing.control_signal !== "unclear") existing.control_signal = "partial";
    if (signal.control_signal === "unclear") existing.control_signal = "unclear";
    if (signal.control_signal === "absent_after_search" && !["unclear", "partial"].includes(existing.control_signal)) existing.control_signal = "absent_after_search";
    grouped.set(key, existing);
  }
  return [...grouped.values()].map((item) => ({
    ...item,
    control_signal_ids: uniqueStage6Values(item.control_signal_ids),
    document_ids: uniqueStage6Values(item.document_ids),
    legal_unit_ids: uniqueStage6Values(item.legal_unit_ids)
  }));
}
