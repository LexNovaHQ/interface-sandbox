import { handleDiligenceStageRequest } from "../_shared/diligenceStageHandler.js";

export async function onRequest(context) {
  return handleDiligenceStageRequest(context, {
    stageId: "target_feature_profile",
    outputSchemaKey: "target_feature_profile",
    outputKey: "target_feature_profile"
  });
}
