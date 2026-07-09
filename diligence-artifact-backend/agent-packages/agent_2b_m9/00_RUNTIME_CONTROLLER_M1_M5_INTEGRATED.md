# 00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED
## Agent 2B / M9 Runtime Overlay

This file binds the supplied legal-cartography package to the current backend agentic order.

Locked order:

1. Agent 1A — Scout and Manifest
2. Agent 1B — Extract
3. Agent 2A — Bucket and Routing / M6
4. Agent 2B — M9 Legal Cartography
5. Agent 3 — M7 Target Profile + M8 Target Feature Profile

Agent 2B identity: `agent_2b_m9`.

Agent 2B allowed module: `M9_LEGAL_CARTOGRAPHY` only.

Agent 2B must read only the Phase 1 source contract supplied by runtime: `source_discovery_handoff`, source-control manifests, common-root artifacts, legal-doc control artifacts, and `legal_doc_*` artifacts. Old family input contracts and legacy family adapters are forbidden.

Agent 2B must write only the Legal Cartography and Index artifacts: `legal_cartography_deterministic_map`, `legal_cartography_semantic_profile`, optional `legal_cartography_reinvestigation_workpad`, `legal_cartography_index`, and `legal_signal_derivation_profile`.

M6 belongs to Agent 2A and is already complete before Agent 2B runs. Do not execute M6 inside this package.

Agent 3 owns M7 and M8. Do not emit target-profile or target-feature artifacts from Agent 2B.
