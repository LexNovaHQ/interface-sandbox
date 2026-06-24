import { SERVICE_NAME } from "./constants.js";

function env(name, fallback = "") {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export const config = Object.freeze({
  serviceName: SERVICE_NAME,
  port: Number(env("PORT", "8080")),
  projectId: env("GCP_PROJECT_ID") || env("GOOGLE_CLOUD_PROJECT") || "direct-album-497808-f1",
  region: env("GCP_REGION", "asia-south1"),
  cloudRunService: env("GCP_CLOUD_RUN_SERVICE", "interface-diligence-artifacts"),
  firestoreDatabaseId: env("FIRESTORE_DATABASE_ID", "(default)"),
  driveParentFolderId: env("DRIVE_PARENT_FOLDER_ID"),
  sheetsSpreadsheetId: env("SHEETS_SPREADSHEET_ID"),
  runsSheetName: env("RUNS_SHEET_NAME", "runs"),
  apiKey: env("GPT_ACTION_API_KEY"),
  allowedOrigin: env("ALLOWED_ORIGIN", "*"),
  rendererBaseUrl: env("PUBLIC_RENDERER_BASE_URL", ""),
  expressJsonLimit: env("EXPRESS_JSON_LIMIT", "50mb")
});

export function configStatus() {
  return {
    project_id_present: Boolean(config.projectId),
    firestore_database_id: config.firestoreDatabaseId,
    drive_parent_folder_id_present: Boolean(config.driveParentFolderId),
    sheets_spreadsheet_id_present: Boolean(config.sheetsSpreadsheetId),
    api_key_present: Boolean(config.apiKey),
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
