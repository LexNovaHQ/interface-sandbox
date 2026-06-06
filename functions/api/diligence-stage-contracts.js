import { jsonResponse, methodNotAllowed } from "../_shared/response.js";
import {
  getDiligenceRuntimeBoundary,
  listDiligenceStageContracts
} from "../_shared/diligenceStageContracts.js";

export async function onRequest(context) {
  if (context.request.method !== "GET") {
    return methodNotAllowed(["GET"]);
  }

  return jsonResponse({
    ok: true,
    runtime: getDiligenceRuntimeBoundary(),
    stages: listDiligenceStageContracts()
  });
}
