# AGENT3_FEATURE_CANDIDATE_INVENTORY_OUTPUT_CONTRACT

This contract governs the deterministic `M8_FEATURE_CANDIDATE_INVENTORY` phase.

## Backend Response Shape

The deterministic phase must save exactly one artifact:

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

## Artifact Separation

`feature_candidate_inventory` must be saved before `target_feature_profile` begins.

`target_feature_profile` must not re-emit `feature_candidate_inventory`.

`target_feature_profile_forensics` must reference the saved inventory through `feature_candidate_inventory_ref` and may ledger deterministic steps, but it must not become a second candidate inventory.

## Index-Only Rule

The saved inventory is a map to source locations. It must not copy or summarize the underlying source text.
