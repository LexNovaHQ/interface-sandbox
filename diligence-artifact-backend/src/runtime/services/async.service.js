import cloudTasks from "@google-cloud/tasks";
import { config } from "../config.js";
import { nowIso } from "../../run-id.js";
import { getRunRecord, updateRunRecord, logEvent } from "./storage/firestore.service.js";
import { updateRunDashboardRow } from "./storage/sheets.service.js";
import { advanceCentralPipelineRun } from "./pipeline.service.js";

const { CloudTasksClient } = cloudTasks;
const TERMINAL_PHASES = new Set(["COMPLETE"]);
const TERMINAL_STATUSES = new Set(["COMPLETE", "REPAIR_REQUIRED", "CONTROLLED_FAILURE"]);
const EARLY_PHASES = new Set(["AGENT_1A_URL_MANIFEST", "AGENT_1B_EXTRACT", "M6_BUCKET_INDEX"]);

let cloudTasksClient;

export const ASYNC_RUNTIME_MODE = Object.freeze({
  runner_mode: "CLOUD_TASKS_RUNNER",
  central_runtime_service: "async.service",
  migration_status: "runtime_owned_async_and_cloud_tasks_logic"
});

export function cloudTasksDispatcherConfigured() {
  return Boolean(config.cloudTasksQueue && config.projectId && config.cloudTasksLocation && config.apiKey);
}

export async function requestPipelineAdvance({ run_id, requested_by = "operator", base_url = "", auto_continue = true } = {}) {
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

  if (run.runner_state === "RETRY_SCHEDULED" && !isRetryDue(run)) {
    return asyncResponse({ run, queued: true, already_running: true, terminal: false });
  }

  const staleRunningRequeue = run.runner_state === "RUNNING" && isStaleRunner(run);
  const staleQueuedRequeue = run.runner_state === "QUEUED" && isStaleQueued(run);
  const retryDueRequeue = run.runner_state === "RETRY_SCHEDULED" && isRetryDue(run);
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
    runner_stale_requeue_count: staleRunningRequeue || staleQueuedRequeue || retryDueRequeue ? Number(run.runner_stale_requeue_count || 0) + 1 : Number(run.runner_stale_requeue_count || 0),
    runner_queued_stale_count: staleQueuedRequeue ? Number(run.runner_queued_stale_count || 0) + 1 : Number(run.runner_queued_stale_count || 0)
  });
  await updateRunDashboardRow(queued);
  await logEvent({
    run_id,
    event_type: staleRunningRequeue || staleQueuedRequeue || retryDueRequeue ? "ASYNC_RUNNER_STALE_REQUEUED" : "ASYNC_RUNNER_QUEUED",
    actor: requested_by,
    payload: {
      current_phase: queued.current_phase,
      central_phase: queued.central_phase || "",
      previous_runner_state: run.runner_state || "IDLE",
      auto_continue: Boolean(auto_continue),
      stale_runner: staleRunningRequeue,
      stale_queued: staleQueuedRequeue,
      retry_due: retryDueRequeue,
      previous_task_name: run.runner_task_name || ""
    }
  });

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
    await logEvent({
      run_id,
      event_type: "ASYNC_WORKER_DISPATCHED",
      actor: requested_by,
      payload: {
        dispatcher: dispatch.dispatcher,
        task_name: dispatch.task_name || "",
        worker_url_present: Boolean(dispatch.worker_url),
        stale_requeue: staleRunningRequeue || staleQueuedRequeue || retryDueRequeue
      }
    });
    return asyncResponse({ run: dispatched, queued: true, already_running: false, terminal: false });
  } catch (error) {
    await markDispatchFailure({ run_id, error });
    throw error;
  }
}

