# Pass 2I — Compiler and Qualified Review Signal Consumer Audit

Date: 2026-07-05
Branch: runtime-central-tree-pass1

## Scope

This pass audited and patched downstream consumers after direct `legal_signal_derivation_profile` adoption.

Covered surfaces:

- Compiler
- Legal Document & Governance Map normalized section
- Normalizer validator
- Qualified Review matrix compiler

## Decision

The retired question-shaped legal signal object is not an active compiler or Qualified Review source.

Compiler may summarize `legal_signal_derivation_profile` in Section 6.

Qualified Review must continue to consume normalized section selectors, not raw backend artifacts or retired question-shaped Legal Cartography objects.

## Changes

- Section 6 now renders `Legal Signal Derivation Summary` from `legal_signal_derivation_profile`.
- Section 6 no longer renders `qualified_review_legal_signals` from `legal_cartography_index`.
- Compiler trace now uses phase-language flags for Legal Cartography and Legal Signal Derivation.
- Normalizer validator now requires `Legal Signal Derivation Summary` and fails if retired legal-signal object appears in Section 6.
- Qualified Review matrix check now fails if a selector or source dependency references the retired object.

## Boundary

Artifact names remain stable:

- `legal_cartography_index`
- `legal_signal_derivation_profile`

Qualified Review question IDs remain UI/matrix IDs only. They are not derivation authority.
