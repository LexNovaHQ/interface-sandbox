# Pass 6.5 Receipt — Phase 1–8 Root Dependency Internalization

Branch: `phase1-8-central-runtime-integration`

## Scope

Internalize Phase 1–8 dependencies that were still living in root `src/*.js` files.

Post-Phase-8 runtime files were not rebuilt in this pass:

```txt
m11-orchestrator.js
m12-deterministic-challenge.js
compiler.js
report-renderer.js
```

Those remain post-Phase-8 bridge targets until Phase 9–11/renderer rebuild.

## Phase 2 — Legal Cartography Internalized

Created phase-owned M9 modules:

```txt
src/phases/02-legal-cartography-index/orchestrators/legal-cartography-hybrid.orchestrator.js
src/phases/02-legal-cartography-index/services/legal-cartography-deterministic-map.builder.js
src/phases/02-legal-cartography-index/services/legal-cartography-hybrid-compiler.js
src/phases/02-legal-cartography-index/validators/legal-cartography-index.validator.js
src/phases/02-legal-cartography-index/validators/legal-cartography-semantic-profile.validator.js
```

Updated:

```txt
src/phases/02-legal-cartography-index/legal-cartography-index.runner.js
```

to import the phase-owned M9 orchestrator.

Old M9 root files were converted into compatibility shims pointing to phase-owned modules:

```txt
src/m9-hybrid-orchestrator.js
src/m9-deterministic-map.js
src/m9-semantic-profile-validator.js
src/m9-hybrid-compiler.js
src/m9-hybrid-compiler-v2.js
src/m9-validator.js
src/m9-normalizer.js
```

The old M10 wording in active M9 deterministic logic was removed. Active Phase 2 now references:

```txt
ACTIVITY_PROFILE_REVIEW_AND_DATA_PROVENANCE_PROFILE
phase7_data_provenance_is_active_dap_source
m10_4b_4c_not_active
```

## Phase 3 — Target Profile Review Validator Internalized

Created:

```txt
src/phases/03-target-profile-review/validators/target-profile-review.validator.js
```

Updated:

```txt
src/phases/03-target-profile-review/target-profile-review.runner.js
```

to import the phase-owned validator.

Converted root shim:

```txt
src/m7-validator.js
```

## Phase 4 and Phase 6 — Deterministic Forensics Internalized

Created:

```txt
src/phases/_shared/forensics/profile-forensics.shared.js
```

Updated:

```txt
src/phases/04-target-profile-forensics/target-profile-forensics.runner.js
src/phases/06-activity-profile-forensics/activity-profile-forensics.runner.js
```

to import phase-owned deterministic forensics builders.

Converted root shim:

```txt
src/deterministic-profile-forensics.js
```

The old M10 deterministic forensic builder and `M10_DETERMINISTIC_FORENSIC_TRACE_CONTRACT_V1` are no longer present in the root file.

## Phase 5 — Activity Candidate Inventory / Activity Profile Review Internalized

Created:

```txt
src/phases/05-activity-profile-review/services/activity-candidate-inventory.boundary.js
src/phases/05-activity-profile-review/services/activity-candidate-inventory-index.builder.js
src/phases/05-activity-profile-review/validators/activity-profile-review.validator.js
```

Updated:

```txt
src/phases/05-activity-profile-review/activity-candidate-inventory.runner.js
src/phases/05-activity-profile-review/activity-profile-review.runner.js
src/phases/05-activity-profile-review/activity-candidate-inventory.contract.js
```

to point to phase-owned modules.

Converted root shims:

```txt
src/m8-feature-candidate-index-boundary.js
src/m8-feature-candidate-inventory-index.js
src/m8-feature-candidate-inventory.js
src/m8-validator.js
```

## Current Remaining Boundary

`pipeline.service.js` still has direct root imports for M9/M7/M8 names, but those root files are now compatibility shims into phase-owned modules, not old logic.

Direct root import removal from `pipeline.service.js` is still required before a strict validator can enforce `NO_PHASE1_8_ROOT_IMPORTS`.

`artifacts.service.js` still imports `../../deterministic-profile-forensics.js`, but that file is now a shim into phase-owned shared forensics. Direct import removal is still required before strict root-import validation.

## Validation Status

GitHub-side patching only. Local `npm run check` has not been run.

## Next Required Step

Before Pass 7 validators, run one small direct-import cleanup pass:

```txt
Pass 6.6 — Replace root shim imports in pipeline.service.js and artifacts.service.js with phase-owned imports.
```

Then Pass 7 validators can enforce:

```txt
no active Phase 1–8 runtime import from root m7/m8/m9/deterministic-profile-forensics files
no M10/4B/4C active artifact chain
Phase 1–8 dispatch/contract/artifact consistency
```
