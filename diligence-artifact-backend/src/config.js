import { SERVICE_NAME } from "./constants.js";

function env(name, fallback = "") {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function csv(name, fallback = "") {
  return env(name, fallback).split(",").map((x) => x.trim()).filter(Boolean);
}

function bool(name, fallback = "false") {
  return ["1", "true", "yes", "on"].includes(env(name, fallback).toLowerCase());
}

function numberEnv(name, fallback) {
  const value = Number(env(name, String(fallback)));
  return Number.isFinite(value) ? value : fallback;
}

const geminiModelList = csv("GEMINI_MODELS", env("GEMINI_MODEL", "gemini-2.5-flash"));
const projectId = env("GCP_PROJECT_ID") || env("GOOGLE_CLOUD_PROJECT") || "direct-album-497808-f1";
const region = env("GCP_REGION", "asia-south1");

export const config = Object.freeze({
  serviceName: SERVICE_NAME,
  port: Number(env("PORT", "8080")),
  projectId,
  region,
  cloudRunService: env("GCP_CLOUD_RUN_SERVICE", "interface-diligence-artifacts"),
  firestoreDatabaseId: env("FIRESTORE_DATABASE_ID", "(default)"),
  driveParentFolderId: env("DRIVE_PARENT_FOLDER_ID"),
  sheetsSpreadsheetId: env("SHEETS_SPREADSHEET_ID"),
  runsSheetName: env("RUNS_SHEET_NAME", "runs"),
  apiKey: env("GPT_ACTION_API_KEY"),
  allowedOrigin: env("ALLOWED_ORIGIN", "*"),
  rendererBaseUrl: env("PUBLIC_RENDERER_BASE_URL", ""),
  reviewerPublicBaseUrl: env("REVIEWER_PUBLIC_BASE_URL", ""),
  publicReviewerEnabled: bool("PUBLIC_REVIEWER_ENABLED", "false"),
  expressJsonLimit: env("EXPRESS_JSON_LIMIT", "50mb"),
  cloudTasksQueue: env("CLOUD_TASKS_QUEUE", ""),
  cloudTasksLocation: env("CLOUD_TASKS_LOCATION", region),
  cloudTasksWorkerUrl: env("CLOUD_TASKS_WORKER_URL", ""),
  cloudTasksDispatchDeadlineSeconds: Math.max(0, numberEnv("CLOUD_TASKS_DISPATCH_DEADLINE_SECONDS", 1800)),
  earlyPhaseStaleMs: Math.max(60000, numberEnv("EARLY_PHASE_STALE_MS", 5 * 60 * 1000)),
  workerStaleMs: Math.max(60000, numberEnv("WORKER_STALE_MS", 20 * 60 * 1000)),
  geminiApiKeys: csv("GEMINI_API_KEYS"),
  geminiModel: geminiModelList[0] || "gemini-2.5-flash",
  geminiModels: geminiModelList.length ? geminiModelList : ["gemini-2.5-flash"],
  geminiTimeoutMs: numberEnv("GEMINI_TIMEOUT_MS", 240000),
  geminiMaxOutputTokens: Math.max(0, numberEnv("GEMINI_MAX_OUTPUT_TOKENS", 0)),
  geminiRetryRounds: Math.max(1, numberEnv("GEMINI_RETRY_ROUNDS", 2)),
  geminiKeysPerModelPerRound: Math.max(1, numberEnv("GEMINI_KEYS_PER_MODEL_PER_ROUND", 2)),
  geminiRetryBaseDelayMs: Math.max(0, numberEnv("GEMINI_RETRY_BASE_DELAY_MS", 750)),
  geminiRetryMaxDelayMs: Math.max(0, numberEnv("GEMINI_RETRY_MAX_DELAY_MS", 5000)),
  geminiQuotaRetryMaxDelayMs: Math.max(0, numberEnv("GEMINI_QUOTA_RETRY_MAX_DELAY_MS", 90000)),
  geminiQuotaRetryBufferMs: Math.max(0, numberEnv("GEMINI_QUOTA_RETRY_BUFFER_MS", 1000)),
  sourceFetchTimeoutMs: numberEnv("SOURCE_FETCH_TIMEOUT_MS", 30000)
});

export function configStatus() {
  return {
    project_id_present: Boolean(config.projectId),
    firestore_database_id: config.firestoreDatabaseId,
    drive_parent_folder_id_present: Boolean(config.driveParentFolderId),
    sheets_spreadsheet_id_present: Boolean(config.sheetsSpreadsheetId),
    api_key_present: Boolean(config.apiKey),
    cloud_tasks_queue_present: Boolean(config.cloudTasksQueue),
    cloud_tasks_location: config.cloudTasksLocation,
    cloud_tasks_worker_url_present: Boolean(config.cloudTasksWorkerUrl),
    cloud_tasks_dispatch_deadline_seconds: config.cloudTasksDispatchDeadlineSeconds,
    worker_stale_ms: config.workerStaleMs,
    early_phase_stale_ms: config.earlyPhaseStaleMs,
    gemini_api_keys_present: config.geminiApiKeys.length > 0,
    gemini_api_key_count: config.geminiApiKeys.length,
    gemini_model: config.geminiModel,
    gemini_models: config.geminiModels,
    gemini_max_output_tokens: config.geminiMaxOutputTokens || "unset_no_artificial_cap",
    gemini_retry_rounds: config.geminiRetryRounds,
    gemini_keys_per_model_per_round: config.geminiKeysPerModelPerRound,
    gemini_quota_retry_max_delay_ms: config.geminiQuotaRetryMaxDelayMs,
    gemini_quota_retry_buffer_ms: config.geminiQuotaRetryBufferMs,
    public_reviewer_enabled: config.publicReviewerEnabled,
    reviewer_public_base_url_present: Boolean(config.reviewerPublicBaseUrl),
    runs_sheet_name: config.runsSheetName
  };
}

export function requireRuntimeConfig() {
  const missing = [];
  if (!config.projectId) missing.push("GCP_PROJECT_ID");
  if (!config.driveParentFolderId) missing.push("DRIVE_PARENT_FOLDER_ID");
  if (!config.sheetsSpreadsheetId) missing.push("SHEETS_SPREADSHEET_ID");
  if (!config.apiKey) missing.push("GPT_ACTION_API_KEY");
  if (missing.length) {
    throw new Error(`MISSING_RUNTIME_CONFIG:${missing.join(",")}`);
  }
}

export function requireGeminiConfig() {
  if (!config.geminiApiKeys.length) {
    throw new Error("MISSING_RUNTIME_CONFIG:GEMINI_API_KEYS");
  }
  if (!config.geminiModels.length) {
    throw new Error("MISSING_RUNTIME_CONFIG:GEMINI_MODELS");
  }
}
