# P2D — Data Privacy Navigation Index

## Purpose

P2D creates the dedicated Phase 2 owner for `data_privacy_navigation_index`.

It migrates the Phase 7 Layer 2 DPNI cartography into Phase 2 while preserving the old DPNI route semantics and the Phase 7 Layer 3 route contract.

## It Does

- Builds a deterministic data/privacy route spine.
- Builds a deterministic semantic batch-pointer overlay for the 17 DAP semantic batches.
- Emits `data_privacy_navigation_index` as the final preserved artifact.
- Preserves compatibility route keys required by Phase 7 Layer 3.
- Routes legal support only through `legal_cartography_index` and `legal_signal_derivation_profile`.

## It Does Not Do

- Does not emit `data_provenance_profile`.
- Does not emit `data_provenance_profile_forensics`.
- Does not emit `integrated_dap_report`.
- Does not emit `extended_dap_india_readiness_profile`.
- Does not emit compiler, renderer, or report projection artifacts.
- Does not make legal, compliance, readiness, risk, transfer-legality, lawful-basis, or security-adequacy conclusions.
- Does not copy source text, summaries, excerpts, snippets, or quotes.

## Source Contract

P2D reads the Phase 1 v5 data/privacy roots:

```text
privacy_data_processing
security_trust_compliance
data_governance_controls
technical_docs_api
docs_api_data_flow
integrations_ecosystem
ai_safety_transparency
regulatory_licensing_status
grievance_complaints
```

Retired D-family inputs are forbidden.

## Route Families

The preserved DPNI route families are:

```text
SECURITY_TRUST
PRIVACY_VENDOR_TRANSFER
DATA_GOVERNANCE_CONTROLS
DOCS_API_DATA_FLOW
AI_SAFETY_TRANSPARENCY
```

These route families are now backed by Phase 1 v5 common roots, not by old `lossless_family__D*` artifacts.

## Final Artifact Shape

The final `data_privacy_navigation_index` must contain:

```text
artifact_type
manifest_version
phase_id
downstream_phase_id
layer_id
execution_mode
navigation_policy
deterministic_navigation_spine
semantic_navigation_overlay
validation_quality_control_result
lock_status
```

The `deterministic_navigation_spine` must expose both new names and compatibility aliases:

```text
data_source_routes
d_family_routes
legal_index_routes
l_family_routes
source_custody_ledger
access_gap_ledger
```

## Downstream Rule

Phase 7 uses `data_privacy_navigation_index` to navigate evidence and route DAP semantic batches. Phase 7 does not rebuild DPNI after 2D is wired.
