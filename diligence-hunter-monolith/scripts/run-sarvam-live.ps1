$URL = "https://interface-diligence-hunter-461673097382.asia-south1.run.app"
$body = @{
  source_mode = "url"
  target_url = "https://www.sarvam.ai"
  target_name = "Sarvam AI"
  debug_raw = $false
} | ConvertTo-Json -Depth 20

Write-Host "Starting Hunter monolith run..."
Invoke-RestMethod "$URL/api/diligence/run" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body |
  ConvertTo-Json -Depth 100 |
  Set-Content ".\sarvam-hunter-result.json" -Encoding UTF8
Write-Host "Saved .\sarvam-hunter-result.json"
