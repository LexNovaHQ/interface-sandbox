# Legacy Runtime Cleanup

## Status

The central-runtime cleanup was applied on `domain-gate-v0-preflight` without changing the production entrypoint or merging to `main`.

Production boots only:

```text
node src/runtime/main.js
```

## Active authorities

| Responsibility | Active authority |
|---|---|
| Application boot and mounted routes | `src/runtime/main.js`, `src/runtime/app.js` |
| Pipeline dispatch | `src/runtime/services/pipeline.service.js` |
| Async worker and Cloud Tasks | `src/runtime/services/async.service.js` |
| Prompt assembly | `src/runtime/services/prompts.service.js` |
| Reference loading | `src/runtime/services/reference.service.js` |
| Model provider | `src/runtime/services/provider.service.js` |
| Artifact persistence and lock gates | `src/runtime/services/artifacts.service.js` |
| Firestore, Sheets, Drive and Google clients | `src/runtime/services/storage/*` |
| Public diligence API | `src/runtime/routes/public.routes.js` |
| Exposure Profile / M11 | `src/phases/10-exposure-profile/*` |
| Operator Challenge / M12 | `src/phases/11-operator-challenge/*` |
| Normalized Compiler | `src/phases/12-normalized-compiler/*` |
| Public report renderer | `src/runtime/services/reporting/report-renderer.service.js` |
| Qualified Review submission | `src/runtime/services/qualified-review-submission.service.js` |

## Archived implementation stack

The retired root reviewer implementation is preserved at:

```text
archive-legacy/diligence-artifact-backend/retired-root-src-runtime/
```

The archive contains the old reviewer runners, routes, Cloud Tasks dispatcher, prompt/provider/reference implementations, duplicate storage services, duplicate artifact service, old schemas and permissions, the lossless-family document uploader, and the previous Qualified Review submission service.

Production code and validation scripts must not import from `archive-legacy`.

## Compatibility bridge boundary

Several historical root filenames remain temporarily as logic-free compatibility re-exports. They contain no independent runtime implementation. They exist only because some older checks and compatibility consumers still refer to the historical paths.

The permanent firewall `scripts/check-central-runtime-no-legacy-implementation.mjs` fails if any targeted bridge regains implementation logic or if an active file imports from the archive.

A later deletion pass may remove these bridges after every historical consumer is retargeted. Their presence does not create a second runtime stack.

## Reference loading

There is one reference-loading implementation:

```text
src/runtime/services/reference.service.js
```

It supports:

- `references/registry/*`
- `references/domain-packages/*`
- bare registry filenames
- traversal fencing

`src/reference-loader.js` is a compatibility re-export only.

## M11 evidence correction

The active M11 evidence resolver no longer reads `lossless_family__*` artifacts and does not describe lossless evidence as fallback.

It navigates the Phase 2G 2F route through the legal indexes into routed primary evidence consisting of current `lossless_root__*` artifacts, their shards, and admitted `legal_doc_*` artifacts. Index gaps are recorded as navigation limitations inside the same routed primary-evidence bucket.

## Public API migration

The mounted central public router now owns URL-run creation, polling, asynchronous advancement, report retrieval, technical annexure retrieval, Qualified Review retrieval, and Qualified Review submission.

Uploaded-document intake remains intentionally fenced with:

```text
DOCUMENT_UPLOAD_17_ROOT_CUTOVER_REQUIRED
```

The retired uploader emitted `lossless_family__*` artifacts and was therefore not copied into the central runtime. Document upload must be rebuilt against the active 17-root Source Discovery contract before reactivation.

## Validation commands

```text
npm run check:runtime-cleanup
npm run check
```

The cleanup suite covers:

- M11 central-service dependencies
- mounted central public API
- Phase 9 ownership and 2F evidence rules
- Phase 10 ownership
- Phase 11 ownership
- renderer ownership
- permanent no-second-runtime firewall

Remote structural verification does not replace executing these commands in a checked-out repository.
