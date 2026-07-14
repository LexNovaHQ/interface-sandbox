import {
  cloudTasksDispatcherConfigured,
  requestPipelineAdvance as requestLegacyPipelineAdvance,
  runPipelineWorkerOnce as runLegacyPipelineWorkerOnce,
  enqueueReviewerWorkerTask
} from "./async.service.js";
import { getRunRecord, updateRunRecord, logEvent } from "./storage/firestore.service.js";
import { updateRunDashboardRow } from "./storage/sheets.service.js";
import { rebuildQualifiedReviewWorkspace } from "./qualified-review-workspace.service.js";

export { cloudTasksDispatcherConfigured, enqueueReviewerWorkerTask };

const QR_JOB = "QUALIFIED_REVIEW";
const QR_PAUSE = "AWAITING_QUALIFIED_REVIEW";

export async function requestPipelineAdvance(input = {}) {
  const run = await getRunRecord(input.run_id);
  if (isPaused(run)) return asyncResponse(run, { paused: true });
  return requestLegacyPipelineAdvance(input);
}

export async function runPipelineWorkerOnce({ run_id, actor = "cloud_tasks_worker", auto_continue = true } = {}) {
  const run = await getRunRecord(run_id);
  if (isPaused(run)) {
    const idle = await markPausedIdle(run_id);
    return workerResponse(idle, { paused: true });
  }
  if (run.current_phase !== QR_JOB) return runLegacyPipelineWorkerOnce({ run_id, actor, auto_continue });

  const claimed = await updateRunRecord(run_id, {
    status: "RUNNING",
    runner_mode: "CLOUD_TASKS_RUNNER",
    runner_state: "RUNNING",
    runner_active_phase: QR_JOB,
    runner_worker_started_at: new Date().toISOString(),
    runner_worker_heartbeat_at: new Date().toISOString(),
    runner_last_error: ""
  });
  await updateRunDashboardRow(claimed);
  await logEvent({ run_id, event_type: "ASYNC_WORKER_STARTED", actor, payload: { phase: QR_JOB, central_phase: "QUALIFIED_REVIEW", phase13_intercepted: true } });

  try {
    const rebuilt = await rebuildQualifiedReviewWorkspace({ run: claimed });
    await logEvent({ run_id, event_type: "ASYNC_WORKER_STEP_COMPLETED", actor, payload: { completed_phase: QR_JOB, current_phase: QR_PAUSE, central_phase: "QUALIFIED_REVIEW", status: QR_PAUSE, dispatched_next: false, phase13_pause: true } });
    return workerResponse(rebuilt.run, { completed_step: true, paused: true });
  } catch (error) {
    const failed = await updateRunRecord(run_id, { status: "CONTROLLED_FAILURE", runner_state: "FAILED", runner_last_error: error?.message || String(error), runner_failed_at: new Date().toISOString() });
    await updateRunDashboardRow(failed);
    await logEvent({ run_id, event_type: "ASYNC_WORKER_FAILED", actor, payload: { phase: QR_JOB, central_phase: "QUALIFIED_REVIEW", error_message: error?.message || String(error) } });
    throw error;
  }
}

function isPaused(run = {}) { return run.current_phase === QR_PAUSE || run.status === QR_PAUSE; }
async function markPausedIdle(runId) {
  const updated = await updateRunRecord(runId, { current_phase: QR_PAUSE, status: QR_PAUSE, central_phase: "QUALIFIED_REVIEW", central_phase_label: "Qualified Review", active_internal_job: QR_JOB, runner_state: "IDLE", runner_auto_continue: false, runner_active_phase: QR_PAUSE });
  await updateRunDashboardRow(updated);
  return updated;
}
function asyncResponse(run, options = {}) { return { ok: true, queued: false, already_running: false, terminal: false, paused: options.paused === true, run_id: run.run_id, status: run.status, current_phase: run.current_phase, central_phase: run.central_phase || "QUALIFIED_REVIEW", central_phase_label: run.central_phase_label || "Qualified Review", runner_mode: run.runner_mode || "", runner_state: run.runner_state || "IDLE", runner_last_error: run.runner_last_error || "", artifact_count: run.artifact_count || 0 }; }
function workerResponse(run, options = {}) { return { ok: true, run_id: run.run_id, status: run.status, current_phase: run.current_phase, central_phase: run.central_phase || "QUALIFIED_REVIEW", central_phase_label: run.central_phase_label || "Qualified Review", completed_step: options.completed_step === true, dispatched_next: false, terminal: false, paused: options.paused === true, already_running: false, runner_mode: run.runner_mode || "CLOUD_TASKS_RUNNER", runner_state: run.runner_state || "IDLE", runner_last_error: run.runner_last_error || "", artifact_count: run.artifact_count || 0 }; }
