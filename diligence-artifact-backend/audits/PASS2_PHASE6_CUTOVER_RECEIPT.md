# Pass 2 Receipt — Phase 6 Dispatcher Cutover

Branch: `phase1-8-central-runtime-integration`
Scope: Phase 6 dispatcher cutover only.

## Change Summary

Patched:

```txt
src/runtime/services/pipeline.service.js
```

The central runtime dispatcher now imports:

```txt
src/phases/06-activity-profile-forensics/activity-profile-forensics.runner.js
```

and dispatches:

```txt
M8_TARGET_FEATURE_PROFILE_FORENSICS
```

to:

```txt
runActivityProfileForensicsRuntimeJob(...)
```

which calls:

```txt
runActivityProfileForensicsPhase(...)
```

## What Changed

Before Pass 2:

```txt
M8_TARGET_FEATURE_PROFILE_FORENSICS
→ runDeterministicProfileForensicsJob(...)
→ root deterministic-profile-forensics.js generic helper path
```

After Pass 2:

```txt
M8_TARGET_FEATURE_PROFILE_FORENSICS
→ runActivityProfileForensicsRuntimeJob(...)
→ src/phases/06-activity-profile-forensics/activity-profile-forensics.runner.js
```

## What Did Not Change

This pass did not touch:

```txt
Phase 7 / Phase 8 DAP chain
M10 / M10_FORENSICS / 4B / 4C
artifact permissions
central phase contract
pipeline contract
agent packages
root helper migration
archive cleanup
post-Phase-8 phases
```

## Phase 1–6 Dispatcher Status After Pass 2

```txt
Phase 1 Source Discovery:
  AGENT_1A_URL_MANIFEST → phase-owned Source Discovery runner
  AGENT_1B_EXTRACT → phase-owned Source Discovery runner
  M6_BUCKET_INDEX → phase-owned Source Discovery runner

Phase 2 Legal Cartography and Index:
  M9 → central M9 hybrid runtime path, legal signal derivation phase-owned

Phase 3 Target Profile Review:
  M7_TARGET_PROFILE → phase-owned Target Profile Review runner

Phase 4 Target Profile Forensics:
  M7_TARGET_PROFILE_FORENSICS → phase-owned Target Profile Forensics runner

Phase 5 Activity Profile Review:
  M8_FEATURE_CANDIDATE_INVENTORY → phase-owned Activity Candidate Inventory runner
  M8_TARGET_FEATURE_PROFILE → phase-owned Activity Profile Review runner

Phase 6 Activity Profile Forensics:
  M8_TARGET_FEATURE_PROFILE_FORENSICS → phase-owned Activity Profile Forensics runner
```

## Remaining Temporary Bridges

The Phase 2–6 runners may still depend on root helper modules until the later helper-internalization pass:

```txt
m9-*.js
m7-validator.js
m8-*.js
deterministic-profile-forensics.js
```

Those are not to be archived yet.

## Next Pass

Next approved pass:

```txt
Pass 3 — Import Phase 7/8 product files from the donor branch.
```

No old DAP replacement should happen until Pass 3 and Pass 4.
