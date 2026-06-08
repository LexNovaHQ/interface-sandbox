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
      processing_manifest: {
        ...base.processing_manifest,
        deterministic_router_completed: true,
        gemini_adjudication_mode: "bounded_candidate_groups",
        gemini_called: false
      }
    };
  }

  const adjudications = [];
  for (const workItem of workItems) {
    const result = await adjudicateWorkItem(workItem);
    if (result && result.dedupe_group_id) adjudications.push(result);
  }

  return {
    ...applyEvidenceJunctionAdjudications(base, adjudications),
    adjudication_work_items: workItems,
    adjudications
  };
}
