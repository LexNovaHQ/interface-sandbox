import { handleDiligenceStageRequest } from "../_shared/diligenceStageHandler.js";

export async function onRequest(context) {
  return handleDiligenceStageRequest(context, {
    stageId: "legal_stack_review",
    outputSchemaKey: "legal_stack_review",
    outputKey: "legal_stack_review"
  });
}
