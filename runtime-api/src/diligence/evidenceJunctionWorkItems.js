function compact(value, max = 900) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function sourceText(record = {}) {
  return record.text?.clean_text_lossless || "";
}

function sourceTitle(record = {}) {
  return record.structure?.title || record.title || "";
}

function sourceIndex(junction = {}) {
  const index = new Map();
  for (const packet of Object.values(junction.downstream_packets || {})) {
    for (const record of Array.isArray(packet.source_records) ? packet.source_records : []) {
      if (record.evidence_source_id && !index.has(record.evidence_source_id)) index.set(record.evidence_source_id, record);
    }
  }
  return index;
}

export function buildEvidenceJunctionWorkItems(junction = {}) {
  const recordsById = sourceIndex(junction);
  const groups = Array.isArray(junction.dedupe_groups) ? junction.dedupe_groups : [];
  return groups.map((group) => {
    const ids = [group.primary_source_id, ...(group.supporting_source_ids || [])].filter(Boolean);
    return {
      work_item_version: "evidence_junction_work_item_v1",
      dedupe_group_id: group.dedupe_group_id,
      canonical_subject: group.canonical_subject,
      candidate_source_ids: ids,
      candidate_sources: ids.map((id) => {
        const record = recordsById.get(id) || {};
        return {
          evidence_source_id: id,
          source_family: record.source_family || null,
          url: record.url || null,
          final_url: record.final_url || null,
          title: sourceTitle(record),
          word_count: record.text?.word_count || 0,
          bounded_location_text: compact(`${sourceTitle(record)} ${sourceText(record)}`, 1000)
        };
      })
    };
  });
}
