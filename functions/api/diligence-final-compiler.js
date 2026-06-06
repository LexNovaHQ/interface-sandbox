import { handleDiligenceStageRequest } from "../_shared/diligenceStageHandler.js";

export async function onRequest(context) {
  return handleDiligenceStageRequest(context, {
    stageId: "final_compiler",
    outputSchemaKey: "diligence_compiler_output",
    outputKey: "compiler_output"
  });
}
