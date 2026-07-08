# Pass 7 Receipt — Phase 1–8 Central Runtime Validators

Branch: `phase1-8-central-runtime-integration`

## Scope

Added hard validators for the Phase 1–8 central runtime cutover.

This pass adds validation only. It does not archive root shims and does not rebuild Phase 9+.

## File Added

```txt
scripts/check-phase1-8-central-runtime.mjs
```

## Package Script Updated

Updated:

```txt
package.json
```

`npm run check` now includes:

```txt
node scripts/check-phase1-8-central-runtime.mjs
```

A direct script was also added:

```txt
npm run check:phase1-8-runtime
```

## Validator Gates

The validator enforces:

```txt
NO_PHASE1_8_ROOT_IMPORTS
POST_PHASE8_ROOT_BRIDGES_EXPLICIT_ONLY
NO_M10_4B_4C_ACTIVE_CHAIN
PHASE7_READ_CONTRACT_SYNC
PHASE7_LAYER5_VALIDATION_READ_SYNC
PHASE1_8_DISPATCH_CONTRACT_ARTIFACT_SYNC
BLOCKING_IS_EXCEPTION_LIMITATION_POLICY
```

## Gate Details

### NO_PHASE1_8_ROOT_IMPORTS

Scans active runtime service files and all phase files for direct imports from old Phase 1–8 root bridge files:

```txt
m7-validator.js
m8-validator.js
m8-feature-candidate-inventory-index.js
m8-feature-candidate-inventory.js
m8-feature-candidate-index-boundary.js
m9-validator.js
m9-normalizer.js
m9-hybrid-orchestrator.js
m9-deterministic-map.js
m9-semantic-profile-validator.js
m9-hybrid-compiler.js
m9-hybrid-compiler-v2.js
deterministic-profile-forensics.js
```

### POST_PHASE8_ROOT_BRIDGES_EXPLICIT_ONLY

Allows only the declared post-Phase-8 bridges in `pipeline.service.js`:

```txt
m11-orchestrator.js
m12-deterministic-challenge.js
compiler.js
report-renderer.js
```

Any other unexpected root import fails the validator.

### NO_M10_4B_4C_ACTIVE_CHAIN

Fails if active pipeline contracts, central phase contracts, or artifact service include active references to:

```txt
AGENT_4B_EXTENDED_DAP_INDIA_READINESS
AGENT_4C_INTEGRATED_DAP_REPORT
M10_FORENSICS
M10_SELECTED_LEGAL_SUPPORT
```

Also confirms old DAP artifacts are not in active `ARTIFACT_NAMES` and remain only in `ARCHIVED_LEGACY_ARTIFACT_NAMES`.

### PHASE7_READ_CONTRACT_SYNC

Requires Phase 7 Layer 4 reads to exactly match the Phase 7 approved input universe:

```txt
source_discovery_handoff
legal_cartography_index
legal_signal_derivation_profile
target_profile
target_profile_forensics
feature_candidate_inventory
target_feature_profile
target_feature_profile_forensics
D1-D5 data provenance families
```

It fails if Phase 7 Layer 4 free-reads L-family legal governance artifacts.

### PHASE7_LAYER5_VALIDATION_READ_SYNC

Requires Phase 7 Layer 5 to statically declare:

```txt
dap_semantic_batch_route_manifest
17 DAP semantic batch artifacts
17 dap_semantic_batch_validation__DAP-SEM-BATCH-xx artifacts
```

### PHASE1_8_DISPATCH_CONTRACT_ARTIFACT_SYNC

Checks:

```txt
Phase 1–8 job chain matches central phase contract
Phase 8 hands off to M11
Phase 1–8 write artifacts are covered by internal job write permissions
required dispatcher functions are present in pipeline.service.js
```

### BLOCKING_IS_EXCEPTION_LIMITATION_POLICY

Confirms the runtime records the rule:

```txt
Blocking is exception.
Non-critical issues pass as LOCKED_WITH_LIMITATIONS.
```

The M9 validator must still throw for structural failures, but must support `LOCKED_WITH_LIMITATIONS` for non-critical limitations.

## Validation Status

GitHub-side implementation only.

Local command has not been run:

```txt
npm run check
```

## Next Required Step

Run locally from:

```txt
diligence-artifact-backend
```

Command:

```txt
npm run check
```

If it fails, treat the failure as authoritative and patch surgically.
