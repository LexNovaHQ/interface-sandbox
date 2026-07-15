# Phase 2D Runtime Controller — Data Privacy Navigation Index

## Runtime Identity

- Internal job id: `P2D_DATA_PRIVACY_NAVIGATION_INDEX`
- Public label: `Data Privacy Navigation Index`
- Final artifact: `data_privacy_navigation_index`
- Runtime owner: `agent_2_cartography_index`
- Downstream consumer: `DATA_PROVENANCE_PROFILE_LAYER4`

## Execution Order

Phase 2D runs after `P2C_ACTIVITY_PROFILE_SOURCE_INDEX` and before `P2_INDEX_COMPILER_VALIDATION`.

Locked chain:

```text
P2A_TARGET_PROFILE_SOURCE_INDEX
→ P2B_DOMAIN_DERIVATION_SOURCE_INDEX
→ P2C_ACTIVITY_PROFILE_SOURCE_INDEX
→ P2D_DATA_PRIVACY_NAVIGATION_INDEX
→ P2_INDEX_COMPILER_VALIDATION
```

## Runtime Writes

The job must save exactly these artifacts in this order:

```text
data_privacy_deterministic_map
→ data_privacy_semantic_profile
→ data_privacy_navigation_index
```

`P2_INDEX_COMPILER_VALIDATION` may read `data_privacy_navigation_index`, but must not write it.

## Runtime Reads

Phase 2D reads Phase 1 v5 data/privacy roots and legal index artifacts only. It must not read retired D-family artifacts.

Allowed source roots:

```text
lossless_root__privacy_data_processing
lossless_root__security_trust_compliance
lossless_root__data_governance_controls
lossless_root__technical_docs_api
lossless_root__docs_api_data_flow
lossless_root__integrations_ecosystem
lossless_root__ai_safety_transparency
lossless_root__regulatory_licensing_status
lossless_root__grievance_complaints
```

Allowed legal indexes:

```text
legal_cartography_index
legal_signal_derivation_profile
```

## Boundary

2D is a navigation index only. It does not derive a DAP profile, readiness profile, report projection, legal conclusion, compliance conclusion, exposure conclusion, or forensic profile.

## Phase 7 Compatibility

The final `data_privacy_navigation_index` must preserve Layer 3 compatibility keys:

```text
required_d_family_route_ids
selective_l_family_route_ids
```

These are compatibility aliases only. They must point to the new Phase 1 v5 data/privacy routes, not retired `lossless_family__D*` artifacts.
