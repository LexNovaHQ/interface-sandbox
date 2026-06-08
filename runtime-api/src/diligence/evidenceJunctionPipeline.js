import { buildEvidenceJunction } from "./evidenceJunction.js";
import { buildEvidenceJunctionWorkItems } from "./evidenceJunctionWorkItems.js";
import { applyEvidenceJunctionAdjudications } from "./evidenceJunctionAdjudication.js";

export async function buildEvidenceJunctionWithAdjudication({ sourceBundle = {}, adjudicateWorkItem = null, runId = null } = {}) {
  const base = buildEvidenceJunction({ sourceBundle, runId });
  const workItems = buildEvidenceJunctionWorkItems(base);

  if (typeof adjudicateWorkItem !== "function" || workItems.length === 0) {
    return {
      ...base,
      adjudication_work_items: workItems,
      adjudications: [],
      adjudication_errors: [],
      processing_manifest: {
        ...base.processing_manifest,
        deterministic_router_completed: true,
        gemini_adjudication_mode: "bounded_candidate_groups",
        gemini_called: false
      }
    };
  }

  const adjudications = [];
  const adjudicationErrors = [];
  for (const workItem of workItems) {
    try {
      const result = await adjudicateWorkItem(workItem);
      const adjudication = result?.adjudication || result;
      if (adjudication?.dedupe_group_id) adjudications.push(adjudication);
      else adjudicationErrors.push({ dedupe_group_id: workItem.dedupe_group_id, error_type: result?.error_type || "NO_ADJUDICATION_RETURNED" });
    } catch (error) {
      adjudicationErrors.push({ dedupe_group_id: workItem.dedupe_group_id, error_type: "ADJUDICATOR_THROW", error: error?.message || String(error) });
    }
  }

  const applied = applyEvidenceJunctionAdjudications(base, adjudications);
  return {
    ...applied,
    adjudication_work_items: workItems,
    adjudications,
    adjudication_errors: adjudicationErrors,
    processing_manifest: {
      ...applied.processing_manifest,
      gemini_called: true,
      gemini_adjudication_fail_open: true,
      deterministic_fallback_preserved: true
    }
  };
}
