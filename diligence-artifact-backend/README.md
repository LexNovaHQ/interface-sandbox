# Interface Diligence Artifacts Backend

Runtime backend for the LexNova Interface Diligence Engine.

This service is no longer documented as a passive Custom GPT artifact store. The current architecture is a central runtime pipeline that owns run state, artifact persistence, phase dispatch, artifact gatekeeping, provider calls for model-backed phases, deterministic phase runners, and report/renderer handoff boundaries.

## Current documented state

Branch:

```text
phase1-8-central-runtime-integration
```

Last locally validated Phase 1-8 baseline before production-hardening documentation/permission patches:

```text
f8b6614c614a4712d86beb6a68cb54014022184c
```

Local validation completed for Phase 1-8 only at that baseline:

```text
npm run check:phase1-8-runtime  # PASS, exit code 0
npm run check:syntax            # PASS, exit code 0
```

After pulling any newer production-hardening commits on this branch, rerun the Phase 1-8 validation commands in this README. The full normalized/compiler/renderer validation path is intentionally outside this Phase 1-8 pass. Do not treat `npm run check:normalized` or full `npm run check` as a Phase 1-8 acceptance gate until Phase 9+ / compiler / renderer work is in scope.

## Scope boundary

This README documents the runtime state through Phase 8 only.

In scope:

```text
Phase 1  Source Discovery
Phase 2  Legal Cartography and Index
Phase 3  Target Profile Review
Phase 4  Target Profile Forensics
Phase 5  Activity Profile Review
Phase 6  Activity Profile Forensics
Phase 7  Data Provenance Profile
Phase 8  Data Provenance Forensics
```

Out of scope for this pass:

```text
Phase 9   Exposure Profile / M11
Phase 10  Operator Challenge / M12
Phase 11  Normalized Compiler
Phase 12  Qualified Review
Report renderer
Assembly Engine
Full npm check hardening
```

The post-Phase-8 root bridges are intentionally retained until those phases are rebuilt:

```text
src/m11-orchestrator.js
src/m12-deterministic-challenge.js
src/compiler.js
src/report-renderer.js
```

## Active Phase 1-8 pipeline chain

The active central runtime chain through Phase 8 is:

```text
AGENT_1A_URL_MANIFEST
  -> AGENT_1B_EXTRACT
  -> M6_BUCKET_INDEX
  -> M9
  -> M7_TARGET_PROFILE
  -> M7_TARGET_PROFILE_FORENSICS
  -> M8_FEATURE_CANDIDATE_INVENTORY
  -> M8_TARGET_FEATURE_PROFILE
  -> M8_TARGET_FEATURE_PROFILE_FORENSICS
  -> DATA_PROVENANCE_PROFILE_LAYER4
  -> DATA_PROVENANCE_PROFILE_LAYER5
  -> DATA_PROVENANCE_PROFILE_FORENSICS
  -> M11
```

The Phase 8 handoff to `M11` is only a boundary handoff in this pass. M11 itself remains outside the Phase 1-8 validation scope.

## Runtime services

Primary runtime services:

```text
src/runtime/services/pipeline.service.js
src/runtime/services/artifacts.service.js
```

Primary runtime contracts:

```text
src/runtime/contracts/pipeline.contract.js
src/runtime/contracts/central-phase.contract.js
src/runtime/contracts/artifact-permissions.contract.js
src/runtime/contracts/artifacts.contract.js
```

The runtime uses central phase labels for public/product-facing status while retaining compatibility internal job IDs for backend execution.

## Phase-owned runtime folders

Phase 1-8 active logic is now phase-owned:

```text
src/phases/01-source-discovery/
src/phases/02-legal-cartography-index/
src/phases/03-target-profile-review/
src/phases/04-target-profile-forensics/
src/phases/05-activity-profile-review/
src/phases/06-activity-profile-forensics/
src/phases/07-data-provenance-profile/
src/phases/08-data-provenance-forensics/
src/phases/_shared/forensics/
```

