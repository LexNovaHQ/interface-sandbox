const runId = process.env.RUN_ID;
const projectId = process.env.GCP_PROJECT_ID;
const token = process.env.GCLOUD_ACCESS_TOKEN;
const databaseId = process.env.FIRESTORE_DATABASE_ID || "(default)";

if (!runId) throw new Error("RUN_ID is required");
if (!projectId) throw new Error("GCP_PROJECT_ID is required");
if (!token) throw new Error("GCLOUD_ACCESS_TOKEN is required");

const baseDocUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${encodeURIComponent(databaseId)}/documents`;
const runDocUrl = `${baseDocUrl}/runs/${encodeURIComponent(runId)}`;
const artifactDocUrl = `${runDocUrl}/artifacts/renderer_payload`;

const run = await requestJson("GET", runDocUrl);
const renderer = await requestJson("GET", artifactDocUrl);

const status = stringField(run, "status");
const currentPhase = stringField(run, "current_phase");
if (status !== "COMPLETE" || currentPhase !== "COMPLETE") {
  throw new Error(`RUN_NOT_COMPLETE_AFTER_RENDERER:${status}:${currentPhase}`);
}

console.log(JSON.stringify({
  ok: true,
  run_id: runId,
  status,
  current_phase: currentPhase,
  final_report_url: stringField(run, "final_report_url"),
  renderer_payload: {
    latest_version: numberField(renderer, "latest_version") || numberField(renderer, "version") || 0,
    lock_status: stringField(renderer, "lock_status"),
    updated_at: stringField(renderer, "updated_at") || stringField(renderer, "created_at"),
    drive_file_id_present: Boolean(stringField(renderer, "drive_file_id"))
  }
}, null, 2));

function stringField(doc, name) {
  return doc?.fields?.[name]?.stringValue || "";
}

function numberField(doc, name) {
  return Number(doc?.fields?.[name]?.integerValue || doc?.fields?.[name]?.doubleValue || 0);
}

async function requestJson(method, url) {
  const response = await fetch(url, {
    method,
    headers: { authorization: `Bearer ${token}` }
  });
  const text = await response.text();
  if (!response.ok) {
    const error = new Error(`${method} ${url} -> ${response.status}:${text.slice(0, 500)}`);
    error.status = response.status;
    throw error;
  }
  return text ? JSON.parse(text) : {};
}
