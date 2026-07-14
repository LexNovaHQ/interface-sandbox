import {
  cloudTasksDispatcherConfigured,
  requestPipelineAdvance as requestLegacyPipelineAdvance,
  runPipelineWorkerOnce as runLegacyPipelineWorkerOnce,
  enqueueReviewerWorkerTask
} from "./async.service.js";
import { getRunRecord, updateRunRecord, logEvent } from "./storage/firestore.service.js";
import { updateRunDashboardRow } from "./storage/sheets.service.js";
import { rebuildQualifiedReviewWorkspace } from "./qualified-review-workspace.service.js";
import { compileQualifiedReviewSubmissionRuntime } from "./qualified-review-submission-compiler.service.js";
import { runDiligenceQaCompleteRuntime } from "./diligence-qa-complete.service.js";

export { cloudTasksDispatcherConfigured, enqueueReviewerWorkerTask };

const QR_JOB = "QUALIFIED_REVIEW";
const QR_PAUSE = "AWAITING_QUALIFIED_REVIEW";
const SUBMISSION_JOB = "QUALIFIED_REVIEW_SUBMISSION";
const QA_JOB = "DILIGENCE_QA_COMPLETE";
const ASSEMBLY_PAUSE = "AWAITING_ASSEMBLY";
const INTERCEPTED_JOBS = new Set([QR_JOB, SUBMISSION_JOB, QA_JOB]);

export async function requestPipelineAdvance(input = {}) {
  const run = await getRunRecord(input.run_id);
  if (isPaused(run)) return asyncResponse(run, { paused: true });
  return requestLegacyPipelineAdvance(input);
}

export async function runPipelineWorkerOnce({ run_id, actor = "cloud_tasks_worker", auto_continue = true } = {}) {
  const run = await getRunRecord(run_id);
  if (isPaused(run)) {
    const idle = await markPausedIdle(run);
    return workerResponse(idle, { paused: true });
  }
  if (!INTERCEPTED_JOBS.has(run.current_phase)) {
    return runLegacyPipelineWorkerOnce({ run_id, actor, auto_continue });
  }

  const job = run.current_phase;
  const claimed = await claimPostReviewJob({ run, job });
  await logEvent({
    run_id,
    event_type: "ASYNC_WORKER_STARTED",
    actor,
    payload: {
      phase: job,
      central_phase: centralPhaseForJob(job),
      post_review_intercepted: true
    }
  });

  try {
    if (job === QR_JOB) {
      const rebuilt = await rebuildQualifiedReviewWorkspace({ run: claimed });
      await completedEvent({ run_id, actor, completedPhase: job, run: rebuilt.run, dispatchedNext: false, paused: true });
      return workerResponse(rebuilt.run, { completed_step: true, paused: true });
    }

    if (job === SUBMISSION_JOB) {
      const compiled = await compileQualifiedReviewSubmissionRuntime({ run: claimed });
      const dispatch = auto_continue ? await dispatchNextJob({ run: compiled.run, actor }) : { dispatched: false, run: compiled.run };
      await completedEvent({ run_id, actor, completedPhase: job, run: dispatch.run, dispatchedNext: dispatch.dispatched, paused: false });
      return workerResponse(dispatch.run, { completed_step: true, dispatched_next: dispatch.dispatched });
    }

    const completed = await runDiligenceQaCompleteRuntime({ run: claimed });
    await completedEvent({ run_id, actor, completedPhase: job, run: completed.run, dispatchedNext: false, paused: true });
    return workerResponse(completed.run, { completed_step: true, paused: true });
  } catch (error) {
    const failed = await updateRunRecord(run_id, {
      status: "CONTROLLED_FAILURE",
      runner_state: "FAILED",
      runner_last_error: error?.message || String(error),
      runner_failed_at: new Date().toISOString()
    });
    await updateRunDashboardRow(failed);
    await logEvent({
      run_id,
      event_type: "ASYNC_WORKER_FAILED",
      actor,
      payload: {
        phase: job,
        central_phase: centralPhaseForJob(job),
        error_message: error?.message || String(error)
      }
    });
    throw error;
  }
}

async function claimPostReviewJob({ run, job }) {
  const claimed = await updateRunRecord(run.run_id, {
    status: "RUNNING",
    runner_mode: "CLOUD_TASKS_RUNNER",
    runner_state: "RUNNING",
    runner_active_phase: job,
    runner_worker_started_at: new Date().toISOString(),
    runner_worker_heartbeat_at: new Date().toISOString(),
    runner_last_error: ""
  });
  await updateRunDashboardRow(claimed);
  return claimed;
}

