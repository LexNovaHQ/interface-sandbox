# Central Runtime Tree

This directory is the new integrated runtime layer for the diligence backend.

Pass 1 rule: these files are additive and dormant. They do not replace, delete, or import-move the existing runtime entrypoints yet.

## Runtime boundary

`src/runtime/` owns the application shell, routes, central services, and contracts. Product work belongs under `src/phases/`, not inside HTTP routes or top-level server files.

## Central phase rule

Central phases are named by product substance, not by legacy micro-phase labels. Existing micro-phases remain as internal jobs during migration.

## Current migration state

- Old runtime files remain untouched.
- `server.js`, `reviewer-routes.js`, `public-reviewer-routes.js`, and existing runners continue to govern production until explicitly switched.
- This tree is the target structure for the next migration passes.

## Target folders

```txt
src/runtime/
  app.js
  main.js
  errors.js
  routes/
  services/
  contracts/
```

## Non-negotiable boundaries

1. Normalized compiler and Qualified Review are separate central phases.
2. Qualified Review may read normalized compiler artifacts but is not part of the compiler.
3. Diligence report UI and Qualified Review UI remain separate products with separate renderer payloads.
4. Assembly Engine is the next active product layer after Qualified Review Submission, not legacy.
