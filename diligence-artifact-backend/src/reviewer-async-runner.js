import { config } from "./config.js";
import { getRunRecord, updateRunRecord, logEvent } from "./firestore.js";
import { updateRunDashboardRow } from "./sheets.js";
import { nowIso } from "./run-id.js";
import { advanceReviewerRun } from "./reviewer-runner-normalized.js";
import { enqueueReviewerWorkerTask } from "./cloud-tasks-dispatcher.js";

const TERMINAL_PHASES = new Set(["COMPLETE"]);
const TERMINAL_STATUSES = new Set(["COMPLETE", "REPAIR_REQUIRED", "CONTROLLED_FAILURE"]);
const EARLY_PHASES = new Set(["AGENT_1A_URL_MANIFEST", "AGENT_1B_EXTRACT", "M6_BUCKET_INDEX"]);

export async function requestReviewerRunAdvance({ run_id, requested_by = "operator", base_url = "", auto_continue = true }) {
  const run = await getRunRecord(run_id);

  if (isTerminal(run)) {
    return asyncResponse({ run, queued: false, already_running: false, terminal: true });
  }

  if (run.runner_state === "RUNNING" && !isStaleRunner(run)) {
    return asyncResponse({ run, queued: false, already_running: true, terminal: false });
  }

  if (run.runner_state === "QUEUED" && !isStaleQueued(run)) {
    return asyncResponse({ run, queued: true, already_running: true, terminal: false });
  }

  const staleRunningRequeue = run.runner_state === "RUNNING" && isStaleRunner(run);
  const staleQueuedRequeue = run.runner_state === "QUEUED" && isStaleQueued(run);
  const requestedAt = nowIso();
  const queued = await updateRunRecord(run_id, {
    status: run.status === "CREATED" ? "RUNNING" : run.status,
    runner_mode: "CLOUD_TASKS_RUNNER",
    runner_state: "QUEUED",
    runner_auto_continue: Boolean(auto_continue),
    runner_requested_by: requested_by,
    runner_requested_at: requestedAt,
    runner_dispatch_base_url: base_url || run.runner_dispatch_base_url || "",
    runner_last_error: "",
    runner_stale_requeue_count: staleRunningRequeue || staleQueuedRequeue ? Number(run.runner_stale_requeue_count || 0) + 1 : Number(run.runner_stale_requeue_count || 0),
    runner_queued_stale_count: staleQueuedRequeue ? Number(run.runner_queued_stale_count || 0) + 1 : Number(run.runner_queued_stale_count || 0)
  });
  await updateRunDashboardRow(queued);
  await logEvent({ run_id, event_type: staleRunningRequeue || staleQueuedRequeue ? "ASYNC_RUNNER_STALE_REQUEUED" : "ASYNC_RUNNER_QUEUED", actor: requested_by, payload: { current_phase: queued.current_phase, previous_runner_state: run.runner_state || "IDLE", auto_continue: Boolean(auto_continue), stale_runner: staleRunningRequeue, stale_queued: staleQueuedRequeue, previous_task_name: run.runner_task_name || "" } });

  try {
    const dispatch = await dispatchWorkerDurably({ run_id, base_url: queued.runner_dispatch_base_url, auto_continue: Boolean(auto_continue) });
    const dispatched = await updateRunRecord(run_id, {
      runner_mode: dispatch.dispatcher,
      runner_task_name: dispatch.task_name || "",
      runner_worker_url: dispatch.worker_url || "",
      runner_dispatched_at: nowIso(),
      runner_last_error: ""
    });
    await updateRunDashboardRow(dispatched);
    await logEvent({ run_id, event_type: "ASYNC_WORKER_DISPATCHED", actor: requested_by, payload: { dispatcher: dispatch.dispatcher, task_name: dispatch.task_name || "", worker_url_present: Boolean(dispatch.worker_url), stale_requeue: staleRunningRequeue || staleQueuedRequeue } });
    return asyncResponse({ run: dispatched, queued: true, already_running: false, terminal: false });
  } catch (error) {
    await markDispatchFailure({ run_id, error });
    throw error;
  }
}

