import { handleDiligenceStageRequest } from "../_shared/diligenceStageHandler.js";
import { normalizeFinalCompilerForSchema } from "../_shared/finalCompilerSchemaGuard.js";

export async function onRequest(context) {
  return handleDiligenceStageRequest(context, {
    stageId: "final_compiler",
    outputSchemaKey: "diligence_compiler_output",
    outputKey: "compiler_output",
    normalizeOutput: normalizeFinalCompilerForSchema
  });
}
