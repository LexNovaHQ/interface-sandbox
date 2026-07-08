# Pass 8.2 Receipt — Phase 1-8 Production Audit Fixes

Branch: `phase1-8-central-runtime-integration`

## Scope

This receipt covers production-audit fixes for the Phase 1-8 runtime boundary only.

In scope:

```txt
Phase 1 Source Discovery
Phase 2 Legal Cartography and Index
Phase 3 Target Profile Review
Phase 4 Target Profile Forensics
Phase 5 Activity Profile Review
Phase 6 Activity Profile Forensics
Phase 7 Data Provenance Profile
Phase 8 Data Provenance Forensics
```

Out of scope:

```txt
M11 / Exposure Profile
M12 / Operator Challenge
Normalized Compiler
Report Renderer
Qualified Review
Assembly Engine
Full npm check
```

## Trigger

A production audit found two issues after the Phase 1-8 runtime cutover:

1. The README incorrectly stated that Phase 8 directly reads each paired DAP batch validation artifact.
2. `agent_4_data_privacy` had broader read permission than the Phase 7 contract boundary because it could read the full legal governance family.

## Fix 1 — Data Provenance Read Permission Hardening

Patched:

```txt
src/runtime/contracts/artifact-permissions.contract.js
```

Change:

```txt
READ_PERMISSIONS[agent_4_data_privacy]
```

now retains selected legal support:

```txt
legal_cartography_index
legal_signal_derivation_profile
```

and D-family read permissions:

```txt
lossless_family__D1_SECURITY_TRUST
lossless_family__D2_SUBPROCESSOR_PRIVACY_CENTER
lossless_family__D3_DATA_GOVERNANCE_CONTROLS
lossless_family__D4_DOCS_API_DATA_FLOW
lossless_family__D5_AI_SAFETY_TRANSPARENCY
```

but no longer includes the full legal governance family:

```txt
lossless_family__L1_CORE_TERMS_PRIVACY
lossless_family__L2_B2B_CONTRACTING
lossless_family__L3_AI_USAGE_GOVERNANCE
lossless_family__L4_PRIVACY_ADJACENT_NOTICES
lossless_family__L5_LEGAL_HUB_HOSTED
lossless_family__L6_ENTITY_NOTICE
```

## Fix 2 — Validator Regression Gate

Patched:

```txt
scripts/check-phase1-8-central-runtime.mjs
```

Added enforced gate:

```txt
PHASE7_DATA_PROVENANCE_PERMISSION_BOUNDARY
```

The validator now asserts:

- `agent_4_data_privacy` must not have full legal-family read permission.
- `agent_4_data_privacy` must keep D-family read permission.
- `agent_4_data_privacy` must keep `legal_cartography_index` locator permission.
- `agent_4_data_privacy` must keep `legal_signal_derivation_profile` support permission.

## Fix 3 — README Correction

Patched:

```txt
diligence-artifact-backend/README.md
```

The README now states that Phase 8 reads:

```txt
data_privacy_navigation_index
dap_semantic_batch_route_manifest
17 DAP semantic batch artifacts
dap_semantic_batch_validation_manifest
data_provenance_profile_semantic_batch_gate
```

It also states that Phase 8 does not directly read each paired DAP batch validation artifact. Paired validation artifacts are enforced upstream by `artifacts.service.js` before Layer 5 and before Phase 8 can lock.

## Validation Required Locally

After pulling these commits locally, run only the Phase 1-8 validation commands:

```powershell
npm run check:phase1-8-runtime
$LASTEXITCODE
npm run check:syntax
$LASTEXITCODE
```

Do not run `npm run check:normalized` or full `npm run check` as Phase 1-8 acceptance gates.
