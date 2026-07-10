# 03B — M8 Activity Profile Package-Aware Sync

## Purpose

This addendum supersedes any older Activity Profile Review instruction that treats AI archetypes, AI surface tokens, or `AI_REGISTRY_KEY.md` as universal Phase 5 taxonomy.

Phase 5 is now package-aware:

```text
2C = activity_profile_source_index navigation substrate.
M8_FEATURE_CANDIDATE_INVENTORY = deterministic candidate universe from 2C only.
M8_TARGET_FEATURE_PROFILE = material activity profile using feature_candidate_inventory + mounted domain package context.
```

## Runtime Reads

Activity Candidate Inventory and Activity Profile Review must use:

```text
cartography_index
activity_profile_source_index
target_profile
target_profile_forensics
domain_derivation_profile
active_run_package_manifest
domain_selection_profile
feature_candidate_inventory   # material profile only
```

They must not read:

```text
lossless_family__*
lossless_root__product_service
lossless_root__platform_feature_solution
lossless_root__technical_docs_api
lossless_root__docs_api_data_flow
lossless_root__integrations_ecosystem
lossless_root__pricing_commercial_availability
legal_cartography_index
legal_signal_derivation_profile
data_privacy_navigation_index
```

## Candidate Inventory Rule

`feature_candidate_inventory` is created only from `activity_profile_source_index` locator rows.

It must not apply domain package taxonomy. It must not emit archetypes, surfaces, package labels, mechanics proof, activity summaries, source excerpts, or legal/data/exposure conclusions.

## Material Profile Rule

`M8_TARGET_FEATURE_PROFILE` must treat `active_run_package_manifest` and the referenced domain package catalog as the package context. Any activity taxonomy labels, archetype-like labels, surface/context labels, or package-specific field families must be package-controlled.

The model must not assume the AI archetype set is universal. If the active package does not expose a usable taxonomy in v0, the model may still produce the required row fields, but it must identify the label basis as package-context-limited and record a limitation.

## Output Compatibility

The backend material artifact remains:

```text
target_feature_profile
```

The row keys remain the current material-card keys for downstream compatibility:

```text
activity_reference
product_service_wrapper
activity_feature_name
activity_candidate_summary
mechanics_proof
autonomy_human_control_signal
data_content_object_touched
external_internal_action_signal
archetype_codes
archetype_derivation_basis
surface_context_tokens
surface_derivation_basis
```

But `archetype_codes` and `surface_context_tokens` are no longer hardcoded AI enum fields. They are package-controlled labels. Their derivation basis must cite the active package context and the public activity evidence located by 2C / candidate inventory.

## Forbidden

The model must not emit:

```text
feature_candidate_inventory
target_feature_profile_forensics
activity_profile_source_index
source pointers
source URLs
source excerpts
confidence fields
fixed universal AI archetype enum
fixed universal AI surface enum
legal advice
compliance conclusion
risk conclusion
exposure match
data provenance conclusion
```
