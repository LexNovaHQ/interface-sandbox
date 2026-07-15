# Pass 6.6 Receipt — Direct Root Import Removal

Branch: `phase1-8-central-runtime-integration`

## Scope

Replace direct Phase 1–8 root shim imports in:

```txt
src/runtime/services/pipeline.service.js
src/runtime/services/artifacts.service.js
```

This pass does not rebuild post-Phase-8 runtime:

```txt
m11-orchestrator.js
m12-deterministic-challenge.js
compiler.js
report-renderer.js
```

Those remain explicit post-Phase-8 bridges until Phase 9–11/renderer rebuild.

## Pipeline Service Updated

Updated:

```txt
src/runtime/services/pipeline.service.js
```

Removed direct imports from:

```txt
../../m9-validator.js
../../m7-validator.js
../../m8-validator.js
../../m9-hybrid-orchestrator.js
```

Replaced with phase-owned imports:

```txt
../../phases/02-legal-cartography-index/validators/legal-cartography-index.validator.js
../../phases/02-legal-cartography-index/orchestrators/legal-cartography-hybrid.orchestrator.js
../../phases/03-target-profile-review/validators/target-profile-review.validator.js
../../phases/05-activity-profile-review/validators/activity-profile-review.validator.js
```

Post-Phase-8 root imports intentionally remain:

```txt
../../m11-orchestrator.js
../../m12-deterministic-challenge.js
../../compiler.js
../../report-renderer.js
```

## Artifact Service Updated

Updated:

```txt
src/runtime/services/artifacts.service.js
```

Removed direct import from:

```txt
../../deterministic-profile-forensics.js
```

Replaced with phase-owned import:

```txt
../../phases/_shared/forensics/profile-forensics.shared.js
```

## Status Flags

`pipeline.service.js` now declares:

```txt
phase1_8_root_shim_imports_removed: true
```

`artifacts.service.js` now declares:

```txt
phase1_8_root_forensics_import_removed: true
```

## Validation Status

GitHub-side surgery only.

Local `npm run check` has not been run.

Next pass can now add strict validators for:

```txt
NO_PHASE1_8_ROOT_IMPORTS
NO_M10_4B_4C_ACTIVE_CHAIN
PHASE1_8_CONTRACT_DISPATCH_ARTIFACT_SYNC
```
