# 00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED
## Agent 2B / M9 Runtime Overlay

This file binds the supplied legal-cartography package to the current backend agentic order.

Locked order:

1. Agent 1A — Scout and Manifest
2. Agent 1B — Extract
3. Agent 2A — Bucket and Routing / M6
4. Agent 2B — Legal Cartography and Index / M9
5. Agent 3 — Target Profile Review + Activity Profile Review

Agent 2B identity: `agent_2b_m9`.

Agent 2B allowed module: `M9_LEGAL_CARTOGRAPHY` only.

Agent 2B must read only the Phase 1 v5 source contract supplied by runtime: `source_discovery_handoff`, source-control manifests, source_family_index, Phase 1 v5 common-root artifacts, legal-doc control artifacts, and `legal_doc_*` artifacts.

Agent 2B must include the Phase 1 v5 regulatory/grievance roots when present:

```text
lossless_root__regulatory_licensing_status
lossless_root__grievance_complaints
```

Old family input contracts and legacy family adapters are forbidden.

Agent 2B must write only the Legal Cartography and Index artifacts: `legal_cartography_deterministic_map`, `legal_cartography_semantic_profile`, optional `legal_cartography_reinvestigation_workpad`, `legal_cartography_index`, and compatibility-only `legal_signal_derivation_profile`.

`legal_signal_derivation_profile` is preserved for downstream compatibility only. It is not the active Target Profile legal-signal locator authority after 2A cutover.

2A owns Target Profile source indexing and target-profile legal signal locators.

2E / M9 owns full legal/governance cartography.

M6 belongs to Agent 2A and is already complete before Agent 2B runs. Do not execute M6 inside this package.

Agent 3 owns Target Profile Review and Activity Profile Review. Do not emit target-profile or target-feature artifacts from Agent 2B.
