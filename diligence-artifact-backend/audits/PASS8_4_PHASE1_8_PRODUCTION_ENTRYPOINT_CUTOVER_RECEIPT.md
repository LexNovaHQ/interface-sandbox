# PASS 8.4 — Phase 1-8 Production Entrypoint Cutover Receipt

## Scope

This receipt records the production-entrypoint surgery applied on branch:

```text
phase1-8-central-runtime-integration
```

The purpose was to close the active-runtime leak where `npm start` still booted the retired `server.js` reviewer-runner stack instead of the central Phase 1-8 runtime.

## Surgical changes applied

### 1. Production start command cut over

`package.json` now boots:

```text
node src/runtime/main.js
```

This makes the central runtime app the default production entrypoint.

### 2. Legacy `server.js` retired from active routing

`server.js` is now a compatibility shell only. It imports and starts `startRuntimeServer()` from:

```text
src/runtime/main.js
```

The old Express app, legacy reviewer routes, public reviewer routes, Agent 3 manual routes, artifact save routes, and M10 lock route have been removed from the active `server.js` entrypoint.

### 3. Validator gates added

`check-phase1-8-central-runtime.mjs` now enforces:

```text
PACKAGE_STARTS_CENTRAL_RUNTIME
SERVER_JS_DELEGATES_TO_CENTRAL_RUNTIME
NO_ACTIVE_LEGACY_REVIEWER_ADVANCE
NO_AGENT3_M10_LOCK_ROUTE
OLD_PHASE_CONTRACTS_NOT_RUNTIME_ACTIVE
```

These gates sit beside the existing Phase 1-8 gates for:

```text
NO_PHASE1_8_ROOT_IMPORTS
POST_PHASE8_ROOT_BRIDGES_EXPLICIT_ONLY
NO_M10_4B_4C_ACTIVE_CHAIN
PHASE7_READ_CONTRACT_SYNC
PHASE7_LAYER5_VALIDATION_READ_SYNC
PHASE7_AGENT_PACKAGE_PROMPT_WIRING_SYNC
PHASE1_8_DISPATCH_CONTRACT_ARTIFACT_SYNC
PHASE7_DATA_PROVENANCE_PERMISSION_BOUNDARY
BLOCKING_IS_EXCEPTION_LIMITATION_POLICY
```

### 4. README updated

`README.md` now documents the central runtime production entrypoint lock and warns that `server.js` is compatibility-only.

## Files changed

```text
package.json
server.js
scripts/check-phase1-8-central-runtime.mjs
README.md
audits/PASS8_4_PHASE1_8_PRODUCTION_ENTRYPOINT_CUTOVER_RECEIPT.md
```

## Known boundary

This pass remains Phase 1-8 only.

Out of scope:

```text
M11 / Exposure Profile
M12 / Operator Challenge
Normalized Compiler
Qualified Review
Renderer
Assembly Engine
Full npm check hardening
```

## Required local verification

Run from `diligence-artifact-backend` after pulling this branch:

```text
node --check server.js
node --check src/runtime/main.js
node --check scripts/check-phase1-8-central-runtime.mjs
npm run check:syntax
npm run check:phase1-8-runtime
```

Full `npm run check` is still not the acceptance gate for this pass because normalized/compiler/renderer are outside the Phase 1-8 boundary.

## Result

The production entrypoint leak is surgically closed at source and now guarded by the Phase 1-8 runtime validator.
