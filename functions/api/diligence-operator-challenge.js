import { handleDiligenceStageRequest } from "../_shared/diligenceStageHandler.js";

export async function onRequest(context) {
  return handleDiligenceStageRequest(context, {
    stageId: "operator_challenge",
    outputSchemaKey: "operator_challenge_gate",
    outputKey: "operator_challenge_result"
  });
}
