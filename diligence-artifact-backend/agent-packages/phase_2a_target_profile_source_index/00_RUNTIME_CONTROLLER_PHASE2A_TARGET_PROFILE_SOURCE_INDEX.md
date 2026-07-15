# 00_RUNTIME_CONTROLLER_PHASE2A_TARGET_PROFILE_SOURCE_INDEX

## Phase 2A Runtime Controller

This file binds the Phase 2A Target Profile Source Index package to the current backend package doctrine.

Phase 2A identity: `P2A_TARGET_PROFILE_SOURCE_INDEX`.

Phase 2A module: `P2A_TARGET_PROFILE_SOURCE_INDEX.md`.

Phase 2A reference map: `P2A_TARGET_PROFILE_SOURCE_INDEX_REFERENCE_MAP.yaml`.

## Execution Scope

Phase 2A executes only Target Profile Source Index work.

Phase 2A must not execute Source Discovery, Phase 2E / M9, Target Profile Review, domain derivation, activity derivation, data provenance, exposure analysis, operator challenge, compiler, renderer, Qualified Review, or Assembly Engine work.

Phase 2A is a source-location and navigation package. It does not produce the material `target_profile` artifact.

## Ownership Boundary

Phase 2A owns:

```text
target_profile_deterministic_map
target_profile_semantic_profile
target_profile_source_index
```

Phase 2A does not own:

```text
target_profile
legal_cartography_index
legal_signal_derivation_profile
data_privacy_navigation_index
domain_derivation_profile
feature_candidate_inventory
target_feature_profile
```

## Source Boundary

Phase 2A may read only the artifacts declared in `P2A_TARGET_PROFILE_SOURCE_INDEX_RUNTIME_BINDING_PACKET.yaml` and the backend contract.

The allowed target roots are:

```text
lossless_root__homepage_landing
lossless_root__company_identity
lossless_root__contact_notice
lossless_root__pricing_commercial_availability
lossless_root__regulatory_licensing_status
lossless_root__grievance_complaints
```

Legal document artifacts may be used only for bounded target-profile legal signal locator mapping. They must not be converted into full legal cartography.

## Locator-Only Rule

Phase 2A locates. Phase 3A derives.

For every material field row, Phase 2A must emit candidate source pointers only. It must not emit the field value, a summary, an excerpt, an interpretation, or a legal/regulatory/compliance conclusion.

## Field-by-Field Execution Rule

For each material field in `P2A_TARGET_PROFILE_SOURCE_INDEX_REFERENCE_MAP.yaml`:

1. read the field id and field key;
2. read the external derivation authority reference;
3. read the allowed source scopes;
4. map candidate locator rows from allowed source scopes only;
5. attach locator family labels only from the backend contract vocabulary;
6. preserve source pointers and limitation status;
7. leave value derivation to Target Profile Review.

Do not invent a material field not present in the backend contract or reference map.

## Semantic Controller Rule

The semantic layer labels deterministic `semantic_label_queue` rows only.

It must emit only:

```text
queue_id
unit_id
target_subcats
target_signal_families
confidence
```

It must not emit notes, explanations, summaries, quotes, URLs, evidence text, downstream recommendations, field values, or new identifiers.

## Terminal Rule

Phase 2A stops after `target_profile_source_index`.

Any pipeline advancement, runtime binding, job-chain update, or deployment action is outside this package.
