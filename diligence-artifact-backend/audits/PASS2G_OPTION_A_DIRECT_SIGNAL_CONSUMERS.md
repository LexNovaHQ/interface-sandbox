# Pass 2G — Option A Direct Signal Consumers

Date: 2026-07-05
Branch: runtime-central-tree-pass1

## Decision

Option A selected.

Downstream phase consumers read `legal_signal_derivation_profile` directly.

These artifact names are no longer active runtime read dependencies:

- `m7_deterministic_legal_signal_overlay`
- `m10_selected_legal_support_packet`

## Active Legal Cartography and Index output order

1. `legal_cartography_deterministic_map`
2. `legal_cartography_semantic_profile`
3. `legal_cartography_index`
4. `legal_signal_derivation_profile`

## Phase consumers

- Target Profile Review reads direct legal signal rows for owned legal notice and jurisdiction fields.
- Data Provenance Profile reads direct legal signal rows for DAP.CONTACT and DAP.CM support.
- Compiler and Qualified Review consume the normalized downstream outputs, with `legal_signal_derivation_profile` available as the index-backed signal authority.

## Patched surfaces

- runtime pipeline contract
- runtime artifact permissions
- runtime pipeline service
- compatibility constants
- compatibility phase contracts
- Target Profile Review package docs
- Data Provenance Profile package docs

## Boundary

Helper files were not deleted in this pass. They are only removed from active read paths.

## Naming rule

Product-facing docs, audit receipts, status flags, and human-facing summaries must use phase names. Compatibility job IDs may remain only where the runtime requires exact internal pipeline keys.
