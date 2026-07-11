# Retired Root Reviewer Runtime

This directory preserves the implementation files removed from `diligence-artifact-backend/src/` during the central-runtime cleanup.

## Retirement boundary

- Production entrypoint: `diligence-artifact-backend/src/runtime/main.js`
- Pipeline authority: `src/runtime/services/pipeline.service.js`
- Async/Cloud Tasks authority: `src/runtime/services/async.service.js`
- Prompt authority: `src/runtime/services/prompts.service.js`
- Reference authority: `src/runtime/services/reference.service.js`
- Provider authority: `src/runtime/services/provider.service.js`
- Storage authority: `src/runtime/services/storage/*`
- Artifact/permission authority: `src/runtime/services/artifacts.service.js` and `src/runtime/contracts/artifact-permissions.contract.js`
- Public API authority: `src/runtime/routes/public.routes.js`

## Archived implementation classes

- Reviewer runners and routes
- Legacy Cloud Tasks dispatcher
- Duplicate prompt/provider/reference implementations
- Duplicate Firestore, Sheets, Drive and Google client implementations
- Duplicate artifact service and request schemas
- Retired lossless-family document uploader
- Pre-central Qualified Review submission service

Files in this archive are historical evidence only. Production code, tests and scripts must not import from `archive-legacy`.
