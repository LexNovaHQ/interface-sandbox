# Archive Legacy — Non-Runtime Material

This directory is an archive only.

Nothing under `archive-legacy/` is part of the active Interface Diligence Engine runtime, public report renderer, qualified-review flow, Cloud Run artifact backend, or deploy path.

## Active runtime source of truth

The active backend is:

```text
diligence-artifact-backend/
```

The active public report path is:

```text
NORMALIZED_COMPILER -> RENDERER -> renderer_payload.sections[] -> public/interface-diligence/diligence-system/report.js
```

The active renderer files are:

```text
diligence-artifact-backend/src/report-renderer.js
diligence-artifact-backend/public/interface-diligence/diligence-system/report.js
```

## Archive rule

Archived files may contain old terms such as `legacy`, `fallback`, `Vault`, `Download JSON`, old renderer implementations, old servers, or old stage contracts. Those terms are retained only for historical reconstruction.

They must not be imported, copied, re-exported, or used as fallback logic by active code.

## Import rule

Active code must not import from:

```text
archive-legacy/
diligence-artifact-backend/archive/
```

If archived material is needed, it must be manually reviewed and rewritten into the current normalized-compiler architecture. Do not revive archived runtime paths directly.
