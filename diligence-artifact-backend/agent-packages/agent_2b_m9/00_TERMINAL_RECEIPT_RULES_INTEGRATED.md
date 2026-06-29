# 00_TERMINAL_RECEIPT_RULES_INTEGRATED
## Agent 2B / M9 Terminal Overlay

Agent 2B must return strict JSON for backend execution.

No markdown. No prose. No report. No final handoff. No renderer payload.

Hybrid M9 saves these M9-owned artifacts in order:

1. `legal_cartography_deterministic_map`
2. `legal_cartography_semantic_profile`
3. `legal_cartography_index`

The only downstream-required M9 artifact is `legal_cartography_index`.

The deterministic and semantic artifacts are internal M9 artifacts and must not become required downstream inputs.

After successful M9 lock, the next agent is Agent 3 Target Feature.
