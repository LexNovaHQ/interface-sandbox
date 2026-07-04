# Central Runtime Tree

This directory is the new integrated runtime layer for the diligence backend.

Pass 1 rule: these files are additive and dormant. They do not replace, delete, or import-move the existing runtime entrypoints yet.

Pass 2 rule: runtime-owned config, provider, prompt, and storage services are now present. Production still does not switch to this tree until the explicit entrypoint migration pass.

Pass 3 rule: async runner and Cloud Tasks dispatch logic are runtime-owned in `src/runtime/services/async.service.js`.

Pass 4 rule: pipeline advancement is runtime-owned in `src/runtime/services/pipeline.service.js`. The runtime surface uses central phase language. Compatibility internal job IDs are retained only where the existing artifact permission layer still requires them.

Pass 5 rule: artifact save/read/lock logic is runtime-owned in `src/runtime/services/artifacts.service.js`. The service is central-phase aware while still respecting compatibility artifact permissions and save-order gates.

Pass 6 rule: runtime auth, request schemas, and run-id utilities are now runtime-owned. Runtime app/routes/services should not import old `auth.js`, `schemas.js`, or `run-id.js`.

## Runtime boundary

`src/runtime/` owns the application shell, routes, central services, config facade, provider/prompt services, storage services, async runner, central pipeline dispatcher, artifact service, auth, runtime request schemas, run-id utilities, and contracts. Product work belongs under `src/phases/`, not inside HTTP routes or top-level server files.

## Central phase rule

Central phases are named by product substance, not by legacy micro-phase labels. Existing micro-phases remain as internal job IDs during migration and must not be used as the public runtime architecture.

## Current migration state

- Old production files remain untouched.
- `server.js`, `reviewer-routes.js`, `public-reviewer-routes.js`, and existing runners continue to govern production until explicitly switched.
- `src/runtime/config.js` is a working config copy. It reads environment variables only.
- `src/runtime/auth.js` owns central runtime API-key auth.
- `src/runtime/contracts/schemas.contract.js` owns central runtime request validation.
- `src/runtime/utils/run-id.js` owns central runtime run-id creation/validation/time helpers.
- `src/runtime/services/provider.service.js` owns Gemini provider logic for the central tree.
- `src/runtime/services/prompts.service.js` owns prompt/package/reference loading for the central tree.
- `src/runtime/services/storage/*` owns Google client, Drive, Firestore, and Sheets logic for the central tree.
- `src/runtime/services/async.service.js` owns queueing, worker lifecycle, stale handling, retry scheduling, and Cloud Tasks dispatch.
- `src/runtime/services/pipeline.service.js` owns central phase dispatch and no longer imports the old normalized/legacy runner files.
- `src/runtime/services/artifacts.service.js` owns artifact save/read/lock logic and no longer imports the old artifact service.
- Gemini provider keys must never be committed. `GEMINI_API_KEYS` stays in Cloud Run/env/secret config.

## Target folders

```txt
src/runtime/
  app.js
  main.js
  auth.js
  config.js
  errors.js
  routes/
  services/
    artifacts.service.js
    async.service.js
    pipeline.service.js
    provider.service.js
    prompts.service.js
    storage/
      google.service.js
      drive.service.js
      firestore.service.js
      sheets.service.js
  contracts/
    schemas.contract.js
  utils/
    run-id.js
```

## Remaining bridges

The central runtime still uses existing permissions, constants, and specialist phase helper/orchestrator modules until those are migrated in later passes.

## Non-negotiable boundaries

1. Normalized compiler and Qualified Review are separate central phases.
2. Qualified Review may read normalized compiler artifacts but is not part of the compiler.
3. Diligence report UI and Qualified Review UI remain separate products with separate renderer payloads.
4. Assembly Engine is the next active product layer after Qualified Review Submission, not legacy.
5. Provider service code is allowed in repo. Provider secrets are not.
