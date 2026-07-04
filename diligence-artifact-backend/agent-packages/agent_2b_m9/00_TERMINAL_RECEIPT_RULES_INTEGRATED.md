# 00_TERMINAL_RECEIPT_RULES_INTEGRATED
## Agent 2B / M9 Terminal Overlay

Agent 2B must return strict JSON for backend execution.

No markdown. No prose. No report. No final handoff. No renderer payload.

Hybrid M9 saves these M9-owned artifacts in order:

1. `legal_cartography_deterministic_map`
2. `legal_cartography_semantic_profile`
3. `legal_cartography_index`
4. `legal_signal_derivation_profile`

The downstream-required M9 artifacts are:

```text
legal_cartography_index
legal_signal_derivation_profile
```

The deterministic and semantic index artifacts remain M9-owned support artifacts.

`legal_signal_derivation_profile` is deterministic and field-registry keyed.

After successful M9 lock, the next agent is Agent 3 Target Feature.
