import { handleDiligenceStageRequest } from "../_shared/diligenceStageHandler.js";

export async function onRequest(context) {
  return handleDiligenceStageRequest(context, {
    stageId: "registry_ledger_evaluation",
    outputSchemaKey: "registry_evaluation_ledger",
    outputKey: "registry_ledger_result"
  });
}
