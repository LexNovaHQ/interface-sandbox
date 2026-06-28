# Interface Diligence Hunter Monolith

Hunter-style single-call runner for the Interface Diligence monolith.

## What this is

This lane intentionally avoids the prior job/bridge architecture:

- no `/jobs`
- no `/advance`
- no M6 URL manifest subcall
- no server-side `m6_fetch_fulfillment`
- no S0/P7/P6/P3/P1 key buckets
- no server-created evidence

The model runs the monolith in one grounded Gemini call and returns exactly one terminal JSON root: `final_output_handoff`.

## Required env

```powershell
GEMINI_API_KEYS=KEY1,KEY2,KEY3,KEY4
```

Use a flat comma-separated key pool. Do not use the old bucket names for this service.

Optional:

```powershell
GEMINI_MODELS=gemini-2.5-flash,gemini-2.5-flash-lite
GEMINI_TIMEOUT_MS=840000
GEMINI_MAX_OUTPUT_TOKENS=65535
```

## Local checks

```powershell
cd D:\GitHub\interface-sandbox\diligence-hunter-monolith
npm install
npm run check
npm start
```

Health:

```powershell
Invoke-RestMethod "http://localhost:8080/api/health" | ConvertTo-Json -Depth 50
```

Run:

```powershell
$body = @{
  source_mode = "url"
  target_url = "https://www.sarvam.ai"
  target_name = "Sarvam AI"
  debug_raw = $false
} | ConvertTo-Json -Depth 20

Invoke-RestMethod "http://localhost:8080/api/diligence/run" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body |
  ConvertTo-Json -Depth 100 |
  Set-Content ".\sarvam-hunter-result.json" -Encoding UTF8
```

## Deploy side-by-side

```powershell
cd D:\GitHub\interface-sandbox\diligence-hunter-monolith

gcloud run deploy interface-diligence-hunter `
  --source . `
  --region asia-south1 `
  --project direct-album-497808-f1 `
  --allow-unauthenticated `
  --port 8080 `
  --timeout 900 `
  --memory 2Gi
```

Then set flat key pool:

```powershell
gcloud run services update interface-diligence-hunter `
  --region asia-south1 `
  --project direct-album-497808-f1 `
  --set-env-vars "GEMINI_API_KEYS=KEY1,KEY2,KEY3,KEY4"
```

## Validation target

Health must show:

```text
mode: hunter_monolith_single_run
runtime_policy: single_grounded_monolith_call_no_external_source_bridge
model_policy: gemini_2_5_flash_then_gemini_2_5_flash_lite_only
key_env: GEMINI_API_KEYS
```