Old root helpers for Phase 1-8 are not active pipeline dependencies. They remain only as compatibility shims where still present.

Examples:

```text
src/m7-validator.js
  -> re-exports src/phases/03-target-profile-review/validators/target-profile-review.validator.js

src/m8-validator.js
  -> re-exports src/phases/05-activity-profile-review/validators/activity-profile-review.validator.js

src/m9-hybrid-orchestrator.js
  -> re-exports src/phases/02-legal-cartography-index/orchestrators/legal-cartography-hybrid.orchestrator.js

src/deterministic-profile-forensics.js
  -> re-exports src/phases/_shared/forensics/profile-forensics.shared.js
```

The active Phase 1-8 runtime must not import those old root helpers.

## Retired active DAP chain

The old active DAP chain is retired from the Phase 1-8 runtime:

```text
M10
M10_FORENSICS
AGENT_4B_EXTENDED_DAP_INDIA_READINESS
AGENT_4C_INTEGRATED_DAP_REPORT
m10_selected_legal_support_packet
extended_dap_india_readiness_profile
integrated_dap_report
data_provenance_profile
data_provenance_profile_forensics
```

Those names may exist only as archived legacy names or historical references. They must not be active pipeline reads, writes, dispatcher branches, artifact service gates, or active permissions for Phase 1-8.

## Phase 7 current architecture

Phase 7 is now the active Data Provenance Profile system.

It is split into two jobs:

```text
DATA_PROVENANCE_PROFILE_LAYER4
DATA_PROVENANCE_PROFILE_LAYER5
```

Layer 4 writes:

```text
dap_registry_manifest
dap_strategic_derivation_matrix
data_privacy_navigation_index
dap_semantic_batch_route_manifest
17 dap_semantic_batch_*_artifact files
17 dap_semantic_batch_validation__DAP-SEM-BATCH-xx files
```

Layer 5 writes:

```text
dap_semantic_batch_validation_manifest
data_provenance_profile_semantic_batch_gate
```

Layer 4 reads the approved Phase 7 input universe only. It reads D-family data sources fully and legal support selectively through:

```text
legal_cartography_index
legal_signal_derivation_profile
```

It must not free-read the full legal governance family.

Layer 5 explicitly reads:

```text
dap_semantic_batch_route_manifest
17 DAP semantic batch artifacts
17 paired DAP semantic batch validation artifacts
```

## Phase 7 permission boundary

`agent_4_data_privacy` may read D-family artifacts and selected legal support only:

```text
legal_cartography_index
legal_signal_derivation_profile
lossless_family__D1_SECURITY_TRUST
lossless_family__D2_SUBPROCESSOR_PRIVACY_CENTER
lossless_family__D3_DATA_GOVERNANCE_CONTROLS
lossless_family__D4_DOCS_API_DATA_FLOW
lossless_family__D5_AI_SAFETY_TRANSPARENCY
```

It must not receive blanket read permission to the legal governance family:

```text
lossless_family__L1_CORE_TERMS_PRIVACY
lossless_family__L2_B2B_CONTRACTING
lossless_family__L3_AI_USAGE_GOVERNANCE
lossless_family__L4_PRIVACY_ADJACENT_NOTICES
lossless_family__L5_LEGAL_HUB_HOSTED
lossless_family__L6_ENTITY_NOTICE
```

This is enforced by the Phase 1-8 runtime validator.

## Phase 8 current architecture

Phase 8 writes:

```text
dap_forensics_profile
```

Phase 8 reads the locked Phase 7 profile artifacts:

```text
data_privacy_navigation_index
dap_semantic_batch_route_manifest
17 DAP semantic batch artifacts
dap_semantic_batch_validation_manifest
data_provenance_profile_semantic_batch_gate
```

Phase 8 does not directly read each paired DAP batch validation artifact. The paired validation artifacts are enforced upstream by the artifact service before Layer 5 and before Phase 8 can lock. Phase 8 consumes the resulting validation manifest and semantic batch gate.

