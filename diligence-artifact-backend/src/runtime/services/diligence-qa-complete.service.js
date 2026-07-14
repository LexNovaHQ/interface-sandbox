import {
  DILIGENCE_QA_PAUSE_PHASE,
  runDiligenceQaComplete
} from "../../phases/15-diligence-qa-complete/diligence-qa-complete.runner.js";
import {
  DILIGENCE_QA_COMPLETE_RUNTIME_READS
} from "../contracts/phase15-diligence-qa-runtime.contract.js";
import { updateRunRecord, logEvent } from "./storage/firestore.service.js";
import { updateRunDashboardRow } from "./storage/sheets.service.js";
import {
  persistImmutablePostReviewArtifact,
  readPostReviewArtifact
} from "./immutable-post-review-artifacts.service.js";

export async function runDiligenceQaCompleteRuntime({ run } = {}) {
  const artifacts = {};
  for (const artifactName of DILIGENCE_QA_COMPLETE_RUNTIME_READS) {
    artifacts[artifactName] = await readPostReviewArtifact(run.run_id, artifactName);
  }
  const receipt = runDiligenceQaComplete({
    run,
    qualified_review_submission: artifacts.qualified_review_submission,
    qr_final_value_ledger: artifacts.qr_final_value_ledger,
    document_activation_manifest: artifacts.document_activation_manifest
  });
  await persistImmutablePostReviewArtifact({
    run,
    artifact_name: "diligence_qa_completion_receipt",
    artifact: receipt,
    phase: "DILIGENCE_QA_COMPLETE",
    agent_id: "diligence_qa_gate",
    lock_status: receipt.status === "COMPLETE" ? "COMPLETE" : "LOCKED_WITH_LIMITATIONS",
    event_type: "DILIGENCE_QA_COMPLETION_RECEIPT_SAVED"
  });
  const updated = await updateRunRecord(run.run_id, {
    current_phase: DILIGENCE_QA_PAUSE_PHASE,
    status: receipt.status,
    central_phase: "DILIGENCE_QA_COMPLETE",
    central_phase_label: "Diligence-QA Complete",
    active_internal_job: "DILIGENCE_QA_COMPLETE",
    runner_state: "IDLE",
    runner_auto_continue: false,
    runner_active_phase: DILIGENCE_QA_PAUSE_PHASE,
    diligence_qa_complete: true,
    diligence_qa_completed_at: receipt.completed_at,
    diligence_qa_completion_hash: receipt.immutable_hash,
    assembly_authorized: false
  });
  await updateRunDashboardRow(updated);
  await logEvent({
    run_id: run.run_id,
    event_type: "DILIGENCE_QA_COMPLETE",
    actor: "diligence_qa_gate",
    payload: {
      status: receipt.status,
      active_document_count: receipt.counts.active_document_count,
      warning_count: receipt.counts.warning_count,
      current_phase: DILIGENCE_QA_PAUSE_PHASE,
      assembly_authorized: false
    }
  });
  return { run: updated, receipt };
}
