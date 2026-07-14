import { QUALIFIED_REVIEW_RUNTIME_READS, QUALIFIED_REVIEW_RUNTIME_WRITES } from "../contracts/phase13-runtime.contract.js";
import { saveJsonArtifactToDrive, readJsonArtifactFromDrive } from "./storage/drive.service.js";
import { getArtifactMetadata, getNextArtifactVersion, saveArtifactMetadata, updateRunRecord, logEvent } from "./storage/firestore.service.js";
import { updateRunDashboardRow } from "./storage/sheets.service.js";
import { runQualifiedReviewPhase, QUALIFIED_REVIEW_PAUSE_PHASE } from "../../phases/13-qualified-review/qualified-review.runner.js";

export async function rebuildQualifiedReviewWorkspace({ run, reviewer_values = {} } = {}) {
  const artifacts = {};
  for (const artifact_name of [...new Set(QUALIFIED_REVIEW_RUNTIME_READS)]) artifacts[artifact_name] = await readArtifact(run.run_id, artifact_name);
  const result = runQualifiedReviewPhase({ run, artifacts, reviewer_values });
  for (const artifact_name of QUALIFIED_REVIEW_RUNTIME_WRITES) {
    const artifact = result.output[artifact_name];
    if (!artifact) throw new Error(`QUALIFIED_REVIEW_OUTPUT_MISSING:${artifact_name}`);
    await persistWorkspaceArtifact({ run, artifact_name, artifact, lock_status: result.phase_lock_status });
  }
  const paused = await updateRunRecord(run.run_id, {
    current_phase: QUALIFIED_REVIEW_PAUSE_PHASE,
    status: QUALIFIED_REVIEW_PAUSE_PHASE,
    central_phase: "QUALIFIED_REVIEW",
    central_phase_label: "Qualified Review",
    active_internal_job: "QUALIFIED_REVIEW",
    runner_state: "IDLE",
    runner_auto_continue: false,
    qualified_review_ready: true,
    qualified_review_ready_at: new Date().toISOString()
  });
  await updateRunDashboardRow(paused);
  await logEvent({ run_id: run.run_id, event_type: "QUALIFIED_REVIEW_WORKSPACE_REBUILT", actor: "qualified_review_system", payload: { phase_lock_status: result.phase_lock_status, active_field_count: result.output.qr_active_field_ledger?.counts?.active_field_count || 0, active_section_count: result.output.qr_active_field_ledger?.counts?.active_section_count || 0, next_phase: QUALIFIED_REVIEW_PAUSE_PHASE } });
  return { run: paused, result };
}

async function readArtifact(runId, artifactName) {
  const meta = await getArtifactMetadata(runId, artifactName);
  return readJsonArtifactFromDrive(meta.drive_file_id);
}

async function persistWorkspaceArtifact({ run, artifact_name, artifact, lock_status }) {
  const version = await getNextArtifactVersion(run.run_id, artifact_name).catch(() => 1);
  const drive = await saveJsonArtifactToDrive({ run_id: run.run_id, artifact_name, version, drive_folder_id: run.drive_folder_id, artifact });
  await saveArtifactMetadata({ run_id: run.run_id, artifact_name, phase: "QUALIFIED_REVIEW", agent_id: "qualified_review_system", lock_status, version, drive_file_id: drive.drive_file_id, drive_web_view_link: drive.drive_web_view_link, drive_folder_id: run.drive_folder_id, artifact_size_bytes: drive.artifact_size_bytes || 0 });
  await logEvent({ run_id: run.run_id, event_type: "ARTIFACT_SAVED", actor: "qualified_review_system", payload: { artifact_name, phase: "QUALIFIED_REVIEW", version, lock_status, save_order_gate: "PHASE13_ISOLATED_AUTHORITY_PASS" } });
}
