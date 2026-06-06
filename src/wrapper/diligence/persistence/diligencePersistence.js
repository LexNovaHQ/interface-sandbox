import { doc, setDoc } from "firebase/firestore";
import { getFirestoreBridgeStatus, getFirestoreDb } from "../../bridge/firebaseBridge.js";

const STAGE_OUTPUTS_COLLECTION = "stage_outputs";

function nowIso() {
  return new Date().toISOString();
}

function getRunId({ pipelineResult, node5bResult }) {
  const runId = pipelineResult?.run_id || node5bResult?.run_id;

  if (!runId) {
    throw new Error("Persistence requires pipelineResult.run_id or node5bResult.run_id.");
  }

  return runId;
}

function getHandoffId(node5bResult) {
  return node5bResult?.handoff_envelope?.handoff_id || null;
}

function requireOkResult(name, result) {
  if (!result?.ok) {
    throw new Error(`${name} must be a successful result before persistence.`);
  }
}

function compactPipelineSummary(pipelineResult) {
  return {
    ok: pipelineResult.ok,
    status: pipelineResult.status,
    run_id: pipelineResult.run_id,
    completed_at: nowIso(),
    stage_log: pipelineResult.stage_log || [],
    source_mode: pipelineResult.pipeline_artifacts?.source_collection?.source_mode || null,
    pages_attempted: pipelineResult.pipeline_artifacts?.source_collection?.scrape_meta?.pages_attempted ?? null,
    pages_read: pipelineResult.pipeline_artifacts?.source_collection?.scrape_meta?.pages_read ?? null,
    compiler_status: pipelineResult.compiler_output?.diligence_run?.compiler_status || null,
    findings_count: Array.isArray(pipelineResult.compiler_output?.findings) ? pipelineResult.compiler_output.findings.length : null,
    controlled_count: Array.isArray(pipelineResult.compiler_output?.controlled_rows) ? pipelineResult.compiler_output.controlled_rows.length : null,
    insufficient_evidence_count: Array.isArray(pipelineResult.compiler_output?.insufficient_evidence_rows) ? pipelineResult.compiler_output.insufficient_evidence_rows.length : null
  };
}

function compactNode5BSummary(node5bResult) {
  if (!node5bResult) return null;

  return {
    ok: node5bResult.ok,
    node: node5bResult.node,
    run_id: node5bResult.run_id,
    handoff_id: node5bResult.handoff_envelope?.handoff_id || null,
    payload_ref: node5bResult.handoff_envelope?.payload_ref || node5bResult.persistence_plan?.payload_ref || null,
    warning_count: Array.isArray(node5bResult.warnings) ? node5bResult.warnings.length : 0,
    generated_at: nowIso()
  };
}

export function buildDiligencePersistencePlan({ pipelineResult, node5bResult } = {}) {
  requireOkResult("pipelineResult", pipelineResult);

  if (node5bResult) {
    requireOkResult("node5bResult", node5bResult);
  }

  const runId = getRunId({ pipelineResult, node5bResult });
  const handoffId = getHandoffId(node5bResult);
  const writePlan = [
    {
      id: "run_summary",
      path: ["interface_runs", runId],
      payload: compactPipelineSummary(pipelineResult)
    },
    {
      id: "compiler_output",
      path: ["interface_runs", runId, STAGE_OUTPUTS_COLLECTION, "node_5_final_compiler"],
      payload: {
        run_id: runId,
        stage_id: "node_5_final_compiler",
        created_at: nowIso(),
        compiler_output: pipelineResult.compiler_output
      }
    },
    {
      id: "stage_log",
      path: ["interface_runs", runId, STAGE_OUTPUTS_COLLECTION, "stage_log"],
      payload: {
        run_id: runId,
        stage_id: "stage_log",
        created_at: nowIso(),
        stage_log: pipelineResult.stage_log || []
      }
    }
  ];

  if (node5bResult) {
    writePlan.push({
      id: "node_5b_output",
      path: ["interface_runs", runId, STAGE_OUTPUTS_COLLECTION, "node_5b_backend_assembler"],
      payload: {
        run_id: runId,
        stage_id: "node_5b_backend_assembler",
        created_at: nowIso(),
        node5b_summary: compactNode5BSummary(node5bResult),
        vault_prefill_suggestions: node5bResult.vault_prefill_suggestions,
        persistence_plan: node5bResult.persistence_plan,
        warnings: node5bResult.warnings || []
      }
    });
  }

  if (node5bResult && handoffId) {
    writePlan.push(
      {
        id: "handoff_payload",
        path: ["interface_handoff_payloads", handoffId],
        payload: {
          run_id: runId,
          handoff_id: handoffId,
          created_at: nowIso(),
          assembly_handoff: node5bResult.assembly_handoff
        }
      },
      {
        id: "handoff_envelope",
        path: ["interface_handoffs", handoffId],
        payload: {
          ...node5bResult.handoff_envelope,
          payload_ref: `interface_handoff_payloads/${handoffId}`,
          updated_at: nowIso()
        }
      }
    );
  }

  return {
    run_id: runId,
    handoff_id: handoffId,
    write_count: writePlan.length,
    write_plan: writePlan
  };
}

export async function persistDiligenceRun({ pipelineResult, node5bResult, db = getFirestoreDb() } = {}) {
  const bridgeStatus = getFirestoreBridgeStatus();

  if (!db) {
    return {
      ok: false,
      error_type: "FIRESTORE_NOT_READY",
      error: "Firestore is not initialized; persistence was not attempted.",
      bridge_status: bridgeStatus
    };
  }

  const plan = buildDiligencePersistencePlan({ pipelineResult, node5bResult });
  const written = [];

  for (const item of plan.write_plan) {
    await setDoc(doc(db, ...item.path), item.payload, { merge: true });
    written.push({ id: item.id, path: item.path.join("/") });
  }

  return {
    ok: true,
    run_id: plan.run_id,
    handoff_id: plan.handoff_id,
    written_count: written.length,
    written,
    bridge_status: bridgeStatus
  };
}