export async function runPipelineWorkerOnce({ run_id, actor = "cloud_tasks_worker", auto_continue = true } = {}) {
  const run = await getRunRecord(run_id);

  if (isTerminal(run)) {
    await clearRunnerState({ run_id, terminal: true });
    return workerResponse({ run, completed_step: false, dispatched_next: false, terminal: true });
  }

  if (run.runner_state === "RUNNING" && !isStaleRunner(run)) {
    return workerResponse({ run, completed_step: false, dispatched_next: false, already_running: true });
  }

  if (run.runner_state === "RETRY_SCHEDULED" && !isRetryDue(run)) {
    return workerResponse({ run, completed_step: false, dispatched_next: true, already_running: true });
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
  await logEvent({
    run_id,
    event_type: "ASYNC_WORKER_STARTED",
    actor,
    payload: {
      phase: claimed.current_phase,
      central_phase: claimed.central_phase || "",
      worker_attempt: claimed.runner_worker_attempt || 1,
      previous_runner_state: run.runner_state || ""
    }
  });

  try {
    await heartbeat({ run_id, phase: claimed.current_phase, actor, marker: "BEFORE_PHASE_ADVANCE" });
    const result = await advanceCentralPipelineRun({ run_id });
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
      await logEvent({
        run_id,
        event_type: "ASYNC_WORKER_STEP_COMPLETED",
        actor,
        payload: {
          completed_phase: result.completed_phase || claimed.current_phase,
          current_phase: queued.current_phase,
          central_phase: queued.central_phase || "",
          status: queued.status,
          dispatched_next: true
        }
      });
      const dispatch = await dispatchWorkerDurably({ run_id, base_url: queued.runner_dispatch_base_url, auto_continue: true });
      const dispatched = await updateRunRecord(run_id, {
        runner_mode: dispatch.dispatcher,
        runner_task_name: dispatch.task_name || "",
        runner_worker_url: dispatch.worker_url || "",
        runner_dispatched_at: nowIso(),
        runner_last_error: ""
      });
      await updateRunDashboardRow(dispatched);
      await logEvent({
        run_id,
        event_type: "ASYNC_WORKER_DISPATCHED",
        actor,
        payload: {
          dispatcher: dispatch.dispatcher,
          task_name: dispatch.task_name || "",
          continuation: true,
          worker_url_present: Boolean(dispatch.worker_url)
        }
      });
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
    await logEvent({
      run_id,
      event_type: "ASYNC_WORKER_STEP_COMPLETED",
      actor,
      payload: {
        completed_phase: result.completed_phase || claimed.current_phase,
        current_phase: idle.current_phase,
        central_phase: idle.central_phase || "",
        status: idle.status,
        dispatched_next: false
      }
    });
    return workerResponse({ run: idle, completed_step: true, dispatched_next: false, terminal: isTerminal(idle) });
  } catch (error) {
    const retry = providerQuotaRetry(error);
    if (retry) {
      const retryRun = await scheduleProviderRetry({ run_id, claimed, actor, error, retry, auto_continue });
      return workerResponse({ run: retryRun, completed_step: false, dispatched_next: true, terminal: false });
    }
    const failed = await updateRunRecord(run_id, {
      runner_state: "FAILED",
      runner_last_error: error?.message || String(error),
      runner_failed_at: nowIso(),
      runner_worker_heartbeat_at: nowIso()
    });
    await updateRunDashboardRow(failed);
    await logEvent({
      run_id,
      event_type: "ASYNC_WORKER_FAILED",
      actor,
      payload: { phase: claimed.current_phase, central_phase: claimed.central_phase || "", error_message: error?.message || String(error) }
    });
    throw error;
  }
}

async function scheduleProviderRetry({ run_id, claimed, actor, error, retry, auto_continue }) {
  const delayMs = Math.max(1, Number(retry.delay_ms || 0));
  const retryNotBefore = new Date(Date.now() + delayMs).toISOString();
  const scheduled = await updateRunRecord(run_id, {
    status: "RUNNING",
    current_phase: claimed.current_phase,
    runner_mode: "CLOUD_TASKS_RUNNER",
    runner_state: "RETRY_SCHEDULED",
    runner_auto_continue: Boolean(auto_continue),
    runner_active_phase: claimed.current_phase,
    runner_last_error: `RATE_OR_QUOTA:${retry.message || error?.message || String(error)}`,
    runner_retry_reason: "RATE_OR_QUOTA",
    runner_retry_scheduled_at: nowIso(),
    runner_retry_not_before: retryNotBefore,
    provider_retry_after_delay_ms: delayMs,
    runner_worker_heartbeat_at: nowIso()
  });
  await updateRunDashboardRow(scheduled);
  await logEvent({
    run_id,
    event_type: "ASYNC_WORKER_PROVIDER_RETRY_SCHEDULED",
    actor,
    payload: {
      phase: claimed.current_phase,
      central_phase: claimed.central_phase || "",
      retry_after_delay_ms: delayMs,
      retry_not_before: retryNotBefore,
      provider_error_type: retry.provider_error_type || "RATE_OR_QUOTA",
      error_message: retry.message || error?.message || String(error)
    }
  });
  const dispatch = await dispatchWorkerDurably({ run_id, base_url: scheduled.runner_dispatch_base_url, auto_continue: Boolean(auto_continue), schedule_delay_ms: delayMs });
  const dispatched = await updateRunRecord(run_id, {
    runner_mode: dispatch.dispatcher,
    runner_task_name: dispatch.task_name || "",
    runner_worker_url: dispatch.worker_url || "",
    runner_dispatched_at: nowIso()
  });
  await updateRunDashboardRow(dispatched);
  await logEvent({
    run_id,
    event_type: "ASYNC_WORKER_DISPATCHED",
    actor,
    payload: {
      dispatcher: dispatch.dispatcher,
      task_name: dispatch.task_name || "",
      continuation: true,
      delayed_retry: true,
      schedule_delay_ms: dispatch.schedule_delay_ms || delayMs,
      worker_url_present: Boolean(dispatch.worker_url)
    }
  });
  return dispatched;
}

async function dispatchWorkerDurably({ run_id, base_url, auto_continue, schedule_delay_ms = 0 }) {
  return enqueueReviewerWorkerTask({ run_id, base_url, auto_continue, schedule_delay_ms });
}

export async function enqueueReviewerWorkerTask({ run_id, base_url = "", auto_continue = true, schedule_delay_ms = 0 }) {
  if (!cloudTasksDispatcherConfigured()) {
    throw new Error("CLOUD_TASKS_NOT_CONFIGURED:CLOUD_TASKS_QUEUE,GCP_PROJECT_ID,GCP_REGION,GPT_ACTION_API_KEY required");
  }
  const taskClient = getCloudTasksClient();
  const parent = taskClient.queuePath(config.projectId, config.cloudTasksLocation, config.cloudTasksQueue);
  const url = workerUrl({ run_id, base_url });
  const body = Buffer.from(JSON.stringify({ auto_continue: Boolean(auto_continue) })).toString("base64");
  const delayMs = Math.max(0, Number(schedule_delay_ms || 0));
  const task = {
    httpRequest: {
      httpMethod: "POST",
      url,
      headers: {
        "Content-Type": "application/json",
        "x-ln-api-key": config.apiKey,
        "x-ln-dispatcher": "cloud_tasks"
      },
      body
    }
  };
  if (delayMs > 0) task.scheduleTime = { seconds: Math.floor((Date.now() + delayMs) / 1000) };
  if (config.cloudTasksDispatchDeadlineSeconds > 0) task.dispatchDeadline = { seconds: config.cloudTasksDispatchDeadlineSeconds };
  const [created] = await taskClient.createTask({ parent, task });
  return { dispatcher: "CLOUD_TASKS", task_name: created?.name || "", worker_url: url, schedule_delay_ms: delayMs };
}

function getCloudTasksClient() {
  if (!cloudTasksClient) cloudTasksClient = new CloudTasksClient();
  return cloudTasksClient;
}

function workerUrl({ run_id, base_url = "" }) {
  const explicit = String(config.cloudTasksWorkerUrl || "").replace(/\/$/, "");
  if (explicit) return explicit.replace(/\{run_id\}/g, encodeURIComponent(run_id));
  const base = String(base_url || "").replace(/\/$/, "");
  if (base) return `${base}/v1/reviewer/jobs/${encodeURIComponent(run_id)}/worker`;
  throw new Error("CLOUD_TASKS_WORKER_URL_MISSING:provide CLOUD_TASKS_WORKER_URL pinned to the Cloud Run /v1/reviewer/jobs/{run_id}/worker endpoint");
}

function providerQuotaRetry(error) {
  const entries = parseGeminiCallErrors(error);
  const quotaEntries = entries.filter((entry) => entry?.provider_error_type === "RATE_OR_QUOTA" || /quota|rate/i.test(String(entry?.message || "")));
  if (!quotaEntries.length) return null;
  const delay = Math.max(...quotaEntries.map((entry) => Number(entry.retry_after_delay_ms || 0)), fallbackQuotaRetryDelayMs());
  return {
    delay_ms: delay,
    provider_error_type: "RATE_OR_QUOTA",
    message: quotaEntries.map((entry) => entry.message).filter(Boolean)[0] || error?.message || String(error)
  };
}

function parseGeminiCallErrors(error) {
  const message = String(error?.message || error || "");
  const marker = "GEMINI_CALL_FAILED:";
  if (!message.includes(marker)) return [];
  const jsonStart = message.indexOf("[");
  if (jsonStart < 0) return [];
  try {
    const parsed = JSON.parse(message.slice(jsonStart));
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
}

function fallbackQuotaRetryDelayMs() {
  const configured = Number(config.geminiQuotaRetryMaxDelayMs || 0);
  if (Number.isFinite(configured) && configured > 0) return Math.min(configured, 90000);
  return 60000;
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

function isTerminal(run) {
  return TERMINAL_PHASES.has(run.current_phase) || TERMINAL_STATUSES.has(run.status);
}

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

function isRetryDue(run) {
  const marker = Date.parse(run.runner_retry_not_before || "");
  return !Number.isFinite(marker) || Date.now() >= marker;
}

function staleWindowMs(run) {
  if (EARLY_PHASES.has(run.current_phase) && Number(run.artifact_count || 0) === 0) return config.earlyPhaseStaleMs;
  return config.workerStaleMs;
}

function queuedStaleWindowMs(run) {
  if (EARLY_PHASES.has(run.current_phase) && Number(run.artifact_count || 0) === 0) return Math.min(config.earlyPhaseStaleMs, 3 * 60 * 1000);
  return Math.min(config.workerStaleMs, 5 * 60 * 1000);
}

async function clearRunnerState({ run_id, terminal }) {
  const updated = await updateRunRecord(run_id, {
    runner_state: terminal ? "COMPLETE" : "IDLE",
    runner_auto_continue: false,
    runner_active_phase: terminal ? "COMPLETE" : ""
  });
  await updateRunDashboardRow(updated);
}

function activePhaseFor(run) {
  return isTerminal(run) ? "COMPLETE" : run.current_phase || "";
}

function asyncResponse({ run, queued, already_running, terminal }) {
  return {
    ok: true,
    queued,
    already_running,
    terminal,
    run_id: run.run_id,
    status: run.status,
    current_phase: run.current_phase,
    central_phase: run.central_phase || "",
    central_phase_label: run.central_phase_label || "",
    runner_mode: run.runner_mode || "",
    runner_state: run.runner_state || "",
    runner_last_error: run.runner_last_error || "",
    runner_failed_at: run.runner_failed_at || "",
    runner_worker_started_at: run.runner_worker_started_at || "",
    runner_worker_heartbeat_at: run.runner_worker_heartbeat_at || "",
    runner_requested_at: run.runner_requested_at || "",
    runner_dispatched_at: run.runner_dispatched_at || "",
    runner_last_completed_at: run.runner_last_completed_at || "",
    runner_retry_not_before: run.runner_retry_not_before || "",
    provider_retry_after_delay_ms: run.provider_retry_after_delay_ms || 0,
    runner_task_name: run.runner_task_name || "",
    artifact_count: run.artifact_count || 0
  };
}

function workerResponse({ run, completed_step, dispatched_next, terminal, already_running = false }) {
  return {
    ok: true,
    run_id: run.run_id,
    status: run.status,
    current_phase: run.current_phase,
    central_phase: run.central_phase || "",
    central_phase_label: run.central_phase_label || "",
    completed_step,
    dispatched_next,
    terminal,
    already_running,
    runner_mode: run.runner_mode || "",
    runner_state: run.runner_state || "",
    runner_last_error: run.runner_last_error || "",
    runner_failed_at: run.runner_failed_at || "",
    runner_worker_started_at: run.runner_worker_started_at || "",
    runner_worker_heartbeat_at: run.runner_worker_heartbeat_at || "",
    runner_dispatched_at: run.runner_dispatched_at || "",
    runner_retry_not_before: run.runner_retry_not_before || "",
    provider_retry_after_delay_ms: run.provider_retry_after_delay_ms || 0,
    runner_task_name: run.runner_task_name || "",
    artifact_count: run.artifact_count || 0
  };
}
