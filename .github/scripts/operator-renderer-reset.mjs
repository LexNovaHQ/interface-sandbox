import crypto from "node:crypto";

const runId = process.env.RUN_ID;
const artifactName = process.env.ARTIFACT_NAME;
const projectId = process.env.GCP_PROJECT_ID;
const token = process.env.GCLOUD_ACCESS_TOKEN;
const databaseId = process.env.FIRESTORE_DATABASE_ID || "(default)";

if (!runId) throw new Error("RUN_ID is required");
if (artifactName !== "renderer_payload") throw new Error(`REFUSING_UNSUPPORTED_ARTIFACT:${artifactName}`);
if (!projectId) throw new Error("GCP_PROJECT_ID is required");
if (!token) throw new Error("GCLOUD_ACCESS_TOKEN is required");

const baseDocUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${encodeURIComponent(databaseId)}/documents`;
const runDocUrl = `${baseDocUrl}/runs/${encodeURIComponent(runId)}`;
const artifactDocUrl = `${runDocUrl}/artifacts/${artifactName}`;

const runBefore = await requestJson("GET", runDocUrl);
const artifactBefore = await requestJson("GET", artifactDocUrl).catch((error) => {
  if (error.status === 404) return null;
  throw error;
});

let deletedDriveFileId = "";
let deletedLatestVersion = 0;

if (artifactBefore) {
  deletedDriveFileId = stringField(artifactBefore, "drive_file_id");
  deletedLatestVersion = numberField(artifactBefore, "latest_version") || numberField(artifactBefore, "version") || 0;
  if (deletedDriveFileId) {
    await requestEmpty("DELETE", `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(deletedDriveFileId)}?supportsAllDrives=true`, { ok404: true });
  }
  const versions = await requestJson("GET", `${artifactDocUrl}/versions`).catch((error) => {
    if (error.status === 404) return { documents: [] };
    throw error;
  });
  for (const doc of versions.documents || []) {
    await requestEmpty("DELETE", `https://firestore.googleapis.com/v1/${doc.name}`, { ok404: true });
  }
  await requestEmpty("DELETE", artifactDocUrl, { ok404: true });
}

const now = new Date().toISOString();
await requestJson("PATCH", `${runDocUrl}?${[
  "current_phase",
  "status",
  "runner_state",
  "runner_auto_continue",
  "runner_active_phase",
  "runner_last_error",
  "final_report_url",
  "updated_at"
].map((field) => `updateMask.fieldPaths=${encodeURIComponent(field)}`).join("&")}`, {
  fields: {
    current_phase: { stringValue: "RENDERER" },
    status: { stringValue: "LOCKED_WITH_LIMITATIONS" },
    runner_state: { stringValue: "IDLE" },
    runner_auto_continue: { booleanValue: false },
    runner_active_phase: { stringValue: "" },
    runner_last_error: { stringValue: "" },
    final_report_url: { stringValue: "" },
    updated_at: { stringValue: now }
  }
});

const eventId = crypto.randomUUID().replaceAll("-", "");
await requestJson("PATCH", `${runDocUrl}/events/${eventId}`, {
  fields: {
    run_id: { stringValue: runId },
    event_id: { stringValue: eventId },
    event_type: { stringValue: "OPERATOR_RENDERER_ARTIFACT_RESET" },
    actor: { stringValue: "github-actions-operator" },
    created_at: { stringValue: now },
    payload: {
      mapValue: {
        fields: {
          artifact_name: { stringValue: artifactName },
          deleted_drive_file_id_present: { booleanValue: Boolean(deletedDriveFileId) },
          deleted_latest_version: { integerValue: String(deletedLatestVersion || 0) },
          prior_status: { stringValue: stringField(runBefore, "status") },
          prior_current_phase: { stringValue: stringField(runBefore, "current_phase") },
          reset_phase: { stringValue: "RENDERER" }
        }
      }
    }
  }
});

const runAfter = await requestJson("GET", runDocUrl);
const artifactAfter = await requestJson("GET", artifactDocUrl).then(() => true).catch((error) => {
  if (error.status === 404) return false;
  throw error;
});

console.log(JSON.stringify({
  ok: true,
  run_id: runId,
  deleted_renderer_payload: Boolean(artifactBefore),
  deleted_drive_file_id_present: Boolean(deletedDriveFileId),
  deleted_latest_version: deletedLatestVersion,
  before: {
    status: stringField(runBefore, "status"),
    current_phase: stringField(runBefore, "current_phase"),
    runner_state: stringField(runBefore, "runner_state")
  },
  after: {
    status: stringField(runAfter, "status"),
    current_phase: stringField(runAfter, "current_phase"),
    runner_state: stringField(runAfter, "runner_state"),
    renderer_artifact_exists: artifactAfter
  }
}, null, 2));

function stringField(doc, name) {
  return doc?.fields?.[name]?.stringValue || "";
}

function numberField(doc, name) {
  return Number(doc?.fields?.[name]?.integerValue || doc?.fields?.[name]?.doubleValue || 0);
}

async function requestJson(method, url, body) {
  const response = await request(method, url, body);
  return response.text ? JSON.parse(response.text) : {};
}

async function requestEmpty(method, url, { ok404 = false } = {}) {
  try {
    await request(method, url);
  } catch (error) {
    if (ok404 && error.status === 404) return;
    throw error;
  }
}

async function request(method, url, body) {
  const response = await fetch(url, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      ...(body ? { "content-type": "application/json" } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await response.text();
  if (!response.ok) {
    const error = new Error(`${method} ${url} -> ${response.status}:${text.slice(0, 500)}`);
    error.status = response.status;
    throw error;
  }
  return { text };
}
