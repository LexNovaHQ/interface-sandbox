import { handleDiligenceStageRequest } from "../_shared/diligenceStageHandler.js";
import { normalizeFinalCompilerOutput } from "../_shared/finalCompilerNormalizer.js";

export async function onRequest(context) {
  return handleDiligenceStageRequest(context, {
    stageId: "final_compiler",
    outputSchemaKey: "diligence_compiler_output",
    outputKey: "compiler_output",
    normalizeOutput: normalizeFinalCompilerOutput
  });
}
