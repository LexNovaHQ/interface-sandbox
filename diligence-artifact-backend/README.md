# Interface Diligence Artifacts Backend

Storage backend for the semi-automated Custom GPT diligence workflow.

This service does **not** call OpenAI, Gemini, or any model API. Custom GPT agents do the reasoning inside ChatGPT. This backend only creates isolated runs, saves/loads artifacts, updates Firestore/Drive/Sheets, and exposes the final renderer payload.

## Locked architecture

```text
Custom GPT Agent
  -> GPT Action
  -> this backend
  -> Firestore: run state + artifact metadata
  -> Drive: full JSON artifacts
  -> Sheets: human dashboard
  -> Portfolio renderer: final renderer_payload
```

## Non-contamination rule

Every read/write is scoped by exact `run_id`.

Forbidden:

```text
get latest Sarvam
get previous run by company
get artifact by domain
reuse old run data
```

Allowed:

```text
get_artifact(run_id, artifact_name)
save_artifact(run_id, artifact_name)
```

## Required GCP setup

Project:

```text
direct-album-497808-f1
```

Runtime service account:

```text
interface-diligence-artifacts0@direct-album-497808-f1.iam.gserviceaccount.com
```

Grant this service account:

```text
roles/datastore.user
```

Enable APIs:

```text
Firestore API
Google Drive API
Google Sheets API
```

Share these resources with the runtime service account as Editor:

```text
Drive folder: 1d-OGZrXKOrlwLHXfr2nwq43jyZvNlRI3
Sheet: 1u61ElNVKgZkrymkoTzRFLFj1Ky4bvkqNW4d3qsJRWcw
```

The backend will create the `runs` sheet tab and header row if missing.

## Environment

```env
PORT=8080
GCP_PROJECT_ID=direct-album-497808-f1
GCP_REGION=asia-south1
GCP_CLOUD_RUN_SERVICE=interface-diligence-artifacts
FIRESTORE_DATABASE_ID=(default)
DRIVE_PARENT_FOLDER_ID=1d-OGZrXKOrlwLHXfr2nwq43jyZvNlRI3
SHEETS_SPREADSHEET_ID=1u61ElNVKgZkrymkoTzRFLFj1Ky4bvkqNW4d3qsJRWcw
RUNS_SHEET_NAME=runs
GPT_ACTION_API_KEY=<long random secret>
ALLOWED_ORIGIN=*
EXPRESS_JSON_LIMIT=50mb
```

## Local run

```powershell
cd D:\GitHub\interface-sandbox\diligence-artifact-backend
npm install
npm run check
npm start
```

Health:

```powershell
Invoke-RestMethod "http://localhost:8080/health" | ConvertTo-Json -Depth 20
```

Create run:

```powershell
$headers = @{ "x-ln-api-key" = $env:GPT_ACTION_API_KEY }
$body = @{
  target = "Sarvam"
  root_url = "https://sarvam.ai"
  source_mode = "url"
  created_by = "operator"
} | ConvertTo-Json -Depth 20

Invoke-RestMethod "http://localhost:8080/v1/runs/create" -Method POST -Headers $headers -ContentType "application/json" -Body $body
```

Save artifact:

```powershell
$body = @{
  run_id = "LN-..."
  phase = "M6_M9"
  agent_id = "agent_1_source_legal"
  artifact_name = "source_discovery_handoff"
  lock_status = "LOCKED_WITH_LIMITATIONS"
  artifact = @{ source_discovery_handoff = @{ test = $true } }
} | ConvertTo-Json -Depth 50

Invoke-RestMethod "http://localhost:8080/v1/artifacts/save" -Method POST -Headers $headers -ContentType "application/json" -Body $body
```

Fetch artifact:

```powershell
Invoke-RestMethod "http://localhost:8080/v1/artifacts/LN-.../source_discovery_handoff?agent_id=agent_2_target_feature" -Headers $headers
```

## GPT Actions

Use `openapi/gpt-actions.yaml` in the Custom GPT Action configuration.

Replace:

```text
https://YOUR-CLOUD-RUN-URL
```

with the deployed Cloud Run URL.

Configure authentication as API key header:

```text
x-ln-api-key
```

## Endpoint map

```text
GET  /health
POST /v1/runs/create
GET  /v1/runs/:run_id
POST /v1/artifacts/save
GET  /v1/artifacts/:run_id/:artifact_name?agent_id=...
POST /v1/phases/lock
GET  /v1/renderer/:run_id
```
