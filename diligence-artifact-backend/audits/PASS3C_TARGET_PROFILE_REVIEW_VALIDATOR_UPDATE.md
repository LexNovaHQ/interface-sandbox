# Pass 3C — Target Profile Review Validator Update

Date: 2026-07-05
Branch: runtime-central-tree-pass1

## Scope

This pass updated active Target Profile Review validator behavior.

It did not migrate the runner and did not execute a model smoke.

## Validator lock

The active validator now supports the phase name:

- `TARGET_PROFILE_REVIEW`

and retains compatibility with:

- `M7_TARGET_PROFILE`

## Material output validation

Target Profile Review material output must contain exactly one top-level artifact:

```text
target_profile
```

`target_profile` must contain exactly:

- `target_identity`
- `jurisdiction_notice`
- `business_context`
- `product_service_wrapper`
- `target_profile_limitations`

## Boundary enforcement

The validator rejects output leakage of:

- `legal_cartography_index`
- `legal_signal_derivation_profile`
- `m7_deterministic_legal_signal_overlay`
- source ledgers / derivation ledgers / runtime traces
- Activity Profile Review artifacts
- Data Provenance Profile artifacts
- Exposure Profile artifacts
- Compiler / renderer / Qualified Review artifacts
- legal advice, compliance conclusions, enforceability conclusions, or risk conclusions

## Direct signal enforcement

The validator permits only the Target Profile Review-owned direct signal field IDs:

- `LGC.NOT.010`
- `LGC.NOT.011`
- `LGC.NOT.012`
- `LGC.NOT.013`
- `TP.JUR.003`
- `TP.JUR.004`
- `TP.JUR.005`
- `TP.JUR.007`
- `TP.JUR.008`

It rejects Data Provenance Profile signal families:

- `privacy_grievance_contact_signal_map`
- `consent_manager_signal_map`

## Validation added

- `scripts/check-target-profile-review-validator.mjs`

Updated aggregate:

- `scripts/check-phase3-target-profile-review.mjs`

## Boundary

Target Profile Forensics remains compatibility-supported but is not migrated in this pass.
