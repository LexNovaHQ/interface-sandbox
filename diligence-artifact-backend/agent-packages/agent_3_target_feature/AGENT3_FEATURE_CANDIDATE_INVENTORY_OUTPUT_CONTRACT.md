# AGENT3_FEATURE_CANDIDATE_INVENTORY_OUTPUT_CONTRACT

This contract governs the final backend artifact produced by `M8_FEATURE_CANDIDATE_INVENTORY` and the separate semantic-support model response used to refine it.

## 1. Authority split

The backend owns the saved `feature_candidate_inventory`.

The semantic-support model may return only:

```json
{
  "semantic_candidate_support_proposals": []
}
```

The model must not return or save `feature_candidate_inventory`, candidate IDs, canonical keys, deterministic ledgers, or a semantic-support receipt.

## 2. Final saved artifact

The backend saves exactly one artifact:

```json
{
  "feature_candidate_inventory": {
    "artifact_type": "feature_candidate_inventory",
    "inventory_version": "m8_feature_candidate_inventory_index_v4_deterministic_led_semantic_supported",
    "run_id": null,
    "derivation_mode": "DETERMINISTIC_LED_SEMANTIC_SUPPORTED_FROM_INDEX_MAPPED_LOSSLESS_UNITS_NO_TEXT_COPY",
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
    "context_pointer_index": [],
    "deterministic_baseline_metadata": {},
    "index_boundary": {},
    "index_limitations": [],
    "semantic_support_receipt": {}
  }
}
```

## 3. Candidate row contract

Every final candidate contains exactly:

```text
candidate_id
canonical_feature_key
candidate_name
candidate_type
candidate_status
activity_route_class
capability_key
source_root
evidence_grounded
mandatory_profile_treatment
merged_raw_hit_ids
source_pointers
```

`evidence_grounded` must be `true`.

Every source pointer contains exactly:

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

## 4. Semantic-support receipt

The receipt contains exactly:

```text
attempted
status
deterministic_baseline_count
proposal_count
accepted_count
rejected_count
accepted_proposal_ids
rejected_proposals
final_candidate_count
limitations
```

Allowed status values:

```text
APPLIED
NO_CHANGES
UNAVAILABLE
OUTPUT_REJECTED
```

## 5. Derivation order

1. Open only Phase-2G-routed activity lossless evidence.
2. Use `activity_profile_source_index` as mandatory navigation.
3. Build the deterministic evidence-grounded baseline.
4. Attempt semantic support.
5. Deterministically validate and reconcile accepted proposals.
6. Generate final IDs and canonical keys deterministically.
7. Save the inventory with its receipt.

## 6. Non-blocking semantic failure

Provider unavailability or wholly rejected semantic output must retain the deterministic baseline and save the artifact as `LOCKED_WITH_LIMITATIONS`.

Partial proposal rejection does not automatically degrade the lock when the remaining proposal packet is usable and the deterministic baseline has no material limitation.

## 7. Forbidden inventory content

The final inventory must not contain copied evidence text, source excerpts, mechanics proof, activity summaries, package taxonomy, archetype or surface classifications, legal analysis, privacy analysis, exposure analysis, risk scoring, recommendations, free URLs, or confidence fields.

`feature_candidate_inventory` must be saved before `target_feature_profile` begins. The material profile must not re-emit the inventory.