export async function runReviewerWorkerOnce({ run_id, actor = "cloud_tasks_worker", auto_continue = true }) {
  const run = await getRunRecord(run_id);

  if (isTerminal(run)) {
    await clearRunnerState({ run_id, terminal: true });
    return workerResponse({ run, completed_step: false, dispatched_next: false, terminal: true });
  }

  if (run.runner_state === "RUNNING" && !isStaleRunner(run)) {
    return workerResponse({ run, completed_step: false, dispatched_next: false, already_running: true });
  }

  const startedAt = nowIso();
  const claimed = await updateRunRecord(run_id, {
    status: "RUNNING",
    runner_mode: "CLOUD_TASKS_RUNNER",
    runner_state: "RUNNING",
    runner_worker_started_at: startedAt,
    runner_worker_heartbeat_at: startedAt,
    runner_worker_attempt: Number(run.runner_worker_attempt || 0) + 1,
    runner_active_phase: run.current_phase,
    runner_last_error: ""
  });
  await updateRunDashboardRow(claimed);
  await logEvent({ run_id, event_type: "ASYNC_WORKER_STARTED", actor, payload: { phase: claimed.current_phase, worker_attempt: claimed.runner_worker_attempt || 1, previous_runner_state: run.runner_state || "" } });

  try {
    await heartbeat({ run_id, phase: claimed.current_phase, actor, marker: "BEFORE_PHASE_ADVANCE" });
    const result = await advanceReviewerRun({ run_id });
    await heartbeat({ run_id, phase: result.current_phase, actor, marker: "AFTER_PHASE_ADVANCE" });
    const after = await getRunRecord(run_id);
    const shouldContinue = Boolean(auto_continue) && !isTerminal(after);

    if (shouldContinue) {
      const queued = await updateRunRecord(run_id, {
        runner_state: "QUEUED",
        runner_auto_continue: true,
        runner_previous_phase_completed: result.completed_phase || claimed.current_phase,
        runner_active_phase: activePhaseFor(after),
        runner_last_completed_at: nowIso(),
        runner_worker_heartbeat_at: nowIso(),
        runner_last_error: ""
      });
      await updateRunDashboardRow(queued);
      await logEvent({ run_id, event_type: "ASYNC_WORKER_STEP_COMPLETED", actor, payload: { completed_phase: result.completed_phase || claimed.current_phase, current_phase: queued.current_phase, status: queued.status, dispatched_next: true } });
      const dispatch = await dispatchWorkerDurably({ run_id, base_url: queued.runner_dispatch_base_url, auto_continue: true });
      const dispatched = await updateRunRecord(run_id, { runner_mode: dispatch.dispatcher, runner_task_name: dispatch.task_name || "", runner_worker_url: dispatch.worker_url || "", runner_dispatched_at: nowIso(), runner_last_error: "" });
      await updateRunDashboardRow(dispatched);
      await logEvent({ run_id, event_type: "ASYNC_WORKER_DISPATCHED", actor, payload: { dispatcher: dispatch.dispatcher, task_name: dispatch.task_name || "", continuation: true, worker_url_present: Boolean(dispatch.worker_url) } });
      return workerResponse({ run: dispatched, completed_step: true, dispatched_next: true, terminal: false });
    }

    const idle = await updateRunRecord(run_id, {
      runner_state: isTerminal(after) ? "COMPLETE" : "IDLE",
      runner_auto_continue: false,
      runner_previous_phase_completed: result.completed_phase || claimed.current_phase,
      runner_active_phase: activePhaseFor(after),
      runner_last_completed_at: nowIso(),
      runner_worker_heartbeat_at: nowIso(),
      runner_last_error: ""
    });
    await updateRunDashboardRow(idle);
    await logEvent({ run_id, event_type: "ASYNC_WORKER_STEP_COMPLETED", actor, payload: { completed_phase: result.completed_phase || claimed.current_phase, current_phase: idle.current_phase, status: idle.status, dispatched_next: false } });
    return workerResponse({ run: idle, completed_step: true, dispatched_next: false, terminal: isTerminal(idle) });
  } catch (error) {
    const failed = await updateRunRecord(run_id, {
      runner_state: "FAILED",
      runner_last_error: error?.message || String(error),
      runner_failed_at: nowIso(),
      runner_worker_heartbeat_at: nowIso()
    });
    await updateRunDashboardRow(failed);
    await logEvent({ run_id, event_type: "ASYNC_WORKER_FAILED", actor, payload: { phase: claimed.current_phase, error_message: error?.message || String(error) } });
    throw error;
  }
}

