# Cleanup Manifest — 2026-07-03

## Scope

This cleanup moved retired diligence-artifact-backend root notes into `archive-legacy/diligence-artifact-backend/` and hardened renderer-control checks.

## Archived from active backend root

- `diligence-artifact-backend/LEGACY_RENDERER_ARCHIVE.md` → `archive-legacy/diligence-artifact-backend/LEGACY_RENDERER_ARCHIVE.md`
- `diligence-artifact-backend/LEGACY_COMPILER_ARCHIVE.md` → `archive-legacy/diligence-artifact-backend/LEGACY_COMPILER_ARCHIVE.md`
- `diligence-artifact-backend/NORMALIZED_PROFILER_PATCH_NOTES.md` → `archive-legacy/diligence-artifact-backend/NORMALIZED_PROFILER_PATCH_NOTES.md`

## Active patches

- `.github/workflows/operator-renderer-reset.yml`
  - verifies regenerated renderer output through the backend report endpoint
  - asserts normalized renderer source, 10 sections, report shell title, and no legacy payload leak

- `diligence-artifact-backend/scripts/check-normalized-pipeline-contract.mjs`
  - asserts `RENDERER` writes `renderer_payload`
  - asserts renderer phase write permission remains exactly `renderer_payload`
  - asserts every phase write has both actor-level and phase-level permission coverage

## Non-goals

No changes were made to:

- 4B DAP substance
- 4C integrated DAP
- M10
- M11/M12
- normalized section substance
- public report UI layout
- Qualified Review matrix
