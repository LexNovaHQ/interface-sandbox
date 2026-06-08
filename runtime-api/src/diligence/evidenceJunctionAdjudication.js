function clone(value) {
  return JSON.parse(JSON.stringify(value || {}));
}

export function applyEvidenceJunctionAdjudications(junction = {}, adjudications = []) {
  const next = clone(junction);
  const byGroup = new Map((adjudications || []).map((item) => [item.dedupe_group_id, item]));

  next.dedupe_groups = (next.dedupe_groups || []).map((group) => {
    const adjudication = byGroup.get(group.dedupe_group_id);
    if (!adjudication) return group;
    return {
      ...group,
      primary_source_id: adjudication.primary_source_id || group.primary_source_id,
      supporting_source_ids: Array.isArray(adjudication.supporting_source_ids) ? adjudication.supporting_source_ids : group.supporting_source_ids,
      noise_source_ids: Array.isArray(adjudication.noise_source_ids) ? adjudication.noise_source_ids : group.noise_source_ids || [],
      adjudication: {
        adjudicated: true,
        mode: "bounded_candidate_group",
        reason: adjudication.reason || "Bounded adjudication applied."
      }
    };
  });

  next.processing_manifest = {
    ...(next.processing_manifest || {}),
    deterministic_router_completed: true,
    gemini_adjudication_mode: "bounded_candidate_groups",
    gemini_called: adjudications.length > 0,
    source_archive_preserved: true,
    source_text_mutated: false,
    source_text_summarized: false,
    source_text_compressed: false,
    source_text_truncated: false
  };

  return next;
}