async function dispatchNextJob({ run, actor }) {
  try {
    const dispatch = await enqueueReviewerWorkerTask({ run_id: run.run_id, auto_continue: true });
    const queued = await updateRunRecord(run.run_id, {
      runner_state: "QUEUED",
      runner_auto_continue: true,
      runner_task_name: dispatch.task_name || "",
      runner_dispatched_at: new Date().toISOString(),
      runner_last_error: ""
    });
    await updateRunDashboardRow(queued);
    await logEvent({
      run_id: run.run_id,
      event_type: "ASYNC_WORKER_NEXT_DISPATCHED",
      actor,
      payload: {
        current_phase: queued.current_phase,
        central_phase: queued.central_phase,
        task_name: dispatch.task_name || ""
      }
    });
    return { dispatched: true, run: queued };
  } catch (error) {
    const idle = await updateRunRecord(run.run_id, {
      runner_state: "IDLE",
      runner_auto_continue: false,
      runner_last_error: `NEXT_PHASE_DISPATCH_PENDING:${error?.message || String(error)}`
    });
    await updateRunDashboardRow(idle);
    await logEvent({
      run_id: run.run_id,
      event_type: "ASYNC_WORKER_NEXT_DISPATCH_DEFERRED",
      actor,
      payload: {
        current_phase: idle.current_phase,
        error_message: error?.message || String(error)
      }
    });
    return { dispatched: false, run: idle };
  }
}

async function completedEvent({ run_id, actor, completedPhase, run, dispatchedNext, paused }) {
  await logEvent({
    run_id,
    event_type: "ASYNC_WORKER_STEP_COMPLETED",
    actor,
    payload: {
      completed_phase: completedPhase,
      current_phase: run.current_phase,
      central_phase: run.central_phase,
      status: run.status,
      dispatched_next: dispatchedNext,
      post_review_pause: paused
    }
  });
}

function isPaused(run = {}) {
  return [QR_PAUSE, ASSEMBLY_PAUSE].includes(run.current_phase) || [QR_PAUSE, ASSEMBLY_PAUSE].includes(run.status);
}

async function markPausedIdle(run) {
  const qrPaused = run.current_phase === QR_PAUSE || run.status === QR_PAUSE;
  const phase = qrPaused ? QR_PAUSE : ASSEMBLY_PAUSE;
  const updated = await updateRunRecord(run.run_id, {
    current_phase: phase,
    status: qrPaused ? QR_PAUSE : run.status || "COMPLETE",
    central_phase: qrPaused ? "QUALIFIED_REVIEW" : "DILIGENCE_QA_COMPLETE",
    central_phase_label: qrPaused ? "Qualified Review" : "Diligence-QA Complete",
    active_internal_job: qrPaused ? QR_JOB : QA_JOB,
    runner_state: "IDLE",
    runner_auto_continue: false,
    runner_active_phase: phase
  });
  await updateRunDashboardRow(updated);
  return updated;
}

function centralPhaseForJob(job) {
  if (job === QR_JOB) return "QUALIFIED_REVIEW";
  if (job === SUBMISSION_JOB) return "QUALIFIED_REVIEW_SUBMISSION";
  return "DILIGENCE_QA_COMPLETE";
}

function asyncResponse(run, options = {}) {
  return {
    ok: true,
    queued: false,
    already_running: false,
    terminal: false,
    paused: options.paused === true,
    run_id: run.run_id,
    status: run.status,
    current_phase: run.current_phase,
    central_phase: run.central_phase || "",
    central_phase_label: run.central_phase_label || "",
    runner_mode: run.runner_mode || "",
    runner_state: run.runner_state || "IDLE",
    runner_last_error: run.runner_last_error || "",
    artifact_count: run.artifact_count || 0
  };
}

function workerResponse(run, options = {}) {
  return {
    ok: true,
    run_id: run.run_id,
    status: run.status,
    current_phase: run.current_phase,
    central_phase: run.central_phase || "",
    central_phase_label: run.central_phase_label || "",
    completed_step: options.completed_step === true,
    dispatched_next: options.dispatched_next === true,
    terminal: false,
    paused: options.paused === true,
    already_running: false,
    runner_mode: run.runner_mode || "CLOUD_TASKS_RUNNER",
    runner_state: run.runner_state || "IDLE",
    runner_last_error: run.runner_last_error || "",
    artifact_count: run.artifact_count || 0
  };
}