The DAP forensic contract requires deterministic, non-model-generated trace discipline and explicitly rejects old M10 / 4B / 4C reuse.

## Artifact gate chain through Phase 8

The artifact service enforces this save/lock order through Phase 8:

```text
deduped_url_manifest
  -> source_family_index
  -> source_discovery_handoff
  -> legal_cartography_index
  -> legal_signal_derivation_profile
  -> target_profile
  -> target_profile_forensics
  -> feature_candidate_inventory
  -> target_feature_profile
  -> target_feature_profile_forensics
  -> dap_registry_manifest
  -> dap_strategic_derivation_matrix
  -> data_privacy_navigation_index
  -> dap_semantic_batch_route_manifest
  -> paired DAP batch validations
  -> paired DAP batch artifacts
  -> dap_semantic_batch_validation_manifest
  -> data_provenance_profile_semantic_batch_gate
  -> dap_forensics_profile
  -> exposure_registry_route_plan
```

`exposure_registry_route_plan` is the Phase 8 boundary handoff to the post-Phase-8 exposure system.

## Blocking policy

Blocking is the exception, not the default.

Non-critical coverage, support, limitation, thin-source, missing-proof, or controlled-field issues should resolve to:

```text
LOCKED_WITH_LIMITATIONS
```

Only structurally unusable artifacts, missing mandatory upstream artifacts, active legacy contamination, forbidden root imports, or schema-breaking output should block advancement.

## Phase 1-8 hard validator

The Phase 1-8 validator is:

```text
scripts/check-phase1-8-central-runtime.mjs
```

Run it with:

```powershell
npm run check:phase1-8-runtime
```

It enforces:

```text
NO_PHASE1_8_ROOT_IMPORTS
POST_PHASE8_ROOT_BRIDGES_EXPLICIT_ONLY
NO_M10_4B_4C_ACTIVE_CHAIN
PHASE7_READ_CONTRACT_SYNC
PHASE7_LAYER5_VALIDATION_READ_SYNC
PHASE1_8_DISPATCH_CONTRACT_ARTIFACT_SYNC
PHASE7_DATA_PROVENANCE_PERMISSION_BOUNDARY
BLOCKING_IS_EXCEPTION_LIMITATION_POLICY
```

The validator scans active runtime services and `src/phases/**` for forbidden Phase 1-8 root helper imports, verifies the Phase 1-8 pipeline chain, verifies Phase 7 read contract alignment, verifies the Layer 5 17-batch / 17-validation contract, verifies legacy DAP removal, verifies permissions, verifies the data-provenance legal-read boundary, and verifies the limitation-pass policy.

## Local validation discipline

For Phase 1-8-only work, use this order:

```powershell
git status --short
git branch --show-current
git log --oneline -5
npm run check:phase1-8-runtime
$LASTEXITCODE
npm run check:syntax
$LASTEXITCODE
```

Do not run these as Phase 1-8 acceptance gates:

```powershell
npm run check:normalized
npm run check
```

Those commands include compiler/renderer/post-Phase-8 checks and may fail for reasons outside the Phase 1-8 runtime boundary.

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
Cloud Tasks API
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

Provider/model runtime variables are configured separately in deployment secrets. Do not hardcode provider keys in this repository.

## Local run

```powershell
cd D:\LexNova-Pass9F-Test\interface-sandbox\diligence-artifact-backend
npm install
npm run check:phase1-8-runtime
npm run check:syntax
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

Fetch artifact:

```powershell
Invoke-RestMethod "http://localhost:8080/v1/artifacts/LN-.../source_discovery_handoff?agent_id=agent_2_target_feature" -Headers $headers
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

## Current operator rule

Do not merge this branch to `main` merely because Phase 1-8 passes. Phase 1-8 is validated as a bounded runtime cutover. Post-Phase-8 compiler/renderer/QR work remains intentionally outside this pass.
