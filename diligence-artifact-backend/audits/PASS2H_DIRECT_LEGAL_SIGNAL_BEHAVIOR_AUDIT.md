# Pass 2H — Direct Legal Signal Behavior Audit

Date: 2026-07-05
Branch: runtime-central-tree-pass1

## Scope

This pass audited and patched prompt-output behavior for:

- Target Profile Review
- Data Provenance Profile

## Decision

Both phase consumers use `legal_signal_derivation_profile` directly.

No compatibility overlay or selected-support packet may be used as active prompt behavior.

## Target Profile Review behavior lock

Target Profile Review may use direct signal rows only for its owned legal notice and jurisdiction fields.

Direct signal rows may affect only:

- `target_identity`
- `jurisdiction_notice`
- `target_profile_limitations`

Target Profile Review must not read raw legal-governance source families or raw `legal_cartography_index` as model evidence.

## Data Provenance Profile behavior lock

Data Provenance Profile may use direct signal rows only for privacy/grievance contact and consent-manager readiness support.

Direct signal values may appear only inside the already-authorized nested homes:

- `data_provenance_profile.privacy_governance_contact_accountability_signals[].contact_routes`
- `data_provenance_profile.consent_withdrawal_controls[].consent_manager_readiness`
- `data_provenance_profile.law_regulatory_readiness_matrix[] where readiness_area = consent_manager_readiness`

They must not create new top-level fields.

## Status translation

Both phase consumers must translate direct signal row status conservatively. They must not invent values, choose winners in conflicts, or convert readiness signals into legal conclusions.

## Validation

Added:

- `scripts/check-direct-legal-signal-behavior.mjs`

Included it in:

- `scripts/check-normalized-hardening.mjs`

So `npm run check` now covers this behavior lock.
