# Lex Nova Runtime Build Status

Last updated: 2026-06-08

## Current source of truth

- Repository: `LexNovaHQ/interface-sandbox`
- Runtime package: `runtime-api/`
- Static wrapper/front-end remains separate from Cloud Run runtime execution.
- Cloud Run runtime is the server-side intelligence runtime for Gemini, source discovery, source capture, and the future diligence stage runner.

## Locked operating rule

Do not rebuild the old diligence chain. Port and reuse it.

The shortest path is:

1. Stabilize repo/deploy loop.
2. Harden source capture before public/frontend exposure.
3. Port old diligence stage runner to Cloud Run.
4. Adapt new source bundle into old Evidence Refiner input.
5. Execute Evidence Refiner, Target Feature Profile, Legal Stack Review, Registry Ledger, Operator Challenge, and Final Compiler in order.
6. Expose one backend endpoint: `POST /v1/diligence/run`.
7. Wire frontend only after the backend run is stable.

## Completed before this ledger

- Cloud Run runtime skeleton exists.
- Runtime token middleware exists.
- Gemini pool diagnostics exist.
- Gemini key/model rotation hardening exists.
- Source discovery route exists.
- Source capture route exists.
- Generated diligence bundles and smoke/audit scripts are committed.

## Build 0 — repo/deploy stabilization

Status: in progress.

Required files:

- `docs/runtime/BUILD_STATUS.md` — this ledger.
- `.github/workflows/runtime-api-deploy.yml` — deploy workflow.
- `runtime-api/scripts/smoke-runtime.mjs` — smoke test script.
- `runtime-api/package.json` scripts — check/smoke commands.

Required GitHub secrets/config:

- `GCP_PROJECT_ID`
- `GCP_REGION`
- `GCP_CLOUD_RUN_SERVICE`
- `GCP_SERVICE_ACCOUNT_KEY`
- `RUNTIME_ACCESS_TOKEN`
- `ALLOWED_ORIGIN`
- `GEMINI_SEARCH_API_KEYS`
- `GEMINI_JSON_API_KEYS`
- `GEMINI_REASONING_API_KEYS`
- `GEMINI_REGISTRY_API_KEYS`
- `GEMINI_SEARCH_MODEL_SEQUENCE`
- `GEMINI_JSON_MODEL_SEQUENCE`
- `GEMINI_REASONING_MODEL_SEQUENCE`
- `GEMINI_REGISTRY_MODEL_SEQUENCE`
- `GEMINI_FINAL_MODEL_SEQUENCE`

## Build A — source capture SSRF guard

Status: in progress.

Required hardening:

- Allow only `http:` and `https:` URLs.
- Block localhost and internal hostnames.
- Block private IPv4 ranges.
- Block link-local/metadata IPs.
- Block internal IPv6 ranges.
- Validate redirect targets before following redirects.
- Preserve existing lossless capture behavior.

## Open engineering work after Build 0 + A

- Runtime stage runner.
- Source bundle adapter.
- Evidence Refiner e2e.
- Target Feature Profile + Legal Stack Review.
- Registry port with all-row completeness.
- Operator Challenge + Final Compiler.
- `/v1/diligence/run` orchestrator.
- Frontend wiring.
- Storage/run persistence.
