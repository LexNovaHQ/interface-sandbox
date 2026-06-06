import { jsonResponse, methodNotAllowed } from "../_shared/response.js";
import {
  assertKnownDiligenceStage,
  getDiligenceRuntimeBoundary
} from "../_shared/diligenceStageContracts.js";

async function readJsonBody(request) {
  const contentType = request.headers.get("content-type") || "";

  if (!contentType.toLowerCase().includes("application/json")) {
    throw new Error("Request body must be application/json");
  }

  try {
    return await request.json();
  } catch (error) {
    throw new Error("Invalid JSON request body");
  }
}

function getStageId(payload) {
  return payload?.stage_id || payload?.stageId || payload?.stage;
}

export async function onRequest(context) {
  if (context.request.method !== "POST") {
    return methodNotAllowed(["POST"]);
  }

  let payload;

  try {
    payload = await readJsonBody(context.request);
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        error: error.message
      },
      { status: 400 }
    );
  }

  const stageId = getStageId(payload);

  let contract;

  try {
    contract = assertKnownDiligenceStage(stageId);
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        error: error.message,
        runtime: getDiligenceRuntimeBoundary()
      },
      { status: 400 }
    );
  }

  return jsonResponse(
    {
      ok: false,
      implemented: false,
      status: "not_implemented",
      message: "Diligence stage execution is not implemented yet. This endpoint is a contract skeleton only.",
      stage: contract,
      runtime: getDiligenceRuntimeBoundary(),
      accepted_request_shape: {
        stage_id: contract.stage_id,
        run_id: payload?.run_id || "required_in_runtime_phase",
        input: "stage-specific payload, deferred until runtime implementation"
      },
      forbidden_now: [
        "Gemini calls",
        "Groq calls",
        "runtime orchestration",
        "Firestore writes",
        "vault_prefill_suggestions",
        "assembly_handoff",
        "handoff_envelope"
      ]
    },
    { status: 501 }
  );
}
