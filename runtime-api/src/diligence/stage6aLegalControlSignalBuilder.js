function unique(values = []) {
  return [...new Set(values.filter((value) => value !== undefined && value !== null && String(value).trim()))];
}

export function buildStage6ADocumentControlSignalMap(indexRows = []) {
  const rows = [];
  for (const row of indexRows) {
    const controlFamilies = Array.isArray(row.control_topics_detected) ? row.control_topics_detected : [];
    for (const controlFamily of controlFamilies) {
      rows.push({
        control_signal_id: `CTRL_${String(rows.length + 1).padStart(3, "0")}`,
        doc_id: row.doc_id,
        section_id: row.section_id,
        control_family: controlFamily,
        coverage_signal: "visible",
        feature_refs: [],
        data_flow_refs: [],
        basis_codes: ["heading_classification", "source_bundle_record_ref"],
        source_record_ref: row.source_record_ref,
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
      coverage_signal: "visible",
      control_signal_ids: [],
      doc_ids: [],
      section_ids: []
    };
    existing.control_signal_ids.push(signal.control_signal_id);
    existing.doc_ids.push(signal.doc_id);
    existing.section_ids.push(signal.section_id);
    if (signal.coverage_signal === "partial" && existing.coverage_signal !== "conflicting") existing.coverage_signal = "partial";
    if (signal.coverage_signal === "conflicting") existing.coverage_signal = "conflicting";
    grouped.set(key, existing);
  }
  return [...grouped.values()].map((item) => ({
    ...item,
    control_signal_ids: unique(item.control_signal_ids),
    doc_ids: unique(item.doc_ids),
    section_ids: unique(item.section_ids)
  }));
}
