# 03A — M8 Feature Candidate Inventory Deterministic Contract

## Purpose

`feature_candidate_inventory` is the deterministic navigation index for M8. It is the single source of truth for the public feature candidate universe that the M8 profile compiler must resolve.

It is not a lossless evidence artifact, not a feature summary, not a mechanics proof, and not a classification profile.

## Controlling Override

This file is a controlling M8 prompt override for the inventory architecture.

Where `03_M8_FEATURE_PROFILE_BACKEND_CURRENT.md` still refers to M8-A source extraction, route-family harvesting, source-capsule construction, candidate discovery, or 100% route coverage inside the model prompt, that legacy language is superseded by this file.

Candidate existence, route harvesting, deterministic deduplication, and candidate coverage universe creation belong only to `M8_FEATURE_CANDIDATE_INVENTORY`.

`M8_TARGET_FEATURE_PROFILE` consumes the saved inventory and does not recreate it.

## Boundary Lock

The inventory answers only:

```text
What feature candidate exists, and where should the M8 profile compiler look in the lossless artifacts?
```

It does not answer:

```text
What does the feature do operationally, legally, technically, or as a registry archetype?
```

Lossless evidence remains exclusively in the `lossless_family__P*` artifacts.

## Allowed Source Families

The deterministic inventory phase indexes only:

```text
P1_PRODUCT
P2_PLATFORM_FEATURE_SOLUTION
P3_AI_CAPABILITY_TECHNICAL
P5_ENTERPRISE_PRICING
```

P4 may support later semantic M8 analysis, but it does not create candidate existence by itself unless the deterministic indexer is explicitly extended.

## Candidate Trigger Rules

```text
P1 /products/{slug}       -> PRODUCT_WRAPPER
P2 feature/solution route -> FEATURE_PAGE
P3 /apis/{slug}           -> STANDALONE_API
P3 /models                -> MODEL_CATALOGUE
P3 /integrations          -> INTEGRATION_SURFACE
P5 pricing label          -> PRICING_CONFIRMED_CAPABILITY
P3 /docs                  -> DOCS_TECHNICAL_CAPABILITY
```

## Output Artifact

The deterministic inventory phase writes exactly one artifact:

```json
{
  "feature_candidate_inventory": {
    "artifact_type": "feature_candidate_inventory",
    "inventory_version": "m8_feature_candidate_inventory_index_v1",
    "derivation_mode": "DETERMINISTIC_INDEX_NO_MODEL_NO_EVIDENCE_COMPILATION",
    "source_families_indexed": [],
    "raw_hit_count": 0,
    "canonical_candidate_count": 0,
    "raw_feature_hit_index": [],
    "candidates": [],
    "canonicalization_index": [],
    "dedup_index": [],
    "parent_child_overlap_index": [],
    "dedup_summary": {},
    "index_boundary": {},
    "index_limitations": []
  }
}
```

## Candidate Row Contract

Each canonical candidate must include:

```text
candidate_id
canonical_feature_key
candidate_name
candidate_type
candidate_status
wrapper_or_surface
capability_key
surface_key
mandatory_profile_treatment
merged_raw_hit_ids
source_pointers[]
```

Each `source_pointer` must include:

```text
lossless_artifact_name
source_family
source_id
source_url
route_type
locator_type
locator_value
```

## Forbidden Inventory Content

The inventory must not contain:

```text
lossless_text
clean_text
source text excerpts
mechanics proof
activity summaries
archetype proof
surface proof
legal analysis
privacy analysis
registry exposure analysis
risk scoring
recommendations
```

## M8 Profile Compiler Rule

`M8_TARGET_FEATURE_PROFILE` must consume `feature_candidate_inventory` as the candidate universe. It may use P1-P5 lossless artifacts only to derive mechanics, archetypes, surfaces, grouping, limitations, and profile language.

The model must not create a new candidate outside the saved inventory and must not drop a candidate without a treatment decision.

## M8 Material Profile Candidate Resolution Rule

Every canonical candidate in `feature_candidate_inventory.candidates[]` must be considered by the M8 profile compiler.

Candidates requiring product/activity treatment must become visible activity rows unless the deterministic inventory already merged them as duplicate source evidence or the pointed lossless evidence is too thin to support mechanics.

Standalone API, model, integration, and pricing-confirmed capability candidates must not be silently absorbed into product-wrapper rows. If grouping is necessary under the current 12-field material card, the grouped candidate name must remain visible in `activity_feature_name` or `activity_candidate_summary`.

If the model sees a public feature in a lossless source that is not present in `feature_candidate_inventory`, it must not add that feature as a normal activity. It must record a profile-level limitation requiring repair of `M8_FEATURE_CANDIDATE_INVENTORY`.

## M8 Material Output Boundary

`M8_TARGET_FEATURE_PROFILE` returns only `target_feature_profile`.

It must not return `feature_candidate_inventory`, `target_feature_profile_forensics`, candidate IDs, source pointers, source URLs, source excerpts, confidence fields, route coverage rows, deterministic inventory ledgers, or forensic branches inside `target_feature_profile`.

Each material activity row remains the locked 12-field card governed by `03_M8_FEATURE_PROFILE_BACKEND_CURRENT.md` and `m8-validator.js`.
