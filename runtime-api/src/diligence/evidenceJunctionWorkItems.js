export function buildEvidenceJunctionWorkItems(junction = {}) {
  const groups = Array.isArray(junction.dedupe_groups) ? junction.dedupe_groups : [];
  return groups.map((group) => ({
    work_item_version: "evidence_junction_work_item_v1",
    dedupe_group_id: group.dedupe_group_id,
    canonical_subject: group.canonical_subject,
    candidate_source_ids: [group.primary_source_id, ...(group.supporting_source_ids || [])].filter(Boolean)
  }));
}
