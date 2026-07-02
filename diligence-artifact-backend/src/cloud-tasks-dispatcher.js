import cloudTasks from "@google-cloud/tasks";
import { config } from "./config.js";

const { CloudTasksClient } = cloudTasks;
let client;

export function cloudTasksDispatcherConfigured() {
  return Boolean(config.cloudTasksQueue && config.projectId && config.cloudTasksLocation && config.apiKey);
}

export async function enqueueReviewerWorkerTask({ run_id, base_url = "", auto_continue = true, schedule_delay_ms = 0 }) {
  if (!cloudTasksDispatcherConfigured()) {
    throw new Error("CLOUD_TASKS_NOT_CONFIGURED:CLOUD_TASKS_QUEUE,GCP_PROJECT_ID,GCP_REGION,GPT_ACTION_API_KEY required");
  }
  const taskClient = getClient();
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
  if (delayMs > 0) {
    task.scheduleTime = { seconds: Math.floor((Date.now() + delayMs) / 1000) };
  }
  if (config.cloudTasksDispatchDeadlineSeconds > 0) {
    task.dispatchDeadline = { seconds: config.cloudTasksDispatchDeadlineSeconds };
  }
  const [created] = await taskClient.createTask({ parent, task });
  return { dispatcher: "CLOUD_TASKS", task_name: created?.name || "", worker_url: url, schedule_delay_ms: delayMs };
}

function getClient() {
  if (!client) client = new CloudTasksClient();
  return client;
}

function workerUrl({ run_id }) {
  const explicit = config.cloudTasksWorkerUrl.replace(/\/$/, "");
  if (explicit) return explicit.replace(/\{run_id\}/g, encodeURIComponent(run_id));
  throw new Error("CLOUD_TASKS_WORKER_URL_MISSING:provide CLOUD_TASKS_WORKER_URL pinned to the Cloud Run /v1/reviewer/jobs/{run_id}/worker endpoint");
}
