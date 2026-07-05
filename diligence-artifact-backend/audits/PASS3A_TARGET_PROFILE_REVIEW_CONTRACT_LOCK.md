# Pass 3A — Target Profile Review Contract Lock

Date: 2026-07-05
Branch: runtime-central-tree-pass1

## Scope

This pass is contract-only.

It does not migrate the runner, rewrite prompts, update validators, or execute a phase smoke.

## Phase name

```text
Target Profile Review
```

## Contract source boundary

Primary read authority:

- `source_discovery_handoff`
- `lossless_family__T0_ROOT`
- `lossless_family__T1_IDENTITY`
- `lossless_family__T2_LEGAL_IDENTITY`
- `lossless_family__T3_OPERATOR_ENTITY`
- `lossless_family__T4_SUPPORTING_IDENTITY`

Secondary bounded read authority:

- `legal_signal_derivation_profile`

Forbidden model evidence:

- raw `legal_cartography_index`
- legal-governance lossless families
- old deterministic legal overlay artifact
- product/activity families
- data provenance families

## Direct legal signal rows allowed

Target Profile Review may use only these rows from `legal_signal_derivation_profile`:

- `LGC.NOT.010`
- `LGC.NOT.011`
- `LGC.NOT.012`
- `LGC.NOT.013`
- `TP.JUR.003`
- `TP.JUR.004`
- `TP.JUR.005`
- `TP.JUR.007`
- `TP.JUR.008`

Privacy/grievance contact and consent-manager rows are forbidden for Target Profile Review material derivation.

## Output lock

Target Profile Review writes only:

```text
target_profile
```

Required branches:

- `target_identity`
- `jurisdiction_notice`
- `business_context`
- `product_service_wrapper`
- `target_profile_limitations`

## Files changed

- `src/phases/03-target-profile-review/target-profile-review.contract.js`
- `src/phases/03-target-profile-review/target-profile-review.phase.js`
- `src/phases/03-target-profile-review/index.js`
- `src/phases/phase-registry.js`
- `scripts/check-target-profile-review-contract.mjs`

## Boundary

Later phases remain out of scope.

Next pass should clean the Target Profile Review prompt/package against this contract.
