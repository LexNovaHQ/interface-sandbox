# Pass 6.7 Receipt — Pipeline Contract Consistency Repair

Branch: `phase1-8-central-runtime-integration`

## Scope

Repair pipeline contract consistency before strict validators.

Governance rule applied:

```txt
Blocking is the exception, not the rule.
Non-critical validation, coverage, or support issues must pass as LOCKED_WITH_LIMITATIONS.
Only structurally unusable artifacts, forbidden active legacy artifacts, missing required upstream artifacts, or schema-breaking outputs may block.
```

## Files Patched

```txt
src/runtime/contracts/pipeline.contract.js
src/phases/02-legal-cartography-index/validators/legal-cartography-index.validator.js
src/phases/01-source-discovery/source-discovery.runner.js
src/phases/07-data-provenance-profile/data-provenance-profile.contract.js
```

## Fix 1 — Phase 7 Layer 4 D-Primary Reads

Removed full L-family reads from `PHASE7_LAYER4_READS`.

Phase 7 Layer 4 now reads:

```txt
source_discovery_handoff
legal_cartography_index
legal_signal_derivation_profile
target_profile
target_profile_forensics
feature_candidate_inventory
target_feature_profile
target_feature_profile_forensics
D1-D5 data provenance lossless families
```

It no longer free-reads all L-family legal governance artifacts.

This preserves the locked architecture:

```txt
D-family = primary evidence universe
legal_cartography_index = selective legal locator
legal_signal_derivation_profile = selected legal signal support
no full legal-family scan inside Phase 7
```

## Fix 2 — Phase 7 Layer 5 Validation Reads Explicit

Added explicit 17 validation artifact reads to `PHASE7_LAYER5_READS`:

```txt
dap_semantic_batch_validation__DAP-SEM-BATCH-01
...
dap_semantic_batch_validation__DAP-SEM-BATCH-17
```

Layer 5 now has a static contract for every artifact it actually reads.

## Fix 3 — M9 Final Validation Blocking/Limitation Split

Updated `validateM9LegalCartographyIndex`:

```txt
structural/schema failures -> throws LEGAL_CARTOGRAPHY_VALIDATION_FAILED
LOCKED_WITH_LIMITATIONS -> returns status LOCKED_WITH_LIMITATIONS
clean index -> returns PASS
```

This fixes the prior bug where `validateLegalCartographyFinalIndex()` could treat a returned `REPAIR_REQUIRED` validation object as `ok: true`.

## Fix 4 — Runtime Metadata Corrected

Updated Source Discovery runner metadata:

```txt
implementation_status: PHASE_OWNED_IMPLEMENTATION_RUNTIME_CUTOVER
production_entrypoint_switched: true
blocking_is_exception_noncritical_limitations_pass: true
```

Updated Phase 7 contract metadata:

```txt
implementation_status: LAYER_5_BATCH_QUALITY_SCHEMA_VALIDATOR_BUILT_RUNTIME_CUTOVER
runtime_entrypoint_switched: true
blocking_is_exception_noncritical_limitations_pass: true
```

## Validation Status

GitHub-side patching only.

Local `npm run check` has not been run.

## Next Step

Pass 7 can now add strict validators for:

```txt
NO_PHASE1_8_ROOT_IMPORTS
NO_M10_4B_4C_ACTIVE_CHAIN
PHASE7_READ_CONTRACT_SYNC
PHASE7_LAYER5_VALIDATION_READ_SYNC
PHASE1_8_DISPATCH_CONTRACT_ARTIFACT_SYNC
BLOCKING_IS_EXCEPTION_LIMITATION_POLICY
```
