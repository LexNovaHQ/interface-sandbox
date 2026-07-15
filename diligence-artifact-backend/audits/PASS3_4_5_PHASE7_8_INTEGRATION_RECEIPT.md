# Pass 3/4/5 Receipt — Phase 7 and Phase 8 Runtime Integration

Branch: `phase1-8-central-runtime-integration`
Scope: Import Phase 7/8 product files, replace active old DAP chain in central contracts, wire runtime dispatcher.

## Pass 3 — Product Files Imported

Imported/confirmed Phase 7 product files under:

```txt
src/phases/07-data-provenance-profile/
```

Required files now present:

```txt
dap-registry-derivation-rule-compiler.js
dap-strategic-derivation-matrix.js
layer2-data-privacy-navigation-index-builder.js
layer3-semantic-batch-route-manifest-builder.js
layer4-semantic-batch-artifact-validator.js
layer5-semantic-batch-quality-gate-builder.js
data-provenance-profile.runner.js
```

Imported Phase 8 product files under:

```txt
src/phases/08-data-provenance-forensics/
```

Required files now present:

```txt
dap-forensics.contract.js
dap-forensics.runner.js
```

## Pass 4 — Central Contracts Replaced

Patched:

```txt
src/runtime/contracts/central-phase.contract.js
src/runtime/contracts/pipeline.contract.js
src/runtime/contracts/artifact-permissions.contract.js
src/runtime/contracts/artifacts.contract.js
```

The active DAP chain is now:

```txt
M8_TARGET_FEATURE_PROFILE_FORENSICS
→ DATA_PROVENANCE_PROFILE_LAYER4
→ DATA_PROVENANCE_PROFILE_LAYER5
→ DATA_PROVENANCE_PROFILE_FORENSICS
→ M11
```

The old active DAP chain is removed from the active pipeline contract:

```txt
M10
M10_FORENSICS
AGENT_4B_EXTENDED_DAP_INDIA_READINESS
AGENT_4C_INTEGRATED_DAP_REPORT
```

Old DAP artifact names are retained only as archived legacy artifact names:

```txt
data_provenance_profile
data_provenance_profile_forensics
extended_dap_india_readiness_profile
integrated_dap_report
m10_selected_legal_support_packet
```

## Phase 7 Contract Shape

Phase 7 now has two jobs:

```txt
DATA_PROVENANCE_PROFILE_LAYER4
DATA_PROVENANCE_PROFILE_LAYER5
```

Layer 4 writes:

```txt
dap_registry_manifest
dap_strategic_derivation_matrix
data_privacy_navigation_index
dap_semantic_batch_route_manifest
17 dap_semantic_batch_*_artifact files
dap_semantic_batch_validation__{BATCH_ID} dynamic validations
```

Layer 5 writes:

```txt
dap_semantic_batch_validation_manifest
data_provenance_profile_semantic_batch_gate
```

## Phase 8 Contract Shape

Phase 8 now has one job:

```txt
DATA_PROVENANCE_PROFILE_FORENSICS
```

It reads:

```txt
data_privacy_navigation_index
dap_semantic_batch_route_manifest
17 dap_semantic_batch_*_artifact files
dap_semantic_batch_validation_manifest
data_provenance_profile_semantic_batch_gate
```

It writes:

```txt
dap_forensics_profile
```

## Pass 5 — Runtime Dispatcher Wired

Patched:

```txt
src/runtime/services/pipeline.service.js
```

Dispatcher now imports:

```txt
src/phases/07-data-provenance-profile/data-provenance-profile.runner.js
src/phases/08-data-provenance-forensics/dap-forensics.runner.js
```

Dispatcher now executes:

```txt
DATA_PROVENANCE_PROFILE_LAYER4 / DATA_PROVENANCE_PROFILE_LAYER5
→ runDataProvenanceProfileRuntimeJob(...)

DATA_PROVENANCE_PROFILE_FORENSICS
→ runDapForensicsRuntimeJob(...)
```

Old active DAP dispatcher imports and branches were removed:

```txt
agent4b-phase-runner.js
agent4c-runner.js
M10 / M10_FORENSICS generic data-forensics dispatch
```

## What Was Not Done

This pass did not archive old root files.

This pass did not patch artifact save-order gates in `src/runtime/services/artifacts.service.js`.

This pass did not run local `npm run check` because this was performed through the GitHub connector.

## Required Next Pass

Next pass:

```txt
Pass 6 — Patch artifact gates / save order for Phase 7 and Phase 8.
```

Pass 6 must make artifact gating expect:

```txt
target_feature_profile_forensics
→ dap_semantic_batch_route_manifest
→ 17 DAP batch artifacts + validations
→ dap_semantic_batch_validation_manifest
→ data_provenance_profile_semantic_batch_gate
→ dap_forensics_profile
→ exposure_registry_route_plan
```

No archiving should happen until Pass 6 and validation are completed.
