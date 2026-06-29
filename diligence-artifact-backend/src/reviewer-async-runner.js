import { config } from "./config.js";
import { getRunRecord, updateRunRecord, logEvent } from "./firestore.js";
import { updateRunDashboardRow } from "./sheets.js";
import { nowIso } from "./run-id.js";
import { advanceReviewerRun } from "./reviewer-runner.js";

const TERMINAL_PHASES = new Set(["COMPLETE"]);
const TERMINAL_STATUSES = new Set(["COMPLETE", "REPAIR_REQUIRED", "CONTROLLED_FAILURE"]);
const STALE_WORKER_MS = 20 * 60 * 1000;

export async function requestReviewerRunAdvance({ run_id, requested_by = "operator", base_url = "", auto_continue = true }) {
  const run = await getRunRecord(run_id);

  if (isTerminal(run)) {
    return asyncResponse({ run, queued: false, already_running: false, terminal: true });
  }

  if (run.runner_state === "RUNNING" && !isStaleRunner(run)) {
    return asyncResponse({ run, queued: false, already_running: true, terminal: false });
  }

  const requestedAt = nowIso();
  const updated = await updateRunRecord(run_id, {
    status: run.status === "CREATED" ? "RUNNING" : run.status,
    runner_mode: "ASYNC_NODE_RUNNER",
    runner_state: "QUEUED",
    runner_auto_continue: Boolean(auto_continue),
    runner_requested_by: requested_by,
    runner_requested_at: requestedAt,
    runner_dispatch_base_url: base_url || run.runner_dispatch_base_url || "",
    runner_last_error: ""
  });
  await updateRunDashboardRow(updated);
  await logEvent({ run_id, event_type: "ASYNC_RUNNER_QUEUED", actor: requested_by, payload: { current_phase: updated.current_phase, previous_runner_state: run.runner_state || "IDLE", auto_continue: Boolean(auto_continue) } });

  dispatchWorkerSoon({ run_id, base_url: updated.runner_dispatch_base_url, auto_continue: Boolean(auto_continue) });
  return asyncResponse({ run: updated, queued: true, already_running: false, terminal: false });
}

export async function runReviewerWorkerOnce({ run_id, actor = "async_worker", auto_continue = true }) {
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
    runner_mode: "ASYNC_NODE_RUNNER",
    runner_state: "RUNNING",
    runner_worker_started_at: startedAt,
    runner_active_phase: run.current_phase,
    runner_last_error: ""
  });
  await updateRunDashboardRow(claimed);
  await logEvent({ run_id, event_type: "ASYNC_WORKER_STARTED", actor, payload: { phase: claimed.current_phase } });

  try {
    const result = await advanceReviewerRun({ run_id });
    const after = await getRunRecord(run_id);
    const shouldContinue = Boolean(auto_continue) && !isTerminal(after);

    if (shouldContinue) {
      const queued = await updateRunRecord(run_id, {
        runner_state: "QUEUED",
        runner_auto_continue: true,
        runner_previous_phase_completed: result.completed_phase || claimed.current_phase,
        runner_last_completed_at: nowIso(),
        runner_last_error: ""
      });
      await updateRunDashboardRow(queued);
      await logEvent({ run_id, event_type: "ASYNC_WORKER_STEP_COMPLETED", actor, payload: { completed_phase: result.completed_phase || claimed.current_phase, current_phase: queued.current_phase, status: queued.status, dispatched_next: true } });
      dispatchWorkerSoon({ run_id, base_url: queued.runner_dispatch_base_url, auto_continue: true });
      return workerResponse({ run: queued, completed_step: true, dispatched_next: true, terminal: false });
    }

    const idle = await updateRunRecord(run_id, {
      runner_state: isTerminal(after) ? "COMPLETE" : "IDLE",
      runner_auto_continue: false,
      runner_previous_phase_completed: result.completed_phase || claimed.current_phase,
      runner_last_completed_at: nowIso(),
      runner_last_error: ""
    });
    await updateRunDashboardRow(idle);
    await logEvent({ run_id, event_type: "ASYNC_WORKER_STEP_COMPLETED", actor, payload: { completed_phase: result.completed_phase || claimed.current_phase, current_phase: idle.current_phase, status: idle.status, dispatched_next: false } });
    return workerResponse({ run: idle, completed_step: true, dispatched_next: false, terminal: isTerminal(idle) });
  } catch (error) {
    const failed = await updateRunRecord(run_id, {
      runner_state: "FAILED",
      runner_last_error: error?.message || String(error),
      runner_failed_at: nowIso()
    });
    await updateRunDashboardRow(failed);
    await logEvent({ run_id, event_type: "ASYNC_WORKER_FAILED", actor, payload: { phase: claimed.current_phase, error_message: error?.message || String(error) } });
    throw error;
  }
}

