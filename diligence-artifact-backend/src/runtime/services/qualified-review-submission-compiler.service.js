import { compileQualifiedReviewSubmission } from "../../phases/14-qualified-review-submission/qualified-review-submission.compiler.js";
import {
  QUALIFIED_REVIEW_SUBMISSION_RUNTIME_READS,
  QUALIFIED_REVIEW_SUBMISSION_RUNTIME_WRITES
} from "../contracts/phase14-submission-runtime.contract.js";
import { updateRunRecord, logEvent } from "./storage/firestore.service.js";
import { updateRunDashboardRow } from "./storage/sheets.service.js";
import {
  persistImmutablePostReviewArtifact,
  readPostReviewArtifact
} from "./immutable-post-review-artifacts.service.js";

export async function compileQualifiedReviewSubmissionRuntime({ run } = {}) {
  const artifacts = {};
  for (const artifactName of QUALIFIED_REVIEW_SUBMISSION_RUNTIME_READS) {
    artifacts[artifactName] = await readPostReviewArtifact(run.run_id, artifactName);
  }
  const compiled = compileQualifiedReviewSubmission({
    run,
    submission_request: artifacts.qualified_review_submission_request,
    qualified_review_handoff: artifacts.qualified_review_handoff,
    qr_active_field_ledger: artifacts.qr_active_field_ledger,
    qr_registry_resolution_manifest: artifacts.qr_registry_resolution_manifest
  });
  const output = {
    qualified_review_submission: compiled.qualified_review_submission,
    qr_final_value_ledger: compiled.qr_final_value_ledger,
    document_activation_manifest: compiled.document_activation_manifest
  };
  for (const artifactName of QUALIFIED_REVIEW_SUBMISSION_RUNTIME_WRITES) {
    await persistImmutablePostReviewArtifact({
      run,
      artifact_name: artifactName,
      artifact: output[artifactName],
      phase: "QUALIFIED_REVIEW_SUBMISSION",
      agent_id: "qualified_review_system",
      lock_status: output[artifactName].status || "LOCKED",
      event_type: "QUALIFIED_REVIEW_SUBMISSION_ARTIFACT_SAVED"
    });
  }
  const updated = await updateRunRecord(run.run_id, {
    current_phase: "DILIGENCE_QA_COMPLETE",
    status: "LOCKED",
    central_phase: "DILIGENCE_QA_COMPLETE",
    central_phase_label: "Diligence-QA Complete",
    active_internal_job: "DILIGENCE_QA_COMPLETE",
    runner_state: "IDLE",
    runner_active_phase: "DILIGENCE_QA_COMPLETE",
    qualified_review_submission_compiled_at: compiled.qualified_review_submission.compiled_at,
    qualified_review_submission_hash: compiled.qualified_review_submission.immutable_hash
  });
  await updateRunDashboardRow(updated);
  await logEvent({
    run_id: run.run_id,
    event_type: "QUALIFIED_REVIEW_SUBMISSION_COMPILED",
    actor: "qualified_review_system",
    payload: {
      final_field_count: compiled.qr_final_value_ledger.counts.final_field_count,
      active_document_count: compiled.document_activation_manifest.counts.active_document_count,
      next_phase: "DILIGENCE_QA_COMPLETE"
    }
  });
  return { run: updated, output, validation: compiled.validation };
}
