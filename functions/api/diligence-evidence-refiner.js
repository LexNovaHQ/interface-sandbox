import { handleDiligenceStageRequest } from "../_shared/diligenceStageHandler.js";

export async function onRequest(context) {
  return handleDiligenceStageRequest(context, {
    stageId: "evidence_refiner",
    outputSchemaKey: "source_bundle",
    outputKey: "source_bundle"
  });
}