function dispatchWorkerSoon({ run_id, base_url, auto_continue }) {
  setTimeout(() => {
    runReviewerWorkerOnce({ run_id, actor: "async_worker", auto_continue: Boolean(auto_continue) }).catch(async (error) => {
      await markDispatchFailure({ run_id, error });
    });
  }, 0);
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
  } catch {
    // Preserve original dispatch failure logging even if state update fails.
  }
  await logEvent({ run_id, event_type: "ASYNC_WORKER_DISPATCH_FAILED", actor: "async_dispatcher", payload: { error_message: message } }).catch(() => {});
}

async function dispatchWorker({ run_id, base_url, auto_continue }) {
  const base = normalizeBaseUrl(base_url);
  if (!base) throw new Error("ASYNC_DISPATCH_BASE_URL_MISSING");
  if (!config.apiKey) throw new Error("ASYNC_DISPATCH_API_KEY_MISSING");

  const url = `${base}/v1/reviewer/jobs/${encodeURIComponent(run_id)}/worker`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-ln-api-key": config.apiKey
    },
    body: JSON.stringify({ auto_continue: Boolean(auto_continue) })
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`ASYNC_WORKER_HTTP_FAILED:${response.status}:${text.slice(0, 500)}`);
  }
}

async function clearRunnerState({ run_id, terminal }) {
  const updated = await updateRunRecord(run_id, {
    runner_state: terminal ? "COMPLETE" : "IDLE",
    runner_auto_continue: false,
    runner_last_completed_at: nowIso()
  });
  await updateRunDashboardRow(updated);
}

function isTerminal(run) {
  return TERMINAL_PHASES.has(run?.current_phase) || TERMINAL_STATUSES.has(run?.status);
}

function isStaleRunner(run) {
  const at = Date.parse(run?.runner_worker_started_at || run?.runner_requested_at || "");
  return Number.isFinite(at) && Date.now() - at > STALE_WORKER_MS;
}

function normalizeBaseUrl(value) {
  const raw = String(value || "").trim().replace(/\/+$/, "");
  if (!raw) return "";
  try {
    const url = new URL(raw);
    return url.toString().replace(/\/+$/, "");
  } catch {
    return "";
  }
}

function asyncResponse({ run, queued, already_running, terminal }) {
  return {
    ok: true,
    async: true,
    queued,
    already_running,
    terminal,
    run_id: run.run_id,
    status: run.status,
    current_phase: run.current_phase,
    runner_state: run.runner_state || "IDLE",
    runner_last_error: run.runner_last_error || "",
    runner_failed_at: run.runner_failed_at || "",
    runner_worker_started_at: run.runner_worker_started_at || "",
    runner_requested_at: run.runner_requested_at || "",
    runner_last_completed_at: run.runner_last_completed_at || "",
    poll: `/v1/reviewer/jobs/${run.run_id}`
  };
}

function workerResponse({ run, completed_step, dispatched_next, terminal = false, already_running = false }) {
  return {
    ok: true,
    async: true,
    worker: true,
    completed_step,
    dispatched_next,
    terminal,
    already_running,
    run_id: run.run_id,
    status: run.status,
    current_phase: run.current_phase,
    runner_state: run.runner_state || "IDLE",
    runner_last_error: run.runner_last_error || "",
    runner_failed_at: run.runner_failed_at || "",
    runner_worker_started_at: run.runner_worker_started_at || "",
    runner_requested_at: run.runner_requested_at || "",
    runner_last_completed_at: run.runner_last_completed_at || ""
  };
}
