# TERMINAL RECEIPT RULES — PHASE 2B DOMAIN DERIVATION SOURCE INDEX

## Strict response mode

Backend execution must return strict JSON only.

No markdown. No prose. No report text. No renderer payload. No same-chat next-phase instruction.

## Save sequence

The backend may save only these roots, in this order:

```text
domain_derivation_deterministic_map
domain_derivation_semantic_profile
domain_derivation_source_index
```

Each save event must have one top-level root only.

## Final receipt

A valid terminal receipt proves:

```text
phase_id = P2B_DOMAIN_DERIVATION_SOURCE_INDEX
final_artifact = domain_derivation_source_index
save_order = domain_derivation_deterministic_map → domain_derivation_semantic_profile → domain_derivation_source_index
downstream_owner = P3_DOMAIN_DERIVATION_LAYER
```

## Forbidden terminal output

Do not emit:

```text
activity_profile_source_index
domain_derivation_profile
active_run_package_manifest
feature_candidate_inventory
target_feature_profile
legal_cartography_index
legal_signal_derivation_profile
data_privacy_navigation_index
final_output_handoff
renderer_payload
qualified_review_handoff
```

## 2C reservation

`activity_profile_source_index` is not a 2B artifact. It is reserved for Phase 2C / Phase 5.

## Stop rule

Stop after `domain_derivation_source_index` is saved and validated.

Do not continue to:

```text
P3_DOMAIN_DERIVATION_LAYER
M8_FEATURE_CANDIDATE_INVENTORY
M8_TARGET_FEATURE_PROFILE
DATA_PROVENANCE_PROFILE_LAYER4
```

3B runs later and derives values from scoped source artifacts, `domain_derivation_source_index`, the Domain Derivation Registry, and package-catalog authority.
