import {
  finalizeDocumentAssembly,
  prepareDocumentAssembly
} from "../../phases/16-assembly-engine/assembly-engine.runner.js";
import {
  ASSEMBLY_ENGINE_RUNTIME_READS,
  ASSEMBLY_ENGINE_RUNTIME_WRITES
} from "../contracts/phase16-assembly-runtime.contract.js";
import { updateRunRecord, logEvent } from "./storage/firestore.service.js";
import { updateRunDashboardRow } from "./storage/sheets.service.js";
import {
  ensureDriveFolder,
  saveBinaryFileToDriveIdempotent
} from "./storage/drive.service.js";
import {
  persistImmutablePostReviewArtifact,
  readPostReviewArtifact
} from "./immutable-post-review-artifacts.service.js";

export async function runAssemblyEngineRuntime({ run } = {}) {
  if (run.assembly_authorized !== true) throw new Error("ASSEMBLY_ENGINE_NOT_AUTHORIZED");
  const artifacts = {};
  for (const artifactName of ASSEMBLY_ENGINE_RUNTIME_READS) {
    artifacts[artifactName] = await readPostReviewArtifact(run.run_id, artifactName);
  }

  const prepared = prepareDocumentAssembly({
    run,
    diligence_qa_completion_receipt: artifacts.diligence_qa_completion_receipt,
    qualified_review_submission: artifacts.qualified_review_submission,
    qr_final_value_ledger: artifacts.qr_final_value_ledger,
    document_activation_manifest: artifacts.document_activation_manifest
  });

  await persistImmutablePostReviewArtifact({
    run,
    artifact_name: "document_assembly_payload",
    artifact: prepared.document_assembly_payload,
    phase: "ASSEMBLY_ENGINE",
    agent_id: "assembly_engine",
    lock_status: prepared.document_assembly_payload.status,
    event_type: "DOCUMENT_ASSEMBLY_PAYLOAD_SAVED"
  });

  const assemblyFolder = await ensureDriveFolder({
    parent_folder_id: run.drive_folder_id,
    name: "document-assembly"
  });
  const draftsFolder = await ensureDriveFolder({
    parent_folder_id: assemblyFolder.drive_folder_id,
    name: "review-ready-drafts"
  });

  const uploadedFiles = [];
  for (const draft of prepared.prepared_drafts) {
    const uploaded = await saveBinaryFileToDriveIdempotent({
      drive_folder_id: draftsFolder.drive_folder_id,
      filename: draft.output_filename,
      mime_type: draft.mime_type,
      buffer: draft.buffer
    });
    uploadedFiles.push({
      document_id: draft.document_id,
      output_filename: draft.output_filename,
      file_sha256: draft.file_sha256,
      file_size_bytes: draft.file_size_bytes,
      drive_file_id: uploaded.drive_file_id,
      drive_web_view_link: uploaded.drive_web_view_link,
      reused: uploaded.reused === true
    });
  }

  const finalized = finalizeDocumentAssembly({
    run,
    prepared,
    uploaded_files: uploadedFiles,
    assembly_folder: assemblyFolder,
    drafts_folder: draftsFolder
  });

  for (const artifactName of ASSEMBLY_ENGINE_RUNTIME_WRITES.filter((name) => name !== "document_assembly_payload")) {
    await persistImmutablePostReviewArtifact({
      run,
      artifact_name: artifactName,
      artifact: finalized[artifactName],
      phase: "ASSEMBLY_ENGINE",
      agent_id: "assembly_engine",
      lock_status: finalized[artifactName].status,
      event_type: "ASSEMBLY_ENGINE_ARTIFACT_SAVED"
    });
  }

  const completionStatus = finalized.review_ready_draft_manifest.status;
  const updated = await updateRunRecord(run.run_id, {
    current_phase: "COMPLETE",
    status: completionStatus,
    central_phase: "ASSEMBLY_ENGINE",
    central_phase_label: "Assembly Engine",
    active_internal_job: "ASSEMBLY_ENGINE",
    runner_state: "IDLE",
    runner_auto_continue: false,
    runner_active_phase: "COMPLETE",
    assembly_authorized: true,
    assembly_complete: true,
    assembly_completed_at: new Date().toISOString(),
    assembly_payload_hash: finalized.document_assembly_payload.immutable_hash,
    review_ready_draft_manifest_hash: finalized.review_ready_draft_manifest.immutable_hash,
    document_assembly_validation_hash: finalized.document_assembly_validation_manifest.immutable_hash,
    generated_document_count: finalized.review_ready_draft_manifest.counts.generated_document_count,
    review_ready_drafts_folder_id: draftsFolder.drive_folder_id,
    review_ready_drafts_folder_link: draftsFolder.drive_web_view_link
  });
  await updateRunDashboardRow(updated);
  await logEvent({
    run_id: run.run_id,
    event_type: "ASSEMBLY_ENGINE_COMPLETE",
    actor: "assembly_engine",
    payload: {
      status: completionStatus,
      generated_document_count: finalized.review_ready_draft_manifest.counts.generated_document_count,
      local_counsel_action_count: finalized.review_ready_draft_manifest.counts.local_counsel_action_count,
      current_phase: "COMPLETE",
      generated_documents_git_forbidden: true
    }
  });
  return { run: updated, artifacts: finalized, uploaded_files: uploadedFiles };
}
