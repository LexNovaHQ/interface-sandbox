# 03A — M8 Feature Candidate Inventory Deterministic Contract

## Purpose

`feature_candidate_inventory` is the deterministic navigation index for M8. It is the single source of truth for the public activity candidate universe that the M8 material profile must resolve.

It is not a lossless evidence artifact, activity summary, mechanics proof, or package-specific classification profile.

## Controlling override

This file supersedes all older M8 source-family harvesting language.

Candidate existence, route harvesting, deterministic deduplication, and candidate-universe creation belong only to `M8_FEATURE_CANDIDATE_INVENTORY`. `M8_TARGET_FEATURE_PROFILE` consumes the saved inventory and does not recreate it.

## Phase 2G authority

`M8_FEATURE_CANDIDATE_INVENTORY` runs under:

```text
ROUTE.PHASE5.ACTIVITY_PROFILE
2C_BUCKET_ACTIVITY_PROFILE
```

Phase 2G supplies the authorized 2C packet. Lossless evidence in that packet is primary evidence and `activity_profile_source_index` is the mandatory navigation map.

The inventory job receives the routed activity bucket so the backend packet remains uniform and auditable, but candidate creation must use only `activity_profile_source_index` locator rows. It must not independently scan, reinterpret, or copy the routed lossless evidence.

It must not request or read outside the Phase 2G packet, and it must not consume `target_profile_forensics`, `target_feature_profile_forensics`, or any downstream forensic profile.

## Source authority

The deterministic inventory phase indexes candidate routes from `activity_profile_source_index` only.

It must not:

- use `lossless_family__*` artifacts;
- create candidates by independently searching `lossless_root__*` artifacts;
- browse, crawl, fetch, or add sources;
- use `cartography_index`, legal indexes, data/privacy indexes, or downstream artifacts as candidate authority.

Phase 1 source artifacts remain source-of-truth evidence. They are delivered through the 2G bucket and reached through 2C navigation pointers; they are not a second harvesting surface for this deterministic inventory job.

## Boundary lock

The inventory answers only:

```text
What candidate activity/capability route exists, and which 2C locator points the material profile toward it?
```

It does not answer:

```text
What does the activity mean under the selected domain package?
Which archetype/surface/package label applies?
What is the mechanics proof?
```

Those are material-profile questions for `M8_TARGET_FEATURE_PROFILE`, controlled by `active_run_package_manifest`, the mounted domain package context, and the primary activity evidence navigated through 2C.

## Allowed locator maps

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

## Output artifact

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

## Candidate row contract

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

## Forbidden inventory content

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

## M8 profile compiler rule

`M8_TARGET_FEATURE_PROFILE` receives `feature_candidate_inventory` as a job-scoped derived artifact declared by 2G. It uses the inventory as the candidate universe and `activity_profile_source_index` to navigate the same 2C primary evidence bucket.

The model must not create a new candidate outside the saved inventory and must not drop a candidate without a treatment decision.

## M8 material output boundary

`M8_TARGET_FEATURE_PROFILE` returns only `target_feature_profile`.

It must not return `feature_candidate_inventory`, `target_feature_profile_forensics`, candidate IDs, source pointers, source URLs, source excerpts, confidence fields, route coverage rows, deterministic inventory ledgers, or forensic branches inside `target_feature_profile`.
