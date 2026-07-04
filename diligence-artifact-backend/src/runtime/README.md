# Central Runtime Tree

This directory is the new integrated runtime layer for the diligence backend.

Pass 1 rule: these files are additive and dormant. They do not replace, delete, or import-move the existing runtime entrypoints yet.

Pass 2 rule: runtime-owned config, provider, prompt, and storage services are now present. Production still does not switch to this tree until the explicit entrypoint migration pass.

## Runtime boundary

`src/runtime/` owns the application shell, routes, central services, config facade, provider/prompt services, storage services, and contracts. Product work belongs under `src/phases/`, not inside HTTP routes or top-level server files.

## Central phase rule

Central phases are named by product substance, not by legacy micro-phase labels. Existing micro-phases remain as internal jobs during migration.

## Current migration state

- Old production files remain untouched.
- `server.js`, `reviewer-routes.js`, `public-reviewer-routes.js`, and existing runners continue to govern production until explicitly switched.
- `src/runtime/config.js` is a working config copy. It reads environment variables only.
- `src/runtime/services/provider.service.js` owns Gemini provider logic for the central tree.
- `src/runtime/services/prompts.service.js` owns prompt/package/reference loading for the central tree.
- `src/runtime/services/storage/*` owns Google client, Drive, Firestore, and Sheets logic for the central tree.
- Gemini provider keys must never be committed. `GEMINI_API_KEYS` stays in Cloud Run/env/secret config.

## Target folders

```txt
src/runtime/
  app.js
  main.js
  config.js
  errors.js
  routes/
  services/
    provider.service.js
    prompts.service.js
    storage/
      google.service.js
      drive.service.js
      firestore.service.js
      sheets.service.js
  contracts/
```

## Remaining bridges

The central runtime still bridges to the existing async runner, normalized runner, artifact-service, schemas, auth, run-id, and permissions until those are migrated in later passes.

## Non-negotiable boundaries

1. Normalized compiler and Qualified Review are separate central phases.
2. Qualified Review may read normalized compiler artifacts but is not part of the compiler.
3. Diligence report UI and Qualified Review UI remain separate products with separate renderer payloads.
4. Assembly Engine is the next active product layer after Qualified Review Submission, not legacy.
5. Provider service code is allowed in repo. Provider secrets are not.
