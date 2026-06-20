# PROFILE_HANDOFF_CONTRACT_v1

Status: LOCKED DESIGN CONTRACT.

## Core rule

Profiles are not summaries. A profile is the wrapper around the full canonical native fields produced by that stage.

Adapters, caches, prompt packets, prefill layers, and debug artifacts may exist, but they are not canonical handoffs.

## Canonical handoffs

| Stage | Canonical handoff |
| --- | --- |
| Stage 4 | `target_profile` |
| Stage 5 | `target_feature_profile` |
| Stage 6A | `legal_cartography` |
| Stage 6B + Stage 5 | `data_provenance_profile` |
| Stage 7 | `exposure_profile` |
| Stage 9 | `stage9_report` |
| Stage 10 | `stage10_vault_handoff` |

## Locked meanings

- `target_profile` is the full Stage 4 target profile wrapper.
- `target_feature_profile` is the full Stage 5 feature profile wrapper.
- `legal_cartography` is the full Stage 6A legal/governance cartography wrapper.
- `data_provenance_profile` is the full Stage 5 plus Stage 6B data profile wrapper.
- `exposure_profile` is the Stage 7 wrapper whose main artifact is the Registry Ledger.
- Stage 9 assembles the report from canonical profiles; it does not create a sixth profile.
- Stage 10 creates Vault/Assembly intake from the same canonical profiles.

## Non-canonical internals

`legal_governance_prefill` is an internal deterministic prefill/debug layer only. It is not a canonical handoff.

`stage6_integrated_handoff` is retired as a canonical handoff. During migration it may exist only as a Stage 7 compatibility adapter source, not as a canonical profile.

## Audit requirement

The full live audit should expose the canonical profile artifacts directly and place compatibility adapters under debug/internal artifacts only while migration is incomplete.
