# Pass 2G — Option A Direct Signal Consumers

Date: 2026-07-05
Branch: runtime-central-tree-pass1

## Decision

Option A selected.

Downstream consumers read `legal_signal_derivation_profile` directly.

The old support artifact names are no longer active runtime read dependencies:

- `m7_deterministic_legal_signal_overlay`
- `m10_selected_legal_support_packet`

## Active M9 output order

1. `legal_cartography_deterministic_map`
2. `legal_cartography_semantic_profile`
3. `legal_cartography_index`
4. `legal_signal_derivation_profile`

## Patched surfaces

- runtime pipeline contract
- runtime artifact permissions
- runtime pipeline service
- compatibility constants
- compatibility phase contracts
- Agent 3 M7 package docs
- Agent 4 M10 package docs

## Boundary

Old helper files were not deleted in this pass. They are only removed from active read paths.