async function dispatchWorkerDurably({ run_id, base_url, auto_continue }) {
  return enqueueReviewerWorkerTask({ run_id, base_url, auto_continue });
}

async function heartbeat({ run_id, phase, actor, marker }) {
  const heartbeatAt = nowIso();
  await updateRunRecord(run_id, { runner_worker_heartbeat_at: heartbeatAt });
  await logEvent({ run_id, event_type: "ASYNC_WORKER_HEARTBEAT", actor, payload: { phase, marker, heartbeat_at: heartbeatAt } });
}

async function markDispatchFailure({ run_id, error }) {
  const message = error?.message || String(error);
  try {
    const failed = await updateRunRecord(run_id, {
      runner_state: "FAILED",
      runner_last_error: message,
      runner_failed_at: nowIso()
    });
    await updateRunDashboardRow(failed);
    await logEvent({ run_id, event_type: "ASYNC_WORKER_DISPATCH_FAILED", actor: "cloud_tasks_dispatcher", payload: { error_message: message } });
  } catch (_nested) {
    // Nothing else to do here; caller can inspect logs from the original failure.
  }
}

function isTerminal(run) { return TERMINAL_PHASES.has(run.current_phase) || TERMINAL_STATUSES.has(run.status); }
function isStaleRunner(run) {
  const marker = Date.parse(run.runner_worker_heartbeat_at || run.runner_worker_started_at || run.runner_requested_at || "");
  if (!Number.isFinite(marker)) return false;
  return Date.now() - marker > staleWindowMs(run);
}
function isStaleQueued(run) {
  if (run.runner_worker_started_at && Date.parse(run.runner_worker_started_at) > Date.parse(run.runner_dispatched_at || run.runner_requested_at || "")) return false;
  const marker = Date.parse(run.runner_dispatched_at || run.runner_requested_at || "");
  if (!Number.isFinite(marker)) return false;
  return Date.now() - marker > queuedStaleWindowMs(run);
}
function staleWindowMs(run) {
  if (EARLY_PHASES.has(run.current_phase) && Number(run.artifact_count || 0) === 0) return config.earlyPhaseStaleMs;
  return config.workerStaleMs;
}
function queuedStaleWindowMs(run) {
  if (EARLY_PHASES.has(run.current_phase) && Number(run.artifact_count || 0) === 0) return Math.min(config.earlyPhaseStaleMs, 3 * 60 * 1000);
  return Math.min(config.workerStaleMs, 5 * 60 * 1000);
}
async function clearRunnerState({ run_id, terminal }) { const updated = await updateRunRecord(run_id, { runner_state: terminal ? "COMPLETE" : "IDLE", runner_auto_continue: false, runner_active_phase: terminal ? "COMPLETE" : "" }); await updateRunDashboardRow(updated); }
function activePhaseFor(run) { return isTerminal(run) ? "COMPLETE" : run.current_phase || ""; }
function asyncResponse({ run, queued, already_running, terminal }) { return { ok: true, queued, already_running, terminal, run_id: run.run_id, status: run.status, current_phase: run.current_phase, runner_mode: run.runner_mode || "", runner_state: run.runner_state || "", runner_last_error: run.runner_last_error || "", runner_failed_at: run.runner_failed_at || "", runner_worker_started_at: run.runner_worker_started_at || "", runner_worker_heartbeat_at: run.runner_worker_heartbeat_at || "", runner_requested_at: run.runner_requested_at || "", runner_dispatched_at: run.runner_dispatched_at || "", runner_last_completed_at: run.runner_last_completed_at || "", runner_task_name: run.runner_task_name || "", artifact_count: run.artifact_count || 0 }; }
function workerResponse({ run, completed_step, dispatched_next, terminal, already_running = false }) { return { ok: true, run_id: run.run_id, status: run.status, current_phase: run.current_phase, completed_step, dispatched_next, terminal, already_running, runner_mode: run.runner_mode || "", runner_state: run.runner_state || "", runner_last_error: run.runner_last_error || "", runner_failed_at: run.runner_failed_at || "", runner_worker_started_at: run.runner_worker_started_at || "", runner_worker_heartbeat_at: run.runner_worker_heartbeat_at || "", runner_dispatched_at: run.runner_dispatched_at || "", runner_task_name: run.runner_task_name || "", artifact_count: run.artifact_count || 0 }; }
