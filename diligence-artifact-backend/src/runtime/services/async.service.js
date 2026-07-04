import { requestReviewerRunAdvance, runReviewerWorkerOnce } from "../../reviewer-async-runner.js";

export async function requestPipelineAdvance({ run_id, requested_by = "operator", base_url = "", auto_continue = true } = {}) {
  return requestReviewerRunAdvance({ run_id, requested_by, base_url, auto_continue });
}

export async function runPipelineWorkerOnce({ run_id, actor = "cloud_tasks_worker", auto_continue = true } = {}) {
  return runReviewerWorkerOnce({ run_id, actor, auto_continue });
}

export const ASYNC_RUNTIME_MODE = Object.freeze({
  runner_mode: "CLOUD_TASKS_RUNNER",
  central_runtime_service: "async.service",
  migration_status: "bridge_to_existing_reviewer_async_runner"
});
