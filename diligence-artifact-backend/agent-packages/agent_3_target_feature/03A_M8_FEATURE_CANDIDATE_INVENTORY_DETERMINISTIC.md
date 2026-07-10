# 03A — M8 Feature Candidate Inventory Deterministic Contract

## Purpose

`feature_candidate_inventory` is the deterministic navigation index for M8. It is the single source of truth for the public activity candidate universe that the M8 material profile must resolve.

It is not a lossless evidence artifact, not an activity summary, not mechanics proof, and not a package-specific classification profile.

## Controlling Override

This file supersedes all older M8 source-family harvesting language.

Candidate existence, route harvesting, deterministic deduplication, and candidate universe creation belong only to `M8_FEATURE_CANDIDATE_INVENTORY`.

`M8_TARGET_FEATURE_PROFILE` consumes the saved inventory and does not recreate it.

## Source Authority

The deterministic inventory phase reads `activity_profile_source_index` only as its activity evidence-navigation authority.

It must not read or harvest directly from:

```text
lossless_family__*
lossless_root__product_service
lossless_root__platform_feature_solution
lossless_root__technical_docs_api
lossless_root__docs_api_data_flow
lossless_root__integrations_ecosystem
lossless_root__pricing_commercial_availability
```

Phase 1 source artifacts remain source-of-truth evidence, but Phase 5 reaches them only through 2C navigation pointers.

## Boundary Lock

The inventory answers only:

```text
What candidate activity/capability route exists, and which 2C locator points Phase 5 toward it?
```

It does not answer:

```text
What does the activity mean under the selected domain package?
Which archetype/surface/package label applies?
What is the mechanics proof?
```

Those are material-profile questions for `M8_TARGET_FEATURE_PROFILE`, controlled by `active_run_package_manifest` and the mounted domain package context.

## Allowed Locator Maps

The deterministic inventory phase indexes candidate-creation rows from:

```text
activity_candidate_source_locator_map
product_capability_locator_map
feature_mechanics_locator_map
technical_mechanics_locator_map
api_interaction_locator_map
data_object_interaction_locator_map
integration_action_locator_map
commercial_availability_locator_map
external_action_context_locator_map
input_output_object_context_locator_map
```

Context-only maps may support later material interpretation but must not create standalone candidates:

```text
customer_use_context_locator_map
support_operational_context_locator_map
automation_transparency_context_locator_map
human_control_context_locator_map
```

## Output Artifact

The deterministic inventory phase writes exactly one artifact:

```json
{
  "feature_candidate_inventory": {
    "artifact_type": "feature_candidate_inventory",
    "inventory_version": "m8_feature_candidate_inventory_index_v2_phase2c",
    "derivation_mode": "DETERMINISTIC_INDEX_FROM_ACTIVITY_PROFILE_SOURCE_INDEX_NO_MODEL_NO_EVIDENCE_COMPILATION",
    "source_index_artifact": "activity_profile_source_index",
    "source_locator_maps_indexed": [],
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
activity_route_class
capability_key
source_root
mandatory_profile_treatment
merged_raw_hit_ids
source_pointers[]
```

Each `source_pointer` must include:

```text
source_artifact
source_id
source_root
route_class
route_code
locator_id
unit_id
source_pointer
unit_pointer
```

## Forbidden Inventory Content

The inventory must not contain:

```text
lossless_text
clean_text
source text excerpts
mechanics proof
activity summaries
archetype codes
surface context tokens
package activity classifications
selected package findings
legal analysis
privacy analysis
registry exposure analysis
risk scoring
recommendations
```

## M8 Profile Compiler Rule

`M8_TARGET_FEATURE_PROFILE` must consume `feature_candidate_inventory` as the candidate universe. It uses `activity_profile_source_index` as navigation and `active_run_package_manifest` / domain package context to interpret the material profile.

The model must not create a new candidate outside the saved inventory and must not drop a candidate without a treatment decision.

## M8 Material Output Boundary

`M8_TARGET_FEATURE_PROFILE` returns only `target_feature_profile`.

It must not return `feature_candidate_inventory`, `target_feature_profile_forensics`, candidate IDs, source pointers, source URLs, source excerpts, confidence fields, route coverage rows, deterministic inventory ledgers, or forensic branches inside `target_feature_profile`.

The material activity row remains the current compatibility card, but archetype/surface labels are package-controlled, not fixed AI enums.
